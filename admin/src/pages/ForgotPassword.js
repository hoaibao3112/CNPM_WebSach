import React, { useState } from 'react';
import api from '../utils/api';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../styles/ForgotPassword.css';
const ForgotPassword = () => {
  const [step, setStep] = useState(1); // 1: Nhập email, 2: Nhập OTP, 3: Đặt mật khẩu mới
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await api.post('/forgot-password/send-otp', { email });
      toast.success(response.data.message);
      setStep(2);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Lỗi khi gửi OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await api.post('/forgot-password/verify-otp', { email, otp });
      toast.success(response.data.message);
      setResetToken(response.data.resetToken);
      setStep(3);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Lỗi khi xác thực OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error('Mật khẩu mới và xác nhận mật khẩu không khớp');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/forgot-password/reset-password', {
        email,
        resetToken,
        newPassword
      });
      toast.success(response.data.message);
      navigate('/admin/login');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Lỗi khi đặt lại mật khẩu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-password-container">
      <div className="forgot-password-card">
        <h2 className="forgot-password-title">
          {step === 1 && 'Quên mật khẩu'}
          {step === 2 && 'Nhập mã OTP'}
          {step === 3 && 'Đặt lại mật khẩu'}
        </h2>

        {/* Step indicator */}
        <div className="step-indicator">
          <div className={`step ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>1</div>
          <div className={`step ${step >= 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>2</div>
          <div className={`step ${step >= 3 ? 'active' : ''}`}>3</div>
          <div className="step-line">
            <div
              className="step-line-progress"
              style={{ width: step === 1 ? '0%' : step === 2 ? '50%' : '100%' }}
            ></div>
          </div>
        </div>

        {/* Step 1: Nhập email */}
        {step === 1 && (
          <form className="forgot-password-form" onSubmit={handleSendOtp}>
            <div className="form-group">
              <label htmlFor="email">Email đăng ký</label>
              <input
                id="email"
                type="email"
                placeholder="Nhập email của bạn"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="forgot-password-btn" disabled={loading}>
              {loading ? 'Đang gửi...' : 'Gửi mã OTP'}
            </button>
          </form>
        )}

        {/* Step 2: Nhập OTP */}
        {step === 2 && (
          <form className="forgot-password-form" onSubmit={handleVerifyOtp}>
            <div className="otp-instructions">
              Chúng tôi đã gửi mã OTP đến email <strong>{email}</strong>.
              Vui lòng kiểm tra và nhập mã bên dưới.
            </div>

            <div className="form-group">
              <label htmlFor="otp">Mã OTP</label>
              <input
                id="otp"
                type="text"
                placeholder="Nhập mã OTP 6 chữ số"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
              />
            </div>

            <div className="navigation-buttons">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="secondary-btn"
              >
                Quay lại
              </button>
              <button
                type="submit"
                className="forgot-password-btn"
                disabled={loading}
              >
                {loading ? 'Đang xác thực...' : 'Xác thực'}
              </button>
            </div>
          </form>
        )}

        {/* Step 3: Đặt mật khẩu mới */}
        {step === 3 && (
          <form className="forgot-password-form" onSubmit={handleResetPassword}>
            <div className="form-group">
              <label htmlFor="newPassword">Mật khẩu mới</label>
              <input
                id="newPassword"
                type="password"
                placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  // Có thể thêm logic kiểm tra độ mạnh mật khẩu ở đây
                }}
                required
                minLength="6"
              />
              <div className="password-strength">
                <div className="password-strength-bar" style={{
                  width: newPassword.length === 0 ? '0%' :
                    newPassword.length < 6 ? '30%' :
                      newPassword.length < 8 ? '60%' : '100%',
                  backgroundColor: newPassword.length === 0 ? '#e74c3c' :
                    newPassword.length < 6 ? '#e74c3c' :
                      newPassword.length < 8 ? '#f39c12' : '#2ecc71'
                }}></div>
              </div>
              <div className="password-strength-text">
                {newPassword.length === 0 ? 'Vui lòng nhập mật khẩu' :
                  newPassword.length < 6 ? 'Mật khẩu yếu' :
                    newPassword.length < 8 ? 'Mật khẩu trung bình' : 'Mật khẩu mạnh'}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Xác nhận mật khẩu</label>
              <input
                id="confirmPassword"
                type="password"
                placeholder="Nhập lại mật khẩu mới"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength="6"
              />
              {confirmPassword && newPassword !== confirmPassword && (
                <div className="error-message">Mật khẩu không khớp</div>
              )}
            </div>

            <button
              type="submit"
              className="forgot-password-btn"
              disabled={loading || (newPassword && newPassword !== confirmPassword)}
            >
              {loading ? 'Đang xử lý...' : 'Đặt lại mật khẩu'}
            </button>
          </form>
        )}

        <div className="back-to-login">
          <Link to="/login">Quay lại trang đăng nhập</Link>
        </div>
      </div>
    </div>
  );
};
export default ForgotPassword;