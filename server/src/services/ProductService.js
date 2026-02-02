import pool from '../config/connectDatabase.js';

class ProductService {
    async getAllProducts(filters = {}) {
        let query = `
      SELECT sp.*, ncc.TenNCC, tl.TenTL 
      FROM sanpham sp
      LEFT JOIN nhacungcap ncc ON sp.MaNCC = ncc.MaNCC
      LEFT JOIN theloai tl ON sp.MaTL = tl.MaTL
      WHERE 1=1
    `;
        const params = [];

        if (filters.category) {
            query += ' AND sp.MaTL = ?';
            params.push(filters.category);
        }

        if (filters.search) {
            query += ' AND (sp.TenSP LIKE ? OR sp.MoTa LIKE ?)';
            params.push(`%${filters.search}%`, `%${filters.search}%`);
        }

        const [products] = await pool.query(query, params);
        return products;
    }

    async getProductById(id) {
        const [[product]] = await pool.query(`
      SELECT sp.*, ncc.TenNCC, tl.TenTL 
      FROM sanpham sp
      LEFT JOIN nhacungcap ncc ON sp.MaNCC = ncc.MaNCC
      LEFT JOIN theloai tl ON sp.MaTL = tl.MaTL
      WHERE sp.MaSP = ?
    `, [id]);

        if (!product) throw new Error('Sản phẩm không tồn tại');
        return product;
    }

    async createProduct(productData) {
        const {
            TenSP, DonGia, SoLuong, MoTa, HinhAnh, MaTL, MaNCC,
            NamXB, MaTG, MinSoLuong, TrongLuong, KichThuoc, SoTrang, HinhThuc
        } = productData;
        const [result] = await pool.query(
            `INSERT INTO sanpham (
                TenSP, DonGia, SoLuong, MoTa, HinhAnh, MaTL, MaNCC, 
                NamXB, MaTG, MinSoLuong, TrongLuong, KichThuoc, SoTrang, HinhThuc, TinhTrang
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
            [
                TenSP, DonGia, SoLuong, MoTa, HinhAnh, MaTL, MaNCC,
                NamXB, MaTG, MinSoLuong || 0, TrongLuong || null,
                KichThuoc || null, SoTrang || null, HinhThuc || null
            ]
        );
        return result.insertId;
    }

    async updateProduct(id, productData) {
        const {
            TenSP, DonGia, SoLuong, MoTa, HinhAnh, MaTL, MaNCC,
            NamXB, MaTG, MinSoLuong, TrongLuong, KichThuoc, SoTrang, HinhThuc, TinhTrang
        } = productData;

        const [result] = await pool.query(
            `UPDATE sanpham SET 
                TenSP=?, DonGia=?, SoLuong=?, MoTa=?, HinhAnh=?, MaTL=?, MaNCC=?, 
                NamXB=?, MaTG=?, MinSoLuong=?, TrongLuong=?, KichThuoc=?, SoTrang=?, HinhThuc=?, TinhTrang=?
            WHERE MaSP=?`,
            [
                TenSP, DonGia, SoLuong, MoTa, HinhAnh, MaTL, MaNCC,
                NamXB, MaTG, MinSoLuong, TrongLuong, KichThuoc, SoTrang, HinhThuc, TinhTrang, id
            ]
        );
        if (result.affectedRows === 0) throw new Error('Sản phẩm không tồn tại');
        return true;
    }

    async deleteProduct(id) {
        const [result] = await pool.query('UPDATE sanpham SET TinhTrang = 0 WHERE MaSP = ?', [id]);
        if (result.affectedRows === 0) throw new Error('Sản phẩm không tồn tại');
        return true;
    }

    async getLowStockProducts() {
        const [products] = await pool.query(`
            SELECT sp.*, ncc.TenNCC, tl.TenTL 
            FROM sanpham sp
            LEFT JOIN nhacungcap ncc ON sp.MaNCC = ncc.MaNCC
            LEFT JOIN theloai tl ON sp.MaTL = tl.MaTL
            WHERE sp.SoLuong <= sp.MinSoLuong AND sp.TinhTrang = 1
        `);
        return products;
    }

    async getSortedProducts(type) {
        let orderBy = 'sp.MaSP DESC'; // Default: newest first (higher ID = newer)

        switch (type) {
            case 'new':
                orderBy = 'sp.MaSP DESC';
                break;
            case 'price-asc':
                orderBy = 'sp.DonGia ASC';
                break;
            case 'price-desc':
                orderBy = 'sp.DonGia DESC';
                break;
            case 'name-asc':
                orderBy = 'sp.TenSP ASC';
                break;
            case 'name-desc':
                orderBy = 'sp.TenSP DESC';
                break;
            case 'promotion':
                // For now, just return newest products
                // TODO: Join with khuyenmai table to get actual promotions
                orderBy = 'sp.MaSP DESC';
                break;
            case 'year':
                orderBy = 'sp.NamXB DESC';
                break;
            default:
                orderBy = 'sp.MaSP DESC';
        }

        const query = `
            SELECT sp.*, ncc.TenNCC, tl.TenTL, sp.DonGia as GiaBan
            FROM sanpham sp
            LEFT JOIN nhacungcap ncc ON sp.MaNCC = ncc.MaNCC
            LEFT JOIN theloai tl ON sp.MaTL = tl.MaTL
            WHERE sp.TinhTrang = 1
            ORDER BY ${orderBy}
        `;

        const [products] = await pool.query(query);
        return products;
    }

    async getProductsByCategory(categoryId) {
        const [products] = await pool.query(`
            SELECT sp.*, ncc.TenNCC, tl.TenTL, sp.DonGia as GiaBan
            FROM sanpham sp
            LEFT JOIN nhacungcap ncc ON sp.MaNCC = ncc.MaNCC
            LEFT JOIN theloai tl ON sp.MaTL = tl.MaTL
            WHERE sp.MaTL = ? AND sp.TinhTrang = 1
            ORDER BY sp.MaSP DESC
        `, [categoryId]);
        return products;
    }

    async getRecommendations(filters = {}) {
        // Return latest products as recommendations for now
        return this.getSortedProducts('year');
    }
    async updateMinStock(id, minStock) {
        const [result] = await pool.query(
            'UPDATE sanpham SET MinSoLuong = ? WHERE MaSP = ?',
            [minStock, id]
        );
        if (result.affectedRows === 0) throw new Error('Sản phẩm không tồn tại');
        return true;
    }
}

export default new ProductService();
