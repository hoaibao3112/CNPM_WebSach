import pool from '../config/connectDatabase.js';

class AccountService {
    async getAllAccounts() {
        const [accounts] = await pool.query('SELECT * FROM taikhoan');
        return accounts.map(acc => ({
            ...acc,
            TinhTrang: Buffer.isBuffer(acc.TinhTrang) ? acc.TinhTrang[0] : acc.TinhTrang
        }));
    }

    async getAccountById(id) {
        const [rows] = await pool.query('SELECT * FROM taikhoan WHERE MaTK = ?', [id]);
        if (rows.length === 0) throw new Error('Không tìm thấy tài khoản');
        return rows[0];
    }

    async createAccount(data) {
        const { TenTK, MatKhau, MaQuyen, NgayTao, TinhTrang } = data;
        const [quyenCheck] = await pool.query('SELECT MaNQ FROM nhomquyen WHERE MaNQ = ? AND TinhTrang = 1', [MaQuyen]);
        if (quyenCheck.length === 0) throw new Error('Quyền không hợp lệ hoặc đã bị vô hiệu hóa');

        const [result] = await pool.query(
            'INSERT INTO taikhoan (TenTK, MatKhau, MaQuyen, NgayTao, TinhTrang) VALUES (?, ?, ?, ?, ?)',
            [TenTK, MatKhau, MaQuyen, NgayTao, TinhTrang ? 1 : 0]
        );
        return result.insertId;
    }

    async updateAccount(id, data) {
        const { TenTK, MatKhau, MaQuyen, TinhTrang } = data;
        const [quyenCheck] = await pool.query('SELECT MaNQ FROM nhomquyen WHERE MaNQ = ? AND TinhTrang = 1', [MaQuyen]);
        if (quyenCheck.length === 0) throw new Error('Quyền không hợp lệ hoặc đã bị vô hiệu hóa');

        const [result] = await pool.query(
            'UPDATE taikhoan SET TenTK = ?, MatKhau = ?, MaQuyen = ?, TinhTrang = ? WHERE MaTK = ?',
            [TenTK, MatKhau, MaQuyen, TinhTrang ? 1 : 0, id]
        );
        if (result.affectedRows === 0) throw new Error('Không tìm thấy tài khoản để cập nhật');
        return true;
    }

    async deleteAccount(id) {
        const [result] = await pool.query('DELETE FROM taikhoan WHERE MaTK = ?', [id]);
        if (result.affectedRows === 0) throw new Error('Không tìm thấy tài khoản để xóa');
        return true;
    }

    async changePassword(userId, oldPassword, newPassword) {
        const [accounts] = await pool.query('SELECT * FROM taikhoan WHERE MaTK = ?', [userId]);
        if (accounts.length === 0) throw new Error('Không tìm thấy tài khoản');

        if (accounts[0].MatKhau !== oldPassword) throw new Error('Mật khẩu cũ không đúng');

        await pool.query('UPDATE taikhoan SET MatKhau = ? WHERE MaTK = ?', [newPassword, userId]);
        return true;
    }

    // Employee logic
    async getAllEmployees() {
        const [employees] = await pool.query('SELECT * FROM nhanvien');
        return employees;
    }

    async getEmployeeById(id) {
        const [rows] = await pool.query('SELECT * FROM nhanvien WHERE MaNV = ?', [id]);
        if (rows.length === 0) throw new Error('Không tìm thấy nhân viên');
        return rows[0];
    }

    async createEmployee(data) {
        const { MaNV, TenNV, SDT, GioiTinh, DiaChi, Email, TinhTrang, Anh } = data;
        await pool.query(
            'INSERT INTO nhanvien (MaNV, TenNV, SDT, GioiTinh, DiaChi, Email, TinhTrang, Anh) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [MaNV, TenNV, SDT, GioiTinh, DiaChi, Email, TinhTrang, Anh]
        );
        return MaNV;
    }

    async updateEmployee(id, data) {
        const [rows] = await pool.query('SELECT * FROM nhanvien WHERE MaNV = ?', [id]);
        if (rows.length === 0) throw new Error('Không tìm thấy nhân viên để cập nhật');
        const existing = rows[0];

        const merged = {
            TenNV: data.TenNV ?? existing.TenNV,
            SDT: data.SDT ?? existing.SDT,
            GioiTinh: data.GioiTinh ?? existing.GioiTinh,
            DiaChi: data.DiaChi ?? existing.DiaChi,
            Email: data.Email ?? existing.Email,
            TinhTrang: data.TinhTrang ?? existing.TinhTrang,
            Anh: data.Anh ?? existing.Anh
        };

        const [result] = await pool.query(
            'UPDATE nhanvien SET TenNV = ?, SDT = ?, GioiTinh = ?, DiaChi = ?, Email = ?, TinhTrang = ?, Anh = ? WHERE MaNV = ?',
            [merged.TenNV, merged.SDT, merged.GioiTinh, merged.DiaChi, merged.Email, merged.TinhTrang, merged.Anh, id]
        );
        return result.affectedRows > 0;
    }

    async deleteEmployee(id) {
        const [rows] = await pool.query('SELECT Anh FROM nhanvien WHERE MaNV = ?', [id]);
        if (rows.length === 0) throw new Error('Không tìm thấy nhân viên để xóa');

        const image = rows[0].Anh;
        await pool.query('DELETE FROM nhanvien WHERE MaNV = ?', [id]);
        return image;
    }

    async getProfile(maTK) {
        const [userInfo] = await pool.query(
            `SELECT tk.*, nv.TenNV, nv.SDT, nv.GioiTinh, nv.DiaChi, nv.Email, nv.Anh, nq.TenNQ
       FROM taikhoan tk
       LEFT JOIN nhanvien nv ON tk.MaTK = nv.MaNV
       LEFT JOIN nhomquyen nq ON tk.MaQuyen = nq.MaNQ
       WHERE tk.MaTK = ?`,
            [maTK]
        );
        if (userInfo.length === 0) throw new Error('Không tìm thấy thông tin người dùng');
        return userInfo[0];
    }
}

export default new AccountService();
