import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import authService from '../../services/authService';
import { validateEmail, validateRequired } from '../../utils/validators';
import { toast } from 'react-toastify';
import './LoginPage.css';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [forgotStep, setForgotStep] = useState(1);
    const [forgotEmail, setForgotEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [otpToken, setOtpToken] = useState('');
    const [resetToken, setResetToken] = useState('');

    const { login } = useAuth();
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();

        // Validation
        if (!validateRequired(email) || !validateRequired(password)) {
            toast.error('Vui lòng nhập đầy đủ email và mật khẩu');
            return;
        }

        if (!validateEmail(email)) {
            toast.error('Email không hợp lệ');
            return;
        }

        setLoading(true);
        try {
            const data = await authService.login(email, password);

            // Save to context and localStorage
            login(data.user, data.token);

            toast.success('Đăng nhập thành công!');
            navigate('/');
        } catch (error) {
            console.error('Login error:', error);
            toast.error(error.error || error.message || 'Đăng nhập thất bại');
        } finally {
            setLoading(false);
        }
    };

    // Forgot Password Step 1: Send OTP
    const handleSendOTP = async () => {
        if (!validateEmail(forgotEmail)) {
            toast.error('Vui lòng nhập email hợp lệ');
            return;
        }

        setLoading(true);
        try {
            const data = await authService.sendOTP(forgotEmail);
            setOtpToken(data.token);
            setForgotStep(2);
            toast.success('Mã OTP đã được gửi đến email của bạn');
        } catch (error) {
            toast.error(error.error || error.message || 'Có lỗi khi gửi OTP');
        } finally {
            setLoading(false);
        }
    };

    // Forgot Password Step 2: Verify OTP
    const handleVerifyOTP = async () => {
        if (!validateRequired(otp)) {
            toast.error('Vui lòng nhập mã OTP');
            return;
        }

        setLoading(true);
        try {
            const data = await authService.verifyOTP(forgotEmail, otp, otpToken);
            setResetToken(data.resetToken);
            setForgotStep(3);
            toast.success('Xác nhận OTP thành công');
        } catch (error) {
            toast.error(error.error || error.message || 'Mã OTP không đúng hoặc đã hết hạn');
        } finally {
            setLoading(false);
        }
    };

    // Forgot Password Step 3: Reset Password
    const handleResetPassword = async () => {
        if (!validateRequired(newPassword) || !validateRequired(confirmPassword)) {
            toast.error('Vui lòng nhập đầy đủ mật khẩu');
            return;
        }

        if (newPassword !== confirmPassword) {
            toast.error('Mật khẩu không khớp');
            return;
        }

        if (newPassword.length < 6) {
            toast.error('Mật khẩu phải có ít nhất 6 ký tự');
            return;
        }

        setLoading(true);
        try {
            await authService.resetPassword(forgotEmail, newPassword, resetToken);
            toast.success('Đặt lại mật khẩu thành công!');

            // Reset modal and close
            setShowForgotPassword(false);
            setForgotStep(1);
            setForgotEmail('');
            setOtp('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error) {
            toast.error(error.error || error.message || 'Đặt lại mật khẩu thất bại');
        } finally {
            setLoading(false);
        }
    };

    const closeForgotPasswordModal = () => {
        setShowForgotPassword(false);
        setForgotStep(1);
        setForgotEmail('');
        setOtp('');
        setNewPassword('');
        setConfirmPassword('');
    };

    return (
        <div className="login-page">
            <div className="login-container">
                <form className="login-form" onSubmit={handleLogin}>
                    <h1>Classy Login Form</h1>

                    <div className="form-group">
                        <i className="fa fa-user"></i>
                        <input
                            type="text"
                            id="email"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <i className="fa fa-lock"></i>
                        <input
                            type="password"
                            id="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <div className="options">
                        <label>
                            <input
                                type="checkbox"
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                            />
                            Remember me
                        </label>
                        <a href="#" onClick={(e) => { e.preventDefault(); setShowForgotPassword(true); }}>
                            Forgot Password?
                        </a>
                    </div>

                    <button type="submit" className="login-btn" disabled={loading}>
                        {loading ? <><i className="fas fa-spinner fa-spin"></i> Đang xử lý...</> : 'Login'}
                    </button>

                    <div className="or-separator">or</div>

                    <div className="register-link">
                        Chưa có tài khoản? <Link to="/register">Đăng ký ngay</Link>
                    </div>
                </form>
            </div>

            {/* Forgot Password Modal */}
            {showForgotPassword && (
                <div className="modal" onClick={closeForgotPasswordModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <span className="close-modal" onClick={closeForgotPasswordModal}>&times;</span>
                        <h2>Quên Mật Khẩu</h2>

                        {/* Step 1: Enter Email */}
                        {forgotStep === 1 && (
                            <div id="step1">
                                <div className="form-group">
                                    <i className="fa fa-envelope"></i>
                                    <input
                                        type="email"
                                        placeholder="Nhập email đăng ký"
                                        value={forgotEmail}
                                        onChange={(e) => setForgotEmail(e.target.value)}
                                        required
                                    />
                                </div>
                                <button className="login-btn" onClick={handleSendOTP} disabled={loading}>
                                    {loading ? 'Đang gửi...' : 'Gửi mã OTP'}
                                </button>
                            </div>
                        )}

                        {/* Step 2: Enter OTP */}
                        {forgotStep === 2 && (
                            <div id="step2">
                                <div className="form-group">
                                    <i className="fa fa-key"></i>
                                    <input
                                        type="text"
                                        placeholder="Nhập mã OTP"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value)}
                                        required
                                    />
                                </div>
                                <button className="login-btn" onClick={handleVerifyOTP} disabled={loading}>
                                    {loading ? 'Đang xác nhận...' : 'Xác nhận OTP'}
                                </button>
                            </div>
                        )}

                        {/* Step 3: Reset Password */}
                        {forgotStep === 3 && (
                            <div id="step3">
                                <div className="form-group">
                                    <i className="fa fa-lock"></i>
                                    <input
                                        type="password"
                                        placeholder="Mật khẩu mới"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <i className="fa fa-lock"></i>
                                    <input
                                        type="password"
                                        placeholder="Xác nhận mật khẩu"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                    />
                                </div>
                                <button className="login-btn" onClick={handleResetPassword} disabled={loading}>
                                    {loading ? 'Đang xử lý...' : 'Đặt lại mật khẩu'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default LoginPage;
