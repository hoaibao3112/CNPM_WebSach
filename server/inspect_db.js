import pool from './src/config/connectDatabase.js';
import fs from 'fs';

async function checkSchema() {
    try {
        const tablesToCheck = ['sanpham', 'theloai', 'danhmuc', 'nhacungcap', 'phieunhap', 'chitietphieunhap', 'nhanvien', 'taikhoan', 'nhomquyen', 'chitietquyen', 'chucnang', 'tacgia'];
        const dump = {};

        for (const table of tablesToCheck) {
            try {
                const [columns] = await pool.query(`DESCRIBE ${table}`);
                dump[table] = columns;
            } catch (e) {
                dump[table] = 'not found';
            }
        }

        fs.writeFileSync('db_dump.json', JSON.stringify(dump, null, 2));
        console.log('✅ Schema dumped to db_dump.json');
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkSchema();
