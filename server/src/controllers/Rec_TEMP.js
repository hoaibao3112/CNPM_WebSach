import RecommendationService from '../services/RecommendationService.js';
import baseController from './baseController.js';

class RecommendationController {
  async getPersonalized(req, res) {
    try {
      const makh = req.user?.makh || req.query.makh;
      if (!makh) return baseController.sendError(res, 'Thiếu makh', 400);
      const data = await RecommendationService.getPersonalized(makh, req.query);
      return baseController.sendSuccess(res, data);
    } catch (error) {
      return baseController.sendError(res, 'Lỗi lấy gợi ý', 500, error.message);
    }
  }
}

export default new RecommendationController();
