import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import authService from '../../services/authService';
import { validateEmail, validateRequired, validatePassword, validatePasswordMatch } from '../../utils/validators';
import { toast } from 'react-toastify';
import './RegisterPage.css';

const RegisterPage = () => {
    const [step, setStep] = useState(1);
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [otpToken, setOtpToken] = useState('');

    const { login } = useAuth();
    const navigate = useNavigate();

    // Step 1: Send OTP
    const handleSendOTP = async (e) => {
        e.preventDefault();

        if (!validateRequired(username)) {
            toast.error('Vui lòng nhập tên đăng nhập');
            return;
        }

        if (!validateEmail(email)) {
            toast.error('Email không hợp lệ');
            return;
        }

        setLoading(true);
        try {
            const data = await authService.sendOTP(email);
            setOtpToken(data.token);
            setStep(2);
            toast.success('Mã OTP đã được gửi đến email của bạn');
        } catch (error) {
            toast.error(error.error || error.message || 'Có lỗi khi gửi OTP');
        } finally {
            setLoading(false);
        }
    };

    // Step 2: Verify OTP
    const handleVerifyOTP = async (e) => {
        e.preventDefault();

        if (!validateRequired(otp)) {
            toast.error('Vui lòng nhập mã OTP');
            return;
        }

        setLoading(true);
        try {
            await authService.verifyOTP(email, otp, otpToken);
            setStep(3);
            toast.success('Xác nhận OTP thành công');
        } catch (error) {
            toast.error(error.error || error.message || 'Mã OTP không đúng hoặc đã hết hạn');
        } finally {
            setLoading(false);
        }
    };

    // Step 3: Set Password and Register
    const handleRegister = async (e) => {
        e.preventDefault();

        if (!validatePassword(password)) {
            toast.error('Mật khẩu phải có ít nhất 6 ký tự');
            return;
        }

        if (!validatePasswordMatch(password, confirmPassword)) {
            toast.error('Mật khẩu không khớp');
            return;
        }

        setLoading(true);
        try {
            const data = await authService.register({
                username,
                email,
                matkhau: password,
                otp,
                token: otpToken,
            });

            // Auto login after registration
            login(data.user, data.token);

            toast.success('Đăng ký thành công!');
            navigate('/');
        } catch (error) {
            toast.error(error.error || error.message || 'Đăng ký thất bại');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="register-page">
            <div className="register-container">
                <h2>Đăng ký tài khoản</h2>

                {/* Step 1: Username and Email */}
                {step === 1 && (
                    <div id="step1">
                        <form onSubmit={handleSendOTP}>
                            <div className="form-group">
                                <label htmlFor="username">Tên đăng nhập</label>
                                <input
                                    type="text"
                                    id="username"
                                    name="username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="email">Email</label>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <button type="submit" disabled={loading}>
                                {loading ? 'Đang gửi...' : 'Gửi mã OTP'}
                            </button>
                        </form>
                    </div>
                )}

                {/* Step 2: Verify OTP */}
                {step === 2 && (
                    <div id="step2">
                        <form onSubmit={handleVerifyOTP}>
                            <div className="form-group">
                                <label htmlFor="otpCode">Mã OTP</label>
                                <input
                                    type="text"
                                    id="otpCode"
                                    name="otpCode"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    required
                                />
                                <small>Mã OTP đã được gửi đến email {email}</small>
                            </div>
                            <button type="submit" disabled={loading}>
                                {loading ? 'Đang xác nhận...' : 'Xác nhận OTP'}
                            </button>
                        </form>
                    </div>
                )}

                {/* Step 3: Set Password */}
                {step === 3 && (
                    <div id="step3">
                        <form onSubmit={handleRegister}>
                            <div className="form-group">
                                <label htmlFor="password">Mật khẩu</label>
                                <input
                                    type="password"
                                    id="password"
                                    name="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="confirmPassword">Nhập lại mật khẩu</label>
                                <input
                                    type="password"
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                />
                            </div>
                            <button type="submit" disabled={loading}>
                                {loading ? 'Đang đăng ký...' : 'Đăng ký'}
                            </button>
                        </form>
                    </div>
                )}

                <div className="login-link">
                    Đã có tài khoản? <Link to="/login">Đăng nhập ngay</Link>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;
