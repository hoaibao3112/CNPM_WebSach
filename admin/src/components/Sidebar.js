import React, { useState, useContext } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/sidebar.css';
import logo from '../assets/logo.png';
import UserInfo from './UserInfo';
import { PermissionContext } from './PermissionContext';

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(true);
  const navigate = useNavigate();
  const { hasPermission } = useContext(PermissionContext);

  const menuItems = [
    { to: '/admin', icon: 'dashboard', text: 'Trang Chủ', permission: null },
    { to: 'products', icon: 'inventory_2', text: 'Quản lý sản phẩm', permission: 'Sản phẩm' },
    { to: 'account', icon: 'people', text: 'Quản lý tài khoản', permission: 'Tài khoản' },
    { to: 'category', icon: 'category', text: 'Quản lý thể loại', permission: 'Thể loại' },
    { to: 'users', icon: 'badge', text: 'Quản lý nhân viên', permission: 'Nhân viên' },
    { to: 'invoices', icon: 'receipt_long', text: 'Quản lý hóa đơn', permission: 'Hóa đơn' },
    { to: 'company', icon: 'business', text: 'Quản lý nhà cung cấp', permission: 'Nhà cung cấp' },
    { to: 'roles', icon: 'admin_panel_settings', text: 'Quản lý quyền', permission: 'Phân quyền' },
    { to: 'authorities', icon: 'person', text: 'Quản lý tác giả', permission: 'Tác Giả' },
    { to: 'client', icon: 'groups', text: 'Quản lý khách hàng', permission: 'Khách hàng' },
    { to: 'statistical', icon: 'analytics', text: 'Thống kê', permission: 'Thống kê' },
    { to: 'receipt', icon: 'receipt', text: 'Quản lý phiếu nhập', permission: 'Phiếu nhập' },
    { to: '/admin/profile', icon: 'person', text: 'Trang cá nhân', permission: null },
    { to: '/admin/salary', icon: 'payments', text: 'Tính lương', permission: 'Tính Lương' },
    { to: '/admin/leave', icon: 'event_busy', text: 'Xin nghỉ phép', permission: 'Nghĩ Phép' },
    { to: 'attendance', icon: 'check_circle', text: 'Chấm công', permission: 'Chấm công' },
{ to: 'khuyenmai', icon: 'local_offer', text: 'Quản lý khuyến mãi', permission: 'Khuyến mãi' },

  ];

  const filteredMenuItems = menuItems.filter(
    (item) => !item.permission || hasPermission(item.permission, 'Đọc')
  );
  console.log('Filtered menu items:', filteredMenuItems);

  const handleLogout = async () => {
    try {
      await axios.post(
        'http://localhost:5000/api/logout',
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          },
        }
      );
    } catch (error) {
      console.error('Lỗi đăng xuất:', error);
    } finally {
      localStorage.removeItem('authToken');
      localStorage.removeItem('userInfo');
      navigate('/admin/login', { replace: true });
    }
  };

  return (
    <div className={`sidebar ${isOpen ? 'open' : 'closed'} flex flex-col h-full bg-gray-800 text-white`}>
      <div className="sidebar-header flex items-center justify-between p-4">
        <div className="sidebar-logo">
          <img src={logo} alt="Logo" className="logo-image" />
        </div>
        <button
          className="btn-toggle text-white"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle sidebar"
        >
          {isOpen ? '‹' : '›'}
        </button>
      </div>

      <ul className="sidebar-menu flex-1 overflow-auto">
        {filteredMenuItems.map((item) => (
          <li key={item.to}>
            <NavLink
              to={item.to}
              className={({ isActive }) =>
                `flex items-center p-3 hover:bg-gray-700 ${isActive ? 'bg-gray-700' : ''}`
              }
            >
              <span className="material-icons mr-3">{item.icon}</span>
              {isOpen && <span className="menu-text">{item.text}</span>}
            </NavLink>
          </li>
        ))}
      </ul>

      <div className="sidebar-footer p-4">
        <UserInfo isSidebarOpen={isOpen} />
        <button
          className="logout-btn flex items-center p-3 w-full hover:bg-gray-700"
          onClick={handleLogout}
          aria-label="Đăng xuất"
        >
          <span className="material-icons mr-3">logout</span>
          {isOpen && <span className="menu-text">Đăng xuất</span>}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;