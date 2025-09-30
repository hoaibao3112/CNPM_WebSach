import express from 'express';
import pool from '../config/connectDatabase.js';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { VNPay, ignoreLogger, ProductCode, VnpLocale, dateFormat } from 'vnpay';

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

// API đặt đơn hàng
router.post('/place-order', authenticateToken, async (req, res) => {
  try {
    const { customer, items, shippingAddress, paymentMethod, notes } = req.body;
    console.log('Request Body:', req.body);
    console.log('req.user:', req.user);

    // Kiểm tra dữ liệu đầu vào
    if (!customer || !items || !shippingAddress || !paymentMethod) {
      return res.status(400).json({ error: 'Thiếu thông tin bắt buộc' });
    }

    // Kiểm tra các trường bắt buộc trong customer và shippingAddress
    if (!customer.makh || !customer.name || !customer.phone || !shippingAddress.detail ||
      !shippingAddress.province || !shippingAddress.district || !shippingAddress.ward) {
      return res.status(400).json({ error: 'Thông tin khách hàng hoặc địa chỉ không đầy đủ' });
    }

    // Kiểm tra khách hàng
    const [existingCustomer] = await pool.query('SELECT makh, email FROM khachhang WHERE makh = ?', [customer.makh]);
    if (!existingCustomer.length) {
      return res.status(400).json({ error: 'Khách hàng không tồn tại' });
    }

    // Kiểm tra items từ body
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Không có sản phẩm được chọn' });
    }

    // Validate sản phẩm và tồn kho
    const cartItems = [];
    for (const item of items) {
      if (!item.MaSP || !item.SoLuong || item.SoLuong < 1) {
        return res.status(400).json({ error: `Sản phẩm ${item.MaSP} không hợp lệ` });
      }
      const [product] = await pool.query(
        'SELECT MaSP, DonGia as price, SoLuong as stock FROM sanpham WHERE MaSP = ?',
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
        price: product[0].price
      });
    }

    // Tính tổng tiền
    const totalAmount = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    console.log('Validated cart items:', cartItems, 'Total:', totalAmount);

    // Lưu địa chỉ
    const [addressResult] = await pool.query(
      'INSERT INTO diachi (MaKH, TenNguoiNhan, SDT, DiaChiChiTiet, TinhThanh, QuanHuyen, PhuongXa) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [customer.makh, customer.name, customer.phone, shippingAddress.detail, shippingAddress.province, shippingAddress.district, shippingAddress.ward]
    );
    const addressId = addressResult.insertId;

    // Tạo đơn hàng
    const [orderResult] = await pool.query(
      `INSERT INTO hoadon (makh, MaDiaChi, NgayTao, TongTien, PhuongThucThanhToan, GhiChu, tinhtrang, TrangThaiThanhToan) 
       VALUES (?, ?, NOW(), ?, ?, ?, ?, ?)`,
      [customer.makh, addressId, totalAmount, paymentMethod, notes || '', 'Chờ xử lý', 'Chưa thanh toán']
    );
    const orderId = orderResult.insertId;

    // Lưu chi tiết đơn hàng
    for (const item of cartItems) {
      await pool.query(
        'INSERT INTO chitiethoadon (MaHD, MaSP, SoLuong, DonGia) VALUES (?, ?, ?, ?)',
        [orderId, item.productId, item.quantity, item.price]
      );
      await pool.query('UPDATE sanpham SET SoLuong = SoLuong - ? WHERE MaSP = ?', [item.quantity, item.productId]);
    }

    // Xóa giỏ hàng
    await pool.query('DELETE FROM giohang WHERE MaKH = ? AND MaSP IN (?)', [customer.makh, cartItems.map(i => i.productId)]);

    // Tạo URL thanh toán VNPay
    // if (paymentMethod === 'VNPAY') {
    //   const vnp_Params = {
    //     vnp_Version: '2.1.0',
    //     vnp_Command: 'pay',
    //     vnp_TmnCode: process.env.VNP_TMNCODE,
    //     vnp_Amount: totalAmount * 100,
    //     vnp_CurrCode: 'VND',
    //     vnp_TxnRef: orderId.toString(),
    //     vnp_OrderInfo: `Thanh toan don hang ${orderId}`,
    //     vnp_OrderType: 'billpayment',
    //     vnp_Locale: 'vn',
    //     vnp_ReturnUrl: process.env.VNP_RETURN_URL,
    //     vnp_IpAddr: req.ip,
    //     vnp_CreateDate: new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14)
    //   };
    //   const sortedParams = sortObject(vnp_Params);
    //   const querystring = new URLSearchParams(sortedParams).toString();
    //   const hmac = crypto.createHmac("sha512", process.env.VNP_HASHSECRET);
    //   const signed = hmac.update(Buffer.from(querystring, 'utf-8')).digest("hex");
    //   vnp_Params.vnp_SecureHash = signed;
    //   const paymentUrl = `${process.env.VNP_URL}?${querystring}&vnp_SecureHash=${signed}`;

    //   res.status(200).json({ success: true, orderId, paymentUrl });
    // } else {
    //   res.status(200).json({ success: true, orderId });
    // }

    if (paymentMethod === 'VNPAY') {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const vnpayResponse = await vnpay.buildPaymentUrl({
    vnp_Amount: totalAmount, // Đã đúng - thư viện tự nhân 100
    vnp_IpAddr: req.ip || req.connection.remoteAddress || '127.0.0.1',
    vnp_TxnRef: orderId.toString(),
    vnp_OrderInfo: `Thanh toan don hang ${orderId}`,
    vnp_OrderType: ProductCode.Other, // Sử dụng enum từ thư viện
    vnp_ReturnUrl: process.env.VNP_RETURN_URL,
    vnp_Locale: VnpLocale.VN, // Sử dụng enum từ thư viện
    vnp_CreateDate: dateFormat(new Date()),
    vnp_ExpireDate: dateFormat(tomorrow),
  });
  
  return res.status(200).json({ success: true, orderId, paymentUrl: vnpayResponse });
} else {
  res.status(200).json({ success: true, orderId });
}

  } catch (error) {
    console.error('Lỗi đặt hàng:', error);
    res.status(500).json({ error: 'Lỗi khi đặt hàng', details: error.message });
  }
});
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

  const trangThaiHopLe = ['Chờ xử lý', 'Đã xác nhận', 'Đang giao hàng', 'Đã giao hàng', 'Đã hủy'];
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

// API hủy đơn hàng của khách hàng
router.put('/customer-orders/cancel/:orderId', authenticateToken, async (req, res) => {
  const { orderId } = req.params;
  const { customerId, reason } = req.body;

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [order] = await connection.query(
      `SELECT tinhtrang FROM hoadon WHERE MaHD = ? AND makh = ?`,
      [orderId, customerId]
    );

    if (order.length === 0) {
      throw new Error('Không tìm thấy đơn hàng');
    }

    if (order[0].tinhtrang !== 'Chờ xử lý') {
      throw new Error('Chỉ có thể hủy đơn hàng ở trạng thái "Chờ xử lý"');
    }

    await connection.query(
      `UPDATE hoadon 
       SET tinhtrang = 'Đã hủy', 
           GhiChu = CONCAT(IFNULL(GhiChu, ''), ?) 
       WHERE MaHD = ?`,
      [`\nLý do hủy: ${reason || 'Không có lý do'}`, orderId]
    );

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

    await connection.commit();
    res.json({ success: true, message: 'Hủy đơn hàng thành công' });
  } catch (error) {
    await connection.rollback();
    console.error('Lỗi khi hủy đơn hàng:', {
      timestamp: new Date(),
      errorDetails: {
        message: error.message,
        sqlQuery: error.sql,
        sqlMessage: error.sqlMessage
      }
    });
    res.status(500).json({
      error: 'Lỗi khi hủy đơn hàng',
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




// API hoàn tiền VNPay - CẬP NHẬT HOÀN TOÀN
router.post('/vnpay_refund', authenticateToken, async (req, res) => {
  try {
    const { orderId, refundAmount, refundReason } = req.body;
    
    // Kiểm tra thông tin đầu vào
    if (!orderId || !refundAmount || !refundReason) {
      return res.status(400).json({ error: 'Thiếu thông tin bắt buộc' });
    }

    // Kiểm tra đơn hàng
    const [order] = await pool.query(`
      SELECT hd.*, kh.tenkh 
      FROM hoadon hd 
      LEFT JOIN khachhang kh ON hd.makh = kh.makh 
      WHERE hd.MaHD = ?
    `, [orderId]);

    if (order.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy đơn hàng' });
    }

    const orderData = order[0];

    // Kiểm tra điều kiện hoàn tiền
    if (orderData.PhuongThucThanhToan !== 'VNPAY') {
      return res.status(400).json({ error: 'Đơn hàng không thanh toán qua VNPay' });
    }

    if (orderData.TrangThaiThanhToan !== 'Đã thanh toán') {
      return res.status(400).json({ error: 'Đơn hàng chưa được thanh toán' });
    }

    // ✅ SỬA: Kiểm tra số tiền đã hoàn trước đó
    const totalAlreadyRefunded = orderData.SoTienHoanTra || 0;
    if ((totalAlreadyRefunded + refundAmount) > orderData.TongTien) {
      return res.status(400).json({ 
        error: `Tổng số tiền hoàn (${totalAlreadyRefunded + refundAmount}) vượt quá tổng tiền đơn hàng (${orderData.TongTien})` 
      });
    }

    // Tạo request hoàn tiền VNPay
    const refundRequestId = `REFUND_${orderId}_${Date.now()}`;
    const refundData = {
      vnp_RequestId: refundRequestId,
      vnp_Version: '2.1.0',
      vnp_Command: 'refund',
      vnp_TmnCode: process.env.VNP_TMNCODE,
      vnp_TransactionType: refundAmount === orderData.TongTien ? '03' : '02', // 03: hoàn toàn, 02: hoàn một phần
      vnp_TxnRef: orderId.toString(),
      vnp_Amount: refundAmount * 100,
      vnp_OrderInfo: `Hoan tien don hang ${orderId}: ${refundReason}`,
      vnp_TransactionDate: new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14),
      vnp_CreateDate: new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14),
      vnp_CreateBy: req.user.makh || 'SYSTEM',
      vnp_IpAddr: req.ip || '127.0.0.1'
    };

    // Tạo secure hash
    const sortedParams = sortObject(refundData);
    const querystring = new URLSearchParams(sortedParams).toString();
    const hmac = crypto.createHmac("sha512", process.env.VNP_HASHSECRET);
    const signed = hmac.update(Buffer.from(querystring, 'utf-8')).digest("hex");
    refundData.vnp_SecureHash = signed;

    console.log('VNPay Refund Request:', refundData);

    // ✅ SỬA: Lưu log hoàn tiền vào bảng mới
    await pool.query(`
      INSERT INTO nhatky_hoantienvnpay 
      (ma_hoadon, ma_khachhang, ma_yc_hoantra, sotien_hoantra, lydo_hoantra, trangthai, ngay_tao) 
      VALUES (?, ?, ?, ?, ?, 'DANG_XL', NOW())
    `, [orderId, orderData.makh, refundRequestId, refundAmount, refundReason]);

    // Simulate VNPay API call (VNPay sandbox không hỗ trợ refund API thực tế)
    // Trong production, bạn cần gửi request đến VNPay API thực
    const refundResult = {
      vnp_ResponseCode: '00', // Giả lập thành công
      vnp_Message: 'Refund Success',
      vnp_RequestId: refundRequestId,
      vnp_TransactionNo: `RF${Date.now()}`,
      vnp_BankCode: 'NCB',
      vnp_PayDate: new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14)
    };

    console.log('VNPay Refund Response (Simulated):', refundResult);

    // ✅ SỬA: Cập nhật log với response từ VNPay
    await pool.query(`
      UPDATE nhatky_hoantienvnpay 
      SET phanhoi_vnpay = ?,
          trangthai = ?,
          ma_giaodich_hoantra = ?,
          ngay_vnpay_xuly = NOW(),
          ngay_capnhat = NOW()
      WHERE ma_yc_hoantra = ?
    `, [
      JSON.stringify(refundResult),
      refundResult.vnp_ResponseCode === '00' ? 'THANH_CONG' : 'THAT_BAI',
      refundResult.vnp_TransactionNo,
      refundRequestId
    ]);

    if (refundResult.vnp_ResponseCode === '00') {
      // ✅ SỬA: Hoàn tiền thành công - cập nhật đơn hàng với các cột mới
      const newTotalRefunded = totalAlreadyRefunded + refundAmount;
      const isFullRefund = newTotalRefunded >= orderData.TongTien;
      
      await pool.query(`
        UPDATE hoadon 
        SET TrangThaiThanhToan = ?,
            TrangThaiHoanTien = ?,
            SoTienHoanTra = ?,
            NgayHoanTien = NOW(),
            SoLanHoanTien = SoLanHoanTien + 1,
            GhiChu = CONCAT(IFNULL(GhiChu, ''), ?)
        WHERE MaHD = ?
      `, [
        isFullRefund ? 'Đã hoàn tiền' : 'Đã thanh toán',
        isFullRefund ? 'DA_HOAN' : 'DANG_XL_HOAN',
        newTotalRefunded,
        `\n[${new Date().toLocaleString()}] Hoàn tiền: ${refundAmount.toLocaleString()}đ - Lý do: ${refundReason}`,
        orderId
      ]);

      res.json({
        success: true,
        message: 'Hoàn tiền thành công',
        data: {
          refundRequestId,
          refundAmount,
          totalRefunded: newTotalRefunded,
          remainingAmount: orderData.TongTien - newTotalRefunded,
          isFullRefund,
          vnpayResponse: refundResult
        }
      });
    } else {
      // Hoàn tiền thất bại
      res.status(400).json({
        success: false,
        error: 'Hoàn tiền thất bại',
        message: refundResult.vnp_Message || 'Lỗi từ VNPay',
        vnpayResponse: refundResult
      });
    }

  } catch (error) {
    console.error('VNPay Refund Error:', error);
    res.status(500).json({
      error: 'Lỗi hệ thống khi hoàn tiền',
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

// ✅ THÊM: API admin xem tất cả hoàn tiền
router.get('/admin-refunds', authenticateToken, async (req, res) => {
  try {
    // Tạm thời bỏ qua check admin để test
    // if (req.user.userType !== 'admin') {
    //   return res.status(403).json({ error: 'Chỉ admin mới có quyền xem' });
    // }

    const [refunds] = await pool.query(`
      SELECT 
        nt.id,
        nt.ma_hoadon AS orderId,
        nt.ma_khachhang AS customerId,
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
        kh.sdt AS customerPhone,
        kh.email AS customerEmail,
        CASE nt.trangthai
          WHEN 'THANH_CONG' THEN 'Thành công'
          WHEN 'THAT_BAI' THEN 'Thất bại'
          WHEN 'DANG_XL' THEN 'Đang xử lý'
          ELSE 'Không xác định'
        END AS statusDisplay
      FROM nhatky_hoantienvnpay nt
      LEFT JOIN hoadon hd ON nt.ma_hoadon = hd.MaHD
      LEFT JOIN khachhang kh ON nt.ma_khachhang = kh.makh
      ORDER BY nt.ngay_tao DESC
      LIMIT 100
    `);

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
    console.error('Lỗi khi lấy danh sách hoàn tiền:', error);
    res.status(500).json({
      error: 'Lỗi khi lấy danh sách hoàn tiền',
      details: process.env.NODE_ENV === 'development' ? error.message : null
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

export default router;