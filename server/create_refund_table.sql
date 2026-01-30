CREATE TABLE IF NOT EXISTS `refund_requests` (
  `id` int NOT NULL AUTO_INCREMENT,
  `refundRequestId` varchar(50) NOT NULL UNIQUE,
  `orderId` int NOT NULL,
  `customerId` int NOT NULL,
  `refundAmount` decimal(10,2) NOT NULL,
  `refundReason` text,
  `refundType` enum('FULL','PARTIAL') DEFAULT 'FULL',
  `status` enum('PENDING','PROCESSING','COMPLETED','REJECTED','CANCELLED') DEFAULT 'PENDING',
  `bankAccount` varchar(50),
  `bankName` varchar(100),
  `accountHolder` varchar(100),
  `adminNotes` text,
  `processedBy` int DEFAULT NULL,
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `processedAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_orderId` (`orderId`),
  KEY `idx_customerId` (`customerId`),
  KEY `idx_status` (`status`),
  KEY `idx_processedBy` (`processedBy`),
  CONSTRAINT `fk_refund_order` FOREIGN KEY (`orderId`) REFERENCES `hoadon` (`MaHD`),
  CONSTRAINT `fk_refund_customer` FOREIGN KEY (`customerId`) REFERENCES `khachhang` (`makh`),
  CONSTRAINT `fk_refund_processor` FOREIGN KEY (`processedBy`) REFERENCES `taikhoan` (`MaTK`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create VNPay refund logs table
CREATE TABLE IF NOT EXISTS `vnpay_refund_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `refundRequestId` int NOT NULL,
  `vnp_TxnRef` varchar(100),
  `vnp_TransactionNo` varchar(100),
  `vnp_Amount` bigint,
  `vnp_ResponseCode` varchar(10),
  `vnp_Message` text,
  `vnp_BankCode` varchar(20),
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_refundRequestId` (`refundRequestId`),
  CONSTRAINT `fk_vnpay_refund` FOREIGN KEY (`refundRequestId`) REFERENCES `refund_requests` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
