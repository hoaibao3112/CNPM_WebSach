import pool from './src/config/connectDatabase.js';

async function run() {
    try {
        const [rows] = await pool.query("SHOW COLUMNS FROM hoadon LIKE 'NgayTao'");
        console.log('Before:', rows);
        await pool.query('ALTER TABLE hoadon MODIFY COLUMN NgayTao DATETIME DEFAULT NULL');
        const [rows2] = await pool.query("SHOW COLUMNS FROM hoadon LIKE 'NgayTao'");
        console.log('After:', rows2);
    } catch (err) {
        console.error(err);
    } finally {
        process.exit(0);
    }
}

run();
