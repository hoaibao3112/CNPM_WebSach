import pool from './src/config/connectDatabase.js';

async function checkAndAddPermissions() {
    try {
        console.log('=== Checking Role Permissions ===\n');

        // Get all roles with permission counts
        const [roles] = await pool.query(`
      SELECT nq.MaNQ, nq.TenNQ, COUNT(ctq.MaCTQ) as permission_count 
      FROM nhomquyen nq 
      LEFT JOIN chitietquyen ctq ON nq.MaNQ = ctq.MaQuyen 
      GROUP BY nq.MaNQ, nq.TenNQ
      ORDER BY nq.MaNQ
    `);

        console.log('Roles and their permission counts:');
        roles.forEach(r => {
            console.log(`  ${r.MaNQ} - ${r.TenNQ}: ${r.permission_count} permissions`);
        });

        // Get all available features
        const [features] = await pool.query('SELECT MaCN, TenCN FROM chucnang ORDER BY MaCN');
        console.log('\n=== Available Features ===');
        features.forEach(f => {
            console.log(`  ${f.MaCN} - ${f.TenCN}`);
        });

        // Find roles with no permissions
        const emptyRoles = roles.filter(r => r.permission_count === 0);

        if (emptyRoles.length > 0) {
            console.log('\n=== Roles with NO permissions ===');
            emptyRoles.forEach(r => {
                console.log(`  ${r.MaNQ} - ${r.TenNQ}`);
            });

            console.log('\n=== Adding default permissions for empty roles ===');

            // For each empty role, add basic permissions
            for (const role of emptyRoles) {
                console.log(`\nAdding permissions for ${role.TenNQ}...`);

                // Add read permissions for common features
                const commonFeatures = features.slice(0, 5); // First 5 features as example

                for (const feature of commonFeatures) {
                    await pool.query(
                        'INSERT INTO chitietquyen (MaQuyen, MaCN, HanhDong, TinhTrang) VALUES (?, ?, ?, ?)',
                        [role.MaNQ, feature.MaCN, 'Đọc', 1]
                    );
                    console.log(`  ✅ Added READ permission for ${feature.TenCN}`);
                }
            }

            console.log('\n✅ Default permissions added successfully!');
        } else {
            console.log('\n✅ All roles have permissions!');
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await pool.end();
    }
}

checkAndAddPermissions();
