# 📝 Hướng Dẫn Logic Tạo Bảng Câu Hỏi (Form Sở Thích)

## 1. Tổng Quan Hệ Thống

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CẤU TRÚC FORM SỞ THÍCH                            │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
        ┌─────────────────────────────┼─────────────────────────────┐
        ▼                             ▼                             ▼
  ┌───────────┐               ┌───────────────┐             ┌───────────────┐
  │   FORM    │───────────────│   CÂU HỎI    │─────────────│  LỰA CHỌN    │
  │ form_sothich│  1 ──> N    │cauhoi_sothich │  1 ──> N   │luachon_cauhoi │
  └───────────┘               └───────────────┘             └───────────────┘
                                      │
                                      ▼
                    ┌─────────────────────────────────────┐
                    │           KHÁCH HÀNG TRẢ LỜI        │
                    │   phanhoi_sothich + traloi_sothich  │
                    └─────────────────────────────────────┘
```

---

## 2. Cấu Trúc Các Bảng Database

### 2.1. Bảng `form_sothich` - Form khảo sát chính

| Cột | Kiểu dữ liệu | Mô tả |
|-----|-------------|-------|
| MaForm | INT (PK, AI) | Mã định danh form |
| TenForm | VARCHAR(255) | Tên form hiển thị |
| MoTa | TEXT | Mô tả chi tiết form |
| TrangThai | TINYINT | 1 = Active, 0 = Inactive |
| MaKM | INT (FK, nullable) | Mã khuyến mãi tặng khi hoàn thành |
| NgayTao | DATETIME | Ngày tạo form |

**Ví dụ:**
```sql
INSERT INTO form_sothich (TenForm, MoTa, TrangThai, MaKM)
VALUES ('Khảo sát sở thích đọc sách 2025', 'Trả lời để nhận mã Freeship!', 1, 10);
```

---

### 2.2. Bảng `cauhoi_sothich` - Câu hỏi trong form

| Cột | Kiểu dữ liệu | Mô tả |
|-----|-------------|-------|
| MaCauHoi | INT (PK, AI) | Mã định danh câu hỏi |
| MaForm | INT (FK) | Thuộc form nào |
| NoiDungCauHoi | TEXT | Nội dung câu hỏi |
| LoaiCauHoi | VARCHAR(50) | Loại câu hỏi (xem bảng bên dưới) |
| BatBuoc | TINYINT | 1 = Bắt buộc, 0 = Tùy chọn |
| ThuTu | INT | Thứ tự hiển thị (1, 2, 3...) |

#### Các loại câu hỏi hỗ trợ (`LoaiCauHoi`):

| Giá trị | Mô tả | Ví dụ |
|---------|-------|-------|
| `single` | Chọn 1 đáp án | "Bạn là nam hay nữ?" |
| `multi` | Chọn nhiều đáp án | "Bạn thích thể loại nào?" |
| `rating` | Đánh giá 1-5 sao | "Mức độ hài lòng?" |
| `text` | Nhập văn bản tự do | "Góp ý thêm?" |
| `entity_theloai` | Chọn thể loại sách (liên kết MaTL) | "Thể loại yêu thích?" |
| `entity_tacgia` | Chọn tác giả (liên kết MaTG) | "Tác giả yêu thích?" |
| `entity_hinhthuc` | Chọn hình thức sách | "Bìa cứng hay bìa mềm?" |
| `entity_khoanggia` | Chọn khoảng giá | "Ngân sách của bạn?" |
| `entity_namxb` | Chọn năm xuất bản | "Sách mới hay cũ?" |
| `entity_sotrang` | Chọn độ dày sách | "Mỏng hay dày?" |

---

### 2.3. Bảng `luachon_cauhoi` - Các lựa chọn đáp án

| Cột | Kiểu dữ liệu | Mô tả |
|-----|-------------|-------|
| MaLuaChon | INT (PK, AI) | Mã định danh lựa chọn |
| MaCauHoi | INT (FK) | Thuộc câu hỏi nào |
| NoiDungLuaChon | VARCHAR(500) | Nội dung hiển thị |
| **MaTL** | INT (FK, nullable) | Mã thể loại (nếu là entity_theloai) |
| **MaTG** | INT (FK, nullable) | Mã tác giả (nếu là entity_tacgia) |
| **HinhThuc** | VARCHAR(50) | Hình thức sách |
| **MaKhoangGia** | VARCHAR(20) | Khoảng giá (LT100, 100-200, ...) |
| **NamXBTu** | INT | Năm xuất bản từ |
| **NamXBDen** | INT | Năm xuất bản đến |
| **SoTrangTu** | INT | Số trang từ |
| **SoTrangDen** | INT | Số trang đến |
| TrongSo | DECIMAL(3,1) | Trọng số điểm (mặc định 1.0) |
| ThuTu | INT | Thứ tự hiển thị |

**Giá trị cho `MaKhoangGia`:**
- `LT100` - Dưới 100.000đ
- `100-200` - 100.000đ - 200.000đ
- `200-300` - 200.000đ - 300.000đ
- `300-400` - 300.000đ - 400.000đ
- `400-500` - 400.000đ - 500.000đ
- `500-700` - 500.000đ - 700.000đ
- `700-1000` - 700.000đ - 1.000.000đ
- `1000-2000` - 1.000.000đ - 2.000.000đ
- `GT2000` - Trên 2.000.000đ

---

## 3. Quy Trình Tạo Form Câu Hỏi

### 3.1. Sơ đồ quy trình

```
┌──────────────────────────────────────────────────────────────────────────┐
│                         QUY TRÌNH TẠO FORM                               │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   BƯỚC 1                    BƯỚC 2                    BƯỚC 3             │
│   ┌─────────┐              ┌─────────────┐           ┌────────────┐      │
│   │ TẠO FORM │  ────────>  │ TẠO CÂU HỎI │ ───────>  │ TẠO OPTIONS│      │
│   └─────────┘              └─────────────┘           └────────────┘      │
│       │                          │                         │             │
│       ▼                          ▼                         ▼             │
│   - TenForm               - LoaiCauHoi              - NoiDungLuaChon     │
│   - MoTa                  - NoiDungCauHoi           - Entity IDs         │
│   - TrangThai             - BatBuoc                 - TrongSo            │
│   - MaKM (coupon)         - ThuTu                   - ThuTu              │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

### 3.2. Bước 1: Tạo Form

**API Endpoint:**
```
POST /api/admin/preference-forms
```

**Request Body:**
```json
{
  "TenForm": "Khảo sát sở thích mùa hè 2025",
  "MoTa": "Trả lời để nhận mã Freeship 30K!",
  "TrangThai": 1,
  "MaKM": 10
}
```

**Response:**
```json
{
  "success": true,
  "message": "Tạo form thành công",
  "data": { "formId": 5 }
}
```

**SQL tương đương:**
```sql
INSERT INTO form_sothich (TenForm, MoTa, TrangThai, MaKM, NgayTao)
VALUES ('Khảo sát sở thích mùa hè 2025', 'Trả lời để nhận mã Freeship 30K!', 1, 10, NOW());
```

---

### 3.3. Bước 2: Tạo Câu Hỏi

**API Endpoint:**
```
POST /api/admin/questions
```

**Request Body:**
```json
{
  "MaForm": 5,
  "NoiDungCauHoi": "Bạn thích đọc thể loại sách nào? (Chọn tối đa 3)",
  "LoaiCauHoi": "entity_theloai",
  "BatBuoc": 1,
  "ThuTu": 1
}
```

**Response:**
```json
{
  "success": true,
  "message": "Tạo câu hỏi thành công",
  "data": { "questionId": 15 }
}
```

---

### 3.4. Bước 3: Tạo Lựa Chọn (Options)

**API Endpoint:**
```
POST /api/admin/options
```

**Request Body (ví dụ thể loại):**
```json
{
  "MaCauHoi": 15,
  "NoiDungLuaChon": "Manga",
  "MaTL": 5,
  "TrongSo": 2.0,
  "ThuTu": 1
}
```

**Request Body (ví dụ khoảng giá):**
```json
{
  "MaCauHoi": 16,
  "NoiDungLuaChon": "100.000đ - 200.000đ",
  "MaKhoangGia": "100-200",
  "TrongSo": 1.0,
  "ThuTu": 2
}
```

**Request Body (ví dụ năm xuất bản):**
```json
{
  "MaCauHoi": 17,
  "NoiDungLuaChon": "Sách mới (2023-2025)",
  "NamXBTu": 2023,
  "NamXBDen": 2025,
  "TrongSo": 1.5,
  "ThuTu": 1
}
```

---

## 4. Ví Dụ Tạo Form Hoàn Chỉnh

### 4.1. Script Node.js tạo form tự động

```javascript
import pool from '../config/connectDatabase.js';

// ============== HELPER FUNCTIONS ==============

async function createQuestion(formId, noiDung, loai, batBuoc = 0, thuTu = 0) {
  const [result] = await pool.query(
    `INSERT INTO cauhoi_sothich (MaForm, NoiDungCauHoi, LoaiCauHoi, BatBuoc, ThuTu)
     VALUES (?, ?, ?, ?, ?)`,
    [formId, noiDung, loai, batBuoc, thuTu]
  );
  return result.insertId;
}

async function createOption(questionId, noiDung, config = {}) {
  const {
    MaTL = null, MaTG = null, HinhThuc = null, MaKhoangGia = null,
    NamXBTu = null, NamXBDen = null, SoTrangTu = null, SoTrangDen = null,
    TrongSo = 1.0, ThuTu = 0
  } = config;

  await pool.query(
    `INSERT INTO luachon_cauhoi 
     (MaCauHoi, NoiDungLuaChon, MaTL, MaTG, HinhThuc, MaKhoangGia, 
      NamXBTu, NamXBDen, SoTrangTu, SoTrangDen, TrongSo, ThuTu)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [questionId, noiDung, MaTL, MaTG, HinhThuc, MaKhoangGia, 
     NamXBTu, NamXBDen, SoTrangTu, SoTrangDen, TrongSo, ThuTu]
  );
}

// ============== MAIN ==============
async function main() {
  const FORM_ID = 1;

  // Câu 1: Thể loại yêu thích
  const q1 = await createQuestion(FORM_ID, 'Thể loại sách yêu thích?', 'entity_theloai', 1, 1);
  await createOption(q1, 'Manga', { MaTL: 5, TrongSo: 2.0, ThuTu: 1 });
  await createOption(q1, 'Light Novel', { MaTL: 8, TrongSo: 2.0, ThuTu: 2 });
  await createOption(q1, 'Trinh thám', { MaTL: 10, TrongSo: 2.0, ThuTu: 3 });

  // Câu 2: Khoảng giá
  const q2 = await createQuestion(FORM_ID, 'Ngân sách mua sách?', 'entity_khoanggia', 1, 2);
  await createOption(q2, 'Dưới 100.000đ', { MaKhoangGia: 'LT100', TrongSo: 1.0, ThuTu: 1 });
  await createOption(q2, '100.000đ - 200.000đ', { MaKhoangGia: '100-200', TrongSo: 1.0, ThuTu: 2 });
  await createOption(q2, '200.000đ - 300.000đ', { MaKhoangGia: '200-300', TrongSo: 1.0, ThuTu: 3 });

  // Câu 3: Hình thức sách
  const q3 = await createQuestion(FORM_ID, 'Hình thức sách ưa thích?', 'entity_hinhthuc', 0, 3);
  await createOption(q3, 'Bìa cứng', { HinhThuc: 'Bìa cứng', TrongSo: 1.2, ThuTu: 1 });
  await createOption(q3, 'Bìa mềm', { HinhThuc: 'Bìa mềm', TrongSo: 1.2, ThuTu: 2 });

  // Câu 4: Độ dày sách
  const q4 = await createQuestion(FORM_ID, 'Bạn thích sách dày hay mỏng?', 'entity_sotrang', 0, 4);
  await createOption(q4, 'Mỏng (< 200 trang)', { SoTrangTu: 1, SoTrangDen: 200, TrongSo: 1.0, ThuTu: 1 });
  await createOption(q4, 'Trung bình (200-400 trang)', { SoTrangTu: 200, SoTrangDen: 400, TrongSo: 1.0, ThuTu: 2 });
  await createOption(q4, 'Dày (> 400 trang)', { SoTrangTu: 400, SoTrangDen: 9999, TrongSo: 1.0, ThuTu: 3 });

  console.log('✅ Form created successfully!');
}

main();
```

---

## 5. Luồng Xử Lý Khi Khách Hàng Trả Lời

### 5.1. Sơ đồ luồng xử lý

```
┌──────────────────────────────────────────────────────────────────────────┐
│                    LUỒNG XỬ LÝ CÂU TRẢ LỜI                               │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   KHÁCH HÀNG                                                             │
│       │                                                                  │
│       ▼                                                                  │
│   ┌─────────────────────────┐                                           │
│   │ 1. Điền form sở thích   │                                           │
│   │    (preference-widget)  │                                           │
│   └───────────┬─────────────┘                                           │
│               │                                                          │
│               ▼                                                          │
│   ┌─────────────────────────┐                                           │
│   │ 2. Submit API           │    POST /api/preferences/submit           │
│   │    { makh, formId,      │                                           │
│   │      answers[], consent }│                                          │
│   └───────────┬─────────────┘                                           │
│               │                                                          │
│               ▼                                                          │
│   ┌─────────────────────────┐                                           │
│   │ 3. Lưu phanhoi_sothich  │    Tạo bản ghi phản hồi                   │
│   └───────────┬─────────────┘                                           │
│               │                                                          │
│               ▼                                                          │
│   ┌─────────────────────────┐                                           │
│   │ 4. Lưu traloi_sothich   │    Chi tiết từng câu trả lời             │
│   └───────────┬─────────────┘                                           │
│               │                                                          │
│               ▼                                                          │
│   ┌─────────────────────────┐                                           │
│   │ 5. Tính điểm sở thích   │    calculatePreferenceScores()           │
│   │    → diem_sothich_khach │                                           │
│   └───────────┬─────────────┘                                           │
│               │                                                          │
│               ▼                                                          │
│   ┌─────────────────────────┐                                           │
│   │ 6. Phát coupon (nếu có) │    Gán mã freeship cho khách             │
│   └─────────────────────────┘                                           │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

### 5.2. Cấu trúc dữ liệu khi Submit

```json
{
  "makh": 123,
  "formId": 5,
  "consent": true,
  "answers": [
    {
      "questionId": 15,
      "optionId": 101,
      "freeText": null,
      "rating": null
    },
    {
      "questionId": 15,
      "optionId": 102,
      "freeText": null,
      "rating": null
    },
    {
      "questionId": 18,
      "optionId": null,
      "freeText": "Tôi thích sách lịch sử",
      "rating": null
    },
    {
      "questionId": 19,
      "optionId": null,
      "freeText": null,
      "rating": 5
    }
  ]
}
```

---

## 6. Cách Tính Điểm Sở Thích (TrongSo)

### 6.1. Quy tắc trọng số

| Mức độ quan trọng | TrongSo | Ví dụ |
|-------------------|---------|-------|
| Rất quan trọng | 2.0 - 3.0 | Thể loại yêu thích nhất |
| Quan trọng | 1.5 - 2.0 | Tác giả yêu thích |
| Bình thường | 1.0 - 1.5 | Hình thức sách, năm XB |
| Ít quan trọng | 0.5 - 1.0 | Tiêu chí phụ |

### 6.2. Công thức tính điểm khi match sản phẩm

```
DiemSanPham = Σ (DiemSoThich[tiêu_chí] × TrongSo[tiêu_chí])

Trong đó:
- Thể loại:  × 0.35 (35%)
- Tác giả:   × 0.30 (30%)
- Hình thức: × 0.15 (15%)
- Khoảng giá: × 0.10 (10%)
- Năm XB:    × 0.05 (5%)
- Số trang:  × 0.05 (5%)
```

---

## 7. API Reference

### 7.1. Admin APIs

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/api/admin/preference-forms` | Lấy danh sách forms |
| POST | `/api/admin/preference-forms` | Tạo form mới |
| GET | `/api/admin/preference-forms/:id` | Chi tiết form |
| PUT | `/api/admin/preference-forms/:id` | Cập nhật form |
| DELETE | `/api/admin/preference-forms/:id` | Xóa form |
| POST | `/api/admin/questions` | Tạo câu hỏi |
| DELETE | `/api/admin/questions/:id` | Xóa câu hỏi |
| POST | `/api/admin/options` | Tạo lựa chọn |
| DELETE | `/api/admin/options/:id` | Xóa lựa chọn |
| GET | `/api/admin/preference-forms/:id/responses` | Xem phản hồi |

### 7.2. Client APIs

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/api/preferences/form` | Lấy form đang active |
| POST | `/api/preferences/submit` | Submit câu trả lời |
| GET | `/api/preferences/check?makh=X` | Kiểm tra đã điền chưa |
| GET | `/api/preferences/recommendations?makh=X` | Lấy gợi ý sản phẩm |

---

## 8. Best Practices

### 8.1. Thiết kế câu hỏi tốt

| ✅ Nên | ❌ Không nên |
|--------|-------------|
| Ngắn gọn, rõ ràng | Dài dòng, khó hiểu |
| 5-7 câu hỏi | Quá 10 câu hỏi |
| Đa dạng loại câu hỏi | Chỉ dùng 1 loại |
| Có BatBuoc cho câu quan trọng | Tất cả đều bắt buộc |
| TrongSo phù hợp | TrongSo giống nhau |

### 8.2. Thứ tự câu hỏi hợp lý

```
1. Thể loại yêu thích (quan trọng nhất - BatBuoc=1)
2. Tác giả yêu thích (quan trọng - BatBuoc=0)
3. Khoảng giá (thực tế - BatBuoc=1)
4. Hình thức sách (tùy chọn)
5. Năm xuất bản (tùy chọn)
6. Độ dày sách (tùy chọn)
7. Góp ý thêm (text - tùy chọn)
```

---

## 9. Troubleshooting

| Vấn đề | Nguyên nhân | Giải pháp |
|--------|-------------|-----------|
| Form không hiển thị | TrangThai = 0 | Đặt TrangThai = 1 |
| Không có options | Chưa tạo luachon_cauhoi | Thêm options cho câu hỏi |
| Điểm không được tính | TrongSo = 0 hoặc NULL | Đặt TrongSo > 0 |
| Entity không match | MaTL/MaTG không tồn tại | Kiểm tra FK references |
| Khoảng giá lỗi | MaKhoangGia không hợp lệ | Dùng giá trị ENUM đúng |

---

## 10. Checklist Tạo Form

- [ ] Tạo bản ghi trong `form_sothich` với TrangThai = 1
- [ ] Thêm các câu hỏi với LoaiCauHoi phù hợp
- [ ] Đặt ThuTu cho câu hỏi (1, 2, 3...)
- [ ] Đánh dấu BatBuoc cho câu quan trọng
- [ ] Thêm đầy đủ options cho mỗi câu hỏi
- [ ] Gán đúng entity IDs (MaTL, MaTG...) cho options
- [ ] Cấu hình TrongSo phù hợp
- [ ] Liên kết MaKM (coupon) nếu cần
- [ ] Test form trên giao diện khách hàng
- [ ] Kiểm tra điểm được tính đúng sau khi submit
