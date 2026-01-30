import SalaryService from '../services/SalaryService.js';
import baseController from './baseController.js';

class SalaryController {
    async getMonthlyTotal(req, res) {
        try {
            const data = await SalaryService.getMonthlyTotal(req.params.year);
            return baseController.sendSuccess(res, data);
        } catch (error) {
            return baseController.sendError(res, 'Lỗi lấy tổng lương', 500, error.message);
        }
    }

    async compute(req, res) {
        try {
            const { year, month } = req.params;
            const data = await SalaryService.computeSalary(year, month);
            return baseController.sendSuccess(res, { year, month, data });
        } catch (error) {
            return baseController.sendError(res, 'Lỗi tính toán lương', 500, error.message);
        }
    }
}

export default new SalaryController();
