import pool from '../config/connectDatabase.js';

class RoleService {
    async getAllFunctions() {
        const [functions] = await pool.query('SELECT MaCN, TenCN FROM chucnang WHERE CAST(TinhTrang AS UNSIGNED) = 1');
        return functions;
    }

    async createRole(data) {
        const { TenNQ, MoTa, chitietquyen } = data;
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();
            const [result] = await connection.query('INSERT INTO nhomquyen (TenNQ, MoTa, TinhTrang) VALUES (?, ?, 1)', [TenNQ, MoTa || '']);
            const MaQuyen = result.insertId;
            for (const { MaCN, HanhDong } of chitietquyen) {
                await connection.query('INSERT INTO chitietquyen (MaQuyen, MaCN, HanhDong, TinhTrang) VALUES (?, ?, ?, 1)', [MaQuyen, MaCN, HanhDong]);
            }
            await connection.commit();
            return MaQuyen;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    async getRoleById(id) {
        const [role] = await pool.query('SELECT * FROM nhomquyen WHERE MaNQ = ? AND CAST(TinhTrang AS UNSIGNED) = 1', [id]);
        if (!role.length) throw new Error('Nhóm quyền không tồn tại');
        const [permissions] = await pool.query(
            `SELECT ctq.*, cn.TenCN FROM chitietquyen ctq JOIN chucnang cn ON ctq.MaCN = cn.MaCN WHERE ctq.MaQuyen = ? AND CAST(ctq.TinhTrang AS UNSIGNED) = 1`,
            [id]
        );
        return { ...role[0], chiTietQuyen: permissions };
    }

    async getAllRoles() {
        const [roles] = await pool.query('SELECT * FROM nhomquyen WHERE CAST(TinhTrang AS UNSIGNED) = 1');
        return roles;
    }

    async updateRole(id, data) {
        const { TenNQ, MoTa, chitietquyen, TinhTrang } = data;
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();
            await connection.query(
                'UPDATE nhomquyen SET TenNQ = ?, MoTa = ?, TinhTrang = ? WHERE MaNQ = ?',
                [TenNQ, MoTa || '', TinhTrang ?? 1, id]
            );

            if (chitietquyen) {
                // Delete existing permissions and re-insert
                await connection.query('DELETE FROM chitietquyen WHERE MaQuyen = ?', [id]);
                for (const { MaCN, HanhDong } of chitietquyen) {
                    await connection.query('INSERT INTO chitietquyen (MaQuyen, MaCN, HanhDong, TinhTrang) VALUES (?, ?, ?, 1)', [id, MaCN, HanhDong]);
                }
            }

            await connection.commit();
            return true;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    async deleteRole(id) {
        const [result] = await pool.query('UPDATE nhomquyen SET TinhTrang = 0 WHERE MaNQ = ?', [id]);
        if (result.affectedRows === 0) throw new Error('Nhóm quyền không tồn tại');
        return true;
    }

    // Get active roles for dropdown/selection purposes
    async getActiveRoles() {
        const [roles] = await pool.query(
            'SELECT MaNQ, TenNQ, MoTa FROM nhomquyen WHERE CAST(TinhTrang AS UNSIGNED) = 1 ORDER BY TenNQ'
        );
        return roles;
    }

    async getUserPermissions(roleId) {
        const [permissions] = await pool.query(
            `SELECT ctq.*, cn.TenCN 
             FROM chitietquyen ctq 
             JOIN chucnang cn ON ctq.MaCN = cn.MaCN 
             WHERE ctq.MaQuyen = ? AND CAST(ctq.TinhTrang AS UNSIGNED) = 1`,
            [roleId]
        );

        // Standardize permissions based on DB_MAP
        const { DB_MAP } = await import('../constants/Permissions.js');

        return permissions.map(p => {
            const resource = DB_MAP.RESOURCES[p.TenCN] || 'UNKNOWN';
            const action = DB_MAP.ACTIONS[p.HanhDong] || 'UNKNOWN';
            return {
                ...p,
                Key: `${resource}_${action}`
            };
        });
    }
}

export default new RoleService();
