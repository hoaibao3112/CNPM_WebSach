import pool from './src/config/connectDatabase.js';

async function checkSchema() {
    try {
        const [tables] = await pool.query('SHOW TABLES');
        console.log('--- TABLES ---');
        console.log(tables.map(t => Object.values(t)[0]).join(', '));

        const tableList = tables.map(t => Object.values(t)[0]);

        if (tableList.includes('giohang')) {
            const [columns] = await pool.query('DESCRIBE giohang');
            console.log('--- GIOHANG ---');
            columns.forEach(c => console.log(`${c.Field} | ${c.Type} | ${c.Null} | ${c.Key}`));
        }

        if (tableList.includes('giohang_chitiet')) {
            const [columns] = await pool.query('DESCRIBE giohang_chitiet');
            console.log('--- GIOHANG_CHITIET ---');
            columns.forEach(c => console.log(`${c.Field} | ${c.Type} | ${c.Null} | ${c.Key}`));
        }

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkSchema();
