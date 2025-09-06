import React, { useState } from 'react';
import axios from 'axios';
import { Form, Input, Button, message, Card } from 'antd';

const ForgotPassword = () => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [MaTK, setMaTK] = useState(null);

  // Bước 1: Gửi OTP
  const handleSendOtp = async (values) => {
    try {
      const res = await axios.post('http://localhost:5000/api/forgot-password/send-otp', {
        email: values.email
      });
      if (res.data.success) {
        setEmail(values.email);
        setMaTK(res.data.MaTK); // Lưu lại MaTK nếu backend trả về
        setStep(2);
        message.success('Đã gửi mã OTP về email!');
      } else {
        message.error(res.data.message || 'Không tìm thấy email!');
      }
    } catch (err) {
      message.error('Không gửi được OTP!');
    }
  };

  // Bước 2: Xác thực OTP
  const handleVerifyOtp = async (values) => {
    try {
      const res = await axios.post('http://localhost:5000/api/forgot-password/verify-otp', {
        email,
        otp: values.otp
      });
      if (res.data.success) {
        setStep(3);
        message.success('Xác thực OTP thành công!');
      } else {
        message.error(res.data.message || 'OTP không đúng!');
      }
    } catch {
      message.error('Xác thực OTP thất bại!');
    }
  };

  // Bước 3: Đặt lại mật khẩu
  const handleResetPassword = async (values) => {
    if (values.newPassword !== values.confirmPassword) {
      message.error('Mật khẩu xác nhận không khớp!');
      return;
    }
    try {
      const res = await axios.post('http://localhost:5000/api/forgot-password/reset', {
        email,
        otp,
        newPassword: values.newPassword
      });
      if (res.data.success) {
        message.success('Đặt lại mật khẩu thành công! Vui lòng đăng nhập lại.');
        window.location.href = '/login';
      } else {
        message.error(res.data.message || 'Đặt lại mật khẩu thất bại!');
      }
    } catch {
      message.error('Đặt lại mật khẩu thất bại!');
    }
  };

  return (
    <div className="login-container">
      <Card style={{ maxWidth: 400, margin: 'auto' }}>
        <h2 className="login-title">Quên mật khẩu</h2>
        {step === 1 && (
          <Form layout="vertical" onFinish={handleSendOtp}>
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
            <Button type="primary" htmlType="submit" block>
              Gửi mã OTP
            </Button>
          </Form>
        )}
        {step === 2 && (
          <Form layout="vertical" onFinish={handleVerifyOtp}>
            <Form.Item
              label="Mã OTP"
              name="otp"
              rules={[{ required: true, message: 'Vui lòng nhập mã OTP!' }]}
            >
              <Input
                placeholder="Nhập mã OTP gửi về email"
                maxLength={6}
                onChange={e => setOtp(e.target.value)}
              />
            </Form.Item>
            <Button type="primary" htmlType="submit" block>
              Xác nhận OTP
            </Button>
          </Form>
        )}
        {step === 3 && (
          <Form layout="vertical" onFinish={handleResetPassword}>
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
            <Button type="primary" htmlType="submit" block>
              Đặt lại mật khẩu
            </Button>
          </Form>
        )}
      </Card>
    </div>
  );
};

export default ForgotPassword;