import pool from '../config/connectDatabase.js';

class ReportService {
    async getRevenueByYear() {
        const [rows] = await pool.execute(`
      SELECT YEAR(NgayTao) AS Nam,
             COALESCE(SUM(CASE WHEN tinhtrang NOT IN ('Đã hủy') THEN TongTien * 0.7 END), 0) AS Von,
             COALESCE(SUM(CASE WHEN tinhtrang NOT IN ('Đã hủy') THEN TongTien END), 0) AS DoanhThu
      FROM hoadon GROUP BY YEAR(NgayTao) ORDER BY Nam DESC
    `);
        return rows;
    }

    async getRevenueByMonth(year) {
        const [rows] = await pool.execute(`
      SELECT MONTH(NgayTao) AS Thang,
             COALESCE(SUM(CASE WHEN tinhtrang NOT IN ('Đã hủy') THEN TongTien * 0.7 END), 0) AS Von,
             COALESCE(SUM(CASE WHEN tinhtrang NOT IN ('Đã hủy') THEN TongTien END), 0) AS DoanhThu
      FROM hoadon WHERE YEAR(NgayTao) = ? GROUP BY MONTH(NgayTao) ORDER BY Thang ASC
    `, [year]);
        return rows;
    }

    async getOverview(params = {}) {
        const { timeRange, startDate, endDate } = params;
        let dateFilter = '';
        let queryParams = [];

        if (timeRange && timeRange !== 'all') {
            const days = { '7d': 7, '30d': 30, '3m': 90, '6m': 180, '1y': 365 };
            if (days[timeRange]) {
                dateFilter = 'AND NgayTao >= DATE_SUB(NOW(), INTERVAL ? DAY)';
                queryParams.push(days[timeRange]);
            }
        } else if (startDate && endDate) {
            dateFilter = 'AND NgayTao BETWEEN ? AND ?';
            queryParams = [startDate, endDate];
        }

        const [[revenue]] = await pool.query(`SELECT COALESCE(SUM(TongTien), 0) as totalRevenue FROM hoadon WHERE tinhtrang NOT IN ('Đã hủy') ${dateFilter}`, queryParams);
        const [[orders]] = await pool.query(`SELECT COUNT(*) as totalOrders FROM hoadon WHERE 1=1 ${dateFilter}`, queryParams);
        const [[customers]] = await pool.query(`SELECT COUNT(DISTINCT makh) as totalCustomers FROM hoadon WHERE 1=1 ${dateFilter}`, queryParams);

        return {
            totalRevenue: revenue.totalRevenue,
            totalOrders: orders.totalOrders,
            totalCustomers: customers.totalCustomers
        };
    }
}

export default new ReportService();
