import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal as AntdModal, Form, Input, Button, message } from 'antd';
import api from '../utils/api';
// Import các icon
import { MailOutlined, LockOutlined } from '@ant-design/icons';
import '../styles/Login.css';
import { PermissionContext } from '../components/PermissionContext';


// Icon laptop (dùng tạm SVG để giống hình minh họa)
const LaptopIcon = () => (
  <svg width="100" height="100" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 17.01C4 17.56 4.44 18.01 5 18.01H19C19.56 18.01 20 17.56 20 17.01V6.01C20 5.46 19.56 5.01 19 5.01H5C4.44 5.01 4 5.46 4 6.01V17.01ZM6 7.01H18V16.01H6V7.01Z" fill="#555" />
    <path d="M12 11C13.1 11 14 10.1 14 9C14 7.9 13.1 7 12 7C10.9 7 10 7.9 10 9C10 10.1 10.9 11 12 11ZM12 8C12.55 8 13 8.45 13 9C13 9.55 12.55 10 12 10C11.45 10 11 9.55 11 9C11 8.45 11.45 8 12 8Z" fill="#555" />
    <path d="M10 14.5C10 13.67 10.67 13 11.5 13H12.5C13.33 13 14 13.67 14 14.5V15H10V14.5Z" fill="#555" />
    <path d="M2 19.01H22V20.01H2V19.01Z" fill="#555" />
  </svg>
);

const Login = () => {
  // State cho form đăng nhập (giữ nguyên)
  const [TenTK, setTenTK] = useState('');
  const [MatKhau, setMatKhau] = useState('');
  // const [rememberMe, setRememberMe] = useState(false); // Bỏ vì không có trong layout
  const [errorMsg, setErrorMsg] = useState('');

  // State cho modal quên mật khẩu (giữ nguyên)
  const [forgotVisible, setForgotVisible] = useState(false);
  const [forgotStep, setForgotStep] = useState(1);
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  const navigate = useNavigate();
  const { setPermissions } = useContext(PermissionContext);
  const [form] = Form.useForm();

  // ----- Giữ nguyên tất cả các hàm logic (handleLogin, handleSendOtp, v.v...) -----
  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      const res = await api.post('/login', {
        TenTK,
        MatKhau
      });

      const responseData = res.data.data;
      if (responseData && responseData.token) {
        localStorage.setItem('authToken', responseData.token);
        localStorage.setItem('userInfo', JSON.stringify(responseData.user));

        const permissionRes = await api.get('/roles/user/permissions');

        if (permissionRes.data.success) {
          setPermissions(permissionRes.data.data);
        } else {
          setPermissions([]);
        }

        message.success('Đăng nhập thành công!');
        setTimeout(() => {
          navigate('/admin', { replace: true });
        }, 100);
      } else {
        const errorMessage = 'Token không hợp lệ hoặc dữ liệu phản hồi sai cấu trúc';
        setErrorMsg(errorMessage);
        message.error(errorMessage);
      }
    } catch (error) {
      let errorMessage = 'Đăng nhập thất bại';
      if (error.response) {
        errorMessage = error.response.data.message || error.response.data.error || errorMessage;
      } else if (error.request) {
        errorMessage = 'Không thể kết nối tới server';
      } else {
        errorMessage = 'Lỗi khi gửi yêu cầu';
      }
      setErrorMsg(errorMessage);
      message.error(errorMessage);
    }
  };

  const handleSendOtp = async (values) => {
    setForgotLoading(true);
    setErrorMsg('');
    try {
      const res = await api.post('/forgot-password/send-otp', {
        email: values.email
      });
      if (res.status === 200) {
        setForgotEmail(values.email);
        setForgotStep(2);
        message.success(res.data.message || 'Đã gửi mã OTP về email!');
      } else {
        message.error(res.data.error || res.data.message || 'Không tìm thấy email!');
      }
    } catch (error) {
      let errorMessage = 'Không gửi được OTP!';
      if (error.response) {
        errorMessage = error.response.data.error || error.response.data.message || errorMessage;
      }
      message.error(errorMessage);
    } finally {
      setForgotLoading(false);
    }
  };

  const handleVerifyOtp = async (values) => {
    setForgotLoading(true);
    setErrorMsg('');
    try {
      const res = await api.post('/forgot-password/verify-otp', {
        email: forgotEmail,
        otp: values.otp
      });
      if (res.status === 200) {
        setForgotStep(3);
        setResetToken(res.data.resetToken);
        message.success(res.data.message || 'Xác thực OTP thành công!');
      } else {
        message.error(res.data.error || res.data.message || 'OTP không đúng!');
      }
    } catch (error) {
      let errorMessage = 'Xác thực OTP thất bại!';
      if (error.response) {
        errorMessage = error.response.data.error || error.response.data.message || errorMessage;
      }
      message.error(errorMessage);
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
    setErrorMsg('');
    try {
      const res = await api.post('/forgot-password/reset-password', {
        email: forgotEmail,
        resetToken: resetToken,
        newPassword: values.newPassword,
        confirmPassword: values.confirmPassword
      });
      if (res.status === 200) {
        message.success(res.data.message || 'Đặt lại mật khẩu thành công!');
        setTimeout(() => {
          setForgotVisible(false);
          setForgotStep(1);
          form.resetFields();
          setResetToken('');
          setForgotEmail('');
        }, 1500);
      } else {
        message.error(res.data.error || res.data.message || 'Đặt lại mật khẩu thất bại!');
      }
    } catch (error) {
      let errorMessage = 'Đặt lại mật khẩu thất bại!';
      if (error.response) {
        errorMessage = error.response.data.error || error.response.data.message || errorMessage;
      }
      message.error(errorMessage);
    } finally {
      setForgotLoading(false);
    }
  };

  const handleCancelForgot = () => {
    setForgotVisible(false);
    setForgotStep(1);
    form.resetFields();
    setResetToken('');
    setForgotEmail('');
  };
  // ----- Hết phần logic -----

  // Render giao diện mới
  return (
    <div className="login-page-container">
      <div className="login-box">

        {/* Cột bên trái (Graphic) */}
        <div className="login-graphic-side">
          <div className="graphic-shape shape-1"></div>
          <div className="graphic-shape shape-2"></div>
          <div className="graphic-shape shape-3"></div>
          <div className="graphic-shape shape-4"></div>
          <div className="laptop-graphic-wrapper">
            <LaptopIcon />
          </div>
        </div>

        {/* Cột bên phải (Form) */}
        <div className="login-form-side">
          <h2>Trang Đăng Nhập</h2>

          {errorMsg && (
            <div className="error-message">
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="login-form-wrapper">
            <Input
              className="login-input"
              prefix={<MailOutlined className="site-form-item-icon" />}
              placeholder="Tai khoan" // Thay "Tên đăng nhập" bằng "Email"
              size="large"
              value={TenTK}
              onChange={(e) => setTenTK(e.target.value)}
              required
            />

            <Input.Password
              className="login-input"
              prefix={<LockOutlined className="site-form-item-icon" />}
              placeholder="Password"
              size="large"
              value={MatKhau}
              onChange={(e) => setMatKhau(e.target.value)}
              required
            />

            <Button
              type="primary"
              htmlType="submit"
              className="login-form-button"
              size="large"
            >
              LOGIN
            </Button>

            <button
              type="button"
              className="login-form-forgot-link"
              onClick={() => setForgotVisible(true)}
            >
              Forgot Username / Password?
            </button>

            <div className="login-form-create-account">

            </div>
          </form>
        </div>
      </div>

      {/* Modal Quên mật khẩu (Đã cập nhật) */}
      <AntdModal
        open={forgotVisible}
        onCancel={handleCancelForgot}
        footer={null}
        title="Quên mật khẩu"
        destroyOnHidden
        width={400}
        className="forgot-password-modal"
      >
        {/* Đã bỏ <Card> */}
        {forgotStep === 1 && (
          <Form layout="vertical" onFinish={handleSendOtp} form={form}>
            <Form.Item
              label="Email đăng ký"
              name="email"
              rules={[
                { required: true, message: 'Vui lòng nhập email!' },
                { type: 'email', message: 'Email không hợp lệ!' },
              ]}
            >
              <Input placeholder="Nhập email của bạn" />
            </Form.Item>
            <Button type="primary" htmlType="submit" block loading={forgotLoading}>
              Gửi mã OTP
            </Button>
          </Form>
        )}

        {forgotStep === 2 && (
          <Form layout="vertical" onFinish={handleVerifyOtp} form={form}>
            <Form.Item
              label="Mã OTP (gửi về email)"
              name="otp"
              rules={[{ required: true, message: 'Vui lòng nhập mã OTP!' }]}
            >
              <Input
                placeholder="Nhập mã OTP (6 chữ số)"
                maxLength={6}
                type="number"
              />
            </Form.Item>
            <Button type="primary" htmlType="submit" block loading={forgotLoading}>
              Xác nhận OTP
            </Button>
          </Form>
        )}

        {forgotStep === 3 && (
          <Form layout="vertical" onFinish={handleResetPassword} form={form}>
            <Form.Item
              label="Mật khẩu mới"
              name="newPassword"
              rules={[
                { required: true, message: 'Vui lòng nhập mật khẩu mới!' },
                { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự!' },
              ]}
            >
              <Input.Password placeholder="Nhập mật khẩu mới" />
            </Form.Item>
            <Form.Item
              label="Xác nhận mật khẩu mới"
              name="confirmPassword"
              dependencies={['newPassword']}
              rules={[
                { required: true, message: 'Vui lòng xác nhận mật khẩu mới!' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('newPassword') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('Mật khẩu xác nhận không khớp!'));
                  },
                }),
              ]}
            >
              <Input.Password placeholder="Nhập lại mật khẩu mới" />
            </Form.Item>
            <Button type="primary" htmlType="submit" block loading={forgotLoading}>
              Đặt lại mật khẩu
            </Button>
          </Form>
        )}
      </AntdModal>
    </div>
  );
};

export default Login;