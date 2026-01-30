import pool from '../config/connectDatabase.js';

class FAQService {
    async getAllFAQs(filters = {}) {
        const { category, keyword } = filters;
        let query = 'SELECT * FROM faqs';
        const queryParams = [];

        if (category) {
            query += ' WHERE category = ?';
            queryParams.push(category);
        } else if (keyword) {
            const words = keyword.toLowerCase().split(/\s+/).filter(w => w.length > 0);
            if (words.length > 0) {
                let where = ' WHERE (';
                words.forEach((w, i) => {
                    if (i > 0) where += ' OR ';
                    where += 'LOWER(question) LIKE ?';
                    queryParams.push(`%${w}%`);
                });
                where += ') OR (';
                words.forEach((w, i) => {
                    if (i > 0) where += ' OR ';
                    where += 'LOWER(keywords) LIKE ?';
                    queryParams.push(`%"${w}"%`);
                });
                where += ')';
                query += where;
            }
        }

        const [faqs] = await pool.query(query, queryParams);
        return faqs;
    }

    async createFAQ(data) {
        const { question, answer, category, keywords } = data;
        await pool.query(
            'INSERT INTO faqs (question, answer, category, keywords) VALUES (?, ?, ?, ?)',
            [question, answer, category || null, keywords ? JSON.stringify(keywords) : null]
        );
        return true;
    }

    async updateFAQ(id, data) {
        const { question, answer, category, keywords } = data;
        await pool.query(
            'UPDATE faqs SET question = ?, answer = ?, category = ?, keywords = ? WHERE id = ?',
            [question, answer, category || null, keywords ? JSON.stringify(keywords) : null, id]
        );
        return true;
    }

    async deleteFAQ(id) {
        await pool.query('DELETE FROM faqs WHERE id = ?', [id]);
        return true;
    }
}

export default new FAQService();
