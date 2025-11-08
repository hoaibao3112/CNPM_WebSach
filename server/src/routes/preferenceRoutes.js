import express from 'express';
import {
  getActiveForm,
  submitPreferences,
  getRecommendations,
  checkPreferences,
  getAllForms,
  createForm,
  getFormDetail,
  updateForm,
  deleteForm,
  getFormResponses,
  createQuestion,
  deleteQuestion,
  createOption,
  deleteOption
} from '../controllers/preferenceController.js';

const router = express.Router();

// ============== CLIENT ROUTES ==============

/**
 * @route   GET /api/preferences/form
 * @desc    Lấy form sở thích đang hoạt động
 * @access  Public
 */
router.get('/form', getActiveForm);

/**
 * @route   POST /api/preferences/submit
 * @desc    Submit form sở thích + nhận coupon freeship
 * @access  Private (cần auth middleware nếu có)
 */
router.post('/submit', submitPreferences);

/**
 * @route   GET /api/preferences/recommendations
 * @desc    Lấy gợi ý sản phẩm dựa trên sở thích
 * @access  Private
 */
router.get('/recommendations', getRecommendations);

/**
 * @route   GET /api/preferences/check
 * @desc    Kiểm tra khách hàng đã có sở thích chưa
 * @access  Private
 */
router.get('/check', checkPreferences);

// ============== ADMIN ROUTES ==============

/**
 * @route   GET /api/preferences/admin/forms
 * @desc    Lấy danh sách tất cả forms (Admin)
 * @access  Admin only
 */
router.get('/admin/forms', getAllForms);

/**
 * @route   POST /api/preferences/admin/forms
 * @desc    Tạo form mới (Admin)
 * @access  Admin only
 */
router.post('/admin/forms', createForm);

/**
 * @route   GET /api/preferences/admin/forms/:id
 * @desc    Lấy chi tiết form (Admin)
 * @access  Admin only
 */
router.get('/admin/forms/:id', getFormDetail);

/**
 * @route   PUT /api/preferences/admin/forms/:id
 * @desc    Cập nhật form (Admin)
 * @access  Admin only
 */
router.put('/admin/forms/:id', updateForm);

/**
 * @route   DELETE /api/preferences/admin/forms/:id
 * @desc    Xóa form (Admin)
 * @access  Admin only
 */
router.delete('/admin/forms/:id', deleteForm);

/**
 * @route   GET /api/preferences/admin/forms/:id/responses
 * @desc    Lấy danh sách phản hồi của form (Admin)
 * @access  Admin only
 */
router.get('/admin/forms/:id/responses', getFormResponses);

/**
 * @route   POST /api/preferences/admin/questions
 * @desc    Tạo câu hỏi mới (Admin)
 * @access  Admin only
 */
router.post('/admin/questions', createQuestion);

/**
 * @route   DELETE /api/preferences/admin/questions/:id
 * @desc    Xóa câu hỏi (Admin)
 * @access  Admin only
 */
router.delete('/admin/questions/:id', deleteQuestion);

/**
 * @route   POST /api/preferences/admin/options
 * @desc    Tạo lựa chọn mới (Admin)
 * @access  Admin only
 */
router.post('/admin/options', createOption);

/**
 * @route   DELETE /api/preferences/admin/options/:id
 * @desc    Xóa lựa chọn (Admin)
 * @access  Admin only
 */
router.delete('/admin/options/:id', deleteOption);

export default router;
