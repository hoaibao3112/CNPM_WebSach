-- Migration: Add MacDinh column to diachi table
-- This enables setting a default shipping address for customers
-- Run this after implementing setDefaultAddress API endpoint

ALTER TABLE diachi ADD COLUMN MacDinh TINYINT(1) DEFAULT 0 AFTER PhuongXa;

-- Optional: Create index for faster queries
CREATE INDEX idx_makh_macdinh ON diachi(MaKH, MacDinh);

-- Set the first address as default for existing customers (optional)
-- UPDATE diachi d1
-- SET MacDinh = 1
-- WHERE MaDiaChi = (
--     SELECT MIN(MaDiaChi)
--     FROM diachi d2
--     WHERE d2.MaKH = d1.MaKH
-- );

-- After running this migration, update OrderService.setDefaultAddress() to:
-- 1. Remove the placeholder warning
-- 2. Uncomment the actual UPDATE statements
-- 3. Also update getCustomerAddresses() to include MacDinh column in SELECT
