/**
 * Migration Script: Add Google Auth columns to khachhang table
 * Run this once to enable Google OAuth login
 */

import pool from '../config/connectDatabase.js';

async function runMigration() {
    const connection = await pool.getConnection();

    try {
        console.log('🔄 Starting migration: Add Google Auth columns...');

        // Check if columns already exist
        const [columns] = await connection.query(
            `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
             WHERE TABLE_SCHEMA = 'bookstore' AND TABLE_NAME = 'khachhang' 
             AND COLUMN_NAME IN ('google_id', 'avatar')`
        );

        const existingColumns = columns.map(c => c.COLUMN_NAME);
        console.log('Existing columns:', existingColumns);

        // Add google_id if not exists
        if (!existingColumns.includes('google_id')) {
            console.log('➕ Adding google_id column...');
            await connection.query(
                `ALTER TABLE khachhang 
                 ADD COLUMN google_id VARCHAR(255) NULL UNIQUE COMMENT 'Google OAuth user ID'`
            );
            console.log('✅ google_id column added');
        } else {
            console.log('⏭️  google_id column already exists');
        }

        // Add avatar if not exists
        if (!existingColumns.includes('avatar')) {
            console.log('➕ Adding avatar column...');
            await connection.query(
                `ALTER TABLE khachhang 
                 ADD COLUMN avatar VARCHAR(500) NULL COMMENT 'User profile picture URL'`
            );
            console.log('✅ avatar column added');
        } else {
            console.log('⏭️  avatar column already exists');
        }

        // Add index for google_id
        try {
            console.log('➕ Adding index on google_id...');
            await connection.query(
                `ALTER TABLE khachhang ADD INDEX idx_google_id (google_id)`
            );
            console.log('✅ Index added');
        } catch (e) {
            if (e.code === 'ER_DUP_KEYNAME') {
                console.log('⏭️  Index already exists');
            } else {
                throw e;
            }
        }

        // Show updated structure
        const [structure] = await connection.query('DESCRIBE khachhang');
        console.log('\n📋 Updated khachhang table structure:');
        console.table(structure);

        console.log('\n✅ Migration completed successfully!');

    } catch (error) {
        console.error('❌ Migration failed:', error);
        throw error;
    } finally {
        connection.release();
        process.exit(0);
    }
}

runMigration().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
