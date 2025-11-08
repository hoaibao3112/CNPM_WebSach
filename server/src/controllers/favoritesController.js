import pool from '../config/connectDatabase.js';

/**
 * =====================================================
 * FAVORITES CONTROLLER - Sản phẩm Yêu thích
 * =====================================================
 */

/**
 * Thêm sản phẩm vào danh sách yêu thích
 * POST /api/favorites
 * Body: { makh, MaSP }
 */
export const addFavorite = async (req, res) => {
  try {
    const { makh, MaSP } = req.body;

    if (!makh || !MaSP) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu makh hoặc MaSP'
      });
    }

    // Kiểm tra sản phẩm tồn tại
    const [product] = await pool.query(
      `SELECT MaSP FROM sanpham WHERE MaSP = ?`,
      [MaSP]
    );

    if (!product || product.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sản phẩm'
      });
    }

    // Thêm vào favorites (ignore nếu đã tồn tại)
    await pool.query(
      `INSERT IGNORE INTO sanpham_yeuthich (makh, MaSP) VALUES (?, ?)`,
      [makh, MaSP]
    );

    return res.json({
      success: true,
      message: 'Đã thêm vào danh sách yêu thích'
    });
  } catch (error) {
    console.error('Error addFavorite:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi thêm sản phẩm yêu thích',
      error: error.message
    });
  }
};

/**
 * Xóa sản phẩm khỏi danh sách yêu thích
 * DELETE /api/favorites/:MaSP
 * Query: makh
 */
export const removeFavorite = async (req, res) => {
  try {
    const { MaSP } = req.params;
    const { makh } = req.query;

    if (!makh || !MaSP) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu makh hoặc MaSP'
      });
    }

    await pool.query(
      `DELETE FROM sanpham_yeuthich WHERE makh = ? AND MaSP = ?`,
      [makh, MaSP]
    );

    return res.json({
      success: true,
      message: 'Đã xóa khỏi danh sách yêu thích'
    });
  } catch (error) {
    console.error('Error removeFavorite:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa sản phẩm yêu thích',
      error: error.message
    });
  }
};

/**
 * Lấy danh sách sản phẩm yêu thích
 * GET /api/favorites?makh=X&page=1&limit=20
 */
export const getFavorites = async (req, res) => {
  try {
    const { makh, page = 1, limit = 20 } = req.query;

    if (!makh) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu tham số makh'
      });
    }

    const offset = (page - 1) * limit;

    const [favorites] = await pool.query(
      `SELECT 
        sp.MaSP,
        sp.TenSP,
        sp.DonGia,
        sp.HinhAnh,
        sp.SoLuong,
        sp.TinhTrang,
        sp.NamXB,
        sp.HinhThuc,
        tl.TenTL,
        tg.TenTG,
        f.NgayThem
       FROM sanpham_yeuthich f
       JOIN sanpham sp ON f.MaSP = sp.MaSP
       LEFT JOIN theloai tl ON sp.MaTL = tl.MaTL
       LEFT JOIN tacgia tg ON sp.MaTG = tg.MaTG
       WHERE f.makh = ?
       ORDER BY f.NgayThem DESC
       LIMIT ? OFFSET ?`,
      [makh, parseInt(limit), offset]
    );

    // Đếm tổng số
    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) as total FROM sanpham_yeuthich WHERE makh = ?`,
      [makh]
    );

    return res.json({
      success: true,
      data: favorites,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total
      }
    });
  } catch (error) {
    console.error('Error getFavorites:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách yêu thích',
      error: error.message
    });
  }
};

/**
 * Kiểm tra sản phẩm có trong danh sách yêu thích không
 * GET /api/favorites/check?makh=X&MaSP=Y
 */
export const checkFavorite = async (req, res) => {
  try {
    const { makh, MaSP } = req.query;

    if (!makh || !MaSP) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu makh hoặc MaSP'
      });
    }

    const [result] = await pool.query(
      `SELECT 1 FROM sanpham_yeuthich WHERE makh = ? AND MaSP = ? LIMIT 1`,
      [makh, MaSP]
    );

    const isFavorite = result && result.length > 0;

    return res.json({
      success: true,
      data: { isFavorite }
    });
  } catch (error) {
    console.error('Error checkFavorite:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi kiểm tra yêu thích',
      error: error.message
    });
  }
};

/**
 * Lấy số lượng sản phẩm yêu thích
 * GET /api/favorites/count?makh=X
 */
export const getFavoritesCount = async (req, res) => {
  try {
    const { makh } = req.query;

    if (!makh) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu tham số makh'
      });
    }

    const [[{ count }]] = await pool.query(
      `SELECT COUNT(*) as count FROM sanpham_yeuthich WHERE makh = ?`,
      [makh]
    );

    return res.json({
      success: true,
      data: { count }
    });
  } catch (error) {
    console.error('Error getFavoritesCount:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi đếm yêu thích',
      error: error.message
    });
  }
};

/**
 * Lấy gợi ý sản phẩm tương tự dựa trên favorites
 * GET /api/favorites/similar?makh=X&limit=10
 */
export const getSimilarToFavorites = async (req, res) => {
  try {
    const { makh, limit = 10 } = req.query;

    if (!makh) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu tham số makh'
      });
    }

    // Lấy thể loại và tác giả từ favorites
    const [favData] = await pool.query(
      `SELECT sp.MaTL, sp.MaTG, sp.HinhThuc, sp.MaSP
       FROM sanpham_yeuthich f
       JOIN sanpham sp ON f.MaSP = sp.MaSP
       WHERE f.makh = ?`,
      [makh]
    );

    if (!favData || favData.length === 0) {
      return res.json({
        success: true,
        data: [],
        message: 'Chưa có sản phẩm yêu thích để gợi ý'
      });
    }

    // Tính toán điểm dựa trên overlap
    const favoriteIds = favData.map(f => f.MaSP);
    const theloaiIds = [...new Set(favData.map(f => f.MaTL).filter(Boolean))];
    const tacgiaIds = [...new Set(favData.map(f => f.MaTG).filter(Boolean))];
    const hinhthucList = [...new Set(favData.map(f => f.HinhThuc).filter(Boolean))];

    const excludeClause = favoriteIds.length > 0 
      ? `AND sp.MaSP NOT IN (${favoriteIds.join(',')})` 
      : '';

    const theloaiClause = theloaiIds.length > 0 
      ? `sp.MaTL IN (${theloaiIds.join(',')})` 
      : '0';
    
    const tacgiaClause = tacgiaIds.length > 0 
      ? `sp.MaTG IN (${tacgiaIds.join(',')})` 
      : '0';

    const hinhthucClause = hinhthucList.length > 0
      ? `sp.HinhThuc IN (${hinhthucList.map(h => `'${h}'`).join(',')})`
      : '0';

    const sql = `
      SELECT 
        sp.*,
        tl.TenTL,
        tg.TenTG,
        (
          (CASE WHEN ${theloaiClause} THEN 3 ELSE 0 END) +
          (CASE WHEN ${tacgiaClause} THEN 2 ELSE 0 END) +
          (CASE WHEN ${hinhthucClause} THEN 1 ELSE 0 END)
        ) AS SimilarityScore
      FROM sanpham sp
      LEFT JOIN theloai tl ON sp.MaTL = tl.MaTL
      LEFT JOIN tacgia tg ON sp.MaTG = tg.MaTG
      WHERE sp.TinhTrang = b'1' AND sp.SoLuong > 0
        ${excludeClause}
      HAVING SimilarityScore > 0
      ORDER BY SimilarityScore DESC, sp.NamXB DESC
      LIMIT ?
    `;

    const [similar] = await pool.query(sql, [parseInt(limit)]);

    return res.json({
      success: true,
      data: similar
    });
  } catch (error) {
    console.error('Error getSimilarToFavorites:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy sản phẩm tương tự',
      error: error.message
    });
  }
};
