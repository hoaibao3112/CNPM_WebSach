import express from 'express';
import pool from '../config/connectDatabase.js';

const router = express.Router();

// Utility: normalize date input to YYYY-MM-DD string
const toDateString = (d) => {
  const date = d instanceof Date ? d : new Date(d);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

// 1. GET /api/attendance/monthly - Lấy dữ liệu chấm công theo tháng/năm
router.get('/monthly', async (req, res) => {
  try {
    const { month, year } = req.query;
    if (!month || !year) {
      return res.status(400).json({ error: 'Month and year are required' });
    }

    const [rows] = await pool.query(
      'SELECT tk.MaTK AS MaNV, tk.TenTK AS TenNV, cc.ngay, cc.trang_thai, cc.ghi_chu ' +
      'FROM taikhoan tk ' +
      'LEFT JOIN cham_cong cc ON tk.MaTK = cc.MaTK AND MONTH(cc.ngay) = ? AND YEAR(cc.ngay) = ? ' +
      'WHERE tk.TinhTrang = 1 ' +
      'ORDER BY tk.MaTK, cc.ngay',
      [parseInt(month), parseInt(year)]
    );

    // Chuyển đổi dữ liệu thành định dạng phù hợp với bảng (mảng nhân viên với mảng ngày)
    const attendanceData = {};
    rows.forEach(row => {
      if (!attendanceData[row.MaNV]) {
        attendanceData[row.MaNV] = {
          MaNV: row.MaNV,
          TenNV: row.TenNV,
          days: {}
        };
      }
      attendanceData[row.MaNV].days[row.ngay ? row.ngay.getDate() : null] = {
        trang_thai: row.trang_thai || 'Chua_cham_cong',
        ghi_chu: row.ghi_chu || ''
      };
    });

    const result = Object.values(attendanceData);
    res.json(result);
  } catch (error) {
    console.error('Error fetching attendance:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 2. PUT /api/attendance/update - Cập nhật trạng thái chấm công
router.put('/update', async (req, res) => {
  try {
    const { MaTK, ngay, trang_thai, gio_vao, gio_ra, ghi_chu } = req.body;
    if (!MaTK || !ngay || !trang_thai) {
      return res.status(400).json({ error: 'MaTK, ngay, and trang_thai are required' });
    }

    // Kiểm tra ngày hợp lệ
    const date = new Date(ngay);
    if (isNaN(date.getTime())) {
      return res.status(400).json({ error: 'Invalid date format' });
    }

    // Kiểm tra trạng thái hợp lệ
    const validStates = ['Di_lam', 'Nghi_phep', 'Nghi_khong_phep', 'Lam_them', 'Di_tre'];
    if (!validStates.includes(trang_thai)) {
      return res.status(400).json({ error: 'Invalid trang_thai value' });
    }

    // Kiểm tra xem bản ghi đã tồn tại chưa
    const [existing] = await pool.query(
      'SELECT id FROM cham_cong WHERE MaTK = ? AND ngay = ?',
      [MaTK, date]
    );

    if (existing.length > 0) {
      // Update bản ghi hiện có
      await pool.query(
        'UPDATE cham_cong SET trang_thai = ?, gio_vao = ?, gio_ra = ?, ghi_chu = ? WHERE MaTK = ? AND ngay = ?',
        [trang_thai, gio_vao || null, gio_ra || null, ghi_chu || '', MaTK, date]
      );
    } else {
      // Insert bản ghi mới
      await pool.query(
        'INSERT INTO cham_cong (MaTK, ngay, trang_thai, gio_vao, gio_ra, ghi_chu) VALUES (?, ?, ?, ?, ?, ?)',
        [MaTK, date, trang_thai, gio_vao || null, gio_ra || null, ghi_chu || '']
      );
    }

    res.json({ message: 'Attendance updated successfully' });
  } catch (error) {
    console.error('Error updating attendance:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 3. POST /api/attendance/sync-leave - Đồng bộ nghỉ phép vào chấm công
router.post('/sync-leave', async (req, res) => {
  try {
    const [leaveRequests] = await pool.query(
      'SELECT MaTK, ngay_bat_dau, ngay_ket_thuc, trang_thai ' +
      'FROM xin_nghi_phep WHERE trang_thai = ?',
      ['Da_duyet']
    );

    for (const request of leaveRequests) {
      const { MaTK, ngay_bat_dau, ngay_ket_thuc } = request;
      const startDate = new Date(ngay_bat_dau);
      const endDate = new Date(ngay_ket_thuc);

      let currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        // Kiểm tra xem đã có bản ghi chấm công chưa
        const [existing] = await pool.query(
          'SELECT id FROM cham_cong WHERE MaTK = ? AND ngay = ?',
          [MaTK, currentDate]
        );

        if (existing.length > 0) {
          await pool.query(
            'UPDATE cham_cong SET trang_thai = ? WHERE MaTK = ? AND ngay = ?',
            ['Nghi_phep', MaTK, currentDate]
          );
        } else {
          await pool.query(
            'INSERT INTO cham_cong (MaTK, ngay, trang_thai) VALUES (?, ?, ?)',
            [MaTK, currentDate, 'Nghi_phep']
          );
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }

    res.json({ message: 'Leave requests synced successfully' });
  } catch (error) {
    console.error('Error syncing leave:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 4. POST /api/attendance_admin/sync-missed - Đồng bộ những ngày chưa chấm công
//    Nếu nhân viên chưa có bản ghi chấm công cho ngày đó => insert 'Nghi_khong_phep'
//    Nếu có đơn nghỉ đã duyệt bao phủ ngày đó => insert/update 'Nghi_phep'
//    Body (optional): { date: 'YYYY-MM-DD' } - nếu không truyền sẽ dùng ngày hôm qua
router.post('/sync-missed', async (req, res) => {
  try {
    const { date } = req.body || {};
    const targetDate = date ? toDateString(date) : toDateString(new Date(Date.now() - 24 * 60 * 60 * 1000));

    // Get all active accounts
    const [accounts] = await pool.query('SELECT MaTK FROM taikhoan WHERE TinhTrang = 1');

    for (const acc of accounts) {
      const MaTK = acc.MaTK;

      // Check if attendance record exists for that date
      const [existing] = await pool.query(
        'SELECT id FROM cham_cong WHERE MaTK = ? AND DATE(ngay) = ?',
        [MaTK, targetDate]
      );

      if (existing.length > 0) continue; // already has an attendance record

      // Check approved leave covering that date
      const [leaveRows] = await pool.query(
        'SELECT id FROM xin_nghi_phep WHERE MaTK = ? AND trang_thai = ? AND DATE(?) BETWEEN DATE(ngay_bat_dau) AND DATE(ngay_ket_thuc)',
        [MaTK, 'Da_duyet', targetDate]
      );

      const statusToInsert = leaveRows.length > 0 ? 'Nghi_phep' : 'Nghi_khong_phep';

      await pool.query(
        'INSERT INTO cham_cong (MaTK, ngay, trang_thai, ghi_chu) VALUES (?, ?, ?, ?)',
        [MaTK, targetDate, statusToInsert, statusToInsert === 'Nghi_phep' ? 'Tự động đồng bộ nghỉ phép' : 'Tự động đánh dấu nghỉ không phép']
      );
    }

    res.json({ message: 'Missed attendance synced', date: targetDate });
  } catch (error) {
    console.error('Error syncing missed attendance:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Export function to allow server-side scheduled task to call it directly
export const syncMissedAttendancesForDate = async (dateParam) => {
  const targetDate = dateParam ? toDateString(dateParam) : toDateString(new Date(Date.now() - 24 * 60 * 60 * 1000));
  // Get all active accounts
  const [accounts] = await pool.query('SELECT MaTK FROM taikhoan WHERE TinhTrang = 1');

  for (const acc of accounts) {
    const MaTK = acc.MaTK;

    const [existing] = await pool.query(
      'SELECT id FROM cham_cong WHERE MaTK = ? AND DATE(ngay) = ?',
      [MaTK, targetDate]
    );

    if (existing.length > 0) continue;

    const [leaveRows] = await pool.query(
      'SELECT id FROM xin_nghi_phep WHERE MaTK = ? AND trang_thai = ? AND DATE(?) BETWEEN DATE(ngay_bat_dau) AND DATE(ngay_ket_thuc)',
      [MaTK, 'Da_duyet', targetDate]
    );

    const statusToInsert = leaveRows.length > 0 ? 'Nghi_phep' : 'Nghi_khong_phep';

    await pool.query(
      'INSERT INTO cham_cong (MaTK, ngay, trang_thai, ghi_chu) VALUES (?, ?, ?, ?)',
      [MaTK, targetDate, statusToInsert, statusToInsert === 'Nghi_phep' ? 'Tự động đồng bộ nghỉ phép' : 'Tự động đánh dấu nghỉ không phép']
    );
  }
};

export default router;