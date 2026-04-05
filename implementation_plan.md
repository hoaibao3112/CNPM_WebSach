# Refactoring Backend CNPM WebSach - Chuẩn Doanh Nghiệp

## Mục tiêu

Tái cấu trúc backend từ **raw SQL + pattern lộn xộn** → **Sequelize ORM + kiến trúc MVC nhất quán**, áp dụng chuẩn doanh nghiệp. Đảm bảo không phá vỡ frontend hiện tại (API contract giữ nguyên).

## Hiện trạng

| Vấn đề | Mô tả |
|---|---|
| 3 pattern khác nhau | MVC (Order,Auth) vs Fat Route (company,address) vs Fat Controller (coupon,preference) |
| Raw SQL khắp nơi | `pool.query('SELECT * FROM ...')` trải đều ~40 files |
| Sequelize có nhưng không dùng | `models/index.js` dùng CommonJS, 3 model cũ (User,Post,Category) không liên quan DB thật |
| Naming lộn xộn | Routes: LoginRoutes.js, account.js, Users.js, chatRoute.js, khuyenmai.js |
| File khổng lồ | preferenceController.js: 1497 LOC, OrderService.js: 1020 LOC |
| Bảo mật | SQL injection, thiếu auth, JWT secret hardcoded |

---

## User Review Required

> [!IMPORTANT]
> **Quyết định quan trọng #1: Phạm vi refactor**
> 
> Việc refactor toàn bộ backend (40+ files, ~15,000 LOC) trong một lần là rủi ro cao. Tôi đề xuất **phương án Incremental (chia phase)**, refactor từng module một, test xong mới sang module tiếp.

> [!WARNING]
> **Quyết định quan trọng #2: Sequelize ORM**
> 
> Hiện tại `models/index.js` dùng **CommonJS** (`require`), nhưng toàn bộ codebase đã dùng **ES Modules** (`import`). Cần chuyển Sequelize sang ESM. Điều này có thể tạo breaking change nếu có file nào đó đang `require` model cũ.

> [!IMPORTANT]
> **Quyết định quan trọng #3: Giữ API contract**
> 
> Cần xác nhận: Frontend (GiaoDien/) đang gọi đúng những API path nào? Refactor chỉ thay đổi **nội bộ backend**, KHÔNG đổi URL/request/response format. Nếu bạn muốn đổi luôn API thì cần plan riêng.

---

## Proposed Changes

### Phase 0: Fix Critical Bugs (Ngay lập tức)
*Effort: 30 phút | Risk: Thấp*

#### [MODIFY] [connectDatabase.js](file:///c:/Users/PC/Desktop/CNPM/server/src/config/connectDatabase.js)
- Fix `const pool` → `let pool` để SSL fallback hoạt động

#### [MODIFY] [orderRoutes.js](file:///c:/Users/PC/Desktop/CNPM/server/src/routes/orderRoutes.js)
- Thêm `authenticateToken` cho route `GET /hoadon`

#### [MODIFY] [preferenceController.js](file:///c:/Users/PC/Desktop/CNPM/server/src/controllers/preferenceController.js)
- Fix SQL injection tại `getRecommendations` (dùng parameterized query)

#### [MODIFY] [generateToken.js](file:///c:/Users/PC/Desktop/CNPM/server/src/utils/generateToken.js)
- Crash nếu thiếu JWT_SECRET thay vì dùng fallback

---

### Phase 1: Foundation - Sequelize ORM Setup
*Effort: 2-3 giờ | Risk: Trung bình*

#### [MODIFY] [models/index.js](file:///c:/Users/PC/Desktop/CNPM/server/src/models/index.js)
- Chuyển từ CommonJS sang ESM
- Kết nối Sequelize sử dụng cùng biến `.env` với `connectDatabase.js`
- Xóa 3 model cũ không liên quan (User, Post, Category)

#### [NEW] `src/models/SanPham.model.js`
- Sequelize model cho bảng `sanpham`
- Mapping đúng column names gốc (MaSP, TenSP, DonGia...)
- `tableName: 'sanpham'`, `timestamps: false`

#### [NEW] `src/models/KhachHang.model.js`
- Model cho bảng `khachhang`

#### [NEW] `src/models/HoaDon.model.js`
- Model cho bảng `hoadon` + association với `chitiethoadon`

#### [NEW] `src/models/TaiKhoan.model.js`
- Model cho bảng `taikhoan`

#### [NEW] `src/models/NhaCungCap.model.js`
- Model cho bảng `nhacungcap`

#### [NEW] Tương tự cho các bảng: `theloai`, `tacgia`, `giohang_chitiet`, `phieunhap`, `chitietphieunhap`, `nhomquyen`, `chitietquyen`, `chucnang`, `binhluan`, `danhgia`, `khuyen_mai`, `ct_khuyen_mai`, `phieugiamgia`, `phieugiamgia_phathanh`, `chat_rooms`, `chat_messages`, `cham_cong`, `nhanvien`, `diachi`, `hoadon_trahang`, `otp_requests`, `faqs`, `form_sothich`, `cauhoi_sothich`, `luachon_cauhoi`, `phanhoi_sothich`, `traloi_sothich`, `diem_sothich_khachhang`

> Mỗi model sẽ có:
> - Column mappings chính xác với DB schema hiện tại
> - Associations (hasMany, belongsTo, belongsToMany)
> - `tableName` explicit, `timestamps: false` (vì DB không đồng nhất timestamp columns)

---

### Phase 2: Chuẩn hóa Naming Convention
*Effort: 1 giờ | Risk: Thấp*

Rename tất cả files theo convention thống nhất:

```
src/
├── routes/
│   ├── auth.routes.js          (was: LoginRoutes.js, forgotPassword.js)
│   ├── product.routes.js       (was: product.js)  
│   ├── order.routes.js         (was: orderRoutes.js)
│   ├── customer.routes.js      (was: Users.js)
│   ├── supplier.routes.js      (was: company.js)
│   ├── cart.routes.js           (was: cart.js)
│   ├── chat.routes.js           (was: chatRoute.js + chatRoutes.js)
│   ├── promotion.routes.js      (was: khuyenmai.js)
│   ├── coupon.routes.js         (new, tách từ preference/coupon)
│   ├── preference.routes.js     (was: preferenceRoutes.js)
│   ├── refund.routes.js         (was: refundRoute.js)
│   ├── attendance.routes.js     (was: account.js attendance section)
│   ├── salary.routes.js         (was: salary.js)
│   ├── receipt.routes.js        (was: phieunhap.js)
│   ├── review.routes.js         (was: orderreview.js)
│   ├── report.routes.js         (was: baocao.js)
│   ├── role.routes.js           (was: roles.js)
│   ├── faq.routes.js            (new)
│   └── index.js                 (route aggregator - updated)
│
├── controllers/
│   ├── Auth.controller.js
│   ├── Product.controller.js
│   ├── Order.controller.js
│   ├── Customer.controller.js
│   ├── Supplier.controller.js
│   ├── Cart.controller.js
│   ├── Chat.controller.js
│   ├── Promotion.controller.js
│   ├── Coupon.controller.js
│   ├── Preference.controller.js
│   ├── Refund.controller.js
│   ├── Attendance.controller.js
│   ├── Salary.controller.js
│   ├── Receipt.controller.js
│   ├── Review.controller.js
│   ├── Report.controller.js
│   ├── Role.controller.js
│   ├── Faq.controller.js
│   └── Base.controller.js
│
├── services/
│   ├── Auth.service.js
│   ├── Product.service.js
│   ├── Order.service.js
│   ├── Customer.service.js
│   ├── Supplier.service.js
│   ├── Cart.service.js
│   ├── Chat.service.js
│   ├── Promotion.service.js
│   ├── Coupon.service.js
│   ├── Preference.service.js
│   ├── Refund.service.js
│   ├── Attendance.service.js
│   ├── Salary.service.js
│   ├── Receipt.service.js
│   ├── Review.service.js
│   ├── Report.service.js
│   ├── Role.service.js
│   ├── Payment.service.js     (tách VNPay logic từ OrderService)
│   ├── Shipping.service.js    (tách shipping logic từ OrderService)
│   ├── Address.service.js     (tách address logic từ OrderService)
│   ├── Location.service.js    (tách province/district/ward từ OrderService)
│   └── Faq.service.js
│
├── models/
│   ├── index.js               (Sequelize loader - ESM)
│   ├── SanPham.model.js
│   ├── KhachHang.model.js
│   ├── HoaDon.model.js
│   ├── ... (tất cả models)
│
├── middlewares/
│   ├── auth.middleware.js      (was: auth.js)
│   ├── rbac.middleware.js      (was: rbacMiddleware.js)
│   ├── validate.middleware.js  (NEW - joi/express-validator)
│   └── errorHandler.middleware.js (NEW - global error handler)
│
├── config/
│   ├── database.config.js      (was: connectDatabase.js - giữ pool + thêm sequelize)
│   ├── config.json             (Sequelize CLI config)
│   └── app.config.js           (NEW - centralized env validation)
│
├── constants/
│   ├── Permissions.js
│   └── HttpStatus.js           (NEW)
│
├── utils/
│   ├── generateToken.js
│   ├── emailService.js
│   ├── logger.js               (NEW - winston/pino)
│   └── AppError.js             (NEW - custom error class)
│
└── websocket/
    └── chat.handler.js         (tách từ server.js)
```

---

### Phase 3: Refactor Từng Module (Incremental)
*Effort: 1-2 giờ mỗi module | Risk: Trung bình*

**Thứ tự ưu tiên** (từ đơn giản → phức tạp):

1. **Supplier** (company.js → Supplier MVC) - đơn giản nhất, CRUD cơ bản
2. **Product** - đã có service, chỉ cần chuyển sang ORM
3. **Cart** - đã có service, chuyển sang ORM
4. **Auth** - đã có service, thêm validation
5. **Chat** - fat controller → tách service
6. **Coupon** - fat controller → tách service
7. **Order** - phức tạp nhất, tách thành 4 sub-services
8. **Preference** - 1500 LOC, tách service + simplify
9. **Refund** - đã có service, chuyển ORM
10. **Attendance/Salary** - fat route → MVC

Mỗi module sẽ được refactor theo pattern:

```
Route (thin) → Controller (thin) → Service (business logic) → Model (Sequelize ORM)
```

**Nguyên tắc cho mỗi module:**
- Controller chỉ parse req, gọi service, trả response qua `Base.controller.js`
- Service chứa business logic, dùng Sequelize Model thay vì raw SQL
- Giữ nguyên API path & response format
- Thêm input validation bằng middleware
- Thay `console.log` bằng logger

---

### Phase 4: Infrastructure Improvements
*Effort: 1-2 giờ | Risk: Thấp*

#### [NEW] `src/utils/logger.js`
- Winston logger với levels: error, warn, info, debug
- File transport cho production, console cho development

#### [NEW] `src/utils/AppError.js`
- Custom error class với statusCode
- Replace `throw new Error(...)` → `throw new AppError(...)`

#### [NEW] `src/middlewares/errorHandler.middleware.js`
- Global error handler middleware
- Tự động format error response
- Log errors

#### [NEW] `src/middlewares/validate.middleware.js`
- Express-validator middleware factory
- Centralized validation rules

#### [NEW] `src/config/app.config.js`
- Validate tất cả env vars khi startup
- Crash nếu thiếu required vars (JWT_SECRET, DB_*)

#### [MODIFY] `server.js`
- Extract WebSocket handler → `src/websocket/chat.handler.js`
- Dùng global error handler
- Xóa console.log debug

#### [DELETE] Dọn file thừa
- `check_db_v2.js`, `check_db_v3.js`, `check_sanpham.js`
- `inspect_db.js`, `GOOGLE_AUTH_METHOD.js`
- `sanpham_columns.json`, `sanpham_schema.json`, `schema_output.txt`
- `models/user.js`, `models/post.js`, `models/category.js`

---

## Open Questions

> [!IMPORTANT]
> **1. Frontend impact?**
> Bạn có muốn giữ nguyên 100% API paths hiện tại không? Hay có thể đổi một số path cho gọn hơn (ví dụ gộp `/api/recommendations` và `/api/recommendation` thành 1)?

> [!IMPORTANT]  
> **2. Phạm vi thực hiện?**
> Tôi đề xuất bắt đầu từ **Phase 0 (fix bugs) + Phase 1 (Sequelize setup) + 2-3 module đầu tiên**.
> Bạn muốn tôi làm tất cả cùng lúc hay từng phase?

> [!WARNING]
> **3. Database migration?**
> Hiện DB schema có tên cột tiếng Việt (MaSP, TenSP, DonGia...). Sequelize sẽ ánh xạ nguyên tên cột gốc. Bạn có muốn giữ nguyên hay muốn tạo migration đổi sang tiếng Anh (sẽ cần sửa frontend)?

> [!IMPORTANT]
> **4. Testing?**
> Package.json có `jest` nhưng không thấy test nào. Bạn có muốn thêm unit tests cho các service khi refactor không?

---

## Verification Plan

### Automated Tests
- Chạy `npm start` sau mỗi phase để đảm bảo server khởi động
- Test từng API endpoint bằng browser tool hoặc curl
- So sánh response format trước/sau refactor

### Manual Verification  
- Bạn test frontend Admin + Customer sau mỗi 2-3 module refactor
- Kiểm tra flow: Login → Xem sản phẩm → Thêm giỏ hàng → Đặt hàng → Thanh toán VNPay
