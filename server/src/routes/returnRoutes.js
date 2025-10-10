// ...existing code...
import express from 'express';
import fs from 'fs';
import path from 'path';
import multer from 'multer';
import pool from '../config/connectDatabase.js';

const router = express.Router();

// Upload setup (tep_dinh_kem)
const uploadDir = path.join(process.cwd(), 'uploads', 'tra_hang');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = `${Date.now()}-${Math.random().toString(36).slice(2,8)}${ext}`;
    cb(null, name);
  }
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB

// Helpers
async function donHangTonTai(maDonHang) {
  // Use a broad select to avoid schema name mismatches across environments
  const [rows] = await pool.query(`SELECT * FROM hoadon WHERE MaHD = ?`, [maDonHang]);
  return rows.length ? rows[0] : null;
}

async function validateMatHangThuocDon(maDonHang, matHang) {
  const [rows] = await pool.query(`SELECT MaSP, SoLuong FROM chitiethoadon WHERE MaHD = ?`, [maDonHang]);
  if (!rows.length) return false;
  const map = new Map(rows.map(r => [String(r.MaSP), r.SoLuong || 0]));
  for (const it of matHang) {
    const pid = String(it.ma_san_pham || it.MaSP || it.productId);
    const qty = Number(it.so_luong || it.qty || 1);
    if (!map.has(pid) || qty <= 0) return false;
    if (qty > (map.get(pid) || 0)) return false;
  }
  return true;
}

// POST /api/tra-hang -> tạo yêu cầu trả hàng (khách báo lỗi)
router.post('/', async (req, res) => {
  const { ma_don_hang, mat_hang, ly_do, tep_dinh_kem, nguoi_tao, loai_nguoi_tao } = req.body;
  if (!ma_don_hang || !Array.isArray(mat_hang) || mat_hang.length === 0) {
    return res.status(400).json({ error: 'ma_don_hang và mat_hang (mảng) là bắt buộc' });
  }

  try {
    const order = await donHangTonTai(ma_don_hang);
    if (!order) return res.status(404).json({ error: 'Đơn hàng không tồn tại' });

    const valid = await validateMatHangThuocDon(ma_don_hang, mat_hang);
    if (!valid) return res.status(400).json({ error: 'Có mặt hàng không thuộc đơn hoặc số lượng không hợp lệ' });

    const [result] = await pool.query(
      `INSERT INTO tra_hang (ma_don_hang, nguoi_tao, loai_nguoi_tao, mat_hang, ly_do, tep_dinh_kem, trang_thai) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [ma_don_hang, nguoi_tao || null, loai_nguoi_tao || 'khachhang', JSON.stringify(mat_hang), ly_do || null, JSON.stringify(tep_dinh_kem || []), 'da_bao_cao']
    );
    const id = result.insertId;
    await pool.query(`INSERT INTO lich_su_tra_hang (tra_hang_id, trang_thai_cu, trang_thai_moi, nguoi_thuc_hien, ghi_chu) VALUES (?, ?, ?, ?, ?)`, [id, null, 'da_bao_cao', nguoi_tao || null, ly_do || null]);
    return res.status(201).json({ id, trang_thai: 'da_bao_cao' });
  } catch (err) {
    console.error('Loi tao tra_hang:', err);
    return res.status(500).json({ error: 'Lỗi tạo yêu cầu trả hàng', details: err.message });
  }
});

// POST /api/tra-hang/:id/files -> upload ảnh tep_dinh_kem
router.post('/:id/files', upload.array('files', 8), async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query(`SELECT tep_dinh_kem FROM tra_hang WHERE id = ?`, [id]);
    if (!rows.length) return res.status(404).json({ error: 'Yêu cầu trả hàng không tồn tại' });

    // Defensive parse for tep_dinh_kem which may be null, an empty string, or malformed JSON
    let existing = [];
    try {
      const raw = rows[0].tep_dinh_kem;
      if (raw && typeof raw === 'string') {
        existing = JSON.parse(raw || '[]');
        if (!Array.isArray(existing)) existing = [];
      } else if (Array.isArray(raw)) {
        existing = raw;
      } else {
        existing = [];
      }
    } catch (parseErr) {
      console.warn('Invalid tep_dinh_kem JSON for tra_hang id', id, '; raw value:', rows[0].tep_dinh_kem);
      existing = [];
    }

    const files = (req.files || []).map(f => `/uploads/tra_hang/${f.filename}`);
    const updated = existing.concat(files);
    await pool.query(`UPDATE tra_hang SET tep_dinh_kem = ?, updated_at = NOW() WHERE id = ?`, [JSON.stringify(updated), id]);
    await pool.query(`INSERT INTO lich_su_tra_hang (tra_hang_id, trang_thai_cu, trang_thai_moi, nguoi_thuc_hien, ghi_chu) VALUES (?, ?, ?, ?, ?)`, [id, null, null, null, `Đính kèm ${files.length} file`]);
    return res.json({ id, tep_dinh_kem: updated });
  } catch (err) {
    console.error('Loi upload tep:', err);
    return res.status(500).json({ error: 'Lỗi upload', details: err.message });
  }
});

// PUT /api/tra-hang/:id/action -> thay đổi trạng thái / approve / reject / mark received
router.put('/:id/action', async (req, res) => {
  const { id } = req.params;
  const { action, byUser, ghi_chu, so_tien_hoan, phuong_thuc_hoan, restock } = req.body;
  const allowed = ['dang_van_chuyen', 'da_nhan', 'chap_thuan', 'tu_choi', 'huy'];
  if (!action || !allowed.includes(action)) return res.status(400).json({ error: `action phải là một trong: ${allowed.join(', ')}` });

  let conn;
  try {
    const [rows] = await pool.query(`SELECT * FROM tra_hang WHERE id = ?`, [id]);
    if (!rows.length) return res.status(404).json({ error: 'Yêu cầu không tồn tại' });
    const current = rows[0].trang_thai || null;

    // If approving with restock/refund - use transaction
    if (action === 'chap_thuan') {
      conn = await pool.getConnection();
      await conn.beginTransaction();

      await conn.query(`UPDATE tra_hang SET trang_thai = ?, so_tien_hoan = COALESCE(?, so_tien_hoan), phuong_thuc_hoan = COALESCE(?, phuong_thuc_hoan), ghi_chu = COALESCE(?, ghi_chu), updated_at = NOW() WHERE id = ?`, [ 'chap_thuan', so_tien_hoan || null, phuong_thuc_hoan || null, ghi_chu || null, id ]);
      await conn.query(`INSERT INTO lich_su_tra_hang (tra_hang_id, trang_thai_cu, trang_thai_moi, nguoi_thuc_hien, ghi_chu) VALUES (?, ?, ?, ?, ?)`, [id, current, 'chap_thuan', byUser || null, ghi_chu || null]);

      if (restock) {
        // try to restock items listed in mat_hang
        const [r] = await conn.query(`SELECT mat_hang FROM tra_hang WHERE id = ? FOR UPDATE`, [id]);
        // Defensive JSON parse: the stored mat_hang may be malformed in some environments
        let items = [];
        try {
          const raw = r && r[0] && r[0].mat_hang ? r[0].mat_hang : '[]';
          items = JSON.parse(raw || '[]');
          if (!Array.isArray(items)) items = [];
        } catch (parseErr) {
          console.warn('Invalid JSON in tra_hang.mat_hang for id', id, '; raw value:', r && r[0] && r[0].mat_hang);
          // fallback to empty array so we don't block the whole action flow
          items = [];
        }

        for (const it of items) {
          const maSP = it.ma_san_pham || it.MaSP || it.productId;
          const qty = Number(it.so_luong || it.qty || 1);
          if (maSP && qty > 0) {
            try {
              await conn.query(`UPDATE sanpham SET SoLuong = COALESCE(SoLuong,0) + ? WHERE MaSP = ?`, [qty, maSP]);
            } catch (e) {
              console.warn('Restock skipped for', maSP, e.message);
            }
          }
        }
      }

      // update related invoice note to reflect approval/return processing
    // ...existing code...
      try {
        const noteParts = [];
        noteParts.push(` Yêu cầu trả hàng được chấp thuận bởi ${byUser || 'admin'}`);
        if (so_tien_hoan && Number(so_tien_hoan) > 0) noteParts.push(`Hoàn tiền ${so_tien_hoan} via ${phuong_thuc_hoan || 'unknown'}`);
        const note = noteParts.length ? (' |' + noteParts.join(' — ')) : '';
        if (rows && rows[0] && rows[0].ma_don_hang) {
          await conn.query(`UPDATE hoadon SET GhiChu = CONCAT(IFNULL(GhiChu,''), ?) WHERE MaHD = ?`, [note, rows[0].ma_don_hang]);
          try {
            const maDon = rows[0].ma_don_hang;
    // ✅ Sửa: giữ nguyên phương thức thanh toán, chỉ cập nhật trạng thái hoàn tiền
await conn.query(
  `UPDATE hoadon 
      SET tinhtrang = 'Chờ xử lý',
          TrangThaiThanhToan = 'Đang hoàn tiền'
    WHERE MaHD = ?`,
  [maDon]
);

          } catch(e) {
            console.warn('Không thể cập nhật hoadon.tinhtrang/PhuongThucThanhToan sau chap_thuan', e.message);
          }
          // If admin requested a refund amount, create a refund_requests row so it appears in refund lists
          try {
            if (so_tien_hoan && Number(so_tien_hoan) > 0) {
              const maDon = rows[0].ma_don_hang;
              // find customer id for the order
              const [ord] = await conn.query(`SELECT makh FROM hoadon WHERE MaHD = ?`, [maDon]);
              const customerId = (ord && ord[0] && ord[0].makh) ? ord[0].makh : null;
              const refundRequestId = `REF_${maDon}_${Date.now()}`;
              const finalRefundAmount = Number(so_tien_hoan) || 0;
             await pool.query(`
  INSERT INTO refund_requests 
  (orderId, customerId, refundRequestId, refundAmount, refundType, refundReason,
   bankAccount, bankName, accountHolder, bankBranch, status, createdAt, return_id)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', NOW(), ?)
`, [maDon, customerId, refundRequestId, finalRefundAmount, 'full', ghi_chu || null, null, 'VNPAY', null, null, id]);

              // mark invoice payment status as processing for frontend/admin lists
              try {
                await conn.query(`UPDATE hoadon SET TrangThaiThanhToan = 'Đang hoàn tiền' WHERE MaHD = ?`, [maDon]);
              } catch (e) { /* ignore */ }
            }
          } catch (e) {
            console.warn('Không thể tạo refund_requests sau chap_thuan', e.message);
          }
        }
      } catch (e) {
        console.warn('Không thể cập nhật hoadon.GhiChu sau chap_thuan', e.message);
      }
// ...existing code...
      // simulate refund: if so_tien_hoan provided -> mark da_hoan_tien
      if (so_tien_hoan && Number(so_tien_hoan) > 0) {
        await conn.query(`UPDATE tra_hang SET trang_thai = 'da_hoan_tien', updated_at = NOW() WHERE id = ?`, [id]);
        await conn.query(`INSERT INTO lich_su_tra_hang (tra_hang_id, trang_thai_cu, trang_thai_moi, nguoi_thuc_hien, ghi_chu) VALUES (?, ?, ?, ?, ?)`, [id, 'chap_thuan', 'da_hoan_tien', byUser || null, `Hoàn tiền ${so_tien_hoan} via ${phuong_thuc_hoan || 'unknown'}`]);
      }

      await conn.commit();
      // fetch latest invoice status to return to caller (helpful for frontends)
      let updatedOrderStatus = null;
      let updatedOrderPaymentMethod = null;
      try {
        if (rows && rows[0] && rows[0].ma_don_hang) {
          const maDon = rows[0].ma_don_hang;
          const [hrows] = await conn.query(`SELECT tinhtrang, PhuongThucThanhToan FROM hoadon WHERE MaHD = ?`, [maDon]);
          if (hrows && hrows[0]) {
            updatedOrderStatus = hrows[0].tinhtrang;
            updatedOrderPaymentMethod = hrows[0].PhuongThucThanhToan || null;
          }
        }
      } catch (e) {
        console.warn('Không thể lấy trạng thái hoadon sau chap_thuan', e.message);
      }

      conn.release();
      return res.json({ id, trang_thai: so_tien_hoan ? 'da_hoan_tien' : 'chap_thuan', ma_don_hang: rows && rows[0] && rows[0].ma_don_hang ? rows[0].ma_don_hang : null, orderStatus: updatedOrderStatus, orderPaymentMethod: updatedOrderPaymentMethod });
    }

    // Non-transactional updates
    await pool.query(`UPDATE tra_hang SET trang_thai = ?, ghi_chu = COALESCE(?, ghi_chu), updated_at = NOW() WHERE id = ?`, [action, ghi_chu || null, id]);
    await pool.query(`INSERT INTO lich_su_tra_hang (tra_hang_id, trang_thai_cu, trang_thai_moi, nguoi_thuc_hien, ghi_chu) VALUES (?, ?, ?, ?, ?)`, [id, current, action, byUser || null, ghi_chu || null]);

   // ...existing code...
    try {
      if ((action === 'da_nhan' || action === 'chap_thuan') && rows && rows[0] && rows[0].ma_don_hang) {
        const maDon = rows[0].ma_don_hang;
        const noteParts = [];
        if (action === 'da_nhan') noteParts.push(` Đã nhận hàng trả bởi ${byUser || 'admin'}`);
        if (action === 'chap_thuan') {
          noteParts.push(` Yêu cầu trả hàng được chấp thuận bởi ${byUser || 'admin'}`);
          if (so_tien_hoan && Number(so_tien_hoan) > 0) noteParts.push(`Hoàn tiền ${so_tien_hoan} via ${phuong_thuc_hoan || 'unknown'}`);
        }
        const note = noteParts.length ? (' |' + noteParts.join(' — ')) : '';
        await pool.query(`UPDATE hoadon SET GhiChu = CONCAT(IFNULL(GhiChu,''), ?) WHERE MaHD = ?`, [note, maDon]);

        // NEW: when admin approves, set invoice status to 'Chờ xử lý' and change payment method to VNPAY
        if (action === 'chap_thuan') {
          try {
            await pool.query(
  `UPDATE hoadon 
   SET tinhtrang = 'Chờ xử lý',
       TrangThaiThanhToan = 'Đang hoàn tiền',
       GhiChu = COALESCE(?, GhiChu)
   WHERE MaHD = ?`,
  [ghi_chu || null, maDon]
);

          } catch (e) {
            console.warn('Không thể cập nhật hoadon.tinhtrang/PhuongThucThanhToan sau action', action, e.message);
          }
              // If administrator provided a refund amount with this approval, create a refund request so it shows in refund management
              try {
                if (so_tien_hoan && Number(so_tien_hoan) > 0) {
                  const finalRefundAmount = Number(so_tien_hoan) || 0;
                  const refundRequestId = `REF_${maDon}_${Date.now()}`;
                  // find customer id
                  const [ord] = await pool.query(`SELECT makh FROM hoadon WHERE MaHD = ?`, [maDon]);
                  const customerId = (ord && ord[0] && ord[0].makh) ? ord[0].makh : null;
               await conn.query(`
                    INSERT INTO refund_requests (orderId, customerId, refundRequestId, refundAmount, refundType, refundReason, bankAccount, bankName, accountHolder, bankBranch, status, createdAt, return_id)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', NOW(), ?)
                  `, [maDon, customerId, refundRequestId, finalRefundAmount, 'return', ghi_chu || null, null, 'VNPAY', null, null, id]);
                  try {
                    await pool.query(`UPDATE hoadon SET TrangThaiThanhToan = 'Đang hoàn tiền' WHERE MaHD = ?`, [maDon]);
                  } catch (e) { /* ignore */ }
                }
              } catch (e) {
                console.warn('Không thể tạo refund_requests sau action chap_thuan (non-transactional)', e.message);
              }
        }
      }
    } catch (e) {
      console.warn('Không thể cập nhật hoadon.GhiChu sau action', action, e.message);
    }


    // Also return related invoice id and current invoice status (best-effort)
    try {
      const maDon = rows && rows[0] && rows[0].ma_don_hang ? rows[0].ma_don_hang : null;
      let orderStatus = null;
      if (maDon) {
        const [hrows] = await pool.query(`SELECT tinhtrang, PhuongThucThanhToan FROM hoadon WHERE MaHD = ?`, [maDon]);
        if (hrows && hrows[0]) {
          orderStatus = hrows[0].tinhtrang;
          // include payment method so caller can update UI if needed
          var orderPaymentMethod = hrows[0].PhuongThucThanhToan || null;
        }
      }
      return res.json({ id, trang_thai: action, ma_don_hang: maDon, orderStatus, orderPaymentMethod });
    } catch (e) {
      return res.json({ id, trang_thai: action, ma_don_hang: rows && rows[0] && rows[0].ma_don_hang ? rows[0].ma_don_hang : null });
    }
  } catch (err) {
    if (conn) {
      try { await conn.rollback(); conn.release(); } catch(e){/* ignore */ }
    }
    // Dev: print full stack and return it so frontend can show the error while debugging
    console.error('Loi action tra_hang:', err);
    console.error(err.stack);
    return res.status(500).json({ error: 'Không thể cập nhật trạng thái', details: err.message, stack: err.stack });
  }
});

// GET list
router.get('/', async (req, res) => {
  const { trang_thai, page = 1, pageSize = 20 } = req.query;
  const offset = (page - 1) * pageSize;
  try {
    let sql = `SELECT * FROM tra_hang`;
    const params = [];
    if (trang_thai) {
      sql += ` WHERE trang_thai = ?`;
      params.push(trang_thai);
    }
    sql += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(pageSize), parseInt(offset));
    const [rows] = await pool.query(sql, params);
    rows.forEach(r => {
      try { r.mat_hang = JSON.parse(r.mat_hang); } catch(e){}
      try { r.tep_dinh_kem = JSON.parse(r.tep_dinh_kem); } catch(e){}
    });
    res.json(rows);
  } catch (err) {
    console.error('Loi list tra_hang:', err);
    res.status(500).json({ error: 'Không thể lấy danh sách' });
  }
});

// GET detail
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query(`SELECT * FROM tra_hang WHERE id = ?`, [id]);
    if (!rows.length) return res.status(404).json({ error: 'Không tìm thấy yêu cầu' });
    const ret = rows[0];
    try { ret.mat_hang = JSON.parse(ret.mat_hang); } catch(e){}
    try { ret.tep_dinh_kem = JSON.parse(ret.tep_dinh_kem); } catch(e){}
    // Enrich mat_hang items with product image (HinhAnh) when possible
    if (Array.isArray(ret.mat_hang) && ret.mat_hang.length > 0) {
      try {
        const enriched = await Promise.all(ret.mat_hang.map(async (it) => {
          const pid = it.ma_san_pham || it.MaSP || it.productId;
          if (!pid) return it;
          try {
            // fetch both name and image so frontend can display a friendly label
            const [prodRows] = await pool.query('SELECT TenSP, HinhAnh FROM sanpham WHERE MaSP = ?', [pid]);
            if (prodRows && prodRows[0]) {
              const row = prodRows[0];
              const added = {};
              if (row.TenSP) added.ten_san_pham = row.TenSP;
              if (row.HinhAnh) added.hinh_anh = row.HinhAnh;
              return { ...it, ...added };
            }
          } catch (e) {
            // ignore product lookup errors
          }
          return it;
        }));
        ret.mat_hang = enriched;
      } catch (e) {
        // ignore enrichment failures
      }
    }

    const [history] = await pool.query(`SELECT * FROM lich_su_tra_hang WHERE tra_hang_id = ? ORDER BY created_at ASC`, [id]);
    res.json({ ...ret, history });
  } catch (err) {
    console.error('Loi get tra_hang:', err);
    res.status(500).json({ error: 'Không thể lấy chi tiết', details: err.message });
  }
});

export default router;