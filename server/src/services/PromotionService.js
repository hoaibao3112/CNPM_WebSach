import pool from '../config/connectDatabase.js';

class PromotionService {
    // Helper: generate a readable code
    generateCode(prefix = 'PROMO') {
        const now = new Date();
        const stamp = now.toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
        const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
        return `${prefix}-${stamp}-${rand}`;
    }

    // --- Promotion (khuyen_mai) CRUD ---

    async getAllPromotions(filters = {}) {
        const { page = 1, limit = 10, search = '', activeOnly = false, loaiKM = '' } = filters;
        const offset = (page - 1) * limit;
        const searchTerm = `%${search}%`;

        let whereClause = `WHERE TenKM LIKE ?`;
        const params = [searchTerm];

        if (activeOnly === 'true' || activeOnly === true) {
            whereClause += ` AND k.NgayBatDau <= NOW() AND k.NgayKetThuc >= NOW() AND k.TrangThai = 1`;
        }

        if (loaiKM) {
            whereClause += ` AND k.LoaiKM = ?`;
            params.push(loaiKM);
        }

        const query = `
      SELECT k.*, CAST(k.TrangThai AS UNSIGNED) as TrangThai,
             ct.GiaTriGiam, ct.GiaTriDonToiThieu, ct.GiamToiDa, ct.SoLuongToiThieu
      FROM khuyen_mai k
      LEFT JOIN ct_khuyen_mai ct ON k.MaKM = ct.MaKM
      ${whereClause}
      ORDER BY k.NgayBatDau DESC
      LIMIT ? OFFSET ?`;

        const [promotions] = await pool.query(query, [...params, parseInt(limit), parseInt(offset)]);

        const [[{ total }]] = await pool.query(`SELECT COUNT(*) as total FROM khuyen_mai k ${whereClause}`, params);

        return {
            data: promotions,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    async getPromotionById(makm) {
        const [[promotion]] = await pool.query(
            `SELECT k.*, CAST(k.TrangThai AS UNSIGNED) as TrangThai, 
       ct.GiaTriGiam, ct.GiaTriDonToiThieu, ct.GiamToiDa, ct.SoLuongToiThieu
       FROM khuyen_mai k
       LEFT JOIN ct_khuyen_mai ct ON k.MaKM = ct.MaKM
       WHERE k.MaKM = ?`,
            [makm]
        );

        if (!promotion) throw new Error('Không tìm thấy khuyến mãi');

        const [products] = await pool.query(
            `SELECT s.MaSP, s.TenSP 
       FROM sp_khuyen_mai spkm 
       JOIN sanpham s ON spkm.MaSP = s.MaSP 
       WHERE spkm.MaKM = ?`,
            [makm]
        );

        return { ...promotion, SanPhamApDung: products };
    }

    async createPromotion(data) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            let codeToUse = data.Code || this.generateCode(data.LoaiKM === 'free_ship' ? 'FREESHIP' : 'PROMO');
            const audience = data.Audience || (data.LoaiKM === 'free_ship' ? 'FORM_ONLY' : 'PUBLIC');
            const isClaimable = typeof data.IsClaimable !== 'undefined' ? data.IsClaimable : (data.LoaiKM === 'free_ship' ? 0 : 1);

            const [result] = await connection.query(
                `INSERT INTO khuyen_mai (TenKM, MoTa, NgayBatDau, NgayKetThuc, LoaiKM, Code, Audience, IsClaimable, TrangThai)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`,
                [data.TenKM, data.MoTa || null, data.NgayBatDau, data.NgayKetThuc, data.LoaiKM, codeToUse, audience, isClaimable]
            );

            const makm = result.insertId;
            const giaTriGiam = data.LoaiKM === 'free_ship' ? 0 : (data.GiaTriGiam || 0);

            await connection.query(
                `INSERT INTO ct_khuyen_mai (MaKM, GiaTriGiam, GiaTriDonToiThieu, GiamToiDa, SoLuongToiThieu)
         VALUES (?, ?, ?, ?, ?)`,
                [makm, giaTriGiam, data.GiaTriDonToiThieu || null, data.GiamToiDa || null, data.SoLuongToiThieu || 1]
            );

            if (data.SanPhamApDung && Array.isArray(data.SanPhamApDung)) {
                for (const masp of data.SanPhamApDung) {
                    await connection.query(`INSERT INTO sp_khuyen_mai (MaKM, MaSP) VALUES (?, ?)`, [makm, masp]);
                }
            }

            await connection.commit();
            return makm;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    async updatePromotion(makm, data) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            const audienceUpdate = typeof data.Audience !== 'undefined' ? data.Audience : (data.LoaiKM === 'free_ship' ? 'FORM_ONLY' : null);
            const isClaimableUpdate = typeof data.IsClaimable !== 'undefined' ? data.IsClaimable : (data.LoaiKM === 'free_ship' ? 0 : null);

            let query = `UPDATE khuyen_mai SET TenKM = ?, MoTa = ?, NgayBatDau = ?, NgayKetThuc = ?, LoaiKM = ?, Code = ?`;
            const params = [data.TenKM || null, data.MoTa || null, data.NgayBatDau || null, data.NgayKetThuc || null, data.LoaiKM || null, data.Code || null];

            if (audienceUpdate !== null) { query += ', Audience = ?'; params.push(audienceUpdate); }
            if (isClaimableUpdate !== null) { query += ', IsClaimable = ?'; params.push(isClaimableUpdate); }

            query += ` WHERE MaKM = ?`;
            params.push(makm);

            await connection.query(query, params);

            const giaTriGiam = data.LoaiKM === 'free_ship' ? 0 : (data.GiaTriGiam || 0);
            await connection.query(
                `UPDATE ct_khuyen_mai SET GiaTriGiam = ?, GiaTriDonToiThieu = ?, GiamToiDa = ?, SoLuongToiThieu = ? WHERE MaKM = ?`,
                [giaTriGiam, data.GiaTriDonToiThieu || null, data.GiamToiDa || null, data.SoLuongToiThieu || null, makm]
            );

            await connection.query(`DELETE FROM sp_khuyen_mai WHERE MaKM = ?`, [makm]);
            if (data.SanPhamApDung && Array.isArray(data.SanPhamApDung)) {
                for (const masp of data.SanPhamApDung) {
                    await connection.query(`INSERT INTO sp_khuyen_mai (MaKM, MaSP) VALUES (?, ?)`, [makm, masp]);
                }
            }

            await connection.commit();
            return true;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    async deletePromotion(makm) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();
            await connection.query(`DELETE FROM khachhang_khuyenmai WHERE makm = ?`, [makm]);
            await connection.query(`DELETE FROM sp_khuyen_mai WHERE MaKM = ?`, [makm]);
            await connection.query(`DELETE FROM ct_khuyen_mai WHERE MaKM = ?`, [makm]);
            const [result] = await connection.query(`DELETE FROM khuyen_mai WHERE MaKM = ?`, [makm]);
            if (result.affectedRows === 0) throw new Error('Không tìm thấy khuyến mãi');
            await connection.commit();
            return true;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    // --- Coupon (phieugiamgia) Service ---

    async getMyCoupons(makh) {
        const [coupons] = await pool.query(
            `SELECT ph.MaPhatHanh, ph.MaPhieu, ph.NgayPhatHanh, ph.NgaySuDung, p.MoTa, p.MaKM, p.TrangThai,
              k.TenKM, k.LoaiKM, ct.GiaTriGiam, ct.GiaTriDonToiThieu, ct.GiamToiDa
       FROM phieugiamgia_phathanh ph
       JOIN phieugiamgia p ON ph.MaPhieu = p.MaPhieu
       LEFT JOIN khuyen_mai k ON p.MaKM = k.MaKM
       LEFT JOIN ct_khuyen_mai ct ON k.MaKM = ct.MaKM
       WHERE ph.makh = ?`,
            [makh]
        );
        return coupons;
    }

    async createCoupon(data) {
        const { MaPhieu, MoTa, SoLanSuDungToiDa, TrangThai, MaKM } = data;
        const [result] = await pool.query(
            `INSERT INTO phieugiamgia (MaPhieu, MoTa, SoLanSuDungToiDa, TrangThai, MaKM)
       VALUES (?, ?, ?, ?, ?)`,
            [MaPhieu, MoTa, SoLanSuDungToiDa || 1, TrangThai || 1, MaKM || null]
        );
        return result;
    }

    // --- Voucher Service ---

    async getAllVouchers() {
        const [rows] = await pool.query(`
      SELECT v.*, km.TenKM, km.LoaiKM
      FROM ma_giam_gia v
      JOIN khuyen_mai km ON v.MaKM = km.MaKM
      WHERE v.TrangThai = b'1' AND km.TrangThai = b'1'
    `);
        return rows;
    }

    async getActiveProducts() {
        // Return products currently in active promotions
        const [products] = await pool.query(`
      SELECT DISTINCT s.*, km.TenKM, ct.GiaTriGiam
      FROM sanpham s
      JOIN sp_khuyen_mai spkm ON s.MaSP = spkm.MaSP
      JOIN khuyen_mai km ON spkm.MaKM = km.MaKM
      JOIN ct_khuyen_mai ct ON km.MaKM = ct.MaKM
      WHERE km.NgayBatDau <= NOW() AND km.NgayKetThuc >= NOW() 
        AND km.TrangThai = 1
    `);
        return products;
    }
}

export default new PromotionService();
