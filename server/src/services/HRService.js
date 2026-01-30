import pool from '../config/connectDatabase.js';

class HRService {
    // --- Attendance (cham_cong) ---
    async getAttendance(filters = {}) {
        const { MaTK, thang, nam } = filters;
        let sql = 'SELECT * FROM cham_cong WHERE 1=1';
        const params = [];
        if (MaTK) { sql += ' AND MaTK = ?'; params.push(MaTK); }
        if (thang) { sql += ' AND MONTH(ngay) = ?'; params.push(thang); }
        if (nam) { sql += ' AND YEAR(ngay) = ?'; params.push(nam); }
        sql += ' ORDER BY ngay DESC';
        const [rows] = await pool.query(sql, params);
        return rows;
    }

    async markAttendance(data) {
        const { MaTK, ngay, gio_vao, gio_ra, trang_thai, ghi_chu } = data;
        const [existing] = await pool.query('SELECT id FROM cham_cong WHERE MaTK = ? AND ngay = ?', [MaTK, ngay]);
        if (existing.length > 0) throw new Error('Bạn đã chấm công hôm nay rồi!');

        await pool.query(
            `INSERT INTO cham_cong (MaTK, ngay, gio_vao, gio_ra, trang_thai, ghi_chu) VALUES (?, ?, ?, ?, ?, ?)`,
            [MaTK, ngay, gio_vao || null, gio_ra || null, trang_thai || 'Di_lam', ghi_chu || null]
        );
        return true;
    }

    // --- Leave (xin_nghi_phep) ---
    async getAllLeaves() {
        const [rows] = await pool.query('SELECT * FROM xin_nghi_phep');
        return rows;
    }

    async createLeaveRequest(data) {
        const { MaTK, ngay_bat_dau, ngay_ket_thuc, ly_do } = data;
        await pool.query(
            `INSERT INTO xin_nghi_phep (MaTK, ngay_bat_dau, ngay_ket_thuc, ly_do, trang_thai) VALUES (?, ?, ?, ?, 'Cho_duyet')`,
            [MaTK, ngay_bat_dau, ngay_ket_thuc, ly_do]
        );
        return true;
    }

    async updateLeaveStatus(id, status, reviewer) {
        await pool.query(
            `UPDATE xin_nghi_phep SET trang_thai = ?, nguoi_duyet = ?, ngay_duyet = NOW() WHERE id = ?`,
            [status, reviewer, id]
        );
        return true;
    }
}

export default new HRService();
