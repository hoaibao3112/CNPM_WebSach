import pool from '../config/connectDatabase.js';

class CustomerService {
    async getProfile(makh) {
        const [[user]] = await pool.query(
            'SELECT makh, tenkh, email, sdt, diachi, loyalty_points, loyalty_tier FROM khachhang WHERE makh = ?',
            [makh]
        );
        if (!user) throw new Error('Người dùng không tồn tại');
        return user;
    }

    async updateProfile(makh, data) {
        const { tenkh, sdt, email } = data;
        const [result] = await pool.query(
            'UPDATE khachhang SET tenkh = ?, sdt = ?, email = ? WHERE makh = ?',
            [tenkh, sdt || null, email || null, makh]
        );
        return result.affectedRows > 0;
    }

    async getPromoUsage(makh) {
        const [usedRows] = await pool.query(
            'SELECT COUNT(*) AS usedCount FROM khachhang_khuyenmai WHERE makh = ? AND trang_thai = ?',
            [makh, 'Da_su_dung']
        );
        const [totalRows] = await pool.query(
            'SELECT COUNT(*) AS totalClaimed FROM khachhang_khuyenmai WHERE makh = ?',
            [makh]
        );
        return {
            usedCount: usedRows[0]?.usedCount || 0,
            totalClaimed: totalRows[0]?.totalClaimed || 0
        };
    }

    async getPromoList(makh) {
        const [rows] = await pool.query(
            `SELECT kk.makm, k.TenKM, k.Code, k.MoTa, k.LoaiKM, k.NgayBatDau, k.NgayKetThuc,
                    kk.ngay_lay, kk.trang_thai AS claim_trang_thai,
                    GROUP_CONCAT(DISTINCT CONCAT(s.MaSP, '::', s.TenSP) SEPARATOR '||') AS products
             FROM khachhang_khuyenmai kk
             JOIN khuyen_mai k ON kk.makm = k.MaKM
             LEFT JOIN sp_khuyen_mai sp ON sp.MaKM = k.MaKM
             LEFT JOIN sanpham s ON sp.MaSP = s.MaSP
             WHERE kk.makh = ?
             GROUP BY kk.makm, kk.ngay_lay, kk.trang_thai, k.TenKM, k.Code, k.MoTa, k.LoaiKM, k.NgayBatDau, k.NgayKetThuc`,
            [makh]
        );

        return rows.map((r) => ({
            ...r,
            products: r.products ? r.products.split('||').map(p => {
                const [MaSP, TenSP] = p.split('::');
                return { MaSP, TenSP };
            }) : []
        }));
    }

    async logActivity(makh, type, data) {
        const { masanpham, query } = data;
        const sql = "INSERT INTO hanh_dong_user (makhachhang, loaihanhdong, masanpham, search_query) VALUES (?, ?, ?, ?)";
        await pool.query(sql, [makh || null, type, masanpham || null, query || null]);
        return true;
    }
}

export default new CustomerService();
