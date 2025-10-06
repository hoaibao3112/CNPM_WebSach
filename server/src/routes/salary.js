import express from 'express';
import pool from '../config/connectDatabase.js';

const router = express.Router();

// New: GET /api/luong/monthly/:year
// Returns aggregated total salary per month for the given year (reads from `luong` table).
router.get('/monthly/:year', async (req, res) => {
  try {
    const { year } = req.params;
    const [rows] = await pool.query(
      `SELECT thang AS Thang, COALESCE(SUM(tong_luong), 0) AS TongLuong
       FROM luong
       WHERE nam = ?
       GROUP BY thang
       ORDER BY thang ASC`,
      [year]
    );

    // Ensure months 1..12 are present (fill missing with 0)
    const months = Array.from({ length: 12 }, (_, i) => i + 1);
    const data = months.map((m) => {
      const found = rows.find(r => Number(r.Thang) === m);
      return { Thang: m, TongLuong: found ? Number(found.TongLuong) : 0 };
    });

    res.json({ success: true, year: Number(year), data });
  } catch (error) {
    console.error('Error in GET /monthly/:year', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// New: GET /api/luong/per-month/:year/:month
// Returns per-employee salary records for a specific month/year (reads from `luong`).
router.get('/per-month/:year/:month', async (req, res) => {
  try {
    const { year, month } = req.params;
    const [rows] = await pool.query(
      `SELECT l.*, COALESCE(nv.TenNV, tk.TenTK, l.MaNV) AS TenNV
       FROM luong l
       LEFT JOIN nhanvien nv ON l.MaNV = nv.MaNV
       LEFT JOIN taikhoan tk ON l.MaNV = tk.MaTK
       WHERE l.nam = ? AND l.thang = ?
       ORDER BY TenNV ASC`,
      [year, month]
    );
    res.json({ success: true, year: Number(year), month: Number(month), data: rows });
  } catch (error) {
    console.error('Error in GET /per-month/:year/:month', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// New: POST /api/luong/compute/:year/:month
// Compute salaries on-the-fly from attendance (`cham_cong` / `chamcong`) without saving to DB.
// Returns an array of computed salary objects for all active accounts.
router.post('/compute/:year/:month', async (req, res) => {
  try {
    const { year, month } = req.params;

    // Fetch active accounts (map to MaNV used in luong table)
    const [employees] = await pool.query(
      'SELECT tk.MaTK AS MaNV, COALESCE(nv.TenNV, tk.TenTK) AS TenNV FROM taikhoan tk LEFT JOIN nhanvien nv ON tk.MaTK = nv.MaNV WHERE tk.TinhTrang = 1'
    );

    const results = [];

    for (const emp of employees) {
      // Try two common attendance table names (some projects use cham_cong, others chamcong)
      const attendanceQueries = [
        'SELECT trang_thai, ghi_chu, ngay FROM cham_cong WHERE MaTK = ? AND MONTH(ngay) = ? AND YEAR(ngay) = ?',
        'SELECT trang_thai, ghi_chu, ngay FROM chamcong WHERE MaTK = ? AND MONTH(ngay) = ? AND YEAR(ngay) = ?'
      ];

      let attendance = [];
      for (const q of attendanceQueries) {
        const [att] = await pool.query(q, [emp.MaNV, Number(month), Number(year)]).catch(() => [ [] ]);
        if (att && att.length > 0) { attendance = att; break; }
      }

      let soNgayLam = 0;
      let soGioTangCa = 0;
      let soNgayNghiKhongPhep = 0;
      let soNgayDiTre = 0;

      attendance.forEach((record) => {
        const trangThai = (record.trang_thai || '').toString();
        switch (trangThai) {
          case 'Di_lam':
          case 'Di lam':
          case 'DiLam':
            soNgayLam++;
            break;
          case 'Lam_them':
          case 'Lam them':
          case 'LamThem':
            soNgayLam++;
            const otMatch = (record.ghi_chu || '').toString().match(/(\d+)\s*gi(ờ|gio|g)/i);
            if (otMatch) soGioTangCa += parseInt(otMatch[1]);
            break;
          case 'Nghi_khong_phep':
          case 'Nghi khong phep':
            soNgayNghiKhongPhep++;
            break;
          case 'Di_tre':
          case 'Di tre':
            soNgayDiTre++;
            break;
          default:
            break;
        }
      });

      const luongCoBan = 10000000; // default base salary
      const ngayLamChuan = 22;
      const luongNgay = luongCoBan / ngayLamChuan;
      const luongGio = luongNgay / 8;
      const luongTangCa = soGioTangCa * luongGio * 1.5;
      const phatNghiKhongPhep = soNgayNghiKhongPhep * luongNgay;
      const phatDiTre = soNgayDiTre * (luongNgay * 0.3);
      let thuong = 0;
      if (soNgayLam === ngayLamChuan && soNgayNghiKhongPhep === 0 && soNgayDiTre === 0) thuong = 500000;
      const phu_cap = 0;
      const phat = phatNghiKhongPhep + phatDiTre;
      const tong_luong = Math.round((soNgayLam * luongNgay) + luongTangCa + phu_cap + thuong - phat);

      results.push({
        MaNV: emp.MaNV,
        TenNV: emp.TenNV,
        soNgayLam,
        soGioTangCa,
        soNgayNghiKhongPhep,
        soNgayDiTre,
        luong_co_ban: luongCoBan,
        phu_cap,
        thuong,
        phat,
        tong_luong,
        trang_thai: 'Chưa chi trả'
      });
    }

    res.json({ success: true, year: Number(year), month: Number(month), data: results });
  } catch (error) {
    console.error('Error in POST /compute/:year/:month', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/salary - Lấy danh sách lương
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT l.*, tk.TenTK AS TenNV FROM luong l JOIN taikhoan tk ON l.MaNV = tk.MaTK`
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi lấy danh sách lương', details: error.message });
  }
});

// POST /api/salary - Thêm bản ghi lương mới
router.post('/', async (req, res) => {
  try {
    const { MaNV, thang, nam, luong_co_ban, phu_cap, thuong, phat, tong_luong, trang_thai } = req.body;
    await pool.query(
      `INSERT INTO luong (MaNV, thang, nam, luong_co_ban, phu_cap, thuong, phat, tong_luong, trang_thai)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [MaNV, thang, nam, luong_co_ban || 0, phu_cap || 0, thuong || 0, phat || 0, tong_luong || 0, trang_thai || 'Chưa chi trả']
    );
    res.json({ message: 'Thêm lương thành công' });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi thêm lương', details: error.message });
  }
});

// GET /api/salary/by-manv/:MaNV - Lấy lương theo nhân viên
router.get('/by-manv/:MaNV', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT l.*, tk.TenTK AS TenNV FROM luong l JOIN taikhoan tk ON l.MaNV = tk.MaTK 
       WHERE l.MaNV = ? ORDER BY nam DESC, thang DESC`,
      [req.params.MaNV]
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi lấy lương nhân viên', details: error.message });
  }
});
// ...existing code...

// GET /api/salary/monthly - Tính lương tự động theo tháng/năm
router.get('/monthly', async (req, res) => {
  try {
    const { month, year } = req.query;
    if (!month || !year) {
      return res.status(400).json({ error: 'Month and year are required' });
    }

    // Lấy danh sách nhân viên
    const [employees] = await pool.query(
      'SELECT tk.MaTK AS MaNV, tk.TenTK AS TenNV FROM taikhoan tk WHERE tk.TinhTrang = 1 ORDER BY tk.MaTK'
    );

    const salaryData = [];
    for (const emp of employees) {
      const [attendance] = await pool.query(
        'SELECT trang_thai, ghi_chu FROM cham_cong WHERE MaTK = ? AND MONTH(ngay) = ? AND YEAR(ngay) = ?',
        [emp.MaNV, parseInt(month), parseInt(year)]
      );

      let soNgayLam = 0;
      let soGioTangCa = 0;
      let soNgayNghiKhongPhep = 0;
      let soNgayDiTre = 0;

      attendance.forEach((record) => {
        switch (record.trang_thai) {
          case 'Di_lam':
            soNgayLam++;
            break;
          case 'Lam_them':
            soNgayLam++;
            const otMatch = record.ghi_chu?.match(/Tăng ca (\d+) giờ/);
            if (otMatch) soGioTangCa += parseInt(otMatch[1]);
            break;
          case 'Nghi_khong_phep':
            soNgayNghiKhongPhep++;
            break;
          case 'Di_tre':
            soNgayDiTre++;
            break;
          // Nghi_phep: Có lương, không đếm vào làm hoặc phạt
        }
      });

      const luongCoBan = 10000000; // Mặc định 10 triệu
      const ngayLamChuan = 22; // Số ngày làm chuẩn
      const luongNgay = luongCoBan / ngayLamChuan;
      const luongGio = luongNgay / 8;
      const luongTangCa = soGioTangCa * luongGio * 1.5;
      const phatNghiKhongPhep = soNgayNghiKhongPhep * luongNgay;
      const phatDiTre = soNgayDiTre * (luongNgay * 0.3); // 30% lương ngày cho mỗi lần đi trễ

      // Thưởng: Làm đủ 22 ngày, không nghỉ không phép, không đi trễ thì thưởng 500.000đ
      let thuong = 0;
      if (
        soNgayLam === ngayLamChuan &&
        soNgayNghiKhongPhep === 0 &&
        soNgayDiTre === 0
      ) {
        thuong = 500000;
      }

      // Phụ cấp nhập thủ công, mặc định 0
      const phu_cap = 0;

      // Tổng phạt
      const phat = phatNghiKhongPhep + phatDiTre;

      // Tổng lương
      const tongLuong = (soNgayLam * luongNgay) + luongTangCa + phu_cap + thuong - phat;

      salaryData.push({
        MaNV: emp.MaNV,
        TenNV: emp.TenNV,
        soNgayLam,
        soGioTangCa,
        soNgayNghiKhongPhep,
        soNgayDiTre,
        luong_co_ban: luongCoBan,
        phu_cap,
        thuong,
        phat,
        tong_luong: Math.round(tongLuong),
        trang_thai: 'Chưa chi trả',
      });
    }

    res.json(salaryData);
  } catch (error) {
    console.error('Error fetching salary:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});
// API cập nhật trạng thái lương thành "Đã trả"
router.put('/update-status', async (req, res) => {
  try {
    const { MaNV, thang, nam } = req.body;
    if (!MaNV || !thang || !nam) {
      return res.status(400).json({ error: 'MaNV, thang, and nam are required' });
    }

    await pool.query(
      'UPDATE luong SET trang_thai = ? WHERE MaNV = ? AND thang = ? AND nam = ?',
      ['Da_tra', MaNV, thang, nam]
    );

    res.json({ message: 'Cập nhật trạng thái lương thành ĐÃ TRẢ thành công' });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi cập nhật trạng thái lương', details: error.message });
  }
});

// PUT /api/salary/update - Cập nhật bản ghi lương
router.put('/update', async (req, res) => {
  try {
    const { MaNV, thang, nam, luong_co_ban, phu_cap, thuong, phat, tong_luong, trang_thai } = req.body;
    if (!MaNV || !thang || !nam) {
      return res.status(400).json({ error: 'MaNV, thang, and nam are required' });
    }

    const [existing] = await pool.query(
      'SELECT id FROM luong WHERE MaNV = ? AND thang = ? AND nam = ?',
      [MaNV, thang, nam]
    );

    if (existing.length > 0) {
      await pool.query(
        'UPDATE luong SET luong_co_ban = ?, phu_cap = ?, thuong = ?, phat = ?, tong_luong = ?, trang_thai = ? ' +
        'WHERE MaNV = ? AND thang = ? AND nam = ?',
        [luong_co_ban || 0, phu_cap || 0, thuong || 0, phat || 0, tong_luong || 0, trang_thai || 'Chưa chi trả',
         MaNV, thang, nam]
      );
    } else {
      await pool.query(
        'INSERT INTO luong (MaNV, thang, nam, luong_co_ban, phu_cap, thuong, phat, tong_luong, trang_thai) ' +
        'VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [MaNV, thang, nam, luong_co_ban || 0, phu_cap || 0, thuong || 0, phat || 0, tong_luong || 0, trang_thai || 'Chưa chi trả']
      );
    }

    res.json({ message: 'Cập nhật lương thành công' });
  } catch (error) {
    console.error('Error updating salary:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});
// GET /api/salary/history/:MaNV?nam=2025
router.get('/history/:MaNV', async (req, res) => {
  try {
    const { MaNV } = req.params;
    const { nam } = req.query;
    let sql = `
      SELECT 
        thang, nam, luong_co_ban, phu_cap, thuong, phat, tong_luong, trang_thai
      FROM luong
      WHERE MaNV = ?
    `;
    const params = [MaNV];
    if (nam) {
      sql += ' AND nam = ?';
      params.push(nam);
    }
    sql += ' ORDER BY nam DESC, thang DESC';

    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi lấy lịch sử lương cá nhân', details: error.message });
  }
});

export default router;