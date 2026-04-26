<div align="center">

# 📚 WebSách — Hệ Thống Bán Sách Trực Tuyến

<img src="./GiaoDien/img/logo1.png" alt="WebSách Logo" width="180"/>

### *Nền tảng mua sắm sách trực tuyến hiện đại — từ cửa hàng đến tay bạn đọc* ✨

[![Node.js](https://img.shields.io/badge/Node.js-22.x-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express.js-4.x-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![React](https://img.shields.io/badge/React-18.x-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)
[![TiDB](https://img.shields.io/badge/TiDB_Cloud-MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white)](https://tidbcloud.com/)
[![Vercel](https://img.shields.io/badge/Vercel-Frontend-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com/)
[![Render](https://img.shields.io/badge/Render-Backend-46E3B7?style=for-the-badge&logo=render&logoColor=white)](https://render.com/)

[🌐 Demo Khách Hàng](#-production-deployment) •
[🛠️ Admin Panel](#-production-deployment) •
[⚡ Cài Đặt](#-cài-đặt-local) •
[📡 API Docs](#-api-documentation) •
[🏗️ Kiến Trúc](#️-kiến-trúc-hệ-thống)

---

</div>

## 🚀 Production Deployment

> Dự án đã được deploy hoàn chỉnh lên môi trường production với đầy đủ 3 tầng:

| Service | URL | Platform | Status |
|---------|-----|----------|--------|
| 🌐 **Customer Frontend** | [cnpm-web-sach.vercel.app](https://cnpm-web-sach.vercel.app) | Vercel | ![Live](https://img.shields.io/badge/status-live-brightgreen) |
| 💼 **Admin Dashboard** | [cnpm-admin-dashboard.vercel.app](https://cnpm-admin-dashboard.vercel.app) | Vercel | ![Live](https://img.shields.io/badge/status-live-brightgreen) |
| ⚙️ **Backend API** | [cnpm-websach-2.onrender.com](https://cnpm-websach-2.onrender.com) | Render | ![Live](https://img.shields.io/badge/status-live-brightgreen) |
| 🤖 **AI Chatbot** | [cnpm-websach-hf0f.onrender.com](https://cnpm-websach-hf0f.onrender.com) | Render | ![Live](https://img.shields.io/badge/status-live-brightgreen) |

---

## 🎯 Tổng Quan

**WebSách** là hệ thống bán sách trực tuyến toàn diện, bao gồm hai giao diện tách biệt dành cho **khách hàng** và **quản trị viên**, được vận hành trên nền tảng cloud hiện đại.

Khách hàng có thể dễ dàng tìm kiếm, đặt mua sách và theo dõi đơn hàng, trong khi đội ngũ quản trị có công cụ mạnh mẽ để vận hành toàn bộ nhà sách — từ kho hàng, nhân sự, đến tài chính và báo cáo.

### 🎪 Điểm Nổi Bật

```
🛒  Mua sắm trực tuyến mượt mà với giỏ hàng & thanh toán online
💳  Tích hợp VNPay · MoMo · ZaloPay — thanh toán nhanh, bảo mật
🤖  AI Chatbot thông minh hỗ trợ tư vấn sách 24/7 (Gemini AI)
💬  Chat realtime giữa khách hàng và nhân viên hỗ trợ (WebSocket)
🔐  Xác thực đa nền tảng: Google OAuth · Facebook OAuth · Email/Password
📊  Dashboard thống kê doanh thu, tồn kho, nhân sự theo thời gian thực
👥  Phân quyền RBAC linh hoạt cho từng vai trò nhân viên
🔄  Quản lý trả hàng & hoàn tiền tự động
```

---

## ✨ Tính Năng Chi Tiết

### 🌐 Giao Diện Khách Hàng (Vanilla JS + HTML/CSS)

| Tính năng | Mô tả |
|-----------|-------|
| 🏠 Trang chủ | Sản phẩm nổi bật, slider khuyến mãi, sách mới nhất |
| 🔍 Tìm kiếm & Lọc | Tìm theo tên, tác giả, danh mục, giá, đánh giá |
| 📖 Chi tiết sản phẩm | Thông tin đầy đủ, ảnh, đánh giá, sách liên quan |
| 🛒 Giỏ hàng | Thêm/xóa/cập nhật số lượng, tính tổng tự động |
| 💳 Thanh toán | VNPay · MoMo · ZaloPay · COD |
| 📦 Theo dõi đơn hàng | Lịch sử đơn, trạng thái, hủy & trả hàng |
| 👤 Tài khoản | Thông tin cá nhân, địa chỉ, bảo mật |
| 🔐 Đăng nhập | Email/Password · Google · Facebook OAuth |
| 🤖 Chatbot | Tư vấn sách thông minh với Gemini AI |

### 💼 Admin Dashboard (React + TailwindCSS)

| Module | Tính năng |
|--------|-----------|
| 📊 **Dashboard** | Biểu đồ doanh thu, top sản phẩm, thống kê tổng quan |
| 📦 **Sản phẩm** | CRUD sản phẩm, quản lý tồn kho, cảnh báo hết hàng |
| 🧑‍🤝‍🧑 **Khách hàng** | Danh sách, lịch sử mua, điểm thưởng |
| 📋 **Đơn hàng** | Xử lý đơn, cập nhật trạng thái, hoàn tiền |
| 👷 **Nhân sự** | Quản lý nhân viên, chức vụ, phòng ban |
| ⏰ **Chấm công** | Tracking giờ làm, ca làm việc, tự động xử lý |
| 💰 **Tính lương** | Tự động tính lương theo công thức |
| 🏷️ **Khuyến mãi** | Tạo & quản lý coupon, chương trình giảm giá |
| 🏢 **Nhà cung cấp** | Quản lý nhà cung cấp, phiếu nhập kho |
| 📝 **Hoàn trả** | Duyệt đơn trả hàng, hoàn tiền |
| 💬 **Chat** | Hỗ trợ khách hàng realtime qua WebSocket |
| 🔐 **Phân quyền** | RBAC — cấu hình quyền theo từng vai trò |

---

## 🏗️ Kiến Trúc Hệ Thống

```
┌─────────────────────────────────────────────────────────────┐
│                        PRODUCTION                           │
│                                                             │
│   ┌──────────────────┐    ┌──────────────────┐             │
│   │  Customer Web    │    │  Admin Dashboard  │             │
│   │  (Vercel)        │    │  (Vercel)         │             │
│   │  HTML/CSS/JS     │    │  React + Tailwind │             │
│   └────────┬─────────┘    └────────┬──────────┘             │
│            │                       │                         │
│            └──────────┬────────────┘                         │
│                       ↓ HTTPS + JWT                          │
│           ┌───────────────────────┐                          │
│           │   Backend API         │                          │
│           │   (Render)            │                          │
│           │   Node.js + Express   │                          │
│           │   + WebSocket         │                          │
│           └───────────┬───────────┘                          │
│                       │                                       │
│        ┌──────────────┼──────────────┐                       │
│        ↓              ↓              ↓                       │
│   ┌─────────┐   ┌──────────┐  ┌──────────┐                  │
│   │ TiDB    │   │ Chatbot  │  │ Payment  │                  │
│   │ Cloud   │   │ (Render) │  │ Gateways │                  │
│   │ MySQL   │   │ Python   │  │ VNPay    │                  │
│   │         │   │ Gemini   │  │ MoMo     │                  │
│   └─────────┘   └──────────┘  │ ZaloPay  │                  │
│                                └──────────┘                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Công Nghệ Sử Dụng

### Frontend — Customer
```
HTML5 · CSS3 · Vanilla JavaScript
Axios (HTTP) · WebSocket Client
Responsive Design · Live Server
```

### Frontend — Admin Dashboard
```
React 18         — UI Framework
TailwindCSS      — Styling
React Router v6  — Navigation
Axios            — HTTP Client
Chart.js / Recharts — Data visualization
```

### Backend
```
Node.js 22       — Runtime
Express.js 4.x   — Web Framework
Sequelize 6      — ORM
MySQL2           — Database driver
JSON Web Token   — Authentication (HS256, 4h expiry)
bcryptjs         — Password hashing
Multer           — File upload
Nodemailer       — Email (Gmail SMTP)
Helmet           — HTTP Security Headers
express-rate-limit — Rate limiting
WebSocket (ws)   — Realtime chat
http-proxy-middleware — VNPay proxy
```

### AI Chatbot
```
Python · FastAPI
Google Gemini AI (gemini-2.0-flash)
FAISS / ChromaDB — Vector search
LangChain        — RAG pipeline
```

### Infrastructure
```
Vercel    — Frontend hosting (CDN, Edge)
Render    — Backend + Chatbot hosting
TiDB Cloud — MySQL-compatible cloud database (SSL)
GitHub    — Source control & CI/CD trigger
```

### Payments & OAuth
```
VNPay · MoMo · ZaloPay  — Payment gateways
Google OAuth 2.0         — Social login
Facebook OAuth           — Social login
Gmail SMTP · SendGrid    — Email delivery
```

---

## 🔒 Bảo Mật

Hệ thống được trang bị đầy đủ các lớp bảo mật cho môi trường production:

- ✅ **JWT** với secret 128-char random, hết hạn sau 4h (refresh 14 ngày)
- ✅ **Helmet.js** — 11 HTTP security headers (XSS, Clickjacking, MIME sniff...)
- ✅ **Rate Limiting** — 200 req/15min tổng, 15 lần/15min cho login/register
- ✅ **RBAC** — Phân quyền theo vai trò, kiểm tra số nguyên hợp lệ
- ✅ **SSL/TLS** — Kết nối database với `rejectUnauthorized: true`
- ✅ **CORS** — Chỉ cho phép đúng domain production
- ✅ **bcryptjs** — Mã hóa mật khẩu một chiều
- ✅ **Input limit** — JSON body giới hạn 10MB

---

## 📋 Yêu Cầu Cài Đặt Local

| Công cụ | Phiên bản |
|---------|----------|
| Node.js | >= 18.0.0 |
| npm | >= 9.0.0 |
| MySQL | >= 8.0 (hoặc dùng TiDB Cloud) |
| Python | >= 3.10 (chatbot) |
| Git | Latest |

---

## ⚡ Cài Đặt Local

### 1️⃣ Clone Repository

```bash
git clone https://github.com/hoaibao3112/CNPM_WebSach.git
cd CNPM_WebSach
```

### 2️⃣ Cài Đặt Backend

```bash
cd server
npm install

# Tạo file .env từ mẫu
cp .env.example .env
# Điền các thông tin vào .env (xem .env.example để biết các biến cần thiết)

# Khởi động development
npm run dev
# → http://localhost:5000
```

### 3️⃣ Cài Đặt Admin Dashboard

```bash
cd ../admin
npm install
npm start
# → http://localhost:3000
```

### 4️⃣ Mở Giao Diện Khách Hàng

```bash
cd ../GiaoDien
# Dùng VS Code Live Server hoặc bất kỳ HTTP server nào
# → http://localhost:5500
```

### 5️⃣ Cài Đặt AI Chatbot (tuỳ chọn)

```bash
cd ../chatbot
pip install -r requirements.txt
cp .env.example .env
# Điền GEMINI_API_KEY vào .env

python ingest.py   # Tạo vector index từ tài liệu
python main.py     # → http://localhost:8000
```

---

## 📁 Cấu Trúc Dự Án

```
CNPM_WebSach/
│
├── 📂 GiaoDien/                   # Customer Frontend (Vanilla JS)
│   ├── components/                # Header, Footer, shared components
│   ├── js/                        # Logic từng trang
│   ├── styles/                    # CSS files
│   ├── img/                       # Assets & images
│   └── *.html                     # Các trang HTML
│
├── 📂 admin/                      # Admin Dashboard (React)
│   ├── src/
│   │   ├── components/            # Reusable UI components
│   │   ├── pages/                 # Page components theo module
│   │   ├── services/              # API call services
│   │   └── App.js
│   ├── tailwind.config.js
│   └── vercel.json                # Vercel SPA routing config
│
├── 📂 server/                     # Backend (Node.js + Express)
│   ├── src/
│   │   ├── config/                # DB, app config & env validation
│   │   ├── controllers/           # Business logic handlers
│   │   ├── middlewares/           # auth.js, rbac, errorHandler
│   │   ├── models/                # Sequelize models
│   │   ├── routes/                # API route definitions
│   │   ├── services/              # Service layer
│   │   └── utils/                 # Helpers, seeders
│   ├── backend/product/           # Uploaded product images
│   ├── uploads/                   # Customer uploaded files
│   ├── server.js                  # Entry point + WebSocket
│   ├── .env.example               # Environment template
│   └── package.json
│
├── 📂 chatbot/                    # AI Chatbot (Python + Gemini)
│   ├── main.py                    # FastAPI server
│   ├── ingest.py                  # Document ingestion & indexing
│   ├── config.py                  # Configuration
│   ├── knowledge_docs/            # Tài liệu sách cho RAG
│   └── requirements.txt
│
└── README.md
```

---

## 📡 API Documentation

### 🔐 Authentication

```http
POST /api/auth/login                # Đăng nhập (email/password)
POST /api/auth/register             # Đăng ký tài khoản
POST /api/auth/logout               # Đăng xuất
POST /api/auth/forgot-password      # Quên mật khẩu
POST /api/auth/reset-password       # Đặt lại mật khẩu
GET  /auth/google                   # Google OAuth
GET  /auth/facebook                 # Facebook OAuth
```

### 📦 Products

```http
GET    /api/products                # Danh sách sản phẩm (có filter/search)
GET    /api/products/:id            # Chi tiết sản phẩm
POST   /api/products                # Tạo sản phẩm [Admin]
PUT    /api/products/:id            # Cập nhật [Admin]
DELETE /api/products/:id            # Xóa [Admin]
```

### 🛒 Orders

```http
GET    /api/orders                  # Danh sách đơn hàng
POST   /api/orders                  # Tạo đơn hàng mới
GET    /api/orders/:id              # Chi tiết đơn hàng
PUT    /api/orders/:id/status       # Cập nhật trạng thái [Admin]
POST   /api/orders/vnpay_return     # VNPay callback
POST   /api/payments/momo-ipn       # MoMo IPN
POST   /api/payments/zalopay/ipn    # ZaloPay IPN
```

### 💬 Chat (WebSocket)

```
ws://your-server/chat?token=<JWT>&room_id=<id>

Events:
  → send_message    { action, message: { room_id, message } }
  ← new_message     { action, message: {...} }
  ← chat_history    { action, messages: [...] }
  ← error           { action, message }
```

> 🔍 Health check: `GET /api/ping`

---

## 👥 Đội Ngũ Phát Triển

<div align="center">

| Tên | Vai Trò | GitHub |
|-----|---------|--------|
| 👨‍💻 **Hoài Bảo** | Team Lead · Backend · DevOps | [@hoaibao3112](https://github.com/hoaibao3112) |

</div>

---

## 📊 Trạng Thái Dự Án

### ✅ Đã Hoàn Thành & Deploy Production

- [x] Customer Frontend — Vercel
- [x] Admin Dashboard (React) — Vercel  
- [x] Backend REST API — Render
- [x] AI Chatbot (Gemini + RAG) — Render
- [x] TiDB Cloud Database — AWS AP Southeast
- [x] Thanh toán VNPay · MoMo · ZaloPay
- [x] Google OAuth · Facebook OAuth
- [x] Realtime Chat (WebSocket)
- [x] Email (Gmail SMTP · SendGrid · Resend)
- [x] RBAC phân quyền theo vai trò
- [x] Chấm công & Tính lương tự động
- [x] Quản lý trả hàng & hoàn tiền
- [x] Bảo mật production (Helmet, Rate Limit, SSL)

### 💡 Kế Hoạch Tương Lai

- [ ] Mobile App (React Native)
- [ ] Xuất báo cáo Excel / PDF
- [ ] Multi-language (EN/VI)
- [ ] Progressive Web App (PWA)
- [ ] Tích hợp API vận chuyển (GHN, GHTK)
- [ ] Notification push realtime

---

## 📊 GitHub Stats

<div align="center">

![Repo Size](https://img.shields.io/github/repo-size/hoaibao3112/CNPM_WebSach?style=flat-square)
![Last Commit](https://img.shields.io/github/last-commit/hoaibao3112/CNPM_WebSach?style=flat-square)
![Stars](https://img.shields.io/github/stars/hoaibao3112/CNPM_WebSach?style=flat-square)
![Issues](https://img.shields.io/github/issues/hoaibao3112/CNPM_WebSach?style=flat-square)
![Contributors](https://img.shields.io/github/contributors/hoaibao3112/CNPM_WebSach?style=flat-square)

</div>

---

## 📄 License

Phân phối dưới giấy phép **MIT License**. Xem file [LICENSE](LICENSE) để biết thêm.

---

<div align="center">

**Made with ❤️ by WebSách Team — 2026**

*Cảm ơn bạn đã ghé thăm dự án!*

[⬆ Về đầu trang](#-websách--hệ-thống-bán-sách-trực-tuyến)

[![GitHub](https://img.shields.io/badge/GitHub-hoaibao3112-100000?style=for-the-badge&logo=github&logoColor=white)](https://github.com/hoaibao3112/CNPM_WebSach)

</div>
