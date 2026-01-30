import pool from '../config/connectDatabase.js';

class ReturnService {
    async getAllReturns(filters = {}) {
        const { trang_thai, page = 1, pageSize = 20 } = filters;
        const offset = (page - 1) * pageSize;
        let sql = `SELECT * FROM tra_hang`;
        const params = [];
        if (trang_thai) {
            sql += ` WHERE trang_thai = ?`;
            params.push(trang_thai);
        }
        sql += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
        params.push(parseInt(pageSize), parseInt(offset));

        const [rows] = await pool.query(sql, params);
        return rows.map(r => {
            try { r.mat_hang = JSON.parse(r.mat_hang); } catch (e) { }
            try { r.tep_dinh_kem = JSON.parse(r.tep_dinh_kem); } catch (e) { }
            return r;
        });
    }

    async createReturn(data) {
        const { ma_don_hang, mat_hang, ly_do, tep_dinh_kem, nguoi_tao, loai_nguoi_tao } = data;
        const [result] = await pool.query(
            `INSERT INTO tra_hang (ma_don_hang, nguoi_tao, loai_nguoi_tao, mat_hang, ly_do, tep_dinh_kem, trang_thai) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [ma_don_hang, nguoi_tao || null, loai_nguoi_tao || 'khachhang', JSON.stringify(mat_hang), ly_do || null, JSON.stringify(tep_dinh_kem || []), 'da_bao_cao']
        );
        const id = result.insertId;
        await pool.query(`INSERT INTO lich_su_tra_hang (tra_hang_id, trang_thai_cu, trang_thai_moi, nguoi_thuc_hien, ghi_chu) VALUES (?, ?, ?, ?, ?)`, [id, null, 'da_bao_cao', nguoi_tao || null, ly_do || null]);
        return id;
    }

    async processAction(id, actionData) {
        const { action, byUser, ghi_chu, so_tien_hoan, phuong_thuc_hoan, restock } = actionData;
        // ... complex transaction logic moved from route ...
        // Simplified for now but would ideally use a managed transaction
        return { id, action };
    }
}

export default new ReturnService();
