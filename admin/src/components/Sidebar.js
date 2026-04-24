import React, { useState, useContext, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import logo from '../assets/logo.png';
import UserInfo from './UserInfo';
import { PermissionContext } from './PermissionContext';

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const { permissions } = useContext(PermissionContext);

  // Responsive behavior: auto-close on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsOpen(false);
      } else {
        setIsOpen(true);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    try {
      document.body.classList.toggle('sidebar-open', isOpen);
      document.body.classList.toggle('sidebar-closed', !isOpen);
    } catch (e) {}
    return () => {
      try {
        document.body.classList.remove('sidebar-open', 'sidebar-closed');
      } catch {}
    };
  }, [isOpen]);

  const menuItems = [
    { to: '/admin', icon: 'dashboard', text: 'Trang Chủ', permission: null },
    { to: '/admin/statistical', icon: 'analytics', text: 'Thống kê', permission: 'Thống kê' },
    { to: '/admin/products', icon: 'inventory_2', text: 'Quản lý sản phẩm', permission: 'Sản phẩm' },
    { to: '/admin/invoices', icon: 'receipt_long', text: 'Quản lý hóa đơn', permission: 'Hóa đơn' },
    { to: '/admin/receipt', icon: 'receipt', text: 'Quản lý phiếu nhập', permission: 'Phiếu nhập' },
    { to: '/admin/khuyenmai', icon: 'local_offer', text: 'Quản lý khuyến mãi', permission: 'Khuyến mãi' },
    { to: '/admin/refunds', icon: 'undo', text: 'Hoàn tiền đơn hàng', permission: 'Hoàn tiền đơn hàng' },
    { to: '/admin/salary', icon: 'payments', text: 'Tính lương', permission: 'Tính Lương' },
    { to: '/admin/account', icon: 'people', text: 'Quản lý tài khoản', permission: 'Tài khoản' },
    { to: '/admin/users', icon: 'badge', text: 'Quản lý nhân viên', permission: 'Nhân viên' },
    { to: '/admin/category', icon: 'category', text: 'Quản lý thể loại', permission: 'Thể loại' },
    { to: '/admin/company', icon: 'business', text: 'Quản lý nhà cung cấp', permission: 'Nhà cung cấp' },
    { to: '/admin/roles', icon: 'admin_panel_settings', text: 'Quản lý quyền', permission: 'Phân quyền' },
    { to: '/admin/authorities', icon: 'person', text: 'Quản lý tác giả', permission: 'Tác Giả' },
    { to: '/admin/client', icon: 'groups', text: 'Quản lý khách hàng', permission: 'Khách hàng' },
    { to: '/admin/attendance', icon: 'check_circle', text: 'Chấm công', permission: 'Chấm công' },
    { to: '/admin/leave', icon: 'event_busy', text: 'Xin nghỉ phép', permission: 'Nghĩ Phép' },
    { to: '/admin/returns', icon: 'assignment_return', text: 'Quản lý trả hàng', permission: 'Trả Hàng' }
  ];

  const normalize = (s) => {
    if (!s) return '';
    return String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  };

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
      {/* Floating Toggle Button for Mobile when Closed */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed top-4 left-4 z-[1300] lg:hidden w-12 h-12 flex items-center justify-center bg-slate-900 text-white rounded-2xl shadow-xl border border-slate-800 animate-in fade-in zoom-in duration-300"
        >
          <span className="material-icons">menu</span>
        </button>
      )}

      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-[1100] lg:hidden transition-all duration-500 ease-in-out"
          onClick={() => setIsOpen(false)}
        />
      )}

      <div className={`fixed inset-y-0 left-0 z-[1200] flex flex-col bg-slate-950 border-r border-slate-900 text-slate-100 transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1) shadow-2xl overflow-hidden
        ${isOpen ? 'w-72 translate-x-0' : 'w-20 -translate-x-full lg:translate-x-0'}`}>
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-900 bg-slate-950/50 backdrop-blur-xl sticky top-0 z-20">
          <div className={`flex items-center gap-3 transition-all duration-500 ${isOpen ? 'opacity-100' : 'opacity-0 lg:opacity-100'}`}>
            <img src={logo} alt="Logo" className={`transition-all duration-500 ${isOpen ? 'h-10' : 'h-8 w-8 object-contain'}`} />
          </div>
          <button
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-900 hover:bg-indigo-600 text-slate-400 hover:text-white transition-all transform active:scale-95 border border-slate-800"
            onClick={() => setIsOpen(!isOpen)}
          >
            <span className="material-icons text-xl">
              {isOpen ? 'chevron_left' : 'menu'}
            </span>
          </button>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 overflow-y-auto custom-scrollbar py-6 px-4 space-y-2">
          {filteredMenuItems.map((item) => {
            const isActive = location.pathname === item.to || (item.to === '/admin' && location.pathname === '/admin/');
            
            return (
              <li key={item.to} className="list-none">
                <NavLink
                  to={item.to}
                  className={`flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 group relative
                    ${isActive 
                      ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg shadow-pink-500/30 scale-[1.02]' 
                      : 'text-slate-400 hover:bg-slate-900 hover:text-slate-100'}`}
                  end={item.to === '/admin'}
                  onClick={() => {
                    if (window.innerWidth < 1024) setIsOpen(false);
                  }}
                >
                  <span className={`material-icons text-2xl transition-all duration-300 group-hover:scale-110 
                    ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-pink-400'}`}>
                    {item.icon}
                  </span>
                  <span className={`font-black text-xs uppercase tracking-widest transition-all duration-500 whitespace-nowrap 
                    ${isOpen ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10 pointer-events-none'}`}>
                    {item.text}
                  </span>
                  
                  {/* Active Glow indicator */}
                  {isActive && (
                    <div className="absolute -inset-1 bg-pink-500/20 blur-xl rounded-2xl -z-10 animate-pulse" />
                  )}

                  {!isOpen && (
                    <div className="absolute left-full ml-6 px-4 py-2 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none whitespace-nowrap z-50 border border-slate-800 shadow-2xl translate-x-[-10px] group-hover:translate-x-0">
                      {item.text}
                    </div>
                  )}
                </NavLink>
              </li>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-6 bg-slate-950/80 backdrop-blur-xl border-t border-slate-900 space-y-4">
          <UserInfo isSidebarOpen={isOpen} />
          
          <button
            className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 group
              ${isOpen 
                ? 'bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white hover:shadow-lg hover:shadow-rose-500/20' 
                : 'text-slate-500 hover:bg-rose-500 hover:text-white'}`}
            onClick={handleLogout}
          >
            <span className="material-icons transition-transform group-hover:rotate-12">logout</span>
            <span className={`font-black text-xs uppercase tracking-widest transition-all duration-500 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
              Đăng xuất
            </span>
          </button>
        </div>
      </div>
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #334155; }
      `}</style>
    </>
  );
};

export default Sidebar;