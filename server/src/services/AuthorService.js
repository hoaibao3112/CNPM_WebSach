import pool from '../config/connectDatabase.js';

class AuthorService {
    async getAllAuthors(filters = {}) {
        const { page = 1, limit = 10, search = '' } = filters;
        const offset = (page - 1) * limit;
        const searchTerm = `%${search}%`;

        const [authors] = await pool.query(
            `SELECT * FROM tacgia 
       WHERE TenTG LIKE ? OR QuocTich LIKE ?
       ORDER BY MaTG DESC
       LIMIT ? OFFSET ?`,
            [searchTerm, searchTerm, parseInt(limit), parseInt(offset)]
        );

        const [[{ total }]] = await pool.query(
            `SELECT COUNT(*) as total FROM tacgia
       WHERE TenTG LIKE ? OR QuocTich LIKE ?`,
            [searchTerm, searchTerm]
        );

        return {
            data: authors,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    async getAuthorById(id) {
        const [[author]] = await pool.query('SELECT * FROM tacgia WHERE MaTG = ?', [id]);
        if (!author) throw new Error('Không tìm thấy tác giả');

        const authorName = (author.TenTG || '').trim();
        const [books] = await pool.query(`
      SELECT sp.MaSP, sp.TenSP, sp.HinhAnh, sp.MaTG
      FROM sanpham AS sp
      LEFT JOIN tacgia tg ON sp.MaTG = tg.MaTG
      WHERE sp.MaTG = ?
         OR (tg.TenTG IS NOT NULL AND LOWER(TRIM(tg.TenTG)) = LOWER(?))
    `, [id, authorName]);

        return { ...author, books: books || [] };
    }

    async createAuthor(data) {
        const { tenTG, ngaySinh, quocTich, tieuSu, anhTG } = data;
        const [{ insertId }] = await pool.query(
            `INSERT INTO tacgia (TenTG, NgaySinh, QuocTich, TieuSu, AnhTG) VALUES (?, ?, ?, ?, ?)`,
            [tenTG.trim(), ngaySinh || null, quocTich || null, tieuSu || null, anhTG || null]
        );
        return this.getAuthorById(insertId);
    }

    async updateAuthor(id, data) {
        const fields = [];
        const values = [];

        const fieldMap = {
            tenTG: 'TenTG',
            ngaySinh: 'NgaySinh',
            quocTich: 'QuocTich',
            tieuSu: 'TieuSu',
            anhTG: 'AnhTG'
        };

        for (const [key, dbField] of Object.entries(fieldMap)) {
            if (data[key] !== undefined) {
                fields.push(`${dbField} = ?`);
                values.push(typeof data[key] === 'string' ? data[key].trim() : data[key]);
            }
        }

        if (fields.length === 0) throw new Error('Không có trường hợp lệ để cập nhật');

        values.push(id);
        const [result] = await pool.query(`UPDATE tacgia SET ${fields.join(', ')} WHERE MaTG = ?`, values);
        if (result.affectedRows === 0) throw new Error('Không tìm thấy tác giả');

        return this.getAuthorById(id);
    }

    async deleteAuthor(id) {
        const [[existing]] = await pool.query('SELECT * FROM tacgia WHERE MaTG = ?', [id]);
        if (!existing) throw new Error('Không tìm thấy tác giả');

        try {
            await pool.query('DELETE FROM tacgia WHERE MaTG = ?', [id]);
            return existing;
        } catch (error) {
            if (error.code === 'ER_ROW_IS_REFERENCED_2') {
                throw new Error('Tác giả đang được tham chiếu trong bảng sản phẩm');
            }
            throw error;
        }
    }

    async getNationalities() {
        const [rows] = await pool.query(
            `SELECT DISTINCT QuocTich 
       FROM tacgia 
       WHERE QuocTich IS NOT NULL AND QuocTich != ''
       ORDER BY QuocTich ASC`
        );
        return rows.map(row => row.QuocTich);
    }
}

export default new AuthorService();
