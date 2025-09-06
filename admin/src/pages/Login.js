import React, { useState, useContext } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../styles/Login.css';
import { PermissionContext } from '../components/PermissionContext';
import { Modal, Form, Input, Button, Card, message } from 'antd';

const Login = () => {
  const [TenTK, setTenTK] = useState('');
  const [MatKhau, setMatKhau] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [forgotVisible, setForgotVisible] = useState(false);
  const [forgotStep, setForgotStep] = useState(1);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  const navigate = useNavigate();
  const { setPermissions } = useContext(PermissionContext);
  const [form] = Form.useForm();

  // Đăng nhập
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:5000/api/login', { TenTK, MatKhau });

      if (res.data.token) {
        localStorage.setItem('authToken', res.data.token);
        localStorage.setItem('userInfo', JSON.stringify(res.data.user));
        const permissionRes = await axios.get('http://localhost:5000/api/roles/user/permissions', {
          headers: {
            Authorization: `Bearer ${res.data.token}`,
          },
        });

        if (permissionRes.data.success) {
          setPermissions(permissionRes.data.data);
        } else {
          setPermissions([]);
        }

        setTimeout(() => {
          navigate('/admin', { replace: true });
        }, 100);
      } else {
        setErrorMsg('Token không hợp lệ');
      }
    } catch (error) {
      if (error.response) {
        setErrorMsg(error.response.data.message || 'Đăng nhập thất bại');
      } else if (error.request) {
        setErrorMsg('Không thể kết nối tới server');
      } else {
        setErrorMsg('Lỗi khi gửi yêu cầu');
      }
    }
  };

  // Quên mật khẩu: Gửi OTP
  const handleSendOtp = async (values) => {
    setForgotLoading(true);
    try {
      const res = await axios.post('http://localhost:5000/api/forgot-password/send-otp', {
        email: values.email
      });
      if (res.data.success) {
        setForgotEmail(values.email);
        setForgotStep(2);
        message.success('Đã gửi mã OTP về email!');
      } else {
        message.error(res.data.message || 'Không tìm thấy email!');
      }
    } catch {
      message.error('Không gửi được OTP!');
    }
    setForgotLoading(false);
  };

  // Quên mật khẩu: Xác thực OTP
  const handleVerifyOtp = async (values) => {
    setForgotLoading(true);
    try {
      const res = await axios.post('http://localhost:5000/api/forgot-password/verify-otp', {
        email: forgotEmail,
        otp: values.otp
      });
      if (res.data.success) {
        setForgotStep(3);
        setForgotOtp(values.otp);
        message.success('Xác thực OTP thành công!');
      } else {
        message.error(res.data.message || 'OTP không đúng!');
      }
    } catch {
      message.error('Xác thực OTP thất bại!');
    }
    setForgotLoading(false);
  };

  // Quên mật khẩu: Đặt lại mật khẩu
  const handleResetPassword = async (values) => {
    if (values.newPassword !== values.confirmPassword) {
      message.error('Mật khẩu xác nhận không khớp!');
      return;
    }
    setForgotLoading(true);
    try {
      const res = await axios.post('http://localhost:5000/api/forgot-password/reset', {
        email: forgotEmail,
        otp: forgotOtp,
        newPassword: values.newPassword
      });
      if (res.data.success) {
        message.success('Đặt lại mật khẩu thành công! Vui lòng đăng nhập lại.');
        setForgotVisible(false);
        setForgotStep(1);
        form.resetFields();
      } else {
        message.error(res.data.message || 'Đặt lại mật khẩu thất bại!');
      }
    } catch {
      message.error('Đặt lại mật khẩu thất bại!');
    }
    setForgotLoading(false);
  };

  return (
    <div className="login-container">
      <form className="login-form" onSubmit={handleLogin}>
        <h2 className="login-title">Đăng nhập</h2>

        {errorMsg && <div className="error-message">{errorMsg}</div>}

        <div className="form-group">
          <label htmlFor="username">Tên tài khoản</label>
          <input
            id="username"
            type="text"
            className="form-control"
            value={TenTK}
            onChange={(e) => setTenTK(e.target.value)}
            placeholder="Nhập tên tài khoản"
          />
        </div>

        <div className="form-group">
          <label htmlFor="matKhau">Mật khẩu</label>
          <div style={{ position: 'relative' }}>
            <input
              id="matKhau"
              type={showPassword ? "text" : "password"}
              className="form-control"
              value={MatKhau}
              onChange={(e) => setMatKhau(e.target.value)}
              placeholder="••••••••"
              style={{ paddingRight: 40 }}
            />
            <span
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute',
                right: 10,
                top: '50%',
                transform: 'translateY(-50%)',
                cursor: 'pointer',
                color: '#888',
                fontSize: 18
              }}
              title={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
            >
              {showPassword ? '👁️' : '👁️‍🗨️'}
            </span>
          </div>
        </div>

        <div className="remember-forgot">
          <div className="remember-me">
            <input
              type="checkbox"
              id="remember-me"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />
            <label htmlFor="remember-me">Ghi nhớ đăng nhập</label>
          </div>
          <span
            className="forgot-password"
            style={{ color: '#3498db', cursor: 'pointer' }}
            onClick={() => setForgotVisible(true)}
          >
            Quên mật khẩu?
          </span>
        </div>

        <button type="submit" className="login-btn">Đăng nhập</button>

        <div className="divider">
          <span>---</span>
        </div>

        <div className="social-login">
          <h3>Facebook</h3>
          <h4>Twitter</h4>
        </div>
      </form>

      {/* Modal Quên mật khẩu */}
      <Modal
        open={forgotVisible}
        onCancel={() => { setForgotVisible(false); setForgotStep(1); form.resetFields(); }}
        footer={null}
        title="Quên mật khẩu"
        destroyOnClose
      >
        <Card bordered={false} style={{ boxShadow: 'none', padding: 0 }}>
          {forgotStep === 1 && (
            <Form layout="vertical" onFinish={handleSendOtp} form={form}>
              <Form.Item
                label="Email đăng ký"
                name="email"
                rules={[
                  { required: true, message: 'Vui lòng nhập email!' },
                  { type: 'email', message: 'Email không hợp lệ!' }
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
                label="Mã OTP"
                name="otp"
                rules={[{ required: true, message: 'Vui lòng nhập mã OTP!' }]}
              >
                <Input
                  placeholder="Nhập mã OTP gửi về email"
                  maxLength={6}
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
                  { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự!' }
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
        </Card>
      </Modal>
    </div>
  );
};

export default Login;