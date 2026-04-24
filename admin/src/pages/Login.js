import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal as AntdModal, Form, Input, Button, message } from 'antd';
import api from '../utils/api';
import { MailOutlined, LockOutlined } from '@ant-design/icons';
import { PermissionContext } from '../components/PermissionContext';

const LaptopIcon = () => (
  <svg width="100" height="100" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 17.01C4 17.56 4.44 18.01 5 18.01H19C19.56 18.01 20 17.56 20 17.01V6.01C20 5.46 19.56 5.01 19 5.01H5C4.44 5.01 4 5.46 4 6.01V17.01ZM6 7.01H18V16.01H6V7.01Z" fill="#fff" opacity="0.8" />
    <path d="M12 11C13.1 11 14 10.1 14 9C14 7.9 13.1 7 12 7C10.9 7 10 7.9 10 9C10 10.1 10.9 11 12 11ZM12 8C12.55 8 13 8.45 13 9C13 9.55 12.55 10 12 10C11.45 10 11 9.55 11 9C11 8.45 11.45 8 12 8Z" fill="#fff" opacity="0.8" />
    <path d="M10 14.5C10 13.67 10.67 13 11.5 13H12.5C13.33 13 14 13.67 14 14.5V15H10V14.5Z" fill="#fff" opacity="0.8" />
    <path d="M2 19.01H22V20.01H2V19.01Z" fill="#fff" opacity="0.8" />
  </svg>
);

const Login = () => {
  const [TenTK, setTenTK] = useState('');
  const [MatKhau, setMatKhau] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [forgotVisible, setForgotVisible] = useState(false);
  const [forgotStep, setForgotStep] = useState(1);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtpToken, setForgotOtpToken] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  const navigate = useNavigate();
  const { setPermissions } = useContext(PermissionContext);
  const [form] = Form.useForm();

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      const res = await api.post('/login', { TenTK, MatKhau });
      const responseData = res.data.data;
      if (responseData && responseData.token) {
        document.cookie = `authToken=${responseData.token}; path=/; max-age=${7*24*60*60}`;
        localStorage.setItem('userInfo', JSON.stringify(responseData.user));
        const permissionRes = await api.get('/roles/user/permissions');
        if (permissionRes.data.success) {
          setPermissions(permissionRes.data.data);
        } else {
          setPermissions([]);
        }
        message.success('Đăng nhập thành công!');
        setTimeout(() => navigate('/admin', { replace: true }), 100);
      } else {
        setErrorMsg('Token không hợp lệ');
        message.error('Token không hợp lệ');
      }
    } catch (error) {
      let errorMessage = 'Đăng nhập thất bại';
      if (error.response) errorMessage = error.response.data.message || error.response.data.error || errorMessage;
      setErrorMsg(errorMessage);
      message.error(errorMessage);
    }
  };

  const handleSendOtp = async (values) => {
    setForgotLoading(true);
    try {
      const res = await api.post('/forgot-password/send-otp', { email: values.email });
      if (res.status === 200) {
        setForgotOtpToken(res.data?.data?.token || '');
        setForgotEmail(values.email);
        setForgotStep(2);
        message.success('Đã gửi mã OTP về email!');
      }
    } catch (error) {
      message.error(error.response?.data?.error || 'Không gửi được OTP!');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleVerifyOtp = async (values) => {
    setForgotLoading(true);
    try {
      const res = await api.post('/forgot-password/verify-otp', {
        email: forgotEmail,
        otp: values.otp,
        token: forgotOtpToken
      });
      if (res.status === 200) {
        setForgotStep(3);
        setResetToken(res.data?.data?.resetToken || '');
        message.success('Xác thực OTP thành công!');
      }
    } catch (error) {
      message.error('OTP không đúng!');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPassword = async (values) => {
    if (values.newPassword !== values.confirmPassword) {
      message.error('Mật khẩu xác nhận không khớp!');
      return;
    }
    setForgotLoading(true);
    try {
      const res = await api.post('/forgot-password/reset', {
        email: forgotEmail,
        resetToken: resetToken,
        matkhau: values.newPassword
      });
      if (res.status === 200) {
        message.success('Đặt lại mật khẩu thành công!');
        setTimeout(() => {
          setForgotVisible(false);
          setForgotStep(1);
          form.resetFields();
        }, 1500);
      }
    } catch (error) {
      message.error('Đặt lại mật khẩu thất bại!');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleCancelForgot = () => {
    setForgotVisible(false);
    setForgotStep(1);
    form.resetFields();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 p-6 relative overflow-hidden font-sans">
      <div className="absolute -top-40 -right-20 w-[600px] h-[600px] bg-white/10 rounded-full blur-3xl animate-pulse pointer-events-none"></div>
      <div className="absolute -bottom-20 -left-10 w-[500px] h-[500px] bg-indigo-500/20 rounded-full blur-3xl animate-pulse delay-1000 pointer-events-none"></div>

      <div className="w-full max-w-[1000px] flex flex-col md:flex-row bg-white/95 backdrop-blur-xl rounded-[2rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] overflow-hidden z-10">
        <div className="hidden md:flex flex-1 bg-gradient-to-br from-indigo-500 to-purple-600 items-center justify-center p-12 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(255,255,255,0.15)_0%,transparent_70%)] animate-[spin_30s_linear_infinite]"></div>
          <div className="w-80 h-80 bg-white/10 rounded-full flex items-center justify-center z-10 backdrop-blur-md shadow-2xl border border-white/20 animate-float">
            <LaptopIcon />
          </div>
          <div className="absolute top-20 right-20 w-16 h-16 bg-white/10 rounded-2xl rotate-12 backdrop-blur-sm animate-pulse"></div>
          <div className="absolute bottom-20 left-20 w-12 h-12 bg-white/10 rounded-full backdrop-blur-sm animate-pulse delay-500"></div>
        </div>

        <div className="flex-1 p-10 md:p-16 flex flex-col justify-center bg-white">
          <div className="mb-10 text-center md:text-left">
            <h2 className="text-4xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-3 tracking-tight">
              ADMIN LOGIN
            </h2>
            <p className="text-slate-400 font-medium">Hệ thống quản trị cửa hàng sách</p>
          </div>

          {errorMsg && (
            <div className="mb-8 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm font-semibold rounded-r-xl animate-shake flex items-center gap-3">
              <span className="material-icons text-red-500">error</span>
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Tài khoản</label>
              <Input
                className="h-14 rounded-2xl bg-slate-50 border-2 border-slate-100 hover:border-indigo-300 focus:border-indigo-500 transition-all px-6 text-base font-medium"
                prefix={<MailOutlined className="text-indigo-500 mr-2 text-lg" />}
                placeholder="Nhập tài khoản quản trị..."
                value={TenTK}
                onChange={(e) => setTenTK(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Mật khẩu</label>
              <Input.Password
                className="h-14 rounded-2xl bg-slate-50 border-2 border-slate-100 hover:border-indigo-300 focus:border-indigo-500 transition-all px-6 text-base font-medium"
                prefix={<LockOutlined className="text-indigo-500 mr-2 text-lg" />}
                placeholder="••••••••"
                value={MatKhau}
                onChange={(e) => setMatKhau(e.target.value)}
                required
              />
            </div>

            <Button
              type="primary"
              htmlType="submit"
              className="w-full h-14 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 border-none text-base font-bold shadow-xl shadow-indigo-200 transform transition-all duration-300 hover:-translate-y-1 hover:shadow-indigo-300 active:translate-y-0 uppercase tracking-wider"
            >
              ĐĂNG NHẬP HỆ THỐNG
            </Button>

            <div className="text-center pt-4">
              <button
                type="button"
                className="text-sm font-bold text-slate-400 hover:text-indigo-600 transition-colors flex items-center justify-center gap-2 mx-auto group"
                onClick={() => setForgotVisible(true)}
              >
                <span className="material-icons text-sm group-hover:rotate-12 transition-transform">help_outline</span>
                Quên mật khẩu truy cập?
              </button>
            </div>
          </form>
        </div>
      </div>

      <AntdModal
        open={forgotVisible}
        onCancel={handleCancelForgot}
        footer={null}
        title={<span className="text-indigo-600 font-bold">Khôi phục mật khẩu</span>}
        destroyOnClose
        width={450}
        centered
        className="modern-modal"
      >
        <div className="py-6">
          {forgotStep === 1 && (
            <Form layout="vertical" onFinish={handleSendOtp} form={form} className="space-y-4">
              <Form.Item
                label={<span className="font-bold text-slate-600">Email đăng ký</span>}
                name="email"
                rules={[{ required: true, message: 'Vui lòng nhập email!' }, { type: 'email', message: 'Email không hợp lệ!' }]}
              >
                <Input placeholder="name@example.com" className="h-12 rounded-xl" />
              </Form.Item>
              <Button type="primary" htmlType="submit" block loading={forgotLoading} className="h-12 rounded-xl bg-indigo-600">
                Gửi mã OTP
              </Button>
            </Form>
          )}

          {forgotStep === 2 && (
            <Form layout="vertical" onFinish={handleVerifyOtp} form={form} className="space-y-4">
              <Form.Item
                label={<span className="font-bold text-slate-600">Mã OTP (kiểm tra email)</span>}
                name="otp"
                rules={[{ required: true, message: 'Vui lòng nhập mã OTP!' }]}
              >
                <Input placeholder="Mã 6 chữ số" maxLength={6} className="h-12 rounded-xl text-center text-2xl tracking-[0.5em] font-black" />
              </Form.Item>
              <Button type="primary" htmlType="submit" block loading={forgotLoading} className="h-12 rounded-xl bg-indigo-600">
                Xác nhận mã OTP
              </Button>
            </Form>
          )}

          {forgotStep === 3 && (
            <Form layout="vertical" onFinish={handleResetPassword} form={form} className="space-y-4">
              <Form.Item label={<span className="font-bold text-slate-600">Mật khẩu mới</span>} name="newPassword" rules={[{ required: true, min: 6 }]}>
                <Input.Password className="h-12 rounded-xl" />
              </Form.Item>
              <Form.Item label={<span className="font-bold text-slate-600">Xác nhận mật khẩu</span>} name="confirmPassword" dependencies={['newPassword']} rules={[{ required: true }, ({ getFieldValue }) => ({ validator(_, v) { return !v || getFieldValue('newPassword') === v ? Promise.resolve() : Promise.reject('Không khớp!'); } })]}>
                <Input.Password className="h-12 rounded-xl" />
              </Form.Item>
              <Button type="primary" htmlType="submit" block loading={forgotLoading} className="h-12 rounded-xl bg-indigo-600">
                Cập nhật mật khẩu
              </Button>
            </Form>
          )}
        </div>
      </AntdModal>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(2deg); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-8px); }
          75% { transform: translateX(8px); }
        }
        .animate-shake {
          animation: shake 0.4s ease-in-out;
        }
        .modern-modal .ant-modal-content {
          border-radius: 24px !important;
          padding: 24px !important;
        }
      `}</style>
    </div>
  );
};

export default Login;