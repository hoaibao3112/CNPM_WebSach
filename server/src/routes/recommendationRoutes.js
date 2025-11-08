import express from 'express';
import {
  getPersonalizedRecommendations,
  getRecommendationsByCategory,
  getRecommendationsByAuthor,
  getSimilarProducts,
  getPreferenceInsights
} from '../controllers/recommendationController.js';

const router = express.Router();

/**
 * @route   GET /api/recommendations/personalized
 * @desc    Lấy sản phẩm gợi ý cá nhân hóa dựa trên sở thích
 * @access  Private
 * @params  makh, limit (optional), offset (optional)
 */
router.get('/personalized', getPersonalizedRecommendations);

/**
 * @route   GET /api/recommendations/by-category
 * @desc    Lấy sản phẩm theo thể loại yêu thích
 * @access  Private
 * @params  makh, limit (optional)
 */
router.get('/by-category', getRecommendationsByCategory);

/**
 * @route   GET /api/recommendations/by-author
 * @desc    Lấy sản phẩm theo tác giả yêu thích
 * @access  Private
 * @params  makh, limit (optional)
 */
router.get('/by-author', getRecommendationsByAuthor);

/**
 * @route   GET /api/recommendations/similar
 * @desc    Lấy sản phẩm tương tự với sản phẩm đang xem
 * @access  Public
 * @params  productId, makh (optional), limit (optional)
 */
router.get('/similar', getSimilarProducts);

/**
 * @route   GET /api/recommendations/insights
 * @desc    Phân tích insight sở thích khách hàng
 * @access  Private
 * @params  makh
 */
router.get('/insights', getPreferenceInsights);

export default router;
