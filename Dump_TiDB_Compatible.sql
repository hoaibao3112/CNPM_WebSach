-- MySQL dump 10.13  Distrib 8.0.43, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: qlbs
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `account`
--




UN

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
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `binhluan`
--



INSERT INTO `binhluan` VALUES (1,NULL,1,2,'ggh','2025-05-19 08:20:34','Hiển thị'),(2,NULL,18,2,'sách hay nha các pro','2025-05-19 08:21:22','Hiển thị'),(3,NULL,1,1,'hay sách','2025-05-20 22:47:15','Hiển thị'),(4,NULL,1,54,'sách này con tôi rất thích luôn','2025-05-20 22:47:55','Hiển thị'),(5,NULL,1,1,'ALO ALO','2025-08-21 20:02:30','Hiển thị'),(6,NULL,19,1,'Test comment từ Postman - hẹ hẹ','2025-09-11 20:25:13','Hiển thị'),(7,NULL,19,2,'sach hay','2025-09-11 20:48:53','Hiển thị'),(8,7,18,2,'tôi cũng thấy vậy','2025-09-11 21:02:04','Hiển thị'),(9,6,19,1,'test đc chưa','2025-09-11 23:01:58','Hiển thị'),(10,9,18,1,'test đc rồi nè','2025-09-11 23:02:49','Hiển thị'),(11,5,19,1,'nghe','2025-09-11 23:03:35','Hiển thị'),(12,NULL,19,103,'fffgfgfgfgfgfgfgfgfgfgfgfgfgfg','2025-09-12 13:32:08','Hiển thị');

UN

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
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `binhluan_like`
--



INSERT INTO `binhluan_like` VALUES (1,6,18,'2025-09-11 14:24:00'),(2,5,18,'2025-09-11 14:24:04'),(3,3,18,'2025-09-11 14:24:05'),(5,6,19,'2025-09-11 16:03:26'),(6,5,19,'2025-09-11 16:03:28'),(7,12,19,'2025-09-12 06:32:10'),(10,9,19,'2025-10-17 01:05:06');

UN

--
-- Table structure for table `cauhinh_chamcong`
--

DROP TABLE IF EXISTS `cauhinh_chamcong`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cauhinh_chamcong` (
  `id` int NOT NULL AUTO_INCREMENT,
  `gio_vao_chuan` time DEFAULT '08:00:00',
  `gio_ra_chuan` time DEFAULT '17:00:00',
  `ngay_nghi_tuan` varchar(50) DEFAULT 'CN',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cauhinh_chamcong`
--




UN

--
-- Table structure for table `cauhoi_sothich`
--

DROP TABLE IF EXISTS `cauhoi_sothich`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cauhoi_sothich` (
  `MaCauHoi` int NOT NULL AUTO_INCREMENT,
  `MaForm` int NOT NULL,
  `NoiDungCauHoi` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Nội dung câu hỏi',
  `LoaiCauHoi` enum('single','multi','rating','text','entity_theloai','entity_tacgia','entity_hinhthuc','entity_khoanggia','entity_namxb','entity_sotrang') COLLATE utf8mb4_unicode_ci NOT NULL,
  `BatBuoc` tinyint(1) DEFAULT '0' COMMENT '1=Bắt buộc trả lời',
  `ThuTu` int DEFAULT '0' COMMENT 'Thứ tự hiển thị',
  PRIMARY KEY (`MaCauHoi`),
  KEY `idx_maform_thutu` (`MaForm`,`ThuTu`),
  CONSTRAINT `cauhoi_sothich_ibfk_1` FOREIGN KEY (`MaForm`) REFERENCES `form_sothich` (`MaForm`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=35 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Câu hỏi trong form sở thích';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cauhoi_sothich`
--



INSERT INTO `cauhoi_sothich` VALUES (1,1,'Bạn thích đọc thể loại sách nào? (Chọn nhiều)','entity_theloai',1,1),(2,1,'Tác giả nào bạn yêu thích? (Chọn nhiều)','entity_tacgia',0,2),(3,1,'Ngân sách mua sách thường của bạn?','entity_khoanggia',1,3),(4,1,'Bạn thích hình thức sách nào?','entity_hinhthuc',0,4),(5,1,'Bạn thích sách xuất bản khi nào?','entity_namxb',0,5),(6,1,'Bạn thích độ dày sách như thế nào?','entity_sotrang',0,6),(7,2,'bạn có thích sách không','entity_theloai',1,0),(8,2,'bạn có thích sách không\n','entity_hinhthuc',0,0),(9,3,'BẠN CÓ THÍCH ĐỌC SÁCH THỂ LOẠI GÌ','entity_theloai',1,1),(11,3,'BẠN THÍCH SÁCH SÁCH KHUYẾN MÃI KHONG','entity_khoanggia',0,3),(12,4,'hẹ hẹ','entity_khoanggia',1,0),(13,5,'tôi là siu nhan','entity_namxb',0,0),(14,5,'bạn có thích số trang','entity_sotrang',1,0),(15,6,'Sách bạn muons mua là gì','entity_theloai',1,1),(16,6,'bạn muốn mua sách khoảng bao nhiêu ','entity_khoanggia',1,3),(18,7,'SÁCH BẠN MUỐN ĐỌC','entity_hinhthuc',1,1),(19,8,'Bạn thích đọc sách thể loại gì nhất','entity_theloai',1,1),(20,8,'bạn thích mua sách với giá bao nhiêu','entity_khoanggia',0,0),(21,9,'bạn có thích sách thuộc thể loại gì ','entity_theloai',1,1),(22,9,'123','entity_khoanggia',1,1),(23,9,'123','single',0,1),(24,9,'1111','entity_khoanggia',0,0),(25,9,'55','single',0,1),(26,9,'888','single',0,2),(27,10,'BẠN CÓ THỂ ','entity_sotrang',0,1),(28,10,'THỂ LOẠI BẠN THICH','entity_khoanggia',1,2),(29,11,'Ban thích sách dạng gì','entity_theloai',1,1),(30,11,'ban thích gia sản phẩm như nào ','entity_khoanggia',1,2),(31,12,'33333','entity_khoanggia',0,0),(32,12,'BẠN CÓ THÍCH SÁCH NƯỚC NGOÀI KHÔNG','entity_hinhthuc',1,2),(33,13,'12121212','entity_hinhthuc',0,2),(34,13,'22323','entity_namxb',0,0);

UN

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
  `trang_thai` enum('Di_lam','Nghi_phep','Nghi_khong_phep','Lam_them','Di_tre') DEFAULT 'Di_lam',
  `ghi_chu` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_chamcong_taikhoan` (`MaTK`),
  CONSTRAINT `fk_chamcong_taikhoan` FOREIGN KEY (`MaTK`) REFERENCES `taikhoan` (`MaTK`)
) ENGINE=InnoDB AUTO_INCREMENT=795 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cham_cong`
--



INSERT INTO `cham_cong` VALUES (2,2,'2024-06-19',NULL,NULL,'Di_lam',NULL),(4,2,'2025-06-19','08:00:00','17:00:00','Di_lam','Chấm công test'),(5,2,'2025-06-19',NULL,NULL,'Di_lam',NULL),(6,2,'2025-06-19','13:31:42','17:00:00','Di_lam','Chấm công thành công'),(7,2,'2025-06-19','13:31:59','17:00:00','Di_lam','Chấm công thành công'),(8,2,'2025-06-19','13:32:48','17:00:00','Di_lam','Chấm công thành công'),(9,2,'2025-06-19','13:35:07','17:00:00','Di_lam','Chấm công thành công'),(10,2,'2025-06-19','13:36:54','17:00:00','Di_lam','Chấm công thành công'),(11,4,'2025-06-19','13:39:44','17:00:00','Di_lam','Chấm công thành công'),(12,7,'2025-06-19','14:40:26','17:00:00','Di_lam','Chấm công thành công'),(13,2,'2025-06-20','09:31:05','17:00:00','Di_lam','Chấm công thành công'),(14,3,'2025-06-22','14:29:34','17:00:00','Di_lam','Chấm công thành công'),(15,2,'2025-07-23','16:11:39','17:00:00','Di_lam','Chấm công thành công'),(16,3,'2025-07-25','20:52:15','17:00:00','Di_lam','Chấm công thành công'),(17,4,'2025-09-04','14:57:20','17:00:00','Di_lam','Chấm công thành công'),(18,7,'2025-09-10','19:53:22','17:00:00','Di_lam','Chấm công thành công'),(19,7,'2025-09-15','09:36:08','17:00:00','Di_lam','Chấm công thành công'),(20,2,'2025-09-17','11:43:53','17:00:00','Di_lam','Chấm công thành công'),(21,2,'2025-09-18','16:44:48','17:00:00','Di_lam','Chấm công thành công'),(22,4,'2025-09-18','16:47:33','17:00:00','Di_lam','Chấm công thành công'),(23,2,'2025-09-01',NULL,NULL,'Di_lam',''),(24,2,'2025-09-02',NULL,NULL,'Di_lam',''),(25,2,'2025-09-03',NULL,NULL,'Di_lam',''),(26,2,'2025-09-04',NULL,NULL,'Di_lam',''),(27,4,'2025-09-03',NULL,NULL,'Di_lam',''),(28,2,'2025-09-05',NULL,NULL,'Di_lam',''),(29,2,'2025-09-06',NULL,NULL,'Di_lam',''),(30,2,'2025-09-07',NULL,NULL,'Di_lam',''),(31,2,'2025-09-08',NULL,NULL,'Di_lam',''),(32,2,'2025-09-04',NULL,NULL,'Lam_them',''),(33,2,'2025-09-04',NULL,NULL,'Di_tre',''),(34,2,'2025-09-04',NULL,NULL,'Nghi_phep',''),(35,2,'2025-09-05',NULL,NULL,'Lam_them',''),(36,2,'2025-09-01',NULL,NULL,'Lam_them',''),(37,2,'2025-09-01',NULL,NULL,'Di_tre',''),(38,2,'2025-09-02',NULL,NULL,'Lam_them',''),(39,2,'2025-09-02',NULL,NULL,'Di_tre',''),(40,13,'2025-09-01',NULL,NULL,'Di_lam',''),(41,13,'2025-09-02',NULL,NULL,'Di_lam',''),(42,13,'2025-09-13',NULL,NULL,'Nghi_phep',''),(43,13,'2025-09-14',NULL,NULL,'Nghi_phep',''),(44,13,'2025-09-04',NULL,NULL,'Nghi_phep',''),(45,13,'2025-09-16',NULL,NULL,'Nghi_phep',''),(46,13,'2025-09-26',NULL,NULL,'Nghi_phep',''),(47,13,'2025-09-07',NULL,NULL,'Nghi_phep',''),(48,13,'2025-09-15',NULL,NULL,'Lam_them','Tăng ca 3 giờ'),(49,13,'2025-09-25',NULL,NULL,'Lam_them','Tăng ca 3 giờ'),(50,13,'2025-09-17',NULL,NULL,'Lam_them','Tăng ca 3 giờ'),(51,14,'2025-09-01',NULL,NULL,'Lam_them','Tăng ca 3 giờ'),(52,14,'2025-09-02',NULL,NULL,'Di_lam',''),(53,14,'2025-09-03',NULL,NULL,'Di_lam',''),(54,14,'2025-09-04',NULL,NULL,'Di_lam',''),(55,14,'2025-09-13',NULL,NULL,'Nghi_khong_phep',''),(56,14,'2025-09-14',NULL,NULL,'Nghi_khong_phep',''),(57,14,'2025-09-16',NULL,NULL,'Nghi_khong_phep',''),(58,4,'2025-03-01',NULL,NULL,'Di_tre',''),(59,4,'2025-03-02',NULL,NULL,'Di_tre',''),(60,4,'2025-03-03',NULL,NULL,'Di_lam',''),(61,4,'2025-03-04',NULL,NULL,'Di_lam',''),(62,4,'2025-03-05',NULL,NULL,'Di_lam',''),(63,4,'2025-03-06',NULL,NULL,'Di_lam',''),(64,4,'2025-03-07',NULL,NULL,'Di_lam',''),(65,4,'2025-03-08',NULL,NULL,'Di_lam',''),(66,4,'2025-03-09',NULL,NULL,'Di_lam',''),(67,4,'2025-03-10',NULL,NULL,'Di_lam',''),(68,4,'2025-03-11',NULL,NULL,'Di_lam',''),(69,4,'2025-03-12',NULL,NULL,'Di_lam',''),(70,4,'2025-03-13',NULL,NULL,'Di_lam',''),(71,4,'2025-03-14',NULL,NULL,'Di_lam',''),(72,4,'2025-03-15',NULL,NULL,'Di_lam',''),(73,4,'2025-03-16',NULL,NULL,'Di_lam',''),(74,4,'2025-03-17',NULL,NULL,'Di_lam',''),(75,4,'2025-03-19',NULL,NULL,'Di_lam',''),(76,4,'2025-03-18',NULL,NULL,'Di_lam',''),(77,4,'2025-03-20',NULL,NULL,'Di_lam',''),(78,4,'2025-03-30',NULL,NULL,'Di_lam',''),(79,4,'2025-03-29',NULL,NULL,'Di_lam',''),(80,4,'2025-03-28',NULL,NULL,'Di_lam',''),(81,4,'2025-03-27',NULL,NULL,'Di_lam',''),(82,4,'2025-03-26',NULL,NULL,'Di_lam',''),(83,4,'2025-03-24',NULL,NULL,'Di_lam',''),(84,4,'2025-03-23',NULL,NULL,'Di_lam',''),(85,4,'2025-03-25',NULL,NULL,'Di_lam',''),(86,4,'2025-03-22',NULL,NULL,'Di_lam',''),(87,4,'2025-03-21',NULL,NULL,'Di_lam',''),(88,3,'2025-09-02',NULL,NULL,'Nghi_phep',''),(89,12,'2025-09-11',NULL,NULL,'Di_lam',''),(90,12,'2025-09-12',NULL,NULL,'Nghi_phep',''),(91,12,'2025-09-13',NULL,NULL,'Di_lam',''),(92,12,'2025-09-01',NULL,NULL,'Di_lam',''),(93,12,'2025-09-02',NULL,NULL,'Di_lam',''),(94,12,'2025-09-03',NULL,NULL,'Nghi_phep',''),(95,12,'2025-09-04',NULL,NULL,'Nghi_phep',''),(96,12,'2025-09-05',NULL,NULL,'Nghi_phep',''),(97,12,'2025-09-06',NULL,NULL,'Nghi_phep',''),(98,12,'2025-09-07',NULL,NULL,'Nghi_phep',''),(99,12,'2025-09-08',NULL,NULL,'Nghi_phep',''),(100,12,'2025-09-09',NULL,NULL,'Nghi_phep',''),(101,12,'2025-09-10',NULL,NULL,'Nghi_phep',''),(102,12,'2025-09-14',NULL,NULL,'Nghi_phep',''),(103,12,'2025-09-15',NULL,NULL,'Nghi_phep',''),(104,12,'2025-09-17',NULL,NULL,'Nghi_phep',''),(105,12,'2025-09-18',NULL,NULL,'Nghi_phep',''),(106,12,'2025-09-16',NULL,NULL,'Nghi_phep',''),(107,12,'2025-09-19',NULL,NULL,'Nghi_phep',''),(108,12,'2025-09-20',NULL,NULL,'Nghi_phep',''),(109,12,'2025-09-21',NULL,NULL,'Nghi_phep',''),(110,12,'2025-09-22',NULL,NULL,'Nghi_phep',''),(111,12,'2025-09-23',NULL,NULL,'Nghi_phep',''),(112,12,'2025-09-24',NULL,NULL,'Nghi_phep',''),(113,12,'2025-09-25',NULL,NULL,'Nghi_phep',''),(114,12,'2025-09-26',NULL,NULL,'Di_lam',''),(115,12,'2025-09-27',NULL,NULL,'Di_lam',''),(116,12,'2025-09-29',NULL,NULL,'Di_lam',''),(117,12,'2025-09-28',NULL,NULL,'Di_lam',''),(118,12,'2025-09-30',NULL,NULL,'Di_lam',''),(119,2,'2025-09-15',NULL,NULL,'Lam_them','Tăng ca 1 giờ'),(120,2,'2025-09-12',NULL,NULL,'Lam_them','Tăng ca 3 giờ'),(121,2,'2025-09-16',NULL,NULL,'Lam_them','Tăng ca 3 giờ'),(122,2,'2025-09-22',NULL,NULL,'Lam_them','Tăng ca 3 giờ'),(123,2,'2025-09-11',NULL,NULL,'Lam_them','Tăng ca 3 giờ'),(124,2,'2025-09-13',NULL,NULL,'Lam_them','Tăng ca 3 giờ'),(125,2,'2025-09-14',NULL,NULL,'Lam_them','Tăng ca 3 giờ'),(126,2,'2025-09-23',NULL,NULL,'Lam_them','Tăng ca 3 giờ'),(127,2,'2025-09-24',NULL,NULL,'Lam_them','Tăng ca 3 giờ'),(128,2,'2025-09-25',NULL,NULL,'Lam_them','Tăng ca 3 giờ'),(129,2,'2025-09-21',NULL,NULL,'Lam_them','Tăng ca 3 giờ'),(130,2,'2025-09-09',NULL,NULL,'Lam_them','Tăng ca 3 giờ'),(131,2,'2025-09-10',NULL,NULL,'Lam_them','Tăng ca 3 giờ'),(132,2,'2025-09-19',NULL,NULL,'Lam_them','Tăng ca 2 giờ'),(133,2,'2025-09-20',NULL,NULL,'Lam_them','Tăng ca 2 giờ'),(134,2,'2025-09-26',NULL,NULL,'Lam_them','Tăng ca 2 giờ'),(135,2,'2025-09-27',NULL,NULL,'Lam_them','Tăng ca 2 giờ'),(136,2,'2025-09-29',NULL,NULL,'Lam_them','Tăng ca 2 giờ'),(137,2,'2025-09-28',NULL,NULL,'Lam_them','Tăng ca 2 giờ'),(138,2,'2025-09-30',NULL,NULL,'Lam_them','Tăng ca 2 giờ'),(139,9,'2025-09-02',NULL,NULL,'Di_lam',''),(140,9,'2025-09-14',NULL,NULL,'Di_lam',''),(141,9,'2025-09-16',NULL,NULL,'Di_lam',''),(142,9,'2025-09-13',NULL,NULL,'Di_lam',''),(143,9,'2025-09-05',NULL,NULL,'Nghi_phep',''),(144,9,'2025-09-15',NULL,NULL,'Di_lam',''),(145,9,'2025-09-11',NULL,NULL,'Nghi_phep',''),(146,9,'2025-09-03',NULL,NULL,'Di_lam',''),(147,9,'2025-09-01',NULL,NULL,'Di_lam',''),(148,9,'2025-09-12',NULL,NULL,'Nghi_phep',''),(149,9,'2025-09-06',NULL,NULL,'Nghi_phep',''),(150,9,'2025-09-07',NULL,NULL,'Nghi_phep',''),(151,9,'2025-09-08',NULL,NULL,'Nghi_phep',''),(152,9,'2025-09-09',NULL,NULL,'Nghi_phep',''),(153,9,'2025-09-10',NULL,NULL,'Nghi_phep',''),(154,9,'2025-09-21',NULL,NULL,'Di_tre',''),(155,9,'2025-09-22',NULL,NULL,'Di_tre',''),(156,9,'2025-09-23',NULL,NULL,'Di_tre',''),(157,9,'2025-09-24',NULL,NULL,'Di_tre',''),(158,9,'2025-09-25',NULL,NULL,'Nghi_khong_phep',''),(159,9,'2025-09-17',NULL,NULL,'Nghi_khong_phep',''),(160,9,'2025-09-26',NULL,NULL,'Nghi_khong_phep',''),(161,9,'2025-09-18',NULL,NULL,'Nghi_khong_phep',''),(162,9,'2025-09-27',NULL,NULL,'Nghi_phep',''),(163,9,'2025-09-19',NULL,NULL,'Nghi_phep',''),(164,9,'2025-09-28',NULL,NULL,'Nghi_phep',''),(165,9,'2025-09-29',NULL,NULL,'Nghi_phep',''),(166,9,'2025-09-30',NULL,NULL,'Nghi_phep',''),(167,9,'2025-09-20',NULL,NULL,'Nghi_phep',''),(168,9,'2025-09-04',NULL,NULL,'Di_lam',''),(169,6,'2025-09-11',NULL,NULL,'Di_lam',''),(170,6,'2025-09-04',NULL,NULL,'Di_lam',''),(171,6,'2025-09-07',NULL,NULL,'Di_lam',''),(172,6,'2025-09-01',NULL,NULL,'Di_lam',''),(173,6,'2025-09-05',NULL,NULL,'Di_lam',''),(174,6,'2025-09-06',NULL,NULL,'Di_lam',''),(175,6,'2025-09-02',NULL,NULL,'Di_lam',''),(176,6,'2025-09-03',NULL,NULL,'Di_lam',''),(177,6,'2025-09-08',NULL,NULL,'Di_lam',''),(178,6,'2025-09-09',NULL,NULL,'Di_lam',''),(179,6,'2025-09-10',NULL,NULL,'Di_lam',''),(180,6,'2025-09-12',NULL,NULL,'Di_lam',''),(181,6,'2025-09-13',NULL,NULL,'Di_lam',''),(182,6,'2025-09-14',NULL,NULL,'Di_lam',''),(183,6,'2025-09-15',NULL,NULL,'Di_lam',''),(184,6,'2025-09-16',NULL,NULL,'Di_lam',''),(185,6,'2025-09-17',NULL,NULL,'Di_lam',''),(186,6,'2025-09-18',NULL,NULL,'Di_lam',''),(187,6,'2025-09-19',NULL,NULL,'Di_lam',''),(188,6,'2025-09-20',NULL,NULL,'Lam_them','Tăng ca 1 giờ'),(189,6,'2025-09-30',NULL,NULL,'Lam_them','Tăng ca 1 giờ'),(190,6,'2025-09-29',NULL,NULL,'Lam_them','Tăng ca 1 giờ'),(191,6,'2025-09-28',NULL,NULL,'Lam_them','Tăng ca 1 giờ'),(192,6,'2025-09-27',NULL,NULL,'Lam_them','Tăng ca 1 giờ'),(193,6,'2025-09-26',NULL,NULL,'Lam_them','Tăng ca 1 giờ'),(194,6,'2025-09-25',NULL,NULL,'Lam_them','Tăng ca 1 giờ'),(195,6,'2025-09-24',NULL,NULL,'Lam_them','Tăng ca 1 giờ'),(196,6,'2025-09-23',NULL,NULL,'Lam_them','Tăng ca 1 giờ'),(197,6,'2025-09-21',NULL,NULL,'Di_lam',''),(198,6,'2025-09-22',NULL,NULL,'Di_lam',''),(199,5,'2025-09-01',NULL,NULL,'Lam_them','Tăng ca 2 giờ'),(200,5,'2025-09-06',NULL,NULL,'Di_lam',''),(201,5,'2025-09-05',NULL,NULL,'Di_lam',''),(202,5,'2025-09-02',NULL,NULL,'Lam_them','Tăng ca 2 giờ'),(203,5,'2025-09-08',NULL,NULL,'Di_lam',''),(204,5,'2025-09-03',NULL,NULL,'Lam_them','Tăng ca 2 giờ'),(205,5,'2025-09-04',NULL,NULL,'Lam_them','Tăng ca 2 giờ'),(206,5,'2025-09-09',NULL,NULL,'Di_lam',''),(207,5,'2025-09-07',NULL,NULL,'Di_lam',''),(208,5,'2025-09-10',NULL,NULL,'Di_lam',''),(209,5,'2025-09-11',NULL,NULL,'Di_lam',''),(210,5,'2025-09-12',NULL,NULL,'Di_lam',''),(211,5,'2025-09-13',NULL,NULL,'Di_lam',''),(212,5,'2025-09-14',NULL,NULL,'Di_lam',''),(213,5,'2025-09-15',NULL,NULL,'Di_lam',''),(214,5,'2025-09-16',NULL,NULL,'Di_lam',''),(215,5,'2025-09-17',NULL,NULL,'Di_lam',''),(216,5,'2025-09-18',NULL,NULL,'Di_lam',''),(217,5,'2025-09-19',NULL,NULL,'Di_lam',''),(218,5,'2025-09-20',NULL,NULL,'Di_lam',''),(219,5,'2025-09-21',NULL,NULL,'Di_lam',''),(220,5,'2025-09-22',NULL,NULL,'Di_lam',''),(221,5,'2025-09-23',NULL,NULL,'Di_lam',''),(222,5,'2025-09-24',NULL,NULL,'Di_lam',''),(223,5,'2025-09-26',NULL,NULL,'Di_lam',''),(224,5,'2025-09-27',NULL,NULL,'Di_lam',''),(225,5,'2025-09-25',NULL,NULL,'Di_lam',''),(226,5,'2025-09-28',NULL,NULL,'Di_lam',''),(227,5,'2025-09-29',NULL,NULL,'Di_lam',''),(228,5,'2025-09-30',NULL,NULL,'Di_lam',''),(229,2,'2025-05-08',NULL,NULL,'Di_lam',''),(230,2,'2025-05-01',NULL,NULL,'Di_lam',''),(231,2,'2025-05-09',NULL,NULL,'Di_lam',''),(232,2,'2025-05-07',NULL,NULL,'Di_lam',''),(233,2,'2025-05-02',NULL,NULL,'Di_lam',''),(234,2,'2025-05-03',NULL,NULL,'Di_lam',''),(235,2,'2025-05-10',NULL,NULL,'Di_lam',''),(236,2,'2025-05-11',NULL,NULL,'Di_lam',''),(237,2,'2025-05-12',NULL,NULL,'Di_lam',''),(238,2,'2025-05-04',NULL,NULL,'Di_lam',''),(239,2,'2025-05-13',NULL,NULL,'Di_lam',''),(240,2,'2025-05-14',NULL,NULL,'Di_lam',''),(241,2,'2025-05-15',NULL,NULL,'Di_lam',''),(242,2,'2025-05-16',NULL,NULL,'Di_lam',''),(243,2,'2025-05-17',NULL,NULL,'Di_lam',''),(244,2,'2025-05-06',NULL,NULL,'Di_lam',''),(245,2,'2025-05-18',NULL,NULL,'Di_lam',''),(246,2,'2025-05-19',NULL,NULL,'Di_lam',''),(247,2,'2025-05-20',NULL,NULL,'Di_lam',''),(248,2,'2025-05-21',NULL,NULL,'Di_lam',''),(249,2,'2025-05-22',NULL,NULL,'Di_lam',''),(250,2,'2025-05-23',NULL,NULL,'Di_lam',''),(251,2,'2025-05-24',NULL,NULL,'Di_lam',''),(252,2,'2025-05-05',NULL,NULL,'Di_lam',''),(253,2,'2025-05-26',NULL,NULL,'Di_lam',''),(254,2,'2025-05-25',NULL,NULL,'Di_lam',''),(255,2,'2025-05-27',NULL,NULL,'Di_lam',''),(256,2,'2025-05-28',NULL,NULL,'Di_lam',''),(257,2,'2025-05-29',NULL,NULL,'Di_lam',''),(258,2,'2025-05-30',NULL,NULL,'Di_lam',''),(259,2,'2025-05-31',NULL,NULL,'Di_lam',''),(260,3,'2025-05-01',NULL,NULL,'Di_lam',''),(261,3,'2025-05-07',NULL,NULL,'Di_lam',''),(262,3,'2025-05-06',NULL,NULL,'Di_lam',''),(263,3,'2025-05-08',NULL,NULL,'Di_lam',''),(264,3,'2025-05-09',NULL,NULL,'Di_lam',''),(265,3,'2025-05-02',NULL,NULL,'Di_lam',''),(266,3,'2025-05-03',NULL,NULL,'Di_lam',''),(267,3,'2025-05-10',NULL,NULL,'Di_lam',''),(268,3,'2025-05-11',NULL,NULL,'Lam_them','Tăng ca 1 giờ'),(269,3,'2025-05-04',NULL,NULL,'Di_lam',''),(270,3,'2025-05-05',NULL,NULL,'Di_lam',''),(271,3,'2025-05-12',NULL,NULL,'Lam_them','Tăng ca 1 giờ'),(272,3,'2025-05-13',NULL,NULL,'Lam_them','Tăng ca 1 giờ'),(273,3,'2025-05-14',NULL,NULL,'Lam_them','Tăng ca 1 giờ'),(274,3,'2025-05-15',NULL,NULL,'Lam_them','Tăng ca 1 giờ'),(275,3,'2025-05-17',NULL,NULL,'Lam_them','Tăng ca 1 giờ'),(276,3,'2025-05-18',NULL,NULL,'Lam_them','Tăng ca 1 giờ'),(277,3,'2025-05-16',NULL,NULL,'Lam_them','Tăng ca 1 giờ'),(278,3,'2025-05-19',NULL,NULL,'Lam_them','Tăng ca 1 giờ'),(279,3,'2025-05-20',NULL,NULL,'Lam_them','Tăng ca 1 giờ'),(280,3,'2025-05-21',NULL,NULL,'Di_lam',''),(281,3,'2025-05-22',NULL,NULL,'Di_lam',''),(282,3,'2025-05-23',NULL,NULL,'Di_lam',''),(283,3,'2025-05-24',NULL,NULL,'Di_lam',''),(284,3,'2025-05-25',NULL,NULL,'Di_lam',''),(285,3,'2025-05-26',NULL,NULL,'Di_lam',''),(286,3,'2025-05-27',NULL,NULL,'Di_lam',''),(287,3,'2025-05-28',NULL,NULL,'Di_lam',''),(288,3,'2025-05-29',NULL,NULL,'Di_lam',''),(289,3,'2025-05-30',NULL,NULL,'Di_lam',''),(290,3,'2025-05-31',NULL,NULL,'Di_lam',''),(291,4,'2025-07-01',NULL,NULL,'Di_lam',''),(292,4,'2025-07-02',NULL,NULL,'Di_lam',''),(293,4,'2025-07-04',NULL,NULL,'Di_lam',''),(294,4,'2025-07-05',NULL,NULL,'Di_lam',''),(295,4,'2025-07-03',NULL,NULL,'Di_lam',''),(296,4,'2025-07-07',NULL,NULL,'Di_lam',''),(297,4,'2025-07-08',NULL,NULL,'Di_lam',''),(298,4,'2025-07-06',NULL,NULL,'Di_lam',''),(299,4,'2025-07-09',NULL,NULL,'Nghi_phep',''),(300,4,'2025-07-10',NULL,NULL,'Nghi_phep',''),(301,4,'2025-07-11',NULL,NULL,'Nghi_phep',''),(302,4,'2025-07-12',NULL,NULL,'Nghi_phep',''),(303,4,'2025-07-13',NULL,NULL,'Nghi_khong_phep',''),(304,4,'2025-07-14',NULL,NULL,'Nghi_khong_phep',''),(305,4,'2025-07-15',NULL,NULL,'Nghi_khong_phep',''),(306,4,'2025-07-16',NULL,NULL,'Nghi_khong_phep',''),(307,4,'2025-07-17',NULL,NULL,'Nghi_khong_phep',''),(308,4,'2025-07-18',NULL,NULL,'Di_tre',''),(309,4,'2025-07-20',NULL,NULL,'Di_tre',''),(310,4,'2025-07-22',NULL,NULL,'Lam_them','Tăng ca 1 giờ'),(311,4,'2025-07-23',NULL,NULL,'Lam_them','Tăng ca 1 giờ'),(312,4,'2025-07-24',NULL,NULL,'Lam_them','Tăng ca 1 giờ'),(313,4,'2025-07-21',NULL,NULL,'Lam_them','Tăng ca 1 giờ'),(314,4,'2025-07-25',NULL,NULL,'Di_lam',''),(315,4,'2025-07-26',NULL,NULL,'Di_lam',''),(316,4,'2025-07-27',NULL,NULL,'Di_lam',''),(317,4,'2025-07-28',NULL,NULL,'Di_lam',''),(318,4,'2025-07-29',NULL,NULL,'Di_lam',''),(319,4,'2025-07-30',NULL,NULL,'Di_lam',''),(320,4,'2025-07-31',NULL,NULL,'Di_lam',''),(321,4,'2025-05-01',NULL,NULL,'Di_lam',''),(322,4,'2025-05-05',NULL,NULL,'Di_lam',''),(323,4,'2025-05-02',NULL,NULL,'Di_lam',''),(324,4,'2025-05-12',NULL,NULL,'Nghi_phep',''),(325,4,'2025-05-03',NULL,NULL,'Di_lam',''),(326,4,'2025-05-04',NULL,NULL,'Di_lam',''),(327,4,'2025-05-13',NULL,NULL,'Nghi_phep',''),(328,4,'2025-05-14',NULL,NULL,'Di_tre',''),(329,4,'2025-05-15',NULL,NULL,'Di_tre',''),(330,4,'2025-05-16',NULL,NULL,'Di_tre',''),(331,4,'2025-05-17',NULL,NULL,'Lam_them','Tăng ca 1 giờ'),(332,4,'2025-05-06',NULL,NULL,'Lam_them','Tăng ca 1 giờ'),(333,4,'2025-05-07',NULL,NULL,'Lam_them','Tăng ca 1 giờ'),(334,4,'2025-05-08',NULL,NULL,'Lam_them','Tăng ca 1 giờ'),(335,4,'2025-05-11',NULL,NULL,'Nghi_phep',''),(336,4,'2025-05-21',NULL,NULL,'Di_lam',''),(337,4,'2025-05-22',NULL,NULL,'Di_lam',''),(338,4,'2025-05-23',NULL,NULL,'Di_lam',''),(339,4,'2025-05-24',NULL,NULL,'Di_lam',''),(340,4,'2025-05-26',NULL,NULL,'Di_lam',''),(341,4,'2025-05-27',NULL,NULL,'Di_lam',''),(342,4,'2025-05-25',NULL,NULL,'Di_lam',''),(343,4,'2025-05-28',NULL,NULL,'Di_lam',''),(344,4,'2025-05-29',NULL,NULL,'Di_lam',''),(345,4,'2025-05-30',NULL,NULL,'Di_lam',''),(346,4,'2025-05-18',NULL,NULL,'Di_lam',''),(347,4,'2025-05-19',NULL,NULL,'Di_lam',''),(348,4,'2025-05-20',NULL,NULL,'Di_lam',''),(349,4,'2025-05-09',NULL,NULL,'Di_lam',''),(350,4,'2025-05-10',NULL,NULL,'Di_lam',''),(351,4,'2025-05-31',NULL,NULL,'Di_lam',''),(352,8,'2025-09-01',NULL,NULL,'Di_lam',''),(353,8,'2025-09-30',NULL,NULL,'Di_lam',''),(354,8,'2025-09-29',NULL,NULL,'Di_lam',''),(355,8,'2025-09-02',NULL,NULL,'Di_lam',''),(356,8,'2025-09-28',NULL,NULL,'Di_lam',''),(357,8,'2025-09-27',NULL,NULL,'Di_lam',''),(358,8,'2025-09-03',NULL,NULL,'Nghi_khong_phep',''),(359,8,'2025-09-04',NULL,NULL,'Nghi_phep',''),(360,8,'2025-09-05',NULL,NULL,'Nghi_phep',''),(361,8,'2025-09-06',NULL,NULL,'Nghi_khong_phep',''),(362,8,'2025-09-07',NULL,NULL,'Nghi_khong_phep',''),(363,8,'2025-09-08',NULL,NULL,'Lam_them','Tăng ca 4 giờ'),(364,8,'2025-09-09',NULL,NULL,'Lam_them','Tăng ca 4 giờ'),(365,8,'2025-09-10',NULL,NULL,'Lam_them','Tăng ca 4 giờ'),(366,8,'2025-09-11',NULL,NULL,'Lam_them','Tăng ca 4 giờ'),(367,8,'2025-09-12',NULL,NULL,'Lam_them','Tăng ca 4 giờ'),(368,8,'2025-09-13',NULL,NULL,'Di_tre',''),(369,8,'2025-09-14',NULL,NULL,'Di_tre',''),(370,8,'2025-09-15',NULL,NULL,'Di_tre',''),(371,8,'2025-09-16',NULL,NULL,'Di_lam',''),(372,8,'2025-09-17',NULL,NULL,'Di_lam',''),(373,8,'2025-09-18',NULL,NULL,'Di_lam',''),(374,8,'2025-09-19',NULL,NULL,'Di_lam',''),(375,8,'2025-09-20',NULL,NULL,'Di_lam',''),(376,8,'2025-09-21',NULL,NULL,'Di_lam',''),(377,8,'2025-09-22',NULL,NULL,'Di_lam',''),(378,8,'2025-09-23',NULL,NULL,'Di_lam',''),(379,8,'2025-09-24',NULL,NULL,'Di_lam',''),(380,8,'2025-09-25',NULL,NULL,'Di_lam',''),(381,8,'2025-09-26',NULL,NULL,'Di_lam',''),(382,7,'2025-10-01',NULL,NULL,'Di_lam',''),(383,7,'2025-10-02',NULL,NULL,'Di_lam',''),(384,7,'2025-10-03',NULL,NULL,'Di_lam',''),(385,7,'2025-10-04',NULL,NULL,'Di_lam',''),(386,7,'2025-10-05',NULL,NULL,'Lam_them','Tăng ca 1 giờ'),(387,7,'2025-10-06',NULL,NULL,'Lam_them','Tăng ca 1 giờ'),(388,7,'2025-10-07',NULL,NULL,'Lam_them','Tăng ca 2 giờ'),(389,7,'2025-10-08',NULL,NULL,'Lam_them','Tăng ca 2 giờ'),(390,7,'2025-10-09',NULL,NULL,'Lam_them','Tăng ca 2 giờ'),(391,7,'2025-10-10',NULL,NULL,'Lam_them','Tăng ca 2 giờ'),(392,7,'2025-10-11',NULL,NULL,'Lam_them','Tăng ca 2 giờ'),(393,7,'2025-10-12',NULL,NULL,'Lam_them','Tăng ca 2 giờ'),(394,7,'2025-10-13',NULL,NULL,'Lam_them','Tăng ca 2 giờ'),(395,7,'2025-10-14',NULL,NULL,'Lam_them','Tăng ca 2 giờ'),(396,7,'2025-10-15',NULL,NULL,'Lam_them','Tăng ca 2 giờ'),(397,7,'2025-10-16',NULL,NULL,'Lam_them','Tăng ca 2 giờ'),(398,7,'2025-10-17',NULL,NULL,'Lam_them','Tăng ca 2 giờ'),(399,7,'2025-10-18',NULL,NULL,'Lam_them','Tăng ca 2 giờ'),(400,7,'2025-10-19',NULL,NULL,'Lam_them','Tăng ca 2 giờ'),(401,7,'2025-10-20',NULL,NULL,'Lam_them','Tăng ca 2 giờ'),(402,7,'2025-10-21',NULL,NULL,'Lam_them','Tăng ca 2 giờ'),(403,7,'2025-10-22',NULL,NULL,'Lam_them','Tăng ca 2 giờ'),(404,7,'2025-10-23',NULL,NULL,'Di_lam',''),(405,7,'2025-10-24',NULL,NULL,'Di_lam',''),(406,7,'2025-10-25',NULL,NULL,'Di_lam',''),(407,7,'2025-10-26',NULL,NULL,'Di_lam',''),(408,7,'2025-10-27',NULL,NULL,'Di_lam',''),(409,7,'2025-10-28',NULL,NULL,'Di_lam',''),(410,7,'2025-10-29',NULL,NULL,'Di_lam',''),(411,7,'2025-10-30',NULL,NULL,'Di_lam',''),(412,7,'2025-10-31',NULL,NULL,'Di_lam',''),(413,4,'2025-10-03','07:15:45','17:00:00','Di_lam','Chấm công thành công'),(414,2,'2025-10-01',NULL,NULL,'Di_lam',''),(415,2,'2025-10-08',NULL,NULL,'Di_lam',''),(416,2,'2025-10-09',NULL,NULL,'Di_lam',''),(417,2,'2025-10-10',NULL,NULL,'Di_lam',''),(418,2,'2025-10-11',NULL,NULL,'Di_lam',''),(419,2,'2025-10-12',NULL,NULL,'Di_lam',''),(420,2,'2025-10-13',NULL,NULL,'Di_lam',''),(421,2,'2025-10-14',NULL,NULL,'Nghi_phep',''),(422,2,'2025-10-15',NULL,NULL,'Nghi_khong_phep',''),(423,2,'2025-10-17',NULL,NULL,'Nghi_khong_phep',''),(424,2,'2025-10-16',NULL,NULL,'Nghi_khong_phep',''),(425,2,'2025-10-18',NULL,NULL,'Nghi_khong_phep',''),(426,2,'2025-10-19',NULL,NULL,'Lam_them','Tăng ca 1 giờ'),(427,2,'2025-10-20',NULL,NULL,'Lam_them','Tăng ca 1 giờ'),(428,2,'2025-10-21',NULL,NULL,'Lam_them','Tăng ca 4 giờ'),(429,2,'2025-10-22',NULL,NULL,'Lam_them','Tăng ca 4 giờ'),(430,2,'2025-10-23',NULL,NULL,'Lam_them','Tăng ca 4 giờ'),(431,2,'2025-10-24',NULL,NULL,'Di_lam',''),(432,2,'2025-10-25',NULL,NULL,'Di_lam',''),(433,2,'2025-10-26',NULL,NULL,'Di_lam',''),(434,2,'2025-10-27',NULL,NULL,'Di_lam',''),(435,2,'2025-10-28',NULL,NULL,'Di_lam',''),(436,2,'2025-10-29',NULL,NULL,'Di_lam',''),(437,2,'2025-10-02',NULL,NULL,'Di_lam',''),(438,2,'2025-10-03',NULL,NULL,'Di_lam',''),(439,2,'2025-10-30',NULL,NULL,'Di_lam',''),(440,2,'2025-10-31',NULL,NULL,'Di_lam',''),(441,2,'2025-10-04',NULL,NULL,'Di_lam',''),(442,2,'2025-10-06',NULL,NULL,'Di_lam',''),(443,2,'2025-10-05',NULL,NULL,'Di_lam',''),(444,2,'2025-10-07',NULL,NULL,'Di_lam',''),(445,6,'2025-10-02',NULL,NULL,'Nghi_phep',''),(446,6,'2025-10-05',NULL,NULL,'Nghi_khong_phep',''),(447,6,'2025-10-01',NULL,NULL,'Di_lam',''),(448,6,'2025-10-07',NULL,NULL,'Nghi_khong_phep',''),(449,6,'2025-10-03',NULL,NULL,'Nghi_khong_phep',''),(450,6,'2025-10-04',NULL,NULL,'Nghi_khong_phep',''),(451,6,'2025-10-06',NULL,NULL,'Nghi_khong_phep',''),(452,6,'2025-10-08',NULL,NULL,'Di_lam',''),(453,6,'2025-10-09',NULL,NULL,'Di_lam',''),(454,6,'2025-10-10',NULL,NULL,'Di_lam',''),(455,6,'2025-10-11',NULL,NULL,'Di_lam',''),(456,6,'2025-10-12',NULL,NULL,'Di_lam',''),(457,6,'2025-10-13',NULL,NULL,'Di_lam',''),(458,6,'2025-10-15',NULL,NULL,'Di_lam',''),(459,6,'2025-10-16',NULL,NULL,'Di_lam',''),(460,6,'2025-10-14',NULL,NULL,'Di_lam',''),(461,6,'2025-10-17',NULL,NULL,'Di_lam',''),(462,6,'2025-10-18',NULL,NULL,'Di_lam',''),(463,3,'2025-10-01',NULL,NULL,'Di_lam',''),(464,3,'2025-10-02',NULL,NULL,'Nghi_phep',''),(465,3,'2025-10-03',NULL,NULL,'Nghi_khong_phep',''),(466,3,'2025-10-04',NULL,NULL,'Nghi_khong_phep',''),(467,3,'2025-10-05',NULL,NULL,'Lam_them','Tăng ca 2 giờ'),(468,3,'2025-10-06',NULL,NULL,'Lam_them','Tăng ca 2 giờ'),(469,3,'2025-10-07',NULL,NULL,'Di_lam',''),(470,3,'2025-10-08',NULL,NULL,'Di_lam',''),(471,8,'2025-10-04',NULL,NULL,'Di_lam',''),(472,8,'2025-10-07',NULL,NULL,'Di_lam',''),(473,8,'2025-10-06',NULL,NULL,'Di_lam',''),(474,8,'2025-10-02',NULL,NULL,'Nghi_phep',''),(475,8,'2025-10-08',NULL,NULL,'Di_lam',''),(476,8,'2025-10-10',NULL,NULL,'Di_lam',''),(477,8,'2025-10-13',NULL,NULL,'Di_lam',''),(478,8,'2025-10-11',NULL,NULL,'Di_lam',''),(479,8,'2025-10-12',NULL,NULL,'Di_lam',''),(480,8,'2025-10-09',NULL,NULL,'Di_lam',''),(481,8,'2025-10-14',NULL,NULL,'Di_lam',''),(482,8,'2025-10-15',NULL,NULL,'Di_lam',''),(483,8,'2025-10-18',NULL,NULL,'Di_lam',''),(484,8,'2025-10-17',NULL,NULL,'Di_lam',''),(485,8,'2025-10-16',NULL,NULL,'Di_lam',''),(486,8,'2025-10-22',NULL,NULL,'Di_lam',''),(487,8,'2025-10-21',NULL,NULL,'Di_lam',''),(488,8,'2025-10-20',NULL,NULL,'Di_lam',''),(489,8,'2025-10-19',NULL,NULL,'Di_lam',''),(490,8,'2025-10-26',NULL,NULL,'Di_lam',''),(491,8,'2025-10-25',NULL,NULL,'Di_lam',''),(492,8,'2025-10-24',NULL,NULL,'Di_lam',''),(493,8,'2025-10-23',NULL,NULL,'Di_lam',''),(494,8,'2025-10-30',NULL,NULL,'Di_lam',''),(495,8,'2025-10-29',NULL,NULL,'Di_lam',''),(496,8,'2025-10-28',NULL,NULL,'Di_lam',''),(497,8,'2025-10-27',NULL,NULL,'Di_lam',''),(498,8,'2025-10-31',NULL,NULL,'Di_lam',''),(499,8,'2025-10-01',NULL,NULL,'Di_lam',''),(500,8,'2025-10-03',NULL,NULL,'Di_lam',''),(501,8,'2025-10-05',NULL,NULL,'Di_lam',''),(502,9,'2025-10-26',NULL,NULL,'Lam_them','Tăng ca 4 giờ'),(503,9,'2025-10-24',NULL,NULL,'Nghi_phep',''),(504,9,'2025-10-21',NULL,NULL,'Di_lam',''),(505,3,'2025-10-31',NULL,NULL,'Nghi_khong_phep','Tự động đánh dấu nghỉ không phép'),(506,4,'2025-10-31',NULL,NULL,'Nghi_khong_phep','Tự động đánh dấu nghỉ không phép'),(507,5,'2025-10-31',NULL,NULL,'Nghi_khong_phep','Tự động đánh dấu nghỉ không phép'),(508,6,'2025-10-31',NULL,NULL,'Nghi_khong_phep','Tự động đánh dấu nghỉ không phép'),(509,9,'2025-10-31',NULL,NULL,'Nghi_khong_phep','Tự động đánh dấu nghỉ không phép'),(510,12,'2025-10-31',NULL,NULL,'Nghi_khong_phep','Tự động đánh dấu nghỉ không phép'),(511,13,'2025-10-31',NULL,NULL,'Nghi_khong_phep','Tự động đánh dấu nghỉ không phép'),(512,14,'2025-10-31',NULL,NULL,'Nghi_khong_phep','Tự động đánh dấu nghỉ không phép'),(513,2,'2025-11-07',NULL,NULL,'Nghi_khong_phep','Tự động đánh dấu nghỉ không phép'),(514,3,'2025-11-07',NULL,NULL,'Nghi_khong_phep','Tự động đánh dấu nghỉ không phép'),(515,4,'2025-11-07',NULL,NULL,'Nghi_khong_phep','Tự động đánh dấu nghỉ không phép'),(516,5,'2025-11-07',NULL,NULL,'Nghi_khong_phep','Tự động đánh dấu nghỉ không phép'),(517,6,'2025-11-07',NULL,NULL,'Nghi_khong_phep','Tự động đánh dấu nghỉ không phép'),(518,7,'2025-11-07',NULL,NULL,'Nghi_khong_phep','Tự động đánh dấu nghỉ không phép'),(519,8,'2025-11-07',NULL,NULL,'Nghi_khong_phep','Tự động đánh dấu nghỉ không phép'),(520,9,'2025-11-07',NULL,NULL,'Nghi_khong_phep','Tự động đánh dấu nghỉ không phép'),(521,12,'2025-11-07',NULL,NULL,'Nghi_khong_phep','Tự động đánh dấu nghỉ không phép'),(522,13,'2025-11-07',NULL,NULL,'Nghi_khong_phep','Tự động đánh dấu nghỉ không phép'),(523,14,'2025-11-07',NULL,NULL,'Nghi_khong_phep','Tự động đánh dấu nghỉ không phép'),(524,2,'2025-11-10',NULL,NULL,'Nghi_khong_phep','Tự động đánh dấu nghỉ không phép'),(525,3,'2025-11-10',NULL,NULL,'Nghi_khong_phep','Tự động đánh dấu nghỉ không phép'),(526,4,'2025-11-10',NULL,NULL,'Nghi_khong_phep','Tự động đánh dấu nghỉ không phép'),(527,5,'2025-11-10',NULL,NULL,'Nghi_khong_phep','Tự động đánh dấu nghỉ không phép'),(528,6,'2025-11-10',NULL,NULL,'Nghi_khong_phep','Tự động đánh dấu nghỉ không phép'),(529,7,'2025-11-10',NULL,NULL,'Nghi_khong_phep','Tự động đánh dấu nghỉ không phép'),(530,8,'2025-11-10',NULL,NULL,'Nghi_khong_phep','Tự động đánh dấu nghỉ không phép'),(531,9,'2025-11-10',NULL,NULL,'Nghi_khong_phep','Tự động đánh dấu nghỉ không phép'),(532,12,'2025-11-10',NULL,NULL,'Nghi_khong_phep','Tự động đánh dấu nghỉ không phép'),(533,13,'2025-11-10',NULL,NULL,'Nghi_khong_phep','Tự động đánh dấu nghỉ không phép'),(534,14,'2025-11-10',NULL,NULL,'Nghi_khong_phep','Tự động đánh dấu nghỉ không phép'),(535,2,'2025-11-11',NULL,NULL,'Nghi_khong_phep','Tự động đánh dấu nghỉ không phép'),(536,3,'2025-11-11',NULL,NULL,'Nghi_khong_phep','Tự động đánh dấu nghỉ không phép'),(537,4,'2025-11-11',NULL,NULL,'Nghi_khong_phep','Tự động đánh dấu nghỉ không phép'),(538,5,'2025-11-11',NULL,NULL,'Nghi_khong_phep','Tự động đánh dấu nghỉ không phép'),(539,6,'2025-11-11',NULL,NULL,'Nghi_khong_phep','Tự động đánh dấu nghỉ không phép'),(540,7,'2025-11-11',NULL,NULL,'Nghi_khong_phep','Tự động đánh dấu nghỉ không phép'),(541,8,'2025-11-11',NULL,NULL,'Nghi_khong_phep','Tự động đánh dấu nghỉ không phép'),(542,9,'2025-11-11',NULL,NULL,'Nghi_khong_phep','Tự động đánh dấu nghỉ không phép'),(543,12,'2025-11-11',NULL,NULL,'Nghi_khong_phep','Tự động đánh dấu nghỉ không phép'),(544,13,'2025-11-11',NULL,NULL,'Nghi_khong_phep','Tự động đánh dấu nghỉ không phép'),(545,14,'2025-11-11',NULL,NULL,'Nghi_khong_phep','Tự động đánh dấu nghỉ không phép'),(546,2,'2025-11-12',NULL,NULL,'Nghi_khong_phep','Tự động đánh dấu nghỉ không phép'),(547,3,'2025-11-12',NULL,NULL,'Nghi_khong_phep','Tự động đánh dấu nghỉ không phép'),(548,4,'2025-11-12',NULL,NULL,'Nghi_khong_phep','Tự động đánh dấu nghỉ không phép'),(549,5,'2025-11-12',NULL,NULL,'Nghi_khong_phep','Tự động đánh dấu nghỉ không phép'),(550,6,'2025-11-12',NULL,NULL,'Nghi_khong_phep','Tự động đánh dấu nghỉ không phép'),(551,7,'2025-11-12',NULL,NULL,'Nghi_khong_phep','Tự động đánh dấu nghỉ không phép'),(552,8,'2025-11-12',NULL,NULL,'Nghi_khong_phep','Tự động đánh dấu nghỉ không phép'),(553,9,'2025-11-12',NULL,NULL,'Nghi_khong_phep','Tự động đánh dấu nghỉ không phép'),(554,12,'2025-11-12',NULL,NULL,'Nghi_khong_phep','Tự động đánh dấu nghỉ không phép'),(555,13,'2025-11-12',NULL,NULL,'Nghi_khong_phep','Tự động đánh dấu nghỉ không phép'),(556,14,'2025-11-12',NULL,NULL,'Nghi_khong_phep','Tự động đánh dấu nghỉ không phép'),(557,7,'2025-11-15','20:10:56','17:00:00','Di_lam','Chấm công thành công'),(558,7,'2025-11-18','09:34:10','17:00:00','Di_lam','Chấm công thành công'),(559,2,'2025-11-18',NULL,NULL,'Nghi_khong_phep','Tự động đánh dấu nghỉ không phép'),(560,3,'2025-11-18',NULL,NULL,'Nghi_khong_phep','Tự động đánh dấu nghỉ không phép'),(561,4,'2025-11-18',NULL,NULL,'Nghi_khong_phep','Tự động đánh dấu nghỉ không phép'),(562,5,'2025-11-18',NULL,NULL,'Nghi_khong_phep','Tự động đánh dấu nghỉ không phép'),(563,6,'2025-11-18',NULL,NULL,'Nghi_khong_phep','Tự động đánh dấu nghỉ không phép'),(564,8,'2025-11-18',NULL,NULL,'Nghi_khong_phep','Tự động đánh dấu nghỉ không phép'),(565,9,'2025-11-18',NULL,NULL,'Nghi_khong_phep','Tự động đánh dấu nghỉ không phép'),(566,12,'2025-11-18',NULL,NULL,'Nghi_khong_phep','Tự động đánh dấu nghỉ không phép'),(567,13,'2025-11-18',NULL,NULL,'Nghi_khong_phep','Tự động đánh dấu nghỉ không phép'),(568,14,'2025-11-18',NULL,NULL,'Nghi_khong_phep','Tự động đánh dấu nghỉ không phép'),(569,2,'2025-11-20',NULL,NULL,'Di_lam',''),(570,2,'2025-11-01',NULL,NULL,'Di_lam',''),(571,2,'2025-11-15',NULL,NULL,'Di_lam',''),(572,2,'2025-11-16',NULL,NULL,'Di_lam',''),(573,2,'2025-11-19',NULL,NULL,'Di_lam',''),(574,2,'2025-11-17',NULL,NULL,'Di_lam',''),(575,2,'2025-11-21',NULL,NULL,'Nghi_phep',''),(576,2,'2025-11-22',NULL,NULL,'Nghi_phep',''),(577,2,'2025-11-23',NULL,NULL,'Nghi_phep',''),(578,2,'2025-11-24',NULL,NULL,'Nghi_phep',''),(579,2,'2025-11-25',NULL,NULL,'Nghi_khong_phep',''),(580,2,'2025-11-26',NULL,NULL,'Nghi_khong_phep',''),(581,2,'2025-11-27',NULL,NULL,'Nghi_khong_phep',''),(582,2,'2025-11-28',NULL,NULL,'Nghi_khong_phep',''),(583,2,'2025-11-02',NULL,NULL,'Di_lam',''),(584,2,'2025-11-29',NULL,NULL,'Nghi_khong_phep',''),(585,2,'2025-11-30',NULL,NULL,'Nghi_khong_phep',''),(586,2,'2025-11-03',NULL,NULL,'Di_lam',''),(587,2,'2025-11-04',NULL,NULL,'Di_lam',''),(588,2,'2025-11-05',NULL,NULL,'Di_lam',''),(589,2,'2025-11-06',NULL,NULL,'Di_lam',''),(590,2,'2025-11-08',NULL,NULL,'Di_lam',''),(591,2,'2025-11-09',NULL,NULL,'Di_lam',''),(592,2,'2025-11-13',NULL,NULL,'Di_lam',''),(593,2,'2025-11-14',NULL,NULL,'Di_lam',''),(594,7,'2025-11-24','15:09:32','17:00:00','Di_lam','Chấm công thành công'),(595,3,'2025-11-24',NULL,NULL,'Nghi_khong_phep','Tự động đánh dấu nghỉ không phép'),(596,4,'2025-11-24',NULL,NULL,'Nghi_khong_phep','Tự động đánh dấu nghỉ không phép'),(597,5,'2025-11-24',NULL,NULL,'Nghi_khong_phep','Tự động đánh dấu nghỉ không phép'),(598,6,'2025-11-24',NULL,NULL,'Nghi_khong_phep','Tự động đánh dấu nghỉ không phép'),(599,8,'2025-11-24',NULL,NULL,'Nghi_khong_phep','Tự động đánh dấu nghỉ không phép'),(600,9,'2025-11-24',NULL,NULL,'Nghi_khong_phep','Tự động đánh dấu nghỉ không phép'),(601,12,'2025-11-24',NULL,NULL,'Nghi_khong_phep','Tự động đánh dấu nghỉ không phép'),(602,13,'2025-11-24',NULL,NULL,'Nghi_khong_phep','Tự động đánh dấu nghỉ không phép'),(603,14,'2025-11-24',NULL,NULL,'Nghi_khong_phep','Tự động đánh dấu nghỉ không phép'),(604,7,'2025-11-29','10:32:02','17:00:00','Di_lam','Chấm công thành công'),(605,3,'2025-11-29',NULL,NULL,'Nghi_khong_phep','Tự động đánh dấu nghỉ không phép'),(606,4,'2025-11-29',NULL,NULL,'Nghi_khong_phep','Tự động đánh dấu nghỉ không phép'),(607,5,'2025-11-29',NULL,NULL,'Nghi_khong_phep','Tự động đánh dấu nghỉ không phép'),(608,6,'2025-11-29',NULL,NULL,'Nghi_khong_phep','Tự động đánh dấu nghỉ không phép'),(609,8,'2025-11-29',NULL,NULL,'Nghi_khong_phep','Tự động đánh dấu nghỉ không phép'),(610,9,'2025-11-29',NULL,NULL,'Nghi_khong_phep','Tự động đánh dấu nghỉ không phép'),(611,12,'2025-11-29',NULL,NULL,'Nghi_khong_phep','Tự động đánh dấu nghỉ không phép'),(612,13,'2025-11-29',NULL,NULL,'Nghi_khong_phep','Tự động đánh dấu nghỉ không phép'),(613,14,'2025-11-29',NULL,NULL,'Nghi_khong_phep','Tự động đánh dấu nghỉ không phép'),(614,3,'2025-11-30',NULL,NULL,'Nghi_khong_phep','Tự động đánh dấu nghỉ không phép'),(615,4,'2025-11-30',NULL,NULL,'Nghi_khong_phep','Tự động đánh dấu nghỉ không phép'),(616,5,'2025-11-30',NULL,NULL,'Nghi_khong_phep','Tự động đánh dấu nghỉ không phép'),(617,6,'2025-11-30',NULL,NULL,'Nghi_khong_phep','Tự động đánh dấu nghỉ không phép'),(618,7,'2025-11-30',NULL,NULL,'Nghi_khong_phep','Tự động đánh dấu nghỉ không phép'),(619,8,'2025-11-30',NULL,NULL,'Nghi_khong_phep','Tự động đánh dấu nghỉ không phép'),(620,9,'2025-11-30',NULL,NULL,'Nghi_khong_phep','Tự động đánh dấu nghỉ không phép'),(621,12,'2025-11-30',NULL,NULL,'Nghi_khong_phep','Tự động đánh dấu nghỉ không phép'),(622,13,'2025-11-30',NULL,NULL,'Nghi_khong_phep','Tự động đánh dấu nghỉ không phép'),(623,14,'2025-11-30',NULL,NULL,'Nghi_khong_phep','Tự động đánh dấu nghỉ không phép'),(624,2,'2025-12-02',NULL,NULL,'Nghi_khong_phep','Tự động đánh dấu nghỉ không phép'),(625,3,'2025-12-02',NULL,NULL,'Nghi_khong_phep','Tự động đánh dấu nghỉ không phép'),(626,4,'2025-12-02',NULL,NULL,'Nghi_khong_phep','Tự động đánh dấu nghỉ không phép'),(627,5,'2025-12-02',NULL,NULL,'Nghi_khong_phep','Tự động đánh dấu nghỉ không phép'),(628,6,'2025-12-02',NULL,NULL,'Nghi_khong_phep','Tự động đánh dấu nghỉ không phép'),(629,7,'2025-12-02',NULL,NULL,'Nghi_khong_phep','Tự động đánh dấu nghỉ không phép'),(630,8,'2025-12-02',NULL,NULL,'Nghi_khong_phep','Tự động đánh dấu nghỉ không phép'),(631,9,'2025-12-02',NULL,NULL,'Nghi_khong_phep','Tự động đánh dấu nghỉ không phép'),(632,12,'2025-12-02',NULL,NULL,'Nghi_khong_phep','Tự động đánh dấu nghỉ không phép'),(633,13,'2025-12-02',NULL,NULL,'Nghi_khong_phep','Tự động đánh dấu nghỉ không phép'),(634,14,'2025-12-02',NULL,NULL,'Nghi_khong_phep','Tự động đánh dấu nghỉ không phép'),(635,2,'2025-12-01',NULL,NULL,'Di_lam',''),(636,2,'2025-12-23',NULL,NULL,'Di_lam',''),(637,2,'2025-12-24',NULL,NULL,'Di_lam',''),(638,2,'2025-12-03',NULL,NULL,'Di_lam',''),(639,2,'2025-12-25',NULL,NULL,'Di_lam',''),(640,2,'2025-12-26',NULL,NULL,'Di_lam',''),(641,2,'2025-12-27',NULL,NULL,'Di_lam',''),(642,2,'2025-12-29',NULL,NULL,'Di_lam',''),(643,2,'2025-12-30',NULL,NULL,'Di_lam',''),(644,2,'2025-12-04',NULL,NULL,'Di_lam',''),(645,2,'2025-12-05',NULL,NULL,'Di_lam',''),(646,2,'2025-12-06',NULL,NULL,'Di_lam',''),(647,2,'2025-12-08',NULL,NULL,'Di_lam',''),(648,2,'2025-12-09',NULL,NULL,'Di_lam',''),(649,2,'2025-12-10',NULL,NULL,'Di_lam',''),(650,2,'2025-12-12',NULL,NULL,'Di_lam',''),(651,2,'2025-12-11',NULL,NULL,'Di_lam',''),(652,2,'2025-12-13',NULL,NULL,'Di_lam',''),(653,2,'2025-12-15',NULL,NULL,'Di_lam',''),(654,2,'2025-12-16',NULL,NULL,'Di_lam',''),(655,2,'2025-12-17',NULL,NULL,'Di_lam',''),(656,2,'2025-12-19',NULL,NULL,'Di_lam',''),(657,2,'2025-12-18',NULL,NULL,'Di_lam',''),(658,2,'2025-12-20',NULL,NULL,'Di_lam',''),(659,2,'2025-12-22',NULL,NULL,'Di_lam',''),(660,6,'2025-11-01',NULL,NULL,'Di_lam',''),(661,6,'2025-11-03',NULL,NULL,'Di_lam',''),(662,6,'2025-11-04',NULL,NULL,'Di_lam',''),(663,6,'2025-11-05',NULL,NULL,'Di_lam',''),(664,6,'2025-11-06',NULL,NULL,'Di_lam',''),(665,6,'2025-11-07',NULL,NULL,'Di_lam',''),(666,6,'2025-11-08',NULL,NULL,'Di_lam',''),(667,6,'2025-11-13',NULL,NULL,'Di_lam',''),(668,6,'2025-11-14',NULL,NULL,'Di_lam',''),(669,6,'2025-11-15',NULL,NULL,'Di_lam',''),(670,6,'2025-11-17',NULL,NULL,'Di_lam',''),(671,6,'2025-11-19',NULL,NULL,'Di_lam',''),(672,6,'2025-11-20',NULL,NULL,'Di_lam',''),(673,6,'2025-11-28',NULL,NULL,'Di_lam',''),(674,6,'2025-11-26',NULL,NULL,'Di_lam',''),(675,6,'2025-11-25',NULL,NULL,'Di_lam',''),(676,6,'2025-11-27',NULL,NULL,'Di_lam',''),(677,6,'2025-11-22',NULL,NULL,'Di_lam',''),(678,6,'2025-11-21',NULL,NULL,'Di_lam',''),(679,7,'2025-11-06',NULL,NULL,'Di_lam',''),(680,7,'2025-11-05',NULL,NULL,'Di_lam',''),(681,7,'2025-11-01',NULL,NULL,'Di_lam',''),(682,7,'2025-11-13',NULL,NULL,'Di_lam',''),(683,7,'2025-11-03',NULL,NULL,'Di_lam',''),(684,7,'2025-11-04',NULL,NULL,'Di_lam',''),(685,7,'2025-11-08',NULL,NULL,'Di_lam',''),(686,7,'2025-11-14',NULL,NULL,'Di_lam',''),(687,7,'2025-11-17',NULL,NULL,'Di_lam',''),(688,7,'2025-11-19',NULL,NULL,'Di_lam',''),(689,7,'2025-11-20',NULL,NULL,'Di_lam',''),(690,7,'2025-11-28',NULL,NULL,'Di_lam',''),(691,7,'2025-11-27',NULL,NULL,'Di_lam',''),(692,7,'2025-11-26',NULL,NULL,'Di_lam',''),(693,7,'2025-11-25',NULL,NULL,'Di_lam',''),(694,7,'2025-11-22',NULL,NULL,'Di_lam',''),(695,7,'2025-11-21',NULL,NULL,'Di_lam',''),(696,6,'2025-12-02',NULL,NULL,'Di_lam',''),(697,6,'2025-12-30',NULL,NULL,'Di_lam',''),(698,6,'2025-12-31',NULL,NULL,'Di_lam',''),(699,6,'2025-12-01',NULL,NULL,'Di_lam',''),(700,6,'2025-12-03',NULL,NULL,'Di_lam',''),(701,6,'2025-12-04',NULL,NULL,'Di_lam',''),(702,6,'2025-12-05',NULL,NULL,'Di_lam',''),(703,6,'2025-12-06',NULL,NULL,'Di_lam',''),(704,6,'2025-12-08',NULL,NULL,'Di_lam',''),(705,6,'2025-12-09',NULL,NULL,'Di_lam',''),(706,6,'2025-12-10',NULL,NULL,'Di_lam',''),(707,6,'2025-12-20',NULL,NULL,'Di_lam',''),(708,6,'2025-12-19',NULL,NULL,'Di_lam',''),(709,6,'2025-12-18',NULL,NULL,'Di_lam',''),(710,6,'2025-12-17',NULL,NULL,'Di_lam',''),(711,6,'2025-12-16',NULL,NULL,'Di_lam',''),(712,6,'2025-12-15',NULL,NULL,'Di_lam',''),(713,6,'2025-12-13',NULL,NULL,'Di_lam',''),(714,6,'2025-12-12',NULL,NULL,'Di_lam',''),(715,6,'2025-12-11',NULL,NULL,'Di_lam',''),(716,6,'2025-12-22',NULL,NULL,'Di_lam',''),(717,6,'2025-12-23',NULL,NULL,'Di_lam',''),(718,6,'2025-12-24',NULL,NULL,'Di_lam',''),(719,6,'2025-12-25',NULL,NULL,'Di_lam',''),(720,6,'2025-12-26',NULL,NULL,'Di_lam',''),(721,6,'2025-12-27',NULL,NULL,'Di_lam',''),(722,6,'2025-12-29',NULL,NULL,'Di_lam',''),(723,2,'2025-01-01',NULL,NULL,'Di_lam',''),(724,2,'2025-01-02',NULL,NULL,'Di_lam',''),(725,2,'2025-01-03',NULL,NULL,'Di_lam',''),(726,2,'2025-01-04',NULL,NULL,'Di_lam',''),(727,2,'2025-01-06',NULL,NULL,'Di_lam',''),(728,2,'2025-01-07',NULL,NULL,'Di_lam',''),(729,2,'2025-01-08',NULL,NULL,'Di_lam',''),(730,2,'2025-01-09',NULL,NULL,'Di_lam',''),(731,2,'2025-01-10',NULL,NULL,'Di_lam',''),(732,2,'2025-01-20',NULL,NULL,'Di_lam',''),(733,2,'2025-01-18',NULL,NULL,'Di_lam',''),(734,2,'2025-01-17',NULL,NULL,'Di_lam',''),(735,2,'2025-01-14',NULL,NULL,'Di_lam',''),(736,2,'2025-01-15',NULL,NULL,'Di_lam',''),(737,2,'2025-01-16',NULL,NULL,'Di_lam',''),(738,2,'2025-01-13',NULL,NULL,'Di_lam',''),(739,2,'2025-01-11',NULL,NULL,'Di_lam',''),(740,2,'2025-01-21',NULL,NULL,'Di_lam',''),(741,2,'2025-01-22',NULL,NULL,'Di_lam',''),(742,2,'2025-01-23',NULL,NULL,'Di_lam',''),(743,2,'2025-01-24',NULL,NULL,'Di_lam',''),(744,2,'2025-01-25',NULL,NULL,'Di_lam',''),(745,2,'2025-01-27',NULL,NULL,'Di_lam',''),(746,2,'2025-01-28',NULL,NULL,'Di_lam',''),(747,2,'2025-01-29',NULL,NULL,'Di_lam',''),(748,2,'2025-01-30',NULL,NULL,'Di_lam',''),(749,2,'2025-01-31',NULL,NULL,'Di_lam',''),(750,4,'2025-01-01',NULL,NULL,'Di_lam',''),(751,4,'2025-01-08',NULL,NULL,'Di_lam',''),(752,4,'2025-01-02',NULL,NULL,'Di_lam',''),(753,4,'2025-01-03',NULL,NULL,'Di_lam',''),(754,4,'2025-01-04',NULL,NULL,'Di_lam',''),(755,4,'2025-01-06',NULL,NULL,'Di_lam',''),(756,4,'2025-01-07',NULL,NULL,'Di_lam',''),(757,4,'2025-01-09',NULL,NULL,'Di_lam',''),(758,4,'2025-01-10',NULL,NULL,'Di_lam',''),(759,4,'2025-01-20',NULL,NULL,'Di_lam',''),(760,4,'2025-01-18',NULL,NULL,'Di_lam',''),(761,4,'2025-01-17',NULL,NULL,'Di_lam',''),(762,4,'2025-01-16',NULL,NULL,'Di_lam',''),(763,4,'2025-01-15',NULL,NULL,'Di_lam',''),(764,4,'2025-01-14',NULL,NULL,'Di_lam',''),(765,4,'2025-01-13',NULL,NULL,'Di_lam',''),(766,4,'2025-01-11',NULL,NULL,'Di_lam',''),(767,4,'2025-01-21',NULL,NULL,'Di_lam',''),(768,4,'2025-01-22',NULL,NULL,'Di_lam',''),(769,4,'2025-01-23',NULL,NULL,'Di_lam',''),(770,4,'2025-01-24',NULL,NULL,'Di_lam',''),(771,4,'2025-01-25',NULL,NULL,'Di_lam',''),(772,4,'2025-01-27',NULL,NULL,'Di_lam',''),(773,4,'2025-01-28',NULL,NULL,'Di_lam',''),(774,4,'2025-01-29',NULL,NULL,'Di_lam',''),(775,4,'2025-01-30',NULL,NULL,'Di_lam',''),(776,4,'2025-01-31',NULL,NULL,'Di_lam',''),(777,3,'2025-12-06',NULL,NULL,'Nghi_khong_phep','Tự động đánh dấu nghỉ không phép'),(778,4,'2025-12-06',NULL,NULL,'Nghi_khong_phep','Tự động đánh dấu nghỉ không phép'),(779,5,'2025-12-06',NULL,NULL,'Nghi_khong_phep','Tự động đánh dấu nghỉ không phép'),(780,7,'2025-12-06',NULL,NULL,'Nghi_khong_phep','Tự động đánh dấu nghỉ không phép'),(781,8,'2025-12-06',NULL,NULL,'Nghi_khong_phep','Tự động đánh dấu nghỉ không phép'),(782,9,'2025-12-06',NULL,NULL,'Nghi_khong_phep','Tự động đánh dấu nghỉ không phép'),(783,12,'2025-12-06',NULL,NULL,'Nghi_khong_phep','Tự động đánh dấu nghỉ không phép'),(784,13,'2025-12-06',NULL,NULL,'Nghi_khong_phep','Tự động đánh dấu nghỉ không phép'),(785,14,'2025-12-06',NULL,NULL,'Nghi_khong_phep','Tự động đánh dấu nghỉ không phép'),(786,3,'2025-12-08',NULL,NULL,'Nghi_khong_phep','Tự động đánh dấu nghỉ không phép'),(787,4,'2025-12-08',NULL,NULL,'Nghi_khong_phep','Tự động đánh dấu nghỉ không phép'),(788,5,'2025-12-08',NULL,NULL,'Nghi_khong_phep','Tự động đánh dấu nghỉ không phép'),(789,7,'2025-12-08',NULL,NULL,'Nghi_khong_phep','Tự động đánh dấu nghỉ không phép'),(790,8,'2025-12-08',NULL,NULL,'Nghi_khong_phep','Tự động đánh dấu nghỉ không phép'),(791,9,'2025-12-08',NULL,NULL,'Nghi_khong_phep','Tự động đánh dấu nghỉ không phép'),(792,12,'2025-12-08',NULL,NULL,'Nghi_khong_phep','Tự động đánh dấu nghỉ không phép'),(793,13,'2025-12-08',NULL,NULL,'Nghi_khong_phep','Tự động đánh dấu nghỉ không phép'),(794,14,'2025-12-08',NULL,NULL,'Nghi_khong_phep','Tự động đánh dấu nghỉ không phép');

UN

--
-- Table structure for table `cham_cong_history`
--

DROP TABLE IF EXISTS `cham_cong_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cham_cong_history` (
  `id` int NOT NULL AUTO_INCREMENT,
  `cham_cong_id` int NOT NULL,
  `old_trang_thai` enum('Di_lam','Nghi_phep','Nghi_khong_phep','Lam_them','Di_tre') DEFAULT NULL,
  `new_trang_thai` enum('Di_lam','Nghi_phep','Nghi_khong_phep','Lam_them','Di_tre') DEFAULT NULL,
  `nguoi_chinh_sua` varchar(20) DEFAULT NULL,
  `ngay_chinh_sua` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `cham_cong_id` (`cham_cong_id`),
  CONSTRAINT `cham_cong_history_ibfk_1` FOREIGN KEY (`cham_cong_id`) REFERENCES `cham_cong` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cham_cong_history`
--




UN

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
  `read_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`message_id`),
  KEY `room_id` (`room_id`),
  CONSTRAINT `chat_messages_ibfk_1` FOREIGN KEY (`room_id`) REFERENCES `chat_rooms` (`room_id`)
) ENGINE=InnoDB AUTO_INCREMENT=221 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `chat_messages`
--



INSERT INTO `chat_messages` VALUES (1,1,'1','customer','Xin chào, tôi muốn kiểm tra tình trạng đơn hàng #1',1,'2023-03-30 03:05:00',NULL),(2,1,'NV004','staff','Đơn hàng #1 đang được đóng gói, dự kiến giao trong 2 ngày',1,'2023-03-30 03:15:00',NULL),(3,1,'1','customer','Cảm ơn thông tin!',1,'2023-03-30 03:20:00',NULL),(4,2,'1','customer','Tôi cần thay đổi địa chỉ giao hàng',1,'2022-09-23 07:35:00',NULL),(5,2,'NV002','staff','Vui lòng cung cấp địa chỉ mới',1,'2022-09-23 07:40:00',NULL),(6,2,'1','customer','Đổi sang: 123 Đường ABC, Quận 1',1,'2022-09-23 07:45:00',NULL),(7,3,'4','customer','Đơn hàng #3 đã xác nhận chưa?',1,'2022-09-24 02:20:00',NULL),(8,3,'NV004','staff','Đã xác nhận, đang chuẩn bị hàng',1,'2022-09-24 02:30:00',NULL),(9,4,'6','customer','Khi nào đơn #4 được giao?',1,'2022-09-25 06:25:00',NULL),(10,4,'NV005','staff','Dự kiến giao vào ngày mai trước 17h',1,'2022-09-25 06:35:00',NULL),(11,5,'2','customer','Shipper đã nhận hàng chưa?',1,'2022-09-26 09:50:00',NULL),(12,5,'NV006','staff','Đơn hàng đang trên đường giao, mã vận đơn #GH12345',1,'2022-09-26 10:00:00',NULL),(13,6,'1','customer','Tôi cần tư vấn về chính sách đổi trả',1,'2023-10-01 01:05:00','2025-09-27 13:32:36'),(14,6,'NV003','staff','Chúng tôi sẽ liên hệ lại trong 15 phút',1,'2023-10-01 01:10:00','2025-09-27 13:23:08'),(16,30,'19','customer','Xin chào, đây là tin nhắn đầu tiên trong phòng 30!',1,'2025-09-17 07:03:05','2025-09-27 13:32:36'),(17,32,'19','customer','chào bạn tôi muốn hủy đơn',1,'2025-09-17 12:19:58','2025-09-27 13:32:36'),(18,32,'19','customer','chào bạn tôi hỗ trợ',1,'2025-09-17 12:20:29','2025-09-27 13:32:36'),(19,33,'NV007','staff','CHÀO BẠN ',1,'2025-09-17 12:45:06','2025-09-27 13:23:08'),(20,33,'19','customer','CHÀO BẠN NHÉ',1,'2025-09-17 12:45:30','2025-09-27 13:32:36'),(21,36,'NV007','staff','CHÀO BẠN NHA TUI LÀ HOÀI BẢO ',1,'2025-09-17 12:45:55','2025-09-27 13:23:08'),(22,40,'19','customer','chào bạn tôi muốn hỏi',1,'2025-09-17 12:51:43','2025-09-27 13:32:36'),(23,43,'19','customer','chào bạn',1,'2025-09-17 13:26:34','2025-09-27 13:32:36'),(24,43,'19','customer','chào bạn tôi muốn hủy đơn',1,'2025-09-17 15:20:58','2025-09-27 13:32:36'),(25,44,'NV007','staff','chào bạn ',1,'2025-09-17 15:54:12','2025-09-27 13:23:08'),(26,44,'19','customer','tôi đang có vẫn về',1,'2025-09-17 15:54:52','2025-09-27 13:32:36'),(27,45,'NV007','staff','BẠN HÃY GIÚP TÔI ',1,'2025-09-17 15:55:32','2025-09-27 13:23:08'),(28,45,'NV007','staff','bạn cần gì hỗ trợ',1,'2025-09-17 15:55:50','2025-09-27 13:23:08'),(29,45,'NV007','staff','tui muốn chào bạn',1,'2025-09-17 15:56:05','2025-09-27 13:23:08'),(30,45,'19','customer','chào bạn tôi muốn hủy đơn',1,'2025-09-17 15:56:16','2025-09-27 13:32:36'),(31,45,'NV007','staff','bào ',1,'2025-09-17 16:09:31','2025-09-27 13:23:08'),(32,46,'NV007','staff','BẠN MUỐN HỖ TRỢ GÌ ',1,'2025-09-18 00:51:44','2025-09-27 13:23:08'),(33,46,'NV007','staff','CHÒA BAN',1,'2025-09-18 00:56:22','2025-09-27 13:23:08'),(34,46,'19','customer','CHÀO BẠN',1,'2025-09-18 00:56:57','2025-09-27 13:32:36'),(35,46,'NV007','staff','CHÀO BẠN ',1,'2025-09-18 00:57:07','2025-09-27 13:23:08'),(36,46,'NV007','staff','CHÀO BẠN ',1,'2025-09-18 00:57:32','2025-09-27 13:23:08'),(37,46,'19','customer','BẠN ƠI',1,'2025-09-18 00:57:47','2025-09-27 13:32:36'),(38,46,'NV007','staff','ALO',1,'2025-09-18 00:57:53','2025-09-27 13:23:08'),(39,16,'18','customer','CHÀO BẠN',1,'2025-09-18 01:11:01','2025-09-27 13:32:36'),(40,16,'18','customer','BẠN ƠI',1,'2025-09-18 01:11:33','2025-09-27 13:32:36'),(41,16,'18','customer','chào bạn tôi muốn hủy đơn',1,'2025-09-18 01:12:49','2025-09-27 13:32:36'),(42,16,'18','customer','CHÀO BẠN',1,'2025-09-18 01:13:00','2025-09-27 13:32:36'),(43,52,'18','customer','chào bạn',1,'2025-09-18 01:20:44','2025-09-27 13:32:36'),(44,52,'18','customer','chào bạn tôi muốn hủy đơn',1,'2025-09-18 01:20:56','2025-09-27 13:32:36'),(45,53,'19','customer','chòa bạn',1,'2025-09-18 01:25:02','2025-09-27 13:32:36'),(46,54,'NV007','staff','chào bạn',1,'2025-09-18 01:25:13','2025-09-27 13:23:08'),(47,53,'19','customer','bạn tên gì',1,'2025-09-18 01:25:20','2025-09-27 13:32:36'),(48,54,'NV007','staff','tui tên bảo ',1,'2025-09-18 01:25:27','2025-09-27 13:23:08'),(49,54,'NV007','staff','hi hị',1,'2025-09-18 01:25:37','2025-09-27 13:23:08'),(50,53,'19','customer','chào bạn',1,'2025-09-18 01:25:45','2025-09-27 13:32:36'),(51,55,'NV007','staff','chòa bạn ',1,'2025-09-18 01:26:53','2025-09-27 13:23:08'),(52,53,'19','customer','chòa bạn',1,'2025-09-18 01:27:00','2025-09-27 13:32:36'),(53,53,'19','customer','kkkk',1,'2025-09-18 01:27:01','2025-09-27 13:32:36'),(54,53,'19','customer','chào bạn tôi muốn hủy đơn',1,'2025-09-18 01:27:20','2025-09-27 13:32:36'),(55,55,'NV007','staff','hủy ha',1,'2025-09-18 01:27:28','2025-09-27 13:23:08'),(56,56,'19','customer','chào bạn',1,'2025-09-18 01:29:19','2025-09-27 13:32:36'),(57,56,'19','customer','chào bạn tôi muốn hủy đơn',1,'2025-09-18 01:30:21','2025-09-27 13:32:36'),(58,56,'19','customer','chào bạn tôi muốn hủy đơn',1,'2025-09-18 01:34:24','2025-09-27 13:32:36'),(59,57,'NV007','staff','chào bạn ',1,'2025-09-18 01:34:55','2025-09-27 13:23:08'),(60,56,'19','customer','chào bạn tôi muốn hủy đơn',1,'2025-09-18 01:35:00','2025-09-27 13:32:36'),(61,57,'NV007','staff','hihi',1,'2025-09-18 01:35:05','2025-09-27 13:23:08'),(62,57,'19','customer','chào bạn',1,'2025-09-18 08:47:04','2025-09-27 13:32:36'),(63,58,'NV007','staff','CHÀO BẠN',1,'2025-09-18 08:48:15','2025-09-27 13:23:08'),(64,57,'19','customer','HIHI',1,'2025-09-18 08:48:21','2025-09-27 13:32:36'),(65,58,'NV007','staff','BẠN TÊN GÌ',1,'2025-09-18 08:48:32','2025-09-27 13:23:08'),(66,57,'19','customer','HI HI',1,'2025-09-18 08:48:37','2025-09-27 13:32:36'),(67,60,'NV007','staff','CHÀO BẠN ',1,'2025-09-20 10:51:50','2025-09-27 13:23:08'),(68,61,'19','customer','CHÀO BẠN',1,'2025-09-27 03:41:12','2025-09-27 13:32:36'),(69,63,'NV007','staff','CHÀO BẠN ',1,'2025-09-27 03:41:28','2025-09-27 13:23:08'),(70,61,'19','customer','HI HI',1,'2025-09-27 03:41:35','2025-09-27 13:32:36'),(71,61,'19','customer','TÔI MUỐN HỎI',1,'2025-09-27 03:42:02','2025-09-27 13:32:36'),(72,63,'NV007','staff','HỎI GÌ VẬY ',1,'2025-09-27 03:42:07','2025-09-27 13:23:08'),(73,64,'NV007','staff','CHÀO BẠN ',1,'2025-09-27 03:42:28','2025-09-27 13:23:08'),(74,61,'19','customer','BẠN HÒI ĐI',1,'2025-09-27 03:42:45','2025-09-27 13:32:36'),(75,65,'NV007','staff','BẠN ƠI ',1,'2025-09-27 03:43:07','2025-09-27 13:23:08'),(76,65,'19','customer','chào bạn tôi muốn hủy đơn',1,'2025-09-27 03:43:31','2025-09-27 13:32:36'),(77,65,'NV007','staff','HỦY ĐI ',1,'2025-09-27 03:43:36','2025-09-27 13:23:08'),(78,65,'NV007','staff','BẠN CHẮC LÀ HỦY CHƯA ',1,'2025-09-27 03:43:44','2025-09-27 13:23:08'),(79,65,'19','customer','HỦY ĐI',1,'2025-09-27 03:43:48','2025-09-27 13:32:36'),(80,65,'NV007','staff','ALO',1,'2025-09-27 03:43:57','2025-09-27 13:23:08'),(81,65,'19','customer','chào bạn tôi muốn hủy đơn',1,'2025-09-27 03:45:55','2025-09-27 13:32:36'),(82,65,'NV007','staff','HIHI',1,'2025-09-27 03:46:00','2025-09-27 13:23:08'),(83,65,'19','customer','chào bạn',1,'2025-09-27 03:52:04','2025-09-27 13:32:36'),(84,65,'NV007','staff','chào bạn ',1,'2025-09-27 03:52:11','2025-09-27 13:23:08'),(85,62,'18','customer','CHÀO BẠN',1,'2025-09-27 03:54:39','2025-09-27 13:32:36'),(86,66,'NV007','staff','CHÀO BẠN',1,'2025-09-27 03:54:52','2025-09-27 13:23:08'),(87,62,'18','customer','HIHI',1,'2025-09-27 03:55:00','2025-09-27 13:32:36'),(88,66,'NV007','staff','HI ',1,'2025-09-27 03:55:04','2025-09-27 13:23:08'),(89,62,'18','customer','chào bạn tôi muốn hủy đơn',1,'2025-09-27 03:55:24','2025-09-27 13:32:36'),(90,66,'NV007','staff','HOI ĐI',1,'2025-09-27 03:55:29','2025-09-27 13:23:08'),(91,67,'NV007','staff','HIHI',1,'2025-09-27 03:55:48','2025-09-27 13:23:08'),(92,62,'18','customer','HI HI',1,'2025-09-27 03:55:54','2025-09-27 13:32:36'),(93,67,'NV007','staff','CHÀO BẠN',1,'2025-09-27 03:55:58','2025-09-27 13:23:08'),(94,62,'18','customer','BẠN ƠI',1,'2025-09-27 03:56:12','2025-09-27 13:32:36'),(95,67,'NV007','staff','HI HỊ',1,'2025-09-27 03:56:17','2025-09-27 13:23:08'),(96,62,'18','customer','chào bạn tôi muốn hủy đơn',1,'2025-09-27 03:57:03','2025-09-27 13:32:36'),(97,70,'NV007','staff','HUY HA',1,'2025-09-27 03:57:09','2025-09-27 13:23:08'),(98,70,'18','customer','CHÀO BẠN',1,'2025-09-27 03:59:11','2025-09-27 13:32:36'),(99,72,'NV007','staff','CHÀO BẠN ',1,'2025-09-27 03:59:27','2025-09-27 13:23:08'),(100,70,'18','customer','HIHI',1,'2025-09-27 03:59:32','2025-09-27 13:32:36'),(101,70,'18','customer','HAHA',1,'2025-09-27 03:59:37','2025-09-27 13:32:36'),(102,70,'18','customer','chào bạn tôi muốn hủy đơn',1,'2025-09-27 04:04:03','2025-09-27 13:32:36'),(103,73,'NV007','staff','CHAO',1,'2025-09-27 04:04:13','2025-09-27 13:23:08'),(104,70,'18','customer','HIHI',1,'2025-09-27 04:04:19','2025-09-27 13:32:36'),(105,73,'NV007','staff','HAHAHA',1,'2025-09-27 04:04:23','2025-09-27 13:23:08'),(106,70,'18','customer','HÚ HÚ',1,'2025-09-27 04:04:34','2025-09-27 13:32:36'),(107,73,'NV007','staff','TRAN HOAI BAO',1,'2025-09-27 04:05:26','2025-09-27 13:23:08'),(108,70,'18','customer','K THẤY',1,'2025-09-27 04:05:33','2025-09-27 13:32:36'),(109,71,'19','customer','chào bạn',1,'2025-09-27 05:43:15','2025-09-27 13:32:36'),(110,74,'NV007','staff','CHÒA BẠN',1,'2025-09-27 05:43:48','2025-09-27 13:23:08'),(111,71,'19','customer','HEHE',1,'2025-09-27 05:43:59','2025-09-27 13:32:36'),(112,74,'NV007','staff','Ê ',1,'2025-09-27 05:44:04','2025-09-27 13:23:08'),(113,71,'19','customer','HI HI',1,'2025-09-27 05:44:48','2025-09-27 13:32:36'),(114,74,'NV007','staff','HIHI',1,'2025-09-27 05:45:11','2025-09-27 13:23:08'),(115,74,'19','customer','chòa bạn',1,'2025-09-27 05:55:55','2025-09-27 13:32:06'),(116,74,'7','staff','làm gì đó',1,'2025-09-27 05:56:07','2025-09-27 13:23:08'),(117,74,'7','staff','làm gì đó',1,'2025-09-27 05:56:13','2025-09-27 13:23:08'),(118,74,'19','customer','chào nha',1,'2025-09-27 05:56:18','2025-09-27 13:32:06'),(119,74,'7','staff','hihi',1,'2025-09-27 05:56:33','2025-09-27 13:23:08'),(120,74,'19','customer','hahaha',1,'2025-09-27 05:56:37','2025-09-27 13:32:06'),(121,74,'7','staff','hihi',1,'2025-09-27 06:01:05','2025-09-27 13:23:08'),(122,74,'19','customer','ha',1,'2025-09-27 06:01:24','2025-09-27 13:32:06'),(123,74,'7','staff','chào bạn',1,'2025-09-27 06:04:08','2025-09-27 13:23:08'),(124,74,'7','staff','kkk',1,'2025-09-27 06:04:23','2025-09-27 13:23:08'),(125,74,'19','customer','alo tôi đẹp trai k',1,'2025-09-27 06:12:04','2025-09-27 13:32:06'),(126,74,'7','staff','khi nào ngủ',1,'2025-09-27 06:12:32','2025-09-27 13:23:08'),(127,74,'19','customer','kkk',1,'2025-09-27 06:13:53','2025-09-27 13:32:06'),(128,74,'19','customer','hẹ he',1,'2025-09-27 06:13:56','2025-09-27 13:32:06'),(129,74,'7','staff','đang làm gì vậy',1,'2025-09-27 06:20:54','2025-09-27 13:23:08'),(130,74,'7','staff','he he',1,'2025-09-27 06:20:58','2025-09-27 13:23:08'),(131,74,'7','staff','bạn ngủ chưa',1,'2025-09-27 06:22:25','2025-09-27 13:23:08'),(132,74,'7','staff','ngủ chưa',1,'2025-09-27 06:27:36','2025-09-27 13:23:08'),(133,74,'19','customer','đẹp trai',1,'2025-09-27 06:27:47','2025-09-27 13:32:06'),(134,74,'19','customer','CHÀO BẠN NHÉ',1,'2025-09-27 06:41:11','2025-09-27 13:32:06'),(135,74,'19','customer','hi hi',1,'2025-09-27 09:26:56','2025-09-27 13:32:06'),(136,74,'7','staff','HẤ HÁ',1,'2025-09-27 09:27:38','2025-09-27 13:23:08'),(137,74,'19','customer','GIỜ TÔI  MUỐN HỦY ĐƠN ĐC K',1,'2025-09-27 09:27:57','2025-09-27 13:32:06'),(138,74,'7','staff','BẠN MUỐN HỦY ĐƠN NÀO',1,'2025-09-27 09:28:13','2025-09-27 13:23:08'),(139,74,'19','customer','ĐƠN 123',1,'2025-09-27 09:28:31','2025-09-27 13:32:06'),(140,74,'7','staff','RÔI SẼ GIÚP BẠN',1,'2025-09-27 09:28:41','2025-09-27 13:23:08'),(141,74,'19','customer','BẠN ƠI BẠN',1,'2025-09-27 13:32:59','2025-09-27 13:33:04'),(142,74,'7','staff','bạn làm gì đó',0,'2025-09-27 13:33:37',NULL),(143,74,'19','customer','tôi lsf sieu nhan',1,'2025-09-27 13:37:41','2025-09-29 02:47:03'),(144,70,'18','customer','bngur di',0,'2025-09-27 13:38:22',NULL),(145,70,'18','customer','hi hi',0,'2025-09-27 13:40:40',NULL),(146,70,'18','customer','hehe',0,'2025-09-27 13:46:20',NULL),(147,70,'18','customer','hehe',0,'2025-09-27 13:46:43',NULL),(148,70,'18','customer','hahaa',0,'2025-09-27 13:49:22',NULL),(149,70,'18','customer','hay hay',0,'2025-09-27 13:51:54',NULL),(150,70,'18','customer','hA',0,'2025-09-27 14:08:47',NULL),(151,70,'18','customer','KK',0,'2025-09-27 14:09:08',NULL),(152,74,'19','customer','HI',1,'2025-09-27 14:52:27','2025-09-29 02:47:03'),(153,74,'19','customer','HI',1,'2025-09-27 14:54:00','2025-09-29 02:47:03'),(154,74,'19','customer','DR',1,'2025-09-27 14:54:43','2025-09-29 02:47:03'),(155,74,'19','customer','G',1,'2025-09-27 14:55:47','2025-09-29 02:47:03'),(156,74,'19','customer','H',1,'2025-09-27 14:56:37','2025-09-29 02:47:03'),(157,74,'19','customer','HE',1,'2025-09-27 14:57:21','2025-09-29 02:47:03'),(158,74,'19','customer','HAY',1,'2025-09-27 15:02:00','2025-09-29 02:47:03'),(159,74,'19','customer','HA HA',1,'2025-09-27 15:03:17','2025-09-29 02:47:03'),(160,74,'19','customer','chào bạn',1,'2025-09-29 02:46:33','2025-09-29 02:47:03'),(161,74,'19','customer','CHÀO NHÉ',1,'2025-09-29 02:47:17','2025-09-29 02:47:48'),(162,74,'7','staff','HI HI',0,'2025-09-29 02:48:06',NULL),(163,74,'7','staff','HAHA',0,'2025-09-29 02:48:16',NULL),(164,70,'18','customer','he',0,'2025-09-29 02:50:13',NULL),(165,73,'7','staff','hẹ hẹ',0,'2025-09-29 02:50:27',NULL),(166,70,'18','customer','lam j',0,'2025-09-29 02:51:14',NULL),(167,70,'18','customer','haha',0,'2025-09-29 02:54:52',NULL),(168,73,'7','staff','alo',0,'2025-09-29 02:55:31',NULL),(169,73,'7','staff','haha',0,'2025-09-29 02:55:52',NULL),(170,73,'7','staff','123',0,'2025-09-29 02:56:02',NULL),(171,73,'18','customer','a;p',1,'2025-09-29 02:56:23','2025-09-29 07:09:40'),(172,73,'7','staff','123',0,'2025-09-29 02:56:30',NULL),(173,73,'18','customer','12345',1,'2025-09-29 02:56:42','2025-09-29 07:09:40'),(174,73,'7','staff','CC',0,'2025-09-29 07:09:45',NULL),(175,73,'7','staff','alo alo',0,'2025-10-04 01:13:43',NULL),(176,74,'19','customer','chào bạn',1,'2025-10-04 01:14:48','2025-10-04 01:14:55'),(177,74,'7','staff','hi hi',0,'2025-10-04 01:15:02',NULL),(178,74,'7','staff','chào bạn',0,'2025-10-04 01:15:14',NULL),(179,74,'19','customer','haha',1,'2025-10-04 01:15:22','2025-10-04 01:16:01'),(180,74,'7','staff','kkk',0,'2025-10-04 01:15:40',NULL),(181,74,'19','customer','hahhaa',1,'2025-10-04 01:15:47','2025-10-04 01:16:01'),(182,74,'7','staff','123',0,'2025-10-04 01:16:10',NULL),(183,74,'19','customer','alo alo',1,'2025-10-04 01:16:17','2025-10-04 01:17:05'),(184,74,'19','customer','123',1,'2025-10-04 01:16:53','2025-10-04 01:17:05'),(185,74,'7','staff','123456789',0,'2025-10-04 01:17:24',NULL),(186,73,'18','customer','chào buổi sáng',1,'2025-10-04 01:18:40','2025-10-04 01:18:48'),(187,73,'7','staff','chúc bạn buổi sáng vv',0,'2025-10-04 01:19:01',NULL),(188,73,'18','customer','123',1,'2025-10-04 01:23:47','2025-10-12 01:24:51'),(189,73,'7','staff','1234',0,'2025-10-04 01:23:56',NULL),(190,74,'19','customer','HẸ HẸ',1,'2025-10-08 10:32:16','2025-10-08 10:32:23'),(191,74,'7','staff','bạn đang làm gì',0,'2025-10-08 10:32:32',NULL),(192,74,'19','customer','HI',1,'2025-10-08 10:33:38','2025-10-08 10:33:43'),(193,74,'7','staff','ALO',0,'2025-10-11 10:03:29',NULL),(194,74,'19','customer','ALO',1,'2025-10-12 01:21:24','2025-10-12 01:21:32'),(195,74,'7','staff','ALO',0,'2025-10-12 01:21:37',NULL),(196,74,'19','customer','HẸ HẸ',1,'2025-10-12 01:21:45','2025-10-12 01:21:54'),(197,73,'18','customer','chào bạn',1,'2025-10-12 01:24:44','2025-10-12 01:24:51'),(198,73,'7','staff','có gì không ạ',0,'2025-10-12 01:25:10',NULL),(199,73,'18','customer','alo',1,'2025-10-12 01:27:54','2025-10-12 01:28:00'),(200,73,'7','staff','bạn cần gi',0,'2025-10-12 01:28:08',NULL),(201,74,'19','customer','123',1,'2025-10-13 06:08:47','2025-10-13 06:08:53'),(202,73,'18','customer','123',1,'2025-10-13 06:09:21','2025-10-13 06:09:28'),(203,73,'7','staff','sao em',0,'2025-10-13 06:09:35',NULL),(204,73,'18','customer','huy hang',1,'2025-10-13 06:09:43','2025-10-15 01:47:55'),(205,73,'7','staff','ok',0,'2025-10-13 06:09:59',NULL),(206,73,'18','customer','HIHI',1,'2025-10-15 06:22:01','2025-10-15 06:22:06'),(207,73,'7','staff','CHAO',0,'2025-10-15 06:22:10',NULL),(208,73,'18','customer','123',1,'2025-10-28 02:41:07','2025-10-28 02:41:14'),(209,73,'7','staff','ALO',0,'2025-10-28 02:41:20',NULL),(210,73,'18','customer','chao',1,'2025-11-01 03:12:09','2025-11-01 03:14:07'),(211,73,'7','staff','123',0,'2025-11-01 03:14:13',NULL),(212,74,'19','customer','chào bạn',1,'2025-11-02 03:03:46','2025-11-14 04:11:22'),(213,74,'19','customer','ALO',1,'2025-11-14 04:11:18','2025-11-14 04:11:22'),(214,74,'19','customer','adlo',1,'2025-11-14 04:11:39','2025-11-14 04:11:44'),(215,74,'19','customer','he he',0,'2025-11-20 15:12:14',NULL),(216,73,'18','customer','CHÀO BẠN',1,'2025-12-02 05:48:06','2025-12-02 05:48:15'),(217,73,'7','staff','BẠN CẦN TÔI GIUP ĐỠ GÌ',0,'2025-12-02 05:48:30',NULL),(218,73,'18','customer','TÔI MUỐN ...',0,'2025-12-02 05:48:43',NULL),(219,75,'24','customer','chào bạn',1,'2025-12-08 11:57:36','2025-12-08 11:58:03'),(220,75,'7','staff','RẤT VUI ĐC PHỤC VỤ',0,'2025-12-08 11:58:27',NULL);

UN

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
) ENGINE=InnoDB AUTO_INCREMENT=77 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `chat_rooms`
--



INSERT INTO `chat_rooms` VALUES (1,1,1,'NV004','2023-03-30 03:00:00','2023-03-30 04:30:00'),(2,2,1,'NV002','2022-09-23 07:30:00','2022-09-23 08:00:00'),(3,3,4,'NV004','2022-09-24 02:15:00','2022-09-24 03:45:00'),(4,4,6,'NV005','2022-09-25 06:20:00','2022-09-25 07:30:00'),(5,5,2,'NV006','2022-09-26 09:45:00','2022-09-26 10:30:00'),(6,NULL,1,'NV003','2023-10-01 01:00:00','2023-10-01 01:00:00'),(7,NULL,1,NULL,'2025-05-19 01:45:35','2025-05-19 01:45:35'),(8,NULL,1,NULL,'2025-05-19 02:24:29','2025-05-19 02:24:29'),(9,NULL,1,NULL,'2025-05-19 02:24:29','2025-05-19 02:24:29'),(10,NULL,1,NULL,'2025-05-19 02:24:31','2025-05-19 02:24:31'),(11,NULL,1,NULL,'2025-05-19 02:24:36','2025-05-19 02:24:36'),(12,NULL,1,NULL,'2025-05-19 02:24:36','2025-05-19 02:24:36'),(13,NULL,18,NULL,'2025-05-19 02:30:33','2025-05-19 02:30:33'),(14,NULL,18,NULL,'2025-05-19 02:47:39','2025-05-19 02:47:39'),(15,NULL,18,NULL,'2025-05-19 03:00:35','2025-05-19 03:00:35'),(16,NULL,18,NULL,'2025-05-19 03:19:30','2025-09-18 01:13:01'),(17,NULL,1,NULL,'2025-05-20 15:55:11','2025-05-20 15:55:11'),(18,NULL,1,NULL,'2025-08-21 13:00:10','2025-08-21 13:00:10'),(19,NULL,19,NULL,'2025-09-11 14:59:52','2025-09-11 14:59:52'),(20,NULL,19,NULL,'2025-09-11 15:06:41','2025-09-11 15:06:41'),(21,NULL,19,NULL,'2025-09-11 15:16:28','2025-09-11 15:16:28'),(22,NULL,19,NULL,'2025-09-12 02:24:56','2025-09-12 02:24:56'),(23,NULL,19,NULL,'2025-09-15 02:22:42','2025-09-15 02:22:42'),(24,NULL,19,NULL,'2025-09-16 03:55:18','2025-09-16 03:55:18'),(25,NULL,19,NULL,'2025-09-17 06:01:33','2025-09-17 06:01:33'),(26,NULL,19,NULL,'2025-09-17 06:25:40','2025-09-17 06:25:40'),(27,NULL,19,NULL,'2025-09-17 06:26:25','2025-09-17 06:26:25'),(28,NULL,19,NULL,'2025-09-17 06:28:43','2025-09-17 06:28:43'),(29,NULL,19,NULL,'2025-09-17 06:51:23','2025-09-17 06:51:23'),(30,NULL,19,NULL,'2025-09-17 07:01:16','2025-09-17 07:03:05'),(31,NULL,19,NULL,'2025-09-17 09:22:42','2025-09-17 09:22:42'),(32,NULL,19,NULL,'2025-09-17 11:14:52','2025-09-17 12:20:29'),(33,NULL,19,NULL,'2025-09-17 12:45:02','2025-09-17 12:45:30'),(34,NULL,19,NULL,'2025-09-17 12:45:37','2025-09-17 12:45:37'),(35,NULL,19,NULL,'2025-09-17 12:45:40','2025-09-17 12:45:40'),(36,NULL,19,NULL,'2025-09-17 12:45:45','2025-09-17 12:45:55'),(37,NULL,19,NULL,'2025-09-17 12:46:19','2025-09-17 12:46:19'),(38,NULL,19,NULL,'2025-09-17 12:48:44','2025-09-17 12:48:44'),(39,NULL,19,NULL,'2025-09-17 12:48:47','2025-09-17 12:48:47'),(40,NULL,19,NULL,'2025-09-17 12:51:25','2025-09-17 12:51:43'),(41,NULL,19,NULL,'2025-09-17 12:51:51','2025-09-17 12:51:51'),(42,NULL,19,NULL,'2025-09-17 12:51:55','2025-09-17 12:51:55'),(43,NULL,19,NULL,'2025-09-17 13:01:28','2025-09-17 15:20:58'),(44,NULL,19,NULL,'2025-09-17 15:54:05','2025-09-17 15:54:52'),(45,NULL,19,NULL,'2025-09-17 15:55:24','2025-09-17 16:09:31'),(46,NULL,19,NULL,'2025-09-18 00:51:31','2025-09-18 00:57:53'),(47,NULL,19,NULL,'2025-09-18 01:10:17','2025-09-18 01:10:17'),(48,NULL,19,NULL,'2025-09-18 01:11:12','2025-09-18 01:11:12'),(49,NULL,19,NULL,'2025-09-18 01:11:20','2025-09-18 01:11:20'),(50,NULL,19,NULL,'2025-09-18 01:11:37','2025-09-18 01:11:37'),(51,NULL,19,NULL,'2025-09-18 01:12:08','2025-09-18 01:12:08'),(52,NULL,18,NULL,'2025-09-18 01:13:44','2025-09-18 01:20:56'),(53,NULL,19,NULL,'2025-09-18 01:14:40','2025-09-18 01:27:20'),(54,NULL,19,NULL,'2025-09-18 01:25:10','2025-09-18 01:25:37'),(55,NULL,19,NULL,'2025-09-18 01:26:49','2025-09-18 01:27:28'),(56,NULL,19,NULL,'2025-09-18 01:28:15','2025-09-18 01:35:00'),(57,NULL,19,NULL,'2025-09-18 01:34:50','2025-09-18 08:48:37'),(58,NULL,19,NULL,'2025-09-18 08:48:09','2025-09-18 08:48:32'),(59,NULL,19,NULL,'2025-09-18 09:45:52','2025-09-18 09:45:52'),(60,NULL,19,NULL,'2025-09-20 10:51:47','2025-09-20 10:51:50'),(61,NULL,19,NULL,'2025-09-24 15:42:16','2025-09-27 03:42:45'),(62,NULL,18,NULL,'2025-09-27 03:40:23','2025-09-27 03:57:04'),(63,NULL,19,NULL,'2025-09-27 03:41:21','2025-09-27 03:42:07'),(64,NULL,19,NULL,'2025-09-27 03:42:14','2025-09-27 03:42:28'),(65,NULL,19,NULL,'2025-09-27 03:43:03','2025-09-27 03:52:11'),(66,NULL,18,NULL,'2025-09-27 03:54:47','2025-09-27 03:55:30'),(67,NULL,18,NULL,'2025-09-27 03:55:44','2025-09-27 03:56:18'),(68,NULL,19,NULL,'2025-09-27 03:56:37','2025-09-27 03:56:37'),(69,NULL,19,NULL,'2025-09-27 03:56:42','2025-09-27 03:56:42'),(70,NULL,18,NULL,'2025-09-27 03:56:47','2025-09-29 02:54:52'),(71,NULL,19,NULL,'2025-09-27 03:59:19','2025-09-27 05:44:48'),(72,NULL,18,NULL,'2025-09-27 03:59:23','2025-09-27 03:59:27'),(73,NULL,18,NULL,'2025-09-27 04:04:10','2025-12-02 05:48:43'),(74,NULL,19,NULL,'2025-09-27 05:43:45','2025-11-20 15:12:14'),(75,NULL,24,NULL,'2025-10-24 08:25:03','2025-12-08 11:58:27'),(76,NULL,25,NULL,'2025-10-28 03:59:28','2025-10-28 03:59:28');

UN

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `chitiethoadon`
--



INSERT INTO `chitiethoadon` VALUES (2,1,140000,1),(20,1,100000,2),(31,1,120000,1),(34,1,120000,3),(38,1,120000,1),(39,1,120000,2),(40,1,120000,2),(41,1,120000,2),(42,1,10000,2),(43,1,10000,2),(44,1,10000,2),(52,1,10000,2),(57,1,10000,2),(58,1,120000,2),(59,1,120000,1),(60,1,120000,2),(61,1,120000,2),(62,1,120000,2),(63,1,120000,2),(64,1,120000,2),(65,1,120000,2),(66,1,120000,2),(67,1,120000,2),(68,1,120000,2),(69,1,120000,2),(70,1,120000,2),(71,1,120000,2),(72,1,120000,2),(76,1,50000,2),(77,1,50000,2),(79,1,120000,1),(80,1,120000,1),(81,1,120000,1),(82,1,120000,1),(83,1,120000,1),(84,1,120000,1),(85,1,120000,1),(86,1,120000,1),(87,1,120000,1),(88,1,120000,1),(89,1,120000,1),(90,1,120000,1),(91,1,120000,1),(92,1,120000,1),(93,1,120000,2),(94,1,120000,1),(95,1,120000,1),(97,1,120000,2),(98,1,12000,1),(101,1,12000,1),(103,1,12000,2),(104,1,12000,2),(106,1,12000,1),(107,1,12000,1),(108,1,12000,1),(109,1,12000,1),(113,1,12000,1),(117,1,12000,1),(118,1,12000,1),(119,1,12000,2),(120,1,12000,1),(121,1,12000,1),(122,1,12000,2),(123,1,12000,1),(124,1,12000,1),(126,1,12000,1),(127,1,12000,1),(129,1,12000,1),(134,1,12000,1),(149,1,12000,2),(151,1,12000,1),(154,1,12000,1),(155,1,12000,1),(158,1,12000,1),(165,1,12000,1),(174,1,12000,1),(183,1,12000,1),(187,1,12000,1),(189,1,12000,1),(190,1,12000,1),(195,1,12000,1),(197,1,12000,1),(198,1,12000,1),(199,1,12000,1),(200,1,12000,1),(204,1,17280,1),(205,1,17280,1),(206,1,17280,1),(208,1,17280,1),(209,1,17280,1),(246,1,72000,1),(253,1,72000,1),(259,1,72000,3),(260,1,72000,1),(263,1,86400,2),(265,1,86400,2),(267,1,86400,1),(273,1,86400,1),(281,1,86400,1),(282,1,86400,1),(284,1,86400,1),(289,1,86400,1),(293,1,86400,1),(296,1,86400,2),(297,1,86400,3),(298,1,86400,2),(312,1,86400,1),(317,1,86400,2),(324,1,86400,1),(3,2,340000,1),(9,2,340000,3),(10,2,340000,3),(11,2,340000,3),(12,2,340000,3),(13,2,340000,4),(14,2,340000,4),(15,2,340000,1),(16,2,340000,2),(18,2,340000,1),(21,2,340000,3),(27,2,150000,1),(29,2,150000,1),(35,2,150000,1),(36,2,150000,3),(37,2,150000,1),(38,2,150000,10),(39,2,150000,1),(40,2,150000,1),(41,2,150000,1),(58,2,150000,1),(59,2,150000,1),(60,2,150000,1),(61,2,150000,1),(62,2,150000,1),(63,2,150000,1),(64,2,150000,1),(65,2,150000,1),(66,2,150000,1),(67,2,150000,1),(68,2,150000,1),(69,2,150000,1),(70,2,150000,1),(71,2,150000,1),(72,2,150000,1),(73,2,150000,1),(74,2,150000,1),(75,2,150000,1),(76,2,100000,1),(77,2,100000,1),(81,2,150000,1),(82,2,150000,1),(83,2,150000,1),(84,2,150000,1),(85,2,150000,1),(86,2,150000,1),(87,2,150000,1),(88,2,150000,1),(89,2,150000,1),(90,2,150000,1),(91,2,150000,1),(92,2,150000,1),(93,2,150000,1),(95,2,150000,1),(96,2,150000,1),(102,2,150000,1),(105,2,150000,1),(106,2,150000,1),(108,2,150000,1),(109,2,150000,1),(113,2,150000,1),(117,2,150000,1),(120,2,150000,1),(122,2,150000,2),(123,2,150000,1),(124,2,150000,1),(129,2,150000,1),(136,2,150000,1),(146,2,150000,1),(157,2,150000,1),(159,2,150000,1),(161,2,150000,1),(165,2,150000,1),(167,2,150000,1),(174,2,150000,1),(193,2,181125,1),(195,2,181125,1),(197,2,181125,1),(198,2,181125,1),(203,2,217350,1),(204,2,260820,1),(205,2,260820,1),(206,2,260820,1),(208,2,260820,8),(253,2,72000,1),(259,2,72000,1),(260,2,72000,1),(263,2,86400,2),(265,2,86400,2),(268,2,86400,1),(276,2,86400,1),(285,2,86400,1),(293,2,86400,3),(294,2,86400,1),(296,2,86400,2),(297,2,86400,1),(298,2,86400,2),(312,2,86400,2),(317,2,86400,2),(319,2,86400,1),(322,2,86400,1),(4,3,130000,1),(9,3,130000,1),(10,3,130000,1),(11,3,130000,1),(12,3,130000,1),(13,3,130000,1),(14,3,130000,1),(15,3,130000,1),(16,3,130000,1),(17,3,130000,2),(19,3,130000,1),(23,3,5,1),(30,3,5,1),(39,3,200000,1),(40,3,200000,1),(41,3,200000,1),(58,3,200000,1),(59,3,200000,1),(73,3,200000,2),(74,3,200000,2),(75,3,200000,2),(78,3,200000,1),(100,3,138000,2),(101,3,138000,1),(102,3,138000,1),(105,3,138000,1),(110,3,138000,1),(113,3,138000,1),(117,3,138000,1),(119,3,138000,3),(120,3,138000,1),(121,3,151800,1),(122,3,151800,1),(124,3,151800,5),(126,3,151800,1),(128,3,151800,2),(131,3,151800,1),(136,3,151800,1),(137,3,151800,1),(138,3,151800,1),(146,3,151800,1),(148,3,151800,1),(149,3,151800,1),(151,3,151800,1),(152,3,151800,1),(156,3,151800,1),(159,3,151800,1),(160,3,151800,1),(161,3,151800,1),(171,3,151800,2),(172,3,151800,1),(173,3,151800,2),(175,3,151800,1),(176,3,151800,1),(177,3,151800,1),(179,3,151800,1),(182,3,151800,1),(192,3,151800,1),(197,3,151800,2),(203,3,151800,1),(204,3,151800,2),(207,3,151800,1),(208,3,151800,2),(253,3,151800,1),(260,3,151800,1),(295,3,151800,90),(300,3,151800,3),(314,3,151800,150),(328,3,151800,100),(5,4,310000,1),(28,4,310000,1),(32,4,310000,1),(33,4,310000,1),(151,4,409200.00000000006,1),(152,4,409200.00000000006,1),(156,4,409200.00000000006,1),(160,4,409200.00000000006,1),(161,4,409200.00000000006,1),(168,4,409200.00000000006,1),(170,4,409200.00000000006,1),(172,4,409200.00000000006,2),(175,4,409200.00000000006,1),(176,4,409200.00000000006,1),(181,4,409200.00000000006,1),(194,4,409200.00000000006,1),(196,4,409200.00000000006,1),(197,4,409200.00000000006,1),(204,4,5892480,1),(208,4,5892480,1),(253,4,60000,1),(259,4,60000,1),(6,5,230000,1),(23,5,230000,2),(32,5,230000,1),(112,5,120000,1),(115,5,120000,1),(116,5,120000,1),(120,5,120000,1),(133,5,120000,1),(137,5,120000,1),(138,5,120000,1),(139,5,120000,1),(142,5,120000,1),(145,5,120000,1),(150,5,120000,2),(152,5,120000,1),(160,5,120000,1),(166,5,120000,1),(168,5,120000,1),(170,5,120000,1),(172,5,120000,1),(181,5,120000,2),(186,5,120000,1),(191,5,120000,1),(197,5,120000,1),(204,5,120000,1),(208,5,120000,1),(216,5,120000,2),(232,5,120000,1),(253,5,120000,1),(7,6,180000,1),(94,6,200000,1),(97,6,200000,1),(112,6,12000,1),(115,6,12000,1),(116,6,12000,1),(118,6,12000,1),(130,6,12000,3),(132,6,12000,1),(134,6,12000,1),(140,6,12000,1),(141,6,12000,2),(167,6,12000,1),(187,6,12000,1),(199,6,12000,1),(209,6,12000,1),(217,6,12000,1),(237,6,12000,1),(240,6,12000,1),(245,6,12000,1),(246,6,12000,2),(247,6,12000,4),(249,6,12000,1),(255,6,12000,1),(8,7,480000,1),(164,7,480000,1),(183,7,480000,1),(188,7,480000,1),(201,7,480000,1),(203,7,480000,1),(229,7,480000,1),(240,7,480000,1),(264,7,480000,1),(275,7,480000,1),(280,7,480000,1),(302,7,480000,1),(303,7,480000,1),(304,7,480000,1),(305,7,480000,1),(306,7,480000,1),(307,7,480000,1),(309,7,480000,1),(311,7,480000,1),(313,7,480000,1),(316,7,480000,1),(318,7,480000,1),(321,7,480000,1),(326,7,480000,1),(329,7,480000,1),(99,8,210000,1),(111,8,210000,1),(118,8,210000,1),(132,8,210000,1),(142,8,210000,1),(144,8,210000,1),(149,8,210000,3),(164,8,252000,1),(169,8,252000,1),(183,8,252000,1),(229,8,252000,1),(242,8,252000,1),(245,8,252000,2),(246,8,252000,2),(247,8,252000,4),(255,8,252000,1),(264,8,252000,1),(299,8,252000,2),(303,8,252000,1),(304,8,252000,1),(305,8,252000,1),(313,8,252000,1),(23,9,500000,1),(32,9,500000,1),(127,9,500000,1),(128,9,500000,2),(135,9,500000,1),(136,9,500000,1),(144,9,500000,1),(147,9,500000,1),(150,9,500000,2),(153,9,500000,1),(162,9,500000,1),(208,9,500000,3),(213,9,500000,1),(217,9,500000,1),(219,9,500000,1),(228,9,500000,2),(242,9,500000,1),(316,9,500000,1),(318,9,500000,1),(325,9,500000,1),(326,9,500000,1),(153,10,310000,1),(162,10,310000,1),(228,10,310000,1),(266,10,310000,1),(110,11,340000,1),(308,11,340000,1),(310,11,340000,1),(315,11,340000,1),(315,12,340000,1),(24,13,230000,1),(143,13,230000,1),(244,13,230000,1),(315,13,230000,1),(209,14,370000,1),(210,14,370000,1),(211,14,370000,1),(213,14,370000,1),(215,14,370000,1),(219,14,370000,1),(221,14,370000,1),(225,14,370000,1),(235,14,370000,1),(25,15,230000,1),(140,15,230000,1),(145,15,230000,1),(220,15,230000,1),(252,15,230000,1),(21,16,180000,3),(36,16,180000,1),(177,16,180000,1),(178,16,180000,1),(180,16,180000,1),(184,16,180000,1),(202,16,180000,1),(177,17,480000,1),(184,17,480000,1),(185,17,480000,1),(163,18,210000,1),(210,18,210000,1),(211,18,210000,1),(215,18,210000,28),(327,18,210000,8),(114,19,500000,1),(143,19,500000,1),(147,19,500000,1),(163,19,500000,1),(226,19,500000,1),(231,19,500000,3),(249,19,500000,1),(114,20,310000,1),(148,20,310000,1),(163,20,310000,1),(210,20,310000,1),(212,20,310000,1),(216,20,310000,1),(233,21,230000,1),(248,22,180000,1),(250,22,180000,1),(251,22,180000,1),(248,23,480000,1),(250,23,480000,1),(251,23,480000,1),(254,23,480000,3),(257,23,480000,1),(254,24,210000,1),(257,24,210000,1),(254,25,500000,1),(257,25,500000,1),(258,25,500000,1),(312,25,500000,1),(258,26,140000,1),(224,27,120000,1),(227,27,120000,1),(258,27,120000,1),(224,28,130000,1),(226,28,130000,2),(227,28,130000,3),(214,29,310000,2),(224,29,310000,1),(225,30,230000,1),(230,30,230000,1),(234,30,230000,1),(236,30,230000,1),(330,31,180000,1),(330,32,480000,1),(330,33,210000,1),(222,34,500000,1),(251,34,500000,1),(330,35,310000,1),(232,38,230000,1),(239,38,230000,1),(244,38,230000,1),(230,40,230000,1),(233,40,230000,3),(252,40,230000,1),(292,41,180000,5),(313,44,500000,1),(37,51,99000,1),(210,51,99000,1),(212,51,99000,1),(244,51,99000,1),(22,52,120000,1),(26,57,130000,2),(37,74,50000,21),(238,74,50000,3),(238,75,65000,1),(241,76,200000,1),(241,77,200000,1),(261,83,200000,1),(277,84,200000,1),(279,84,200000,1),(286,84,200000,1),(256,85,200000,1),(260,85,200000,1),(270,85,200000,1),(274,85,200000,1),(262,86,200000,2),(269,86,200000,1),(287,86,200000,1),(288,86,200000,1),(290,86,200000,2),(320,86,200000,1),(323,86,200000,1),(258,87,200000,2),(271,87,200000,1),(272,87,200000,1),(278,87,200000,1),(283,87,200000,1),(291,90,150000,1),(125,91,180000,1),(239,91,180000,1),(125,92,200000,1),(125,93,250000,1),(218,93,250000,5),(243,93,250000,1),(301,93,250000,2),(218,94,220000,3),(234,94,220000,1),(243,94,220000,1),(123,97,270000,1),(223,97,270000,1),(231,97,270000,2),(123,98,320000,1);

UN

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `chitietphieunhap`
--



INSERT INTO `chitietphieunhap` VALUES (18,1,12000,10,_binary ''),(25,1,14400,9,_binary ''),(26,1,17280,1,_binary ''),(27,1,60000,4,_binary ''),(28,1,72000,1,_binary ''),(29,1,72000,1,_binary ''),(30,1,86400,2,_binary ''),(31,1,86400,18,_binary ''),(32,1,86400,4,_binary ''),(33,1,108000,1,_binary ''),(1,2,250000,10,NULL),(24,2,181125,4,_binary ''),(25,2,217350,4,_binary ''),(26,2,260820,1,_binary ''),(27,2,60000,11,_binary ''),(28,2,72000,1,_binary ''),(30,2,86400,1,_binary ''),(31,2,86400,16,_binary ''),(32,2,86400,6,_binary ''),(33,2,108000,1,_binary ''),(11,3,5,2,_binary ''),(16,3,121000.00000000003,2,_binary ''),(19,3,120000,10,_binary ''),(20,3,138000,10000,_binary ''),(22,3,151800,2,_binary ''),(9,4,200000,2,NULL),(10,4,100000,1,NULL),(21,4,372000,10,_binary ''),(22,4,409200.00000000006,1,_binary ''),(25,4,4910400,3,_binary ''),(26,4,5892480,1,_binary ''),(27,4,50000,1,_binary ''),(28,4,60000,1,_binary ''),(30,4,72000,1,_binary ''),(16,5,11000,2,_binary ''),(19,5,120000,10,_binary ''),(2,6,180000,10,NULL),(11,6,5,3,_binary ''),(13,6,2,1,_binary ''),(18,6,12000,10,_binary ''),(37,6,70000,15,_binary ''),(10,7,500000,4,NULL),(4,8,200000,10,NULL),(23,8,252000,1,_binary ''),(24,8,252000,3,_binary ''),(5,9,350000,10,NULL),(3,15,180000,20,NULL),(34,18,210000,5,_binary ''),(35,18,231000,1,_binary ''),(36,18,300000,5,_binary ''),(6,22,180000,30,NULL),(7,26,140000,20,NULL),(12,27,120000,4,_binary ''),(8,31,180000,10,NULL),(9,41,160000,20,NULL),(25,101,200000,3,_binary ''),(26,101,240000,1,_binary ''),(30,101,120000,5,_binary ''),(31,101,120000,1,_binary ''),(13,106,114.99999999999999,2,_binary ''),(26,106,120000,5,_binary ''),(27,106,144000,1,_binary '');

UN

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
  `TinhTrang` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`MaCTQ`),
  KEY `FK_ChiTietQuyen_ChucNang` (`MaCN`),
  KEY `FK_ChiTietQuyen_NhomQuyen` (`MaQuyen`),
  CONSTRAINT `FK_ChiTietQuyen_ChucNang` FOREIGN KEY (`MaCN`) REFERENCES `chucnang` (`MaCN`),
  CONSTRAINT `FK_ChiTietQuyen_NhomQuyen` FOREIGN KEY (`MaQuyen`) REFERENCES `nhomquyen` (`MaNQ`)
) ENGINE=InnoDB AUTO_INCREMENT=103 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `chitietquyen`
--



INSERT INTO `chitietquyen` VALUES (1,1,1,'Đọc',1),(2,1,1,'Thêm',1),(3,1,1,'Xóa',1),(4,1,1,'Sửa',1),(5,1,2,'Đọc',1),(6,1,2,'Thêm',1),(7,1,2,'Xóa',1),(8,1,2,'Sửa',1),(9,2,3,'Đọc',1),(10,2,3,'Thêm',1),(11,2,3,'Xóa',1),(12,2,3,'Sửa',1),(13,2,4,'Đọc',1),(14,2,4,'Thêm',1),(15,2,4,'Xóa',1),(16,2,4,'Sửa',1),(17,2,5,'Đọc',0),(18,2,5,'Thêm',0),(19,2,5,'Xóa',0),(20,2,5,'Sửa',0),(21,2,6,'Đọc',1),(22,2,6,'Thêm',1),(23,2,6,'Xóa',1),(24,2,6,'Sửa',1),(25,3,7,'Đọc',1),(26,3,7,'Thêm',1),(27,3,7,'Xóa',1),(28,3,7,'Sửa',1),(29,1,8,'Đọc',1),(30,1,8,'Thêm',1),(31,1,8,'Xóa',1),(32,1,8,'Sửa',1),(33,3,9,'Đọc',1),(34,3,9,'Thêm',1),(35,3,9,'Xóa',1),(36,3,9,'Sửa',1),(37,1,10,'Đọc',1),(38,1,10,'Thêm',1),(39,1,10,'Xóa',1),(40,1,10,'Sửa',1),(41,2,11,'Đọc',0),(42,2,11,'Thêm',0),(43,2,11,'Xóa',0),(44,2,11,'Sửa',0),(45,3,12,'Đọc',1),(46,3,12,'Thêm',1),(47,3,12,'Sửa',1),(48,3,12,'Xóa',1),(49,1,13,'Thêm',1),(50,1,13,'Sửa',1),(51,1,13,'Đọc',1),(52,1,13,'Xóa',1),(53,1,14,'Đọc',1),(54,1,14,'Thêm',1),(55,1,14,'Sửa',1),(56,1,14,'Xóa',1),(57,1,15,'Thêm',1),(58,1,15,'Xóa',1),(59,1,15,'Sửa',1),(60,1,15,'Đọc',1),(61,3,16,'Đọc',1),(62,3,16,'Thêm',1),(63,3,16,'Xóa',1),(64,3,16,'Sửa',1),(65,3,17,'Đọc',1),(66,3,17,'Thêm',1),(67,3,17,'Sửa',1),(68,3,17,'Xóa',1),(77,3,18,'Đọc',1),(78,3,18,'Thêm',1),(79,3,18,'Sửa',1),(80,3,18,'Xóa',1),(81,2,17,'Đọc',1),(87,5,11,'Thêm',0),(95,5,11,'Thêm',1),(96,5,11,'Sửa',1),(97,5,11,'Đọc',1),(98,5,11,'Xóa',1),(99,5,12,'Đọc',1),(100,5,12,'Thêm',1),(101,5,12,'Sửa',1),(102,5,12,'Xóa',1);

UN

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
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `chucnang`
--



INSERT INTO `chucnang` VALUES (1,'Tài khoản',_binary ''),(2,'Phân quyền',_binary ''),(3,'Sản phẩm',_binary ''),(4,'Khách Hàng',_binary ''),(5,'Thể Loại',_binary ''),(6,'Phiếu nhập',_binary ''),(7,'Hóa đơn',_binary ''),(8,'Nhân viên',_binary ''),(9,'Nhà cung cấp',_binary ''),(10,'Thống kê',_binary ''),(11,'Thể Loại',_binary ''),(12,'Tác Giả',_binary ''),(13,'Tính Lương',_binary ''),(14,'Nghĩ Phép',_binary ''),(15,'Chấm công',_binary ''),(16,'Khuyến mãi',_binary ''),(17,'Hoàn tiền đơn hàng',_binary ''),(18,'Trả Hàng',_binary '');

UN

--
-- Table structure for table `ct_khuyen_mai`
--

DROP TABLE IF EXISTS `ct_khuyen_mai`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ct_khuyen_mai` (
  `MaCTKM` int NOT NULL AUTO_INCREMENT,
  `MaKM` int NOT NULL,
  `GiaTriGiam` decimal(10,2) DEFAULT NULL,
  `GiaTriDonToiThieu` decimal(12,2) DEFAULT NULL,
  `GiamToiDa` decimal(12,2) DEFAULT NULL,
  `SoLuongToiThieu` int DEFAULT NULL,
  PRIMARY KEY (`MaCTKM`)
) ENGINE=InnoDB AUTO_INCREMENT=47 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ct_khuyen_mai`
--



INSERT INTO `ct_khuyen_mai` VALUES (1,12,10.00,50000.00,NULL,1),(5,16,10.00,100000.00,NULL,3),(6,17,10.00,100000.00,-2.00,3),(7,18,10.00,1000000.00,NULL,4),(8,19,15.00,1000000.00,NULL,2),(9,20,50000.00,100000.00,NULL,2),(10,21,50000.00,200000.00,200000.00,2),(11,22,50000.00,100000.00,NULL,2),(12,23,50000.00,100000.00,NULL,1),(13,24,50000.00,200000.00,NULL,5),(14,25,10.00,200000.00,50000.00,8),(15,26,50000.00,200000.00,1000000.00,5),(16,27,0.00,200000.00,NULL,1),(17,29,0.00,200000.00,NULL,1),(18,30,50000.00,200000.00,500000.00,1),(19,31,40000.00,300000.00,NULL,2),(20,32,0.00,100000.00,NULL,1),(21,33,0.00,200005.00,NULL,1),(22,34,50000.00,100000.00,NULL,2),(23,35,60000.00,300000.00,NULL,3),(24,36,40000.00,200000.00,NULL,3),(25,37,40000.00,200000.00,NULL,2),(26,38,30000.00,200000.00,NULL,2),(27,39,0.00,200000.00,NULL,1),(28,40,0.00,200000.00,NULL,1),(29,41,0.00,20000.00,NULL,1),(30,42,0.00,200000.00,NULL,1),(31,43,0.00,100000.00,NULL,1),(32,44,0.00,100000.00,NULL,1),(35,47,50000.00,200000.00,NULL,2),(36,48,40000.00,200000.00,NULL,3),(37,49,0.00,100000.00,NULL,1),(38,50,0.00,200000.00,NULL,1),(39,51,0.00,100000.00,NULL,1),(40,52,0.00,100000.00,NULL,1),(41,53,0.00,100000.00,NULL,1),(42,54,50000.00,100000.00,NULL,2),(43,55,40000.00,200000.00,NULL,2),(44,56,50000.00,200000.00,NULL,2),(45,57,0.00,200000.00,NULL,1),(46,58,20000.00,200000.00,NULL,4);

UN

--
-- Table structure for table `danhgia`
--

DROP TABLE IF EXISTS `danhgia`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `danhgia` (
  `MaDG` int NOT NULL AUTO_INCREMENT,
  `MaSP` int NOT NULL,
  `MaKH` int NOT NULL,
  `SoSao` tinyint NOT NULL,
  `NhanXet` text COLLATE utf8mb4_unicode_ci,
  `NgayDanhGia` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`MaDG`),
  UNIQUE KEY `unique_rating` (`MaSP`,`MaKH`),
  KEY `MaKH` (`MaKH`),
  CONSTRAINT `danhgia_ibfk_1` FOREIGN KEY (`MaSP`) REFERENCES `sanpham` (`MaSP`) ON DELETE CASCADE,
  CONSTRAINT `danhgia_ibfk_2` FOREIGN KEY (`MaKH`) REFERENCES `khachhang` (`makh`) ON DELETE CASCADE,
  CONSTRAINT `danhgia_chk_1` CHECK ((`SoSao` between 1 and 5))
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `danhgia`
--



INSERT INTO `danhgia` VALUES (1,1,19,1,'xzczxcfgs','2025-09-15 09:56:51'),(4,103,19,5,NULL,'2025-09-12 06:32:17'),(7,12,18,5,'sách hay lắm nha mn','2025-09-25 15:29:58'),(8,15,19,5,'sách hay nên mua nha mnn','2025-10-03 03:54:59'),(9,25,19,5,'sách hay lắm nha','2025-10-03 03:56:25'),(10,3,19,5,'sách hay nha cả nhà','2025-10-03 11:22:45'),(11,20,19,5,'sách rất hay tôi rất thích','2025-10-16 11:11:22'),(12,16,19,5,'sản phẩm rất hay','2025-10-30 02:17:27'),(13,51,19,5,'san phẩm hay','2025-10-30 02:31:09'),(14,14,19,5,'123','2025-10-30 03:03:17');

UN

--
-- Table structure for table `danhgia_donhang`
--

DROP TABLE IF EXISTS `danhgia_donhang`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `danhgia_donhang` (
  `MaDGHD` int NOT NULL AUTO_INCREMENT,
  `MaHD` int NOT NULL,
  `MaKH` int NOT NULL,
  `SoSao` tinyint NOT NULL,
  `NhanXet` text COLLATE utf8mb4_unicode_ci,
  `NgayDanhGia` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`MaDGHD`),
  UNIQUE KEY `uniq_order_customer` (`MaHD`,`MaKH`),
  KEY `idx_mahd` (`MaHD`),
  KEY `idx_makh` (`MaKH`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `danhgia_donhang`
--



INSERT INTO `danhgia_donhang` VALUES (1,185,19,5,'hàng tốt lắm nhé\n','2025-10-16 05:21:57'),(2,197,19,4,'123','2025-10-27 14:35:13'),(10,199,19,5,'123','2025-10-27 14:41:59'),(11,246,19,5,'SÁCH RẤT HAY NHÉ BẠN','2025-11-14 12:04:17'),(12,247,19,5,'test thôi hẹ hẹ','2025-11-14 12:53:08'),(13,258,18,5,'123','2025-11-14 12:57:39'),(14,293,25,5,'SAN PHAM TỔT','2025-11-30 04:33:50');

UN

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `decentralization`
--




UN

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
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`MaDiaChi`),
  KEY `MaKH` (`MakH`),
  CONSTRAINT `diachi_ibfk_1` FOREIGN KEY (`MakH`) REFERENCES `khachhang` (`makh`)
) ENGINE=InnoDB AUTO_INCREMENT=94075286 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `diachi`
--



INSERT INTO `diachi` VALUES (1,'Nguyễn Văn A','0912345678','Số 12, Đường Lê Lợi','Hà Nội','Quận Hoàn Kiếm','Phường Hàng Trống',1,1,1),(2,'Trần Thị B','0987654321','45 Đường Hai Bà Trưng','TP.HCM','Quận 1','Phường Bến Nghé',0,2,1),(1,'Lê Văn C','0905123456','78/4 Đường Trần Hưng Đạo','Đà Nẵng','Quận Hải Châu','Phường Thuận Phước',1,3,1),(2,'Phạm Thị D','0978123456','Khu phố 5, Đường Nguyễn Văn Linh','Cần Thơ','Quận Ninh Kiều','Phường An Bình',0,4,1),(1,'Hoai Bao','0374170367','4567','Tỉnh Bắc Giang','Huyện Yên Thế','Xã Đồng Kỳ',0,6,1),(1,'Hoai Bao','0374170367','4567','Tỉnh Bắc Giang','Huyện Yên Thế','Xã Đồng Kỳ',0,7,1),(1,'Hoai Bao','0374170367','4567','Tỉnh Bắc Giang','Huyện Yên Thế','Xã Đồng Kỳ',0,8,1),(1,'Hoai Bao','0374170367','4567','Tỉnh Phú Thọ','Huyện Phù Ninh','Xã Gia Thanh',0,9,1),(12,'Hoai Bao','0374170367','77777','Tỉnh Tuyên Quang','Huyện Na Hang','Xã Đà Vị',0,10,1),(12,'Hoai Bao','0374170367','77777','Tỉnh Phú Thọ','Huyện Hạ Hoà','Xã Hiền Lương',0,11,1),(12,'tran hhh','0987654321','4567','Tỉnh Phú Thọ','Huyện Thanh Thuỷ','Thị trấn Thanh Thủy',0,12,1),(3,'luân','0987654321','77777','Tỉnh Tiền Giang','Thị xã Cai Lậy','Xã Mỹ Hạnh Trung',0,11524671,1),(1,'Hoai Bao','0374170367','23453','Tỉnh Sơn La','Huyện Mộc Châu','Xã Tà Lai',0,12402310,1),(12,'Hoai Bao','0374170367','112222','Tỉnh Phú Thọ','Huyện Cẩm Khê','Xã Phú Khê',0,13418801,1),(1,'hoai','0876564325','123 hoai bao hiuy','Tỉnh Bắc Kạn','Huyện Ba Bể','Xã Chu Hương',0,16430975,1),(15,'nguyen van ba','1231231231','12212121212','Tỉnh Lai Châu','Huyện Sìn Hồ','Xã Pa Khoá',0,23433736,1),(1,'Hoai Bao','0374170367','tân mỹ tân thuận tay','Tỉnh Lai Châu','Huyện Sìn Hồ','Xã Noong Hẻo',0,25467152,1),(19,'Hoaibao','0876564325','vv','Tỉnh Vĩnh Phúc','Huyện Yên Lạc','Xã Hồng Châu',0,27264323,0),(19,'Trần\'s Team','0876564325','dffdfd','Tỉnh Bắc Giang','Huyện Lục Ngạn','Xã Tân Quang',0,29928815,0),(19,'Trần\'s Team','0876564325','dffdfd','Tỉnh Bắc Giang','Huyện Lục Ngạn','Xã Tân Quang',0,32805545,0),(19,'Hoaibao','0876564325','fgfgfg','Tỉnh Quảng Ninh','Huyện Ba Chẽ','Xã Thanh Lâm',0,35671169,0),(19,'hoai','0876564325','đfdfd','Tỉnh Quảng Ninh','Thành phố Đông Triều','Phường Hưng Đạo',0,45668539,0),(1,'Hoai Bao','0374170367','2121232132','Tỉnh Lạng Sơn','Huyện Cao Lộc','Xã Hải Yến',0,46896064,1),(1,'Hoai Bao','0374170367','123456','Tỉnh Thái Nguyên','Huyện Đồng Hỷ','Xã Hòa Bình',0,48960082,1),(1,'Hoai Bao','0374170367','4567','Tỉnh Bắc Ninh','Thành phố Bắc Ninh','Phường Phong Khê',0,53458613,1),(1,'Hoai Bao','0374170367','êrer','Tỉnh Lạng Sơn','Huyện Văn Lãng','Xã Thành Hòa',0,54050035,1),(19,'hoai','0876564325','đfdfd','Tỉnh Quảng Ninh','Thành phố Đông Triều','Phường Hưng Đạo',0,58523825,0),(18,'gbgb','0987654321','12/5','Thành phố Hồ Chí Minh','Quận 5','Phường 5',0,64629926,0),(17,'acccc55','1112842348','tân mỹ tân thuận tay','Tỉnh Tuyên Quang','Huyện Yên Sơn','Xã Kim Quan',0,65002948,1),(18,'hoàigfg','0987654321','mỹ hạnh đông, Xã Mỹ Hạnh Đông, Thị xã Cai Lậy, Tỉnh Tiền Giang','Tỉnh Tiền Giang','Thị xã Cai Lậy','Xã Mỹ Hạnh Đông',0,66172882,0),(1,'Hoai Bao','0374170367','2323','Tỉnh Lạng Sơn','Huyện Hữu Lũng','Xã Cai Kinh',0,68910756,1),(6,'Hoai Bao','0374170367','tân mỹ tân thuận tay','Tỉnh Phú Thọ','Huyện Cẩm Khê','Xã Phú Khê',0,72803019,1),(1,'Hoai Bao','0374170367','dfdf','Tỉnh Hải Dương','Huyện Kim Thành','Xã Hòa Bình',0,73199938,1),(1,'Hoai Bao','0374170367','2121232132','Tỉnh Lạng Sơn','Huyện Bình Gia','Xã Hòa Bình',0,73742162,1),(19,'Trần\'s Team','0876564325','dffdfd','Tỉnh Bắc Giang','Huyện Lục Ngạn','Xã Tân Quang',0,74166783,0),(1,'Hoai Bao','0374170367','tân mỹ tân thuận tay','Tỉnh Hoà Bình','Huyện Cao Phong','Xã Thung Nai',0,74520137,1),(19,'Trần\'s Team','0876564325','dffdfd','Tỉnh Bắc Giang','Huyện Lục Ngạn','Xã Tân Quang',0,74579441,0),(16,'acccc','1112342348','tân mỹ tân thuận tay','Tỉnh Lạng Sơn','Huyện Văn Quan','Xã Tri Lễ',0,85967164,1),(1,'Nguyen Van A','0123456789','123 Đường Láng','Hà Nội','Cầu Giấy','Dịch Vọng',0,86824171,1),(1,'Hoai Bao','0374170367','tân mỹ tân thuận tay','Tỉnh Thái Nguyên','Huyện Phú Lương','Xã Ôn Lương',0,87473113,1),(1,'Hoai Bao','0374170367','234','Tỉnh Quảng Ninh','Huyện Đầm Hà','Xã Quảng An',0,89061682,1),(1,'Hoai Bao','0374170367','4567','Tỉnh Quảng Ninh','Huyện Hải Hà','Xã Quảng Thành',0,94075090,1),(NULL,'hoai','0876564325','123 hoai bao hiuy','Tỉnh Lạng Sơn','Huyện Bình Gia','Xã Hoàng Văn Thụ',0,94075091,1),(NULL,'hoai','0876564325','123 hoai bao hiuy','Tỉnh Lạng Sơn','Huyện Bắc Sơn','Xã Chiến Thắng',0,94075092,1),(NULL,'hoai','0876564325','123 hoai bao hiuy','Tỉnh Lạng Sơn','Huyện Hữu Lũng','Xã Cai Kinh',0,94075093,1),(NULL,'Nguyen Van A','0901234567','123 Đường ABC','01','001','00001',0,94075095,1),(NULL,'Nguyen Van A','0901234567','123 Đường ABC','01','001','00001',0,94075096,1),(NULL,'Nguyen Van A','0901234567','123 Đường ABC','01','001','00001',0,94075097,1),(NULL,'Nguyen Van A','0901234567','123 Đường ABC','01','001','00001',0,94075105,1),(NULL,'Nguyen Van A','0901234567','123 Đường ABC','01','001','00001',0,94075110,1),(NULL,'Hoaibao','0876564325','123 hoai bao hiuy','Tỉnh Vĩnh Phúc','Huyện Tam Dương','Xã Hướng Đạo',0,94075111,1),(NULL,'Hoaibao','0876564325','dffdfd','Tỉnh Thái Nguyên','Huyện Định Hóa','Xã Bình Yên',0,94075112,1),(NULL,'Hoaibao','0876564325','123 hoai bao hiuy','Tỉnh Cao Bằng','Huyện Bảo Lạc','Xã Huy Giáp',0,94075113,1),(NULL,'hoai','0876564325','123 hoai bao hiuy','Tỉnh Bắc Giang','Huyện Lạng Giang','Xã Tân Thanh',0,94075114,1),(NULL,'hoai','0876564325','123 hoai bao hiuy','Tỉnh Bắc Kạn','Huyện Ngân Sơn','Xã Trung Hoà',0,94075115,1),(NULL,'hoai','0876564325','vv','Tỉnh Vĩnh Phúc','Huyện Yên Lạc','Xã Nguyệt Đức',0,94075116,1),(NULL,'Hoaibao','0876564325','123 hoai bao hiuy','Tỉnh Lạng Sơn','Huyện Chi Lăng','Xã Hữu Kiên',0,94075117,1),(NULL,'Hoaibao','0876564325','123 hoai bao hiuy','Tỉnh Lạng Sơn','Huyện Chi Lăng','Xã Hữu Kiên',0,94075118,1),(NULL,'hoai','0876564325','dffdfd','Tỉnh Hải Dương','Huyện Gia Lộc','Xã Thống Kênh',0,94075119,1),(NULL,'hoai','0876564325','dffdfd','Tỉnh Hải Dương','Huyện Gia Lộc','Xã Thống Kênh',0,94075120,1),(NULL,'Hoaibao','0876564325','123 hoai bao hiuy','Tỉnh Vĩnh Phúc','Huyện Vĩnh Tường','Thị trấn Tứ Trưng',0,94075121,1),(NULL,'hoai','0876564325','fgfgg','Tỉnh Lạng Sơn','Huyện Chi Lăng','Xã Hữu Kiên',0,94075122,1),(NULL,'hoai','0876564325','fgfgg','Tỉnh Tuyên Quang','Huyện Na Hang','Xã Thượng Giáp',0,94075123,1),(NULL,'hoai','0876564325','123 hoai bao hiuy','Tỉnh Quảng Ninh','Huyện Ba Chẽ','Thị trấn Ba Chẽ',0,94075124,1),(NULL,'hoai','0876564325','dfdff','Tỉnh Phú Thọ','Huyện Tam Nông','Xã Lam Sơn',0,94075125,1),(NULL,'hoai','0876564325','fgfgfg','Tỉnh Phú Thọ','Huyện Tam Nông','Xã Dị Nậu',0,94075126,1),(NULL,'hoai','0876564325','fgfgfg','Tỉnh Lào Cai','Huyện Mường Khương','Xã Lùng Vai',0,94075127,1),(NULL,'hoai','0876564325','fgfgfg','Tỉnh Bắc Kạn','Huyện Ngân Sơn','Xã Cốc Đán',0,94075128,1),(NULL,'Nguyen Van A','0123456789','123 Đường Láng','Hà Nội','Đống Đa','Cát Linh',0,94075130,1),(NULL,'Nguyen Van A','0123456789','123 Đường Láng','Hà Nội','Đống Đa','Cát Linh',0,94075131,1),(NULL,'hoai','0876564325','fgfgfg','Tỉnh Thái Nguyên','Thành phố Sông Công','Phường Mỏ Chè',0,94075132,1),(NULL,'hoai','0876564325','12345678','Tỉnh Phú Thọ','Huyện Tam Nông','Xã Tề Lễ',0,94075133,1),(19,'Hoaibao','0876564325','dffdfd','Tỉnh Vĩnh Phúc','Huyện Yên Lạc','Xã Liên Châu',0,94075134,0),(18,'Hoaibao','0876564325','vvcvc','Tỉnh Phú Thọ','Huyện Thanh Sơn','Xã Yên Lãng',0,94075135,0),(19,'hoai','0876564325','vfgfg','Tỉnh Vĩnh Phúc','Huyện Yên Lạc','Xã Yên Phương',0,94075136,0),(19,'tran văn an','0984543456','vv','Tỉnh Phú Thọ','Huyện Hạ Hoà','Xã Lang Sơn',0,94075137,0),(19,'Hoaibao','0876564325','123 hoai bao hiuy','Tỉnh Bắc Giang','Huyện Lục Ngạn','Xã Tân Lập',0,94075138,0),(19,'hoai','0876564325','vvcvc','24','219','7588',0,94075139,0),(19,'Trần\'s Team','0876564325','22323','22','202','6979',0,94075140,0),(19,'Trần\'s Teffam','0876564325','22323','22','202','6979',0,94075141,0),(19,'Hoaibao','0876564325','vvcvc','24','216','7357',0,94075142,0),(19,'Trần\'s Team','0984543456','fgfgfg','8','73','2347',0,94075143,0),(19,'tran văn an','0984543456','2345','22','200','6913',0,94075144,0),(19,'hoai','0876564325','232323','26','249','8968',0,94075145,0),(19,'Hoaibao','0876564325','123 hoai bao hiuy','25','231','8110',0,94075146,0),(19,'Nguyen Van A','0123456789','123 Đường ABC','Hà Nội','Cầu Giấy','Dịch Vọng',0,94075147,0),(19,'Hoaibao','0876564325','123 hoai bao hiuy','20','183','6241',0,94075148,0),(19,'Nguyen Van A','0123456789','123 Đường ABC','Hà Nội','Cầu Giấy','Dịch Vọng',0,94075149,0),(19,'Nguyen Van A','0123456789','123 Đường ABC','Hà Nội','Cầu Giấy','Dịch Vọng',0,94075150,0),(19,'Hoaibao','0876564325','vfgfg','24','219','7573',0,94075151,0),(19,'Hoaibao','0876564325','vvcvc','20','186','6430',0,94075152,0),(19,'Hoaibao','0876564325','fgfgfg','19','169','5680',0,94075153,0),(19,'Hoaibao','0984543456','123 hoai bao hiuy','17','156','5242',0,94075154,0),(19,'Hoaibao','0876564325','55656','20','181','6103',0,94075155,0),(19,'Hoaibao','0984543456','3322','26','249','8962',0,94075156,0),(19,'Hoaibao','0876564325','vv','24','217','7426',0,94075157,0),(18,'Trần\'s Team','0876564325','fgfgfg','24','219','7543',0,94075158,0),(18,'Trần\'s Team','0876564325','fgfgfg','24','219','7543',0,94075159,0),(18,'Trần\'s Team','0876564325','fgfgfg','24','219','7543',0,94075160,0),(18,'Trần\'s Team','0876564325','fgfgfg','24','219','7543',0,94075161,0),(18,'Trần\'s Team','0876564325','fgfgfg','24','219','7543',0,94075162,0),(18,'Hoaibao','0984543456','vvcvc','25','236','8476',0,94075163,0),(19,'tran văn an','0876564325','vv','24','220','7666',0,94075164,0),(19,'Hoaibao','0876564325','1234567','15','133','4300',0,94075165,0),(19,'Hoaibao','0876564325','765','20','184','6286',0,94075166,0),(19,'hoai','0876564325','1234','14','124','4090',0,94075167,0),(19,'Hoaibao','0876564325','vv','19','169','5680',0,94075168,0),(19,'Hoaibao','0876564325','fgfgfg','8','73','2341',0,94075169,0),(19,'Hoaibao','0876564325','vv','22','203','7015',0,94075170,0),(19,'Hoaibao','0876564325','vvcvc','22','200','6901',0,94075171,0),(18,'hoai','0984543456','123 hoai bao hiuy','20','186','6427',0,94075172,0),(18,'Hoaibao','0876564325','vv','22','199','6877',0,94075173,1),(18,'Trần\'s Team','0876564325','vfgfg','24','218','7492',0,94075174,1),(18,'Hoaibao','0876564325','vvcvc','24','220','7654',0,94075175,1),(19,'Hoaibao','0876564325','vfgfg','15','137','4486',0,94075176,0),(19,'Hoaibao','0876564325','123 hoai bao hiuy','24','219','7582',0,94075177,0),(19,'hoai','0876564325','fgfgfg','19','169','5680',0,94075178,0),(19,'Hoaibao','0876564325','fgfgfg','20','185','6373',0,94075179,0),(19,'Trần\'s Team','0876564325','vfgfg','20','183','6232',0,94075180,0),(19,'Hoaibao','0876564325','vvcvc','22','200','6913',0,94075181,0),(18,'Hoaibao','0876564325','vvcvc','20','185','6361',0,94075182,1),(19,'Hoaibao','0876564325','fgfgfg','11','99','3265',0,94075183,0),(19,'tran văn an','0876564325','123 hoai bao hiuy','14','123','4027',0,94075184,0),(18,'Hoaibao','0876564325','fgfgfg','22','202','6973',0,94075185,0),(19,'Hoaibao','0876564325','123 hoai bao hiuy','25','237','8527',0,94075186,0),(19,'Hoaibao','0876564325','vfgfg','22','202','6979',0,94075187,0),(19,'Hoaibao','0876564325','123 hoai bao hiuy','22','203','7009',0,94075188,0),(19,'Hoaibao','0876564325','vv','17','157','5308',0,94075189,0),(19,'Hoaibao','0876564325','123 hoai bao hiuy','10','86','2920',0,94075190,0),(19,'hoai','0876564325','dffdfd','19','168','5629',0,94075191,0),(19,'Hoaibao','0876564325','123','24','220','7645',0,94075192,0),(19,'Hoaibao','0876564325','1234','20','186','6421',0,94075193,0),(19,'Hoaibao','0876564325','123 hoai bao ','15','133','4300',0,94075194,0),(19,'Hoaibao','0876564325','ấp mỹ thạnh xã mỹ thạnh trung thị xã cai lậy tỉnh tiền giang','82','817','28453',0,94075195,0),(19,'Hoaibao','0876564325','fgfgfg','11','103','3174',0,94075196,0),(19,'Hoaibao','0876564325','123 hoai bao hiuy','25','235','8401',0,94075197,0),(19,'Hoaibao','0876564325','123 hoai bao hiuy','22','201','6943',0,94075198,0),(19,'Hoaibao','0984543456','123 hoai bao hiuy','24','216','7330',0,94075199,0),(19,'Hoaibao','0876564325','123 hoai bao hiuy','24','219','7591',0,94075200,0),(19,'Hoaibao','0876564325','vv','25','236','8467',0,94075201,0),(19,'Hoaibao','0876564325','123','20','187','6496',0,94075202,0),(19,'Hoaibao','0876564325','vvcvc','25','234','8323',0,94075203,0),(19,'Hoaibao','0876564325','123','10','85','2884',0,94075204,0),(19,'Hoaibao','0984543456','123 hoai bao hiuy','24','218','7486',0,94075205,0),(19,'Hoaibao','0876564325','123 hoai bao hiuy','20','183','6217',0,94075206,0),(19,'Hoaibao','0876564325','fgfgfg','22','201','6928',0,94075207,0),(19,'hoai','0876564325','123 hoai bao hiuy','19','170','5749',0,94075208,0),(19,'hoai','0987654321','123 hoai bao hiuy','22','199','6886',0,94075209,0),(19,'Hoaibao','0876564325','123 hoai bao hiuy','10','82','2719',0,94075210,0),(19,'Hoaibao','0876564325','123 hoai bao hiuy','22','200','6904',0,94075211,0),(19,'Hoaibao','0876564325','123 hoai bao hiuy','25','236','8473',0,94075212,0),(19,'Hoaibao','0876564325','123 hoai bao hiuy','22','199','6880',0,94075213,0),(19,'Hoaibao','0876564325','123 hoai bao hiuy','24','218','7480',0,94075214,0),(19,'Hoaibao','0876564325','123 hoai bao hiuy','14','122','3946',0,94075215,0),(19,'Hoaibao','0876564325','123 hoai bao hiuy','19','168','5638',0,94075216,0),(19,'Hoaibao','0876564325','vv','11','96','3161',0,94075217,0),(19,'Hoaibao','0876564325','123 hoai bao hiuy','20','182','6163',0,94075218,0),(19,'Hoaibao','0876564325','123 hoai bao hiuy','15','138','4570',0,94075219,0),(19,'hoai','0876564325','123 hoai bao hiuy','19','167','5578',0,94075220,0),(18,'Trần\'s Team','0876564325','123 hoai bao hiuy','22','200','6904',0,94075221,0),(18,'hoai','0876564325','102 Cống Quỳnh','79','760','26752',0,94075222,1),(18,'Trần\'s Team','0876564325','102 Cống Quỳnh','79','760','26752',0,94075223,1),(18,'hoai','0876564325','102 Cống Quỳnh','79','760','26752',0,94075224,1),(18,'Trần\'s Team','0876564325','102 Cống Quỳnh','79','760','26752',0,94075225,1),(18,'Trần\'s Team','0876564325','102 Cống Quỳnh','79','760','26752',0,94075226,1),(18,'Trần\'s Team','0876564325','102 Cống Quỳnh, Phường 7, Quận 5, Thành phố Hồ Chí Minh','Thành phố Hồ Chí Minh','Quận 5','Phường 7',0,94075227,1),(18,'Trần\'s Team','0876564325','102 Cống Quỳnh','79','760','26752',0,94075228,0),(19,'Trần\'s Team','0876564325','102 Cống Quỳnh','19','169','5686',0,94075229,0),(19,'hoai','0876564325','102 Cống Quỳnh','79','760','26752',0,94075230,0),(19,'hoai','0876564325','102 Cống Quỳnh','79','760','26752',0,94075231,0),(19,'hoai','0876564325','102 Cống Quỳnh','79','760','26752',0,94075232,0),(19,'hoai','0876564325','102 Cống Quỳnh','79','760','26752',0,94075233,0),(18,'Trần\'s Team','0876564325','102 Cống Quỳnh','79','760','26752',0,94075234,0),(19,'hoai','0876564325','102 Cống Quỳnh','79','760','26752',0,94075235,0),(19,'hoai','0876564325','102 Cống Quỳnh','79','760','26752',0,94075236,0),(19,'hoai','0876564325','102 Cống Quỳnh','79','760','26752',0,94075237,0),(19,'hoai','0876564325','102 Cống Quỳnh','79','760','26752',0,94075238,0),(19,'hoai','0876564325','102 Cống Quỳnh','79','760','26752',0,94075239,0),(19,'hoai','0876564325','102 Cống Quỳnh','79','760','26752',0,94075240,0),(19,'hoai','0876564325','102 Cống Quỳnh','79','760','26752',0,94075241,0),(19,'hoai','0876564325','102 Cống Quỳnh','79','760','26752',0,94075242,0),(19,'hoai','0876564325','102 Cống Quỳnh','79','760','26752',0,94075243,0),(19,'hoai','0876564325','130 Cống Quỳnh','79','760','26752',1,94075245,0),(19,'hoai','0876564325','123 hoai bao hiuy','79','778','27487',0,94075246,0),(19,'hoai','0876564325','102 Cống Quỳnh','25','235','8401',0,94075247,0),(18,'hoai','0876564325','102 Cống Quỳnh','19','170','5743',0,94075248,0),(24,'Trần\'s Team','0987654321','102 Cống Quỳnh','79','760','26752',0,94075249,1),(25,'hoai','0876564325','130 Cống Quỳnh','20','185','6370',0,94075250,1),(19,'hoai','0876564325','102 Cống Quỳnh','25','262','undefined',0,94075251,0),(18,'Hoaibao','0876564325','102 Cống Quỳnh, Phường Cầu Ông Lãnh, Quận 1, Thành phố Hồ Chí Minh','Thành phố Hồ Chí Minh','Quận 1','Phường Cầu Ông Lãnh',0,94075252,1),(18,'hoai','0876564325','101 Cống Quỳnh','50','541','undefined',0,94075253,1),(25,'nguyen van a','0987654321','102 Cống Quỳnh','50','541','undefined',0,94075254,0),(25,'Hoaibao','0987654321','102 Cống Quỳnh','1','12','undefined',0,94075255,1),(25,'hoai','0984543456','108 Cống Quỳnh','50','541','Phường Cầu Ông Lãnh',0,94075256,1),(18,'Trần\'s Team','0876564325','102 Cống Quỳnh, Phường 7, Quận 5, Thành phố Hồ Chí Minh','50','553','Phường 7',0,94075257,1),(18,'Hoaibao','0876564325','102 Cống Quỳnh, Phường Cầu Ông Lãnh, Quận 1, Thành phố Hồ Chí Minh','39','426','Xã Phú Lạc',0,94075258,1),(18,'Hoaibao','0876564325','102 Cống Quỳnh, Xã Thung Nai, Huyện Cao Phong, Tỉnh Hoà Bình','Tỉnh Hoà Bình','Huyện Cao Phong','Xã Thung Nai',0,94075259,1),(18,'hoai','0876564325','109 Cống Quỳnh','50','541','Phường Cầu Ông Lãnh',0,94075260,1),(18,'hehe','0876564325','105 Cống Quỳnh','50','541','Phường Cầu Ông Lãnh',0,94075261,1),(18,'Trần\'s Team','0876564325','102 Cống Quỳnh','50','541','Phường Cầu Ông Lãnh',0,94075262,1),(18,'Hoaibao','0984543456','102 Cống Quỳnh','50','541','Phường Cô Giang',0,94075263,1),(19,'hoai','0876564325','102 Cống Quỳnh','50','541','Phường Cầu Ông Lãnh',0,94075264,1),(19,'bcx','0876564325','mỹ hạnh đông, Xã Hưng Yên, Huyện An Biên, Tỉnh Kiên Giang','Tỉnh Kiên Giang','Huyện An Biên','Xã Hưng Yên',0,94075265,1),(19,'Trần\'s Team','0876564325','110 Cống Quỳnh, Phường Cầu Ông Lãnh, Quận 1, Thành phố Hồ Chí Minh','Thành phố Hồ Chí Minh','Quận 1','Phường Cầu Ông Lãnh',0,94075266,1),(18,'Hoaibao','0876564325','102 Cống Quỳnh, Xã Thung Nai, Huyện Cao Phong, Tỉnh Hoà Bình','11','119','Xã Thung Nai',0,94075267,1),(19,'Trần\'s Team','0876564325','110 Cống Quỳnh','50','541','Phường Cầu Ông Lãnh',0,94075268,1),(19,'bcx','0876564325','mỹ hạnh đông, Xã Hưng Yên, Huyện An Biên, Tỉnh Kiên Giang','58','646','Xã Hưng Yên',0,94075269,1),(19,'Trần\'s Team','0876564325','110 Cống Quỳnh, Phường Cầu Ông Lãnh, Quận 1, Thành phố Hồ Chí Minh','50','541','Phường Cầu Ông Lãnh',0,94075270,1),(18,'Hoaibao','0876564325','102 Cống Quỳnh, Phường Cầu Ông Lãnh, Quận 1, Thành phố Hồ Chí Minh','50','541','Phường Cầu Ông Lãnh',0,94075271,1),(19,'bcx','0876564325','mỹ hạnh đông','58','646','Xã Hưng Yên',0,94075272,1),(25,'Hoaibao','0987654321','102 Cống Quỳnh','1','12','Xã Dương Xá',0,94075273,1),(25,'hoai','0876564325','130 Cống Quỳnh','13','140','Xã Vạn Thủy',0,94075274,1),(25,'Hoaibao','0987654321','102 Cống Quỳnh','1','12','Xã Ninh Hiệp',0,94075275,1),(21,'Trần\'s Team','0876564325','102 Cống Quỳnh','12','126','Phường Bách Quang',0,94075276,1),(21,'Trần\'s Team','0876564325','102 Cống Quỳnh','8','86','Phường Tân Phong',0,94075277,1),(21,'Trần\'s Team','0876564325','102 Cống Quỳnh','13','141','Xã Hòa Lạc',0,94075278,1),(21,'Trần\'s Team','0876564325','102 Cống Quỳnh','5','62','Xã Sinh Long',0,94075279,1),(21,'Trần\'s Team','0876564325','102 Cống Quỳnh','5','64','Xã Thái Hòa',0,94075280,1),(21,'Trần\'s Team','0876564325','102 Cống Quỳnh','5','60','Xã An Khang',0,94075281,1),(21,'Trần\'s Team','0876564325','102 Cống Quỳnh','5','61','Xã Xuân Lập',0,94075282,1),(21,'Trần\'s Team','0876564325','102 Cống Quỳnh','5','64','Xã Nhân Mục',0,94075283,1),(25,'hoai','0984543456','108 Cống Quỳnh','50','557','Phường Phú Thuận',0,94075284,1),(24,'Trần\'s Team','0987654321','102 Cống Quỳnh','50','541','Phường Cầu Ông Lãnh',0,94075285,1);

UN

--
-- Table structure for table `diem_sothich_history`
--

DROP TABLE IF EXISTS `diem_sothich_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `diem_sothich_history` (
  `id` int NOT NULL AUTO_INCREMENT,
  `makh` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `LoaiThucThe` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `KhoaThucThe` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `oldScore` int DEFAULT '0',
  `newScore` int DEFAULT '0',
  `strategy` varchar(32) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `form_id` varchar(128) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `note` text COLLATE utf8mb4_unicode_ci,
  `changed_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_makh` (`makh`),
  KEY `idx_type` (`LoaiThucThe`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `diem_sothich_history`
--



INSERT INTO `diem_sothich_history` VALUES (1,'19','theloai','12',0,1,'backfill_from_existing',NULL,'backfilled','2025-11-18 10:02:53'),(2,'19','theloai','15',0,1,'backfill_from_existing',NULL,'backfilled','2025-11-18 10:02:53'),(3,'19','theloai','6',0,2,'backfill_from_existing',NULL,'backfilled','2025-11-18 10:02:53'),(4,'19','hinhthuc','Bìa mềm',0,1,'backfill_from_existing',NULL,'backfilled','2025-11-18 10:02:53'),(5,'19','khoanggia','100-200',0,1,'backfill_from_existing',NULL,'backfilled','2025-11-18 10:02:53'),(6,'19','khoanggia','200-300',0,1,'backfill_from_existing',NULL,'backfilled','2025-11-18 10:02:53'),(7,'19','khoanggia','300-400',0,1,'backfill_from_existing',NULL,'backfilled','2025-11-18 10:02:53'),(8,'19','sotrang','1-400',0,1,'submit_add','10','applied from submit','2025-11-20 22:12:38'),(9,'19','khoanggia','400-500',0,1,'submit_add','10','applied from submit','2025-11-20 22:12:38'),(10,'19','theloai','10',0,1,'submit_add','11','applied from submit','2025-11-29 12:37:47'),(11,'19','khoanggia','200-300',1,2,'submit_add','11','applied from submit','2025-11-29 12:37:47'),(12,'19','khoanggia','500-700',0,1,'submit_add','12','applied from submit','2025-11-29 12:56:24'),(13,'25','khoanggia','500-700',0,1,'submit_add','12','applied from submit','2025-11-30 11:41:23'),(14,'21','khoanggia','500-700',0,1,'submit_add','12','applied from submit','2025-11-30 14:47:01'),(15,'19','hinhthuc','Bìa cứng',0,1,'submit_add','13','applied from submit','2025-12-08 18:55:23'),(16,'19','namxb','2024-2025',0,1,'submit_add','13','applied from submit','2025-12-08 18:55:23');

UN

--
-- Table structure for table `diem_sothich_khachhang`
--

DROP TABLE IF EXISTS `diem_sothich_khachhang`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `diem_sothich_khachhang` (
  `makh` int NOT NULL,
  `LoaiThucThe` enum('theloai','tacgia','hinhthuc','khoanggia','namxb','sotrang') COLLATE utf8mb4_unicode_ci NOT NULL,
  `KhoaThucThe` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'VD: MaTL, MaTG, tên hình thức, mã khoảng giá, nhóm năm, nhóm trang',
  `DiemSo` decimal(10,2) NOT NULL DEFAULT '0.00' COMMENT 'Điểm tích luỹ từ câu trả lời',
  `NgayCapNhat` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `NgayTao` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `last_form_id` varchar(128) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`makh`,`LoaiThucThe`,`KhoaThucThe`),
  KEY `idx_makh_loai` (`makh`,`LoaiThucThe`),
  CONSTRAINT `diem_sothich_khachhang_ibfk_1` FOREIGN KEY (`makh`) REFERENCES `khachhang` (`makh`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Bảng tổng hợp điểm sở thích theo từng thực thể - dùng cho gợi ý nhanh';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `diem_sothich_khachhang`
--



INSERT INTO `diem_sothich_khachhang` VALUES (18,'theloai','11',1.00,'2025-11-18 09:17:24','2025-11-18 09:47:44',NULL),(18,'theloai','15',1.00,'2025-11-13 18:57:56','2025-11-18 09:47:44',NULL),(18,'theloai','6',2.00,'2025-11-12 12:01:40','2025-11-18 09:47:44',NULL),(18,'hinhthuc','Bìa mềm',2.00,'2025-11-12 13:13:17','2025-11-18 09:47:44',NULL),(18,'khoanggia','100-200',1.00,'2025-11-18 09:17:24','2025-11-18 09:47:44',NULL),(18,'khoanggia','200-300',2.00,'2025-11-12 12:01:40','2025-11-18 09:47:44',NULL),(18,'khoanggia','300-400',1.00,'2025-11-18 09:17:24','2025-11-18 09:47:44',NULL),(18,'khoanggia','400-500',1.00,'2025-11-18 09:59:12','2025-11-18 09:59:12',NULL),(18,'namxb','2020-2025',1.00,'2025-11-12 09:02:37','2025-11-18 09:47:44',NULL),(18,'sotrang','1-200',20.00,'2025-11-18 09:59:12','2025-11-18 09:59:12',NULL),(18,'sotrang','50-200',1.00,'2025-11-12 09:02:37','2025-11-18 09:47:44',NULL),(19,'theloai','10',1.00,'2025-11-29 12:37:47','2025-11-29 12:37:47','11'),(19,'theloai','12',1.00,'2025-11-18 09:09:23','2025-11-18 09:47:44',NULL),(19,'theloai','15',1.00,'2025-11-15 19:18:54','2025-11-18 09:47:44',NULL),(19,'theloai','6',2.00,'2025-11-12 12:53:27','2025-11-18 09:47:44',NULL),(19,'hinhthuc','Bìa cứng',1.00,'2025-12-08 18:55:23','2025-12-08 18:55:23','13'),(19,'hinhthuc','Bìa mềm',1.00,'2025-11-12 13:07:50','2025-11-18 09:47:44',NULL),(19,'khoanggia','100-200',1.00,'2025-11-18 09:09:23','2025-11-18 09:47:44',NULL),(19,'khoanggia','200-300',2.00,'2025-11-29 12:37:47','2025-11-18 09:47:44','11'),(19,'khoanggia','300-400',1.00,'2025-11-18 09:09:23','2025-11-18 09:47:44',NULL),(19,'khoanggia','400-500',1.00,'2025-11-20 22:12:38','2025-11-20 22:12:38','10'),(19,'khoanggia','500-700',1.00,'2025-11-29 12:56:24','2025-11-29 12:56:24','12'),(19,'namxb','2024-2025',1.00,'2025-12-08 18:55:23','2025-12-08 18:55:23','13'),(19,'sotrang','1-400',1.00,'2025-11-20 22:12:38','2025-11-20 22:12:38','10'),(21,'khoanggia','500-700',1.00,'2025-11-30 14:47:01','2025-11-30 14:47:01','12'),(25,'theloai','11',1.00,'2025-11-11 21:15:53','2025-11-18 09:47:44',NULL),(25,'hinhthuc','Bìa mềm',1.00,'2025-11-08 11:46:08','2025-11-18 09:47:44',NULL),(25,'khoanggia','100-200',1.00,'2025-11-11 21:15:53','2025-11-18 09:47:44',NULL),(25,'khoanggia','500-700',1.00,'2025-11-30 11:41:23','2025-11-30 11:41:23','12');

UN

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `discount`
--




UN

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `discount_detail`
--




UN

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `export_detail`
--




UN

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `export_note`
--




UN

--
-- Table structure for table `faqs`
--

DROP TABLE IF EXISTS `faqs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `faqs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `question` varchar(255) NOT NULL,
  `answer` text NOT NULL,
  `category` varchar(100) DEFAULT NULL,
  `keywords` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `faqs`
--



INSERT INTO `faqs` VALUES (1,'Làm thế nào để đặt hàng?','Bạn có thể đặt hàng trực tuyến qua Fahasa.com, chọn sản phẩm, thêm vào giỏ hàng và thanh toán. Hỗ trợ giao hàng tận nơi.','Đặt hàng','[\"đặt hàng\", \"mua sách\", \"thanh toán\"]','2025-09-12 12:56:50','2025-09-12 12:56:50'),(2,'Chính sách đổi trả là gì?','Đổi trả trong 7 ngày nếu sản phẩm lỗi hoặc không đúng mô tả. Vui lòng liên hệ hotline 0938 424 289.','Chính sách','[\"đổi trả\", \"hoàn hàng\", \"chính sách\"]','2025-09-12 12:56:50','2025-09-12 12:56:50'),(3,'Liên hệ hỗ trợ ở đâu?','Hotline: 0938 424 289 hoặc email: info@fahasa.com. Địa chỉ: 60-62 Lê Lợi, Q.1, TP. HCM.','Liên hệ','[\"liên hệ\", \"hỗ trợ\", \"hotline\"]','2025-09-12 12:56:50','2025-09-12 12:56:50'),(4,'Làm sao để theo dõi đơn hàng của tôi?','Bạn có thể theo dõi đơn hàng trong mục \'Lịch sử mua hàng\' trên tài khoản cá nhân. Nếu cần hỗ trợ, liên hệ hotline 0374170367.','Đơn hàng','[\"theo dõi\", \"đơn hàng\", \"tracking\"]','2025-09-13 05:37:50','2025-09-13 05:37:50');

UN

--
-- Table structure for table `form_sothich`
--

DROP TABLE IF EXISTS `form_sothich`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `form_sothich` (
  `MaForm` int NOT NULL AUTO_INCREMENT,
  `TenForm` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Tên form (vd: "Khảo sát sở thích mùa đông 2025")',
  `MoTa` text COLLATE utf8mb4_unicode_ci COMMENT 'Mô tả ngắn gọn về form',
  `TrangThai` tinyint(1) DEFAULT '1' COMMENT '1=Đang hoạt động, 0=Tạm dừng',
  `NgayTao` datetime DEFAULT CURRENT_TIMESTAMP,
  `NgayCapNhat` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `MaKM` int DEFAULT NULL,
  PRIMARY KEY (`MaForm`),
  KEY `idx_trangthai` (`TrangThai`),
  KEY `fk_form_khuyenmai` (`MaKM`),
  CONSTRAINT `fk_form_khuyenmai` FOREIGN KEY (`MaKM`) REFERENCES `khuyen_mai` (`MaKM`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Form khảo sát sở thích do admin tạo';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `form_sothich`
--



INSERT INTO `form_sothich` VALUES (1,'Khảo sát sở thích đọc sách - Nhận mã Freeship','Trả lời ngắn gọn 6 câu hỏi để nhận mã freeship và khám phá sách phù hợp với bạn!',1,'2025-11-08 08:30:53','2025-11-08 08:30:53',NULL),(2,'sở thích khách hàng ','12345',1,'2025-11-08 09:13:51','2025-11-08 09:13:51',NULL),(3,'KHẢO SÁT TÍ THÔNG TIN Á MÀ ','MONG CÁC QUÝ KHÁCH CHO NHẬN XET SSEER CÓ ĐC THÔNG TIN ',1,'2025-11-11 20:50:28','2025-11-12 08:56:58',41),(4,'sở thích khách hàng 123','12313',1,'2025-11-11 22:50:12','2025-11-11 22:50:12',40),(5,'sở thích khách hàng 321 ','hẹ hẹ',1,'2025-11-12 08:57:38','2025-11-12 08:57:38',41),(6,'sở thích khách hàng ','MONG CHO CỬA HANG LỜI KHUYÊN ',1,'2025-11-12 11:58:01','2025-11-12 11:58:01',43),(7,'sở thích khách hàng 112','TRẦN HAOFI BẢO ',1,'2025-11-12 13:05:39','2025-11-12 13:05:39',44),(8,'FORM KHẢO SÁT','123',1,'2025-11-13 14:37:57','2025-11-13 14:37:57',NULL),(9,'KHẢO SÁT TÍ THÔNG TIN Á MÀ ','123',1,'2025-11-17 15:30:19','2025-11-17 15:30:19',NULL),(10,'123ABC','1234567',1,'2025-11-18 09:56:18','2025-11-18 09:56:18',NULL),(11,'FORM KHẢO SÁT nhe','123',1,'2025-11-29 12:35:37','2025-11-29 12:35:37',49),(12,'KHẢO SÁT TÍ THÔNG TIN Á MÀ 555555','trrrt',1,'2025-11-29 12:53:42','2025-11-29 12:53:42',51),(13,'sở thích khách hàng ','1213',1,'2025-12-03 20:36:29','2025-12-03 20:36:29',51);

UN

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
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `function`
--



INSERT INTO `function` VALUES (1,'view'),(2,'add'),(3,'edit'),(4,'remove'),(5,'detail'),(6,'excel'),(7,'pdf');

UN

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
) ENGINE=InnoDB AUTO_INCREMENT=818 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `giohang`
--



INSERT INTO `giohang` VALUES (6,2,1,3,1,'2025-09-10 11:07:15'),(9,2,2,2,0,'2025-09-10 11:29:03'),(11,2,8,1,1,'2025-09-10 11:29:09');

UN

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
) ENGINE=InnoDB AUTO_INCREMENT=36 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `giohang_chitiet`
--



INSERT INTO `giohang_chitiet` VALUES (1,19,1,7,'2025-10-21 21:45:44'),(2,19,2,7,'2025-10-21 21:45:44'),(3,19,3,14,'2025-10-21 21:45:44'),(4,19,4,7,'2025-10-21 21:45:44'),(5,19,5,7,'2025-10-21 21:45:44');

UN

--
-- Table structure for table `hanh_dong_user`
--

DROP TABLE IF EXISTS `hanh_dong_user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `hanh_dong_user` (
  `mahanhdong` int NOT NULL AUTO_INCREMENT,
  `makhachhang` int NOT NULL,
  `loaihanhdong` enum('view','search','purchase') NOT NULL,
  `masanpham` int DEFAULT NULL,
  `search_query` varchar(255) DEFAULT NULL,
  `timestamp` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`mahanhdong`),
  KEY `masanpham` (`masanpham`),
  KEY `idx_hanhdong_user` (`makhachhang`,`loaihanhdong`,`timestamp` DESC),
  CONSTRAINT `hanh_dong_user_ibfk_1` FOREIGN KEY (`makhachhang`) REFERENCES `khachhang` (`makh`) ON DELETE CASCADE,
  CONSTRAINT `hanh_dong_user_ibfk_2` FOREIGN KEY (`masanpham`) REFERENCES `sanpham` (`MaSP`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=229 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `hanh_dong_user`
--



INSERT INTO `hanh_dong_user` VALUES (1,22,'view',1,NULL,'2025-10-21 19:08:47'),(2,22,'search',NULL,'nguyennhatanh','2025-10-21 19:13:26'),(3,22,'view',8,NULL,'2025-10-21 19:55:09'),(4,22,'view',1,NULL,'2025-10-21 19:58:54'),(5,22,'view',10,NULL,'2025-10-21 19:59:17'),(6,22,'search',NULL,'hehe','2025-10-21 20:19:41'),(7,22,'view',10,NULL,'2025-10-21 21:02:53'),(8,22,'view',13,NULL,'2025-10-21 21:03:42'),(9,22,'view',20,NULL,'2025-10-21 21:04:09'),(10,22,'search',NULL,'nguyen nhat anh','2025-10-21 21:04:51'),(11,22,'view',26,NULL,'2025-10-21 21:06:13'),(12,22,'search',NULL,'abcde','2025-10-21 21:06:30'),(13,22,'search',NULL,'mắc biêc','2025-10-21 21:06:41'),(14,22,'view',3,NULL,'2025-10-21 21:07:41'),(15,22,'view',11,NULL,'2025-10-21 21:32:25'),(16,22,'search',NULL,'mắt','2025-10-21 21:32:44'),(17,23,'view',2,NULL,'2025-10-21 21:34:26'),(18,23,'view',11,NULL,'2025-10-21 21:34:47'),(19,23,'search',NULL,'nguyen nhat anh','2025-10-21 21:34:59'),(20,19,'view',6,NULL,'2025-10-21 22:52:52'),(21,19,'view',1,NULL,'2025-10-21 22:53:12'),(22,19,'view',2,NULL,'2025-10-21 22:53:17'),(23,19,'view',1,NULL,'2025-10-21 22:53:46'),(24,19,'view',13,NULL,'2025-10-21 22:56:06'),(25,19,'view',76,NULL,'2025-10-21 22:56:36'),(26,18,'view',8,NULL,'2025-10-21 22:57:53'),(27,18,'view',8,NULL,'2025-10-21 22:59:54'),(28,18,'view',19,NULL,'2025-10-22 15:31:44'),(29,18,'view',2,NULL,'2025-10-22 15:55:18'),(30,18,'view',2,NULL,'2025-10-22 15:55:22'),(31,18,'view',8,NULL,'2025-10-22 15:57:26'),(32,18,'view',4,NULL,'2025-10-22 15:58:20'),(33,18,'view',9,NULL,'2025-10-22 15:59:04'),(34,18,'view',18,NULL,'2025-10-22 15:59:23'),(35,18,'view',86,NULL,'2025-10-22 16:00:05'),(36,18,'view',1,NULL,'2025-10-22 16:02:25'),(37,18,'view',1,NULL,'2025-10-22 16:03:26'),(38,18,'view',1,NULL,'2025-10-22 16:03:46'),(39,18,'view',8,NULL,'2025-10-22 16:09:30'),(40,18,'view',13,NULL,'2025-10-22 16:11:23'),(41,19,'view',8,NULL,'2025-10-22 16:18:47'),(42,19,'view',74,NULL,'2025-10-22 16:22:20'),(43,1,'view',3,NULL,'2025-10-22 17:08:09'),(44,19,'view',14,NULL,'2025-10-22 17:09:26'),(45,19,'view',9,NULL,'2025-10-22 17:09:58'),(46,18,'view',4,NULL,'2025-10-22 17:11:08'),(47,19,'view',3,NULL,'2025-10-22 17:24:06'),(48,19,'view',3,NULL,'2025-10-22 17:26:45'),(49,19,'view',3,NULL,'2025-10-23 13:56:48'),(50,19,'view',19,NULL,'2025-10-23 13:57:53'),(51,24,'view',1,NULL,'2025-10-24 18:15:52'),(52,24,'view',15,NULL,'2025-10-24 18:17:04'),(53,24,'view',15,NULL,'2025-10-25 09:31:08'),(54,19,'view',3,NULL,'2025-10-25 22:56:18'),(55,19,'view',19,NULL,'2025-10-25 22:59:20'),(56,19,'view',1,NULL,'2025-10-27 21:02:19'),(57,19,'view',75,NULL,'2025-10-27 21:03:13'),(58,19,'view',23,NULL,'2025-10-27 21:05:15'),(59,19,'view',16,NULL,'2025-10-27 21:05:51'),(60,19,'view',12,NULL,'2025-10-27 21:54:05'),(61,19,'view',18,NULL,'2025-10-28 08:41:50'),(62,19,'view',3,NULL,'2025-10-28 08:49:14'),(63,19,'view',2,NULL,'2025-10-28 08:49:54'),(64,19,'view',3,NULL,'2025-10-28 09:04:59'),(65,19,'view',8,NULL,'2025-10-28 09:18:22'),(66,19,'view',1,NULL,'2025-10-28 09:22:09'),(67,19,'view',2,NULL,'2025-10-28 09:29:22'),(68,19,'view',1,NULL,'2025-10-28 09:30:05'),(69,18,'view',1,NULL,'2025-10-28 09:48:34'),(70,18,'view',2,NULL,'2025-10-28 09:51:21'),(71,18,'view',2,NULL,'2025-10-28 09:54:55'),(72,18,'view',2,NULL,'2025-10-28 09:58:55'),(73,18,'view',3,NULL,'2025-10-28 10:08:06'),(74,25,'view',18,NULL,'2025-10-28 10:17:21'),(75,25,'view',2,NULL,'2025-10-28 10:20:06'),(76,25,'view',7,NULL,'2025-10-28 10:27:26'),(77,25,'view',28,NULL,'2025-10-28 10:58:41'),(78,25,'view',20,NULL,'2025-10-28 11:00:00'),(79,25,'view',9,NULL,'2025-10-28 11:01:59'),(80,25,'view',29,NULL,'2025-10-28 11:04:49'),(81,25,'view',90,NULL,'2025-10-28 14:57:08'),(82,25,'view',17,NULL,'2025-10-28 15:01:05'),(83,25,'view',29,NULL,'2025-10-28 15:01:27'),(84,25,'view',14,NULL,'2025-10-28 15:05:23'),(85,25,'view',29,NULL,'2025-10-28 15:11:46'),(86,25,'view',9,NULL,'2025-10-28 15:12:54'),(87,25,'view',19,NULL,'2025-10-28 15:15:50'),(88,25,'view',9,NULL,'2025-10-28 15:19:10'),(89,25,'view',9,NULL,'2025-10-28 15:19:49'),(90,25,'view',29,NULL,'2025-10-28 15:21:58'),(91,25,'view',14,NULL,'2025-10-28 15:23:41'),(92,25,'view',14,NULL,'2025-10-28 15:37:48'),(93,25,'view',34,NULL,'2025-10-29 00:00:20'),(94,25,'view',9,NULL,'2025-10-29 00:03:03'),(95,25,'view',9,NULL,'2025-10-29 00:03:10'),(96,25,'view',27,NULL,'2025-10-29 00:05:49'),(97,25,'view',28,NULL,'2025-10-29 00:11:28'),(98,25,'view',2,NULL,'2025-10-29 00:23:11'),(99,25,'view',93,NULL,'2025-10-29 11:07:31'),(100,25,'view',10,NULL,'2025-10-29 11:07:56'),(101,25,'view',31,NULL,'2025-10-29 11:10:59'),(102,25,'view',40,NULL,'2025-10-29 11:11:51'),(103,25,'view',9,NULL,'2025-10-29 11:12:00'),(104,24,'view',20,NULL,'2025-10-29 11:16:13'),(105,24,'view',14,NULL,'2025-10-29 19:31:28'),(106,24,'view',40,NULL,'2025-10-29 19:31:42'),(107,24,'view',14,NULL,'2025-10-30 08:10:32'),(108,24,'view',9,NULL,'2025-10-30 08:14:57'),(109,24,'view',7,NULL,'2025-10-30 08:21:14'),(110,24,'view',14,NULL,'2025-10-30 08:21:24'),(111,24,'view',16,NULL,'2025-10-30 08:39:59'),(112,24,'view',14,NULL,'2025-10-30 08:43:14'),(113,24,'view',17,NULL,'2025-10-30 08:45:21'),(114,24,'view',29,NULL,'2025-10-30 08:49:12'),(115,24,'view',16,NULL,'2025-10-30 08:51:14'),(116,24,'view',16,NULL,'2025-10-30 08:51:25'),(117,24,'view',29,NULL,'2025-10-30 08:52:08'),(118,24,'view',7,NULL,'2025-10-30 08:56:16'),(119,24,'view',20,NULL,'2025-10-30 08:56:25'),(120,24,'view',14,NULL,'2025-10-30 09:03:37'),(121,19,'view',9,NULL,'2025-10-30 09:09:01'),(122,19,'view',16,NULL,'2025-10-30 09:16:06'),(123,19,'view',16,NULL,'2025-10-30 09:16:58'),(124,19,'view',1,NULL,'2025-10-30 09:30:26'),(125,19,'view',51,NULL,'2025-10-30 09:30:55'),(126,19,'view',14,NULL,'2025-10-30 10:03:07'),(127,19,'view',14,NULL,'2025-10-30 10:03:44'),(128,19,'view',9,NULL,'2025-10-30 10:03:55'),(129,19,'view',14,NULL,'2025-10-30 13:52:58'),(130,19,'view',1,NULL,'2025-10-30 13:56:10'),(131,19,'view',1,NULL,'2025-10-30 14:00:00'),(132,19,'view',9,NULL,'2025-10-30 14:00:23'),(133,19,'view',16,NULL,'2025-10-30 14:00:40'),(134,19,'view',16,NULL,'2025-10-30 14:00:55'),(135,19,'view',17,NULL,'2025-10-30 14:01:42'),(136,19,'view',27,NULL,'2025-10-30 14:15:22'),(137,19,'view',23,NULL,'2025-10-30 14:51:01'),(138,19,'view',19,NULL,'2025-10-30 14:51:10'),(139,19,'view',93,NULL,'2025-10-30 14:51:32'),(140,19,'view',14,NULL,'2025-10-30 15:52:55'),(141,19,'view',14,NULL,'2025-10-31 12:53:09'),(142,19,'view',20,NULL,'2025-10-31 12:54:49'),(143,19,'view',19,NULL,'2025-10-31 12:57:52'),(144,19,'view',7,NULL,'2025-10-31 13:58:25'),(145,19,'view',14,NULL,'2025-10-31 13:59:47'),(146,19,'view',18,NULL,'2025-10-31 16:00:34'),(147,19,'view',17,NULL,'2025-10-31 16:00:39'),(148,19,'view',14,NULL,'2025-10-31 18:51:32'),(149,19,'view',14,NULL,'2025-10-31 18:53:56'),(150,19,'view',9,NULL,'2025-10-31 19:36:57'),(151,19,'view',51,NULL,'2025-11-01 10:05:32'),(152,19,'view',18,NULL,'2025-11-01 10:06:24'),(153,18,'view',74,NULL,'2025-11-01 10:07:13'),(154,18,'view',9,NULL,'2025-11-02 09:31:30'),(155,18,'view',18,NULL,'2025-11-02 09:34:57'),(156,24,'view',18,NULL,'2025-11-02 09:36:55'),(157,24,'view',51,NULL,'2025-11-02 09:37:12'),(158,24,'view',40,NULL,'2025-11-02 09:38:10'),(159,24,'view',51,NULL,'2025-11-02 09:38:37'),(160,24,'view',52,NULL,'2025-11-02 09:53:21'),(161,19,'view',14,NULL,'2025-11-02 10:01:17'),(162,18,'view',51,NULL,'2025-11-02 11:50:28'),(163,18,'view',14,NULL,'2025-11-03 13:05:31'),(164,19,'view',14,NULL,'2025-11-04 08:06:30'),(165,19,'view',29,NULL,'2025-11-04 08:18:14'),(166,19,'view',90,NULL,'2025-11-04 08:20:18'),(167,19,'view',51,NULL,'2025-11-04 08:25:44'),(168,19,'view',14,NULL,'2025-11-04 08:27:02'),(169,19,'view',29,NULL,'2025-11-04 08:28:49'),(170,19,'view',9,NULL,'2025-11-04 08:29:13'),(171,19,'view',14,NULL,'2025-11-04 08:32:38'),(172,19,'view',14,NULL,'2025-11-04 08:35:16'),(173,19,'view',29,NULL,'2025-11-04 08:36:45'),(174,19,'view',34,NULL,'2025-11-04 08:49:10'),(175,19,'view',54,NULL,'2025-11-04 08:54:07'),(176,19,'view',40,NULL,'2025-11-04 08:55:52'),(177,19,'view',9,NULL,'2025-11-04 08:56:07'),(178,18,'view',14,NULL,'2025-11-04 09:45:31'),(179,25,'view',18,NULL,'2025-11-04 10:06:30'),(180,25,'view',29,NULL,'2025-11-04 10:20:17'),(181,25,'view',9,NULL,'2025-11-04 10:27:22'),(182,19,'view',14,NULL,'2025-11-04 10:50:27'),(183,18,'view',14,NULL,'2025-11-04 18:46:09'),(184,18,'view',18,NULL,'2025-11-05 18:14:08'),(185,19,'view',14,NULL,'2025-11-07 12:47:24'),(186,19,'view',29,NULL,'2025-11-07 13:03:20'),(187,19,'view',29,NULL,'2025-11-07 13:39:07'),(188,19,'view',6,NULL,'2025-11-07 14:46:14'),(189,18,'view',29,NULL,'2025-11-07 14:49:43'),(190,18,'view',9,NULL,'2025-11-07 15:26:40'),(191,19,'view',4,NULL,'2025-11-07 16:59:47'),(192,19,'view',77,NULL,'2025-11-08 10:07:52'),(193,19,'view',20,NULL,'2025-11-09 19:52:36'),(194,19,'view',18,NULL,'2025-11-11 08:29:26'),(195,19,'view',14,NULL,'2025-11-11 08:34:31'),(196,19,'view',6,NULL,'2025-11-11 08:34:36'),(197,19,'view',19,NULL,'2025-11-11 09:52:32'),(198,19,'view',77,NULL,'2025-11-11 09:55:37'),(199,19,'view',8,NULL,'2025-11-11 10:53:17'),(200,19,'view',14,NULL,'2025-11-11 18:09:23'),(201,19,'view',3,NULL,'2025-11-11 18:16:00'),(202,19,'view',74,NULL,'2025-11-11 18:16:05'),(203,19,'view',19,NULL,'2025-11-11 18:25:31'),(204,19,'view',19,NULL,'2025-11-11 18:29:22'),(205,19,'view',9,NULL,'2025-11-11 18:51:28'),(206,19,'view',8,NULL,'2025-11-11 20:47:58'),(207,18,'view',16,NULL,'2025-11-14 11:00:36'),(208,18,'view',10,NULL,'2025-11-14 11:03:51'),(209,19,'view',51,NULL,'2025-11-14 11:30:20'),(210,19,'view',17,NULL,'2025-11-14 11:48:08'),(211,19,'view',16,NULL,'2025-11-14 11:48:54'),(212,19,'view',16,NULL,'2025-11-14 11:55:25'),(213,19,'view',16,NULL,'2025-11-14 12:00:27'),(214,19,'view',16,NULL,'2025-11-15 20:09:48'),(215,19,'view',15,NULL,'2025-11-16 11:22:20'),(216,19,'view',9,NULL,'2025-11-16 11:26:45'),(217,19,'view',16,NULL,'2025-11-16 11:28:02'),(218,19,'view',80,NULL,'2025-11-16 11:29:28'),(219,19,'view',17,NULL,'2025-11-16 11:30:53'),(220,19,'view',40,NULL,'2025-11-16 11:42:38'),(221,19,'view',17,NULL,'2025-11-16 12:41:51'),(222,19,'view',101,NULL,'2025-11-29 10:38:06'),(223,19,'view',106,NULL,'2025-11-29 10:44:36'),(224,19,'view',101,NULL,'2025-11-29 10:46:18'),(225,19,'view',101,NULL,'2025-11-29 10:46:41'),(226,19,'view',30,NULL,'2025-12-02 23:52:35'),(227,19,'view',18,NULL,'2025-12-06 09:30:16'),(228,19,'view',18,NULL,'2025-12-06 09:34:17');

UN

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
  `PhiShip` double DEFAULT '0' COMMENT 'Phí vận chuyển (VND)',
  `SoTienHoanTra` decimal(15,2) DEFAULT '0.00' COMMENT 'Số tiền đã hoàn trả',
  `NgayHoanTien` timestamp NULL DEFAULT NULL COMMENT 'Ngày hoàn tiền',
  `TrangThaiHoanTien` enum('CHUA_HOAN','DANG_XL_HOAN','DA_HOAN','HOAN_THAT_BAI') DEFAULT 'CHUA_HOAN' COMMENT 'Trạng thái hoàn tiền',
  `SoLanHoanTien` int DEFAULT '0' COMMENT 'Số lần hoàn tiền (partial refund)',
  PRIMARY KEY (`MaHD`),
  KEY `FK_HoaDon_TaiKhoan` (`TenTK`),
  KEY `makh` (`makh`),
  KEY `fk_hoadon_diachi` (`MaDiaChi`),
  CONSTRAINT `fk_hoadon_diachi` FOREIGN KEY (`MaDiaChi`) REFERENCES `diachi` (`MaDiaChi`),
  CONSTRAINT `FK_HoaDon_TaiKhoan` FOREIGN KEY (`TenTK`) REFERENCES `taikhoan` (`TenTK`),
  CONSTRAINT `hoadon_ibfk_1` FOREIGN KEY (`makh`) REFERENCES `khachhang` (`makh`)
) ENGINE=InnoDB AUTO_INCREMENT=331 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `hoadon`
--



INSERT INTO `hoadon` VALUES (1,'NV004','2023-03-30',140000,1,'Chờ xử lý',1,'COD',NULL,'Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(2,'NV002','2022-09-23',340000,1,'Chờ xử lý',2,'COD',NULL,'Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(3,'NV004','2022-09-24',130000,4,'Đã xác nhận',2,'COD',NULL,'Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(4,'NV004','2022-09-25',310000,6,'Đã xác nhận',1,'COD',NULL,'Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(5,'NV004','2022-09-26',230000,2,'Đang giao hàng',3,'COD',NULL,'Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(6,'NV004','2022-09-27',180000,2,'Chờ xử lý',3,'COD',NULL,'Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(7,'NV004','2022-09-28',480000,6,'Đã hủy',3,'COD',NULL,'Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(8,'NV004','2022-09-29',210000,6,'Chờ xử lý',2,'COD',NULL,'Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(9,NULL,NULL,1150000,1,'Chờ xử lý',6,'COD','fghj','Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(10,NULL,NULL,1150000,1,'Chờ xử lý',7,'COD','fghj','Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(11,NULL,NULL,1150000,1,'Chờ xử lý',8,'COD','fghj','Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(12,NULL,NULL,1150000,1,'Chờ xử lý',9,'COD','bao','Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(13,NULL,NULL,1490000,12,'Chờ xử lý',10,'COD','mnbf','Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(14,NULL,NULL,1490000,12,'Chờ xử lý',11,'COD','bao','Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(15,NULL,NULL,470000,12,'Chờ xử lý',12,'COD','tràn hoai bao dep trai','Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(16,NULL,NULL,810000,12,'Chờ xử lý',13418801,'COD','rfffdfdfd','Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(17,NULL,NULL,260000,15,'Chờ xử lý',23433736,'COD','giao vào giờ trưa','Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(18,NULL,NULL,340000,16,'Chờ xử lý',85967164,'COD','giao trua nhe','Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(19,NULL,NULL,130000,17,'Chờ xử lý',65002948,'COD','giao trua nhe7uu','Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(20,NULL,NULL,200000,1,'Chờ xử lý',86824171,'COD','Giao hàng nhanh','Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(21,NULL,NULL,1560000,6,'Đã giao hàng',72803019,'COD','dfghjk','Đã thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(22,NULL,NULL,120000,1,'Đã giao hàng',87473113,'COD','hoài bao','Đã thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(23,NULL,NULL,960005,1,'Đã giao hàng',48960082,'COD','FFFVFGF','Đã thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(24,NULL,NULL,230000,1,'Đã giao hàng',53458613,'COD','hoai bao dep trai','Đã thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(25,NULL,NULL,230000,1,'Đã giao hàng',89061682,'COD','hoai bao','Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(26,NULL,NULL,260000,1,'Đã giao hàng',54050035,'COD','test','Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(27,NULL,NULL,150000,1,'Đã giao hàng',73199938,'COD','sghj','Đã nhận tiền',0,0.00,NULL,'CHUA_HOAN',0),(28,NULL,NULL,310000,1,'Chờ xử lý',74520137,'COD','hoai  ghghg','Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(29,NULL,NULL,150000,1,'Chờ xử lý',12402310,'COD','ddfdfgfgf','Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(30,NULL,NULL,5,1,'Đã hủy',94075090,'COD','FFFGFGFG\nLý do hủy: gggg','Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(31,NULL,'2025-05-16',120000,1,'Đã hủy',46896064,'COD','rfgfgfg\nLý do hủy: huy đon c hoi','Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(32,NULL,'2025-05-16',1040000,1,'Đã giao hàng',25467152,'COD','rrtrtrt','Đã nhận tiền',0,0.00,NULL,'CHUA_HOAN',0),(33,NULL,'2025-05-17',310000,1,'Đã hủy',68910756,'COD','dsdsdsd\nLý do hủy: mua cc','Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(34,NULL,'2025-05-18',360000,3,'Chờ xử lý',11524671,'COD','giao hàng vào buổi trưa','Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(35,NULL,'2025-05-19',150000,18,'Chờ xử lý',66172882,'COD','fgfgfs','Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(36,NULL,'2025-05-19',630000,18,'Chờ xử lý',64629926,'COD','dfdf','Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(37,NULL,'2025-05-19',1299000,1,'Đã hủy',73742162,'COD','kjhg\nLý do hủy: Không có lý do','Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(38,NULL,'2025-09-05',1620000,1,'Chờ xử lý',16430975,'BANK','hgf','Chờ thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(39,NULL,NULL,590000,1,'Chờ xử lý',94075091,'VNPay','fggfgfg','Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(40,NULL,NULL,590000,1,'Chờ xử lý',94075092,'VNPay','fggfgfg','Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(41,NULL,NULL,590000,1,'Chờ xử lý',94075093,'VNPay','fdfd','Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(42,NULL,NULL,20000,3,'Chờ xử lý',94075095,'VNPay','Giao hàng nhanh','Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(43,NULL,NULL,20000,3,'Chờ xử lý',94075096,'VNPay','Giao hàng nhanh','Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(44,NULL,NULL,20000,3,'Chờ xử lý',94075097,'VNPay','Giao hàng nhanh','Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(52,NULL,NULL,20000,3,'Chờ xử lý',94075105,'VNPay','Giao hàng nhanh','Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(57,NULL,NULL,20000,3,'Chờ xử lý',94075110,'VNPay','Giao hàng nhanh','Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(58,NULL,NULL,590000,1,'Chờ xử lý',94075111,'VNPay','fgfgfgf','Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(59,NULL,NULL,470000,1,'Chờ xử lý',94075112,'VNPay','ffdfdf','Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(60,NULL,NULL,390000,1,'Chờ xử lý',94075113,'VNPay','dfd','Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(61,NULL,NULL,390000,1,'Chờ xử lý',94075114,'VNPay','fffg','Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(62,NULL,NULL,390000,1,'Chờ xử lý',94075115,'VNPay','fffg','Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(63,NULL,NULL,390000,1,'Chờ xử lý',94075116,'VNPay','cvcvc','Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(64,NULL,NULL,390000,1,'Chờ xử lý',94075117,'VNPay','cvcv','Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(65,NULL,NULL,390000,1,'Chờ xử lý',94075118,'VNPay','cvcv','Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(66,NULL,NULL,390000,1,'Chờ xử lý',94075119,'VNPay','ffgfgf','Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(67,NULL,NULL,390000,1,'Chờ xử lý',94075120,'VNPay','ffgfgf','Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(68,NULL,NULL,390000,1,'Chờ xử lý',94075121,'VNPay','đf','Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(69,NULL,NULL,390000,1,'Chờ xử lý',94075122,'VNPay','fggf','Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(70,NULL,NULL,390000,1,'Chờ xử lý',94075123,'VNPay','fggf','Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(71,NULL,NULL,390000,1,'Chờ xử lý',94075124,'VNPay','dffdfd','Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(72,NULL,NULL,390000,1,'Chờ xử lý',94075125,'VNPay','fdfdf','Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(73,NULL,NULL,550000,1,'Chờ xử lý',94075126,'VNPay','fgfgf','Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(74,NULL,NULL,550000,1,'Chờ xử lý',94075127,'VNPay','fgfgf','Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(75,NULL,NULL,550000,1,'Chờ xử lý',94075128,'VNPay','fgfgf','Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(76,NULL,NULL,200000,1,'Chờ xử lý',94075130,'VNPay','Giao hàng nhanh','Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(77,NULL,NULL,200000,3,'Chờ xử lý',94075131,'VNPay','Giao hàng nffhanh','Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(78,NULL,NULL,200000,19,'Chờ xử lý',94075132,'VNPay','dffđ','Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(79,NULL,NULL,120000,19,'Đã hủy',94075133,'VNPay','tggfhghg\nLý do hủy: Hủy bởi quản trị viên','Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(80,NULL,'2025-09-09',120000,19,'Chờ xử lý',35671169,'VNPAY','dfdfdf','Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(81,NULL,'2025-09-09',270000,19,'Chờ xử lý',32805545,'VNPAY','fgfgfgf','Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(82,NULL,'2025-09-09',270000,19,'Chờ xử lý',74166783,'VNPAY','fgfgfgf','Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(83,NULL,'2025-09-09',270000,19,'Chờ xử lý',74579441,'VNPAY','fgfgfgf','Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(84,NULL,'2025-09-09',270000,19,'Chờ xử lý',29928815,'VNPAY','fgfgfgf','Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(85,NULL,'2025-09-09',270000,19,'Chờ xử lý',27264323,'VNPAY','xcxcc','Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(86,NULL,'2025-09-09',270000,19,'Chờ xử lý',58523825,'VNPAY','đfdfd','Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(87,NULL,'2025-09-09',270000,19,'Chờ xử lý',45668539,'VNPAY','đfdfd','Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(88,NULL,'2025-09-09',270000,19,'Đã xác nhận',94075134,'VNPAY','ffgfgf','Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(89,NULL,'2025-09-09',270000,18,'Chờ xử lý',94075135,'VNPAY','dfdf','Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(90,NULL,'2025-09-09',270000,19,'Chờ xử lý',94075136,'VNPAY','êr','Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(91,NULL,'2025-09-10',270000,19,'Đã hủy',94075137,'VNPAY','fggf\nLý do hủy: không mua nữa','Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(92,NULL,'2025-09-10',270000,19,'Chờ xử lý',94075138,'VNPAY','ffd','Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(93,NULL,'2025-09-10',390000,19,'Chờ xử lý',94075139,'VNPAY',NULL,'Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(94,NULL,'2025-09-10',320000,19,'Đã hủy',94075140,'VNPAY','\nLý do hủy: tôi k mua','Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(95,NULL,'2025-09-10',270000,19,'Đã xác nhận',94075141,'VNPAY',NULL,'Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(96,NULL,'2025-09-10',150000,19,'Chờ xử lý',94075142,'VNPAY',NULL,'Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(97,NULL,'2025-09-10',440000,19,'Đã xác nhận',94075143,'VNPAY',NULL,'Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(98,NULL,'2025-09-11',12000,19,'Đã hủy',94075144,'VNPAY',NULL,'Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(99,NULL,'2025-09-11',210000,19,'Đã hủy',94075145,'COD','\nLý do hủy: tôi không muốn mua nữa','Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(100,NULL,'2025-09-13',276000,19,'Đã hủy',94075146,'VNPAY','\nLý do hủy: sản phẩm hơi mắc','Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(101,NULL,'2025-09-13',150000,19,'Đã hủy',94075147,'VNPAY','Giao hàng nhanh\nLý do hủy: ABC','Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(102,NULL,'2025-09-13',288000,19,'Chờ xử lý',94075148,'VNPAY',NULL,'Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(103,NULL,'2025-09-13',24000,19,'Chờ xử lý',94075149,'VNPAY','Giao hàng nhanh','Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(104,NULL,'2025-09-13',24000,19,'Đã hủy',94075150,'VNPAY','Giao hàng nhanh\nLý do hủy: tôi không muốn mua ok','Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(105,NULL,'2025-09-13',288000,19,'Chờ xử lý',94075151,'VNPAY',NULL,'Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(106,NULL,'2025-09-15',162000,19,'Đã hủy',94075152,'VNPAY','\nLý do hủy: tôi thấy đơn hàng mắc','Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(107,NULL,'2025-09-18',12000,19,'Đang giao hàng',94075153,'COD',NULL,'Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(108,NULL,'2025-09-18',162000,19,'Chờ xử lý',94075154,'VNPAY',NULL,'Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(109,NULL,'2025-09-18',162000,19,'Chờ xử lý',94075155,'VNPAY',NULL,'Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(110,NULL,'2025-09-18',478000,19,'Chờ xử lý',94075156,'VNPAY',NULL,'Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(111,NULL,'2025-09-18',210000,19,'Chờ xử lý',94075157,'VNPAY',NULL,'Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(112,NULL,'2025-09-18',132000,18,'Chờ xử lý',94075158,'VNPAY',NULL,'Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(113,NULL,'2025-09-18',300000,18,'Chờ xử lý',94075159,'VNPAY',NULL,'Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(114,NULL,'2025-09-18',810000,18,'Chờ xử lý',94075160,'VNPAY',NULL,'Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(115,NULL,'2025-09-18',132000,18,'Chờ xử lý',94075161,'VNPAY','','Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(116,NULL,'2025-09-18',132000,18,'Đã hủy',94075162,'VNPAY','','Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(117,NULL,'2025-09-18',300000,18,'Chờ xử lý',94075163,'VNPAY','','Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(118,NULL,'2025-09-18',234000,19,'Chờ xử lý',94075164,'VNPAY','','Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(119,NULL,'2025-09-18',438000,19,'Chờ xử lý',94075165,'VNPAY','','Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(120,NULL,'2025-09-18',420000,19,'Chờ xử lý',94075166,'VNPAY','','Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(121,NULL,'2025-09-18',163800,19,'Đã hủy',94075167,'VNPAY','\nLý do hủy: tôi dellmuoons mua','Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(122,NULL,'2025-09-21',475800,19,'Đã xác nhận',94075168,'VNPAY','','Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(123,NULL,'2025-09-23',752000,19,'Chờ xử lý',94075169,'VNPAY','','Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(124,NULL,'2025-09-23',921000,19,'Đang giao hàng',94075170,'VNPAY','','Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(125,NULL,'2025-09-24',630000,19,'Chờ xử lý',94075171,'VNPAY','','Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(126,NULL,'2025-09-24',163800,18,'Chờ xử lý',94075172,'VNPAY','','Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(127,NULL,'2025-09-24',512000,18,'Đã giao hàng',94075173,'VNPAY','','Đã nhận tiền',0,0.00,NULL,'CHUA_HOAN',0),(128,NULL,'2025-09-24',1303600,18,'Chờ xử lý',94075174,'VNPAY','','Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(129,NULL,'2025-09-24',162000,18,'Chờ xử lý',94075175,'VNPAY','','Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(130,NULL,'2025-09-25',36000,19,'Chờ xử lý',94075176,'VNPAY','','Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(131,NULL,'2025-09-28',151800,19,'Chờ xử lý',94075177,'VNPAY','','Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(132,NULL,'2025-09-28',222000,19,'Chờ xử lý',94075178,'VNPAY','','Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(133,NULL,'2025-09-28',120000,19,'Chờ xử lý',94075179,'VNPAY','','Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(134,NULL,'2025-09-28',24000,19,'Chờ xử lý',94075180,'VNPAY','dfgh','Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(135,NULL,'2025-09-28',500000,19,'Đã hủy',94075181,'VNPAY','\n[10/8/2025, 9:00:00 PM] Lý do hủy: Thời gian giao hàng quá lâu','Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(136,NULL,'2025-09-28',801800,18,'Đã hủy',94075182,'VNPAY','dcdc','Đã nhận tiền',0,0.00,NULL,'CHUA_HOAN',0),(137,NULL,'2025-09-29',271800,19,'Chờ xử lý',94075183,'VNPAY','ABC','Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(138,NULL,'2025-09-29',271800,19,'Đã xác nhận',94075184,'VNPAY','','Đã thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(139,NULL,'2025-09-29',120000,18,'Đã xác nhận',94075185,'VNPAY','','Đã thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(140,NULL,'2025-09-29',242000,19,'Đã xác nhận',94075186,'VNPAY','','Đã thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(141,NULL,'2025-09-29',24000,19,'Đã xác nhận',94075187,'VNPAY','','Đã thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(142,NULL,'2025-09-29',330000,19,'Đã xác nhận',94075188,'VNPAY','','Đã thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(143,NULL,'2025-09-29',730000,19,'Đã xác nhận',94075189,'VNPAY','','Đã thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(144,NULL,'2025-09-29',710000,19,'Đã xác nhận',94075190,'VNPAY','fff','Đã thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(145,NULL,'2025-09-29',350000,19,'Đã xác nhận',94075191,'VNPAY','abcd','Đã thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(146,NULL,'2025-09-30',301800,19,'Đã xác nhận',94075192,'VNPAY','1234','Đã thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(147,NULL,'2025-09-30',1000000,19,'Đã hủy',94075193,'VNPAY','Lý do hủy: Thời gian giao hàng quá lâu','Đã hoàn tiền',0,0.00,NULL,'CHUA_HOAN',0),(148,NULL,'2025-09-30',461800,19,'Đã hủy',94075194,'VNPAY','Lý do hủy: Đặt nhầm sản phẩm','Đã hoàn tiền',0,0.00,NULL,'CHUA_HOAN',0),(149,NULL,'2025-10-01',805800,19,'Đã hủy',94075195,'VNPAY','Lý do hủy: Thời gian giao hàng quá lâu\n[10/1/2025, 10:11:40 AM] Admin approve: rất xin lỗi khách hàng\n\n[10/1/2025, 10:22:26 AM] Admin complete: cam ơn bạn','Đã hoàn tiền',0,0.00,NULL,'CHUA_HOAN',0),(150,NULL,'2025-10-01',1240000,19,'Đã hủy',94075196,'VNPAY','123432222\n[10/1/2025, 10:36:49 AM] Yêu cầu hoàn tiền: REF_150_1759289809563. Lý do: Vấn đề tài chính\n[10/1/2025, 10:37:24 AM] Admin approve: khách bị lỗi\n[10/1/2025, 10:42:20 AM] Admin complete: cảm ơn quý khách\n','Đã hoàn tiền',0,0.00,NULL,'CHUA_HOAN',0),(151,NULL,'2025-10-02',573000,19,'Đã giao hàng',94075197,'VNPAY','12345','Đã nhận tiền',0,0.00,NULL,'CHUA_HOAN',0),(152,NULL,'2025-10-02',631000,19,'Đã hủy',94075198,'VNPAY','123433\n[10/8/2025, 9:06:30 PM] Yêu cầu hoàn tiền: REF_152_1759932390285. Lý do: Thời gian giao hàng quá lâu\n[10/9/2025, 10:24:38 AM] Admin approve: cảm ơn bạn ak\n[10/9/2025, 10:24:55 AM] Admin complete: đã hoàn tiền','Đã hoàn tiền',0,0.00,NULL,'CHUA_HOAN',0),(153,NULL,'2025-10-03',810000,19,'Đã hủy',94075199,'VNPAY','123 | Yêu cầu trả hàng được chấp thuận bởi admin\n[10/8/2025, 8:33:03 PM] Lý do hủy: Tìm được giá tốt hơn ở nơi khác','Đã nhận tiền',0,0.00,NULL,'CHUA_HOAN',0),(154,NULL,'2025-10-03',12000,19,'Đã hủy',94075200,'COD','123\n[10/8/2025, 7:35:10 PM] Lý do hủy: Tìm được giá tốt hơn ở nơi khác','Đã nhận tiền',0,0.00,NULL,'CHUA_HOAN',0),(155,NULL,'2025-10-03',12000,19,'Đã hủy',94075201,'COD','123 | Yêu cầu trả hàng được chấp thuận bởi admin\n[10/8/2025, 7:23:07 PM] Lý do hủy: Thời gian giao hàng quá lâu\n[10/8/2025, 7:30:15 PM] Lý do hủy: Tìm được giá tốt hơn ở nơi khác','Đã nhận tiền',0,0.00,NULL,'CHUA_HOAN',0),(156,NULL,'2025-10-03',561000,19,'Đã hủy',94075202,'VNPAY','12334 | Yêu cầu trả hàng được chấp thuận bởi admin\n[10/8/2025, 7:48:33 PM] Lý do hủy: Thời gian giao hàng quá lâu','Đã nhận tiền',0,0.00,NULL,'CHUA_HOAN',0),(157,NULL,'2025-10-03',150000,19,'Đã hủy',94075203,'VNPAY','1234567 | Yêu cầu trả hàng được chấp thuận bởi admin\n[10/8/2025, 8:58:14 PM] Lý do hủy: Thay đổi ý định mua hàng','Đã nhận tiền',0,0.00,NULL,'CHUA_HOAN',0),(158,NULL,'2025-10-03',12000,19,'Đã hủy',94075204,'COD','123\n[10/3/2025, 10:00:52 PM] Lý do hủy: hhh','Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(159,NULL,'2025-10-03',301800,19,'Đã hủy',94075205,'VNPAY','123\n[10/3/2025, 8:53:25 PM] Yêu cầu hoàn tiền: REF_159_1759499605272. Lý do: Thời gian giao hàng quá lâu\n[10/3/2025, 10:15:45 PM] Admin approve: cảm ơn bạn\n\n[10/3/2025, 10:16:18 PM] Admin complete: cảm ơn bạn nhé','Đã hoàn tiền',0,0.00,NULL,'CHUA_HOAN',0),(160,NULL,'2025-10-08',681000,19,'Đã hủy',94075206,'VNPAY','123 | Yêu cầu trả hàng được chấp thuận bởi admin\n[10/8/2025, 9:08:40 PM] Lý do hủy: Thời gian giao hàng quá lâu','Đã nhận tiền',0,0.00,NULL,'CHUA_HOAN',0),(161,NULL,'2025-10-08',711000,19,'Đã hủy',94075207,'VNPAY','1234 | Yêu cầu trả hàng được chấp thuận bởi admin\n[10/9/2025, 10:17:54 AM] Lý do hủy: Tìm được giá tốt hơn ở nơi khác','Đã nhận tiền',0,0.00,NULL,'CHUA_HOAN',0),(162,NULL,'2025-10-09',810000,19,'Đã hủy',94075208,'VNPAY','12454 | Yêu cầu trả hàng được chấp thuận bởi admin\n[10/9/2025, 11:10:01 AM] Lý do hủy: Thay đổi ý định mua hàng','Đã nhận tiền',0,0.00,NULL,'CHUA_HOAN',0),(163,NULL,'2025-10-09',1020000,19,'Đã hủy',94075209,'VNPAY','1232111 | Yêu cầu trả hàng được chấp thuận bởi admin\n[10/9/2025, 11:20:11 AM] Lý do hủy: Vấn đề tài chính','Đã nhận tiền',0,0.00,NULL,'CHUA_HOAN',0),(164,NULL,'2025-10-09',732000,19,'Đã hủy',94075210,'VNPAY','123321 | Yêu cầu trả hàng được chấp thuận bởi admin\n[10/9/2025, 1:41:58 PM] Lý do hủy: Thời gian giao hàng quá lâu','Đã nhận tiền',0,0.00,NULL,'CHUA_HOAN',0),(165,NULL,'2025-10-09',162000,19,'Đã hủy',94075211,'VNPAY','1234543 | Yêu cầu trả hàng được chấp thuận bởi admin\n[10/9/2025, 2:06:12 PM] Lý do hủy: Tìm được giá tốt hơn ở nơi khác','Đã nhận tiền',0,0.00,NULL,'CHUA_HOAN',0),(166,NULL,'2025-10-09',120000,19,'Đã hủy',94075212,'VNPAY','12321 | Yêu cầu trả hàng được chấp thuận bởi admin\n[10/9/2025, 2:12:30 PM] Lý do hủy: Tìm được giá tốt hơn ở nơi khác','Đã nhận tiền',0,0.00,NULL,'CHUA_HOAN',0),(167,NULL,'2025-10-09',162000,19,'Đã hủy',94075213,'VNPAY','123232\n[10/9/2025, 4:45:04 PM] Yêu cầu hoàn tiền: REF_167_1760003104398\n[10/11/2025, 5:04:36 PM] Admin approve: ok bạn\n[10/11/2025, 5:04:58 PM] Admin complete: cảm ơn bạn ','Đã hoàn tiền',0,0.00,NULL,'CHUA_HOAN',0),(168,NULL,'2025-10-09',529200,19,'Chờ xử lý',94075214,'COD','11111 | Yêu cầu trả hàng được chấp thuận bởi admin','Đang hoàn tiền',0,0.00,NULL,'CHUA_HOAN',0),(169,NULL,'2025-10-10',252000,19,'Đã hủy',94075215,'COD','123 | Yêu cầu trả hàng được chấp thuận bởi admin\n[10/10/2025, 7:40:06 AM] Yêu cầu hoàn tiền: REF_169_1760056806020\n[10/10/2025, 7:40:39 AM] Admin approve: đơn hàng bị lỗi hoàn tiền\n\n[10/10/2025, 7:40:56 AM] Admin complete: cảm ơn bạn đã đến','Đã hoàn tiền',0,0.00,NULL,'CHUA_HOAN',0),(170,NULL,'2025-10-10',529200,19,'Đã hủy',94075216,'VNPAY','123\n[10/10/2025, 7:45:24 AM] Yêu cầu hoàn tiền: REF_170_1760057124013\n[10/10/2025, 7:45:50 AM] Admin approve: 1244\n[10/10/2025, 7:46:09 AM] Admin complete: 1234567','Đã hoàn tiền',0,0.00,NULL,'CHUA_HOAN',0),(171,NULL,'2025-10-10',303600,19,'Chờ xử lý',94075217,'VNPAY','123','Đã thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(172,NULL,'2025-10-11',1090200,19,'Đã xác nhận',94075218,'VNPAY','1234567','Đã nhận tiền',0,0.00,NULL,'CHUA_HOAN',0),(173,NULL,'2025-10-12',303600,19,'Đã hủy',94075219,'VNPAY','123456\n[10/12/2025, 8:20:54 AM] Yêu cầu hoàn tiền: REF_173_1760232054008\n[10/12/2025, 8:29:08 AM] Admin approve: 123\n[10/12/2025, 8:29:29 AM] Admin complete: cam on ạ','Đã hoàn tiền',0,0.00,NULL,'CHUA_HOAN',0),(174,NULL,'2025-10-12',162000,19,'Chờ xử lý',94075220,'COD','1234 | Yêu cầu trả hàng được chấp thuận bởi admin','Đang hoàn tiền',0,0.00,NULL,'CHUA_HOAN',0),(175,NULL,'2025-10-13',561000,18,'Đã hủy - chờ hoàn tiền',94075221,'COD','12345 | Yêu cầu trả hàng được chấp thuận bởi admin\n[10/13/2025, 1:15:32 PM] Yêu cầu hoàn tiền: REF_175_1760336132292','Đang hoàn tiền',0,0.00,NULL,'CHUA_HOAN',0),(176,NULL,'2025-10-13',561000,18,'Chờ xử lý',94075228,'COD','1234\n[10/15/2025, 1:16:12 PM] Đổi địa chỉ giao hàng bởi 18 (id:18)\n[10/15/2025, 1:16:20 PM] Đổi địa chỉ giao hàng bởi 18 (id:18)\n[10/15/2025, 1:19:01 PM] Đổi địa chỉ giao hàng bởi 18 (id:18)\n[10/15/2025, 1:19:46 PM] Đổi địa chỉ giao hàng bởi 18 (id:18)','Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(177,NULL,'2025-10-13',811800,18,'Đã xác nhận',94075223,'COD','123456','Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(178,NULL,'2025-10-13',180000,18,'Chờ xử lý',94075224,'COD','123','Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(179,NULL,'2025-10-13',151800,18,'Chờ xử lý',94075225,'COD','123456','Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(180,NULL,'2025-10-13',180000,18,'Chờ xử lý',94075226,'VNPAY','1234','Đã thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(181,NULL,'2025-10-14',649200,18,'Đã hủy',94075228,'VNPAY','giao hàng vào giờ trưa\n[10/14/2025, 10:54:44 PM] Yêu cầu hoàn tiền: REF_181_1760457284594\n[11/9/2025, 8:00:12 PM] Admin approve: cảm ơn bạn\n[11/9/2025, 8:00:49 PM] Admin complete: cảm ơn vì một trải nghieemk k tốt','Đã hoàn tiền',0,0.00,NULL,'CHUA_HOAN',0),(182,NULL,'2025-10-15',151800,19,'Đã giao hàng',94075229,'VNPAY','12345','Đã nhận tiền',0,0.00,NULL,'CHUA_HOAN',0),(183,NULL,'2025-10-15',744000,19,'Chờ xử lý',94075230,'COD','1234567','Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(184,NULL,'2025-10-15',660000,19,'Chờ xử lý',94075231,'COD','123456\n[LOYALTY] Hạng: Đồng; Giảm: 0% (0đ)','Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(185,NULL,'2025-10-15',465600,19,'Đã giao hàng',94075232,'COD','123\n[LOYALTY] Hạng: Bạc; Giảm: 3% (14,400đ)','Đã nhận tiền',0,0.00,NULL,'CHUA_HOAN',0),(186,NULL,'2025-10-15',116400,19,'Đã giao hàng',94075233,'COD','121212\n[LOYALTY] Hạng: Bạc; Giảm: 3% (3,600đ)','Đã nhận tiền',0,0.00,NULL,'CHUA_HOAN',0),(187,NULL,'2025-10-16',24000,18,'Đã giao hàng',94075234,'COD','123123\n[LOYALTY] Hạng: Đồng; Giảm: 0% (0đ)','Đã nhận tiền',0,0.00,NULL,'CHUA_HOAN',0),(188,NULL,'2025-10-16',465600,19,'Chờ xử lý',94075235,'COD','1234567\n[LOYALTY] Hạng: Bạc; Giảm: 3% (14,400đ)','Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(189,NULL,'2025-10-16',11640,19,'Chờ xử lý',94075236,'COD','1234\n[LOYALTY] Hạng: Bạc; Giảm: 3% (360đ)','Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(190,NULL,'2025-10-16',11640,19,'Chờ xử lý',94075237,'COD','123\n[LOYALTY] Hạng: Bạc; Giảm: 3% (360đ)','Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(191,NULL,'2025-10-16',116400,19,'Đã hủy',94075238,'COD','1234\n[LOYALTY] Hạng: Bạc; Giảm: 3% (3,600đ)\n[10/21/2025, 6:42:52 PM] Lý do hủy: huy nhé','Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(192,NULL,'2025-10-16',147246,19,'Chờ xử lý',94075239,'COD','1234\n[LOYALTY] Hạng: Bạc; Giảm: 3% (4,554đ)','Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(193,NULL,'2025-10-16',175691,19,'Chờ xử lý',94075240,'COD','123\n[LOYALTY] Hạng: Bạc; Giảm: 3% (5,434đ)','Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(194,NULL,'2025-10-16',396924.00000000006,19,'Chờ xử lý',94075241,'COD','1234\n[LOYALTY] Hạng: Bạc; Giảm: 3% (12,276đ)','Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(195,NULL,'2025-10-16',187331,19,'Chờ xử lý',94075242,'COD','123\n[LOYALTY] Hạng: Bạc; Giảm: 3% (5,794đ)','Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(196,NULL,'2025-10-16',396924.00000000006,19,'Chờ xử lý',94075243,'COD','1234\n[LOYALTY] Hạng: Bạc; Giảm: 3% (12,276đ)','Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(197,NULL,'2025-10-17',946647,19,'Đã giao hàng',94075245,'COD','12345\n[LOYALTY] Hạng: Bạc; Giảm: 3% (29,278đ)\n[10/17/2025, 3:50:57 PM] Đổi địa chỉ giao hàng bởi 19 (id:19)','Đã nhận tiền',0,0.00,NULL,'CHUA_HOAN',0),(198,NULL,'2025-10-17',187331,19,'Đã giao hàng',94075230,'COD','1234\n[LOYALTY] Hạng: Bạc; Giảm: 3% (5,794đ)','Đã nhận tiền',0,0.00,NULL,'CHUA_HOAN',0),(199,NULL,'2025-10-17',23280,19,'Đã giao hàng',94075245,'COD','123\n[LOYALTY] Hạng: Bạc; Giảm: 3% (720đ)','Đã nhận tiền',0,0.00,NULL,'CHUA_HOAN',0),(200,NULL,'2025-10-17',11640,19,'Chờ xử lý',94075246,'COD','12345\n[LOYALTY] Hạng: Bạc; Giảm: 3% (360đ)','Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(201,NULL,'2025-10-17',465600,19,'Chờ xử lý',94075247,'COD','123\n[LOYALTY] Hạng: Bạc; Giảm: 3% (14,400đ)','Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(202,NULL,'2025-10-17',180000,18,'Đã giao hàng',94075248,'COD','122\n[LOYALTY] Hạng: Đồng; Giảm: 0% (0đ)','Đã nhận tiền',0,0.00,NULL,'CHUA_HOAN',0),(203,NULL,'2025-10-24',849150,24,'Chờ xử lý',94075249,'COD','123456789\n[LOYALTY] Hạng: Đồng; Giảm: 0% (0đ)','Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(204,NULL,'2025-10-28',6396355,19,'Đã giao hàng',94075230,'COD','123456\n[LOYALTY] Hạng: Bạc; Giảm: 3% (197,825đ)','Đã nhận tiền',0,0.00,NULL,'CHUA_HOAN',0),(205,NULL,'2025-10-28',278100,18,'Chờ xử lý',94075223,'COD','12345\n[LOYALTY] Hạng: Đồng; Giảm: 0% (0đ)','Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(206,NULL,'2025-10-28',278100,18,'Chờ xử lý',94075223,'COD','123\n[LOYALTY] Hạng: Đồng; Giảm: 0% (0đ)','Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(207,NULL,'2025-10-28',151800,25,'Chờ xử lý',94075250,'COD','123\n[LOYALTY] Hạng: Đồng; Giảm: 0% (0đ)','Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(208,NULL,'2025-11-04',9622322,19,'Chờ xử lý',94075251,'COD','q234\n[LOYALTY] Hạng: Bạc; Giảm: 3% (297,598đ)','Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(209,NULL,'2025-11-04',399280,18,'Chờ xử lý',94075252,'COD','11\n[LOYALTY] Hạng: Đồng; Giảm: 0% (0đ)','Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(210,NULL,'2025-11-04',989000,18,'Chờ xử lý',94075253,'VNPAY','123\n[LOYALTY] Hạng: Đồng; Giảm: 0% (0đ)','Đã thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(211,NULL,'2025-11-04',580000,25,'Chờ xử lý',94075254,'VNPAY','123\n[LOYALTY] Hạng: Đồng; Giảm: 0% (0đ)','Đã thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(212,NULL,'2025-11-04',409000,25,'Chờ xử lý',94075255,'COD','123\n[LOYALTY] Hạng: Đồng; Giảm: 0% (0đ)','Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(213,NULL,'2025-11-04',870000,25,'Chờ xử lý',94075256,'COD','1234\n[LOYALTY] Hạng: Đồng; Giảm: 0% (0đ)','Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(214,NULL,'2025-11-04',620000,25,'Chờ xử lý',94075256,'VNPAY','1234\n[LOYALTY] Hạng: Đồng; Giảm: 0% (0đ)','Đã thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(215,NULL,'2025-11-04',6685000,18,'Chờ xử lý',94075257,'COD','\n[LOYALTY] Hạng: Đồng; Giảm sản phẩm: 0% (0đ)\n[SHIPPING] Phí ship: 435,000đ (Tỉnh: 50, Trọng lượng: 14380g)','Chưa thanh toán',435000,0.00,NULL,'CHUA_HOAN',0),(216,NULL,'2025-11-04',569500,18,'Chờ xử lý',94075259,'COD','\n[LOYALTY] Hạng: Bạc; Giảm sản phẩm: 3% (16,500đ)\n[SHIPPING] Phí ship: 36,000đ (Tỉnh: 39, Trọng lượng: 1100g)\n[11/4/2025, 6:34:43 PM] Đổi địa chỉ giao hàng bởi 18 (id:18)\n[11/4/2025, 6:34:53 PM] Đổi địa chỉ giao hàng bởi 18 (id:18)\n[11/4/2025, 6:35:48 PM] Đổi địa chỉ giao hàng bởi 18 (id:18)','Chưa thanh toán',36000,0.00,NULL,'CHUA_HOAN',0),(217,NULL,'2025-11-04',520640,18,'Chờ xử lý',94075259,'VNPAY','123\n[LOYALTY] Hạng: Bạc; Giảm sản phẩm: 3% (15,360đ)\n[SHIPPING] Phí ship: 24,000đ (Tỉnh: 50, Trọng lượng: 760g)\n[11/4/2025, 6:38:14 PM] Đổi địa chỉ giao hàng bởi 18 (id:18)','Đã thanh toán',24000,0.00,NULL,'CHUA_HOAN',0),(218,NULL,'2025-11-04',1936700,18,'Chờ xử lý',94075259,'COD','1234\n[LOYALTY] Hạng: Bạc; Giảm sản phẩm: 3% (57,300đ)\n[SHIPPING] Phí ship: 84,000đ (Tỉnh: 50, Trọng lượng: 3040g)\n[11/4/2025, 6:41:22 PM] Đổi địa chỉ giao hàng bởi 18 (id:18)','Chưa thanh toán',84000,0.00,NULL,'CHUA_HOAN',0),(219,NULL,'2025-11-04',867900,18,'Chờ xử lý',94075259,'COD','1234\n[LOYALTY] Hạng: Bạc; Giảm sản phẩm: 3% (26,100đ)\n[SHIPPING] Phí ship: 24,000đ (Tỉnh: 50, Trọng lượng: 760g)\n[11/4/2025, 7:37:18 PM] Đổi địa chỉ giao hàng bởi 18 (id:18)','Chưa thanh toán',24000,0.00,NULL,'CHUA_HOAN',0),(220,NULL,'2025-11-04',235100,18,'Chờ xử lý',94075259,'COD','hg\n[LOYALTY] Hạng: Bạc; Giảm sản phẩm: 3% (6,900đ)\n[SHIPPING] Phí ship: 12,000đ (Tỉnh: 50, Trọng lượng: 380g)\n[11/4/2025, 7:35:51 PM] Đổi địa chỉ giao hàng bởi 18 (id:18)','Chưa thanh toán',12000,0.00,NULL,'CHUA_HOAN',0),(221,NULL,'2025-11-04',370900,18,'Chờ xử lý',94075259,'COD','123\n[LOYALTY] Hạng: Bạc; Giảm sản phẩm: 3% (11,100đ)\n[SHIPPING] Phí ship: 12,000đ (Tỉnh: 50, Trọng lượng: 380g)\n[11/4/2025, 7:32:00 PM] Đổi địa chỉ giao hàng bởi 18 (id:18)','Chưa thanh toán',12000,0.00,NULL,'CHUA_HOAN',0),(222,NULL,'2025-11-04',497000,18,'Chờ xử lý',94075259,'COD','hhh\n[LOYALTY] Hạng: Bạc; Giảm sản phẩm: 3% (15,000đ)\n[SHIPPING] Phí ship: 12,000đ (Tỉnh: 50, Trọng lượng: 500g)\n[11/4/2025, 7:39:12 PM] Đổi địa chỉ giao hàng bởi 18 (id:18)','Chưa thanh toán',12000,0.00,NULL,'CHUA_HOAN',0),(223,NULL,'2025-11-04',273900,18,'Chờ xử lý',94075259,'COD','134\n[LOYALTY] Hạng: Bạc; Giảm sản phẩm: 3% (8,100đ)\n[SHIPPING] Phí ship: 12,000đ (Tỉnh: 50, Trọng lượng: 380g)\n[11/4/2025, 7:42:56 PM] Đổi địa chỉ giao hàng bởi 18 (id:18)','Chưa thanh toán',12000,0.00,NULL,'CHUA_HOAN',0),(224,NULL,'2025-11-04',579200,18,'Chờ xử lý',94075262,'COD','1234\n[LOYALTY] Hạng: Bạc; Giảm sản phẩm: 3% (16,800đ)\n[SHIPPING] Phí ship: 36,000đ (Tỉnh: 50, Trọng lượng: 1500g)','Chưa thanh toán',36000,0.00,NULL,'CHUA_HOAN',0),(225,NULL,'2025-11-04',582000,18,'Chờ xử lý',94075259,'COD','123\n[LOYALTY] Hạng: Bạc; Giảm sản phẩm: 3% (18,000đ)\n[SHIPPING] Phí ship: 0đ (Thành phố Hồ Chí Minh, Trọng lượng: 880g)\n[11/4/2025, 7:55:07 PM] Đổi địa chỉ giao hàng bởi 18 (id:18)','Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(226,NULL,'2025-11-04',737200,18,'Chờ xử lý',94075259,'COD','123\n[LOYALTY] Hạng: Bạc; Giảm sản phẩm: 3% (22,800đ)\n[SHIPPING] Phí ship: 0đ (Thành phố Hồ Chí Minh, Trọng lượng: 1500g)\n[11/4/2025, 8:01:01 PM] Đổi địa chỉ giao hàng bởi 18 (id:18)\n[11/4/2025, 8:01:38 PM] Đổi địa chỉ giao hàng bởi 18 (id:18)','Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(227,NULL,'2025-11-04',494700,18,'Chờ xử lý',94075259,'COD','123\n[LOYALTY] Hạng: Bạc; Giảm sản phẩm: 3% (15,300đ)\n[SHIPPING] Phí ship: 0đ (Thành phố Hồ Chí Minh, Trọng lượng: 2000g)\n[11/4/2025, 8:18:12 PM] Đổi địa chỉ giao hàng bởi 18 (id:18)','Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(228,NULL,'2025-11-04',1270700,18,'Chờ xử lý',94075259,'COD','acb\n[LOYALTY] Hạng: Bạc; Giảm sản phẩm: 3% (39,300đ)\n[SHIPPING] Phí ship: 0đ (Thành phố Hồ Chí Minh, Trọng lượng: 1140g)\n[11/4/2025, 8:20:23 PM] Đổi địa chỉ giao hàng bởi 18 (id:18)\n[11/4/2025, 8:25:26 PM] Đổi địa chỉ giao hàng bởi 18 (id:18)','Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(229,NULL,'2025-11-04',710040,18,'Chờ xử lý',94075259,'COD','123\n[LOYALTY] Hạng: Bạc; Giảm sản phẩm: 3% (21,960đ)\n[SHIPPING] Phí ship: 0đ (Thành phố Hồ Chí Minh, Trọng lượng: 760g)\n[11/4/2025, 8:30:00 PM] Đổi địa chỉ giao hàng bởi 18 (id:18)\n[11/4/2025, 8:31:12 PM] Đổi địa chỉ giao hàng bởi 18 (id:18)\n[11/4/2025, 8:34:56 PM] Đổi địa chỉ giao hàng bởi 18 (id:18)','Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(230,NULL,'2025-11-04',446200,18,'Chờ xử lý',94075259,'COD','123\n[LOYALTY] Hạng: Bạc; Giảm sản phẩm: 3% (13,800đ)\n[SHIPPING] Phí ship: 0đ (Thành phố Hồ Chí Minh, Trọng lượng: 800g)\n[11/4/2025, 8:37:11 PM] Đổi địa chỉ giao hàng bởi 18 (id:18)\n[11/4/2025, 8:49:02 PM] Đổi địa chỉ giao hàng bởi 18 (id:18)\n[11/4/2025, 8:52:00 PM] Đổi địa chỉ giao hàng bởi 18 (id:18)','Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(231,NULL,'2025-11-04',1978800,18,'Chờ xử lý',94075259,'COD','123\n[LOYALTY] Hạng: Bạc; Giảm sản phẩm: 3% (61,200đ)\n[SHIPPING] Phí ship: 0đ (Thành phố Hồ Chí Minh, Trọng lượng: 2260g)\n[11/4/2025, 8:52:41 PM] Đổi địa chỉ giao hàng bởi 18 (id:18)','Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(232,NULL,'2025-11-04',340500,18,'Chờ xử lý',94075259,'COD','123\n[LOYALTY] Hạng: Vàng; Giảm sản phẩm: 7% (24,500đ)\n[SHIPPING] Phí ship: 0đ (Thành phố Hồ Chí Minh, Trọng lượng: 600g)\n[20:57:53 4/11/2025] Đổi địa chỉ: Phí ship tăng 15,000đ (từ 0đ → 15,000đ)','Chưa thanh toán',15000,0.00,NULL,'CHUA_HOAN',0),(233,NULL,'2025-11-04',878100,18,'Chờ xử lý',94075259,'COD','123\n[LOYALTY] Hạng: Vàng; Giảm sản phẩm: 7% (64,400đ)\n[SHIPPING] Phí ship: 0đ (Thành phố Hồ Chí Minh, Trọng lượng: 1280g)\n[20:59:04 4/11/2025] Đổi địa chỉ: Phí ship tăng 22,500đ (từ 0đ → 22,500đ)','Chưa thanh toán',22500,0.00,NULL,'CHUA_HOAN',0),(234,NULL,'2025-11-04',418500,18,'Chờ xử lý',94075259,'VNPAY','123\n[LOYALTY] Hạng: Vàng; Giảm sản phẩm: 7% (31,500đ)\n[SHIPPING] Phí ship: 0đ (Thành phố Hồ Chí Minh, Trọng lượng: 880g)\n[21:04:03 4/11/2025] ⚠️ ĐỔI ĐỊA CHỈ: Thu thêm 15,000đ phí ship khi giao hàng (Đã TT VNPay 418,500đ)','Đã thanh toán',15000,0.00,NULL,'CHUA_HOAN',0),(235,NULL,'2025-11-04',344100,18,'Chờ xử lý',94075259,'VNPAY','123\n[LOYALTY] Hạng: Vàng; Giảm sản phẩm: 7% (25,900đ)\n[SHIPPING] Phí ship: 0đ (Thành phố Hồ Chí Minh, Trọng lượng: 380g)\n[21:51:24 4/11/2025] ⚠️ ĐỔI ĐỊA CHỈ: Thu thêm 7,500đ phí ship khi giao hàng (Đã TT VNPay 344,100đ)','Đã thanh toán',7500,0.00,NULL,'CHUA_HOAN',0),(236,NULL,'2025-11-04',213900,18,'Chờ xử lý',94075262,'VNPAY','1234\n[LOYALTY] Hạng: Vàng; Giảm sản phẩm: 7% (16,100đ)\n[SHIPPING] Phí ship: 0đ (Thành phố Hồ Chí Minh, Trọng lượng: 500g)','Đã thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(237,NULL,'2025-11-04',11160,18,'Chờ xử lý',94075262,'VNPAY','123\n[LOYALTY] Hạng: Vàng; Giảm sản phẩm: 7% (840đ)\n[SHIPPING] Phí ship: 0đ (Thành phố Hồ Chí Minh, Trọng lượng: 380g)','Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(238,NULL,'2025-11-04',199950,18,'Chờ xử lý',94075260,'VNPAY','123\n[LOYALTY] Hạng: Vàng; Giảm sản phẩm: 7% (15,050đ)\n[SHIPPING] Phí ship: 0đ (Thành phố Hồ Chí Minh, Trọng lượng: 2000g)','Đã thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(239,NULL,'2025-11-04',381300,18,'Chờ xử lý',94075262,'VNPAY','dfgh\n[LOYALTY] Hạng: Vàng; Giảm sản phẩm: 7% (28,700đ)\n[SHIPPING] Phí ship: 0đ (Thành phố Hồ Chí Minh, Trọng lượng: 680g)','Đã thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(240,NULL,'2025-11-04',457560,18,'Chờ xử lý',94075262,'VNPAY','1234\n[LOYALTY] Hạng: Vàng; Giảm sản phẩm: 7% (34,440đ)\n[SHIPPING] Phí ship: 0đ (Thành phố Hồ Chí Minh, Trọng lượng: 760g)','Đã thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(241,NULL,'2025-11-04',372000,18,'Chờ xử lý',94075262,'VNPAY','1234\n[LOYALTY] Hạng: Vàng; Giảm sản phẩm: 7% (28,000đ)\n[SHIPPING] Phí ship: 0đ (Thành phố Hồ Chí Minh, Trọng lượng: 1000g)','Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(242,NULL,'2025-11-04',699360,18,'Chờ xử lý',94075262,'VNPAY','123\n[LOYALTY] Hạng: Vàng; Giảm sản phẩm: 7% (52,640đ)\n[SHIPPING] Phí ship: 0đ (Thành phố Hồ Chí Minh, Trọng lượng: 760g)','Đã thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(243,NULL,'2025-11-04',437100,18,'Chờ xử lý',94075262,'VNPAY','12\n[LOYALTY] Hạng: Vàng; Giảm sản phẩm: 7% (32,900đ)\n[SHIPPING] Phí ship: 0đ (Thành phố Hồ Chí Minh, Trọng lượng: 760g)','Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(244,NULL,'2025-11-05',519870,19,'Chờ xử lý',94075265,'VNPAY','123\n[LOYALTY] Hạng: Vàng; Giảm sản phẩm: 7% (39,130đ)\n[SHIPPING] Phí ship: 0đ (Thành phố Hồ Chí Minh, Trọng lượng: 980g)\n[18:19:08 5/11/2025] ⚠️ ĐỔI ĐỊA CHỈ: Thu thêm 15,000đ phí ship khi giao hàng (Đã TT VNPay 519,870đ)','Đã thanh toán',15000,0.00,NULL,'CHUA_HOAN',0),(245,NULL,'2025-11-07',465180,18,'Chờ xử lý',94075267,'COD','123\n[LOYALTY] Hạng: Vàng; Giảm sản phẩm: 7% (33,320đ)\n[SHIPPING] Phí ship: 22,500đ (Tỉnh Hoà Bình, Trọng lượng: 1140g)','Chưa thanh toán',22500,0.00,NULL,'CHUA_HOAN',0),(246,NULL,'2025-11-07',520800,19,'Đã giao hàng',94075268,'COD','\n[LOYALTY] Hạng: Vàng; Giảm sản phẩm: 7% (39,200đ)\n[SHIPPING] Phí ship: 0đ (FREE SHIP - Mã: GGN00B6N)','Đã nhận tiền',0,0.00,NULL,'CHUA_HOAN',0),(247,NULL,'2025-11-07',442680,19,'Đã giao hàng',94075269,'COD','12\n[LOYALTY] Hạng: Vàng; Giảm sản phẩm: 7% (33,320đ)\n[SHIPPING] Phí ship: 0đ (FREE SHIP - Mã: 6HO1O77R)','Đã nhận tiền',0,0.00,NULL,'CHUA_HOAN',0),(248,NULL,'2025-11-07',613800,19,'Chờ xử lý',94075269,'COD','12345\n[LOYALTY] Hạng: Vàng; Giảm sản phẩm: 7% (46,200đ)\n[SHIPPING] Phí ship: 0đ (FREE SHIP - Mã: 5CF1HR93)','Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(249,NULL,'2025-11-07',476160,19,'Chờ xử lý',94075270,'COD','1234\n[LOYALTY] Hạng: Vàng; Giảm sản phẩm: 7% (35,840đ)\n[SHIPPING] Phí ship: 0đ (Thành phố Hồ Chí Minh, Trọng lượng: 880g)','Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(250,NULL,'2025-11-07',576600,19,'Chờ xử lý',94075270,'COD','123\n[LOYALTY] Hạng: Vàng; Giảm sản phẩm: 7% (43,400đ)\n[SHIPPING] Phí ship: 0đ (FREE SHIP - Mã: FREESHIP200)','Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(251,NULL,'2025-11-07',1142500,19,'Chờ xử lý',94075269,'COD','123\n[PROMO] Mã: 95YF5CZE; Giảm giá: 40,000đ\n[LOYALTY] Hạng: Vàng\n[SHIPPING] Phí ship: 22,500đ (Tỉnh Kiên Giang, Trọng lượng: 1260g)','Chưa thanh toán',22500,0.00,NULL,'CHUA_HOAN',0),(252,NULL,'2025-11-07',475000,19,'Chờ xử lý',94075269,'COD','123\n[LOYALTY] Hạng: Vàng\n[SHIPPING] Phí ship: 15,000đ (Tỉnh Kiên Giang, Trọng lượng: 680g)','Chưa thanh toán',15000,0.00,NULL,'CHUA_HOAN',0),(253,NULL,'2025-11-07',448300,19,'Đã hủy',94075269,'COD','123\n[PROMO] Mã: 1X2D7ZRJ; Giảm giá: 50,000đ\n[LOYALTY] Hạng: Vàng\n[SHIPPING] Phí ship: 22,500đ (Tỉnh Kiên Giang, Trọng lượng: 1500g)\n[11/7/2025, 7:54:40 PM] Lý do hủy: huy','Chưa thanh toán',22500,0.00,NULL,'CHUA_HOAN',0),(254,NULL,'2025-11-12',2150000,18,'Chờ xử lý',94075267,'COD','13\n[LOYALTY] Hạng: Vàng\n[SHIPPING] Phí ship: 0đ (FREE SHIP - Mã: 70VNGK12)','Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(255,NULL,'2025-11-12',239000,18,'Chờ xử lý',94075267,'COD','123\n[PROMO] Mã: 6GFG7K5U; Giảm giá: 40,000đ\n[LOYALTY] Hạng: Vàng\n[SHIPPING] Phí ship: 15,000đ (Tỉnh Hoà Bình, Trọng lượng: 760g)','Chưa thanh toán',15000,0.00,NULL,'CHUA_HOAN',0),(256,NULL,'2025-11-12',200000,18,'Chờ xử lý',94075258,'COD','\n[LOYALTY] Hạng: Vàng\n[SHIPPING] Phí ship: 0đ (FREE SHIP - Mã: 6HO1O77R)\n[2025-11-12 16:40:55] Đổi địa chỉ: Phí ship thay đổi từ 7500đ → 7500đ. Tổng tiền mới: 200000đ','Chưa thanh toán',7500,0.00,NULL,'CHUA_HOAN',0),(257,NULL,'2025-11-12',1172500,18,'Đã giao hàng',94075267,'COD','123\n[PROMO] Mã: IDMLBQAS; Giảm giá: 40,000đ\n[LOYALTY] Hạng: Vàng\n[SHIPPING] Phí ship: 22,500đ (Tỉnh Hoà Bình, Trọng lượng: 1140g)','Đã nhận tiền',22500,0.00,NULL,'CHUA_HOAN',0),(258,NULL,'2025-11-13',1100000,18,'Đã giao hàng',94075271,'COD','Chuyển trạng thái (hoàn tác) bởi quản trị viên','Đã nhận tiền',0,0.00,NULL,'CHUA_HOAN',0),(259,NULL,'2025-11-13',348000,18,'Đang giao hàng',94075271,'COD','777\n[LOYALTY] Hạng: Vàng\n[SHIPPING] Phí ship: 0đ (FREE SHIP - Mã: 5CF1HR93)','Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(260,NULL,'2025-11-13',222500,18,'Chờ xử lý',94075267,'COD','123\n[PROMO] Mã: MY0SXRWJ; Giảm giá: 295,800đ\n[LOYALTY] Hạng: Vàng\n[SHIPPING] Phí ship: 22,500đ (Tỉnh Hoà Bình, Trọng lượng: 1400g)','Chưa thanh toán',22500,0.00,NULL,'CHUA_HOAN',0),(261,NULL,'2025-11-13',207500,18,'Chờ xử lý',94075267,'COD','555\n[LOYALTY] Hạng: Vàng\n[SHIPPING] Phí ship: 7,500đ (Tỉnh Hoà Bình, Trọng lượng: 500g)','Chưa thanh toán',7500,0.00,NULL,'CHUA_HOAN',0),(262,NULL,'2025-11-15',380000,19,'Đã hủy',94075272,'VNPAY','Chuyển trạng thái (hoàn tác) bởi quản trị viên','Đã nhận tiền',0,0.00,NULL,'CHUA_HOAN',0),(263,NULL,'2025-11-29',328320,19,'Chờ xử lý',94075270,'COD','123\n[MEMBER] Giảm theo hạng Vàng: 17,280đ\n[LOYALTY] Hạng: Vàng\n[SHIPPING] Phí ship: 0đ (FREE SHIP - Mã: DYOHNLHW)','Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(264,NULL,'2025-11-29',645400,19,'Chờ xử lý',94075270,'COD','113\n[PROMO] Mã: 49G99FYC; Giảm giá: 50,000đ\n[MEMBER] Giảm theo hạng Vàng: 36,600đ\n[LOYALTY] Hạng: Vàng\n[SHIPPING] Phí ship: 0đ (FREE SHIP - Mã: PBGHXD53)','Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(265,NULL,'2025-11-30',295600,19,'Chờ xử lý',94075270,'VNPAY','1234\n[PROMO] Mã: DFY1CP15; Giảm giá: 50,000đ\n[LOYALTY] Hạng: Vàng\n[SHIPPING] Phí ship: 0đ (Thành phố Hồ Chí Minh, Trọng lượng: 1200g)','Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(266,NULL,'2025-11-30',310000,19,'Chờ xử lý',94075270,'VNPAY','1234\n[LOYALTY] Hạng: Vàng\n[SHIPPING] Phí ship: 0đ (Thành phố Hồ Chí Minh, Trọng lượng: 380g)','Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(267,NULL,'2025-11-30',86400,19,'Chờ xử lý',94075270,'VNPAY','123\n[LOYALTY] Hạng: Vàng\n[SHIPPING] Phí ship: 0đ (Thành phố Hồ Chí Minh, Trọng lượng: 300g)','Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(268,NULL,'2025-11-30',86400,19,'Chờ xử lý',94075270,'VNPAY','123\n[LOYALTY] Hạng: Vàng\n[SHIPPING] Phí ship: 0đ (Thành phố Hồ Chí Minh, Trọng lượng: 300g)','Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(269,NULL,'2025-11-30',200000,18,'Chờ xử lý',94075271,'VNPAY','123\n[LOYALTY] Hạng: Vàng\n[SHIPPING] Phí ship: 0đ (Thành phố Hồ Chí Minh, Trọng lượng: 500g)','Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(270,NULL,'2025-11-30',207500,18,'Chờ xử lý',94075267,'VNPAY','123\n[LOYALTY] Hạng: Vàng\n[SHIPPING] Phí ship: 7,500đ (Tỉnh Hoà Bình, Trọng lượng: 500g)','Chưa thanh toán',7500,0.00,NULL,'CHUA_HOAN',0),(271,NULL,'2025-11-30',200000,18,'Chờ xử lý',94075257,'VNPAY','123\n[LOYALTY] Hạng: Vàng\n[SHIPPING] Phí ship: 0đ (Thành phố Hồ Chí Minh, Trọng lượng: 500g)','Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(272,NULL,'2025-11-30',200000,19,'Chờ xử lý',94075270,'VNPAY','234\n[LOYALTY] Hạng: Vàng\n[SHIPPING] Phí ship: 0đ (Thành phố Hồ Chí Minh, Trọng lượng: 500g)','Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(273,NULL,'2025-11-30',86400,19,'Chờ xử lý',94075270,'VNPAY','123\n[LOYALTY] Hạng: Vàng\n[SHIPPING] Phí ship: 0đ (Thành phố Hồ Chí Minh, Trọng lượng: 300g)','Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(274,NULL,'2025-11-30',200000,19,'Chờ xử lý',94075270,'VNPAY','\n[LOYALTY] Hạng: Vàng\n[SHIPPING] Phí ship: 0đ (Thành phố Hồ Chí Minh, Trọng lượng: 500g)','Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(275,NULL,'2025-11-30',480000,19,'Chờ xử lý',94075270,'VNPAY','\n[LOYALTY] Hạng: Vàng\n[SHIPPING] Phí ship: 0đ (Thành phố Hồ Chí Minh, Trọng lượng: 380g)','Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(276,NULL,'2025-11-30',86400,19,'Chờ xử lý',94075270,'VNPAY','\n[LOYALTY] Hạng: Vàng\n[SHIPPING] Phí ship: 0đ (Thành phố Hồ Chí Minh, Trọng lượng: 300g)','Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(277,NULL,'2025-11-30',200000,19,'Chờ xử lý',94075270,'VNPAY','123\n[LOYALTY] Hạng: Vàng\n[SHIPPING] Phí ship: 0đ (Thành phố Hồ Chí Minh, Trọng lượng: 500g)','Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(278,NULL,'2025-11-30',200000,19,'Chờ xử lý',94075270,'VNPAY','1234\n[LOYALTY] Hạng: Vàng\n[SHIPPING] Phí ship: 0đ (Thành phố Hồ Chí Minh, Trọng lượng: 500g)','Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(279,NULL,'2025-11-30',200000,19,'Chờ xử lý',94075270,'VNPAY','\n[LOYALTY] Hạng: Vàng\n[SHIPPING] Phí ship: 0đ (Thành phố Hồ Chí Minh, Trọng lượng: 500g)','Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(280,NULL,'2025-11-30',480000,19,'Chờ xử lý',94075270,'VNPAY','\n[LOYALTY] Hạng: Vàng\n[SHIPPING] Phí ship: 0đ (Thành phố Hồ Chí Minh, Trọng lượng: 380g)','Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(281,NULL,'2025-11-30',86400,19,'Chờ xử lý',94075270,'VNPAY','\n[LOYALTY] Hạng: Vàng\n[SHIPPING] Phí ship: 0đ (Thành phố Hồ Chí Minh, Trọng lượng: 300g)','Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(282,NULL,'2025-11-30',86400,19,'Chờ xử lý',94075270,'COD','\n[LOYALTY] Hạng: Vàng\n[SHIPPING] Phí ship: 0đ (Thành phố Hồ Chí Minh, Trọng lượng: 300g)','Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(283,NULL,'2025-11-30',200000,19,'Chờ xử lý',94075270,'COD','k\n[LOYALTY] Hạng: Vàng\n[SHIPPING] Phí ship: 0đ (Thành phố Hồ Chí Minh, Trọng lượng: 500g)','Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(284,NULL,'2025-11-30',86400,19,'Chờ xử lý',94075270,'COD','123\n[LOYALTY] Hạng: Vàng\n[SHIPPING] Phí ship: 0đ (Thành phố Hồ Chí Minh, Trọng lượng: 300g)','Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(285,NULL,'2025-11-30',86400,19,'Chờ xử lý',94075270,'COD','\n[LOYALTY] Hạng: Vàng\n[SHIPPING] Phí ship: 0đ (Thành phố Hồ Chí Minh, Trọng lượng: 300g)','Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(286,NULL,'2025-11-30',200000,19,'Chờ xử lý',94075270,'COD','9\n[LOYALTY] Hạng: Vàng\n[SHIPPING] Phí ship: 0đ (Thành phố Hồ Chí Minh, Trọng lượng: 500g)','Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(287,NULL,'2025-11-30',200000,19,'Chờ xử lý',94075270,'COD','123\n[LOYALTY] Hạng: Vàng\n[SHIPPING] Phí ship: 0đ (Thành phố Hồ Chí Minh, Trọng lượng: 500g)','Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(288,NULL,'2025-11-30',200000,19,'Chờ xử lý',94075270,'COD','55\n[LOYALTY] Hạng: Vàng\n[SHIPPING] Phí ship: 0đ (Thành phố Hồ Chí Minh, Trọng lượng: 500g)','Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(289,NULL,'2025-11-30',86400,19,'Chờ xử lý',94075270,'COD','123\n[LOYALTY] Hạng: Vàng\n[SHIPPING] Phí ship: 0đ (Thành phố Hồ Chí Minh, Trọng lượng: 300g)','Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(290,NULL,'2025-11-30',400000,19,'Chờ xử lý',94075270,'COD','234\n[LOYALTY] Hạng: Vàng\n[SHIPPING] Phí ship: 0đ (Thành phố Hồ Chí Minh, Trọng lượng: 1000g)','Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(291,NULL,'2025-11-30',150000,25,'Chờ xử lý',94075256,'COD','\n[LOYALTY] Hạng: Đồng\n[SHIPPING] Phí ship: 0đ (Thành phố Hồ Chí Minh, Trọng lượng: 380g)','Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(292,NULL,'2025-11-30',900000,25,'Đã hủy',94075256,'COD','888\n[LOYALTY] Hạng: Đồng\n[SHIPPING] Phí ship: 0đ (FREE SHIP - Mã: 3Z54J5UO) | Yêu cầu trả hàng được chấp thuận bởi admin\n[11/30/2025, 11:38:39 AM] Yêu cầu hoàn tiền: REF_292_1764477519471\n[11/30/2025, 11:39:25 AM] Admin approve: xin lỗi bạn về sự cố \n[11/30/2025, 11:39:51 AM] Admin complete: đã haonf tiền cho khách hàng','Đã hoàn tiền',0,0.00,NULL,'CHUA_HOAN',0),(293,NULL,'2025-11-30',295600,25,'Đã giao hàng',94075256,'COD','\n[PROMO] Mã: DFY1CP15; Giảm giá: 50,000đ\n[LOYALTY] Hạng: Đồng\n[SHIPPING] Phí ship: 0đ (FREE SHIP - Mã: FREESHIP200)','Đã nhận tiền',0,0.00,NULL,'CHUA_HOAN',0),(294,NULL,'2025-11-30',86400,25,'Chờ xử lý',94075256,'VNPAY','ư6\n[LOYALTY] Hạng: Đồng\n[SHIPPING] Phí ship: 0đ (Thành phố Hồ Chí Minh, Trọng lượng: 300g)','Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(295,NULL,'2025-11-30',13612000,25,'Chờ xử lý',94075256,'COD','\n[LOYALTY] Hạng: Đồng\n[SHIPPING] Phí ship: 0đ (Thành phố Hồ Chí Minh, Trọng lượng: 27000g)','Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(296,NULL,'2025-11-30',295600,25,'Chờ xử lý',94075256,'COD','\n[PROMO] Mã: DFY1CP15; Giảm giá: 50,000đ\n[LOYALTY] Hạng: Bạc\n[SHIPPING] Phí ship: 0đ (Thành phố Hồ Chí Minh, Trọng lượng: 1200g)','Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(297,NULL,'2025-11-30',331600,25,'Chờ xử lý',94075273,'COD','\n[PROMO] Mã: DFY1CP15; Giảm giá: 50,000đ\n[LOYALTY] Hạng: Bạc\n[SHIPPING] Phí ship: 36,000đ (Thành phố Hà Nội, Trọng lượng: 1200g)','Chưa thanh toán',36000,0.00,NULL,'CHUA_HOAN',0),(298,NULL,'2025-11-30',295600,25,'Chờ xử lý',94075256,'COD','\n[PROMO] Mã: DFY1CP15; Giảm giá: 50,000đ\n[LOYALTY] Hạng: Bạc\n[SHIPPING] Phí ship: 0đ (Thành phố Hồ Chí Minh, Trọng lượng: 1200g)','Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(299,NULL,'2025-11-30',504000,25,'Chờ xử lý',94075256,'COD','gg\n[LOYALTY] Hạng: Bạc\n[SHIPPING] Phí ship: 0đ (Thành phố Hồ Chí Minh, Trọng lượng: 760g)','Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(300,NULL,'2025-11-30',455400,25,'Chờ xử lý',94075256,'COD','66\n[LOYALTY] Hạng: Bạc\n[SHIPPING] Phí ship: 0đ (Thành phố Hồ Chí Minh, Trọng lượng: 900g)','Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(301,NULL,'2025-11-30',524000,25,'Chờ xử lý',94075274,'COD','6\n[LOYALTY] Hạng: Bạc\n[SHIPPING] Phí ship: 24,000đ (Tỉnh Lạng Sơn, Trọng lượng: 760g)','Chưa thanh toán',24000,0.00,NULL,'CHUA_HOAN',0),(302,NULL,'2025-11-30',492000,25,'Chờ xử lý',94075275,'COD','\n[LOYALTY] Hạng: Bạc\n[SHIPPING] Phí ship: 12,000đ (Thành phố Hà Nội, Trọng lượng: 380g)','Chưa thanh toán',12000,0.00,NULL,'CHUA_HOAN',0),(303,NULL,'2025-11-30',682000,25,'Chờ xử lý',94075256,'COD','\n[PROMO] Mã: 49G99FYC; Giảm giá: 50,000đ\n[LOYALTY] Hạng: Vàng\n[SHIPPING] Phí ship: 0đ (Thành phố Hồ Chí Minh, Trọng lượng: 760g)','Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(304,NULL,'2025-11-30',682000,25,'Chờ xử lý',94075256,'COD','123\n[PROMO] Mã: 49G99FYC; Giảm giá: 50,000đ\n[LOYALTY] Hạng: Vàng\n[SHIPPING] Phí ship: 0đ (Thành phố Hồ Chí Minh, Trọng lượng: 760g)','Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(305,NULL,'2025-11-30',682000,25,'Chờ xử lý',94075256,'COD','\n[PROMO] Mã: 49G99FYC; Giảm giá: 50,000đ\n[LOYALTY] Hạng: Vàng\n[SHIPPING] Phí ship: 0đ (Thành phố Hồ Chí Minh, Trọng lượng: 760g)','Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(306,NULL,'2025-11-30',480000,25,'Chờ xử lý',94075256,'COD','\n[LOYALTY] Hạng: Vàng\n[SHIPPING] Phí ship: 0đ (Thành phố Hồ Chí Minh, Trọng lượng: 380g)','Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(307,NULL,'2025-11-30',480000,25,'Chờ xử lý',94075256,'VNPAY','345\n[LOYALTY] Hạng: Vàng\n[SHIPPING] Phí ship: 0đ (Thành phố Hồ Chí Minh, Trọng lượng: 380g)','Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(308,NULL,'2025-11-30',340000,25,'Chờ xử lý',94075256,'COD','45\n[LOYALTY] Hạng: Vàng\n[SHIPPING] Phí ship: 0đ (Thành phố Hồ Chí Minh, Trọng lượng: 380g)','Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(309,NULL,'2025-11-30',495000,21,'Chờ xử lý',94075276,'COD','3\n[LOYALTY] Hạng: Đồng\n[SHIPPING] Phí ship: 15,000đ (Tỉnh Thái Nguyên, Trọng lượng: 380g)','Chưa thanh toán',15000,0.00,NULL,'CHUA_HOAN',0),(310,NULL,'2025-11-30',355000,21,'Chờ xử lý',94075277,'COD','245\n[LOYALTY] Hạng: Đồng\n[SHIPPING] Phí ship: 15,000đ (Tỉnh Lai Châu, Trọng lượng: 380g)','Chưa thanh toán',15000,0.00,NULL,'CHUA_HOAN',0),(311,NULL,'2025-11-30',495000,21,'Chờ xử lý',94075278,'COD','543\n[LOYALTY] Hạng: Đồng\n[SHIPPING] Phí ship: 15,000đ (Tỉnh Lạng Sơn, Trọng lượng: 380g)','Chưa thanh toán',15000,0.00,NULL,'CHUA_HOAN',0),(312,NULL,'2025-11-30',754200,21,'Chờ xử lý',94075279,'COD','356\n[PROMO] Mã: DFY1CP15; Giảm giá: 50,000đ\n[LOYALTY] Hạng: Đồng\n[SHIPPING] Phí ship: 45,000đ (Tỉnh Tuyên Quang, Trọng lượng: 1280g)','Chưa thanh toán',45000,0.00,NULL,'CHUA_HOAN',0),(313,NULL,'2025-11-30',1182000,21,'Chờ xử lý',94075280,'COD','345\n[PROMO] Mã: 49G99FYC; Giảm giá: 50,000đ\n[LOYALTY] Hạng: Đồng\n[SHIPPING] Phí ship: 0đ (FREE SHIP - Mã: PBGHXD53)','Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(314,NULL,'2025-11-30',24120000,21,'Chờ xử lý',94075281,'COD','112\n[LOYALTY] Hạng: Đồng\n[SHIPPING] Phí ship: 1,350,000đ (Tỉnh Tuyên Quang, Trọng lượng: 45000g)','Chưa thanh toán',1350000,0.00,NULL,'CHUA_HOAN',0),(315,NULL,'2025-11-30',892500,21,'Chờ xử lý',94075282,'COD','\n[PROMO] Mã: YBSNVOGV; Giảm giá: 40,000đ\n[LOYALTY] Hạng: Vàng\n[SHIPPING] Phí ship: 22,500đ (Tỉnh Tuyên Quang, Trọng lượng: 1140g)','Chưa thanh toán',22500,0.00,NULL,'CHUA_HOAN',0),(316,NULL,'2025-11-30',955000,21,'Chờ xử lý',94075283,'COD','123\n[PROMO] Mã: 3TXDYO0K; Giảm giá: 40,000đ\n[LOYALTY] Hạng: Vàng\n[SHIPPING] Phí ship: 15,000đ (Tỉnh Tuyên Quang, Trọng lượng: 760g)','Chưa thanh toán',15000,0.00,NULL,'CHUA_HOAN',0),(317,NULL,'2025-11-30',295600,25,'Chờ xử lý',94075284,'COD','123\n[PROMO] Mã: DFY1CP15; Giảm giá: 50,000đ\n[LOYALTY] Hạng: Vàng\n[SHIPPING] Phí ship: 0đ (Thành phố Hồ Chí Minh, Trọng lượng: 1200g)','Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(318,NULL,'2025-11-30',891000,19,'Chờ xử lý',94075268,'COD','\n[PROMO] Mã: 3TXDYO0K; Giảm giá: 40,000đ\n[MEMBER] Giảm theo hạng Vàng: 49,000đ\n[LOYALTY] Hạng: Vàng\n[SHIPPING] Phí ship: 0đ (FREE SHIP - Mã: 3Z54J5UO)','Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(319,NULL,'2025-12-01',86400,19,'Chờ xử lý',94075270,'VNPAY','123\n[LOYALTY] Hạng: Vàng\n[SHIPPING] Phí ship: 0đ (Thành phố Hồ Chí Minh, Trọng lượng: 300g)','Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(320,NULL,'2025-12-01',200000,19,'Chờ xử lý',94075270,'VNPAY','123\n[LOYALTY] Hạng: Vàng\n[SHIPPING] Phí ship: 0đ (Thành phố Hồ Chí Minh, Trọng lượng: 500g)','Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(321,NULL,'2025-12-01',480000,19,'Chờ xử lý',94075270,'VNPAY','12\n[LOYALTY] Hạng: Vàng\n[SHIPPING] Phí ship: 0đ (Thành phố Hồ Chí Minh, Trọng lượng: 380g)','Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(322,NULL,'2025-12-01',86400,19,'Chờ xử lý',94075270,'VNPAY','234\n[LOYALTY] Hạng: Vàng\n[SHIPPING] Phí ship: 0đ (Thành phố Hồ Chí Minh, Trọng lượng: 300g)','Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(323,NULL,'2025-12-01',200000,19,'Chờ xử lý',94075270,'VNPAY','234\n[LOYALTY] Hạng: Vàng\n[SHIPPING] Phí ship: 0đ (Thành phố Hồ Chí Minh, Trọng lượng: 500g)','Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(324,NULL,'2025-12-02',86400,19,'Chờ xử lý',94075268,'VNPAY','12\n[LOYALTY] Hạng: Vàng\n[SHIPPING] Phí ship: 0đ (Thành phố Hồ Chí Minh, Trọng lượng: 300g)','Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(325,NULL,'2025-12-02',500000,18,'Chờ xử lý',94075259,'VNPAY','123\n[LOYALTY] Hạng: Vàng\n[SHIPPING] Phí ship: 0đ (Thành phố Hồ Chí Minh, Trọng lượng: 380g)\n[12:46:37 2/12/2025] ⚠️ ĐỔI ĐỊA CHỈ: Thu thêm 7,500đ phí ship khi giao hàng (Đã TT VNPay 500,000đ)','Đã thanh toán',7500,0.00,NULL,'CHUA_HOAN',0),(326,NULL,'2025-12-03',891000,25,'Chờ xử lý',94075256,'VNPAY','123\n[PROMO] Mã: 3TXDYO0K; Giảm giá: 40,000đ\n[MEMBER] Giảm theo hạng Vàng: 49,000đ\n[LOYALTY] Hạng: Vàng\n[SHIPPING] Phí ship: 0đ (FREE SHIP - Mã: PBGHXD53)','Đã thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(327,NULL,'2025-12-06',1680000,19,'Chờ xử lý',94075270,'COD','34\n[LOYALTY] Hạng: Vàng\n[SHIPPING] Phí ship: 0đ (Thành phố Hồ Chí Minh, Trọng lượng: 4000g)','Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(328,NULL,'2025-12-08',15180000,24,'Chờ xử lý',94075285,'VNPAY','123\n[LOYALTY] Hạng: Đồng\n[SHIPPING] Phí ship: 0đ (Thành phố Hồ Chí Minh, Trọng lượng: 30000g)','Đã thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(329,NULL,'2025-12-08',440000,19,'Chờ xử lý',94075270,'VNPAY','123\n[LOYALTY] Hạng: Vàng\n[SHIPPING] Phí ship: 0đ (Thành phố Hồ Chí Minh, Trọng lượng: 380g)','Chưa thanh toán',0,0.00,NULL,'CHUA_HOAN',0),(330,NULL,'2025-12-08',1101000,18,'Chờ xử lý',94075271,'VNPAY','123\n[PROMO] Mã: PFSX2M0U; Giảm giá: 20,000đ\n[MEMBER] Giảm theo hạng Vàng: 59,000đ\n[LOYALTY] Hạng: Vàng\n[SHIPPING] Phí ship: 0đ (FREE SHIP - Mã: AMJCK9IO)','Đã thanh toán',0,0.00,NULL,'CHUA_HOAN',0);

UN

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `import_note`
--




UN

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
  `reset_token` varchar(255) DEFAULT NULL COMMENT 'Token để đặt lại mật khẩu',
  `reset_token_expires` datetime DEFAULT NULL COMMENT 'Thời gian hết hạn của reset token',
  `loyalty_points` int DEFAULT '0',
  `loyalty_tier` varchar(16) DEFAULT 'Đồng',
  PRIMARY KEY (`makh`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=26 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `khachhang`
--



INSERT INTO `khachhang` VALUES (1,'Nguyen Van A','0123456789','nguyenvana@exagmple.com','123 Đường Lê Lợi, Quận 1, TP.HCM','Hoạt động','$2a$10$1e5TbLVz5Ju/vgGCY2YAyucROUyHe8vAnsEM0TxTg3pdq.t.Sedfa',NULL,NULL,0,'Đồng'),(2,'Trần Thị Bích','0912345678','minhlufan21082004@gmail.com','45 Đường Hai Bà Trưng, Quận 3, TP.HCM','Hoạt động','$2a$10$4UbLhFDYjpUR3cj06Xkm7O0SdsQX5aVQSbeBJ/mmpJHAXLgdi4mja',NULL,NULL,0,'Đồng'),(3,'Nguyen Van A','0123456789','nguyenvana@ffexagmple.com','78 Đường Trần Hưng Đạo, Quận 5, TP.HCM','Hoạt động','$2a$10$DCudtGNrUs3lyxI36Vs4tuqLqZVCGu.v/T2z1lSiwI1jSIguiVQxu',NULL,NULL,0,'Đồng'),(4,'Phạm Thảo Duyên','0934567890','duyen.pham@example.com','12 Đường Cách Mạng Tháng 8, Quận 10, TP.HCM','Hoạt động','$2a$10$rPHDkd3dBhcEjdTsRwUc9uk3ozQzfSAXtm042pVH.//dsr4057jH2',NULL,NULL,0,'Đồng'),(5,'Võ Quốc Đạt','0945678901','dat.vo@example.com','234 Đường Nguyễn Thị Minh Khai, Quận 1, TP.HCM','Hoạt động','$2a$10$1pvzrfFCfVAW4GzjDOAcfeYj46RqJIEZxR.hxRBK/Y46gO.8CIeM2',NULL,NULL,0,'Đồng'),(6,'Hoai Bao','0374170367','admiggn@gmail.com','56 Đường Lý Thường Kiệt, Quận Tân Bình, TP.HCM','Hoạt động','$2a$10$GtVuImgIki3bzGT3/YsuIOKLfX4k4s17SgB5RdXpAKAgA2R/0zc4y',NULL,NULL,0,'Đồng'),(7,'Bùi Anh Khoa','0967890123','khoa.bui@example.com','89 Đường Hoàng Văn Thụ, Quận Phú Nhuận, TP.HCM','Hoạt động','$2a$10$Gc2DBEW3rgpFSoizKXKSGu0HXPL1jpfK6vmfIoaRi8biSaWEfxa76',NULL,NULL,0,'Đồng'),(8,'Ngô Thị Lan','0978901234','lan.ngo@example.com','101 Đường Nguyễn Văn Cừ, Quận 5, TP.HCM','Hoạt động','$2a$10$c3.5VGf/BVtbUTcZn1kUXOl3K9z7XrPszVtUBXYWXmiEC/RulcZoK',NULL,NULL,0,'Đồng'),(9,'Huỳnh Gia Minh','0989012345','minh.huynh@example.com','200 Đường Điện Biên Phủ, Quận Bình Thạnh, TP.HCM','Hoạt động','$2a$10$CUn.lysC/f4aNTKXTCi0keJUIv9O1KyNOEBOjbqnHE/2O3hsJZg86',NULL,NULL,0,'Đồng'),(12,'Hoai Bao','0374170367','ad2min@gmail.com',NULL,'Hoạt động',NULL,NULL,NULL,0,'Đồng'),(15,'nguyen van ba','1231231231','abc@gmail.com',NULL,'Hoạt động',NULL,NULL,NULL,0,'Đồng'),(16,'acccc','1112342348','abssdsdsdc@gmail.com',NULL,'Hoạt động',NULL,NULL,NULL,0,'Đồng'),(17,'acccc55','1112842348','abs22dsdc@gmail.com',NULL,'Hoạt động',NULL,NULL,NULL,0,'Đồng'),(18,'gbgb','0987654321','khangle0938573511@gmail.com',NULL,'Hoạt động','$2a$10$FKgDvStusGXrbM1RaXyp4.KUJPfcCqEuVLFxPQ7NNZAdUi.FdNnHq',NULL,NULL,32491,'Vàng'),(19,'hoai','0876564325','baohoaitran3112@gmail.com',NULL,'Hoạt động','$2a$10$PAinR5AsQNYqGhJ0IajZ4eZVG55WLgCEMaoebQYPN2EQjfRs/4cWS',NULL,NULL,37474,'Vàng'),(20,'abc',NULL,'khangle0828578293@gmail.com',NULL,'Hoạt động','$2a$10$yd7AKxXUag.EAV8Elp0iTeiX6yW/IBiyCbNnltgEwnJB3oHngxipu',NULL,NULL,0,'Đồng'),(21,'abc',NULL,'baomunt123456@gmail.com',NULL,'Hoạt động','$2a$10$isx50S3SAbnwiSM0fPZaUOaKHZa9nINcDEkKOmU3Nm5/K2lI5tJX6',NULL,NULL,29248,'Vàng'),(22,'Khach Hang 22 (Them moi)',NULL,'khachhang22@example.com',NULL,'Hoạt động','$2a$10$dummy_password_hash_22',NULL,NULL,0,'Đồng'),(23,'Khach Hang 23 (Them moi)',NULL,'khachhang23@example.com',NULL,'Hoạt động','$2a$10$dummy_password_hash_23',NULL,NULL,0,'Đồng'),(24,'Bao Hoai',NULL,'hoaibao4062004@gmail.com',NULL,'Hoạt động','$2a$10$/PokZYDJfM8XerOTWQoYdu3jLG1l6DZwrna1AQroYsfGOMYcaN1oO',NULL,NULL,16029,'Bạc'),(25,'abc',NULL,'minhkhang28042004@gmail.com',NULL,'Hoạt động','$2a$10$Ex.ZLHdnl0LHvwTD7BKdRuTz0wl/eW2yRJe6QlEsiDBkWpLc4mmX2',NULL,NULL,24535,'Vàng');

UN

--
-- Table structure for table `khachhang_khuyenmai`
--

DROP TABLE IF EXISTS `khachhang_khuyenmai`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `khachhang_khuyenmai` (
  `id` int NOT NULL AUTO_INCREMENT,
  `makh` int NOT NULL,
  `makm` int NOT NULL,
  `ngay_lay` date DEFAULT (curdate()),
  `ngay_het_han` date DEFAULT NULL,
  `trang_thai` enum('Chua_su_dung','Da_su_dung','Het_han') DEFAULT 'Chua_su_dung',
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_claim` (`makh`,`makm`),
  KEY `fk_khkm_khuyenmai` (`makm`),
  CONSTRAINT `fk_khkm_khachhang` FOREIGN KEY (`makh`) REFERENCES `khachhang` (`makh`) ON DELETE CASCADE,
  CONSTRAINT `fk_khkm_khuyenmai` FOREIGN KEY (`makm`) REFERENCES `khuyen_mai` (`MaKM`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=86 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `khachhang_khuyenmai`
--



INSERT INTO `khachhang_khuyenmai` VALUES (1,1,1,'2025-09-20','2025-09-30','Chua_su_dung'),(2,2,2,'2025-09-19','2025-09-29','Chua_su_dung'),(3,3,1,'2025-09-21','2025-10-01','Chua_su_dung'),(4,18,1,'2025-09-18','2025-09-28','Chua_su_dung'),(5,19,6,'2025-09-20','2025-10-05','Chua_su_dung'),(6,19,9,'2025-09-21','2025-10-31','Chua_su_dung'),(7,19,10,'2025-09-21','2025-09-23','Chua_su_dung'),(8,18,9,'2025-09-21','2025-10-31','Chua_su_dung'),(9,18,10,'2025-09-21','2025-09-23','Chua_su_dung'),(10,19,11,'2025-09-21','2025-09-28','Chua_su_dung'),(15,19,16,'2025-09-22','2025-09-29','Chua_su_dung'),(16,19,19,'2025-09-23','2025-09-30','Chua_su_dung'),(17,19,18,'2025-09-23','2025-09-30','Chua_su_dung'),(18,19,20,'2025-09-23','2025-09-30','Chua_su_dung'),(19,19,21,'2025-10-02','2025-10-11','Chua_su_dung'),(20,19,23,'2025-10-17','2025-10-31','Chua_su_dung'),(21,19,24,'2025-10-17','2025-10-31','Chua_su_dung'),(22,19,27,'2025-11-07','2025-12-07','Da_su_dung'),(23,19,29,'2025-11-07','2025-11-21','Da_su_dung'),(24,19,26,'2025-11-07','2025-11-08','Da_su_dung'),(25,19,30,'2025-11-07','2025-11-15','Chua_su_dung'),(26,18,26,'2025-11-07','2025-11-08','Chua_su_dung'),(27,18,31,'2025-11-07','2025-11-29','Da_su_dung'),(28,18,27,'2025-11-07','2025-12-07','Da_su_dung'),(29,18,29,'2025-11-07','2025-11-21','Da_su_dung'),(30,18,30,'2025-11-07','2025-11-15','Da_su_dung'),(31,18,32,'2025-11-07','2025-11-15','Da_su_dung'),(32,18,33,'2025-11-07','2025-11-14','Chua_su_dung'),(33,19,33,'2025-11-07','2025-11-14','Da_su_dung'),(34,19,32,'2025-11-07','2025-11-15','Da_su_dung'),(35,19,31,'2025-11-07','2025-11-29','Chua_su_dung'),(36,19,34,'2025-11-07','2025-11-15','Chua_su_dung'),(37,19,37,'2025-11-07','2025-11-15','Da_su_dung'),(38,25,27,'2025-11-11','2025-12-07','Da_su_dung'),(39,18,40,'2025-11-12','2025-11-12','Chua_su_dung'),(40,18,41,'2025-11-12','2025-11-20','Chua_su_dung'),(41,18,43,'2025-11-12',NULL,'Chua_su_dung'),(42,18,42,'2025-11-12','2025-11-15','Da_su_dung'),(43,18,35,'2025-11-12','2025-11-16','Da_su_dung'),(44,18,36,'2025-11-12','2025-11-14','Da_su_dung'),(45,19,43,'2025-11-12',NULL,'Chua_su_dung'),(46,19,44,'2025-11-12',NULL,'Chua_su_dung'),(47,18,44,'2025-11-12',NULL,'Chua_su_dung'),(49,19,41,'2025-11-14','2025-11-20','Chua_su_dung'),(51,19,42,'2025-11-14','2025-11-15','Chua_su_dung'),(59,19,47,'2025-11-29','2026-01-10','Da_su_dung'),(60,19,49,'2025-11-29',NULL,'Chua_su_dung'),(61,19,51,'2025-11-29',NULL,'Da_su_dung'),(62,19,52,'2025-11-29','2025-12-03','Da_su_dung'),(63,19,53,'2025-11-29','2025-12-04','Da_su_dung'),(64,19,54,'2025-11-29','2025-12-02','Da_su_dung'),(65,25,47,'2025-11-30','2026-01-10','Da_su_dung'),(66,25,50,'2025-11-30','2025-12-04','Da_su_dung'),(67,25,51,'2025-11-30',NULL,'Chua_su_dung'),(68,25,54,'2025-11-30','2025-12-02','Da_su_dung'),(69,21,51,'2025-11-30',NULL,'Chua_su_dung'),(70,21,47,'2025-11-30','2026-01-10','Da_su_dung'),(71,21,54,'2025-11-30','2025-12-02','Da_su_dung'),(72,21,53,'2025-11-30','2025-12-04','Da_su_dung'),(73,21,50,'2025-11-30','2025-12-04','Chua_su_dung'),(74,21,49,'2025-11-30','2025-12-06','Chua_su_dung'),(75,21,48,'2025-11-30','2025-12-31','Da_su_dung'),(76,21,55,'2025-11-30','2025-12-04','Da_su_dung'),(77,19,55,'2025-11-30','2025-12-04','Da_su_dung'),(78,19,50,'2025-11-30','2025-12-04','Da_su_dung'),(79,25,55,'2025-12-03','2025-12-04','Da_su_dung'),(80,25,53,'2025-12-03','2025-12-04','Da_su_dung'),(81,24,48,'2025-12-08','2025-12-31','Chua_su_dung'),(82,24,56,'2025-12-08','2025-12-18','Chua_su_dung'),(83,24,57,'2025-12-08','2025-12-18','Chua_su_dung'),(84,18,58,'2025-12-08','2025-12-12','Da_su_dung'),(85,18,57,'2025-12-08','2025-12-18','Da_su_dung');

UN

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
  `TrangThai` bit(1) DEFAULT b'1',
  `LoaiKM` enum('giam_phan_tram','giam_tien_mat','free_ship') NOT NULL COMMENT 'Loại khuyến mãi: giảm phần trăm, giảm tiền mặt, hoặc miễn phí vận chuyển',
  `Audience` enum('PUBLIC','FORM_ONLY','PRIVATE') NOT NULL DEFAULT 'PUBLIC',
  `IsClaimable` tinyint(1) NOT NULL DEFAULT '1',
  `NgayTao` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `Code` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`MaKM`),
  KEY `idx_code` (`Code`)
) ENGINE=InnoDB AUTO_INCREMENT=59 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `khuyen_mai`
--



INSERT INTO `khuyen_mai` VALUES (16,'MUA XUAN','SACH HAY','2025-09-22 00:00:00','2025-09-29 00:00:00',_binary '','giam_phan_tram','PUBLIC',1,'2025-09-22 05:49:37','F37PSEN0'),(18,'MUA XUAN nho nhỏ ','1234','2025-09-23 00:00:00','2025-09-30 00:00:00',_binary '','giam_phan_tram','PUBLIC',1,'2025-09-23 00:48:14','ICCCEJ71'),(19,'MUA XUAN nho nhỏ 1','fđffdfd','2025-09-23 00:00:00','2025-09-30 00:00:00',_binary '','giam_tien_mat','PUBLIC',1,'2025-09-23 00:49:42','38EWNNTB'),(20,'Trung thu sách hay ','trung thu và sách cho các em nhỏ ','2025-09-23 00:00:00','2025-09-30 00:00:00',_binary '','giam_phan_tram','PUBLIC',1,'2025-09-23 02:49:45','OQ9V4DZE'),(21,'TRUNG THU AP AM','CHUC MAI MAN','2025-10-02 00:00:00','2025-10-11 00:00:00',_binary '','giam_tien_mat','PUBLIC',1,'2025-10-02 09:58:57','PEC542R5'),(22,'Trung thu đẹp lắm','hãy cho bạn hãy vui vẻ ','2025-10-03 00:00:00','2025-10-11 00:00:00',_binary '','giam_tien_mat','PUBLIC',1,'2025-10-03 00:42:46','YIA2061B'),(23,'THÁNG 1O ĐẸP ĐẼ ','Mua Đi chờ chi ','2025-10-17 00:00:00','2025-10-31 00:00:00',_binary '','giam_phan_tram','PUBLIC',1,'2025-10-16 11:13:45','DEHLL78U'),(24,'MUA XUAN','123456','2025-10-16 00:00:00','2025-10-31 00:00:00',_binary '','giam_tien_mat','PUBLIC',1,'2025-10-16 11:18:19','00X2DGSF'),(25,'20/10 hạnh phúc','20/10 chuc bạn hạnh phúc','2025-10-20 00:00:00','2025-10-31 00:00:00',_binary '','giam_phan_tram','PUBLIC',1,'2025-10-20 02:06:58','ZK9A3W7W'),(26,'lễ hội hóa trang ','hãy mua sách đi nhé ','2025-10-31 00:00:00','2025-11-08 00:00:00',_binary '','giam_tien_mat','PUBLIC',1,'2025-10-31 13:16:48','1X2D7ZRJ'),(27,'Miễn phí vận chuyển cho đơn hàng từ 200K','Áp dụng cho tất cả đơn hàng có giá trị từ 200,000đ trở lên. Áp dụng cho cả nội thành và ngoại thành.','2025-11-07 12:38:08','2025-12-07 12:38:08',_binary '','free_ship','PUBLIC',1,'2025-11-07 04:38:08','FREESHIP200'),(29,'miễn phí đơn hàng ','mien phi van chuyen toan quoc','2025-11-07 00:00:00','2025-11-21 00:00:00',_binary '','free_ship','PUBLIC',1,'2025-11-07 04:43:28','5CF1HR93'),(30,'NOEL AP AM','SẲN PHẨM CHẮC LƯỢNG','2025-11-07 00:00:00','2025-11-15 00:00:00',_binary '','giam_phan_tram','PUBLIC',1,'2025-11-07 05:58:17','MY0SXRWJ'),(31,'lễ hội hóa trang ','các bạn hãy mua đi nào ','2025-11-07 00:00:00','2025-11-29 00:00:00',_binary '','giam_tien_mat','PUBLIC',1,'2025-11-07 06:47:12','6GFG7K5U'),(32,'Trung thu sách hay ','1233','2025-11-06 00:00:00','2025-11-15 00:00:00',_binary '','free_ship','PUBLIC',1,'2025-11-07 07:16:32','6HO1O77R'),(33,'lễ hội hóa trang 1212','123','2025-11-06 00:00:00','2025-11-14 00:00:00',_binary '','free_ship','PUBLIC',1,'2025-11-07 07:26:28','GGN00B6N'),(34,'TRẦN HOÀI BẢO ','1234','2025-11-06 00:00:00','2025-11-15 00:00:00',_binary '','giam_tien_mat','PUBLIC',1,'2025-11-07 11:35:24','MRHHOL4S'),(35,'Trung thu sách hay ','123','2025-11-08 00:00:00','2025-11-16 00:00:00',_binary '','giam_tien_mat','PUBLIC',1,'2025-11-07 12:28:14','3IXLZAAD'),(36,'jhgf','123','2025-11-08 00:00:00','2025-11-14 00:00:00',_binary '','giam_tien_mat','PUBLIC',1,'2025-11-07 12:29:38','IDMLBQAS'),(37,'Trung thu sách hay 111','1234','2025-11-06 00:00:00','2025-11-15 00:00:00',_binary '','giam_tien_mat','PUBLIC',1,'2025-11-07 12:33:11','95YF5CZE'),(38,'MUA XUAN nho nhỏ NHE NHÉ','1234','2025-11-03 00:00:00','2025-11-22 00:00:00',_binary '','giam_tien_mat','PUBLIC',1,'2025-11-07 12:43:09','ZS5W6X1F'),(39,'MUA XUAN','1234','2025-11-07 00:00:00','2025-11-14 00:00:00',_binary '','free_ship','PUBLIC',1,'2025-11-08 02:12:08','WC2HR8H1'),(40,'Trung thu sách hay 12345','1323','2025-11-10 00:00:00','2025-11-12 00:00:00',_binary '','free_ship','PUBLIC',1,'2025-11-11 15:42:32','H6RAJ08P'),(41,'Trung thu sách hay ',NULL,'2025-11-11 00:00:00','2025-11-20 00:00:00',_binary '','free_ship','FORM_ONLY',1,'2025-11-12 01:44:18','DK6LOIH9'),(42,'MÃ FREE NÀY CHO KHÁCH HÀNG ĐIỀN FORM','1234567','2025-11-11 00:00:00','2025-11-15 00:00:00',_binary '','free_ship','PRIVATE',1,'2025-11-12 03:20:14','70VNGK12'),(43,'TRẦN HOÀI BẢO NHÉ','123456','2025-11-11 00:00:00','2025-11-15 00:00:00',_binary '','free_ship','PRIVATE',1,'2025-11-12 04:57:06','5UCZVQ4A'),(44,'FORM NHẬN MÃ ','HẸ HẸ','2025-11-11 00:00:00','2025-11-19 00:00:00',_binary '\0','free_ship','PRIVATE',1,'2025-11-12 06:04:30','EVBH7RDR'),(47,'Noel An Lanh','Chuc Qúy Khách có mùa sáng sinh vui vẻ','2025-11-29 00:00:00','2026-01-10 00:00:00',_binary '','giam_tien_mat','PUBLIC',1,'2025-11-29 02:29:25','DFY1CP15'),(48,'Xuân An Lành','Tết vui vẻ ','2025-11-29 00:00:00','2025-12-31 00:00:00',_binary '','giam_tien_mat','PUBLIC',1,'2025-11-29 02:33:01','YBSNVOGV'),(49,'FREE SHIP NHÉ MN ','123','2025-11-29 00:00:00','2025-12-06 00:00:00',_binary '','free_ship','PUBLIC',1,'2025-11-29 05:33:41','05A5YAS3'),(50,'MUA XUAN','123','2025-11-29 00:00:00','2025-12-04 00:00:00',_binary '','free_ship','FORM_ONLY',1,'2025-11-29 05:34:30','3Z54J5UO'),(51,'jhgf','12345','2025-11-28 00:00:00','2025-12-02 00:00:00',_binary '','free_ship','PRIVATE',1,'2025-11-29 05:53:01','P9ADIL0D'),(52,'Trung thu sách hay 11111','1111','2025-11-28 00:00:00','2025-12-03 00:00:00',_binary '','free_ship','PUBLIC',1,'2025-11-29 06:01:44','DYOHNLHW'),(53,'Trung thu sách hay 22222','23456','2025-11-29 00:00:00','2025-12-04 00:00:00',_binary '','free_ship','PUBLIC',1,'2025-11-29 06:10:52','PBGHXD53'),(54,'123','12345','2025-11-29 00:00:00','2025-12-02 00:00:00',_binary '','giam_tien_mat','PUBLIC',1,'2025-11-29 06:29:19','49G99FYC'),(55,'NOLE NHE S','12345','2025-11-29 00:00:00','2025-12-04 00:00:00',_binary '','giam_tien_mat','PUBLIC',1,'2025-11-30 10:02:16','3TXDYO0K'),(56,'Tet Tay Vui Ve','giảm giá tiền nha mọi người','2025-12-07 00:00:00','2025-12-18 00:00:00',_binary '','giam_tien_mat','PUBLIC',1,'2025-12-08 12:05:18','YR3L022I'),(57,'mã free ship cho mọi người','moi mọi người nhận lấy ','2025-12-07 00:00:00','2025-12-18 00:00:00',_binary '','free_ship','PUBLIC',1,'2025-12-08 12:06:27','AMJCK9IO'),(58,'Trung thu sách hay ','123','2025-12-07 00:00:00','2025-12-12 00:00:00',_binary '','giam_tien_mat','PUBLIC',1,'2025-12-08 12:12:21','PFSX2M0U');

UN

--
-- Table structure for table `lich_su_tra_hang`
--

DROP TABLE IF EXISTS `lich_su_tra_hang`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `lich_su_tra_hang` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tra_hang_id` int NOT NULL,
  `trang_thai_cu` varchar(50) DEFAULT NULL,
  `trang_thai_moi` varchar(50) DEFAULT NULL,
  `nguoi_thuc_hien` varchar(100) DEFAULT NULL,
  `ghi_chu` text,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `tra_hang_id` (`tra_hang_id`),
  CONSTRAINT `fk_tra_hang` FOREIGN KEY (`tra_hang_id`) REFERENCES `tra_hang` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=68 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `lich_su_tra_hang`
--



INSERT INTO `lich_su_tra_hang` VALUES (1,1,NULL,'da_bao_cao','1','test','2025-10-08 09:15:53'),(2,2,NULL,'da_bao_cao','19','fg','2025-10-08 09:16:30'),(9,2,'da_bao_cao','chap_thuan',NULL,NULL,'2025-10-08 10:19:54'),(10,2,'chap_thuan','tu_choi',NULL,NULL,'2025-10-08 13:04:47'),(11,2,'tu_choi','chap_thuan',NULL,NULL,'2025-10-08 13:04:51'),(12,1,'da_bao_cao','chap_thuan',NULL,NULL,'2025-10-08 13:04:59'),(13,2,NULL,NULL,NULL,'Đính kèm 1 file','2025-10-08 13:52:46'),(14,3,NULL,'da_bao_cao','19','san phaam bi hu roi','2025-10-08 13:56:43'),(15,3,NULL,NULL,NULL,'Đính kèm 1 file','2025-10-08 13:56:43'),(16,3,'da_bao_cao','chap_thuan',NULL,NULL,'2025-10-08 13:57:18'),(17,4,NULL,'da_bao_cao','19','he hẹ','2025-10-08 15:46:10'),(18,4,NULL,NULL,NULL,'Đính kèm 1 file','2025-10-08 15:46:10'),(19,4,'da_bao_cao','chap_thuan',NULL,NULL,'2025-10-08 15:46:29'),(20,5,NULL,'da_bao_cao','19','đơn hang sách bị lỗi','2025-10-08 17:39:00'),(21,5,NULL,NULL,NULL,'Đính kèm 1 file','2025-10-08 17:39:00'),(22,5,'da_bao_cao','chap_thuan',NULL,NULL,'2025-10-08 17:39:19'),(23,6,NULL,'da_bao_cao','19','1234','2025-10-08 18:08:08'),(24,6,NULL,NULL,NULL,'Đính kèm 1 file','2025-10-08 18:08:08'),(25,6,'da_bao_cao','chap_thuan',NULL,NULL,'2025-10-08 18:08:18'),(26,7,NULL,'da_bao_cao','19','1234','2025-10-08 19:47:38'),(27,7,NULL,NULL,NULL,'Đính kèm 1 file','2025-10-08 19:47:39'),(28,7,'da_bao_cao','chap_thuan',NULL,NULL,'2025-10-08 19:47:51'),(29,8,NULL,'da_bao_cao','19','hẹ hẹ','2025-10-08 20:31:52'),(30,8,NULL,NULL,NULL,'Đính kèm 1 file','2025-10-08 20:31:52'),(31,8,'da_bao_cao','chap_thuan',NULL,NULL,'2025-10-08 20:32:08'),(32,9,NULL,'da_bao_cao','19','1234444','2025-10-08 21:08:06'),(33,9,NULL,NULL,NULL,'Đính kèm 1 file','2025-10-08 21:08:06'),(34,9,'da_bao_cao','chap_thuan',NULL,NULL,'2025-10-08 21:08:15'),(35,10,NULL,'da_bao_cao','19','trả hàng','2025-10-09 10:17:28'),(36,10,NULL,NULL,NULL,'Đính kèm 1 file','2025-10-09 10:17:28'),(37,10,'da_bao_cao','chap_thuan',NULL,NULL,'2025-10-09 10:17:36'),(38,11,NULL,'da_bao_cao','19','trar hang nha','2025-10-09 11:09:31'),(39,11,NULL,NULL,NULL,'Đính kèm 1 file','2025-10-09 11:09:31'),(40,11,'da_bao_cao','chap_thuan',NULL,NULL,'2025-10-09 11:09:40'),(41,12,NULL,'da_bao_cao','19','12345','2025-10-09 11:19:29'),(42,12,NULL,NULL,NULL,'Đính kèm 1 file','2025-10-09 11:19:29'),(43,12,'da_bao_cao','chap_thuan',NULL,NULL,'2025-10-09 11:19:41'),(44,13,NULL,'da_bao_cao','19','1233321','2025-10-09 13:41:22'),(45,13,NULL,NULL,NULL,'Đính kèm 1 file','2025-10-09 13:41:22'),(46,13,'da_bao_cao','chap_thuan',NULL,NULL,'2025-10-09 13:41:32'),(47,14,NULL,'da_bao_cao','19','1233333','2025-10-09 14:05:42'),(48,14,NULL,NULL,NULL,'Đính kèm 1 file','2025-10-09 14:05:42'),(49,14,'da_bao_cao','chap_thuan',NULL,NULL,'2025-10-09 14:05:52'),(50,15,NULL,'da_bao_cao','19','11','2025-10-09 14:11:45'),(51,15,NULL,NULL,NULL,'Đính kèm 1 file','2025-10-09 14:11:45'),(52,15,'da_bao_cao','chap_thuan',NULL,NULL,'2025-10-09 14:11:53'),(53,16,NULL,'da_bao_cao','19','ACX','2025-10-09 16:46:55'),(54,16,NULL,NULL,NULL,'Đính kèm 1 file','2025-10-09 16:46:55'),(55,16,'da_bao_cao','chap_thuan',NULL,NULL,'2025-10-09 16:47:06'),(56,17,NULL,'da_bao_cao','19','12321','2025-10-10 07:33:43'),(57,17,NULL,NULL,NULL,'Đính kèm 1 file','2025-10-10 07:33:43'),(58,17,'da_bao_cao','chap_thuan',NULL,NULL,'2025-10-10 07:33:56'),(59,18,NULL,'da_bao_cao','19','1234','2025-10-12 08:24:12'),(60,18,NULL,NULL,NULL,'Đính kèm 1 file','2025-10-12 08:24:12'),(61,18,'da_bao_cao','chap_thuan',NULL,NULL,'2025-10-12 08:30:07'),(62,19,NULL,'da_bao_cao','18','hang bi hu','2025-10-13 13:13:19'),(63,19,NULL,NULL,NULL,'Đính kèm 1 file','2025-10-13 13:13:19'),(64,19,'da_bao_cao','chap_thuan',NULL,NULL,'2025-10-13 13:14:44'),(65,20,NULL,'da_bao_cao','25','Sản phẩm hư','2025-11-30 11:37:21'),(66,20,NULL,NULL,NULL,'Đính kèm 1 file','2025-11-30 11:37:21'),(67,20,'da_bao_cao','chap_thuan',NULL,NULL,'2025-11-30 11:37:39');

UN

--
-- Table structure for table `luachon_cauhoi`
--

DROP TABLE IF EXISTS `luachon_cauhoi`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `luachon_cauhoi` (
  `MaLuaChon` int NOT NULL AUTO_INCREMENT,
  `MaCauHoi` int NOT NULL,
  `NoiDungLuaChon` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Nội dung lựa chọn hiển thị',
  `MaTL` int DEFAULT NULL COMMENT 'Map với bảng theloai',
  `MaTG` int DEFAULT NULL COMMENT 'Map với bảng tacgia',
  `HinhThuc` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Bìa cứng, Bìa mềm, Ebook...',
  `MaKhoangGia` enum('LT100','100-200','200-300','300-400','400-500','500-700','700-1000','1000-2000','300-500','GT500','GT2000') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Mã khoảng giá',
  `NamXBTu` int DEFAULT NULL COMMENT 'Năm XB từ',
  `NamXBDen` int DEFAULT NULL COMMENT 'Năm XB đến',
  `SoTrangTu` int DEFAULT NULL COMMENT 'Số trang từ',
  `SoTrangDen` int DEFAULT NULL COMMENT 'Số trang đến',
  `TrongSo` decimal(6,2) DEFAULT '1.00' COMMENT 'Trọng số cho chấm điểm',
  `ThuTu` int DEFAULT '0' COMMENT 'Thứ tự hiển thị',
  PRIMARY KEY (`MaLuaChon`),
  KEY `MaTL` (`MaTL`),
  KEY `MaTG` (`MaTG`),
  KEY `idx_macauhoi` (`MaCauHoi`),
  CONSTRAINT `luachon_cauhoi_ibfk_1` FOREIGN KEY (`MaCauHoi`) REFERENCES `cauhoi_sothich` (`MaCauHoi`) ON DELETE CASCADE,
  CONSTRAINT `luachon_cauhoi_ibfk_2` FOREIGN KEY (`MaTL`) REFERENCES `theloai` (`MaTL`) ON DELETE SET NULL,
  CONSTRAINT `luachon_cauhoi_ibfk_3` FOREIGN KEY (`MaTG`) REFERENCES `tacgia` (`MaTG`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=94 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Lựa chọn trả lời cho mỗi câu hỏi';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `luachon_cauhoi`
--



INSERT INTO `luachon_cauhoi` VALUES (1,1,'Văn học',1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,2.00,1),(2,1,'Khoa học viễn tưởng',2,NULL,NULL,NULL,NULL,NULL,NULL,NULL,2.00,2),(3,1,'Huyền bí',3,NULL,NULL,NULL,NULL,NULL,NULL,NULL,2.00,3),(4,1,'Lịch sử',4,NULL,NULL,NULL,NULL,NULL,NULL,NULL,2.00,4),(5,1,'Trinh thám',5,NULL,NULL,NULL,NULL,NULL,NULL,NULL,2.00,5),(6,1,'Khoa học',6,NULL,NULL,NULL,NULL,NULL,NULL,NULL,2.00,6),(7,1,'Tôn giáo và tâm linh',7,NULL,NULL,NULL,NULL,NULL,NULL,NULL,2.00,7),(8,1,'Self-help',8,NULL,NULL,NULL,NULL,NULL,NULL,NULL,2.00,8),(9,1,'Ngôn tình',9,NULL,NULL,NULL,NULL,NULL,NULL,NULL,2.00,9),(10,1,'Tiểu thuyết',10,NULL,NULL,NULL,NULL,NULL,NULL,NULL,2.00,10),(16,2,'Nguyễn Nhật Ánh',NULL,1,NULL,NULL,NULL,NULL,NULL,NULL,1.50,1),(17,2,'Tô Hoài',NULL,2,NULL,NULL,NULL,NULL,NULL,NULL,1.50,2),(18,2,'Nam Cao',NULL,3,NULL,NULL,NULL,NULL,NULL,NULL,1.50,3),(19,2,' PGS.TS. Bùi Mạnh Hùng',NULL,4,NULL,NULL,NULL,NULL,NULL,NULL,1.50,4),(20,2,'Xuân Diệu',NULL,5,NULL,NULL,NULL,NULL,NULL,NULL,1.50,5),(21,2,' Isao Takahata',NULL,6,NULL,NULL,NULL,NULL,NULL,NULL,1.50,6),(22,2,'William Shakespeare',NULL,7,NULL,NULL,NULL,NULL,NULL,NULL,1.50,7),(23,2,'George Orwell',NULL,8,NULL,NULL,NULL,NULL,NULL,NULL,1.50,8),(24,2,'Harper Lee',NULL,9,NULL,NULL,NULL,NULL,NULL,NULL,1.50,9),(25,2,'F. Scott Fitzgerald',NULL,10,NULL,NULL,NULL,NULL,NULL,NULL,1.50,10),(26,2,'Aldous Huxley',NULL,11,NULL,NULL,NULL,NULL,NULL,NULL,1.50,11),(27,2,'Eckhart Tolle',NULL,12,NULL,NULL,NULL,NULL,NULL,NULL,1.50,12),(28,2,'James Redfield',NULL,13,NULL,NULL,NULL,NULL,NULL,NULL,1.50,13),(29,2,'C.S. Lewis',NULL,14,NULL,NULL,NULL,NULL,NULL,NULL,1.50,14),(30,2,'Benjamin Hoff',NULL,15,NULL,NULL,NULL,NULL,NULL,NULL,1.50,15),(31,3,'Dưới 100.000đ',NULL,NULL,NULL,'LT100',NULL,NULL,NULL,NULL,1.00,1),(32,3,'100.000đ - 200.000đ',NULL,NULL,NULL,'100-200',NULL,NULL,NULL,NULL,1.00,2),(33,3,'200.000đ - 300.000đ',NULL,NULL,NULL,'200-300',NULL,NULL,NULL,NULL,1.00,3),(34,3,'300.000đ - 500.000đ',NULL,NULL,NULL,'300-500',NULL,NULL,NULL,NULL,1.00,4),(35,3,'Trên 500.000đ',NULL,NULL,NULL,'GT500',NULL,NULL,NULL,NULL,1.00,5),(36,4,'Bìa cứng',NULL,NULL,'Bìa cứng',NULL,NULL,NULL,NULL,NULL,1.20,1),(37,4,'Bìa mềm',NULL,NULL,'Bìa mềm',NULL,NULL,NULL,NULL,NULL,1.20,2),(38,4,'Bìa gáy xoắn',NULL,NULL,'Bìa gáy xoắn',NULL,NULL,NULL,NULL,NULL,1.00,3),(39,4,'Ebook',NULL,NULL,'Ebook',NULL,NULL,NULL,NULL,NULL,1.00,4),(40,5,'Sách mới (2023-2025)',NULL,NULL,NULL,NULL,2023,2025,NULL,NULL,1.50,1),(41,5,'Gần đây (2020-2022)',NULL,NULL,NULL,NULL,2020,2022,NULL,NULL,1.20,2),(42,5,'Kinh điển (trước 2020)',NULL,NULL,NULL,NULL,1900,2019,NULL,NULL,1.00,3),(43,6,'Mỏng nhẹ (< 200 trang)',NULL,NULL,NULL,NULL,NULL,NULL,1,200,1.00,1),(44,6,'Trung bình (200-400 trang)',NULL,NULL,NULL,NULL,NULL,NULL,200,400,1.00,2),(45,6,'Dày (> 400 trang)',NULL,NULL,NULL,NULL,NULL,NULL,400,9999,1.00,3),(46,7,'tiểu thuyết ',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,1.00,0),(47,7,'khoa học',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,1.00,2),(48,7,'tiểu thuyết ',12,NULL,NULL,NULL,NULL,NULL,NULL,NULL,1.00,0),(49,8,'tiểu thuyết ',NULL,NULL,'Bìa mềm',NULL,NULL,NULL,NULL,NULL,1.00,0),(50,9,'tiểu thuyết ',10,NULL,NULL,NULL,NULL,NULL,NULL,NULL,1.00,0),(51,9,'khoa học',6,NULL,NULL,NULL,NULL,NULL,NULL,NULL,1.00,0),(52,9,'VIỄN TƯỞNG',11,NULL,NULL,NULL,NULL,NULL,NULL,NULL,1.00,0),(53,11,'SÁCH GIẢM GIÁ NHIỀU LẮM',NULL,NULL,NULL,'100-200',NULL,NULL,NULL,NULL,1.00,0),(54,11,'HẸ HẸ ',NULL,NULL,NULL,'200-300',NULL,NULL,NULL,NULL,1.00,0),(55,12,'tiểu thuyết ',NULL,NULL,NULL,'200-300',NULL,NULL,NULL,NULL,1.00,0),(56,12,'SÁCH GIẢM GIÁ NHIỀU LẮM',NULL,NULL,NULL,'GT500',NULL,NULL,NULL,NULL,1.00,0),(57,13,'tiểu thuyết ',NULL,NULL,NULL,NULL,2020,2025,NULL,NULL,1.00,0),(58,14,'SÁCH GIẢM GIÁ NHIỀU LẮM',NULL,NULL,NULL,NULL,NULL,NULL,2,200,1.00,0),(59,13,'trần hoài bảo',NULL,NULL,NULL,NULL,2020,2025,NULL,NULL,1.00,0),(60,14,'trần hoài bảo',NULL,NULL,NULL,NULL,NULL,NULL,50,200,1.00,0),(61,15,'tiểu thuyết ',10,NULL,NULL,NULL,NULL,NULL,NULL,NULL,1.00,0),(62,15,'khoa học',6,NULL,NULL,NULL,NULL,NULL,NULL,NULL,2.00,0),(63,16,'khoảng 400-1000',NULL,NULL,NULL,'200-300',NULL,NULL,NULL,NULL,1.00,0),(64,16,'SÁCH GIẢM GIÁ NHIỀU LẮM',NULL,NULL,NULL,'GT500',NULL,NULL,NULL,NULL,1.00,0),(65,18,'BÌA NÀO BẠN THIHCS HƠN ',NULL,NULL,'Bìa mềm',NULL,NULL,NULL,NULL,NULL,1.00,0),(66,18,'BÌA MỀM THÌ SAO ',NULL,NULL,'Bìa mềm',NULL,NULL,NULL,NULL,NULL,1.00,0),(67,19,'tiểu thuyết ',10,NULL,NULL,NULL,NULL,NULL,NULL,NULL,1.00,0),(68,19,'khoa học',15,NULL,NULL,NULL,NULL,NULL,NULL,NULL,1.00,0),(69,19,'VIỄN TƯỞNG',2,NULL,NULL,NULL,NULL,NULL,NULL,NULL,1.00,0),(70,21,'tiểu thuyết ',12,NULL,NULL,NULL,NULL,NULL,NULL,NULL,1.00,1),(71,21,'sách viễn tưởng',11,NULL,NULL,NULL,NULL,NULL,NULL,NULL,1.00,0),(72,22,'giá sách',NULL,NULL,NULL,'100-200',NULL,NULL,NULL,NULL,1.00,0),(73,23,'SÁCH GIẢM GIÁ NHIỀU LẮM',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,1.00,0),(74,24,'tiểu thuyết ',NULL,NULL,NULL,'300-400',NULL,NULL,NULL,NULL,1.00,0),(75,25,'tiểu thuyết ',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,1.00,0),(76,26,'khoa học',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,1.00,0),(77,27,'SÁCH GIẢM GIÁ NHIỀU LẮM',NULL,NULL,NULL,NULL,NULL,NULL,1,200,20.00,1),(78,27,'TRANG SÁCH',NULL,NULL,NULL,NULL,NULL,NULL,1,400,1.00,0),(81,28,'100ĐÊN200',NULL,NULL,NULL,'100-200',NULL,NULL,NULL,NULL,20.00,0),(82,28,'200-500',NULL,NULL,NULL,'400-500',NULL,NULL,NULL,NULL,1.00,0),(83,29,'tiểu thuyết ',10,NULL,NULL,NULL,NULL,NULL,NULL,NULL,1.00,0),(84,29,'Khoa học',15,NULL,NULL,NULL,NULL,NULL,NULL,NULL,1.00,0),(85,30,'Giam 100k',NULL,NULL,NULL,'100-200',NULL,NULL,NULL,NULL,1.00,0),(86,30,'Giam 200',NULL,NULL,NULL,'200-300',NULL,NULL,NULL,NULL,1.00,0),(87,31,'HẸ HẸ ',NULL,NULL,NULL,'500-700',NULL,NULL,NULL,NULL,1.00,0),(88,32,'THẬT SỰ THÍCH ',NULL,NULL,'Bìa mềm',NULL,NULL,NULL,NULL,NULL,1.00,0),(89,32,'HẸ HẸ ',NULL,NULL,'Bìa cứng',NULL,NULL,NULL,NULL,NULL,1.00,0),(90,33,'tiểu thuyết ',NULL,NULL,'Bìa mềm',NULL,NULL,NULL,NULL,NULL,1.00,0),(91,33,'tiểu thuyết ',NULL,NULL,'Bìa cứng',NULL,NULL,NULL,NULL,NULL,1.00,0),(92,34,'tiểu thuyết ',NULL,NULL,NULL,NULL,2024,2025,NULL,NULL,1.00,0),(93,34,'VIỄN TƯỞNG',NULL,NULL,NULL,NULL,2024,2025,NULL,NULL,1.00,0);

UN

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
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `luong`
--



INSERT INTO `luong` VALUES (1,'1',6,2025,8000000.00,500000.00,1000000.00,0.00,9500000.00,'Da_tra'),(2,'2',6,2025,7500000.00,400000.00,500000.00,200000.00,7800000.00,'Da_tra'),(3,'3',6,2025,9000000.00,600000.00,0.00,0.00,9600000.00,'Chua_tra'),(4,'4',6,2025,8500000.00,300000.00,200000.00,100000.00,8600000.00,'Da_tra'),(5,'5',6,2025,7000000.00,200000.00,0.00,0.00,7200000.00,'Chua_tra'),(6,'6',6,2025,9500000.00,700000.00,500000.00,0.00,10700000.00,'Da_tra'),(7,'7',6,2025,8000000.00,500000.00,0.00,0.00,8500000.00,'Chua_tra'),(8,'8',6,2025,7800000.00,400000.00,300000.00,0.00,8500000.00,'Da_tra'),(10,'7',9,2025,10000000.00,500000.00,200000.00,0.00,10700000.00,'Chua_tra'),(11,'6',9,2025,10000000.00,0.00,0.00,0.00,14403409.00,'Da_tra'),(12,'2',9,2025,10000000.00,0.00,0.00,681818.18,19119318.00,'Da_tra'),(13,'4',5,2025,10000000.00,500000.00,0.00,409090.91,10090900.00,'Da_tra'),(14,'8',9,2025,10000000.00,200000.00,0.00,1772727.27,8427300.00,'Da_tra'),(15,'7',10,2025,10000000.00,100000.00,0.00,0.00,10100000.00,'Da_tra'),(16,'2',10,2025,10000000.00,9999.00,0.00,1818181.82,8191800.00,'Da_tra'),(17,'6',10,2025,10000000.00,500000.00,0.00,2272727.27,8227300.00,'Da_tra'),(18,'3',10,2025,10000000.00,49999.00,0.00,909090.91,9140900.00,'Da_tra'),(19,'8',10,2025,10000000.00,0.00,0.00,0.00,10000000.00,'Da_tra'),(20,'2',11,2025,10000000.00,0.00,0.00,5000000.00,5000000.00,'Da_tra'),(21,'2',12,2025,10000000.00,199999.00,0.00,454545.45,9745500.00,'Da_tra'),(22,'6',11,2025,10000000.00,200000.00,0.00,3636363.64,6563600.00,'Da_tra'),(23,'7',11,2025,10000000.00,200000.00,0.00,2272727.27,7927300.00,'Da_tra'),(24,'4',1,2025,10000000.00,49998.00,500000.00,0.00,10550000.00,'Da_tra');

UN

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `material`
--




UN

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
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `module`
--



INSERT INTO `module` VALUES (1,'homepage'),(2,'sale'),(3,'warehouse'),(4,'statistics'),(5,'discounts'),(6,'promotions'),(7,'receipts'),(8,'export_notes'),(9,'import_notes'),(10,'products'),(11,'suppliers'),(12,'customers'),(13,'staffs'),(14,'accounts'),(15,'decentralization');

UN

--
-- Table structure for table `ngay_le`
--

DROP TABLE IF EXISTS `ngay_le`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ngay_le` (
  `id` int NOT NULL AUTO_INCREMENT,
  `ngay` date NOT NULL,
  `ten_le` varchar(100) DEFAULT NULL,
  `is_nghi` bit(1) DEFAULT b'1',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ngay_le`
--




UN

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
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `nhacungcap`
--



INSERT INTO `nhacungcap` VALUES (1,'Công ty TNHH Hoa Mai','0901234567','123 Lê Lợi, Q.1, TP.HCM',_binary ''),(2,'Công ty CP Thái Bình','0912345678','45 Trần Phú, TP. Thái Bình',_binary ''),(3,'Công ty TNHH Ánh Dương','0923456789','12 Nguyễn Huệ, Q.1, TP.HCM',_binary ''),(4,'Công ty TNHH Kim Long','0934567890','98 Lý Thường Kiệt, Đà Nẵng',_binary ''),(5,'Công ty TNHH Minh Tâm','0945678901','15 Hai Bà Trưng, Hà Nội',_binary '\0'),(6,'Công ty TNHH Đại Phát','0956789012','78 Phạm Văn Đồng, TP.HCM',_binary ''),(7,'test','0987654321','hcmew',_binary '');

UN

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
  `Anh` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`MaNV`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `nhanvien`
--



INSERT INTO `nhanvien` VALUES ('1','Nguyễn Văn A','0987654321','Nam','Hà Nội','nguyenvana@email.com','Active',NULL),('10','Lý Thị K','0987654320','Nam','Thanh Hóa','lythik@email.com','Active',NULL),('12','TRDFS','0143567876','Nam','gfgfgfgfg','acb@gmail.com','Active',NULL),('2','Trần Thị B','0912345678','Nữ','Hồ Chí Minh','tranthib@email.com','Active','anhnv02.jpg'),('3','Lê Văn C','0978123456','Nam','Đà Nẵng','levanc@email.com','1','/uploads/nhanvien/1763654007871-721019381.png'),('4','Phạm Thị D','0967891234','Nam','Hải Phòng','phamthid@email.com','Active','anhnv04.jpg'),('5','Hoàng Văn E','0956789123','Nam','Cần Thơ','hoangvane@email.com','Active',NULL),('6','Vũ Thị F','0945678912','Nữ','Bình Dương','vuthif@email.com','Active',NULL),('7','Đặng Văn G','0934567891','Nam','Đồng Nai','baohoaitran3112@gmail.com','Active','anhnv07.jpg'),('8','Bùi Thị H','0923456789','Nữ','Hà Tĩnh','buithih@email.com','Active',NULL),('9','Mai Văn I','0912345670','Nam','Nghệ An','maivani@email.com','Active',NULL);

UN

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
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `nhomquyen`
--



INSERT INTO `nhomquyen` VALUES (1,'Quản trị viên','Quản trị hệ thống',_binary ''),(2,'Nhân viên khủ Kho','Vai trò quản lý',_binary ''),(3,'Nhân viên xử lý đơn','Vai trò bán hàng',_binary ''),(4,'Nhân viên thủ kho','Vai trò quản lý kho',_binary ''),(5,'hẹ hẹ','tràn hoài bảo',_binary '');

UN

--
-- Table structure for table `otp_requests`
--

DROP TABLE IF EXISTS `otp_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `otp_requests` (
  `id` int NOT NULL AUTO_INCREMENT,
  `email` varchar(255) NOT NULL,
  `otp` varchar(6) DEFAULT NULL,
  `token` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `expires_at` datetime DEFAULT NULL,
  `type` enum('register','forgot-password') NOT NULL DEFAULT 'register',
  PRIMARY KEY (`id`),
  UNIQUE KEY `email_token` (`email`,`token`)
) ENGINE=InnoDB AUTO_INCREMENT=55 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `otp_requests`
--



INSERT INTO `otp_requests` VALUES (1,'baohoaitran3112@gmail.com','532299','04b1fd28357fbfb720855d2fd605585a1033eb241c5ab4bb196e3cb7b4ebfcbc','2025-09-12 03:52:30',NULL,'forgot-password'),(2,'baohoaitran3112@gmail.com','231667','c5367a8d49d299628baf402d04db86b93f6a22678da0449bc5f36c62871acb44','2025-09-12 04:02:03',NULL,'forgot-password'),(3,'baohoaitran3112@gmail.com','708981','6f0ba31ee497e36b96ff9c6250aa3f9f2fa950dd69f4ad01a531485c32e89aba','2025-09-12 04:04:39',NULL,'forgot-password'),(4,'baohoaitran3112@gmail.com','315136','0430d1a3211bc916e036d66f4d34d52c06e91d2363dc01712a84c9d9ae5b5dad','2025-09-12 04:07:27',NULL,'forgot-password'),(5,'baohoaitran3112@gmail.com','485112','7246945d6bc7aba4ec24d276a0d3524cefc90b635d0dd2e7d3c2aa2dc8531c52','2025-09-12 04:08:22',NULL,'forgot-password'),(6,'baohoaitran3112@gmail.com','789714','ea86f9863eb05719df5b35db03d551a04b04797d9e9d9efad7a405c33410c05e','2025-09-12 04:41:34',NULL,'forgot-password'),(10,'baohoaitran3112@gmail.com','419113','b71771b59a5bb59a04f467dc10a54d343fe98d4eb5735ed563d4801c9b8eeaef','2025-09-12 04:24:37',NULL,'forgot-password'),(11,'baohoaitran3112@gmail.com','217988','dcfe672a459379b979467271a6d9e335ac7d6d31fd779e2779521b1eaecc8f74','2025-09-12 04:31:27',NULL,'forgot-password'),(12,'baohoaitran3112@gmail.com','179080','7c16e380c31ee404f8047bc072aacdca2513d3979b8a75d95de59658faba696c','2025-09-12 04:35:30',NULL,'forgot-password'),(13,'baohoaitran3112@gmail.com','988936','47c253ddb712d88819af32a2b13688e620afff9d4961b59399394e4614028d3c','2025-09-12 04:37:33',NULL,'forgot-password'),(14,'baohoaitran3112@gmail.com','479992','632f370a7024411fcf2571a26a85c30ef3ec4e9e5685fe80e49981aa8faf9c49','2025-09-15 09:49:04',NULL,'forgot-password'),(15,'baohoaitran3112@gmail.com','532629','57f8e5c42f096d87b847657fd3d7494651802b9689122c73e39535d09e07a0c1','2025-09-15 09:49:47',NULL,'forgot-password'),(18,'baohoaitran3112@gmail.com','453602','4d81d21ca8f23699f49b54041902ebca43c7864c4f54fd726a4998ffa33a3788','2025-09-16 01:09:56','2025-09-16 08:14:56','forgot-password'),(20,'baohoaitran3112@gmail.com','736032','76d533d19aa0d95d0e86c36763f0c20f3ccbc63f53a7054378d5b9d2ac67ce01','2025-09-16 01:42:07','2025-09-16 08:47:07','forgot-password'),(21,'baohoaitran3112@gmail.com','435890','f7cf90b11bbb13dd286d9329c7182be71c6821b3d338070409c9974aa252b21a','2025-09-16 01:43:08','2025-09-16 08:48:08','forgot-password'),(22,'baohoaitran3112@gmail.com','336949','2c6cafaea736ca67c1331ed469f9b6e0f3f772746c7efcac373b9f680194a989','2025-09-16 01:44:17','2025-09-16 08:49:17','forgot-password'),(23,'1stplaying.game@gmail.com','993960','de8917f158e1cb8e3aa193582746ae6acb9ccb1e5d7ba59ecb4e85e0f37ebcaf','2025-09-16 04:09:09',NULL,'register'),(24,'baohoaitran3112@gmail.com','681608','65655a9b02f716fa035ee4921d02ef8a654e3db8fa8b36610f44fc75075e6e22','2025-09-16 07:53:53',NULL,'forgot-password'),(25,'baohoaitran3112@gmail.com','159160','b2ea80496c0247f1a6e0778563c1c9c711b924cb47222a1d22e84481ef130872','2025-09-16 07:55:53',NULL,'forgot-password'),(32,'baohoaitran3112@gmail.com','163519','8e92f3a0f43124782cd628025ab9751f4804f8b5e4933c0fcc7368c0ee648079','2025-09-16 08:26:41',NULL,'forgot-password'),(33,'baohoaitran3112@gmail.com','680433','01ba21e3c5bfd14a7a2ce3b335ecd95c6dd417d6d80e52d922743dccc86e71bf','2025-09-16 08:32:24',NULL,'forgot-password'),(34,'baohoaitran3112@gmail.com','313950','a6ce22682e4d3b84be17b6dd4d7b018f97fd73310f621ebb6b0f1010097b600e','2025-09-16 08:37:36',NULL,'forgot-password'),(35,'baohoaitran3112@gmail.com','900123','2066f367579f9cbdd264c3f67205ae54cbaab5808075936bd6bbaf6194f4f859','2025-09-16 08:38:30',NULL,'forgot-password'),(36,'baohoaitran3112@gmail.com','514694','4acd65622690f8b48670190f840d4d59fa3753760e735f1b5ed26d941418fef2','2025-09-16 08:43:57',NULL,'forgot-password'),(37,'baohoaitran3112@gmail.com','433524','d2ffb2488a7d9214254361bccd0d0f2345cff9d706c9584b22d1d03ebfa8230c','2025-09-16 08:45:05',NULL,'forgot-password'),(38,'baohoaitran3112@gmail.com','298210','62843b4f34be1944d12c93bece1ee459dc882b1d9d3ffb9e08ebee6dbacc2fc3','2025-09-16 08:49:10',NULL,'forgot-password'),(39,'baohoaitran3112@gmail.com','876128','efec37151b979db78d741b5dc3033e410f965e752547765ed165eddb0dcf26fc','2025-09-16 08:54:53',NULL,'forgot-password'),(41,'baohoaitran3112@gmail.com','532848','b69bf8586c87dce32404390ea64ea00f903ddb95f601556810cc549c0ee3f77a','2025-09-16 09:10:21',NULL,'forgot-password'),(43,'khangle0828578293@gmail.com','966286','74a49893fed89b1d17670958b17c69c55e92b5dd7d00c8d98d86780d8b9311bb','2025-09-17 13:51:40',NULL,'register'),(45,'ndanh24032004@gmail.com','251063','0458a2afd35f05faf42da3d60c55276b28d28f138b56202f7a86c982aaca5950','2025-09-18 06:37:48',NULL,'register'),(46,'vuthienson280124@gmail.com','633297','31b2380d60d592429f3e8b34b62754dcd4e2cac2cbc673c02d4abd7d240b1e37','2025-09-23 02:03:28',NULL,'register'),(47,'baohoaitran3112@gmail.com','435997','783df3d3c39fe5aae365a7ac410e9e0083e889619a072ef48a249592f914a4f8','2025-09-23 02:04:26',NULL,'forgot-password'),(48,'baohoaitran3112@gmail.com','706836','bd5f8522dcb566dbdb4efa5bd9c5271eaed7b436d1d7334f9c3bf09a9722ef34','2025-09-23 02:06:00',NULL,'forgot-password'),(49,'baohoaitran3112@gmail.com','945318','b793a39737ab6f01bea7316392dc5016d1a2a09ef1afe4ff9f73c5ce1549ae24','2025-09-23 02:09:21',NULL,'forgot-password'),(53,'baohoaitran3112@gmail.com','258366','ddec0b1ea475ffe469aa74f1a7ce462bf3de7e29ba8ebbc84b37a94872023f52','2025-10-28 16:48:22','2025-10-28 23:53:22','forgot-password'),(54,'baohoaitran3112@gmail.com','169885','0921f28898774e02cfa8cd07bde84e87b9226d458a38f024297b0cbf5e643dc9','2025-12-07 15:57:08','2025-12-07 23:02:08','forgot-password');

UN

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
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `otp_verifications`
--



INSERT INTO `otp_verifications` VALUES (1,'baomunt123456@gmail.com','319412','PASSWORD_RESET','2025-05-18 08:40:41','2025-05-18 01:35:40',0,1,'::1'),(2,'baomunt123456@gmail.com','153066','PASSWORD_RESET','2025-05-18 09:07:05','2025-05-18 02:02:05',0,1,'::1'),(3,'baomunt123456@gmail.com','814692','PASSWORD_RESET','2025-05-18 09:09:55','2025-05-18 02:04:54',0,1,'::1'),(4,'baomunt123456@gmail.com','635447','PASSWORD_RESET','2025-05-18 09:16:03','2025-05-18 02:11:02',0,1,'::1'),(5,'baomunt123456@gmail.com','255902','PASSWORD_RESET','2025-05-18 09:47:45','2025-05-18 02:42:45',1,1,'::1'),(6,'baomunt123456@gmail.com','655235','PASSWORD_RESET','2025-05-18 10:17:21','2025-05-18 03:12:21',1,1,'::1'),(7,'minhluan21082004@gmail.com','472847','PASSWORD_RESET','2025-05-18 10:21:57','2025-05-18 03:16:57',1,0,'::1'),(8,'baomunt123456@gmail.com','264407','PASSWORD_RESET','2025-05-18 21:38:40','2025-05-18 14:33:40',1,1,'::1'),(9,'khangle0938573511@gmail.com','789339','PASSWORD_RESET','2025-05-18 22:28:50','2025-05-18 15:23:50',1,0,'::1'),(10,'khangle0938573511@gmail.com','651233','PASSWORD_RESET','2025-05-18 22:46:42','2025-05-18 15:41:42',1,0,'::1'),(11,'khangle0938573511@gmail.com','831197','PASSWORD_RESET','2025-05-18 22:52:17','2025-05-18 15:47:16',1,0,'::1'),(12,'baomunt123456@gmail.com','181307','PASSWORD_RESET','2025-05-18 22:58:03','2025-05-18 15:53:03',0,1,'::1'),(13,'baomunt123456@gmail.com','934594','PASSWORD_RESET','2025-05-18 22:59:38','2025-05-18 15:54:38',0,1,'::1'),(14,'baomunt123456@gmail.com','420452','PASSWORD_RESET','2025-05-24 16:37:45','2025-05-24 09:32:44',1,1,'::1'),(15,'baomunt123456@gmail.com','934248','PASSWORD_RESET','2025-08-21 06:51:16','2025-08-20 23:46:16',0,0,'::1'),(16,'baomunt123456@gmail.com','239246','PASSWORD_RESET','2025-08-21 06:59:18','2025-08-20 23:54:18',0,0,'::1'),(17,'baomunt123456@gmail.com','739704','PASSWORD_RESET','2025-08-21 07:04:45','2025-08-20 23:59:44',0,0,'::1'),(18,'baomunt123456@gmail.com','688338','PASSWORD_RESET','2025-08-21 07:04:52','2025-08-20 23:59:52',0,0,'::1'),(19,'Baomunt123456@gmail.com','647175','PASSWORD_RESET','2025-08-21 07:21:56','2025-08-21 00:16:56',0,0,'::1'),(20,'Baomunt123456@gmail.com','931098','PASSWORD_RESET','2025-08-21 20:05:53','2025-08-21 13:00:52',0,0,'::1'),(21,'baohoaitran3112@gmail.com','317044','PASSWORD_RESET','2025-09-09 18:53:21','2025-09-09 11:48:21',1,0,'::1');

UN

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
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `password_reset_tokens`
--



INSERT INTO `password_reset_tokens` VALUES (4,'khangle0938573511@gmail.com','d4e6d8a5bf23dddfff5635ca2782bc47a78f074b18f04f455a8f4c6a2bae9340','2025-05-18 22:39:24','2025-05-18 15:24:24'),(5,'khangle0938573511@gmail.com','4c3bd2fe2d094ed58139fa5693dbbe800284864fd0866230be034488031ce082','2025-05-18 22:56:59','2025-05-18 15:41:58'),(7,'baomunt123456@gmail.com','a6340d67ac2301a25c54f89afc87b5bc7aea3c20fad8fc1ec9ed713c9e31201c','2025-05-24 16:48:48','2025-05-24 09:33:48');

UN

--
-- Table structure for table `password_resets_admin`
--

DROP TABLE IF EXISTS `password_resets_admin`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `password_resets_admin` (
  `id` int NOT NULL AUTO_INCREMENT,
  `email` varchar(255) NOT NULL,
  `token` varchar(64) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `expires_at` timestamp NOT NULL,
  `used` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `idx_email` (`email`),
  KEY `idx_token` (`token`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `password_resets_admin`
--



INSERT INTO `password_resets_admin` VALUES (1,'baohoaitran3112@gmail.com','b6d87ea465fb9159346206a6ed6ffb8e39eaaf1a0e8c06b62ee7b0c6e816c751','2025-09-16 01:31:48','2025-09-16 02:01:48',0),(2,'baohoaitran3112@gmail.com','5cd6f2cd085d4a3aa67b5bcecdf3283e9238ed82371affad3068847a62450386','2025-09-16 07:58:19','2025-09-16 08:28:19',0),(3,'baohoaitran3112@gmail.com','b8ee0bf155e6160607bfa17f06f546307a77e019e164f84a8f2dfe9da97c4a6e','2025-09-16 08:03:29','2025-09-16 08:33:29',0),(4,'baohoaitran3112@gmail.com','b2ac82b57ad885f886ea9800c68fbc912f69992f0dc41721f8511fb551d517fb','2025-09-16 08:09:48','2025-09-16 08:39:48',0),(5,'baohoaitran3112@gmail.com','31a0c49179ae4e9545d43f0b8c7a15845853388cdbc37da8eaa483810f94082f','2025-09-16 08:11:45','2025-09-16 08:41:45',0),(6,'baohoaitran3112@gmail.com','34c5f0efd83afcf352c1d4cca43b50615faf8f0ceb7e104156ad610b2eb78b6c','2025-09-16 08:20:38','2025-09-16 08:50:38',0),(7,'baohoaitran3112@gmail.com','444a46cf9c2db80189690de78fe6656ce0b4a43a56cb3632b5e7c6e7de595955','2025-09-16 08:22:29','2025-09-16 08:52:29',1),(8,'baohoaitran3112@gmail.com','08e890504308225f3d49d5e898b843367764da74fba053a81aa453969443900e','2025-10-12 03:25:04','2025-10-12 03:55:04',1);

UN

--
-- Table structure for table `pending_danhgia`
--

DROP TABLE IF EXISTS `pending_danhgia`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pending_danhgia` (
  `MaPDG` int NOT NULL AUTO_INCREMENT,
  `MaSP` int NOT NULL,
  `MaKH` int NOT NULL,
  `SoSao` tinyint NOT NULL,
  `NhanXet` text,
  `NgayDanhGia` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`MaPDG`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pending_danhgia`
--



INSERT INTO `pending_danhgia` VALUES (4,2,19,5,'sản phẩm hay','2025-11-11 03:40:42');

UN

--
-- Table structure for table `phanhoi_sothich`
--

DROP TABLE IF EXISTS `phanhoi_sothich`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `phanhoi_sothich` (
  `MaPhanHoi` bigint NOT NULL AUTO_INCREMENT,
  `MaForm` int NOT NULL,
  `makh` int NOT NULL COMMENT 'Mã khách hàng',
  `NgayPhanHoi` datetime DEFAULT CURRENT_TIMESTAMP,
  `DongYSuDung` tinyint(1) DEFAULT '1' COMMENT 'Đồng ý cho phép sử dụng dữ liệu cá nhân hoá',
  PRIMARY KEY (`MaPhanHoi`),
  KEY `idx_makh` (`makh`),
  KEY `idx_maform` (`MaForm`),
  CONSTRAINT `phanhoi_sothich_ibfk_1` FOREIGN KEY (`MaForm`) REFERENCES `form_sothich` (`MaForm`) ON DELETE CASCADE,
  CONSTRAINT `phanhoi_sothich_ibfk_2` FOREIGN KEY (`makh`) REFERENCES `khachhang` (`makh`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=26 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Lưu thông tin phản hồi form của khách hàng';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `phanhoi_sothich`
--



INSERT INTO `phanhoi_sothich` VALUES (1,2,19,'2025-11-08 10:04:35',1),(2,2,18,'2025-11-08 10:21:00',1),(3,2,25,'2025-11-08 11:46:08',1),(4,3,25,'2025-11-11 21:15:53',1),(5,4,18,'2025-11-12 08:42:31',1),(6,5,18,'2025-11-12 09:02:37',1),(7,6,18,'2025-11-12 12:01:40',1),(8,6,19,'2025-11-12 12:53:27',1),(9,7,19,'2025-11-12 13:07:50',1),(10,7,18,'2025-11-12 13:13:17',1),(11,8,18,'2025-11-13 18:57:56',1),(16,8,19,'2025-11-15 19:18:54',1),(17,9,19,'2025-11-18 09:09:23',1),(18,9,18,'2025-11-18 09:17:24',1),(19,10,18,'2025-11-18 09:59:12',1),(20,10,19,'2025-11-20 22:12:38',1),(21,11,19,'2025-11-29 12:37:47',1),(22,12,19,'2025-11-29 12:56:24',1),(23,12,25,'2025-11-30 11:41:23',1),(24,12,21,'2025-11-30 14:47:01',1),(25,13,19,'2025-12-08 18:55:23',1);

UN

--
-- Table structure for table `phieugiamgia`
--

DROP TABLE IF EXISTS `phieugiamgia`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `phieugiamgia` (
  `MaPhieu` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `MoTa` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Mô tả phiếu',
  `SoLanSuDungToiDa` int DEFAULT '1' COMMENT 'Số lần sử dụng tối đa mỗi khách',
  `TrangThai` tinyint(1) DEFAULT '1' COMMENT '1=Hoạt động, 0=Vô hiệu',
  `NgayTao` datetime DEFAULT CURRENT_TIMESTAMP,
  `MaKM` int DEFAULT NULL,
  PRIMARY KEY (`MaPhieu`),
  KEY `idx_trangthai` (`TrangThai`),
  KEY `fk_phieugiamgia_khuyenmai` (`MaKM`),
  CONSTRAINT `fk_phieugiamgia_khuyenmai` FOREIGN KEY (`MaKM`) REFERENCES `khuyen_mai` (`MaKM`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Phiếu giảm giá/freeship';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `phieugiamgia`
--



INSERT INTO `phieugiamgia` VALUES ('05A5YAS3','FREE SHIP NHÉ MN ',1,1,'2025-11-29 12:37:47',49),('EVBH7RDR','FORM NHẬN MÃ ',1,1,'2025-11-12 13:07:50',44),('freegiamgia','miễn phí vận chuyển nhé các bạn  - TRẦN HOÀI BẢO',1,1,'2025-11-13 14:37:21',NULL),('freegiamgia123123','miễn phí vận chuyển nhé các bạn NHƯ',1,1,'2025-11-12 11:57:39',43),('freegiamgia1231233376543','miễn phí vận chuyển nhé các bạn  - 123456',1,1,'2025-11-29 12:53:19',51),('freegiamgianh','miễn phí vận chuyển nhé các bạn  - 123456',1,1,'2025-11-12 11:32:42',40),('freeSHIPAENHE','miễn phí vận chuyển nhé các bạn  - 12341234',1,1,'2025-11-12 13:05:04',44),('khuyenmaidonha','miễn phí vận chuyển nhé các bạn  - nhận đang sao khi ',1,1,'2025-11-29 12:35:13',49),('P9ADIL0D','jhgf',1,1,'2025-11-29 12:56:24',51),('TIZGGUOG','Trung thu sách hay ',1,1,'2025-11-18 09:59:12',NULL),('U3KOOX5S','TEST VUI ',1,1,'2025-11-13 18:57:56',NULL);

UN

--
-- Table structure for table `phieugiamgia_phathanh`
--

DROP TABLE IF EXISTS `phieugiamgia_phathanh`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `phieugiamgia_phathanh` (
  `MaPhatHanh` bigint NOT NULL AUTO_INCREMENT,
  `makh` int NOT NULL,
  `MaPhieu` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `NgayPhatHanh` datetime DEFAULT CURRENT_TIMESTAMP,
  `NgaySuDung` datetime DEFAULT NULL COMMENT 'Thời điểm khách sử dụng (NULL = chưa dùng)',
  `TrangThaiSuDung` enum('CHUA_SU_DUNG','DA_SU_DUNG') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'CHUA_SU_DUNG' COMMENT 'Trạng thái sử dụng phiếu',
  PRIMARY KEY (`MaPhatHanh`),
  KEY `MaPhieu` (`MaPhieu`),
  KEY `idx_makh_maPhieu` (`makh`,`MaPhieu`),
  KEY `idx_makh_ngaysudung` (`makh`,`NgaySuDung`),
  CONSTRAINT `phieugiamgia_phathanh_ibfk_1` FOREIGN KEY (`makh`) REFERENCES `khachhang` (`makh`) ON DELETE CASCADE,
  CONSTRAINT `phieugiamgia_phathanh_ibfk_2` FOREIGN KEY (`MaPhieu`) REFERENCES `phieugiamgia` (`MaPhieu`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Lịch sử phát hành và sử dụng phiếu giảm giá';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `phieugiamgia_phathanh`
--



INSERT INTO `phieugiamgia_phathanh` VALUES (6,18,'freegiamgia123123','2025-11-12 12:01:40',NULL,'CHUA_SU_DUNG'),(7,19,'freegiamgia123123','2025-11-12 12:53:27',NULL,'CHUA_SU_DUNG'),(8,19,'EVBH7RDR','2025-11-12 13:07:50',NULL,'CHUA_SU_DUNG'),(9,18,'EVBH7RDR','2025-11-12 13:13:17',NULL,'CHUA_SU_DUNG'),(10,18,'U3KOOX5S','2025-11-13 18:57:56',NULL,'CHUA_SU_DUNG'),(15,19,'U3KOOX5S','2025-11-15 19:18:54',NULL,'CHUA_SU_DUNG'),(16,18,'TIZGGUOG','2025-11-18 09:59:12',NULL,'CHUA_SU_DUNG'),(17,19,'TIZGGUOG','2025-11-20 22:12:38',NULL,'CHUA_SU_DUNG'),(18,19,'05A5YAS3','2025-11-29 12:37:47',NULL,'CHUA_SU_DUNG'),(19,19,'P9ADIL0D','2025-11-29 12:56:24',NULL,'CHUA_SU_DUNG'),(20,25,'P9ADIL0D','2025-11-30 11:41:23',NULL,'CHUA_SU_DUNG'),(21,21,'P9ADIL0D','2025-11-30 14:47:01',NULL,'CHUA_SU_DUNG');

UN

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
) ENGINE=InnoDB AUTO_INCREMENT=38 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `phieunhap`
--



INSERT INTO `phieunhap` VALUES (1,1,'NV007','2022-09-22',2500000,_binary ''),(2,2,'NV009','2022-09-23',1800000,_binary ''),(3,3,'NV008','2022-09-24',3600000,_binary ''),(4,4,'NV007','2022-09-25',2000000,_binary '\0'),(5,5,'NV009','2022-09-26',3500000,_binary '\0'),(6,6,'NV008','2022-09-27',4800000,_binary '\0'),(7,3,'NV007','2022-09-28',2800000,_binary '\0'),(8,4,'NV009','2022-09-29',1800000,_binary '\0'),(9,3,'NV002','2025-05-12',NULL,NULL),(10,4,'NV002','2025-05-12',NULL,NULL),(11,4,'NV004','2025-05-12',25,_binary ''),(12,1,'NV004','2025-05-12',480000,_binary ''),(13,3,'NV004','2025-09-11',231.99999999999997,_binary ''),(16,3,'NV004','2025-09-11',264000.00000000006,_binary ''),(18,4,'NV004','2025-09-11',240000,_binary ''),(19,3,'NV004','2025-09-11',2400000,_binary ''),(20,3,'NV004','2025-09-11',1380000000,_binary ''),(21,3,'NV004','2025-09-11',3720000,_binary ''),(22,2,'NV004','2025-09-18',712800,_binary ''),(23,2,'NV004','2025-10-02',252000,_binary ''),(24,1,'NV004','2025-10-14',1480500,_binary ''),(25,2,'NV004','2025-10-23',16330200,_binary ''),(26,2,'NV004','2025-10-28',7010580,_binary ''),(27,5,'NV007','2025-11-06',1094000,_binary ''),(28,6,'NV007','2025-11-06',204000,_binary ''),(29,3,'NV004','2025-11-11',72000,_binary ''),(30,4,'NV004','2025-11-29',931200,_binary ''),(31,2,'NV004','2025-11-30',3057600,_binary ''),(32,1,'NV004','2025-12-06',864000,_binary ''),(33,3,'NV004','2025-12-06',216000,_binary ''),(34,3,'NV004','2025-12-06',1050000,_binary ''),(35,3,'NV004','2025-12-06',231000,_binary ''),(36,3,'NV004','2025-12-06',1500000,_binary ''),(37,3,'NV004','2025-12-08',1050000,_binary '');

UN

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product`
--




UN

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `receipt`
--




UN

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `receipt_detail`
--




UN

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `recipe`
--




UN

--
-- Table structure for table `refund_requests`
--

DROP TABLE IF EXISTS `refund_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `refund_requests` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `orderId` varchar(100) DEFAULT NULL,
  `customerId` int NOT NULL,
  `refundRequestId` varchar(100) NOT NULL,
  `refundAmount` decimal(15,2) NOT NULL,
  `refundType` enum('full','partial') DEFAULT 'full',
  `refundReason` text,
  `bankAccount` varchar(50) DEFAULT NULL,
  `bankName` varchar(100) DEFAULT NULL,
  `accountHolder` varchar(100) DEFAULT NULL,
  `bankBranch` varchar(200) DEFAULT NULL,
  `status` enum('PENDING','PROCESSING','COMPLETED','REJECTED','CANCELLED') DEFAULT 'PENDING',
  `priority` enum('LOW','NORMAL','HIGH','URGENT') DEFAULT 'NORMAL',
  `processedBy` varchar(20) DEFAULT NULL,
  `adminReason` text,
  `refundFee` decimal(10,2) DEFAULT '0.00',
  `actualRefundAmount` decimal(15,2) DEFAULT NULL,
  `paymentMethod` varchar(50) DEFAULT NULL,
  `transactionId` varchar(100) DEFAULT NULL,
  `transferDate` datetime DEFAULT NULL,
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `processedAt` datetime DEFAULT NULL,
  `completedAt` datetime DEFAULT NULL,
  `attachments` json DEFAULT NULL,
  `return_id` bigint DEFAULT NULL,
  `processedById` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `refundRequestId` (`refundRequestId`),
  KEY `idx_refund_request_id` (`refundRequestId`),
  KEY `idx_order_customer` (`orderId`,`customerId`),
  KEY `idx_status_created` (`status`,`createdAt`),
  KEY `customerId` (`customerId`),
  KEY `idx_return_id` (`return_id`),
  KEY `idx_processedById` (`processedById`),
  CONSTRAINT `fk_refund_processedBy` FOREIGN KEY (`processedById`) REFERENCES `taikhoan` (`MaTK`) ON DELETE SET NULL,
  CONSTRAINT `refund_requests_ibfk_2` FOREIGN KEY (`customerId`) REFERENCES `khachhang` (`makh`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `refund_requests`
--



INSERT INTO `refund_requests` VALUES (1,'149',19,'REF_149_1759280405355',805800.00,'full','Thời gian giao hàng quá lâu','12345678','Techcombank','TranHoaiBao','Quận 1 hcm','COMPLETED','NORMAL',NULL,'cam ơn bạn',0.00,805800.00,NULL,'1000','2025-10-01 10:22:27','2025-10-01 08:00:05','2025-10-01 10:22:26','2025-10-01 10:22:27','2025-10-01 10:22:27',NULL,NULL,NULL),(2,'150',19,'REF_150_1759289809563',1240000.00,'full','Vấn đề tài chính','121212121212','Techcombank','Baone','Quận 1 hcm','COMPLETED','NORMAL',NULL,'cảm ơn quý khách\n',0.00,1240000.00,NULL,'1231231','2025-10-01 10:42:21','2025-10-01 10:36:49','2025-10-01 10:42:20','2025-10-01 10:42:21','2025-10-01 10:42:21',NULL,NULL,NULL),(3,'159',19,'REF_159_1759499605272',301800.00,'full','Thời gian giao hàng quá lâu','1234566578','MBBank','Baohoaitran','Quận 1 hcm','COMPLETED','NORMAL',NULL,'cảm ơn bạn nhé',0.00,301800.00,NULL,'1124223232','2025-10-03 22:16:19','2025-10-03 20:53:25','2025-10-03 22:16:18','2025-10-03 22:16:19','2025-10-03 22:16:19',NULL,NULL,NULL),(4,'152',19,'REF_152_1759932390285',631000.00,'full','Thời gian giao hàng quá lâu','10101010101','MBBank','BaoDepTrai','Quận 2 hcm','COMPLETED','NORMAL',NULL,'đã hoàn tiền',0.00,631000.00,NULL,'12345676543','2025-10-09 10:24:55','2025-10-08 21:06:30','2025-10-09 10:24:55','2025-10-09 10:24:55','2025-10-09 10:24:55',NULL,NULL,NULL),(5,'167',19,'REF_167_1760003104398',162000.00,'full','Thời gian giao hàng quá lâu','10101010101','Agribank','TranHoaiBao','Quận 2 hcm','COMPLETED','NORMAL',NULL,'cảm ơn bạn ',0.00,162000.00,NULL,'123432','2025-10-11 17:04:58','2025-10-09 16:45:04','2025-10-11 17:04:58','2025-10-11 17:04:58','2025-10-11 17:04:58',NULL,NULL,NULL),(6,'169',19,'REF_169_1760056806020',252000.00,'full','Tìm được giá tốt hơn ở nơi khác','12345678111','MBBank','TranHoaiBao','Quận 1 hcm','COMPLETED','NORMAL',NULL,'cảm ơn bạn đã đến',0.00,252000.00,NULL,'12345678','2025-10-10 07:40:56','2025-10-10 07:40:06','2025-10-10 07:40:56','2025-10-10 07:40:56','2025-10-10 07:40:56',NULL,17,NULL),(7,'170',19,'REF_170_1760057124013',529200.00,'full','Tìm được giá tốt hơn ở nơi khác','12345678111','SHB','TranHoaiBao','Quận 1 hcm','COMPLETED','NORMAL',NULL,'1234567',0.00,529200.00,NULL,'123456','2025-10-10 07:46:10','2025-10-10 07:45:24','2025-10-10 07:46:09','2025-10-10 07:46:10','2025-10-10 07:46:10',NULL,NULL,NULL),(8,'173',19,'REF_173_1760232054008',303600.00,'full','Thay đổi ý định mua hàng','10101010101','Agribank','TranHoaiBao','Quận 2 hcm','COMPLETED','NORMAL',NULL,'cam on ạ',0.00,303600.00,NULL,'1234567','2025-10-12 08:29:29','2025-10-12 08:20:54','2025-10-12 08:29:29','2025-10-12 08:29:29','2025-10-12 08:29:29',NULL,NULL,NULL),(9,'175',18,'REF_175_1760336132292',561000.00,'full','Thời gian giao hàng quá lâu','22342233232','MBBank','TranHoaiBao','Quận 1 hcm','PENDING','NORMAL',NULL,NULL,0.00,NULL,NULL,NULL,NULL,'2025-10-13 13:15:32','2025-10-13 13:15:32',NULL,NULL,NULL,19,NULL),(10,'181',18,'REF_181_1760457284594',649200.00,'full','Thời gian giao hàng quá lâu','10101010101','VietinBank','TranHoaiBao','Quận 2 hcm','COMPLETED','NORMAL',NULL,'cảm ơn vì một trải nghieemk k tốt',0.00,649200.00,NULL,'1234','2025-11-09 20:00:50','2025-10-14 22:54:44','2025-11-09 20:00:49','2025-11-09 20:00:50','2025-11-09 20:00:50',NULL,NULL,NULL),(11,'262',19,'REF_262_1763210438809',380000.00,'full','Tìm được giá tốt hơn ở nơi khác','10101010101','BIDV','TranHoaiBao','Quận 2 hcm','COMPLETED','NORMAL',NULL,'123',0.00,380000.00,NULL,'987654321','2025-11-15 19:42:31','2025-11-15 19:40:38','2025-11-15 19:42:31','2025-11-15 19:42:31','2025-11-15 19:42:31',NULL,NULL,NULL),(12,'292',25,'REF_292_1764477519471',900000.00,'full','Thay đổi ý định mua hàng','10101010101','TPBank','Baone','Quận 1 hcm','COMPLETED','NORMAL',NULL,'đã haonf tiền cho khách hàng',0.00,900000.00,NULL,'0987542','2025-11-30 11:39:52','2025-11-30 11:38:39','2025-11-30 11:39:51','2025-11-30 11:39:52','2025-11-30 11:39:52',NULL,20,NULL);

UN

--
-- Table structure for table `return_histories`
--

DROP TABLE IF EXISTS `return_histories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `return_histories` (
  `id` int NOT NULL AUTO_INCREMENT,
  `return_id` int NOT NULL,
  `from_status` varchar(50) DEFAULT NULL,
  `to_status` varchar(50) DEFAULT NULL,
  `by_user` varchar(100) DEFAULT NULL,
  `note` text,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `return_id` (`return_id`),
  CONSTRAINT `fk_return` FOREIGN KEY (`return_id`) REFERENCES `returns` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `return_histories`
--




UN

--
-- Table structure for table `returns`
--

DROP TABLE IF EXISTS `returns`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `returns` (
  `id` int NOT NULL AUTO_INCREMENT,
  `order_id` varchar(100) NOT NULL,
  `created_by` varchar(100) DEFAULT NULL,
  `created_by_type` varchar(50) DEFAULT 'customer',
  `items` json DEFAULT NULL,
  `reason` text,
  `attachments` json DEFAULT NULL,
  `status` varchar(50) DEFAULT 'requested',
  `refund_amount` decimal(15,2) DEFAULT '0.00',
  `refund_method` varchar(50) DEFAULT NULL,
  `warehouse_id` int DEFAULT NULL,
  `assigned_to` int DEFAULT NULL,
  `notes` text,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `returns`
--




UN

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `role`
--




UN

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
  `MinSoLuong` int NOT NULL DEFAULT '0',
  `MaNCC` int DEFAULT NULL,
  `TrongLuong` int DEFAULT NULL,
  `KichThuoc` varchar(255) DEFAULT NULL,
  `SoTrang` int DEFAULT NULL,
  `HinhThuc` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`MaSP`),
  KEY `FK_SanPham_TheLoai` (`MaTL`),
  KEY `FK_SanPham_TacGia` (`MaTG`),
  KEY `idx_matl` (`MaTL`),
  KEY `idx_matg` (`MaTG`),
  KEY `idx_hinhthuc` (`HinhThuc`),
  KEY `idx_dongia` (`DonGia`),
  KEY `idx_namxb` (`NamXB`),
  KEY `idx_sotrang` (`SoTrang`),
  KEY `idx_tinhtrang` (`TinhTrang`),
  FULLTEXT KEY `idx_fts_sanpham` (`TenSP`,`MoTa`),
  CONSTRAINT `FK_SanPham_TacGia` FOREIGN KEY (`MaTG`) REFERENCES `tacgia` (`MaTG`),
  CONSTRAINT `FK_SanPham_TheLoai` FOREIGN KEY (`MaTL`) REFERENCES `theloai` (`MaTL`)
) ENGINE=InnoDB AUTO_INCREMENT=117 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sanpham`
--



INSERT INTO `sanpham` VALUES (1,1,'Cho Tôi Xin Một Vé Đi Tuổi Thơ','Cuốn sách kể về hành trình đầy hài hước và cảm động của một chú chó nhỏ với khát vọng khám phá thế giới rộng lớn. Tác phẩm mang đậm chất sáng tạo, kết hợp giữa yếu tố giả tưởng và bài học về lòng dũng cảm.','sp01.jpg',109137,19,2008,_binary '',8,18,4,300,'14 x 21 cm',280,'Bìa mềm'),(2,1,'Mắt Biếc','Một câu chuyện tình yêu lãng mạn và bi thương, xoay quanh mối quan hệ phức tạp giữa các nhân vật trong bối cảnh làng quê Việt Nam. Tác phẩm nổi bật với ngôn ngữ giàu cảm xúc và hình ảnh thiên nhiên thơ mộng.','sp02.jpg',109271,17,1990,_binary '',8,16,1,300,'14 x 21 cm',280,'Bìa mềm'),(3,1,'Pride and Prejudice','Tác phẩm kinh điển của Jane Austen kể về cuộc đời của Elizabeth Bennet, một cô gái thông minh và độc lập, trong hành trình tìm kiếm tình yêu và vượt qua định kiến xã hội ở Anh thế kỷ 19.','sp03.jpg',151800,9668,1984,_binary '',9,0,2,300,'14 x 21 cm',280,'Bìa mềm'),(4,1,'The Great Gatsby','Tiểu thuyết của F. Scott Fitzgerald khắc họa giấc mơ Mỹ qua câu chuyện của Jay Gatsby, một triệu phú bí ẩn, và tình yêu không hồi kết với Daisy Buchanan trong bối cảnh những năm 1920 xa hoa nhưng đầy bi kịch.','sp04.jpg',72000,38,1999,_binary '',10,37,2,300,'14 x 21 cm',280,'Bìa mềm'),(5,1,'Harry Potter and the Philosophers Stone','Cuốn sách đầu tiên trong loạt truyện của J.K. Rowling, kể về cậu bé Harry Potter phát hiện mình là phù thủy và bước vào thế giới phép thuật tại trường Hogwarts, nơi anh đối mặt với định mệnh và bạn bè mới.','sp05.jpg',120000,60,1997,_binary '',11,0,3,300,'14 x 21 cm',280,'Bìa mềm'),(6,2,'Dune','Tác phẩm khoa học viễn tưởng kinh điển của Frank Herbert, xoay quanh cuộc chiến quyền lực trên hành tinh sa mạc Arrakis, nơi sản sinh gia vị quý giá, với nhân vật chính Paul Atreides lãnh đạo một cuộc cách mạng.','sp06.jpg',35478,46,1965,_binary '',2,0,3,380,'16 x 24 cm',320,'Bìa mềm'),(7,2,'The Hitchhikers Guide to the Galaxy','Một tiểu thuyết hài hước của Douglas Adams, theo chân Arthur Dent trong hành trình du hành vũ trụ sau khi Trái Đất bị phá hủy, với sự hỗ trợ của cuốn sách hướng dẫn du hành kỳ lạ và đầy bất ngờ.','sp07.jpg',480000,36,1980,_binary '',2,0,4,380,'16 x 24 cm',320,'Bìa mềm'),(8,2,'Enders Game','Tác phẩm của Orson Scott Card kể về Ender Wiggin, một cậu bé thiên tài được huấn luyện để trở thành chỉ huy quân sự, đối mặt với áp lực cứu nhân loại khỏi mối đe dọa ngoài hành tinh..','sp08.jpg',252000,18,1985,_binary '',2,0,1,380,'16 x 24 cm',320,'Bìa mềm'),(9,2,'Brave New World','Tiểu thuyết dystopia của Aldous Huxley miêu tả một xã hội tương lai nơi con người bị kiểm soát bởi công nghệ và thuốc men, đặt ra câu hỏi về tự do và hạnh phúc thông qua hành trình của Bernard Marx.','sp09.jpg',500000,28,1932,_binary '',2,6,5,380,'16 x 24 cm',320,'Bìa mềm'),(10,2,'Neuromancer','Tác phẩm tiên phong của thể loại cyberpunk do William Gibson sáng tác, kể về một hacker trong thế giới tương lai, nơi thực tế ảo và trí tuệ nhân tạo đan xen, mở ra cuộc phiêu lưu đầy kịch tính.','sp10.jpg',310000,40,1984,_binary '',2,0,3,380,'16 x 24 cm',320,'Bìa mềm'),(11,3,'The Da Vinci Code','Tiểu thuyết trinh thám của Dan Brown, theo chân Robert Langdon giải mã các bí ẩn liên quan đến tranh của Leonardo da Vinci và Hội Tam Điểm, hé lộ những âm mưu tôn giáo gây tranh cãi.','sp11.jpg',340000,46,2000,_binary '',3,0,3,380,'14 x 21 cm',320,'Bìa mềm'),(12,3,'Gone Girl','Tác phẩm tâm lý tội phạm của Gillian Flynn kể về vụ mất tích bí ẩn của Amy Dunne, dẫn đến những bí mật đen tối trong hôn nhân của cô và Nick, tạo nên một câu chuyện căng thẳng và bất ngờ.','sp12.jpg',340000,39,2012,_binary '',3,0,3,380,'14 x 21 cm',320,'Bìa mềm'),(13,3,'The Girl with the Dragon Tattoo','Phần đầu trong loạt Millennium của Stieg Larsson, theo chân nhà báo Mikael Blomkvist và hacker Lisbeth Salander điều tra một vụ mất tích gia đình, pha trộn yếu tố tội phạm và xã hội đen.','sp13.jpg',230000,56,2004,_binary '',3,0,3,380,'14 x 21 cm',320,'Bìa mềm'),(14,3,'The Hound of the Baskervilles','Một trong những tác phẩm nổi tiếng của Arthur Conan Doyle, nơi thám tử Sherlock Holmes điều tra lời nguyền kỳ bí về một con chó săn ma quái đe dọa gia tộc Baskerville.','sp14.jpg',370000,21,1939,_binary '',3,0,3,380,'14 x 21 cm',320,'Bìa mềm'),(15,3,'The Secret History','Tác phẩm của Donna Tartt kể về một nhóm sinh viên đại học bị cuốn vào một bí ẩn tội phạm sau một sự kiện bất ngờ, khám phá sự phức tạp của tình bạn và đạo đức.','sp15.jpg',230000,65,1992,_binary '',3,0,3,380,'14 x 21 cm',320,'Bìa mềm'),(16,4,'A Peoples History of the United States','Cuốn sách của Howard Zinn tái hiện lịch sử Hoa Kỳ từ góc nhìn của những người dân thường, phê phán các chính sách quyền lực và khám phá sự bất bình đẳng xã hội.','sp16.jpg',180000,36,1980,_binary '',1,0,3,500,'16 x 24 cm',400,'Bìa cứng'),(17,4,'Guns, Germs, and Steel','Tác phẩm kinh điển của Jared Diamond phân tích cách các yếu tố địa lý và môi trường đã định hình sự phát triển của các nền văn minh trên thế giới.','sp17.jpg',480000,52,1997,_binary '',1,0,3,500,'16 x 24 cm',400,'Bìa cứng'),(18,4,'The Diary of a Young Girl','Nhật ký của Anne Frank, một cô bé Do Thái, ghi lại cuộc sống ẩn náu trong Thế chiến II, phản ánh hy vọng và nỗi sợ hãi trong bối cảnh tàn khốc.','sp18.jpg',278100,11,1947,_binary '',1,0,3,500,'16 x 24 cm',400,'Bìa cứng'),(19,4,'The Guns of August','Tác phẩm của William Manchester mô tả sự kiện bạo lực tháng 8 năm 1968 tại Mỹ, phản ánh những căng thẳng xã hội và chính trị thời điểm đó.','sp19.jpg',500000,41,1962,_binary '',1,0,3,500,'16 x 24 cm',400,'Bìa cứng'),(20,4,'The Rise and Fall of the Third Reich','Cuốn sách của William L. Shirer ghi lại sự trỗi dậy và sụp đổ của Đế quốc thứ ba dưới thời Hitler, với những phân tích sâu sắc về lịch sử Thế chiến II.','sp20.jpg',310000,38,1960,_binary '',1,0,3,500,'16 x 24 cm',400,'Bìa cứng'),(21,5,'The Poet','Tác phẩm của James Patterson kể về thám tử Alex Cross đối mặt với một kẻ giết người hàng loạt, tạo nên một câu chuyện trinh thám gay cấn.','sp21.jpg',230000,69,1996,_binary '',2,0,3,380,'14 x 21 cm',320,'Bìa mềm'),(22,5,'The Cuckoos Calling','Tiểu thuyết kinh dị của Thomas Harris, theo chân đặc vụ FBI Clarice Starling truy tìm tên sát nhân ăn thịt người Hannibal Lecter, đầy kịch tính và ám ảnh.','sp22.jpg',180000,42,1988,_binary '',2,0,6,380,'14 x 21 cm',320,'Bìa mềm'),(23,5,'The Silence of the Lambs','Tác phẩm của Tana French kể về một vụ án bí ẩn trong khu rừng, nơi thám tử Rob Ryan phải đối mặt với quá khứ đau thương của chính mình.','sp23.jpg',480000,48,1980,_binary '',2,0,3,380,'14 x 21 cm',320,'Bìa mềm'),(24,5,'In the Woods','Cuốn sách của Haruki Murakami dẫn dắt người đọc qua một hành trình kỳ ảo, nơi thực tại và giấc mơ đan xen, khám phá tình yêu và sự mất mát.','sp24.jpg',210000,36,2007,_binary '',2,0,3,380,'14 x 21 cm',320,'Bìa mềm'),(25,5,'The Secret History','Tác phẩm của Donna Tartt kể về một nhóm học giả bị cuốn vào một bí ẩn tội ác, khám phá sự sâu sắc của triết học và nhân tính.','sp25.jpg',500000,44,1992,_binary '',2,0,3,380,'14 x 21 cm',320,'Bìa mềm'),(26,6,'A Brief History of Time','Cuốn sách của Stephen Hawking giải thích các khái niệm vật lý phức tạp như lỗ đen và Big Bang một cách dễ hiểu, mở ra cánh cửa vũ trụ cho người đọc.','sp26.jpg',140000,49,1988,_binary '',3,0,3,500,'16 x 24 cm',400,'Bìa cứng'),(27,6,'The Selfish Gene','Cuốn sách của Richard Dawkins khám phá lý thuyết tiến hóa qua khái niệm gen ích kỷ, giải thích cách gen ảnh hưởng đến hành vi và sự sống sót của loài.','sp27.jpg',120000,41,1976,_binary '',3,0,1,500,'16 x 24 cm',400,'Bìa cứng'),(28,6,'Sapiens: A Brief History of Humankind','Tác phẩm của Yuval Noah Harari kể lại lịch sử loài người từ thời cổ đại đến hiện đại, phân tích cách các ý tưởng và công nghệ định hình xã hội.','sp28.jpg',130000,54,2011,_binary '',3,0,3,500,'16 x 24 cm',400,'Bìa cứng'),(29,6,'The Origin of Species','Cuốn sách kinh điển của Charles Darwin trình bày lý thuyết tiến hóa qua chọn lọc tự nhiên, đặt nền móng cho sinh học hiện đại.','sp29.jpg',310000,27,1859,_binary '',3,0,3,500,'16 x 24 cm',400,'Bìa cứng'),(30,6,'The Double Helix','Tác phẩm của Nicholas Sparks kể về hành trình tình yêu đầy cảm xúc giữa hai con người, vượt qua những thử thách của thời gian và ký ức.','sp30.jpg',230000,66,1968,_binary '',3,0,3,500,'16 x 24 cm',400,'Bìa cứng'),(31,7,'The Alchemist','Cuốn sách của Paulo Coelho kể về hành trình của một chàng chăn cừu tìm kiếm kho báu, khám phá ý nghĩa của ước mơ và sự tự nhận thức.','sp31.jpg',180000,44,1988,_binary '',1,0,4,500,'15.5 x 24 cm',300,'Bìa cứng'),(32,7,'The Power of Now','Tác phẩm của Rhonda Byrne tiết lộ sức mạnh của tư duy tích cực và luật hấp dẫn, hướng dẫn cách đạt được thành công và hạnh phúc.','sp32.jpg',480000,54,1997,_binary '',12,0,3,500,'15.5 x 24 cm',300,'Bìa cứng'),(33,7,'The Celestine Prophecy','Cuốn sách của Dan Brown kể về cuộc phiêu lưu của Robert Langdon giải mã bí ẩn tiên tri Celestine, đầy kịch tính và những khám phá tôn giáo.','sp33.jpg',210000,37,1993,_binary '',13,0,3,500,'15.5 x 24 cm',300,'Bìa cứng'),(34,7,'Mere Christianity','Tác phẩm của C.S. Lewis kể về hành trình của một cô gái khám phá đức tin và tình yêu trong bối cảnh Thế chiến II, đầy cảm hứng.','sp34.jpg',500000,46,1952,_binary '',14,0,3,500,'15.5 x 24 cm',300,'Bìa cứng'),(35,7,'The Tao of Pooh','Cuốn sách của A.A. Milne đưa người đọc vào thế giới ngây thơ của Winnie the Pooh, với những bài học về tình bạn và sự giản dị.','sp35.jpg',310000,41,1982,_binary '',15,0,3,500,'15.5 x 24 cm',300,'Bìa cứng'),(36,8,'Daring Greatly','Tác phẩm của Gretchen Rubin hướng dẫn cách xây dựng thói quen tốt và sống hạnh phúc hơn thông qua những thay đổi nhỏ hàng ngày.','sp36.jpg',340000,50,2012,_binary '',16,0,3,300,'14 x 21 cm',280,'Bìa mềm'),(37,8,'Girl, Wash Your Face','Cuốn sách của Marie Kondo chia sẻ phương pháp dọn dẹp và tổ chức không gian sống, giúp tìm lại sự bình yên và trật tự.','sp37.jpg',340000,40,2018,_binary '',17,0,3,300,'14 x 21 cm',280,'Bìa mềm'),(38,8,'The Power of Now','Tác phẩm của Rhonda Byrne tiếp tục khám phá luật hấp dẫn, cung cấp các bài tập thực hành để thay đổi tư duy và cuộc sống.','sp38.jpg',230000,57,1997,_binary '',12,0,3,300,'14 x 21 cm',280,'Bìa mềm'),(39,8,'The Four Agreements','Cuốn sách của Don Miguel Ruiz giới thiệu bốn nguyên tắc sống để đạt được tự do cá nhân và hạnh phúc, dựa trên triết lý Toltec cổ đại.','sp39.jpg',370000,30,1997,_binary '',18,0,3,300,'14 x 21 cm',280,'Bìa mềm'),(40,8,'Start with Why','Tác phẩm của Simon Sinek giải thích tại sao việc tìm ra lý do cốt lõi (Why) của bản thân hoặc tổ chức có thể dẫn đến thành công bền vững.','sp40.jpg',230000,65,2009,_binary '',19,0,3,300,'14 x 21 cm',280,'Bìa mềm'),(41,9,'The Notebook','Tác phẩm lãng mạn của Nicholas Sparks kể về tình yêu vượt thời gian giữa Noah và Allie, với những cảm xúc sâu sắc và ký ức không phai mờ.','sp41.jpg',180000,45,1996,_binary '',20,0,3,300,'14 x 21 cm',280,'Bìa mềm'),(42,9,'Outlander','Cuốn sách của Diana Gabaldon kể về hành trình vượt thời gian của Claire Randall, đan xen giữa tình yêu và lịch sử thời kỳ Scotland thế kỷ 18.','sp42.jpg',480000,55,1991,_binary '',21,0,3,300,'14 x 21 cm',280,'Bìa mềm'),(43,9,'The Rosie Project','Tác phẩm của John Green kể về Hazel Grace và Gus, hai bạn trẻ đối mặt với bệnh ung thư, mang đến câu chuyện tình yêu và hy vọng đầy cảm động.','sp43.jpg',210000,38,2013,_binary '',22,0,3,300,'14 x 21 cm',280,'Bìa mềm'),(44,9,'The Fault in Our Stars','Cuốn sách của Nicholas Sparks kể về tình yêu trẻ trung giữa Rosie và Ian, vượt qua những thử thách để tìm thấy hạnh phúc đích thực.','sp44.jpg',500000,47,2012,_binary '',23,0,3,300,'14 x 21 cm',280,'Bìa mềm'),(45,9,'Me Before You','Tác phẩm của Nicholas Sparks kể về mối quan hệ giữa Landon và Jamie, khám phá tình yêu, sự hy sinh và phép màu trong cuộc sống.','sp45.jpg',310000,42,2012,_binary '',24,0,3,300,'14 x 21 cm',280,'Bìa mềm'),(51,1,'Tom Sawyer','Tiểu thuyết kinh điển của Mark Twain kể về cuộc phiêu lưu của Tom Sawyer, một cậu bé tinh nghịch khám phá thế giới và bạn bè ở vùng nông thôn Mỹ.','sp46.jpg',99000,7,1960,_binary '',25,0,3,300,'14 x 21 cm',280,'Bìa mềm'),(52,1,'Doremon Phiên Lưu','Cuốn truyện tranh nổi tiếng của Fujiko F. Fujio, kể về cậu bé Nobita và chú mèo máy Doraemon với những chuyến phiêu lưu kỳ diệu bằng bảo bối thần kỳ.','sp47.jpg',120000,14,1949,_binary '',26,0,3,300,'14 x 21 cm',280,'Bìa mềm'),(53,1,'Tho 7 Mau','Tác phẩm của Alexandre Dumas kể về ba chàng lính ngự lâm dũng cảm, với những cuộc chiến và tình bạn trong bối cảnh lịch sử Pháp.','sp48.jpg',150000,8,1988,_binary '',27,0,3,300,'14 x 21 cm',280,'Bìa mềm'),(54,1,'Vu Tru va Trai Dat','Cuốn tiểu thuyết của Alexandre Dumas kể về hành trình của chàng trai trẻ D’Artagnan gia nhập đội lính ngự lâm, đầy âm mưu và lòng trung thành.','sp49.jpg',180000,12,2014,_binary '',28,0,3,300,'14 x 21 cm',280,'Bìa mềm'),(55,1,'Gulliver','Tác phẩm kinh điển của Jonathan Swift kể về chuyến phiêu lưu kỳ thú của Gulliver qua các vùng đất tưởng tượng, phản ánh xã hội và con người.','sp50.jpg',130000,20,1976,_binary '',29,0,3,300,'14 x 21 cm',280,'Bìa mềm'),(56,1,'2 Van Dam Duoi Bien','Cuốn sách của Alexandre Dumas kể về cuộc đời của Edmond Dantès, từ tù nhân trở thành bá tước để trả thù những kẻ phản bội.','sp51.jpg',130000,20,1976,_binary '',30,0,3,300,'14 x 21 cm',280,'Bìa mềm'),(57,1,'Nho Ti Ty Phu','Tác phẩm của Victor Hugo kể về hành trình của Jean Valjean, một cựu tù nhân tìm kiếm sự chuộc tội trong bối cảnh cách mạng Pháp.','sp52.jpg',130000,18,1976,_binary '',31,0,3,300,'14 x 21 cm',280,'Bìa mềm'),(73,6,'Đề Minh Họa Tốt Nghiệp THPT 2025','Tài liệu đề minh họa chính thức cho kỳ thi THPT 2025, giúp học sinh làm quen với cấu trúc đề và luyện tập các môn thi quan trọng.','sp53.jpg',130000,50,2023,_binary '',4,0,3,500,'16 x 24 cm',400,'Bìa cứng'),(74,6,'Đề Minh Họa Tốt Nghiệp THPT 2025','Bộ đề minh họa dành cho kỳ thi THPT 2025, cung cấp các bài thi mẫu để học sinh ôn luyện và chuẩn bị tốt nhất cho kỳ thi.','sp54.jpg',50000,47,2023,_binary '',4,0,3,500,'16 x 24 cm',400,'Bìa cứng'),(75,6,'Đề Minh Họa Tốt Nghiệp THPT 2025','Tài liệu đề minh họa chính thức cho kỳ thi THPT 2025, hỗ trợ học sinh rèn luyện kỹ năng làm bài và nắm vững kiến thức cần thiết.','sp55.jpg',65000,49,2023,_binary '',4,0,3,500,'16 x 24 cm',400,'Bìa cứng'),(76,6,'Đề Minh Họa Tốt Nghiệp THPT 2025','Tài liệu đề minh họa tổng hợp dành cho kỳ thi THPT 2025, cung cấp các bài thi mẫu chi tiết cho tất cả các môn học, giúp học sinh luyện tập và làm quen với cấu trúc đề thi.','sp56.jpg',200000,49,2023,_binary '',4,0,3,500,'16 x 24 cm',400,'Bìa cứng'),(77,6,'Tuyển Sinh 10 & Các Đề Toán Thực Tế (Theo CTGDPT 2018)','Tuyển tập 10 đề toán thực tế và bài tập kèm lời giải chi tiết, giúp học sinh lớp 10 ôn luyện và nâng cao kỹ năng giải toán.','sp57.jpg',200000,49,2023,_binary '',4,0,3,500,'16 x 24 cm',400,'Bìa cứng'),(78,6,'Hướng Dẫn Ôn Thi Vào Lớp 10 (Định Hướng Năng Lực)','Hướng dẫn chi tiết cách ôn thi vào lớp 10 môn Văn, bao gồm các bài tập và kỹ năng viết văn, phù hợp cho học sinh chuẩn bị thi.','sp58.jpg',200000,50,2023,_binary '',4,0,3,500,'16 x 24 cm',400,'Bìa cứng'),(79,6,'Hướng Dẫn Ôn Thi Vào Lớp 10 (Định Hướng Năng Lực)','Sách hướng dẫn ôn thi vào lớp 10 môn Văn, cung cấp các bài tập và phương pháp học tập hiệu quả để học sinh đạt kết quả cao.','sp59.jpg',130000,50,2023,_binary '',4,0,3,500,'16 x 24 cm',400,'Bìa cứng'),(80,6,'Đề Minh Họa Thi Vào 10','Tài liệu đề minh họa chính thức kỳ thi đánh giá đầu vào lớp 10 tại TP.HCM, giúp học sinh làm quen với dạng đề và ôn luyện hiệu quả.','sp60.jpg',50000,50,2023,_binary '',4,0,3,500,'16 x 24 cm',400,'Bìa cứng'),(81,6,'25 Đề Ôn Thi ĐGNL ĐH Quốc Gia TP.HCM','Tài liệu gồm 25 đề thi mẫu dành cho kỳ thi đánh giá năng lực của Đại học Quốc gia TP.HCM, giúp học sinh luyện tập, làm quen với cấu trúc đề và nâng cao kỹ năng giải đề hiệu quả.','sp61.jpg',65000,50,2023,_binary '',4,0,3,500,'16 x 24 cm',400,'Bìa cứng'),(82,6,'50 Đề Thực Chiến Luyện Thi Anh Vào Lớp 10 (Có Đáp Án)','Tuyển tập 50 đề thi thử môn Tiếng Anh vào lớp 10, kèm hướng dẫn chi tiết, giúp học sinh luyện tập và nâng cao kỹ năng tiếng Anh.','sp62.jpg',200000,50,2023,_binary '',4,0,3,500,'16 x 24 cm',400,'Bìa cứng'),(83,6,'Hướng Dẫn Ôn Thi Tuyển Sinh Lớp 10 - Tiếng Anh (Tái Bản 2024)','Hướng dẫn ôn thi vào lớp 10 môn Toán, bao gồm các bài tập thực tế và phương pháp giải bài hiệu quả dành cho học sinh.','sp63.jpg',200000,49,2023,_binary '',4,0,3,500,'16 x 24 cm',400,'Bìa cứng'),(84,6,'Hướng Dẫn Ôn Thi Vào Lớp 10 (Định Hướng Năng Lực)','Sách hướng dẫn ôn thi vào lớp 10 môn Văn, cung cấp các bài tập chuyên sâu và kỹ năng làm bài để học sinh chuẩn bị tốt nhất.','sp64.jpg',200000,47,2023,_binary '',4,0,3,500,'16 x 24 cm',400,'Bìa cứng'),(85,6,'Global Success - Tiếng Anh 9 - Sách Học Sinh (2024)','Tài liệu học tiếng Anh lớp 9, tập trung vào kỹ năng giao tiếp và từ vựng, giúp học sinh đạt thành công trong học tập và thi cử.','sp65.jpg',200000,46,2023,_binary '',4,0,3,500,'16 x 24 cm',400,'Bìa cứng'),(86,6,'Đề Minh Họa Tốt Nghiệp THPT 2025','Tài liệu đề minh họa chính thức cho kỳ thi THPT 2025, cung cấp các bài thi mẫu để học sinh luyện tập và làm quen với dạng đề.','sp66.jpg',200000,43,2023,_binary '',4,0,3,500,'16 x 24 cm',400,'Bìa cứng'),(87,6,'Đề Minh Họa Tốt Nghiệp THPT 2025','Bộ đề minh họa dành cho kỳ thi THPT 2025, hỗ trợ học sinh ôn luyện các môn thi quan trọng và cải thiện kỹ năng làm bài.','sp67.jpg',200000,44,2023,_binary '',4,0,3,500,'16 x 24 cm',400,'Bìa cứng'),(90,2,'Văn Học Dân Gian Chơ Ro - Thể Loại Và Tác Phẩm','Cuốn sách của Dale Carnegie hướng dẫn cách xây dựng mối quan hệ, giao tiếp hiệu quả và tạo ảnh hưởng tích cực trong cuộc sống.','sp68.jpg',150000,49,2023,_binary '',7,0,3,380,'16 x 24 cm',320,'Bìa mềm'),(91,2,'Nhà Văn - Cuộc Đời Và Tác Phẩm','Tác phẩm của Nguyễn Nhật Ánh kể về tuổi thơ trong sáng với những rung động đầu đời, đong đầy cảm xúc và ký ức tuổi học trò.','sp69.jpg',180000,58,2023,_binary '',7,0,3,380,'16 x 24 cm',320,'Bìa mềm'),(92,2,'Soạn Giả Viễn Châu - Tác Giả Và Tác Phẩm Vọng Cổ','Cuốn sách giới thiệu tiểu sử và sự nghiệp của soạn giả Viễn Châu, \"vua vọng cổ\" của sân khấu cải lương Việt Nam, với hơn 2.000 bài vọng cổ và 50 vở tuồng nổi tiếng. Tác phẩm phân tích kỹ lưỡng phong cách sáng tác, đặc biệt là thể loại tân cổ giao duyên và vọng cổ hài, đồng thời tôn vinh những đóng góp của ông cho văn hóa Nam Bộ.','sp70.jpg',200000,44,2024,_binary '',7,0,3,380,'16 x 24 cm',320,'Bìa mềm'),(93,2,'Abraham Lincoln - Các Tác Phẩm Và Suy Ngẫm','Tuyển tập các tác phẩm của nhiều tác giả, tái hiện cuộc đời và sự nghiệp của Abraham Lincoln, vị tổng thống vĩ đại của nước Mỹ.','sp71.jpg',250000,46,2024,_binary '',7,0,3,380,'16 x 24 cm',320,'Bìa mềm'),(94,2,'Hiểu Và Thưởng Thức Một Tác Phẩm Mỹ Thuật','Cuốn sách kể lại cuộc đời và sự nghiệp của Michelangelo, một trong những nghệ sĩ vĩ đại nhất thời Phục Hưng, với những đóng góp nghệ thuật vượt thời gian.','sp72.jpg',220000,65,2023,_binary '',7,0,3,380,'16 x 24 cm',320,'Bìa mềm'),(95,2,'Michelangelo - Cuộc Đời Và Tác Phẩm Qua 500 Hình Ảnh','Tác phẩm kinh điển của Quentin Blake, kể về hành trình phiêu lưu của một cậu bé với trí tưởng tượng phong phú, đầy màu sắc và sáng tạo.','sp73.jpg',300000,40,2024,_binary '',7,0,3,380,'16 x 24 cm',320,'Bìa mềm'),(96,2,'Tác Phẩm Kinh Điển Của Quentin Blake - Diệc Và Sếu','Cuốn sách khám phá cuộc đời và sự nghiệp của Leonardo da Vinci, thiên tài Phục Hưng với những đóng góp trong nghệ thuật và khoa học.','sp74.jpg',280000,50,2023,_binary '',7,0,3,380,'16 x 24 cm',320,'Bìa mềm'),(97,2,'Tác Phẩm Kinh Điển Của Quentin Blake - Cừu Và Dê','Tác phẩm kể lại cuộc đời của Leonardo da Vinci, từ góc nhìn văn học, khắc họa hành trình sáng tạo và những tác phẩm vĩ đại của ông.','sp75.jpg',270000,56,2024,_binary '',7,0,3,380,'16 x 24 cm',320,'Bìa mềm'),(98,2,'Leonardo Da Vinci - Cuộc Đời Và Tác Phẩm Qua 500 Hình Ảnh','Tuyển tập các bài viết về cuộc đời và sự nghiệp của Tú Xương, nhà thơ trào phúng nổi tiếng của Việt Nam, phản ánh xã hội thời bấy giờ.','sp76.jpg',320000,44,2023,_binary '',7,0,3,380,'16 x 24 cm',320,'Bìa mềm'),(99,2,'Tác Phẩm Chọn Lọc - Văn Học Mỹ - Ông Già Và Biển Cả','Tác phẩm của Nguyễn Nhật Ánh kể về tuổi trẻ đầy mơ mộng, với những câu chuyện tình yêu và tình bạn trong sáng, đậm chất văn học Việt.','sp77.jpg',350000,50,2024,_binary '',7,0,3,380,'16 x 24 cm',320,'Bìa mềm'),(100,2,'Tủ Sách Vàng - Tác Phẩm Chọn Lọc Dành Cho Thiếu Nhi - Đen Và Béo','Tuyển tập các tác phẩm của Tú Vương, nhà thơ Việt Nam, với những vần thơ sâu lắng, phản ánh tình yêu quê hương và con người.','sp78.jpg',330000,55,2023,_binary '',7,0,3,380,'16 x 24 cm',320,'Bìa mềm'),(101,2,'Thế Giới Nghệ Thuật Trong Bảo Tàng','Cuốn sách khám phá nghệ thuật thế giới qua các bộ sưu tập tại Bảo tàng Tate, giới thiệu những tác phẩm nổi bật và câu chuyện đằng sau chúng.','sp79.jpg',120000,6,2025,_binary '',7,0,3,380,'16 x 24 cm',320,'Bìa mềm'),(102,2,'10 Vạn Câu Hỏi Vì Sao? - Khám Phá Các Thể Loại Và Lợi Ích Của Âm Nhạc','Tài liệu giáo khoa dành cho trẻ em, giải đáp 10 câu hỏi \"Vì sao?\" về các hành tinh, giúp trẻ khám phá vũ trụ một cách thú vị và dễ hiểu.','sp80.jpg',200000,10,2025,_binary '',7,0,3,380,'16 x 24 cm',320,'Bìa mềm'),(103,2,'Khám Phá Và Thực Hành Steam Qua Tác Phẩm Kinh Điển - Khu Vườn Bí Mật','Sách hướng dẫn thực hành STEAM qua các dự án thực tế, giúp học sinh phát triển tư duy sáng tạo và kỹ năng giải quyết vấn đề.','sp81.jpg',200000,10,2025,_binary '',7,0,3,380,'16 x 24 cm',320,'Bìa mềm'),(104,2,'Tác Phẩm Chọn Lọc - Văn Học Mỹ - Bé Năm Mới Và Những Truyện Ngắn Khác','Tuyển tập các tác phẩm văn học Mỹ chọn lọc, giới thiệu những câu chuyện sâu sắc và phong cách viết độc đáo của các tác giả nổi tiếng.','sp82.jpg',200000,10,2024,_binary '',7,0,3,380,'16 x 24 cm',320,'Bìa mềm'),(106,1,'Sách mới 2025','null','sp88.jpg',144000,6,2025,_binary '',7,0,3,300,'14 x 21 cm',280,'Bìa mềm');

UN

--
-- Table structure for table `sanpham_anh`
--

DROP TABLE IF EXISTS `sanpham_anh`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sanpham_anh` (
  `Id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `MaSP` int NOT NULL,
  `FileName` varchar(255) NOT NULL,
  `SortOrder` int NOT NULL DEFAULT '0',
  `CreatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `UpdatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`Id`),
  UNIQUE KEY `uq_sanpham_anh_masp_filename` (`MaSP`,`FileName`),
  KEY `idx_sanpham_anh_masp_sort` (`MaSP`,`SortOrder`),
  CONSTRAINT `fk_sanpham_anh_masp` FOREIGN KEY (`MaSP`) REFERENCES `sanpham` (`MaSP`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=262 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sanpham_anh`
--



INSERT INTO `sanpham_anh` VALUES (1,1,'sp01_1.jpg',1,'2025-10-30 13:48:12','2025-10-30 13:48:12'),(2,11,'sp01_2.jpg',2,'2025-10-30 13:48:12','2025-10-30 13:48:12'),(3,1,'sp01_3.jpg',3,'2025-10-30 13:48:12','2025-10-30 13:48:12'),(4,2,'sp02_3.jpg',3,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(5,2,'sp02_2.jpg',2,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(6,2,'sp02_1.jpg',1,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(7,3,'sp03_3.jpg',3,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(8,3,'sp03_2.jpg',2,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(9,3,'sp03_1.jpg',1,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(10,4,'sp04_3.jpg',3,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(11,4,'sp04_2.jpg',2,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(12,4,'sp04_1.jpg',1,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(13,5,'sp05_3.jpg',3,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(14,5,'sp05_2.jpg',2,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(15,5,'sp05_1.jpg',1,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(16,6,'sp06_3.jpg',3,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(17,6,'sp06_2.jpg',2,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(18,6,'sp06_1.jpg',1,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(19,7,'sp07_3.jpg',3,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(20,7,'sp07_2.jpg',2,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(21,7,'sp07_1.jpg',1,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(22,8,'sp08_3.jpg',3,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(23,8,'sp08_2.jpg',2,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(24,8,'sp08_1.jpg',1,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(25,9,'sp09_3.jpg',3,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(26,9,'sp09_2.jpg',2,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(27,9,'sp09_1.jpg',1,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(28,10,'sp10_3.jpg',3,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(29,10,'sp10_2.jpg',2,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(30,10,'sp10_1.jpg',1,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(31,11,'sp11_3.jpg',3,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(32,11,'sp11_2.jpg',2,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(33,11,'sp11_1.jpg',1,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(34,12,'sp12_3.jpg',3,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(35,12,'sp12_2.jpg',2,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(36,12,'sp12_1.jpg',1,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(37,13,'sp13_3.jpg',3,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(38,13,'sp13_2.jpg',2,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(39,13,'sp13_1.jpg',1,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(40,14,'sp14_3.jpg',3,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(41,14,'sp14_2.jpg',2,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(42,14,'sp14_1.jpg',1,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(43,15,'sp15_3.jpg',3,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(44,15,'sp15_2.jpg',2,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(45,15,'sp15_1.jpg',1,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(46,16,'sp16_3.jpg',3,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(47,16,'sp16_2.jpg',2,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(48,16,'sp16_1.jpg',1,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(49,17,'sp17_3.jpg',3,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(50,17,'sp17_2.jpg',2,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(51,17,'sp17_1.jpg',1,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(52,18,'sp18_3.jpg',3,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(53,18,'sp18_2.jpg',2,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(54,18,'sp18_1.jpg',1,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(55,19,'sp19_3.jpg',3,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(56,19,'sp19_2.jpg',2,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(57,19,'sp19_1.jpg',1,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(58,20,'sp20_3.jpg',3,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(59,20,'sp20_2.jpg',2,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(60,20,'sp20_1.jpg',1,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(61,21,'sp21_3.jpg',3,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(62,21,'sp21_2.jpg',2,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(63,21,'sp21_1.jpg',1,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(64,22,'sp22_3.jpg',3,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(65,22,'sp22_2.jpg',2,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(66,22,'sp22_1.jpg',1,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(67,23,'sp23_3.jpg',3,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(68,23,'sp23_2.jpg',2,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(69,23,'sp23_1.jpg',1,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(70,24,'sp24_3.jpg',3,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(71,24,'sp24_2.jpg',2,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(72,24,'sp24_1.jpg',1,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(73,25,'sp25_3.jpg',3,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(74,25,'sp25_2.jpg',2,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(75,25,'sp25_1.jpg',1,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(76,26,'sp26_3.jpg',3,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(77,26,'sp26_2.jpg',2,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(78,26,'sp26_1.jpg',1,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(79,27,'sp27_3.jpg',3,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(80,27,'sp27_2.jpg',2,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(81,27,'sp27_1.jpg',1,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(82,28,'sp28_3.jpg',3,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(83,28,'sp28_2.jpg',2,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(84,28,'sp28_1.jpg',1,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(85,29,'sp29_3.jpg',3,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(86,29,'sp29_2.jpg',2,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(87,29,'sp29_1.jpg',1,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(88,30,'sp30_3.jpg',3,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(89,30,'sp30_2.jpg',2,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(90,30,'sp30_1.jpg',1,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(91,31,'sp31_3.jpg',3,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(92,31,'sp31_2.jpg',2,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(93,31,'sp31_1.jpg',1,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(94,32,'sp32_3.jpg',3,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(95,32,'sp32_2.jpg',2,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(96,32,'sp32_1.jpg',1,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(97,33,'sp33_3.jpg',3,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(98,33,'sp33_2.jpg',2,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(99,33,'sp33_1.jpg',1,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(100,34,'sp34_3.jpg',3,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(101,34,'sp34_2.jpg',2,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(102,34,'sp34_1.jpg',1,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(103,35,'sp35_3.jpg',3,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(104,35,'sp35_2.jpg',2,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(105,35,'sp35_1.jpg',1,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(106,36,'sp36_3.jpg',3,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(107,36,'sp36_2.jpg',2,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(108,36,'sp36_1.jpg',1,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(109,37,'sp37_3.jpg',3,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(110,37,'sp37_2.jpg',2,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(111,37,'sp37_1.jpg',1,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(112,38,'sp38_3.jpg',3,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(113,38,'sp38_2.jpg',2,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(114,38,'sp38_1.jpg',1,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(115,39,'sp39_3.jpg',3,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(116,39,'sp39_2.jpg',2,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(117,39,'sp39_1.jpg',1,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(118,40,'sp40_3.jpg',3,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(119,40,'sp40_2.jpg',2,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(120,40,'sp40_1.jpg',1,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(121,41,'sp41_3.jpg',3,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(122,41,'sp41_2.jpg',2,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(123,41,'sp41_1.jpg',1,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(124,42,'sp42_3.jpg',3,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(125,42,'sp42_2.jpg',2,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(126,42,'sp42_1.jpg',1,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(127,43,'sp43_3.jpg',3,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(128,43,'sp43_2.jpg',2,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(129,43,'sp43_1.jpg',1,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(130,44,'sp44_3.jpg',3,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(131,44,'sp44_2.jpg',2,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(132,44,'sp44_1.jpg',1,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(133,45,'sp45_3.jpg',3,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(134,45,'sp45_2.jpg',2,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(135,45,'sp45_1.jpg',1,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(136,51,'sp46_3.jpg',3,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(137,51,'sp46_2.jpg',2,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(138,51,'sp46_1.jpg',1,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(139,52,'sp47_3.jpg',3,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(140,52,'sp47_2.jpg',2,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(141,52,'sp47_1.jpg',1,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(142,53,'sp48_3.jpg',3,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(143,53,'sp48_2.jpg',2,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(144,53,'sp48_1.jpg',1,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(145,54,'sp49_3.jpg',3,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(146,54,'sp49_2.jpg',2,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(147,54,'sp49_1.jpg',1,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(148,55,'sp50_3.jpg',3,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(149,55,'sp50_2.jpg',2,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(150,55,'sp50_1.jpg',1,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(151,56,'sp51_3.jpg',3,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(152,56,'sp51_2.jpg',2,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(153,56,'sp51_1.jpg',1,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(154,57,'sp52_3.jpg',3,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(155,57,'sp52_2.jpg',2,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(156,57,'sp52_1.jpg',1,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(157,73,'sp53_3.jpg',3,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(158,73,'sp53_2.jpg',2,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(159,73,'sp53_1.jpg',1,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(160,74,'sp54_3.jpg',3,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(161,74,'sp54_2.jpg',2,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(162,74,'sp54_1.jpg',1,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(163,75,'sp55_3.jpg',3,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(164,75,'sp55_2.jpg',2,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(165,75,'sp55_1.jpg',1,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(166,76,'sp56_3.jpg',3,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(167,76,'sp56_2.jpg',2,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(168,76,'sp56_1.jpg',1,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(169,77,'sp57_3.jpg',3,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(170,77,'sp57_2.jpg',2,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(171,77,'sp57_1.jpg',1,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(172,78,'sp58_3.jpg',3,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(173,78,'sp58_2.jpg',2,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(174,78,'sp58_1.jpg',1,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(175,79,'sp59_3.jpg',3,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(176,79,'sp59_2.jpg',2,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(177,79,'sp59_1.jpg',1,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(178,80,'sp60_3.jpg',3,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(179,80,'sp60_2.jpg',2,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(180,80,'sp60_1.jpg',1,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(181,81,'sp61_3.jpg',3,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(182,81,'sp61_2.jpg',2,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(183,81,'sp61_1.jpg',1,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(184,82,'sp62_3.jpg',3,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(185,82,'sp62_2.jpg',2,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(186,82,'sp62_1.jpg',1,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(187,83,'sp63_3.jpg',3,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(188,83,'sp63_2.jpg',2,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(189,83,'sp63_1.jpg',1,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(190,84,'sp64_3.jpg',3,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(191,84,'sp64_2.jpg',2,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(192,84,'sp64_1.jpg',1,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(193,85,'sp65_3.jpg',3,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(194,85,'sp65_2.jpg',2,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(195,85,'sp65_1.jpg',1,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(196,86,'sp66_3.jpg',3,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(197,86,'sp66_2.jpg',2,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(198,86,'sp66_1.jpg',1,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(199,87,'sp67_3.jpg',3,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(200,87,'sp67_2.jpg',2,'2025-10-30 13:50:58','2025-10-30 13:50:58'),(201,87,'sp67_1.jpg',1,'2025-10-30 13:50:58','2025-10-30 13:50:58');

UN

--
-- Table structure for table `sanpham_yeuthich`
--

DROP TABLE IF EXISTS `sanpham_yeuthich`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sanpham_yeuthich` (
  `makh` int NOT NULL,
  `MaSP` int NOT NULL,
  `NgayThem` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`makh`,`MaSP`),
  KEY `idx_makh` (`makh`),
  KEY `idx_masp` (`MaSP`),
  CONSTRAINT `sanpham_yeuthich_ibfk_1` FOREIGN KEY (`makh`) REFERENCES `khachhang` (`makh`) ON DELETE CASCADE,
  CONSTRAINT `sanpham_yeuthich_ibfk_2` FOREIGN KEY (`MaSP`) REFERENCES `sanpham` (`MaSP`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Sản phẩm khách hàng đánh dấu yêu thích';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sanpham_yeuthich`
--




UN

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `shipment`
--




UN

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
) ENGINE=InnoDB AUTO_INCREMENT=116 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sp_khuyen_mai`
--



INSERT INTO `sp_khuyen_mai` VALUES (24,1,1),(25,1,2),(26,1,3),(27,1,4),(28,1,5),(30,2,7),(31,2,8),(32,2,9),(33,3,1),(34,3,2),(35,3,3),(36,3,4),(58,19,1),(57,19,2),(59,20,2),(60,20,4),(61,21,3),(62,21,4),(63,22,2),(64,22,3),(65,24,1),(66,24,2),(67,24,3),(68,24,4),(69,24,5),(71,25,7),(72,25,8),(73,25,9),(74,25,10),(75,25,11),(76,25,12),(77,26,1),(78,26,2),(79,26,3),(80,26,4),(81,26,5),(82,30,1),(83,30,2),(84,30,3),(85,30,4),(86,30,5),(88,31,8),(89,34,22),(90,34,23),(91,35,25),(92,35,26),(93,35,27),(94,36,23),(95,36,24),(96,36,25),(97,37,22),(98,37,23),(99,38,13),(100,38,14),(101,47,1),(102,47,2),(103,48,11),(105,48,12),(104,48,13),(106,54,7),(107,54,8),(108,55,7),(109,55,9),(110,56,7),(114,58,31),(113,58,32),(115,58,33),(112,58,35);

UN

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `staff`
--




UN

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `supplier`
--




UN

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
) ENGINE=InnoDB AUTO_INCREMENT=32 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tacgia`
--



INSERT INTO `tacgia` VALUES (1,'Nguyễn Nhật Ánh','1955-05-07','Việt Nam','Fujiko F. Fujio, tên thật Hiroshi Fujimoto (1933-1996), là họa sĩ truyện tranh Nhật Bản, người sáng tạo Doraemon năm 1969, bộ manga khoa học viễn tưởng nổi tiếng về chú mèo robot từ tương lai giúp cậu bé Nobita, đạt hơn 300 triệu bản bán ra, giành nhiều giải thưởng danh giá và trở thành biểu tượng văn hóa toàn cầu với bảo tàng riêng tại Kawasaki.','tg1.jpg'),(2,'Tô Hoài','1920-09-27','Việt Nam','Nam Cao, tên thật Trần Hữu Tri (1915-1951), là nhà văn hiện thực tiêu biểu của văn học Việt Nam thế kỷ 20, sinh ra trong một gia đình nông dân nghèo tại làng Đại Hoàng, tỉnh Hà Nam. Xuất thân từ hoàn cảnh khó khăn, ông học đến trung học ở Nam Định nhưng không tốt nghiệp do sức khỏe yếu và gia cảnh túng thiếu, sau đó mưu sinh bằng nhiều nghề như dạy học, làm thư ký, và viết báo. Nam Cao bắt đầu sáng tác từ những năm 1930, nổi bật với tác phẩm Chí Phèo (1941), khắc họa số phận bi thảm của người nông dân trong xã hội phong kiến nửa thuộc địa, cùng các truyện ngắn như Lão Hạc, Đời mưa gió, thể hiện tư tưởng nhân đạo sâu sắc và tài năng phân tích tâm lý nhân vật. Ông gia nhập Hội Văn hóa Cứu quốc năm 1943, tích cực tham gia cách mạng, và hy sinh năm 1951 trong một chuyến công tác tại Ninh Bình, để lại di sản văn học giàu giá trị về con người và xã hội.','tg2.jpg'),(3,'Nam Cao','1915-10-29','Việt Nam','Ernest Hemingway (1899–1961), nhà văn và nhà báo người Mỹ, từng tham gia Chiến tranh thế giới lần thứ I, nổi tiếng với nguyên lý “tảng băng trôi” trong văn phong kiệm lời nhưng giàu ý nghĩa, để lại các tác phẩm kinh điển như Ông già và biển cả – một bản anh hùng ca ngợi sức lao động và khát vọng con người, Chuông nguyện hồn ai, và được vinh danh với giải Pulitzer 1953 cùng Nobel Văn học 1954.','tg3.jpg'),(4,' PGS.TS. Bùi Mạnh Hùng','1765-01-03','Việt Nam','Trao đổi với PV báo Dân Việt, PGS.TS. Bùi Mạnh Hùng, Điều phối viên chính Ban phát triển Chương trình Giáo dục phổ thông 2018, Tổng Chủ biên SGK môn Tiếng Việt – Ngữ văn, bộ sách \"Kết nối tri thức với cuộc sống\", cho hay: \"Mới đây, mạng xã hội có ý kiến trái chiều về bài thơ \"Tiếng hạt nảy mầm\" của tác giả Tô Hà được dùng làm văn bản đọc ở bài 5, chủ điểm \"Thế giới tuổi thơ\" trong sách giáo khoa (SGK) Tiếng Việt 5, bộ sách \"Kết nối tri thức với cuộc sống\". \".','tg4.jpg'),(5,'Xuân Diệu','1915-10-29','Việt Nam','Xuân Diệu quê ở làng Trảo Nha, huyện Can Lộc, tỉnh Hà Tĩnh nhưng sinh tại quê mẹ Gò Bồi, thôn Tùng Giản, xã Phước Hòa, huyện Tuy Phước, tỉnh Bình Định.[3] Cha là ông Ngô Xuân Thọ (trong tộc phả ghi là Ngô Xuân Thụ) và mẹ là bà Nguyễn Thị Hiệp. Sau này ông lấy tên làng là Trảo Nha làm bút danh. Xuân Diệu sống ở Tuy Phước đến năm 11 tuổi thì ông vào Nam học ở Quy Nhơn.[4]\".','tg5.jpg'),(6,' Isao Takahata','1920-10-04','Nhật Bản',' Isao Takahata bắt đầu sự nghiệp làm phim hoạt hình với công việc tại xưởng Toei từ năm 1959. Đây cũng là nơi giúp ông lần đầu gặp gỡ người cộng sự lâu năm Hayao Miyazaki.Cùng với nhau, họ lập nên xưởng phim hoạt hình lừng danh Studio Ghibli vào năm 1985. Theo giới truyền thông Nhật Bản, Takahata và Miyazaki vừa là bạn, nhưng cũng vừa là đối thủ trong dòng phim hoạt hình.\".','tg6.jpg'),(7,'William Shakespeare','1975-03-15','Hoa Kỳ','Shakespeare bắt đầu sự nghiệp của mình trong lĩnh vực diễn xuất trước khi chuyển sang viết kịch. Vào những năm 1590, trong thời kỳ Elizabeth, ông đã viết những vở kịch đầu tiên và nhanh chóng trở thành một trong những nhà văn hàng đầu. Dù vậy, cuộc đời của ông không chỉ toàn những vinh quang mà còn đầy thử thách. Ông phải đối mặt với nhiều khó khăn trong cuộc sống, bao gồm việc nuôi dưỡng một gia đình đông con và kiếm tiền từ việc viết tác phẩm.','tg7.jpg'),(8,'George Orwell','1903-06-25','Anh','George Orwell (tên thật Eric Arthur Blair) là nhà văn và nhà báo người Anh nổi tiếng với các tác phẩm phê phán chính trị như 1984 và Animal Farm, khám phá chủ đề độc tài và giám sát xã hội.','tg8.jpg'),(9,'Harper Lee','1926-04-28','Mỹ','Harper Lee là nhà văn Mỹ, tác giả của To Kill a Mockingbird – cuốn sách đoạt Pulitzer 1961, khám phá phân biệt chủng tộc và công lý ở miền Nam nước Mỹ.','tg9.jpg'),(10,'F. Scott Fitzgerald','1896-09-24','Mỹ','F. Scott Fitzgerald là nhà văn Mỹ đại diện cho \"Thế hệ mất mát\", nổi tiếng với The Great Gatsby miêu tả giấc mơ Mỹ tan vỡ trong thập niên 1920 xa hoa.','tg10.jpg'),(11,'Aldous Huxley','1894-07-26','Anh','Aldous Huxley là nhà văn Anh, tác giả Brave New World – tiểu thuyết dystopia dự báo xã hội kiểm soát bởi công nghệ và tiêu dùng, viết năm 1931.','tg11.jpg'),(12,'Eckhart Tolle','1948-02-16','Đức','Eckhart Tolle là nhà tâm linh và tác giả self-help người Đức-Canada, nổi tiếng với The Power of Now (1997), cuốn sách bán chạy nhất về chánh niệm và hiện tại, ảnh hưởng đến hàng triệu người qua các bài giảng và sách.','tg12.jpg'),(13,'James Redfield','1950-12-19','Mỹ','James Redfield là tác giả Mỹ của The Celestine Prophecy (1993), một tiểu thuyết tâm linh bán hơn 20 triệu bản, khám phá các insight về năng lượng và sự đồng bộ trong cuộc sống.','tg13.jpg'),(14,'C.S. Lewis','1898-11-29','Anh','C.S. Lewis là nhà văn, học giả và nhà thần học Anh, tác giả Mere Christianity (1952) – cuốn sách apologetics Kitô giáo kinh điển, cũng nổi tiếng với The Chronicles of Narnia.','tg14.jpg'),(15,'Benjamin Hoff','1946-12-30','Mỹ','Benjamin Hoff là tác giả và họa sĩ Mỹ, nổi tiếng với The Tao of Pooh (1982), giải thích triết lý Đạo giáo qua nhân vật Winnie-the-Pooh, bán hơn 2 triệu bản.','tg15.jpg'),(16,'Brené Brown','1965-11-18','Mỹ','Brené Brown là nhà nghiên cứu và tác giả Mỹ về sự dũng cảm và dễ bị tổn thương, tác giả Daring Greatly (2012) – bestseller về lòng dũng cảm trong lãnh đạo và cuộc sống.','tg16.jpg'),(17,'Rachel Hollis','1982-01-01','Mỹ','Rachel Hollis là tác giả và diễn giả Mỹ về self-help, nổi tiếng với Girl, Wash Your Face (2018) – cuốn sách truyền cảm hứng cho phụ nữ vượt qua những lời dối trá tự áp đặt.','tg17.jpg'),(18,'Don Miguel Ruiz','1952-09-27','Mexico','Don Miguel Ruiz là tác giả và nhà tâm linh Mexico, sáng tạo The Four Agreements (1997) – bốn nguyên tắc Toltec cổ đại để đạt tự do cá nhân và hạnh phúc.','tg18.jpg'),(19,'Simon Sinek','1973-10-09','Anh-Mỹ','Simon Sinek là tác giả và diễn giả lãnh đạo, nổi tiếng với Start with Why (2009) – mô hình \"Golden Circle\" giúp doanh nghiệp và cá nhân tìm mục đích cốt lõi.','tg19.jpg'),(20,'Nicholas Sparks','1965-12-31','Mỹ','Nicholas Sparks là tác giả lãng mạn Mỹ, nổi tiếng với The Notebook (1996) – câu chuyện tình yêu vượt thời gian, đã được chuyển thể thành phim thành công.','tg20.jpg'),(21,'Diana Gabaldon','1952-01-11','Mỹ','Diana Gabaldon là tác giả series Outlander (1991), kết hợp lịch sử, lãng mạn và du hành thời gian, bán hơn 50 triệu bản và chuyển thể thành series TV.','tg21.jpg'),(22,'Graeme Simsion','1956-06-17','Australia','Graeme Simsion là tác giả và lập trình viên Australia, nổi tiếng với The Rosie Project (2013) – tiểu thuyết hài lãng mạn về một giáo sư Asperger tìm tình yêu.','tg22.jpg'),(23,'John Green','1977-10-24','Mỹ','John Green là tác giả trẻ Mỹ, nổi tiếng với The Fault in Our Stars (2012) – câu chuyện tình yêu giữa hai thiếu niên ung thư, bestseller và phim bom tấn.','tg23.jpg'),(24,'Jojo Moyes','1969-12-25','Anh','Jojo Moyes là tác giả Anh về tiểu thuyết lãng mạn đương đại, nổi tiếng với Me Before You (2012) – câu chuyện tình yêu và lựa chọn đạo đức, bán hơn 14 triệu bản.','tg24.jpg'),(25,'Mark Twain','1835-11-30','Mỹ','Mark Twain (tên thật Samuel Clemens) là nhà văn Mỹ hài hước, tác giả The Adventures of Tom Sawyer (1876) – kinh điển về tuổi thơ phiêu lưu bên sông Mississippi.','tg25.jpg'),(26,'Fujiko F. Fujio','1933-12-01','Nhật Bản','Fujiko F. Fujio (tên thật Hiroshi Fujimoto) là họa sĩ manga Nhật, sáng tạo Doraemon (1969) – chú mèo máy từ tương lai, bán hơn 300 triệu bản toàn cầu.','tg26.jpg'),(27,'Huỳnh Thái Ngọc','1994-01-01','Việt Nam','Huỳnh Thái Ngọc là họa sĩ truyện tranh Việt Nam, sáng tạo Thỏ Bảy Màu (2014) – series hài hước về chú thỏ đa màu sắc, phổ biến trên mạng xã hội.','tg27.jpg'),(28,'Băng Hà',NULL,'Việt Nam','Băng Hà là biên soạn viên sách thiếu nhi Việt Nam, chủ biên Trái Đất và Vũ Trụ (2019) – sách khoa học phổ thông dành cho trẻ em 5-15 tuổi.','tg28.jpg'),(29,'Jonathan Swift','1667-11-30','Ireland','Jonathan Swift là nhà văn và nhà thần học Ireland, tác giả Gulliver\'s Travels (1726) – tiểu thuyết châm bi xã hội qua các chuyến phiêu lưu kỳ ảo.','tg29.jpg'),(30,'Jules Verne','1828-02-08','Pháp','Jules Verne là nhà văn khoa học viễn tưởng Pháp, \"cha đẻ của khoa học viễn tưởng\", tác giả 20,000 Leagues Under the Sea (1870) – cuộc phiêu lưu dưới đại dương.','tg30.jpg'),(31,'David Walliams','1971-08-20','Anh','David Walliams là tác giả và diễn viên hài Anh, nổi tiếng với sách thiếu nhi như Nhóc Tì Tỷ Phú (2023) – câu chuyện hài hước về cậu bé tỷ phú nhí.','tg31.jpg');

UN

--
-- Table structure for table `taikhoan`
--

DROP TABLE IF EXISTS `taikhoan`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `taikhoan` (
  `MaTK` int NOT NULL AUTO_INCREMENT,
  `TenTK` varchar(20) NOT NULL,
  `MatKhau` varchar(255) DEFAULT NULL,
  `MaQuyen` int NOT NULL,
  `NgayTao` date DEFAULT NULL,
  `TinhTrang` bit(1) DEFAULT NULL,
  PRIMARY KEY (`MaTK`),
  UNIQUE KEY `TenTK` (`TenTK`),
  KEY `FK_TaiKhoan_NhomQuyen` (`MaQuyen`),
  CONSTRAINT `FK_TaiKhoan_NhomQuyen` FOREIGN KEY (`MaQuyen`) REFERENCES `nhomquyen` (`MaNQ`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `taikhoan`
--



INSERT INTO `taikhoan` VALUES (2,'NV002','$2a$10$nM64qg3pvImNupjujv4BS.u0aOMlitXMkisqGqrSi/eAcKidtYgLa',1,'2021-09-22',_binary ''),(3,'NV003','$2a$10$b.w9W.e5GrO2S6oqwQqMbeCpxADJlzg46dbwvTdJu45A1EdfD3Ogy',2,'2021-09-22',_binary ''),(4,'NV004','$2a$10$K7j3oCPV44B2L0Lh07RZu.d708Ql3q4W2ya5/wyajl1xRub.dygCG',2,'2021-09-22',_binary ''),(5,'NV005','$2a$10$uak8WmKiRF4vHM717QHMc.jArmJQ9y29CgrxecSUuKW4unS3xrXQC',2,'2021-09-26',_binary ''),(6,'NV006','$2a$10$jzqxbhWk1m9Oqe94zIGL/.4Ylj/6S3joLlLwx5SfMuNKg2R8fxHBa',2,'2023-01-27',_binary ''),(7,'NV007','$2a$10$NsKfhM8v3a99vCxDd2tCDeUTkkdt42mm1WkRNL11UooskZIqmLxsa',3,'2023-03-28',_binary ''),(8,'NV008','$2a$10$tu.RcfW5e9IKczXywdOXwOZ08qOeEgLs3hvqV7Edn1y4SNGI9rV5e',3,'2023-03-29',_binary ''),(9,'NV009','$2a$10$hmKu11u1ycyR2iajUW6DIe5OQ6Ln3RLMwN10dbmdYcSncrEK6BP8O',3,'2021-09-22',_binary ''),(12,'NV012','$2a$10$LBbj3Ya9Ta.YN.UDP9B/H.3WmzmTS42e95yR3I2AsuATtXy6ODSqS',1,'2025-05-13',_binary ''),(13,'NV013','$2a$10$3t8OxZvfyyq0skfhA8Ggt.C96C6QykZD0QcJmfgK.JLDHMICaUD4G',3,'2025-09-11',_binary ''),(14,'7','$2a$10$TImQsfxDlz1milVlg2AvEe6uyn3jc0cbt2O.RKRKVucZaSpe1cbIK',5,'2025-09-16',_binary '');

UN

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
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `theloai`
--



INSERT INTO `theloai` VALUES (1,'Văn học',_binary ''),(2,'Khoa học viễn tưởng',_binary ''),(3,'Huyền bí',_binary ''),(4,'Lịch sử',_binary ''),(5,'Trinh thám',_binary ''),(6,'Khoa học',_binary ''),(7,'Tôn giáo và tâm linh',_binary ''),(8,'Self-help',_binary ''),(9,'Ngôn tình',_binary ''),(10,'Tiểu thuyết',_binary ''),(11,'Khoa học viễn tưởng',_binary ''),(12,'Huyền bí',_binary ''),(13,'Lịch sử',_binary ''),(14,'Trinh thám',_binary ''),(15,'Khoa học',_binary ''),(16,'Tôn giáo và tâm linh',_binary ''),(17,'Self-help1',_binary '\0'),(21,'hoạt hình ',_binary '');

UN

--
-- Table structure for table `tra_hang`
--

DROP TABLE IF EXISTS `tra_hang`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tra_hang` (
  `id` int NOT NULL AUTO_INCREMENT,
  `ma_don_hang` varchar(100) NOT NULL,
  `nguoi_tao` varchar(100) DEFAULT NULL,
  `loai_nguoi_tao` varchar(50) DEFAULT 'khachhang',
  `mat_hang` json DEFAULT NULL,
  `ly_do` text,
  `tep_dinh_kem` json DEFAULT NULL,
  `trang_thai` varchar(50) DEFAULT 'da_bao_cao',
  `so_tien_hoan` decimal(15,2) DEFAULT '0.00',
  `phuong_thuc_hoan` varchar(50) DEFAULT NULL,
  `kho_id` int DEFAULT NULL,
  `nguoi_phu_trach` int DEFAULT NULL,
  `ghi_chu` text,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tra_hang`
--



INSERT INTO `tra_hang` VALUES (1,'2','1','khachhang','[{\"so_luong\": 1, \"ma_san_pham\": \"1\"}]','test','[]','chap_thuan',0.00,NULL,NULL,NULL,NULL,'2025-10-08 09:15:53','2025-10-08 13:04:59'),(2,'153','19','khachhang','[{\"so_luong\": 1, \"ma_san_pham\": \"9\"}, {\"so_luong\": 1, \"ma_san_pham\": \"10\"}]','fg','[\"/uploads/tra_hang/1759906366864-0daqr1.png\"]','chap_thuan',0.00,NULL,NULL,NULL,NULL,'2025-10-08 09:16:30','2025-10-08 13:52:46'),(3,'151','19','khachhang','[{\"so_luong\": 1, \"ma_san_pham\": \"1\"}, {\"so_luong\": 1, \"ma_san_pham\": \"3\"}, {\"so_luong\": 1, \"ma_san_pham\": \"4\"}]','san phaam bi hu roi','[\"/uploads/tra_hang/1759906603616-2zbe3v.jpg\"]','chap_thuan',0.00,NULL,NULL,NULL,NULL,'2025-10-08 13:56:43','2025-10-08 13:57:18'),(4,'154','19','khachhang','[{\"so_luong\": 1, \"ma_san_pham\": \"1\"}]','he hẹ','[\"/uploads/tra_hang/1759913170655-r6wttt.png\"]','chap_thuan',0.00,NULL,NULL,NULL,NULL,'2025-10-08 15:46:10','2025-10-08 15:46:29'),(5,'155','19','khachhang','[{\"so_luong\": 1, \"ma_san_pham\": \"1\"}]','đơn hang sách bị lỗi','[\"/uploads/tra_hang/1759919940149-14den2.jpg\"]','chap_thuan',0.00,NULL,NULL,NULL,NULL,'2025-10-08 17:39:00','2025-10-08 17:39:19'),(6,'157','19','khachhang','[{\"so_luong\": 1, \"ma_san_pham\": \"2\"}]','1234','[\"/uploads/tra_hang/1759921688889-vpvr9z.png\"]','chap_thuan',0.00,NULL,NULL,NULL,NULL,'2025-10-08 18:08:08','2025-10-08 18:08:18'),(7,'156','19','khachhang','[{\"so_luong\": 1, \"ma_san_pham\": \"3\"}, {\"so_luong\": 1, \"ma_san_pham\": \"4\"}]','1234','[\"/uploads/tra_hang/1759927658971-3s5sbq.png\"]','chap_thuan',0.00,NULL,NULL,NULL,NULL,'2025-10-08 19:47:38','2025-10-08 19:47:51'),(8,'153','19','khachhang','[{\"so_luong\": 1, \"ma_san_pham\": \"9\"}, {\"so_luong\": 1, \"ma_san_pham\": \"10\"}]','hẹ hẹ','[\"/uploads/tra_hang/1759930312659-afd1ty.png\"]','chap_thuan',0.00,NULL,NULL,NULL,NULL,'2025-10-08 20:31:52','2025-10-08 20:32:08'),(9,'160','19','khachhang','[{\"so_luong\": 1, \"ma_san_pham\": \"3\"}, {\"so_luong\": 1, \"ma_san_pham\": \"4\"}, {\"so_luong\": 1, \"ma_san_pham\": \"5\"}]','1234444','[\"/uploads/tra_hang/1759932486592-rlsowx.png\"]','chap_thuan',0.00,NULL,NULL,NULL,NULL,'2025-10-08 21:08:06','2025-10-08 21:08:15'),(10,'161','19','khachhang','[{\"so_luong\": 1, \"ma_san_pham\": \"2\"}, {\"so_luong\": 1, \"ma_san_pham\": \"3\"}, {\"so_luong\": 1, \"ma_san_pham\": \"4\"}]','trả hàng','[\"/uploads/tra_hang/1759979848452-ln6ko6.jpg\"]','chap_thuan',0.00,NULL,NULL,NULL,NULL,'2025-10-09 10:17:28','2025-10-09 10:17:36'),(11,'162','19','khachhang','[{\"so_luong\": 1, \"ma_san_pham\": \"9\"}, {\"so_luong\": 1, \"ma_san_pham\": \"10\"}]','trar hang nha','[\"/uploads/tra_hang/1759982971866-7p5xbq.jpg\"]','chap_thuan',0.00,NULL,NULL,NULL,NULL,'2025-10-09 11:09:31','2025-10-09 11:09:40'),(12,'163','19','khachhang','[{\"so_luong\": 1, \"ma_san_pham\": \"18\"}, {\"so_luong\": 1, \"ma_san_pham\": \"19\"}, {\"so_luong\": 1, \"ma_san_pham\": \"20\"}]','12345','[\"/uploads/tra_hang/1759983569053-a3wdka.jpg\"]','chap_thuan',0.00,NULL,NULL,NULL,NULL,'2025-10-09 11:19:29','2025-10-09 11:19:41'),(13,'164','19','khachhang','[{\"so_luong\": 1, \"ma_san_pham\": \"7\"}, {\"so_luong\": 1, \"ma_san_pham\": \"8\"}]','1233321','[\"/uploads/tra_hang/1759992082586-44geke.png\"]','chap_thuan',0.00,NULL,NULL,NULL,NULL,'2025-10-09 13:41:22','2025-10-09 13:41:32'),(14,'165','19','khachhang','[{\"so_luong\": 1, \"ma_san_pham\": \"1\"}, {\"so_luong\": 1, \"ma_san_pham\": \"2\"}]','1233333','[\"/uploads/tra_hang/1759993542498-60l4g5.png\"]','chap_thuan',0.00,NULL,NULL,NULL,NULL,'2025-10-09 14:05:42','2025-10-09 14:05:52'),(15,'166','19','khachhang','[{\"so_luong\": 1, \"ma_san_pham\": \"5\"}]','11','[\"/uploads/tra_hang/1759993905035-ltlkuf.png\"]','chap_thuan',0.00,NULL,NULL,NULL,NULL,'2025-10-09 14:11:44','2025-10-09 14:11:53'),(16,'168','19','khachhang','[{\"so_luong\": 1, \"ma_san_pham\": \"4\"}, {\"so_luong\": 1, \"ma_san_pham\": \"5\"}]','ACX','[\"/uploads/tra_hang/1760003215382-sero0b.png\"]','chap_thuan',0.00,NULL,NULL,NULL,NULL,'2025-10-09 16:46:55','2025-10-09 16:47:06'),(17,'169','19','khachhang','[{\"so_luong\": 1, \"ma_san_pham\": \"8\"}]','12321','[\"/uploads/tra_hang/1760056423814-d87sfi.png\"]','chap_thuan',0.00,NULL,NULL,NULL,NULL,'2025-10-10 07:33:43','2025-10-10 07:33:56'),(18,'174','19','khachhang','[{\"so_luong\": 1, \"ma_san_pham\": \"1\"}, {\"so_luong\": 1, \"ma_san_pham\": \"2\"}]','1234','[\"/uploads/tra_hang/1760232252272-v1d5ur.jpg\"]','chap_thuan',0.00,NULL,NULL,NULL,NULL,'2025-10-12 08:24:12','2025-10-12 08:30:07'),(19,'175','18','khachhang','[{\"so_luong\": 1, \"ma_san_pham\": \"3\"}, {\"so_luong\": 1, \"ma_san_pham\": \"4\"}]','hang bi hu','[\"/uploads/tra_hang/1760335999480-hp6oqq.jpg\"]','chap_thuan',0.00,NULL,NULL,NULL,NULL,'2025-10-13 13:13:19','2025-10-13 13:14:44'),(20,'292','25','khachhang','[{\"so_luong\": 5, \"ma_san_pham\": \"41\"}]','Sản phẩm hư','[\"/uploads/tra_hang/1764477441514-idxu17.png\"]','chap_thuan',0.00,NULL,NULL,NULL,NULL,'2025-11-30 11:37:21','2025-11-30 11:37:39');

UN

--
-- Table structure for table `traloi_sothich`
--

DROP TABLE IF EXISTS `traloi_sothich`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `traloi_sothich` (
  `MaTraLoi` bigint NOT NULL AUTO_INCREMENT,
  `MaPhanHoi` bigint NOT NULL,
  `MaCauHoi` int NOT NULL,
  `MaLuaChon` int DEFAULT NULL COMMENT 'Với câu hỏi chọn single/multi',
  `VanBan` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Với câu hỏi text tự do',
  `DiemDanhGia` int DEFAULT NULL COMMENT 'Với câu hỏi rating (1-5)',
  PRIMARY KEY (`MaTraLoi`),
  KEY `MaLuaChon` (`MaLuaChon`),
  KEY `idx_maphanhoi` (`MaPhanHoi`),
  KEY `idx_macauhoi` (`MaCauHoi`),
  CONSTRAINT `traloi_sothich_ibfk_1` FOREIGN KEY (`MaPhanHoi`) REFERENCES `phanhoi_sothich` (`MaPhanHoi`) ON DELETE CASCADE,
  CONSTRAINT `traloi_sothich_ibfk_2` FOREIGN KEY (`MaCauHoi`) REFERENCES `cauhoi_sothich` (`MaCauHoi`) ON DELETE CASCADE,
  CONSTRAINT `traloi_sothich_ibfk_3` FOREIGN KEY (`MaLuaChon`) REFERENCES `luachon_cauhoi` (`MaLuaChon`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=44 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Chi tiết câu trả lời của khách hàng';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `traloi_sothich`
--



INSERT INTO `traloi_sothich` VALUES (1,1,7,46,NULL,NULL),(2,2,7,47,NULL,NULL),(3,2,8,49,NULL,NULL),(4,3,7,47,NULL,NULL),(5,3,8,49,NULL,NULL),(6,4,9,52,NULL,NULL),(7,4,11,53,NULL,NULL),(8,5,12,55,NULL,NULL),(9,6,13,57,NULL,NULL),(10,6,14,60,NULL,NULL),(11,7,15,62,NULL,NULL),(12,7,16,63,NULL,NULL),(13,8,15,62,NULL,NULL),(14,8,16,63,NULL,NULL),(15,9,18,66,NULL,NULL),(16,10,18,65,NULL,NULL),(17,11,19,68,NULL,NULL),(22,16,19,68,NULL,NULL),(23,17,21,70,NULL,NULL),(24,17,22,72,NULL,NULL),(25,17,23,73,NULL,NULL),(26,17,24,74,NULL,NULL),(27,18,21,71,NULL,NULL),(28,18,22,72,NULL,NULL),(29,18,23,73,NULL,NULL),(30,18,24,74,NULL,NULL),(31,18,25,75,NULL,NULL),(32,18,26,76,NULL,NULL),(33,19,27,77,NULL,NULL),(34,19,28,82,NULL,NULL),(35,20,27,78,NULL,NULL),(36,20,28,82,NULL,NULL),(37,21,29,83,NULL,NULL),(38,21,30,86,NULL,NULL),(39,22,31,87,NULL,NULL),(40,23,31,87,NULL,NULL),(41,24,31,87,NULL,NULL),(42,25,33,91,NULL,NULL),(43,25,34,92,NULL,NULL);

UN

--
-- Table structure for table `user`
--

DROP TABLE IF EXISTS `user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user`
--




UN

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
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `xin_nghi_phep`
--



INSERT INTO `xin_nghi_phep` VALUES (2,2,'2025-06-05','2025-06-06','Việc gia đình','Da_duyet','admin','2025-06-20 09:31:24'),(3,3,'2025-06-10','2025-06-12','Đi du lịch','Tu_choi','admin','2025-06-02 10:00:00'),(4,4,'2025-06-15','2025-06-15','Khám bệnh','Da_duyet','admin','2025-06-10 14:00:00'),(5,5,'2025-06-18','2025-06-19','Chăm con nhỏ','Da_duyet','admin','2025-06-18 14:53:54'),(6,6,'2025-06-20','2025-06-22','Nghỉ phép năm','Da_duyet','admin','2025-06-15 11:00:00'),(7,7,'2025-06-25','2025-06-26','Việc cá nhân','Da_duyet','admin','2025-06-16 22:39:38'),(8,8,'2025-06-28','2025-06-29','Nghỉ cưới','Da_duyet','admin','2025-06-20 16:00:00'),(9,2,'2025-06-20','2025-06-20','to bị bênh ','Da_duyet','admin','2025-07-25 21:10:24'),(10,3,'2025-07-25','2025-07-25','TÔI BỊ BỆNH RỒI \n','Da_duyet','admin','2025-07-25 21:10:39'),(11,2,'2025-08-21','2025-08-21','TÔI BỊ ỐM XIN NGHĨ 1 HÔM NHÉ \n','Da_duyet','admin','2025-08-21 20:29:04'),(12,4,'2025-09-04','2025-09-04','tôi bị bệnh rồi cho tôi nghĩ nha \n','Da_duyet','admin','2025-09-17 11:44:09'),(13,4,'2025-09-18','2025-09-18','TÔI BỊ BÊNH RỒI\n','Da_duyet','admin','2025-09-18 16:48:14'),(14,2,'2025-11-05','2025-11-05','tôi bị sốt','Da_duyet','NV002','2025-11-05 22:07:50'),(15,7,'2025-11-24','2025-11-24','TÔI BỊ ỐM ','Cho_duyet',NULL,NULL);

UN
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-12-08 22:26:52
