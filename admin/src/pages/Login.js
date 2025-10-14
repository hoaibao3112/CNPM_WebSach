import React, { useState, useContext } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Checkbox } from 'antd'; // Import Checkbox từ antd
import '../styles/Login.css';
import { PermissionContext } from '../components/PermissionContext';
import { Modal, Form, Input, Button, Card, message } from 'antd';

const Login = () => {
  // State cho form đăng nhập
  const [TenTK, setTenTK] = useState('');
  const [MatKhau, setMatKhau] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // State cho modal quên mật khẩu
  const [forgotVisible, setForgotVisible] = useState(false);
  const [forgotStep, setForgotStep] = useState(1);
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetToken, setResetToken] = useState(''); // Lưu resetToken từ verify OTP
  const [forgotLoading, setForgotLoading] = useState(false);

  const navigate = useNavigate();
  const { setPermissions } = useContext(PermissionContext);
  const [form] = Form.useForm();

  // Hàm đăng nhập
  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg(''); // Reset lỗi
    try {
      const res = await axios.post('http://localhost:5000/api/login', { 
        TenTK, 
        MatKhau 
      });

      if (res.data.token) {
        // Lưu token và user info
        localStorage.setItem('authToken', res.data.token);
        localStorage.setItem('userInfo', JSON.stringify(res.data.user));

        // Lấy permissions
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

        message.success('Đăng nhập thành công!');
        setTimeout(() => {
          navigate('/admin', { replace: true });
        }, 100);
      } else {
        const errorMessage = 'Token không hợp lệ';
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

  // Bước 1: Gửi OTP quên mật khẩu
  const handleSendOtp = async (values) => {
    setForgotLoading(true);
    setErrorMsg(''); // Reset lỗi
    try {
      const res = await axios.post('http://localhost:5000/api/forgot-password/send-otp', {
        email: values.email
      });

      if (res.status === 200) {
        setForgotEmail(values.email);
        setForgotStep(2);
        message.success(res.data.message || 'Đã gửi mã OTP về email!');
      } else {
        const errorMessage = res.data.error || res.data.message || 'Không tìm thấy email!';
        message.error(errorMessage);
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

  // Bước 2: Xác thực OTP
  const handleVerifyOtp = async (values) => {
    setForgotLoading(true);
    setErrorMsg(''); // Reset lỗi
    try {
      const res = await axios.post('http://localhost:5000/api/forgot-password/verify-otp', {
        email: forgotEmail,
        otp: values.otp
      });

      if (res.status === 200) {
        setForgotStep(3);
        setResetToken(res.data.resetToken); // Lưu resetToken từ response
        message.success(res.data.message || 'Xác thực OTP thành công!');
      } else {
        const errorMessage = res.data.error || res.data.message || 'OTP không đúng!';
        message.error(errorMessage);
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

  // Bước 3: Đặt lại mật khẩu
  const handleResetPassword = async (values) => {
    if (values.newPassword !== values.confirmPassword) {
      message.error('Mật khẩu xác nhận không khớp!');
      return;
    }

    setForgotLoading(true);
    setErrorMsg(''); // Reset lỗi
    try {
      const res = await axios.post('http://localhost:5000/api/forgot-password/reset-password', {
        email: forgotEmail,
        resetToken: resetToken, // Gửi resetToken
        newPassword: values.newPassword,
        confirmPassword: values.confirmPassword
      });

      if (res.status === 200) {
        message.success(res.data.message || 'Đặt lại mật khẩu thành công!');
        // Reset modal sau 1.5s
        setTimeout(() => {
          setForgotVisible(false);
          setForgotStep(1);
          form.resetFields();
          setResetToken(''); // Reset token
          setForgotEmail('');
        }, 1500);
      } else {
        const errorMessage = res.data.error || res.data.message || 'Đặt lại mật khẩu thất bại!';
        message.error(errorMessage);
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

  // Đóng modal và reset
  const handleCancelForgot = () => {
    setForgotVisible(false);
    setForgotStep(1);
    form.resetFields();
    setResetToken('');
    setForgotEmail('');
  };

  // Render form đăng nhập
  return (
    <div className="login-container">
      <div className="login-form">
        <div className="login-header">
          <h2>Đăng nhập</h2>
          <p>Vui lòng nhập thông tin để đăng nhập</p>
        </div>

        {errorMsg && (
          <div className="error-message">
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label htmlFor="TenTK">Tên đăng nhập</label>
            <Input
              id="TenTK"
              value={TenTK}
              onChange={(e) => setTenTK(e.target.value)}
              placeholder="Nhập tên đăng nhập"
              size="large"
            />
          </div>

          <div className="form-group">
            <label htmlFor="MatKhau">Mật khẩu</label>
            <Input.Password
              id="MatKhau"
              value={MatKhau}
              onChange={(e) => setMatKhau(e.target.value)}
              placeholder="Nhập mật khẩu"
              visibilityToggle={{
                visible: showPassword,
                onVisibleChange: setShowPassword,
              }}
              size="large"
            />
          </div>

          <div className="form-options">
            <div className="checkbox-group">
              <Checkbox
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              >
                Ghi nhớ mật khẩu
              </Checkbox>
            </div>
            <button
              type="button"
              className="forgot-password-link"
              onClick={() => setForgotVisible(true)}
            >
              Quên mật khẩu?
            </button>
          </div>

          <button type="submit" className="login-btn">
            Đăng nhập
          </button>

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
          onCancel={handleCancelForgot}
          footer={null}
          title="Quên mật khẩu"
          destroyOnHidden
          width={400}
        >
          <Card bordered={false} style={{ boxShadow: 'none', padding: 0 }}>
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
          </Card>
        </Modal>
      </div>
    </div>
  );
};

export default Login;