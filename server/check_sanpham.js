import pool from './src/config/connectDatabase.js';
import fs from 'fs';

async function checkSchema() {
    try {
        const [cols] = await pool.query('DESCRIBE sanpham');
        fs.writeFileSync('sanpham_schema.json', JSON.stringify(cols, null, 2));
        console.log('Schema written to sanpham_schema.json');
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkSchema();
