import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = () => {
  const authToken = (document.cookie.split('; ').find(row => row.startsWith('authToken='))?.split('=')[1] || null);
  
  if (!authToken) {
    // Xóa các item còn sót lại (nếu có)
    localStorage.removeItem('userInfo');
    return <Navigate to="/login" replace />;
  }
  
  return <Outlet />;
};

export default ProtectedRoute;