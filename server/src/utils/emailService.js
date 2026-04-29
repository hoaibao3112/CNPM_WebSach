import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import axios from 'axios';

const EMAIL_CONNECTION_TIMEOUT_MS = Number(process.env.EMAIL_CONNECTION_TIMEOUT_MS || 5000); // 5s cho Render đỡ lag
const EMAIL_SOCKET_TIMEOUT_MS = Number(process.env.EMAIL_SOCKET_TIMEOUT_MS || 15000);
const EMAIL_MAX_RETRIES = Number(process.env.EMAIL_MAX_RETRIES || 2);
const RESEND_API_URL = 'https://api.resend.com/emails';
const SENDGRID_API_URL = 'https://api.sendgrid.com/v3/mail/send';

function hasResendConfig() {
  return Boolean(process.env.RESEND_API_KEY && (process.env.RESEND_FROM_EMAIL || process.env.EMAIL_USER));
}

function hasSendGridConfig() {
  return Boolean(process.env.SENDGRID_API_KEY && process.env.SENDGRID_FROM_EMAIL);
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function buildTransportConfig(portOverride) {
  const host = process.env.EMAIL_HOST || 'smtp.gmail.com';
  const port = Number(portOverride || process.env.EMAIL_PORT || 587);
  const secure = port === 465;

  return {
    host,
    port,
    secure,
    requireTLS: !secure,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    connectionTimeout: EMAIL_CONNECTION_TIMEOUT_MS,
    greetingTimeout: EMAIL_CONNECTION_TIMEOUT_MS,
    socketTimeout: EMAIL_SOCKET_TIMEOUT_MS,
    family: 4, // Ép dùng IPv4 để tránh lỗi ENETUNREACH trên Render
    tls: {
      rejectUnauthorized: false,
      minVersion: 'TLSv1.2'
    }
  };
}

async function sendMailWithRetry(mailOptions) {
  const primaryConfig = buildTransportConfig();
  const fallbackConfig = primaryConfig.port === 465 ? buildTransportConfig(587) : buildTransportConfig(465);
  const transportConfigs = [primaryConfig, fallbackConfig];

  let lastError = null;

  for (let cfgIndex = 0; cfgIndex < transportConfigs.length; cfgIndex += 1) {
    const config = transportConfigs[cfgIndex];

    for (let attempt = 1; attempt <= EMAIL_MAX_RETRIES; attempt += 1) {
      try {
        const transporter = nodemailer.createTransport(config);
        return await transporter.sendMail(mailOptions);
      } catch (error) {
        lastError = error;
        const canRetry = attempt < EMAIL_MAX_RETRIES;

        console.error('❌ Lỗi gửi email (forgot-password):', {
          message: error?.message,
          code: error?.code,
          response: error?.response,
          responseCode: error?.responseCode,
          host: config.host,
          port: config.port,
          attempt,
          maxRetries: EMAIL_MAX_RETRIES
        });

        if (canRetry) {
          await sleep(500 * attempt);
        }
      }
    }
  }

  throw lastError;
}

async function sendMailWithResend(mailOptions) {
  if (!hasResendConfig()) {
    throw new Error('Resend chưa được cấu hình');
  }

  const from = process.env.RESEND_FROM_EMAIL || process.env.EMAIL_USER;
  const payload = {
    from,
    to: [mailOptions.to],
    subject: mailOptions.subject,
    html: mailOptions.html
  };

  const response = await axios.post(RESEND_API_URL, payload, {
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    timeout: EMAIL_SOCKET_TIMEOUT_MS
  });

  return {
    response: `resend:${response.data?.id || 'ok'}`
  };
}

async function sendMailWithSendGrid(mailOptions) {
  if (!hasSendGridConfig()) {
    throw new Error('SendGrid chưa được cấu hình');
  }

  const brandName = process.env.BRAND_NAME || 'BAO STORE';
  const apiKey = process.env.SENDGRID_API_KEY.trim(); // Loại bỏ khoảng trắng thừa

  const payload = {
    personalizations: [{
      to: [{ email: mailOptions.to }]
    }],
    from: {
      email: process.env.SENDGRID_FROM_EMAIL.trim(),
      name: brandName
    },
    subject: mailOptions.subject,
    content: [{
      type: 'text/html',
      value: mailOptions.html
    }]
  };

  try {
    const response = await axios.post(SENDGRID_API_URL, payload, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: EMAIL_SOCKET_TIMEOUT_MS
    });

    return {
      response: `sendgrid:ok`
    };
  } catch (error) {
    // Log chi tiết lỗi từ SendGrid để dễ debug
    const errMsg = error.response?.data?.errors?.[0]?.message || error.message;
    throw new Error(`SendGrid API error: ${errMsg}`);
  }
}

export function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function sendOTPEmail(email, otp) {
  const resendConfigured = hasResendConfig();
  const sendGridConfigured = hasSendGridConfig();
  const smtpConfigured = Boolean(process.env.EMAIL_USER && process.env.EMAIL_PASS);

  if (!resendConfigured && !sendGridConfigured && !smtpConfigured) {
    throw new Error('Email service chưa được cấu hình. Cần SendGrid, Resend hoặc SMTP.');
  }

  // Tái sử dụng logic template cũ...
  const brandName = process.env.BRAND_NAME || 'BAO STORE';
  const htmlContent = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 550px; margin: 40px auto; padding: 30px; border: 1px solid #e1e4e8; border-radius: 12px; background-color: #ffffff; color: #24292e;">
      <div style="text-align: center; margin-bottom: 25px;">
        <h1 style="color: #0366d6; font-size: 24px; margin: 0;">${brandName} Support</h1>
      </div>
      <p style="font-size: 16px; line-height: 1.6;">Xin chào,</p>
      <p style="font-size: 16px; line-height: 1.6;">Chúng tôi đã nhận được yêu cầu cung cấp mã xác thực cho tài khoản của bạn. Vui lòng sử dụng mã dưới đây để tiếp tục:</p>
      
      <div style="background-color: #f6f8fa; border: 1px solid #d1d5da; padding: 20px; text-align: center; border-radius: 8px; margin: 25px 0;">
        <div style="font-size: 12px; color: #586069; margin-bottom: 8px; text-transform: uppercase; font-weight: bold;">Mã xác thực của bạn</div>
        <span style="font-size: 36px; font-weight: bold; letter-spacing: 6px; color: #24292e;">${otp}</span>
      </div>
      
      <p style="font-size: 14px; color: #586069; line-height: 1.6;">Mã này sẽ hết hạn sau <strong>5 phút</strong>. Vì lý do bảo mật, tuyệt đối không chia sẻ mã này với bất kỳ ai, kể cả nhân viên của ${brandName}.</p>
      
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e1e4e8; font-size: 12px; color: #586069; text-align: center;">
        <p>Cảm ơn bạn đã tin tưởng sử dụng dịch vụ của chúng tôi.</p>
        <p>© ${new Date().getFullYear()} ${brandName}. Trân trọng.</p>
      </div>
    </div>
  `;
  const mailOptions = {
    from: `"${brandName}" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `🔐 ${otp} là mã xác thực tài khoản ${brandName} của bạn`,
    html: htmlContent
  };

  // LOG MÃ OTP RA CONSOLE ĐỂ TEST KHI EMAIL CHẬM
  console.log('-----------------------------------------');
  console.log(`🔑 MÃ OTP CỦA BẠN LÀ: ${otp}`);
  console.log(`📧 GỬI ĐẾN: ${email}`);
  console.log('-----------------------------------------');

  let errors = [];

  // THỨ TỰ ƯU TIÊN GỬI:
  // 1. SMTP (Gmail) - Vì thực tế ảnh Spam cho thấy cái này đang chạy được
  if (smtpConfigured) {
    try {
      await sendMailWithRetry(mailOptions);
      console.log('✅ OTP gửi qua SMTP (Gmail) thành công');
      return true;
    } catch (e) {
      errors.push(`SMTP lỗi: ${e.message}`);
    }
  }

  // 2. SendGrid (Dự phòng 1)
  if (sendGridConfigured) {
    try {
      const info = await sendMailWithSendGrid(mailOptions);
      console.log('✅ OTP gửi qua SendGrid thành công');
      return true;
    } catch (e) {
      errors.push(`SendGrid lỗi: ${e?.response?.data?.message || e.message}`);
    }
  }

  // 3. Resend (Dự phòng 2)
  if (resendConfigured) {
    try {
      const info = await sendMailWithResend(mailOptions);
      console.log('✅ OTP gửi qua Resend thành công');
      return true;
    } catch (e) {
      errors.push(`Resend lỗi: ${e?.response?.data?.message || e.message}`);
    }
  }

  throw new Error(`Tất cả phương thức gửi mail đều thất bại: ${errors.join(' | ')}`);
}
// Email xác nhận đơn hàng – giao diện đẹp, thân thiện Outlook/Gmail

export async function sendOrderConfirmationEmail(email, order = {}) {
  if (!email) return false;

  // ── Helpers ───────────────────────────────────────────────────────────────────
  const fmt = (n) => (Number(n || 0)).toLocaleString('vi-VN');
  const safe = (s) => (s == null ? '' : String(s));
  const brandName = safe(process.env.BRAND_NAME || 'BOOKSTORE');
  const logoUrl =
    order.brandLogo ||
    'https://cdn1.fahasa.com/skin/frontend/ma_vanese/fahasa/images/fahasa-logo.png'; // public logo fallback (Fahasa)
  const orderId = safe(order.id || order.orderNumber || '—');
  const createdAt =
    order.createdAt ? new Date(order.createdAt) : new Date();
  const createdAtStr = createdAt.toLocaleString('vi-VN');

  const paymentMethod = safe(order.paymentMethod || 'COD');
  const paymentUrl = safe(order.paymentUrl || '');
  const orderStatus = safe(order.status || 'ĐÃ TẠO');
  const orderNote = safe(order.note || order.customerNote || '');

  const shipping = order.shippingAddress || {};
  const addrLine1 = safe(shipping.detail || '');
  const addrLine2 = [shipping.ward, shipping.district, shipping.province]
    .filter(Boolean)
    .join(', ');

  // Promo codes / vouchers (try several common property names for compatibility)
  const promoCode = safe(
    order.promoCode || order.voucherCode || order.voucher || order.discountCode || order.code || ''
  );
  const freeShipCode = safe(order.freeShipCode || order.shipVoucher || order.freeShip || '');

  // Customer display name: try multiple common shapes
  const customerDisplay = safe(
    order.customerName ||
    (order.customer && (order.customer.name || order.customer.tenkh)) ||
    (typeof order.customer === 'string' ? order.customer : '')
  );

  // Tính toán tổng
  const items = Array.isArray(order.items) ? order.items : [];
  // Prefer server-provided fields when available. Fall back to computing from items.
  const subtotalFromItems = items.reduce((s, it) => {
    const qty = Number(it.quantity || it.Soluong || 0);
    const price = Number(it.price || it.DonGia || 0);
    return s + qty * price;
  }, 0);

  const subtotal = Number(
    (typeof order.subtotal !== 'undefined' && order.subtotal !== null) ? order.subtotal : subtotalFromItems
  );

  const shippingFee = Number(
    (typeof order.shippingFee !== 'undefined' && order.shippingFee !== null) ? order.shippingFee : (order.shipping || 0)
  );

  const discount = Number(
    (typeof order.discount !== 'undefined' && order.discount !== null) ? order.discount : (order.voucherDiscount || 0)
  );

  const memberDiscount = Number(
    (typeof order.memberDiscount !== 'undefined' && order.memberDiscount !== null) ? order.memberDiscount : (order.memberDiscountAmount || 0)
  );

  const tax = Number(order.tax || 0); // nếu có

  // If backend provided final total name variants, prefer them in this order
  const grandTotal = Number(
    order.totalAmount || order.total || order.amount || (subtotal - discount - memberDiscount + shippingFee + tax)
  );

  // ── Ảnh sản phẩm (attachments cid) ────────────────────────────────────────────
  const attachments = [];
  const itemsHtml = items
    .map((i, idx) => {
      let img = i.productImage || i.HinhAnh || i.productImageUrl || '';
      let filename = '';
      if (img && !/^https?:\/\//i.test(img)) {
        filename = path.basename(String(img).replace(/\\/g, '/'));
        // tuỳ folder của bạn: chỉnh lại nếu ảnh nằm chỗ khác
        const localFile =
          i.localImagePath ||
          path.join(process.cwd(), 'backend', 'product', filename);
        if (fs.existsSync(localFile)) {
          const cid = `order-${orderId}-item-${idx}@${brandName.replace(/\s+/g, '').toLowerCase()}`;
          attachments.push({ filename, path: localFile, cid });
          img = `cid:${cid}`;
        } else {
          // fallback placeholder nếu không có file nội bộ
          img = 'https://via.placeholder.com/80x100?text=No+Image';
        }
      } else if (!img) {
        img = 'https://via.placeholder.com/80x100?text=No+Image';
      }

      const name = safe(i.productName || i.TenSP || i.productId || 'Sản phẩm');
      const qty = Number(i.quantity || i.Soluong || 0);
      const price = Number(i.price || i.DonGia || 0);
      const line = qty * price;

      return `
        <tr style="border-bottom:1px solid #ECEFF3;">
          <td style="padding:14px 0;vertical-align:middle;">
            <div style="display:flex;align-items:center;">
              <img src="${img}" width="88" height="110" style="border-radius:6px;object-fit:cover;margin-right:14px;display:block;" alt="${name}">
              <div style="font-size:15px;line-height:1.35;color:#0b1220;font-weight:700;">${name}
                ${i.variant || i.detail ? `<div style="font-size:12px;color:#64748b;margin-top:4px;font-weight:400;">${safe(i.variant || i.detail)}</div>` : ''}
              </div>
            </div>
          </td>
          <td align="center" style="font-size:14px;color:#334155;vertical-align:middle;">${qty}</td>
          <td align="right" style="font-size:14px;color:#0f172a;vertical-align:middle;">${fmt(price)}đ</td>
          <td align="right" style="font-weight:800;font-size:14px;color:#0f172a;vertical-align:middle;">${fmt(line)}đ</td>
        </tr>`;
    })
    .join('');

  // Badge màu theo trạng thái
  const statusColor =
    orderStatus.toUpperCase().includes('HỦY') ? '#EF4444' :
      orderStatus.toUpperCase().includes('THANH TOÁN') ? '#22C55E' :
        '#3B82F6';

  // Preheader (ẩn)
  const preheader =
    `Xác nhận đơn #${orderId} • ${brandName} • Tổng ${fmt(grandTotal)}đ`;

  // Bulletproof button (VML for Outlook)
  const payButton = paymentUrl
    ? `
    <!--[if mso]>
    <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" href="${paymentUrl}" arcsize="20%" stroke="f" fillcolor="#ff3d6b" style="height:44px;v-text-anchor:middle;width:220px;">
      <w:anchorlock/>
      <center style="color:#ffffff;font-family:Arial,sans-serif;font-size:14px;font-weight:bold;">THANH TOÁN NGAY</center>
    </v:roundrect>
    <![endif]-->
    <![if !mso]><a href="${paymentUrl}" style="background:#ff3d6b;border-radius:10px;color:#ffffff;display:inline-block;font-weight:700;line-height:44px;text-align:center;text-decoration:none;width:220px;cursor:pointer;">THANH TOÁN NGAY</a><![endif]>`
    : '';

  // ── HTML nội dung ────────────────────────────────────────────────────────────
  const html = `<!doctype html>
<html lang="vi">
<head>
  <meta http-equiv="x-ua-compatible" content="ie=edge">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light only">
  <meta name="supported-color-schemes" content="light">
  <title>Xác nhận đơn hàng #${orderId}</title>
  <style>
    /* Mobile tweaks */
    @media (max-width:600px){
      .container{ width:100% !important; }
      .px{ padding-left:16px !important; padding-right:16px !important; }
      .stack{ display:block !important; width:100% !important; }
      .cta-wrap{ text-align:left !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background:#f6f8fb;">
  <span style="display:none !important;visibility:hidden;opacity:0;color:transparent;height:0;width:0;overflow:hidden;mso-hide:all;">${preheader}</span>

  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#f6f8fb;">
    <tr><td height="24"></td></tr>
    <tr>
      <td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="760" class="container" style="max-width:760px;width:760px;background:#ffffff;border-radius:12px;box-shadow:0 12px 40px rgba(16,24,40,0.08);overflow:hidden;">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(90deg,#ff8a00 0%,#ff3d6b 100%);padding:20px 24px;">
              <table role="presentation" width="100%">
                <tr>
                  <td>
                    <img src="${logoUrl}" width="160" height="40" style="display:block;object-fit:contain" alt="${brandName}">
                  </td>
                  <td align="right">
                    <span style="display:inline-block;background:rgba(255,255,255,0.16);color:#fff;padding:7px 12px;border-radius:999px;font:600 12px/1 Arial;">MÃ ĐƠN #${orderId}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Hero -->
          <tr>
            <td class="px" style="padding:24px 28px;border-bottom:1px solid #f0f2f5;">
              <div style="font:700 22px/1.35 Arial;color:#081028;">Đơn hàng của bạn đã được tạo</div>
              <div style="margin-top:8px;font:400 14px/1.6 Arial;color:#495057;">
                Xin chào <strong>${customerDisplay}</strong> — cảm ơn bạn đã mua sắm tại ${brandName}.
                Dưới đây là tóm tắt đơn hàng của bạn.
              </div>
            </td>
          </tr>

          <!-- Details -->
          <tr>
            <td class="px" style="padding:16px 28px;">
              <table role="presentation" width="100%">
                <tr>
                  <td class="stack" style="width:33%;vertical-align:top;padding:8px 0;">
                    <div style="color:#6b7280;font:700 12px Arial;margin-bottom:6px;">TRẠNG THÁI</div>
                    <div style="font:800 16px Arial;color:${statusColor};">${orderStatus}</div>
                    <div style="margin-top:8px;color:#64748b;font:400 12px Arial;">Tạo lúc: ${createdAtStr}</div>
                  </td>
                  <td class="stack" style="width:33%;vertical-align:top;padding:8px 0;">
                    <div style="color:#6b7280;font:700 12px Arial;margin-bottom:6px;">THANH TOÁN</div>
                    <div style="font:800 16px Arial;color:#111827;">${paymentMethod}</div>
                    ${paymentUrl ? `<div class="cta-wrap" style="margin-top:10px;text-align:left;">${payButton}</div>` : ''}
                  </td>
                  <td class="stack" style="width:33%;vertical-align:top;padding:8px 0;">
                    <div style="color:#6b7280;font:700 12px Arial;margin-bottom:6px;">ĐỊA CHỈ GIAO</div>
                    <div style="font:700 14px Arial;color:#111827;">${addrLine1}</div>
                    <div style="font:400 13px Arial;color:#6b7280;margin-top:4px;">${addrLine2}</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Items -->
          <tr>
            <td class="px" style="padding:8px 28px 4px 28px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                <thead>
                  <tr>
                    <th align="left" style="padding:8px 0;color:#6b7280;font:700 12px Arial;">Sản phẩm</th>
                    <th align="center" style="padding:8px 0;color:#6b7280;font:700 12px Arial;">SL</th>
                    <th align="right" style="padding:8px 0;color:#6b7280;font:700 12px Arial;">Đơn giá</th>
                    <th align="right" style="padding:8px 0;color:#6b7280;font:700 12px Arial;">Thành tiền</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml || `
                    <tr><td colspan="4" style="padding:16px 0;border-top:1px solid #ECEFF3;color:#64748b;font:400 14px Arial;">(Không có sản phẩm)</td></tr>
                  `}
                </tbody>
              </table>
            </td>
          </tr>

          <!-- Totals -->
          <tr>
            <td class="px" style="padding:12px 28px 4px 28px;">
              <table role="presentation" width="100%">
                <tr>
                  <td></td>
                  <td style="width:320px">
                    <table role="presentation" width="100%">
                      <tr>
                        <td align="left" style="padding:6px 0;color:#6b7280;font:400 14px Arial;">Tạm tính</td>
                        <td align="right" style="padding:6px 0;color:#111827;font:700 14px Arial;">${fmt(subtotal)}đ</td>
                      </tr>
                      ${discount > 0 ? `
                      <tr>
                        <td align="left" style="padding:6px 0;color:#6b7280;font:400 14px Arial;">Giảm giá${promoCode ? ` <span style="font-weight:600;color:#0b1220;">(Mã: ${promoCode})</span>` : ''}</td>
                        <td align="right" style="padding:6px 0;color:#111827;font:700 14px Arial;">- ${fmt(discount)}đ</td>
                      </tr>` : ''}
                      ${memberDiscount > 0 ? `
                      <tr>
                        <td align="left" style="padding:6px 0;color:#6b7280;font:400 14px Arial;">Giảm theo thẻ thành viên${order.memberTier ? ` <span style="font-weight:600;color:#0b1220;">(${order.memberTier})</span>` : ''}</td>
                        <td align="right" style="padding:6px 0;color:#111827;font:700 14px Arial;">- ${fmt(memberDiscount)}đ</td>
                      </tr>` : ''}
                      ${tax > 0 ? `
                      <tr>
                        <td align="left" style="padding:6px 0;color:#6b7280;font:400 14px Arial;">Thuế</td>
                        <td align="right" style="padding:6px 0;color:#111827;font:700 14px Arial;">${fmt(tax)}đ</td>
                      </tr>` : ''}
                      <tr>
                        <td align="left" style="padding:6px 0;color:#6b7280;font:400 14px Arial;">Phí vận chuyển${freeShipCode ? ` <span style="font-weight:600;color:#0b1220;">(Miễn phí - Mã: ${freeShipCode})</span>` : ''}</td>
                        <td align="right" style="padding:6px 0;color:#111827;font:700 14px Arial;">${fmt(shippingFee)}đ</td>
                      </tr>
                      <tr>
                        <td align="left" style="padding:10px 0;border-top:1px solid #ECEFF3;color:#334155;font:700 15px Arial;">TỔNG PHẢI TRẢ</td>
                        <td align="right" style="padding:10px 0;border-top:1px solid #ECEFF3;color:#111827;font:800 20px Arial;">${fmt(grandTotal)}đ</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          ${orderNote ? `
          <tr>
            <td class="px" style="padding:10px 28px 0 28px;">
              <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px 14px;">
                <div style="color:#0f172a;font:700 13px Arial;margin-bottom:6px;">Ghi chú của bạn</div>
                <div style="color:#334155;font:400 13px/1.5 Arial;">${orderNote}</div>
              </div>
            </td>
          </tr>` : ''}

          <!-- Footer -->
          <tr><td height="12"></td></tr>
          <tr>
            <td style="padding:8px 28px 20px 28px;background:#fbfbfd;">
              <div style="text-align:center;color:#6b7280;font:400 12px/1.6 Arial;">
                Cần hỗ trợ? Hãy trả lời email này hoặc liên hệ:
                <a href="mailto:${process.env.EMAIL_USER}" style="color:#0ea5e9;text-decoration:none;">${process.env.EMAIL_USER}</a>
              </div>
              <div style="text-align:center;color:#9aa0a6;font:400 11px Arial;margin-top:6px;">
                © ${new Date().getFullYear()} ${brandName}. All rights reserved.
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr><td height="24"></td></tr>
  </table>
</body>
</html>`;

  // ── Plain-text fallback ───────────────────────────────────────────────────────
  const text = [
    `${brandName} - Xác nhận đơn hàng #${orderId}`,
    `Trạng thái: ${orderStatus}`,
    `Thời gian tạo: ${createdAtStr}`,
    `Thanh toán: ${paymentMethod}`,
    paymentUrl ? `Thanh toán ngay: ${paymentUrl}` : '',
    `Địa chỉ: ${addrLine1}${addrLine2 ? ', ' + addrLine2 : ''}`,
    '',
    'Sản phẩm:',
    ...items.map((i) => {
      const name = i.productName || i.TenSP || i.productId || 'Sản phẩm';
      const qty = Number(i.quantity || i.Soluong || 0);
      const price = Number(i.price || i.DonGia || 0);
      return `- ${name} | SL: ${qty} | Giá: ${fmt(price)}đ | Thành tiền: ${fmt(qty * price)}đ`;
    }),
    '',
    `Tạm tính: ${fmt(subtotal)}đ`,
    discount > 0 ? `Giảm giá${promoCode ? ` (Mã: ${promoCode})` : ''}: -${fmt(discount)}đ` : '',
    memberDiscount > 0 ? `Giảm theo thẻ thành viên${order.memberTier ? ` (${order.memberTier})` : ''}: -${fmt(memberDiscount)}đ` : '',
    tax > 0 ? `Thuế: ${fmt(tax)}đ` : '',
    `Phí vận chuyển${freeShipCode ? ` (Miễn phí - Mã: ${freeShipCode})` : ''}: ${fmt(shippingFee)}đ`,
    `TỔNG PHẢI TRẢ: ${fmt(grandTotal)}đ`,
    orderNote ? `\nGhi chú: ${orderNote}` : '',
    '',
    `Hỗ trợ: ${process.env.EMAIL_USER}`,
  ].filter(Boolean).join('\n');

  try {
    const brandName = process.env.BRAND_NAME || 'BAO STORE';
    const mailOptions = {
      from: `"${brandName}" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `Xác nhận đơn hàng #${orderId} – tổng ${fmt(grandTotal)}đ`,
      html,
      text,
      attachments: attachments.length ? attachments : undefined
    };

    // Ưu tiên các provider API (Resend/SendGrid) để tránh bị chặn trên Render
    if (hasResendConfig()) {
      try {
        await sendMailWithResend(mailOptions);
        console.log(`✅ Xác nhận đơn hàng gửi qua Resend thành công tới ${email}`);
        return true;
      } catch (e) {
        console.warn('⚠️ Gửi xác nhận qua Resend lỗi, thử SendGrid/SMTP...');
      }
    }

    if (hasSendGridConfig()) {
      try {
        await sendMailWithSendGrid(mailOptions);
        console.log(`✅ Xác nhận đơn hàng gửi qua SendGrid thành công tới ${email}`);
        return true;
      } catch (e) {
        console.warn('⚠️ Gửi xác nhận qua SendGrid lỗi, thử SMTP...');
      }
    }

    // Cuối cùng mới là SMTP
    const info = await sendMailWithRetry(mailOptions);
    console.log(`✅ Xác nhận đơn hàng gửi qua SMTP thành công tới ${email}`, info.response);
    return true;
  } catch (err) {
    console.error('❌ Tất cả phương thức gửi xác nhận đơn hàng đều thất bại:', err.message);
    return false;
  }
}
