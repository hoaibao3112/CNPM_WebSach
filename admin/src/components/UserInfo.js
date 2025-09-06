import React, { useEffect, useState } from 'react';

const UserInfo = ({ isSidebarOpen }) => { // Nhận prop isSidebarOpen
  const [userName, setUserName] = useState('');

  useEffect(() => {
    const userInfo = localStorage.getItem('userInfo');
    if (userInfo) {
      const user = JSON.parse(userInfo);
      setUserName(user.TenTK);
    }
  }, []);

  return (
    <div className="user-info">
      {isSidebarOpen && `Xin chào, `}
      <span className="username">{userName || 'Khách'}</span>
    </div>
  );
};

export default UserInfo;