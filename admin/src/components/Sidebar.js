import React, { useState, useContext } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import logo from '../assets/logo.png';
import UserInfo from './UserInfo';
import { PermissionContext } from './PermissionContext';

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(true);
  // sync a body-level class so portal/popover/modal elements can react when sidebar toggles
  React.useEffect(() => {
    const handleToggle = () => setIsOpen(prev => !prev);
    window.addEventListener('toggle-sidebar', handleToggle);

    try {
      document.body.classList.toggle('sidebar-open', isOpen);
      document.body.classList.toggle('sidebar-closed', !isOpen);
    } catch (e) {}

    return () => {
      window.removeEventListener('toggle-sidebar', handleToggle);
      try {
        document.body.classList.remove('sidebar-open', 'sidebar-closed');
      } catch {}
    };
  }, [isOpen]);
  const navigate = useNavigate();
  const location = useLocation();
  const { permissions } = useContext(PermissionContext);

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

  // Normalize function (same as PermissionContext) to compare names safely
  const normalize = (s) => {
    if (!s && s !== '') return '';
    try {
      return String(s)
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .toLowerCase()
        .trim();
    } catch (e) {
      return String(s)
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();
    }
  };

  // Show menu item if:
  // - it has no permission requirement OR
  // - there exists at least one active permission (any action) for that function
  const filteredMenuItems = menuItems.filter((item) => {
    if (!item.permission) return true;
    const fn = normalize(item.permission);
    return permissions.some((perm) => normalize(perm.TenCN) === fn);
  });

  const handleLogout = async () => {
    try {
      await axios.post(
        (process.env.REACT_APP_API_BASE || 'https://cnpm-customer.onrender.com') + '/api/logout',
        {},
        {
          headers: {
            Authorization: `Bearer ${(document.cookie.split('; ').find(row => row.startsWith('authToken='))?.split('=')[1] || null)}`,
          },
        }
      );
    } catch (error) {
      console.error('Lỗi đăng xuất:', error);
    } finally {
      document.cookie = "authToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      localStorage.removeItem('userInfo');
      navigate('/admin/login', { replace: true });
    }
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[1100] lg:hidden transition-all duration-500 ease-in-out"
          onClick={() => setIsOpen(false)}
        />
      )}

      <div className={`fixed inset-y-0 left-0 z-[1200] flex flex-col bg-slate-900 border-r border-slate-800 text-slate-100 transition-all duration-300 ease-in-out shadow-2xl overflow-hidden
        ${isOpen ? 'w-64 translate-x-0' : 'w-20 -translate-x-full lg:translate-x-0'}`}>
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800/50 bg-slate-900/50 backdrop-blur-md sticky top-0 z-20">
          <div className={`flex items-center gap-3 transition-all duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 lg:opacity-100'}`}>
            <img src={logo} alt="Logo" className={`transition-all duration-300 ${isOpen ? 'h-10 w-auto' : 'h-8 w-8 object-cover rounded-lg'}`} />
          </div>
          <button
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-800/50 hover:bg-slate-700 text-slate-400 hover:text-white transition-all transform hover:scale-105 active:scale-95 border border-slate-700/50"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle sidebar"
          >
            <span className="material-icons text-xl">
              {isOpen ? 'chevron_left' : 'menu'}
            </span>
          </button>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-6 px-3 scrollbar-hide space-y-1">
          {filteredMenuItems.map((item) => {
            const isActive = location.pathname === item.to;
            
            return (
              <li key={item.to} className="list-none">
                <NavLink
                  to={item.to}
                  className={({ isActive }) => `flex items-center gap-4 p-3 rounded-xl transition-all duration-200 group relative
                    ${isActive 
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
                      : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-100'}`}
                  end={item.to === '/admin'}
                  onClick={() => {
                    if (window.innerWidth < 1024) setIsOpen(false);
                  }}
                >
                  <span className={`material-icons transition-transform duration-300 group-hover:scale-110 ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-indigo-400'}`}>
                    {item.icon}
                  </span>
                  <span className={`font-medium transition-all duration-300 whitespace-nowrap ${isOpen ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10 pointer-events-none'}`}>
                    {item.text}
                  </span>
                  
                  {/* Active Indicator Line */}
                  {isActive && !isOpen && (
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-indigo-500 rounded-l-full shadow-[0_0_10px_#6366f1]" />
                  )}

                  {/* Tooltip for closed state */}
                  {!isOpen && (
                    <div className="absolute left-full ml-4 px-3 py-2 bg-slate-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 border border-slate-700 shadow-xl">
                      {item.text}
                    </div>
                  )}
                </NavLink>
              </li>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 bg-slate-900/80 backdrop-blur-md border-t border-slate-800 space-y-3">
          <UserInfo isSidebarOpen={isOpen} />
          
          {localStorage.getItem('showPerms') === '1' && isOpen && (
            <div className="p-3 max-h-40 overflow-auto bg-black/40 rounded-xl text-[10px] text-slate-500 font-mono border border-slate-800 transition-all animate-in fade-in zoom-in duration-300">
              <div className="mb-2 uppercase font-bold text-indigo-400 opacity-80 border-b border-slate-800 pb-1">Debug Permissions</div>
              <pre className="whitespace-pre-wrap leading-relaxed">{JSON.stringify(permissions, null, 2)}</pre>
            </div>
          )}

          <button
            className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all duration-200 group
              ${isOpen 
                ? 'bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white' 
                : 'text-slate-500 hover:bg-red-500 hover:text-white'}`}
            onClick={handleLogout}
            aria-label="Đăng xuất"
          >
            <span className="material-icons transition-transform group-hover:rotate-12">logout</span>
            <span className={`font-semibold transition-all duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
              Đăng xuất
            </span>
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;