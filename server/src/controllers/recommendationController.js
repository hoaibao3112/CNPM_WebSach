import pool from '../config/connectDatabase.js';

/**
 * =====================================================
 * RECOMMENDATION CONTROLLER - Gợi ý sản phẩm theo sở thích
 * =====================================================
 * API thông minh để gợi ý sản phẩm dựa trên:
 * - Câu trả lời form sở thích
 * - Điểm sở thích đã tính
 * - Lịch sử mua hàng
 * - Sản phẩm yêu thích
 */

/**
 * Lấy sản phẩm gợi ý dựa trên sở thích khách hàng
 * GET /api/recommendations/personalized?makh=X&limit=20&offset=0
 */
export const getPersonalizedRecommendations = async (req, res) => {
  try {
    const { makh, limit = 20, offset = 0 } = req.query;

    if (!makh) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu tham số makh'
      });
    }

    // 1. Kiểm tra khách hàng đã có sở thích chưa
    const [preferences] = await pool.query(
      `SELECT * FROM diem_sothich_khachhang WHERE makh = ?`,
      [makh]
    );

    if (!preferences || preferences.length === 0) {
      // Chưa có sở thích - trả về sản phẩm bestseller
      return await getDefaultRecommendations(req, res, parseInt(limit), parseInt(offset));
    }

    // 2. Lấy thông tin chi tiết sở thích
    const preferenceMap = buildPreferenceMap(preferences);

    // 3. Query sản phẩm với scoring thông minh
    // Build params array to match all '?' placeholders in the SQL above
    const makhPlaceholderCount = 15; // number of times we use makh in the scoring SQL
    const paramsForProducts = Array(makhPlaceholderCount).fill(makh).concat([parseInt(limit), parseInt(offset)]);

    const [products] = await pool.query(
      `SELECT 
        sp.MaSP,
        sp.TenSP,
        sp.DonGia,
        sp.HinhAnh,
        sp.SoLuong,
        sp.TinhTrang,
        sp.MoTa,
        sp.HinhThuc,
        sp.NamXB,
        sp.SoTrang,
        sp.MaTL,
        sp.MaTG,
        tl.TenTL,
        tg.TenTG,
        -- Tính điểm recommendation
        (
          -- Điểm thể loại (trọng số 40%)
          COALESCE((
            SELECT DiemSo 
            FROM diem_sothich_khachhang 
            WHERE makh = ? 
              AND LoaiThucThe = 'theloai' 
              AND KhoaThucThe = CAST(sp.MaTL AS CHAR) COLLATE utf8mb4_unicode_ci
          ), 0) * 0.40 +
          
          -- Điểm tác giả (trọng số 30%)
          COALESCE((
            SELECT DiemSo 
            FROM diem_sothich_khachhang 
            WHERE makh = ? 
              AND LoaiThucThe = 'tacgia' 
              AND KhoaThucThe = CAST(sp.MaTG AS CHAR) COLLATE utf8mb4_unicode_ci
          ), 0) * 0.30 +
          
          -- Điểm hình thức (trọng số 15%)
          COALESCE((
            SELECT DiemSo 
            FROM diem_sothich_khachhang 
            WHERE makh = ? 
              AND LoaiThucThe = 'hinhthuc' 
              AND KhoaThucThe = CONVERT(sp.HinhThuc USING utf8mb4) COLLATE utf8mb4_unicode_ci
          ), 0) * 0.15 +
          
          -- Điểm khoảng giá (trọng số 10%)
          CASE 
            WHEN sp.DonGia < 100000 THEN 
              COALESCE((
                SELECT DiemSo 
                FROM diem_sothich_khachhang 
                WHERE makh = ? 
                  AND LoaiThucThe = 'khoanggia' 
                  AND KhoaThucThe = 'LT100'
              ), 0)
            WHEN sp.DonGia BETWEEN 100000 AND 199999 THEN 
              COALESCE((
                SELECT DiemSo 
                FROM diem_sothich_khachhang 
                WHERE makh = ? 
                  AND LoaiThucThe = 'khoanggia' 
                  AND KhoaThucThe = '100-200'
              ), 0)
            WHEN sp.DonGia BETWEEN 200000 AND 299999 THEN 
              COALESCE((
                SELECT DiemSo 
                FROM diem_sothich_khachhang 
                WHERE makh = ? 
                  AND LoaiThucThe = 'khoanggia' 
                  AND KhoaThucThe = '200-300'
              ), 0)
            WHEN sp.DonGia BETWEEN 300000 AND 399999 THEN 
              COALESCE((
                SELECT DiemSo 
                FROM diem_sothich_khachhang 
                WHERE makh = ? 
                  AND LoaiThucThe = 'khoanggia' 
                  AND KhoaThucThe IN ('300-400','300-500')
              ), 0)
            WHEN sp.DonGia BETWEEN 400000 AND 499999 THEN 
              COALESCE((
                SELECT DiemSo 
                FROM diem_sothich_khachhang 
                WHERE makh = ? 
                  AND LoaiThucThe = 'khoanggia' 
                  AND KhoaThucThe IN ('400-500','300-500')
              ), 0)
            WHEN sp.DonGia BETWEEN 500000 AND 699999 THEN 
              COALESCE((
                SELECT DiemSo 
                FROM diem_sothich_khachhang 
                WHERE makh = ? 
                  AND LoaiThucThe = 'khoanggia' 
                  AND KhoaThucThe IN ('500-700','300-500','GT500')
              ), 0)
            WHEN sp.DonGia BETWEEN 700000 AND 999999 THEN 
              COALESCE((
                SELECT DiemSo 
                FROM diem_sothich_khachhang 
                WHERE makh = ? 
                  AND LoaiThucThe = 'khoanggia' 
                  AND KhoaThucThe = '700-1000'
              ), 0)
            WHEN sp.DonGia BETWEEN 1000000 AND 1999999 THEN 
              COALESCE((
                SELECT DiemSo 
                FROM diem_sothich_khachhang 
                WHERE makh = ? 
                  AND LoaiThucThe = 'khoanggia' 
                  AND KhoaThucThe = '1000-2000'
              ), 0)
            WHEN sp.DonGia >= 2000000 THEN 
              COALESCE((
                SELECT DiemSo 
                FROM diem_sothich_khachhang 
                WHERE makh = ? 
                  AND LoaiThucThe = 'khoanggia' 
                  AND KhoaThucThe IN ('GT2000','GT500')
              ), 0)
            ELSE 
              0
          END * 0.10 +
          
          -- Điểm năm xuất bản (trọng số 5%)
          CASE 
            WHEN sp.NamXB >= 2023 THEN 
              COALESCE((
                SELECT DiemSo 
                FROM diem_sothich_khachhang 
                WHERE makh = ? 
                  AND LoaiThucThe = 'namxb'
                  AND (KhoaThucThe LIKE '2023-%' OR KhoaThucThe LIKE '%2023')
              ), 0)
            WHEN sp.NamXB BETWEEN 2020 AND 2022 THEN 
              COALESCE((
                SELECT DiemSo 
                FROM diem_sothich_khachhang 
                WHERE makh = ? 
                  AND LoaiThucThe = 'namxb'
                  AND (KhoaThucThe LIKE '2020-%' OR KhoaThucThe LIKE '%2020%')
              ), 0)
            ELSE 
              COALESCE((
                SELECT DiemSo 
                FROM diem_sothich_khachhang 
                WHERE makh = ? 
                  AND LoaiThucThe = 'namxb'
                  AND KhoaThucThe NOT LIKE '%2023%' 
                  AND KhoaThucThe NOT LIKE '%2020%'
              ), 0)
          END * 0.05
        ) AS RecommendationScore
      FROM sanpham sp
      LEFT JOIN theloai tl ON sp.MaTL = tl.MaTL
      LEFT JOIN tacgia tg ON sp.MaTG = tg.MaTG
      WHERE sp.TinhTrang = b'1' 
        AND sp.SoLuong > 0
      ORDER BY RecommendationScore DESC, sp.NamXB DESC, sp.MaSP DESC
      LIMIT ? OFFSET ?`,
      paramsForProducts
    );

    // Normalize RecommendationScore into a 0-100 percent (user-facing "độ phù hợp")
    try {
      const scores = products.map(p => Number(p.RecommendationScore || 0));
      const max = scores.length ? Math.max(...scores) : 0;
      if (max > 0) {
        products.forEach(p => {
          const s = Number(p.RecommendationScore || 0);
          p.RecommendationPercent = Math.round((s / max) * 100);
        });
      } else {
        products.forEach(p => { p.RecommendationPercent = 0; });
      }
    } catch (err) {
      console.warn('Could not compute RecommendationPercent:', err.message);
      products.forEach(p => { p.RecommendationPercent = 0; });
    }

    // 4. Đếm tổng số sản phẩm phù hợp
    const [[{ total }]] = await pool.query(
      `SELECT COUNT(DISTINCT sp.MaSP) as total
       FROM sanpham sp
       WHERE sp.TinhTrang = b'1' AND sp.SoLuong > 0
         AND (
           sp.MaTL IN (
             SELECT CAST(KhoaThucThe AS UNSIGNED)
             FROM diem_sothich_khachhang
             WHERE makh = ? AND LoaiThucThe = 'theloai'
           )
           OR sp.MaTG IN (
             SELECT CAST(KhoaThucThe AS UNSIGNED)
             FROM diem_sothich_khachhang
             WHERE makh = ? AND LoaiThucThe = 'tacgia'
           )
           OR sp.HinhThuc COLLATE utf8mb4_unicode_ci IN (
             SELECT KhoaThucThe
             FROM diem_sothich_khachhang
             WHERE makh = ? AND LoaiThucThe = 'hinhthuc'
           )
         )`,
      [makh, makh, makh]
    );

    return res.json({
      success: true,
      message: 'Gợi ý sản phẩm dựa trên sở thích của bạn',
      data: products,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: total || products.length
      },
      hasPreferences: true,
      preferenceInfo: {
        totalScores: preferences.length,
        categories: preferenceMap.theloai?.length || 0,
        authors: preferenceMap.tacgia?.length || 0,
        formats: preferenceMap.hinhthuc?.length || 0
      }
    });

  } catch (error) {
    console.error('Error getPersonalizedRecommendations:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy gợi ý sản phẩm',
      error: error.message
    });
  }
};

/**
 * Lấy sản phẩm mặc định (khi chưa có sở thích)
 */
async function getDefaultRecommendations(req, res, limit, offset) {
  try {
    const [products] = await pool.query(
      `SELECT 
        sp.MaSP,
        sp.TenSP,
        sp.DonGia,
        sp.HinhAnh,
        sp.SoLuong,
        sp.TinhTrang,
        sp.MoTa,
        sp.HinhThuc,
        sp.NamXB,
        tl.TenTL,
        tg.TenTG,
        0 as RecommendationScore
      FROM sanpham sp
      LEFT JOIN theloai tl ON sp.MaTL = tl.MaTL
      LEFT JOIN tacgia tg ON sp.MaTG = tg.MaTG
      WHERE sp.TinhTrang = b'1' AND sp.SoLuong > 0
      ORDER BY sp.NamXB DESC, sp.MaSP DESC
      LIMIT ? OFFSET ?`,
      [limit, offset]
    );

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) as total 
       FROM sanpham 
       WHERE TinhTrang = b'1' AND SoLuong > 0`
    );

    return res.json({
      success: true,
      message: 'Sản phẩm mới nhất (chưa có sở thích)',
      data: products,
      pagination: {
        limit,
        offset,
        total: total || 0
      },
      hasPreferences: false,
      suggestion: 'Hãy điền form sở thích để nhận gợi ý phù hợp hơn!'
    });
  } catch (error) {
    throw error;
  }
}

/**
 * Build map sở thích để phân tích
 */
function buildPreferenceMap(preferences) {
  const map = {
    theloai: [],
    tacgia: [],
    hinhthuc: [],
    khoanggia: [],
    namxb: [],
    sotrang: []
  };

  preferences.forEach(pref => {
    const type = pref.LoaiThucThe;
    if (map[type]) {
      map[type].push({
        key: pref.KhoaThucThe,
        score: pref.DiemSo
      });
    }
  });

  // Sort by score descending
  Object.keys(map).forEach(key => {
    map[key].sort((a, b) => b.score - a.score);
  });

  return map;
}

/**
 * Lấy top sản phẩm theo thể loại yêu thích
 * GET /api/recommendations/by-category?makh=X&limit=10
 */
export const getRecommendationsByCategory = async (req, res) => {
  try {
    const { makh, limit = 10 } = req.query;

    if (!makh) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu tham số makh'
      });
    }

    // Lấy thể loại có điểm cao nhất
    const [topCategories] = await pool.query(
      `SELECT KhoaThucThe, DiemSo 
       FROM diem_sothich_khachhang 
       WHERE makh = ? AND LoaiThucThe = 'theloai'
       ORDER BY DiemSo DESC
       LIMIT 3`,
      [makh]
    );

    if (!topCategories || topCategories.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Chưa có thông tin sở thích thể loại'
      });
    }

    const categoryIds = topCategories.map(c => c.KhoaThucThe);
    const placeholders = categoryIds.map(() => '?').join(',');

    // Lấy sản phẩm theo các thể loại yêu thích
    const [products] = await pool.query(
      `SELECT 
        sp.MaSP,
        sp.TenSP,
        sp.DonGia,
        sp.HinhAnh,
        sp.SoLuong,
        sp.MoTa,
        tl.TenTL,
        tg.TenTG
      FROM sanpham sp
      LEFT JOIN theloai tl ON sp.MaTL = tl.MaTL
      LEFT JOIN tacgia tg ON sp.MaTG = tg.MaTG
      WHERE sp.MaTL IN (${placeholders})
        AND sp.TinhTrang = b'1' 
        AND sp.SoLuong > 0
      ORDER BY sp.NamXB DESC
      LIMIT ?`,
      [...categoryIds, parseInt(limit)]
    );

    return res.json({
      success: true,
      message: 'Sản phẩm theo thể loại yêu thích',
      data: products,
      categories: topCategories.map(c => ({
        id: c.KhoaThucThe,
        score: c.DiemSo
      }))
    });

  } catch (error) {
    console.error('Error getRecommendationsByCategory:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy sản phẩm theo thể loại',
      error: error.message
    });
  }
};

/**
 * Lấy sản phẩm theo tác giả yêu thích
 * GET /api/recommendations/by-author?makh=X&limit=10
 */
export const getRecommendationsByAuthor = async (req, res) => {
  try {
    const { makh, limit = 10 } = req.query;

    if (!makh) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu tham số makh'
      });
    }

    // Lấy tác giả có điểm cao nhất
    const [topAuthors] = await pool.query(
      `SELECT KhoaThucThe, DiemSo 
       FROM diem_sothich_khachhang 
       WHERE makh = ? AND LoaiThucThe = 'tacgia'
       ORDER BY DiemSo DESC
       LIMIT 3`,
      [makh]
    );

    if (!topAuthors || topAuthors.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Chưa có thông tin sở thích tác giả'
      });
    }

    const authorIds = topAuthors.map(a => a.KhoaThucThe);
    const placeholders = authorIds.map(() => '?').join(',');

    // Lấy sản phẩm theo tác giả yêu thích
    const [products] = await pool.query(
      `SELECT 
        sp.MaSP,
        sp.TenSP,
        sp.DonGia,
        sp.HinhAnh,
        sp.SoLuong,
        sp.MoTa,
        tl.TenTL,
        tg.TenTG
      FROM sanpham sp
      LEFT JOIN theloai tl ON sp.MaTL = tl.MaTL
      LEFT JOIN tacgia tg ON sp.MaTG = tg.MaTG
      WHERE sp.MaTG IN (${placeholders})
        AND sp.TinhTrang = b'1' 
        AND sp.SoLuong > 0
      ORDER BY sp.NamXB DESC
      LIMIT ?`,
      [...authorIds, parseInt(limit)]
    );

    return res.json({
      success: true,
      message: 'Sản phẩm theo tác giả yêu thích',
      data: products,
      authors: topAuthors.map(a => ({
        id: a.KhoaThucThe,
        score: a.DiemSo
      }))
    });

  } catch (error) {
    console.error('Error getRecommendationsByAuthor:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy sản phẩm theo tác giả',
      error: error.message
    });
  }
};

/**
 * Lấy sản phẩm similar với sản phẩm đang xem
 * GET /api/recommendations/similar?makh=X&productId=Y&limit=10
 */
export const getSimilarProducts = async (req, res) => {
  try {
    const { makh, productId, limit = 10 } = req.query;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu tham số productId'
      });
    }

    // Lấy thông tin sản phẩm gốc
    const [baseProduct] = await pool.query(
      `SELECT MaTL, MaTG, HinhThuc, DonGia 
       FROM sanpham 
       WHERE MaSP = ?`,
      [productId]
    );

    if (!baseProduct || baseProduct.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sản phẩm'
      });
    }

    const base = baseProduct[0];

    // Nếu có makh, tính điểm theo sở thích
    let scoreClause = '0';
    let params = [base.MaTL, base.MaTG, base.HinhThuc];

    if (makh) {
      scoreClause = `
        (
          COALESCE((
            SELECT DiemSo 
            FROM diem_sothich_khachhang 
            WHERE makh = ? 
              AND LoaiThucThe = 'theloai' 
              AND KhoaThucThe = CAST(sp.MaTL AS CHAR)
          ), 0) * 0.5 +
          COALESCE((
            SELECT DiemSo 
            FROM diem_sothich_khachhang 
            WHERE makh = ? 
              AND LoaiThucThe = 'tacgia' 
              AND KhoaThucThe = CAST(sp.MaTG AS CHAR)
          ), 0) * 0.3 +
          COALESCE((
            SELECT DiemSo 
            FROM diem_sothich_khachhang 
            WHERE makh = ? 
              AND LoaiThucThe = 'hinhthuc' 
              AND KhoaThucThe = sp.HinhThuc
          ), 0) * 0.2
        )
      `;
      params = [base.MaTL, base.MaTG, base.HinhThuc, makh, makh, makh];
    }

    // Query sản phẩm tương tự
    const [products] = await pool.query(
      `SELECT 
        sp.MaSP,
        sp.TenSP,
        sp.DonGia,
        sp.HinhAnh,
        sp.SoLuong,
        sp.MoTa,
        tl.TenTL,
        tg.TenTG,
        (
          -- Điểm tương đồng
          (CASE WHEN sp.MaTL = ? THEN 3 ELSE 0 END) +
          (CASE WHEN sp.MaTG = ? THEN 2 ELSE 0 END) +
          (CASE WHEN sp.HinhThuc = ? THEN 1 ELSE 0 END) +
          ${scoreClause}
        ) AS SimilarityScore
      FROM sanpham sp
      LEFT JOIN theloai tl ON sp.MaTL = tl.MaTL
      LEFT JOIN tacgia tg ON sp.MaTG = tg.MaTG
      WHERE sp.MaSP != ?
        AND sp.TinhTrang = b'1' 
        AND sp.SoLuong > 0
        AND (sp.MaTL = ? OR sp.MaTG = ? OR sp.HinhThuc = ?)
      ORDER BY SimilarityScore DESC, sp.NamXB DESC
      LIMIT ?`,
      [...params, productId, base.MaTL, base.MaTG, base.HinhThuc, parseInt(limit)]
    );

    return res.json({
      success: true,
      message: 'Sản phẩm tương tự',
      data: products,
      baseProduct: {
        id: productId,
        category: base.MaTL,
        author: base.MaTG,
        format: base.HinhThuc
      }
    });

  } catch (error) {
    console.error('Error getSimilarProducts:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy sản phẩm tương tự',
      error: error.message
    });
  }
};

/**
 * Lấy insight về sở thích khách hàng
 * GET /api/recommendations/insights?makh=X
 */
export const getPreferenceInsights = async (req, res) => {
  try {
    const { makh } = req.query;

    if (!makh) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu tham số makh'
      });
    }

    // Lấy tất cả sở thích
    const [preferences] = await pool.query(
      `SELECT * FROM diem_sothich_khachhang 
       WHERE makh = ? 
       ORDER BY DiemSo DESC`,
      [makh]
    );

    if (!preferences || preferences.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Chưa có thông tin sở thích'
      });
    }

    // Group by type
    const insights = {
      topCategories: [],
      topAuthors: [],
      preferredFormat: null,
      priceRange: null,
      yearRange: null,
      pageRange: null
    };

    // Lấy tên thể loại
    const categoryIds = preferences
      .filter(p => p.LoaiThucThe === 'theloai')
      .map(p => p.KhoaThucThe);

    if (categoryIds.length > 0) {
      const placeholders = categoryIds.map(() => '?').join(',');
      const [categories] = await pool.query(
        `SELECT MaTL, TenTL FROM theloai WHERE MaTL IN (${placeholders})`,
        categoryIds
      );
      
      insights.topCategories = preferences
        .filter(p => p.LoaiThucThe === 'theloai')
        .slice(0, 5)
        .map(p => {
          const cat = categories.find(c => c.MaTL == p.KhoaThucThe);
          return {
            id: p.KhoaThucThe,
            name: cat?.TenTL || 'Unknown',
            score: p.DiemSo
          };
        });
    }

    // Lấy tên tác giả
    const authorIds = preferences
      .filter(p => p.LoaiThucThe === 'tacgia')
      .map(p => p.KhoaThucThe);

    if (authorIds.length > 0) {
      const placeholders = authorIds.map(() => '?').join(',');
      const [authors] = await pool.query(
        `SELECT MaTG, TenTG FROM tacgia WHERE MaTG IN (${placeholders})`,
        authorIds
      );
      
      insights.topAuthors = preferences
        .filter(p => p.LoaiThucThe === 'tacgia')
        .slice(0, 5)
        .map(p => {
          const auth = authors.find(a => a.MaTG == p.KhoaThucThe);
          return {
            id: p.KhoaThucThe,
            name: auth?.TenTG || 'Unknown',
            score: p.DiemSo
          };
        });
    }

    // Hình thức ưa thích
    const formats = preferences.filter(p => p.LoaiThucThe === 'hinhthuc');
    if (formats.length > 0) {
      insights.preferredFormat = {
        format: formats[0].KhoaThucThe,
        score: formats[0].DiemSo
      };
    }

    // Khoảng giá ưa thích
    const prices = preferences.filter(p => p.LoaiThucThe === 'khoanggia');
    if (prices.length > 0) {
      insights.priceRange = {
        range: prices[0].KhoaThucThe,
        score: prices[0].DiemSo
      };
    }

    // Năm XB ưa thích
    const years = preferences.filter(p => p.LoaiThucThe === 'namxb');
    if (years.length > 0) {
      insights.yearRange = {
        range: years[0].KhoaThucThe,
        score: years[0].DiemSo
      };
    }

    return res.json({
      success: true,
      message: 'Phân tích sở thích khách hàng',
      data: insights,
      totalScores: preferences.length
    });

  } catch (error) {
    console.error('Error getPreferenceInsights:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi phân tích sở thích',
      error: error.message
    });
  }
};
