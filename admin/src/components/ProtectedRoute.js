import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = () => {
  const authToken = localStorage.getItem('authToken');
  
  if (!authToken) {
    // Xóa các item còn sót lại (nếu có)
    localStorage.removeItem('userInfo');
    return <Navigate to="/login" replace />;
  }
  
  return <Outlet />;
};

export default ProtectedRoute;