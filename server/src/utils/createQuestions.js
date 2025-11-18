/**
 * =====================================================
 * HELPER SCRIPT - Tạo câu hỏi & options nhanh cho Admin
 * =====================================================
 * 
 * Chạy script này trong Node.js để tạo câu hỏi mới cho form
 * node server/src/utils/createQuestions.js
 */

import pool from '../config/connectDatabase.js';

// ============== CONFIGURATION ==============
const FORM_ID = 1; // ID của form cần thêm câu hỏi

// ============== HELPER FUNCTIONS ==============

/**
 * Tạo câu hỏi mới
 */
async function createQuestion(formId, noiDung, loai, batBuoc = 0, thuTu = 0) {
  const [result] = await pool.query(
    `INSERT INTO cauhoi_sothich (MaForm, NoiDungCauHoi, LoaiCauHoi, BatBuoc, ThuTu)
     VALUES (?, ?, ?, ?, ?)`,
    [formId, noiDung, loai, batBuoc, thuTu]
  );
  console.log(`✅ Created question: ${noiDung} (ID: ${result.insertId})`);
  return result.insertId;
}

/**
 * Tạo option cho câu hỏi
 */
async function createOption(questionId, noiDung, config = {}) {
  const {
    MaTL = null,
    MaTG = null,
    HinhThuc = null,
    MaKhoangGia = null,
    NamXBTu = null,
    NamXBDen = null,
    SoTrangTu = null,
    SoTrangDen = null,
    TrongSo = 1.0,
    ThuTu = 0
  } = config;

  await pool.query(
    `INSERT INTO luachon_cauhoi 
     (MaCauHoi, NoiDungLuaChon, MaTL, MaTG, HinhThuc, MaKhoangGia, NamXBTu, NamXBDen, SoTrangTu, SoTrangDen, TrongSo, ThuTu)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [questionId, noiDung, MaTL, MaTG, HinhThuc, MaKhoangGia, NamXBTu, NamXBDen, SoTrangTu, SoTrangDen, TrongSo, ThuTu]
  );
  console.log(`  ↳ Option: ${noiDung}`);
}

/**
 * Lấy danh sách thể loại
 */
async function getCategories() {
  const [categories] = await pool.query(
    `SELECT MaTL, TenTL FROM theloai WHERE TinhTrang = b'1' ORDER BY TenTL`
  );
  return categories;
}

/**
 * Lấy danh sách tác giả
 */
async function getAuthors() {
  const [authors] = await pool.query(
    `SELECT MaTG, TenTG FROM tacgia ORDER BY TenTG LIMIT 20`
  );
  return authors;
}

// ============== MAIN SCRIPT ==============

async function main() {
  try {
    console.log('🚀 Starting question creation...\n');

    // Example 1: Thêm câu hỏi thể loại
    console.log('📝 Creating Category Question...');
    const q1 = await createQuestion(
      FORM_ID,
      'Bạn thích đọc thể loại sách nào? (Chọn tối đa 3)',
      'entity_theloai',
      1,
      1
    );

    const categories = await getCategories();
    for (let i = 0; i < Math.min(categories.length, 10); i++) {
      const cat = categories[i];
      await createOption(q1, cat.TenTL, {
        MaTL: cat.MaTL,
        TrongSo: 2.0,
        ThuTu: i + 1
      });
    }

    // Example 2: Thêm câu hỏi tác giả
    console.log('\n📝 Creating Author Question...');
    const q2 = await createQuestion(
      FORM_ID,
      'Tác giả nào bạn yêu thích?',
      'entity_tacgia',
      0,
      2
    );

    const authors = await getAuthors();
    for (let i = 0; i < Math.min(authors.length, 15); i++) {
      const auth = authors[i];
      await createOption(q2, auth.TenTG, {
        MaTG: auth.MaTG,
        TrongSo: 1.5,
        ThuTu: i + 1
      });
    }

    // Example 3: Câu hỏi khoảng giá
    console.log('\n📝 Creating Budget Question...');
    const q3 = await createQuestion(
      FORM_ID,
      'Ngân sách mua sách của bạn thường là?',
      'entity_khoanggia',
      1,
      3
    );

    // More granular ranges from 100k up to 2M
    await createOption(q3, 'Dưới 100.000đ', { MaKhoangGia: 'LT100', TrongSo: 1.0, ThuTu: 1 });
    await createOption(q3, '100.000đ - 200.000đ', { MaKhoangGia: '100-200', TrongSo: 1.0, ThuTu: 2 });
    await createOption(q3, '200.000đ - 300.000đ', { MaKhoangGia: '200-300', TrongSo: 1.0, ThuTu: 3 });
    await createOption(q3, '300.000đ - 400.000đ', { MaKhoangGia: '300-400', TrongSo: 1.0, ThuTu: 4 });
    await createOption(q3, '400.000đ - 500.000đ', { MaKhoangGia: '400-500', TrongSo: 1.0, ThuTu: 5 });
    await createOption(q3, '500.000đ - 700.000đ', { MaKhoangGia: '500-700', TrongSo: 1.0, ThuTu: 6 });
    await createOption(q3, '700.000đ - 1.000.000đ', { MaKhoangGia: '700-1000', TrongSo: 1.0, ThuTu: 7 });
    await createOption(q3, '1.000.000đ - 2.000.000đ', { MaKhoangGia: '1000-2000', TrongSo: 1.0, ThuTu: 8 });
    await createOption(q3, 'Trên 2.000.000đ', { MaKhoangGia: 'GT2000', TrongSo: 1.0, ThuTu: 9 });
    // Keep legacy ranges for compatibility
    await createOption(q3, '300.000đ - 500.000đ (legacy)', { MaKhoangGia: '300-500', TrongSo: 1.0, ThuTu: 10 });
    await createOption(q3, 'Trên 500.000đ (legacy)', { MaKhoangGia: 'GT500', TrongSo: 1.0, ThuTu: 11 });

    // Example 4: Hình thức sách
    console.log('\n📝 Creating Format Question...');
    const q4 = await createQuestion(
      FORM_ID,
      'Bạn thích hình thức sách nào?',
      'entity_hinhthuc',
      0,
      4
    );

    await createOption(q4, 'Bìa cứng', { HinhThuc: 'Bìa cứng', TrongSo: 1.2, ThuTu: 1 });
    await createOption(q4, 'Bìa mềm', { HinhThuc: 'Bìa mềm', TrongSo: 1.2, ThuTu: 2 });
    await createOption(q4, 'Bìa gáy xoắn', { HinhThuc: 'Bìa gáy xoắn', TrongSo: 1.0, ThuTu: 3 });
    await createOption(q4, 'Ebook', { HinhThuc: 'Ebook', TrongSo: 1.0, ThuTu: 4 });

    // Example 5: Năm xuất bản
    console.log('\n📝 Creating Year Question...');
    const q5 = await createQuestion(
      FORM_ID,
      'Bạn thích sách xuất bản khi nào?',
      'entity_namxb',
      0,
      5
    );

    await createOption(q5, 'Sách mới (2023-2025)', { NamXBTu: 2023, NamXBDen: 2025, TrongSo: 1.5, ThuTu: 1 });
    await createOption(q5, 'Gần đây (2020-2022)', { NamXBTu: 2020, NamXBDen: 2022, TrongSo: 1.2, ThuTu: 2 });
    await createOption(q5, 'Kinh điển (trước 2020)', { NamXBTu: 1900, NamXBDen: 2019, TrongSo: 1.0, ThuTu: 3 });

    // Example 6: Độ dày sách
    console.log('\n📝 Creating Page Count Question...');
    const q6 = await createQuestion(
      FORM_ID,
      'Bạn thích độ dày sách như thế nào?',
      'entity_sotrang',
      0,
      6
    );

    await createOption(q6, 'Mỏng nhẹ (< 200 trang)', { SoTrangTu: 1, SoTrangDen: 200, TrongSo: 1.0, ThuTu: 1 });
    await createOption(q6, 'Trung bình (200-400 trang)', { SoTrangTu: 200, SoTrangDen: 400, TrongSo: 1.0, ThuTu: 2 });
    await createOption(q6, 'Dày (> 400 trang)', { SoTrangTu: 400, SoTrangDen: 9999, TrongSo: 1.0, ThuTu: 3 });

    console.log('\n✅ All questions created successfully!');
    console.log('📊 Summary:');
    console.log(`   - Form ID: ${FORM_ID}`);
    console.log(`   - Questions created: 6`);
    console.log(`   - Total options: ${categories.length + authors.length + 15}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Run script
main();

// ============== EXPORT FOR API USE ==============

export {
  createQuestion,
  createOption,
  getCategories,
  getAuthors
};
