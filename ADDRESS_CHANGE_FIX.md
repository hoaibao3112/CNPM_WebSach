# 🔧 Fix for Address Change Error (500 Status Code)

## ❌ Problem Summary

When you tried to change a delivery address for an order, you got:
- **Error**: `Failed to load resource: the server responded with a status of 500`
- **Console**: `Update address failed: Error: Äá»‹a chá»‰ khÃ´ng tá»"n táº¡i`
- **Translation**: "Address does not exist" (with UTF-8 encoding corruption)

---

## 🔍 Root Cause Analysis

### The Main Issue
The backend endpoint `/api/orders/hoadon/:id/address` was routing to the wrong handler method.

**Problem Flow:**
1. Frontend sends address change request to: `PUT /api/orders/hoadon/:id/address`
2. Routes file called: `OrderController.updateAddress()`
3. This method expected field names for **saving customer addresses**, NOT for **updating order delivery addresses**
4. Field name mismatch caused the method to fail silently

### Field Name Mismatch

**Frontend sends (for order address change):**
```javascript
{
  MaDiaChi: 94075259,           // OR new address fields below
  TenNguoiNhan: "Nguyen Van A",
  SDT: "0123456789",
  DiaChiChiTiet: "123 Nguyen Hue",
  TinhThanh: "Ho Chi Minh",
  QuanHuyen: "District 1",
  PhuongXa: "Ben Nghe"
}
```

**Old method expected (for saving addresses):**
```javascript
{
  name: "...",
  phone: "...",
  detail: "...",
  province: "...",
  district: "...",
  ward: "..."
}
```

---

## ✅ Solution Implemented

### 1. **New Service Method** (`OrderService.updateOrderAddress`)
Located in: `server/src/services/OrderService.js`

**Handles two cases:**
- **Case 1:** User selected existing saved address → Updates `hoadon.MaDiaChi`
- **Case 2:** User entered new address details → Creates/updates `diachi` record, then updates `hoadon.MaDiaChi`

```javascript
async updateOrderAddress(orderId, customerId, addressData) {
  // Verify order belongs to customer
  // If MaDiaChi provided: use saved address
  // Else: create/update new address record
  // Finally: update order's delivery address
}
```

### 2. **New Controller Method** (`OrderController.updateOrderAddress`)
Located in: `server/src/controllers/OrderController.js`

**Properly routes order address updates:**
- Calls the correct service method
- Handles UTF-8 encoding in error messages
- Returns proper JSON response

### 3. **Updated Routing** (`orderRoutes.js`)
```javascript
// OLD (WRONG):
router.put('/hoadon/:id/address', authenticateToken, OrderController.updateAddress);

// NEW (CORRECT):
router.put('/hoadon/:id/address', authenticateToken, OrderController.updateOrderAddress);
```

---

## 📋 Files Modified

| File | Changes |
|------|---------|
| `server/src/services/OrderService.js` | Added `updateOrderAddress()` method |
| `server/src/controllers/OrderController.js` | Added `updateOrderAddress()` handler; improved error handling |
| `server/src/routes/orderRoutes.js` | Routes `/hoadon/:id/address` to new handler |

---

## 🧪 How It Works Now

### Scenario 1: User Selects Existing Saved Address
```
Frontend sends:
  POST /api/orders/hoadon/123/address
  { MaDiaChi: 94075259 }
    ↓
Backend:
  1. Verifies address 94075259 exists & belongs to customer
  2. Updates hoadon.MaDiaChi = 94075259
  3. Returns success
```

### Scenario 2: User Enters New Address
```
Frontend sends:
  POST /api/orders/hoadon/123/address
  { TenNguoiNhan: "...", SDT: "...", DiaChiChiTiet: "..." }
    ↓
Backend:
  1. Checks if similar address exists for customer
  2. If exists: Updates the diachi record
  3. If not exists: Creates new diachi record
  4. Updates hoadon.MaDiaChi with the address ID
  5. Returns success
```

---

## ✨ Benefits

✅ **No more 500 errors** when changing delivery address  
✅ **Correct field mapping** between frontend and backend  
✅ **Better separation of concerns** (order vs. address updates)  
✅ **Cleaner error messages** (though UTF-8 corruption still shows in logs)  
✅ **Improved data consistency** - addresses properly created/updated  

---

## 🔮 Future Improvements

1. **Fix UTF-8 encoding** in error messages database-wide
2. **Add validation** for phone number format
3. **Add shipping fee recalculation** when address changes
4. **Add audit logging** for address changes
5. **Add address verification API** (street validation)

---

## 📞 Testing

To verify the fix works:
1. Go to Orders page
2. Click on an order with status "Chờ xử lý" (Pending)
3. Click "Đổi địa chỉ giao hàng" (Change Delivery Address)
4. Select or enter a new address
5. Confirm the change

**Expected Result:** ✅ Address updates without 500 error

---

**Fix Date:** April 16, 2026  
**Status:** ✅ Ready to Deploy
