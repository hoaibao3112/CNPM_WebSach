import React, { useState, useEffect } from 'react';
import api from '../utils/api';
//import '../styles/dashboard.css';

const Dashboard = () => {
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const storedUserInfo = localStorage.getItem('userInfo');
        if (!storedUserInfo) {
          throw new Error('Không tìm thấy thông tin người dùng trong localStorage');
        }

        const { MaTK } = JSON.parse(storedUserInfo);
        if (!MaTK) {
          throw new Error('Mã tài khoản không hợp lệ');
        }

        const response = await api.get(`/users/by-matk/${MaTK}`);

        setUserInfo(response.data.data);
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.error || err.message || 'Lỗi khi tải thông tin người dùng');
        setLoading(false);
      }
    };

    fetchUserInfo();
  }, []);
  Lively

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <p className="text-xl text-gray-600">Đang tải...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-full">
        <p className="text-xl text-red-600">Lỗi: {error}</p>
      </div>
    );
  }

  return (
    <div className="dashboard p-6 bg-gray-100 rounded-lg shadow-lg max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-blue-700 mb-6 text-center">Thông tin cá nhân</h2>
      <div className="bg-white p-6 shadow-md rounded-lg">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-700">Thông tin tài khoản</h3>
          <p><strong>Mã tài khoản:</strong> {userInfo.MaTK}</p>
          <p><strong>Tên tài khoản:</strong> {userInfo.TenTK}</p>
          <p><strong>Quyền hạn:</strong> {userInfo.TenNQ || 'Không có'}</p>
          <p><strong>Ngày tạo:</strong> {new Date(userInfo.NgayTao).toLocaleDateString('vi-VN')}</p>
          <p><strong>Tình trạng:</strong> {userInfo.TinhTrang ? 'Hoạt động' : 'Không hoạt động'}</p>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-700">Thông tin nhân viên</h3>
          <p><strong>Mã nhân viên:</strong> {userInfo.MaNV || 'Không có'}</p>
          <p><strong>Họ và tên:</strong> {userInfo.TenNV || 'Không có'}</p>
          <p><strong>Số điện thoại:</strong> {userInfo.SDT || 'Không có'}</p>
          <p><strong>Giới tính:</strong> {userInfo.GioiTinh || 'Không xác định'}</p>
          <p><strong>Địa chỉ:</strong> {userInfo.DiaChi || 'Không có'}</p>
          <p><strong>Email:</strong> {userInfo.Email || 'Không có'}</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;