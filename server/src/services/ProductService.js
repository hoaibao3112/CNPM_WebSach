import pool from '../config/connectDatabase.js';

class ProductService {
    async getAllProducts(filters = {}) {
                const normalizedSearch = typeof filters.search === 'string' ? filters.search.trim() : '';

        let query = `
      SELECT sp.*, ncc.TenNCC, tl.TenTL, tg.TenTG 
      FROM sanpham sp
      LEFT JOIN nhacungcap ncc ON sp.MaNCC = ncc.MaNCC
      LEFT JOIN theloai tl ON sp.MaTL = tl.MaTL
      LEFT JOIN tacgia tg ON sp.MaTG = tg.MaTG
      WHERE 1=1
    `;
        const params = [];

        if (filters.category) {
            query += ' AND sp.MaTL = ?';
            params.push(filters.category);
        }

        if (normalizedSearch) {
            query += `
              AND (
                LOWER(COALESCE(sp.TenSP, '')) LIKE LOWER(?)
                OR LOWER(COALESCE(sp.MoTa, '')) LIKE LOWER(?)
              )
            `;
            params.push(`%${normalizedSearch}%`, `%${normalizedSearch}%`);
        }

        const [products] = await pool.query(query, params);

        if (normalizedSearch && products.length === 0) {
            return this.findProductsByFuzzySearch(normalizedSearch, filters);
        }

        return products;
    }

    async findProductsByFuzzySearch(searchText, filters = {}) {
        let query = `
            SELECT sp.*, ncc.TenNCC, tl.TenTL, tg.TenTG
            FROM sanpham sp
            LEFT JOIN nhacungcap ncc ON sp.MaNCC = ncc.MaNCC
            LEFT JOIN theloai tl ON sp.MaTL = tl.MaTL
            LEFT JOIN tacgia tg ON sp.MaTG = tg.MaTG
            WHERE CAST(COALESCE(sp.TinhTrang, 1) AS UNSIGNED) = 1
        `;

        const params = [];
        if (filters.category) {
            query += ' AND sp.MaTL = ?';
            params.push(filters.category);
        }

        query += ' ORDER BY sp.MaSP DESC LIMIT 500';

        const [candidates] = await pool.query(query, params);
        if (!Array.isArray(candidates) || candidates.length === 0) {
            return [];
        }

        const normalizedKeyword = this.normalizeSearchText(searchText);
        const keywordTokens = normalizedKeyword.split(' ').filter(Boolean);

        const ranked = candidates
            .map((product) => {
                const title = this.normalizeSearchText(product.TenSP || '');
                const description = this.normalizeSearchText(product.MoTa || '');
                const content = `${title} ${description}`.trim();

                if (!content) {
                    return null;
                }

                if (content.includes(normalizedKeyword)) {
                    return { product, score: 0 };
                }

                const titleTokens = title.split(' ').filter(Boolean);
                const contentTokens = content.split(' ').filter(Boolean);
                const allTokens = [...new Set([...titleTokens, ...contentTokens])];

                let matchedCount = 0;
                let distanceScore = 0;

                for (const token of keywordTokens) {
                    let bestDistance = Number.MAX_SAFE_INTEGER;
                    let weakContainsMatch = false;

                    for (const candidateToken of allTokens) {
                        if (!candidateToken) continue;
                        if (candidateToken.includes(token) || token.includes(candidateToken)) {
                            weakContainsMatch = true;
                            bestDistance = Math.min(bestDistance, 0);
                            continue;
                        }

                        const distance = this.levenshteinDistance(token, candidateToken);
                        if (distance < bestDistance) {
                            bestDistance = distance;
                        }
                    }

                    const allowedDistance = Math.max(1, Math.floor(token.length / 3));
                    if (bestDistance <= allowedDistance || weakContainsMatch) {
                        matchedCount += 1;
                        distanceScore += bestDistance;
                    }
                }

                const minimumMatch = Math.max(1, Math.ceil(keywordTokens.length * 0.6));
                if (matchedCount < minimumMatch) {
                    return null;
                }

                return { product, score: distanceScore };
            })
            .filter((item) => item !== null)
            .sort((a, b) => a.score - b.score || b.product.MaSP - a.product.MaSP)
            .slice(0, 100)
            .map((item) => item.product);

        return ranked;
    }

    normalizeSearchText(text) {
        return String(text || '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/đ/g, 'd')
            .replace(/Đ/g, 'd')
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    levenshteinDistance(a, b) {
        const source = a || '';
        const target = b || '';

        if (!source) return target.length;
        if (!target) return source.length;

        const rows = source.length + 1;
        const cols = target.length + 1;
        const matrix = Array.from({ length: rows }, () => new Array(cols).fill(0));

        for (let i = 0; i < rows; i += 1) {
            matrix[i][0] = i;
        }

        for (let j = 0; j < cols; j += 1) {
            matrix[0][j] = j;
        }

        for (let i = 1; i < rows; i += 1) {
            for (let j = 1; j < cols; j += 1) {
                const cost = source[i - 1] === target[j - 1] ? 0 : 1;
                matrix[i][j] = Math.min(
                    matrix[i - 1][j] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j - 1] + cost
                );
            }
        }

        return matrix[rows - 1][cols - 1];
    }

    async getProductById(id) {
        const [[product]] = await pool.query(`
      SELECT sp.*, ncc.TenNCC, tl.TenTL, tg.TenTG 
      FROM sanpham sp
      LEFT JOIN nhacungcap ncc ON sp.MaNCC = ncc.MaNCC
      LEFT JOIN theloai tl ON sp.MaTL = tl.MaTL
      LEFT JOIN tacgia tg ON sp.MaTG = tg.MaTG
      WHERE sp.MaSP = ?
    `, [id]);

        if (!product) throw new Error('Sản phẩm không tồn tại');

        const [galleryRows] = await pool.query(
            `
            SELECT Id, FileName, SortOrder
            FROM sanpham_anh
            WHERE MaSP = ?
            ORDER BY SortOrder ASC, Id ASC
            `,
            [id]
        );

        const images = [];
        const seenFilenames = new Set();

        if (product.HinhAnh) {
            const mainName = String(product.HinhAnh).trim();
            if (mainName) {
                seenFilenames.add(mainName);
                images.push({
                    id: 0,
                    filename: mainName,
                    sortOrder: -1,
                });
            }
        }

        for (const row of galleryRows) {
            const fileName = String(row.FileName || '').trim();
            if (!fileName || seenFilenames.has(fileName)) {
                continue;
            }

            seenFilenames.add(fileName);
            images.push({
                id: row.Id,
                filename: fileName,
                sortOrder: Number(row.SortOrder || 0),
            });
        }

        product.images = images;
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
            SELECT sp.*, ncc.TenNCC, tl.TenTL, tg.TenTG 
            FROM sanpham sp
            LEFT JOIN nhacungcap ncc ON sp.MaNCC = ncc.MaNCC
            LEFT JOIN theloai tl ON sp.MaTL = tl.MaTL
            LEFT JOIN tacgia tg ON sp.MaTG = tg.MaTG
            WHERE sp.SoLuong <= sp.MinSoLuong AND CAST(sp.TinhTrang AS UNSIGNED) = 1
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
            SELECT sp.*, ncc.TenNCC, tl.TenTL, tg.TenTG, sp.DonGia as GiaBan
            FROM sanpham sp
            LEFT JOIN nhacungcap ncc ON sp.MaNCC = ncc.MaNCC
            LEFT JOIN theloai tl ON sp.MaTL = tl.MaTL
            LEFT JOIN tacgia tg ON sp.MaTG = tg.MaTG
            WHERE CAST(sp.TinhTrang AS UNSIGNED) = 1
            ORDER BY ${orderBy}
        `;

        const [products] = await pool.query(query);
        return products;
    }

    async getProductsByCategory(categoryId) {
        const [products] = await pool.query(`
            SELECT sp.*, ncc.TenNCC, tl.TenTL, tg.TenTG, sp.DonGia as GiaBan
            FROM sanpham sp
            LEFT JOIN nhacungcap ncc ON sp.MaNCC = ncc.MaNCC
            LEFT JOIN theloai tl ON sp.MaTL = tl.MaTL
            LEFT JOIN tacgia tg ON sp.MaTG = tg.MaTG
            WHERE sp.MaTL = ? AND CAST(sp.TinhTrang AS UNSIGNED) = 1
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
