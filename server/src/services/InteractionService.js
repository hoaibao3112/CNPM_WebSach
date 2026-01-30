import pool from '../config/connectDatabase.js';

class InteractionService {
    // --- Ratings ---
    async getRatingsByProduct(productId) {
        const [ratings] = await pool.query(
            `SELECT dg.MaDG, dg.SoSao, dg.NhanXet, dg.NgayDanhGia, kh.TenKH 
       FROM danhgia dg 
       JOIN khachhang kh ON dg.MaKH = kh.MaKH 
       WHERE dg.MaSP = ? 
       ORDER BY dg.NgayDanhGia DESC`,
            [productId]
        );

        const averageRating = ratings.length > 0
            ? (ratings.reduce((sum, r) => sum + r.SoSao, 0) / ratings.length).toFixed(1)
            : 0;

        return {
            ratings,
            averageRating: parseFloat(averageRating),
            totalRatings: ratings.length
        };
    }

    async addRating(data) {
        const { masp, makh, sosao, nhanxet } = data;
        const [result] = await pool.query(
            `INSERT INTO pending_danhgia (MaSP, MaKH, SoSao, NhanXet) VALUES (?, ?, ?, ?)`,
            [masp, makh, sosao, nhanxet || null]
        );
        return result.insertId;
    }

    // --- Comments ---
    async getCommentsByProduct(masp, filters = {}) {
        const { page = 1, limit = 10 } = filters;
        const offset = (page - 1) * limit;

        const [comments] = await pool.query(
            `SELECT bl.*, kh.tenkh, 
              (SELECT COUNT(*) FROM binhluan_like WHERE mabl = bl.mabl) as like_count,
              (SELECT COUNT(*) FROM binhluan WHERE mabl_cha = bl.mabl) as reply_count
       FROM binhluan bl 
       JOIN khachhang kh ON bl.makh = kh.makh 
       WHERE bl.masp = ? AND bl.mabl_cha IS NULL AND bl.trangthai = 'Hiển thị' 
       ORDER BY bl.ngaybinhluan DESC 
       LIMIT ? OFFSET ?`,
            [masp, parseInt(limit), parseInt(offset)]
        );

        for (let comment of comments) {
            const [replies] = await pool.query(
                `SELECT bl.*, kh.tenkh,
                (SELECT COUNT(*) FROM binhluan_like WHERE mabl = bl.mabl) as like_count
         FROM binhluan bl 
         JOIN khachhang kh ON bl.makh = kh.makh 
         WHERE bl.mabl_cha = ? AND bl.trangthai = 'Hiển thị' 
         ORDER BY bl.ngaybinhluan ASC`,
                [comment.mabl]
            );
            comment.replies = replies;
        }

        const [[{ total }]] = await pool.query(
            `SELECT COUNT(*) as total FROM binhluan WHERE masp = ? AND mabl_cha IS NULL AND trangthai = 'Hiển thị'`,
            [masp]
        );

        return { comments, total, page, limit, totalPages: Math.ceil(total / limit) };
    }

    // --- Favorites ---
    async addFavorite(makh, masp) {
        await pool.query(`INSERT IGNORE INTO sanpham_yeuthich (makh, MaSP) VALUES (?, ?)`, [makh, masp]);
        return true;
    }

    async removeFavorite(makh, masp) {
        await pool.query(`DELETE FROM sanpham_yeuthich WHERE makh = ? AND MaSP = ?`, [makh, masp]);
        return true;
    }

    async getFavorites(makh, filters = {}) {
        const { page = 1, limit = 20 } = filters;
        const offset = (page - 1) * limit;

        const [favorites] = await pool.query(
            `SELECT sp.*, tl.TenTL, tg.TenTG, f.NgayThem
       FROM sanpham_yeuthich f
       JOIN sanpham sp ON f.MaSP = sp.MaSP
       LEFT JOIN theloai tl ON sp.MaTL = tl.MaTL
       LEFT JOIN tacgia tg ON sp.MaTG = tg.MaTG
       WHERE f.makh = ?
       ORDER BY f.NgayThem DESC
       LIMIT ? OFFSET ?`,
            [makh, parseInt(limit), offset]
        );

        const [[{ total }]] = await pool.query(`SELECT COUNT(*) as total FROM sanpham_yeuthich WHERE makh = ?`, [makh]);
        return { favorites, total, page, limit };
    }
}

export default new InteractionService();
