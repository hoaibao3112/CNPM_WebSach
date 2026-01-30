import pool from './src/config/connectDatabase.js';

const ROLES = [
    { name: 'Administrator', desc: 'Quản trị viên hệ thống', permissions: 'ALL' },
    { name: 'Inventory Manager', desc: 'Quản lý kho hàng', resources: ['Sản phẩm', 'Thể loại', 'Tác giả', 'Nhà cung cấp', 'Nhập hàng', 'Báo cáo'], actions: ['Xem', 'Đọc', 'Thêm', 'Sửa', 'Xóa'] },
    { name: 'Sales Staff', desc: 'Nhân viên bán hàng', resources: ['Đơn hàng', 'Khách hàng', 'Trả Hàng', 'Hoàn tiền đơn hàng', 'Khuyến mãi', 'Sản phẩm', 'Báo cáo'], actions: ['Xem', 'Đọc', 'Thêm', 'Sửa'] },
    { name: 'HR Manager', desc: 'Quản lý nhân sự', resources: ['Tài khoản', 'Chấm công', 'Bảng lương', 'Nghỉ phép', 'Báo cáo'], actions: ['Xem', 'Đọc', 'Thêm', 'Sửa', 'Xóa'] },
    { name: 'Support', desc: 'Hỗ trợ khách hàng', resources: ['Chat', 'FAQ', 'Khách hàng', 'Đơn hàng'], actions: ['Xem', 'Đọc', 'Thêm', 'Sửa'] }
];

async function init() {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Clear existing roles and details (Safety first)
        console.log('Cleaning up existing roles...');
        await connection.query('SET FOREIGN_KEY_CHECKS = 0');
        await connection.query('DELETE FROM chitietquyen');
        await connection.query('DELETE FROM nhomquyen');

        // 2. Fetch all functions (MaCN)
        const [functions] = await connection.query('SELECT MaCN, TenCN FROM chucnang');
        const funcMap = {};
        functions.forEach(f => funcMap[f.TenCN] = f.MaCN);

        const actions = ['Xem', 'Đọc', 'Thêm', 'Sửa', 'Xóa'];

        for (const role of ROLES) {
            console.log(`Setting up role: ${role.name}`);
            const [roleResult] = await connection.query(
                'INSERT INTO nhomquyen (TenNQ, MoTa, TinhTrang) VALUES (?, ?, 1)',
                [role.name, role.desc]
            );
            const roleId = roleResult.insertId;

            if (role.permissions === 'ALL') {
                for (const func of functions) {
                    for (const action of actions) {
                        await connection.query(
                            'INSERT INTO chitietquyen (MaQuyen, MaCN, HanhDong, TinhTrang) VALUES (?, ?, ?, 1)',
                            [roleId, func.MaCN, action]
                        );
                    }
                }
            } else {
                for (const res of role.resources) {
                    const maCN = funcMap[res];
                    if (maCN) {
                        for (const action of role.actions) {
                            await connection.query(
                                'INSERT INTO chitietquyen (MaQuyen, MaCN, HanhDong, TinhTrang) VALUES (?, ?, ?, 1)',
                                [roleId, maCN, action]
                            );
                        }
                    }
                }
            }
        }

        // 3. Re-assign the 'admin' account to the first role (Administrator)
        const [adminRole] = await connection.query('SELECT MaNQ FROM nhomquyen WHERE TenNQ = "Administrator"');
        if (adminRole.length > 0) {
            console.log('Assigning admin account to Administrator role...');
            await connection.query('UPDATE taikhoan SET MaQuyen = ? WHERE TenTK = "admin"', [adminRole[0].MaNQ]);
        }

        await connection.query('SET FOREIGN_KEY_CHECKS = 1');
        await connection.commit();
        console.log('Role initialization completed successfully!');
    } catch (error) {
        await connection.rollback();
        console.error('Failed to initialize roles:', error);
    } finally {
        connection.release();
        process.exit();
    }
}

init();
