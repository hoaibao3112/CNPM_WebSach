import React, { useState, useContext, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import logo from '../assets/logo.png';
import { PermissionContext } from './PermissionContext';

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { permissions } = useContext(PermissionContext);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    const userInfo = localStorage.getItem('userInfo');
    if (userInfo) {
      try {
        const user = JSON.parse(userInfo);
        setUserName(user.TenTK || user.username || 'Admin');
      } catch (e) { setUserName('Admin'); }
    }

    const handleResize = () => {
      if (window.innerWidth >= 1024) setIsOpen(true);
      else setIsOpen(false);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Sync state with body class for layout adjustments
  useEffect(() => {
    document.body.classList.toggle('sidebar-open', isOpen);
    document.body.classList.toggle('sidebar-closed', !isOpen);
    // Lock scroll on mobile when sidebar is open
    if (window.innerWidth < 1024 && isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
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

  const normalize = (s) => s ? String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim() : '';

  const filteredMenuItems = menuItems.filter((item) => {
    if (!item.permission) return true;
    const fn = normalize(item.permission);
    return permissions.some((perm) => normalize(perm.TenCN) === fn);
  });

  const bottomNavItems = [
    { to: '/admin', icon: 'dashboard', text: 'Home' },
    { to: '/admin/products', icon: 'inventory_2', text: 'Sách' },
    { to: '/admin/invoices', icon: 'receipt_long', text: 'Đơn hàng' },
    { to: '/admin/statistical', icon: 'analytics', text: 'Báo cáo' },
    { icon: 'menu', text: 'Thêm', isToggle: true }
  ];

  const handleLogout = async () => {
    try {
      await axios.post((process.env.REACT_APP_API_BASE || 'https://cnpm-customer.onrender.com') + '/api/logout', {}, {
        headers: { Authorization: `Bearer ${(document.cookie.split('; ').find(row => row.startsWith('authToken='))?.split('=')[1] || null)}` },
      });
    } catch (e) {} finally {
      document.cookie = "authToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      localStorage.removeItem('userInfo');
      navigate('/admin/login', { replace: true });
    }
  };

  return (
    <>
      {/* 1. MOBILE TOP BAR (Always visible on mobile) */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-slate-950 border-b border-slate-900 px-4 flex items-center justify-between z-[1000] shadow-md">
        <img src={logo} alt="Logo" className="h-8" />
        <button 
          onClick={() => setIsOpen(true)}
          className="w-11 h-11 flex items-center justify-center rounded-xl bg-slate-900 text-white shadow-lg active:scale-95 transition-transform"
        >
          <span className="material-icons">menu</span>
        </button>
      </div>

      {/* 2. BACKDROP (Mobile only) */}
      <div 
        className={`fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[1100] transition-opacity duration-300 lg:hidden ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsOpen(false)}
      />

      {/* 3. SIDEBAR DRAWER */}
      <div className={`fixed inset-y-0 left-0 z-[1200] flex flex-col bg-slate-950 border-r border-slate-900 text-slate-100 transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] shadow-2xl
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} 
        w-[85%] sm:w-80 lg:w-72`}>
        
        {/* Sidebar Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-900 bg-slate-950">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Logo" className="h-10" />
            <span className="font-black text-lg tracking-tighter hidden sm:block">ADMIN PANEL</span>
          </div>
          <button
            className="w-11 h-11 flex items-center justify-center rounded-xl bg-slate-900 hover:bg-rose-600 text-slate-400 hover:text-white transition-all transform active:scale-90 border border-slate-800"
            onClick={() => setIsOpen(false)}
          >
            <span className="material-icons text-xl">{window.innerWidth >= 1024 ? 'chevron_left' : 'close'}</span>
          </button>
        </div>

        {/* User Info (Integrated) */}
        <div className="px-6 py-8">
          <NavLink to="/admin/profile" className="flex items-center gap-4 p-4 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-indigo-500 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <span className="material-icons text-white">account_circle</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Xin chào,</p>
              <p className="font-black text-slate-100 truncate text-base">{userName}</p>
            </div>
          </NavLink>
        </div>

        {/* Navigation Scroll Area */}
        <nav className="flex-1 overflow-y-auto px-4 pb-10 space-y-2 custom-scrollbar">
          {filteredMenuItems.map((item) => {
            const isActive = location.pathname === item.to || (item.to === '/admin' && location.pathname === '/admin/');
            return (
              <li key={item.to} className="list-none">
                <NavLink
                  to={item.to}
                  className={`flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 group relative overflow-hidden
                    ${isActive 
                      ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-xl shadow-pink-500/20' 
                      : 'text-slate-400 hover:bg-slate-900/50 hover:text-slate-100'}`}
                  onClick={() => { if (window.innerWidth < 1024) setIsOpen(false); }}
                >
                  <span className={`material-icons text-2xl shrink-0 ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-pink-400'}`}>
                    {item.icon}
                  </span>
                  <span className="font-bold text-[15px] uppercase tracking-wider whitespace-nowrap overflow-hidden text-ellipsis flex-1">
                    {item.text}
                  </span>
                  {isActive && <div className="absolute right-0 top-0 bottom-0 w-1 bg-white/20" />}
                </NavLink>
              </li>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-6 border-t border-slate-900">
          <button
            className="w-full flex items-center gap-4 p-4 rounded-2xl bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white transition-all font-black text-xs uppercase tracking-widest shadow-sm"
            onClick={handleLogout}
          >
            <span className="material-icons">logout</span>
            <span>Đăng xuất</span>
          </button>
        </div>
      </div>

      {/* 4. BOTTOM NAVIGATION (Mobile only) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 h-20 bg-slate-950/80 backdrop-blur-xl border-t border-slate-900 px-2 flex items-center justify-around z-[1000] pb-safe">
        {bottomNavItems.map((item, idx) => (
          item.isToggle ? (
            <button 
              key={idx}
              onClick={() => setIsOpen(true)}
              className="flex flex-col items-center justify-center gap-1 w-16 h-16 rounded-xl text-slate-500 active:text-indigo-500"
            >
              <span className="material-icons text-2xl">menu</span>
              <span className="text-[10px] font-black uppercase tracking-tighter">Thêm</span>
            </button>
          ) : (
            <NavLink
              key={idx}
              to={item.to}
              className={({ isActive }) => `flex flex-col items-center justify-center gap-1 w-16 h-16 rounded-xl transition-all
                ${isActive ? 'text-indigo-500 scale-110' : 'text-slate-500'}`}
            >
              <span className="material-icons text-2xl">{item.icon}</span>
              <span className="text-[10px] font-black uppercase tracking-tighter">{item.text}</span>
            </NavLink>
          )
        ))}
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 10px; }
        .pb-safe { padding-bottom: env(safe-area-inset-bottom); }
      `}</style>
    </>
  );
};

export default Sidebar;