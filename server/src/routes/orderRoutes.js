import express from 'express';
import pool from '../config/connectDatabase.js';
import crypto from 'crypto';
import querystring from 'qs';
import https from 'https';
import moment from 'moment';

const router = express.Router();

// Đặt múi giờ cho VNPay
process.env.TZ = 'Asia/Ho_Chi_Minh';

// VNPay configuration từ .env
const vnp_TmnCode = process.env.VNP_TMNCODE;
const vnp_HashSecret = process.env.VNP_HASHSECRET;
const vnp_Url = process.env.VNP_URL;
const vnp_ApiUrl = process.env.VNP_API_URL;
const vnp_ReturnUrl = process.env.VNP_RETURN_URL;

// Hàm sắp xếp object để tạo chữ ký
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

// Hàm tạo chữ ký VNPay
function createVnpaySignature(params) {
  let sortedParams = sortObject(params);
  let signData = querystring.stringify(sortedParams, { encode: false });
  console.log('Sign Data for creation:', signData); // Debug
  let hmac = crypto.createHmac('sha512', vnp_HashSecret);
  let signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
  console.log('Generated SecureHash:', signed); // Debug
  return signed;
}

// Hàm verify chữ ký VNPay
function verifyVnpaySignature(params, secureHash) {
  let vnp_Params = { ...params };
  delete vnp_Params['vnp_SecureHash'];
  delete vnp_Params['vnp_SecureHashType'];
  let sortedParams = sortObject(vnp_Params);
  let signData = querystring.stringify(sortedParams, { encode: false });
  console.log('Sign Data for verify:', signData); // Debug
  let hmac = crypto.createHmac('sha512', vnp_HashSecret);
  let signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
  return signed === secureHash;
}

// Route danh sách đơn hàng
router.get('/', function(req, res, next) {
  res.render('orderlist', { title: 'Danh sách đơn hàng' });
});

// Route tạo mới đơn hàng
router.get('/create_payment_url', function(req, res, next) {
  res.render('order', { title: 'Tạo mới đơn hàng', amount: 10000 });
});

// Route truy vấn kết quả thanh toán
router.get('/querydr', function(req, res, next) {
  let desc = 'Truy vấn kết quả thanh toán';
  res.render('querydr', { title: 'Truy vấn kết quả thanh toán', desc });
});

// Route hoàn tiền giao dịch
router.get('/refund', function(req, res, next) {
  let desc = 'Hoàn tiền giao dịch thanh toán';
  res.render('refund', { title: 'Hoàn tiền giao dịch thanh toán', desc });
});

// API đặt hàng
router.post('/place-order', async (req, res) => {
  const { customer, items, shippingAddress, paymentMethod, notes } = req.body;

  if (!customer || !items || !items.length || !shippingAddress || !paymentMethod) {
    return res.status(400).json({ error: 'Thiếu thông tin yêu cầu' });
  }

  const connection = await pool.getConnection();
  await connection.beginTransaction();

  try {
    // Lưu thông tin khách hàng nếu cần
    let customerId = customer.makh;
    if (customer.saveInfo) {
      const [existingCustomer] = await connection.query(
        'SELECT * FROM khachhang WHERE makh = ?',
        [customerId]
      );

      if (existingCustomer.length > 0) {
        await connection.query(
          'UPDATE khachhang SET tenkh = ?, sdt = ?, email = ? WHERE makh = ?',
          [customer.name, customer.phone, customer.email, customerId]
        );
      } else {
        const [result] = await connection.query(
          'INSERT INTO khachhang (makh, tenkh, sdt, email) VALUES (?, ?, ?, ?)',
          [customerId, customer.name, customer.phone, customer.email]
        );
        customerId = result.insertId;
      }
    }

    // Lưu địa chỉ giao hàng
    const [addressResult] = await connection.query(
      'INSERT INTO diachi (TenNguoiNhan, SDT, DiaChiChiTiet, TinhThanh, QuanHuyen, PhuongXa) VALUES (?, ?, ?, ?, ?, ?)',
      [
        customer.name,
        customer.phone,
        shippingAddress.detail,
        shippingAddress.province,
        shippingAddress.district,
        shippingAddress.ward
      ]
    );

    // Tính tổng tiền
    let totalAmount = 0;
    for (const item of items) {
      const [product] = await connection.query('SELECT DonGia, SoLuong FROM sanpham WHERE MaSP = ?', [item.productId]);
      if (product.length === 0 || product[0].SoLuong < item.quantity) {
        throw new Error(`Sản phẩm ${item.productId} không tồn tại hoặc hết hàng`);
      }
      totalAmount += item.price * item.quantity;
    }

    // Lưu đơn hàng
    const [orderResult] = await connection.query(
      'INSERT INTO hoadon (makh, MaDiaChi, TongTien, PhuongThucThanhToan, GhiChu, tinhtrang, TrangThaiThanhToan) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        customerId,
        addressResult.insertId,
        totalAmount,
        paymentMethod,
        notes,
        'Chờ xử lý',
        'Chưa thanh toán'
      ]
    );

    const orderId = orderResult.insertId;

    // Lưu chi tiết đơn hàng
    for (const item of items) {
      await connection.query(
        'INSERT INTO chitiethoadon (MaHD, MaSP, SoLuong, DonGia) VALUES (?, ?, ?, ?)',
        [orderId, item.productId, item.quantity, item.price]
      );
      await connection.query(
        'UPDATE sanpham SET SoLuong = SoLuong - ? WHERE MaSP = ?',
        [item.quantity, item.productId]
      );
    }

    // Nếu thanh toán bằng VNPay, tạo URL thanh toán
    if (paymentMethod === 'VNPay') {
      let date = new Date();
      let vnp_CreateDate = moment(date).format('YYYYMMDDHHmmss');
      let vnp_TxnRef = orderId;
      let vnp_IpAddr = req.headers['x-forwarded-for'] || req.connection.remoteAddress || '127.0.0.1';
      let vnp_OrderInfo = `Thanh toan don hang ${orderId}`;
      let vnp_Amount = totalAmount * 100; // VNPay yêu cầu số tiền nhân 100
      let vnp_Locale = 'vn';
      let vnp_CurrCode = 'VND';

      let vnp_Params = {
        vnp_Version: '2.1.0',
        vnp_Command: 'pay',
        vnp_TmnCode: vnp_TmnCode,
        vnp_Amount: vnp_Amount,
        vnp_CurrCode: vnp_CurrCode,
        vnp_TxnRef: vnp_TxnRef,
        vnp_OrderInfo: vnp_OrderInfo,
        vnp_OrderType: '250000',
        vnp_Locale: vnp_Locale,
        vnp_ReturnUrl: vnp_ReturnUrl,
        vnp_IpAddr: vnp_IpAddr,
        vnp_CreateDate: vnp_CreateDate
      };

      vnp_Params = sortObject(vnp_Params);
      vnp_Params['vnp_SecureHash'] = createVnpaySignature(vnp_Params);

      let vnpayUrl = vnp_Url + '?' + querystring.stringify(vnp_Params, { encode: false });

      await connection.commit();
      return res.json({ redirectUrl: vnpayUrl, orderId });
    }

    // Nếu không phải VNPay, hoàn tất giao dịch
    await connection.commit();
    res.json({ orderId, message: 'Đặt hàng thành công' });
  } catch (error) {
    await connection.rollback();
    console.error('Lỗi khi đặt hàng:', error);
    res.status(500).json({ error: 'Lỗi hệ thống khi đặt hàng' });
  } finally {
    connection.release();
  }
});

// Route xử lý return URL từ VNPay
router.get('/vnpay_return', async (req, res) => {
  const params = req.query;
  const secureHash = params.vnp_SecureHash;
  const orderId = params.vnp_TxnRef;
  const responseCode = params.vnp_ResponseCode;
  const transactionStatus = params.vnp_TransactionStatus;

  try {
    if (!verifyVnpaySignature(params, secureHash)) {
      return res.redirect(`http://localhost:5501/GiaoDien/orders.html?status=error&message=Chữ ký không hợp lệ`);
    }

    const [order] = await pool.query('SELECT tinhtrang, TrangThaiThanhToan FROM hoadon WHERE MaHD = ?', [orderId]);

    if (order.length === 0) {
      return res.redirect(`http://localhost:5501/GiaoDien/orders.html?status=error&message=Không tìm thấy đơn hàng`);
    }

    if (order[0].TrangThaiThanhToan === 'Đã thanh toán') {
      return res.redirect(`http://localhost:5501/GiaoDien/orders.html?status=success&orderId=${orderId}`);
    }

    let newStatus = 'Chờ xử lý';
    let paymentStatus = 'Chưa thanh toán';

    if (responseCode === '00' && transactionStatus === '00') {
      newStatus = 'Đã xác nhận';
      paymentStatus = 'Đã thanh toán';
    } else {
      newStatus = 'Đã hủy';
      paymentStatus = 'Thanh toán thất bại';
    }

    await pool.query(
      `UPDATE hoadon SET tinhtrang = ?, TrangThaiThanhToan = ? WHERE MaHD = ?`,
      [newStatus, paymentStatus, orderId]
    );

    const redirectUrl = responseCode === '00'
      ? `http://localhost:5501/GiaoDien/orders.html?status=success&orderId=${orderId}`
      : `http://localhost:5501/GiaoDien/orders.html?status=error&message=Thanh toán thất bại (code: ${responseCode})`;

    res.redirect(redirectUrl);
  } catch (error) {
    console.error('Lỗi xử lý VNPay return:', error);
    res.redirect(`http://localhost:5501/GiaoDien/orders.html?status=error&message=Lỗi hệ thống`);
  }
});

// Route xử lý IPN từ VNPay
router.post('/vnpay_ipn', async (req, res) => {
  const params = req.body;
  const secureHash = params.vnp_SecureHash;
  const orderId = params.vnp_TxnRef;

  try {
    if (!verifyVnpaySignature(params, secureHash)) {
      return res.status(200).json({ RspCode: '97', Message: 'Fail Checksum' });
    }

    const responseCode = params.vnp_ResponseCode;
    const transactionStatus = params.vnp_TransactionStatus;

    const [order] = await pool.query('SELECT tinhtrang, TrangThaiThanhToan FROM hoadon WHERE MaHD = ?', [orderId]);

    if (order.length === 0) {
      return res.status(200).json({ RspCode: '01', Message: 'Order not found' });
    }

    if (order[0].TrangThaiThanhToan === 'Đã thanh toán') {
      return res.status(200).json({ RspCode: '02', Message: 'Order already confirmed' });
    }

    let newStatus = 'Chờ xử lý';
    let paymentStatus = 'Chưa thanh toán';

    if (responseCode === '00' && transactionStatus === '00') {
      newStatus = 'Đã xác nhận';
      paymentStatus = 'Đã thanh toán';
    } else {
      newStatus = 'Đã hủy';
      paymentStatus = 'Thanh toán thất bại';
    }

    await pool.query(
      `UPDATE hoadon SET tinhtrang = ?, TrangThaiThanhToan = ? WHERE MaHD = ?`,
      [newStatus, paymentStatus, orderId]
    );

    res.status(200).json({ RspCode: '00', Message: 'Confirm Success' });
  } catch (error) {
    console.error('Lỗi xử lý VNPay IPN:', error);
    res.status(200).json({ RspCode: '99', Message: 'Unknown error' });
  }
});

// Route truy vấn kết quả thanh toán
router.post('/querydr', async (req, res) => {
  let date = new Date();
  let vnp_RequestId = moment(date).format('HHmmss');
  let vnp_Version = '2.1.0';
  let vnp_Command = 'querydr';
  let vnp_TxnRef = req.body.orderId;
  let vnp_TransactionDate = req.body.transDate;
  let vnp_OrderInfo = 'Truy van GD ma:' + vnp_TxnRef;
  let vnp_IpAddr = req.headers['x-forwarded-for'] || req.connection.remoteAddress || '127.0.0.1';
  let vnp_CreateDate = moment(date).format('YYYYMMDDHHmmss');
  let currCode = 'VND';

  let data = vnp_RequestId + '|' + vnp_Version + '|' + vnp_Command + '|' + vnp_TmnCode + '|' + vnp_TxnRef + '|' + vnp_TransactionDate + '|' + vnp_CreateDate + '|' + vnp_IpAddr + '|' + vnp_OrderInfo;
  let hmac = crypto.createHmac('sha512', vnp_HashSecret);
  let vnp_SecureHash = hmac.update(Buffer.from(data, 'utf-8')).digest('hex');

  let dataObj = {
    vnp_RequestId,
    vnp_Version,
    vnp_Command,
    vnp_TmnCode,
    vnp_TxnRef,
    vnp_OrderInfo,
    vnp_TransactionDate,
    vnp_CreateDate,
    vnp_IpAddr,
    vnp_SecureHash
  };

  try {
    const response = await fetch(vnp_ApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dataObj),
    });

    const body = await response.json();
    console.log('Query Response:', body);
    res.json(body);
  } catch (error) {
    console.error('Error querying VNPay:', error);
    res.status(500).json({ error: 'Lỗi hệ thống' });
  }
});

// Route hoàn tiền giao dịch
router.post('/refund', async (req, res) => {
  let date = new Date();
  let vnp_RequestId = moment(date).format('HHmmss');
  let vnp_Version = '2.1.0';
  let vnp_Command = 'refund';
  let vnp_TxnRef = req.body.orderId;
  let vnp_TransactionDate = req.body.transDate;
  let vnp_Amount = req.body.amount * 100;
  let vnp_TransactionType = req.body.transType;
  let vnp_CreateBy = req.body.user;
  let vnp_OrderInfo = 'Hoan tien GD ma:' + vnp_TxnRef;
  let vnp_IpAddr = req.headers['x-forwarded-for'] || req.connection.remoteAddress || '127.0.0.1';
  let vnp_CreateDate = moment(date).format('YYYYMMDDHHmmss');
  let vnp_TransactionNo = '0';
  let currCode = 'VND';

  let data = vnp_RequestId + '|' + vnp_Version + '|' + vnp_Command + '|' + vnp_TmnCode + '|' + vnp_TransactionType + '|' + vnp_TxnRef + '|' + vnp_Amount + '|' + vnp_TransactionNo + '|' + vnp_TransactionDate + '|' + vnp_CreateBy + '|' + vnp_CreateDate + '|' + vnp_IpAddr + '|' + vnp_OrderInfo;
  let hmac = crypto.createHmac('sha512', vnp_HashSecret);
  let vnp_SecureHash = hmac.update(Buffer.from(data, 'utf-8')).digest('hex');

  let dataObj = {
    vnp_RequestId,
    vnp_Version,
    vnp_Command,
    vnp_TmnCode,
    vnp_TransactionType,
    vnp_TxnRef,
    vnp_Amount,
    vnp_TransactionNo,
    vnp_CreateBy,
    vnp_OrderInfo,
    vnp_TransactionDate,
    vnp_CreateDate,
    vnp_IpAddr,
    vnp_SecureHash
  };

  try {
    const response = await fetch(vnp_ApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dataObj),
    });

    const body = await response.json();
    console.log('Refund Response:', body);
    res.json(body);
  } catch (error) {
    console.error('Error refunding VNPay:', error);
    res.status(500).json({ error: 'Lỗi hệ thống' });
  }
});

export default router;