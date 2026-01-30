import pool from '../config/connectDatabase.js';

class CartService {
    async getCart(userId) {
        const [cartItems] = await pool.query(`
      SELECT 
        gh.MaSP AS id,
        gh.MaSP,
        sp.TenSP AS name,
        sp.DonGia AS price,
        sp.HinhAnh AS image,
        gh.SoLuong AS quantity
      FROM giohang_chitiet gh
      JOIN sanpham sp ON gh.MaSP = sp.MaSP
      WHERE gh.MaKH = ?
    `, [userId]);
        return cartItems;
    }

    async addToCart(userId, productId, quantity) {
        // Check stock
        const [[product]] = await pool.query('SELECT SoLuong FROM sanpham WHERE MaSP = ?', [productId]);
        if (!product) throw new Error('Sản phẩm không tồn tại');
        if (product.SoLuong < quantity) throw new Error('Sản phẩm đã hết hàng hoặc không đủ số lượng');

        await pool.query(`
      INSERT INTO giohang_chitiet (MaKH, MaSP, SoLuong) 
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE SoLuong = SoLuong + VALUES(SoLuong)
    `, [userId, productId, quantity]);

        return true;
    }

    async updateQuantity(userId, productId, quantity) {
        const [result] = await pool.query(`
      UPDATE giohang_chitiet SET SoLuong = ? 
      WHERE MaKH = ? AND MaSP = ?
    `, [quantity, userId, productId]);

        if (result.affectedRows === 0) throw new Error('Sản phẩm không tồn tại trong giỏ hàng');
        return true;
    }

    async toggleSelection(userId, productId, selected) {
        // Note: giohang_chitiet table does not have Selected column
        // This is a placeholder - frontend should manage selection state
        console.log('⚠️ toggleSelection called but giohang_chitiet has no Selected column');
        return true;
    }

    async removeFromCart(userId, productId) {
        const [result] = await pool.query('DELETE FROM giohang_chitiet WHERE MaKH = ? AND MaSP = ?', [userId, productId]);
        if (result.affectedRows === 0) throw new Error('Sản phẩm không có trong giỏ hàng');
        return true;
    }

    async clearCart(userId) {
        await pool.query('DELETE FROM giohang_chitiet WHERE MaKH = ?', [userId]);
        return true;
    }

    async reorder(userId, orderId) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            const [rows] = await connection.query(`
        SELECT ct.MaSP, ct.SoLuong
        FROM chitiethoadon ct
        JOIN hoadon hd ON ct.MaHD = hd.MaHD
        WHERE ct.MaHD = ? AND hd.makh = ?
      `, [orderId, userId]);

            if (!rows || rows.length === 0) {
                throw new Error('Không tìm thấy đơn hàng hoặc bạn không có quyền mua lại đơn hàng này');
            }

            for (const item of rows) {
                await connection.query(`
          INSERT INTO giohang_chitiet (MaKH, MaSP, SoLuong)
          VALUES (?, ?, ?)
          ON DUPLICATE KEY UPDATE SoLuong = SoLuong + VALUES(SoLuong)
        `, [userId, item.MaSP, item.SoLuong]);
            }

            await connection.commit();
            return rows.length;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    // ===== REORDER FROM PREVIOUS ORDER (with stock checking) =====
    async reorderFromOrder(customerId, orderId) {
        const connection = await pool.getConnection();

        try {
            // Verify order belongs to customer
            const [[order]] = await connection.query(
                'SELECT * FROM hoadon WHERE MaHD = ? AND makh = ?',
                [orderId, customerId]
            );

            if (!order) {
                throw new Error('Không tìm thấy đơn hàng hoặc không có quyền');
            }

            // Get order items
            const [items] = await connection.query(
                `SELECT ct.MaSP, ct.Soluong, sp.SoLuong as stock, sp.TenSP
                 FROM chitiethoadon ct
                 JOIN sanpham sp ON ct.MaSP = sp.MaSP
                 WHERE ct.MaHD = ?`,
                [orderId]
            );

            if (items.length === 0) {
                throw new Error('Đơn hàng không có sản phẩm');
            }

            let addedCount = 0;
            let skippedItems = [];

            for (const item of items) {
                // Check stock availability
                if (item.stock < item.Soluong) {
                    skippedItems.push({
                        productId: item.MaSP,
                        productName: item.TenSP,
                        reason: 'Không đủ hàng'
                    });
                    continue;
                }

                // Add to cart or update quantity
                const [[existing]] = await connection.query(
                    'SELECT * FROM giohang_chitiet WHERE MaKH = ? AND MaSP = ?',
                    [customerId, item.MaSP]
                );

                if (existing) {
                    const newQty = existing.SoLuong + item.Soluong;
                    if (newQty > item.stock) {
                        skippedItems.push({
                            productId: item.MaSP,
                            productName: item.TenSP,
                            reason: `Vượt quá tồn kho (${item.stock})`
                        });
                        continue;
                    }

                    await connection.query(
                        'UPDATE giohang_chitiet SET SoLuong = ? WHERE MaKH = ? AND MaSP = ?',
                        [newQty, customerId, item.MaSP]
                    );
                } else {
                    await connection.query(
                        'INSERT INTO giohang_chitiet (MaKH, MaSP, SoLuong) VALUES (?, ?, ?)',
                        [customerId, item.MaSP, item.Soluong]
                    );
                }
                addedCount++;
            }

            console.log(`✅ Reorder: Added ${addedCount} items, skipped ${skippedItems.length}`);

            return {
                success: true,
                addedCount,
                skippedCount: skippedItems.length,
                skippedItems
            };

        } catch (error) {
            console.error('❌ Reorder error:', error);
            throw error;
        } finally {
            connection.release();
        }
    }
}

export default new CartService();
