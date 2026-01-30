-- Chat System Database Tables
-- Run this in MySQL to create required tables for chat functionality

-- Chat Rooms Table
CREATE TABLE IF NOT EXISTS chat_rooms (
  room_id VARCHAR(50) PRIMARY KEY,
  customer_id INT NOT NULL,
  staff_id VARCHAR(20) DEFAULT NULL,
  status ENUM('active', 'closed') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES khachhang(makh) ON DELETE CASCADE,
  INDEX idx_customer (customer_id),
  INDEX idx_status (status),
  INDEX idx_updated (updated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Chat Messages Table
CREATE TABLE IF NOT EXISTS chat_messages (
  message_id INT AUTO_INCREMENT PRIMARY KEY,
  room_id VARCHAR(50) NOT NULL,
  sender_id VARCHAR(50) NOT NULL,
  sender_type ENUM('customer', 'staff') NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (room_id) REFERENCES chat_rooms(room_id) ON DELETE CASCADE,
  INDEX idx_room (room_id),
  INDEX idx_created (created_at),
  INDEX idx_sender (sender_id, sender_type),
  INDEX idx_unread (room_id, is_read, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
