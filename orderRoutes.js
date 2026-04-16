import express from 'express';
import pool from '../config/connectDatabase.js';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { VNPay, ignoreLogger, ProductCode, VnpLocale, dateFormat } from 'vnpay';
import { pointsFromOrderAmount, addLoyaltyPoints, subtractLoyaltyPoints, computeTier } from '../utils/loyalty.js';
import { sendOrderConfirmationEmail } from '../utils/emailService.js';
import https from 'https';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ Load JSON data từ file local
const citiesData = JSON.parse(fs.readFileSync(path.join(__dirname, '../../migrations/city.json'), 'utf-8'));
const districtsData = JSON.parse(fs.readFileSync(path.join(__dirname, '../../migrations/district.json'), 'utf-8'));
const wardsData = JSON.parse(fs.readFileSync(path.join(__dirname, '../../migrations/wards.json'), 'utf-8'));

// ✅ HTTPS Agent để bypass certificate error cho provinces API
const httpsAgent = new https.Agent({
  rejectUnauthorized: false
});

// Hàm sắp xếp object để tạo hash VNPay

// Hàm sắp xếp object để tạo hash VNPay
function sortObject(obj) {
  let sorted = {};
  let str = [];
  let key;
  for (key in obj) {
    if (obj.hasOwnProperty(key)) {
      str.push(encodeURIComponent(key));
    }
  }
  str.sort();
  for (key = 0; key < str.length; key++) {
    sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, "+");
  }
  return sorted;
}

// 🚢 Hàm tính phí ship
/**
 * Tính phí ship dựa trên địa chỉ và tier khách hàng
 * @param {string} province - Tỉnh/thành phố giao hàng
 * @param {number} totalWeight - Tổng trọng lượng đơn hàng (gram)
 * @param {string} customerTier - Hạng thành viên: 'Đồng', 'Bạc', 'Vàng'
 * @returns {number} Phí ship (VND)
 */
function calculateShippingFee(province, totalWeight, customerTier = 'Đồng') {
  // ✅ FIX #2: Normalize tên tỉnh thành - loại bỏ khoảng trắng thừa, lowercase
  const provinceNormalized = String(province || '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');  // Chuyển nhiều khoảng trắng thành 1
  
  // Kiểm tra nội thành TP.HCM - FREE SHIP
  const isHCM = provinceNormalized.includes('hồ chí minh') || 
                provinceNormalized.includes('ho chi minh') ||
                provinceNormalized.includes('hcm') ||
                provinceNormalized.includes('tp.hcm') ||
                provinceNormalized.includes('tp hcm') ||  // ← Thêm variant
                provinceNormalized.includes('tphcm') ||
                provinceNormalized === '79' ||  // Mã tỉnh TP.HCM (API cũ)
                provinceNormalized === '50';    // Mã tỉnh TP.HCM (API mới)

  if (isHCM) {
    console.log('📍 Nội thành TP.HCM -> FREE SHIP');
    return 0;
  }

  // Ngoài TP.HCM: 15,000 VND / 500g
  const weightInKg = totalWeight / 1000; // Convert gram to kg
  const weight500gUnits = Math.ceil((totalWeight || 0) / 500); // Làm tròn lên
  let shippingFee = weight500gUnits * 15000;

  console.log(`📦 Tổng trọng lượng: ${totalWeight}g (${weightInKg}kg)`);
  console.log(`📦 Số đơn vị 500g: ${weight500gUnits}`);
  console.log(`💰 Phí ship gốc: ${shippingFee.toLocaleString('vi-VN')} VND`);

  // Áp dụng giảm giá theo tier
  let discount = 0;
  switch (customerTier) {
    case 'Bạc':
      discount = 0.20; // Giảm 20%
      break;
    case 'Vàng':
      discount = 0.50; // Giảm 50%
      break;
    default:
      discount = 0; // Đồng: không giảm
  }

  if (discount > 0) {
    const discountAmount = Math.round(shippingFee * discount);
    shippingFee = shippingFee - discountAmount;
    console.log(`🎁 Tier ${customerTier} giảm ${discount * 100}%: -${discountAmount.toLocaleString('vi-VN')} VND`);
  }

  console.log(`✅ Phí ship cuối cùng: ${shippingFee.toLocaleString('vi-VN')} VND`);
  return Math.round(shippingFee);
}

//cấu hình vnpay
const vnpay = new VNPay({
  tmnCode: process.env.VNP_TMNCODE,
  secureSecret: process.env.VNP_HASHSECRET,
  vnpayHost: 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html', // Thay đổi này
  testMode: true,
  hashAlgorithm: 'SHA512',
  enableLog: true,
  loggerFn: ignoreLogger,
});

// Middleware xác thực token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Không có token' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(403).json({ error: 'Token không hợp lệ' });
  }
};
// THAY THẾ TOÀN BỘ ĐOẠN API place-order (từ dòng 52 đến hết):

// API đặt đơn hàng
// router.post('/place-order', authenticateToken, async (req, res) => {
//   console.log('🚀 Place order API called');
//   console.log('🔍 Request Body:', JSON.stringify(req.body, null, 2));
  
//   const connection = await pool.getConnection();
  
//   try {
//     const { customer, items, shippingAddress, paymentMethod, notes, totalAmountDiscouted } = req.body;
    
//     console.log('req.user:', req.user);
//     console.log(totalAmountDiscouted);
    
//     // Kiểm tra dữ liệu đầu vào
//     if (!customer || !items || !shippingAddress || !paymentMethod) {
//       return res.status(400).json({ error: 'Thiếu thông tin bắt buộc' });
//     }

//     // Kiểm tra các trường bắt buộc
//     if (!customer.makh || !customer.name || !customer.phone || !shippingAddress.detail ||
//       !shippingAddress.province || !shippingAddress.district || !shippingAddress.ward) {
//       return res.status(400).json({ error: 'Thông tin khách hàng hoặc địa chỉ không đầy đủ' });
//     }

//     // Kiểm tra khách hàng
//     const [existingCustomer] = await connection.query('SELECT makh, email FROM khachhang WHERE makh = ?', [customer.makh]);
//     if (!existingCustomer.length) {
//       return res.status(400).json({ error: 'Khách hàng không tồn tại' });
//     }

//     // Kiểm tra items
//     if (!Array.isArray(items) || items.length === 0) {
//       return res.status(400).json({ error: 'Không có sản phẩm được chọn' });
//     }

//     // Validate sản phẩm và tồn kho
//     const cartItems = [];
//     for (const item of items) {
//       if (!item.MaSP || !item.SoLuong || item.SoLuong < 1) {
//         return res.status(400).json({ error: `Sản phẩm ${item.MaSP} không hợp lệ` });
//       }
      
//       const [product] = await connection.query(
//         'SELECT MaSP, DonGia as price, SoLuong as stock FROM sanpham WHERE MaSP = ?',
//         [item.MaSP]
//       );
      
//       if (!product.length) {
//         return res.status(400).json({ error: `Sản phẩm ${item.MaSP} không tồn tại` });
//       }
      
//       if (product[0].stock < item.SoLuong) {
//         return res.status(400).json({ error: `Sản phẩm ${item.MaSP} không đủ tồn kho (${product[0].stock} < ${item.SoLuong})` });
//       }
      
//       cartItems.push({
//         productId: item.MaSP,
//         quantity: item.SoLuong,
//         price: product[0].price
//       });
//     }

//     // Tính tổng tiền
//     const totalAmount = totalAmountDiscouted ? totalAmountDiscouted : cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
//     console.log('Validated cart items:', cartItems, 'Total:', totalAmount);

//     // ✅ BẮT ĐẦU TRANSACTION
//     await connection.beginTransaction();

//     // Lưu địa chỉ
//     const [addressResult] = await connection.query(
//       'INSERT INTO diachi (MaKH, TenNguoiNhan, SDT, DiaChiChiTiet, TinhThanh, QuanHuyen, PhuongXa) VALUES (?, ?, ?, ?, ?, ?, ?)',
//       [customer.makh, customer.name, customer.phone, shippingAddress.detail, shippingAddress.province, shippingAddress.district, shippingAddress.ward]
//     );
//     const addressId = addressResult.insertId;

//     // Tạo đơn hàng
//     const [orderResult] = await connection.query(
//       `INSERT INTO hoadon (makh, MaDiaChi, NgayTao, TongTien, PhuongThucThanhToan, GhiChu, tinhtrang, TrangThaiThanhToan) 
//        VALUES (?, ?, NOW(), ?, ?, ?, ?, ?)`,
//       [customer.makh, addressId, totalAmount, paymentMethod, notes || '', 'Chờ xử lý', 'Chưa thanh toán']
//     );
//     const orderId = orderResult.insertId;

//     // Lưu chi tiết đơn hàng
//     for (const item of cartItems) {
//       await connection.query(
//         'INSERT INTO chitiethoadon (MaHD, MaSP, SoLuong, DonGia) VALUES (?, ?, ?, ?)',
//         [orderId, item.productId, item.quantity, item.price]
//       );
      
//       await connection.query('UPDATE sanpham SET SoLuong = SoLuong - ? WHERE MaSP = ?', [item.quantity, item.productId]);
//     }

//     // Xóa giỏ hàng
//     if (cartItems.length > 0) {
//       const productIds = cartItems.map(i => i.productId);
//       const placeholders = productIds.map(() => '?').join(',');
//       await connection.query(
//         `DELETE FROM giohang WHERE MaKH = ? AND MaSP IN (${placeholders})`, 
//         [customer.makh, ...productIds]
//       );
//     }

//     // ✅ COMMIT TRANSACTION TRƯỚC KHI XỬ LÝ THANH TOÁN
//     await connection.commit();
//     console.log('✅ Database operations completed successfully');

//     // XỬ LÝ THANH TOÁN
//     if (paymentMethod === 'VNPAY') {
//       try {
//         const tomorrow = new Date();
//         tomorrow.setDate(tomorrow.getDate() + 1);
        
//         const vnpayResponse = await vnpay.buildPaymentUrl({
//           vnp_Amount: totalAmount,
//           vnp_IpAddr: req.ip || req.connection.remoteAddress || '127.0.0.1',
//           vnp_TxnRef: orderId.toString(),
//           vnp_OrderInfo: `Thanh toan don hang ${orderId}`,
//           vnp_OrderType: ProductCode.Other,
//           vnp_ReturnUrl: process.env.VNP_RETURN_URL,
//           vnp_Locale: VnpLocale.VN,
//           vnp_CreateDate: dateFormat(new Date()),
//           vnp_ExpireDate: dateFormat(tomorrow),
//         });
        
//         console.log('✅ VNPay URL generated for order:', orderId);
//         return res.status(200).json({ 
//           success: true, 
//           orderId, 
//           paymentUrl: vnpayResponse,
//           message: 'Đơn hàng đã được tạo, chuyển hướng thanh toán VNPay'
//         });
//       } catch (vnpayError) {
//         console.error('❌ VNPay error:', vnpayError);
//         // Rollback order nếu VNPay lỗi
//         await pool.query('UPDATE hoadon SET tinhtrang = "Đã hủy", GhiChu = "Lỗi VNPay" WHERE MaHD = ?', [orderId]);
//         return res.status(500).json({ 
//           error: 'Lỗi tạo URL thanh toán VNPay', 
//           details: vnpayError.message 
//         });
//       }
//     } else if (paymentMethod === 'COD') {
//       // ✅ COD SUCCESS
//       console.log('✅ COD Order completed successfully with ID:', orderId);
//       // Add loyalty points for COD orders (non-blocking)
//       try {
//         const loyRes = await addLoyaltyPoints(connection, customer.makh, totalAmount);
//         console.log(`Loyalty: added points for customer ${customer.makh} (COD order ${orderId})`, { loyRes });
//         if (loyRes && loyRes.error) console.warn('Loyalty add returned error (non-blocking):', loyRes.error);
//       } catch (e) {
//         console.warn('Loyalty add failed (non-blocking):', e && e.message);
//       }
//       return res.status(200).json({ 
//         success: true, 
//         orderId,
//         message: 'Đặt hàng COD thành công',
//         paymentMethod: 'COD'
//       });
//     } else {
//       return res.status(400).json({ error: 'Phương thức thanh toán không hợp lệ' });
//     }

//   } catch (error) {
//     // ❌ ROLLBACK TRANSACTION NẾU CÓ LỖI
//     try {
//       await connection.rollback();
//       console.log('🔄 Transaction rollback completed');
//     } catch (rollbackError) {
//       console.error('❌ Rollback error:', rollbackError);
//     }
    
//     console.error('❌ Place order error:', {
//       message: error.message,
//       stack: error.stack,
//       sql: error.sql,
//       sqlMessage: error.sqlMessage
//     });
    
//     res.status(500).json({ 
//       error: 'Lỗi khi đặt hàng', 
//       details: error.message,
//       sqlError: error.sqlMessage 
//     });
//   } finally {
//     // ✅ GIẢI PHÓNG CONNECTION
//     if (connection) {
//       connection.release();
//     }
//   }
// });
// ...existing code...
router.post('/place-order', authenticateToken, async (req, res) => {
  console.log('🚀 Place order API called');
  console.log('🔍 Request Body:', JSON.stringify(req.body, null, 2));
  
  const connection = await pool.getConnection();
  
  try {
  // Lấy dữ liệu đơn; thông tin khách ưu tiên lấy từ token để tránh mismatch hoặc gian lận
  const { 
    items, 
    shippingAddress, 
    paymentMethod, 
    notes, 
    subtotal: clientSubtotal,        // ✅ Tổng tiền hàng từ client
    discount: clientDiscount,        // ✅ Giảm giá đã áp dụng từ client
    totalAmount,                     // may be provided by client (new name)
    totalAmountDiscouted,            // legacy field name from client
    freeShipCode,
    discountCode                     // ✅ Mã giảm giá đã áp dụng
  } = req.body;

  // Support both client-sent names: prefer `totalAmount`, fallback to legacy `totalAmountDiscouted`
  const clientFinalTotal = (typeof totalAmount !== 'undefined') ? totalAmount : totalAmountDiscouted;
  
  const customerId = (req.user && req.user.makh) || (req.body.customer && req.body.customer.makh);
  const customerName = (req.user && (req.user.tenkh || req.user.name)) || (req.body.customer && req.body.customer.name) || '';
  const customerPhone = (req.user && (req.user.sdt || req.user.phone)) || (req.body.customer && req.body.customer.phone) || '';
  if (!customerId) return res.status(401).json({ error: 'Không xác thực được khách hàng' });
  const customer = { makh: customerId, name: customerName, phone: customerPhone };
  
  console.log('🔍 [ORDER] Received data:');
  console.log('  - clientSubtotal:', clientSubtotal);
  console.log('  - clientDiscount:', clientDiscount);
  console.log('  - clientFinalTotal (client-provided):', clientFinalTotal);
  console.log('  - freeShipCode:', freeShipCode);
  console.log('  - discountCode:', discountCode);
    
    // Kiểm tra dữ liệu đầu vào
    if (!customer || !items || !shippingAddress || !paymentMethod) {
      return res.status(400).json({ error: 'Thiếu thông tin bắt buộc' });
    }

    // Kiểm tra các trường bắt buộc
    if (!customer.makh || !customer.name || !customer.phone || !shippingAddress.detail ||
      !shippingAddress.province || !shippingAddress.district || !shippingAddress.ward) {
      return res.status(400).json({ error: 'Thông tin khách hàng hoặc địa chỉ không đầy đủ' });
    }

    // Kiểm tra khách hàng (lấy thêm loyalty fields)
    const [existingCustomer] = await connection.query('SELECT makh, email, loyalty_points, loyalty_tier FROM khachhang WHERE makh = ?', [customer.makh]);
    if (!existingCustomer.length) {
      return res.status(400).json({ error: 'Khách hàng không tồn tại' });
    }

    // Kiểm tra items
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Không có sản phẩm được chọn' });
    }

    // Validate sản phẩm và tồn kho + Lấy trọng lượng
    const cartItems = [];
    let totalWeight = 0; // Tổng trọng lượng (gram)
    
    for (const item of items) {
      if (!item.MaSP || !item.SoLuong || item.SoLuong < 1) {
        return res.status(400).json({ error: `Sản phẩm ${item.MaSP} không hợp lệ` });
      }
      
      const [product] = await connection.query(
        'SELECT MaSP, DonGia as price, SoLuong as stock, TenSP, HinhAnh, TrongLuong FROM sanpham WHERE MaSP = ?',
        [item.MaSP]
      );
      
      if (!product.length) {
        return res.status(400).json({ error: `Sản phẩm ${item.MaSP} không tồn tại` });
      }
      
      if (product[0].stock < item.SoLuong) {
        return res.status(400).json({ error: `Sản phẩm ${item.MaSP} không đủ tồn kho (${product[0].stock} < ${item.SoLuong})` });
      }
      
      // Tính tổng trọng lượng
      const productWeight = product[0].TrongLuong || 0; // gram
      totalWeight += productWeight * item.SoLuong;
      
      cartItems.push({
        productId: item.MaSP,
        quantity: item.SoLuong,
        price: product[0].price,
        productName: product[0].TenSP,
        productImage: product[0].HinhAnh,
        weight: productWeight
      });
    }

    console.log(`📦 Tổng trọng lượng đơn hàng: ${totalWeight}g`);

  // ===== Giá trị tiền quay về từ client (dùng làm fallback) =====
  // Nhưng chúng ta phải tái tính toàn bộ mã khuyến mãi server-side để tránh bị sửa đổi từ client.
  let subtotal = clientSubtotal || cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  // discountAmount có thể bị override bởi server-side calculation
  let discountAmount = clientDiscount || 0; // Giảm giá từ mã KM (client-sent, dùng như fallback)
  const amountAfterDiscount = subtotal - discountAmount;
    
    console.log('🔍 [ORDER] Price calculation:');
    console.log('  - subtotal:', subtotal);
    console.log('  - discountAmount:', discountAmount, '(from promo code)');
    console.log('  - amountAfterDiscount:', amountAfterDiscount);
    
    // Lấy thông tin tier cho ghi chú (existingCustomer đã query ở trên rồi)
    const customerRow = existingCustomer[0];
    // Prefer loyalty tier from token (req.user) if present — keeps frontend & server consistent
    const tokenTier = (req.user && (req.user.loyalty_tier || req.user.loyalty_tier === 0)) ? req.user.loyalty_tier : null;
    const userTier = tokenTier || customerRow.loyalty_tier || computeTier(customerRow.loyalty_points || 0);
    console.log('🔍 [LOYALTY] tokenTier=', tokenTier, 'dbTier=', customerRow.loyalty_tier, 'loyalty_points=', customerRow.loyalty_points, '-> userTier=', userTier);

    // ===== Server-side recalculation & validation for discountCode =====
    // We'll compute canonical discountAmountServer and override client value if different.
    let promoToMark = null; // { type: 'khachhang_khuyenmai'|'phieugiamgia_phathanh', ma: ... , code: ... }
    if (discountCode && String(discountCode).trim()) {
      try {
        const code = String(discountCode).trim();
        // 1) Try to find promotion record by code (khuyen_mai)
        const [[foundPromo]] = await connection.query(
          `SELECT k.*, CAST(k.TrangThai AS UNSIGNED) as TrangThai, ct.GiaTriGiam, ct.GiaTriDonToiThieu, ct.GiamToiDa, ct.SoLuongToiThieu
           FROM khuyen_mai k
           LEFT JOIN ct_khuyen_mai ct ON k.MaKM = ct.MaKM
           WHERE k.Code = ? AND k.TrangThai = 1 AND k.NgayBatDau <= NOW() AND k.NgayKetThuc >= NOW() LIMIT 1`,
          [code]
        );

        let promotion = foundPromo || null;
        let couponIssuedRow = null;

        // 2) If not found in khuyen_mai, try coupon issuance table for this customer
        if (!promotion) {
          // Try to find issued coupon by either the issuance field or the public coupon code
          const [[couponRow]] = await connection.query(
            `SELECT ph.*, p.MaKM as Coupon_MaKM, p.TrangThai as Coupon_TrangThai, p.MaPhieu as Coupon_Code, p.MoTa as Coupon_MoTa
             FROM phieugiamgia_phathanh ph
             JOIN phieugiamgia p ON ph.MaPhieu = p.MaPhieu
             WHERE (ph.MaPhieu = ? OR p.MaPhieu = ?) AND ph.makh = ? LIMIT 1`,
            [code, code, customer.makh]
          );

          if (couponRow) {
            couponIssuedRow = couponRow;
            // if linked to MaKM, load that promotion
            if (couponRow.Coupon_MaKM) {
              const [[promoFromCoupon]] = await connection.query(
                `SELECT k.*, CAST(k.TrangThai AS UNSIGNED) as TrangThai, ct.GiaTriGiam, ct.GiaTriDonToiThieu, ct.GiamToiDa, ct.SoLuongToiThieu
                 FROM khuyen_mai k
                 LEFT JOIN ct_khuyen_mai ct ON k.MaKM = ct.MaKM
                 WHERE k.MaKM = ? AND k.TrangThai = 1 AND k.NgayBatDau <= NOW() AND k.NgayKetThuc >= NOW() LIMIT 1`,
                [couponRow.Coupon_MaKM]
              );
              promotion = promoFromCoupon || null;
            } else {
              // coupon-only (no MaKM) — we can treat it as a simple fixed amount or template; for safety fallback to zero if not explicitly supported
              promotion = {
                MaKM: null,
                LoaiKM: null,
                GiaTriDonToiThieu: 0,
                GiaTriGiam: 0,
                GiamToiDa: null,
                Audience: null
              };
            }
          }
        }

        // If we have a promotion, compute discount server-side
        if (promotion) {
          console.log('🔍 [PROMO FOUND] promotion=', promotion);
          const promoType = String(promotion.LoaiKM || '').toLowerCase();

          // Build eligible product list
          let eligibleItems = [];
          if (promotion.MaKM) {
            // Find which cart items are linked to this promotion
            const rows = await Promise.all(cartItems.map(async it => {
              const [r] = await connection.query(
                `SELECT 1 FROM sp_khuyen_mai WHERE MaKM = ? AND MaSP = ? LIMIT 1`,
                [promotion.MaKM, it.productId]
              );
              return r && r.length ? it : null;
            }));
            eligibleItems = rows.filter(Boolean);

            // If none linked but promotion is free_ship or form-only/private-assigned -> apply to all
            if (eligibleItems.length === 0) {
              const isFree = promoType === 'free_ship';
              const isFormOnly = promotion.Audience === 'FORM_ONLY';
              // check customer assignment
              let customerAssigned = false;
              try {
                const [[assigned]] = await connection.query(`SELECT * FROM khachhang_khuyenmai WHERE makh = ? AND makm = ? LIMIT 1`, [customer.makh, promotion.MaKM]);
                customerAssigned = !!assigned;
              } catch (e) { /* ignore */ }

              if (isFree || isFormOnly || (promotion.Audience === 'PRIVATE' && customerAssigned)) {
                eligibleItems = cartItems.map(it => it);
              }
            }
          } else {
            // No MaKM (coupon-only) -> apply to all cart items
            eligibleItems = cartItems.map(it => it);
          }

          // Calculate subtotalEligible and quantity
          const subtotalEligible = eligibleItems.reduce((s, it) => s + (it.price || 0) * (it.quantity || 0), 0);
          const totalQtyEligible = eligibleItems.reduce((s, it) => s + (it.quantity || 0), 0);

          console.log('🔍 [ELIGIBLE ITEMS] ids=', eligibleItems.map(i=>i.productId), 'subtotalEligible=', subtotalEligible, 'totalQtyEligible=', totalQtyEligible);

          // Enforce promotion minima
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
              // free_ship: discount in money terms is 0; shipping handled separately
              computedDiscount = 0;
            } else {
              computedDiscount = 0;
            }
          } else {
            console.log(`⚠️ Promotion ${discountCode} minima not met on server (required amount ${minAmount}, qty ${minQty})`);
            computedDiscount = 0;
          }

          // Override discountAmount with server-computed value
          console.log('🔍 [COMPUTED DISCOUNT] beforeOverride=', computedDiscount, 'clientDiscount=', discountAmount);
          if (computedDiscount !== discountAmount) {
            console.log(`🔁 Overriding client discount (${discountAmount}) with server-computed discount (${computedDiscount}) for code ${discountCode}`);
            discountAmount = computedDiscount;
          }

          // Prepare to mark promo as used later (after order created) if computedDiscount > 0 or promo is free_ship
          if (promotion.MaKM) {
            promoToMark = { type: 'khachhang_khuyenmai', MaKM: promotion.MaKM };
          } else if (couponIssuedRow) {
            promoToMark = { type: 'phieugiamgia_phathanh', code: couponIssuedRow.MaPhieu };
          }
          console.log('🔍 [PROMO SELECTED TO MARK] promoToMark=', promoToMark);
        } else {
          console.log(`⚠️ Không tìm thấy khuyến mãi cho mã: ${discountCode} (server)`);
        }
      } catch (e) {
        console.error('❌ Error while recalculating promotion on server:', e);
      }
    }

    // 🚢 TÍNH PHÍ SHIP
    let shippingFee = calculateShippingFee(shippingAddress.province, totalWeight, userTier);
    let isFreeShip = false;
    
    // Kiểm tra mã free ship (nếu có)
    if (freeShipCode && freeShipCode.trim()) {
      try {
        const [[freeShipPromo]] = await connection.query(
          `SELECT k.MaKM, k.TenKM, k.LoaiKM, k.Code, CAST(k.TrangThai AS UNSIGNED) AS TrangThai,
                  ct.GiaTriDonToiThieu
           FROM khuyen_mai k
           JOIN ct_khuyen_mai ct ON k.MaKM = ct.MaKM
           WHERE k.Code = ? 
             AND k.LoaiKM = 'free_ship'
             AND k.TrangThai = 1 
             AND k.NgayBatDau <= NOW() 
             AND k.NgayKetThuc >= NOW()`,
          [freeShipCode.trim()]
        );

        if (freeShipPromo) {
          // Kiểm tra khách hàng đã claim mã free ship chưa
          const [[claim]] = await connection.query(
            `SELECT * 
             FROM khachhang_khuyenmai 
             WHERE makh = ? 
               AND makm = ? 
               AND UPPER(REPLACE(trang_thai, ' ', '_')) = 'CHUA_SU_DUNG' 
               AND ngay_het_han >= NOW()`,
            [customer.makh, freeShipPromo.MaKM]
          );

          if (claim) {
            // Kiểm tra điều kiện tối thiểu
            if (subtotal >= (freeShipPromo.GiaTriDonToiThieu || 0)) {
              shippingFee = 0;
              isFreeShip = true;
              console.log(`🎉 Áp dụng mã free ship: ${freeShipCode}`);
              
              // Đánh dấu mã đã sử dụng
              await connection.query(
                `UPDATE khachhang_khuyenmai 
                 SET trang_thai = 'Da_su_dung' 
                 WHERE makh = ? AND makm = ?`,
                [customer.makh, freeShipPromo.MaKM]
              );
            } else {
              console.log(`⚠️ Mã free ship không đủ điều kiện tối thiểu: ${freeShipPromo.GiaTriDonToiThieu}`);
            }
          } else {
            console.log(`⚠️ Khách hàng chưa claim mã free ship hoặc đã sử dụng`);
          }
        } else {
          // Nếu không tìm thấy trong khuyen_mai (Code), thử tìm trong bảng phieugiamgia_phathanh (mã phát hành từ form)
          try {
            // Try to match issued coupon by several common identifiers: MaPhieu, MaPhatHanh, p.MaPhieu or p.Code
            const [[issued]] = await connection.query(
              `SELECT ph.MaPhatHanh, ph.MaPhieu, ph.NgayPhatHanh, ph.NgaySuDung,
                      k.MaKM AS Promo_MaKM, k.Code AS Promo_Code, k.LoaiKM AS Promo_LoaiKM, ct.GiaTriDonToiThieu AS Promo_GiaTriDonToiThieu
               FROM phieugiamgia_phathanh ph
               JOIN phieugiamgia p ON ph.MaPhieu = p.MaPhieu
               JOIN khuyen_mai k ON p.MaKM = k.MaKM
               LEFT JOIN ct_khuyen_mai ct ON k.MaKM = ct.MaKM
               WHERE (ph.MaPhieu = ? OR ph.MaPhatHanh = ? OR p.MaPhieu = ? OR p.Code = ?) AND ph.makh = ? LIMIT 1`,
              [freeShipCode.trim(), freeShipCode.trim(), freeShipCode.trim(), freeShipCode.trim(), customer.makh]
            );

            if (issued) {
              if (!issued.NgaySuDung) {
                // Check promo type directly from joined khuyen_mai row
                const promoType = String(issued.Promo_LoaiKM || '').toLowerCase();
                const minAmountReq = issued.Promo_GiaTriDonToiThieu || 0;

                if (promoType !== 'free_ship') {
                  console.log(`⚠️ Phiếu ${issued.MaPhieu} liên kết MaKM=${issued.Promo_MaKM} không phải free_ship (Loại=${issued.Promo_LoaiKM})`);
                } else if (subtotal < minAmountReq) {
                  console.log(`⚠️ Phiếu ${issued.MaPhieu} yêu cầu tối thiểu ${minAmountReq}`);
                } else {
                  shippingFee = 0;
                  isFreeShip = true;
                  console.log(`🎉 Áp dụng mã free ship (issued): ${issued.MaPhieu} (MaKM=${issued.Promo_MaKM})`);
                  // Mark the issued voucher after order creation
                  promoToMark = { type: 'phieugiamgia_phathanh', code: issued.MaPhieu };
                }
              } else {
                console.log(`⚠️ Phiếu ${issued.MaPhieu} đã được sử dụng trước đó: NgaySuDung=${issued.NgaySuDung}`);
              }
            } else {
              console.log(`⚠️ Mã free ship không hợp lệ hoặc đã hết hạn: ${freeShipCode}`);
            }
          } catch (e2) {
            console.error('❌ Error while checking issued free-ship coupon:', e2);
          }
        }
      } catch (freeShipError) {
        console.error('❌ Error checking free ship code:', freeShipError);
        // Không throw error, chỉ log và tiếp tục với phí ship thông thường
      }
    }
    
    console.log(`🚢 Phí ship cuối cùng: ${shippingFee.toLocaleString('vi-VN')} VND (Free ship: ${isFreeShip})`);

    // ===== Server-side membership discount when FreeShip is applied =====
    // Frontend applies a percent discount on subtotal when FreeShip is active
    // (Bạc: 3%, Vàng: 5%) and subtotal >= 300000. We must replicate here.
    // Normalize userTier because it may arrive as number, unaccented text, or DB/token string
    const normalizeTier = tier => {
      if (!tier && tier !== 0) return 'Đồng';
      const t = String(tier).trim();
      if (/vang|v[aàảãáạ]ng/i.test(t)) return 'Vàng';
      if (/bac|b[aàảãáạ]c/i.test(t)) return 'Bạc';
      if (/đồng|dong|dong/i.test(t)) return 'Đồng';
      // numeric mapping (common): 2 -> Vàng, 1 -> Bạc, 0 -> Đồng
      if (!isNaN(Number(t))) {
        const n = Number(t);
        if (n >= 2) return 'Vàng';
        if (n === 1) return 'Bạc';
        return 'Đồng';
      }
      return t; // fallback to raw
    };

    const userTierNormalized = normalizeTier(userTier);
    let memberDiscountAmount = 0;
    if (isFreeShip) {
      const memberPctMap = { 'Bạc': 0.03, 'Vàng': 0.05 };
      const pct = memberPctMap[userTierNormalized] || 0;
      if (pct > 0 && subtotal >= 300000) {
        memberDiscountAmount = Math.round(subtotal * pct);
        console.log(`🎖️ Member tier ${userTierNormalized} discount applied server-side: -${memberDiscountAmount.toLocaleString('vi-VN')} (${pct * 100}%)`);
      } else if (pct > 0) {
        console.log(`ℹ️ Member tier ${userTierNormalized} eligible but subtotal < 300k -> no member discount`);
      }
    }

    console.log('🔍 [SUMMARY DEBUG] subtotal=', subtotal, 'discountAmount=', discountAmount, 'memberDiscountAmount=', memberDiscountAmount, 'shippingFee=', shippingFee);

    // Tổng tiền cuối cùng = Tiền hàng (đã giảm từ mã KM) - memberDiscountAmount + Phí ship
    const finalTotalAmount = Math.max(0, amountAfterDiscount - memberDiscountAmount + shippingFee);
    console.log(`� [DEBUG] subtotal: ${subtotal}, amountAfterDiscount: ${amountAfterDiscount}, memberDiscountAmount: ${memberDiscountAmount}, shippingFee: ${shippingFee}`);
    console.log(`�💵 Tổng tiền cuối cùng (bao gồm ship & member): ${finalTotalAmount.toLocaleString('vi-VN')} VND`);

    // BẮT ĐẦU TRANSACTION
    await connection.beginTransaction();

    // Lưu địa chỉ: trước tiên kiểm tra xem khách hàng đã có địa chỉ giống hệt chưa
    // Nếu đã có -> reuse MaDiaChi; nếu chưa -> insert mới
    const [matchingAddrRows] = await connection.query(
      `SELECT MaDiaChi FROM diachi WHERE MaKH = ? AND TenNguoiNhan = ? AND SDT = ? AND DiaChiChiTiet = ? AND TinhThanh = ? AND QuanHuyen = ? AND PhuongXa = ? LIMIT 1`,
      [customer.makh, customer.name, customer.phone, shippingAddress.detail, shippingAddress.province, shippingAddress.district, shippingAddress.ward]
    );
    let addressId;
    if (matchingAddrRows && matchingAddrRows.length > 0) {
      addressId = matchingAddrRows[0].MaDiaChi;
      console.log(`Reusing existing address MaDiaChi=${addressId} for customer ${customer.makh}`);
    } else {
      const [addressResult] = await connection.query(
        'INSERT INTO diachi (MaKH, TenNguoiNhan, SDT, DiaChiChiTiet, TinhThanh, QuanHuyen, PhuongXa) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [customer.makh, customer.name, customer.phone, shippingAddress.detail, shippingAddress.province, shippingAddress.district, shippingAddress.ward]
      );
      addressId = addressResult.insertId;
      console.log(`Inserted new address MaDiaChi=${addressId} for customer ${customer.makh}`);
    }

    // ✅ Resolve tên tỉnh để ghi chú rõ ràng (thay vì mã số)
    let provinceName = shippingAddress.province;
    if (/^\d+$/.test(String(provinceName).trim())) {
      // Nếu là mã số, tìm tên trong citiesData
      const cityObj = citiesData.find(c => c.city_id === provinceName);
      if (cityObj) {
        provinceName = cityObj.city_name;
        console.log(`📍 Resolved province code ${shippingAddress.province} → ${provinceName}`);
      }
    }
    
    // Tạo đơn hàng - lưu TongTien bao gồm phí ship; ghi note khuyến mãi + phí ship
    const shipNote = isFreeShip ? `Phí ship: 0đ (FREE SHIP - Mã: ${freeShipCode})` : `Phí ship: ${shippingFee.toLocaleString()}đ (${provinceName}, Trọng lượng: ${totalWeight}g)`;
    
    // ✅ Ghi chú về khuyến mãi đã áp dụng
    let promoNote = '';
    if (discountCode && discountAmount > 0) {
      promoNote = `[PROMO] Mã: ${discountCode}; Giảm giá: ${discountAmount.toLocaleString()}đ\n`;
    }
    // Nếu promoToMark là phiếu phát hành (issued coupon), thêm mã phiếu vào ghi chú
    if (!promoNote && promoToMark && promoToMark.type === 'phieugiamgia_phathanh' && promoToMark.code) {
      promoNote = `[PROMO] Phiếu: ${promoToMark.code}\n`;
    }

    // Ghi chú member discount nếu có
    let memberNote = '';
    if (memberDiscountAmount && memberDiscountAmount > 0) {
      memberNote = `[MEMBER] Giảm theo hạng ${userTier}: ${memberDiscountAmount.toLocaleString()}đ\n`;
    }

    const noteWithDetails = `${notes || ''}\n${promoNote}${memberNote}[LOYALTY] Hạng: ${userTier}\n[SHIPPING] ${shipNote}`;
    
    const [orderResult] = await connection.query(
      `INSERT INTO hoadon (makh, MaDiaChi, NgayTao, TongTien, PhuongThucThanhToan, GhiChu, tinhtrang, TrangThaiThanhToan, PhiShip) 
       VALUES (?, ?, NOW(), ?, ?, ?, ?, ?, ?)`,
      [customer.makh, addressId, finalTotalAmount, paymentMethod, noteWithDetails, 'Chờ xử lý', 'Chưa thanh toán', shippingFee]
    );
    const orderId = orderResult.insertId;

    // ===== Persist promo usage (mark as used) inside the same transaction =====
    if (promoToMark) {
      try {
        console.log('🔍 [PROMO MARK] promoToMark=', promoToMark, 'discountAmount=', discountAmount, 'isFreeShip=', isFreeShip);

        if (promoToMark.type === 'khachhang_khuyenmai' && promoToMark.MaKM) {
          try {
            const [preRows] = await connection.query(
              `SELECT * FROM khachhang_khuyenmai WHERE makh = ? AND makm = ? LIMIT 1`,
              [customer.makh, promoToMark.MaKM]
            );
            console.log('🔎 [PRE-MARK] khachhang_khuyenmai select result =', preRows && preRows.length ? preRows[0] : null);

            // Mark claimed customer promo as used if discount was actually applied OR free-ship was applied
            if (discountAmount > 0 || isFreeShip) {
              // Note: the table `khachhang_khuyenmai` in some schemas does not have a
              // `NgaySuDung` column. Only phieugiamgia_phathanh has NgaySuDung in our
              // migrations. To avoid ER_BAD_FIELD_ERROR, update only `trang_thai` here.
              const [updateRes] = await connection.query(
                `UPDATE khachhang_khuyenmai SET trang_thai = 'Da_su_dung' WHERE makh = ? AND makm = ? AND UPPER(REPLACE(trang_thai, ' ', '_')) = 'CHUA_SU_DUNG' LIMIT 1`,
                [customer.makh, promoToMark.MaKM]
              );
              console.log('🔎 [MARK RESULT] khachhang_khuyenmai update result =', updateRes && updateRes.affectedRows ? { affectedRows: updateRes.affectedRows } : updateRes);
              if (updateRes && updateRes.affectedRows && updateRes.affectedRows > 0) {
                console.log(`✅ Đã đánh dấu khuyến mãi MaKM=${promoToMark.MaKM} là đã sử dụng cho makh=${customer.makh}`);
              } else {
                  console.log(`⚠️ UPDATE không ảnh hưởng dòng nào cho khachhang_khuyenmai (makh=${customer.makh}, MaKM=${promoToMark.MaKM})`);
                  // Fallback: nếu không có row trong khachhang_khuyenmai, thử đánh dấu bất kỳ phiếu phát hành nào liên quan tới MaKM
                  try {
                    const [fallbackRes] = await connection.query(
                          `UPDATE phieugiamgia_phathanh ph
                            JOIN phieugiamgia p ON ph.MaPhieu = p.MaPhieu
                            SET ph.NgaySuDung = NOW(), ph.TrangThaiSuDung = 'DA_SU_DUNG'
                            WHERE ph.makh = ? AND p.MaKM = ? AND ph.NgaySuDung IS NULL`,
                           [customer.makh, promoToMark.MaKM]
                    );
                    console.log('🔎 [FALLBACK MARK] phieugiamgia_phathanh update result =', fallbackRes && fallbackRes.affectedRows ? { affectedRows: fallbackRes.affectedRows } : fallbackRes);
                    if (fallbackRes && fallbackRes.affectedRows && fallbackRes.affectedRows > 0) {
                      console.log(`✅ Fallback: Đã đánh dấu phieugiamgia_phathanh liên quan MaKM=${promoToMark.MaKM} cho makh=${customer.makh}`);
                    }
                  } catch (fbErr) {
                    console.error('❌ Lỗi fallback đánh dấu phieugiamgia_phathanh:', fbErr);
                  }
              }
            } else {
              console.log(`ℹ️ Không đánh dấu MaKM=${promoToMark.MaKM} cho makh=${customer.makh} vì không có giảm giá và không phải free-ship`);
            }
          } catch (innerErr) {
            console.error('❌ Lỗi khi kiểm tra/đánh dấu khachhang_khuyenmai:', innerErr);
          }
        } else if (promoToMark.type === 'phieugiamgia_phathanh' && promoToMark.code) {
          try {
            const [preCoupon] = await connection.query(
              `SELECT * FROM phieugiamgia_phathanh WHERE MaPhieu = ? AND makh = ? LIMIT 1`,
              [promoToMark.code, customer.makh]
            );
            console.log('🔎 [PRE-MARK] phieugiamgia_phathanh select result =', preCoupon && preCoupon.length ? preCoupon[0] : null);

            // For issued coupons, mark them when discount was applied (non-zero) OR when explicitly free-ship
            if (discountAmount > 0 || isFreeShip) {
              const [updateRes] = await connection.query(
                `UPDATE phieugiamgia_phathanh SET NgaySuDung = NOW(), TrangThaiSuDung = 'DA_SU_DUNG' WHERE makh = ? AND MaPhieu = ? AND NgaySuDung IS NULL LIMIT 1`,
                [customer.makh, promoToMark.code]
              );
              console.log('🔎 [MARK RESULT] phieugiamgia_phathanh update result =', updateRes && updateRes.affectedRows ? { affectedRows: updateRes.affectedRows } : updateRes);
              if (updateRes && updateRes.affectedRows && updateRes.affectedRows > 0) {
                console.log(`✅ Đã đánh dấu coupon ${promoToMark.code} (phieugiamgia_phathanh) là đã sử dụng cho makh=${customer.makh}`);
              } else {
                console.log(`⚠️ UPDATE không ảnh hưởng dòng nào cho phieugiamgia_phathanh (MaPhieu=${promoToMark.code}, makh=${customer.makh})`);
                // Fallback: thử cập nhật khachhang_khuyenmai nếu có liên quan tới MaKM của phieugiamgia
                try {
                  const [pRow] = await connection.query(
                    `SELECT p.MaKM FROM phieugiamgia p WHERE p.MaPhieu = ? LIMIT 1`,
                    [promoToMark.code]
                  );
                  const linkedMaKM = pRow && pRow.length ? pRow[0].MaKM : null;
                  if (linkedMaKM) {
                    const [fbUpdate] = await connection.query(
                      `UPDATE khachhang_khuyenmai SET trang_thai = 'Da_su_dung', NgaySuDung = NOW() WHERE makh = ? AND makm = ? AND UPPER(REPLACE(trang_thai, ' ', '_')) = 'CHUA_SU_DUNG' LIMIT 1`,
                      [customer.makh, linkedMaKM]
                    );
                    console.log('🔎 [FALLBACK MARK] khachhang_khuyenmai update result =', fbUpdate && fbUpdate.affectedRows ? { affectedRows: fbUpdate.affectedRows } : fbUpdate);
                    if (fbUpdate && fbUpdate.affectedRows && fbUpdate.affectedRows > 0) {
                      console.log(`✅ Fallback: Đã đánh dấu khachhang_khuyenmai MaKM=${linkedMaKM} cho makh=${customer.makh}`);
                    }
                  }
                } catch (fbErr) {
                  console.error('❌ Lỗi fallback đánh dấu khachhang_khuyenmai:', fbErr);
                }
              }
            } else {
              console.log(`ℹ️ Không đánh dấu coupon ${promoToMark.code} vì không có giảm giá và không phải free-ship`);
            }
          } catch (innerErr) {
            console.error('❌ Lỗi khi kiểm tra/đánh dấu phieugiamgia_phathanh:', innerErr);
          }
        } else {
          console.log('ℹ️ promoToMark không phải kiểu đã biết hoặc thiếu dữ liệu:', promoToMark);
        }
      } catch (markErr) {
        console.error('❌ Error marking promo usage after order insert:', markErr);
        // don't throw - just log; order creation should still continue
      }
    }

    // Lưu chi tiết đơn hàng
    for (const item of cartItems) {
      await connection.query(
        'INSERT INTO chitiethoadon (MaHD, MaSP, SoLuong, DonGia) VALUES (?, ?, ?, ?)',
        [orderId, item.productId, item.quantity, item.price]
      );
      
      await connection.query('UPDATE sanpham SET SoLuong = SoLuong - ? WHERE MaSP = ?', [item.quantity, item.productId]);
    }

    // Xóa giỏ hàng
    if (cartItems.length > 0) {
      const productIds = cartItems.map(i => i.productId);
      const placeholders = productIds.map(() => '?').join(',');
      await connection.query(
        `DELETE FROM giohang WHERE MaKH = ? AND MaSP IN (${placeholders})`, 
        [customer.makh, ...productIds]
      );
    }

    // COMMIT trước xử lý thanh toán
    await connection.commit();
    console.log('✅ Database operations completed successfully');

    // XỬ LÝ THANH TOÁN: dùng finalTotalAmount (bao gồm phí ship)
    if (paymentMethod === 'VNPAY') {
      try {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        console.log('🔍 [VNPay] finalTotalAmount:', finalTotalAmount);
        console.log('🔍 [VNPay] vnp_Amount (x100):', finalTotalAmount * 100);
        
        // ✅ VNPay yêu cầu số tiền phải nhân với 100 (đơn vị: VND x 100)
        const vnpayResponse = await vnpay.buildPaymentUrl({
          vnp_Amount: finalTotalAmount,
          vnp_IpAddr: req.ip || req.connection.remoteAddress || '127.0.0.1',
          vnp_TxnRef: orderId.toString(),
          vnp_OrderInfo: `Thanh toan don hang ${orderId}`,
          vnp_OrderType: ProductCode.Other,
          vnp_ReturnUrl: process.env.VNP_RETURN_URL,
          vnp_Locale: VnpLocale.VN,
          vnp_CreateDate: dateFormat(new Date()),
          vnp_ExpireDate: dateFormat(tomorrow),
        });
        
        console.log('✅ VNPay URL generated for order:', orderId);
        console.log('🔗 [VNPay] Full Payment URL:', vnpayResponse);
        // Attempt to send order confirmation email (non-blocking)
        (async () => {
          try {
            const email = existingCustomer[0].email;
            // Resolve address names for readability
            const resolvedProvince = await resolveProvince(shippingAddress.province).catch(() => shippingAddress.province);
            const resolvedDistrict = await resolveDistrict(shippingAddress.district).catch(() => shippingAddress.district);
            const resolvedWard = await resolveWard(shippingAddress.ward).catch(() => shippingAddress.ward);
            const emailShippingAddress = {
              detail: shippingAddress.detail,
              province: resolvedProvince,
              district: resolvedDistrict,
              ward: resolvedWard
            };

            const orderPayload = {
              id: orderId,
              total: finalTotalAmount,
              subtotal: amountAfterDiscount,
              shippingFee: shippingFee,
              paymentMethod: paymentMethod,
              paymentUrl: vnpayResponse,
              customerName: customer.name,
              shippingAddress: emailShippingAddress,
              items: cartItems
            };
            if (email) {
              const sent = await sendOrderConfirmationEmail(email, orderPayload);
              if (!sent) console.warn(`Email confirmation not sent for order ${orderId}`);
            }
          } catch (e) {
            console.error('Non-blocking email send failed (VNPAY):', e && e.message ? e.message : e);
          }
        })();

        return res.status(200).json({ 
          success: true, 
          orderId, 
          paymentUrl: vnpayResponse,
          message: 'Đơn hàng đã được tạo, chuyển hướng thanh toán VNPay',
          appliedTier: userTier,
          discountAmount,
          amountAfterDiscount,
          memberDiscountAmount,
          shippingFee,
          finalTotalAmount
        });
      } catch (vnpayError) {
        console.error('❌ VNPay error:', vnpayError);
        // Rollback order nếu VNPay lỗi
        await pool.query('UPDATE hoadon SET tinhtrang = "Đã hủy", GhiChu = "Lỗi VNPay" WHERE MaHD = ?', [orderId]);
        return res.status(500).json({ 
          error: 'Lỗi tạo URL thanh toán VNPay', 
          details: vnpayError.message 
        });
      }
    } else if (paymentMethod === 'COD') {
      // COD success: thêm điểm trên finalTotalAmount (non-blocking)
      console.log('✅ COD Order completed successfully with ID:', orderId);
      try {
        const loyRes = await addLoyaltyPoints(connection, customer.makh, finalTotalAmount);
        console.log(`Loyalty: added points for customer ${customer.makh} (COD order ${orderId})`, { loyRes });
        if (loyRes && loyRes.error) console.warn('Loyalty add returned error (non-blocking):', loyRes.error);
      } catch (e) {
        console.warn('Loyalty add failed (non-blocking):', e && e.message);
      }

      // Send confirmation email for COD orders (non-blocking)
      (async () => {
        try {
          const email = existingCustomer[0].email;
          // Resolve address names for readability
          const resolvedProvince = await resolveProvince(shippingAddress.province).catch(() => shippingAddress.province);
          const resolvedDistrict = await resolveDistrict(shippingAddress.district).catch(() => shippingAddress.district);
          const resolvedWard = await resolveWard(shippingAddress.ward).catch(() => shippingAddress.ward);
          const emailShippingAddress = {
            detail: shippingAddress.detail,
            province: resolvedProvince,
            district: resolvedDistrict,
            ward: resolvedWard
          };

          const orderPayload = {
            id: orderId,
            total: finalTotalAmount,
            subtotal: amountAfterDiscount,
            shippingFee: shippingFee,
            paymentMethod: paymentMethod,
            customerName: customer.name,
            shippingAddress: emailShippingAddress,
            items: cartItems
          };
          if (email) {
            const sent = await sendOrderConfirmationEmail(email, orderPayload);
            if (!sent) console.warn(`Email confirmation not sent for order ${orderId}`);
          }
        } catch (e) {
          console.error('Non-blocking email send failed (COD):', e && e.message ? e.message : e);
        }
      })();

      return res.status(200).json({ 
        success: true, 
        orderId,
        message: 'Đặt hàng COD thành công',
        paymentMethod: 'COD',
        appliedTier: userTier,
        discountAmount,
        amountAfterDiscount,
        memberDiscountAmount,
        shippingFee,
        finalTotalAmount,
        appliedPromo: promoToMark || null
      });
    } else {
      return res.status(400).json({ error: 'Phương thức thanh toán không hợp lệ' });
    }

  } catch (error) {
    // ❌ ROLLBACK TRANSACTION NẾU CÓ LỖI
    try {
      await connection.rollback();
      console.log('🔄 Transaction rollback completed');
    } catch (rollbackError) {
      console.error('❌ Rollback error:', rollbackError);
    }
    
    console.error('❌ Place order error:', {
      message: error.message,
      stack: error.stack,
      sql: error.sql,
      sqlMessage: error.sqlMessage
    });
    
    res.status(500).json({ 
      error: 'Lỗi khi đặt hàng', 
      details: error.message,
      sqlError: error.sqlMessage 
    });
  } finally {
    // ✅ GIẢI PHÓNG CONNECTION
    if (connection) {
      connection.release();
    }
  }
});
// ...existing code...
// API lấy danh sách hóa đơn (BỎ TOKEN AUTHENTICATION - CHỈ CHO DEV/TEST)
router.get('/hoadon', async (req, res) => {
  try {
    // Log thông tin request để debug (không cần token)
    console.log('Anonymous access to /hoadon:', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString()
    });

    // CẢNH BÁO: KHÔNG CHECK QUYỀN - BẤT KỲ AI CŨNG ĐỌC ĐƯỢC DATA
    // console.warn('⚠️ WARNING: No authentication - Exposed to all users!');

    const [hoadon] = await pool.query(`
      SELECT 
        dh.MaHD AS id,
        dh.makh AS makh,
        dh.NgayTao AS createdAt,
        dh.TongTien AS totalAmount,
        dh.tinhtrang AS status,
        kh.tenkh AS customerName,
        kh.sdt AS customerPhone,
        dc.DiaChiChiTiet AS shippingAddress,
        dc.TinhThanh AS province,
        dc.QuanHuyen AS district,
        dh.PhuongThucThanhToan AS paymentMethod,
        dh.TrangThaiThanhToan AS paymentStatus
      FROM hoadon dh
      LEFT JOIN khachhang kh ON dh.makh = kh.makh
      LEFT JOIN diachi dc ON dh.MaDiaChi = dc.MaDiaChi
      ORDER BY dh.NgayTao DESC
    `);

    console.log(`Returned ${hoadon.length} invoices (no auth)`);

    res.json(hoadon);
  } catch (error) {
    console.error('Lỗi khi lấy danh sách hóa đơn (no auth):', {
      timestamp: new Date(),
      ip: req.ip,
      errorDetails: {
        message: error.message,
        sqlQuery: error.sql,
        sqlMessage: error.sqlMessage,
        stack: error.stack
      }
    });
    res.status(500).json({
      error: 'Lỗi khi lấy danh sách hóa đơn',
      details: process.env.NODE_ENV === 'development' ? {
        type: 'SQL_ERROR',
        message: error.sqlMessage,
        faultyQuery: error.sql,
        stack: error.stack
      } : null
    });
  }
});

// API lấy chi tiết hóa đơn (BỎ TOKEN AUTHENTICATION - CHỈ CHO DEV/TEST)
router.get('/hoadon/:id', async (req, res) => {
  const { id } = req.params;

  try {
    // Log thông tin request để debug (không cần token)
    console.log('Anonymous access to /hoadon/:id:', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      invoiceId: id,
      timestamp: new Date().toISOString()
    });

    // CẢNH BÁO: KHÔNG CHECK QUYỀN - BẤT KỲ AI CŨNG ĐỌC ĐƯỢC CHI TIẾT HÓA ĐƠN
    // console.warn('⚠️ WARNING: No authentication - Exposed to all users!');

    const [hoadon] = await pool.query(`
      SELECT 
        hd.MaHD,
        hd.NgayTao,
        hd.TongTien,
        hd.PhiShip,
        hd.PhuongThucThanhToan,
        hd.GhiChu,
        hd.tinhtrang,
        hd.TrangThaiThanhToan,
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
      WHERE hd.MaHD = ?
    `, [id]);

    if (hoadon.length === 0) {
      console.log(`Invoice ID ${id} not found`);
      return res.status(404).json({ error: `Không tìm thấy hóa đơn ID: ${id}` });
    }

    const [chitiet] = await pool.query(`
      SELECT 
        ct.MaSP,
        ct.Soluong AS quantity,
        ct.DonGia AS price,
        sp.TenSP AS productName,
        sp.HinhAnh AS productImage,
        sp.DonGia AS productPrice
      FROM chitiethoadon ct
      JOIN sanpham sp ON ct.MaSP = sp.MaSP
      WHERE ct.MaHD = ?
    `, [id]);

    console.log(`Returned details for invoice ID ${id}, items: ${chitiet.length}`);

    res.json({
      ...hoadon[0],
      GhiChu: hoadon[0].GhiChu || '',
      items: chitiet
    });
  } catch (error) {
    console.error('Lỗi khi lấy chi tiết hóa đơn:', {
      timestamp: new Date(),
      ip: req.ip,
      invoiceId: id,
      errorDetails: {
        message: error.message,
        sqlQuery: error.sql,
        sqlMessage: error.sqlMessage,
        stack: error.stack
      }
    });
    res.status(500).json({
      error: 'Lỗi hệ thống',
      requestId: id,
      details: process.env.NODE_ENV === 'development' ? {
        type: 'SQL_ERROR',
        message: error.sqlMessage,
        faultyQuery: error.sql,
        stack: error.stack
      } : null
    });
  }
});

//API cập nhật trạng thái hóa đơn (BỎ TOKEN AUTHENTICATION - CHỈ CHO DEV/TEST)
router.put('/hoadon/:id/trangthai', async (req, res) => {
  const { id } = req.params;
  const { trangthai, ghichu } = req.body;

  // Log thông tin request để debug
  console.log('Anonymous access to /hoadon/:id/trangthai:', {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    invoiceId: id,
    trangthai,
    timestamp: new Date().toISOString()
  });

  // CẢNH BÁO: KHÔNG CHECK QUYỀN - BẤT KỲ AI CŨNG CẬP NHẬT ĐƯỢC
  // console.warn('⚠️ WARNING: No authentication - Exposed to all users!');

  if (!trangthai) {
    return res.status(400).json({ error: 'Trạng thái là bắt buộc' });
  }

  const trangThaiHopLe = ['Chờ xử lý', 'Chờ xác nhận', 'Đã xác nhận', 'Đang giao hàng', 'Đã giao hàng', 'Đã hủy'];
  if (!trangThaiHopLe.includes(trangthai)) {
    return res.status(400).json({ error: 'Trạng thái không hợp lệ' });
  }

  try {
    const [hoadon] = await pool.query(
      `SELECT tinhtrang FROM hoadon WHERE MaHD = ?`,
      [id]
    );

    if (hoadon.length === 0) {
      console.log(`Invoice ID ${id} not found`);
      return res.status(404).json({ error: 'Không tìm thấy hóa đơn' });
    }

    let updateQuery = `
      UPDATE hoadon 
      SET tinhtrang = ?, 
          GhiChu = IFNULL(?, GhiChu)
    `;
    const params = [trangthai, ghichu];

    if (trangthai === 'Đã giao hàng') {
      updateQuery += `, TrangThaiThanhToan = 'Đã nhận tiền'`;
    }

    updateQuery += ` WHERE MaHD = ?`;
    params.push(id);

    await pool.query(updateQuery, params);

    console.log(`Updated status for invoice ID ${id} to ${trangthai}`);
    res.json({ success: true, message: 'Cập nhật trạng thái thành công' });
  } catch (error) {
    console.error('Lỗi khi cập nhật trạng thái:', {
      timestamp: new Date(),
      ip: req.ip,
      invoiceId: id,
      errorDetails: {
        message: error.message,
        sqlQuery: error.sql,
        sqlMessage: error.sqlMessage,
        stack: error.stack
      }
    });
    res.status(500).json({
      error: 'Lỗi khi cập nhật trạng thái',
      details: process.env.NODE_ENV === 'development' ? {
        type: 'SQL_ERROR',
        message: error.sqlMessage,
        faultyQuery: error.sql
      } : null
    });
  }
});

// API hủy hóa đơn (BỎ TOKEN AUTHENTICATION - CHỈ CHO DEV/TEST)
router.put('/hoadon/:id/huy', async (req, res) => {
  const { id } = req.params;
  const { lyDo } = req.body;

  // Log thông tin request để debug
  console.log('Anonymous access to /hoadon/:id/huy:', {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    invoiceId: id,
    lyDo,
    timestamp: new Date().toISOString()
  });

  // CẢNH BÁO: KHÔNG CHECK QUYỀN - BẤT KỲ AI CŨNG HỦY ĐƯỢC
  // console.warn('⚠️ WARNING: No authentication - Exposed to all users!');

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [hoadon] = await connection.query(
      `SELECT tinhtrang FROM hoadon WHERE MaHD = ?`,
      [id]
    );

    if (hoadon.length === 0) {
      throw new Error('Không tìm thấy hóa đơn');
    }

    if (hoadon[0].tinhtrang === 'Đã hủy') {
      throw new Error('Hóa đơn đã bị hủy trước đó');
    }

    if (!['Chờ xử lý', 'Đã xác nhận'].includes(hoadon[0].tinhtrang)) {
      throw new Error('Chỉ có thể hủy đơn hàng ở trạng thái "Chờ xử lý" hoặc "Đã xác nhận"');
    }

    await connection.query(
      `UPDATE hoadon 
       SET tinhtrang = 'Đã hủy', 
           GhiChu = CONCAT(IFNULL(GhiChu, ''), ?) 
       WHERE MaHD = ?`,
      [`\nLý do hủy: ${lyDo || 'Không có lý do'}`, id]
    );

    const [chitiet] = await connection.query(
      `SELECT MaSP, Soluong FROM chitiethoadon WHERE MaHD = ?`,
      [id]
    );

    for (const item of chitiet) {
      await connection.query(
        `UPDATE sanpham SET SoLuong = SoLuong + ? WHERE MaSP = ?`,
        [item.Soluong, item.MaSP]
      );
    }

    await connection.commit();
    console.log(`Cancelled invoice ID ${id}, reason: ${lyDo || 'N/A'}`);
    res.json({ success: true, message: 'Hủy hóa đơn thành công' });
  } catch (error) {
    await connection.rollback();
    console.error('Lỗi khi hủy hóa đơn:', {
      timestamp: new Date(),
      ip: req.ip,
      invoiceId: id,
      errorDetails: {
        message: error.message,
        sqlQuery: error.sql,
        sqlMessage: error.sqlMessage,
        stack: error.stack
      }
    });
    res.status(500).json({
      error: 'Lỗi khi hủy hóa đơn',
      details: process.env.NODE_ENV === 'development' ? {
        type: 'SQL_ERROR',
        message: error.sqlMessage || error.message,
        faultyQuery: error.sql || 'N/A'
      } : null
    });
  } finally {
    connection.release();
  }
});
// API lấy danh sách đơn hàng của khách hàng
router.get('/customer-orders/:customerId', authenticateToken, async (req, res) => {
  const { customerId } = req.params;

  try {
    const [orders] = await pool.query(`
      SELECT 
        hd.MaHD AS id,
        hd.NgayTao AS createdAt,
        hd.TongTien AS totalAmount,
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
      ORDER BY hd.NgayTao DESC
    `, [customerId]);

    res.json(orders);
  } catch (error) {
    console.error('Lỗi khi lấy danh sách đơn hàng:', {
      timestamp: new Date(),
      errorDetails: {
        message: error.message,
        sqlQuery: error.sql,
        sqlMessage: error.sqlMessage
      }
    });
    res.status(500).json({
      error: 'Lỗi khi lấy danh sách đơn hàng',
      details: process.env.NODE_ENV === 'development' ? {
        type: 'SQL_ERROR',
        message: error.sqlMessage,
        faultyQuery: error.sql
      } : null
    });
  }
});

// API lấy chi tiết đơn hàng của khách hàng
router.get('/customer-orders/detail/:orderId', authenticateToken, async (req, res) => {
  const { orderId } = req.params;

  try {
    const [order] = await pool.query(`
      SELECT 
        hd.MaHD AS id,
        hd.NgayTao AS createdAt,
        hd.TongTien AS totalAmount,
        hd.PhiShip AS shippingFee,
        hd.tinhtrang AS status,
        hd.PhuongThucThanhToan AS paymentMethod,
        hd.TrangThaiThanhToan AS paymentStatus,
        hd.GhiChu AS notes,
        dc.TenNguoiNhan AS recipientName,
        dc.SDT AS recipientPhone,
        dc.DiaChiChiTiet AS shippingAddress,
        dc.TinhThanh AS province,
        dc.QuanHuyen AS district,
        dc.PhuongXa AS ward
      FROM hoadon hd
      LEFT JOIN diachi dc ON hd.MaDiaChi = dc.MaDiaChi
      WHERE hd.MaHD = ?
    `, [orderId]);

    if (order.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy đơn hàng' });
    }

    const [items] = await pool.query(`
      SELECT 
        ct.MaSP AS productId,
        sp.TenSP AS productName,
        sp.HinhAnh AS productImage,
        sp.TrongLuong AS weight,
        ct.DonGia AS price,
        ct.Soluong AS quantity
      FROM chitiethoadon ct
      JOIN sanpham sp ON ct.MaSP = sp.MaSP
      WHERE ct.MaHD = ?
    `, [orderId]);

    res.json({
      ...order[0],
      items
    });
  } catch (error) {
    console.error('Lỗi khi lấy chi tiết đơn hàng:', {
      timestamp: new Date(),
      errorDetails: {
        message: error.message,
        sqlQuery: error.sql,
        sqlMessage: error.sqlMessage
      }
    });
    res.status(500).json({
      error: 'Lỗi khi lấy chi tiết đơn hàng',
      details: process.env.NODE_ENV === 'development' ? {
        type: 'SQL_ERROR',
        message: error.sqlMessage,
        faultyQuery: error.sql
      } : null
    });
  }
});

// routes: orderRoutes.js
router.put('/customer-orders/cancel/:orderId', authenticateToken, async (req, res) => {
  const { orderId } = req.params;
  const body = req.body || {};

  // Không tin client-sent customerId: lấy từ token
  const customerId = req.user && req.user.makh;
  if (!customerId) return res.status(401).json({ success: false, error: 'Không xác thực được người dùng' });

  // Lý do hủy + thông tin ngân hàng
  const refundReason = body.reason || null;
  let { refundAmount, refundType, bankAccount, bankName, accountHolder, bankBranch } = body;

  // Chuẩn hóa bankAccount: chỉ lấy digits
  if (typeof bankAccount === 'string') bankAccount = bankAccount.replace(/\D/g, '') || null;

  // Helper: kiểm tra thiếu bank fields
  const getMissingBankFields = () => {
    const missing = [];
    if (!bankAccount) missing.push('bankAccount');
    if (!bankName) missing.push('bankName');
    if (!accountHolder) missing.push('accountHolder');
    return missing;
  };

  const nowNote = () => `[${new Date().toLocaleString()}]`;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 1) Khóa đơn hàng và xác định phân nhánh
    const [orderRows] = await conn.query(
      `
      SELECT hd.*,
             CASE 
  WHEN hd.TrangThaiThanhToan IN ('Đã thanh toán','Đang hoàn tiền') THEN 'NEED_REFUND'
  ELSE 'NORMAL_CANCEL'
END AS cancel_type
      FROM hoadon hd
      WHERE hd.MaHD = ? AND hd.makh = ?
      FOR UPDATE
      `,
      [orderId, customerId]
    );

    if (!orderRows.length) {
      await conn.rollback();
      return res.status(404).json({ success: false, error: 'Không tìm thấy đơn hàng hoặc không có quyền' });
    }

    const order = orderRows[0];

    // Trạng thái cho phép hủy (tùy nghiệp vụ của bạn)
    if (!['Chờ xử lý', 'Đã xác nhận'].includes(order.tinhtrang)) {
      await conn.rollback();
      return res.status(400).json({ success: false, error: 'Không thể hủy đơn hàng ở trạng thái hiện tại' });
    }

    // 2) (Optional) Tìm tra_hang để gắn return_id cho refund_request
    const [trows] = await conn.query(
      `SELECT id FROM tra_hang WHERE ma_don_hang = ? ORDER BY id DESC LIMIT 1`,
      [String(orderId)]
    );
    const matchedReturnId = trows?.[0]?.id ?? null;

    // 3) Nếu đã có refund đang PENDING/PROCESSING → ƯU TIÊN cập nhật bank info rồi kết thúc
    const [existing] = await conn.query(
      `
      SELECT * FROM refund_requests
      WHERE orderId = ? 
        AND (customerId = ? OR ? IS NOT NULL AND return_id = ?)
        AND status IN ('PENDING','PROCESSING')
      ORDER BY id DESC
      LIMIT 1
      `,
      [String(orderId), customerId, matchedReturnId, matchedReturnId]
    );

    if (existing.length) {
      // Yêu cầu bank fields khi khách cập nhật
      const missing = getMissingBankFields();
      if (missing.length) {
        await conn.rollback();
        return res.status(400).json({ success: false, error: 'Thiếu thông tin tài khoản nhận hoàn tiền', missingFields: missing });
      }

      const finalRefundAmount =
        body.refundAmount != null
          ? Number(body.refundAmount)
          : Number(order.TongTien || 0);

      await conn.query(
        `
        UPDATE refund_requests
           SET refundAmount = ?,
               bankAccount = ?, bankName = ?, accountHolder = ?, bankBranch = ?,
               refundReason = COALESCE(?, refundReason),
               updatedAt = NOW()
         WHERE id = ?
        `,
        [
          finalRefundAmount,
          bankAccount, bankName, accountHolder, bankBranch || null,
          refundReason,
          existing[0].id
        ]
      );

      // Cập nhật hóa đơn: đánh dấu đã hủy và đang hoàn tiền
      await conn.query(
        `
        UPDATE hoadon
           SET tinhtrang = 'Đã hủy - chờ hoàn tiền',
               TrangThaiThanhToan = 'Đang hoàn tiền',
               GhiChu = CONCAT(IFNULL(GhiChu,''), ?)
         WHERE MaHD = ?
        `,
        [`\n${nowNote()} Khách cập nhật thông tin hoàn tiền (req: ${existing[0].refundRequestId || existing[0].id})`, orderId]
      );

      // Hoàn kho
      await conn.query(
        `
        UPDATE sanpham sp
        JOIN chitiethoadon ct ON sp.MaSP = ct.MaSP
           SET sp.SoLuong = sp.SoLuong + ct.Soluong
         WHERE ct.MaHD = ?
        `,
        [orderId]
      );

      await conn.commit();
      return res.json({
        success: true,
        message: 'Cập nhật yêu cầu hoàn tiền đang xử lý',
        data: { refundId: existing[0].id, status: existing[0].status }
      });
    }

    // 4) Chưa có refund_request nào → Phân nhánh theo cancel_type
    if (order.cancel_type === 'NEED_REFUND') {
      // Validate bank fields
      const missing = getMissingBankFields();
      if (missing.length) {
        await conn.rollback();
        return res.status(400).json({ success: false, error: 'Thiếu thông tin tài khoản nhận hoàn tiền', missingFields: missing });
      }

      const finalRefundAmount =
        body.refundAmount != null
          ? Number(body.refundAmount)
          : Number(order.TongTien || 0);

      const refundRequestId = `REF_${orderId}_${Date.now()}`;

      await conn.query(
        `
        INSERT INTO refund_requests
          (orderId, customerId, refundRequestId, refundAmount, refundType, refundReason,
           bankAccount, bankName, accountHolder, bankBranch,
           status, createdAt, return_id)
        VALUES
          (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', NOW(), ?)
        `,
        [
          String(orderId), customerId, refundRequestId,
          finalRefundAmount,
          refundType || 'full',
          refundReason || null,
          bankAccount, bankName, accountHolder, bankBranch || null,
          matchedReturnId
        ]
      );

      // Cập nhật hóa đơn
      await conn.query(
        `
        UPDATE hoadon
           SET tinhtrang = 'Đã hủy - chờ hoàn tiền',
               TrangThaiThanhToan = 'Đang hoàn tiền',
               GhiChu = CONCAT(IFNULL(GhiChu,''), ?)
         WHERE MaHD = ?
        `,
        [`\n${nowNote()} Yêu cầu hoàn tiền: ${refundRequestId}`, orderId]
      );

      // Hoàn kho
      await conn.query(
        `
        UPDATE sanpham sp
        JOIN chitiethoadon ct ON sp.MaSP = ct.MaSP
           SET sp.SoLuong = sp.SoLuong + ct.Soluong
         WHERE ct.MaHD = ?
        `,
        [orderId]
      );

      await conn.commit();
      return res.json({
        success: true,
        message: 'Đã tạo yêu cầu hoàn tiền thành công',
        data: {
          orderId,
          refundRequestId,
          refundAmount: finalRefundAmount,
          status: 'PENDING',
          bankAccount: bankAccount ? `****${String(bankAccount).slice(-4)}` : null,
          bankName,
          accountHolder,
          return_id: matchedReturnId
        }
      });
    }

    // 5) Nhánh hủy COD (không hoàn tiền qua VNPay)
    await conn.query(
      `
      UPDATE hoadon
         SET tinhtrang = 'Đã hủy',
             GhiChu = CONCAT(IFNULL(GhiChu,''), ?)
       WHERE MaHD = ?
      `,
      [`\n${nowNote()} Lý do hủy: ${refundReason || 'Khách hủy'}`, orderId]
    );

    await conn.query(
      `
      UPDATE sanpham sp
      JOIN chitiethoadon ct ON sp.MaSP = ct.MaSP
         SET sp.SoLuong = sp.SoLuong + ct.Soluong
       WHERE ct.MaHD = ?
      `,
      [orderId]
    );

    await conn.commit();
    return res.json({ success: true, message: 'Đã hủy đơn hàng (COD) thành công', data: { orderId } });

  } catch (err) {
    try { await conn.rollback(); } catch (e) {}
    console.error('Cancel-with-refund error:', err);
    return res.status(500).json({ success: false, error: 'Lỗi khi xử lý hủy đơn', details: err.message });
  } finally {
    conn.release();
  }
});


// API xử lý return URL từ VNPay - CHỈ SỬA TRẠNG THÁI
router.get('/vnpay_return', async (req, res) => {
  try {
    console.log('VNPay Return params:', req.query);
    
    const verify = vnpay.verifyReturnUrl(req.query);
    const orderId = req.query.vnp_TxnRef;
    const rspCode = req.query.vnp_ResponseCode;
    const amount = parseInt(req.query.vnp_Amount) / 100;
    
    if (!verify.isSuccess) {
      console.warn("❌ Sai chữ ký VNPay:", verify.message);
      return res.redirect(
        `${process.env.CLIENT_CUSTOMER_URL}/GiaoDien/order-confirmation.html?orderId=${orderId}&status=invalid_signature`
      );
    }

    if (rspCode === "00") {
      // ✅ SỬA: Thanh toán thành công - CHỈ CẬP NHẬT TRẠNG THÁI THANH TOÁN, GIỮ "Chờ xử lý"
      await pool.query(
        `UPDATE hoadon 
         SET TrangThaiThanhToan = 'Đã thanh toán'
         WHERE MaHD = ?`,
        [orderId]
      );
      
      console.log(`✅ Thanh toán thành công cho đơn hàng ${orderId}, số tiền: ${amount} - TRẠNG THÁI: Chờ xử lý`);
      // Add loyalty points after VNPay success (non-blocking)
      try {
        const [ordRows] = await pool.query('SELECT makh, TongTien FROM hoadon WHERE MaHD = ?', [orderId]);
        const ord = ordRows && ordRows[0];
        if (ord && ord.makh) {
          const loyRes = await addLoyaltyPoints(pool, ord.makh, ord.TongTien || 0);
          console.log('Loyalty: points added after VNPay for order', orderId, { loyRes });
          if (loyRes && loyRes.error) console.warn('Loyalty add after VNPay returned error (non-blocking):', loyRes.error);
        }
      } catch (e) {
        console.warn('Loyalty after VNPay failed:', e && e.message);
      }
      return res.redirect(
        `${process.env.CLIENT_CUSTOMER_URL}/GiaoDien/order-confirmation.html?orderId=${orderId}&amount=${amount}&status=success`
      );
    } else {
      // Thanh toán thất bại - CẬP NHẬT TRẠNG THÁI THANH TOÁN VÀ ĐƠN HÀNG
      await pool.query(
        `UPDATE hoadon 
         SET TrangThaiThanhToan = 'Thất bại',
             tinhtrang = 'Đã hủy'
         WHERE MaHD = ?`,
        [orderId]
      );
      
      // Hoàn lại tồn kho khi thanh toán thất bại
      const [chitiet] = await pool.query(
        `SELECT MaSP, Soluong FROM chitiethoadon WHERE MaHD = ?`,
        [orderId]
      );

      for (const item of chitiet) {
        await pool.query(
          `UPDATE sanpham SET SoLuong = SoLuong + ? WHERE MaSP = ?`,
          [item.Soluong, item.MaSP]
        );
      }
      
      console.log(`❌ Thanh toán thất bại cho đơn hàng ${orderId}, mã lỗi: ${rspCode} - ĐÃ HỦY ĐƠN HÀNG`);
      return res.redirect(
        `${process.env.CLIENT_CUSTOMER_URL}/GiaoDien/order-confirmation.html?orderId=${orderId}&amount=${amount}&status=failed&code=${rspCode}`
      );
    }

  } catch (error) {
    console.error("🔥 Lỗi xử lý /vnpay_return:", error);
    return res.redirect(
      `${process.env.CLIENT_CUSTOMER_URL}/GiaoDien/order-confirmation.html?status=error`
    );
  }
});




// 🔥 API hoàn tiền thủ công - Cập nhật cho đúng database
router.post('/vnpay_refund', authenticateToken, async (req, res) => {
  try {
    const { orderId, refundAmount, refundReason } = req.body;
    
    if (!orderId || !refundAmount || !refundReason) {
      return res.status(400).json({ 
        success: false,
        error: 'Thiếu thông tin bắt buộc' 
      });
    }

    // ✅ Kiểm tra đơn hàng (đúng tên cột)
    const [order] = await pool.query(`
      SELECT hd.*, kh.tenkh 
      FROM hoadon hd 
      LEFT JOIN khachhang kh ON hd.makh = kh.makh 
      WHERE hd.MaHD = ?
    `, [orderId]);

    if (order.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Không tìm thấy đơn hàng' 
      });
    }

    const orderData = order[0];

    // Kiểm tra điều kiện hoàn tiền
    if (orderData.PhuongThucThanhToan !== 'VNPAY') {
      return res.status(400).json({ 
        success: false,
        error: 'Đơn hàng không thanh toán qua VNPay' 
      });
    }

    if (orderData.TrangThaiThanhToan !== 'Đã thanh toán') {
      return res.status(400).json({ 
        success: false,
        error: 'Đơn hàng chưa được thanh toán' 
      });
    }

    if (refundAmount > orderData.TongTien) {
      return res.status(400).json({ 
        success: false,
        error: `Số tiền hoàn vượt quá tổng tiền đơn hàng` 
      });
    }

    // ✅ Tạo yêu cầu hoàn tiền (đúng tên cột)
    const refundRequestId = `REFUND_${orderId}_${Date.now()}`;
    const isFullRefund = refundAmount >= orderData.TongTien;

    const [insertResult] = await pool.query(`
      INSERT INTO nhatky_hoantienvnpay 
      (ma_hoadon, ma_khachhang, ma_yc_hoantra, sotien_hoantra, lydo_hoantra, trangthai, ngay_tao) 
      VALUES (?, ?, ?, ?, ?, 'DANG_XL', NOW())
    `, [
      orderId, 
      orderData.makh, 
      refundRequestId, 
      refundAmount, 
      refundReason
    ]);

    // Simulate VNPay success
    const refundSuccess = true;

    if (refundSuccess) {
      await pool.query(`
        UPDATE nhatky_hoantienvnpay 
        SET trangthai = 'THANH_CONG',
            ngay_capnhat = NOW()
        WHERE id = ?
      `, [insertResult.insertId]);

      await pool.query(`
        UPDATE hoadon 
        SET TrangThaiThanhToan = ?,
            GhiChu = CONCAT(IFNULL(GhiChu, ''), ?)
        WHERE MaHD = ?
      `, [
        isFullRefund ? 'Đã hoàn tiền' : 'Hoàn một phần',
        `\n[${new Date().toLocaleString()}] Hoàn tiền: ${refundAmount.toLocaleString()}đ`,
        orderId
      ]);

      res.json({
        success: true,
        message: 'Hoàn tiền thành công',
        data: {
          refundRequestId,
          refundAmount,
          isFullRefund,
          orderId: orderId,
          status: 'COMPLETED'
        }
      });
    } else {
      await pool.query(`
        UPDATE nhatky_hoantienvnpay 
        SET trangthai = 'THAT_BAI',
            ngay_capnhat = NOW()
        WHERE id = ?
      `, [insertResult.insertId]);

      res.status(400).json({
        success: false,
        error: 'Hoàn tiền thất bại từ VNPay'
      });
    }

  } catch (error) {
    console.error('VNPay Refund Error:', error);
    res.status(500).json({
      success: false,
      error: 'Lỗi hệ thống khi hoàn tiền',
      details: process.env.NODE_ENV === 'development' ? error.message : null
    });
  }
});

// ✅ THAY BẰNG API MỚI này:
router.get('/customer-refunds/:customerId', authenticateToken, async (req, res) => {
  const { customerId } = req.params;

  try {
    // Kiểm tra quyền truy cập
    if (req.user.makh != customerId && req.user.userType !== 'admin') {
      return res.status(403).json({ 
        success: false,
        error: 'Không có quyền truy cập' 
      });
    }

    const [refunds] = await pool.query(`
      SELECT 
        rr.id,
        rr.orderId,
        rr.refundRequestId,
        rr.refundAmount,
        rr.refundReason,
        -- Normalize status codes to match frontend expectation (THANH_CONG, DANG_XL, THAT_BAI)
        CASE rr.status
          WHEN 'PENDING' THEN 'DANG_XL'
          WHEN 'PROCESSING' THEN 'DANG_XL'
          WHEN 'COMPLETED' THEN 'THANH_CONG'
          WHEN 'REJECTED' THEN 'THAT_BAI'
          WHEN 'CANCELLED' THEN 'THAT_BAI'
          ELSE rr.status
        END AS status,
        rr.createdAt,
        rr.processedAt,
        rr.bankAccount,
        rr.bankName,
        rr.accountHolder,
        hd.NgayTao AS orderDate,
        hd.TongTien AS orderAmount,
        kh.tenkh AS customerName,
        -- Human-readable label for admin/customer UI
        CASE rr.status
          WHEN 'PENDING' THEN 'Chờ xử lý'
          WHEN 'PROCESSING' THEN 'Đang xử lý'
          WHEN 'COMPLETED' THEN 'Đã hoàn tiền'
          WHEN 'REJECTED' THEN 'Từ chối'
          WHEN 'CANCELLED' THEN 'Đã hủy'
          ELSE 'Không xác định'
        END AS statusDisplay,
        -- Ẩn thông tin nhạy cảm
        CONCAT('****', RIGHT(rr.bankAccount, 4)) AS maskedBankAccount
      FROM refund_requests rr
      LEFT JOIN hoadon hd ON rr.orderId = hd.MaHD
      LEFT JOIN khachhang kh ON rr.customerId = kh.makh
      WHERE rr.customerId = ?
      ORDER BY rr.createdAt DESC
    `, [customerId]);

    const summary = {
      total: refunds.length,
      pending: refunds.filter(r => r.status === 'PENDING').length,
      processing: refunds.filter(r => r.status === 'PROCESSING').length,
      completed: refunds.filter(r => r.status === 'COMPLETED').length,
      rejected: refunds.filter(r => r.status === 'REJECTED').length,
      totalAmount: refunds.reduce((sum, r) => sum + parseFloat(r.refundAmount || 0), 0)
    };

    res.json({
      success: true,
      data: refunds,
      summary
    });

  } catch (error) {
    console.error('Get customer refunds error:', error);
    res.status(500).json({
      success: false,
      error: 'Lỗi khi lấy danh sách hoàn tiền',
      details: process.env.NODE_ENV === 'development' ? error.message : null
    });
  }
});


// ✅ THÊM: API xem lịch sử hoàn tiền của khách hàng
router.get('/customer-refunds/:customerId', authenticateToken, async (req, res) => {
  const { customerId } = req.params;

  try {
    // Kiểm tra quyền truy cập
    if (req.user.makh != customerId && req.user.userType !== 'admin') {
      return res.status(403).json({ error: 'Không có quyền truy cập' });
    }

    const [refunds] = await pool.query(`
      SELECT 
        nt.id,
        nt.ma_hoadon AS orderId,
        nt.ma_yc_hoantra AS refundRequestId,
        nt.sotien_hoantra AS refundAmount,
        nt.lydo_hoantra AS refundReason,
        nt.trangthai AS status,
        nt.ngay_tao AS createdAt,
        nt.ngay_vnpay_xuly AS processedAt,
        nt.phi_hoantra AS refundFee,
        hd.NgayTao AS orderDate,
        hd.TongTien AS orderAmount,
        hd.SoTienHoanTra AS totalRefunded,
        kh.tenkh AS customerName,
        CASE nt.trangthai
          WHEN 'THANH_CONG' THEN 'Thành công'
          WHEN 'THAT_BAI' THEN 'Thất bại'
          WHEN 'DANG_XL' THEN 'Đang xử lý'
          ELSE 'Không xác định'
        END AS statusDisplay
      FROM nhatky_hoantienvnpay nt
      LEFT JOIN hoadon hd ON nt.ma_hoadon = hd.MaHD
      LEFT JOIN khachhang kh ON nt.ma_khachhang = kh.makh
      WHERE nt.ma_khachhang = ?
      ORDER BY nt.ngay_tao DESC
    `, [customerId]);

    const summary = {
      totalRefunds: refunds.length,
      totalAmount: refunds.reduce((sum, r) => sum + parseFloat(r.refundAmount || 0), 0),
      successCount: refunds.filter(r => r.status === 'THANH_CONG').length,
      pendingCount: refunds.filter(r => r.status === 'DANG_XL').length,
      failedCount: refunds.filter(r => r.status === 'THAT_BAI').length
    };

    res.json({
      success: true,
      data: refunds,
      summary
    });

  } catch (error) {
    console.error('Lỗi khi lấy lịch sử hoàn tiền:', error);
    res.status(500).json({
      error: 'Lỗi khi lấy lịch sử hoàn tiền',
      details: process.env.NODE_ENV === 'development' ? error.message : null
    });
  }
});

// Proxy endpoints for provinces.open-api.vn to provide lists for frontend selects
// ✅ Sử dụng httpsAgent để bypass certificate error
router.get('/locations/provinces', async (req, res) => {
  try {
    const r = await fetch('https://provinces.open-api.vn/api/p/', { agent: httpsAgent });
    if (!r.ok) throw new Error(`HTTP error! status: ${r.status}`);
    const data = await r.json();
    // map to useful shape
    const mapped = data.map(p => ({ code: p.code, name: p.name }));
    res.json({ success: true, data: mapped });
  } catch (err) {
    console.error('Error fetching provinces', err);
    res.status(500).json({ error: 'Không thể tải danh sách tỉnh/thành' });
  }
});

router.get('/locations/districts/:provinceCode', async (req, res) => {
  try {
    const { provinceCode } = req.params;
    const r = await fetch(`https://provinces.open-api.vn/api/p/${provinceCode}?depth=2`, { agent: httpsAgent });
    if (!r.ok) throw new Error(`HTTP error! status: ${r.status}`);
    const data = await r.json();
    const districts = (data.districts || []).map(d => ({ code: d.code, name: d.name }));
    res.json({ success: true, data: districts });
  } catch (err) {
    console.error('Error fetching districts', err);
    res.status(500).json({ error: 'Không thể tải danh sách quận/huyện' });
  }
});

router.get('/locations/wards/:districtCode', async (req, res) => {
  try {
    const { districtCode } = req.params;
    const r = await fetch(`https://provinces.open-api.vn/api/d/${districtCode}?depth=2`, { agent: httpsAgent });
    if (!r.ok) throw new Error(`HTTP error! status: ${r.status}`);
    const data = await r.json();
    const wards = (data.wards || []).map(w => ({ code: w.code, name: w.name }));
    res.json({ success: true, data: wards });
  } catch (err) {
    console.error('Error fetching wards', err);
    res.status(500).json({ error: 'Không thể tải danh sách phường/xã' });
  }
});

// Resolve single province/district/ward name by code (used by frontend to avoid CORS)
// ✅ SỬ DỤNG DỮ LIỆU LOCAL JSON THAY VÌ API EXTERNAL
router.get('/resolve/province/:code', async (req, res) => {
  try {
    const { code } = req.params;
    // Tìm trong dữ liệu local
    const province = citiesData.find(c => c.city_id === String(code));
    if (province) {
      return res.json({ success: true, name: province.city_name });
    }
    return res.json({ success: true, name: String(code) });
  } catch (err) {
    console.error('Error resolving province name', err);
    return res.status(500).json({ error: 'Không thể resolve province', name: String(req.params.code) });
  }
});

router.get('/resolve/district/:code', async (req, res) => {
  try {
    const { code } = req.params;
    // Tìm trong dữ liệu local
    const district = districtsData.find(d => d.district_id === String(code));
    if (district) {
      return res.json({ success: true, name: district.district_name });
    }
    return res.json({ success: true, name: String(code) });
  } catch (err) {
    console.error('Error resolving district name', err);
    return res.status(500).json({ error: 'Không thể resolve district', name: String(req.params.code) });
  }
});

router.get('/resolve/ward/:code', async (req, res) => {
  try {
    const { code } = req.params;
    // Nếu code đã là tên (chứa chữ), trả về luôn
    if (typeof code === 'string' && /[a-zA-Zàáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(code)) {
      return res.json({ success: true, name: decodeURIComponent(code) });
    }
    // Tìm trong dữ liệu local (nếu là mã số)
    const ward = wardsData.find(w => w.ward_id === String(code) || w.ward_name === decodeURIComponent(code));
    if (ward) {
      return res.json({ success: true, name: ward.ward_name });
    }
    return res.json({ success: true, name: decodeURIComponent(code) });
  } catch (err) {
    console.error('Error resolving ward name', err);
    return res.status(500).json({ error: 'Không thể resolve ward', name: String(req.params.code) });
  }
});


// ✅ Tương tự, cập nhật API admin-refunds nếu có:
router.get('/admin-refunds', authenticateToken, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = '';
    let params = [];

    if (status && status !== 'all') {
      whereClause = 'WHERE rr.status = ?';
      params.push(status);
    }

    const [refunds] = await pool.query(`
      SELECT 
        rr.*,
        hd.NgayTao AS orderDate,
        hd.TongTien AS orderAmount,
        hd.tinhtrang AS orderStatus,
        hd.PhuongThucThanhToan AS paymentMethod,
        kh.tenkh AS customerName,
        kh.sdt AS customerPhone,
        kh.email AS customerEmail,
        CASE rr.status
          WHEN 'PENDING' THEN 'Chờ xử lý'
          WHEN 'PROCESSING' THEN 'Đang xử lý'
          WHEN 'COMPLETED' THEN 'Đã hoàn tiền'
          WHEN 'REJECTED' THEN 'Từ chối'
          WHEN 'CANCELLED' THEN 'Đã hủy'
          ELSE 'Không xác định'
        END AS statusDisplay
      FROM refund_requests rr
      LEFT JOIN hoadon hd ON rr.orderId = hd.MaHD
      LEFT JOIN khachhang kh ON rr.customerId = kh.makh
      ${whereClause}
      ORDER BY rr.createdAt DESC
      LIMIT ? OFFSET ?
    `, [...params, parseInt(limit), parseInt(offset)]);

    const [countResult] = await pool.query(`
      SELECT COUNT(*) as total 
      FROM refund_requests rr 
      ${whereClause}
    `, params);

    const summary = {
      total: countResult[0].total,
      currentPage: parseInt(page),
      totalPages: Math.ceil(countResult[0].total / limit),
      pending: refunds.filter(r => r.status === 'PENDING').length,
      processing: refunds.filter(r => r.status === 'PROCESSING').length,
      completed: refunds.filter(r => r.status === 'COMPLETED').length,
      rejected: refunds.filter(r => r.status === 'REJECTED').length
    };

    res.json({
      success: true,
      data: refunds,
      summary
    });

  } catch (error) {
    console.error('Get admin refunds error:', error);
    res.status(500).json({
      success: false,
      error: 'Lỗi khi lấy danh sách hoàn tiền cho admin'
    });
  }
});

// API cập nhật hủy đơn hàng với hoàn tiền - CẬP NHẬT
router.put('/customer-orders/cancel-with-refund/:orderId', authenticateToken, async (req, res) => {
  const { orderId } = req.params;
  const { customerId, reason, refundAmount } = req.body;

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Kiểm tra đơn hàng
    const [order] = await connection.query(
      `SELECT * FROM hoadon WHERE MaHD = ? AND makh = ?`,
      [orderId, customerId]
    );

    if (order.length === 0) {
      throw new Error('Không tìm thấy đơn hàng');
    }

    const orderData = order[0];

    // Kiểm tra trạng thái đơn hàng
    if (!['Chờ xử lý', 'Đã xác nhận'].includes(orderData.tinhtrang)) {
      throw new Error('Chỉ có thể hủy đơn hàng ở trạng thái "Chờ xử lý" hoặc "Đã xác nhận"');
    }

    // Cập nhật trạng thái đơn hàng
    await connection.query(
      `UPDATE hoadon 
       SET tinhtrang = 'Đã hủy', 
           GhiChu = CONCAT(IFNULL(GhiChu, ''), ?) 
       WHERE MaHD = ?`,
      [`\nLý do hủy: ${reason || 'Không có lý do'}`, orderId]
    );

    // Hoàn lại tồn kho
    const [chitiet] = await connection.query(
      `SELECT MaSP, Soluong FROM chitiethoadon WHERE MaHD = ?`,
      [orderId]
    );

    for (const item of chitiet) {
      await connection.query(
        `UPDATE sanpham SET SoLuong = SoLuong + ? WHERE MaSP = ?`,
        [item.Soluong, item.MaSP]
      );
    }

    // Remove loyalty points for this canceled order (non-blocking)
    try {
      const [ordRows] = await connection.query('SELECT makh, TongTien FROM hoadon WHERE MaHD = ?', [orderId]);
      const ord = ordRows && ordRows[0];
      if (ord && ord.makh) {
        const loyRes = await subtractLoyaltyPoints(connection, ord.makh, ord.TongTien || 0);
        console.log(`Loyalty: subtracted points for customer ${ord.makh} due to cancel ${orderId}`, { loyRes });
        if (loyRes && loyRes.error) console.warn('Loyalty subtract returned error (non-blocking):', loyRes.error);
      }
    } catch (e) {
      console.warn('Loyalty subtraction failed (non-blocking):', e && e.message);
    }

    await connection.commit();

    // Nếu đã thanh toán VNPay và yêu cầu hoàn tiền
    if (orderData.PhuongThucThanhToan === 'VNPAY' && 
        orderData.TrangThaiThanhToan === 'Đã thanh toán' && 
        refundAmount > 0) {
      
      // ✅ SỬA: Gọi API hoàn tiền với URL đúng
      try {
        const refundResponse = await fetch(`http://localhost:${process.env.PORT || 5000}/api/orders/vnpay_refund`, {
          method: 'POST',
          headers: {
            'Authorization': req.headers.authorization,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            orderId,
            refundAmount: refundAmount || orderData.TongTien,
            refundReason: `Khách hàng hủy đơn: ${reason || 'Không có lý do'}`
          })
        });

        const refundResult = await refundResponse.json();

        res.json({
          success: true,
          message: 'Hủy đơn hàng thành công',
          refund: refundResult.success ? {
            status: 'PROCESSING',
            amount: refundAmount || orderData.TongTien,
            message: 'Hoàn tiền đang được xử lý, vui lòng kiểm tra tài khoản sau 1-3 ngày làm việc'
          } : {
            status: 'FAILED',
            message: 'Hủy đơn thành công nhưng hoàn tiền thất bại, vui lòng liên hệ CSKH',
            error: refundResult.error
          }
        });
      } catch (refundError) {
        console.error('Lỗi khi gọi API hoàn tiền:', refundError);
        res.json({
          success: true,
          message: 'Hủy đơn hàng thành công',
          refund: {
            status: 'FAILED',
            message: 'Hủy đơn thành công nhưng hoàn tiền thất bại do lỗi hệ thống, vui lòng liên hệ CSKH'
          }
        });
      }
    } else {
      res.json({
        success: true,
        message: 'Hủy đơn hàng thành công',
        refund: null
      });
    }

  } catch (error) {
    await connection.rollback();
    console.error('Lỗi khi hủy đơn hàng với hoàn tiền:', error);
    res.status(500).json({
      error: 'Lỗi khi hủy đơn hàng',
      details: process.env.NODE_ENV === 'development' ? error.message : null
    });
  } finally {
    connection.release();
  }
});

///////--------chức năng hoàn tiền cho khách hàng--------------------///////////

// ✅ API tạo yêu cầu hoàn tiền mới
router.post('/refund-requests', authenticateToken, async (req, res) => {
  try {
    const { 
      orderId, 
      refundAmount, 
      refundType, 
      refundReason,
      bankAccount,
      bankName,
      accountHolder,
      bankBranch 
    } = req.body;
    
    const customerId = req.user.makh;
    
    // Validate đầu vào
    if (!orderId || !refundAmount || !bankAccount || !bankName || !accountHolder) {
      return res.status(400).json({ 
        success: false,
        error: 'Thiếu thông tin bắt buộc (orderId, refundAmount, bankAccount, bankName, accountHolder)' 
      });
    }

    // Validate số tài khoản
    if (!/^[0-9]{8,20}$/.test(bankAccount)) {
      return res.status(400).json({ 
        success: false,
        error: 'Số tài khoản không hợp lệ (8-20 chữ số)' 
      });
    }

    // Kiểm tra đơn hàng
    // NOTE: allow refunds for any payment method as long as the order's payment status indicates it can be refunded
    const [order] = await pool.query(`
      SELECT * FROM hoadon 
      WHERE MaHD = ? 
        AND makh = ? 
        AND TrangThaiThanhToan IN ('Đã thanh toán','Đang hoàn tiền')
    `, [orderId, customerId]);

    if (!order.length) {
      return res.status(404).json({ 
        success: false,
        error: 'Đơn hàng không hợp lệ hoặc chưa ở trạng thái được hoàn tiền' 
      });
    }

    const orderData = order[0];

    // Kiểm tra trạng thái đơn hàng
    if (!['Chờ xử lý', 'Đã xác nhận'].includes(orderData.tinhtrang)) {
      return res.status(400).json({ 
        success: false,
        error: 'Chỉ có thể hoàn tiền đơn hàng ở trạng thái "Chờ xử lý" hoặc "Đã xác nhận"' 
      });
    }

    // Kiểm tra số tiền hoàn
    if (refundAmount > orderData.TongTien) {
      return res.status(400).json({ 
        success: false,
        error: `Số tiền hoàn không được vượt quá tổng đơn hàng (${orderData.TongTien}đ)` 
      });
    }

    if (refundAmount < 1000) {
      return res.status(400).json({ 
        success: false,
        error: 'Số tiền hoàn tối thiểu là 1.000đ' 
      });
    }

    const [existingRefund] = await pool.query(`
  SELECT id FROM refund_requests 
  WHERE orderId = ? AND status IN ('PENDING','PROCESSING')
`, [orderId]);

if (existingRefund.length > 0) {
  await pool.query(`
    UPDATE refund_requests
       SET bankAccount=?, bankName=?, accountHolder=?, bankBranch=?, refundReason=?, updatedAt=NOW()
     WHERE id=?
  `, [bankAccount, bankName, accountHolder,bankBranch || null, refundReason, existingRefund[0].id]);

  return res.json({ success: true, message: 'Cập nhật thông tin hoàn tiền thành công' });
}

    // Tạo mã yêu cầu duy nhất
    const refundRequestId = `REF_${orderId}_${Date.now()}`;

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Lưu yêu cầu hoàn tiền
      const [result] = await connection.query(`
        INSERT INTO refund_requests 
        (orderId, customerId, refundRequestId, refundAmount, refundType, refundReason,
         bankAccount, bankName, accountHolder, bankBranch, status, createdAt, return_id) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', NOW(), ?)
      `, [
        orderId, customerId, refundRequestId, refundAmount, refundType || 'full', 
        refundReason, bankAccount, bankName, accountHolder, bankBranch || null, null
      ]);

      // Cập nhật trạng thái đơn hàng
      await connection.query(`
        UPDATE hoadon 
        SET tinhtrang = 'Đang hủy - chờ hoàn tiền',
            GhiChu = CONCAT(IFNULL(GhiChu, ''), ?)
        WHERE MaHD = ?
      `, [`\n[${new Date().toLocaleString()}] Yêu cầu hoàn tiền: ${refundRequestId}`, orderId]);

      await connection.commit();

      res.json({
        success: true,
        message: 'Tạo yêu cầu hoàn tiền thành công',
        data: {
          refundRequestId,
          orderId,
          refundAmount,
          status: 'PENDING',
          estimatedProcessingTime: '1-3 ngày làm việc',
          bankAccount: `****${bankAccount.slice(-4)}`, // Ẩn số tài khoản
          bankName,
          accountHolder
        }
      });

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('Create refund request error:', error);
    res.status(500).json({
      success: false,
      error: 'Lỗi hệ thống khi tạo yêu cầu hoàn tiền',
      details: process.env.NODE_ENV === 'development' ? error.message : null
    });
  }
});

// ✅ API lấy danh sách yêu cầu hoàn tiền của khách hàng
router.get('/customer-refunds/logs/:customerId', authenticateToken, async (req, res) => {
  const { customerId } = req.params;

  try {
    // Kiểm tra quyền truy cập
    if (req.user.makh != customerId && req.user.userType !== 'admin') {
      return res.status(403).json({ 
        success: false,
        error: 'Không có quyền truy cập' 
      });
    }

    const [refunds] = await pool.query(`
      SELECT 
        rr.*,
        hd.NgayTao AS orderDate,
        hd.TongTien AS orderAmount,
        hd.tinhtrang AS orderStatus,
        kh.tenkh AS customerName,
        CASE rr.status
          WHEN 'PENDING' THEN 'Chờ xử lý'
          WHEN 'PROCESSING' THEN 'Đang xử lý'
          WHEN 'COMPLETED' THEN 'Đã hoàn tiền'
          WHEN 'REJECTED' THEN 'Từ chối'
          WHEN 'CANCELLED' THEN 'Đã hủy'
          ELSE 'Không xác định'
        END AS statusDisplay,
        -- Ẩn thông tin nhạy cảm
        CONCAT('****', RIGHT(rr.bankAccount, 4)) AS maskedBankAccount
      FROM refund_requests rr
      LEFT JOIN hoadon hd ON rr.orderId = hd.MaHD
      LEFT JOIN khachhang kh ON rr.customerId = kh.makh
      WHERE rr.customerId = ?
      ORDER BY rr.createdAt DESC
    `, [customerId]);

    const summary = {
      total: refunds.length,
      pending: refunds.filter(r => r.status === 'PENDING').length,
      processing: refunds.filter(r => r.status === 'PROCESSING').length,
      completed: refunds.filter(r => r.status === 'COMPLETED').length,
      rejected: refunds.filter(r => r.status === 'REJECTED').length,
      totalAmount: refunds.reduce((sum, r) => sum + parseFloat(r.refundAmount || 0), 0)
    };

    res.json({
      success: true,
      data: refunds,
      summary
    });

  } catch (error) {
    console.error('Get refund requests error:', error);
    res.status(500).json({
      success: false,
      error: 'Lỗi khi lấy danh sách yêu cầu hoàn tiền',
      details: process.env.NODE_ENV === 'development' ? error.message : null
    });
  }
});
// ✅ API admin lấy tất cả yêu cầu hoàn tiền
router.get('/refund-requests/admin', authenticateToken, async (req, res) => {
  try {
    // Tạm thời bỏ check admin để test
    // if (req.user.userType !== 'admin') {
    //   return res.status(403).json({ error: 'Chỉ admin mới có quyền xem' });
    // }

    const { status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = '';
    let params = [];

    if (status && status !== 'all') {
      whereClause = 'WHERE rr.status = ?';
      params.push(status);
    }

    const [refunds] = await pool.query(`
      SELECT 
        rr.*,
        hd.NgayTao AS orderDate,
        hd.TongTien AS orderAmount,
        hd.tinhtrang AS orderStatus,
        hd.PhuongThucThanhToan AS paymentMethod,
        kh.tenkh AS customerName,
        kh.sdt AS customerPhone,
        kh.email AS customerEmail,
        CASE rr.status
          WHEN 'PENDING' THEN 'Chờ xử lý'
          WHEN 'PROCESSING' THEN 'Đang xử lý'
          WHEN 'COMPLETED' THEN 'Đã hoàn tiền'
          WHEN 'REJECTED' THEN 'Từ chối'
          WHEN 'CANCELLED' THEN 'Đã hủy'
          ELSE 'Không xác định'
        END AS statusDisplay
      FROM refund_requests rr
      LEFT JOIN hoadon hd ON rr.orderId = hd.MaHD
      LEFT JOIN khachhang kh ON rr.customerId = kh.makh
      ${whereClause}
      ORDER BY rr.createdAt DESC
      LIMIT ? OFFSET ?
    `, [...params, parseInt(limit), parseInt(offset)]);

    // Đếm tổng số bản ghi
    const [countResult] = await pool.query(`
      SELECT COUNT(*) as total 
      FROM refund_requests rr 
      ${whereClause}
    `, params);

    const summary = {
      total: countResult[0].total,
      currentPage: parseInt(page),
      totalPages: Math.ceil(countResult[0].total / limit),
      pending: refunds.filter(r => r.status === 'PENDING').length,
      processing: refunds.filter(r => r.status === 'PROCESSING').length,
      completed: refunds.filter(r => r.status === 'COMPLETED').length,
      rejected: refunds.filter(r => r.status === 'REJECTED').length,
      totalAmount: refunds.reduce((sum, r) => sum + parseFloat(r.refundAmount || 0), 0)
    };

    res.json({
      success: true,
      data: refunds,
      summary
    });

  } catch (error) {
    console.error('Get admin refund requests error:', error);
    res.status(500).json({
      success: false,
      error: 'Lỗi khi lấy danh sách yêu cầu hoàn tiền',
      details: process.env.NODE_ENV === 'development' ? error.message : null
    });
  }
});
// ✅ API admin xử lý yêu cầu hoàn tiền
router.put('/refund-requests/:refundId/process', authenticateToken, async (req, res) => {
  const { refundId } = req.params;
  const { action, adminReason, actualRefundAmount, transactionId } = req.body;

  try {
    // Tạm thời bỏ check admin để test
    // if (req.user.userType !== 'admin') {
    //   return res.status(403).json({ error: 'Chỉ admin mới có quyền xử lý' });
    // }

    if (!['approve', 'reject', 'complete'].includes(action)) {
      return res.status(400).json({ 
        success: false,
        error: 'Action không hợp lệ (approve/reject/complete)' 
      });
    }

    // Lấy thông tin yêu cầu hoàn tiền
    const [refundRequests] = await pool.query(`
      SELECT rr.*, hd.TongTien, hd.tinhtrang, hd.PhuongThucThanhToan
      FROM refund_requests rr
      LEFT JOIN hoadon hd ON rr.orderId = hd.MaHD
      WHERE rr.id = ?
    `, [refundId]);

    if (!refundRequests.length) {
      return res.status(404).json({ 
        success: false,
        error: 'Không tìm thấy yêu cầu hoàn tiền' 
      });
    }

    const refundRequest = refundRequests[0];

    if (!['PENDING', 'PROCESSING'].includes(refundRequest.status)) {
      return res.status(400).json({ 
        success: false,
        error: 'Yêu cầu hoàn tiền đã được xử lý' 
      });
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      let newStatus, orderStatus, paymentStatus;
      let updateData = {
        processedAt: new Date(),
        adminReason: adminReason || null
      };

      switch (action) {
        case 'approve':
          newStatus = 'PROCESSING';
          orderStatus = 'Đang hủy - đã duyệt hoàn tiền';
          updateData.status = newStatus;
          break;

        case 'reject':
          newStatus = 'REJECTED';
          orderStatus = 'Chờ xử lý'; // Trả về trạng thái ban đầu
          updateData.status = newStatus;
          break;

        case 'complete':
          if (refundRequest.status !== 'PROCESSING') {
            throw new Error('Chỉ có thể hoàn thành yêu cầu đang xử lý');
          }
          if (!transactionId) {
            throw new Error('Thiếu mã giao dịch chuyển tiền');
          }
          
          newStatus = 'COMPLETED';
          orderStatus = 'Đã hủy';
          paymentStatus = 'Đã hoàn tiền';
          
          updateData = {
            ...updateData,
            status: newStatus,
            actualRefundAmount: actualRefundAmount || refundRequest.refundAmount,
            transactionId,
            transferDate: new Date(),
            completedAt: new Date()
          };
          break;
      }

      // Cập nhật yêu cầu hoàn tiền
      const updateFields = Object.keys(updateData).map(key => `${key} = ?`).join(', ');
      const updateValues = Object.values(updateData);
      
      await connection.query(`
        UPDATE refund_requests 
        SET ${updateFields}
        WHERE id = ?
      `, [...updateValues, refundId]);

      // Cập nhật đơn hàng
      let orderUpdateQuery = 'UPDATE hoadon SET tinhtrang = ?';
      let orderUpdateParams = [orderStatus];

      if (paymentStatus) {
        orderUpdateQuery += ', TrangThaiThanhToan = ?';
        orderUpdateParams.push(paymentStatus);
      }

      orderUpdateQuery += ', GhiChu = CONCAT(IFNULL(GhiChu, ""), ?) WHERE MaHD = ?';
      orderUpdateParams.push(
        `\n[${new Date().toLocaleString()}] Admin ${action}: ${adminReason || 'Không có ghi chú'}`,
        refundRequest.orderId
      );

      await connection.query(orderUpdateQuery, orderUpdateParams);

      // Nếu từ chối, hoàn lại hàng vào kho (nếu chưa hoàn)
      if (action === 'reject') {
        await connection.query(`
          UPDATE sanpham sp 
          JOIN chitiethoadon ct ON sp.MaSP = ct.MaSP 
          SET sp.SoLuong = sp.SoLuong + ct.SoLuong 
          WHERE ct.MaHD = ?
        `, [refundRequest.orderId]);
      }

      await connection.commit();

      res.json({
        success: true,
        message: `${action === 'approve' ? 'Duyệt' : action === 'reject' ? 'Từ chối' : 'Hoàn thành'} yêu cầu hoàn tiền thành công`,
        data: {
          refundId,
          status: newStatus,
          processedAt: updateData.processedAt,
          adminReason: updateData.adminReason,
          actualRefundAmount: updateData.actualRefundAmount,
          transactionId: updateData.transactionId
        }
      });

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('Process refund request error:', error);
    res.status(500).json({
      success: false,
      error: 'Lỗi khi xử lý yêu cầu hoàn tiền',
      details: process.env.NODE_ENV === 'development' ? error.message : null
    });
  }
});
// ...existing code...
router.put('/refund-requests/:refundId/cancel', authenticateToken, async (req, res) => {
    const { refundId } = req.params;
    const { reason } = req.body;
    const userId = req.user && req.user.makh;

    console.log('Cancel refund called:', { refundId, userId, body: req.body });

    try {
      // Tìm refund bằng nhiều cách: rr.customerId OR hoadon.makh OR tra_hang.nguoi_tao
      const [rows] = await pool.query(`
        SELECT rr.*, hd.makh AS order_makh, t.nguoi_tao AS return_creator
        FROM refund_requests rr
        LEFT JOIN hoadon hd ON CAST(rr.orderId AS UNSIGNED) = hd.MaHD
        LEFT JOIN tra_hang t ON t.id = rr.return_id
        WHERE rr.id = ? AND (rr.customerId = ? OR hd.makh = ? OR t.nguoi_tao = ?)
      `, [refundId, userId, userId, String(userId)]);

      if (!rows.length) {
        console.warn('Cancel: refund not found or permission denied', { refundId, userId });
        return res.status(404).json({
          success: false,
          error: 'Không tìm thấy yêu cầu hoàn tiền hoặc bạn không có quyền hủy'
        });
      }

      const refundRequest = rows[0];
      console.log('Cancel: found refund', { id: refundRequest.id, status: refundRequest.status, return_id: refundRequest.return_id });

      if (refundRequest.status !== 'PENDING') {
        return res.status(400).json({
          success: false,
          error: 'Chỉ có thể hủy yêu cầu hoàn tiền đang chờ xử lý',
          currentStatus: refundRequest.status
        });
      }

      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();

        await connection.query(`
          UPDATE refund_requests
          SET status = 'CANCELLED',
              adminReason = ?,
              processedAt = NOW(),
              updatedAt = NOW()
          WHERE id = ?
        `, [reason || 'Khách hàng tự hủy yêu cầu', refundId]);

        // Cập nhật lại trạng thái hoadon về Chờ xử lý (hoặc trạng thái phù hợp)
        await connection.query(`
          UPDATE hoadon
          SET tinhtrang = 'Chờ xử lý',
              GhiChu = CONCAT(IFNULL(GhiChu, ''), ?)
          WHERE MaHD = ?
        `, [`\n[${new Date().toLocaleString()}] Khách hủy yêu cầu hoàn tiền: ${reason || 'Không có lý do'}`, refundRequest.orderId]);

        await connection.commit();

        return res.json({
          success: true,
          message: 'Hủy yêu cầu hoàn tiền thành công',
          data: { refundId, status: 'CANCELLED' }
        });
      } catch (err) {
        await connection.rollback();
        throw err;
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('Cancel refund request error:', error);
      return res.status(500).json({
        success: false,
        error: 'Lỗi khi hủy yêu cầu hoàn tiền',
        details: process.env.NODE_ENV === 'development' ? error.message : null
      });
    }
});

// API lấy danh sách địa chỉ (chỉ owner hoặc admin) — trả chỉ các địa chỉ active
router.get('/customer-addresses/:customerId', authenticateToken, async (req, res) => {
  const { customerId } = req.params;

  // Authorization: chỉ owner hoặc admin
  if (!req.user || (String(req.user.makh) !== String(customerId) && req.user.userType !== 'admin')) {
    return res.status(403).json({ success: false, error: 'Không có quyền truy cập danh sách địa chỉ này' });
  }

  try {
    const [addresses] = await pool.query(`
      SELECT 
        MaDiaChi AS id,
        TenNguoiNhan AS name,
        SDT AS phone,
        DiaChiChiTiet AS detail,
        TinhThanh AS province,
        QuanHuyen AS district,
        PhuongXa AS ward,
        MacDinh AS is_default
      FROM diachi
      WHERE MaKH = ? AND (is_active IS NULL OR is_active = 1)
      ORDER BY MaDiaChi DESC
    `, [customerId]);

    // Resolve names (parallel)
    const resolved = await Promise.all(addresses.map(async addr => {
      const prov = await resolveProvince(addr.province);
      const dist = await resolveDistrict(addr.district);
      const w = await resolveWard(addr.ward);
      return {
        id: addr.id,
        name: addr.name,
        phone: addr.phone,
        detail: addr.detail,
        // resolved human-readable names (may be equal to code on fallback)
        province: prov,
        district: dist,
        ward: w,
        // include whether this is default (MacDinh) for the frontend
        is_default: (addr.is_default !== undefined ? addr.is_default : (addr.MacDinh !== undefined ? addr.MacDinh : 0)),
        // keep original codes so frontend can always resolve if needed
        provinceCode: addr.province,
        districtCode: addr.district,
        wardCode: addr.ward
      };
    }));

    res.json({ success: true, data: resolved });
  } catch (error) {
    console.error('Lỗi lấy địa chỉ cũ:', error);
    res.status(500).json({ success: false, error: 'Lỗi khi lấy danh sách địa chỉ' });
  }
});
 // ---- Address name resolver (province/district/ward) -------------------------

// In-memory caches
const provinceCache = new Map();
const districtCache = new Map();
const wardCache     = new Map();

// Safe fetch (Node or browser)
const fetchFn =
  typeof fetch !== "undefined"
    ? fetch
    : (...args) => import("node-fetch").then(m => m.default(...args));

const API_BASE = "https://provinces.open-api.vn/api";

// Small helper: normalize numeric code to string, keep text if already a name
function normalizeCode(code) {
  if (code === null || code === undefined) return "";
  const str = String(code).trim();
  return /^[0-9]+$/.test(str) ? String(parseInt(str, 10)) : str; // "001" -> "1"
}

// Core fetch with timeout + safe JSON
async function tryFetchName(url, timeoutMs = 5000) {
  const ctrl = typeof AbortController !== "undefined" ? new AbortController() : null;
  const id = ctrl ? setTimeout(() => ctrl.abort(), timeoutMs) : null;

  try {
    const r = await fetchFn(url, ctrl ? { signal: ctrl.signal } : undefined);
    if (!r || !r.ok) return null;
    const data = await r.json().catch(() => null);
    if (!data) return null;
    // API returns { name: "..." }
    return data.name ?? null;
  } catch (err) {
    console.warn("tryFetchName error:", url, err?.message);
    return null;
  } finally {
    if (id) clearTimeout(id);
  }
}

// Generic resolver using a cache and endpoint path ("p", "d", "w")
async function resolveWithCache(code, cache, path) {
  if (!code) return "";
  const norm = normalizeCode(code);

  // If it's already text (not numeric), return as-is
  if (!/^[0-9]+$/.test(norm)) return norm;

  if (cache.has(norm)) return cache.get(norm);

  const name = await tryFetchName(`${API_BASE}/${path}/${norm}`);
  if (name) {
    cache.set(norm, name);
    return name;
  }

  console.warn(`resolve(${path}) fallback to code:`, norm);
  return norm; // fallback: return original code string
}

// Public resolvers
const resolveProvince = (code) => resolveWithCache(code, provinceCache, "p");
const resolveDistrict = (code) => resolveWithCache(code, districtCache, "d");
const resolveWard     = (code) => resolveWithCache(code, wardCache, "w");

// ---- Example Express route --------------------------------------------------
// app.get("/api/addresses/old", async (req, res) => {
async function handleGetOldAddresses(req, res, addresses) {
  try {
    // addresses: [{ id, name, phone, detail, province, district, ward }, ...]
    if (!Array.isArray(addresses)) {
      return res.status(400).json({ success: false, error: "Danh sách địa chỉ không hợp lệ" });
    }

    const resolved = await Promise.all(
      addresses.map(async (addr) => {
        const [prov, dist, wrd] = await Promise.all([
          resolveProvince(addr.province),
          resolveDistrict(addr.district),
          resolveWard(addr.ward),
        ]);

        return {
          id: addr.id,
          name: addr.name ?? "",
          phone: addr.phone ?? "",
          detail: addr.detail ?? "",
          province: prov,
          district: dist,
          ward: wrd,
          provinceCode: addr.province,
          districtCode: addr.district,
          wardCode: addr.ward
        };
      })
    );

    res.json({ success: true, data: resolved });
  } catch (error) {
    console.error("Lỗi lấy địa chỉ cũ:", error);
    res.status(500).json({ success: false, error: "Lỗi khi lấy danh sách địa chỉ" });
  }
}
// });


///////--- api địa chỉ khách hàng --------------
// ...existing code...

// API tạo địa chỉ mới cho khách hàng
router.post('/customer-addresses', authenticateToken, async (req, res) => {
  const customerId = req.user && req.user.makh;
  const { name, phone, detail, province, district, ward } = req.body;

  if (!customerId) return res.status(401).json({ success: false, error: 'Không xác thực được người dùng' });
  if (!name || !phone || !detail) {
    return res.status(400).json({ success: false, error: 'Thiếu thông tin bắt buộc (name, phone, detail)' });
  }

  try {
    const [result] = await pool.query(
      `INSERT INTO diachi (MaKH, TenNguoiNhan, SDT, DiaChiChiTiet, TinhThanh, QuanHuyen, PhuongXa)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [customerId, name, phone, detail, province || null, district || null, ward || null]
    );

    res.json({ success: true, message: 'Tạo địa chỉ thành công', data: { id: result.insertId } });
  } catch (err) {
    console.error('Create address error:', err);
    res.status(500).json({ success: false, error: 'Lỗi hệ thống khi tạo địa chỉ' });
  }
});

// API cập nhật địa chỉ (chỉ chủ sở hữu hoặc admin)
router.put('/customer-addresses/:addressId', authenticateToken, async (req, res) => {
  const customerId = req.user && req.user.makh;
  const { addressId } = req.params;
  const { name, phone, detail, province, district, ward, is_default } = req.body;

  if (!customerId) return res.status(401).json({ success: false, error: 'Không xác thực được người dùng' });
  // allow updating is_default boolean as well
  if (name === undefined && phone === undefined && detail === undefined && province === undefined && district === undefined && ward === undefined && is_default === undefined) {
    return res.status(400).json({ success: false, error: 'Không có trường cập nhật' });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Kiểm tra quyền sở hữu
    const [rows] = await conn.query(`SELECT MaDiaChi, MaKH FROM diachi WHERE MaDiaChi = ? FOR UPDATE`, [addressId]);
    if (!rows.length) {
      await conn.rollback();
      return res.status(404).json({ success: false, error: 'Không tìm thấy địa chỉ' });
    }
    if (rows[0].MaKH != customerId && req.user.userType !== 'admin') {
      await conn.rollback();
      return res.status(403).json({ success: false, error: 'Không có quyền sửa địa chỉ này' });
    }

    const fields = [];
    const params = [];
    if (name !== undefined) { fields.push('TenNguoiNhan = ?'); params.push(name); }
    if (phone !== undefined) { fields.push('SDT = ?'); params.push(phone); }
    if (detail !== undefined) { fields.push('DiaChiChiTiet = ?'); params.push(detail); }
    if (province !== undefined) { fields.push('TinhThanh = ?'); params.push(province); }
    if (district !== undefined) { fields.push('QuanHuyen = ?'); params.push(district); }
    if (ward !== undefined) { fields.push('PhuongXa = ?'); params.push(ward); }
  // map incoming is_default to existing DB column `MacDinh`
  if (is_default !== undefined) { fields.push('MacDinh = ?'); params.push(is_default ? 1 : 0); }

    params.push(addressId);

    // If setting this address as default, unset other defaults first (atomic)
    if (is_default !== undefined && (is_default === true || is_default === 1 || is_default === '1' || is_default === 'true')) {
      // unset other defaults using existing column `MacDinh`
      await conn.query(`UPDATE diachi SET MacDinh = 0 WHERE MaKH = ?`, [customerId]);
    }

    await conn.query(`UPDATE diachi SET ${fields.join(', ')} WHERE MaDiaChi = ?`, params);

    await conn.commit();
    res.json({ success: true, message: 'Cập nhật địa chỉ thành công' });
  } catch (err) {
    await conn.rollback();
    console.error('Update address error:', err);
    res.status(500).json({ success: false, error: 'Lỗi hệ thống khi cập nhật địa chỉ' });
  } finally {
    conn.release();
  }
});

// ...existing code...

router.delete('/customer-addresses/:addressId', authenticateToken, async (req, res) => {
  const customerId = req.user && req.user.makh;
  const { addressId } = req.params;

  if (!customerId) return res.status(401).json({ success: false, error: 'Không xác thực được người dùng' });

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Kiểm tra tồn tại và quyền sở hữu
    const [rows] = await conn.query(`SELECT MaDiaChi, MaKH FROM diachi WHERE MaDiaChi = ? FOR UPDATE`, [addressId]);
    if (!rows.length) {
      await conn.rollback();
      return res.status(404).json({ success: false, error: 'Không tìm thấy địa chỉ' });
    }
    if (rows[0].MaKH != customerId && req.user.userType !== 'admin') {
      await conn.rollback();
      return res.status(403).json({ success: false, error: 'Không có quyền xóa địa chỉ này' });
    }

    // Kiểm tra tham chiếu từ hoadon
    const [ref] = await conn.query(`SELECT COUNT(*) AS cnt FROM hoadon WHERE MaDiaChi = ?`, [addressId]);
    const usage = (ref && ref[0] && (ref[0].cnt ?? ref[0].CNT)) ? (ref[0].cnt ?? ref[0].CNT) : 0;

    if (usage > 0) {
      // Thực hiện soft-delete (đánh dấu vô hiệu hoá) — an toàn cho dữ liệu hoá đơn
      await conn.query(`UPDATE diachi SET is_active = 0 WHERE MaDiaChi = ?`, [addressId]);
      await conn.commit();
      return res.status(200).json({
        success: true,
        message: 'Địa chỉ đang được sử dụng trong đơn hàng — đã đánh dấu vô hiệu hoá (soft-delete).',
        softDeleted: true,
        usageCount: usage
      });
    }

    // Nếu không có tham chiếu, xóa cứng (không còn ràng buộc)
    await conn.query(`DELETE FROM diachi WHERE MaDiaChi = ?`, [addressId]);

    await conn.commit();
    res.json({ success: true, message: 'Xóa địa chỉ thành công', softDeleted: false });
  } catch (err) {
    await conn.rollback();
    console.error('Delete address error:', err);
    res.status(500).json({ success: false, error: 'Lỗi hệ thống khi xóa địa chỉ', details: err.message });
  } finally {
    conn.release();
  }
});

// POST /customer-addresses/:addressId/set-default - mark an address as the customer's default
router.post('/customer-addresses/:addressId/set-default', authenticateToken, async (req, res) => {
  const customerId = req.user && req.user.makh;
  const { addressId } = req.params;

  if (!customerId) return res.status(401).json({ success: false, error: 'Không xác thực được người dùng' });

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Check ownership
    const [rows] = await conn.query('SELECT MaDiaChi, MaKH FROM diachi WHERE MaDiaChi = ? FOR UPDATE', [addressId]);
    if (!rows.length) {
      await conn.rollback();
      return res.status(404).json({ success: false, error: 'Không tìm thấy địa chỉ' });
    }
    if (rows[0].MaKH != customerId && req.user.userType !== 'admin') {
      await conn.rollback();
      return res.status(403).json({ success: false, error: 'Không có quyền đặt địa chỉ này làm mặc định' });
    }

  // Unset other defaults for this customer using existing column MacDinh
  await conn.query('UPDATE diachi SET MacDinh = 0 WHERE MaKH = ?', [customerId]);

  // Set this address as default
  await conn.query('UPDATE diachi SET MacDinh = 1 WHERE MaDiaChi = ?', [addressId]);

    await conn.commit();
    res.json({ success: true, message: 'Đã đặt địa chỉ làm mặc định' });
  } catch (err) {
    await conn.rollback();
    console.error('Set-default address error:', err);
    res.status(500).json({ success: false, error: 'Lỗi hệ thống khi đặt mặc định địa chỉ' });
  } finally {
    conn.release();
  }
});

// ✅ ĐÃ XÓA ROUTE CŨ - DÙNG ROUTE MỚI Ở DƯỚI (dòng ~2927)

// ✅ API CẬP NHẬT ĐỊA CHỈ - PHIÊN BẢN ĐƠN GIẢN HÓA
router.put('/hoadon/:id/address', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const userId = req.user && req.user.makh;
  const {
    MaDiaChi, 
    TenNguoiNhan, 
    SDT, 
    DiaChiChiTiet, 
    TinhThanh, 
    QuanHuyen, 
    PhuongXa
  } = req.body;

  if (!userId) {
    return res.status(401).json({ success: false, error: 'Chưa đăng nhập' });
  }

  // Nếu không truyền MaDiaChi thì phải cung cấp thông tin địa chỉ mới
  if (!MaDiaChi && (!TenNguoiNhan || !SDT || !DiaChiChiTiet || !TinhThanh)) {
    return res.status(400).json({ 
      success: false, 
      error: 'Thiếu thông tin địa chỉ' 
    });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // ✅ BƯỚC 1: Lấy thông tin đơn hàng hiện tại
    const [orderRows] = await conn.query(`
      SELECT h.MaHD, h.makh, h.MaDiaChi, h.tinhtrang, 
             h.TrangThaiThanhToan, h.PhuongThucThanhToan, 
             h.TongTien, h.PhiShip,
             d.TinhThanh as OldProvince
      FROM hoadon h
      LEFT JOIN diachi d ON h.MaDiaChi = d.MaDiaChi
      WHERE h.MaHD = ? AND h.makh = ?
      FOR UPDATE
    `, [id, userId]);

    if (!orderRows.length) {
      await conn.rollback();
      return res.status(404).json({ 
        success: false, 
        error: 'Không tìm thấy đơn hàng' 
      });
    }

    const order = orderRows[0];

    // ✅ BƯỚC 2: Kiểm tra điều kiện được phép đổi
    if (order.tinhtrang !== 'Chờ xử lý') {
      await conn.rollback();
      return res.status(400).json({
        success: false,
        error: 'Chỉ có thể đổi địa chỉ khi đơn đang "Chờ xử lý"',
        currentStatus: order.tinhtrang
      });
    }

    // ✅ BƯỚC 3: Lưu hoặc sử dụng địa chỉ có sẵn
    let newAddressId = MaDiaChi;
    let newProvince = TinhThanh;

    if (!MaDiaChi) {
      // Tạo địa chỉ mới
      const [addrResult] = await conn.query(`
        INSERT INTO diachi (MaKH, TenNguoiNhan, SDT, DiaChiChiTiet, 
                           TinhThanh, QuanHuyen, PhuongXa)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [userId, TenNguoiNhan, SDT, DiaChiChiTiet, 
          TinhThanh, QuanHuyen, PhuongXa]);
      
      newAddressId = addrResult.insertId;
    } else {
      // Lấy thông tin địa chỉ đã chọn
      const [addrRows] = await conn.query(`
        SELECT TinhThanh FROM diachi WHERE MaDiaChi = ?
      `, [MaDiaChi]);
      
      if (!addrRows.length) {
        await conn.rollback();
        return res.status(404).json({ 
          success: false, 
          error: 'Địa chỉ không tồn tại' 
        });
      }
      
      newProvince = addrRows[0].TinhThanh;
    }

    // ✅ BƯỚC 4: Tính lại phí ship
    // Lấy tổng trọng lượng đơn hàng
    const [weightRows] = await conn.query(`
      SELECT COALESCE(SUM(sp.TrongLuong * ct.SoLuong), 0) AS totalWeight
      FROM chitiethoadon ct
      JOIN sanpham sp ON ct.MaSP = sp.MaSP
      WHERE ct.MaHD = ?
    `, [id]);

    const totalWeight = weightRows[0]?.totalWeight || 0;

    // Lấy tier khách hàng
    const [customerRows] = await conn.query(`
      SELECT loyalty_tier FROM khachhang WHERE makh = ?
    `, [userId]);

    const userTier = customerRows[0]?.loyalty_tier || 'Đồng';

    // ✅ FIX #1: Sửa falsy coercion - PhiShip = 0 là hợp lệ (free ship)
    let oldShippingFee;
    if (order.PhiShip !== null && order.PhiShip !== undefined) {
      // Dùng giá trị từ DB (chính xác)
      oldShippingFee = order.PhiShip;
    } else {
      // Fallback: recalculate từ province (nếu DB không có PhiShip)
      oldShippingFee = calculateShippingFee(order.OldProvince || '', totalWeight, userTier);
    }
    
    const newShippingFee = calculateShippingFee(newProvince, totalWeight, userTier);
    
    const shippingDiff = newShippingFee - oldShippingFee;

    console.log('🚚 Shipping calculation:', {
      orderId: id,
      oldProvince: order.OldProvince,
      newProvince,
      totalWeight,
      userTier,
      oldShippingFee,
      newShippingFee,
      shippingDiff,
      paymentMethod: order.PhuongThucThanhToan,
      paymentStatus: order.TrangThaiThanhToan
    });

    // ✅ BƯỚC 5: Xử lý theo kịch bản ĐƠN GIẢN HÓA
    
    // TRƯỜNG HỢP 1: Phí ship giảm hoặc không đổi
    if (shippingDiff <= 0) {
      const newTotal = order.TongTien - oldShippingFee + newShippingFee;
      
      await conn.query(`
        UPDATE hoadon 
        SET MaDiaChi = ?,
            PhiShip = ?,
            TongTien = ?,
            GhiChu = CONCAT(
              IFNULL(GhiChu, ''), 
              '\n[', NOW(), '] Đổi địa chỉ: Phí ship thay đổi từ ',
              ?, 'đ → ', ?, 'đ. Tổng tiền mới: ', ?, 'đ'
            )
        WHERE MaHD = ?
      `, [newAddressId, newShippingFee, newTotal,
          oldShippingFee, newShippingFee, newTotal, id]);

      await conn.commit();
      
      console.log('✅ [SHIP GIẢM] Cập nhật thành công:', {
        orderId: id,
        oldTotal: order.TongTien,
        newTotal,
        oldShippingFee,
        newShippingFee,
        shippingDiff
      });
      
      return res.json({
        success: true,
        message: 'Cập nhật địa chỉ thành công',
        data: {
          orderId: id,
          newAddressId,
          oldShippingFee,
          newShippingFee,
          shippingDiff,
          PhiShip: newShippingFee,  // ✅ Trả về phí ship mới
          TongTien: newTotal,  // ✅ Trả về tổng tiền mới (đã cập nhật vào DB)
          note: shippingDiff < 0 ? 'Phí ship giảm, tổng tiền giảm' : 'Phí ship không đổi'
        }
      });
    }

    // TRƯỜNG HỢP 2: Phí ship tăng
    if (shippingDiff > 0) {
      let noteText = '';
      let updateQuery = '';
      let updateParams = [];

      // 🎯 LOGIC CHUNG: Cập nhật địa chỉ + ghi chú thu tiền ship
      if (order.PhuongThucThanhToan === 'VNPAY' && 
          order.TrangThaiThanhToan === 'Đã thanh toán') {
        
        // ✅ ĐÃ THANH TOÁN VNPAY: Ghi chú thu thêm tiền ship khi giao
        // ✅ FIX #3: Cập nhật cả PhiShip + TongTien trong DB
        // (Để lần update tiếp theo tính toán chính xác)
        const newTotal = order.TongTien + shippingDiff;
        
        noteText = `\n[${new Date().toLocaleString('vi-VN')}] ⚠️ ĐỔI ĐỊA CHỈ: Thu thêm ${shippingDiff.toLocaleString()}đ phí ship khi giao hàng (Đã TT VNPay ${order.TongTien.toLocaleString()}đ)`;
        
        updateQuery = `
          UPDATE hoadon 
          SET MaDiaChi = ?,
              PhiShip = ?,
              TongTien = ?,
              GhiChu = CONCAT(IFNULL(GhiChu, ''), ?)
          WHERE MaHD = ?
        `;
        updateParams = [newAddressId, newShippingFee, newTotal, noteText, id];
        
      } else if (order.PhuongThucThanhToan === 'COD') {
        
        // ✅ COD: Tăng tổng tiền, shipper sẽ thu tổng
        const newTotal = order.TongTien + shippingDiff;
        
        noteText = `\n[${new Date().toLocaleString('vi-VN')}] Đổi địa chỉ: Phí ship tăng ${shippingDiff.toLocaleString()}đ (từ ${oldShippingFee.toLocaleString()}đ → ${newShippingFee.toLocaleString()}đ)`;
        
        updateQuery = `
          UPDATE hoadon 
          SET MaDiaChi = ?,
              PhiShip = ?,
              TongTien = ?,
              GhiChu = CONCAT(IFNULL(GhiChu, ''), ?)
          WHERE MaHD = ?
        `;
        updateParams = [newAddressId, newShippingFee, newTotal, noteText, id];
        
      } else {
        
        // ✅ CHƯA THANH TOÁN: Tăng tổng tiền trước khi thanh toán
        const newTotal = order.TongTien + shippingDiff;
        
        noteText = `\n[${new Date().toLocaleString('vi-VN')}] Đổi địa chỉ: Phí ship tăng ${shippingDiff.toLocaleString()}đ. Cập nhật tổng tiền trước khi thanh toán.`;
        
        updateQuery = `
          UPDATE hoadon 
          SET MaDiaChi = ?,
              PhiShip = ?,
              TongTien = ?,
              GhiChu = CONCAT(IFNULL(GhiChu, ''), ?)
          WHERE MaHD = ?
        `;
        updateParams = [newAddressId, newShippingFee, newTotal, noteText, id];
      }

      // Thực hiện cập nhật
      await conn.query(updateQuery, updateParams);
      await conn.commit();

      // ✅ Response phân biệt theo trường hợp
      const responseData = {
        orderId: id,
        newAddressId,
        oldProvince: order.OldProvince,
        newProvince,
        oldShippingFee,
        newShippingFee,
        shippingDiff,
        PhiShip: newShippingFee  // ✅ Trả về phí ship mới
      };

      if (order.PhuongThucThanhToan === 'VNPAY' && 
          order.TrangThaiThanhToan === 'Đã thanh toán') {
        
        const newTotal = order.TongTien + shippingDiff;
        
        return res.json({
          success: true,
          warning: true,
          message: `Địa chỉ đã được cập nhật. Shipper sẽ thu thêm ${shippingDiff.toLocaleString()}đ phí ship khi giao hàng.`,
          data: {
            ...responseData,
            TongTien: newTotal,  // ✅ Trả về tổng tiền mới (đã cập nhật vào DB)
            collectOnDelivery: shippingDiff,
            note: `Đã thanh toán online ${order.TongTien.toLocaleString()}đ. Thu thêm ${shippingDiff.toLocaleString()}đ khi giao.`
          }
        });
        
      } else if (order.PhuongThucThanhToan === 'COD') {
        
        const newTotal = order.TongTien + shippingDiff;
        
        return res.json({
          success: true,
          warning: true,
          message: `Phí ship tăng ${shippingDiff.toLocaleString()}đ. Vui lòng trả ${newTotal.toLocaleString()}đ khi nhận hàng.`,
          data: {
            ...responseData,
            TongTien: newTotal,  // ✅ Trả về tổng tiền mới
            newTotal,
            note: `Tổng tiền COD: ${newTotal.toLocaleString()}đ (bao gồm phí ship ${newShippingFee.toLocaleString()}đ)`
          }
        });
        
      } else {
        
        const newTotal = order.TongTien + shippingDiff;
        
        return res.json({
          success: true,
          message: 'Cập nhật địa chỉ và phí ship thành công. Vui lòng thanh toán lại.',
          data: {
            ...responseData,
            TongTien: newTotal,  // ✅ Trả về tổng tiền mới
            newTotal,
            requireNewPayment: true,
            note: 'Tổng tiền đã thay đổi, vui lòng thanh toán lại'
          }
        });
      }
    }

  } catch (err) {
    await conn.rollback();
    console.error('❌ Update order address error:', err);
    
    res.status(500).json({ 
      success: false, 
      error: 'Lỗi khi cập nhật địa chỉ',
      details: err.message 
    });
  } finally {
    conn.release();
  }
});
export default router;