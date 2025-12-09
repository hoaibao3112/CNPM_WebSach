# Hướng dẫn Deploy CNPM_WebSach (100% Miễn phí)

## 📋 Tổng quan

Dự án **CNPM_WebSach** (Website bán sách) được deploy hoàn toàn miễn phí sử dụng:

| Thành phần | Nền tảng | Gói miễn phí |
|------------|----------|--------------|
| **Database** | TiDB Cloud Serverless | 5GB storage, 50M requests/tháng |
| **Backend** | Render | 750 giờ/tháng |
| **Frontend** | Vercel / Netlify | 100GB bandwidth/tháng |

---

## 🗄️ 1. Database - TiDB Cloud

### Đã hoàn thành:
- ✅ Tạo tài khoản TiDB Cloud (https://tidbcloud.com)
- ✅ Tạo Cluster: **Cluster0** (Singapore/AWS, Serverless STARTER)
- ✅ Tạo database: `cnpm_websach`
- ✅ Import schema và data từ file `TiDB_Simple.sql`
- ✅ Cấu hình Network Access: Allow all public connections (0.0.0.0/0)

### Thông tin kết nối:
```
HOST: gateway01.ap-southeast-1.prod.aws.tidbcloud.com
PORT: 4000
USERNAME: 3tEaXiNgYBRC9wS.root
PASSWORD: <mật khẩu bạn đã tạo/reset trên TiDB Cloud>
DATABASE: cnpm_websach
```

### Lưu ý quan trọng:
- TiDB Cloud **bắt buộc kết nối TLS/SSL**
- Cần download CA certificate (`isrgrootx1.pem`) từ TiDB Cloud → Connect → Download CA cert
- Nếu quên mật khẩu: TiDB Cloud → Cluster0 → Connect → Reset Password

---

## 🖥️ 2. Backend - Render

### Cấu hình trên Render:
- **Repository**: https://github.com/hoaibao3112/CNPM_WebSach
- **Branch**: main
- **Root Directory**: `server`
- **Build Command**: `npm install`
- **Start Command**: `node server.js`

### Environment Variables (bắt buộc):

```env
# Database TiDB Cloud
DB_HOST=gateway01.ap-southeast-1.prod.aws.tidbcloud.com
DB_PORT=4000
DB_USER=3tEaXiNgYBRC9wS.root
DB_PASSWORD=<mật khẩu TiDB>
DB_NAME=cnpm_websach

# SSL/TLS cho TiDB (chọn 1 trong 2 cách)
# Cách 1: Paste raw PEM content
DB_SSL_CA=<nội dung file isrgrootx1.pem>

# Cách 2: Base64-encoded PEM (khuyến nghị - tránh lỗi newline)
DB_SSL_CA_BASE64=<base64 của file PEM>

# Bắt buộc bật SSL
DB_REQUIRE_SSL=true
DB_REJECT_UNAUTHORIZED=true

# Server
PORT=5000
NODE_ENV=production

# JWT
JWT_SECRET=8f7a2b9c4e6d8f0a1b3c5e7g9h2j4k6m8n0p
JWT_EXPIRES_IN=4h
REFRESH_TOKEN_SECRET=1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q
REFRESH_TOKEN_EXPIRES_IN=14d

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=<email>
EMAIL_PASS=<app password>

# VNPay (cập nhật URL sau khi có domain Render)
VNP_TMNCODE=MPEBN4AM
VNP_HASHSECRET=JNW4HXMTKJ0X3IE8YBVXGRVRACHISEH5
VNP_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNP_API_URL=https://sandbox.vnpayment.vn/merchant_webapi/api/transaction
VNP_RETURN_URL=https://<your-render-url>/api/orders/vnpay_return
VNP_IPN_URL=https://<your-render-url>/api/orders/vnpay_ipn

# Google OAuth
GOOGLE_CLIENT_ID=<client id>
GOOGLE_CLIENT_SECRET=<client secret>

# Gemini AI
GENNIAMA_API_KEY=<api key>

# Client URLs (cập nhật sau khi deploy frontend)
CLIENT_ADMIN_URL=https://<admin-frontend-url>
CLIENT_CUSTOMER_URL=https://<customer-frontend-url>
```

### Cách tạo DB_SSL_CA_BASE64 (PowerShell):
```powershell
$b = [System.Convert]::ToBase64String([System.IO.File]::ReadAllBytes('C:\path\to\isrgrootx1.pem'))
Write-Output $b
```
Copy output và paste vào biến `DB_SSL_CA_BASE64` trên Render.

---

## 🎨 3. Frontend - Vercel (chưa deploy)

### Bước tiếp theo:
1. Vào https://vercel.com và đăng nhập bằng GitHub
2. Import repository: `hoaibao3112/CNPM_WebSach`
3. Cấu hình:
   - **Root Directory**: `admin` (cho admin) hoặc `GiaoDien` (cho customer)
   - **Framework Preset**: Create React App (cho admin)
4. Environment Variables:
   ```
   REACT_APP_API_URL=https://<your-render-backend-url>
   ```
5. Deploy

---

## 🔧 Các thay đổi code đã thực hiện

### 1. `server/package.json`
- Sửa `supertest` version từ `^6.4.3` → `^7.0.0` (version cũ không tồn tại)

### 2. `server/src/models/index.js`
- Thêm hỗ trợ đọc cấu hình DB từ environment variables
- Hỗ trợ TLS/SSL cho TiDB Cloud:
  - `DB_SSL_CA`: raw PEM content
  - `DB_SSL_CA_BASE64`: base64-encoded PEM (khuyến nghị)
  - `DB_REQUIRE_SSL`: bật SSL
  - `DB_REJECT_UNAUTHORIZED`: verify certificate

### 3. `TiDB_Simple.sql` (file tạo mới)
- Schema database đơn giản hóa cho TiDB Cloud
- Đã remove `LOCK TABLES`, `UNLOCK TABLES`
- Sử dụng `utf8mb4` thay vì `utf8mb4_0900_ai_ci`

---

## 🐛 Các lỗi đã gặp và cách khắc phục

| Lỗi | Nguyên nhân | Giải pháp |
|-----|-------------|-----------|
| `supertest@^6.4.3 not found` | Version không tồn tại | Đổi sang `^7.0.0` |
| `Connections using insecure transport are prohibited` | TiDB Cloud yêu cầu TLS | Thêm `DB_SSL_CA` hoặc `DB_SSL_CA_BASE64` + `DB_REQUIRE_SSL=true` |
| `Unknown database 'cnpm_websach'` | Database chưa tạo | Chạy `CREATE DATABASE cnpm_websach` trước |
| SQL import lỗi encoding | TiDB không hỗ trợ một số syntax MySQL | Sử dụng `TiDB_Simple.sql` đã clean |

---

## 📝 Checklist Deploy

### Database (TiDB Cloud):
- [x] Tạo tài khoản TiDB Cloud
- [x] Tạo Cluster0 (Serverless)
- [x] Tạo database `cnpm_websach`
- [x] Import `TiDB_Simple.sql`
- [x] Cấu hình Network Access (0.0.0.0/0)
- [x] Download CA certificate (`isrgrootx1.pem`)
- [ ] Reset/lưu password

### Backend (Render):
- [x] Connect GitHub repo
- [x] Cấu hình Root Directory = `server`
- [ ] Thêm tất cả environment variables
- [ ] Thêm `DB_SSL_CA` hoặc `DB_SSL_CA_BASE64`
- [ ] Deploy thành công (không lỗi TLS)
- [ ] Cập nhật `VNP_RETURN_URL`, `VNP_IPN_URL`

### Frontend (Vercel):
- [ ] Import repo vào Vercel
- [ ] Cấu hình `REACT_APP_API_URL`
- [ ] Deploy admin frontend
- [ ] Deploy customer frontend (GiaoDien)
- [ ] Cập nhật `CLIENT_ADMIN_URL`, `CLIENT_CUSTOMER_URL` trên Render

---

## 🔗 Links quan trọng

- **GitHub Repo**: https://github.com/hoaibao3112/CNPM_WebSach
- **TiDB Cloud**: https://tidbcloud.com
- **Render Dashboard**: https://dashboard.render.com
- **Vercel**: https://vercel.com
- **TiDB TLS Docs**: https://docs.pingcap.com/tidbcloud/secure-connections-to-serverless-tier-clusters

---

## ⚠️ Lưu ý bảo mật

1. **KHÔNG commit file `.env` lên GitHub** (đã có trong `.gitignore`)
2. **KHÔNG commit file PEM certificate** lên repo public
3. Sử dụng **App Password** cho Gmail thay vì mật khẩu thường
4. Secrets chỉ lưu trong Environment Variables của Render/Vercel

---

*Cập nhật lần cuối: 9/12/2025*
