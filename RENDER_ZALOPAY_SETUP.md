# Hướng dẫn Thêm ZaloPay Keys vào Render

## Bước 1: Truy cập Render Dashboard
1. Vào https://dashboard.render.com
2. Đăng nhập tài khoản của bạn
3. Chọn service backend (ví dụ: `cnpm-websach-2` hoặc tên service của bạn)

## Bước 2: Mở Environment Variables
1. Trong service detail page, kéo xuống tìm **"Environment"** section
2. Click vào **"Environment"** hoặc **"Add Environment Variable"**

## Bước 3: Thêm ZaloPay Variables
Thêm 6 biến environment sau với giá trị từ `.env`:

```
ZALOPAY_APP_ID = 2554
ZALOPAY_KEY1 = sdngKKJmqEMzvh5QQcdD2A9XBSKUNaYn
ZALOPAY_KEY2 = trMrHtvjo6myautxDUiAcYsVtaeQ8nhf
ZALOPAY_ENDPOINT = https://sb-openapi.zalopay.vn/v2/create
ZALOPAY_REDIRECT_URL = https://cnpm-websach-2.onrender.com/api/payments/zalopay/return
ZALOPAY_IPN_URL = https://cnpm-websach-2.onrender.com/api/payments/zalopay/ipn
```

### ⚠️ LƯU Ý QUAN TRỌNG:
- **ZALOPAY_REDIRECT_URL** và **ZALOPAY_IPN_URL** phải là public URL của Render
- Thay `cnpm-websach-2` bằng tên service thực tế của bạn trên Render
- Nếu chưa biết URL của service, kiếm trong "Render URL" section ở trang service detail

## Bước 4: Save Environment Variables
1. Click nút **"Save"** sau khi thêm tất cả 6 biến
2. Render sẽ tự động deploy lại service với config mới
3. Chờ deploy hoàn tất (xem "Activity" tab)

## Bước 5: Xác Minh
1. Sau khi deploy xong, test bằng Postman:
   - URL: `POST https://your-render-service.onrender.com/api/payments/zalopay/create`
   - Headers: `Authorization: Bearer <token>`
   - Body: 
   ```json
   {
     "orderId": 99999,
     "amount": 10000,
     "orderInfo": "Test ZaloPay"
   }
   ```
2. Nếu nhận được payment URL → ✅ Thành công

## Tìm Render Service URL
Nếu không nhớ URL:
1. Vào Render Dashboard
2. Chọn service của bạn
3. Tìm dòng "Render URL" ở phía trên

Ví dụ: `https://cnpm-websach-2.onrender.com`

## Danh Sách Biến Cần Add

| Tên Biến | Giá Trị | Ghi Chú |
|----------|--------|--------|
| ZALOPAY_APP_ID | 2554 | ID từ ZaloPay |
| ZALOPAY_KEY1 | sdngKKJmqEMzvh5QQcdD2A9XBSKUNaYn | Key1 cho tạo request |
| ZALOPAY_KEY2 | trMrHtvjo6myautxDUiAcYsVtaeQ8nhf | Key2 cho verify callback |
| ZALOPAY_ENDPOINT | https://sb-openapi.zalopay.vn/v2/create | API endpoint (sandbox) |
| ZALOPAY_REDIRECT_URL | https://cnpm-websach-2.onrender.com/api/payments/zalopay/return | Redirect URL |
| ZALOPAY_IPN_URL | https://cnpm-websach-2.onrender.com/api/payments/zalopay/ipn | IPN callback URL |

## Troubleshooting

### Deploy failed?
- Check logs trong "Activity" tab
- Xác minh syntax của các biến (không có dấu space thừa)
- Clear cache của Render: Settings → Clear Build Cache

### Payment URL không generate?
- Kiểm tra các biến đã được set đúng không
- Check xem logs có error gì không
- Xác minh JWT token hợp lệ

### Callback không cập nhật order?
- Verify `ZALOPAY_IPN_URL` trỏ đúng endpoint
- Check logs xem callback có đến không
- Xác minh signature verification không fail

## Sau Khi Deploy

Tất cả 3 payment methods đều sẽ hoạt động trên Render:
- ✅ **VNPay** - `https://cnpm-websach-2.onrender.com/api/orders/vnpay_return`
- ✅ **MoMo** - `https://cnpm-websach-2.onrender.com/api/payments/zalopay/...`
- ✅ **ZaloPay** - `https://cnpm-websach-2.onrender.com/api/payments/zalopay/...`

Người dùng có thể chọn thanh toán bằng bất kỳ phương thức nào khi đặt hàng!
