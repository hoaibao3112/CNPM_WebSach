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
//import KhuyenMai from './pages/khuyenmai.js';
import ReturnManagement from './pages/ReturnManagement.js';
import Profile from './pages/Profile';
import SalaryPage from './pages/SalaryPage';
import LeavePage from './pages/LeavePage';
import AttendancePage from './pages/AttendancePage';
import { PermissionContext } from './components/PermissionContext';
import DiscountManagement from './pages/DiscountManagement.js';
import RefundManagement from './pages/RefundManagement.js';
import AdminHome from './pages/AdminHome';

const PrivateRoute = ({ component: Component }) => {
  const isAuthenticated = !!localStorage.getItem('authToken');
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
    return <div>Loading permissions...</div>;
  }
  return hasPermission(permission, 'Đọc') ? (
    <Component />
  ) : (
    <div>Bạn không có quyền truy cập trang này: {permission}</div>
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
        element={<PrivateRoute component={AdminHome} />}
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
     
      {/* Thêm route cho trang tạo khuyến mãi */}
     <Route
  path="/admin/khuyenmai"
  element={
    <PrivateRoute
      component={() => (
        <RestrictedRoute component={DiscountManagement} permission="Khuyến mãi" />
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
        path="/admin/attendance"
        element={
          <PrivateRoute
            component={() => (
              <RestrictedRoute component={AttendancePage} permission="Chấm công" />
            )}
          />
        }
      />
             <Route
        path="/admin/refunds"
        element={
          <PrivateRoute
            component={() => (
              <RestrictedRoute component={RefundManagement} permission="Hoàn tiền đơn hàng" />
            )}
          />
        }
      />
              <Route
        path="/admin/Returns"
        element={
          <PrivateRoute
            component={() => (
              <RestrictedRoute component={ReturnManagement} permission="Hoàn tiền đơn hàng" />
            )}
          />
        }
      />

      <Route path="*" element={<Navigate to="/admin/login" replace />} />
    </Routes>
  );
};

export default App;