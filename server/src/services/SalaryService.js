/**
 * Salary Service - Business logic cho tính lương
 * Clean version with logger
 */
import pool from '../config/connectDatabase.js';
import logger from '../utils/logger.js';

class SalaryService {
  async getMonthlyTotal(year) {
    const [rows] = await pool.query(
      `SELECT thang AS Thang, COALESCE(SUM(tong_luong), 0) AS TongLuong
       FROM luong WHERE nam = ?
       GROUP BY thang ORDER BY thang ASC`,
      [year]
    );

    const months = Array.from({ length: 12 }, (_, i) => i + 1);
    return months.map(m => {
      const found = rows.find(r => Number(r.Thang) === m);
      return { Thang: m, TongLuong: found ? Number(found.TongLuong) : 0 };
    });
  }

  async computeSalary(year, month) {
    const [employees] = await pool.query(
      `SELECT tk.MaTK AS MaNV, COALESCE(nv.TenNV, tk.TenTK) AS TenNV
       FROM taikhoan tk
       LEFT JOIN nhanvien nv ON tk.MaTK = nv.MaNV
       WHERE tk.TinhTrang = 1`
    );

    const results = [];

    for (const emp of employees) {
      const [attendance] = await pool.query(
        `SELECT trang_thai, ghi_chu
         FROM cham_cong
         WHERE MaTK = ? AND MONTH(ngay) = ? AND YEAR(ngay) = ?`,
        [emp.MaNV, Number(month), Number(year)]
      );

      // Calculate salary based on attendance
      const baseSalary = 10000000; // Base salary
      const dailyRate = baseSalary / 26; // 26 working days

      let workDays = 0;
      let leaveDays = 0;
      let unpaidLeave = 0;
      let overtimeDays = 0;
      let lateDays = 0;

      for (const record of attendance) {
        switch (record.trang_thai) {
          case 'Di_lam': workDays++; break;
          case 'Nghi_phep': leaveDays++; break;
          case 'Nghi_khong_phep': unpaidLeave++; break;
          case 'Lam_them': overtimeDays++; workDays++; break;
          case 'Di_tre': lateDays++; workDays++; break;
        }
      }

      const totalSalary = Math.round(
        (workDays * dailyRate) +
        (leaveDays * dailyRate) +
        (overtimeDays * dailyRate * 0.5) -  // OT bonus 50%
        (lateDays * dailyRate * 0.1) -       // Late penalty 10%
        (unpaidLeave * dailyRate)
      );

      results.push({
        MaNV: emp.MaNV,
        TenNV: emp.TenNV,
        ngay_cong: workDays,
        nghi_phep: leaveDays,
        nghi_khong_phep: unpaidLeave,
        lam_them: overtimeDays,
        di_tre: lateDays,
        tong_luong: Math.max(0, totalSalary)
      });
    }

    logger.info(`Computed salary for ${results.length} employees`, { year, month });
    return results;
  }

  async getHistory(maNV) {
    const [rows] = await pool.query(
      `SELECT thang, nam, tong_luong, trang_thai
       FROM luong
       WHERE MaNV = ?
       ORDER BY nam DESC, thang DESC`,
      [maNV]
    );
    return rows;
  }
}

export default new SalaryService();
