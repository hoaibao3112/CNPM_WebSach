import React, { useState, useEffect } from 'react';
import api from '../utils/api';

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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-slate-400 font-bold animate-pulse tracking-widest uppercase text-sm">Đang tải hồ sơ...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] bg-white rounded-3xl border border-red-100 p-12 shadow-sm">
        <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6">
          <span className="material-icons text-4xl">error_outline</span>
        </div>
        <h2 className="text-2xl font-black text-slate-800 mb-2">Đã xảy ra lỗi</h2>
        <p className="text-red-500 text-center max-w-md font-medium">{error}</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 min-h-screen bg-slate-50 font-sans">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 text-center md:text-left">
          <h1 className="text-2xl font-black text-slate-800 flex items-center justify-center md:justify-start gap-3">
            <span className="material-icons text-indigo-500">badge</span>
            Thông tin cá nhân
          </h1>
          <p className="text-slate-400 text-sm mt-1">Quản lý và xem thông tin tài khoản của bạn</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-1 space-y-6">
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center text-center transition-all hover:shadow-md">
              <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 p-1 mb-6 shadow-lg shadow-indigo-100">
                <div className="w-full h-full rounded-[1.4rem] bg-white flex items-center justify-center overflow-hidden">
                  <span className="material-icons text-6xl text-indigo-500">person</span>
                </div>
              </div>
              <h2 className="text-xl font-black text-slate-800">{userInfo.TenNV || userInfo.TenTK}</h2>
              <span className={`mt-2 px-4 py-1 rounded-full text-sm font-black uppercase tracking-widest ${
                userInfo.TinhTrang ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'
              }`}>
                {userInfo.TinhTrang ? 'Đang hoạt động' : 'Vô hiệu hóa'}
              </span>
              <div className="w-full h-px bg-slate-50 my-6"></div>
              <div className="flex items-center gap-2 text-indigo-600">
                <span className="material-icons text-sm">verified_user</span>
                <span className="text-sm font-black uppercase tracking-widest">{userInfo.TenNQ || 'Thành viên'}</span>
              </div>
            </div>

            <div className="bg-indigo-600 p-6 rounded-3xl shadow-lg shadow-indigo-100 text-white relative overflow-hidden">
              <div className="relative z-10">
                <p className="text-indigo-200 text-sm font-black uppercase tracking-widest mb-1">Mã tài khoản</p>
                <h3 className="text-2xl font-black tracking-tighter">#{userInfo.MaTK}</h3>
                <div className="mt-4 flex items-center gap-2 text-indigo-200 text-sm font-bold">
                  <span className="material-icons text-sm">calendar_today</span>
                  Tham gia từ {new Date(userInfo.NgayTao).toLocaleDateString('vi-VN')}
                </div>
              </div>
              <span className="material-icons absolute -right-4 -bottom-4 text-9xl text-white/10 rotate-12">fingerprint</span>
            </div>
          </div>

          <div className="md:col-span-2 space-y-6">
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 transition-all hover:shadow-md">
              <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                <span className="material-icons text-indigo-500">contact_mail</span>
                Chi tiết hồ sơ nhân viên
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-8">
                <div className="space-y-1">
                  <label className="text-sm font-black text-slate-300 uppercase tracking-widest">Họ và tên</label>
                  <p className="text-slate-700 font-bold border-b border-slate-50 pb-2">{userInfo.TenNV || '—'}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-black text-slate-300 uppercase tracking-widest">Mã nhân viên</label>
                  <p className="text-slate-700 font-bold border-b border-slate-50 pb-2">{userInfo.MaNV || '—'}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-black text-slate-300 uppercase tracking-widest">Số điện thoại</label>
                  <p className="text-slate-700 font-bold border-b border-slate-50 pb-2">{userInfo.SDT || '—'}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-black text-slate-300 uppercase tracking-widest">Email</label>
                  <p className="text-slate-700 font-bold border-b border-slate-50 pb-2">{userInfo.Email || '—'}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-black text-slate-300 uppercase tracking-widest">Giới tính</label>
                  <p className="text-slate-700 font-bold border-b border-slate-50 pb-2">{userInfo.GioiTinh || '—'}</p>
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-sm font-black text-slate-300 uppercase tracking-widest">Địa chỉ liên hệ</label>
                  <p className="text-slate-700 font-bold border-b border-slate-50 pb-2">{userInfo.DiaChi || '—'}</p>
                </div>
              </div>

              <div className="mt-12 p-6 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
                <div>
                  <h4 className="text-slate-800 font-black text-sm">Cập nhật mật khẩu?</h4>
                  <p className="text-slate-400 text-sm font-bold">Hãy bảo vệ tài khoản của bạn thường xuyên</p>
                </div>
                <button className="h-10 px-6 rounded-xl bg-white border border-slate-200 text-slate-600 text-sm font-black uppercase tracking-widest hover:bg-slate-100 transition-all shadow-sm">
                  Thay đổi
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;