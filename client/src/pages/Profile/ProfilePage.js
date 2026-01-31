import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import authService from '../../services/authService';
import { toast } from 'react-toastify';
import Loading from '../../components/Common/Loading';
import './ProfilePage.css';

const ProfilePage = () => {
    const { user, updateUser } = useAuth();
    const [loading, setLoading] = useState(true);
    const [activeSection, setActiveSection] = useState('profile');

    const [profileData, setProfileData] = useState({
        tenkh: '',
        sdt: '',
        email: '',
        diachi: ''
    });

    const [passwordData, setPasswordData] = useState({
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    useEffect(() => {
        if (user) {
            fetchProfile();
        }
    }, [user]);

    const fetchProfile = async () => {
        try {
            setLoading(true);
            const data = await authService.getProfile();
            const userData = data.user || data;
            setProfileData({
                tenkh: userData.tenkh || userData.hoten || '',
                sdt: userData.sdt || '',
                email: userData.email || '',
                diachi: userData.diachi || ''
            });
            // Sync with context if needed
            updateUser(userData);
        } catch (error) {
            console.error('Error fetching profile:', error);
            toast.error('Không thể tải thông tin hồ sơ');
        } finally {
            setLoading(false);
        }
    };

    const handleProfileChange = (e) => {
        const { name, value } = e.target;
        setProfileData(prev => ({ ...prev, [name]: value }));
    };

    const handlePasswordChange = (e) => {
        const { name, value } = e.target;
        setPasswordData(prev => ({ ...prev, [name]: value }));
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            await authService.updateProfile(profileData);
            toast.success('Cập nhật hồ sơ thành công');
            fetchProfile();
        } catch (error) {
            toast.error(error.message || 'Lỗi khi cập nhật hồ sơ');
        } finally {
            setLoading(false);
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            toast.error('Mật khẩu xác nhận không khớp');
            return;
        }
        try {
            setLoading(true);
            await authService.changePassword({
                oldPassword: passwordData.oldPassword,
                newPassword: passwordData.newPassword
            });
            toast.success('Đổi mật khẩu thành công');
            setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
        } catch (error) {
            toast.error(error.message || 'Lỗi khi đổi mật khẩu');
        } finally {
            setLoading(false);
        }
    };

    if (loading && !profileData.email) return <Loading />;

    return (
        <div className="profile-page">
            <div className="container">
                <div className="profile-layout">
                    <aside className="profile-sidebar">
                        <div className="user-summary">
                            <div className="avatar">
                                <i className="fas fa-user-circle fa-4x"></i>
                            </div>
                            <h3>{profileData.tenkh || 'Người dùng'}</h3>
                            <p>{profileData.email}</p>
                        </div>
                        <nav className="profile-nav">
                            <button
                                className={activeSection === 'profile' ? 'active' : ''}
                                onClick={() => setActiveSection('profile')}
                            >
                                <i className="fas fa-user"></i> Thông tin tài khoản
                            </button>
                            <button
                                className={activeSection === 'address' ? 'active' : ''}
                                onClick={() => setActiveSection('address')}
                            >
                                <i className="fas fa-map-marker-alt"></i> Sổ địa chỉ
                            </button>
                            <button
                                className={activeSection === 'password' ? 'active' : ''}
                                onClick={() => setActiveSection('password')}
                            >
                                <i className="fas fa-key"></i> Đổi mật khẩu
                            </button>
                            <button
                                className={activeSection === 'membership' ? 'active' : ''}
                                onClick={() => setActiveSection('membership')}
                            >
                                <i className="fas fa-id-card"></i> Thẻ thành viên
                            </button>
                        </nav>
                    </aside>

                    <main className="profile-content">
                        {activeSection === 'profile' && (
                            <div className="section">
                                <h2>Hồ sơ cá nhân</h2>
                                <form onSubmit={handleUpdateProfile}>
                                    <div className="form-group">
                                        <label>Họ và Tên</label>
                                        <input
                                            type="text"
                                            name="tenkh"
                                            value={profileData.tenkh}
                                            onChange={handleProfileChange}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Số điện thoại</label>
                                        <input
                                            type="text"
                                            name="sdt"
                                            value={profileData.sdt}
                                            onChange={handleProfileChange}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Email</label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={profileData.email}
                                            disabled
                                        />
                                        <small>Email không thể thay đổi</small>
                                    </div>
                                    <div className="form-group">
                                        <label>Địa chỉ</label>
                                        <input
                                            type="text"
                                            name="diachi"
                                            value={profileData.diachi}
                                            onChange={handleProfileChange}
                                        />
                                    </div>
                                    <button type="submit" className="btn-save" disabled={loading}>
                                        {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
                                    </button>
                                </form>
                            </div>
                        )}

                        {activeSection === 'password' && (
                            <div className="section">
                                <h2>Đổi mật khẩu</h2>
                                <form onSubmit={handleChangePassword}>
                                    <div className="form-group">
                                        <label>Mật khẩu hiện tại</label>
                                        <input
                                            type="password"
                                            name="oldPassword"
                                            value={passwordData.oldPassword}
                                            onChange={handlePasswordChange}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Mật khẩu mới</label>
                                        <input
                                            type="password"
                                            name="newPassword"
                                            value={passwordData.newPassword}
                                            onChange={handlePasswordChange}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Xác nhận mật khẩu mới</label>
                                        <input
                                            type="password"
                                            name="confirmPassword"
                                            value={passwordData.confirmPassword}
                                            onChange={handlePasswordChange}
                                            required
                                        />
                                    </div>
                                    <button type="submit" className="btn-save" disabled={loading}>
                                        {loading ? 'Đang xử lý...' : 'Thay đổi mật khẩu'}
                                    </button>
                                </form>
                            </div>
                        )}

                        {activeSection === 'address' && (
                            <div className="section">
                                <h2>Sổ địa chỉ</h2>
                                <div className="address-list">
                                    <div className="address-item default">
                                        <div className="address-header">
                                            <span>Địa chỉ mặc định</span>
                                        </div>
                                        <div className="address-info">
                                            <p><strong>{profileData.tenkh}</strong></p>
                                            <p>{profileData.sdt}</p>
                                            <p>{profileData.diachi || 'Chưa cập nhật địa chỉ'}</p>
                                        </div>
                                    </div>
                                </div>
                                <button className="btn-add-address" onClick={() => toast.info('Tính năng đang phát triển')}>
                                    + Thêm địa chỉ mới
                                </button>
                            </div>
                        )}

                        {activeSection === 'membership' && (
                            <div className="section">
                                <h2>Thẻ thành viên</h2>
                                <div className="membership-card-display">
                                    <div className="card-header">
                                        <span className="tier">Bạc</span>
                                        <span className="label">Thành viên Fahasa</span>
                                    </div>
                                    <div className="card-body">
                                        <div className="points-display">
                                            <strong>1,250</strong>
                                            <span>Điểm F-Point</span>
                                        </div>
                                        <div className="progress-container">
                                            <div className="progress-bar">
                                                <div className="fill" style={{ width: '25%' }}></div>
                                            </div>
                                            <small>25% tới mốc Vàng (5,000 điểm)</small>
                                        </div>
                                    </div>
                                </div>
                                <div className="benefits-list">
                                    <h3>Quyền lợi hạng Bạc</h3>
                                    <ul>
                                        <li><i className="fas fa-check-circle"></i> Giảm 3% cho mỗi đơn hàng</li>
                                        <li><i className="fas fa-check-circle"></i> Miễn phí vận chuyển cho đơn trên 200k</li>
                                        <li><i className="fas fa-check-circle"></i> Tích điểm hoàn tiền gấp 1.2 lần</li>
                                    </ul>
                                </div>
                            </div>
                        )}
                    </main>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;
