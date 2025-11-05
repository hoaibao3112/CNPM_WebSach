import React, { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';

const UserInfo = ({ isSidebarOpen }) => { // Nhận prop isSidebarOpen
  const [userName, setUserName] = useState('');
  const location = useLocation();

  useEffect(() => {
    const userInfo = localStorage.getItem('userInfo');
    if (userInfo) {
      const user = JSON.parse(userInfo);
      setUserName(user.TenTK);
    }
  }, []);

  const isActive = location.pathname === '/admin/profile';

  return (
    <NavLink 
      to="/admin/profile" 
      className={`user-info-link ${isActive ? 'active' : ''}`}
      title="Xem trang cá nhân"
    >
      <span className="material-icons">account_circle</span>
      <div className="user-info-text">
        {isSidebarOpen && <span className="greeting">Xin chào,</span>}
        <span className="username">{userName || 'Khách'}</span>
      </div>
    </NavLink>
  );
};

export default UserInfo;