import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/header.css';

const Header = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('authToken'); // Xóa token khỏi localStorage
    navigate('/login'); // Điều hướng về trang đăng nhập
  };

  return (
    <div className="header">
      <h1>Quản trị hệ thống</h1>
      <button onClick={handleLogout} className="btn-logout">
        Đăng xuất
      </button>
    </div>
  );
};

export default Header;