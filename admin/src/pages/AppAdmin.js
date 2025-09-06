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
import KhuyenMai from './khuyenmai.js';
import '../styles/sidebar.css';
import Profile from './Profile';
import { PermissionContext } from '../components/PermissionContext';
import AuthorManagement from './AuthorManagement.js';

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
    <div className="app-admin">
      <Sidebar />
      <div className="main-content">
        <Routes>
          <Route index element={<Dashboard />} />
          <Route
            path="products"
            element={<RestrictedRoute component={ProductManagement} permission="Sản phẩm" />}
          />
          <Route
            path="account"
            element={<RestrictedRoute component={AccountManagement} permission="Tài khoản" />}
          />
          <Route
            path="users"
            element={<RestrictedRoute component={UserManagement} permission="Nhân viên" />}
          />
          <Route
            path="category"
            element={<RestrictedRoute component={CategoryManagement} permission="Thể loại" />}
          />
          <Route
            path="invoices"
            element={<RestrictedRoute component={InvoiceManagement} permission="Hóa đơn" />}
          />
          <Route
            path="company"
            element={<RestrictedRoute component={CompanyManagement} permission="Công ty" />}
          />
          <Route
            path="roles"
            element={<RestrictedRoute component={Authorities} permission="Phân quyền" />}
          />
          <Route
            path="client"
            element={<RestrictedRoute component={Client} permission="Khách hàng" />}
          />
          <Route
            path="receipt"
            element={<RestrictedRoute component={Receipt} permission="Phiếu nhập" />}
          />
          <Route
            path="khuyenmai"
            element={<RestrictedRoute component={KhuyenMai} permission="Khuyến mãi" />}
          />
          <Route
            path="statistical"
            element={<RestrictedRoute component={Statistical} permission="Thống kê" />}
          />
          <Route
            path="authorities"
            element={<RestrictedRoute component={AuthorManagement} permission="tác giả" />}
          />
          <Route path="*" element={<Navigate to="/admin" replace />} />

          <Route path="profile" element={<Profile />} />
        </Routes>
      </div>
    </div>
  );
};

export default AppAdmin;