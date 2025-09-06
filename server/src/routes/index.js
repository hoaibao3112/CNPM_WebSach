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
import permissionRoutes from './authMiddleware.js';
import Author from './author.js';
import Comment from './comment.js';
import Salary from './salary.js';
import attendanceRoutes from './attendance.js';
import leaveRoutes from './leave.js';
import cart from './cart.js';
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
  app.use('/api/permissions', permissionRoutes);
  app.use('/api/author',Author);
  app.use('/api/comments',Comment);
  app.use('/api/salary',Salary);
  app.use('/api/leave', leaveRoutes);
  app.use('/api/attendance', attendanceRoutes);
  app.use('/api/cart',cart);
};
