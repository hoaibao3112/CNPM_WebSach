import React, { useContext } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Dashboard from '../components/Dashboard';
import ProductManagement from './ProductManagement';
import AccountManagement from './AccountManagement';
import UserManagement from './UserManagement';
import CategoryManagement from './CategoryManagement';
import InvoiceManagement from './InvoiceManagement';
import CompanyManagement from './campanyManagement';
import Authorities from './authorities';
import Client from './client.js';
import Receipt from './receipt.js';
import Statistical from './statistical.js';
import DiscountManagement from './DiscountManagement.js';
import Profile from './Profile';
import { PermissionContext } from '../components/PermissionContext';
import AuthorManagement from './AuthorManagement.js';
import RefundManagement from './RefundManagement.js';
import ReturnManagement from './ReturnManagement.js';
import SalaryPage from './SalaryPage.js';
import AttendancePage from './AttendancePage.js';
import LeavePage from './LeavePage.js';
import RoleManagement from './RoleManagement.js';

// Component bảo vệ route theo quyền
const RestrictedRoute = ({ component: Component, permission }) => {
  const { hasPermission } = useContext(PermissionContext);

  if (!hasPermission(permission, 'Đọc')) {
    return <Navigate to="/admin" replace />;
  }

  return <Component />;
};

const AppAdmin = () => {
  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      <Sidebar />
      <div className="flex-1 transition-all duration-500 ease-in-out pl-0 lg:sidebar-open:pl-72 lg:sidebar-closed:pl-20">
        <div className="p-0">
          <Routes>
            <Route index element={<Dashboard />} />
            <Route path="products" element={<RestrictedRoute component={ProductManagement} permission="Sản phẩm" />} />
            <Route path="account" element={<RestrictedRoute component={AccountManagement} permission="Tài khoản" />} />
            <Route path="users" element={<RestrictedRoute component={UserManagement} permission="Nhân viên" />} />
            <Route path="category" element={<RestrictedRoute component={CategoryManagement} permission="Thể loại" />} />
            <Route path="invoices" element={<RestrictedRoute component={InvoiceManagement} permission="Hóa đơn" />} />
            <Route path="company" element={<RestrictedRoute component={CompanyManagement} permission="Công ty" />} />
            <Route path="roles" element={<RestrictedRoute component={Authorities} permission="Phân quyền" />} />
            <Route path="role-details" element={<RestrictedRoute component={RoleManagement} permission="Phân quyền" />} />
            <Route path="client" element={<RestrictedRoute component={Client} permission="Khách hàng" />} />
            <Route path="receipt" element={<RestrictedRoute component={Receipt} permission="Phiếu nhập" />} />
            <Route path="khuyenmai" element={<RestrictedRoute component={DiscountManagement} permission="Khuyến mãi" />} />
            <Route path="statistical" element={<RestrictedRoute component={Statistical} permission="Thống kê" />} /> 
            <Route path="authorities" element={<RestrictedRoute component={AuthorManagement} permission="Tác giả" />} />
            <Route path="refunds" element={<RestrictedRoute component={RefundManagement} permission="Hoàn tiền đơn hàng" />} />
            <Route path="returns" element={<RestrictedRoute component={ReturnManagement} permission="Trả Hàng" />} />
            <Route path="salary" element={<RestrictedRoute component={SalaryPage} permission="Tính Lương" />} />
            <Route path="attendance" element={<RestrictedRoute component={AttendancePage} permission="Chấm công" />} />
            <Route path="leave" element={<RestrictedRoute component={LeavePage} permission="Nghĩ Phép" />} />
            
            <Route path="profile" element={<Profile />} />
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default AppAdmin;