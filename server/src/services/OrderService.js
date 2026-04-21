import pool from '../config/connectDatabase.js';
import logger from '../utils/logger.js';
import { VNPay, ignoreLogger, ProductCode, VnpLocale, dateFormat } from 'vnpay';
import { pointsFromOrderAmount, addLoyaltyPoints, subtractLoyaltyPoints, computeTier } from '../utils/loyalty.js';
import { sendOrderConfirmationEmail } from '../utils/emailService.js';
import MoMoPaymentService from './MoMoPaymentService.js';
import ZaloPayPaymentService from './ZaloPayPaymentService.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load location data
const citiesData = JSON.parse(fs.readFileSync(path.join(__dirname, '../../migrations/city.json'), 'utf-8'));
const districtsData = JSON.parse(fs.readFileSync(path.join(__dirname, '../../migrations/district.json'), 'utf-8'));
const wardsData = JSON.parse(fs.readFileSync(path.join(__dirname, '../../migrations/wards.json'), 'utf-8'));

class OrderService {
    constructor() {
        // VNPay configuration
        this.vnpay = new VNPay({
            tmnCode: process.env.VNP_TMNCODE || 'MPEBN4AM',
            secureSecret: process.env.VNP_HASHSECRET || 'JNW4HXMTKJ0X3IE8YBVXGRVRACHISEH5',
            vnpayHost: process.env.VNP_URL ? process.env.VNP_URL.split('/paymentv2')[0] : 'https://sandbox.vnpayment.vn',
            testMode: true,
            hashAlgorithm: 'SHA512',
            enableLog: process.env.NODE_ENV !== 'production',
            loggerFn: ignoreLogger,
        });
    }

    // ===== SHIPPING FEE CALCULATION =====
    calculateShippingFee(province, totalWeight, customerTier = 'Äá»“ng') {
        const provinceLower = String(province || '').toLowerCase().trim();

        // Check if HCM -> Free ship
        const isHCM = provinceLower.includes('há»“ chÃ­ minh') || provinceLower.includes('hcm') ||
            provinceLower === '79' || provinceLower === '50';

        if (isHCM) {
            logger.info('ðŸ“ Ná»™i thÃ nh TP.HCM -> FREE SHIP');
            return 0;
        }

        // Calculate based on weight: 15,000 VND / 500g
        const weight500gUnits = Math.ceil((totalWeight || 0) / 500);
        let shippingFee = weight500gUnits * 15000;

        logger.info(`ðŸ“¦ Trá»ng lÆ°á»£ng: ${totalWeight}g -> PhÃ­ gá»‘c: ${shippingFee.toLocaleString('vi-VN')} VND`);

        // Apply tier discount
        const tierDiscount = { 'Báº¡c': 0.2, 'VÃ ng': 0.5 };
        const discount = tierDiscount[customerTier] || 0;

        if (discount > 0) {
            const discountAmount = Math.round(shippingFee * discount);
            shippingFee -= discountAmount;
            logger.info(`ðŸŽ Tier ${customerTier} gi giáº£m ${discount * 100}%: -${discountAmount.toLocaleString('vi-VN')} VND`);
        }

        logger.info(`âœ… PhÃ­ ship cuá»‘i: ${shippingFee.toLocaleString('vi-VN')} VND`);
        return Math.round(shippingFee);
    }

    // ===== NORMALIZE TIER =====
    normalizeTier(tier) {
        if (!tier && tier !== 0) return 'Äá»“ng';
        const t = String(tier).trim();
        if (/vang|v[aÃ áº£Ã£Ã¡áº¡]ng/i.test(t)) return 'VÃ ng';
        if (/bac|b[aÃ áº£Ã£Ã¡áº¡]c/i.test(t)) return 'Báº¡c';
        if (/Ä‘á»“ng|dong/i.test(t)) return 'Äá»“ng';
        // Numeric: 2 -> VÃ ng, 1 -> Báº¡c, 0 -> Äá»“ng
        if (!isNaN(Number(t))) {
            const n = Number(t);
            if (n >= 2) return 'VÃ ng';
            if (n === 1) return 'Báº¡c';
            return 'Äá»“ng';
        }
        return t;
    }

    // ===== PLACE ORDER (CORE LOGIC) =====
    async placeOrder(orderData, user) {
        const connection = await pool.getConnection();

        try {
            const {
                items,
                shippingAddress,
                paymentMethod,
                notes,
                subtotal: clientSubtotal,
                discount: clientDiscount,
                totalAmount,
                totalAmountDiscouted,
                freeShipCode,
                discountCode
            } = orderData;

            const clientFinalTotal = (typeof totalAmount !== 'undefined') ? totalAmount : totalAmountDiscouted;

            const customerId = user.makh || user.userId;
            const customerName = user.tenkh || user.name || '';
            const customerPhone = user.sdt || user.phone || '';

            if (!customerId) throw new Error('KhÃ´ng xÃ¡c thá»±c Ä‘Æ°á»£c khÃ¡ch hÃ ng');

            const customer = { makh: customerId, name: customerName, phone: customerPhone };

            logger.info('ðŸ” [ORDER] Data:', { clientSubtotal, clientDiscount, clientFinalTotal, freeShipCode, discountCode });
            logger.info('ðŸ” [ORDER] Customer:', customer);
            logger.info('ðŸ” [ORDER] Shipping Address:', shippingAddress);

            // Validate input
            if (!items || !shippingAddress || !paymentMethod) {
                throw new Error('Thiáº¿u thÃ´ng tin báº¯t buá»™c');
            }

            // Use fallback for empty name
            if (!customer.name) {
                customer.name = 'KhÃ¡ch hÃ ng';
            }

            if (!customer.makh || !shippingAddress.detail ||
                !shippingAddress.province || !shippingAddress.district || !shippingAddress.ward) {
                logger.error('âŒ Validation failed:', {
                    hasMakh: !!customer.makh,
                    hasName: !!customer.name,
                    hasPhone: !!customer.phone,
                    hasDetail: !!shippingAddress.detail,
                    hasProvince: !!shippingAddress.province,
                    hasDistrict: !!shippingAddress.district,
                    hasWard: !!shippingAddress.ward,
                    shippingAddress
                });
                throw new Error('ThÃ´ng tin khÃ¡ch hÃ ng hoáº·c Ä‘á»‹a chá»‰ khÃ´ng Ä‘áº§y Ä‘á»§');
            }

            // Check customer exists
            const [[existingCustomer]] = await connection.query(
                'SELECT makh, email, loyalty_points, loyalty_tier FROM khachhang WHERE makh = ?',
                [customer.makh]
            );

            if (!existingCustomer) throw new Error('KhÃ¡ch hÃ ng khÃ´ng tá»“n táº¡i');

            // Validate items
            if (!Array.isArray(items) || items.length === 0) {
                throw new Error('KhÃ´ng cÃ³ sáº£n pháº©m Ä‘Æ°á»£c chá»n');
            }

            // Validate products, check stock, calculate weight
            const cartItems = [];
            let totalWeight = 0;

            for (const item of items) {
                if (!item.MaSP || !item.SoLuong || item.SoLuong < 1) {
                    throw new Error(`Sáº£n pháº©m ${item.MaSP} khÃ´ng há»£p lá»‡`);
                }

                const [[product]] = await connection.query(
                    'SELECT MaSP, DonGia, SoLuong, TenSP, HinhAnh, TrongLuong FROM sanpham WHERE MaSP = ?',
                    [item.MaSP]
                );

                if (!product) throw new Error(`Sáº£n pháº©m ${item.MaSP} khÃ´ng tá»“n táº¡i`);
                if (product.SoLuong < item.SoLuong) {
                    throw new Error(`Sáº£n pháº©m ${item.MaSP} khÃ´ng Ä‘á»§ tá»“n kho (${product.SoLuong} < ${item.SoLuong})`);
                }

                const productWeight = product.TrongLuong || 0;
                totalWeight += productWeight * item.SoLuong;

                cartItems.push({
                    productId: item.MaSP,
                    quantity: item.SoLuong,
                    price: product.DonGia,
                    productName: product.TenSP,
                    productImage: product.HinhAnh,
                    weight: productWeight
                });
            }

            logger.info(`ðŸ“¦ Tá»•ng trá»ng lÆ°á»£ng: ${totalWeight}g`);

            // Calculate subtotal
            let subtotal = clientSubtotal || cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
            let discountAmount = clientDiscount || 0;

            // Get user tier
            const customerRow = existingCustomer;
            const tokenTier = user.loyalty_tier || user.loyalty_tier === 0 ? user.loyalty_tier : null;
            const userTier = tokenTier || customerRow.loyalty_tier || computeTier(customerRow.loyalty_points || 0);
            logger.info('ðŸ” [LOYALTY] userTier:', userTier);

            // ===== SERVER-SIDE PROMOTION VALIDATION =====
            let promoToMark = null;
            if (discountCode && String(discountCode).trim()) {
                const result = await this.validatePromotion(connection, discountCode.trim(), customer.makh, cartItems, subtotal);
                if (result.discountAmount !== null) {
                    discountAmount = result.discountAmount;
                    promoToMark = result.promoToMark;
                }
            }

            const amountAfterDiscount = subtotal - discountAmount;

            // Calculate shipping fee
            let shippingFee = this.calculateShippingFee(shippingAddress.province, totalWeight, this.normalizeTier(userTier));
            let isFreeShip = false;

            // Check free ship code
            if (freeShipCode && freeShipCode.trim()) {
                const freeShipResult = await this.validateFreeShip(connection, freeShipCode.trim(), customer.makh, subtotal);
                if (freeShipResult.success) {
                    shippingFee = 0;
                    isFreeShip = true;
                    if (freeShipResult.promoToMark) {
                        promoToMark = freeShipResult.promoToMark;
                    }
                }
            }

            logger.info(`ðŸš¢ PhÃ­ ship cuá»‘i: ${shippingFee.toLocaleString('vi-VN')} VND (Free: ${isFreeShip})`);

            // Member discount when free ship
            const userTierNormalized = this.normalizeTier(userTier);
            let memberDiscountAmount = 0;
            if (isFreeShip) {
                const memberPctMap = { 'Báº¡c': 0.03, 'VÃ ng': 0.05 };
                const pct = memberPctMap[userTierNormalized] || 0;
                if (pct > 0 && subtotal >= 300000) {
                    memberDiscountAmount = Math.round(subtotal * pct);
                    logger.info(`ðŸŽ–ï¸ Member ${userTierNormalized} discount: -${memberDiscountAmount.toLocaleString('vi-VN')} (${pct * 100}%)`);
                }
            }

            logger.info('ðŸ” [SUMMARY] subtotal:', subtotal, 'discount:', discountAmount, 'memberDiscount:', memberDiscountAmount, 'shipping:', shippingFee);

            // Calculate final total
            const finalTotalAmount = Math.max(0, amountAfterDiscount - memberDiscountAmount + shippingFee);
            logger.info(`ðŸ’µ Tá»•ng cuá»‘i: ${finalTotalAmount.toLocaleString('vi-VN')} VND`);

            // BEGIN TRANSACTION
            await connection.beginTransaction();

            // Create or reuse address
            const addressId = await this.createOrReuseAddress(connection, customer, shippingAddress);

            // Resolve province name
            let provinceName = shippingAddress.province;
            if (/^\d+$/.test(String(provinceName).trim())) {
                const cityObj = citiesData.find(c => c.city_id === provinceName);
                if (cityObj) {
                    provinceName = cityObj.city_name;
                    logger.info(`ðŸ“ Resolved province ${shippingAddress.province} â†’ ${provinceName}`);
                }
            }

            // Create order notes
            const shipNote = isFreeShip
                ? `PhÃ­ ship: 0Ä‘ (FREE SHIP - MÃ£: ${freeShipCode})`
                : `PhÃ­ ship: ${shippingFee.toLocaleString()}Ä‘ (${provinceName}, ${totalWeight}g)`;

            let promoNote = '';
            if (discountCode && discountAmount > 0) {
                promoNote = `[PROMO] MÃ£: ${discountCode}; Giáº£m: ${discountAmount.toLocaleString()}Ä‘\n`;
            }
            if (!promoNote && promoToMark && promoToMark.type === 'phieugiamgia_phathanh' && promoToMark.code) {
                promoNote = `[PROMO] Phiáº¿u: ${promoToMark.code}\n`;
            }

            let memberNote = '';
            if (memberDiscountAmount && memberDiscountAmount > 0) {
                memberNote = `[MEMBER] Giáº£m theo háº¡ng ${userTier}: ${memberDiscountAmount.toLocaleString()}Ä‘\n`;
            }

            const noteWithDetails = `${notes || ''}\n${promoNote}${memberNote}[LOYALTY] Háº¡ng: ${userTier}\n[SHIPPING] ${shipNote}`;

            // Create order
            const [orderResult] = await connection.query(
                `INSERT INTO hoadon (makh, MaDiaChi, NgayTao, TongTien, PhuongThucThanhToan, GhiChu, tinhtrang, TrangThaiThanhToan, PhiShip) 
                 VALUES (?, ?, NOW(), ?, ?, ?, ?, ?, ?)`,
                [customer.makh, addressId, finalTotalAmount, paymentMethod, noteWithDetails, 'Chá» xá»­ lÃ½', 'ChÆ°a thanh toÃ¡n', shippingFee]
            );
            const orderId = orderResult.insertId;

            // Mark promo as used
            if (promoToMark) {
                await this.markPromoAsUsed(connection, promoToMark, customer.makh, discountAmount, isFreeShip);
            }

            // Create order items & update stock
            for (const item of cartItems) {
                await connection.query(
                    'INSERT INTO chitiethoadon (MaHD, MaSP, SoLuong, DonGia) VALUES (?, ?, ?, ?)',
                    [orderId, item.productId, item.quantity, item.price]
                );
                await connection.query(
                    'UPDATE sanpham SET SoLuong = SoLuong - ? WHERE MaSP = ?',
                    [item.quantity, item.productId]
                );
            }

            // Clear cart
            if (cartItems.length > 0) {
                const productIds = cartItems.map(i => i.productId);
                const placeholders = productIds.map(() => '?').join(',');
                await connection.query(
                    `DELETE FROM giohang_chitiet WHERE MaKH = ? AND MaSP IN (${placeholders})`,
                    [customer.makh, ...productIds]
                );
            }

            // COMMIT before payment processing
            await connection.commit();
            logger.info('âœ… Database operations completed');

            // Return order info for payment processing
            return {
                orderId,
                finalTotalAmount,
                customer,
                customerEmail: existingCustomer.email,
                shippingAddress,
                cartItems,
                userTier,
                discountAmount,
                amountAfterDiscount,
                memberDiscountAmount,
                shippingFee,
                isFreeShip,
                freeShipCode,
                paymentMethod
            };

        } catch (error) {
            await connection.rollback();
            logger.error('âŒ Place order error:', error);
            throw error;
        } finally {
            connection.release();
        }
    }

    // ===== HELPER: CREATE OR REUSE ADDRESS =====
    async createOrReuseAddress(connection, customer, shippingAddress) {
        const [[matchingAddr]] = await connection.query(
            `SELECT MaDiaChi FROM diachi 
             WHERE MakH = ? AND TenNguoiNhan = ? AND SDT = ? AND DiaChiChiTiet = ? 
             AND TinhThanh = ? AND QuanHuyen = ? AND PhuongXa = ? LIMIT 1`,
            [customer.makh, customer.name, customer.phone, shippingAddress.detail,
            shippingAddress.province, shippingAddress.district, shippingAddress.ward]
        );

        if (matchingAddr) {
            logger.info(`Reusing address ${matchingAddr.MaDiaChi}`);
            return matchingAddr.MaDiaChi;
        }

        const [addressResult] = await connection.query(
            'INSERT INTO diachi (MakH, TenNguoiNhan, SDT, DiaChiChiTiet, TinhThanh, QuanHuyen, PhuongXa) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [customer.makh, customer.name, customer.phone, shippingAddress.detail,
            shippingAddress.province, shippingAddress.district, shippingAddress.ward]
        );
        logger.info(`Created new address ${addressResult.insertId}`);
        return addressResult.insertId;
    }

    // ===== HELPER: VALIDATE PROMOTION =====
    async validatePromotion(connection, code, customerId, cartItems, subtotal) {
        try {
            // Find promotion by code
            const [[foundPromo]] = await connection.query(
                `SELECT k.*, CAST(k.TrangThai AS UNSIGNED) as TrangThai, ct.GiaTriGiam, ct.GiaTriDonToiThieu, ct.GiamToiDa, ct.SoLuongToiThieu
                 FROM khuyen_mai k
                 LEFT JOIN ct_khuyen_mai ct ON k.MaKM = ct.MaKM
                 WHERE k.Code = ? AND k.TrangThai = 1 AND k.NgayBatDau <= NOW() AND k.NgayKetThuc >= NOW() LIMIT 1`,
                [code]
            );

            let promotion = foundPromo || null;
            let couponIssuedRow = null;

            // If not found, try coupon issuance
            if (!promotion) {
                const [[couponRow]] = await connection.query(
                    `SELECT ph.*, p.MaKM as Coupon_MaKM, p.TrangThai as Coupon_TrangThai, p.MaPhieu as Coupon_Code
                     FROM phieugiamgia_phathanh ph
                     JOIN phieugiamgia p ON ph.MaPhieu = p.MaPhieu
                     WHERE (ph.MaPhieu = ? OR p.MaPhieu = ?) AND ph.makh = ? LIMIT 1`,
                    [code, code, customerId]
                );

                if (couponRow) {
                    couponIssuedRow = couponRow;
                    // Load linked promotion
                    if (couponRow.Coupon_MaKM) {
                        const [[promoFromCoupon]] = await connection.query(
                            `SELECT k.*, CAST(k.TrangThai AS UNSIGNED) as TrangThai, ct.GiaTriGiam, ct.GiaTriDonToiThieu, ct.GiamToiDa, ct.SoLuongToiThieu
                             FROM khuyen_mai k
                             LEFT JOIN ct_khuyen_mai ct ON k.MaKM = ct.MaKM
                             WHERE k.MaKM = ? AND k.TrangThai = 1 AND k.NgayBatDau <= NOW() AND k.NgayKetThuc >= NOW() LIMIT 1`,
                            [couponRow.Coupon_MaKM]
                        );
                        promotion = promoFromCoupon || null;
                    }
                }
            }

            if (!promotion) {
                logger.info(`âš ï¸ Promotion not found: ${code}`);
                return { discountAmount: null, promoToMark: null };
            }

            logger.info('ðŸ” [PROMO FOUND]', promotion);

            const promoType = String(promotion.LoaiKM || '').toLowerCase();

            // Find eligible items
            let eligibleItems = [];
            if (promotion.MaKM) {
                const rows = await Promise.all(cartItems.map(async it => {
                    const [[r]] = await connection.query(
                        `SELECT 1 FROM sp_khuyen_mai WHERE MaKM = ? AND MaSP = ? LIMIT 1`,
                        [promotion.MaKM, it.productId]
                    );
                    return r ? it : null;
                }));
                eligibleItems = rows.filter(Boolean);

                // If no items linked but special promo type
                if (eligibleItems.length === 0) {
                    const isFree = promoType === 'free_ship';
                    const isFormOnly = promotion.Audience === 'FORM_ONLY';

                    let customerAssigned = false;
                    try {
                        const [[assigned]] = await connection.query(
                            `SELECT * FROM khachhang_khuyenmai WHERE makh = ? AND makm = ? LIMIT 1`,
                            [customerId, promotion.MaKM]
                        );
                        customerAssigned = !!assigned;
                    } catch (e) { /* ignore */ }

                    if (isFree || isFormOnly || (promotion.Audience === 'PRIVATE' && customerAssigned)) {
                        eligibleItems = cartItems;
                    }
                }
            } else {
                eligibleItems = cartItems;
            }

            const subtotalEligible = eligibleItems.reduce((s, it) => s + (it.price || 0) * (it.quantity || 0), 0);
            const totalQtyEligible = eligibleItems.reduce((s, it) => s + (it.quantity || 0), 0);

            logger.info('ðŸ” [ELIGIBLE]', eligibleItems.map(i => i.productId), 'subtotal:', subtotalEligible, 'qty:', totalQtyEligible);

            const minAmount = promotion.GiaTriDonToiThieu || 0;
            const minQty = promotion.SoLuongToiThieu || 0;

            let computedDiscount = 0;
            if (subtotalEligible >= minAmount && totalQtyEligible >= minQty) {
                if (promoType === 'giam_phan_tram') {
                    const pct = Number(promotion.GiaTriGiam || 0);
                    computedDiscount = Math.round(subtotalEligible * (pct / 100));
                    if (promotion.GiamToiDa) computedDiscount = Math.min(computedDiscount, Math.round(Number(promotion.GiamToiDa)));
                    computedDiscount = Math.min(computedDiscount, subtotalEligible);
                } else if (promoType === 'giam_tien_mat') {
                    computedDiscount = Math.round(Number(promotion.GiaTriGiam || 0));
                    computedDiscount = Math.min(computedDiscount, subtotalEligible);
                } else if (promoType === 'free_ship') {
                    computedDiscount = 0;
                }
            }

            logger.info('ðŸ” [COMPUTED DISCOUNT]', computedDiscount);

            let promoToMark = null;
            if (promotion.MaKM) {
                promoToMark = { type: 'khachhang_khuyenmai', MaKM: promotion.MaKM };
            } else if (couponIssuedRow) {
                promoToMark = { type: 'phieugiamgia_phathanh', code: couponIssuedRow.MaPhieu };
            }

            return { discountAmount: computedDiscount, promoToMark };

        } catch (e) {
            logger.error('âŒ Error validating promotion:', e);
            return { discountAmount: null, promoToMark: null };
        }
    }

    // ===== HELPER: VALIDATE FREE SHIP =====
    async validateFreeShip(connection, code, customerId, subtotal) {
        try {
            const [[freeShipPromo]] = await connection.query(
                `SELECT k.MaKM, k.TenKM, k.LoaiKM, k.Code, CAST(k.TrangThai AS UNSIGNED) AS TrangThai, ct.GiaTriDonToiThieu
                 FROM khuyen_mai k
                 JOIN ct_khuyen_mai ct ON k.MaKM = ct.MaKM
                 WHERE k.Code = ? AND k.LoaiKM = 'free_ship' AND k.TrangThai = 1 
                 AND k.NgayBatDau <= NOW() AND k.NgayKetThuc >= NOW()`,
                [code]
            );

            if (freeShipPromo) {
                // Check if customer claimed it
                const [[claim]] = await connection.query(
                    `SELECT * FROM khachhang_khuyenmai 
                     WHERE makh = ? AND makm = ? AND UPPER(REPLACE(trang_thai, ' ', '_')) = 'CHUA_SU_DUNG' AND ngay_het_han >= NOW()`,
                    [customerId, freeShipPromo.MaKM]
                );

                if (claim) {
                    if (subtotal >= (freeShipPromo.GiaTriDonToiThieu || 0)) {
                        logger.info(`ðŸŽ‰ Free ship applied: ${code}`);
                        // Mark as used
                        await connection.query(
                            `UPDATE khachhang_khuyenmai SET trang_thai = 'Da_su_dung' WHERE makh = ? AND makm = ?`,
                            [customerId, freeShipPromo.MaKM]
                        );
                        return { success: true, promoToMark: { type: 'khachhang_khuyenmai', MaKM: freeShipPromo.MaKM } };
                    } else {
                        logger.info(`âš ï¸ Minimum not met: ${freeShipPromo.GiaTriDonToiThieu}`);
                    }
                }
            } else {
                // Try issued coupon
                const [[issued]] = await connection.query(
                    `SELECT ph.MaPhatHanh, ph.MaPhieu, ph.NgaySuDung, k.MaKM, k.LoaiKM, ct.GiaTriDonToiThieu
                     FROM phieugiamgia_phathanh ph
                     JOIN phieugiamgia p ON ph.MaPhieu = p.MaPhieu
                     JOIN khuyen_mai k ON p.MaKM = k.MaKM
                     LEFT JOIN ct_khuyen_mai ct ON k.MaKM = ct.MaKM
                     WHERE (ph.MaPhieu = ? OR p.MaPhieu = ?) AND ph.makh = ? LIMIT 1`,
                    [code, code, customerId]
                );

                if (issued && !issued.NgaySuDung) {
                    const promoType = String(issued.LoaiKM || '').toLowerCase();
                    if (promoType === 'free_ship' && subtotal >= (issued.GiaTriDonToiThieu || 0)) {
                        logger.info(`ðŸŽ‰ Free ship (issued) applied: ${issued.MaPhieu}`);
                        return { success: true, promoToMark: { type: 'phieugiamgia_phathanh', code: issued.MaPhieu } };
                    }
                }
            }

            return { success: false, promoToMark: null };

        } catch (e) {
            logger.error('âŒ Error checking free ship:', e);
            return { success: false, promoToMark: null };
        }
    }

    // ===== HELPER: MARK PROMO AS USED =====
    async markPromoAsUsed(connection, promoToMark, customerId, discountAmount, isFreeShip) {
        try {
            logger.info('ðŸ” [MARK PROMO]', promoToMark);

            if (promoToMark.type === 'khachhang_khuyenmai' && promoToMark.MaKM) {
                if (discountAmount > 0 || isFreeShip) {
                    const [updateRes] = await connection.query(
                        `UPDATE khachhang_khuyenmai SET trang_thai = 'Da_su_dung' 
                         WHERE makh = ? AND makm = ? AND UPPER(REPLACE(trang_thai, ' ', '_')) = 'CHUA_SU_DUNG' LIMIT 1`,
                        [customerId, promoToMark.MaKM]
                    );
                    logger.info('âœ… Marked khuyenmai:', updateRes.affectedRows);
                }
            } else if (promoToMark.type === 'phieugiamgia_phathanh' && promoToMark.code) {
                if (discountAmount > 0 || isFreeShip) {
                    const [updateRes] = await connection.query(
                        `UPDATE phieugiamgia_phathanh SET NgaySuDung = NOW(), TrangThaiSuDung = 'DA_SU_DUNG' 
                         WHERE makh = ? AND MaPhieu = ? AND NgaySuDung IS NULL LIMIT 1`,
                        [customerId, promoToMark.code]
                    );
                    logger.info('âœ… Marked coupon:', updateRes.affectedRows);
                }
            }
        } catch (e) {
            logger.error('âŒ Error marking promo:', e);
        }
    }

    // ===== GENERATE VNPAY URL =====
    async generateVNPayUrl(orderId, amount, ip) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Ensure IPv4 format for VNPay
        let clientIp = ip || '127.0.0.1';
        if (clientIp === '::1' || clientIp.includes(':')) {
            clientIp = '127.0.0.1'; // Force IPv4 if IPv6 (VNPay only officially supports max 15 chars)
        }
        clientIp = clientIp.substring(0, 15);

        return await this.vnpay.buildPaymentUrl({
            vnp_Amount: Math.round(amount * 100),
            vnp_IpAddr: clientIp,
            vnp_TxnRef: orderId.toString(),
            vnp_OrderInfo: `Thanh toan don hang ${orderId}`,
            vnp_OrderType: ProductCode.Other,
            vnp_ReturnUrl: process.env.VNP_RETURN_URL,
            vnp_Locale: VnpLocale.VN,
            vnp_CreateDate: dateFormat(new Date()),
            vnp_ExpireDate: dateFormat(tomorrow),
        });
    }

    async rollbackOrderForVnpayError(orderId) {
        await pool.query(
            'UPDATE hoadon SET tinhtrang = "ÄÃ£ há»§y", GhiChu = "Lá»—i VNPay" WHERE MaHD = ?',
            [orderId],
        );
    }

    async addLoyaltyPointsForCodOrder(customerId, amount) {
        const connection = await pool.getConnection();
        try {
            await addLoyaltyPoints(connection, customerId, amount);
        } finally {
            connection.release();
        }
    }

    async updateOrderStatus(orderId, status) {
        const [result] = await pool.query('UPDATE hoadon SET tinhtrang = ? WHERE MaHD = ?', [status, orderId]);
        if (result.affectedRows === 0) {
            throw new Error('ORDER_NOT_FOUND');
        }
        return { id: Number(orderId), status };
    }

    async deleteOrder(orderId) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();
            await connection.query('DELETE FROM chitiethoadon WHERE MaHD = ?', [orderId]);
            const [result] = await connection.query('DELETE FROM hoadon WHERE MaHD = ?', [orderId]);
            if (result.affectedRows === 0) {
                throw new Error('ORDER_NOT_FOUND');
            }
            await connection.commit();
            return { id: Number(orderId) };
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    async getAllOrders() {
        const [orders] = await pool.query(
            `SELECT
                hd.MaHD AS id,
                hd.makh,
                hd.NgayTao AS createdAt,
                hd.TongTien AS totalAmount,
                hd.tinhtrang AS status,
                kh.tenkh AS customerName,
                kh.sdt AS customerPhone,
                dc.DiaChiChiTiet AS shippingAddress,
                dc.TinhThanh AS province,
                dc.QuanHuyen AS district,
                hd.PhuongThucThanhToan AS paymentMethod,
                hd.TrangThaiThanhToan AS paymentStatus
             FROM hoadon hd
             LEFT JOIN khachhang kh ON hd.makh = kh.makh
             LEFT JOIN diachi dc ON hd.MaDiaChi = dc.MaDiaChi
             ORDER BY hd.NgayTao DESC`,
        );
        return orders;
    }

    async processVNPayReturn(vnpParams) {
        let verify;
        try {
            verify = this.vnpay.verifyReturnUrl(vnpParams);
        } catch (error) {
            throw new Error('Lỗi xác thực VNPay: ' + error.message);
        }

        if (!verify.isVerified) {
            throw new Error('Chữ ký VNPay không hợp lệ (sai checksum)');
        }

        const orderId = vnpParams.vnp_TxnRef;
        const rspCode = vnpParams.vnp_ResponseCode;
        const amount = Number.parseInt(vnpParams.vnp_Amount || '0', 10) / 100;

        if (!orderId) {
            throw new Error('Thiáº¿u mÃ£ Ä‘Æ¡n hÃ ng tá»« VNPay callback');
        }

        if (rspCode === '00') {
            await pool.query(
                `UPDATE hoadon SET TrangThaiThanhToan = 'ÄÃ£ thanh toÃ¡n', tinhtrang = 'ÄÃ£ xÃ¡c nháº­n' WHERE MaHD = ?`,
                [orderId],
            );

            try {
                const [[order]] = await pool.query('SELECT makh, TongTien, email FROM hoadon hd LEFT JOIN khachhang kh ON hd.makh = kh.makh WHERE MaHD = ?', [orderId]);
                if (order) {
                    const connection = await pool.getConnection();
                    try {
                        await addLoyaltyPoints(connection, order.makh, order.TongTien);
                    } finally {
                        connection.release();
                    }

                    // Gửi email xác nhận sau khi thanh toán thành công
                    try {
                        const fullOrder = await this.getOrderById(orderId);
                        await sendOrderConfirmationEmail(order.email, {
                            ...fullOrder,
                            paymentMethod: 'VNPAY',
                        });
                        logger.info(`✅ [VNPAY] Đã gửi email xác nhận cho đơn hàng #${orderId}`);
                    } catch (emailErr) {
                        logger.warn(`⚠️ [VNPAY] Gửi email thất bại cho đơn #${orderId}:`, emailErr.message);
                    }
                }
            } catch (error) {
                logger.warn('Error processing post-VNPAY success tasks:', error.message);
            }

            return { orderId, amount, rspCode, status: 'success' };
        }

        await pool.query(
            `UPDATE hoadon SET TrangThaiThanhToan = 'Tháº¥t báº¡i', tinhtrang = 'ÄÃ£ há»§y' WHERE MaHD = ?`,
            [orderId],
        );

        const [items] = await pool.query('SELECT MaSP, SoLuong FROM chitiethoadon WHERE MaHD = ?', [orderId]);
        for (const item of items) {
            await pool.query('UPDATE sanpham SET SoLuong = SoLuong + ? WHERE MaSP = ?', [item.SoLuong, item.MaSP]);
        }

        return { orderId, amount, rspCode, status: 'failed' };
    }

    async sendOrderEmail(orderResult, paymentUrl = null) {
        if (!orderResult.customerEmail) {
            return;
        }

        const emailShippingAddress = {
            detail: orderResult.shippingAddress.detail,
            province: orderResult.shippingAddress.province,
            district: orderResult.shippingAddress.district,
            ward: orderResult.shippingAddress.ward,
        };

        const orderPayload = {
            id: orderResult.orderId,
            total: orderResult.finalTotalAmount,
            subtotal: orderResult.amountAfterDiscount,
            shippingFee: orderResult.shippingFee,
            paymentMethod: orderResult.paymentMethod || 'VNPAY',
            paymentUrl,
            customerName: orderResult.customer.name,
            shippingAddress: emailShippingAddress,
            items: orderResult.cartItems,
        };

        await sendOrderConfirmationEmail(orderResult.customerEmail, orderPayload);
    }

    async finalizeCheckout(orderResult, paymentMethod, clientIp) {
        if (paymentMethod === 'VNPAY') {
            try {
                const paymentUrl = await this.generateVNPayUrl(
                    orderResult.orderId,
                    orderResult.finalTotalAmount,
                    clientIp,
                );

                return {
                    responseType: 'raw',
                    statusCode: 200,
                    payload: {
                        success: true,
                        orderId: orderResult.orderId,
                        paymentUrl,
                        message: 'ÄÆ¡n hÃ ng Ä‘Ã£ táº¡o, chuyá»ƒn hÆ°á»›ng thanh toÃ¡n VNPay',
                        appliedTier: orderResult.userTier,
                        discountAmount: orderResult.discountAmount,
                        memberDiscountAmount: orderResult.memberDiscountAmount,
                        shippingFee: orderResult.shippingFee,
                        finalTotalAmount: orderResult.finalTotalAmount,
                    },
                };
            } catch (error) {
                await this.rollbackOrderForVnpayError(orderResult.orderId);
                throw new Error(error instanceof Error ? error.message : 'Lá»—i táº¡o URL thanh toÃ¡n VNPay');
            }
        }

        if (paymentMethod === 'COD') {
            try {
                await this.addLoyaltyPointsForCodOrder(orderResult.customer.makh, orderResult.finalTotalAmount);
            } catch (error) {
                // Non-blocking: COD success should not fail because loyalty failed
                logger.warn('Loyalty add failed (non-blocking):', error.message);
            }

            this.sendOrderEmail(orderResult).catch((error) => {
                // Non-blocking: order response should not fail if email provider has issues
                logger.error('Email failed (non-blocking):', error.message);
            });

            return {
                responseType: 'success',
                payload: {
                    orderId: orderResult.orderId,
                    message: 'Äáº·t hÃ ng COD thÃ nh cÃ´ng',
                    paymentMethod: 'COD',
                    appliedTier: orderResult.userTier,
                    discountAmount: orderResult.discountAmount,
                    memberDiscountAmount: orderResult.memberDiscountAmount,
                    shippingFee: orderResult.shippingFee,
                    finalTotalAmount: orderResult.finalTotalAmount,
                },
            };
        }

        if (paymentMethod === 'MOMO') {
            try {
                const momoResult = await MoMoPaymentService.createPaymentUrl(
                    orderResult.orderId,
                    orderResult.finalTotalAmount,
                    `Thanh toán đơn hàng #${orderResult.orderId}`,
                    orderResult.customer.makh
                );

                return {
                    responseType: 'raw',
                    statusCode: 200,
                    payload: {
                        success: true,
                        orderId: orderResult.orderId,
                        paymentUrl: momoResult.paymentUrl,
                        message: 'Đơn hàng đã tạo, chuyển hướng thanh toán MoMo',
                        appliedTier: orderResult.userTier,
                        discountAmount: orderResult.discountAmount,
                        memberDiscountAmount: orderResult.memberDiscountAmount,
                        shippingFee: orderResult.shippingFee,
                        finalTotalAmount: orderResult.finalTotalAmount,
                    },
                };
            } catch (error) {
                logger.error('❌ MoMo Payment Error:', error);
                throw new Error(error instanceof Error ? error.message : 'Lỗi tạo URL thanh toán MoMo');
            }
        }

        if (paymentMethod === 'ZALOPAY') {
            try {
                const zaloPayResult = await ZaloPayPaymentService.createPaymentUrl(
                    orderResult.orderId,
                    orderResult.finalTotalAmount,
                    `Thanh toán đơn hàng #${orderResult.orderId}`,
                    orderResult.customer.makh
                );

                return {
                    responseType: 'raw',
                    statusCode: 200,
                    payload: {
                        success: true,
                        orderId: orderResult.orderId,
                        paymentUrl: zaloPayResult.paymentUrl,
                        message: 'Đơn hàng đã tạo, chuyển hướng thanh toán ZaloPay',
                        appliedTier: orderResult.userTier,
                        discountAmount: orderResult.discountAmount,
                        memberDiscountAmount: orderResult.memberDiscountAmount,
                        shippingFee: orderResult.shippingFee,
                        finalTotalAmount: orderResult.finalTotalAmount,
                    },
                };
            } catch (error) {
                logger.error('❌ ZaloPay Payment Error:', error);
                throw new Error(error instanceof Error ? error.message : 'Lỗi tạo URL thanh toán ZaloPay');
            }
        }

        throw new Error('Phương thức thanh toán không hợp lệ');
    }

    // ===== GET CUSTOMER ORDERS =====
    async getCustomerOrders(customerId) {
        const [orders] = await pool.query(
            `SELECT 
                hd.MaHD AS id,
                hd.NgayTao AS createdAt,
                hd.TongTien AS totalAmount,
                hd.PhiShip AS shippingFee,
                hd.tinhtrang AS status,
                hd.PhuongThucThanhToan AS paymentMethod,
                hd.TrangThaiThanhToan AS paymentStatus,
                dc.TenNguoiNhan AS recipientName,
                dc.SDT AS recipientPhone,
                dc.DiaChiChiTiet AS shippingAddress,
                dc.TinhThanh AS province,
                dc.QuanHuyen AS district,
                dc.PhuongXa AS ward
             FROM hoadon hd
             LEFT JOIN diachi dc ON hd.MaDiaChi = dc.MaDiaChi
             WHERE hd.makh = ?
             ORDER BY hd.NgayTao DESC`,
            [customerId]
        );
        return orders;
    }

    // ===== GET ORDER BY ID =====
    async getOrderById(orderId) {
        const [[order]] = await pool.query(
            `SELECT 
                hd.MaHD AS id,
                hd.NgayTao AS createdAt,
                hd.TongTien AS totalAmount,
                hd.PhiShip AS shippingFee,
                hd.tinhtrang AS status,
                hd.PhuongThucThanhToan AS paymentMethod,
                hd.TrangThaiThanhToan AS paymentStatus,
                hd.GhiChu AS notes,
                hd.makh AS customerId,
                kh.tenkh AS customerName,
                kh.sdt AS customerPhone,
                kh.email AS customerEmail,
                dc.TenNguoiNhan AS recipientName,
                dc.SDT AS recipientPhone,
                dc.DiaChiChiTiet AS shippingAddress,
                dc.TinhThanh AS province,
                dc.QuanHuyen AS district,
                dc.PhuongXa AS ward
             FROM hoadon hd
             LEFT JOIN khachhang kh ON hd.makh = kh.makh
             LEFT JOIN diachi dc ON hd.MaDiaChi = dc.MaDiaChi
             WHERE hd.MaHD = ?`,
            [orderId]
        );

        if (!order) throw new Error('KhÃ´ng tÃ¬m tháº¥y Ä‘Æ¡n hÃ ng');

        const [items] = await pool.query(
            `SELECT 
                ct.MaSP AS productId,
                sp.TenSP AS productName,
                sp.HinhAnh AS productImage,
                ct.DonGia AS price,
                ct.Soluong AS quantity
             FROM chitiethoadon ct
             JOIN sanpham sp ON ct.MaSP = sp.MaSP
             WHERE ct.MaHD = ?`,
            [orderId]
        );

        return { ...order, items };
    }

    // ===== CANCEL ORDER =====
    async cancelOrder(orderId, customerId, reason) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            // Lock order
            const [[order]] = await connection.query(
                `SELECT * FROM hoadon WHERE MaHD = ? AND makh = ? FOR UPDATE`,
                [orderId, customerId]
            );

            if (!order) throw new Error('KhÃ´ng tÃ¬m tháº¥y Ä‘Æ¡n hÃ ng hoáº·c khÃ´ng cÃ³ quyá»n');

            // Check if can cancel
            if (!['Chá» xá»­ lÃ½', 'ÄÃ£ xÃ¡c nháº­n'].includes(order.tinhtrang)) {
                throw new Error('KhÃ´ng thá»ƒ há»§y Ä‘Æ¡n hÃ ng á»Ÿ tráº¡ng thÃ¡i hiá»‡n táº¡i');
            }

            // Update order status
            await connection.query(
                `UPDATE hoadon SET tinhtrang = 'ÄÃ£ há»§y', GhiChu = CONCAT(IFNULL(GhiChu, ''), ?) WHERE MaHD = ?`,
                [`\nLÃ½ do há»§y: ${reason || 'KhÃ´ng cÃ³ lÃ½ do'}`, orderId]
            );

            // Restore stock
            const [items] = await connection.query(
                `SELECT MaSP, Soluong FROM chitiethoadon WHERE MaHD = ?`,
                [orderId]
            );

            for (const item of items) {
                await connection.query(
                    `UPDATE sanpham SET SoLuong = SoLuong + ? WHERE MaSP = ?`,
                    [item.Soluong, item.MaSP]
                );
            }

            // Subtract loyalty points (non-blocking)
            try {
                await subtractLoyaltyPoints(connection, customerId, order.TongTien || 0);
                logger.info(`Loyalty: subtracted for customer ${customerId} due to cancel ${orderId}`);
            } catch (e) {
                logger.warn('Loyalty subtraction failed (non-blocking):', e.message);
            }

            await connection.commit();
            return { success: true, orderId, message: 'Há»§y Ä‘Æ¡n thÃ nh cÃ´ng' };

        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    // ===== ADDRESS MANAGEMENT =====
    async getCustomerAddresses(customerId) {
        const [addresses] = await pool.query(
            `SELECT MaDiaChi AS id, TenNguoiNhan AS name, SDT AS phone, 
                    DiaChiChiTiet AS detail, TinhThanh AS province, 
                    QuanHuyen AS district, PhuongXa AS ward
             FROM diachi WHERE MaKH = ?
             ORDER BY MaDiaChi DESC`,
            [customerId]
        );
        return addresses;
    }

    async createAddress(customerId, addressData) {
        const { name, phone, detail, province, district, ward } = addressData;
        const [result] = await pool.query(
            `INSERT INTO diachi (MaKH, TenNguoiNhan, SDT, DiaChiChiTiet, TinhThanh, QuanHuyen, PhuongXa) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [customerId, name, phone, detail, province, district, ward]
        );
        return result.insertId;
    }

    async updateOrderAddress(orderId, customerId, addressData) {
        // This method updates the delivery address for an order (hoadon.MaDiaChi)
        const { MaDiaChi, TenNguoiNhan, SDT, DiaChiChiTiet, TinhThanh, QuanHuyen, PhuongXa } = addressData;
        
        // First verify the order belongs to the customer
        const [[order]] = await pool.query(
            `SELECT MaHD, MaDiaChi, TongTien, PhiShip FROM hoadon WHERE MaHD = ? AND makh = ?`,
            [orderId, customerId]
        );

        if (!order) {
            throw new Error('Khong tim thay don hang');
        }

        // Case 1: User selected a saved address (MaDiaChi provided)
        if (MaDiaChi) {
            // Verify the address exists and belongs to customer
            const [[savedAddr]] = await pool.query(
                `SELECT MaDiaChi FROM diachi WHERE MaDiaChi = ? AND MaKH = ?`,
                [MaDiaChi, customerId]
            );

            if (!savedAddr) {
                throw new Error('Dia chi khong ton tai hoac khong thuoc ve khach hang nay');
            }

            // Update order to use this address
            const [result] = await pool.query(
                `UPDATE hoadon SET MaDiaChi = ? WHERE MaHD = ? AND makh = ?`,
                [MaDiaChi, orderId, customerId]
            );

            if (result.affectedRows === 0) {
                throw new Error('Cap nhat dia chi that bai');
            }

            return { id: orderId, message: 'Cap nhat dia chi thanh cong' };
        }

        // Case 2: User entered a new address
        if (!TenNguoiNhan || !SDT || !DiaChiChiTiet) {
            throw new Error('Vui long dien day du thong tin dia chi');
        }

        // Check if address already exists for this customer
        const [[existingAddr]] = await pool.query(
            `SELECT MaDiaChi FROM diachi WHERE MaKH = ? AND DiaChiChiTiet = ? AND TinhThanh = ? LIMIT 1`,
            [customerId, DiaChiChiTiet, TinhThanh]
        );

        let newAddressId;
        if (existingAddr) {
            // Update existing address
            newAddressId = existingAddr.MaDiaChi;
            await pool.query(
                `UPDATE diachi SET TenNguoiNhan = ?, SDT = ?, QuanHuyen = ?, PhuongXa = ? WHERE MaDiaChi = ?`,
                [TenNguoiNhan, SDT, QuanHuyen, PhuongXa, newAddressId]
            );
        } else {
            // Create new address
            const [insertResult] = await pool.query(
                `INSERT INTO diachi (MaKH, TenNguoiNhan, SDT, DiaChiChiTiet, TinhThanh, QuanHuyen, PhuongXa) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [customerId, TenNguoiNhan, SDT, DiaChiChiTiet, TinhThanh, QuanHuyen, PhuongXa]
            );
            newAddressId = insertResult.insertId;
        }

        // Update order with new address
        const [result] = await pool.query(
            `UPDATE hoadon SET MaDiaChi = ? WHERE MaHD = ? AND makh = ?`,
            [newAddressId, orderId, customerId]
        );

        if (result.affectedRows === 0) {
            throw new Error('Cap nhat dia chi that bai');
        }

        return { id: orderId, message: 'Cap nhat dia chi thanh cong' };
    }

    async updateAddress(addressId, customerId, addressData) {
        const { name, phone, detail, province, district, ward } = addressData;
        const [result] = await pool.query(
            `UPDATE diachi SET TenNguoiNhan = ?, SDT = ?, DiaChiChiTiet = ?, 
                              TinhThanh = ?, QuanHuyen = ?, PhuongXa = ? 
             WHERE MaDiaChi = ? AND MaKH = ?`,
            [name, phone, detail, province, district, ward, addressId, customerId]
        );
        if (result.affectedRows === 0) throw new Error('Äá»‹a chá»‰ khÃ´ng tá»“n táº¡i');
        return true;
    }

    async deleteAddress(addressId, customerId) {
        const [result] = await pool.query(
            `DELETE FROM diachi WHERE MaDiaChi = ? AND MaKH = ?`,
            [addressId, customerId]
        );
        if (result.affectedRows === 0) throw new Error('Äá»‹a chá»‰ khÃ´ng tá»“n táº¡i');
        return true;
    }

    async setDefaultAddress(addressId, customerId) {
        // First, verify the address exists and belongs to the customer
        const [[address]] = await pool.query(
            `SELECT MaDiaChi FROM diachi WHERE MaDiaChi = ? AND MaKH = ?`,
            [addressId, customerId]
        );

        if (!address) {
            throw new Error('Äá»‹a chá»‰ khÃ´ng tá»“n táº¡i hoáº·c khÃ´ng thuá»™c vá» khÃ¡ch hÃ ng nÃ y');
        }

        // Note: This is a placeholder implementation
        // Since diachi table doesn't have MacDinh column, we return success
        // A future migration can add MacDinh column and implement the actual logic:
        // 1. Set all addresses for this customer to MacDinh = 0
        // 2. Set the specified address to MacDinh = 1

        // TODO: Add migration to add MacDinh TINYINT(1) DEFAULT 0 column to diachi table
        // Then implement:
        // await pool.query('UPDATE diachi SET MacDinh = 0 WHERE MaKH = ?', [customerId]);
        // await pool.query('UPDATE diachi SET MacDinh = 1 WHERE MaDiaChi = ? AND MaKH = ?', [addressId, customerId]);

        logger.info(`âš ï¸ setDefaultAddress called for address ${addressId} - MacDinh column not yet in DB`);
        return true;
    }

    // ===== LOCATION RESOLUTION =====
    resolveProvinceName(code) {
        const city = citiesData.find(c => c.city_id === String(code));
        return city ? city.city_name : String(code);
    }

    resolveDistrictName(code) {
        const district = districtsData.find(d => d.district_id === String(code));
        return district ? district.district_name : String(code);
    }

    resolveWardName(code) {
        const ward = wardsData.find(w => w.ward_id === String(code));
        return ward ? ward.ward_name : String(code);
    }
}

export default new OrderService();

