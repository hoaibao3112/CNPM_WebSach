-- Migration: Add Google Auth support to khachhang table
-- Date: 2026-01-30
-- Purpose: Add google_id and avatar columns for Google OAuth login

USE bookstore;

-- Add google_id column (stores Google user ID)
ALTER TABLE khachhang 
ADD COLUMN IF NOT EXISTS google_id VARCHAR(255) NULL UNIQUE COMMENT 'Google OAuth user ID';

-- Add avatar column (stores profile picture URL)
ALTER TABLE khachhang 
ADD COLUMN IF NOT EXISTS avatar VARCHAR(500) NULL COMMENT 'User profile picture URL';

-- Add index for faster Google ID lookups
ALTER TABLE khachhang 
ADD INDEX IF NOT EXISTS idx_google_id (google_id);

-- Show the updated table structure
DESCRIBE khachhang;

SELECT 'Migration completed successfully! google_id and avatar columns added.' AS Status;
