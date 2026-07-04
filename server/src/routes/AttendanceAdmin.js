/**
 * Attendance Admin Routes
 * Refactored: clean code, logger instead of console.log
 */
import express from 'express';
import pool from '../config/connectDatabase.js';
import logger from '../utils/logger.js';

const router = express.Router();

// Utility: normalize date to YYYY-MM-DD
const toDateString = (d) => {
  const date = d instanceof Date ? d : new Date(d);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const VALID_STATES = ['Di_lam', 'Nghi_phep', 'Nghi_khong_phep', 'Lam_them', 'Di_tre'];

// 1. GET /monthly - Lấy dữ liệu chấm công theo tháng/năm
router.get('/monthly', async (req, res, next) => {
  try {
    const { month, year } = req.query;
    if (!month || !year) {
      return res.status(400).json({ error: 'Month and year are required' });
    }

    const [rows] = await pool.query(
      `SELECT tk.MaTK AS MaNV, tk.TenTK AS TenNV, cc.ngay, cc.trang_thai, cc.ghi_chu
       FROM taikhoan tk
       LEFT JOIN cham_cong cc ON tk.MaTK = cc.MaTK AND MONTH(cc.ngay) = ? AND YEAR(cc.ngay) = ?
       WHERE tk.TinhTrang = 1
       ORDER BY tk.MaTK, cc.ngay`,
      [parseInt(month), parseInt(year)]
    );

    // Group by employee
    const attendanceData = {};
    rows.forEach(row => {
      if (!attendanceData[row.MaNV]) {
        attendanceData[row.MaNV] = { MaNV: row.MaNV, TenNV: row.TenNV, days: {} };
      }
      if (row.ngay) {
        attendanceData[row.MaNV].days[row.ngay.getDate()] = {
          trang_thai: row.trang_thai || 'Chua_cham_cong',
          ghi_chu: row.ghi_chu || ''
        };
      }
    });

    res.json(Object.values(attendanceData));
  } catch (error) { next(error); }
});

// 2. PUT /update - Cập nhật trạng thái chấm công
router.put('/update', async (req, res, next) => {
  try {
    const { MaTK, ngay, trang_thai, gio_vao, gio_ra, ghi_chu } = req.body;
    if (!MaTK || !ngay || !trang_thai) {
      return res.status(400).json({ error: 'MaTK, ngay, and trang_thai are required' });
    }

    const date = new Date(ngay);
    if (isNaN(date.getTime())) {
      return res.status(400).json({ error: 'Invalid date format' });
    }

    if (!VALID_STATES.includes(trang_thai)) {
      return res.status(400).json({ error: 'Invalid trang_thai value' });
    }

    const [existing] = await pool.query('SELECT id FROM cham_cong WHERE MaTK = ? AND ngay = ?', [MaTK, date]);

    if (existing.length > 0) {
      await pool.query(
        'UPDATE cham_cong SET trang_thai = ?, gio_vao = ?, gio_ra = ?, ghi_chu = ? WHERE MaTK = ? AND ngay = ?',
        [trang_thai, gio_vao || null, gio_ra || null, ghi_chu || '', MaTK, date]
      );
    } else {
      await pool.query(
        'INSERT INTO cham_cong (MaTK, ngay, trang_thai, gio_vao, gio_ra, ghi_chu) VALUES (?, ?, ?, ?, ?, ?)',
        [MaTK, date, trang_thai, gio_vao || null, gio_ra || null, ghi_chu || '']
      );
    }

    res.json({ message: 'Attendance updated successfully' });
  } catch (error) { next(error); }
});

// 3. POST /sync-leave - Đồng bộ nghỉ phép vào chấm công
router.post('/sync-leave', async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [leaveRequests] = await connection.query(
      "SELECT MaTK, ngay_bat_dau, ngay_ket_thuc FROM xin_nghi_phep WHERE trang_thai = 'Da_duyet'"
    );

    if (leaveRequests.length === 0) {
      await connection.commit();
      return res.json({ message: 'Leave requests synced successfully', inserted: 0, updated: 0 });
    }

    // Find overall date range
    let minDate = null;
    let maxDate = null;
    for (const request of leaveRequests) {
      const start = new Date(request.ngay_bat_dau);
      const end = new Date(request.ngay_ket_thuc);
      if (!minDate || start < minDate) minDate = start;
      if (!maxDate || end > maxDate) maxDate = end;
    }

    // Fetch all existing cham_cong in this range
    const [existingRows] = await connection.query(
      'SELECT id, MaTK, ngay FROM cham_cong WHERE ngay BETWEEN ? AND ?',
      [minDate, maxDate]
    );

    // Map existing records: "MaTK_YYYY-MM-DD" -> id
    const existingMap = new Map();
    existingRows.forEach(row => {
      const dateStr = toDateString(row.ngay);
      existingMap.set(`${row.MaTK}_${dateStr}`, row.id);
    });

    const inserts = [];
    const updates = [];

    for (const request of leaveRequests) {
      const startDate = new Date(request.ngay_bat_dau);
      const endDate = new Date(request.ngay_ket_thuc);
      let currentDate = new Date(startDate);

      while (currentDate <= endDate) {
        const dateStr = toDateString(currentDate);
        const key = `${request.MaTK}_${dateStr}`;

        if (existingMap.has(key)) {
          updates.push(existingMap.get(key));
        } else {
          inserts.push([
            request.MaTK,
            new Date(currentDate),
            'Nghi_phep'
          ]);
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }

    // Bulk insert new records
    if (inserts.length > 0) {
      await connection.query(
        'INSERT INTO cham_cong (MaTK, ngay, trang_thai) VALUES ?',
        [inserts]
      );
    }

    // Bulk update existing records using their IDs
    if (updates.length > 0) {
      await connection.query(
        "UPDATE cham_cong SET trang_thai = 'Nghi_phep' WHERE id IN (?)",
        [updates]
      );
    }

    await connection.commit();
    res.json({
      message: 'Leave requests synced successfully',
      inserted: inserts.length,
      updated: updates.length
    });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
});

// 4. POST /sync-missed - Đồng bộ ngày chưa chấm công
router.post('/sync-missed', async (req, res, next) => {
  try {
    const { date } = req.body || {};
    const targetDate = date ? toDateString(date) : toDateString(new Date(Date.now() - 24 * 60 * 60 * 1000));

    await syncMissedAttendancesForDate(new Date(targetDate));

    res.json({ message: 'Missed attendance synced', date: targetDate });
  } catch (error) { next(error); }
});

// Exported for server.js scheduled task
export const syncMissedAttendancesForDate = async (dateParam) => {
  const targetDate = dateParam ? toDateString(dateParam) : toDateString(new Date(Date.now() - 24 * 60 * 60 * 1000));

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // 1. Get all active accounts
    const [accounts] = await connection.query('SELECT MaTK FROM taikhoan WHERE TinhTrang = 1');
    if (accounts.length === 0) {
      await connection.commit();
      return;
    }

    // 2. Get all existing cham_cong for target date
    const [existingRows] = await connection.query(
      'SELECT MaTK FROM cham_cong WHERE DATE(ngay) = ?',
      [targetDate]
    );
    const existingMaTKs = new Set(existingRows.map(r => r.MaTK));

    // Filter accounts that do not have attendance records yet
    const missingAccounts = accounts.filter(acc => !existingMaTKs.has(acc.MaTK));
    if (missingAccounts.length === 0) {
      await connection.commit();
      logger.info(`Synced missed attendance for ${targetDate}: 0 records (all active accounts have attendance)`);
      return;
    }

    // 3. Get all approved leave requests covering target date
    const [leaveRows] = await connection.query(
      "SELECT MaTK FROM xin_nghi_phep WHERE trang_thai = 'Da_duyet' AND DATE(?) BETWEEN DATE(ngay_bat_dau) AND DATE(ngay_ket_thuc)",
      [targetDate]
    );
    const leaveMaTKs = new Set(leaveRows.map(r => r.MaTK));

    // Prepare bulk inserts
    const inserts = [];
    for (const acc of missingAccounts) {
      const hasLeave = leaveMaTKs.has(acc.MaTK);
      const status = hasLeave ? 'Nghi_phep' : 'Nghi_khong_phep';
      const note = hasLeave ? 'Tự động đồng bộ nghỉ phép' : 'Tự động đánh dấu nghỉ không phép';
      inserts.push([
        acc.MaTK,
        new Date(targetDate),
        status,
        note
      ]);
    }

    if (inserts.length > 0) {
      await connection.query(
        'INSERT INTO cham_cong (MaTK, ngay, trang_thai, ghi_chu) VALUES ?',
        [inserts]
      );
    }

    await connection.commit();
    logger.info(`Synced missed attendance for ${targetDate}: ${inserts.length} records (Optimized bulk insert)`);
  } catch (error) {
    await connection.rollback();
    logger.error(`Error during missed attendance sync for ${targetDate}:`, error);
    throw error;
  } finally {
    connection.release();
  }
};

export default router;