// ...existing code...
import authRoutes from './auth.js';
import productRoutes from './productRoutes.js'; // Thêm route sản phẩm
import categoryRoutes from './category.js';
import company from './company.js';
import accountRoutes from './account.js';
import userRoutes from './Users.js';
import LoginRoutes from './LoginRoutes.js';
import forgotPasswordRoutes from './forgotPassword.js';
import roleRoutes from './roleRoutes.js';
import Client from './client.js';
import orderRoutes from './orderRoutes.js';
import Receipt from './receipt.js';
import KhuyenMai from './khuyenmai.js';
import reportRoutes from './reportRoutes.js';
import ChatRoutes from './chatRoutes.js';
import returnRoutes from './returnRoutes.js';
import permissionRoutes from './authMiddleware.js';
import Author from './author.js';
import ratingsRoutes from './ratings.js';
import Comment from './comment.js';
import Salary from './salary.js';
import attendanceRoutes from './attendance.js';
import leaveRoutes from './leave.js';
import faq from './faq.js'; // Thêm route FAQ
import ChatRoutesOpenAI from './chatRouteOpenAI.js';
import cart from './cart.js';
import maproutes from './MapRoute.js';
import order_review from './orderreview.js';
import VoucherRoutes from './voucher.js';
import AttendanceAdmin from './AttendanceAdmin.js';
import bookRoutes from './book.js';
import recommendationsRoutes from './recommendations.js';
import addressRoutes from './address.js';
import preferenceRoutes from './preferenceRoutes.js';
import favoritesRoutes from './favoritesRoutes.js';
import couponRoutes from './couponRoutes.js';
import recommendationRoutes from './recommendationRoutes.js';
import refundRoutes from './refundRoutes.js';

export const initRoutes = (app) => {
  // Root path - Server status
  app.get('/', (req, res) => {
    res.json({
      status: 'OK',
      message: '🎉 CNPM WebSach API Server đang chạy!',
      version: '1.0.0',
      endpoints: {
        auth: '/auth',
        products: '/api/product',
        categories: '/api/category',
        users: '/api/users',
        login: '/api/login',
        orders: '/api/orders',
        cart: '/api/cart',
        chat: '/api/chat',
        // ... thêm các endpoints quan trọng khác
      },
      documentation: 'Xem README.md để biết thêm chi tiết về API'
    });
  });

  // Mount auth routes
  app.use('/auth', authRoutes);

  // Add logout route specifically at /api/logout for Sidebar compatibility
  app.use('/api/logout', authRoutes); // Only the logout endpoint

  app.use('/api/product', productRoutes); // Đăng ký API sản phẩm
  app.use('/api/category', categoryRoutes);
  app.use('/api/company', company);
  app.use('/api/accounts', accountRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/login', LoginRoutes); // This should be reached first for login
  app.use('/api/forgot-password', forgotPasswordRoutes);
  app.use('/api/roles', roleRoutes);
  console.log('Attached /api/roles with roleRoutes');
  app.use('/api/client', Client);
  app.use('/api/orders', orderRoutes);
  app.use('/api/refunds', refundRoutes);
  app.use('/api/receipt', Receipt);
  app.use('/api/khuyenmai', KhuyenMai);
  app.use('/api/reports', reportRoutes);
  app.use('/api/chat', ChatRoutes);
  // Use Vietnamese route path so frontend requests to /api/tra-hang match
  app.use('/api/tra-hang', returnRoutes);
  app.use('/api/map', maproutes);
  // NOTE: ensure permissionRoutes exports an Express router; if it's a middleware function adjust usage accordingly
  app.use('/api/permissions', permissionRoutes);
  app.use('/api/author', Author);
  app.use('/api/comments', Comment);
  app.use('/api/salary', Salary);
  app.use('/api/support', faq);
  app.use('/api/leave', leaveRoutes);
  app.use('/api/openai', ChatRoutesOpenAI);
  app.use('/api/ratings', ratingsRoutes);
  app.use('/api/attendance', attendanceRoutes);
  app.use('/api/cart', cart);
  app.use('/api/voucher', VoucherRoutes);
  app.use('/api/attendance_admin', AttendanceAdmin);
  app.use('/api/books', bookRoutes);
  app.use('/api/orderreview', order_review);
  app.use('/api/recommendations', recommendationsRoutes);
  app.use('/api/address', addressRoutes);
  app.use('/api/preferences', preferenceRoutes);
  app.use('/api/favorites', favoritesRoutes);
  app.use('/api/coupons', couponRoutes);
  app.use('/api/recommendation', recommendationRoutes);
};