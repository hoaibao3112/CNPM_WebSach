import pool from './src/config/connectDatabase.js';

async function checkSchema() {
    try {
        const [tables] = await pool.query('SHOW TABLES');
        console.log('Tables:', tables);

        const [columns] = await pool.query('DESCRIBE giohang');
        console.log('Columns in giohang:', columns);

        try {
            const [columns2] = await pool.query('DESCRIBE giohang_chitiet');
            console.log('Columns in giohang_chitiet:', columns2);
        } catch (e) {
            console.log('giohang_chitiet does not exist');
        }

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkSchema();
