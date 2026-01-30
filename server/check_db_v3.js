import pool from './src/config/connectDatabase.js';
import fs from 'fs';

async function checkSchema() {
    let output = '';
    try {
        const [tables] = await pool.query('SHOW TABLES');
        const tableList = tables.map(t => Object.values(t)[0]);
        output += `Tables: ${tableList.join(', ')}\n\n`;

        for (const tableName of tableList) {
            if (tableName === 'giohang' || tableName === 'giohang_chitiet') {
                const [columns] = await pool.query(`DESCRIBE ${tableName}`);
                output += `--- ${tableName} ---\n`;
                columns.forEach(c => {
                    output += `${c.Field} | ${c.Type} | ${c.Null} | ${c.Key}\n`;
                });
                output += '\n';
            }
        }

        fs.writeFileSync('schema_output.txt', output);
        console.log('Schema written to schema_output.txt');
        process.exit(0);
    } catch (error) {
        fs.writeFileSync('schema_output.txt', 'Error: ' + error.message);
        process.exit(1);
    }
}

checkSchema();
