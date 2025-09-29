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
  vnpayHost: process.env.VNP_URL,
  testMode: true,
  hashAlgorithm: 'SHA512',
  enableLog: true, // Bật/tắt log
  loggerFn: ignoreLogger, // Custom logger
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
      tomorrow.setDate(tomorrow.getDate() + 1)
      const vnpayResponse = await vnpay.buildPaymentUrl({
        vnp_Amount: totalAmount,
        vnp_IpAddr: '127.0.0.1',
        vnp_TxnRef: orderId.toString(),
        vnp_OrderInfo: `Thanh toan don hang ${orderId}`,
        vnp_OrderType: 'billpayment',
        vnp_ReturnUrl: process.env.VNP_RETURN_URL,
        vnp_Locale: 'vn',
        vnp_CreateDate: dateFormat(new Date()),
        vnp_ExpireDate: dateFormat(tomorrow),
      })
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

// API xử lý return URL từ VNPay
router.get('/vnpay_return', async (req, res) => {
  try {
    // Xác thực chữ ký VNPay trả về
    const verify = vnpay.verifyReturnUrl(req.query);
    const orderId = req.query.vnp_TxnRef;
    const rspCode = req.query.vnp_ResponseCode;
    const amount = req.query.vnp_Amount;
    
    if (verify.isSuccess) {
      if (rspCode === "00") {
        await pool.query(
          `UPDATE hoadon 
           SET TrangThaiThanhToan = 'Đã thanh toán', tinhtrang = 'Đã xác nhận' 
           WHERE MaHD = ?`,
          [orderId]
        );
        console.log(`✅ Thanh toán thành công cho đơn hàng ${orderId}`);
        return res.redirect(
          `${process.env.CLIENT_CUSTOMER_URL}/GiaoDien/order-confirmation.html?orderId=${orderId}&amount=${amount}&status=success`
        );
      } else {
        await pool.query(
          `UPDATE hoadon 
           SET TrangThaiThanhToan = 'Thất bại' 
           WHERE MaHD = ?`,
          [orderId]
        );
        console.log(`Thanh toán thất bại cho đơn hàng ${orderId}`);
        return res.redirect(
          `${process.env.CLIENT_CUSTOMER_URL}/GiaoDien/order-confirmation.html?orderId=${orderId}&amount=${amount}&status=failed`
        );
      }
    } else {
      console.warn(" Sai chữ ký:", verify.message);
      return res.status(400).json({ error: "Invalid VNPay signature" });
    }
  } catch (error) {
    console.error("🔥 Lỗi xử lý /vnpay_return:", error);
    return res.status(500).json({ error: "Lỗi server khi xử lý VNPay return" });
  }
});

// API xử lý IPN từ VNPay
router.post('/vnpay_ipn', async (req, res) => {
  try {
    const verify = vnpay.verifyReturnUrl(req.body);
    const orderId = req.body.vnp_TxnRef;
    const rspCode = req.body.vnp_ResponseCode;
    if (verify.isSuccess) {
      if (rspCode === "00") {
        await pool.query(
          `UPDATE hoadon 
           SET TrangThaiThanhToan = 'Đã thanh toán', tinhtrang = 'Chờ xác nhận' 
           WHERE MaHD = ? AND TrangThaiThanhToan != 'Đã thanh toán'`,
          [orderId]
        );
        console.log(`✅ [IPN] Thanh toán thành công cho đơn hàng ${orderId}`);
        return res.status(200).json({ RspCode: "00", Message: "Confirm Success" });
      } else {
        await pool.query(
          `UPDATE hoadon 
           SET TrangThaiThanhToan = 'Thất bại' 
           WHERE MaHD = ?`,
          [orderId]
        );
        console.log(`❌ [IPN] Thanh toán thất bại cho đơn hàng ${orderId}`);
        return res.status(200).json({ RspCode: "01", Message: "Payment Failed" });
      }
    } else {
      console.warn("⚠️ [IPN] Sai chữ ký:", verify.message);
      return res.status(200).json({ RspCode: "97", Message: "Invalid Signature" });
    }
  } catch (error) {
    console.error("🔥 Lỗi xử lý /vnpay_ipn:", error);
    return res.status(500).json({ RspCode: "99", Message: "Server Error" });
  }
});
export default router;