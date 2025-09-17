-- MySQL dump 10.13  Distrib 8.0.43, for Win64 (x86_64)
--
-- Host: localhost    Database: qlbs
-- ------------------------------------------------------
-- Server version	9.4.0

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `account`
--

DROP TABLE IF EXISTS `account`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `account` (
  `id` bigint NOT NULL,
  `username` varchar(255) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  `staff_id` bigint DEFAULT NULL,
  `role_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_account_staff` (`staff_id`),
  KEY `fk_account_role` (`role_id`),
  CONSTRAINT `fk_account_role` FOREIGN KEY (`role_id`) REFERENCES `role` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_account_staff` FOREIGN KEY (`staff_id`) REFERENCES `staff` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `account`
--

LOCK TABLES `account` WRITE;
/*!40000 ALTER TABLE `account` DISABLE KEYS */;
/*!40000 ALTER TABLE `account` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `binhluan`
--

DROP TABLE IF EXISTS `binhluan`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `binhluan` (
  `mabl` int NOT NULL AUTO_INCREMENT,
  `mabl_cha` int DEFAULT NULL,
  `makh` int NOT NULL,
  `masp` int NOT NULL,
  `noidung` text NOT NULL,
  `ngaybinhluan` datetime DEFAULT CURRENT_TIMESTAMP,
  `trangthai` enum('Hiển thị','Ẩn') DEFAULT 'Hiển thị',
  PRIMARY KEY (`mabl`),
  KEY `makh` (`makh`),
  KEY `masp` (`masp`),
  KEY `mabl_cha` (`mabl_cha`),
  CONSTRAINT `binhluan_ibfk_1` FOREIGN KEY (`makh`) REFERENCES `khachhang` (`makh`) ON DELETE CASCADE,
  CONSTRAINT `binhluan_ibfk_2` FOREIGN KEY (`masp`) REFERENCES `sanpham` (`MaSP`) ON DELETE CASCADE,
  CONSTRAINT `binhluan_ibfk_3` FOREIGN KEY (`mabl_cha`) REFERENCES `binhluan` (`mabl`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `binhluan`
--

LOCK TABLES `binhluan` WRITE;
/*!40000 ALTER TABLE `binhluan` DISABLE KEYS */;
INSERT INTO `binhluan` VALUES (1,NULL,1,2,'ggh','2025-05-19 08:20:34','Hiển thị'),(2,NULL,18,2,'sách hay nha các pro','2025-05-19 08:21:22','Hiển thị'),(3,NULL,1,1,'hay sách','2025-05-20 22:47:15','Hiển thị'),(4,NULL,1,54,'sách này con tôi rất thích luôn','2025-05-20 22:47:55','Hiển thị'),(5,NULL,1,1,'ALO ALO','2025-08-21 20:02:30','Hiển thị'),(6,NULL,19,1,'Test comment từ Postman - hẹ hẹ','2025-09-11 20:25:13','Hiển thị'),(7,NULL,19,2,'sach hay','2025-09-11 20:48:53','Hiển thị'),(8,7,18,2,'tôi cũng thấy vậy','2025-09-11 21:02:04','Hiển thị'),(9,6,19,1,'test đc chưa','2025-09-11 23:01:58','Hiển thị'),(10,9,18,1,'test đc rồi nè','2025-09-11 23:02:49','Hiển thị'),(11,5,19,1,'nghe','2025-09-11 23:03:35','Hiển thị');
/*!40000 ALTER TABLE `binhluan` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `binhluan_like`
--

DROP TABLE IF EXISTS `binhluan_like`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `binhluan_like` (
  `mabl_like` int NOT NULL AUTO_INCREMENT,
  `mabl` int NOT NULL,
  `makh` int NOT NULL,
  `ngaylike` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`mabl_like`),
  UNIQUE KEY `unique_like` (`mabl`,`makh`),
  KEY `makh` (`makh`),
  CONSTRAINT `binhluan_like_ibfk_1` FOREIGN KEY (`mabl`) REFERENCES `binhluan` (`mabl`),
  CONSTRAINT `binhluan_like_ibfk_2` FOREIGN KEY (`makh`) REFERENCES `khachhang` (`makh`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `binhluan_like`
--

LOCK TABLES `binhluan_like` WRITE;
/*!40000 ALTER TABLE `binhluan_like` DISABLE KEYS */;
INSERT INTO `binhluan_like` VALUES (1,6,18,'2025-09-11 14:24:00'),(2,5,18,'2025-09-11 14:24:04'),(3,3,18,'2025-09-11 14:24:05'),(5,6,19,'2025-09-11 16:03:26'),(6,5,19,'2025-09-11 16:03:28');
/*!40000 ALTER TABLE `binhluan_like` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cham_cong`
--

DROP TABLE IF EXISTS `cham_cong`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cham_cong` (
  `id` int NOT NULL AUTO_INCREMENT,
  `MaTK` int NOT NULL,
  `ngay` date NOT NULL,
  `gio_vao` time DEFAULT NULL,
  `gio_ra` time DEFAULT NULL,
  `trang_thai` enum('Di_lam','Nghi_phep','Nghi_khong_phep','Lam_them') DEFAULT 'Di_lam',
  `ghi_chu` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_chamcong_taikhoan` (`MaTK`),
  CONSTRAINT `fk_chamcong_taikhoan` FOREIGN KEY (`MaTK`) REFERENCES `taikhoan` (`MaTK`)
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cham_cong`
--

LOCK TABLES `cham_cong` WRITE;
/*!40000 ALTER TABLE `cham_cong` DISABLE KEYS */;
INSERT INTO `cham_cong` VALUES (2,2,'2024-06-19',NULL,NULL,'Di_lam',NULL),(4,2,'2025-06-19','08:00:00','17:00:00','Di_lam','Chấm công test'),(5,2,'2025-06-19',NULL,NULL,'Di_lam',NULL),(6,2,'2025-06-19','13:31:42','17:00:00','Di_lam','Chấm công thành công'),(7,2,'2025-06-19','13:31:59','17:00:00','Di_lam','Chấm công thành công'),(8,2,'2025-06-19','13:32:48','17:00:00','Di_lam','Chấm công thành công'),(9,2,'2025-06-19','13:35:07','17:00:00','Di_lam','Chấm công thành công'),(10,2,'2025-06-19','13:36:54','17:00:00','Di_lam','Chấm công thành công'),(11,4,'2025-06-19','13:39:44','17:00:00','Di_lam','Chấm công thành công'),(12,7,'2025-06-19','14:40:26','17:00:00','Di_lam','Chấm công thành công'),(13,2,'2025-06-20','09:31:05','17:00:00','Di_lam','Chấm công thành công'),(14,3,'2025-06-22','14:29:34','17:00:00','Di_lam','Chấm công thành công'),(15,2,'2025-07-23','16:11:39','17:00:00','Di_lam','Chấm công thành công'),(16,3,'2025-07-25','20:52:15','17:00:00','Di_lam','Chấm công thành công'),(17,4,'2025-09-04','14:57:20','17:00:00','Di_lam','Chấm công thành công'),(18,7,'2025-09-10','19:53:22','17:00:00','Di_lam','Chấm công thành công');
/*!40000 ALTER TABLE `cham_cong` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `chat_messages`
--

DROP TABLE IF EXISTS `chat_messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `chat_messages` (
  `message_id` int NOT NULL AUTO_INCREMENT,
  `room_id` int NOT NULL,
  `sender_id` varchar(10) NOT NULL,
  `sender_type` enum('customer','staff') NOT NULL,
  `message` text NOT NULL,
  `is_read` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`message_id`),
  KEY `room_id` (`room_id`),
  CONSTRAINT `chat_messages_ibfk_1` FOREIGN KEY (`room_id`) REFERENCES `chat_rooms` (`room_id`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `chat_messages`
--

LOCK TABLES `chat_messages` WRITE;
/*!40000 ALTER TABLE `chat_messages` DISABLE KEYS */;
INSERT INTO `chat_messages` VALUES (1,1,'1','customer','Xin chào, tôi muốn kiểm tra tình trạng đơn hàng #1',1,'2023-03-30 03:05:00'),(2,1,'NV004','staff','Đơn hàng #1 đang được đóng gói, dự kiến giao trong 2 ngày',1,'2023-03-30 03:15:00'),(3,1,'1','customer','Cảm ơn thông tin!',1,'2023-03-30 03:20:00'),(4,2,'1','customer','Tôi cần thay đổi địa chỉ giao hàng',1,'2022-09-23 07:35:00'),(5,2,'NV002','staff','Vui lòng cung cấp địa chỉ mới',1,'2022-09-23 07:40:00'),(6,2,'1','customer','Đổi sang: 123 Đường ABC, Quận 1',1,'2022-09-23 07:45:00'),(7,3,'4','customer','Đơn hàng #3 đã xác nhận chưa?',1,'2022-09-24 02:20:00'),(8,3,'NV004','staff','Đã xác nhận, đang chuẩn bị hàng',1,'2022-09-24 02:30:00'),(9,4,'6','customer','Khi nào đơn #4 được giao?',1,'2022-09-25 06:25:00'),(10,4,'NV005','staff','Dự kiến giao vào ngày mai trước 17h',1,'2022-09-25 06:35:00'),(11,5,'2','customer','Shipper đã nhận hàng chưa?',1,'2022-09-26 09:50:00'),(12,5,'NV006','staff','Đơn hàng đang trên đường giao, mã vận đơn #GH12345',1,'2022-09-26 10:00:00'),(13,6,'1','customer','Tôi cần tư vấn về chính sách đổi trả',0,'2023-10-01 01:05:00'),(14,6,'NV003','staff','Chúng tôi sẽ liên hệ lại trong 15 phút',0,'2023-10-01 01:10:00');
/*!40000 ALTER TABLE `chat_messages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `chat_rooms`
--

DROP TABLE IF EXISTS `chat_rooms`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `chat_rooms` (
  `room_id` int NOT NULL AUTO_INCREMENT,
  `order_id` int DEFAULT NULL,
  `customer_id` int NOT NULL,
  `staff_id` varchar(10) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`room_id`),
  KEY `order_id` (`order_id`),
  KEY `customer_id` (`customer_id`),
  KEY `staff_id` (`staff_id`),
  CONSTRAINT `chat_rooms_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `hoadon` (`MaHD`),
  CONSTRAINT `chat_rooms_ibfk_2` FOREIGN KEY (`customer_id`) REFERENCES `khachhang` (`makh`),
  CONSTRAINT `chat_rooms_ibfk_3` FOREIGN KEY (`staff_id`) REFERENCES `taikhoan` (`TenTK`)
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `chat_rooms`
--

LOCK TABLES `chat_rooms` WRITE;
/*!40000 ALTER TABLE `chat_rooms` DISABLE KEYS */;
INSERT INTO `chat_rooms` VALUES (1,1,1,'NV004','2023-03-30 03:00:00','2023-03-30 04:30:00'),(2,2,1,'NV002','2022-09-23 07:30:00','2022-09-23 08:00:00'),(3,3,4,'NV004','2022-09-24 02:15:00','2022-09-24 03:45:00'),(4,4,6,'NV005','2022-09-25 06:20:00','2022-09-25 07:30:00'),(5,5,2,'NV006','2022-09-26 09:45:00','2022-09-26 10:30:00'),(6,NULL,1,'NV003','2023-10-01 01:00:00','2023-10-01 01:00:00'),(7,NULL,1,NULL,'2025-05-19 01:45:35','2025-05-19 01:45:35'),(8,NULL,1,NULL,'2025-05-19 02:24:29','2025-05-19 02:24:29'),(9,NULL,1,NULL,'2025-05-19 02:24:29','2025-05-19 02:24:29'),(10,NULL,1,NULL,'2025-05-19 02:24:31','2025-05-19 02:24:31'),(11,NULL,1,NULL,'2025-05-19 02:24:36','2025-05-19 02:24:36'),(12,NULL,1,NULL,'2025-05-19 02:24:36','2025-05-19 02:24:36'),(13,NULL,18,NULL,'2025-05-19 02:30:33','2025-05-19 02:30:33'),(14,NULL,18,NULL,'2025-05-19 02:47:39','2025-05-19 02:47:39'),(15,NULL,18,NULL,'2025-05-19 03:00:35','2025-05-19 03:00:35'),(16,NULL,18,NULL,'2025-05-19 03:19:30','2025-05-19 03:19:30'),(17,NULL,1,NULL,'2025-05-20 15:55:11','2025-05-20 15:55:11'),(18,NULL,1,NULL,'2025-08-21 13:00:10','2025-08-21 13:00:10'),(19,NULL,19,NULL,'2025-09-11 14:59:52','2025-09-11 14:59:52'),(20,NULL,19,NULL,'2025-09-11 15:06:41','2025-09-11 15:06:41'),(21,NULL,19,NULL,'2025-09-11 15:16:28','2025-09-11 15:16:28'),(22,NULL,19,NULL,'2025-09-12 02:24:56','2025-09-12 02:24:56');
/*!40000 ALTER TABLE `chat_rooms` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `chitiethoadon`
--

DROP TABLE IF EXISTS `chitiethoadon`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `chitiethoadon` (
  `MaHD` int NOT NULL,
  `MaSP` int NOT NULL,
  `DonGia` double DEFAULT NULL,
  `SoLuong` int DEFAULT NULL,
  PRIMARY KEY (`MaSP`,`MaHD`),
  KEY `fk_chitiethoadon_hoadon` (`MaHD`),
  CONSTRAINT `fk_chitiethoadon_hoadon` FOREIGN KEY (`MaHD`) REFERENCES `hoadon` (`MaHD`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `FK_ChiTietHoaDon_SanPham` FOREIGN KEY (`MaSP`) REFERENCES `sanpham` (`MaSP`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `chitiethoadon`
--

LOCK TABLES `chitiethoadon` WRITE;
/*!40000 ALTER TABLE `chitiethoadon` DISABLE KEYS */;
INSERT INTO `chitiethoadon` VALUES (2,1,140000,1),(20,1,100000,2),(31,1,120000,1),(34,1,120000,3),(38,1,120000,1),(39,1,120000,2),(40,1,120000,2),(41,1,120000,2),(42,1,10000,2),(43,1,10000,2),(44,1,10000,2),(52,1,10000,2),(57,1,10000,2),(58,1,120000,2),(59,1,120000,1),(60,1,120000,2),(61,1,120000,2),(62,1,120000,2),(63,1,120000,2),(64,1,120000,2),(65,1,120000,2),(66,1,120000,2),(67,1,120000,2),(68,1,120000,2),(69,1,120000,2),(70,1,120000,2),(71,1,120000,2),(72,1,120000,2),(76,1,50000,2),(77,1,50000,2),(79,1,120000,1),(80,1,120000,1),(81,1,120000,1),(82,1,120000,1),(83,1,120000,1),(84,1,120000,1),(85,1,120000,1),(86,1,120000,1),(87,1,120000,1),(88,1,120000,1),(89,1,120000,1),(90,1,120000,1),(91,1,120000,1),(92,1,120000,1),(93,1,120000,2),(94,1,120000,1),(95,1,120000,1),(97,1,120000,2),(98,1,12000,1),(3,2,340000,1),(9,2,340000,3),(10,2,340000,3),(11,2,340000,3),(12,2,340000,3),(13,2,340000,4),(14,2,340000,4),(15,2,340000,1),(16,2,340000,2),(18,2,340000,1),(21,2,340000,3),(27,2,150000,1),(29,2,150000,1),(35,2,150000,1),(36,2,150000,3),(37,2,150000,1),(38,2,150000,10),(39,2,150000,1),(40,2,150000,1),(41,2,150000,1),(58,2,150000,1),(59,2,150000,1),(60,2,150000,1),(61,2,150000,1),(62,2,150000,1),(63,2,150000,1),(64,2,150000,1),(65,2,150000,1),(66,2,150000,1),(67,2,150000,1),(68,2,150000,1),(69,2,150000,1),(70,2,150000,1),(71,2,150000,1),(72,2,150000,1),(73,2,150000,1),(74,2,150000,1),(75,2,150000,1),(76,2,100000,1),(77,2,100000,1),(81,2,150000,1),(82,2,150000,1),(83,2,150000,1),(84,2,150000,1),(85,2,150000,1),(86,2,150000,1),(87,2,150000,1),(88,2,150000,1),(89,2,150000,1),(90,2,150000,1),(91,2,150000,1),(92,2,150000,1),(93,2,150000,1),(95,2,150000,1),(96,2,150000,1),(4,3,130000,1),(9,3,130000,1),(10,3,130000,1),(11,3,130000,1),(12,3,130000,1),(13,3,130000,1),(14,3,130000,1),(15,3,130000,1),(16,3,130000,1),(17,3,130000,2),(19,3,130000,1),(23,3,5,1),(30,3,5,1),(39,3,200000,1),(40,3,200000,1),(41,3,200000,1),(58,3,200000,1),(59,3,200000,1),(73,3,200000,2),(74,3,200000,2),(75,3,200000,2),(78,3,200000,1),(5,4,310000,1),(28,4,310000,1),(32,4,310000,1),(33,4,310000,1),(6,5,230000,1),(23,5,230000,2),(32,5,230000,1),(7,6,180000,1),(94,6,200000,1),(97,6,200000,1),(8,7,480000,1),(99,8,210000,1),(23,9,500000,1),(32,9,500000,1),(24,13,230000,1),(25,15,230000,1),(21,16,180000,3),(36,16,180000,1),(37,51,99000,1),(22,52,120000,1),(26,57,130000,2),(37,74,50000,21);
/*!40000 ALTER TABLE `chitiethoadon` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `chitietphieunhap`
--

DROP TABLE IF EXISTS `chitietphieunhap`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `chitietphieunhap` (
  `MaPN` int NOT NULL,
  `MaSP` int NOT NULL,
  `DonGiaNhap` double DEFAULT NULL,
  `SoLuong` int DEFAULT NULL,
  `TinhTrang` bit(1) DEFAULT NULL,
  PRIMARY KEY (`MaSP`,`MaPN`),
  CONSTRAINT `FK_ChiTietPhieuNhap_SanPham` FOREIGN KEY (`MaSP`) REFERENCES `sanpham` (`MaSP`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `chitietphieunhap`
--

LOCK TABLES `chitietphieunhap` WRITE;
/*!40000 ALTER TABLE `chitietphieunhap` DISABLE KEYS */;
INSERT INTO `chitietphieunhap` VALUES (18,1,12000,10,_binary ''),(1,2,250000,10,NULL),(11,3,5,2,_binary ''),(16,3,121000.00000000003,2,_binary ''),(19,3,120000,10,_binary ''),(20,3,138000,10000,_binary ''),(9,4,200000,2,NULL),(10,4,100000,1,NULL),(21,4,372000,10,_binary ''),(16,5,11000,2,_binary ''),(19,5,120000,10,_binary ''),(2,6,180000,10,NULL),(11,6,5,3,_binary ''),(13,6,2,1,_binary ''),(18,6,12000,10,_binary ''),(10,7,500000,4,NULL),(4,8,200000,10,NULL),(5,9,350000,10,NULL),(3,15,180000,20,NULL),(6,22,180000,30,NULL),(7,26,140000,20,NULL),(12,27,120000,4,_binary ''),(8,31,180000,10,NULL),(9,41,160000,20,NULL),(13,106,114.99999999999999,2,_binary '');
/*!40000 ALTER TABLE `chitietphieunhap` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `chitietquyen`
--

DROP TABLE IF EXISTS `chitietquyen`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `chitietquyen` (
  `MaCTQ` int NOT NULL AUTO_INCREMENT,
  `MaQuyen` int DEFAULT NULL,
  `MaCN` int DEFAULT NULL,
  `HanhDong` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `TinhTrang` bit(1) DEFAULT NULL,
  PRIMARY KEY (`MaCTQ`),
  KEY `FK_ChiTietQuyen_ChucNang` (`MaCN`),
  KEY `FK_ChiTietQuyen_NhomQuyen` (`MaQuyen`),
  CONSTRAINT `FK_ChiTietQuyen_ChucNang` FOREIGN KEY (`MaCN`) REFERENCES `chucnang` (`MaCN`),
  CONSTRAINT `FK_ChiTietQuyen_NhomQuyen` FOREIGN KEY (`MaQuyen`) REFERENCES `nhomquyen` (`MaNQ`)
) ENGINE=InnoDB AUTO_INCREMENT=57 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `chitietquyen`
--

LOCK TABLES `chitietquyen` WRITE;
/*!40000 ALTER TABLE `chitietquyen` DISABLE KEYS */;
INSERT INTO `chitietquyen` VALUES (1,1,1,'Đọc',_binary ''),(2,1,1,'Thêm',_binary ''),(3,1,1,'Xóa',_binary ''),(4,1,1,'Sửa',_binary ''),(5,1,2,'Đọc',_binary ''),(6,1,2,'Thêm',_binary ''),(7,1,2,'Xóa',_binary ''),(8,1,2,'Sửa',_binary ''),(9,2,3,'Đọc',_binary ''),(10,2,3,'Thêm',_binary ''),(11,2,3,'Xóa',_binary ''),(12,2,3,'Sửa',_binary ''),(13,2,4,'Đọc',_binary ''),(14,2,4,'Thêm',_binary ''),(15,2,4,'Xóa',_binary ''),(16,2,4,'Sửa',_binary ''),(17,2,5,'Đọc',_binary ''),(18,2,5,'Thêm',_binary ''),(19,2,5,'Xóa',_binary ''),(20,2,5,'Sửa',_binary ''),(21,2,6,'Đọc',_binary ''),(22,2,6,'Thêm',_binary ''),(23,2,6,'Xóa',_binary ''),(24,2,6,'Sửa',_binary ''),(25,3,7,'Đọc',_binary ''),(26,3,7,'Thêm',_binary ''),(27,3,7,'Xóa',_binary ''),(28,3,7,'Sửa',_binary ''),(29,1,8,'Đọc',_binary ''),(30,1,8,'Thêm',_binary ''),(31,1,8,'Xóa',_binary ''),(32,1,8,'Sửa',_binary ''),(33,3,9,'Đọc',_binary ''),(34,3,9,'Thêm',_binary ''),(35,3,9,'Xóa',_binary ''),(36,3,9,'Sửa',_binary ''),(37,1,10,'Đọc',_binary ''),(38,1,10,'Thêm',_binary ''),(39,1,10,'Xóa',_binary ''),(40,1,10,'Sửa',_binary ''),(41,2,11,'Đọc',_binary ''),(42,2,11,'Thêm',_binary ''),(43,2,11,'Xóa',_binary ''),(44,2,11,'Sửa',_binary ''),(45,3,12,'Đọc',_binary ''),(46,3,12,'Thêm',_binary ''),(47,3,12,'Sửa',_binary ''),(48,3,12,'Xóa',_binary ''),(49,1,13,'Thêm',_binary ''),(50,1,13,'Sửa',_binary ''),(51,1,13,'Đọc',_binary ''),(52,1,13,'Xóa',_binary ''),(53,1,14,'Đọc',_binary ''),(54,1,14,'Thêm',_binary ''),(55,1,14,'Sửa',_binary ''),(56,1,14,'Xóa',_binary '');
/*!40000 ALTER TABLE `chitietquyen` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `chucnang`
--

DROP TABLE IF EXISTS `chucnang`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `chucnang` (
  `MaCN` int NOT NULL AUTO_INCREMENT,
  `TenCN` varchar(50) DEFAULT NULL,
  `TinhTrang` bit(1) DEFAULT NULL,
  PRIMARY KEY (`MaCN`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `chucnang`
--

LOCK TABLES `chucnang` WRITE;
/*!40000 ALTER TABLE `chucnang` DISABLE KEYS */;
INSERT INTO `chucnang` VALUES (1,'Tài khoản',_binary ''),(2,'Phân quyền',_binary ''),(3,'Sản phẩm',_binary ''),(4,'Khách Hàng',_binary ''),(5,'Thể Loại',_binary ''),(6,'Phiếu nhập',_binary ''),(7,'Hóa đơn',_binary ''),(8,'Nhân viên',_binary ''),(9,'Nhà cung cấp',_binary ''),(10,'Thống kê',_binary ''),(11,'Thể Loại',_binary ''),(12,'Tác Giả',_binary ''),(13,'Tính Lương',_binary ''),(14,'Nghĩ Phép',_binary '');
/*!40000 ALTER TABLE `chucnang` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ct_khuyen_mai`
--

DROP TABLE IF EXISTS `ct_khuyen_mai`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ct_khuyen_mai` (
  `MaCTKM` int NOT NULL AUTO_INCREMENT,
  `MaKM` int NOT NULL,
  `PhanTramGiam` decimal(5,2) DEFAULT NULL COMMENT 'Ví dụ: 10.5%',
  `SoTienGiam` decimal(12,2) DEFAULT NULL COMMENT 'Số tiền giảm trực tiếp',
  `GiaTriDonToiThieu` decimal(12,2) DEFAULT NULL COMMENT 'Áp dụng cho đơn hàng từ X đồng',
  `GiamToiDa` decimal(12,2) DEFAULT NULL COMMENT 'Giới hạn số tiền giảm tối đa',
  `SoLuongMua` int DEFAULT NULL COMMENT 'Cho chương trình mua X tặng Y',
  `SoLuongTang` int DEFAULT NULL COMMENT 'Cho chương trình mua X tặng Y',
  `MaSPTang` int DEFAULT NULL COMMENT 'Mã SP được tặng nếu có',
  PRIMARY KEY (`MaCTKM`),
  KEY `MaKM` (`MaKM`),
  KEY `MaSPTang` (`MaSPTang`),
  CONSTRAINT `ct_khuyen_mai_ibfk_1` FOREIGN KEY (`MaKM`) REFERENCES `khuyen_mai` (`MaKM`),
  CONSTRAINT `ct_khuyen_mai_ibfk_2` FOREIGN KEY (`MaSPTang`) REFERENCES `sanpham` (`MaSP`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ct_khuyen_mai`
--

LOCK TABLES `ct_khuyen_mai` WRITE;
/*!40000 ALTER TABLE `ct_khuyen_mai` DISABLE KEYS */;
INSERT INTO `ct_khuyen_mai` VALUES (7,1,20.00,NULL,NULL,NULL,NULL,NULL,NULL),(8,2,NULL,8.00,2.00,NULL,NULL,NULL,NULL),(9,3,NULL,NULL,NULL,NULL,1,1,NULL),(10,4,NULL,NULL,NULL,NULL,NULL,NULL,9),(11,5,30.00,NULL,NULL,NULL,NULL,NULL,NULL),(12,6,50.00,NULL,NULL,500000.00,NULL,NULL,NULL),(13,8,2.00,NULL,NULL,NULL,NULL,NULL,NULL);
/*!40000 ALTER TABLE `ct_khuyen_mai` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `decentralization`
--

DROP TABLE IF EXISTS `decentralization`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `decentralization` (
  `role_id` bigint NOT NULL,
  `module_id` bigint NOT NULL,
  `function_id` bigint NOT NULL,
  PRIMARY KEY (`role_id`,`module_id`,`function_id`),
  KEY `fk_decentralization_module` (`module_id`),
  KEY `fk_decentralization_function` (`function_id`),
  CONSTRAINT `fk_decentralization_function` FOREIGN KEY (`function_id`) REFERENCES `function` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_decentralization_module` FOREIGN KEY (`module_id`) REFERENCES `module` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_decentralization_role` FOREIGN KEY (`role_id`) REFERENCES `role` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `decentralization`
--

LOCK TABLES `decentralization` WRITE;
/*!40000 ALTER TABLE `decentralization` DISABLE KEYS */;
/*!40000 ALTER TABLE `decentralization` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `diachi`
--

DROP TABLE IF EXISTS `diachi`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `diachi` (
  `MakH` int DEFAULT NULL,
  `TenNguoiNhan` varchar(100) NOT NULL,
  `SDT` varchar(15) NOT NULL,
  `DiaChiChiTiet` text NOT NULL,
  `TinhThanh` varchar(50) DEFAULT NULL,
  `QuanHuyen` varchar(50) DEFAULT NULL,
  `PhuongXa` varchar(50) DEFAULT NULL,
  `MacDinh` tinyint(1) DEFAULT '0',
  `MaDiaChi` int NOT NULL AUTO_INCREMENT,
  PRIMARY KEY (`MaDiaChi`),
  KEY `MaKH` (`MakH`),
  CONSTRAINT `diachi_ibfk_1` FOREIGN KEY (`MakH`) REFERENCES `khachhang` (`makh`)
) ENGINE=InnoDB AUTO_INCREMENT=94075146 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `diachi`
--

LOCK TABLES `diachi` WRITE;
/*!40000 ALTER TABLE `diachi` DISABLE KEYS */;
INSERT INTO `diachi` VALUES (1,'Nguyễn Văn A','0912345678','Số 12, Đường Lê Lợi','Hà Nội','Quận Hoàn Kiếm','Phường Hàng Trống',1,1),(2,'Trần Thị B','0987654321','45 Đường Hai Bà Trưng','TP.HCM','Quận 1','Phường Bến Nghé',0,2),(1,'Lê Văn C','0905123456','78/4 Đường Trần Hưng Đạo','Đà Nẵng','Quận Hải Châu','Phường Thuận Phước',1,3),(2,'Phạm Thị D','0978123456','Khu phố 5, Đường Nguyễn Văn Linh','Cần Thơ','Quận Ninh Kiều','Phường An Bình',0,4),(1,'Hoai Bao','0374170367','4567','Tỉnh Bắc Giang','Huyện Yên Thế','Xã Đồng Kỳ',0,6),(1,'Hoai Bao','0374170367','4567','Tỉnh Bắc Giang','Huyện Yên Thế','Xã Đồng Kỳ',0,7),(1,'Hoai Bao','0374170367','4567','Tỉnh Bắc Giang','Huyện Yên Thế','Xã Đồng Kỳ',0,8),(1,'Hoai Bao','0374170367','4567','Tỉnh Phú Thọ','Huyện Phù Ninh','Xã Gia Thanh',0,9),(12,'Hoai Bao','0374170367','77777','Tỉnh Tuyên Quang','Huyện Na Hang','Xã Đà Vị',0,10),(12,'Hoai Bao','0374170367','77777','Tỉnh Phú Thọ','Huyện Hạ Hoà','Xã Hiền Lương',0,11),(12,'tran hhh','0987654321','4567','Tỉnh Phú Thọ','Huyện Thanh Thuỷ','Thị trấn Thanh Thủy',0,12),(3,'luân','0987654321','77777','Tỉnh Tiền Giang','Thị xã Cai Lậy','Xã Mỹ Hạnh Trung',0,11524671),(1,'Hoai Bao','0374170367','23453','Tỉnh Sơn La','Huyện Mộc Châu','Xã Tà Lai',0,12402310),(12,'Hoai Bao','0374170367','112222','Tỉnh Phú Thọ','Huyện Cẩm Khê','Xã Phú Khê',0,13418801),(1,'hoai','0876564325','123 hoai bao hiuy','Tỉnh Bắc Kạn','Huyện Ba Bể','Xã Chu Hương',0,16430975),(15,'nguyen van ba','1231231231','12212121212','Tỉnh Lai Châu','Huyện Sìn Hồ','Xã Pa Khoá',0,23433736),(1,'Hoai Bao','0374170367','tân mỹ tân thuận tay','Tỉnh Lai Châu','Huyện Sìn Hồ','Xã Noong Hẻo',0,25467152),(19,'Hoaibao','0876564325','vv','Tỉnh Vĩnh Phúc','Huyện Yên Lạc','Xã Hồng Châu',0,27264323),(19,'Trần\'s Team','0876564325','dffdfd','Tỉnh Bắc Giang','Huyện Lục Ngạn','Xã Tân Quang',0,29928815),(19,'Trần\'s Team','0876564325','dffdfd','Tỉnh Bắc Giang','Huyện Lục Ngạn','Xã Tân Quang',0,32805545),(19,'Hoaibao','0876564325','fgfgfg','Tỉnh Quảng Ninh','Huyện Ba Chẽ','Xã Thanh Lâm',0,35671169),(19,'hoai','0876564325','đfdfd','Tỉnh Quảng Ninh','Thành phố Đông Triều','Phường Hưng Đạo',0,45668539),(1,'Hoai Bao','0374170367','2121232132','Tỉnh Lạng Sơn','Huyện Cao Lộc','Xã Hải Yến',0,46896064),(1,'Hoai Bao','0374170367','123456','Tỉnh Thái Nguyên','Huyện Đồng Hỷ','Xã Hòa Bình',0,48960082),(1,'Hoai Bao','0374170367','4567','Tỉnh Bắc Ninh','Thành phố Bắc Ninh','Phường Phong Khê',0,53458613),(1,'Hoai Bao','0374170367','êrer','Tỉnh Lạng Sơn','Huyện Văn Lãng','Xã Thành Hòa',0,54050035),(19,'hoai','0876564325','đfdfd','Tỉnh Quảng Ninh','Thành phố Đông Triều','Phường Hưng Đạo',0,58523825),(18,'gbgb','0987654321','12/5','Thành phố Hồ Chí Minh','Quận 5','Phường 5',0,64629926),(17,'acccc55','1112842348','tân mỹ tân thuận tay','Tỉnh Tuyên Quang','Huyện Yên Sơn','Xã Kim Quan',0,65002948),(18,'hoàigfg','0987654321','mỹ hạnh đông','Tỉnh Tiền Giang','Thị xã Cai Lậy','Xã Mỹ Hạnh Đông',0,66172882),(1,'Hoai Bao','0374170367','2323','Tỉnh Lạng Sơn','Huyện Hữu Lũng','Xã Cai Kinh',0,68910756),(6,'Hoai Bao','0374170367','tân mỹ tân thuận tay','Tỉnh Phú Thọ','Huyện Cẩm Khê','Xã Phú Khê',0,72803019),(1,'Hoai Bao','0374170367','dfdf','Tỉnh Hải Dương','Huyện Kim Thành','Xã Hòa Bình',0,73199938),(1,'Hoai Bao','0374170367','2121232132','Tỉnh Lạng Sơn','Huyện Bình Gia','Xã Hòa Bình',0,73742162),(19,'Trần\'s Team','0876564325','dffdfd','Tỉnh Bắc Giang','Huyện Lục Ngạn','Xã Tân Quang',0,74166783),(1,'Hoai Bao','0374170367','tân mỹ tân thuận tay','Tỉnh Hoà Bình','Huyện Cao Phong','Xã Thung Nai',0,74520137),(19,'Trần\'s Team','0876564325','dffdfd','Tỉnh Bắc Giang','Huyện Lục Ngạn','Xã Tân Quang',0,74579441),(16,'acccc','1112342348','tân mỹ tân thuận tay','Tỉnh Lạng Sơn','Huyện Văn Quan','Xã Tri Lễ',0,85967164),(1,'Nguyen Van A','0123456789','123 Đường Láng','Hà Nội','Cầu Giấy','Dịch Vọng',0,86824171),(1,'Hoai Bao','0374170367','tân mỹ tân thuận tay','Tỉnh Thái Nguyên','Huyện Phú Lương','Xã Ôn Lương',0,87473113),(1,'Hoai Bao','0374170367','234','Tỉnh Quảng Ninh','Huyện Đầm Hà','Xã Quảng An',0,89061682),(1,'Hoai Bao','0374170367','4567','Tỉnh Quảng Ninh','Huyện Hải Hà','Xã Quảng Thành',0,94075090),(NULL,'hoai','0876564325','123 hoai bao hiuy','Tỉnh Lạng Sơn','Huyện Bình Gia','Xã Hoàng Văn Thụ',0,94075091),(NULL,'hoai','0876564325','123 hoai bao hiuy','Tỉnh Lạng Sơn','Huyện Bắc Sơn','Xã Chiến Thắng',0,94075092),(NULL,'hoai','0876564325','123 hoai bao hiuy','Tỉnh Lạng Sơn','Huyện Hữu Lũng','Xã Cai Kinh',0,94075093),(NULL,'Nguyen Van A','0901234567','123 Đường ABC','01','001','00001',0,94075095),(NULL,'Nguyen Van A','0901234567','123 Đường ABC','01','001','00001',0,94075096),(NULL,'Nguyen Van A','0901234567','123 Đường ABC','01','001','00001',0,94075097),(NULL,'Nguyen Van A','0901234567','123 Đường ABC','01','001','00001',0,94075105),(NULL,'Nguyen Van A','0901234567','123 Đường ABC','01','001','00001',0,94075110),(NULL,'Hoaibao','0876564325','123 hoai bao hiuy','Tỉnh Vĩnh Phúc','Huyện Tam Dương','Xã Hướng Đạo',0,94075111),(NULL,'Hoaibao','0876564325','dffdfd','Tỉnh Thái Nguyên','Huyện Định Hóa','Xã Bình Yên',0,94075112),(NULL,'Hoaibao','0876564325','123 hoai bao hiuy','Tỉnh Cao Bằng','Huyện Bảo Lạc','Xã Huy Giáp',0,94075113),(NULL,'hoai','0876564325','123 hoai bao hiuy','Tỉnh Bắc Giang','Huyện Lạng Giang','Xã Tân Thanh',0,94075114),(NULL,'hoai','0876564325','123 hoai bao hiuy','Tỉnh Bắc Kạn','Huyện Ngân Sơn','Xã Trung Hoà',0,94075115),(NULL,'hoai','0876564325','vv','Tỉnh Vĩnh Phúc','Huyện Yên Lạc','Xã Nguyệt Đức',0,94075116),(NULL,'Hoaibao','0876564325','123 hoai bao hiuy','Tỉnh Lạng Sơn','Huyện Chi Lăng','Xã Hữu Kiên',0,94075117),(NULL,'Hoaibao','0876564325','123 hoai bao hiuy','Tỉnh Lạng Sơn','Huyện Chi Lăng','Xã Hữu Kiên',0,94075118),(NULL,'hoai','0876564325','dffdfd','Tỉnh Hải Dương','Huyện Gia Lộc','Xã Thống Kênh',0,94075119),(NULL,'hoai','0876564325','dffdfd','Tỉnh Hải Dương','Huyện Gia Lộc','Xã Thống Kênh',0,94075120),(NULL,'Hoaibao','0876564325','123 hoai bao hiuy','Tỉnh Vĩnh Phúc','Huyện Vĩnh Tường','Thị trấn Tứ Trưng',0,94075121),(NULL,'hoai','0876564325','fgfgg','Tỉnh Lạng Sơn','Huyện Chi Lăng','Xã Hữu Kiên',0,94075122),(NULL,'hoai','0876564325','fgfgg','Tỉnh Tuyên Quang','Huyện Na Hang','Xã Thượng Giáp',0,94075123),(NULL,'hoai','0876564325','123 hoai bao hiuy','Tỉnh Quảng Ninh','Huyện Ba Chẽ','Thị trấn Ba Chẽ',0,94075124),(NULL,'hoai','0876564325','dfdff','Tỉnh Phú Thọ','Huyện Tam Nông','Xã Lam Sơn',0,94075125),(NULL,'hoai','0876564325','fgfgfg','Tỉnh Phú Thọ','Huyện Tam Nông','Xã Dị Nậu',0,94075126),(NULL,'hoai','0876564325','fgfgfg','Tỉnh Lào Cai','Huyện Mường Khương','Xã Lùng Vai',0,94075127),(NULL,'hoai','0876564325','fgfgfg','Tỉnh Bắc Kạn','Huyện Ngân Sơn','Xã Cốc Đán',0,94075128),(NULL,'Nguyen Van A','0123456789','123 Đường Láng','Hà Nội','Đống Đa','Cát Linh',0,94075130),(NULL,'Nguyen Van A','0123456789','123 Đường Láng','Hà Nội','Đống Đa','Cát Linh',0,94075131),(NULL,'hoai','0876564325','fgfgfg','Tỉnh Thái Nguyên','Thành phố Sông Công','Phường Mỏ Chè',0,94075132),(NULL,'hoai','0876564325','12345678','Tỉnh Phú Thọ','Huyện Tam Nông','Xã Tề Lễ',0,94075133),(19,'Hoaibao','0876564325','dffdfd','Tỉnh Vĩnh Phúc','Huyện Yên Lạc','Xã Liên Châu',0,94075134),(18,'Hoaibao','0876564325','vvcvc','Tỉnh Phú Thọ','Huyện Thanh Sơn','Xã Yên Lãng',0,94075135),(19,'hoai','0876564325','vfgfg','Tỉnh Vĩnh Phúc','Huyện Yên Lạc','Xã Yên Phương',0,94075136),(19,'tran văn an','0984543456','vv','Tỉnh Phú Thọ','Huyện Hạ Hoà','Xã Lang Sơn',0,94075137),(19,'Hoaibao','0876564325','123 hoai bao hiuy','Tỉnh Bắc Giang','Huyện Lục Ngạn','Xã Tân Lập',0,94075138),(19,'hoai','0876564325','vvcvc','24','219','7588',0,94075139),(19,'Trần\'s Team','0876564325','22323','22','202','6979',0,94075140),(19,'Trần\'s Teffam','0876564325','22323','22','202','6979',0,94075141),(19,'Hoaibao','0876564325','vvcvc','24','216','7357',0,94075142),(19,'Trần\'s Team','0984543456','fgfgfg','8','73','2347',0,94075143),(19,'tran văn an','0984543456','2345','22','200','6913',0,94075144),(19,'hoai','0876564325','232323','26','249','8968',0,94075145);
/*!40000 ALTER TABLE `diachi` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `discount`
--

DROP TABLE IF EXISTS `discount`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `discount` (
  `id` bigint NOT NULL,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `status` bit(1) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `discount`
--

LOCK TABLES `discount` WRITE;
/*!40000 ALTER TABLE `discount` DISABLE KEYS */;
/*!40000 ALTER TABLE `discount` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `discount_detail`
--

DROP TABLE IF EXISTS `discount_detail`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `discount_detail` (
  `discount_id` bigint NOT NULL,
  `product_id` bigint NOT NULL,
  `percent` double DEFAULT NULL,
  PRIMARY KEY (`discount_id`,`product_id`),
  KEY `fk_discount_detail_product` (`product_id`),
  CONSTRAINT `fk_discount_detail_discount` FOREIGN KEY (`discount_id`) REFERENCES `discount` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_discount_detail_product` FOREIGN KEY (`product_id`) REFERENCES `product` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `discount_detail`
--

LOCK TABLES `discount_detail` WRITE;
/*!40000 ALTER TABLE `discount_detail` DISABLE KEYS */;
/*!40000 ALTER TABLE `discount_detail` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `export_detail`
--

DROP TABLE IF EXISTS `export_detail`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `export_detail` (
  `export_id` bigint NOT NULL,
  `shipment_id` bigint NOT NULL,
  `quantity` double DEFAULT NULL,
  `reason` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`export_id`,`shipment_id`) USING BTREE,
  KEY `fk_export_detail` (`shipment_id`),
  CONSTRAINT `fk_export_detail` FOREIGN KEY (`shipment_id`) REFERENCES `shipment` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_export_detail_export_note` FOREIGN KEY (`export_id`) REFERENCES `export_note` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `export_detail`
--

LOCK TABLES `export_detail` WRITE;
/*!40000 ALTER TABLE `export_detail` DISABLE KEYS */;
/*!40000 ALTER TABLE `export_detail` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `export_note`
--

DROP TABLE IF EXISTS `export_note`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `export_note` (
  `id` bigint NOT NULL,
  `staff_id` bigint DEFAULT NULL,
  `total` double DEFAULT NULL,
  `invoice_date` date DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_export_note_staff` (`staff_id`),
  CONSTRAINT `fk_export_note_staff` FOREIGN KEY (`staff_id`) REFERENCES `staff` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `export_note`
--

LOCK TABLES `export_note` WRITE;
/*!40000 ALTER TABLE `export_note` DISABLE KEYS */;
/*!40000 ALTER TABLE `export_note` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `function`
--

DROP TABLE IF EXISTS `function`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `function` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `function`
--

LOCK TABLES `function` WRITE;
/*!40000 ALTER TABLE `function` DISABLE KEYS */;
INSERT INTO `function` VALUES (1,'view'),(2,'add'),(3,'edit'),(4,'remove'),(5,'detail'),(6,'excel'),(7,'pdf');
/*!40000 ALTER TABLE `function` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `giohang`
--

DROP TABLE IF EXISTS `giohang`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `giohang` (
  `MaGH` int NOT NULL AUTO_INCREMENT,
  `MaKH` int NOT NULL,
  `MaSP` int NOT NULL,
  `SoLuong` int NOT NULL DEFAULT '1',
  `Selected` tinyint(1) DEFAULT '1',
  `NgayThem` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`MaGH`),
  UNIQUE KEY `unique_cart_item` (`MaKH`,`MaSP`),
  KEY `MaSP` (`MaSP`),
  CONSTRAINT `giohang_ibfk_1` FOREIGN KEY (`MaKH`) REFERENCES `khachhang` (`makh`) ON DELETE CASCADE,
  CONSTRAINT `giohang_ibfk_2` FOREIGN KEY (`MaSP`) REFERENCES `sanpham` (`MaSP`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=53 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `giohang`
--

LOCK TABLES `giohang` WRITE;
/*!40000 ALTER TABLE `giohang` DISABLE KEYS */;
INSERT INTO `giohang` VALUES (6,2,1,3,1,'2025-09-10 11:07:15'),(9,2,2,2,0,'2025-09-10 11:29:03'),(11,2,8,1,1,'2025-09-10 11:29:09');
/*!40000 ALTER TABLE `giohang` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `giohang_chitiet`
--

DROP TABLE IF EXISTS `giohang_chitiet`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `giohang_chitiet` (
  `MaCTGH` int NOT NULL AUTO_INCREMENT,
  `MaKH` int NOT NULL,
  `MaSP` int NOT NULL,
  `SoLuong` int NOT NULL DEFAULT '1',
  `NgayThem` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`MaCTGH`),
  UNIQUE KEY `unique_cart_item` (`MaKH`,`MaSP`),
  KEY `MaSP` (`MaSP`),
  CONSTRAINT `giohang_chitiet_ibfk_1` FOREIGN KEY (`MaKH`) REFERENCES `khachhang` (`makh`) ON DELETE CASCADE,
  CONSTRAINT `giohang_chitiet_ibfk_2` FOREIGN KEY (`MaSP`) REFERENCES `sanpham` (`MaSP`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `giohang_chitiet`
--

LOCK TABLES `giohang_chitiet` WRITE;
/*!40000 ALTER TABLE `giohang_chitiet` DISABLE KEYS */;
/*!40000 ALTER TABLE `giohang_chitiet` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `hoadon`
--

DROP TABLE IF EXISTS `hoadon`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `hoadon` (
  `MaHD` int NOT NULL AUTO_INCREMENT,
  `TenTK` varchar(20) DEFAULT NULL,
  `NgayTao` date DEFAULT NULL,
  `TongTien` double DEFAULT NULL,
  `makh` int DEFAULT NULL,
  `tinhtrang` varchar(50) NOT NULL DEFAULT 'Chờ xử lý',
  `MaDiaChi` int DEFAULT NULL,
  `PhuongThucThanhToan` varchar(50) NOT NULL DEFAULT 'COD',
  `GhiChu` text,
  `TrangThaiThanhToan` varchar(50) DEFAULT 'Chưa thanh toán',
  PRIMARY KEY (`MaHD`),
  KEY `FK_HoaDon_TaiKhoan` (`TenTK`),
  KEY `makh` (`makh`),
  KEY `fk_hoadon_diachi` (`MaDiaChi`),
  CONSTRAINT `fk_hoadon_diachi` FOREIGN KEY (`MaDiaChi`) REFERENCES `diachi` (`MaDiaChi`),
  CONSTRAINT `FK_HoaDon_TaiKhoan` FOREIGN KEY (`TenTK`) REFERENCES `taikhoan` (`TenTK`),
  CONSTRAINT `hoadon_ibfk_1` FOREIGN KEY (`makh`) REFERENCES `khachhang` (`makh`)
) ENGINE=InnoDB AUTO_INCREMENT=100 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `hoadon`
--

LOCK TABLES `hoadon` WRITE;
/*!40000 ALTER TABLE `hoadon` DISABLE KEYS */;
INSERT INTO `hoadon` VALUES (1,'NV004','2023-03-30',140000,1,'Chờ xử lý',1,'COD',NULL,'Chưa thanh toán'),(2,'NV002','2022-09-23',340000,1,'Chờ xử lý',2,'COD',NULL,'Chưa thanh toán'),(3,'NV004','2022-09-24',130000,4,'Đã xác nhận',2,'COD',NULL,'Chưa thanh toán'),(4,'NV004','2022-09-25',310000,6,'Đã xác nhận',1,'COD',NULL,'Chưa thanh toán'),(5,'NV004','2022-09-26',230000,2,'Đang giao hàng',3,'COD',NULL,'Chưa thanh toán'),(6,'NV004','2022-09-27',180000,2,'Chờ xử lý',3,'COD',NULL,'Chưa thanh toán'),(7,'NV004','2022-09-28',480000,6,'Đã hủy',3,'COD',NULL,'Chưa thanh toán'),(8,'NV004','2022-09-29',210000,6,'Chờ xử lý',2,'COD',NULL,'Chưa thanh toán'),(9,NULL,NULL,1150000,1,'Chờ xử lý',6,'COD','fghj','Chưa thanh toán'),(10,NULL,NULL,1150000,1,'Chờ xử lý',7,'COD','fghj','Chưa thanh toán'),(11,NULL,NULL,1150000,1,'Chờ xử lý',8,'COD','fghj','Chưa thanh toán'),(12,NULL,NULL,1150000,1,'Chờ xử lý',9,'COD','bao','Chưa thanh toán'),(13,NULL,NULL,1490000,12,'Chờ xử lý',10,'COD','mnbf','Chưa thanh toán'),(14,NULL,NULL,1490000,12,'Chờ xử lý',11,'COD','bao','Chưa thanh toán'),(15,NULL,NULL,470000,12,'Chờ xử lý',12,'COD','tràn hoai bao dep trai','Chưa thanh toán'),(16,NULL,NULL,810000,12,'Chờ xử lý',13418801,'COD','rfffdfdfd','Chưa thanh toán'),(17,NULL,NULL,260000,15,'Chờ xử lý',23433736,'COD','giao vào giờ trưa','Chưa thanh toán'),(18,NULL,NULL,340000,16,'Chờ xử lý',85967164,'COD','giao trua nhe','Chưa thanh toán'),(19,NULL,NULL,130000,17,'Chờ xử lý',65002948,'COD','giao trua nhe7uu','Chưa thanh toán'),(20,NULL,NULL,200000,1,'Chờ xử lý',86824171,'COD','Giao hàng nhanh','Chưa thanh toán'),(21,NULL,NULL,1560000,6,'Đã giao hàng',72803019,'COD','dfghjk','Đã thanh toán'),(22,NULL,NULL,120000,1,'Đã giao hàng',87473113,'COD','hoài bao','Đã thanh toán'),(23,NULL,NULL,960005,1,'Đã giao hàng',48960082,'COD','FFFVFGF','Đã thanh toán'),(24,NULL,NULL,230000,1,'Đã giao hàng',53458613,'COD','hoai bao dep trai','Đã thanh toán'),(25,NULL,NULL,230000,1,'Đã giao hàng',89061682,'COD','hoai bao','Chưa thanh toán'),(26,NULL,NULL,260000,1,'Đã giao hàng',54050035,'COD','test','Chưa thanh toán'),(27,NULL,NULL,150000,1,'Đã giao hàng',73199938,'COD','sghj','Đã nhận tiền'),(28,NULL,NULL,310000,1,'Chờ xử lý',74520137,'COD','hoai  ghghg','Chưa thanh toán'),(29,NULL,NULL,150000,1,'Chờ xử lý',12402310,'COD','ddfdfgfgf','Chưa thanh toán'),(30,NULL,NULL,5,1,'Đã hủy',94075090,'COD','FFFGFGFG\nLý do hủy: gggg','Chưa thanh toán'),(31,NULL,'2025-05-16',120000,1,'Đã hủy',46896064,'COD','rfgfgfg\nLý do hủy: huy đon c hoi','Chưa thanh toán'),(32,NULL,'2025-05-16',1040000,1,'Đã giao hàng',25467152,'COD','rrtrtrt','Đã nhận tiền'),(33,NULL,'2025-05-17',310000,1,'Đã hủy',68910756,'COD','dsdsdsd\nLý do hủy: mua cc','Chưa thanh toán'),(34,NULL,'2025-05-18',360000,3,'Chờ xử lý',11524671,'COD','giao hàng vào buổi trưa','Chưa thanh toán'),(35,NULL,'2025-05-19',150000,18,'Chờ xử lý',66172882,'COD','fgfgfs','Chưa thanh toán'),(36,NULL,'2025-05-19',630000,18,'Chờ xử lý',64629926,'COD','dfdf','Chưa thanh toán'),(37,NULL,'2025-05-19',1299000,1,'Đã hủy',73742162,'COD','kjhg\nLý do hủy: Không có lý do','Chưa thanh toán'),(38,NULL,'2025-09-05',1620000,1,'Chờ xử lý',16430975,'BANK','hgf','Chờ thanh toán'),(39,NULL,NULL,590000,1,'Chờ xử lý',94075091,'VNPay','fggfgfg','Chưa thanh toán'),(40,NULL,NULL,590000,1,'Chờ xử lý',94075092,'VNPay','fggfgfg','Chưa thanh toán'),(41,NULL,NULL,590000,1,'Chờ xử lý',94075093,'VNPay','fdfd','Chưa thanh toán'),(42,NULL,NULL,20000,3,'Chờ xử lý',94075095,'VNPay','Giao hàng nhanh','Chưa thanh toán'),(43,NULL,NULL,20000,3,'Chờ xử lý',94075096,'VNPay','Giao hàng nhanh','Chưa thanh toán'),(44,NULL,NULL,20000,3,'Chờ xử lý',94075097,'VNPay','Giao hàng nhanh','Chưa thanh toán'),(52,NULL,NULL,20000,3,'Chờ xử lý',94075105,'VNPay','Giao hàng nhanh','Chưa thanh toán'),(57,NULL,NULL,20000,3,'Chờ xử lý',94075110,'VNPay','Giao hàng nhanh','Chưa thanh toán'),(58,NULL,NULL,590000,1,'Chờ xử lý',94075111,'VNPay','fgfgfgf','Chưa thanh toán'),(59,NULL,NULL,470000,1,'Chờ xử lý',94075112,'VNPay','ffdfdf','Chưa thanh toán'),(60,NULL,NULL,390000,1,'Chờ xử lý',94075113,'VNPay','dfd','Chưa thanh toán'),(61,NULL,NULL,390000,1,'Chờ xử lý',94075114,'VNPay','fffg','Chưa thanh toán'),(62,NULL,NULL,390000,1,'Chờ xử lý',94075115,'VNPay','fffg','Chưa thanh toán'),(63,NULL,NULL,390000,1,'Chờ xử lý',94075116,'VNPay','cvcvc','Chưa thanh toán'),(64,NULL,NULL,390000,1,'Chờ xử lý',94075117,'VNPay','cvcv','Chưa thanh toán'),(65,NULL,NULL,390000,1,'Chờ xử lý',94075118,'VNPay','cvcv','Chưa thanh toán'),(66,NULL,NULL,390000,1,'Chờ xử lý',94075119,'VNPay','ffgfgf','Chưa thanh toán'),(67,NULL,NULL,390000,1,'Chờ xử lý',94075120,'VNPay','ffgfgf','Chưa thanh toán'),(68,NULL,NULL,390000,1,'Chờ xử lý',94075121,'VNPay','đf','Chưa thanh toán'),(69,NULL,NULL,390000,1,'Chờ xử lý',94075122,'VNPay','fggf','Chưa thanh toán'),(70,NULL,NULL,390000,1,'Chờ xử lý',94075123,'VNPay','fggf','Chưa thanh toán'),(71,NULL,NULL,390000,1,'Chờ xử lý',94075124,'VNPay','dffdfd','Chưa thanh toán'),(72,NULL,NULL,390000,1,'Chờ xử lý',94075125,'VNPay','fdfdf','Chưa thanh toán'),(73,NULL,NULL,550000,1,'Chờ xử lý',94075126,'VNPay','fgfgf','Chưa thanh toán'),(74,NULL,NULL,550000,1,'Chờ xử lý',94075127,'VNPay','fgfgf','Chưa thanh toán'),(75,NULL,NULL,550000,1,'Chờ xử lý',94075128,'VNPay','fgfgf','Chưa thanh toán'),(76,NULL,NULL,200000,1,'Chờ xử lý',94075130,'VNPay','Giao hàng nhanh','Chưa thanh toán'),(77,NULL,NULL,200000,3,'Chờ xử lý',94075131,'VNPay','Giao hàng nffhanh','Chưa thanh toán'),(78,NULL,NULL,200000,19,'Chờ xử lý',94075132,'VNPay','dffđ','Chưa thanh toán'),(79,NULL,NULL,120000,19,'Chờ xử lý',94075133,'VNPay','tggfhghg','Chưa thanh toán'),(80,NULL,'2025-09-09',120000,19,'Chờ xử lý',35671169,'VNPAY','dfdfdf','Chưa thanh toán'),(81,NULL,'2025-09-09',270000,19,'Chờ xử lý',32805545,'VNPAY','fgfgfgf','Chưa thanh toán'),(82,NULL,'2025-09-09',270000,19,'Chờ xử lý',74166783,'VNPAY','fgfgfgf','Chưa thanh toán'),(83,NULL,'2025-09-09',270000,19,'Chờ xử lý',74579441,'VNPAY','fgfgfgf','Chưa thanh toán'),(84,NULL,'2025-09-09',270000,19,'Chờ xử lý',29928815,'VNPAY','fgfgfgf','Chưa thanh toán'),(85,NULL,'2025-09-09',270000,19,'Chờ xử lý',27264323,'VNPAY','xcxcc','Chưa thanh toán'),(86,NULL,'2025-09-09',270000,19,'Chờ xử lý',58523825,'VNPAY','đfdfd','Chưa thanh toán'),(87,NULL,'2025-09-09',270000,19,'Chờ xử lý',45668539,'VNPAY','đfdfd','Chưa thanh toán'),(88,NULL,'2025-09-09',270000,19,'Đã xác nhận',94075134,'VNPAY','ffgfgf','Chưa thanh toán'),(89,NULL,'2025-09-09',270000,18,'Chờ xử lý',94075135,'VNPAY','dfdf','Chưa thanh toán'),(90,NULL,'2025-09-09',270000,19,'Chờ xử lý',94075136,'VNPAY','êr','Chưa thanh toán'),(91,NULL,'2025-09-10',270000,19,'Đã hủy',94075137,'VNPAY','fggf\nLý do hủy: không mua nữa','Chưa thanh toán'),(92,NULL,'2025-09-10',270000,19,'Chờ xử lý',94075138,'VNPAY','ffd','Chưa thanh toán'),(93,NULL,'2025-09-10',390000,19,'Chờ xử lý',94075139,'VNPAY',NULL,'Chưa thanh toán'),(94,NULL,'2025-09-10',320000,19,'Chờ xử lý',94075140,'VNPAY',NULL,'Chưa thanh toán'),(95,NULL,'2025-09-10',270000,19,'Đã xác nhận',94075141,'VNPAY',NULL,'Chưa thanh toán'),(96,NULL,'2025-09-10',150000,19,'Chờ xử lý',94075142,'VNPAY',NULL,'Chưa thanh toán'),(97,NULL,'2025-09-10',440000,19,'Đã xác nhận',94075143,'VNPAY',NULL,'Chưa thanh toán'),(98,NULL,'2025-09-11',12000,19,'Đang giao hàng',94075144,'VNPAY',NULL,'Chưa thanh toán'),(99,NULL,'2025-09-11',210000,19,'Đã hủy',94075145,'COD','\nLý do hủy: tôi không muốn mua nữa','Chưa thanh toán');
/*!40000 ALTER TABLE `hoadon` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `import_note`
--

DROP TABLE IF EXISTS `import_note`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `import_note` (
  `id` bigint NOT NULL,
  `staff_id` bigint DEFAULT NULL,
  `total` double DEFAULT NULL,
  `received_date` date DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_import_note_staff` (`staff_id`),
  CONSTRAINT `fk_import_note_staff` FOREIGN KEY (`staff_id`) REFERENCES `staff` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `import_note`
--

LOCK TABLES `import_note` WRITE;
/*!40000 ALTER TABLE `import_note` DISABLE KEYS */;
/*!40000 ALTER TABLE `import_note` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `khachhang`
--

DROP TABLE IF EXISTS `khachhang`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `khachhang` (
  `makh` int NOT NULL AUTO_INCREMENT,
  `tenkh` varchar(100) NOT NULL,
  `sdt` varchar(15) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `diachi` varchar(255) DEFAULT NULL,
  `tinhtrang` enum('Hoạt động','Ngừng hoạt động') DEFAULT 'Hoạt động',
  `matkhau` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`makh`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `khachhang`
--

LOCK TABLES `khachhang` WRITE;
/*!40000 ALTER TABLE `khachhang` DISABLE KEYS */;
INSERT INTO `khachhang` VALUES (1,'Nguyen Van A','0123456789','nguyenvana@exagmple.com','123 Đường Lê Lợi, Quận 1, TP.HCM','Hoạt động','$2a$10$1e5TbLVz5Ju/vgGCY2YAyucROUyHe8vAnsEM0TxTg3pdq.t.Sedfa'),(2,'Trần Thị Bích','0912345678','minhlufan21082004@gmail.com','45 Đường Hai Bà Trưng, Quận 3, TP.HCM','Ngừng hoạt động','$2a$10$4UbLhFDYjpUR3cj06Xkm7O0SdsQX5aVQSbeBJ/mmpJHAXLgdi4mja'),(3,'Nguyen Van A','0123456789','nguyenvana@ffexagmple.com','78 Đường Trần Hưng Đạo, Quận 5, TP.HCM','Hoạt động','$2a$10$DCudtGNrUs3lyxI36Vs4tuqLqZVCGu.v/T2z1lSiwI1jSIguiVQxu'),(4,'Phạm Thảo Duyên','0934567890','duyen.pham@example.com','12 Đường Cách Mạng Tháng 8, Quận 10, TP.HCM','Hoạt động','$2a$10$rPHDkd3dBhcEjdTsRwUc9uk3ozQzfSAXtm042pVH.//dsr4057jH2'),(5,'Võ Quốc Đạt','0945678901','dat.vo@example.com','234 Đường Nguyễn Thị Minh Khai, Quận 1, TP.HCM','Hoạt động','$2a$10$1pvzrfFCfVAW4GzjDOAcfeYj46RqJIEZxR.hxRBK/Y46gO.8CIeM2'),(6,'Hoai Bao','0374170367','admiggn@gmail.com','56 Đường Lý Thường Kiệt, Quận Tân Bình, TP.HCM','Hoạt động','$2a$10$GtVuImgIki3bzGT3/YsuIOKLfX4k4s17SgB5RdXpAKAgA2R/0zc4y'),(7,'Bùi Anh Khoa','0967890123','khoa.bui@example.com','89 Đường Hoàng Văn Thụ, Quận Phú Nhuận, TP.HCM','Hoạt động','$2a$10$Gc2DBEW3rgpFSoizKXKSGu0HXPL1jpfK6vmfIoaRi8biSaWEfxa76'),(8,'Ngô Thị Lan','0978901234','lan.ngo@example.com','101 Đường Nguyễn Văn Cừ, Quận 5, TP.HCM','Hoạt động','$2a$10$c3.5VGf/BVtbUTcZn1kUXOl3K9z7XrPszVtUBXYWXmiEC/RulcZoK'),(9,'Huỳnh Gia Minh','0989012345','minh.huynh@example.com','200 Đường Điện Biên Phủ, Quận Bình Thạnh, TP.HCM','Hoạt động','$2a$10$CUn.lysC/f4aNTKXTCi0keJUIv9O1KyNOEBOjbqnHE/2O3hsJZg86'),(12,'Hoai Bao','0374170367','ad2min@gmail.com',NULL,'Hoạt động',NULL),(15,'nguyen van ba','1231231231','abc@gmail.com',NULL,'Hoạt động',NULL),(16,'acccc','1112342348','abssdsdsdc@gmail.com',NULL,'Hoạt động',NULL),(17,'acccc55','1112842348','abs22dsdc@gmail.com',NULL,'Hoạt động',NULL),(18,'gbgb','0987654321','khangle0938573511@gmail.com',NULL,'Hoạt động','$2a$10$FKgDvStusGXrbM1RaXyp4.KUJPfcCqEuVLFxPQ7NNZAdUi.FdNnHq'),(19,'hoai','0876564325','baohoaitran3112@gmail.com',NULL,'Hoạt động','$2a$10$K5Q.A5Kw6HqkwpknR/O7i.gqPeAxgoo5469Qn52Lk4hWwNBOj5Q12');
/*!40000 ALTER TABLE `khachhang` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `khuyen_mai`
--

DROP TABLE IF EXISTS `khuyen_mai`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `khuyen_mai` (
  `MaKM` int NOT NULL AUTO_INCREMENT,
  `TenKM` varchar(100) NOT NULL,
  `MoTa` text,
  `NgayBatDau` datetime NOT NULL,
  `NgayKetThuc` datetime NOT NULL,
  `TrangThai` bit(1) DEFAULT b'1' COMMENT '1: đang hoạt động, 0: ngừng áp dụng',
  `LoaiKM` enum('giam_phan_tram','giam_tien_mat','mua_x_tang_y','qua_tang','combo') NOT NULL,
  `NgayTao` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`MaKM`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `khuyen_mai`
--

LOCK TABLES `khuyen_mai` WRITE;
/*!40000 ALTER TABLE `khuyen_mai` DISABLE KEYS */;
INSERT INTO `khuyen_mai` VALUES (1,'Khuyến mãi hè 2025','Giảm 20% cho sách văn học','2025-05-01 00:00:00','2025-05-31 23:59:59',_binary '','giam_phan_tram','2025-05-04 11:51:11'),(2,'Giảm trực tiếp 100k','Giảm 100k cho đơn hàng từ 500k','2023-11-15 00:00:00','2023-12-15 00:00:00',_binary '','giam_tien_mat','2025-05-04 11:51:11'),(3,'Mua 2 tặng 1','Mua 2 sản phẩm bất kỳ tặng 1 chai nước rửa tay','2023-12-01 00:00:00','2023-12-31 00:00:00',_binary '','mua_x_tang_y','2025-05-04 11:51:11'),(4,'Quà tặng đặc biệt','Tặng balo khi mua laptop','2023-11-20 00:00:00','2023-12-20 23:59:59',_binary '','qua_tang','2025-05-04 11:51:11'),(5,'Combo mùa đông','Combo áo khoác + khăn len giảm 30%','2023-12-01 00:00:00','2023-12-31 23:59:59',_binary '','combo','2025-05-04 11:51:11'),(6,'Black Friday','Siêu sale Black Friday giảm đến 50%','2023-11-24 00:00:00','2023-11-26 23:59:59',_binary '\0','giam_phan_tram','2025-05-04 11:51:11'),(8,'Mua 2 tặng 1',NULL,'2025-05-05 00:00:00','2025-06-10 00:00:00',_binary '','mua_x_tang_y','2025-05-04 14:47:31');
/*!40000 ALTER TABLE `khuyen_mai` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `luong`
--

DROP TABLE IF EXISTS `luong`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `luong` (
  `id` int NOT NULL AUTO_INCREMENT,
  `MaNV` varchar(20) NOT NULL,
  `thang` int NOT NULL,
  `nam` int NOT NULL,
  `luong_co_ban` decimal(15,2) NOT NULL,
  `phu_cap` decimal(15,2) DEFAULT '0.00',
  `thuong` decimal(15,2) DEFAULT '0.00',
  `phat` decimal(15,2) DEFAULT '0.00',
  `tong_luong` decimal(15,2) DEFAULT '0.00',
  `trang_thai` enum('Chua_tra','Da_tra') DEFAULT 'Chua_tra',
  PRIMARY KEY (`id`),
  KEY `MaNV` (`MaNV`),
  CONSTRAINT `luong_ibfk_1` FOREIGN KEY (`MaNV`) REFERENCES `nhanvien` (`MaNV`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `luong`
--

LOCK TABLES `luong` WRITE;
/*!40000 ALTER TABLE `luong` DISABLE KEYS */;
INSERT INTO `luong` VALUES (1,'1',6,2025,8000000.00,500000.00,1000000.00,0.00,9500000.00,'Da_tra'),(2,'2',6,2025,7500000.00,400000.00,500000.00,200000.00,7800000.00,'Da_tra'),(3,'3',6,2025,9000000.00,600000.00,0.00,0.00,9600000.00,'Chua_tra'),(4,'4',6,2025,8500000.00,300000.00,200000.00,100000.00,8600000.00,'Da_tra'),(5,'5',6,2025,7000000.00,200000.00,0.00,0.00,7200000.00,'Chua_tra'),(6,'6',6,2025,9500000.00,700000.00,500000.00,0.00,10700000.00,'Da_tra'),(7,'7',6,2025,8000000.00,500000.00,0.00,0.00,8500000.00,'Chua_tra'),(8,'8',6,2025,7800000.00,400000.00,300000.00,0.00,8500000.00,'Da_tra');
/*!40000 ALTER TABLE `luong` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ma_giam_gia`
--

DROP TABLE IF EXISTS `ma_giam_gia`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ma_giam_gia` (
  `MaVoucher` int NOT NULL AUTO_INCREMENT,
  `MaKM` int NOT NULL,
  `MaCode` varchar(20) NOT NULL,
  `GioiHanSuDung` int DEFAULT NULL COMMENT 'NULL nếu không giới hạn',
  `DaSuDung` int DEFAULT '0',
  `TrangThai` bit(1) DEFAULT b'1' COMMENT '1: còn hiệu lực, 0: hết hiệu lực',
  `NgayHetHan` datetime DEFAULT NULL,
  `NgayTao` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`MaVoucher`),
  UNIQUE KEY `MaCode` (`MaCode`),
  KEY `MaKM` (`MaKM`),
  CONSTRAINT `ma_giam_gia_ibfk_1` FOREIGN KEY (`MaKM`) REFERENCES `khuyen_mai` (`MaKM`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ma_giam_gia`
--

LOCK TABLES `ma_giam_gia` WRITE;
/*!40000 ALTER TABLE `ma_giam_gia` DISABLE KEYS */;
/*!40000 ALTER TABLE `ma_giam_gia` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `material`
--

DROP TABLE IF EXISTS `material`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `material` (
  `id` bigint NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `supplier_id` bigint DEFAULT NULL,
  `remain` double DEFAULT NULL,
  `unit` varchar(255) DEFAULT NULL,
  `deleted` bit(1) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_material_supplier` (`supplier_id`),
  CONSTRAINT `fk_material_supplier` FOREIGN KEY (`supplier_id`) REFERENCES `supplier` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `material`
--

LOCK TABLES `material` WRITE;
/*!40000 ALTER TABLE `material` DISABLE KEYS */;
/*!40000 ALTER TABLE `material` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `module`
--

DROP TABLE IF EXISTS `module`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `module` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `module`
--

LOCK TABLES `module` WRITE;
/*!40000 ALTER TABLE `module` DISABLE KEYS */;
INSERT INTO `module` VALUES (1,'homepage'),(2,'sale'),(3,'warehouse'),(4,'statistics'),(5,'discounts'),(6,'promotions'),(7,'receipts'),(8,'export_notes'),(9,'import_notes'),(10,'products'),(11,'suppliers'),(12,'customers'),(13,'staffs'),(14,'accounts'),(15,'decentralization');
/*!40000 ALTER TABLE `module` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `nhacungcap`
--

DROP TABLE IF EXISTS `nhacungcap`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `nhacungcap` (
  `MaNCC` int NOT NULL AUTO_INCREMENT,
  `TenNCC` varchar(255) DEFAULT NULL,
  `SDT` varchar(11) DEFAULT NULL,
  `DiaChi` varchar(355) DEFAULT NULL,
  `TinhTrang` bit(1) DEFAULT NULL,
  PRIMARY KEY (`MaNCC`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `nhacungcap`
--

LOCK TABLES `nhacungcap` WRITE;
/*!40000 ALTER TABLE `nhacungcap` DISABLE KEYS */;
INSERT INTO `nhacungcap` VALUES (1,'Công ty TNHH Hoa Mai','0901234567','123 Lê Lợi, Q.1, TP.HCM',_binary ''),(2,'Công ty CP Thái Bình','0912345678','45 Trần Phú, TP. Thái Bình',_binary ''),(3,'Công ty TNHH Ánh Dương','0923456789','12 Nguyễn Huệ, Q.1, TP.HCM',_binary ''),(4,'Công ty TNHH Kim Long','0934567890','98 Lý Thường Kiệt, Đà Nẵng',_binary ''),(5,'Công ty TNHH Minh Tâm','0945678901','15 Hai Bà Trưng, Hà Nội',_binary '\0'),(6,'Công ty TNHH Đại Phát','0956789012','78 Phạm Văn Đồng, TP.HCM',_binary ''),(7,'test','0987654321','hcmew',_binary '');
/*!40000 ALTER TABLE `nhacungcap` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `nhanvien`
--

DROP TABLE IF EXISTS `nhanvien`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `nhanvien` (
  `MaNV` varchar(20) NOT NULL,
  `TenNV` varchar(50) DEFAULT NULL,
  `SDT` varchar(11) DEFAULT NULL,
  `GioiTinh` varchar(10) DEFAULT NULL,
  `DiaChi` varchar(255) DEFAULT NULL,
  `Email` varchar(100) DEFAULT NULL,
  `TinhTrang` varchar(30) DEFAULT NULL,
  PRIMARY KEY (`MaNV`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `nhanvien`
--

LOCK TABLES `nhanvien` WRITE;
/*!40000 ALTER TABLE `nhanvien` DISABLE KEYS */;
INSERT INTO `nhanvien` VALUES ('1','Nguyễn Văn A','0987654321','Nam','Hà Nội','nguyenvana@email.com','Active'),('10','Lý Thị K','0987654320','Nam','Thanh Hóa','lythik@email.com','Active'),('12','TRDFS','0143567876','Nam','gfgfgfgfg','acb@gmail.com','Active'),('2','Trần Thị B','0912345678','Nữ','Hồ Chí Minh','tranthib@email.com','Active'),('3','Lê Văn C','0978123456','Nam','Đà Nẵng','levanc@email.com','Active'),('4','Phạm Thị D','0967891234','Nam','Hải Phòng','phamthid@email.com','Active'),('5','Hoàng Văn E','0956789123','Nam','Cần Thơ','hoangvane@email.com','Active'),('6','Vũ Thị F','0945678912','Nữ','Bình Dương','vuthif@email.com','Active'),('7','Đặng Văn G','0934567891','Nam','Đồng Nai','baohoaitran3112@gmail.com','Active'),('8','Bùi Thị H','0923456789','Nữ','Hà Tĩnh','buithih@email.com','Active'),('9','Mai Văn I','0912345670','Nam','Nghệ An','maivani@email.com','Active');
/*!40000 ALTER TABLE `nhanvien` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `nhomquyen`
--

DROP TABLE IF EXISTS `nhomquyen`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `nhomquyen` (
  `MaNQ` int NOT NULL AUTO_INCREMENT,
  `TenNQ` varchar(50) DEFAULT NULL,
  `MoTa` varchar(255) DEFAULT NULL,
  `TinhTrang` bit(1) NOT NULL,
  PRIMARY KEY (`MaNQ`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `nhomquyen`
--

LOCK TABLES `nhomquyen` WRITE;
/*!40000 ALTER TABLE `nhomquyen` DISABLE KEYS */;
INSERT INTO `nhomquyen` VALUES (1,'Quản trị viên','Quản trị hệ thống',_binary ''),(2,'Nhân viên khủ Kho','Vai trò quản lý',_binary ''),(3,'Nhân viên xử lý đơn','Vai trò bán hàng',_binary ''),(4,'Nhân viên thủ kho','Vai trò quản lý kho',_binary '');
/*!40000 ALTER TABLE `nhomquyen` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `otp_verifications`
--

DROP TABLE IF EXISTS `otp_verifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `otp_verifications` (
  `id` int NOT NULL AUTO_INCREMENT,
  `email` varchar(100) NOT NULL,
  `otp` varchar(6) NOT NULL,
  `purpose` enum('PASSWORD_RESET','EMAIL_VERIFICATION') DEFAULT 'PASSWORD_RESET',
  `expires_at` datetime NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `is_used` tinyint(1) DEFAULT '0',
  `attempt_count` int DEFAULT '0',
  `ip_address` varchar(45) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_email` (`email`),
  KEY `idx_otp` (`otp`),
  KEY `idx_expires` (`expires_at`)
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `otp_verifications`
--

LOCK TABLES `otp_verifications` WRITE;
/*!40000 ALTER TABLE `otp_verifications` DISABLE KEYS */;
INSERT INTO `otp_verifications` VALUES (1,'baomunt123456@gmail.com','319412','PASSWORD_RESET','2025-05-18 08:40:41','2025-05-18 01:35:40',0,1,'::1'),(2,'baomunt123456@gmail.com','153066','PASSWORD_RESET','2025-05-18 09:07:05','2025-05-18 02:02:05',0,1,'::1'),(3,'baomunt123456@gmail.com','814692','PASSWORD_RESET','2025-05-18 09:09:55','2025-05-18 02:04:54',0,1,'::1'),(4,'baomunt123456@gmail.com','635447','PASSWORD_RESET','2025-05-18 09:16:03','2025-05-18 02:11:02',0,1,'::1'),(5,'baomunt123456@gmail.com','255902','PASSWORD_RESET','2025-05-18 09:47:45','2025-05-18 02:42:45',1,1,'::1'),(6,'baomunt123456@gmail.com','655235','PASSWORD_RESET','2025-05-18 10:17:21','2025-05-18 03:12:21',1,1,'::1'),(7,'minhluan21082004@gmail.com','472847','PASSWORD_RESET','2025-05-18 10:21:57','2025-05-18 03:16:57',1,0,'::1'),(8,'baomunt123456@gmail.com','264407','PASSWORD_RESET','2025-05-18 21:38:40','2025-05-18 14:33:40',1,1,'::1'),(9,'khangle0938573511@gmail.com','789339','PASSWORD_RESET','2025-05-18 22:28:50','2025-05-18 15:23:50',1,0,'::1'),(10,'khangle0938573511@gmail.com','651233','PASSWORD_RESET','2025-05-18 22:46:42','2025-05-18 15:41:42',1,0,'::1'),(11,'khangle0938573511@gmail.com','831197','PASSWORD_RESET','2025-05-18 22:52:17','2025-05-18 15:47:16',1,0,'::1'),(12,'baomunt123456@gmail.com','181307','PASSWORD_RESET','2025-05-18 22:58:03','2025-05-18 15:53:03',0,1,'::1'),(13,'baomunt123456@gmail.com','934594','PASSWORD_RESET','2025-05-18 22:59:38','2025-05-18 15:54:38',0,1,'::1'),(14,'baomunt123456@gmail.com','420452','PASSWORD_RESET','2025-05-24 16:37:45','2025-05-24 09:32:44',1,1,'::1'),(15,'baomunt123456@gmail.com','934248','PASSWORD_RESET','2025-08-21 06:51:16','2025-08-20 23:46:16',0,0,'::1'),(16,'baomunt123456@gmail.com','239246','PASSWORD_RESET','2025-08-21 06:59:18','2025-08-20 23:54:18',0,0,'::1'),(17,'baomunt123456@gmail.com','739704','PASSWORD_RESET','2025-08-21 07:04:45','2025-08-20 23:59:44',0,0,'::1'),(18,'baomunt123456@gmail.com','688338','PASSWORD_RESET','2025-08-21 07:04:52','2025-08-20 23:59:52',0,0,'::1'),(19,'Baomunt123456@gmail.com','647175','PASSWORD_RESET','2025-08-21 07:21:56','2025-08-21 00:16:56',0,0,'::1'),(20,'Baomunt123456@gmail.com','931098','PASSWORD_RESET','2025-08-21 20:05:53','2025-08-21 13:00:52',0,0,'::1'),(21,'baohoaitran3112@gmail.com','317044','PASSWORD_RESET','2025-09-09 18:53:21','2025-09-09 11:48:21',1,0,'::1');
/*!40000 ALTER TABLE `otp_verifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `password_reset_tokens`
--

DROP TABLE IF EXISTS `password_reset_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `password_reset_tokens` (
  `id` int NOT NULL AUTO_INCREMENT,
  `email` varchar(100) NOT NULL,
  `token` varchar(64) NOT NULL,
  `expires_at` datetime NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `password_reset_tokens`
--

LOCK TABLES `password_reset_tokens` WRITE;
/*!40000 ALTER TABLE `password_reset_tokens` DISABLE KEYS */;
INSERT INTO `password_reset_tokens` VALUES (4,'khangle0938573511@gmail.com','d4e6d8a5bf23dddfff5635ca2782bc47a78f074b18f04f455a8f4c6a2bae9340','2025-05-18 22:39:24','2025-05-18 15:24:24'),(5,'khangle0938573511@gmail.com','4c3bd2fe2d094ed58139fa5693dbbe800284864fd0866230be034488031ce082','2025-05-18 22:56:59','2025-05-18 15:41:58'),(7,'baomunt123456@gmail.com','a6340d67ac2301a25c54f89afc87b5bc7aea3c20fad8fc1ec9ed713c9e31201c','2025-05-24 16:48:48','2025-05-24 09:33:48');
/*!40000 ALTER TABLE `password_reset_tokens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `phieunhap`
--

DROP TABLE IF EXISTS `phieunhap`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `phieunhap` (
  `MaPN` int NOT NULL AUTO_INCREMENT,
  `MaNCC` int DEFAULT NULL,
  `TenTK` varchar(20) DEFAULT NULL,
  `NgayTao` date DEFAULT NULL,
  `TongTien` double DEFAULT NULL,
  `TinhTrang` bit(1) DEFAULT NULL,
  PRIMARY KEY (`MaPN`),
  KEY `FK_PhieuNhap_TaiKhoan` (`TenTK`),
  CONSTRAINT `FK_PhieuNhap_TaiKhoan` FOREIGN KEY (`TenTK`) REFERENCES `taikhoan` (`TenTK`)
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `phieunhap`
--

LOCK TABLES `phieunhap` WRITE;
/*!40000 ALTER TABLE `phieunhap` DISABLE KEYS */;
INSERT INTO `phieunhap` VALUES (1,1,'NV007','2022-09-22',2500000,_binary ''),(2,2,'NV009','2022-09-23',1800000,_binary ''),(3,3,'NV008','2022-09-24',3600000,_binary ''),(4,4,'NV007','2022-09-25',2000000,_binary '\0'),(5,5,'NV009','2022-09-26',3500000,_binary '\0'),(6,6,'NV008','2022-09-27',4800000,_binary '\0'),(7,3,'NV007','2022-09-28',2800000,_binary '\0'),(8,4,'NV009','2022-09-29',1800000,_binary '\0'),(9,3,'NV002','2025-05-12',NULL,NULL),(10,4,'NV002','2025-05-12',NULL,NULL),(11,4,'NV004','2025-05-12',25,_binary ''),(12,1,'NV004','2025-05-12',480000,_binary ''),(13,3,'NV004','2025-09-11',231.99999999999997,_binary ''),(16,3,'NV004','2025-09-11',264000.00000000006,_binary ''),(18,4,'NV004','2025-09-11',240000,_binary ''),(19,3,'NV004','2025-09-11',2400000,_binary ''),(20,3,'NV004','2025-09-11',1380000000,_binary ''),(21,3,'NV004','2025-09-11',3720000,_binary '');
/*!40000 ALTER TABLE `phieunhap` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `product`
--

DROP TABLE IF EXISTS `product`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product` (
  `id` bigint NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `category` varchar(255) DEFAULT NULL,
  `price` double DEFAULT NULL,
  `unit` varchar(255) DEFAULT NULL,
  `image` varchar(255) DEFAULT NULL,
  `deleted` bit(1) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product`
--

LOCK TABLES `product` WRITE;
/*!40000 ALTER TABLE `product` DISABLE KEYS */;
/*!40000 ALTER TABLE `product` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `receipt`
--

DROP TABLE IF EXISTS `receipt`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `receipt` (
  `id` bigint NOT NULL,
  `staff_id` bigint DEFAULT NULL,
  `total` double DEFAULT NULL,
  `invoice_date` date DEFAULT NULL,
  `received` double DEFAULT NULL,
  `excess` double DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_receipt_staff` (`staff_id`),
  CONSTRAINT `fk_receipt_staff` FOREIGN KEY (`staff_id`) REFERENCES `staff` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `receipt`
--

LOCK TABLES `receipt` WRITE;
/*!40000 ALTER TABLE `receipt` DISABLE KEYS */;
/*!40000 ALTER TABLE `receipt` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `receipt_detail`
--

DROP TABLE IF EXISTS `receipt_detail`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `receipt_detail` (
  `receipt_id` bigint NOT NULL,
  `product_id` bigint NOT NULL,
  `quantity` double DEFAULT NULL,
  `price` double DEFAULT NULL,
  PRIMARY KEY (`receipt_id`,`product_id`),
  KEY `fk_receipt_detail_product` (`product_id`),
  CONSTRAINT `fk_receipt_detail_product` FOREIGN KEY (`product_id`) REFERENCES `product` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_receipt_detail_receipt` FOREIGN KEY (`receipt_id`) REFERENCES `receipt` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `receipt_detail`
--

LOCK TABLES `receipt_detail` WRITE;
/*!40000 ALTER TABLE `receipt_detail` DISABLE KEYS */;
/*!40000 ALTER TABLE `receipt_detail` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `recipe`
--

DROP TABLE IF EXISTS `recipe`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `recipe` (
  `product_id` bigint NOT NULL,
  `material_id` bigint NOT NULL,
  `quantity` double DEFAULT NULL,
  `deleted` bit(1) DEFAULT NULL,
  PRIMARY KEY (`product_id`,`material_id`),
  KEY `fk_recipe_material` (`material_id`),
  CONSTRAINT `fk_recipe_material` FOREIGN KEY (`material_id`) REFERENCES `material` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_recipe_product` FOREIGN KEY (`product_id`) REFERENCES `product` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `recipe`
--

LOCK TABLES `recipe` WRITE;
/*!40000 ALTER TABLE `recipe` DISABLE KEYS */;
/*!40000 ALTER TABLE `recipe` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `role`
--

DROP TABLE IF EXISTS `role`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `role` (
  `id` bigint NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `role`
--

LOCK TABLES `role` WRITE;
/*!40000 ALTER TABLE `role` DISABLE KEYS */;
/*!40000 ALTER TABLE `role` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sanpham`
--

DROP TABLE IF EXISTS `sanpham`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sanpham` (
  `MaSP` int NOT NULL AUTO_INCREMENT,
  `MaTL` int DEFAULT NULL,
  `TenSP` varchar(100) DEFAULT NULL,
  `MoTa` text,
  `HinhAnh` varchar(255) DEFAULT NULL,
  `DonGia` double DEFAULT NULL,
  `SoLuong` int DEFAULT NULL,
  `NamXB` int DEFAULT NULL,
  `TinhTrang` bit(1) DEFAULT NULL,
  `MaTG` int DEFAULT NULL,
  PRIMARY KEY (`MaSP`),
  KEY `FK_SanPham_TheLoai` (`MaTL`),
  KEY `FK_SanPham_TacGia` (`MaTG`),
  CONSTRAINT `FK_SanPham_TacGia` FOREIGN KEY (`MaTG`) REFERENCES `tacgia` (`MaTG`),
  CONSTRAINT `FK_SanPham_TheLoai` FOREIGN KEY (`MaTL`) REFERENCES `theloai` (`MaTL`)
) ENGINE=InnoDB AUTO_INCREMENT=109 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sanpham`
--

LOCK TABLES `sanpham` WRITE;
/*!40000 ALTER TABLE `sanpham` DISABLE KEYS */;
INSERT INTO `sanpham` VALUES (1,1,'Cho Tôi Xin Một Vé Đi Tuổi Thơ','Cuốn sách kể về hành trình đầy hài hước và cảm động của một chú chó nhỏ với khát vọng khám phá thế giới rộng lớn. Tác phẩm mang đậm chất sáng tạo, kết hợp giữa yếu tố giả tưởng và bài học về lòng dũng cảm.','sp01.jpg',12000,37,2008,_binary '',1),(2,1,'Mắt Biếc','Một câu chuyện tình yêu lãng mạn và bi thương, xoay quanh mối quan hệ phức tạp giữa các nhân vật trong bối cảnh làng quê Việt Nam. Tác phẩm nổi bật với ngôn ngữ giàu cảm xúc và hình ảnh thiên nhiên thơ mộng.','sp02.jpg',150000,27,1990,_binary '',1),(3,1,'Pride and Prejudice','Tác phẩm kinh điển của Jane Austen kể về cuộc đời của Elizabeth Bennet, một cô gái thông minh và độc lập, trong hành trình tìm kiếm tình yêu và vượt qua định kiến xã hội ở Anh thế kỷ 19.','sp03.jpg',138000,10050,1984,_binary '',1),(4,1,'The Great Gatsby','Tiểu thuyết của F. Scott Fitzgerald khắc họa giấc mơ Mỹ qua câu chuyện của Jay Gatsby, một triệu phú bí ẩn, và tình yêu không hồi kết với Daisy Buchanan trong bối cảnh những năm 1920 xa hoa nhưng đầy bi kịch.','sp04.jpg',372000,41,1999,_binary '\0',1),(5,1,'Harry Potter and the Philosophers Stone','Cuốn sách đầu tiên trong loạt truyện của J.K. Rowling, kể về cậu bé Harry Potter phát hiện mình là phù thủy và bước vào thế giới phép thuật tại trường Hogwarts, nơi anh đối mặt với định mệnh và bạn bè mới.','sp05.jpg',120000,79,1997,_binary '',1),(6,2,'Dune','Tác phẩm khoa học viễn tưởng kinh điển của Frank Herbert, xoay quanh cuộc chiến quyền lực trên hành tinh sa mạc Arrakis, nơi sản sinh gia vị quý giá, với nhân vật chính Paul Atreides lãnh đạo một cuộc cách mạng.','sp06.jpg',12000,57,1965,_binary '',2),(7,2,'The Hitchhikers Guide to the Galaxy','Một tiểu thuyết hài hước của Douglas Adams, theo chân Arthur Dent trong hành trình du hành vũ trụ sau khi Trái Đất bị phá hủy, với sự hỗ trợ của cuốn sách hướng dẫn du hành kỳ lạ và đầy bất ngờ.','sp07.jpg',480000,59,1980,_binary '\0',2),(8,2,'Enders Game','Tác phẩm của Orson Scott Card kể về Ender Wiggin, một cậu bé thiên tài được huấn luyện để trở thành chỉ huy quân sự, đối mặt với áp lực cứu nhân loại khỏi mối đe dọa ngoài hành tinh..','sp08.jpg',210000,38,1985,_binary '',2),(9,2,'Brave New World','Tiểu thuyết dystopia của Aldous Huxley miêu tả một xã hội tương lai nơi con người bị kiểm soát bởi công nghệ và thuốc men, đặt ra câu hỏi về tự do và hạnh phúc thông qua hành trình của Bernard Marx.','sp09.jpg',500000,46,1932,_binary '',2),(10,2,'Neuromancer','Tác phẩm tiên phong của thể loại cyberpunk do William Gibson sáng tác, kể về một hacker trong thế giới tương lai, nơi thực tế ảo và trí tuệ nhân tạo đan xen, mở ra cuộc phiêu lưu đầy kịch tính.','sp10.jpg',310000,42,1984,_binary '\0',2),(11,3,'The Da Vinci Code','Tiểu thuyết trinh thám của Dan Brown, theo chân Robert Langdon giải mã các bí ẩn liên quan đến tranh của Leonardo da Vinci và Hội Tam Điểm, hé lộ những âm mưu tôn giáo gây tranh cãi.','sp11.jpg',340000,50,2000,_binary '',3),(12,3,'Gone Girl','Tác phẩm tâm lý tội phạm của Gillian Flynn kể về vụ mất tích bí ẩn của Amy Dunne, dẫn đến những bí mật đen tối trong hôn nhân của cô và Nick, tạo nên một câu chuyện căng thẳng và bất ngờ.','sp12.jpg',340000,40,2012,_binary '',3),(13,3,'The Girl with the Dragon Tattoo','Phần đầu trong loạt Millennium của Stieg Larsson, theo chân nhà báo Mikael Blomkvist và hacker Lisbeth Salander điều tra một vụ mất tích gia đình, pha trộn yếu tố tội phạm và xã hội đen.','sp13.jpg',230000,59,2004,_binary '',3),(14,3,'The Hound of the Baskervilles','Một trong những tác phẩm nổi tiếng của Arthur Conan Doyle, nơi thám tử Sherlock Holmes điều tra lời nguyền kỳ bí về một con chó săn ma quái đe dọa gia tộc Baskerville.','sp14.jpg',370000,30,1939,_binary '\0',3),(15,3,'The Secret History','Tác phẩm của Donna Tartt kể về một nhóm sinh viên đại học bị cuốn vào một bí ẩn tội phạm sau một sự kiện bất ngờ, khám phá sự phức tạp của tình bạn và đạo đức.','sp15.jpg',230000,69,1992,_binary '',3),(16,4,'A Peoples History of the United States','Cuốn sách của Howard Zinn tái hiện lịch sử Hoa Kỳ từ góc nhìn của những người dân thường, phê phán các chính sách quyền lực và khám phá sự bất bình đẳng xã hội.','sp16.jpg',180000,41,1980,_binary '',1),(17,4,'Guns, Germs, and Steel','Tác phẩm kinh điển của Jared Diamond phân tích cách các yếu tố địa lý và môi trường đã định hình sự phát triển của các nền văn minh trên thế giới.','sp17.jpg',480000,55,1997,_binary '\0',1),(18,4,'The Diary of a Young Girl','Nhật ký của Anne Frank, một cô bé Do Thái, ghi lại cuộc sống ẩn náu trong Thế chiến II, phản ánh hy vọng và nỗi sợ hãi trong bối cảnh tàn khốc.','sp18.jpg',210000,38,1947,_binary '',1),(19,4,'The Guns of August','Tác phẩm của William Manchester mô tả sự kiện bạo lực tháng 8 năm 1968 tại Mỹ, phản ánh những căng thẳng xã hội và chính trị thời điểm đó.','sp19.jpg',500000,48,1962,_binary '',1),(20,4,'The Rise and Fall of the Third Reich','Cuốn sách của William L. Shirer ghi lại sự trỗi dậy và sụp đổ của Đế quốc thứ ba dưới thời Hitler, với những phân tích sâu sắc về lịch sử Thế chiến II.','sp20.jpg',310000,42,1960,_binary '',1),(21,5,'The Poet','Tác phẩm của James Patterson kể về thám tử Alex Cross đối mặt với một kẻ giết người hàng loạt, tạo nên một câu chuyện trinh thám gay cấn.','sp21.jpg',230000,70,1996,_binary '\0',2),(22,5,'The Cuckoos Calling','Tiểu thuyết kinh dị của Thomas Harris, theo chân đặc vụ FBI Clarice Starling truy tìm tên sát nhân ăn thịt người Hannibal Lecter, đầy kịch tính và ám ảnh.','sp22.jpg',180000,45,1988,_binary '',2),(23,5,'The Silence of the Lambs','Tác phẩm của Tana French kể về một vụ án bí ẩn trong khu rừng, nơi thám tử Rob Ryan phải đối mặt với quá khứ đau thương của chính mình.','sp23.jpg',480000,55,1980,_binary '\0',2),(24,5,'In the Woods','Cuốn sách của Haruki Murakami dẫn dắt người đọc qua một hành trình kỳ ảo, nơi thực tại và giấc mơ đan xen, khám phá tình yêu và sự mất mát.','sp24.jpg',210000,38,2007,_binary '',2),(25,5,'The Secret History','Tác phẩm của Donna Tartt kể về một nhóm học giả bị cuốn vào một bí ẩn tội ác, khám phá sự sâu sắc của triết học và nhân tính.','sp25.jpg',500000,48,1992,_binary '',2),(26,6,'A Brief History of Time','Cuốn sách của Stephen Hawking giải thích các khái niệm vật lý phức tạp như lỗ đen và Big Bang một cách dễ hiểu, mở ra cánh cửa vũ trụ cho người đọc.','sp26.jpg',140000,50,1988,_binary '',3),(27,6,'The Selfish Gene','Cuốn sách của Richard Dawkins khám phá lý thuyết tiến hóa qua khái niệm gen ích kỷ, giải thích cách gen ảnh hưởng đến hành vi và sự sống sót của loài.','sp27.jpg',120000,44,1976,_binary '',3),(28,6,'Sapiens: A Brief History of Humankind','Tác phẩm của Yuval Noah Harari kể lại lịch sử loài người từ thời cổ đại đến hiện đại, phân tích cách các ý tưởng và công nghệ định hình xã hội.','sp28.jpg',130000,60,2011,_binary '',3),(29,6,'The Origin of Species','Cuốn sách kinh điển của Charles Darwin trình bày lý thuyết tiến hóa qua chọn lọc tự nhiên, đặt nền móng cho sinh học hiện đại.','sp29.jpg',310000,30,1859,_binary '\0',3),(30,6,'The Double Helix','Tác phẩm của Nicholas Sparks kể về hành trình tình yêu đầy cảm xúc giữa hai con người, vượt qua những thử thách của thời gian và ký ức.','sp30.jpg',230000,70,1968,_binary '',3),(31,7,'The Alchemist','Cuốn sách của Paulo Coelho kể về hành trình của một chàng chăn cừu tìm kiếm kho báu, khám phá ý nghĩa của ước mơ và sự tự nhận thức.','sp31.jpg',180000,45,1988,_binary '',1),(32,7,'The Power of Now','Tác phẩm của Rhonda Byrne tiết lộ sức mạnh của tư duy tích cực và luật hấp dẫn, hướng dẫn cách đạt được thành công và hạnh phúc.','sp32.jpg',480000,55,1997,_binary '\0',NULL),(33,7,'The Celestine Prophecy','Cuốn sách của Dan Brown kể về cuộc phiêu lưu của Robert Langdon giải mã bí ẩn tiên tri Celestine, đầy kịch tính và những khám phá tôn giáo.','sp33.jpg',210000,38,1993,_binary '',NULL),(34,7,'Mere Christianity','Tác phẩm của C.S. Lewis kể về hành trình của một cô gái khám phá đức tin và tình yêu trong bối cảnh Thế chiến II, đầy cảm hứng.','sp34.jpg',500000,48,1952,_binary '',NULL),(35,7,'The Tao of Pooh','Cuốn sách của A.A. Milne đưa người đọc vào thế giới ngây thơ của Winnie the Pooh, với những bài học về tình bạn và sự giản dị.','sp35.jpg',310000,42,1982,_binary '\0',NULL),(36,8,'Daring Greatly','Tác phẩm của Gretchen Rubin hướng dẫn cách xây dựng thói quen tốt và sống hạnh phúc hơn thông qua những thay đổi nhỏ hàng ngày.','sp36.jpg',340000,50,2012,_binary '',NULL),(37,8,'Girl, Wash Your Face','Cuốn sách của Marie Kondo chia sẻ phương pháp dọn dẹp và tổ chức không gian sống, giúp tìm lại sự bình yên và trật tự.','sp37.jpg',340000,40,2018,_binary '',NULL),(38,8,'The Power of Now','Tác phẩm của Rhonda Byrne tiếp tục khám phá luật hấp dẫn, cung cấp các bài tập thực hành để thay đổi tư duy và cuộc sống.','sp38.jpg',230000,60,1997,_binary '',NULL),(39,8,'The Four Agreements','Cuốn sách của Don Miguel Ruiz giới thiệu bốn nguyên tắc sống để đạt được tự do cá nhân và hạnh phúc, dựa trên triết lý Toltec cổ đại.','sp39.jpg',370000,30,1997,_binary '\0',NULL),(40,8,'Start with Why','Tác phẩm của Simon Sinek giải thích tại sao việc tìm ra lý do cốt lõi (Why) của bản thân hoặc tổ chức có thể dẫn đến thành công bền vững.','sp40.jpg',230000,70,2009,_binary '',NULL),(41,9,'The Notebook','Tác phẩm lãng mạn của Nicholas Sparks kể về tình yêu vượt thời gian giữa Noah và Allie, với những cảm xúc sâu sắc và ký ức không phai mờ.','sp41.jpg',180000,45,1996,_binary '',NULL),(42,9,'Outlander','Cuốn sách của Diana Gabaldon kể về hành trình vượt thời gian của Claire Randall, đan xen giữa tình yêu và lịch sử thời kỳ Scotland thế kỷ 18.','sp42.jpg',480000,55,1991,_binary '\0',NULL),(43,9,'The Rosie Project','Tác phẩm của John Green kể về Hazel Grace và Gus, hai bạn trẻ đối mặt với bệnh ung thư, mang đến câu chuyện tình yêu và hy vọng đầy cảm động.','sp43.jpg',210000,38,2013,_binary '',NULL),(44,9,'The Fault in Our Stars','Cuốn sách của Nicholas Sparks kể về tình yêu trẻ trung giữa Rosie và Ian, vượt qua những thử thách để tìm thấy hạnh phúc đích thực.','sp44.jpg',500000,48,2012,_binary '',NULL),(45,9,'Me Before You','Tác phẩm của Nicholas Sparks kể về mối quan hệ giữa Landon và Jamie, khám phá tình yêu, sự hy sinh và phép màu trong cuộc sống.','sp45.jpg',310000,42,2012,_binary '',NULL),(51,1,'Tom Sawyer','Tiểu thuyết kinh điển của Mark Twain kể về cuộc phiêu lưu của Tom Sawyer, một cậu bé tinh nghịch khám phá thế giới và bạn bè ở vùng nông thôn Mỹ.','sp46.jpg',99000,10,1960,_binary '',NULL),(52,1,'Doremon Phiên Lưu','Cuốn truyện tranh nổi tiếng của Fujiko F. Fujio, kể về cậu bé Nobita và chú mèo máy Doraemon với những chuyến phiêu lưu kỳ diệu bằng bảo bối thần kỳ.','sp47.jpg',120000,14,1949,_binary '',NULL),(53,1,'Tho 7 Mau','Tác phẩm của Alexandre Dumas kể về ba chàng lính ngự lâm dũng cảm, với những cuộc chiến và tình bạn trong bối cảnh lịch sử Pháp.','sp48.jpg',150000,8,1988,_binary '',NULL),(54,1,'Vu Tru va Trai Dat','Cuốn tiểu thuyết của Alexandre Dumas kể về hành trình của chàng trai trẻ D’Artagnan gia nhập đội lính ngự lâm, đầy âm mưu và lòng trung thành.','sp49.jpg',180000,12,2014,_binary '',NULL),(55,1,'Gulliver','Tác phẩm kinh điển của Jonathan Swift kể về chuyến phiêu lưu kỳ thú của Gulliver qua các vùng đất tưởng tượng, phản ánh xã hội và con người.','sp50.jpg',130000,20,1976,_binary '',NULL),(56,1,'2 Van Dam Duoi Bien','Cuốn sách của Alexandre Dumas kể về cuộc đời của Edmond Dantès, từ tù nhân trở thành bá tước để trả thù những kẻ phản bội.','sp51.jpg',130000,20,1976,_binary '',NULL),(57,1,'Nho Ti Ty Phu','Tác phẩm của Victor Hugo kể về hành trình của Jean Valjean, một cựu tù nhân tìm kiếm sự chuộc tội trong bối cảnh cách mạng Pháp.','sp52.jpg',130000,18,1976,_binary '',NULL),(73,6,'Đề Minh Họa Tốt Nghiệp THPT 2025','Tài liệu đề minh họa chính thức cho kỳ thi THPT 2025, giúp học sinh làm quen với cấu trúc đề và luyện tập các môn thi quan trọng.','sp53.jpg',130000,50,2023,_binary '',4),(74,6,'Đề Minh Họa Tốt Nghiệp THPT 2025','Bộ đề minh họa dành cho kỳ thi THPT 2025, cung cấp các bài thi mẫu để học sinh ôn luyện và chuẩn bị tốt nhất cho kỳ thi.','sp54.jpg',50000,50,2023,_binary '',4),(75,6,'Đề Minh Họa Tốt Nghiệp THPT 2025','Tài liệu đề minh họa chính thức cho kỳ thi THPT 2025, hỗ trợ học sinh rèn luyện kỹ năng làm bài và nắm vững kiến thức cần thiết.','sp55.jpg',65000,50,2023,_binary '',4),(76,6,'Đề Minh Họa Tốt Nghiệp THPT 2025','Tài liệu đề minh họa tổng hợp dành cho kỳ thi THPT 2025, cung cấp các bài thi mẫu chi tiết cho tất cả các môn học, giúp học sinh luyện tập và làm quen với cấu trúc đề thi.','sp56.jpg',200000,50,2023,_binary '',4),(77,6,'Tuyển Sinh 10 & Các Đề Toán Thực Tế (Theo CTGDPT 2018)','Tuyển tập 10 đề toán thực tế và bài tập kèm lời giải chi tiết, giúp học sinh lớp 10 ôn luyện và nâng cao kỹ năng giải toán.','sp57.jpg',200000,50,2023,_binary '',4),(78,6,'Hướng Dẫn Ôn Thi Vào Lớp 10 (Định Hướng Năng Lực)','Hướng dẫn chi tiết cách ôn thi vào lớp 10 môn Văn, bao gồm các bài tập và kỹ năng viết văn, phù hợp cho học sinh chuẩn bị thi.','sp58.jpg',200000,50,2023,_binary '',4),(79,6,'Hướng Dẫn Ôn Thi Vào Lớp 10 (Định Hướng Năng Lực)','Sách hướng dẫn ôn thi vào lớp 10 môn Văn, cung cấp các bài tập và phương pháp học tập hiệu quả để học sinh đạt kết quả cao.','sp59.jpg',130000,50,2023,_binary '',4),(80,6,'Đề Minh Họa Thi Vào 10','Tài liệu đề minh họa chính thức kỳ thi đánh giá đầu vào lớp 10 tại TP.HCM, giúp học sinh làm quen với dạng đề và ôn luyện hiệu quả.','sp60.jpg',50000,50,2023,_binary '',4),(81,6,'25 Đề Ôn Thi ĐGNL ĐH Quốc Gia TP.HCM','Tài liệu gồm 25 đề thi mẫu dành cho kỳ thi đánh giá năng lực của Đại học Quốc gia TP.HCM, giúp học sinh luyện tập, làm quen với cấu trúc đề và nâng cao kỹ năng giải đề hiệu quả.','sp61.jpg',65000,50,2023,_binary '',4),(82,6,'50 Đề Thực Chiến Luyện Thi Anh Vào Lớp 10 (Có Đáp Án)','Tuyển tập 50 đề thi thử môn Tiếng Anh vào lớp 10, kèm hướng dẫn chi tiết, giúp học sinh luyện tập và nâng cao kỹ năng tiếng Anh.','sp62.jpg',200000,50,2023,_binary '',4),(83,6,'Hướng Dẫn Ôn Thi Tuyển Sinh Lớp 10 - Tiếng Anh (Tái Bản 2024)','Hướng dẫn ôn thi vào lớp 10 môn Toán, bao gồm các bài tập thực tế và phương pháp giải bài hiệu quả dành cho học sinh.','sp63.jpg',200000,50,2023,_binary '',4),(84,6,'Hướng Dẫn Ôn Thi Vào Lớp 10 (Định Hướng Năng Lực)','Sách hướng dẫn ôn thi vào lớp 10 môn Văn, cung cấp các bài tập chuyên sâu và kỹ năng làm bài để học sinh chuẩn bị tốt nhất.','sp64.jpg',200000,50,2023,_binary '',4),(85,6,'Global Success - Tiếng Anh 9 - Sách Học Sinh (2024)','Tài liệu học tiếng Anh lớp 9, tập trung vào kỹ năng giao tiếp và từ vựng, giúp học sinh đạt thành công trong học tập và thi cử.','sp65.jpg',200000,50,2023,_binary '',4),(86,6,'Đề Minh Họa Tốt Nghiệp THPT 2025','Tài liệu đề minh họa chính thức cho kỳ thi THPT 2025, cung cấp các bài thi mẫu để học sinh luyện tập và làm quen với dạng đề.','sp66.jpg',200000,50,2023,_binary '',4),(87,6,'Đề Minh Họa Tốt Nghiệp THPT 2025','Bộ đề minh họa dành cho kỳ thi THPT 2025, hỗ trợ học sinh ôn luyện các môn thi quan trọng và cải thiện kỹ năng làm bài.','sp67.jpg',200000,50,2023,_binary '',4),(90,2,'Văn Học Dân Gian Chơ Ro - Thể Loại Và Tác Phẩm','Cuốn sách của Dale Carnegie hướng dẫn cách xây dựng mối quan hệ, giao tiếp hiệu quả và tạo ảnh hưởng tích cực trong cuộc sống.','sp68.jpg',150000,50,2023,_binary '',7),(91,2,'Nhà Văn - Cuộc Đời Và Tác Phẩm','Tác phẩm của Nguyễn Nhật Ánh kể về tuổi thơ trong sáng với những rung động đầu đời, đong đầy cảm xúc và ký ức tuổi học trò.','sp69.jpg',180000,60,2023,_binary '',7),(92,2,'Soạn Giả Viễn Châu - Tác Giả Và Tác Phẩm Vọng Cổ','Cuốn sách giới thiệu tiểu sử và sự nghiệp của soạn giả Viễn Châu, \"vua vọng cổ\" của sân khấu cải lương Việt Nam, với hơn 2.000 bài vọng cổ và 50 vở tuồng nổi tiếng. Tác phẩm phân tích kỹ lưỡng phong cách sáng tác, đặc biệt là thể loại tân cổ giao duyên và vọng cổ hài, đồng thời tôn vinh những đóng góp của ông cho văn hóa Nam Bộ.','sp70.jpg',200000,45,2024,_binary '',7),(93,2,'Abraham Lincoln - Các Tác Phẩm Và Suy Ngẫm','Tuyển tập các tác phẩm của nhiều tác giả, tái hiện cuộc đời và sự nghiệp của Abraham Lincoln, vị tổng thống vĩ đại của nước Mỹ.','sp71.jpg',250000,55,2024,_binary '',7),(94,2,'Hiểu Và Thưởng Thức Một Tác Phẩm Mỹ Thuật','Cuốn sách kể lại cuộc đời và sự nghiệp của Michelangelo, một trong những nghệ sĩ vĩ đại nhất thời Phục Hưng, với những đóng góp nghệ thuật vượt thời gian.','sp72.jpg',220000,70,2023,_binary '',7),(95,2,'Michelangelo - Cuộc Đời Và Tác Phẩm Qua 500 Hình Ảnh','Tác phẩm kinh điển của Quentin Blake, kể về hành trình phiêu lưu của một cậu bé với trí tưởng tượng phong phú, đầy màu sắc và sáng tạo.','sp73.jpg',300000,40,2024,_binary '',7),(96,2,'Tác Phẩm Kinh Điển Của Quentin Blake - Diệc Và Sếu','Cuốn sách khám phá cuộc đời và sự nghiệp của Leonardo da Vinci, thiên tài Phục Hưng với những đóng góp trong nghệ thuật và khoa học.','sp74.jpg',280000,50,2023,_binary '',7),(97,2,'Tác Phẩm Kinh Điển Của Quentin Blake - Cừu Và Dê','Tác phẩm kể lại cuộc đời của Leonardo da Vinci, từ góc nhìn văn học, khắc họa hành trình sáng tạo và những tác phẩm vĩ đại của ông.','sp75.jpg',270000,60,2024,_binary '',7),(98,2,'Leonardo Da Vinci - Cuộc Đời Và Tác Phẩm Qua 500 Hình Ảnh','Tuyển tập các bài viết về cuộc đời và sự nghiệp của Tú Xương, nhà thơ trào phúng nổi tiếng của Việt Nam, phản ánh xã hội thời bấy giờ.','sp76.jpg',320000,45,2023,_binary '',7),(99,2,'Tác Phẩm Chọn Lọc - Văn Học Mỹ - Ông Già Và Biển Cả','Tác phẩm của Nguyễn Nhật Ánh kể về tuổi trẻ đầy mơ mộng, với những câu chuyện tình yêu và tình bạn trong sáng, đậm chất văn học Việt.','sp77.jpg',350000,50,2024,_binary '',7),(100,2,'Tủ Sách Vàng - Tác Phẩm Chọn Lọc Dành Cho Thiếu Nhi - Đen Và Béo','Tuyển tập các tác phẩm của Tú Vương, nhà thơ Việt Nam, với những vần thơ sâu lắng, phản ánh tình yêu quê hương và con người.','sp78.jpg',330000,55,2023,_binary '',7),(101,2,'Thế Giới Nghệ Thuật Trong Bảo Tàng Tập Và Những Tác Phẩm Kinh Điển','Cuốn sách khám phá nghệ thuật thế giới qua các bộ sưu tập tại Bảo tàng Tate, giới thiệu những tác phẩm nổi bật và câu chuyện đằng sau chúng.','sp79.jpg',370000,40,2024,_binary '',7),(102,2,'10 Vạn Câu Hỏi Vì Sao? - Khám Phá Các Thể Loại Và Lợi Ích Của Âm Nhạc','Tài liệu giáo khoa dành cho trẻ em, giải đáp 10 câu hỏi \"Vì sao?\" về các hành tinh, giúp trẻ khám phá vũ trụ một cách thú vị và dễ hiểu.','sp80.jpg',250000,70,2023,_binary '',7),(103,2,'Khám Phá Và Thực Hành Steam Qua Tác Phẩm Kinh Điển - Khu Vườn Bí Mật','Sách hướng dẫn thực hành STEAM qua các dự án thực tế, giúp học sinh phát triển tư duy sáng tạo và kỹ năng giải quyết vấn đề.','sp81.jpg',300000,50,2024,_binary '',7),(104,2,'Tác Phẩm Chọn Lọc - Văn Học Mỹ - Bé Năm Mới Và Những Truyện Ngắn Khác','Tuyển tập các tác phẩm văn học Mỹ chọn lọc, giới thiệu những câu chuyện sâu sắc và phong cách viết độc đáo của các tác giả nổi tiếng.','sp82.jpg',280000,60,2023,_binary '',7),(105,1,'Sách mới 2025',NULL,'image.jpg',0,0,2025,_binary '\0',7),(106,1,'Sách mới 2025',NULL,NULL,114.99999999999999,2,2025,_binary '\0',7),(107,1,'Sách mfffới 2025',NULL,NULL,0,0,2025,_binary '\0',7),(108,1,'Sách mghfffới 2025',NULL,NULL,0,0,2025,_binary '\0',7);
/*!40000 ALTER TABLE `sanpham` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `shipment`
--

DROP TABLE IF EXISTS `shipment`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `shipment` (
  `id` bigint NOT NULL,
  `material_id` bigint DEFAULT NULL,
  `import_id` bigint DEFAULT NULL,
  `quantity` double DEFAULT NULL,
  `unit_price` double DEFAULT NULL,
  `mfg` date DEFAULT NULL,
  `exp` date DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_shipment_import_note` (`import_id`),
  KEY `fk_shipment_material` (`material_id`),
  CONSTRAINT `fk_shipment_import_note` FOREIGN KEY (`import_id`) REFERENCES `import_note` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_shipment_material` FOREIGN KEY (`material_id`) REFERENCES `material` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `shipment`
--

LOCK TABLES `shipment` WRITE;
/*!40000 ALTER TABLE `shipment` DISABLE KEYS */;
/*!40000 ALTER TABLE `shipment` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sp_khuyen_mai`
--

DROP TABLE IF EXISTS `sp_khuyen_mai`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sp_khuyen_mai` (
  `MaSPKM` int NOT NULL AUTO_INCREMENT,
  `MaKM` int NOT NULL,
  `MaSP` int NOT NULL,
  PRIMARY KEY (`MaSPKM`),
  UNIQUE KEY `MaKM` (`MaKM`,`MaSP`),
  KEY `MaSP` (`MaSP`),
  CONSTRAINT `sp_khuyen_mai_ibfk_1` FOREIGN KEY (`MaKM`) REFERENCES `khuyen_mai` (`MaKM`),
  CONSTRAINT `sp_khuyen_mai_ibfk_2` FOREIGN KEY (`MaSP`) REFERENCES `sanpham` (`MaSP`)
) ENGINE=InnoDB AUTO_INCREMENT=50 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sp_khuyen_mai`
--

LOCK TABLES `sp_khuyen_mai` WRITE;
/*!40000 ALTER TABLE `sp_khuyen_mai` DISABLE KEYS */;
INSERT INTO `sp_khuyen_mai` VALUES (24,1,1),(25,1,2),(26,1,3),(27,1,4),(28,1,5),(29,2,6),(30,2,7),(31,2,8),(32,2,9),(33,3,1),(34,3,2),(35,3,3),(36,3,4),(37,4,5),(38,5,6),(39,5,7),(40,6,1),(41,6,2),(42,6,3),(43,6,4),(44,6,5),(45,6,6),(46,6,7),(47,6,8),(48,6,9);
/*!40000 ALTER TABLE `sp_khuyen_mai` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `staff`
--

DROP TABLE IF EXISTS `staff`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `staff` (
  `id` bigint NOT NULL,
  `no.` varchar(255) NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `gender` bit(1) DEFAULT NULL,
  `birthdate` date DEFAULT NULL,
  `phone` varchar(255) DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `hourly_wage` double DEFAULT NULL,
  `deleted` bit(1) DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `staff`
--

LOCK TABLES `staff` WRITE;
/*!40000 ALTER TABLE `staff` DISABLE KEYS */;
/*!40000 ALTER TABLE `staff` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `supplier`
--

DROP TABLE IF EXISTS `supplier`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `supplier` (
  `id` bigint NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `phone` varchar(255) DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `deleted` bit(1) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `supplier`
--

LOCK TABLES `supplier` WRITE;
/*!40000 ALTER TABLE `supplier` DISABLE KEYS */;
/*!40000 ALTER TABLE `supplier` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tacgia`
--

DROP TABLE IF EXISTS `tacgia`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tacgia` (
  `MaTG` int NOT NULL AUTO_INCREMENT,
  `TenTG` varchar(255) NOT NULL,
  `NgaySinh` date DEFAULT NULL,
  `QuocTich` varchar(100) DEFAULT NULL,
  `TieuSu` text,
  `AnhTG` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`MaTG`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tacgia`
--

LOCK TABLES `tacgia` WRITE;
/*!40000 ALTER TABLE `tacgia` DISABLE KEYS */;
INSERT INTO `tacgia` VALUES (1,'Nguyễn Nhật Ánh','1955-05-07','Việt Nam','Fujiko F. Fujio, tên thật Hiroshi Fujimoto (1933-1996), là họa sĩ truyện tranh Nhật Bản, người sáng tạo Doraemon năm 1969, bộ manga khoa học viễn tưởng nổi tiếng về chú mèo robot từ tương lai giúp cậu bé Nobita, đạt hơn 300 triệu bản bán ra, giành nhiều giải thưởng danh giá và trở thành biểu tượng văn hóa toàn cầu với bảo tàng riêng tại Kawasaki.','tg1.jpg'),(2,'Tô Hoài','1920-09-27','Việt Nam','Nam Cao, tên thật Trần Hữu Tri (1915-1951), là nhà văn hiện thực tiêu biểu của văn học Việt Nam thế kỷ 20, sinh ra trong một gia đình nông dân nghèo tại làng Đại Hoàng, tỉnh Hà Nam. Xuất thân từ hoàn cảnh khó khăn, ông học đến trung học ở Nam Định nhưng không tốt nghiệp do sức khỏe yếu và gia cảnh túng thiếu, sau đó mưu sinh bằng nhiều nghề như dạy học, làm thư ký, và viết báo. Nam Cao bắt đầu sáng tác từ những năm 1930, nổi bật với tác phẩm Chí Phèo (1941), khắc họa số phận bi thảm của người nông dân trong xã hội phong kiến nửa thuộc địa, cùng các truyện ngắn như Lão Hạc, Đời mưa gió, thể hiện tư tưởng nhân đạo sâu sắc và tài năng phân tích tâm lý nhân vật. Ông gia nhập Hội Văn hóa Cứu quốc năm 1943, tích cực tham gia cách mạng, và hy sinh năm 1951 trong một chuyến công tác tại Ninh Bình, để lại di sản văn học giàu giá trị về con người và xã hội.','tg2.jpg'),(3,'Nam Cao','1915-10-29','Việt Nam','Ernest Hemingway (1899–1961), nhà văn và nhà báo người Mỹ, từng tham gia Chiến tranh thế giới lần thứ I, nổi tiếng với nguyên lý “tảng băng trôi” trong văn phong kiệm lời nhưng giàu ý nghĩa, để lại các tác phẩm kinh điển như Ông già và biển cả – một bản anh hùng ca ngợi sức lao động và khát vọng con người, Chuông nguyện hồn ai, và được vinh danh với giải Pulitzer 1953 cùng Nobel Văn học 1954.','tg3.jpg'),(4,' PGS.TS. Bùi Mạnh Hùng','1765-01-03','Việt Nam','Trao đổi với PV báo Dân Việt, PGS.TS. Bùi Mạnh Hùng, Điều phối viên chính Ban phát triển Chương trình Giáo dục phổ thông 2018, Tổng Chủ biên SGK môn Tiếng Việt – Ngữ văn, bộ sách \"Kết nối tri thức với cuộc sống\", cho hay: \"Mới đây, mạng xã hội có ý kiến trái chiều về bài thơ \"Tiếng hạt nảy mầm\" của tác giả Tô Hà được dùng làm văn bản đọc ở bài 5, chủ điểm \"Thế giới tuổi thơ\" trong sách giáo khoa (SGK) Tiếng Việt 5, bộ sách \"Kết nối tri thức với cuộc sống\". \".','tg4.jpg'),(5,'Xuân Diệu','1915-10-29','Việt Nam','Xuân Diệu quê ở làng Trảo Nha, huyện Can Lộc, tỉnh Hà Tĩnh nhưng sinh tại quê mẹ Gò Bồi, thôn Tùng Giản, xã Phước Hòa, huyện Tuy Phước, tỉnh Bình Định.[3] Cha là ông Ngô Xuân Thọ (trong tộc phả ghi là Ngô Xuân Thụ) và mẹ là bà Nguyễn Thị Hiệp. Sau này ông lấy tên làng là Trảo Nha làm bút danh. Xuân Diệu sống ở Tuy Phước đến năm 11 tuổi thì ông vào Nam học ở Quy Nhơn.[4]\".','tg5.jpg'),(6,' Isao Takahata','1920-10-04','Nhật Bản',' Isao Takahata bắt đầu sự nghiệp làm phim hoạt hình với công việc tại xưởng Toei từ năm 1959. Đây cũng là nơi giúp ông lần đầu gặp gỡ người cộng sự lâu năm Hayao Miyazaki.Cùng với nhau, họ lập nên xưởng phim hoạt hình lừng danh Studio Ghibli vào năm 1985. Theo giới truyền thông Nhật Bản, Takahata và Miyazaki vừa là bạn, nhưng cũng vừa là đối thủ trong dòng phim hoạt hình.\".','tg6.jpg'),(7,'William Shakespeare','1975-03-15','Hoa Kỳ','Shakespeare bắt đầu sự nghiệp của mình trong lĩnh vực diễn xuất trước khi chuyển sang viết kịch. Vào những năm 1590, trong thời kỳ Elizabeth, ông đã viết những vở kịch đầu tiên và nhanh chóng trở thành một trong những nhà văn hàng đầu. Dù vậy, cuộc đời của ông không chỉ toàn những vinh quang mà còn đầy thử thách. Ông phải đối mặt với nhiều khó khăn trong cuộc sống, bao gồm việc nuôi dưỡng một gia đình đông con và kiếm tiền từ việc viết tác phẩm.','tg7.jpg');
/*!40000 ALTER TABLE `tacgia` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `taikhoan`
--

DROP TABLE IF EXISTS `taikhoan`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `taikhoan` (
  `MaTK` int NOT NULL AUTO_INCREMENT,
  `TenTK` varchar(20) NOT NULL,
  `MatKhau` varchar(20) DEFAULT NULL,
  `MaQuyen` int NOT NULL,
  `NgayTao` date DEFAULT NULL,
  `TinhTrang` bit(1) DEFAULT NULL,
  PRIMARY KEY (`MaTK`),
  UNIQUE KEY `TenTK` (`TenTK`),
  KEY `FK_TaiKhoan_NhomQuyen` (`MaQuyen`),
  CONSTRAINT `FK_TaiKhoan_NhomQuyen` FOREIGN KEY (`MaQuyen`) REFERENCES `nhomquyen` (`MaNQ`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `taikhoan`
--

LOCK TABLES `taikhoan` WRITE;
/*!40000 ALTER TABLE `taikhoan` DISABLE KEYS */;
INSERT INTO `taikhoan` VALUES (2,'NV002','12345678',1,'2021-09-22',_binary ''),(3,'NV003','123456',2,'2021-09-22',_binary ''),(4,'NV004','123456',2,'2021-09-22',_binary ''),(5,'NV005','123456',2,'2021-09-26',_binary ''),(6,'NV006','123456',2,'2023-01-27',_binary ''),(7,'NV007','123456',3,'2023-03-28',_binary ''),(8,'NV008','123456',3,'2023-03-29',_binary ''),(9,'NV009','123456',3,'2021-09-22',_binary ''),(12,'NV012','123456',1,'2025-05-13',_binary ''),(13,'NV013','123456',3,'2025-09-11',_binary '');
/*!40000 ALTER TABLE `taikhoan` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `theloai`
--

DROP TABLE IF EXISTS `theloai`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `theloai` (
  `MaTL` int NOT NULL AUTO_INCREMENT,
  `TenTL` varchar(50) DEFAULT NULL,
  `TinhTrang` bit(1) DEFAULT NULL,
  PRIMARY KEY (`MaTL`)
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `theloai`
--

LOCK TABLES `theloai` WRITE;
/*!40000 ALTER TABLE `theloai` DISABLE KEYS */;
INSERT INTO `theloai` VALUES (1,'Văn học',_binary ''),(2,'Khoa học viễn tưởng',_binary ''),(3,'Huyền bí',_binary ''),(4,'Lịch sử',_binary ''),(5,'Trinh thám',_binary ''),(6,'Khoa học',_binary ''),(7,'Tôn giáo và tâm linh',_binary ''),(8,'Self-help',_binary ''),(9,'Ngôn tình',_binary ''),(10,'Tiểu thuyết',_binary ''),(11,'Khoa học viễn tưởng',_binary ''),(12,'Huyền bí',_binary ''),(13,'Lịch sử',_binary ''),(14,'Trinh thám',_binary ''),(15,'Khoa học',_binary ''),(16,'Tôn giáo và tâm linh',_binary ''),(17,'Self-help1',_binary '\0'),(21,'hoạt hình ',_binary '');
/*!40000 ALTER TABLE `theloai` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `xin_nghi_phep`
--

DROP TABLE IF EXISTS `xin_nghi_phep`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `xin_nghi_phep` (
  `id` int NOT NULL AUTO_INCREMENT,
  `MaTK` int NOT NULL,
  `ngay_bat_dau` date NOT NULL,
  `ngay_ket_thuc` date NOT NULL,
  `ly_do` varchar(255) DEFAULT NULL,
  `trang_thai` enum('Cho_duyet','Da_duyet','Tu_choi') DEFAULT 'Cho_duyet',
  `nguoi_duyet` varchar(20) DEFAULT NULL,
  `ngay_duyet` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_xinnghiphep_taikhoan` (`MaTK`),
  CONSTRAINT `fk_xinnghiphep_taikhoan` FOREIGN KEY (`MaTK`) REFERENCES `taikhoan` (`MaTK`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `xin_nghi_phep`
--

LOCK TABLES `xin_nghi_phep` WRITE;
/*!40000 ALTER TABLE `xin_nghi_phep` DISABLE KEYS */;
INSERT INTO `xin_nghi_phep` VALUES (2,2,'2025-06-05','2025-06-06','Việc gia đình','Da_duyet','admin','2025-06-20 09:31:24'),(3,3,'2025-06-10','2025-06-12','Đi du lịch','Tu_choi','admin','2025-06-02 10:00:00'),(4,4,'2025-06-15','2025-06-15','Khám bệnh','Da_duyet','admin','2025-06-10 14:00:00'),(5,5,'2025-06-18','2025-06-19','Chăm con nhỏ','Da_duyet','admin','2025-06-18 14:53:54'),(6,6,'2025-06-20','2025-06-22','Nghỉ phép năm','Da_duyet','admin','2025-06-15 11:00:00'),(7,7,'2025-06-25','2025-06-26','Việc cá nhân','Da_duyet','admin','2025-06-16 22:39:38'),(8,8,'2025-06-28','2025-06-29','Nghỉ cưới','Da_duyet','admin','2025-06-20 16:00:00'),(9,2,'2025-06-20','2025-06-20','to bị bênh ','Da_duyet','admin','2025-07-25 21:10:24'),(10,3,'2025-07-25','2025-07-25','TÔI BỊ BỆNH RỒI \n','Da_duyet','admin','2025-07-25 21:10:39'),(11,2,'2025-08-21','2025-08-21','TÔI BỊ ỐM XIN NGHĨ 1 HÔM NHÉ \n','Da_duyet','admin','2025-08-21 20:29:04'),(12,4,'2025-09-04','2025-09-04','tôi bị bệnh rồi cho tôi nghĩ nha \n','Cho_duyet',NULL,NULL);
/*!40000 ALTER TABLE `xin_nghi_phep` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-09-12 10:29:18
