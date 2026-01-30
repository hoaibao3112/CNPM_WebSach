import pool from './src/config/connectDatabase.js';

async function grantPermissionManagementRights() {
    try {
        console.log('=== Granting Permission Management Rights ===\n');

        // Find "Phân quyền" feature
        const [features] = await pool.query("SELECT * FROM chucnang WHERE TenCN LIKE '%Phân quyền%' OR TenCN LIKE '%quyền%'");

        if (features.length === 0) {
            console.log('❌ "Phân quyền" feature not found. Creating it...');

            const [result] = await pool.query(
                "INSERT INTO chucnang (TenCN, MoTa) VALUES ('Phân quyền', 'Quản lý phân quyền chi tiết')"
            );

            const phanQuyenId = result.insertId;
            console.log(`✅ Created "Phân quyền" feature with ID: ${phanQuyenId}`);

            // Grant all permissions to admin role (MaNQ = 1)
            const actions = ['Đọc', 'Thêm', 'Sửa', 'Xóa'];

            for (const action of actions) {
                await pool.query(
                    'INSERT INTO chitietquyen (MaQuyen, MaCN, HanhDong, TinhTrang) VALUES (?, ?, ?, ?)',
                    [1, phanQuyenId, action, 1]
                );
                console.log(`  ✅ Granted ${action} permission to Admin`);
            }

        } else {
            const phanQuyen = features[0];
            console.log(`Found "Phân quyền" feature: ${phanQuyen.MaCN} - ${phanQuyen.TenCN}`);

            // Check existing permissions for admin
            const [existing] = await pool.query(
                'SELECT * FROM chitietquyen WHERE MaQuyen = 1 AND MaCN = ?',
                [phanQuyen.MaCN]
            );

            console.log(`\nAdmin role has ${existing.length} permissions for this feature:`);
            existing.forEach(p => console.log(`  - ${p.HanhDong}`));

            // Add missing permissions
            const actions = ['Đọc', 'Thêm', 'Sửa', 'Xóa'];
            const existingActions = existing.map(p => p.HanhDong);
            const missing = actions.filter(a => !existingActions.includes(a));

            if (missing.length > 0) {
                console.log(`\n Adding missing permissions:`);
                for (const action of missing) {
                    await pool.query(
                        'INSERT INTO chitietquyen (MaQuyen, MaCN, HanhDong, TinhTrang) VALUES (?, ?, ?, ?)',
                        [1, phanQuyen.MaCN, action, 1]
                    );
                    console.log(`  ✅ Added ${action} permission`);
                }
            } else {
                console.log('\n✅ Admin already has all Phân quyền permissions!');
            }
        }

        console.log('\n✅ Permission management rights granted successfully!');
        console.log('\n👉 Please logout and login again to refresh permissions.');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await pool.end();
    }
}

grantPermissionManagementRights();
