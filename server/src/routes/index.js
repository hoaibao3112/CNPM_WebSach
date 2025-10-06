import authRoutes from './auth.js';
import productRoutes from './productRoutes.js'; // Thêm route sản phẩm
import categoryRoutes from './category.js';
import  company from './company.js';
import accountRoutes from './account.js';
import userRoutes from './Users.js';
import LoginRoutes from './LoginRoutes.js';
import forgotPasswordRoutes from './forgotPassword.js';
import roleRoutes from './roleRoutes.js';
import Client from  './client.js';
import orderRoutes from './orderRoutes.js';
import Receipt from './receipt.js';
import KhuyenMai from './khuyenmai.js'
import reportRoutes from './reportRoutes.js';
import ChatRoutes from './chatRoute.js';
//import reportRoutes from './routes/reportRoutes.js';
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


import VoucherRoutes from './voucher.js';
import AttendanceAdmin from './AttendanceAdmin.js';
export const initRoutes = (app) => {
  app.use('/auth', authRoutes);
  app.use('/api/product', productRoutes); // Đăng ký API sản phẩm
  app.use('/api/category', categoryRoutes);
  app.use('/api/company',company);
  app.use('/api/accounts', accountRoutes);
  app.use('/api/users',userRoutes);
  app.use('/api/login',LoginRoutes);
  app.use('/api/forgot-password', forgotPasswordRoutes); 
  app.use('/api/roles', roleRoutes); 
  console.log('Attached /api/roles with roleRoutes');
  app.use('/api/client',Client);
  app.use('/api/orders', orderRoutes); 
  app.use('/api/receipt',Receipt);
  app.use('/api/khuyenmai',KhuyenMai);
  app.use('/api/reports',reportRoutes);
  app.use('/api/chat',ChatRoutes);
  app.use('/api/reports', reportRoutes);
  app.use('/api/permissions', permissionRoutes);
  app.use('/api/author',Author);
  app.use('/api/comments',Comment);
  app.use('/api/salary',Salary);
  app.use('/api/support', faq);
  app.use('/api/leave', leaveRoutes);
  app.use('/api/openai', ChatRoutesOpenAI);
  app.use('/api/ratings', ratingsRoutes);
  app.use('/api/attendance', attendanceRoutes);
  app.use('/api/cart',cart);
  app.use('/api/voucher', VoucherRoutes);
  app.use('/api/attendance_admin',AttendanceAdmin);
};
