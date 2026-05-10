import PromotionService from '../services/PromotionService.js';
import baseController from './baseController.js';

class PromotionController {
    // Promotion Handlers
    async getAllPromotions(req, res) {
        try {
            const result = await PromotionService.getAllPromotions(req.query);
            return baseController.sendSuccess(res, result);
        } catch (error) {
            return baseController.sendError(res, 'Lỗi khi lấy danh sách khuyến mãi', 500, error.message);
        }
    }

    async getPromotionById(req, res) {
        try {
            const promotion = await PromotionService.getPromotionById(req.params.makm);
            return baseController.sendSuccess(res, promotion);
        } catch (error) {
            return baseController.sendError(res, error.message, 404);
        }
    }

    async createPromotion(req, res) {
        try {
            const makm = await PromotionService.createPromotion(req.body);
            return baseController.sendSuccess(res, { makm }, 'Thêm khuyến mãi thành công', 201);
        } catch (error) {
            return baseController.sendError(res, 'Lỗi khi thêm khuyến mãi', 500, error.message);
        }
    }

    async updatePromotion(req, res) {
        try {
            await PromotionService.updatePromotion(req.params.makm, req.body);
            return baseController.sendSuccess(res, null, 'Cập nhật khuyến mãi thành công');
        } catch (error) {
            return baseController.sendError(res, 'Lỗi khi cập nhật khuyến mãi', 500, error.message);
        }
    }

    async deletePromotion(req, res) {
        try {
            await PromotionService.deletePromotion(req.params.makm);
            return baseController.sendSuccess(res, null, 'Xóa khuyến mãi thành công');
        } catch (error) {
            return baseController.sendError(res, 'Lỗi khi xóa khuyến mãi', 500, error.message);
        }
    }

    // Coupon Handlers
    async getMyCoupons(req, res) {
        try {
            const makh = req.user?.makh || req.query.makh;
            if (!makh) return baseController.sendError(res, 'Thiếu thông tin khách hàng', 400);
            const coupons = await PromotionService.getMyCoupons(makh);
            return baseController.sendSuccess(res, coupons);
        } catch (error) {
            return baseController.sendError(res, 'Lỗi khi lấy danh sách coupon', 500, error.message);
        }
    }

    // Voucher Handlers
    async getAllVouchers(req, res) {
        try {
            const vouchers = await PromotionService.getAllVouchers();
            return baseController.sendSuccess(res, vouchers);
        } catch (error) {
            return baseController.sendError(res, 'Lỗi khi lấy danh sách voucher', 500, error.message);
        }
    }

    async getActiveProducts(req, res) {
        try {
            const products = await PromotionService.getActiveProducts();
            return baseController.sendSuccess(res, products);
        } catch (error) {
            return baseController.sendError(res, 'Lỗi khi lấy sản phẩm khuyến mãi', 500, error.message);
        }
    }

    async getPromotionsByProduct(req, res) {
        try {
            const masp = req.params.masp;
            const promotions = await PromotionService.getPromotionsByProductId(masp);
            return baseController.sendSuccess(res, promotions);
        } catch (error) {
            return baseController.sendError(res, 'Lỗi khi lấy khuyến mãi của sản phẩm', 500, error.message);
        }
    }

    async applyToCart(req, res) {
        try {
            const { code, cartItems, makh } = req.body;
            if (!code || !cartItems || !cartItems.length) {
                return res.status(400).json({ success: false, error: 'Thiếu thông tin mã hoặc giỏ hàng' });
            }

            // Lấy thông tin khuyến mãi dựa trên code
            const promoInfo = await PromotionService.getPromotionByCode(code);
            if (!promoInfo) {
                return res.status(404).json({ success: false, error: 'Mã khuyến mãi không tồn tại' });
            }
            
            // Lấy chi tiết thông tin áp dụng sản phẩm
            const fullPromo = await PromotionService.getPromotionById(promoInfo.MaKM);
            
            // Tính toán tổng đơn
            let total = 0;
            let eligibleTotal = 0;
            const appliedProducts = [];

            const isSpecificProducts = fullPromo.SanPhamApDung && fullPromo.SanPhamApDung.length > 0;
            const eligibleProductIds = isSpecificProducts ? fullPromo.SanPhamApDung.map(p => String(p.MaSP)) : [];

            for (const item of cartItems) {
                const itemTotal = item.DonGia * item.SoLuong;
                total += itemTotal;
                
                // Nếu áp dụng toàn bộ HOẶC sản phẩm nằm trong danh sách áp dụng
                if (!isSpecificProducts || eligibleProductIds.includes(String(item.MaSP))) {
                    eligibleTotal += itemTotal;
                    appliedProducts.push(String(item.MaSP));
                }
            }

            // Kiểm tra điều kiện đơn tối thiểu
            if (fullPromo.GiaTriDonToiThieu && total < fullPromo.GiaTriDonToiThieu) {
                return res.status(403).json({ success: false, error: `Đơn hàng tối thiểu phải từ ${fullPromo.GiaTriDonToiThieu.toLocaleString()}đ để áp dụng mã` });
            }

            // Nếu không có sản phẩm nào hợp lệ
            if (eligibleTotal === 0 && fullPromo.LoaiKM !== 'free_ship') {
                return res.status(402).json({ success: false, error: 'Không có sản phẩm nào trong giỏ được áp dụng mã này' });
            }

            // Tính discount
            let totalDiscount = 0;
            if (fullPromo.LoaiKM === 'free_ship') {
                // Free ship
                totalDiscount = fullPromo.GiaTriGiam || 30000;
            } else {
                // Giảm giá % hoặc số tiền
                if (fullPromo.GiaTriGiam <= 100) {
                    // Phần trăm
                    totalDiscount = eligibleTotal * (fullPromo.GiaTriGiam / 100);
                } else {
                    // Số tiền cố định
                    totalDiscount = fullPromo.GiaTriGiam;
                }

                // Giới hạn giảm tối đa
                if (fullPromo.GiamToiDa && totalDiscount > fullPromo.GiamToiDa) {
                    totalDiscount = fullPromo.GiamToiDa;
                }
            }

            // Đảm bảo giảm không quá tổng tiền (trừ khi free ship thì k ảnh hưởng subtotal)
            if (fullPromo.LoaiKM !== 'free_ship' && totalDiscount > eligibleTotal) {
                totalDiscount = eligibleTotal;
            }

            return res.json({
                success: true,
                discountDetails: {
                    total,
                    totalDiscount,
                    discountAmount: totalDiscount,
                    totalFinal: total - totalDiscount,
                    appliedProducts
                }
            });

        } catch (error) {
            return baseController.sendError(res, 'Lỗi khi áp dụng mã khuyến mãi', 500, error.message);
        }
    }

    // API: Claim promotion
    async claimPromotion(req, res) {
        try {
            const makh = req.user.makh;
            const { makm } = req.params;

            if (!makh) return res.status(401).json({ success: false, error: 'Chưa đăng nhập' });

            const code = await PromotionService.claimPromotion(makm, makh);

            res.json({
                success: true,
                message: 'Lưu mã thành công',
                makm: makm,
                code: code,
                ngay_lay: new Date().toISOString().split('T')[0]
            });
        } catch (error) {
            logger.error('Error claiming promotion:', error);
            res.status(400).json({ success: false, error: error.message });
        }
    }
}

export default new PromotionController();
