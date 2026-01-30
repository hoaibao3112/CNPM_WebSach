/**
 * Database Migration: Create Refund System Tables
 * Run: node migrations/create_refund_tables.cjs
 */

require('dotenv').config();
const mysql = require('mysql2/promise');

async function runMigration() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '123456',
        database: process.env.DB_NAME || 'bookstore',
        port: process.env.DB_PORT || 3306
    });

    try {
        console.log('🔄 Starting Refund System migration...\n');

        // Create refund_requests table
        console.log('📋 Creating refund_requests table...');
        await connection.query(`
            CREATE TABLE IF NOT EXISTS refund_requests (
                id INT PRIMARY KEY AUTO_INCREMENT,
                refundRequestId VARCHAR(50) UNIQUE NOT NULL COMMENT 'RR-YYYYMMDD-XXXXX',
                orderId INT NOT NULL,
                customerId INT NOT NULL,
                refundAmount DECIMAL(15,2) NOT NULL,
                refundReason TEXT,
                refundType ENUM('FULL', 'PARTIAL') DEFAULT 'FULL',
                status ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'REJECTED', 'CANCELLED') DEFAULT 'PENDING',
                bankAccount VARCHAR(50),
                bankName VARCHAR(100),
                accountHolder VARCHAR(100),
                adminNotes TEXT,
                processedBy INT COMMENT 'Admin user ID',
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                processedAt DATETIME,
                FOREIGN KEY (orderId) REFERENCES hoadon(MaHD) ON DELETE CASCADE,
                FOREIGN KEY (customerId) REFERENCES khachhang(makh) ON DELETE CASCADE,
                INDEX idx_customer (customerId),
                INDEX idx_order (orderId),
                INDEX idx_status (status),
                INDEX idx_created (createdAt)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✅ refund_requests table created\n');

        // Create nhatky_hoantienvnpay table
        console.log('📋 Creating nhatky_hoantienvnpay table...');
        await connection.query(`
            CREATE TABLE IF NOT EXISTS nhatky_hoantienvnpay (
                id INT PRIMARY KEY AUTO_INCREMENT,
                ma_hoadon INT NOT NULL COMMENT 'Order ID',
                ma_khachhang INT NOT NULL COMMENT 'Customer ID',
                ma_yc_hoantra VARCHAR(50) COMMENT 'Refund Request ID from refund_requests',
                sotien_hoantra DECIMAL(15,2) NOT NULL COMMENT 'Refund amount',
                lydo_hoantra TEXT COMMENT 'Refund reason',
                trangthai ENUM('DANG_XL', 'THANH_CONG', 'THAT_BAI') DEFAULT 'DANG_XL',
                phi_hoantra DECIMAL(15,2) DEFAULT 0 COMMENT 'Refund fee (if any)',
                ma_giaodich_vnpay VARCHAR(100) COMMENT 'VNPay transaction ID',
                ngay_tao DATETIME DEFAULT CURRENT_TIMESTAMP,
                ngay_capnhat DATETIME,
                ngay_vnpay_xuly DATETIME COMMENT 'When VNPay processed',
                FOREIGN KEY (ma_hoadon) REFERENCES hoadon(MaHD) ON DELETE CASCADE,
                FOREIGN KEY (ma_khachhang) REFERENCES khachhang(makh) ON DELETE CASCADE,
                INDEX idx_order (ma_hoadon),
                INDEX idx_customer (ma_khachhang),
                INDEX idx_status (trangthai),
                INDEX idx_created (ngay_tao)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✅ nhatky_hoantienvnpay table created\n');

        // Check if SoTienHoanTra column exists in hoadon table
        const [columns] = await connection.query(`
            SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'hoadon' 
            AND COLUMN_NAME = 'SoTienHoanTra'
        `, [process.env.DB_NAME || 'bookstore']);

        if (columns.length === 0) {
            console.log('📋 Adding SoTienHoanTra column to hoadon table...');
            await connection.query(`
                ALTER TABLE hoadon 
                ADD COLUMN SoTienHoanTra DECIMAL(15,2) DEFAULT 0 COMMENT 'Total refunded amount'
            `);
            console.log('✅ SoTienHoanTra column added\n');
        } else {
            console.log('⏭️  SoTienHoanTra column already exists\n');
        }

        // Show table structures
        console.log('📊 Table Structures:\n');

        const [refundReqStructure] = await connection.query('DESCRIBE refund_requests');
        console.log('=== refund_requests ===');
        console.table(refundReqStructure);

        const [vnpayLogStructure] = await connection.query('DESCRIBE nhatky_hoantienvnpay');
        console.log('\n=== nhatky_hoantienvnpay ===');
        console.table(vnpayLogStructure);

        console.log('\n✅ Refund System migration completed successfully!');
        console.log('🔄 You can now restart your server.\n');

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        throw error;
    } finally {
        await connection.end();
        process.exit(0);
    }
}

runMigration().catch(err => {
    console.error('Fatal error:', err.message);
    process.exit(1);
});
