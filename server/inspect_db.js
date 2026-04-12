import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: './server/.env' });

async function inspectDb() {
    const config = {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        ssl: {
            rejectUnauthorized: false
        }
    };

    const connection = await mysql.createConnection(config);
    try {
        console.log('Connected to TiDB for inspection...');
        
        const [tables] = await connection.query('SHOW TABLES');
        console.log('Tables in database:', tables);

        for (const tableObj of tables) {
            const tableName = Object.values(tableObj)[0];
            console.log(`\nTable: ${tableName}`);
            const [columns] = await connection.query(`DESCRIBE \`${tableName}\``);
            console.table(columns);
        }

    } catch (error) {
        console.error('Inspection failed:', error);
    } finally {
        await connection.end();
    }
}

inspectDb();
