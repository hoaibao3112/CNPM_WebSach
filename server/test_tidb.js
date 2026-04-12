import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';

async function testConnection() {
  const config = {
    host: 'gateway01.ap-southeast-1.prod.aws.tidbcloud.com',
    port: 4000,
    user: '3tEaXiNgYBRC9wS.root',
    password: '', // Need to replace with actual password if known, but here we just check connectivity
    database: 'cnpm_websach',
    ssl: {
      ca: fs.readFileSync('isrgrootx1.pem'),
      rejectUnauthorized: true
    }
  };

  try {
    console.log('Attempting to connect to TiDB...');
    const connection = await mysql.createConnection(config);
    console.log('✅ Connection successful!');
    await connection.end();
  } catch (err) {
    console.error('❌ Connection failed:');
    console.error(err);
  }
}

testConnection();
