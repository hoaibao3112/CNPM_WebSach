import express from "express";
import pool from "../config/connectDatabase.js"; // file kết nối DB

const router = express.Router();

// Lấy tất cả mã giảm giá (JOIN với khuyen_mai để lấy loại KM)
router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        v.MaVoucher, v.MaKM, v.MaCode, v.GioiHanSuDung, v.DaSuDung,
        v.TrangThai, v.NgayHetHan, v.NgayTao,
        km.TenKM, km.MoTa, km.NgayBatDau, km.NgayKetThuc, km.LoaiKM
      FROM ma_giam_gia v
      JOIN khuyen_mai km ON v.MaKM = km.MaKM
      WHERE v.TrangThai = b'1' AND km.TrangThai = b'1'
    `);
    res.json(rows);
  } catch (err) {
    console.error("Lỗi voucher.js hàm lấy tất cả mã giảm giá:", err);
    res.status(500).json({ error: "Không thể lấy dữ liệu mã giảm giá" });
  }
});

// Hàm tạo mã voucher 10 ký tự ngẫu nhiên
function generateVoucherCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"; // ký tự dùng để random
  let code = "";
  for (let i = 0; i < 10; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Thêm mã giảm giá mới
router.post("/", async (req, res) => {
  try {
    const { MaKM, MaCode: userCode, GioiHanSuDung, NgayHetHan } = req.body;
    if (!MaKM) return res.status(400).json({ error: "MaKM là bắt buộc" });

    const MaCode = userCode || generateVoucherCode();

    // Kiểm tra MaCode đã tồn tại chưa
    const [existing] = await pool.query(
      "SELECT MaVoucher FROM ma_giam_gia WHERE MaCode = ?",
      [MaCode]
    );
    if (existing.length > 0) {
      return res.status(400).json({ error: "MaCode đã tồn tại, vui lòng thử mã khác" });
    }

    const [result] = await pool.query(
      `INSERT INTO ma_giam_gia 
       (MaKM, MaCode, GioiHanSuDung, DaSuDung, TrangThai, NgayHetHan) 
       VALUES (?, ?, ?, 0, b'1', ?)` ,
      [MaKM, MaCode, GioiHanSuDung || null, NgayHetHan || null]
    );

    res.json({ message: "Thêm mã giảm giá thành công", MaVoucher: result.insertId, MaCode });
  } catch (err) {
    console.error("Lỗi voucher.js, hàm thêm mã giảm:", err);
    res.status(500).json({ error: "Không thể thêm mã giảm giá" });
  }
});

// Sửa voucher
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { MaCode, GioiHanSuDung, NgayHetHan, TrangThai } = req.body;

    if (!MaCode && !GioiHanSuDung && !NgayHetHan && TrangThai === undefined) {
      return res.status(400).json({ error: "Không có dữ liệu để cập nhật" });
    }

    // Kiểm tra MaCode có trùng với voucher khác không
    if (MaCode) {
      const [existing] = await pool.query(
        "SELECT MaVoucher FROM ma_giam_gia WHERE MaCode = ? AND MaVoucher <> ?",
        [MaCode, id]
      );
      if (existing.length > 0) {
        return res.status(400).json({ error: "MaCode đã tồn tại, vui lòng chọn mã khác" });
      }
    }

    const [result] = await pool.query(
      `UPDATE ma_giam_gia 
       SET MaCode = COALESCE(?, MaCode),
           GioiHanSuDung = COALESCE(?, GioiHanSuDung),
           NgayHetHan = COALESCE(?, NgayHetHan),
           TrangThai = COALESCE(?, TrangThai)
       WHERE MaVoucher = ?`,
      [MaCode, GioiHanSuDung, NgayHetHan, TrangThai, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Voucher không tồn tại" });
    }

    res.json({ message: "Cập nhật voucher thành công" });
  } catch (err) {
    console.error("Lỗi voucher.js, hàm sửa mã giảm:", err);
    res.status(500).json({ error: "Không thể cập nhật voucher" });
  }
});

// Kiểm tra mã giảm giá khi user nhập (JOIN để lấy loại KM)
router.post("/check", async (req, res) => {
  try {
    const { MaCode } = req.body;

    if (!MaCode) {
      return res.status(400).json({ valid: false, message: "Chưa nhập mã giảm giá" });
    }

    const [rows] = await pool.query(
      `SELECT v.*, km.LoaiKM, km.TenKM, km.MoTa, km.NgayBatDau, km.NgayKetThuc
       FROM ma_giam_gia v
       JOIN khuyen_mai km ON v.MaKM = km.MaKM
       WHERE v.MaCode = ? 
         AND v.TrangThai = b'1' 
         AND km.TrangThai = b'1'
         AND v.NgayHetHan > NOW() 
         AND (v.DaSuDung < v.GioiHanSuDung OR v.GioiHanSuDung IS NULL)`,
      [MaCode]
    );

    if (rows.length === 0) {
      return res.status(400).json({ valid: false, message: "Mã giảm giá không hợp lệ hoặc đã hết hạn" });
    }

    res.json({ valid: true, voucher: rows[0] });
  } catch (err) {
    console.error("Lỗi voucher.js, lỗi kiểm tra mã giảm giá:", err);
    res.status(500).json({ error: "Không thể kiểm tra mã giảm giá" });
  }
});

export default router;
