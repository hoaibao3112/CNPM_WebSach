import express from 'express';
import pool from '../config/connectDatabase.js';
import { authenticateToken } from '../utils/generateToken.js';
import jwt from 'jsonwebtoken';

const router = express.Router();

// Helper: generate a readable code when admin doesn't provide one
function generateCode(prefix = 'PROMO') {
  const now = new Date();
  const stamp = now.toISOString().replace(/[-:.TZ]/g, '').slice(0,14);
  const rand = Math.random().toString(36).slice(2,6).toUpperCase();
  return `${prefix}-${stamp}-${rand}`;
}

// Validation rules cho cấu trúc mới
const validatePromotion = (promotionData, isUpdate = false) => {
  const errors = [];

  if (!isUpdate || promotionData.TenKM !== undefined) {
    if (!promotionData.TenKM?.trim()) {
      errors.push('Tên khuyến mãi là bắt buộc');
    } else if (promotionData.TenKM.length > 100) {
      errors.push('Tên khuyến mãi không quá 100 ký tự');
    }
  }
      
      
      

  if (!promotionData.NgayBatDau) {
    errors.push('Ngày bắt đầu là bắt buộc');
  }

  if (!promotionData.NgayKetThuc) {
    errors.push('Ngày kết thúc là bắt buộc');
  } else if (new Date(promotionData.NgayKetThuc) < new Date(promotionData.NgayBatDau)) {
    errors.push('Ngày kết thúc phải sau ngày bắt đầu');
  }

  if (!isUpdate || promotionData.LoaiKM !== undefined) {
    const validTypes = ['giam_phan_tram', 'giam_tien_mat', 'free_ship'];
    if (!promotionData.LoaiKM || !validTypes.includes(promotionData.LoaiKM)) {
      errors.push('Loại khuyến mãi không hợp lệ (chỉ giam_phan_tram, giam_tien_mat hoặc free_ship)');
    }
  }

  if (promotionData.LoaiKM === 'giam_tien_mat') {
    if (promotionData.SoLuongToiThieu < 1) {
      errors.push('Số lượng tối thiểu phải >= 1 cho loại giam_tien_mat');
    }
  }

  return errors;
};

// GET / - Lấy danh sách khuyến mãi
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', activeOnly = false, loaiKM = '' } = req.query;
    const offset = (page - 1) * limit;
    const searchTerm = `%${search}%`;

    let whereClause = `WHERE TenKM LIKE ?`;
    const params = [searchTerm];

    if (activeOnly === 'true') {
      whereClause += ` AND NgayBatDau <= NOW() AND NgayKetThuc >= NOW() AND TrangThai = 1`;
    }

    // Lọc theo loại khuyến mãi nếu có
    if (loaiKM && ['giam_phan_tram', 'giam_tien_mat', 'free_ship'].includes(loaiKM)) {
      whereClause += ` AND LoaiKM = ?`;
      params.push(loaiKM);
    }

    const [promotions] = await pool.query(
      `SELECT *, CAST(TrangThai AS UNSIGNED) as TrangThai FROM khuyen_mai
       ${whereClause}
       ORDER BY NgayBatDau DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), parseInt(offset)]
    );

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) as total FROM khuyen_mai ${whereClause}`,
      params
    );

    res.status(200).json({
      data: promotions,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching promotions:', error);
    res.status(500).json({
      error: 'Lỗi khi lấy danh sách khuyến mãi',
      details: error.message
    });
  }
});

// GET /my-promotions - Khuyến mãi của khách hàng
router.get('/my-promotions', authenticateToken, async (req, res) => {
  try {
    const makh = req.user.makh;
    const { activeOnly = false, loaiKM = '' } = req.query;

    let whereClause = `WHERE kk.makh = ?`;
    const params = [makh];

    if (activeOnly === 'true') {
      whereClause += ` AND kk.trang_thai = 'Chua_su_dung' AND kk.ngay_het_han >= NOW()`;
    }

    // Lọc theo loại khuyến mãi nếu có
    if (loaiKM && ['giam_phan_tram', 'giam_tien_mat', 'free_ship'].includes(loaiKM)) {
      whereClause += ` AND k.LoaiKM = ?`;
      params.push(loaiKM);
    }

    const [promotions] = await pool.query(
      `SELECT k.MaKM, k.TenKM, k.LoaiKM, k.Code, k.MoTa, CAST(k.TrangThai AS UNSIGNED) as TrangThai,
       kk.ngay_lay, kk.ngay_het_han, kk.trang_thai,
       ct.GiaTriDonToiThieu, ct.GiaTriGiam, ct.GiamToiDa
       FROM khachhang_khuyenmai kk
       JOIN khuyen_mai k ON kk.makm = k.MaKM
       LEFT JOIN ct_khuyen_mai ct ON k.MaKM = ct.MaKM
       ${whereClause}
       ORDER BY kk.ngay_lay DESC`,
      params
    );

    res.status(200).json({ data: promotions });
  } catch (error) {
    console.error('Error fetching my promotions:', error);
    res.status(500).json({
      error: 'Lỗi khi lấy khuyến mãi của bạn',
      details: error.message
    });
  }
});

// GET /active-products - Lấy danh sách sản phẩm đang được khuyến mãi (active)
// Trả về mỗi sản phẩm kèm thông tin khuyến mãi áp dụng (nếu nhiều khuyến mãi, lấy khuyến mãi có ưu tiên cao nhất theo GiaTriGiam/GiamToiDa)
router.get('/active-products', async (req, res) => {
  try {
    // Lấy tất cả các khuyến mãi đang active
    const [activePromotions] = await pool.query(
      `SELECT k.MaKM, k.TenKM, k.LoaiKM, k.Code, CAST(k.TrangThai AS UNSIGNED) as TrangThai,
              ct.GiaTriGiam, ct.GiaTriDonToiThieu, ct.GiamToiDa, ct.SoLuongToiThieu
       FROM khuyen_mai k
       JOIN ct_khuyen_mai ct ON k.MaKM = ct.MaKM
       WHERE k.TrangThai = 1
         AND k.NgayBatDau <= NOW()
         AND k.NgayKetThuc >= NOW()`
    );

    if (activePromotions.length === 0) {
      return res.status(200).json({ data: [] });
    }

    // Lấy tất cả sản phẩm áp dụng cho các khuyến mãi active
    // JOIN đầy đủ với bảng sanpham và tacgia để lấy thông tin chi tiết
    const [rows] = await pool.query(
      `SELECT sp.MaSP, sp.TenSP, sp.HinhAnh, sp.DonGia, sp.SoLuong, sp.NamXB,
              tg.TenTG as TacGia,
              km.MaKM, km.TenKM, km.LoaiKM,
              ct.GiaTriGiam, ct.GiaTriDonToiThieu, ct.GiamToiDa, ct.SoLuongToiThieu, 
              k.Code, k.NgayBatDau, k.NgayKetThuc
       FROM sp_khuyen_mai spkm
       JOIN sanpham sp ON spkm.MaSP = sp.MaSP
       LEFT JOIN tacgia tg ON sp.MaTG = tg.MaTG
       JOIN khuyen_mai km ON spkm.MaKM = km.MaKM
       JOIN ct_khuyen_mai ct ON km.MaKM = ct.MaKM
       JOIN khuyen_mai k ON k.MaKM = km.MaKM
       WHERE k.TrangThai = 1
         AND k.NgayBatDau <= NOW()
         AND k.NgayKetThuc >= NOW()
         AND sp.SoLuong > 0`
    );

    // Nếu không có sản phẩm được liên kết -> empty
    if (rows.length === 0) {
      return res.status(200).json({ data: [] });
    }

    // Gom nhóm theo MaSP, nếu 1 sản phẩm có nhiều khuyến mãi active thì chọn khuyến mãi tốt nhất
    const grouped = {};
    for (const r of rows) {
      const key = r.MaSP;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(r);
    }

    const result = Object.values(grouped).map(list => {
      // Chọn khuyến mãi ưu tiên: nếu có giam_phan_tram -> chọn theo % lớn nhất; nếu giam_tien_mat -> theo giá tiền lớn nhất
      let best = list[0];
      for (const item of list) {
        if (item.LoaiKM === 'giam_phan_tram' && best.LoaiKM === 'giam_phan_tram') {
          if ((item.GiaTriGiam || 0) > (best.GiaTriGiam || 0)) best = item;
        } else if (item.LoaiKM === 'giam_tien_mat' && best.LoaiKM === 'giam_tien_mat') {
          if ((item.GiaTriGiam || 0) > (best.GiaTriGiam || 0)) best = item;
        } else if (item.LoaiKM === 'giam_phan_tram' && best.LoaiKM === 'giam_tien_mat') {
          // ưu tiên phần trăm hơn tiền mặt
          best = item;
        }
      }

      return {
        MaSP: best.MaSP,
        TenSP: best.TenSP,
        HinhAnh: best.HinhAnh || null,
        DonGia: best.DonGia,
        SoLuong: best.SoLuong || 0,
        NamXB: best.NamXB || null,
        TacGia: best.TacGia || 'Đang cập nhật',
        MaKM: best.MaKM,
        TenKM: best.TenKM,
        LoaiKM: best.LoaiKM,
        GiaTriGiam: best.GiaTriGiam,
        GiaTriDonToiThieu: best.GiaTriDonToiThieu,
        GiamToiDa: best.GiamToiDa,
        SoLuongToiThieu: best.SoLuongToiThieu,
        Code: best.Code,
        NgayBatDau: best.NgayBatDau,
        NgayKetThuc: best.NgayKetThuc
      };
    });

    res.status(200).json({ data: result });
  } catch (error) {
    console.error('Error fetching active sale products:', error);
    res.status(500).json({ error: 'Lỗi khi lấy sản phẩm khuyến mãi', details: error.message });
  }
});

// GET /:makm - Chi tiết khuyến mãi
// GET /public - Public listing (only public, claimable, active promos)
router.get('/public', async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '' } = req.query;
    const offset = (page - 1) * limit;
    const searchTerm = `%${search}%`;
    // Try to optionally decode token to identify customer (but don't require it)
    let currentMakh = null;
    try {
      const token = req.cookies?.token || (req.headers['authorization'] && req.headers['authorization'].split(' ')[1]);
      if (token) {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_default_secret_key');
        if (decoded && decoded.makh) currentMakh = decoded.makh;
      }
    } catch (e) {
      // Do not fail the request if token invalid/expired — treat as unauthenticated
      console.warn('Optional token decode failed for /public:', e.message);
      currentMakh = null;
    }

    // Build base WHERE and params, optionally exclude promotions the customer already used
    let whereClause = `WHERE k.TrangThai = 1
         AND k.Audience = 'PUBLIC'
         AND k.IsClaimable = 1
         AND k.NgayBatDau <= NOW()
         AND k.NgayKetThuc >= NOW()
         AND k.TenKM LIKE ?`;
    const params = [searchTerm];

    if (currentMakh) {
      // Exclude promotions that this customer already used (trang_thai = 'Da_su_dung')
      whereClause += ` AND k.MaKM NOT IN (SELECT makm FROM khachhang_khuyenmai WHERE makh = ? AND trang_thai = 'Da_su_dung')`;
      params.push(currentMakh);
    }

    const [promotions] = await pool.query(
      `SELECT k.MaKM, k.TenKM, k.LoaiKM, k.Code, k.MoTa, CAST(k.TrangThai AS UNSIGNED) as TrangThai, ct.GiaTriGiam, ct.GiaTriDonToiThieu, ct.GiamToiDa, k.NgayBatDau, k.NgayKetThuc
       FROM khuyen_mai k
       LEFT JOIN ct_khuyen_mai ct ON k.MaKM = ct.MaKM
       ${whereClause}
       ORDER BY k.NgayBatDau DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), parseInt(offset)]
    );

    const countQuery = `SELECT COUNT(*) as total FROM khuyen_mai k ${whereClause}`;
    const [[{ total }]] = await pool.query(countQuery, params);

    res.status(200).json({
      data: promotions,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching public promotions:', error);
    res.status(500).json({ error: 'Lỗi khi lấy khuyến mãi công khai', details: error.message });
  }
});

// GET /:makm - Chi tiết khuyến mãi
router.get('/:makm', async (req, res) => {
  try {
    const makm = req.params.makm;

    const [[promotion]] = await pool.query(
      `SELECT k.*, CAST(k.TrangThai AS UNSIGNED) as TrangThai, 
       ct.GiaTriGiam, ct.GiaTriDonToiThieu, ct.GiamToiDa, ct.SoLuongToiThieu
       FROM khuyen_mai k
       LEFT JOIN ct_khuyen_mai ct ON k.MaKM = ct.MaKM
       WHERE k.MaKM = ?`,
      [makm]
    );

    if (!promotion) {
      return res.status(404).json({ error: 'Không tìm thấy khuyến mãi' });
    }

    let products = [];
    try {
      [products] = await pool.query(
        `SELECT s.MaSP, s.TenSP 
         FROM sp_khuyen_mai spkm 
         JOIN sanpham s ON spkm.MaSP = s.MaSP 
         WHERE spkm.MaKM = ?`,
        [makm]
      );
    } catch (e) {
      // Nếu lỗi do bảng/cột, trả về mảng rỗng thay vì lỗi 500
      products = [];
    }

    res.status(200).json({
      ...promotion,
      SanPhamApDung: products // [{MaSP, TenSP}]
    });
  } catch (error) {
    console.error('Error fetching promotion detail:', error);
    res.status(500).json({
      error: 'Lỗi khi lấy chi tiết khuyến mãi',
      details: error.message
    });
  }
});

// POST / - Thêm khuyến mãi mới
router.post('/', authenticateToken, async (req, res) => {
  try {
    const promotionData = req.body;
    const errors = validatePromotion(promotionData);
    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Auto-generate Code if admin didn't provide one
      let codeToUse = promotionData.Code || null;
      if (!codeToUse) {
        const prefix = promotionData.LoaiKM === 'free_ship' ? 'FREESHIP' : 'PROMO';
        codeToUse = generateCode(prefix);
      }

      // Determine Audience and IsClaimable defaults
      // If it's a free_ship intended for forms, hide from public listing and make non-claimable
      const audience = promotionData.Audience || (promotionData.LoaiKM === 'free_ship' ? 'FORM_ONLY' : 'PUBLIC');
      const isClaimable = typeof promotionData.IsClaimable !== 'undefined' ? promotionData.IsClaimable : (promotionData.LoaiKM === 'free_ship' ? 0 : 1);

      const [result] = await connection.query(
        `INSERT INTO khuyen_mai (TenKM, MoTa, NgayBatDau, NgayKetThuc, LoaiKM, Code, Audience, IsClaimable)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [promotionData.TenKM, promotionData.MoTa || null, promotionData.NgayBatDau, promotionData.NgayKetThuc, promotionData.LoaiKM, codeToUse, audience, isClaimable]
      );

      const makm = result.insertId;

      // Với Free Ship: GiaTriGiam = 0 (vì không giảm tiền sản phẩm)
      const giaTriGiam = promotionData.LoaiKM === 'free_ship' ? 0 : (promotionData.GiaTriGiam || 0);

      await connection.query(
        `INSERT INTO ct_khuyen_mai (MaKM, GiaTriGiam, GiaTriDonToiThieu, GiamToiDa, SoLuongToiThieu)
         VALUES (?, ?, ?, ?, ?)`,
        [makm, giaTriGiam, promotionData.GiaTriDonToiThieu || null, promotionData.GiamToiDa || null, promotionData.SoLuongToiThieu || 1]
      );

      // Logic xử lý sản phẩm áp dụng:
      // - Nếu có chọn sản phẩm cụ thể -> lưu vào sp_khuyen_mai
      // - Nếu không chọn sản phẩm nào (mảng rỗng hoặc undefined) -> áp dụng cho tất cả (không lưu vào sp_khuyen_mai)
      if (promotionData.SanPhamApDung && Array.isArray(promotionData.SanPhamApDung) && promotionData.SanPhamApDung.length > 0) {
        // Có chọn sản phẩm cụ thể -> lưu vào bảng sp_khuyen_mai
        for (const masp of promotionData.SanPhamApDung) {
          await connection.query(`INSERT INTO sp_khuyen_mai (MaKM, MaSP) VALUES (?, ?)`, [makm, masp]);
        }
      }
      // Nếu không có sản phẩm nào được chọn -> không lưu gì vào sp_khuyen_mai (áp dụng cho tất cả)

      await connection.commit();

      res.status(201).json({ message: 'Thêm khuyến mãi thành công', makm });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error adding promotion:', error);
    res.status(500).json({
      error: 'Lỗi khi thêm khuyến mãi',
      details: error.message
    });
  }
});

// PUT /:makm - Sửa khuyến mãi
router.put('/:makm', authenticateToken, async (req, res) => {
  try {
    const makm = req.params.makm;
    const promotionData = req.body;
    const errors = validatePromotion(promotionData, true);
    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Cập nhật khuyen_mai
      // Update Audience / IsClaimable when provided; otherwise apply sensible defaults for free_ship
      const audienceUpdate = typeof promotionData.Audience !== 'undefined' ? promotionData.Audience : (promotionData.LoaiKM === 'free_ship' ? 'FORM_ONLY' : null);
      const isClaimableUpdate = typeof promotionData.IsClaimable !== 'undefined' ? promotionData.IsClaimable : (promotionData.LoaiKM === 'free_ship' ? 0 : null);

      await connection.query(
        `UPDATE khuyen_mai SET TenKM = ?, MoTa = ?, NgayBatDau = ?, NgayKetThuc = ?, LoaiKM = ?, Code = ? ${audienceUpdate !== null ? ', Audience = ?' : ''} ${isClaimableUpdate !== null ? ', IsClaimable = ?' : ''} WHERE MaKM = ?`,
        // Build params dynamically to match the query placeholders
        (function(){
          const params = [promotionData.TenKM || null, promotionData.MoTa || null, promotionData.NgayBatDau || null, promotionData.NgayKetThuc || null, promotionData.LoaiKM || null, promotionData.Code || null];
          if (audienceUpdate !== null) params.push(audienceUpdate);
          if (isClaimableUpdate !== null) params.push(isClaimableUpdate);
          params.push(makm);
          return params;
        })()
      );

      // Cập nhật ct_khuyen_mai
      // Với Free Ship: GiaTriGiam = 0 (vì không giảm tiền sản phẩm)
      const giaTriGiam = promotionData.LoaiKM === 'free_ship' ? 0 : (promotionData.GiaTriGiam || 0);
      
      await connection.query(
        `UPDATE ct_khuyen_mai SET GiaTriGiam = ?, GiaTriDonToiThieu = ?, GiamToiDa = ?, SoLuongToiThieu = ? WHERE MaKM = ?`,
        [giaTriGiam, promotionData.GiaTriDonToiThieu || null, promotionData.GiamToiDa || null, promotionData.SoLuongToiThieu || null, makm]
      );

      // Xóa tất cả sản phẩm áp dụng cũ
      await connection.query(`DELETE FROM sp_khuyen_mai WHERE MaKM = ?`, [makm]);

      // Logic tương tự như POST:
      // - Nếu có chọn sản phẩm cụ thể -> lưu vào sp_khuyen_mai
      // - Nếu không chọn sản phẩm nào -> áp dụng cho tất cả (không lưu vào sp_khuyen_mai)
      if (promotionData.SanPhamApDung && Array.isArray(promotionData.SanPhamApDung) && promotionData.SanPhamApDung.length > 0) {
        // Có chọn sản phẩm cụ thể -> lưu vào bảng sp_khuyen_mai
        for (const masp of promotionData.SanPhamApDung) {
          await connection.query(`INSERT INTO sp_khuyen_mai (MaKM, MaSP) VALUES (?, ?)`, [makm, masp]);
        }
      }
      // Nếu không có sản phẩm nào được chọn -> không lưu gì vào sp_khuyen_mai (áp dụng cho tất cả)

      await connection.commit();

      res.status(200).json({ message: 'Cập nhật khuyến mãi thành công' });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error updating promotion:', error);
    res.status(500).json({
      error: 'Lỗi khi cập nhật khuyến mãi',
      details: error.message
    });
  }
});
// DELETE /:makm - Xóa khuyến mãi - ĐÃ SỬA
router.delete('/:makm', authenticateToken, async (req, res) => {
  try {
    const makm = req.params.makm;

    // Kiểm tra khuyến mãi có tồn tại không
    const [[promotion]] = await pool.query(
      `SELECT MaKM FROM khuyen_mai WHERE MaKM = ?`,
      [makm]
    );

    if (!promotion) {
      return res.status(404).json({ error: 'Không tìm thấy khuyến mãi' });
    }

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // 1. Xóa các bản ghi trong bảng khachhang_khuyenmai (nếu có)
      await connection.query(
        `DELETE FROM khachhang_khuyenmai WHERE makm = ?`,
        [makm]
      );

      // 2. Xóa các bản ghi trong bảng sp_khuyen_mai (sản phẩm áp dụng)
      await connection.query(
        `DELETE FROM sp_khuyen_mai WHERE MaKM = ?`,
        [makm]
      );

      // 3. Xóa bản ghi trong bảng ct_khuyen_mai (chi tiết khuyến mãi)
      await connection.query(
        `DELETE FROM ct_khuyen_mai WHERE MaKM = ?`,
        [makm]
      );

      // 4. Cuối cùng xóa bản ghi chính trong bảng khuyen_mai
      await connection.query(
        `DELETE FROM khuyen_mai WHERE MaKM = ?`,
        [makm]
      );

      await connection.commit();

      res.status(200).json({
        message: 'Xóa khuyến mãi thành công',
        makm
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error deleting promotion:', error);
    res.status(500).json({
      error: 'Lỗi khi xóa khuyến mãi',
      details: error.message
    });
  }
});

// PATCH /:makm/trangthai - Cập nhật trạng thái khuyến mãi
router.patch('/:makm/trangthai', authenticateToken, async (req, res) => {
  try {
    const makm = req.params.makm;
    const { trangThai } = req.body;

    // Kiểm tra trạng thái hợp lệ (0 hoặc 1)
    if (trangThai !== 0 && trangThai !== 1) {
      return res.status(400).json({ error: 'Trạng thái chỉ được là 0 hoặc 1' });
    }

    // Kiểm tra khuyến mãi có tồn tại không
    const [[promotion]] = await pool.query(
      `SELECT MaKM FROM khuyen_mai WHERE MaKM = ?`,
      [makm]
    );

    if (!promotion) {
      return res.status(404).json({ error: 'Không tìm thấy khuyến mãi' });
    }

    // Cập nhật trạng thái
    await pool.query(
      `UPDATE khuyen_mai SET TrangThai = ? WHERE MaKM = ?`,
      [trangThai, makm]
    );

    res.status(200).json({
      message: 'Cập nhật trạng thái thành công',
      makm,
      trangThai
    });
  } catch (error) {
    console.error('Error updating promotion status:', error);
    res.status(500).json({
      error: 'Lỗi khi cập nhật trạng thái khuyến mãi',
      details: error.message
    });
  }
});

// POST /apply-to-cart - Áp dụng khuyến mãi vào giỏ hàng
router.post('/apply-to-cart', authenticateToken, async (req, res) => {
  try {
  const { code, cartItems, makh } = req.body;
  // fallback to authenticated user if makh not provided
  const customerId = makh || req.user?.makh;

    // Debug log: print incoming payload to help diagnose 400 errors
    console.log('[/khuyenmai/apply-to-cart] payload:', JSON.stringify(req.body || {}));

    // 1. Kiểm tra input
    // ✅ FIX: Cho phép cartItems = [] để hiển thị modal gợi ý sản phẩm khi giỏ trống
    if (!code || typeof code !== 'string' || code.trim() === '') {
      console.warn('[/khuyenmai/apply-to-cart] Missing or invalid code in request body');
      return res.status(400).json({ error: 'Thiếu thông tin: mã khuyến mãi (code) không hợp lệ' });
    }

    if (typeof cartItems === 'undefined' || !Array.isArray(cartItems)) {
      console.warn('[/khuyenmai/apply-to-cart] Missing or invalid cartItems in request body');
      return res.status(400).json({ error: 'Thiếu thông tin: giỏ hàng (cartItems) phải là một mảng (có thể rỗng)' });
    }

    // 2. Lấy thông tin khuyến mãi hoặc kiểm tra mã phát hành trong bảng coupon nếu cần
    // Thực hiện 2 bước: (A) thử tìm trong bảng khuyen_mai (theo code), (B) nếu không có, thử lookup trong phieugiamgia_phathanh
    let promotion = null;
    let MaKM = null;

    try {
      const [[foundPromo]] = await pool.query(
        `SELECT k.*, CAST(k.TrangThai AS UNSIGNED) AS TrangThai,
                ct.GiaTriGiam, ct.GiaTriDonToiThieu, ct.GiamToiDa, ct.SoLuongToiThieu
         FROM khuyen_mai k
         JOIN ct_khuyen_mai ct ON k.MaKM = ct.MaKM
         WHERE k.code = ? 
           AND k.TrangThai = 1 
           AND k.NgayBatDau <= NOW() 
           AND k.NgayKetThuc >= NOW()`,
        [code]
      );

      if (foundPromo) {
        promotion = foundPromo;
        MaKM = promotion.MaKM;
      } else {
        // Nếu không tìm thấy trong khuyen_mai, thử lookup mã phát hành (coupon) dành cho khách hàng
        // Lưu ý: một số mã (ví dụ mã được phát qua form preference) nằm ở phieugiamgia_phathanh / phieugiamgia
        try {
          const [[couponRow]] = await pool.query(
            `SELECT ph.*, p.MaKM as Coupon_MaKM, p.TrangThai as Coupon_TrangThai, p.MaPhieu as Coupon_Code, p.MoTa as Coupon_MoTa
             FROM phieugiamgia_phathanh ph
             JOIN phieugiamgia p ON ph.MaPhieu = p.MaPhieu
            WHERE ph.MaPhieu = ? AND ph.makh = ? LIMIT 1`,
            [code, customerId]
          );

          if (!couponRow) {
            // Không tìm thấy mã ở cả 2 nơi -> trả về lỗi hợp lệ
            return res.status(400).json({ error: 'Khuyến mãi không hợp lệ hoặc đã hết hạn' });
          }

          // Nếu mã đã bị dùng
          if (couponRow.NgaySuDung) {
            return res.status(401).json({ error: 'Mã này đã được sử dụng' });
          }
          // Nếu template mã không còn active
          if (couponRow.Coupon_TrangThai === 0) {
            return res.status(400).json({ error: 'Mã này đã ngừng hoạt động' });
          }

          // Nếu coupon template liên kết tới một MaKM (promotion), sử dụng promotion đó
          if (couponRow && couponRow.Coupon_MaKM) {
            const [[promoFromCoupon]] = await pool.query(
              `SELECT k.*, CAST(k.TrangThai AS UNSIGNED) AS TrangThai, ct.GiaTriGiam, ct.GiaTriDonToiThieu, ct.GiamToiDa, ct.SoLuongToiThieu
               FROM khuyen_mai k
               JOIN ct_khuyen_mai ct ON k.MaKM = ct.MaKM
               WHERE k.MaKM = ? AND k.TrangThai = 1 AND k.NgayBatDau <= NOW() AND k.NgayKetThuc >= NOW()`,
              [couponRow.Coupon_MaKM]
            );

            if (!promoFromCoupon) {
              return res.status(400).json({ error: 'Khuyến mãi liên kết với mã này không còn hợp lệ' });
            }

            promotion = promoFromCoupon;
            MaKM = promoFromCoupon.MaKM;
          } else {
            // Mã chỉ là coupon độc lập (không liên kết MaKM). Tạo đối tượng promotion tạm thời
            promotion = {
              MaKM: null,
              LoaiKM: null,
              TenKM: couponRow ? (couponRow.Coupon_MoTa || couponRow.MaPhieu || code) : code,
              Code: couponRow ? (couponRow.Coupon_Code || couponRow.MaPhieu || code) : code,
              TrangThai: couponRow ? (couponRow.Coupon_TrangThai || 1) : 1,
              GiaTriDonToiThieu: 0,
              GiaTriGiam: 0,
              GiamToiDa: 0
            };

            // expose couponIssuedRow so later logic can detect coupon-only flow
            var couponIssuedRow = couponRow; // use var to allow access later in this scope
          }
        } catch (e) {
          console.warn('Error checking phieugiamgia_phathanh for code lookup', e);
          return res.status(500).json({ error: 'Lỗi khi kiểm tra mã phát hành', details: e.message });
        }
      }
    } catch (e) {
      console.error('Error fetching promotion by code:', e);
      return res.status(500).json({ error: 'Lỗi khi truy vấn khuyến mãi', details: e.message });
    }

    // 4. Lấy TOÀN BỘ sản phẩm được áp dụng khuyến mãi này
    // Nếu promotion không có MaKM (coupon độc lập), thì bỏ qua truy vấn sp_khuyen_mai
    let allKMProducts = [];
    if (MaKM) {
      const [rows] = await pool.query(
        `SELECT sp.MaSP, sp.TenSP, sp.DonGia, sp.HinhAnh
         FROM sp_khuyen_mai km
         JOIN sanpham sp ON km.MaSP = sp.MaSP
         WHERE km.MaKM = ?`,
        [MaKM]
      );
      allKMProducts = rows;
    }

    // flag xem khachhang_khuyenmai có gán cho khách này không (khai báo ở scope bên ngoài để dùng ở sau)
    let customerAssigned = false;

    // ✅ FIX: Chuẩn hóa đường dẫn ảnh - xử lý nhiều trường hợp
    allKMProducts.forEach(product => {
      if (product.HinhAnh) {
        let imgPath = product.HinhAnh;
        
        // Trường hợp 1: Đường dẫn đầy đủ (img/product/sp08.jpg)
        if (imgPath.startsWith('img/product/')) {
          product.HinhAnh = imgPath;
        }
        // Trường hợp 2: Chỉ có đường dẫn img/ (img/sp08.jpg)
        else if (imgPath.startsWith('img/')) {
          product.HinhAnh = imgPath.replace('img/', 'img/product/');
        }
        // Trường hợp 3: Chỉ có tên file (sp08.jpg)
        else {
          product.HinhAnh = `img/product/${imgPath}`;
        }
      } else {
        // Không có ảnh -> dùng default
        product.HinhAnh = 'img/product/default.jpg';
      }
    });

    // Nếu không có sản phẩm liên kết:
    // - Nếu đây là khuyến mãi loại free_ship (promotion record) -> cho phép (free ship không cần product linkage).
    // - Nếu mã là coupon-issued dành cho khách (phieugiamgia_phathanh) -> cho phép.
    // - Nếu khuyến mãi có Audience = 'FORM_ONLY' (form-issued) -> cho phép (áp dụng toàn bộ sản phẩm).
    // - Nếu khuyến mãi có Audience = 'PRIVATE' và đã được gán cho khách (khachhang_khuyenmai) -> cho phép cho riêng khách đó.
    // Ngược lại trả về lỗi kèm gợi ý (empty list)
    if (allKMProducts.length === 0) {
      const promoType = promotion && promotion.LoaiKM ? String(promotion.LoaiKM).toLowerCase() : null;
      const isCouponIssued = typeof couponIssuedRow !== 'undefined' && couponIssuedRow;
      const audience = promotion && promotion.Audience ? String(promotion.Audience) : null;

  // Kiểm tra xem khuyến mãi có được gán cho khách hàng này trong khachhang_khuyenmai hay không
  customerAssigned = false;
  if (MaKM && customerId) {
        try {
          const [[assigned]] = await pool.query(
            `SELECT * FROM khachhang_khuyenmai WHERE makh = ? AND makm = ? LIMIT 1`,
            [customerId, MaKM]
          );
          customerAssigned = !!assigned;
        } catch (e) {
          console.warn('Error checking khachhang_khuyenmai assignment', e);
        }
      }

      // Log to help debugging
      console.log('[/khuyenmai/apply-to-cart] no linked products. promoType=', promoType, 'isCouponIssued=', !!isCouponIssued, 'audience=', audience, 'customerAssigned=', customerAssigned);

      if (promoType === 'free_ship') {
        console.log('ℹ️ free_ship promotion detected with no product links; allowing apply (free shipping)');
      } else if (isCouponIssued) {
        console.log('ℹ️ Coupon-issued code detected with no product links; allowing coupon-only flow');
      } else if (audience === 'FORM_ONLY') {
        console.log('ℹ️ FORM_ONLY promotion with no product links; treating as global for form-issued codes');
      } else if (audience === 'PRIVATE' && customerAssigned) {
        console.log('ℹ️ PRIVATE promotion assigned to customer; treating as global for this customer');
      } else {
        return res.status(400).json({ 
          error: 'Khuyến mãi này chưa được liên kết với sản phẩm nào',
          suggestedProducts: []
        });
      }
    }

    // ✅ FIX: Nếu giỏ hàng TRỐNG → Trả về gợi ý ngay, không cần kiểm tra tiếp
    if (cartItems.length === 0) {
      console.log('🔍 [API] Giỏ hàng trống, trả 402 với gợi ý ngay');
      const response = { 
        error: 'Giỏ hàng trống',
        message: `Mã "${promotion.TenKM}" chỉ áp dụng cho ${allKMProducts.length} sản phẩm. Vui lòng thêm sản phẩm vào giỏ hàng!`,
        suggestedProducts: allKMProducts.map(p => ({
          MaSP: p.MaSP,
          TenSP: p.TenSP,
          DonGia: p.DonGia,
          HinhAnh: p.HinhAnh
        })),
        requirements: {
          minAmount: promotion.GiaTriDonToiThieu || 0,
          minQuantity: promotion.SoLuongToiThieu || 0
        }
      };
      console.log('🔍 [API] Response:', JSON.stringify(response, null, 2));
      return res.status(402).json(response);
    }

    // 5. Kiểm tra sản phẩm nào trong giỏ được áp dụng khuyến mãi
    let kmProducts = [];

    if (MaKM) {
      const results = await Promise.all(
        cartItems.map(async (item) => {
          const [rows] = await pool.query(
            `SELECT sp.MaSP, sp.DonGia
             FROM sp_khuyen_mai km
             JOIN sanpham sp ON km.MaSP = sp.MaSP
             WHERE km.MaKM = ? AND km.MaSP = ?`,
            [MaKM, item.MaSP]
          );

          if (rows.length > 0) {
            return {
              ...item,
              DonGia: rows[0].DonGia
            };
          }
          return null;
        })
      );

      kmProducts = results.filter(Boolean);
      // Nếu MaKM tồn tại nhưng không có sản phẩm linked (kmProducts rỗng),
      // cần kiểm tra business rule: một số khuyến mãi (ví dụ free_ship, FORM_ONLY hoặc PRIVATE được gán) nên áp dụng cho toàn bộ giỏ hàng.
      if (kmProducts.length === 0 && promotion) {
        const isFreeShip = String(promotion.LoaiKM).toLowerCase() === 'free_ship';
        const isFormOnly = promotion.Audience === 'FORM_ONLY';
        const isPrivateAssigned = promotion.Audience === 'PRIVATE' && customerAssigned;

        if (isFreeShip || isFormOnly || isPrivateAssigned) {
          // Áp dụng cho tất cả sản phẩm trong cart
          kmProducts = cartItems.map(item => ({ ...item, DonGia: item.DonGia || 0 }));
          allKMProducts = kmProducts.map(p => ({ MaSP: p.MaSP, TenSP: p.MaSP, DonGia: p.DonGia, HinhAnh: null }));
          console.log('ℹ️ MaKM exists but no linked sp_khuyen_mai rows; applying free/form/private-assigned promo to all cart items; kmProducts.length=', kmProducts.length);
        }
      }
    } else if (typeof couponIssuedRow !== 'undefined' && couponIssuedRow && promotion && String(promotion.LoaiKM).toLowerCase() !== 'free_ship') {
      // Coupon-only (not linked to a MaKM) and not free_ship -> apply to all cart items
      // Use provided DonGia from client as fallback; ideally this should be validated
      kmProducts = cartItems.map(item => ({
        ...item,
        DonGia: item.DonGia || 0
      }));

      // Also set allKMProducts to mirror cart items so suggestion messages make sense
      allKMProducts = kmProducts.map(p => ({ MaSP: p.MaSP, TenSP: p.MaSP, DonGia: p.DonGia, HinhAnh: null }));
    } else if (promotion && (String(promotion.LoaiKM).toLowerCase() === 'free_ship' || promotion.Audience === 'FORM_ONLY' || (promotion.Audience === 'PRIVATE' && customerAssigned))) {
      // Free-ship promotion or form-issued/private promotion for assigned customer -> apply to all cart items
      kmProducts = cartItems.map(item => ({ ...item, DonGia: item.DonGia || 0 }));
      allKMProducts = kmProducts.map(p => ({ MaSP: p.MaSP, TenSP: p.MaSP, DonGia: p.DonGia, HinhAnh: null }));
      console.log('ℹ️ free_ship/FORM_ONLY/PRIVATE fallback applied to all cart items; kmProducts.length=', kmProducts.length);
    } else {
      // No MaKM and not a coupon-only discount or free_ship we can apply globally -> kmProducts stays empty
      kmProducts = [];
    }

    // 6. Nếu KHÔNG CÓ sản phẩm khuyến mãi trong giỏ → Gợi ý thêm sản phẩm
    if (kmProducts.length === 0) {
      console.log('🔍 [API] Giỏ hàng không có sản phẩm KM, trả 402 với gợi ý');
      console.log('🔍 [API] Số sản phẩm gợi ý:', allKMProducts.length);
      
      const response = { 
        error: 'Giỏ hàng chưa có sản phẩm được giảm giá',
        message: `Mã "${promotion.TenKM}" chỉ áp dụng cho ${allKMProducts.length} sản phẩm. Vui lòng thêm sản phẩm vào giỏ hàng!`,
        suggestedProducts: allKMProducts.map(p => ({
          MaSP: p.MaSP,
          TenSP: p.TenSP,
          DonGia: p.DonGia,
          HinhAnh: p.HinhAnh
        })),
        requirements: {
          minAmount: promotion.GiaTriDonToiThieu || 0,
          minQuantity: promotion.SoLuongToiThieu || 0
        }
      };
      
      console.log('🔍 [API] Response:', JSON.stringify(response, null, 2));
      return res.status(402).json(response);
    }

    // 7. Phân loại sản phẩm
    const kmProductIds = kmProducts.map(p => p.MaSP);
    const nonKmProducts = cartItems.filter(item => !kmProductIds.includes(item.MaSP));

    // 8. Tính tổng tiền
    const subtotal = kmProducts.reduce((sum, item) => sum + item.DonGia * item.SoLuong, 0);
    const tongSoLuong = kmProducts.reduce((sum, item) => sum + item.SoLuong, 0);
    const tongTienKhongGiam = nonKmProducts.reduce((sum, item) => sum + item.DonGia * item.SoLuong, 0);

    // 9. Kiểm tra điều kiện TRƯỚC KHI tính giảm giá
    const minAmount = promotion.GiaTriDonToiThieu || 0;
    const minQuantity = promotion.SoLuongToiThieu || 0;
    const missingAmount = Math.max(0, minAmount - subtotal);
    const missingQuantity = Math.max(0, minQuantity - tongSoLuong);

    // Nếu KHÔNG ĐỦ điều kiện → Gợi ý sản phẩm cần thêm
    if (subtotal < minAmount || tongSoLuong < minQuantity) {
      // Lọc sản phẩm chưa có trong giỏ hoặc có thể mua thêm
      const cartProductIds = kmProducts.map(p => p.MaSP);
      const suggestedProducts = allKMProducts.filter(p => !cartProductIds.includes(p.MaSP));

      return res.status(403).json({
        error: 'Chưa đủ điều kiện áp dụng mã giảm giá',
        message: `Để sử dụng mã "${promotion.TenKM}", bạn cần:`,
        currentStatus: {
          currentAmount: subtotal,
          currentQuantity: tongSoLuong,
          productsInCart: kmProducts.length
        },
        requirements: {
          minAmount: minAmount,
          minQuantity: minQuantity,
          missingAmount: missingAmount,
          missingQuantity: missingQuantity
        },
        suggestions: {
          message: missingAmount > 0 
            ? `Thêm ${missingAmount.toLocaleString('vi-VN')}đ sản phẩm khuyến mãi nữa` 
            : `Thêm ${missingQuantity} sản phẩm khuyến mãi nữa`,
          availableProducts: suggestedProducts.length > 0 ? suggestedProducts : allKMProducts,
          note: suggestedProducts.length > 0 
            ? 'Các sản phẩm dưới đây được giảm giá và chưa có trong giỏ hàng của bạn:' 
            : 'Bạn có thể mua thêm các sản phẩm sau để đủ điều kiện:'
        }
      });
    }

    // 10. Tính giảm giá
    let totalDiscount = 0;
    let total = subtotal + tongTienKhongGiam
    let totalFinal = 0;
    let discountDetails = null;
    console.log(promotion)
    switch (promotion.LoaiKM) {
      case 'giam_phan_tram': {
        console.log("ntádasdassadas")
        // Điều kiện đã kiểm tra ở trên rồi, chỉ cần tính giảm giá
        totalDiscount = subtotal * (promotion.GiaTriGiam / 100);
        totalDiscount = Math.min(totalDiscount, promotion.GiamToiDa || Infinity, subtotal);
        totalFinal = (subtotal - totalDiscount) + tongTienKhongGiam;

        discountDetails = {
          discountType: 'percentage',
          value: promotion.GiaTriGiam,
          discountAmount: totalDiscount,
          total,
          totalFinal,
          products: kmProducts
        };
        break;
      }

      case 'giam_tien_mat': {
        // Điều kiện đã kiểm tra ở trên rồi, chỉ cần tính giảm giá
        totalDiscount = promotion.GiaTriGiam;
        totalFinal = (subtotal - totalDiscount) + tongTienKhongGiam;

        discountDetails = {
          discountType: 'fixed_amount',
          value: promotion.GiaTriGiam,
          discountAmount: totalDiscount,
          total,
          totalFinal,
          products: kmProducts
        };
        break;
      }

      case 'free_ship': {
        // Khuyến mãi free ship: không giảm tiền sản phẩm, chỉ miễn phí vận chuyển
        totalFinal = subtotal + tongTienKhongGiam;

        discountDetails = {
          discountType: 'free_ship',
          value: 0,
          discountAmount: 0,
          total,
          totalFinal,
          products: kmProducts,
          freeShip: true // Đánh dấu để frontend/backend biết đơn này được free ship
        };
        break;
      }

      default:
        return res.status(400).json({ error: 'Loại khuyến mãi không được hỗ trợ' });
    }

    if (!discountDetails) {
      return res.status(403).json({ error: 'Điều kiện áp dụng khuyến mãi không đạt yêu cầu' });
    }

    // 8. Trả về kết quả
    res.status(200).json({
      success: true,
      discountDetails
    });

  } catch (error) {
    console.error('Error applying promotion to cart:', error);
    res.status(500).json({
      error: 'Lỗi khi áp dụng khuyến mãi',
      details: error.message
    });
  }
});



// POST /claim/:makm - Lấy mã khuyến mãi
router.post('/claim/:makm', authenticateToken, async (req, res) => {
  try {
    const makm = req.params.makm;
    const makh = req.user.makh;

    const [[customer]] = await pool.query('SELECT * FROM khachhang WHERE makh = ?', [makh]);
    if (!customer) {
      return res.status(404).json({ error: 'Không tìm thấy khách hàng' });
    }

    const [[promotion]] = await pool.query(
      `SELECT *, CAST(TrangThai AS UNSIGNED) as TrangThai FROM khuyen_mai 
       WHERE MaKM = ? AND TrangThai = 1 
       AND NgayBatDau <= NOW() AND NgayKetThuc >= NOW() AND IsClaimable = 1`,
      [makm]
    );
    if (!promotion) {
      return res.status(400).json({ error: 'Mã khuyến mãi không hợp lệ hoặc hết hạn' });
    }

    const [[existingClaim]] = await pool.query(
      `SELECT * FROM khachhang_khuyenmai 
       WHERE makh = ? AND makm = ?`,
      [makh, makm]
    );
    if (existingClaim) {
      return res.status(400).json({ error: 'Bạn đã lấy mã khuyến mãi này rồi' });
    }

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      await connection.query(
        `INSERT INTO khachhang_khuyenmai (makh, makm, ngay_lay, ngay_het_han, trang_thai) 
         VALUES (?, ?, NOW(), ?, 'Chua_su_dung')`,
        [makh, makm, promotion.NgayKetThuc]
      );

      await connection.commit();

      res.status(200).json({
        message: 'Lấy mã khuyến mãi thành công!',
        makm,
        code: promotion.Code || '',
        ngay_lay: new Date().toISOString().split('T')[0]
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error claiming promotion:', error);
    res.status(500).json({
      error: 'Lỗi khi lấy mã khuyến mãi',
      details: error.message
    });
  }
});

export default router;

// GET /active-products - Lấy danh sách sản phẩm đang được khuyến mãi (active)
// Trả về mỗi sản phẩm kèm thông tin khuyến mãi áp dụng (nếu nhiều khuyến mãi, lấy khuyến mãi có ưu tiên cao nhất theo GiaTriGiam/GiamToiDa)
router.get('/active-products', async (req, res) => {
  try {
    // Lấy tất cả các khuyến mãi đang active
    const [activePromotions] = await pool.query(
      `SELECT k.MaKM, k.TenKM, k.LoaiKM, k.Code, CAST(k.TrangThai AS UNSIGNED) as TrangThai,
              ct.GiaTriGiam, ct.GiaTriDonToiThieu, ct.GiamToiDa, ct.SoLuongToiThieu
       FROM khuyen_mai k
       JOIN ct_khuyen_mai ct ON k.MaKM = ct.MaKM
       WHERE k.TrangThai = 1
         AND k.NgayBatDau <= NOW()
         AND k.NgayKetThuc >= NOW()`
    );

    if (activePromotions.length === 0) {
      return res.status(200).json({ data: [] });
    }

    // Lấy tất cả sản phẩm áp dụng cho các khuyến mãi active
    // Trả về: MaSP, TenSP, HinhAnh (nếu có), DonGia, MaKM, thông tin khuyến mãi
    const [rows] = await pool.query(
      `SELECT sp.MaSP, sp.TenSP, sp.HinhAnh, sp.DonGia, km.MaKM, km.TenKM, km.LoaiKM,
              ct.GiaTriGiam, ct.GiaTriDonToiThieu, ct.GiamToiDa, ct.SoLuongToiThieu, k.Code,
              k.NgayBatDau, k.NgayKetThuc
       FROM sp_khuyen_mai spkm
       JOIN sanpham sp ON spkm.MaSP = sp.MaSP
       JOIN khuyen_mai km ON spkm.MaKM = km.MaKM
       JOIN ct_khuyen_mai ct ON km.MaKM = ct.MaKM
       JOIN khuyen_mai k ON k.MaKM = km.MaKM
       WHERE k.TrangThai = 1
         AND k.NgayBatDau <= NOW()
         AND k.NgayKetThuc >= NOW()`
    );

    // Nếu không có sản phẩm được liên kết -> empty
    if (rows.length === 0) {
      return res.status(200).json({ data: [] });
    }

    // Gom nhóm theo MaSP, nếu 1 sản phẩm có nhiều khuyến mãi active thì chọn khuyến mãi tốt nhất
    const grouped = {};
    for (const r of rows) {
      const key = r.MaSP;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(r);
    }

    const result = Object.values(grouped).map(list => {
      // Chọn khuyến mãi ưu tiên: nếu có giam_phan_tram -> chọn theo % lớn nhất; nếu giam_tien_mat -> theo giá tiền lớn nhất
      let best = list[0];
      for (const item of list) {
        if (item.LoaiKM === 'giam_phan_tram' && best.LoaiKM === 'giam_phan_tram') {
          if ((item.GiaTriGiam || 0) > (best.GiaTriGiam || 0)) best = item;
        } else if (item.LoaiKM === 'giam_tien_mat' && best.LoaiKM === 'giam_tien_mat') {
          if ((item.GiaTriGiam || 0) > (best.GiaTriGiam || 0)) best = item;
        } else if (item.LoaiKM === 'giam_phan_tram' && best.LoaiKM === 'giam_tien_mat') {
          // ưu tiên phần trăm hơn tiền mặt
          best = item;
        }
      }

      return {
        MaSP: best.MaSP,
        TenSP: best.TenSP,
        HinhAnh: best.HinhAnh || null,
        DonGia: best.DonGia,
        MaKM: best.MaKM,
        TenKM: best.TenKM,
        LoaiKM: best.LoaiKM,
        GiaTriGiam: best.GiaTriGiam,
        GiaTriDonToiThieu: best.GiaTriDonToiThieu,
        GiamToiDa: best.GiamToiDa,
        SoLuongToiThieu: best.SoLuongToiThieu,
        Code: best.Code,
        NgayBatDau: best.NgayBatDau,
        NgayKetThuc: best.NgayKetThuc
      };
    });

    res.status(200).json({ data: result });
  } catch (error) {
    console.error('Error fetching active sale products:', error);
    res.status(500).json({ error: 'Lỗi khi lấy sản phẩm khuyến mãi', details: error.message });
  }
});