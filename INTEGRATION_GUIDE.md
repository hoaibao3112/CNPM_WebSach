# 🎯 Setup Guide: Facebook Login + MoMo Payment

## 📋 Nội dung
1. [Facebook Login Setup](#facebook-login-setup)
2. [MoMo Payment Setup](#momo-payment-setup)
3. [Environment Variables](#environment-variables)
4. [Testing](#testing)

---

## 🔐 Facebook Login Setup

### 1️⃣ Tạo Facebook App

1. Truy cập [Developers Facebook](https://developers.facebook.com)
2. Click **"My Apps"** → **"Create App"**
3. Chọn loại: **"Consumer"**
4. Điền thông tin:
   - **App Name**: Tên app của bạn (e.g., "WebSach")
   - **App Purpose**: Commerce (or Website)
5. Chờ app được tạo

### 2️⃣ Cấu hình Facebook Login

1. Vào **Settings** → **Basic**, copy:
   - **App ID** → `process.env.REACT_APP_FACEBOOK_APP_ID`
   - **App Secret** → `process.env.FACEBOOK_CLIENT_SECRET`

2. Thêm **Facebook Login**:
   - **Products** → **Add Product** → **Facebook Login**
   - Chọn **Web**

3. Cấu hình OAuth Redirect URI:
   - **Settings** → **Basic**
   - **App Domains**: `localhost:5501`, `your-domain.com`
   - **Valid OAuth Redirect URIs**:
     - `http://localhost:5501/login.html`
     - `https://your-domain.com/login.html`

### 3️⃣ Thêm Facebook Button vào HTML

```html
<!-- Thêm vào login.html -->
<div id="fb-root"></div>

<!-- Facebook SDK -->
<script async defer crossorigin="anonymous" 
  src="https://connect.facebook.net/en_US/sdk.js#xfbml=1&version=v18.0" 
  nonce="YOUR_NONCE">
</script>

<!-- Button -->
<button id="facebookLoginBtn" class="social-login-btn facebook">
  <i class="fab fa-facebook"></i> Đăng nhập Facebook
</button>

<!-- Script -->
<script src="js/facebook-login.js"></script>
```

### 4️⃣ Environment Variables

```env
# .env (server)
FACEBOOK_CLIENT_ID=YOUR_APP_ID
FACEBOOK_CLIENT_SECRET=YOUR_APP_SECRET
FACEBOOK_CALLBACK_URL=http://localhost:5000/auth/facebook/callback

# config.js (client/GiaoDien)
window.FACEBOOK_APP_ID = '904742255223792'; // Thay bằng app ID của bạn
```

---

## 💳 MoMo Payment Setup

### 1️⃣ Đăng ký MoMo Business Account

1. Truy cập [MoMo Business](https://business.momo.vn)
2. Đăng ký tài khoản kinh doanh
3. Chờ duyệt (24-48 giờ)

### 2️⃣ Lấy MoMo Credentials

Sau khi được duyệt, vào **Account Settings**:
- **Partner Code**: `MOMO`
- **Access Key**: `F8BBA842ECF85` (từ .env)
- **Secret Key**: `K951B6PE1waDMi640xX08PD3vg6EkVlz` (từ .env)

### 3️⃣ Cấu hình Webhook URL

Trong MoMo Business Dashboard:
- **Settings** → **Webhook**
- **Return URL**: `https://your-domain.com/api/payments/momo-return`
- **IPN URL**: `https://your-domain.com/api/payments/momo-ipn`

### 4️⃣ Thêm MoMo Button vào HTML

```html
<!-- Thêm vào cart.html hoặc order.html -->
<button id="momoCheckoutBtn" class="payment-btn momo">
  <i class="fas fa-mobile-alt"></i> Thanh toán MoMo
</button>

<!-- Payment Message -->
<div id="paymentMessage"></div>
<div id="paymentStatus"></div>

<!-- Script -->
<script src="js/momo-payment.js"></script>
```

### 5️⃣ Environment Variables

```env
# .env (server) - Đã có sẵn, chỉ cần verify
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=hoaibao4062004@gmail.com
EMAIL_PASS=dyqejagggwygsncq

MOMO_PARTNER_CODE=MOMO
MOMO_ACCESS_KEY=F8BBA842ECF85
MOMO_SECRET_KEY=K951B6PE1waDMi640xX08PD3vg6EkVlz
MOMO_API_URL=https://test-payment.momo.vn/v2/gateway/api/create
MOMO_REDIRECT_URL=http://localhost:5000/api/payments/momo-return
MOMO_IPN_URL=http://localhost:5000/api/payments/momo-ipn

# client config (GiaoDien/js/config.js)
window.MOMO_ENABLED = true;
```

---

## 🔧 Code Integration

### Backend Routes Đã Thêm

```
POST   /api/client/auth/facebook              # Facebook Login
POST   /api/payments/create                   # Tạo MoMo Payment
GET    /api/payments/momo-return              # MoMo Return Callback
POST   /api/payments/momo-ipn                 # MoMo IPN Callback
POST   /api/payments/refund                   # Hoàn tiền (optional)
```

### Frontend Files Đã Tạo

```
GiaoDien/js/facebook-login.js     # Facebook integration
GiaoDien/js/momo-payment.js       # MoMo payment integration
```

---

## 🧪 Testing

### Facebook Login Test

1. Mở `cnpm-web-sach.vercel.app/login.html`
2. Click nút "Đăng nhập Facebook"
3. Authenticate với tài khoản Facebook
4. Kiểm tra console xem token có được gửi tới backend không
5. Nếu thành công → Redirect về index.html + lưu user data

### MoMo Payment Test

1. Hoàn thành đơn hàng
2. Chọn thanh toán MoMo
3. Click "Thanh toán MoMo" → Redirect tới MoMo
4. Test payment (MoMo cung cấp số test)
5. Sau thanh toán → Redirect về `order-confirmation.html`
6. Kiểm tra database: Order status phải thành "Đã thanh toán"

### Debug Logs

Kiểm tra server logs:
```bash
# Terminal server
npm start

# Tìm logs:
✅ Facebook token verified
📱 MoMo Payment Request Created
✅ MoMo Payment Success
```

---

## ⚠️ Lưu ý Quan Trọng

### Facebook
- ✅ App phải ở chế độ **Live** để hoạt động trên production
- ✅ Email app phải confirmed
- ✅ Privacy Policy + Terms of Service phải được approved

### MoMo
- ✅ Thử nghiệm với số test MoMo cung cấp
- ✅ Webhook URL phải public (không localhost)
- ✅ Kiểm tra IPN logs để xác minh callback
- ✅ Số tiền phải > 1.000 VND

---

## 📱 Database Changes

Nếu cần, add columns vào table `khachhang`:

```sql
ALTER TABLE khachhang ADD COLUMN facebook_id VARCHAR(255);
ALTER TABLE khachhang ADD COLUMN google_id VARCHAR(255);
```

---

## 🚀 Deployment (Render)

Thêm environment variables vào Render Dashboard:

```
FACEBOOK_CLIENT_ID=904742255223792
FACEBOOK_CLIENT_SECRET=7ce1af9baad78720c3e7be2ca1fe47ac
MOMO_PARTNER_CODE=MOMO
MOMO_ACCESS_KEY=F8BBA842ECF85
MOMO_SECRET_KEY=K951B6PE1waDMi640xX08PD3vg6EkVlz
```

---

## 🆘 Troubleshooting

### Facebook Login không hoạt động
- ❌ Kiểm tra App ID có đúng không
- ❌ Verify domain đã được thêm chưa
- ❌ Check app ở chế độ Development hay Live

### MoMo Payment thất bại
- ❌ Kiểm tra Partner Code + Secret Key
- ❌ Verify webhook URL reach được từ MoMo servers
- ❌ Check IPN logs trên MoMo dashboard
- ❌ Amount phải > 1.000 VND

---

**Báo cáo lỗi hoặc câu hỏi:**
- Kiểm tra server logs: `npm start`
- Check browser console: F12 → Console
- Email tech support nếu cần
