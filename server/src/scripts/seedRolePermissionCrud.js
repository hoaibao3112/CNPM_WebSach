import pool from '../config/connectDatabase.js';

const ROLE_FUNCTION_NAME = 'Phân quyền';
const REQUIRED_ACTIONS = ['Xem', 'Thêm', 'Sửa', 'Xóa'];

const parseRoleIds = (raw) => {
  if (!raw) return [];
  return String(raw)
    .split(',')
    .map((item) => Number.parseInt(item.trim(), 10))
    .filter((id) => Number.isInteger(id) && id > 0);
};

const parseTargetRoleIds = () => {
  const envRoleIds = parseRoleIds(process.env.SEED_ROLE_IDS);
  if (envRoleIds.length > 0) {
    return envRoleIds;
  }

  const npmConfigRoleIds = parseRoleIds(process.env.npm_config_seed_role_ids);
  if (npmConfigRoleIds.length > 0) {
    return npmConfigRoleIds;
  }

  const rolesArg = process.argv.find((arg) => arg.startsWith('--roles='));
  if (rolesArg) {
    return parseRoleIds(rolesArg.split('=')[1]);
  }

  return [];
};

const isAdminLikeRole = (roleName) => {
  const normalized = String(roleName || '').toLowerCase();
  return /admin|quản trị|quan tri|manager|super/.test(normalized);
};

async function ensureRoleFunction(connection) {
  const [[existing]] = await connection.query(
    'SELECT MaCN, TenCN FROM chucnang WHERE TenCN = ? LIMIT 1',
    [ROLE_FUNCTION_NAME],
  );

  if (existing) {
    return existing.MaCN;
  }

  const [insertResult] = await connection.query(
    'INSERT INTO chucnang (TenCN, TinhTrang) VALUES (?, 1)',
    [ROLE_FUNCTION_NAME],
  );

  return insertResult.insertId;
}

async function getTargetRoles(connection) {
  const envRoleIds = parseTargetRoleIds();

  if (envRoleIds.length > 0) {
    const placeholders = envRoleIds.map(() => '?').join(',');
    const [rows] = await connection.query(
      `SELECT MaNQ, TenNQ FROM nhomquyen WHERE CAST(TinhTrang AS UNSIGNED) = 1 AND MaNQ IN (${placeholders})`,
      envRoleIds,
    );
    return rows;
  }

  const [activeRoles] = await connection.query(
    'SELECT MaNQ, TenNQ FROM nhomquyen WHERE CAST(TinhTrang AS UNSIGNED) = 1',
  );

  const adminLikeRoles = activeRoles.filter((role) => isAdminLikeRole(role.TenNQ));
  if (adminLikeRoles.length > 0) {
    return adminLikeRoles;
  }

  // Fallback: choose role ID 1 if active; otherwise first active role.
  const role1 = activeRoles.find((role) => Number(role.MaNQ) === 1);
  if (role1) {
    return [role1];
  }

  return activeRoles.length > 0 ? [activeRoles[0]] : [];
}

async function ensureRoleCrudPermissions(connection, roleId, functionId) {
  let inserted = 0;

  for (const action of REQUIRED_ACTIONS) {
    const [[existing]] = await connection.query(
      'SELECT MaCTQ FROM chitietquyen WHERE MaQuyen = ? AND MaCN = ? AND HanhDong = ? LIMIT 1',
      [roleId, functionId, action],
    );

    if (!existing) {
      await connection.query(
        'INSERT INTO chitietquyen (MaQuyen, MaCN, HanhDong, TinhTrang) VALUES (?, ?, ?, 1)',
        [roleId, functionId, action],
      );
      inserted += 1;
    }
  }

  return inserted;
}

async function main() {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const functionId = await ensureRoleFunction(connection);
    const targetRoles = await getTargetRoles(connection);

    if (targetRoles.length === 0) {
      throw new Error('Không tìm thấy nhóm quyền đang hoạt động để seed ROLE CRUD permissions');
    }

    let totalInserted = 0;

    for (const role of targetRoles) {
      const inserted = await ensureRoleCrudPermissions(connection, role.MaNQ, functionId);
      totalInserted += inserted;
      console.log(`[seed-role-permissions] Role ${role.MaNQ} (${role.TenNQ}): inserted ${inserted}`);
    }

    await connection.commit();
    console.log(`[seed-role-permissions] Completed. Total inserted: ${totalInserted}`);
  } catch (error) {
    await connection.rollback();
    console.error('[seed-role-permissions] Failed:', error.message);
    process.exitCode = 1;
  } finally {
    connection.release();
    await pool.end();
  }
}

main();
