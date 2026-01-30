# Complete Order Module Rewrite

Based on the old `orderRoutes.js` (3590 lines), here are ALL the endpoints that need to be implemented:

## Order Operations
- **POST** `/place-order` - Đặt hàng (with VNPay/COD, promotions, loyalty, shipping calculation)
- **GET** `/hoadon` - Lấy danh sách hóa đơn (no auth - dev only)
- **GET** `/hoadon/:id` - Lấy chi tiết hóa đơn (no auth - dev only)
- **GET** `/:id` - Get single order (authenticated)
- **PUT** `/hoadon/:id/status` - Cập nhật trạng thái đơn hàng
- **DELETE** `/hoadon/:id` - Xóa đơn hàng

## Customer Orders
- **GET** `/customer-orders/:customerId` - Lấy danh sách đơn hàng của khách
- **GET** `/customer-orders/detail/:orderId` - Chi tiết đơn của khách
- **PUT** `/customer-orders/cancel/:orderId` - Hủy đơn hàng (with refund logic)

## Address Management
- **GET** `/customer-addresses/:customerId` - Lấy danh sách địa chỉ
- **POST** `/customer-addresses` - Thêm địa chỉ mới
- **PUT** `/customer-addresses/:id` - Cập nhật địa chỉ
- **DELETE** `/customer-addresses/:id` - Xóa địa chỉ
- **PUT** `/customer-addresses/:id/set-default` - Đặt địa chỉ mặc định
- **GET** `/:customerId/:id/address` - Get specific address

## Address Resolution (Province/District/Ward)
- **GET** `/resolve/province/:code` - Resolve province name
- **GET** `/resolve/district/:code` - Resolve district name  
- **GET** `/resolve/ward/:code` - Resolve ward name

## VNPay Payment
- **GET** `/vnpay_return` - VNPay callback URL
- **POST** `/vnpay_refund` - Manual VNPay refund

## Refunds
- **GET** `/customer-refunds/:customerId` - Lấy danh sách hoàn tiền
- **POST** `/refund-request` - Tạo yêu cầu hoàn tiền
- **PUT** `/refund-request/:id` - Cập nhật yêu cầu hoàn tiền

## Key Business Logic to Preserve:
1. **Shipping Fee Calculation** - Based on weight, location, tier
2. **Loyalty Points** - Add points on COD/VNPay success
3. **Promotion Validation** - Server-side recalculation  
4. **Member Discounts** - Tier-based (Bạc/Vàng)
5. **Free Ship Logic** - Check claims and conditions
6. **VNPay Integration** - Payment URL generation and callback handling
7. **Email Notifications** - Order confirmation emails
8. **Address Resolution** - Load from JSON files (city, district, ward)
9. **Stock Management** - Update inventory on order placement
10. **Cart Cleanup** - Remove selected items after successful order

## Implementation Priority:
1. Core order placement (/place-order) - CRITICAL
2. Customer order list/detail - HIGH  
3. Address management - HIGH
4. VNPay integration - MEDIUM
5. Refund system - MEDIUM
6. Address resolution - LOW (nice to have)
