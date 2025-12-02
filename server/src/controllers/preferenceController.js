import pool from '../config/connectDatabase.js';

/**
 * =====================================================
 * PREFERENCE CONTROLLER - Xử lý Sở thích Khách hàng
 * =====================================================
 */

// ============== CLIENT APIs ==============

/**
 * Lấy form sở thích đang hoạt động
 * GET /api/preferences/form
 */
export const getActiveForm = async (req, res) => {
  try {
    // Lấy form active
    const [forms] = await pool.query(
      `SELECT * FROM form_sothich WHERE TrangThai = 1 ORDER BY NgayTao DESC LIMIT 1`
    );

    if (!forms || forms.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Chưa có form khảo sát nào đang hoạt động'
      });
    }

    const form = forms[0];

    // Lấy các câu hỏi của form
    const [questions] = await pool.query(
      `SELECT * FROM cauhoi_sothich WHERE MaForm = ? ORDER BY ThuTu`,
      [form.MaForm]
    );

    // Lấy các lựa chọn cho mỗi câu hỏi
    for (let question of questions) {
      const [options] = await pool.query(
        `SELECT * FROM luachon_cauhoi WHERE MaCauHoi = ? ORDER BY ThuTu`,
        [question.MaCauHoi]
      );
      question.options = options;
    }

    form.questions = questions;

    return res.json({
      success: true,
      data: form
    });
  } catch (error) {
    console.error('Error getActiveForm:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy form sở thích',
      error: error.message
    });
  }
};

/**
 * Submit form sở thích + phát coupon freeship
 * POST /api/preferences/submit
 * Body: { makh, formId, answers: [{questionId, optionId?, freeText?, rating?}], consent }
 */
export const submitPreferences = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { makh, formId, answers, consent = 1 } = req.body;

    // Validate
    if (!makh || !formId || !answers || !Array.isArray(answers)) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin bắt buộc: makh, formId, answers'
      });
    }

    // Kiểm tra khách hàng đã submit form này chưa
    const [existing] = await connection.query(
      `SELECT MaPhanHoi FROM phanhoi_sothich WHERE makh = ? AND MaForm = ?`,
      [makh, formId]
    );

    let responseId;

    if (existing && existing.length > 0) {
      // Đã submit rồi - cho phép update
      responseId = existing[0].MaPhanHoi;
      // Trừ đi đóng góp điểm từ phản hồi cũ (giữ aggregation nhiều form)
      try {
        await applyResponseScores(connection, makh, responseId, -1, formId);
      } catch (e) {
        console.warn('Could not subtract old response scores:', e.message);
      }

      // Xóa câu trả lời cũ (chúng ta đã trừ điểm bên trên)
      await connection.query(
        `DELETE FROM traloi_sothich WHERE MaPhanHoi = ?`,
        [responseId]
      );

      // Update consent and timestamp
      await connection.query(
        `UPDATE phanhoi_sothich SET DongYSuDung = ?, NgayPhanHoi = NOW() WHERE MaPhanHoi = ?`,
        [consent, responseId]
      );
    } else {
      // Insert phản hồi mới
      const [result] = await connection.query(
        `INSERT INTO phanhoi_sothich (MaForm, makh, DongYSuDung) VALUES (?, ?, ?)`,
        [formId, makh, consent]
      );
      responseId = result.insertId;
    }

    // Insert câu trả lời
    for (let answer of answers) {
      const { questionId, optionId, freeText, rating } = answer;

      // Nếu là multi-select, optionId có thể là array
      if (Array.isArray(optionId)) {
        for (let optId of optionId) {
          await connection.query(
            `INSERT INTO traloi_sothich (MaPhanHoi, MaCauHoi, MaLuaChon) VALUES (?, ?, ?)`,
            [responseId, questionId, optId]
          );
        }
      } else {
        await connection.query(
          `INSERT INTO traloi_sothich (MaPhanHoi, MaCauHoi, MaLuaChon, VanBan, DiemDanhGia) 
           VALUES (?, ?, ?, ?, ?)`,
          [responseId, questionId, optionId || null, freeText || null, rating || null]
        );
      }
    }

    // Chấm điểm sở thích (chỉ khi khách đồng ý sử dụng dữ liệu)
    if (consent) {
      // Add contribution from this (new) response
      try {
        await applyResponseScores(connection, makh, responseId, +1, formId);
      } catch (e) {
        console.warn('Could not apply response scores:', e.message);
        // fallback to previous function
        await calculatePreferenceScores(connection, makh, responseId);
      }
    }
    
    // Phát coupon liên kết với form (nếu form có MaKM) - chỉ phát khi consent = true
    let couponCode = null;
    // Lấy MaKM được liên kết trong form (nếu admin đã gắn coupon vào form)
    const [[formRow]] = await connection.query(
      `SELECT MaKM FROM form_sothich WHERE MaForm = ? LIMIT 1`,
      [formId]
    );

    const formMaKM = formRow ? formRow.MaKM : null;

    if (formMaKM && consent) {
      // Try to use promotion's configured public Code (if available) so coupon code matches promotion
      const [[promoRow]] = await connection.query(
        `SELECT * FROM khuyen_mai WHERE MaKM = ? LIMIT 1`,
        [formMaKM]
      );

      const promo = promoRow || null;

      // If promotion has a Code (public code), prefer to use it as MaPhieu
      let preferredCode = promo && promo.Code ? promo.Code : null;

      // If preferredCode exists, see if a phieugiamgia template already uses it
      if (preferredCode) {
        const [tplByCode] = await connection.query(
          `SELECT * FROM phieugiamgia WHERE MaPhieu = ? LIMIT 1`,
          [preferredCode]
        );
        if (tplByCode && tplByCode.length > 0) {
          // Use existing template
          const template = tplByCode[0];
          const [issued] = await connection.query(
            `SELECT MaPhieu FROM phieugiamgia_phathanh WHERE makh = ? AND MaPhieu = ? LIMIT 1`,
            [makh, template.MaPhieu]
          );
          if (issued && issued.length > 0) {
            couponCode = issued[0].MaPhieu;
          } else {
            await connection.query(
              `INSERT INTO phieugiamgia_phathanh (makh, MaPhieu) VALUES (?, ?)`,
              [makh, template.MaPhieu]
            );
            await connection.query(
              `INSERT INTO khachhang_khuyenmai (makh, makm, ngay_lay, ngay_het_han, trang_thai)
               VALUES (?, ?, NOW(), ?, 'Chua_su_dung')
               ON DUPLICATE KEY UPDATE
                 ngay_lay = VALUES(ngay_lay),
                 ngay_het_han = COALESCE(VALUES(ngay_het_han), ngay_het_han),
                 trang_thai = VALUES(trang_thai)`,
              [makh, formMaKM, null]
            );
            couponCode = template.MaPhieu;
          }
        } else {
          // Preferred code not used yet -> create a new phieugiamgia using preferredCode and link to MaKM
          try {
            await connection.query(
              `INSERT INTO phieugiamgia (MaPhieu, MaKM, MoTa, SoLanSuDungToiDa, TrangThai)
               VALUES (?, ?, ?, ?, ?)`,
              [preferredCode, formMaKM, (promo && promo.TenKM) ? (`${promo.TenKM}`) : `Freeship from form ${formMaKM}`, 1, 1]
            );

            await connection.query(
              `INSERT INTO phieugiamgia_phathanh (makh, MaPhieu) VALUES (?, ?)`,
              [makh, preferredCode]
            );

            await connection.query(
              `INSERT INTO khachhang_khuyenmai (makh, makm, ngay_lay, ngay_het_han, trang_thai)
               VALUES (?, ?, NOW(), ?, 'Chua_su_dung')
               ON DUPLICATE KEY UPDATE
                 ngay_lay = VALUES(ngay_lay),
                 ngay_het_han = COALESCE(VALUES(ngay_het_han), ngay_het_han),
                 trang_thai = VALUES(trang_thai)`,
              [makh, formMaKM, null]
            );

            couponCode = preferredCode;
          } catch (err) {
            // If preferredCode insertion fails (duplicate race or constraint), fall back to search/create by MaKM
            // We'll continue to the fallback logic below
            console.warn('Preferred code insert failed, falling back to MaKM search/create:', err.message);
          }
        }
      }

      // If couponCode not set yet, try to find any existing template by MaKM (legacy behavior)
      if (!couponCode) {
        const [templates] = await connection.query(
          `SELECT p.* FROM phieugiamgia p
           JOIN khuyen_mai km ON p.MaKM = km.MaKM
           WHERE p.MaKM = ? AND km.LoaiKM = 'free_ship' AND p.TrangThai = 1
           LIMIT 1`,
          [formMaKM]
        );

        const template = templates && templates.length > 0 ? templates[0] : null;

        if (template) {
          // Check if the user already received this coupon
          const [issued] = await connection.query(
            `SELECT MaPhieu FROM phieugiamgia_phathanh WHERE makh = ? AND MaPhieu = ? LIMIT 1`,
            [makh, template.MaPhieu]
          );

          if (issued && issued.length > 0) {
            couponCode = issued[0].MaPhieu;
          } else {
            // Issue the existing template to the user
            await connection.query(
              `INSERT INTO phieugiamgia_phathanh (makh, MaPhieu) VALUES (?, ?)`,
              [makh, template.MaPhieu]
            );

            // Legacy compatibility
            await connection.query(
              `INSERT INTO khachhang_khuyenmai (makh, makm, ngay_lay, ngay_het_han, trang_thai)
               VALUES (?, ?, NOW(), ?, 'Chua_su_dung')
               ON DUPLICATE KEY UPDATE
                 ngay_lay = VALUES(ngay_lay),
                 ngay_het_han = COALESCE(VALUES(ngay_het_han), ngay_het_han),
                 trang_thai = VALUES(trang_thai)`,
              [makh, formMaKM, null]
            );

            couponCode = template.MaPhieu;
          }
        } else {
          // No template by MaKM -> generate a fallback code (use unique generator)
          const generateCode = (prefix = 'FS') => {
            const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
            const ts = Date.now().toString(36).toUpperCase().slice(-6);
            return `${prefix}${ts}${rand}`.slice(0, 32);
          };

          let newCode = generateCode('FS');
          let tries = 0;
          while (tries < 5) {
            const [exists] = await connection.query(
              `SELECT MaPhieu FROM phieugiamgia WHERE MaPhieu = ? LIMIT 1`,
              [newCode]
            );
            if (!exists || exists.length === 0) break;
            newCode = generateCode('FS');
            tries++;
          }

          // Insert fallback template and ensure MaKM is set
          await connection.query(
            `INSERT INTO phieugiamgia (MaPhieu, MaKM, MoTa, SoLanSuDungToiDa, TrangThai)
             VALUES (?, ?, ?, ?, ?)`,
            [newCode, formMaKM, (formMaKM ? ('Form:' + formMaKM) : 'Freeship from form'), 1, 1]
          );

          // Issue it
          await connection.query(
            `INSERT INTO phieugiamgia_phathanh (makh, MaPhieu) VALUES (?, ?)`,
            [makh, newCode]
          );

          // Legacy compatibility
            await connection.query(
              `INSERT INTO khachhang_khuyenmai (makh, makm, ngay_lay, ngay_het_han, trang_thai)
               VALUES (?, ?, NOW(), ?, 'Chua_su_dung')
               ON DUPLICATE KEY UPDATE
                 ngay_lay = VALUES(ngay_lay),
                 ngay_het_han = COALESCE(VALUES(ngay_het_han), ngay_het_han),
                 trang_thai = VALUES(trang_thai)`,
              [makh, formMaKM, null]
            );

          couponCode = newCode;
        }
      }
    }

    await connection.commit();

    return res.json({
      success: true,
      message: 'Cảm ơn bạn đã chia sẻ sở thích!',
      data: {
        responseId,
        couponCode: couponCode || 'Bạn đã nhận coupon này rồi!',
        isNewCoupon: !!couponCode
      }
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error submitPreferences:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi lưu sở thích',
      error: error.message
    });
  } finally {
    connection.release();
  }
};

/**
 * Service: Tính điểm sở thích dựa trên câu trả lời
 */
async function calculatePreferenceScores(connection, makh, responseId) {
  // Lấy tất cả câu trả lời có option (bỏ qua text/rating tự do)
  const [answers] = await connection.query(
    `SELECT tl.MaLuaChon, lc.MaTL, lc.MaTG, lc.HinhThuc, lc.MaKhoangGia, 
            lc.NamXBTu, lc.NamXBDen, lc.SoTrangTu, lc.SoTrangDen, lc.TrongSo
     FROM traloi_sothich tl
     JOIN luachon_cauhoi lc ON tl.MaLuaChon = lc.MaLuaChon
     WHERE tl.MaPhanHoi = ?`,
    [responseId]
  );

  const scoreMap = {}; // { "theloai:5": 2.0, "tacgia:12": 1.5, ... }

  for (let ans of answers) {
    const weight = parseFloat(ans.TrongSo || 1.0);

    // Thể loại
    if (ans.MaTL) {
      const key = `theloai:${ans.MaTL}`;
      scoreMap[key] = (scoreMap[key] || 0) + weight;
    }

    // Tác giả
    if (ans.MaTG) {
      const key = `tacgia:${ans.MaTG}`;
      scoreMap[key] = (scoreMap[key] || 0) + weight;
    }

    // Hình thức
    if (ans.HinhThuc) {
      const key = `hinhthuc:${ans.HinhThuc}`;
      scoreMap[key] = (scoreMap[key] || 0) + weight;
    }

    // Khoảng giá
    if (ans.MaKhoangGia) {
      const key = `khoanggia:${ans.MaKhoangGia}`;
      scoreMap[key] = (scoreMap[key] || 0) + weight;
    }

    // Năm XB
    if (ans.NamXBTu && ans.NamXBDen) {
      const key = `namxb:${ans.NamXBTu}-${ans.NamXBDen}`;
      scoreMap[key] = (scoreMap[key] || 0) + weight;
    }

    // Số trang
    if (ans.SoTrangTu && ans.SoTrangDen) {
      const key = `sotrang:${ans.SoTrangTu}-${ans.SoTrangDen}`;
      scoreMap[key] = (scoreMap[key] || 0) + weight;
    }
  }

  // Insert vào bảng điểm
  for (let [key, score] of Object.entries(scoreMap)) {
    const [entityType, entityKey] = key.split(':');
    await connection.query(
      `INSERT INTO diem_sothich_khachhang (makh, LoaiThucThe, KhoaThucThe, DiemSo)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE DiemSo = DiemSo + VALUES(DiemSo), NgayCapNhat = NOW()`,
      [makh, entityType, entityKey, score]
    );
  }
}

/**
 * Apply or remove contribution of a specific response to the customer's preference scores.
 * multiplier: +1 to add, -1 to subtract
 */
async function applyResponseScores(connection, makh, responseId, multiplier = 1, formId = null) {
  // multiplier should be +1 or -1
  multiplier = Number(multiplier) >= 0 ? 1 : -1;

  const [answers] = await connection.query(
    `SELECT tl.MaLuaChon, lc.MaTL, lc.MaTG, lc.HinhThuc, lc.MaKhoangGia,
            lc.NamXBTu, lc.NamXBDen, lc.SoTrangTu, lc.SoTrangDen, lc.TrongSo
     FROM traloi_sothich tl
     JOIN luachon_cauhoi lc ON tl.MaLuaChon = lc.MaLuaChon
     WHERE tl.MaPhanHoi = ?`,
    [responseId]
  );

  const scoreMap = {};
  for (let ans of answers) {
    const weight = parseFloat(ans.TrongSo || 1.0);
    if (ans.MaTL) {
      const key = `theloai:${ans.MaTL}`;
      scoreMap[key] = (scoreMap[key] || 0) + weight;
    }
    if (ans.MaTG) {
      const key = `tacgia:${ans.MaTG}`;
      scoreMap[key] = (scoreMap[key] || 0) + weight;
    }
    if (ans.HinhThuc) {
      const key = `hinhthuc:${ans.HinhThuc}`;
      scoreMap[key] = (scoreMap[key] || 0) + weight;
    }
    if (ans.MaKhoangGia) {
      const key = `khoanggia:${ans.MaKhoangGia}`;
      scoreMap[key] = (scoreMap[key] || 0) + weight;
    }
    if (ans.NamXBTu && ans.NamXBDen) {
      const key = `namxb:${ans.NamXBTu}-${ans.NamXBDen}`;
      scoreMap[key] = (scoreMap[key] || 0) + weight;
    }
    if (ans.SoTrangTu && ans.SoTrangDen) {
      const key = `sotrang:${ans.SoTrangTu}-${ans.SoTrangDen}`;
      scoreMap[key] = (scoreMap[key] || 0) + weight;
    }
  }

  for (let [key, deltaScore] of Object.entries(scoreMap)) {
    const [LoaiThucThe, KhoaThucThe] = key.split(':');
    const change = Math.round(deltaScore) * multiplier;

    // Read current value
    const [rows] = await connection.query(
      `SELECT DiemSo FROM diem_sothich_khachhang WHERE makh = ? AND LoaiThucThe = ? AND KhoaThucThe = ? LIMIT 1`,
      [makh, LoaiThucThe, KhoaThucThe]
    );

    const oldScore = (rows && rows.length > 0) ? Number(rows[0].DiemSo || 0) : 0;
    const newScore = Math.max(0, oldScore + change);

    if (change > 0) {
      // insert or add
      await connection.query(
        `INSERT INTO diem_sothich_khachhang (makh, LoaiThucThe, KhoaThucThe, DiemSo, NgayTao, NgayCapNhat, last_form_id)
         VALUES (?, ?, ?, ?, NOW(), NOW(), ?)
         ON DUPLICATE KEY UPDATE DiemSo = DiemSo + VALUES(DiemSo), NgayCapNhat = NOW(), last_form_id = VALUES(last_form_id)`,
        [makh, LoaiThucThe, KhoaThucThe, change, formId]
      );
    } else if (change < 0) {
      if (newScore <= 0) {
        await connection.query(
          `DELETE FROM diem_sothich_khachhang WHERE makh = ? AND LoaiThucThe = ? AND KhoaThucThe = ?`,
          [makh, LoaiThucThe, KhoaThucThe]
        );
      } else {
        await connection.query(
          `UPDATE diem_sothich_khachhang SET DiemSo = ?, NgayCapNhat = NOW() WHERE makh = ? AND LoaiThucThe = ? AND KhoaThucThe = ?`,
          [newScore, makh, LoaiThucThe, KhoaThucThe]
        );
      }
    } else {
      // no-op
    }

    // Insert history record
    try {
      await connection.query(
        `INSERT INTO diem_sothich_history (makh, LoaiThucThe, KhoaThucThe, oldScore, newScore, strategy, form_id, note, changed_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [makh, LoaiThucThe, KhoaThucThe, oldScore, newScore, multiplier > 0 ? 'submit_add' : 'submit_subtract', formId, multiplier > 0 ? 'applied from submit' : 'removed from previous submit']
      );
    } catch (e) {
      // history insert should not block main flow
      console.warn('Could not insert history for applyResponseScores:', e.message);
    }
  }
}

/**
 * Lấy gợi ý sản phẩm dựa trên sở thích
 * GET /api/preferences/recommendations?makh=X&limit=20
 */
export const getRecommendations = async (req, res) => {
  try {
    const { makh, limit = 20 } = req.query;

    if (!makh) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu tham số makh'
      });
    }

    // Kiểm tra khách đã có sở thích chưa
    const [scores] = await pool.query(
      `SELECT * FROM diem_sothich_khachhang WHERE makh = ?`,
      [makh]
    );

    if (!scores || scores.length === 0) {
      // Chưa có sở thích - trả về bestsellers hoặc sản phẩm mới
      const [products] = await pool.query(
        `SELECT sp.*, tl.TenTL, tg.TenTG
         FROM sanpham sp
         LEFT JOIN theloai tl ON sp.MaTL = tl.MaTL
         LEFT JOIN tacgia tg ON sp.MaTG = tg.MaTG
         WHERE sp.TinhTrang = b'1' AND sp.SoLuong > 0
         ORDER BY sp.NamXB DESC, sp.MaSP DESC
         LIMIT ?`,
        [parseInt(limit)]
      );

      return res.json({
        success: true,
        message: 'Chưa có sở thích - hiển thị sản phẩm mới nhất',
        data: products,
        hasPreferences: false
      });
    }

    // Có sở thích - tính điểm cho từng sản phẩm
    // Query phức tạp: join với nhiều điều kiện
    const sql = `
      SELECT 
        sp.MaSP, 
        sp.TenSP, 
        sp.DonGia, 
        sp.HinhAnh,
        sp.HinhThuc,
        sp.NamXB,
        sp.SoLuong,
        tl.TenTL,
        tg.TenTG,
        (
          COALESCE((SELECT DiemSo FROM diem_sothich_khachhang 
                    WHERE makh = ? AND LoaiThucThe = 'theloai' 
                    AND KhoaThucThe = CAST(sp.MaTL AS CHAR)), 0) * 0.35 +
          COALESCE((SELECT DiemSo FROM diem_sothich_khachhang 
                    WHERE makh = ? AND LoaiThucThe = 'tacgia' 
                    AND KhoaThucThe = CAST(sp.MaTG AS CHAR)), 0) * 0.30 +
          COALESCE((SELECT DiemSo FROM diem_sothich_khachhang 
                    WHERE makh = ? AND LoaiThucThe = 'hinhthuc' 
                    AND KhoaThucThe = sp.HinhThuc), 0) * 0.15 +
          CASE 
            WHEN sp.DonGia < 100000 THEN 
              COALESCE((SELECT DiemSo FROM diem_sothich_khachhang 
                        WHERE makh = ? AND LoaiThucThe = 'khoanggia' 
                        AND KhoaThucThe = 'LT100'), 0)
            WHEN sp.DonGia BETWEEN 100000 AND 200000 THEN 
              COALESCE((SELECT DiemSo FROM diem_sothich_khachhang 
                        WHERE makh = ? AND LoaiThucThe = 'khoanggia' 
                        AND KhoaThucThe = '100-200'), 0)
            WHEN sp.DonGia BETWEEN 200000 AND 300000 THEN 
              COALESCE((SELECT DiemSo FROM diem_sothich_khachhang 
                        WHERE makh = ? AND LoaiThucThe = 'khoanggia' 
                        AND KhoaThucThe = '200-300'), 0)
            WHEN sp.DonGia BETWEEN 300000 AND 500000 THEN 
              COALESCE((SELECT DiemSo FROM diem_sothich_khachhang 
                        WHERE makh = ? AND LoaiThucThe = 'khoanggia' 
                        AND KhoaThucThe = '300-500'), 0)
            ELSE 
              COALESCE((SELECT DiemSo FROM diem_sothich_khachhang 
                        WHERE makh = ? AND LoaiThucThe = 'khoanggia' 
                        AND KhoaThucThe = 'GT500'), 0)
          END * 0.10 +
          (CASE 
            WHEN sp.NamXB >= 2023 THEN 
              COALESCE((SELECT DiemSo FROM diem_sothich_khachhang 
                        WHERE makh = ? AND LoaiThucThe = 'namxb' 
                        AND KhoaThucThe LIKE '2023-%'), 0)
            WHEN sp.NamXB BETWEEN 2020 AND 2022 THEN 
              COALESCE((SELECT DiemSo FROM diem_sothich_khachhang 
                        WHERE makh = ? AND LoaiThucThe = 'namxb' 
                        AND KhoaThucThe LIKE '2020-%'), 0)
            ELSE 
              COALESCE((SELECT DiemSo FROM diem_sothich_khachhang 
                        WHERE makh = ? AND LoaiThucThe = 'namxb' 
                        AND KhoaThucThe LIKE '1900-%'), 0)
          END) * 0.05 +
          (CASE 
            WHEN sp.SoTrang < 200 THEN 
              COALESCE((SELECT DiemSo FROM diem_sothich_khachhang 
                        WHERE makh = ? AND LoaiThucThe = 'sotrang' 
                        AND KhoaThucThe LIKE '1-200'), 0)
            WHEN sp.SoTrang BETWEEN 200 AND 400 THEN 
              COALESCE((SELECT DiemSo FROM diem_sothich_khachhang 
                        WHERE makh = ? AND LoaiThucThe = 'sotrang' 
                        AND KhoaThucThe LIKE '200-400'), 0)
            ELSE 
              COALESCE((SELECT DiemSo FROM diem_sothich_khachhang 
                        WHERE makh = ? AND LoaiThucThe = 'sotrang' 
                        AND KhoaThucThe LIKE '400-%'), 0)
          END) * 0.05
        ) AS TongDiem
      FROM sanpham sp
      LEFT JOIN theloai tl ON sp.MaTL = tl.MaTL
      LEFT JOIN tacgia tg ON sp.MaTG = tg.MaTG
      WHERE sp.TinhTrang = b'1' AND sp.SoLuong > 0
      HAVING TongDiem > 0
      ORDER BY TongDiem DESC, sp.NamXB DESC
      LIMIT ?
    `;

    // 14 lần makh + 1 limit
    const params = Array(14).fill(makh);
    params.push(parseInt(limit));

    const [products] = await pool.query(sql, params);

    // Nếu không đủ sản phẩm phù hợp, bổ sung sản phẩm mới
    if (products.length < limit) {
      const needed = limit - products.length;
      const excludeIds = products.map(p => p.MaSP).join(',') || '0';

      const [moreProducts] = await pool.query(
        `SELECT sp.*, tl.TenTL, tg.TenTG, 0 AS TongDiem
         FROM sanpham sp
         LEFT JOIN theloai tl ON sp.MaTL = tl.MaTL
         LEFT JOIN tacgia tg ON sp.MaTG = tg.MaTG
         WHERE sp.TinhTrang = b'1' AND sp.SoLuong > 0 
           AND sp.MaSP NOT IN (${excludeIds})
         ORDER BY sp.NamXB DESC
         LIMIT ?`,
        [needed]
      );

      products.push(...moreProducts);
    }

    return res.json({
      success: true,
      data: products,
      hasPreferences: true,
      total: products.length
    });
  } catch (error) {
    console.error('Error getRecommendations:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy gợi ý sản phẩm',
      error: error.message
    });
  }
};

/**
 * Kiểm tra khách hàng đã có sở thích chưa
 * GET /api/preferences/check?makh=X
 */
export const checkPreferences = async (req, res) => {
  try {
    const { makh } = req.query;

    if (!makh) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu tham số makh'
      });
    }

    const [responses] = await pool.query(
      `SELECT MaPhanHoi, MaForm, NgayPhanHoi, DongYSuDung 
       FROM phanhoi_sothich 
       WHERE makh = ? 
       ORDER BY NgayPhanHoi DESC 
       LIMIT 1`,
      [makh]
    );

    const hasPreferences = responses && responses.length > 0;

    return res.json({
      success: true,
      data: {
        hasPreferences,
        latestResponse: hasPreferences ? responses[0] : null
      }
    });
  } catch (error) {
    console.error('Error checkPreferences:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi kiểm tra sở thích',
      error: error.message
    });
  }
};

/**
 * Merge form sở thích mới với dữ liệu hiện tại
 * POST /api/preferences/merge
 * Body: { makh, formId, strategy, newWeight, removeAbsent, preferences: [{LoaiThucThe, KhoaThucThe, DiemSo}] }
 */
export const mergePreferenceForm = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { makh, formId = null, strategy = 'weighted', newWeight = 0.7, removeAbsent = true, preferences } = req.body;

    if (!makh || !Array.isArray(preferences)) {
      await connection.rollback();
      return res.status(400).json({ success: false, message: 'Thiếu makh hoặc preferences không hợp lệ' });
    }

    // Normalize incoming preferences into a map key -> incomingScore
    const incomingMap = new Map();
    for (let p of preferences) {
      if (!p.LoaiThucThe || p.KhoaThucThe === undefined) continue;
      const key = `${p.LoaiThucThe}::${String(p.KhoaThucThe)}`;
      const score = Math.max(0, Math.min(100, Number(p.DiemSo || 0)));
      incomingMap.set(key, score);
    }

    // Fetch existing preferences for user
    const [existingRows] = await connection.query(
      `SELECT LoaiThucThe, KhoaThucThe, DiemSo FROM diem_sothich_khachhang WHERE makh = ?`,
      [makh]
    );

    const existingMap = new Map();
    for (let r of existingRows) {
      const k = `${r.LoaiThucThe}::${String(r.KhoaThucThe)}`;
      existingMap.set(k, r.DiemSo);
    }

    const updates = [];

    // Apply incoming preferences
    for (let [key, incomingScore] of incomingMap.entries()) {
      const [LoaiThucThe, KhoaThucThe] = key.split('::');
      const has = existingMap.has(key);
      const oldScore = has ? existingMap.get(key) : 0;
      let finalScore = incomingScore;

      if (strategy === 'replace') {
        finalScore = incomingScore;
      } else if (strategy === 'additive') {
        finalScore = Math.min(100, Math.round(oldScore + incomingScore));
      } else {
        // weighted default
        const w = Number(newWeight) || 0.7;
        finalScore = Math.round(oldScore * (1 - w) + incomingScore * w);
      }

      finalScore = Math.max(0, Math.min(100, finalScore));

      // Upsert into diem_sothich_khachhang
      await connection.query(
        `INSERT INTO diem_sothich_khachhang (makh, LoaiThucThe, KhoaThucThe, DiemSo, NgayTao, NgayCapNhat, last_form_id)
         VALUES (?, ?, ?, ?, NOW(), NOW(), ?)
         ON DUPLICATE KEY UPDATE DiemSo = VALUES(DiemSo), NgayCapNhat = NOW(), last_form_id = VALUES(last_form_id)`,
        [makh, LoaiThucThe, KhoaThucThe, finalScore, formId]
      );

      // Insert history
      await connection.query(
        `INSERT INTO diem_sothich_history (makh, LoaiThucThe, KhoaThucThe, oldScore, newScore, strategy, form_id)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [makh, LoaiThucThe, KhoaThucThe, oldScore || 0, finalScore, strategy, formId]
      );

      updates.push({ LoaiThucThe, KhoaThucThe, oldScore: oldScore || 0, newScore: finalScore });
    }

    // Handle removals: existing keys not present in incoming
    if (removeAbsent) {
      const decay = 0.5; // reduce to 50% by default
      for (let [key, oldScore] of existingMap.entries()) {
        if (!incomingMap.has(key)) {
          const [LoaiThucThe, KhoaThucThe] = key.split('::');
          const reduced = Math.round(oldScore * decay);
          if (reduced < 5) {
            // delete
            await connection.query(
              `DELETE FROM diem_sothich_khachhang WHERE makh = ? AND LoaiThucThe = ? AND KhoaThucThe = ?`,
              [makh, LoaiThucThe, KhoaThucThe]
            );
            await connection.query(
              `INSERT INTO diem_sothich_history (makh, LoaiThucThe, KhoaThucThe, oldScore, newScore, strategy, form_id, note)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
              [makh, LoaiThucThe, KhoaThucThe, oldScore, 0, 'decay_deleted', formId, 'auto-deleted after decay']
            );
            updates.push({ LoaiThucThe, KhoaThucThe, oldScore, newScore: 0, removed: true });
          } else {
            await connection.query(
              `UPDATE diem_sothich_khachhang SET DiemSo = ?, NgayCapNhat = NOW() WHERE makh = ? AND LoaiThucThe = ? AND KhoaThucThe = ?`,
              [reduced, makh, LoaiThucThe, KhoaThucThe]
            );
            await connection.query(
              `INSERT INTO diem_sothich_history (makh, LoaiThucThe, KhoaThucThe, oldScore, newScore, strategy, form_id)
               VALUES (?, ?, ?, ?, ?, ?, ?)`,
              [makh, LoaiThucThe, KhoaThucThe, oldScore, reduced, 'decay_reduced', formId]
            );
            updates.push({ LoaiThucThe, KhoaThucThe, oldScore, newScore: reduced });
          }
        }
      }
    }

    await connection.commit();

    // After commit, compute a small set of updated recommendations to return immediately
    try {
      const recLimit = 5;
      const sql = `
      SELECT 
        sp.MaSP, 
        sp.TenSP, 
        sp.DonGia, 
        sp.HinhAnh,
        sp.HinhThuc,
        sp.NamXB,
        sp.SoLuong,
        tl.TenTL,
        tg.TenTG,
        (
          COALESCE((SELECT DiemSo FROM diem_sothich_khachhang 
                    WHERE makh = ? AND LoaiThucThe = 'theloai' 
                    AND KhoaThucThe = CAST(sp.MaTL AS CHAR)), 0) * 0.35 +
          COALESCE((SELECT DiemSo FROM diem_sothich_khachhang 
                    WHERE makh = ? AND LoaiThucThe = 'tacgia' 
                    AND KhoaThucThe = CAST(sp.MaTG AS CHAR)), 0) * 0.30 +
          COALESCE((SELECT DiemSo FROM diem_sothich_khachhang 
                    WHERE makh = ? AND LoaiThucThe = 'hinhthuc' 
                    AND KhoaThucThe = sp.HinhThuc), 0) * 0.15 +
          CASE 
            WHEN sp.DonGia < 100000 THEN 
              COALESCE((SELECT DiemSo FROM diem_sothich_khachhang 
                        WHERE makh = ? AND LoaiThucThe = 'khoanggia' 
                        AND KhoaThucThe = 'LT100'), 0)
            WHEN sp.DonGia BETWEEN 100000 AND 200000 THEN 
              COALESCE((SELECT DiemSo FROM diem_sothich_khachhang 
                        WHERE makh = ? AND LoaiThucThe = 'khoanggia' 
                        AND KhoaThucThe = '100-200'), 0)
            WHEN sp.DonGia BETWEEN 200000 AND 300000 THEN 
              COALESCE((SELECT DiemSo FROM diem_sothich_khachhang 
                        WHERE makh = ? AND LoaiThucThe = 'khoanggia' 
                        AND KhoaThucThe = '200-300'), 0)
            WHEN sp.DonGia BETWEEN 300000 AND 500000 THEN 
              COALESCE((SELECT DiemSo FROM diem_sothich_khachhang 
                        WHERE makh = ? AND LoaiThucThe = 'khoanggia' 
                        AND KhoaThucThe = '300-500'), 0)
            ELSE 
              COALESCE((SELECT DiemSo FROM diem_sothich_khachhang 
                        WHERE makh = ? AND LoaiThucThe = 'khoanggia' 
                        AND KhoaThucThe = 'GT500'), 0)
          END * 0.10 +
          (CASE 
            WHEN sp.NamXB >= 2023 THEN 
              COALESCE((SELECT DiemSo FROM diem_sothich_khachhang 
                        WHERE makh = ? AND LoaiThucThe = 'namxb' 
                        AND KhoaThucThe LIKE '2023-%'), 0)
            WHEN sp.NamXB BETWEEN 2020 AND 2022 THEN 
              COALESCE((SELECT DiemSo FROM diem_sothich_khachhang 
                        WHERE makh = ? AND LoaiThucThe = 'namxb' 
                        AND KhoaThucThe LIKE '2020-%'), 0)
            ELSE 
              COALESCE((SELECT DiemSo FROM diem_sothich_khachhang 
                        WHERE makh = ? AND LoaiThucThe = 'namxb' 
                        AND KhoaThucThe LIKE '1900-%'), 0)
          END) * 0.05 +
          (CASE 
            WHEN sp.SoTrang < 200 THEN 
              COALESCE((SELECT DiemSo FROM diem_sothich_khachhang 
                        WHERE makh = ? AND LoaiThucThe = 'sotrang' 
                        AND KhoaThucThe LIKE '1-200'), 0)
            WHEN sp.SoTrang BETWEEN 200 AND 400 THEN 
              COALESCE((SELECT DiemSo FROM diem_sothich_khachhang 
                        WHERE makh = ? AND LoaiThucThe = 'sotrang' 
                        AND KhoaThucThe LIKE '200-400'), 0)
            ELSE 
              COALESCE((SELECT DiemSo FROM diem_sothich_khachhang 
                        WHERE makh = ? AND LoaiThucThe = 'sotrang' 
                        AND KhoaThucThe LIKE '400-%'), 0)
          END) * 0.05
        ) AS TongDiem
      FROM sanpham sp
      LEFT JOIN theloai tl ON sp.MaTL = tl.MaTL
      LEFT JOIN tacgia tg ON sp.MaTG = tg.MaTG
      WHERE sp.TinhTrang = b'1' AND sp.SoLuong > 0
      ORDER BY TongDiem DESC, sp.NamXB DESC
      LIMIT ?
      `;

      // params: 14 makh placeholders + limit
      const params = Array(14).fill(makh).concat([recLimit]);
      const [recs] = await pool.query(sql, params);

      // Normalize TongDiem -> RecommendationPercent
      try {
        const scores = recs.map(p => Number(p.TongDiem || 0));
        const max = scores.length ? Math.max(...scores) : 0;
        if (max > 0) {
          recs.forEach(p => { p.RecommendationPercent = Math.round((Number(p.TongDiem || 0) / max) * 100); });
        } else {
          recs.forEach(p => { p.RecommendationPercent = 0; });
        }
      } catch (err) {
        recs.forEach(p => { p.RecommendationPercent = 0; });
      }

      return res.json({ success: true, message: 'Cập nhật sở thích thành công', updates, recommendations: recs });
    } catch (err) {
      // If recommendation computation fails, still return success for updates
      console.warn('Could not compute immediate recommendations:', err.message);
      return res.json({ success: true, message: 'Cập nhật sở thích thành công', updates });
    }
  } catch (error) {
    await connection.rollback();
    console.error('Error mergePreferenceForm:', error);
    return res.status(500).json({ success: false, message: 'Lỗi khi hợp nhất sở thích', error: error.message });
  } finally {
    connection.release();
  }
};

// ============== ADMIN APIs ==============

/**
 * Lấy danh sách forms (Admin)
 * GET /api/admin/preference-forms
 */
export const getAllForms = async (req, res) => {
  try {
    const [forms] = await pool.query(
      `SELECT f.*, 
        (SELECT COUNT(*) FROM cauhoi_sothich WHERE MaForm = f.MaForm) AS SoCauHoi,
        (SELECT COUNT(*) FROM phanhoi_sothich WHERE MaForm = f.MaForm) AS SoPhanHoi
       FROM form_sothich f
       ORDER BY f.NgayTao DESC`
    );

    return res.json({
      success: true,
      data: forms
    });
  } catch (error) {
    console.error('Error getAllForms:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách forms',
      error: error.message
    });
  }
};

/**
 * Tạo form mới (Admin)
 * POST /api/admin/preference-forms
 */
export const createForm = async (req, res) => {
  try {
    // Hỗ trợ cả PascalCase và camelCase
    const { 
      TenForm, tenForm,
      MoTa, moTa,
      IsActive, isActive, TrangThai, trangThai,
      MaKM, maKM
    } = req.body;

    const formName = TenForm || tenForm;
    const description = MoTa || moTa || '';
    const status = IsActive !== undefined ? (IsActive ? 1 : 0) : (isActive !== undefined ? (isActive ? 1 : 0) : (TrangThai !== undefined ? TrangThai : (trangThai !== undefined ? trangThai : 1)));
  const couponId = MaKM || maKM || null;

    if (!formName) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu tên form (TenForm hoặc tenForm)',
        received: req.body
      });
    }

    const [result] = await pool.query(
      `INSERT INTO form_sothich (TenForm, MoTa, TrangThai, MaKM) VALUES (?, ?, ?, ?)`,
      [formName, description, status, couponId]
    );

    return res.json({
      success: true,
      message: 'Tạo form thành công',
      data: { formId: result.insertId }
    });
  } catch (error) {
    console.error('Error createForm:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi tạo form',
      error: error.message
    });
  }
};

/**
 * Lấy chi tiết form (Admin)
 * GET /api/admin/preference-forms/:id
 */
export const getFormDetail = async (req, res) => {
  try {
    const { id } = req.params;

    const [forms] = await pool.query(
      `SELECT * FROM form_sothich WHERE MaForm = ?`,
      [id]
    );

    if (!forms || forms.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy form'
      });
    }

    const form = forms[0];

    // Lấy câu hỏi
    const [questions] = await pool.query(
      `SELECT * FROM cauhoi_sothich WHERE MaForm = ? ORDER BY ThuTu`,
      [id]
    );

    // Lấy options cho mỗi câu hỏi
    for (let q of questions) {
      const [options] = await pool.query(
        `SELECT * FROM luachon_cauhoi WHERE MaCauHoi = ? ORDER BY ThuTu`,
        [q.MaCauHoi]
      );
      q.options = options;
    }

    form.questions = questions;

    return res.json({
      success: true,
      data: form
    });
  } catch (error) {
    console.error('Error getFormDetail:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy chi tiết form',
      error: error.message
    });
  }
};

/**
 * Cập nhật form (Admin)
 * PUT /api/admin/preference-forms/:id
 */
export const updateForm = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      TenForm, tenForm,
      MoTa, moTa,
      IsActive, isActive, TrangThai, trangThai 
    } = req.body;

    const formName = TenForm || tenForm;
    const description = MoTa !== undefined ? MoTa : moTa;
    const status = IsActive !== undefined ? (IsActive ? 1 : 0) : (isActive !== undefined ? (isActive ? 1 : 0) : (TrangThai !== undefined ? TrangThai : trangThai));

    // Accept optional MaKM to link a coupon to the form
    const { MaKM, maKM } = req.body;
    const couponId = MaKM || maKM || null;

    await pool.query(
      `UPDATE form_sothich SET TenForm = ?, MoTa = ?, TrangThai = ?, MaKM = ? WHERE MaForm = ?`,
      [formName, description, status, couponId, id]
    );

    return res.json({
      success: true,
      message: 'Cập nhật form thành công'
    });
  } catch (error) {
    console.error('Error updateForm:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật form',
      error: error.message
    });
  }
};

/**
 * Xóa form (Admin)
 * DELETE /api/admin/preference-forms/:id
 */
export const deleteForm = async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query(`DELETE FROM form_sothich WHERE MaForm = ?`, [id]);

    return res.json({
      success: true,
      message: 'Xóa form thành công'
    });
  } catch (error) {
    console.error('Error deleteForm:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa form',
      error: error.message
    });
  }
};

/**
 * Thống kê phản hồi (Admin)
 * GET /api/admin/preference-forms/:id/responses
 */
export const getFormResponses = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const [responses] = await pool.query(
      `SELECT pr.*, kh.tenkh, kh.email,
         (SELECT COUNT(*) FROM traloi_sothich tl WHERE tl.MaPhanHoi = pr.MaPhanHoi) AS SoCauTraLoi
       FROM phanhoi_sothich pr
       JOIN khachhang kh ON pr.makh = kh.makh
       WHERE pr.MaForm = ?
       ORDER BY pr.NgayPhanHoi DESC
       LIMIT ? OFFSET ?`,
      [id, parseInt(limit), offset]
    );

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) as total FROM phanhoi_sothich WHERE MaForm = ?`,
      [id]
    );

    return res.json({
      success: true,
      data: responses,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total
      }
    });
  } catch (error) {
    console.error('Error getFormResponses:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách phản hồi',
      error: error.message
    });
  }
};

/**
 * Lấy chi tiết phản hồi (các câu trả lời) theo MaPhanHoi
 * GET /api/preferences/admin/responses/:id
 */
export const getResponseDetail = async (req, res) => {
  try {
    const { id } = req.params; // MaPhanHoi
    if (!id) return res.status(400).json({ success: false, message: 'Thiếu MaPhanHoi' });

    // Lấy tất cả câu trả lời liên quan tới phản hồi
    // JOIN thêm bảng cauhoi_sothich để lấy NoiDungCauHoi, LoaiCauHoi, BatBuoc
    const [answers] = await pool.query(
      `SELECT tl.MaPhanHoi, tl.MaCauHoi, tl.MaLuaChon, tl.VanBan, tl.DiemDanhGia,
              ch.NoiDungCauHoi, ch.LoaiCauHoi, ch.BatBuoc,
              lc.NoiDungLuaChon, lc.MaTL, lc.MaTG, lc.HinhThuc, lc.MaKhoangGia, lc.NamXBTu, lc.NamXBDen, lc.SoTrangTu, lc.SoTrangDen
       FROM traloi_sothich tl
       LEFT JOIN cauhoi_sothich ch ON tl.MaCauHoi = ch.MaCauHoi
       LEFT JOIN luachon_cauhoi lc ON tl.MaLuaChon = lc.MaLuaChon
       WHERE tl.MaPhanHoi = ?
       ORDER BY ch.ThuTu, tl.MaCauHoi`,
      [id]
    );

    // Count
    const count = answers.length;

    return res.json({ success: true, data: { answers, count } });
  } catch (error) {
    console.error('Error getResponseDetail:', error);
    return res.status(500).json({ success: false, message: 'Lỗi khi lấy chi tiết phản hồi', error: error.message });
  }
};

/**
 * Tạo câu hỏi mới (Admin)
 * POST /api/admin/questions
 */
export const createQuestion = async (req, res) => {
  try {
    const {
      MaForm, maForm,
      NoiDungCauHoi, noiDungCauHoi,
      LoaiCauHoi, loaiCauHoi,
      BatBuoc, batBuoc,
      ThuTu, thuTu
    } = req.body;

    const formId = MaForm || maForm;
    const content = NoiDungCauHoi || noiDungCauHoi;
    const type = LoaiCauHoi || loaiCauHoi;
    const required = BatBuoc !== undefined ? BatBuoc : (batBuoc !== undefined ? batBuoc : 0);
    const order = ThuTu !== undefined ? ThuTu : (thuTu !== undefined ? thuTu : 0);

    if (!formId || !content || !type) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin bắt buộc (MaForm, NoiDungCauHoi, LoaiCauHoi)'
      });
    }

    const [result] = await pool.query(
      `INSERT INTO cauhoi_sothich (MaForm, NoiDungCauHoi, LoaiCauHoi, BatBuoc, ThuTu)
       VALUES (?, ?, ?, ?, ?)`,
      [formId, content, type, required, order]
    );

    return res.json({
      success: true,
      message: 'Tạo câu hỏi thành công',
      data: { questionId: result.insertId }
    });
  } catch (error) {
    console.error('Error createQuestion:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi tạo câu hỏi',
      error: error.message
    });
  }
};

/**
 * Xóa câu hỏi (Admin)
 * DELETE /api/admin/questions/:id
 */
export const deleteQuestion = async (req, res) => {
  try {
    const { id } = req.params;

    // Xóa options trước
    await pool.query(`DELETE FROM luachon_cauhoi WHERE MaCauHoi = ?`, [id]);
    
    // Xóa question
    await pool.query(`DELETE FROM cauhoi_sothich WHERE MaCauHoi = ?`, [id]);

    return res.json({
      success: true,
      message: 'Xóa câu hỏi thành công'
    });
  } catch (error) {
    console.error('Error deleteQuestion:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa câu hỏi',
      error: error.message
    });
  }
};

/**
 * Tạo lựa chọn mới (Admin)
 * POST /api/admin/options
 */
export const createOption = async (req, res) => {
  try {
    const {
      MaCauHoi, maCauHoi,
      NoiDungLuaChon, noiDungLuaChon,
      MaTL, maTL,
      MaTG, maTG,
      HinhThuc, hinhThuc,
      MaKhoangGia, maKhoangGia,
      NamXBTu, namXBTu,
      NamXBDen, namXBDen,
      SoTrangTu, soTrangTu,
      SoTrangDen, soTrangDen,
      TrongSo, trongSo,
      ThuTu, thuTu
    } = req.body;

    const questionId = MaCauHoi || maCauHoi;
    const content = NoiDungLuaChon || noiDungLuaChon;
    const categoryId = MaTL || maTL || null;
    const authorId = MaTG || maTG || null;
    const format = HinhThuc || hinhThuc || null;
    const priceRange = MaKhoangGia || maKhoangGia || null;
    const yearFrom = NamXBTu || namXBTu || null;
    const yearTo = NamXBDen || namXBDen || null;
    const pageFrom = SoTrangTu || soTrangTu || null;
    const pageTo = SoTrangDen || soTrangDen || null;
    const weight = TrongSo !== undefined ? TrongSo : (trongSo !== undefined ? trongSo : 1.0);
    const order = ThuTu !== undefined ? ThuTu : (thuTu !== undefined ? thuTu : 0);

    if (!questionId || !content) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin bắt buộc (MaCauHoi, NoiDungLuaChon)'
      });
    }

    // Validate MaKhoangGia against allowed enum values to avoid SQL insertion errors
    // Allowed values are defined in the migration as ENUM('LT100','100-200','200-300','300-500','GT500')
    const ALLOWED_PRICE_RANGES = [
      'LT100', '100-200', '200-300', '300-400', '400-500',
      '500-700', '700-1000', '1000-2000', '300-500', 'GT500', 'GT2000'
    ];
    if (priceRange !== null && priceRange !== undefined && priceRange !== '') {
      // sometimes admin UI may send a human label like '300-400' by mistake — reject and return helpful message
      if (!ALLOWED_PRICE_RANGES.includes(String(priceRange))) {
        return res.status(400).json({
          success: false,
          message: 'Giá trị MaKhoangGia không hợp lệ',
          allowedValues: ALLOWED_PRICE_RANGES,
          received: priceRange
        });
      }
    }

    const [result] = await pool.query(
      `INSERT INTO luachon_cauhoi 
       (MaCauHoi, NoiDungLuaChon, MaTL, MaTG, HinhThuc, MaKhoangGia, NamXBTu, NamXBDen, SoTrangTu, SoTrangDen, TrongSo, ThuTu)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [questionId, content, categoryId, authorId, format, priceRange, yearFrom, yearTo, pageFrom, pageTo, weight, order]
    );

    return res.json({
      success: true,
      message: 'Tạo lựa chọn thành công',
      data: { optionId: result.insertId }
    });
  } catch (error) {
    console.error('Error createOption:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi tạo lựa chọn',
      error: error.message
    });
  }
};

/**
 * Cập nhật lựa chọn (Admin)
 * PUT /api/admin/options/:id
 */
export const updateOption = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      NoiDungLuaChon, noiDungLuaChon,
      MaTL, maTL,
      MaTG, maTG,
      HinhThuc, hinhThuc,
      MaKhoangGia, maKhoangGia,
      NamXBTu, namXBTu,
      NamXBDen, namXBDen,
      SoTrangTu, soTrangTu,
      SoTrangDen, soTrangDen,
      TrongSo, trongSo,
      ThuTu, thuTu
    } = req.body;

    const content = NoiDungLuaChon || noiDungLuaChon;
    const categoryId = MaTL || maTL || null;
    const authorId = MaTG || maTG || null;
    const format = HinhThuc || hinhThuc || null;
    const priceRange = MaKhoangGia || maKhoangGia || null;
    const yearFrom = NamXBTu || namXBTu || null;
    const yearTo = NamXBDen || namXBDen || null;
    const pageFrom = SoTrangTu || soTrangTu || null;
    const pageTo = SoTrangDen || soTrangDen || null;
    const weight = TrongSo !== undefined ? TrongSo : (trongSo !== undefined ? trongSo : undefined);
    const order = ThuTu !== undefined ? ThuTu : (thuTu !== undefined ? thuTu : undefined);

    // Validate priceRange if provided
    const ALLOWED_PRICE_RANGES = [
      'LT100', '100-200', '200-300', '300-400', '400-500',
      '500-700', '700-1000', '1000-2000', '300-500', 'GT500', 'GT2000'
    ];
    if (priceRange !== null && priceRange !== undefined && priceRange !== '') {
      if (!ALLOWED_PRICE_RANGES.includes(String(priceRange))) {
        return res.status(400).json({
          success: false,
          message: 'Giá trị MaKhoangGia không hợp lệ',
          allowedValues: ALLOWED_PRICE_RANGES,
          received: priceRange
        });
      }
    }

    // Build dynamic SET clause for partial updates
    const sets = [];
    const params = [];

    if (content !== undefined) { sets.push('NoiDungLuaChon = ?'); params.push(content); }
    if (categoryId !== undefined) { sets.push('MaTL = ?'); params.push(categoryId); }
    if (authorId !== undefined) { sets.push('MaTG = ?'); params.push(authorId); }
    if (format !== undefined) { sets.push('HinhThuc = ?'); params.push(format); }
    if (priceRange !== undefined) { sets.push('MaKhoangGia = ?'); params.push(priceRange); }
    if (yearFrom !== undefined) { sets.push('NamXBTu = ?'); params.push(yearFrom); }
    if (yearTo !== undefined) { sets.push('NamXBDen = ?'); params.push(yearTo); }
    if (pageFrom !== undefined) { sets.push('SoTrangTu = ?'); params.push(pageFrom); }
    if (pageTo !== undefined) { sets.push('SoTrangDen = ?'); params.push(pageTo); }
    if (weight !== undefined) { sets.push('TrongSo = ?'); params.push(weight); }
    if (order !== undefined) { sets.push('ThuTu = ?'); params.push(order); }

    if (sets.length === 0) {
      return res.status(400).json({ success: false, message: 'Không có trường nào để cập nhật' });
    }

    const sql = `UPDATE luachon_cauhoi SET ${sets.join(', ')} WHERE MaLuaChon = ?`;
    params.push(id);

    const [result] = await pool.query(sql, params);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy lựa chọn để cập nhật' });
    }

    return res.json({ success: true, message: 'Cập nhật lựa chọn thành công' });
  } catch (error) {
    console.error('Error updateOption:', error);
    return res.status(500).json({ success: false, message: 'Lỗi khi cập nhật lựa chọn', error: error.message });
  }
};

/**
 * Xóa lựa chọn (Admin)
 * DELETE /api/admin/options/:id
 */
export const deleteOption = async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query(`DELETE FROM luachon_cauhoi WHERE MaLuaChon = ?`, [id]);

    return res.json({
      success: true,
      message: 'Xóa lựa chọn thành công'
    });
  } catch (error) {
    console.error('Error deleteOption:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa lựa chọn',
      error: error.message
    });
  }
};

