import React, { useState, useContext } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import '../styles/sidebar.css';
import logo from '../assets/logo.png';
import UserInfo from './UserInfo';
import { PermissionContext } from './PermissionContext';

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(true);
  // sync a body-level class so portal/popover/modal elements can react when sidebar toggles
  React.useEffect(() => {
    try {
      document.body.classList.toggle('sidebar-open', isOpen);
      document.body.classList.toggle('sidebar-closed', !isOpen);
    } catch (e) {
      // ignore non-browser env
    }
    return () => {
      try {
        document.body.classList.remove('sidebar-open', 'sidebar-closed');
      } catch {}
    };
  }, [isOpen]);
  const navigate = useNavigate();
  const location = useLocation();
  const { hasPermission } = useContext(PermissionContext);

  const menuItems = [
    { to: '/admin', icon: 'dashboard', text: 'Trang Chủ', permission: null },
    { to: '/admin/products', icon: 'inventory_2', text: 'Quản lý sản phẩm', permission: 'Sản phẩm' },
    { to: '/admin/account', icon: 'people', text: 'Quản lý tài khoản', permission: 'Tài khoản' },
    { to: '/admin/category', icon: 'category', text: 'Quản lý thể loại', permission: 'Thể loại' },
    { to: '/admin/users', icon: 'badge', text: 'Quản lý nhân viên', permission: 'Nhân viên' },
    { to: '/admin/invoices', icon: 'receipt_long', text: 'Quản lý hóa đơn', permission: 'Hóa đơn' },
    { to: '/admin/company', icon: 'business', text: 'Quản lý nhà cung cấp', permission: 'Nhà cung cấp' },
    { to: '/admin/roles', icon: 'admin_panel_settings', text: 'Quản lý quyền', permission: 'Phân quyền' },
    { to: '/admin/authorities', icon: 'person', text: 'Quản lý tác giả', permission: 'Tác Giả' },
    { to: '/admin/client', icon: 'groups', text: 'Quản lý khách hàng', permission: 'Khách hàng' },
    { to: '/admin/statistical', icon: 'analytics', text: 'Thống kê', permission: 'Thống kê' },
    { to: '/admin/receipt', icon: 'receipt', text: 'Quản lý phiếu nhập', permission: 'Phiếu nhập' },
    { to: '/admin/khuyenmai', icon: 'local_offer', text: 'Quản lý khuyến mãi', permission: 'Khuyến mãi' },
    { to: '/admin/refunds', icon: 'undo', text: 'Hoàn tiền đơn hàng', permission: 'Hoàn tiền đơn hàng' },
  // Profile moved to footer so it stays pinned to the bottom
    { to: '/admin/salary', icon: 'payments', text: 'Tính lương', permission: 'Tính Lương' },
    { to: '/admin/leave', icon: 'event_busy', text: 'Xin nghỉ phép', permission: 'Nghĩ Phép' },
    { to: '/admin/attendance', icon: 'check_circle', text: 'Chấm công', permission: 'Chấm công' },
    { to: '/admin/returns', icon: 'assignment_return', text: 'Quản lý trả hàng', permission: 'Trả Hàng' }
  ];

  const filteredMenuItems = menuItems.filter(
    (item) => !item.permission || hasPermission(item.permission, 'Đọc')
  );

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
    <div className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <img src={logo} alt="Logo" className="logo-image" />
        </div>
        <button
          className="btn-toggle"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle sidebar"
        >
          {isOpen ? '‹' : '›'}
        </button>
      </div>

      <ul className="sidebar-menu">
        {filteredMenuItems.map((item) => {
          // Check if current path matches
          const isActive = location.pathname === item.to;
          
          return (
            <li key={item.to}>
              <NavLink
                to={item.to}
                className={isActive ? 'active' : ''}
                end={item.to === '/admin'}
              >
                <span className="material-icons">{item.icon}</span>
                {isOpen && <span className="menu-text">{item.text}</span>}
              </NavLink>
            </li>
          );
        })}
      </ul>

      <div className="sidebar-footer">
        <UserInfo isSidebarOpen={isOpen} />
        {/* Profile link pinned to footer */}
        <NavLink
          to="/admin/profile"
          className={location.pathname === '/admin/profile' ? 'footer-link active' : 'footer-link'}
        >
          <span className="material-icons">person</span>
          {isOpen && <span className="menu-text">Trang cá nhân</span>}
        </NavLink>
        <button
          className="logout-btn logged-in"
          onClick={handleLogout}
          aria-label="Đăng xuất"
        >
          <span className="material-icons">logout</span>
          {isOpen && <span className="menu-text">Đăng xuất</span>}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;