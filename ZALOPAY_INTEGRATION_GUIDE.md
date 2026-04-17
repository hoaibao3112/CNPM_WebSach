# ZaloPay Payment Integration Guide

## Overview
ZaloPay payment method has been integrated into the order system alongside MoMo and VNPay. Users can now pay using ZaloPay when placing orders.

## Files Created
1. **ZaloPayPaymentService.js** (`server/src/services/`)
   - Handles ZaloPay API communication
   - Signature generation and verification (HMAC-SHA256)
   - Callback handling and order status updates
   - Refund management (placeholder)

2. **ZaloPayPaymentController.js** (`server/src/controllers/`)
   - Endpoint handlers for payment creation
   - Return/redirect handler
   - IPN (Instant Payment Notification) callback handler
   - Refund request handler

3. **zaloPayRoutes.js** (`server/src/routes/`)
   - Route definitions for ZaloPay payment endpoints
   - Authentication middleware integration

## Configuration
All ZaloPay configuration is in `.env` file:
```env
ZALOPAY_APP_ID=2554
ZALOPAY_KEY1=sdngKKJmqEMzvh5QQcdD2A9XBSKUNaYn
ZALOPAY_KEY2=trMrHtvjo6myautxDUiAcYsVtaeQ8nhf
ZALOPAY_ENDPOINT=https://sb-openapi.zalopay.vn/v2/create
ZALOPAY_REDIRECT_URL=http://localhost:5000/payments/zalopay-return
ZALOPAY_IPN_URL=http://localhost:5000/payments/zalopay-ipn
```

## API Endpoints

### 1. Create ZaloPay Payment
**POST** `/api/payments/zalopay/create`

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "orderId": 12345,
  "amount": 500000,
  "orderInfo": "Thanh toán đơn hàng #12345"
}
```

**Response (Success):**
```json
{
  "statusCode": 200,
  "message": "Tạo link thanh toán ZaloPay thành công",
  "data": {
    "paymentUrl": "https://sandbox-secure-zalopay.zalopay.vn/web/merchant?...",
    "orderId": "12345",
    "appTransId": "1234567890123456",
    "zaloPayOrderId": "1234567890123456"
  }
}
```

### 2. ZaloPay Return Handler
**GET** `/api/payments/zalopay/return`

Called automatically when user completes payment on ZaloPay portal.
- Redirects user back to frontend order confirmation page
- Query parameters: `appTransId`, `returnCode`, `zpTransToken`

### 3. ZaloPay IPN Callback
**POST** `/api/payments/zalopay/ipn`

Receives payment status from ZaloPay servers.
- Verifies signature using Key2
- Updates order status in database
- Adds loyalty points if payment successful
- Sends confirmation email

**ZaloPay POST Data:**
```json
{
  "app_trans_id": "1704067200000123456",
  "app_user": "customer_123",
  "app_time": 1704067200000,
  "amount": 500000,
  "return_code": 1,
  "return_message": "Thành công",
  "app_data": "{\"customerId\":\"123\",\"orderId\":\"12345\"}",
  "zp_trans_token": "240101_abc123def456",
  "server_time": "2024-01-01T12:34:56+07:00",
  "mac": "<hmac_signature>"
}
```

### 4. Request Refund
**POST** `/api/payments/zalopay/refund`

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "zpTransToken": "240101_abc123def456",
  "appTransId": "1704067200000123456",
  "orderId": 12345,
  "amount": 500000
}
```

**Status:** Currently returns 501 Not Implemented (pending ZaloPay API implementation)

## Integration with Order Creation
When creating an order with `POST /api/orders/place-order`:
- Include `paymentMethod: 'ZALOPAY'` in request body
- System will automatically route to ZaloPay payment flow
- Returns payment URL for frontend to redirect to ZaloPay portal

**Example Order Creation Request:**
```json
{
  "cartItems": [...],
  "shippingAddress": {...},
  "paymentMethod": "ZALOPAY"
}
```

## Payment Flow

```
1. Customer clicks "Pay with ZaloPay"
   ↓
2. Frontend calls POST /api/payments/zalopay/create
   ↓
3. Backend creates order and calls ZaloPay API
   ↓
4. ZaloPay returns payment URL
   ↓
5. Frontend redirects customer to ZaloPay portal
   ↓
6. Customer completes payment on ZaloPay
   ↓
7. ZaloPay redirects to GET /api/payments/zalopay/return
   ↓
8. User redirected to order confirmation page
   ↓
9. Simultaneously: ZaloPay sends IPN to POST /api/payments/zalopay/ipn
   ↓
10. Backend verifies signature and updates order status
   ↓
11. Loyalty points added, confirmation email sent
```

## Security Features

### Signature Verification
- All callbacks verified using HMAC-SHA256 with Key2
- Data includes: `app_trans_id`, `amount`, `app_user`, `app_time`
- Invalid signatures are rejected and logged

### Error Handling
- Invalid order IDs return 404
- Missing auth token returns 401
- Invalid amounts return 400
- ZaloPay API errors are caught and logged

## Testing (Sandbox)

**Sandbox URL:** `https://sandbox.zalopay.vn`

**Test Account:**
- Use the credentials provided by ZaloPay team
- Credentials already set in `.env`

**Test Cards:**
- ZaloPay provides test cards in their sandbox documentation
- All transactions are simulated in sandbox mode

## Logging

All ZaloPay operations are logged:
- Request creation: `💳 ZaloPay Payment Request Created`
- API calls: `✅ ZaloPay API Response`
- Callback received: `💳 ZaloPay Callback Received`
- Success: `✅ ZaloPay Payment Success`
- Errors: `🔴 ZaloPay ... Error`

View logs in application logger for debugging.

## Supported Payment Methods

The system now supports:
- **VNPAY** - VNPay gateway
- **MOMO** - MoMo mobile payment
- **ZALOPAY** - ZaloPay wallet (NEW)
- **COD** - Cash on delivery

## Future Enhancements

- [ ] Implement ZaloPay refund API
- [ ] Add transaction history tracking
- [ ] Support partial refunds
- [ ] Add payment retry logic
- [ ] Webhook timeout handling

## Troubleshooting

### Payment URL Not Generated
- Check `ZALOPAY_KEY1` in `.env` is correct
- Verify order ID is valid
- Confirm amount is positive integer
- Check network connectivity to ZaloPay API

### Callback Not Updating Order
- Verify `ZALOPAY_KEY2` in `.env` is correct
- Check order exists in database
- Review logs for signature verification errors
- Ensure IPN URL is publicly accessible

### Signature Verification Failed
- Verify Key2 is set correctly in `.env`
- Check callback data format matches expected
- Review HMAC-SHA256 calculation
- Check for character encoding issues

## Support
For ZaloPay API documentation, visit: https://docs.zalopay.vn/api/openapi
