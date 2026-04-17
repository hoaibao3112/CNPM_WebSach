# Hướng dẫn Test ZaloPay trên Frontend

## 1. Gọi API Tạo Payment

Khi user click **"Thanh toán bằng ZaloPay"**, gọi endpoint này:

```javascript
// Frontend code (JavaScript/React)
const createZaloPayPayment = async (orderId, amount, orderInfo) => {
  try {
    const token = localStorage.getItem('token'); // JWT token
    
    const response = await fetch(
      'https://cnpm-websach-2.onrender.com/api/payments/zalopay/create',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          orderId: orderId,
          amount: amount,
          orderInfo: orderInfo
        })
      }
    );

    const data = await response.json();
    
    if (data.data && data.data.paymentUrl) {
      // Redirect to ZaloPay payment portal
      window.location.href = data.data.paymentUrl;
    } else {
      alert('Lỗi: ' + (data.message || 'Không thể tạo link thanh toán'));
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Lỗi kết nối');
  }
};

// Usage
createZaloPayPayment(12345, 500000, 'Thanh toán đơn hàng #12345');
```

## 2. Xử Lý Return từ ZaloPay

ZaloPay sẽ redirect về URL này sau khi user thanh toán:
```
https://cnpm-websach-2.onrender.com/api/payments/zalopay/return?appTransId=...&returnCode=...&zpTransToken=...
```

Backend sẽ tự động redirect user về:
```
https://yourfrontend.com/order-confirmation.html?appTransId=...&returnCode=...&zpTransToken=...&paymentMethod=zalopay
```

### Xử lý trên trang `order-confirmation.html`:

```javascript
// Xử lý ZaloPay return
const handleZaloPayReturn = () => {
  const params = new URLSearchParams(window.location.search);
  const returnCode = params.get('returnCode');
  const appTransId = params.get('appTransId');
  const zpTransToken = params.get('zpTransToken');
  const paymentMethod = params.get('paymentMethod');
  
  if (paymentMethod === 'zalopay') {
    if (returnCode === '1') {
      // ✅ Thanh toán thành công
      showSuccessMessage('Thanh toán ZaloPay thành công!');
      // Hiển thị order confirmation
    } else {
      // ❌ Thanh toán thất bại
      showErrorMessage('Thanh toán thất bại. Vui lòng thử lại.');
    }
  }
};

// Gọi khi trang load
handleZaloPayReturn();
```

## 3. Integrate vào Order Placement

Thêm ZaloPay vào danh sách payment methods:

```javascript
// Trong component chọn phương thức thanh toán
const paymentMethods = [
  {
    id: 'COD',
    name: 'Thanh toán khi nhận hàng',
    icon: '🚚'
  },
  {
    id: 'VNPAY',
    name: 'Thanh toán VNPay',
    icon: '💳'
  },
  {
    id: 'MOMO',
    name: 'Ví MoMo',
    icon: '📱'
  },
  {
    id: 'ZALOPAY',  // ← Thêm ZaloPay
    name: 'Ví ZaloPay',
    icon: '🟡'
  }
];

// Xử lý click thanh toán
const handlePayment = (paymentMethod) => {
  if (paymentMethod === 'ZALOPAY') {
    // Tạo đơn hàng trước, sau đó gọi ZaloPay payment
    placeOrderAndRedirectToZaloPay();
  }
  // ... xử lý phương thức khác
};

const placeOrderAndRedirectToZaloPay = async () => {
  try {
    // 1. Gọi API place order
    const orderResponse = await fetch(
      'https://cnpm-websach-2.onrender.com/api/orders/place-order',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          cartItems: cart,
          shippingAddress: address,
          paymentMethod: 'ZALOPAY'
        })
      }
    );

    const orderData = await orderResponse.json();
    
    if (orderData.payload && orderData.payload.paymentUrl) {
      // 2. Backend đã tạo order và return payment URL
      // Redirect trực tiếp đến ZaloPay
      window.location.href = orderData.payload.paymentUrl;
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Lỗi đặt hàng');
  }
};
```

## 4. Test Checklist

- [ ] **Test 1: Tạo payment URL**
  - Click "Thanh toán ZaloPay"
  - Kiểm tra có redirect đến ZaloPay portal không
  - Kiểm tra console xem có lỗi không

- [ ] **Test 2: Payment Success**
  - Hoàn thành thanh toán trên ZaloPay sandbox
  - Kiểm tra có redirect về order-confirmation.html không
  - Kiểm tra URL có `returnCode=1` không

- [ ] **Test 3: Payment Failure**
  - Hủy thanh toán trên ZaloPay
  - Kiểm tra có redirect về order-confirmation.html không
  - Kiểm tra URL có `returnCode` khác 1 không

- [ ] **Test 4: Order Status Update**
  - Sau khi thanh toán thành công, check database
  - Verify order status là "Đã thanh toán"
  - Verify `PhuongThucThanhToan = 'ZaloPay'`

- [ ] **Test 5: Loyalty Points**
  - Check customer loyalty points tăng không
  - Tính toán: points = totalAmount / 1000

## 5. Debug Tips

### Console Log
```javascript
// Thêm logging để debug
console.log('🟡 ZaloPay Payment URL:', paymentUrl);
console.log('📊 Order Info:', {
  orderId, amount, orderInfo
});
console.log('🔐 Token:', token ? 'Set' : 'Missing');
```

### Network Tab
1. Mở DevTools → Network tab
2. Click "Thanh toán ZaloPay"
3. Kiểm tra request:
   - URL: `/api/payments/zalopay/create`
   - Status: 200
   - Response body có `paymentUrl` không

### Backend Logs
Kiểm tra logs trên Render:
1. Vào Render Dashboard
2. Chọn service backend
3. Click "Logs"
4. Kiếm "ZaloPay" để xem chi tiết

## 6. Possible Errors

| Error | Nguyên Nhân | Fix |
|-------|-----------|-----|
| 401 Unauthorized | JWT token lỗi/hết hạn | Login lại |
| 400 Bad Request | orderId/amount lỗi | Kiểm tra dữ liệu |
| Payment URL không return | ZALOPAY_KEY1 sai | Check .env trên Render |
| Callback không update order | ZALOPAY_KEY2 sai | Check signature verification |
| CORS error | Frontend URL không whitelist | Check CORS config |

## 7. Live Testing URL

Khi đã deploy xong, test bằng Postman:

**POST** `https://cnpm-websach-2.onrender.com/api/payments/zalopay/create`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
Content-Type: application/json
```

**Body:**
```json
{
  "orderId": 99999,
  "amount": 100000,
  "orderInfo": "Test ZaloPay Payment"
}
```

**Expected Response:**
```json
{
  "statusCode": 200,
  "message": "Tạo link thanh toán ZaloPay thành công",
  "data": {
    "paymentUrl": "https://sandbox-secure-zalopay.zalopay.vn/web/merchant?...",
    "orderId": "99999",
    "appTransId": "1704067200000999990",
    "zaloPayOrderId": "1704067200000999990"
  }
}
```

## 8. QA Testing Steps

1. **Happy Path:**
   - Create order → Pay with ZaloPay → Complete payment → Check order status

2. **Edge Cases:**
   - Network error during payment
   - User closes payment window
   - Callback delayed (wait 5 mins)
   - Multiple payment attempts same order

3. **Integration:**
   - Loyalty points working
   - Email notification sent
   - Inventory updated
   - Order shows in customer dashboard

Chúc bạn test thành công! 🎉
