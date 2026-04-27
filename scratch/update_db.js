import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load .env from root
dotenv.config({ path: './.env' });

import pool from '../server/src/config/connectDatabase.js';

async function updateDatabase() {
    try {
        console.log('🔍 Checking chat_messages table schema...');
        const [columns] = await pool.query('DESCRIBE chat_messages');
        const senderIdCol = columns.find(c => c.Field === 'sender_id');
        
        if (senderIdCol) {
            console.log(`📊 Current sender_id type: ${senderIdCol.Type}`);
            console.log('🚀 Updating sender_id to VARCHAR(50)...');
            await pool.query('ALTER TABLE chat_messages MODIFY sender_id VARCHAR(50) NOT NULL');
            console.log('✅ sender_id updated!');
        }

        console.log('🚀 Updating sender_type ENUM...');
        await pool.query("ALTER TABLE chat_messages MODIFY sender_type ENUM('customer', 'staff', 'admin') NOT NULL");
        console.log('✅ sender_type updated!');

    } catch (error) {
        console.error('❌ Database update error:', error.message);
    } finally {
        process.exit();
    }
}

updateDatabase();
