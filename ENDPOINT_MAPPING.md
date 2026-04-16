# 📍 ENDPOINT MAPPING - FRONTEND vs BACKEND

**Mục đích:** Tài liệu chi tiết mapping giữa endpoint được gọi ở frontend vs endpoint thực tế trong backend

---

## ✅ ENDPOINT CHÍNH XÁC (BACKEND)

### 🛍️ PRODUCT ENDPOINTS

| Frontend Endpoint | ✅ Backend Endpoint | Chi Tiết |
|---|---|---|
| Lấy sản phẩm mới | `/api/product/new` | GET - Sản phẩm mới nhất |
| Lấy sản phẩm khuyến mãi | `/api/product/promotion` | GET - Sản phẩm có khuyến mãi |
| Lấy sản phẩm theo category | `/api/product/category/:id` | GET - Sản phẩm theo thể loại (MaTL) |
| Lấy tất cả sản phẩm | `/api/product` | GET - Tất cả sản phẩm |
| Lấy danh sách category | `/api/product/categories` | GET - Danh sách thể loại |
| Lấy sản phẩm sắp xếp | `/api/product/sorted/:type` | GET - `type`: new/year/promotion |
| Lấy chi tiết sản phẩm | `/api/product/:id` | GET - Chi tiết 1 sản phẩm (MaSP) |

---

### 🎉 PROMOTION ENDPOINTS

| Frontend Endpoint | ✅ Backend Endpoint | Chi Tiết |
|---|---|---|
| Lấy tất cả khuyến mãi | `/api/khuyenmai` | GET - Danh sách khuyến mãi |
| Lấy chi tiết khuyến mãi | `/api/khuyenmai/:makm` | GET - Chi tiết 1 khuyến mãi (MaKM) |
| Lấy sản phẩm có khuyến mãi | `/api/khuyenmai/active-products` | GET - Sản phẩm với khuyến mãi active |
| Lấy khuyến mãi của sản phẩm | `/api/khuyenmai/product/:masp` | GET - Khuyến mãi cho sản phẩm |

---

## ❌ ENDPOINT SAI (KHÔNG TỒN TẠI)

### Những endpoint hay bị gọi nhầm:

| Endpoint Sai (❌) | Lý Do Sai | ✅ Endpoint Đúng |
|---|---|---|
| `/api/products` | Không có 's', endpoint là `/api/product` | `/api/product` |
| `/api/product/category-current-year/:id` | Endpoint này không tồn tại | `/api/product/category/:id` |
| `/api/product/category-current-year/all` | Endpoint này không tồn tại | `/api/product/new` |
| `/api/product/top-selling` | Endpoint này không tồn tại | `/api/product/promotion` |
| `/api/product/theloai/:id` | Endpoint này không tồn tại | `/api/product/category/:id` |
| `/api/khuyenmai/public` | Endpoint này không tồn tại | `/api/khuyenmai` |
| `/api/voucher/` | Endpoint không rõ ràng | `/api/khuyenmai` |

---

## 📋 FILE ĐƯỢC SỬA

### Files có lỗi 404:

1. **[GiaoDien/js/giamgia4.js](GiaoDien/js/giamgia4.js)**
   - ❌ Cũ: `/api/product/category-current-year/${categoryId}`
   - ✅ Mới: `/api/product/category/${categoryId}` hoặc `/api/product`

2. **[GiaoDien/js/giamgia2.js](GiaoDien/js/giamgia2.js)**
   - ❌ Cũ: `/api/product/top-selling?limit=6`
   - ✅ Mới: `/api/product/promotion?limit=6`

3. **[GiaoDien/giamgia5.html](GiaoDien/giamgia5.html)**
   - ❌ Cũ: `/api/product/category-current-year/all`
   - ✅ Mới: `/api/product/new`

4. **[GiaoDien/js/khuyenmai9.js](GiaoDien/js/khuyenmai9.js)**
   - ❌ Cũ: `/api/product/theloai/1` (hardcode ID)
   - ✅ Mới: `/api/product/category/${categoryId}` (parameterized)

5. **[GiaoDien/js/giamgia1.js](GiaoDien/js/giamgia1.js)**
   - ❌ Cũ: `'${window.API_CONFIG.BASE_URL}/product-images'` (template string literal)
   - ✅ Mới: Function `getImageBase()` return `${baseUrl}/product-images`

6. **[GiaoDien/js/khuyenmai.js](GiaoDien/js/khuyenmai.js)**
   - ❌ Cũ: N+1 queries - fetch tất cả trong vòng lặp
   - ✅ Mới: `Promise.all()` - fetch parallel

---

## 🧪 TEST HƯỚNG DẪN

### 1. Kiểm tra API endpoint trong DevTools:

```javascript
// Mở Console trên browser, gõ:
fetch('https://cnpm-websach-2.onrender.com/api/product/new')
    .then(r => r.json())
    .then(d => console.log('✅ OK:', d))
    .catch(e => console.error('❌ ERROR:', e.message));

fetch('https://cnpm-websach-2.onrender.com/api/product/category/1')
    .then(r => r.json())
    .then(d => console.log('✅ OK:', d))
    .catch(e => console.error('❌ ERROR:', e.message));
```

### 2. Kiểm tra trong Network tab:

1. Mở DevTools → Network tab
2. Tải lại trang (F5)
3. Tìm những request có status **404** (đó là endpoint sai)
4. So sánh với danh sách endpoint đúng ở trên

---

## 📌 LƯU Ý

- **Base URL:** Tất cả endpoint phải được gọi với `window.API_CONFIG.BASE_URL` (cấu hình từ HTML)
- **Response format:** API có thể trả `data` hoặc `{ data: [...] }` - cần handle cả hai
- **Hardcode:** Không hardcode `localhost:5501` hoặc ID cố định trong code
- **Template string:** Sử dụng function hoặc biến thường, không `'${variable}'` (literal)

---

*Cập nhật lần cuối: 16/04/2026*
