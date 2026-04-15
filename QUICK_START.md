# 🎯 Quick Reference: Facebook Login + MoMo Payment

## 📝 Checklist Implement

### Step 1: Backend Deploy
```bash
# Push changes to GitHub/Render
git add .
git commit -m "Add Facebook Login + MoMo Payment"
git push

# Render automatically redeploys
# Wait 2-3 minutes...
```

### Step 2: Add to Render Environment
Visit: https://dashboard.render.com/services/{your-service-id}/environment

**Add these variables:**
```
FACEBOOK_CLIENT_ID=904742255223792
FACEBOOK_CLIENT_SECRET=7ce1af9baad78720c3e7be2ca1fe47ac
```

(MoMo vars already exist)

### Step 3: Add Facebook Button to login.html

```html
<!-- BEFORE: Inside login form -->

<!-- Facebook SDK -->
<div id="fb-root"></div>
<script async defer crossorigin="anonymous" 
  src="https://connect.facebook.net/en_US/sdk.js#xfbml=1&version=v18.0">
</script>

<!-- OR Separator -->
<div class="or-separator">or</div>

<!-- Facebook Login Button -->
<button type="button" id="facebookLoginBtn" class="login-btn" 
  style="background: linear-gradient(135deg, #1877f2 0%, #0a66c2 100%); margin-bottom: 0;">
  <i class="fab fa-facebook"></i> Đăng nhập Facebook
</button>

<!-- Script -->
<script src="js/facebook-login.js"></script>
```

### Step 4: Add MoMo Button to cart.html or checkout page

```html
<!-- Payment Methods Selection -->
<div class="payment-methods">
  <h3>Chọn phương thức thanh toán</h3>
  
  <label>
    <input type="radio" name="payment" value="cod" checked>
    Thanh toán khi nhận hàng (COD)
  </label>
  
  <label>
    <input type="radio" name="payment" value="vnpay">
    VNPay - Thẻ ngân hàng
  </label>
  
  <label>
    <input type="radio" name="payment" value="momo">
    <i class="fas fa-mobile-alt"></i> Thanh toán MoMo
  </label>
</div>

<!-- MoMo Checkout Button -->
<button type="button" id="momoCheckoutBtn" class="checkout-btn momo-btn">
  💳 Thanh toán qua MoMo
</button>

<!-- Payment Status Message -->
<div id="paymentMessage"></div>
<div id="paymentStatus"></div>

<!-- Script -->
<script src="js/momo-payment.js"></script>
```

---

## 🔑 Environment Variables Summary

### Server (.env)
```env
# Email (already configured)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=hoaibao4062004@gmail.com
EMAIL_PASS=dyqejagggwygsncq

# Facebook (ADD TO RENDER)
FACEBOOK_CLIENT_ID=904742255223792
FACEBOOK_CLIENT_SECRET=7ce1af9baad78720c3e7be2ca1fe47ac

# MoMo (already configured)
MOMO_PARTNER_CODE=MOMO
MOMO_ACCESS_KEY=F8BBA842ECF85
MOMO_SECRET_KEY=K951B6PE1waDMi640xX08PD3vg6EkVlz
MOMO_API_URL=https://test-payment.momo.vn/v2/gateway/api/create
MOMO_REDIRECT_URL=http://localhost:5000/api/payments/momo-return
MOMO_IPN_URL=http://localhost:5000/api/payments/momo-ipn
```

### Render Dashboard
Add **only these 2**:
```
FACEBOOK_CLIENT_ID=904742255223792
FACEBOOK_CLIENT_SECRET=7ce1af9baad78720c3e7be2ca1fe47ac
```

---

## 🧪 Quick Test

### Test Facebook Login
```javascript
// Open browser console (F12)
// Create test on login.html

// Should see in console:
✅ Facebook token verified
✅ User auto-registered or logged in
✅ Redirected to index.html
```

### Test MoMo Payment
```javascript
// On cart.html, click "Thanh toán MoMo"
// Should see:

✅ Loading spinner shows
✅ Redirects to MoMo payment page
✅ After payment, returns to order-confirmation.html
✅ Shows order status: Đã thanh toán
```

---

## 🔗 API Endpoints Quick Reference

```javascript
// Frontend calls these:

// Facebook Login
POST /api/client/auth/facebook
{
  "accessToken": "tokens_from_facebook_sdk"
}

// Create MoMo Payment
POST /api/payments/create
{
  "orderId": 123,
  "amount": 500000,
  "orderInfo": "Customer Name - Order #123"
}

// Callbacks (automatic, no action needed):
GET /api/payments/momo-return?resultCode=0&transId=xxx&orderId=123
POST /api/payments/momo-ipn (from MoMo server)
```

---

## 🆘 Troubleshooting Quick Fixes

### Facebook button not showing
```
❌ facebook-login.js not loaded?
   → Check file path in script tag
❌ App ID wrong?
   → Verify in dashboard.render.com environment
❌ Facebook SDK error?
   → Open console (F12), check for SDK errors
```

### MoMo payment not working
```
❌ API returns 401?
   → User not logged in, redirect to login
❌ "Invalid signature"?
   → Check MOMO_SECRET_KEY in Render environment
❌ Payment created but no callback?
   → Check IPN URL configured in MoMo dashboard
```

---

## 📂 Files Created/Modified

### New Files ✨
- `server/src/services/FacebookAuthService.js`
- `server/src/services/MoMoPaymentService.js`
- `server/src/controllers/MoMoPaymentController.js`
- `server/src/routes/momoPaymentRoutes.js`
- `GiaoDien/js/facebook-login.js`
- `GiaoDien/js/momo-payment.js`
- `INTEGRATION_GUIDE.md` (detailed setup)
- `CODE_SUMMARY.md` (this file)

### Modified Files 📝
- `server/src/controllers/AuthController.js` (added facebookAuth)
- `server/src/routes/client.js` (added Facebook route)
- `server/src/routes/index.js` (registered MoMo routes)

---

## ✅ Implementation Checklist

- [ ] Push code to Render
- [ ] Wait for auto-deploy (2-3 min)
- [ ] Add FACEBOOK_CLIENT_ID to Render env
- [ ] Add FACEBOOK_CLIENT_SECRET to Render env
- [ ] Add facebook-login.js to login.html
- [ ] Add momo-payment.js to cart.html
- [ ] Add Facebook SDK to login.html
- [ ] Test Facebook login on staging
- [ ] Test MoMo payment on staging
- [ ] Verify order status updates in database
- [ ] Deploy to production

---

## 🎯 Success Criteria

✅ **Facebook Login:**
- [ ] Click button → Redirects to Facebook
- [ ] Allow permissions → Auto-registers user
- [ ] Logged in → Redirects to homepage
- [ ] User data saved in database

✅ **MoMo Payment:**
- [ ] Click button → Creates payment URL
- [ ] Redirects to MoMo → Customer pays
- [ ] Returns to order-confirmation → Shows success/error
- [ ] Database updated → Order status changes
- [ ] IPN logged → Server received callback

---

## 📞 Support

If something doesn't work:
1. Check server logs: `npm start`
2. Check browser console: F12 → Console
3. Verify environment variables in Render
4. Check that files were uploaded

**Still stuck?** Run this to verify:
```bash
# Check if files exist
ls server/src/services/FacebookAuthService.js
ls server/src/services/MoMoPaymentService.js
ls GiaoDien/js/facebook-login.js
ls GiaoDien/js/momo-payment.js
```

---

**All done! 🚀 Let me know if you need anything else!**
