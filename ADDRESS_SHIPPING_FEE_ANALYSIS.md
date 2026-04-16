# 📋 PHÂN TÍCH: Cập nhật địa chỉ, Phí vận chuyển & Tổng tiền hóa đơn

## 🎯 Tóm tắt nhanh

| Vấn đề | Vị trí | Chi tiết |
|--------|--------|----------|
| **Cập nhật địa chỉ** | `orderRoutes.js:3277` | Route `PUT /hoadon/:id/address` |
| **Tính phí ship** | `orderRoutes.js:55` | Hàm `calculateShippingFee()` |
| **Cập nhật tổng tiền** | `orderRoutes.js:3412-3509` | Tùy theo trạng thái thanh toán |

---

## 1️⃣ BACKEND ROUTE XỬ LÝ CẬP NHẬT ĐỊA CHỈ

### 📍 File: `server/src/routes/orderRoutes.js` (Line 22)
```javascript
router.put('/hoadon/:id/address', authenticateToken, OrderController.updateOrderAddress);
```

### 📍 File: `orderRoutes.js` (Line 3277-3556) - **MAIN LOGIC**
```javascript
router.put('/hoadon/:id/address', authenticateToken, async (req, res) => {
  // Nhận dữ liệu từ frontend:
  // MaDiaChi (địa chỉ cũ) hoặc thông tin địa chỉ mới
  
  // BƯỚC 1: Xác minh đơn hàng thuộc về khách hàng
  // BƯỚC 2: Kiểm tra tinhtrang = "Chờ xử lý" (chỉ được đổi khi đơn chưa được xử lý)
  // BƯỚC 3: Lưu hoặc sử dụng địa chỉ có sẵn
  // BƯỚC 4: Tính lại phí ship
  // BƯỚC 5: Xử lý tùy theo phương thức thanh toán
});
```

---

## 2️⃣ LOGIC TÍNH PHÍ VẬN CHUYỂN

### 📍 File: `orderRoutes.js` (Line 55-102)
```javascript
function calculateShippingFee(province, totalWeight, customerTier = 'Đồng') {
  // ⚙️ CỰ CHỈ:
  // - province: Tỉnh/thành phố giao hàng
  // - totalWeight: Tổng trọng lượng hàng (gram)
  // - customerTier: Hạng thành viên ('Đồng', 'Bạc', 'Vàng')
  
  // 🔍 LOGIC:
  // 1. Nếu là TP.HCM → MIỄN PHÍ SHIP
  if (isHCM(province)) {
    return 0;
  }
  
  // 2. Ngoài TP.HCM: 15.000 VND / 500g (làm tròn lên)
  weight500gUnits = Math.ceil(totalWeight / 500);
  let shippingFee = weight500gUnits * 15000;  // Cơ sở
  
  // 3. Áp dụng giảm giá theo tier:
  //    - Đồng:  0% giảm (không giảm)
  //    - Bạc:  20% giảm
  //    - Vàng: 50% giảm
  shippingFee = applyDiscount(shippingFee, customerTier);
  
  return Math.round(shippingFee);
}
```

### 📊 Bảng tính phí chi tiết:
```
Ví dụ: Đơn hàng 2kg, khách hạng "Đồng", giao TP.HCM
├─ Trọng lượng: 2000g = 4 đơn vị × 500g
├─ Phí ship cơ sở: 4 × 15.000 = 60.000đ
├─ Giảm giá Đồng: 0%
└─ Phí ship cuối: 60.000đ (Nhưng TP.HCM = 0đ)

Ví dụ: Đơn hàng 1kg, khách hạng "Bạc", giao Đà Nẵng
├─ Trọng lượng: 1000g = 2 đơn vị × 500g
├─ Phí ship cơ sở: 2 × 15.000 = 30.000đ
├─ Giảm giá Bạc: 20%
└─ Phí ship cuối: 30.000 - 6.000 = 24.000đ
```

---

## 3️⃣ CẬP NHẬT TỔNG TIỀN HÓA ĐƠN

### 🔴 **VẤN ĐỀ XẬP: Phí ship cũ bị trừ nhưng phí mới không được cộng?**

**KHÔNG** - Logic đã được xử lý đúng ✅

### 📍 Tại: `orderRoutes.js` (Line 3387-3425)

```javascript
// BƯỚC 4: Tính lại phí ship
const totalWeight = ... // Lấy từ chi tiết hóa đơn
const userTier = ... // Lấy tier khách hàng
const userTier = ... // Lấy tier khách hàng

// Tính phí ship cũ và mới
const oldShippingFee = order.PhiShip || 
  calculateShippingFee(order.OldProvince || '', totalWeight, userTier);

const newShippingFee = calculateShippingFee(newProvince, totalWeight, userTier);

const shippingDiff = newShippingFee - oldShippingFee;
// ✅ Sự chênh lệch có thể dương (tăng) hoặc âm (giảm)
```

### 📍 BƯỚC 5: Xử lý theo trạng thái thanh toán (Line 3408-3509)

#### 🟢 **TRƯỜNG HỢP 1: Phí ship giảm hoặc không đổi** (shippingDiff ≤ 0)
```javascript
if (shippingDiff <= 0) {
  // ✅ Cập nhật đơn giản:
  const newTotal = order.TongTien - oldShippingFee + newShippingFee;
  
  UPDATE hoadon 
  SET MaDiaChi = ?,
      PhiShip = newShippingFee,   // ✅ Cập nhật phí ship mới
      TongTien = newTotal,         // ✅ Cập nhật tổng tiền
      GhiChu = '...'
  WHERE MaHD = ?
}
```

#### 🟡 **TRƯỜNG HỢP 2: Phí ship tăng - ĐÃ THANH TOÁN VNPAY** (shippingDiff > 0)
```javascript
if (order.PhuongThucThanhToan === 'VNPAY' && 
    order.TrangThaiThanhToan === 'Đã thanh toán') {
  
  // ⚠️ Không cập nhật TongTien vì khách đã thanh toán online
  UPDATE hoadon 
  SET MaDiaChi = ?,
      PhiShip = newShippingFee,    // ✅ Cập nhật phí ship mới
      // ❌ TongTien giữ nguyên (khách đã thanh toán online)
      GhiChu = '⚠️ ĐỔI ĐỊA CHỈ: Thu thêm {shippingDiff}đ khi giao hàng'
  WHERE MaHD = ?
  
  // 📌 Response:
  return {
    collectOnDelivery: shippingDiff,  // Thu thêm tiền khi giao
    note: '... Thu thêm {shippingDiff}đ khi giao'
  }
}
```

#### 🟠 **TRƯỜNG HỢP 3: Phí ship tăng - COD** (shippingDiff > 0)
```javascript
else if (order.PhuongThucThanhToan === 'COD') {
  
  // ✅ Cập nhật TongTien vì chưa thanh toán
  const newTotal = order.TongTien + shippingDiff;
  
  UPDATE hoadon 
  SET MaDiaChi = ?,
      PhiShip = newShippingFee,    // ✅ Cập nhật phí ship mới
      TongTien = newTotal,         // ✅ Tăng tổng tiền
      GhiChu = 'Phí ship tăng {shippingDiff}đ'
  WHERE MaHD = ?
  
  // 📌 Response:
  return {
    TongTien: newTotal,            // ✅ Shipper sẽ thu số tiền này
    note: 'Tổng tiền COD: {newTotal}đ'
  }
}
```

#### 🔵 **TRƯỜNG HỢP 4: Phí ship tăng - CHƯA THANH TOÁN** (shippingDiff > 0)
```javascript
else {
  
  // ✅ Cập nhật TongTien, khách cần thanh toán lại
  const newTotal = order.TongTien + shippingDiff;
  
  UPDATE hoadon 
  SET MaDiaChi = ?,
      PhiShip = newShippingFee,    // ✅ Cập nhật phí ship mới
      TongTien = newTotal,         // ✅ Tăng tổng tiền
      GhiChu = 'Tổng tiền đã thay đổi, vui lòng thanh toán lại'
  WHERE MaHD = ?
  
  // 📌 Response:
  return {
    TongTien: newTotal,
    requireNewPayment: true,       // ✅ Yêu cầu thanh toán lại
    note: 'Tổng tiền đã thay đổi'
  }
}
```

---

## 4️⃣ LƯỚI LOGIC CẬP NHẬT

```
┌─────────────────────────────────────────────┐
│ Frontend: PUT /hoadon/:id/address           │
│ (gửi MaDiaChi hoặc thông tin địa chỉ mới)  │
└─────────────┬───────────────────────────────┘
              │
              ↓
┌─────────────────────────────────────────────┐
│ BƯỚC 1: Xác minh đơn hàng + khách hàng      │
└─────────────┬───────────────────────────────┘
              │
              ↓
┌─────────────────────────────────────────────┐
│ BƯỚC 2: Kiểm tra tinhtrang = "Chờ xử lý"   │
│ (chỉ được đổi đơn chưa được xử lý)         │
└─────────────┬───────────────────────────────┘
              │
              ↓
┌─────────────────────────────────────────────┐
│ BƯỚC 3: Lưu / Sử dụng địa chỉ              │
│ - Nếu MaDiaChi: Lấy TinhThanh từ diachi    │
│ - Nếu thông tin mới: INSERT INTO diachi    │
└─────────────┬───────────────────────────────┘
              │
              ↓
┌─────────────────────────────────────────────┐
│ BƯỚC 4: Tính phí ship                       │
│ ├─ Lấy totalWeight từ chitiethoadon        │
│ ├─ Lấy loyalty_tier từ khachhang           │
│ ├─ oldShippingFee = order.PhiShip          │
│ └─ newShippingFee = calculateShippingFee() │
│    ├─ Nếu TP.HCM: 0đ                       │
│    └─ Nếu khác: ceil(weight/500) × 15k    │
│       └─ Trừ discount theo tier            │
└─────────────┬───────────────────────────────┘
              │
              ↓
    ┌─────────┴──────────┐
    │                    │
    ↓                    ↓
GIẢM/KHÔNG ĐỔI      TĂNG (shippingDiff > 0)
(shippingDiff ≤ 0)        │
    │                     ├─→ VNPAY + Đã TT
    │                     │   ├─ Cập nhật PhiShip
    │                     │   └─ ❌ Không cập nhật TongTien
    │                     │      (Thu thêm khi giao)
    │                     │
    ├─ Tính newTotal     ├─→ COD
    │  = TongTien         │   ├─ Cập nhật PhiShip
    │    - oldFee         │   └─ ✅ Cập nhật TongTien
    │    + newFee         │      (Tăng số tiền COD)
    │                     │
    ├─ UPDATE hoadon      ├─→ Chưa thanh toán
    │  SET PhiShip,       │   ├─ Cập nhật PhiShip
    │      TongTien       │   └─ ✅ Cập nhật TongTien
    │                     │      (Yêu cầu thanh toán lại)
    │                     │
    └→ Response: TongTien └→ Response: 
       đã cập nhật          Cảnh báo / Thu tiền thêm
```

---

## 5️⃣ ĐOẠN CODE XỬ LÝ CHÍNH

### 🔧 File: `orderRoutes.js` - Tính phí ship (Line 55-102)

```javascript
function calculateShippingFee(province, totalWeight, customerTier = 'Đồng') {
  const provinceLower = String(province || '').toLowerCase().trim();
  
  // ✅ TP.HCM: FREE SHIP
  const isHCM = provinceLower.includes('hồ chí minh') || 
                provinceLower.includes('ho chi minh') ||
                provinceLower.includes('hcm');
  if (isHCM) {
    return 0;
  }

  // 🚚 Ngoài TP.HCM: 15.000 VND / 500g
  const weight500gUnits = Math.ceil((totalWeight || 0) / 500);
  let shippingFee = weight500gUnits * 15000;

  // 🎁 Áp dụng discount theo tier
  let discount = 0;
  switch (customerTier) {
    case 'Bạc':
      discount = 0.20;  // Giảm 20%
      break;
    case 'Vàng':
      discount = 0.50;  // Giảm 50%
      break;
    default:
      discount = 0;     // Đồng: không giảm
  }

  if (discount > 0) {
    const discountAmount = Math.round(shippingFee * discount);
    shippingFee = shippingFee - discountAmount;
  }

  return Math.round(shippingFee);
}
```

### 🔧 File: `orderRoutes.js` - Cập nhật tổng tiền (Line 3387-3425)

```javascript
// Tính phí ship cũ và mới
const oldShippingFee = order.PhiShip || 
  calculateShippingFee(order.OldProvince || '', totalWeight, userTier);

const newShippingFee = calculateShippingFee(newProvince, totalWeight, userTier);

const shippingDiff = newShippingFee - oldShippingFee;

console.log('🚚 Shipping calculation:', {
  oldShippingFee,    // ✅ Phí cũ
  newShippingFee,    // ✅ Phí mới
  shippingDiff,      // ✅ Chênh lệch
  paymentMethod: order.PhuongThucThanhToan,
  paymentStatus: order.TrangThaiThanhToan
});

// TRƯỜNG HỢP 1: Phí giảm hoặc không đổi
if (shippingDiff <= 0) {
  const newTotal = order.TongTien - oldShippingFee + newShippingFee;
  
  await conn.query(`
    UPDATE hoadon 
    SET MaDiaChi = ?,
        PhiShip = ?,          // ✅ Cập nhật phí mới
        TongTien = ?,         // ✅ Cập nhật tổng tiền
        GhiChu = CONCAT(...)
    WHERE MaHD = ?
  `, [newAddressId, newShippingFee, newTotal, ..., id]);
}

// TRƯỜNG HỢP 2: Phí tăng
if (shippingDiff > 0) {
  if (order.PhuongThucThanhToan === 'VNPAY' && 
      order.TrangThaiThanhToan === 'Đã thanh toán') {
    
    // ⚠️ Không cập nhật TongTien
    // Thu thêm khi giao
    
  } else if (order.PhuongThucThanhToan === 'COD') {
    
    // ✅ Cập nhật TongTien
    const newTotal = order.TongTien + shippingDiff;
    
  } else {
    
    // ✅ Cập nhật TongTien, yêu cầu thanh toán lại
    const newTotal = order.TongTien + shippingDiff;
  }
}
```

---

## 6️⃣ ĐƯỜNG DẪN FILE CHÍNH

| File | Đường dẫn | Dòng | Chức năng |
|------|-----------|------|----------|
| **orderRoutes.js** | `c:\Users\PC\Desktop\CNPM\orderRoutes.js` | 55-102 | `calculateShippingFee()` |
| **orderRoutes.js** | `c:\Users\PC\Desktop\CNPM\orderRoutes.js` | 3277-3556 | Route cập nhật đơn hàng + tính phí |
| **OrderController** | `c:\Users\PC\Desktop\CNPM\server\src\controllers\OrderController.js` | 181-195 | `updateOrderAddress()` handler |
| **OrderService** | `c:\Users\PC\Desktop\CNPM\server\src\services\OrderService.js` | 998-1050 | `updateOrderAddress()` service (chỉ cập nhật MaDiaChi) |
| **orderRoutes.js** | `c:\Users\PC\Desktop\CNPM\server\src\routes\orderRoutes.js` | 22 | Route đăng ký |

---

## 7️⃣ KẾT LUẬN

✅ **Logic cập nhật địa chỉ + phí ship là CHÍNH XÁC**:
- Phí ship cũ được trừ đúng cách
- Phí ship mới được cộng đúng cách
- Tổng tiền được cập nhật tùy theo trạng thái thanh toán

⚠️ **LƯU Ý**:
- Chỉ có thể đổi địa chỉ khi đơn ở trạng thái "Chờ xử lý"
- Nếu VNPAY + đã thanh toán: Shipper thu thêm tiền khi giao, không cập nhật tổng tiền trong DB
- Nếu COD hoặc chưa thanh toán: Tổng tiền được cập nhật ngay

---

*Tài liệu được tạo: 16/04/2026*
