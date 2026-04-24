import React, { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';

const UserInfo = ({ isSidebarOpen }) => {
  const [userName, setUserName] = useState('');
  const location = useLocation();

  useEffect(() => {
    const userInfo = localStorage.getItem('userInfo');
    if (userInfo) {
      try {
        const user = JSON.parse(userInfo);
        setUserName(user.TenTK || user.username || 'Admin');
      } catch (e) {
        setUserName('Admin');
      }
    }
  }, []);

  const isActive = location.pathname === '/admin/profile';

  return (
    <NavLink 
      to="/admin/profile" 
      className={`flex items-center gap-4 p-4 rounded-[1.5rem] transition-all duration-300 group
        ${isActive 
          ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/25' 
          : 'bg-slate-800/40 text-slate-300 hover:bg-slate-800 hover:text-white'}`}
      title="Xem trang cá nhân"
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300
        ${isActive ? 'bg-white/20' : 'bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white'}`}>
        <span className="material-icons text-2xl">account_circle</span>
      </div>
      
      <div className={`flex flex-col min-w-0 transition-all duration-300 ${isSidebarOpen ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4 pointer-events-none'}`}>
        <span className={`text-[10px] font-black uppercase tracking-widest opacity-60 ${isActive ? 'text-white' : 'text-slate-400'}`}>
          Xin chào,
        </span>
        <span className="font-black truncate text-sm">
          {userName || 'Admin'}
        </span>
      </div>
    </NavLink>
  );
};

export default UserInfo;