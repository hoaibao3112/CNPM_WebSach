import express from 'express';
import {
  addFavorite,
  removeFavorite,
  getFavorites,
  checkFavorite,
  getFavoritesCount,
  getSimilarToFavorites
} from '../controllers/favoritesController.js';

const router = express.Router();

/**
 * @route   POST /api/favorites
 * @desc    Thêm sản phẩm vào danh sách yêu thích
 * @access  Private
 */
router.post('/', addFavorite);

/**
 * @route   DELETE /api/favorites/:MaSP
 * @desc    Xóa sản phẩm khỏi danh sách yêu thích
 * @access  Private
 */
router.delete('/:MaSP', removeFavorite);

/**
 * @route   GET /api/favorites
 * @desc    Lấy danh sách sản phẩm yêu thích
 * @access  Private
 */
router.get('/', getFavorites);

/**
 * @route   GET /api/favorites/check
 * @desc    Kiểm tra sản phẩm có trong yêu thích không
 * @access  Private
 */
router.get('/check', checkFavorite);

/**
 * @route   GET /api/favorites/count
 * @desc    Đếm số lượng sản phẩm yêu thích
 * @access  Private
 */
router.get('/count', getFavoritesCount);

/**
 * @route   GET /api/favorites/similar
 * @desc    Lấy sản phẩm tương tự dựa trên favorites
 * @access  Private
 */
router.get('/similar', getSimilarToFavorites);

export default router;
