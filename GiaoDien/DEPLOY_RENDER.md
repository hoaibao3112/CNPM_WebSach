# Deploy Customer Frontend (GiaoDien) to Render

## Tổng Quan

Đã chuẩn bị Customer frontend để deploy lên Render với cấu hình tự động detect production/development environment.

## Files Đã Tạo/Sửa

### 1. `js/config.js` ✅
File cấu hình API tự động detect environment:
- **Development** (localhost): sử dụng `http://localhost:5000`
- **Production** (Render): sử dụng `https://cnpm-websach.onrender.com`

### 2. `js/api-patcher.js` ✅  
Tự động patch tất cả `fetch()` calls để replace `localhost:5000` với production URL.

**Lợi ích**: Không cần sửa 70+ files JavaScript!

### 3. Added scripts to HTML files
- ✅ `index.html`
- ✅ `login.html`
- ⚠️ Other pages được thêm files cần deploy lên Render xem có lỗi không

---

## Cách Deploy lên Render

### Bước 1: Push code lên GitHub ✅

Code đã sẵn sàng. Chỉ cần commit và push:

```bash
git add GiaoDien
git commit -m "Add API config for production deployment"
git push
```

### Bước 2: Tạo Static Site trên Render

1. Đăng nhập vào **Render Dashboard**: https://dashboard.render.com
2. Click nút **"New +"** → Chọn **"Static Site"**
3. Connect repository: `hoaibao3112/CNPM_WebSach`
4. Cấu hình:
   - **Name**: `cnpm-customer` (hoặc tên bạn muốn)
   - **Branch**: `main`
   - **Root Directory**: `GiaoDien`
   - **Build Command**: (để trống - không cần build static HTML)
   - **Publish Directory**: `.` (current directory)

5. Click **"Create Static Site"**

### Bước 3: Đợi Deploy

Render sẽ tự động:
- Clone repository
- Publish folder `GiaoDien`
- Deploy lên CDN

### Bước 4: Kiểm Tra

Sau khi deploy xong, bạn sẽ có URL dạng:
```
https://cnpm-customer.onrender.com
```

## Kiểm Tra Sau Deploy

1. **Mở trang chủ**: `https://cnpm-customer.onrender.com`
2. **Mở Console (F12)**: Xem có log `🚀 Production mode - patching API calls`
3. **Test tính năng**:
   - Browse products
   - Login
   - Add to cart
   - Checkout

## Troubleshooting

### Nếu API calls vẫn gọi localhost:

Check Console xem có message:
- ✅ `🚀 Production mode - patching API calls with: https://cnpm-websach.onrender.com`
- ❌ `🔧 Development mode - using localhost`

Nếu thấy Development mode → Check lại `config.js` đã load chưa.

### Nếu có lỗi CORS:

Backend đã config CORS cho frontend. Nếu vẫn lỗi, cần thêm URL frontend vào backend CORS config.

---

## Notes

- `config.js` và `api-patcher.js` phải load **TRƯỚC** các script khác!
- Deployment tự động khi push code lên GitHub
- URL production backend: `https://cnpm-websach.onrender.com`

---

Happy deploying! 🚀
