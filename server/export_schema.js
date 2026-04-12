import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config({ path: './server/.env' });

async function exportSchema() {
    const config = {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        ssl: { rejectUnauthorized: false }
    };

    const connection = await mysql.createConnection(config);
    try {
        const report = {};
        for (const table of ['tacgia', 'sanpham', 'theloai', 'nhacungcap']) {
            const [cols] = await connection.query(`DESCRIBE ${table}`);
            report[table] = cols.map(c => c.Field);
        }
        fs.writeFileSync('./server/schema_report.json', JSON.stringify(report, null, 2));
        console.log('Schema report saved to server/schema_report.json');
    } catch (error) {
        console.error('Failed:', error.message);
    } finally {
        await connection.end();
    }
}

exportSchema();
