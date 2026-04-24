import React, { useState } from 'react';
import api from '../utils/api';
import { Link, useNavigate } from 'react-router-dom';
import { Form, Input, Button, Steps, message, Card, Typography } from 'antd';
import { MailOutlined, LockOutlined, SafetyOutlined, ArrowLeftOutlined, KeyOutlined, CheckCircleOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

const ForgotPassword = () => {
  const [current, setCurrent] = useState(0);
  const [email, setEmail] = useState('');
  const [otpToken, setOtpToken] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onEmailSubmit = async (values) => {
    setLoading(true);
    try {
      const response = await api.post('/forgot-password/send-otp', { email: values.email });
      message.success('Mã OTP đã được gửi đến email của bạn');
      setEmail(values.email);
      setOtpToken(response.data?.data?.token || '');
      setCurrent(1);
    } catch (error) { message.error(error.response?.data?.error || 'Lỗi khi gửi OTP'); }
    finally { setLoading(false); }
  };

  const onOtpVerify = async (values) => {
    setLoading(true);
    try {
      const response = await api.post('/forgot-password/verify-otp', { email, otp: values.otp, token: otpToken });
      message.success('Xác thực OTP thành công');
      setResetToken(response.data?.data?.resetToken || '');
      setCurrent(2);
    } catch (error) { message.error('Mã OTP không chính xác'); }
    finally { setLoading(false); }
  };

  const onPasswordReset = async (values) => {
    setLoading(true);
    try {
      await api.post('/forgot-password/reset', { email, resetToken, matkhau: values.newPassword });
      message.success('Đã khôi phục mật khẩu thành công!');
      setTimeout(() => navigate('/admin/login'), 2000);
    } catch (error) { message.error('Không thể đặt lại mật khẩu'); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6 font-sans relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 blur-3xl rounded-full -mr-20 -mt-20"></div>
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-500/10 blur-3xl rounded-full -ml-20 -mb-20"></div>

      <Card className="w-full max-w-[500px] rounded-[3rem] border-0 shadow-2xl shadow-slate-200/50 p-6 md:p-10 relative z-10 overflow-hidden">
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-indigo-600 rounded-[1.5rem] flex items-center justify-center text-white text-3xl mx-auto mb-6 shadow-xl shadow-indigo-200">
            <KeyOutlined />
          </div>
          <Title level={2} className="font-black tracking-tighter text-slate-800 mb-2">Khôi phục truy cập</Title>
          <Text className="text-slate-400 font-medium">Bảo mật tài khoản là ưu tiên hàng đầu của chúng tôi</Text>
        </div>

        <Steps 
          current={current} 
          className="mb-10" 
          items={[
            { title: 'Email', icon: <MailOutlined /> },
            { title: 'Xác thực', icon: <SafetyOutlined /> },
            { title: 'Mật khẩu', icon: <CheckCircleOutlined /> }
          ]} 
        />

        {current === 0 && (
          <Form layout="vertical" onFinish={onEmailSubmit} className="space-y-6">
            <Form.Item name="email" label={<span className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Địa chỉ Email đăng ký</span>} rules={[{ required: true, type: 'email' }]}>
              <Input prefix={<MailOutlined className="text-indigo-500 mr-2" />} placeholder="name@company.com" className="h-14 rounded-2xl bg-slate-50 border-2 border-slate-50 hover:border-indigo-100 focus:bg-white transition-all text-base font-medium" />
            </Form.Item>
            <Button type="primary" htmlType="submit" block loading={loading} className="h-14 rounded-2xl bg-indigo-600 border-0 shadow-lg shadow-indigo-100 font-black uppercase text-xs tracking-widest">Gửi mã xác nhận</Button>
          </Form>
        )}

        {current === 1 && (
          <Form layout="vertical" onFinish={onOtpVerify} className="space-y-6">
            <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100/50 mb-6">
              <p className="text-xs font-bold text-indigo-600 leading-relaxed text-center">Chúng tôi đã gửi mã 6 chữ số đến <strong>{email}</strong>. Vui lòng kiểm tra hộp thư đến.</p>
            </div>
            <Form.Item name="otp" label={<span className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mã xác thực OTP</span>} rules={[{ required: true, len: 6 }]}>
              <Input placeholder="0 0 0 0 0 0" maxLength={6} className="h-16 rounded-2xl bg-slate-50 border-2 border-slate-50 text-center text-3xl font-black tracking-[0.5em] focus:bg-white transition-all" />
            </Form.Item>
            <div className="flex gap-4">
              <Button onClick={() => setCurrent(0)} className="h-14 flex-1 rounded-2xl font-black border-slate-200 uppercase text-[10px]">Quay lại</Button>
              <Button type="primary" htmlType="submit" block loading={loading} className="h-14 flex-[2] rounded-2xl bg-indigo-600 border-0 shadow-lg font-black uppercase text-[10px]">Tiếp tục xác thực</Button>
            </div>
          </Form>
        )}

        {current === 2 && (
          <Form layout="vertical" onFinish={onPasswordReset} className="space-y-6">
            <Form.Item name="newPassword" label={<span className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mật khẩu mới</span>} rules={[{ required: true, min: 6 }]}>
              <Input.Password prefix={<LockOutlined className="text-indigo-500 mr-2" />} className="h-14 rounded-2xl bg-slate-50 border-2 border-slate-50" />
            </Form.Item>
            <Form.Item name="confirmPassword" label={<span className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Xác nhận mật khẩu</span>} dependencies={['newPassword']} rules={[{ required: true }, ({ getFieldValue }) => ({ validator(_, v) { return !v || getFieldValue('newPassword') === v ? Promise.resolve() : Promise.reject('Mật khẩu không khớp!'); } })]}>
              <Input.Password prefix={<LockOutlined className="text-indigo-500 mr-2" />} className="h-14 rounded-2xl bg-slate-50 border-2 border-slate-50" />
            </Form.Item>
            <Button type="primary" htmlType="submit" block loading={loading} className="h-14 rounded-2xl bg-indigo-600 border-0 shadow-lg font-black uppercase text-xs tracking-widest">Hoàn tất đặt lại</Button>
          </Form>
        )}

        <div className="mt-10 text-center">
          <Link to="/admin/login" className="text-xs font-black text-slate-400 hover:text-indigo-600 transition-colors uppercase tracking-widest flex items-center justify-center gap-2 group">
            <ArrowLeftOutlined className="group-hover:-translate-x-1 transition-transform" />
            Về trang đăng nhập
          </Link>
        </div>
      </Card>
    </div>
  );
};

export default ForgotPassword;