import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import ProductManagement from './pages/ProductManagement';
import AccountManagement from './pages/AccountManagement';
import UserManagement from './pages/UserManagement';
import CategoryManagement from './pages/CategoryManagement';
import InvoiceManagement from './pages/InvoiceManagement';
import CompanyManagement from './pages/campanyManagement';
import AuthorManagement from './pages/AuthorManagement';
import Client from './pages/client.js';
import Authorities from './pages/authorities';
import Receipt from './pages/receipt.js';
import Statistical from './pages/statistical.js';
import KhuyenMai from './pages/khuyenmai.js';
import Profile from './pages/Profile';
import './styles/sidebar.css';
import SalaryPage from './pages/SalaryPage';
import LeavePage from './pages/LeavePage';
import { PermissionContext } from './components/PermissionContext';
//import SalaryPage from './pages/SalaryPage';
//import LeavePage from './pages/LeavePage';

const PrivateRoute = ({ component: Component }) => {
  const isAuthenticated = !!localStorage.getItem('authToken');
  console.log('PrivateRoute - isAuthenticated:', isAuthenticated, 'Token:', localStorage.getItem('authToken'));
  return isAuthenticated ? (
    <div className="app-admin">
      <Sidebar />
      <div className="main-content">
        <Component />
      </div>
    </div>
  ) : (
    <Navigate to="/admin/login" replace />
  );
};

const RestrictedRoute = ({ component: Component, permission }) => {
  const { hasPermission, loading } = React.useContext(PermissionContext);
  if (loading) {
    return <div>Loading permissions...</div>; // Tránh chuyển hướng khi đang tải
  }
  return hasPermission(permission, 'Đọc') ? (
    <Component />
  ) : (
    <div>Bạn không có quyền truy cập trang này: {permission}</div> // Thay vì chuyển hướng
  );
};

const App = () => {
  const isAuthenticated = !!localStorage.getItem('authToken');

  return (
    <Routes>
      <Route
        path="/admin/login"
        element={isAuthenticated ? <Navigate to="/admin" replace /> : <Login />}
      />

      <Route
        path="/admin"
        element={<PrivateRoute component={() => <div>Trang quản trị</div>} />}
      />
      <Route
        path="/admin/products"
        element={
          <PrivateRoute
            component={() => (
              <RestrictedRoute component={ProductManagement} permission="Sản phẩm" />
            )}
          />
        }
      />
      <Route
        path="/admin/account"
        element={
          <PrivateRoute
            component={() => (
              <RestrictedRoute component={AccountManagement} permission="Tài khoản" />
            )}
          />
        }
      />
      <Route
        path="/admin/users"
        element={
          <PrivateRoute
            component={() => (
              <RestrictedRoute component={UserManagement} permission="Nhân viên" />
            )}
          />
        }
      />
      <Route
        path="/admin/category"
        element={
          <PrivateRoute
            component={() => (
              <RestrictedRoute component={CategoryManagement} permission="Thể loại" />
            )}
          />
        }
      />
      <Route
        path="/admin/invoices"
        element={
          <PrivateRoute
            component={() => (
              <RestrictedRoute component={InvoiceManagement} permission="Hóa đơn" />
            )}
          />
        }
      />
      <Route
        path="/admin/company"
        element={
          <PrivateRoute
            component={() => (
              <RestrictedRoute component={CompanyManagement} permission="Nhà cung cấp" />
            )}
          />
        }
      />
      <Route
        path="/admin/roles"
        element={
          <PrivateRoute
            component={() => (
              <RestrictedRoute component={Authorities} permission="Phân quyền" />
            )}
          />
        }
      />
      <Route
        path="/admin/client"
        element={
          <PrivateRoute
            component={() => (
              <RestrictedRoute component={Client} permission="Khách hàng" />
            )}
          />
        }
      />
      <Route
        path="/admin/receipt"
        element={
          <PrivateRoute
            component={() => (
              <RestrictedRoute component={Receipt} permission="Phiếu nhập" />
            )}
          />
        }
      />
      <Route
        path="/admin/khuyenmai"
        element={
          <PrivateRoute
            component={() => (
              <RestrictedRoute component={KhuyenMai} permission="Khuyến mãi" />
            )}
          />
        }
      />
      <Route
        path="/admin/statistical"
        element={
          <PrivateRoute
            component={() => (
              <RestrictedRoute component={Statistical} permission="Thống kê" />
            )}
          />
        }
      />
      <Route
        path="/admin/authorities"
        element={
          <PrivateRoute
            component={() => (
              <RestrictedRoute component={AuthorManagement} permission="Tác Giả" />
            )}
          />
        }
      />
      <Route
  path="/admin/profile"
  element={<PrivateRoute component={Profile} />}
/>
 <Route
        path="/admin/salary"
        element={
          <PrivateRoute
            component={() => (
              <RestrictedRoute component={SalaryPage} permission="Tính Lương" />
            )}
          />
        }
      />
      <Route
        path="/admin/leave"
        element={
          <PrivateRoute
            component={() => (
              <RestrictedRoute component={LeavePage} permission="Nghĩ Phép" />
            )}
          />
        }
      />
      <Route
  path="/admin/leave"
  element={<PrivateRoute component={LeavePage} />}
/>

      <Route path="*" element={<Navigate to="/admin/login" replace />} />
    </Routes>
  );
};

export default App;