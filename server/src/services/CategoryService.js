import pool from '../config/connectDatabase.js';

class CategoryService {
    async getAllCategories() {
        const [categories] = await pool.query('SELECT * FROM theloai');
        return categories;
    }

    async getCategoryById(id) {
        const [[category]] = await pool.query('SELECT * FROM theloai WHERE MaTL = ?', [id]);
        if (!category) throw new Error('Thể loại không tồn tại');
        return category;
    }

    async createCategory(data) {
        const { TenTL } = data;
        const [result] = await pool.query('INSERT INTO theloai (TenTL, TinhTrang) VALUES (?, 1)', [TenTL]);
        return result.insertId;
    }

    async updateCategory(id, data) {
        const { TenTL, TinhTrang } = data;
        const [result] = await pool.query(
            'UPDATE theloai SET TenTL = ?, TinhTrang = ? WHERE MaTL = ?',
            [TenTL, TinhTrang, id]
        );
        if (result.affectedRows === 0) throw new Error('Thể loại không tồn tại');
        return true;
    }

    async deleteCategory(id) {
        // Soft delete
        const [result] = await pool.query('UPDATE theloai SET TinhTrang = 0 WHERE MaTL = ?', [id]);
        if (result.affectedRows === 0) throw new Error('Thể loại không tồn tại');
        return true;
    }
}

export default new CategoryService();
