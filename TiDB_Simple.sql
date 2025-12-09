-- =============================================
-- DATABASE CHO WEBSITE BAN SACH - TIDB CLOUD
-- Copy toan bo va paste vao SQL Editor, sau do nhan Run
-- =============================================

SET FOREIGN_KEY_CHECKS = 0;

-- BANG KHACH HANG
CREATE TABLE IF NOT EXISTS `khachhang` (
  `makh` int NOT NULL AUTO_INCREMENT,
  `hoten` varchar(100) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `matkhau` varchar(255) DEFAULT NULL,
  `sdt` varchar(15) DEFAULT NULL,
  `diachi` text,
  `ngaydk` datetime DEFAULT CURRENT_TIMESTAMP,
  `trangthai` tinyint(1) DEFAULT 1,
  `avatar` varchar(255) DEFAULT NULL,
  `membership_level` varchar(20) DEFAULT 'Bronze',
  `total_spent` decimal(15,2) DEFAULT 0,
  `google_id` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`makh`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- BANG TAI KHOAN ADMIN
CREATE TABLE IF NOT EXISTS `taikhoan` (
  `MaTK` int NOT NULL AUTO_INCREMENT,
  `TenTK` varchar(50) DEFAULT NULL,
  `MatKhau` varchar(255) DEFAULT NULL,
  `Email` varchar(100) DEFAULT NULL,
  `TinhTrang` tinyint(1) DEFAULT 1,
  `MaNQ` int DEFAULT NULL,
  PRIMARY KEY (`MaTK`),
  UNIQUE KEY `TenTK` (`TenTK`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- BANG NHOM QUYEN
CREATE TABLE IF NOT EXISTS `nhomquyen` (
  `MaNQ` int NOT NULL AUTO_INCREMENT,
  `TenNQ` varchar(50) DEFAULT NULL,
  `MoTa` text,
  `TinhTrang` tinyint(1) DEFAULT 1,
  PRIMARY KEY (`MaNQ`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- BANG THE LOAI
CREATE TABLE IF NOT EXISTS `theloai` (
  `MaTL` int NOT NULL AUTO_INCREMENT,
  `TenTL` varchar(100) DEFAULT NULL,
  `MoTa` text,
  `TinhTrang` tinyint(1) DEFAULT 1,
  PRIMARY KEY (`MaTL`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- BANG TAC GIA
CREATE TABLE IF NOT EXISTS `tacgia` (
  `MaTG` int NOT NULL AUTO_INCREMENT,
  `TenTG` varchar(100) DEFAULT NULL,
  `MoTa` text,
  `HinhAnh` varchar(255) DEFAULT NULL,
  `TinhTrang` tinyint(1) DEFAULT 1,
  PRIMARY KEY (`MaTG`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- BANG NHA XUAT BAN
CREATE TABLE IF NOT EXISTS `nhaxuatban` (
  `MaNXB` int NOT NULL AUTO_INCREMENT,
  `TenNXB` varchar(100) DEFAULT NULL,
  `DiaChi` text,
  `SDT` varchar(15) DEFAULT NULL,
  `TinhTrang` tinyint(1) DEFAULT 1,
  PRIMARY KEY (`MaNXB`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- BANG SAN PHAM
CREATE TABLE IF NOT EXISTS `sanpham` (
  `MaSP` int NOT NULL AUTO_INCREMENT,
  `TenSP` varchar(255) DEFAULT NULL,
  `MoTa` text,
  `DonGia` double DEFAULT 0,
  `SoLuong` int DEFAULT 0,
  `HinhAnh` varchar(255) DEFAULT NULL,
  `MaTL` int DEFAULT NULL,
  `MaTG` int DEFAULT NULL,
  `MaNXB` int DEFAULT NULL,
  `NamXB` int DEFAULT NULL,
  `SoTrang` int DEFAULT NULL,
  `TinhTrang` tinyint(1) DEFAULT 1,
  `NgayTao` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`MaSP`),
  KEY `MaTL` (`MaTL`),
  KEY `MaTG` (`MaTG`),
  KEY `MaNXB` (`MaNXB`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- BANG HOA DON
CREATE TABLE IF NOT EXISTS `hoadon` (
  `MaHD` int NOT NULL AUTO_INCREMENT,
  `MaKH` int DEFAULT NULL,
  `NgayDat` datetime DEFAULT CURRENT_TIMESTAMP,
  `TongTien` double DEFAULT 0,
  `TrangThai` varchar(50) DEFAULT 'Cho_xac_nhan',
  `DiaChiGiao` text,
  `SDTGiao` varchar(15) DEFAULT NULL,
  `TenNguoiNhan` varchar(100) DEFAULT NULL,
  `GhiChu` text,
  `PhiVanChuyen` double DEFAULT 0,
  `MaKM` int DEFAULT NULL,
  `GiamGia` double DEFAULT 0,
  `PhuongThucTT` varchar(50) DEFAULT 'COD',
  PRIMARY KEY (`MaHD`),
  KEY `MaKH` (`MaKH`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- BANG CHI TIET HOA DON
CREATE TABLE IF NOT EXISTS `chitiethoadon` (
  `MaHD` int NOT NULL,
  `MaSP` int NOT NULL,
  `DonGia` double DEFAULT NULL,
  `SoLuong` int DEFAULT NULL,
  PRIMARY KEY (`MaSP`,`MaHD`),
  KEY `MaHD` (`MaHD`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- BANG DIA CHI
CREATE TABLE IF NOT EXISTS `diachi` (
  `MaDiaChi` int NOT NULL AUTO_INCREMENT,
  `MaKH` int DEFAULT NULL,
  `TenNguoiNhan` varchar(100) NOT NULL,
  `SDT` varchar(15) NOT NULL,
  `DiaChiChiTiet` text NOT NULL,
  `TinhThanh` varchar(50) DEFAULT NULL,
  `QuanHuyen` varchar(50) DEFAULT NULL,
  `PhuongXa` varchar(50) DEFAULT NULL,
  `MacDinh` tinyint(1) DEFAULT 0,
  PRIMARY KEY (`MaDiaChi`),
  KEY `MaKH` (`MaKH`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- BANG GIO HANG
CREATE TABLE IF NOT EXISTS `giohang` (
  `MaGH` int NOT NULL AUTO_INCREMENT,
  `MaKH` int DEFAULT NULL,
  `MaSP` int DEFAULT NULL,
  `SoLuong` int DEFAULT 1,
  `NgayThem` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`MaGH`),
  KEY `MaKH` (`MaKH`),
  KEY `MaSP` (`MaSP`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- BANG KHUYEN MAI
CREATE TABLE IF NOT EXISTS `khuyen_mai` (
  `MaKM` int NOT NULL AUTO_INCREMENT,
  `TenKM` varchar(100) DEFAULT NULL,
  `MoTa` text,
  `LoaiKM` varchar(50) DEFAULT 'giam_phan_tram',
  `Code` varchar(50) DEFAULT NULL,
  `NgayBatDau` datetime DEFAULT NULL,
  `NgayKetThuc` datetime DEFAULT NULL,
  `TrangThai` tinyint(1) DEFAULT 1,
  `Audience` varchar(50) DEFAULT 'PUBLIC',
  `IsClaimable` tinyint(1) DEFAULT 1,
  PRIMARY KEY (`MaKM`),
  UNIQUE KEY `Code` (`Code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- BANG CHI TIET KHUYEN MAI
CREATE TABLE IF NOT EXISTS `ct_khuyen_mai` (
  `MaCTKM` int NOT NULL AUTO_INCREMENT,
  `MaKM` int NOT NULL,
  `GiaTriGiam` decimal(10,2) DEFAULT NULL,
  `GiaTriDonToiThieu` decimal(12,2) DEFAULT NULL,
  `GiamToiDa` decimal(12,2) DEFAULT NULL,
  `SoLuongToiThieu` int DEFAULT NULL,
  PRIMARY KEY (`MaCTKM`),
  KEY `MaKM` (`MaKM`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- BANG SAN PHAM KHUYEN MAI
CREATE TABLE IF NOT EXISTS `sp_khuyen_mai` (
  `MaSPKM` int NOT NULL AUTO_INCREMENT,
  `MaKM` int DEFAULT NULL,
  `MaSP` int DEFAULT NULL,
  PRIMARY KEY (`MaSPKM`),
  KEY `MaKM` (`MaKM`),
  KEY `MaSP` (`MaSP`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- BANG KHACH HANG KHUYEN MAI
CREATE TABLE IF NOT EXISTS `khachhang_khuyenmai` (
  `id` int NOT NULL AUTO_INCREMENT,
  `makh` int DEFAULT NULL,
  `makm` int DEFAULT NULL,
  `ngay_lay` datetime DEFAULT CURRENT_TIMESTAMP,
  `ngay_het_han` datetime DEFAULT NULL,
  `trang_thai` varchar(50) DEFAULT 'Chua_su_dung',
  PRIMARY KEY (`id`),
  KEY `makh` (`makh`),
  KEY `makm` (`makm`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- BANG BINH LUAN
CREATE TABLE IF NOT EXISTS `binhluan` (
  `mabl` int NOT NULL AUTO_INCREMENT,
  `mabl_cha` int DEFAULT NULL,
  `makh` int NOT NULL,
  `masp` int NOT NULL,
  `noidung` text NOT NULL,
  `ngaybinhluan` datetime DEFAULT CURRENT_TIMESTAMP,
  `trangthai` varchar(20) DEFAULT 'Hien_thi',
  PRIMARY KEY (`mabl`),
  KEY `makh` (`makh`),
  KEY `masp` (`masp`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- BANG DANH GIA
CREATE TABLE IF NOT EXISTS `danhgia` (
  `MaDG` int NOT NULL AUTO_INCREMENT,
  `MaSP` int NOT NULL,
  `MaKH` int NOT NULL,
  `SoSao` tinyint NOT NULL,
  `NhanXet` text,
  `NgayDanhGia` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`MaDG`),
  UNIQUE KEY `unique_rating` (`MaSP`,`MaKH`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- BANG NHA CUNG CAP
CREATE TABLE IF NOT EXISTS `nhacungcap` (
  `MaNCC` int NOT NULL AUTO_INCREMENT,
  `TenNCC` varchar(100) DEFAULT NULL,
  `DiaChi` text,
  `SDT` varchar(15) DEFAULT NULL,
  `Email` varchar(100) DEFAULT NULL,
  `TinhTrang` tinyint(1) DEFAULT 1,
  PRIMARY KEY (`MaNCC`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- BANG PHIEU NHAP
CREATE TABLE IF NOT EXISTS `phieunhap` (
  `MaPN` int NOT NULL AUTO_INCREMENT,
  `MaNCC` int DEFAULT NULL,
  `MaTK` int DEFAULT NULL,
  `NgayNhap` datetime DEFAULT CURRENT_TIMESTAMP,
  `TongTien` double DEFAULT 0,
  `GhiChu` text,
  PRIMARY KEY (`MaPN`),
  KEY `MaNCC` (`MaNCC`),
  KEY `MaTK` (`MaTK`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- BANG CHI TIET PHIEU NHAP
CREATE TABLE IF NOT EXISTS `chitietphieunhap` (
  `MaPN` int NOT NULL,
  `MaSP` int NOT NULL,
  `DonGiaNhap` double DEFAULT NULL,
  `SoLuong` int DEFAULT NULL,
  `TinhTrang` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`MaSP`,`MaPN`),
  KEY `MaPN` (`MaPN`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- BANG NHAN VIEN
CREATE TABLE IF NOT EXISTS `nhanvien` (
  `MaNV` int NOT NULL AUTO_INCREMENT,
  `HoTen` varchar(100) DEFAULT NULL,
  `Email` varchar(100) DEFAULT NULL,
  `SDT` varchar(15) DEFAULT NULL,
  `DiaChi` text,
  `CCCD` varchar(20) DEFAULT NULL,
  `NgaySinh` date DEFAULT NULL,
  `GioiTinh` varchar(10) DEFAULT NULL,
  `ChucVu` varchar(50) DEFAULT NULL,
  `MaTK` int DEFAULT NULL,
  `TinhTrang` tinyint(1) DEFAULT 1,
  PRIMARY KEY (`MaNV`),
  KEY `MaTK` (`MaTK`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- BANG HOAN TIEN
CREATE TABLE IF NOT EXISTS `hoan_tien` (
  `MaHoanTien` int NOT NULL AUTO_INCREMENT,
  `MaHD` int DEFAULT NULL,
  `MaKH` int DEFAULT NULL,
  `SoTien` double DEFAULT NULL,
  `LyDo` text,
  `TrangThai` varchar(50) DEFAULT 'Cho_duyet',
  `NgayTao` datetime DEFAULT CURRENT_TIMESTAMP,
  `NgayDuyet` datetime DEFAULT NULL,
  `MaTK` int DEFAULT NULL,
  PRIMARY KEY (`MaHoanTien`),
  KEY `MaHD` (`MaHD`),
  KEY `MaKH` (`MaKH`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- BANG TRA HANG
CREATE TABLE IF NOT EXISTS `tra_hang` (
  `MaTraHang` int NOT NULL AUTO_INCREMENT,
  `MaHD` int DEFAULT NULL,
  `MaKH` int DEFAULT NULL,
  `LyDo` text,
  `TrangThai` varchar(50) DEFAULT 'Cho_duyet',
  `NgayTao` datetime DEFAULT CURRENT_TIMESTAMP,
  `NgayDuyet` datetime DEFAULT NULL,
  PRIMARY KEY (`MaTraHang`),
  KEY `MaHD` (`MaHD`),
  KEY `MaKH` (`MaKH`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- BANG CHAT ROOMS
CREATE TABLE IF NOT EXISTS `chat_rooms` (
  `room_id` int NOT NULL AUTO_INCREMENT,
  `order_id` int DEFAULT NULL,
  `customer_id` int NOT NULL,
  `staff_id` varchar(50) DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`room_id`),
  KEY `customer_id` (`customer_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- BANG CHAT MESSAGES
CREATE TABLE IF NOT EXISTS `chat_messages` (
  `message_id` int NOT NULL AUTO_INCREMENT,
  `room_id` int NOT NULL,
  `sender_id` varchar(50) NOT NULL,
  `sender_type` varchar(20) NOT NULL,
  `message` text NOT NULL,
  `is_read` tinyint(1) DEFAULT 0,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `read_at` datetime DEFAULT NULL,
  PRIMARY KEY (`message_id`),
  KEY `room_id` (`room_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- BANG FORM SO THICH
CREATE TABLE IF NOT EXISTS `form_sothich` (
  `MaForm` int NOT NULL AUTO_INCREMENT,
  `TenForm` varchar(255) DEFAULT NULL,
  `MoTa` text,
  `TrangThai` tinyint(1) DEFAULT 1,
  `NgayTao` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`MaForm`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- BANG CAU HOI SO THICH
CREATE TABLE IF NOT EXISTS `cauhoi_sothich` (
  `MaCauHoi` int NOT NULL AUTO_INCREMENT,
  `MaForm` int NOT NULL,
  `NoiDungCauHoi` varchar(255) NOT NULL,
  `LoaiCauHoi` varchar(50) NOT NULL,
  `BatBuoc` tinyint(1) DEFAULT 0,
  `ThuTu` int DEFAULT 0,
  PRIMARY KEY (`MaCauHoi`),
  KEY `MaForm` (`MaForm`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- BANG PHIEU GIAM GIA
CREATE TABLE IF NOT EXISTS `phieugiamgia` (
  `MaPhieu` varchar(50) NOT NULL,
  `MaKM` int DEFAULT NULL,
  `MoTa` text,
  `TrangThai` tinyint(1) DEFAULT 1,
  PRIMARY KEY (`MaPhieu`),
  KEY `MaKM` (`MaKM`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- BANG PHIEU GIAM GIA PHAT HANH
CREATE TABLE IF NOT EXISTS `phieugiamgia_phathanh` (
  `id` int NOT NULL AUTO_INCREMENT,
  `MaPhieu` varchar(50) DEFAULT NULL,
  `makh` int DEFAULT NULL,
  `NgayPhatHanh` datetime DEFAULT CURRENT_TIMESTAMP,
  `NgaySuDung` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `MaPhieu` (`MaPhieu`),
  KEY `makh` (`makh`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET FOREIGN_KEY_CHECKS = 1;

-- =============================================
-- THEM DU LIEU MAU
-- =============================================

-- Them nhom quyen
INSERT INTO `nhomquyen` (`MaNQ`, `TenNQ`, `MoTa`) VALUES
(1, 'Admin', 'Quyen quan tri toan he thong'),
(2, 'Nhan Vien', 'Quyen nhan vien ban hang'),
(3, 'Quan Ly', 'Quyen quan ly');

-- Them tai khoan admin
INSERT INTO `taikhoan` (`MaTK`, `TenTK`, `MatKhau`, `Email`, `TinhTrang`, `MaNQ`) VALUES
(1, 'admin', '$2b$10$abcdefghijklmnopqrstuv', 'admin@websach.com', 1, 1),
(2, 'nhanvien1', '$2b$10$abcdefghijklmnopqrstuv', 'nv1@websach.com', 1, 2);

-- Them the loai
INSERT INTO `theloai` (`MaTL`, `TenTL`, `MoTa`) VALUES
(1, 'Van Hoc', 'Sach van hoc Viet Nam va nuoc ngoai'),
(2, 'Kinh Te', 'Sach kinh te, kinh doanh'),
(3, 'Ky Nang Song', 'Sach phat trien ban than'),
(4, 'Thieu Nhi', 'Sach danh cho tre em'),
(5, 'Khoa Hoc', 'Sach khoa hoc ky thuat'),
(6, 'Lich Su', 'Sach lich su'),
(7, 'Tam Ly', 'Sach tam ly hoc'),
(8, 'Truyen Tranh', 'Manga, Comic'),
(9, 'Giao Trinh', 'Sach giao khoa, giao trinh'),
(10, 'Ngoai Ngu', 'Sach hoc ngoai ngu');

-- Them tac gia
INSERT INTO `tacgia` (`MaTG`, `TenTG`, `MoTa`) VALUES
(1, 'Nguyen Nhat Anh', 'Nha van Viet Nam noi tieng'),
(2, 'Dale Carnegie', 'Tac gia sach ky nang song'),
(3, 'Paulo Coelho', 'Nha van Brazil'),
(4, 'Haruki Murakami', 'Nha van Nhat Ban'),
(5, 'Yuval Noah Harari', 'Tac gia Sapiens');

-- Them nha xuat ban
INSERT INTO `nhaxuatban` (`MaNXB`, `TenNXB`) VALUES
(1, 'NXB Tre'),
(2, 'NXB Kim Dong'),
(3, 'NXB Tong Hop TPHCM'),
(4, 'NXB Lao Dong'),
(5, 'NXB Giao Duc');

-- Them san pham mau
INSERT INTO `sanpham` (`MaSP`, `TenSP`, `MoTa`, `DonGia`, `SoLuong`, `HinhAnh`, `MaTL`, `MaTG`, `MaNXB`, `NamXB`, `SoTrang`) VALUES
(1, 'Cho Toi Xin Mot Ve Di Tuoi Tho', 'Truyen dai cua Nguyen Nhat Anh', 120000, 100, 'img/product/sp01.jpg', 1, 1, 1, 2020, 250),
(2, 'Dac Nhan Tam', 'Sach ky nang giao tiep', 150000, 80, 'img/product/sp02.jpg', 3, 2, 3, 2019, 320),
(3, 'Nha Gia Kim', 'Tieu thuyet cua Paulo Coelho', 200000, 60, 'img/product/sp03.jpg', 1, 3, 1, 2018, 280),
(4, 'Rung Na Uy', 'Tieu thuyet cua Murakami', 180000, 50, 'img/product/sp04.jpg', 1, 4, 1, 2017, 400),
(5, 'Sapiens Luoc Su Loai Nguoi', 'Sach lich su nhan loai', 250000, 40, 'img/product/sp05.jpg', 6, 5, 3, 2021, 500),
(6, 'Mat Biec', 'Truyen dai cua Nguyen Nhat Anh', 130000, 90, 'img/product/sp06.jpg', 1, 1, 1, 2019, 230),
(7, 'Toi Thay Hoa Vang Tren Co Xanh', 'Truyen thieu nhi', 110000, 70, 'img/product/sp07.jpg', 4, 1, 2, 2020, 200),
(8, 'Nghi Giau Lam Giau', 'Sach kinh te', 160000, 55, 'img/product/sp08.jpg', 2, 2, 3, 2018, 350);

-- Them khach hang mau
INSERT INTO `khachhang` (`makh`, `hoten`, `email`, `matkhau`, `sdt`) VALUES
(1, 'Nguyen Van A', 'nguyenvana@gmail.com', '$2b$10$abcdefghijklmnopqrstuv', '0901234567'),
(2, 'Tran Thi B', 'tranthib@gmail.com', '$2b$10$abcdefghijklmnopqrstuv', '0912345678');

-- Them nha cung cap
INSERT INTO `nhacungcap` (`MaNCC`, `TenNCC`, `DiaChi`, `SDT`) VALUES
(1, 'Cong ty Sach ABC', 'Ha Noi', '0241234567'),
(2, 'Cong ty Phat hanh XYZ', 'Ho Chi Minh', '0281234567');

SELECT 'IMPORT THANH CONG!' AS Result;
