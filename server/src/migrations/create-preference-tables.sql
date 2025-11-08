-- ============================================
-- Migration: Tạo các bảng Sở thích Khách hàng
-- Ngày tạo: 2025-11-08
-- Mục đích: Thu thập sở thích, gợi ý sản phẩm, phát mã freeship
-- ============================================

-- 1. Bảng Form Sở thích (admin tạo/quản lý)
CREATE TABLE `form_sothich` (
  `MaForm` INT AUTO_INCREMENT PRIMARY KEY,
  `TenForm` VARCHAR(100) NOT NULL COMMENT 'Tên form (vd: "Khảo sát sở thích mùa đông 2025")',
  `MoTa` TEXT COMMENT 'Mô tả ngắn gọn về form',
  `TrangThai` TINYINT(1) DEFAULT 1 COMMENT '1=Đang hoạt động, 0=Tạm dừng',
  `NgayTao` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `NgayCapNhat` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_trangthai` (`TrangThai`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci 
COMMENT='Form khảo sát sở thích do admin tạo';

-- 2. Bảng Câu hỏi trong Form
CREATE TABLE `cauhoi_sothich` (
  `MaCauHoi` INT AUTO_INCREMENT PRIMARY KEY,
  `MaForm` INT NOT NULL,
  `NoiDungCauHoi` VARCHAR(255) NOT NULL COMMENT 'Nội dung câu hỏi',
  `LoaiCauHoi` ENUM(
    'single',           -- Chọn 1
    'multi',            -- Chọn nhiều
    'rating',           -- Đánh giá (1-5 sao)
    'text',             -- Văn bản tự do
    'entity_theloai',   -- Chọn từ bảng theloai
    'entity_tacgia',    -- Chọn từ bảng tacgia
    'entity_hinhthuc',  -- Chọn hình thức (bìa cứng/mềm/ebook)
    'entity_khoanggia', -- Chọn khoảng giá
    'entity_namxb',     -- Chọn năm xuất bản
    'entity_sotrang'    -- Chọn độ dày sách
  ) NOT NULL,
  `BatBuoc` TINYINT(1) DEFAULT 0 COMMENT '1=Bắt buộc trả lời',
  `ThuTu` INT DEFAULT 0 COMMENT 'Thứ tự hiển thị',
  FOREIGN KEY (`MaForm`) REFERENCES `form_sothich`(`MaForm`) ON DELETE CASCADE,
  INDEX `idx_maform_thutu` (`MaForm`, `ThuTu`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Câu hỏi trong form sở thích';

-- 3. Bảng Lựa chọn của Câu hỏi
CREATE TABLE `luachon_cauhoi` (
  `MaLuaChon` INT AUTO_INCREMENT PRIMARY KEY,
  `MaCauHoi` INT NOT NULL,
  `NoiDungLuaChon` VARCHAR(255) COMMENT 'Nội dung lựa chọn hiển thị',
  -- Liên kết đến thực thể (để chấm điểm)
  `MaTL` INT NULL COMMENT 'Map với bảng theloai',
  `MaTG` INT NULL COMMENT 'Map với bảng tacgia',
  `HinhThuc` VARCHAR(255) NULL COMMENT 'Bìa cứng, Bìa mềm, Ebook...',
  `MaKhoangGia` ENUM('LT100','100-200','200-300','300-500','GT500') NULL COMMENT 'Mã khoảng giá',
  `NamXBTu` INT NULL COMMENT 'Năm XB từ',
  `NamXBDen` INT NULL COMMENT 'Năm XB đến',
  `SoTrangTu` INT NULL COMMENT 'Số trang từ',
  `SoTrangDen` INT NULL COMMENT 'Số trang đến',
  `TrongSo` DECIMAL(6,2) DEFAULT 1.0 COMMENT 'Trọng số cho chấm điểm',
  `ThuTu` INT DEFAULT 0 COMMENT 'Thứ tự hiển thị',
  FOREIGN KEY (`MaCauHoi`) REFERENCES `cauhoi_sothich`(`MaCauHoi`) ON DELETE CASCADE,
  FOREIGN KEY (`MaTL`) REFERENCES `theloai`(`MaTL`) ON DELETE SET NULL,
  FOREIGN KEY (`MaTG`) REFERENCES `tacgia`(`MaTG`) ON DELETE SET NULL,
  INDEX `idx_macauhoi` (`MaCauHoi`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Lựa chọn trả lời cho mỗi câu hỏi';

-- 4. Bảng Phản hồi Form của Khách hàng
CREATE TABLE `phanhoi_sothich` (
  `MaPhanHoi` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `MaForm` INT NOT NULL,
  `makh` INT NOT NULL COMMENT 'Mã khách hàng',
  `NgayPhanHoi` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `DongYSuDung` TINYINT(1) DEFAULT 1 COMMENT 'Đồng ý cho phép sử dụng dữ liệu cá nhân hoá',
  FOREIGN KEY (`MaForm`) REFERENCES `form_sothich`(`MaForm`) ON DELETE CASCADE,
  FOREIGN KEY (`makh`) REFERENCES `khachhang`(`makh`) ON DELETE CASCADE,
  INDEX `idx_makh` (`makh`),
  INDEX `idx_maform` (`MaForm`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Lưu thông tin phản hồi form của khách hàng';

-- 5. Bảng Chi tiết Trả lời
CREATE TABLE `traloi_sothich` (
  `MaTraLoi` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `MaPhanHoi` BIGINT NOT NULL,
  `MaCauHoi` INT NOT NULL,
  `MaLuaChon` INT NULL COMMENT 'Với câu hỏi chọn single/multi',
  `VanBan` VARCHAR(500) NULL COMMENT 'Với câu hỏi text tự do',
  `DiemDanhGia` INT NULL COMMENT 'Với câu hỏi rating (1-5)',
  FOREIGN KEY (`MaPhanHoi`) REFERENCES `phanhoi_sothich`(`MaPhanHoi`) ON DELETE CASCADE,
  FOREIGN KEY (`MaCauHoi`) REFERENCES `cauhoi_sothich`(`MaCauHoi`) ON DELETE CASCADE,
  FOREIGN KEY (`MaLuaChon`) REFERENCES `luachon_cauhoi`(`MaLuaChon`) ON DELETE SET NULL,
  INDEX `idx_maphanhoi` (`MaPhanHoi`),
  INDEX `idx_macauhoi` (`MaCauHoi`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Chi tiết câu trả lời của khách hàng';

-- 6. Bảng Điểm Sở thích (materialized cho query nhanh)
CREATE TABLE `diem_sothich_khachhang` (
  `makh` INT NOT NULL,
  `LoaiThucThe` ENUM('theloai','tacgia','hinhthuc','khoanggia','namxb','sotrang') NOT NULL,
  `KhoaThucThe` VARCHAR(255) NOT NULL COMMENT 'VD: MaTL, MaTG, tên hình thức, mã khoảng giá, nhóm năm, nhóm trang',
  `DiemSo` DECIMAL(10,2) NOT NULL DEFAULT 0 COMMENT 'Điểm tích luỹ từ câu trả lời',
  `NgayCapNhat` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`makh`, `LoaiThucThe`, `KhoaThucThe`),
  FOREIGN KEY (`makh`) REFERENCES `khachhang`(`makh`) ON DELETE CASCADE,
  INDEX `idx_makh_loai` (`makh`, `LoaiThucThe`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Bảng tổng hợp điểm sở thích theo từng thực thể - dùng cho gợi ý nhanh';

-- 7. Bảng Sản phẩm Yêu thích (Explicit Favorites)
CREATE TABLE `sanpham_yeuthich` (
  `makh` INT NOT NULL,
  `MaSP` INT NOT NULL,
  `NgayThem` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`makh`, `MaSP`),
  FOREIGN KEY (`makh`) REFERENCES `khachhang`(`makh`) ON DELETE CASCADE,
  FOREIGN KEY (`MaSP`) REFERENCES `sanpham`(`MaSP`) ON DELETE CASCADE,
  INDEX `idx_makh` (`makh`),
  INDEX `idx_masp` (`MaSP`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Sản phẩm khách hàng đánh dấu yêu thích';

-- 8. Bảng Phiếu Giảm Giá (Coupons)
CREATE TABLE `phieugiamgia` (
  `MaPhieu` VARCHAR(32) PRIMARY KEY,
  `MoTa` VARCHAR(255) COMMENT 'Mô tả phiếu',
  `LoaiGiamGia` ENUM('FREESHIP','PERCENT','AMOUNT') NOT NULL,
  `GiaTriGiam` DECIMAL(10,2) NOT NULL DEFAULT 0 COMMENT 'Giá trị giảm (%, VND hoặc 100% ship)',
  `NgayHetHan` DATETIME NULL COMMENT 'Ngày hết hạn (NULL = không giới hạn)',
  `SoLanSuDungToiDa` INT DEFAULT 1 COMMENT 'Số lần sử dụng tối đa mỗi khách',
  `TrangThai` TINYINT(1) DEFAULT 1 COMMENT '1=Hoạt động, 0=Vô hiệu',
  `NgayTao` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_loai` (`LoaiGiamGia`),
  INDEX `idx_trangthai` (`TrangThai`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Phiếu giảm giá/freeship';

-- 9. Bảng Phát hành Phiếu cho Khách hàng
CREATE TABLE `phieugiamgia_phathanh` (
  `MaPhatHanh` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `makh` INT NOT NULL,
  `MaPhieu` VARCHAR(32) NOT NULL,
  `NgayPhatHanh` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `NgaySuDung` DATETIME NULL COMMENT 'Thời điểm khách sử dụng (NULL = chưa dùng)',
  `MaDonHang` INT NULL COMMENT 'Mã đơn hàng sử dụng phiếu này',
  FOREIGN KEY (`makh`) REFERENCES `khachhang`(`makh`) ON DELETE CASCADE,
  FOREIGN KEY (`MaPhieu`) REFERENCES `phieugiamgia`(`MaPhieu`) ON DELETE CASCADE,
  INDEX `idx_makh_maPhieu` (`makh`, `MaPhieu`),
  INDEX `idx_makh_ngaysudung` (`makh`, `NgaySuDung`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Lịch sử phát hành và sử dụng phiếu giảm giá';

-- ============================================
-- Indexes bổ sung cho performance
-- ============================================
ALTER TABLE `sanpham` ADD INDEX `idx_matl` (`MaTL`);
ALTER TABLE `sanpham` ADD INDEX `idx_matg` (`MaTG`);
ALTER TABLE `sanpham` ADD INDEX `idx_hinhthuc` (`HinhThuc`);
ALTER TABLE `sanpham` ADD INDEX `idx_dongia` (`DonGia`);
ALTER TABLE `sanpham` ADD INDEX `idx_namxb` (`NamXB`);
ALTER TABLE `sanpham` ADD INDEX `idx_sotrang` (`SoTrang`);
ALTER TABLE `sanpham` ADD INDEX `idx_tinhtrang` (`TinhTrang`);

-- ============================================
-- Seed dữ liệu mẫu cho MVP
-- ============================================

-- Tạo 1 form sở thích mặc định
INSERT INTO `form_sothich` (`TenForm`, `MoTa`, `TrangThai`) 
VALUES ('Khảo sát sở thích đọc sách - Nhận mã Freeship', 'Trả lời ngắn gọn 6 câu hỏi để nhận mã freeship và khám phá sách phù hợp với bạn!', 1);

SET @FormID = LAST_INSERT_ID();

-- Câu 1: Thể loại yêu thích
INSERT INTO `cauhoi_sothich` (`MaForm`, `NoiDungCauHoi`, `LoaiCauHoi`, `BatBuoc`, `ThuTu`)
VALUES (@FormID, 'Bạn thích đọc thể loại sách nào? (Chọn nhiều)', 'entity_theloai', 1, 1);
SET @Q1 = LAST_INSERT_ID();

-- Lấy các thể loại từ DB (giả sử có 5 thể loại phổ biến)
-- Admin sẽ map vào luachon_cauhoi với MaTL thực tế
INSERT INTO `luachon_cauhoi` (`MaCauHoi`, `NoiDungLuaChon`, `MaTL`, `TrongSo`, `ThuTu`)
SELECT @Q1, tl.TenTL, tl.MaTL, 2.0, 
       (@rownum := @rownum + 1) AS ThuTu
FROM `theloai` tl, (SELECT @rownum := 0) r
WHERE tl.TinhTrang = b'1'
ORDER BY tl.MaTL
LIMIT 10;

-- Câu 2: Tác giả yêu thích
INSERT INTO `cauhoi_sothich` (`MaForm`, `NoiDungCauHoi`, `LoaiCauHoi`, `BatBuoc`, `ThuTu`)
VALUES (@FormID, 'Tác giả nào bạn yêu thích? (Chọn nhiều)', 'entity_tacgia', 0, 2);
SET @Q2 = LAST_INSERT_ID();

INSERT INTO `luachon_cauhoi` (`MaCauHoi`, `NoiDungLuaChon`, `MaTG`, `TrongSo`, `ThuTu`)
SELECT @Q2, tg.TenTG, tg.MaTG, 1.5,
       (@rownum2 := @rownum2 + 1) AS ThuTu
FROM `tacgia` tg, (SELECT @rownum2 := 0) r
ORDER BY tg.MaTG
LIMIT 15;

-- Câu 3: Ngân sách thường mua
INSERT INTO `cauhoi_sothich` (`MaForm`, `NoiDungCauHoi`, `LoaiCauHoi`, `BatBuoc`, `ThuTu`)
VALUES (@FormID, 'Ngân sách mua sách thường của bạn?', 'entity_khoanggia', 1, 3);
SET @Q3 = LAST_INSERT_ID();

INSERT INTO `luachon_cauhoi` (`MaCauHoi`, `NoiDungLuaChon`, `MaKhoangGia`, `TrongSo`, `ThuTu`) VALUES
(@Q3, 'Dưới 100.000đ', 'LT100', 1.0, 1),
(@Q3, '100.000đ - 200.000đ', '100-200', 1.0, 2),
(@Q3, '200.000đ - 300.000đ', '200-300', 1.0, 3),
(@Q3, '300.000đ - 500.000đ', '300-500', 1.0, 4),
(@Q3, 'Trên 500.000đ', 'GT500', 1.0, 5);

-- Câu 4: Hình thức sách
INSERT INTO `cauhoi_sothich` (`MaForm`, `NoiDungCauHoi`, `LoaiCauHoi`, `BatBuoc`, `ThuTu`)
VALUES (@FormID, 'Bạn thích hình thức sách nào?', 'entity_hinhthuc', 0, 4);
SET @Q4 = LAST_INSERT_ID();

INSERT INTO `luachon_cauhoi` (`MaCauHoi`, `NoiDungLuaChon`, `HinhThuc`, `TrongSo`, `ThuTu`) VALUES
(@Q4, 'Bìa cứng', 'Bìa cứng', 1.2, 1),
(@Q4, 'Bìa mềm', 'Bìa mềm', 1.2, 2),
(@Q4, 'Bìa gáy xoắn', 'Bìa gáy xoắn', 1.0, 3),
(@Q4, 'Ebook', 'Ebook', 1.0, 4);

-- Câu 5: Năm xuất bản
INSERT INTO `cauhoi_sothich` (`MaForm`, `NoiDungCauHoi`, `LoaiCauHoi`, `BatBuoc`, `ThuTu`)
VALUES (@FormID, 'Bạn thích sách xuất bản khi nào?', 'entity_namxb', 0, 5);
SET @Q5 = LAST_INSERT_ID();

INSERT INTO `luachon_cauhoi` (`MaCauHoi`, `NoiDungLuaChon`, `NamXBTu`, `NamXBDen`, `TrongSo`, `ThuTu`) VALUES
(@Q5, 'Sách mới (2023-2025)', 2023, 2025, 1.5, 1),
(@Q5, 'Gần đây (2020-2022)', 2020, 2022, 1.2, 2),
(@Q5, 'Kinh điển (trước 2020)', 1900, 2019, 1.0, 3);

-- Câu 6: Độ dày sách (theo số trang)
INSERT INTO `cauhoi_sothich` (`MaForm`, `NoiDungCauHoi`, `LoaiCauHoi`, `BatBuoc`, `ThuTu`)
VALUES (@FormID, 'Bạn thích độ dày sách như thế nào?', 'entity_sotrang', 0, 6);
SET @Q6 = LAST_INSERT_ID();

INSERT INTO `luachon_cauhoi` (`MaCauHoi`, `NoiDungLuaChon`, `SoTrangTu`, `SoTrangDen`, `TrongSo`, `ThuTu`) VALUES
(@Q6, 'Mỏng nhẹ (< 200 trang)', 1, 200, 1.0, 1),
(@Q6, 'Trung bình (200-400 trang)', 200, 400, 1.0, 2),
(@Q6, 'Dày (> 400 trang)', 400, 9999, 1.0, 3);

-- Tạo 1 phiếu freeship mẫu
INSERT INTO `phieugiamgia` (`MaPhieu`, `MoTa`, `LoaiGiamGia`, `GiaTriGiam`, `NgayHetHan`, `SoLanSuDungToiDa`, `TrangThai`)
VALUES ('FREESHIP2025', 'Freeship toàn quốc cho khách hoàn thành khảo sát sở thích', 'FREESHIP', 100, DATE_ADD(NOW(), INTERVAL 3 MONTH), 1, 1);

-- ============================================
-- Hoàn tất migration
-- ============================================
