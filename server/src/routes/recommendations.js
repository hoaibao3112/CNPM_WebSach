// recommendations.js - Smart Product Recommendations (FIXED TABLE NAMES)
import express from 'express';
import pool from '../config/connectDatabase.js';

const router = express.Router();

// 1. Gợi ý dựa trên lịch sử xem sản phẩm (Content-Based Filtering)
router.get('/based-on-views/:customerId', async (req, res) => {
  const { customerId } = req.params;
  
  try {
    // Lấy thể loại sách mà khách hàng đã xem nhiều nhất
    const [recommendations] = await pool.execute(`
      SELECT DISTINCT sp.MaSP, sp.TenSP, sp.DonGia, sp.HinhAnh, sp.MoTa,
             tg.TenTG, tl.TenTL as TenTheLoai,
             COUNT(*) as relevance_score
      FROM sanpham sp
      JOIN tacgia tg ON sp.MaTG = tg.MaTG
      JOIN theloai tl ON sp.MaTL = tl.MaTL
      WHERE sp.MaTL IN (
        SELECT sp2.MaTL 
        FROM lich_su_xem lsx
        JOIN sanpham sp2 ON lsx.MaSP = sp2.MaSP
        WHERE lsx.MaKH = ?
        GROUP BY sp2.MaTL
        ORDER BY COUNT(*) DESC
        LIMIT 3
      )
      AND sp.TinhTrang = 1
      AND sp.SoLuong > 0
      AND sp.MaSP NOT IN (
        SELECT MaSP FROM lich_su_xem WHERE MaKH = ?
      )
      GROUP BY sp.MaSP
      ORDER BY relevance_score DESC
      LIMIT 10
    `, [customerId, customerId]);

    res.json({
      success: true,
      type: 'based-on-views',
      message: 'Dựa trên sở thích của bạn',
      data: recommendations
    });
  } catch (err) {
    console.error('Error in based-on-views:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// 2. Frequently Bought Together (Association Rules) - FIXED TABLE NAMES
router.get('/bought-together/:productId', async (req, res) => {
  const { productId } = req.params;
  
  try {
    const [recommendations] = await pool.execute(`
      SELECT sp.MaSP, sp.TenSP, sp.DonGia, sp.HinhAnh,
             tg.TenTG,
             COUNT(DISTINCT ct2.MaHD) as frequency,
             (COUNT(DISTINCT ct2.MaHD) * 100.0 / 
              (SELECT COUNT(DISTINCT MaHD) FROM chitiethoadon WHERE MaSP = ?)) as confidence
      FROM chitiethoadon ct1
      JOIN chitiethoadon ct2 ON ct1.MaHD = ct2.MaHD
      JOIN sanpham sp ON ct2.MaSP = sp.MaSP
      JOIN tacgia tg ON sp.MaTG = tg.MaTG
      WHERE ct1.MaSP = ?
        AND ct2.MaSP != ?
        AND sp.TinhTrang = 1
        AND sp.SoLuong > 0
      GROUP BY sp.MaSP
      HAVING frequency >= 3
      ORDER BY frequency DESC, confidence DESC
      LIMIT 6
    `, [productId, productId, productId]);

    res.json({
      success: true,
      type: 'bought-together',
      message: 'Khách hàng cũng mua',
      data: recommendations
    });
  } catch (err) {
    console.error('Error in bought-together:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// 3. Sách cùng tác giả
router.get('/same-author/:productId', async (req, res) => {
  const { productId } = req.params;
  
  try {
    const [recommendations] = await pool.execute(`
      SELECT sp2.MaSP, sp2.TenSP, sp2.DonGia, sp2.HinhAnh, sp2.MoTa,
             tg.TenTG, tl.TenTL as TenTheLoai
      FROM sanpham sp1
      JOIN sanpham sp2 ON sp1.MaTG = sp2.MaTG
      JOIN tacgia tg ON sp2.MaTG = tg.MaTG
      JOIN theloai tl ON sp2.MaTL = tl.MaTL
      WHERE sp1.MaSP = ?
        AND sp2.MaSP != ?
        AND sp2.TinhTrang = 1
        AND sp2.SoLuong > 0
      ORDER BY sp2.MaSP DESC
      LIMIT 6
    `, [productId, productId]);

    res.json({
      success: true,
      type: 'same-author',
      message: 'Cùng tác giả',
      data: recommendations
    });
  } catch (err) {
    console.error('Error in same-author:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// 4. Trending Books (Popular in last 30 days) - FIXED TABLE NAMES
router.get('/trending', async (req, res) => {
  try {
    const [recommendations] = await pool.execute(`
      SELECT sp.MaSP, sp.TenSP, sp.DonGia, sp.HinhAnh,
             tg.TenTG, tl.TenTL as TenTheLoai,
             COUNT(DISTINCT hd.MaHD) as order_count,
             SUM(ct.Soluong) as total_sold
      FROM sanpham sp
      JOIN tacgia tg ON sp.MaTG = tg.MaTG
      JOIN theloai tl ON sp.MaTL = tl.MaTL
      LEFT JOIN chitiethoadon ct ON sp.MaSP = ct.MaSP
      LEFT JOIN hoadon hd ON ct.MaHD = hd.MaHD 
                           AND hd.NgayTao >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      WHERE sp.TinhTrang = 1
        AND sp.SoLuong > 0
      GROUP BY sp.MaSP
      ORDER BY order_count DESC, total_sold DESC
      LIMIT 12
    `);

    res.json({
      success: true,
      type: 'trending',
      message: 'Sách đang hot',
      data: recommendations
    });
  } catch (err) {
    console.error('Error in trending:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// 5. Collaborative Filtering - Users who bought this also bought - FIXED TABLE NAMES
router.get('/collaborative/:customerId', async (req, res) => {
  const { customerId } = req.params;
  
  try {
    const [recommendations] = await pool.execute(`
      SELECT sp.MaSP, sp.TenSP, sp.DonGia, sp.HinhAnh,
             tg.TenTG, tl.TenTL as TenTheLoai,
             COUNT(DISTINCT hd2.makh) as similar_users,
             SUM(ct2.Soluong) as popularity
      FROM hoadon hd1
      JOIN chitiethoadon ct1 ON hd1.MaHD = ct1.MaHD
      JOIN chitiethoadon ct2 ON ct1.MaSP = ct2.MaSP
      JOIN hoadon hd2 ON ct2.MaHD = hd2.MaHD
      JOIN chitiethoadon ct3 ON hd2.MaHD = ct3.MaHD
      JOIN sanpham sp ON ct3.MaSP = sp.MaSP
      JOIN tacgia tg ON sp.MaTG = tg.MaTG
      JOIN theloai tl ON sp.MaTL = tl.MaTL
      WHERE hd1.makh = ?
        AND hd2.makh != ?
        AND sp.MaSP NOT IN (
          SELECT ct.MaSP FROM chitiethoadon ct
          JOIN hoadon hd ON ct.MaHD = hd.MaHD
          WHERE hd.makh = ?
        )
        AND sp.TinhTrang = 1
        AND sp.SoLuong > 0
      GROUP BY sp.MaSP
      HAVING similar_users >= 2
      ORDER BY similar_users DESC, popularity DESC
      LIMIT 10
    `, [customerId, customerId, customerId]);

    res.json({
      success: true,
      type: 'collaborative',
      message: 'Người dùng giống bạn cũng mua',
      data: recommendations
    });
  } catch (err) {
    console.error('Error in collaborative:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// 6. Smart Recommendations - Kết hợp nhiều thuật toán - FIXED TABLE NAMES
router.get('/smart/:customerId', async (req, res) => {
  const { customerId } = req.params;
  
  try {
    // Gọi song song nhiều API
    const [viewBased, collaborative, trending] = await Promise.all([
      pool.execute(`
        SELECT DISTINCT sp.MaSP, sp.TenSP, sp.DonGia, sp.HinhAnh,
               tg.TenTG, 'view-based' as source, 0.4 as weight
        FROM sanpham sp
        JOIN tacgia tg ON sp.MaTG = tg.MaTG
        WHERE sp.MaTL IN (
          SELECT sp2.MaTL FROM lich_su_xem lsx
          JOIN sanpham sp2 ON lsx.MaSP = sp2.MaSP
          WHERE lsx.MaKH = ?
          GROUP BY sp2.MaTL ORDER BY COUNT(*) DESC LIMIT 2
        )
        AND sp.TinhTrang = 1 AND sp.SoLuong > 0
        AND sp.MaSP NOT IN (SELECT MaSP FROM lich_su_xem WHERE MaKH = ?)
        ORDER BY sp.MaSP DESC LIMIT 5
      `, [customerId, customerId]),
      
      pool.execute(`
        SELECT sp.MaSP, sp.TenSP, sp.DonGia, sp.HinhAnh,
               tg.TenTG, 'collaborative' as source, 0.4 as weight
        FROM hoadon hd1
        JOIN chitiethoadon ct1 ON hd1.MaHD = ct1.MaHD
        JOIN chitiethoadon ct2 ON ct1.MaSP = ct2.MaSP
        JOIN hoadon hd2 ON ct2.MaHD = hd2.MaHD
        JOIN chitiethoadon ct3 ON hd2.MaHD = ct3.MaHD
        JOIN sanpham sp ON ct3.MaSP = sp.MaSP
        JOIN tacgia tg ON sp.MaTG = tg.MaTG
        WHERE hd1.makh = ? AND hd2.makh != ?
        AND sp.TinhTrang = 1 AND sp.SoLuong > 0
        GROUP BY sp.MaSP ORDER BY COUNT(*) DESC LIMIT 5
      `, [customerId, customerId]),
      
      pool.execute(`
        SELECT sp.MaSP, sp.TenSP, sp.DonGia, sp.HinhAnh,
               tg.TenTG, 'trending' as source, 0.2 as weight
        FROM sanpham sp
        JOIN tacgia tg ON sp.MaTG = tg.MaTG
        WHERE sp.TinhTrang = 1 AND sp.SoLuong > 0
        ORDER BY sp.MaSP DESC
        LIMIT 5
      `)
    ]);

    // Merge và tính điểm
    const allRecommendations = [
      ...viewBased[0].map(r => ({ ...r, score: r.weight })),
      ...collaborative[0].map(r => ({ ...r, score: r.weight })),
      ...trending[0].map(r => ({ ...r, score: r.weight }))
    ];

    // Loại bỏ trùng lặp và sort theo điểm
    const uniqueMap = new Map();
    allRecommendations.forEach(item => {
      if (uniqueMap.has(item.MaSP)) {
        uniqueMap.get(item.MaSP).score += item.score;
      } else {
        uniqueMap.set(item.MaSP, item);
      }
    });

    const finalRecommendations = Array.from(uniqueMap.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    res.json({
      success: true,
      type: 'smart',
      message: 'Gợi ý dành riêng cho bạn',
      data: finalRecommendations
    });
  } catch (err) {
    console.error('Error in smart recommendations:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// 7. New Releases
router.get('/new-releases', async (req, res) => {
  try {
    const [recommendations] = await pool.execute(`
      SELECT sp.MaSP, sp.TenSP, sp.DonGia, sp.HinhAnh, sp.MoTa,
             tg.TenTG, tl.TenTL as TenTheLoai
      FROM sanpham sp
      JOIN tacgia tg ON sp.MaTG = tg.MaTG
      JOIN theloai tl ON sp.MaTL = tl.MaTL
      WHERE sp.TinhTrang = 1
        AND sp.SoLuong > 0
      ORDER BY sp.MaSP DESC
      LIMIT 12
    `);

    res.json({
      success: true,
      type: 'new-releases',
      message: 'Sách mới phát hành',
      data: recommendations
    });
  } catch (err) {
    console.error('Error in new-releases:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

export default router;
