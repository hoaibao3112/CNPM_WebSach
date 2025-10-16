import express from 'express';
import pool from '../config/connectDatabase.js';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { VNPay, ignoreLogger, ProductCode, VnpLocale, dateFormat } from 'vnpay';
import { pointsFromOrderAmount, addLoyaltyPoints, subtractLoyaltyPoints, computeTier } from '../utils/loyalty.js';
import { sendOrderConfirmationEmail } from '../utils/emailService.js';

const router = express.Router();

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
  const { items, shippingAddress, paymentMethod, notes, totalAmountDiscouted } = req.body;
  const customerId = (req.user && req.user.makh) || (req.body.customer && req.body.customer.makh);
  const customerName = (req.user && (req.user.tenkh || req.user.name)) || (req.body.customer && req.body.customer.name) || '';
  const customerPhone = (req.user && (req.user.sdt || req.user.phone)) || (req.body.customer && req.body.customer.phone) || '';
  if (!customerId) return res.status(401).json({ error: 'Không xác thực được khách hàng' });
  const customer = { makh: customerId, name: customerName, phone: customerPhone };
  console.log('req.user:', req.user);
  console.log('received totalAmountDiscouted:', totalAmountDiscouted);
    
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

    // Validate sản phẩm và tồn kho
    const cartItems = [];
    for (const item of items) {
      if (!item.MaSP || !item.SoLuong || item.SoLuong < 1) {
        return res.status(400).json({ error: `Sản phẩm ${item.MaSP} không hợp lệ` });
      }
      
      const [product] = await connection.query(
        'SELECT MaSP, DonGia as price, SoLuong as stock, TenSP, HinhAnh FROM sanpham WHERE MaSP = ?',
        [item.MaSP]
      );
      
      if (!product.length) {
        return res.status(400).json({ error: `Sản phẩm ${item.MaSP} không tồn tại` });
      }
      
      if (product[0].stock < item.SoLuong) {
        return res.status(400).json({ error: `Sản phẩm ${item.MaSP} không đủ tồn kho (${product[0].stock} < ${item.SoLuong})` });
      }
      
      cartItems.push({
        productId: item.MaSP,
        quantity: item.SoLuong,
        price: product[0].price,
        productName: product[0].TenSP,
        productImage: product[0].HinhAnh
      });
    }

    // Tính tổng tiền (subtotal)
    const subtotal = totalAmountDiscouted ? Number(totalAmountDiscouted) : cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  console.log('Validated cart items:', cartItems, 'Subtotal:', subtotal);

    // Áp dụng quyền lợi theo hạng hội viên
    const customerRow = existingCustomer[0];
    const userTier = customerRow.loyalty_tier || computeTier(customerRow.loyalty_points || 0);

    const tierConfig = {
      'Đồng': { discountPercent: 0, freeShipThreshold: 0, pointsMult: 1 },
      'Bạc':  { discountPercent: 3, freeShipThreshold: 200000, pointsMult: 1.2 },
      'Vàng': { discountPercent: 7, freeShipThreshold: 0, pointsMult: 1.5 },
    };
    const cfg = tierConfig[userTier] || tierConfig['Đồng'];

    const discountAmount = Math.round(subtotal * (cfg.discountPercent / 100));
    const amountAfterDiscount = Math.max(0, subtotal - discountAmount);

  // Debug output to help verify tier & discount behavior
  console.log('[LOYALTY DEBUG] customerId=', customer.makh, 'tier=', userTier, 'discountPercent=', cfg.discountPercent, 'discountAmount=', discountAmount, 'amountAfterDiscount=', amountAfterDiscount);

    // BẮT ĐẦU TRANSACTION
    await connection.beginTransaction();

    // Lưu địa chỉ
    const [addressResult] = await connection.query(
      'INSERT INTO diachi (MaKH, TenNguoiNhan, SDT, DiaChiChiTiet, TinhThanh, QuanHuyen, PhuongXa) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [customer.makh, customer.name, customer.phone, shippingAddress.detail, shippingAddress.province, shippingAddress.district, shippingAddress.ward]
    );
    const addressId = addressResult.insertId;

    // Tạo đơn hàng - lưu TongTien = amountAfterDiscount; ghi note quyền lợi/giảm giá
    const noteWithLoyalty = `${notes || ''}\n[LOYALTY] Hạng: ${userTier}; Giảm: ${cfg.discountPercent}% (${discountAmount.toLocaleString()}đ)`;
    const [orderResult] = await connection.query(
      `INSERT INTO hoadon (makh, MaDiaChi, NgayTao, TongTien, PhuongThucThanhToan, GhiChu, tinhtrang, TrangThaiThanhToan) 
       VALUES (?, ?, NOW(), ?, ?, ?, ?, ?)`,
      [customer.makh, addressId, amountAfterDiscount, paymentMethod, noteWithLoyalty, 'Chờ xử lý', 'Chưa thanh toán']
    );
    const orderId = orderResult.insertId;

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

    // XỬ LÝ THANH TOÁN: dùng amountAfterDiscount thay vì subtotal
    if (paymentMethod === 'VNPAY') {
      try {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const vnpayResponse = await vnpay.buildPaymentUrl({
          vnp_Amount: amountAfterDiscount,
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
              total: amountAfterDiscount,
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
          amountAfterDiscount
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
      // COD success: thêm điểm trên amountAfterDiscount (non-blocking)
      console.log('✅ COD Order completed successfully with ID:', orderId);
      try {
        const loyRes = await addLoyaltyPoints(connection, customer.makh, amountAfterDiscount);
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
            total: amountAfterDiscount,
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
        amountAfterDiscount
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
        rr.status,
        rr.createdAt,
        rr.processedAt,
        rr.bankAccount,
        rr.bankName,
        rr.accountHolder,
        hd.NgayTao AS orderDate,
        hd.TongTien AS orderAmount,
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
router.get('/locations/provinces', async (req, res) => {
  try {
    const r = await fetch('https://provinces.open-api.vn/api/p/');
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
    const r = await fetch(`https://provinces.open-api.vn/api/p/${provinceCode}?depth=2`);
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
    const r = await fetch(`https://provinces.open-api.vn/api/d/${districtCode}?depth=2`);
    const data = await r.json();
    const wards = (data.wards || []).map(w => ({ code: w.code, name: w.name }));
    res.json({ success: true, data: wards });
  } catch (err) {
    console.error('Error fetching wards', err);
    res.status(500).json({ error: 'Không thể tải danh sách phường/xã' });
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
        PhuongXa AS ward
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
        province: prov,
        district: dist,
        ward: w
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
  const { name, phone, detail, province, district, ward } = req.body;

  if (!customerId) return res.status(401).json({ success: false, error: 'Không xác thực được người dùng' });
  if (!name && !phone && !detail && !province && !district && !ward) {
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

    params.push(addressId);

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

// API cập nhật địa chỉ của hóa đơn (chỉ khi trạng thái = 'Chờ xử lý')
router.put('/hoadon/:id/address', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const userId = req.user && req.user.makh;
  const {
    MaDiaChi, TenNguoiNhan, SDT, DiaChiChiTiet, TinhThanh, QuanHuyen, PhuongXa
  } = req.body;

  // Nếu không truyền MaDiaChi thì phải cung cấp thông tin địa chỉ mới
  if (!MaDiaChi && (!TenNguoiNhan || !SDT || !DiaChiChiTiet)) {
    return res.status(400).json({ success: false, error: 'Thiếu thông tin địa chỉ hoặc MaDiaChi' });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Khóa đơn để tránh race condition
    const [rows] = await conn.query(`SELECT MaHD, makh, tinhtrang, MaDiaChi FROM hoadon WHERE MaHD = ? FOR UPDATE`, [id]);
    if (!rows.length) {
      await conn.rollback();
      return res.status(404).json({ success: false, error: 'Không tìm thấy đơn hàng' });
    }

    const order = rows[0];

    // Chỉ cho phép khi đang "Chờ xử lý"
    if (String(order.tinhtrang) !== 'Chờ xử lý') {
      await conn.rollback();
      return res.status(400).json({ success: false, error: 'Chỉ có thể sửa địa chỉ khi đơn đang ở trạng thái "Chờ xử lý"' });
    }

    // Quyền: chỉ chủ đơn hoặc admin
    if (String(order.makh) !== String(userId) && req.user.userType !== 'admin') {
      await conn.rollback();
      return res.status(403).json({ success: false, error: 'Không có quyền thay đổi địa chỉ đơn hàng này' });
    }

    let newAddressId = null;
    // Nếu client truyền MaDiaChi -> validate quyền sở hữu và dùng luôn
    if (MaDiaChi) {
      const [addrRows] = await conn.query(`SELECT MaDiaChi, MaKH FROM diachi WHERE MaDiaChi = ? FOR UPDATE`, [MaDiaChi]);
      if (!addrRows.length) {
        await conn.rollback();
        return res.status(404).json({ success: false, error: 'Địa chỉ không tồn tại' });
      }
      const addr = addrRows[0];
      // Chỉ chủ sở hữu địa chỉ hoặc admin được dùng địa chỉ này
      if (String(addr.MaKH) !== String(order.makh) && req.user.userType !== 'admin') {
        await conn.rollback();
        return res.status(403).json({ success: false, error: 'Không có quyền sử dụng địa chỉ này' });
      }
      newAddressId = addr.MaDiaChi;

      const note = `\n[${new Date().toLocaleString()}] Đổi địa chỉ giao hàng bởi ${req.user.tenkh || req.user.makh || 'khách'} (id:${userId})`;
      await conn.query(`UPDATE hoadon SET MaDiaChi = ?, GhiChu = CONCAT(IFNULL(GhiChu,''), ?) WHERE MaHD = ?`, [newAddressId, note, id]);
    } else {
      // Chèn địa chỉ mới (không xóa/ghi đè địa chỉ cũ để giữ lịch sử)
      const [insertRes] = await conn.query(
        `INSERT INTO diachi (MaKH, TenNguoiNhan, SDT, DiaChiChiTiet, TinhThanh, QuanHuyen, PhuongXa)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [order.makh, TenNguoiNhan, SDT, DiaChiChiTiet, TinhThanh || null, QuanHuyen || null, PhuongXa || null]
      );
      newAddressId = insertRes.insertId;

      // Cập nhật hóa đơn trỏ sang địa chỉ mới và lưu note
      const note = `\n[${new Date().toLocaleString()}] Đổi địa chỉ giao hàng bởi ${req.user.tenkh || req.user.makh || 'khách'} (id:${userId})`;
      await conn.query(`UPDATE hoadon SET MaDiaChi = ?, GhiChu = CONCAT(IFNULL(GhiChu,''), ?) WHERE MaHD = ?`, [newAddressId, note, id]);
    }

    await conn.commit();

    res.json({
      success: true,
      message: 'Cập nhật địa chỉ thành công',
      data: {
        orderId: id,
        MaDiaChi: newAddressId,
        address: { TenNguoiNhan, SDT, DiaChiChiTiet, TinhThanh, QuanHuyen, PhuongXa }
      }
    });
  } catch (err) {
    try { await conn.rollback(); } catch (e) {}
    console.error('Update order address error:', err);
    res.status(500).json({ success: false, error: 'Lỗi khi cập nhật địa chỉ', details: process.env.NODE_ENV === 'development' ? err.message : null });
  } finally {
    conn.release();
  }
});


export default router;