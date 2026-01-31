import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
    return (
        <footer className="site-footer">
            <div className="footer-container">
                <div className="footer-section">
                    <div className="footer-logo">
                        <img src="/img/logo1.png" alt="Fahasa Logo" className="footer-logo-img" />
                        <span className="site-name">Fahasa.com</span>
                    </div>
                    <p className="footer-description">
                        Fahasa.com nhận đặt hàng trực tuyến và giao hàng tận nơi. Không hỗ trợ đặt hàng qua điện thoại tại văn phòng công ty. Hãy đến Hệ thống Fahasa trên toàn quốc.
                    </p>
                    <div className="social-media">
                        <a href="#" className="social-link" aria-label="Facebook">
                            <i className="fab fa-facebook-f"></i>
                        </a>
                        <a href="#" className="social-link" aria-label="Instagram">
                            <i className="fab fa-instagram"></i>
                        </a>
                        <a href="#" className="social-link" aria-label="YouTube">
                            <i className="fab fa-youtube"></i>
                        </a>
                        <a href="#" className="social-link" aria-label="Twitter">
                            <i className="fab fa-twitter"></i>
                        </a>
                        <a href="#" className="social-link" aria-label="Google Plus">
                            <i className="fab fa-google-plus-g"></i>
                        </a>
                    </div>
                    <div className="app-links">
                        <a href="#">
                            <img src="/img/payment/anh8.jpg" alt="Google Play" />
                        </a>
                        <a href="#">
                            <img src="/img/payment/anh9.jpg" alt="App Store" />
                        </a>
                    </div>
                </div>

                <div className="footer-section">
                    <h3 className="footer-title">LIÊN HỆ</h3>
                    <p className="contact-item">
                        <i className="fas fa-map-marker-alt contact-icon"></i>
                        <span>60-62 Lê Lợi, Q.1, TP. HCM</span>
                    </p>
                    <p className="contact-item">
                        <i className="fas fa-envelope contact-icon"></i>
                        <a href="mailto:info@fahasa.com" className="contact-link">info@fahasa.com</a>
                    </p>
                    <p className="contact-item">
                        <i className="fas fa-phone-alt contact-icon"></i>
                        <a href="tel:0374170367" className="contact-link">0374170367</a>
                    </p>
                </div>

                <div className="footer-section">
                    <h3 className="footer-title">HỖ TRỢ</h3>
                    <ul className="footer-links">
                        <li><a href="#" className="footer-link">Chính sách đổi - trả</a></li>
                        <li><a href="#" className="footer-link">Chính sách bảo hành</a></li>
                        <li><a href="#" className="footer-link">Chính sách vận chuyển</a></li>
                        <li><a href="#" className="footer-link">Chính sách Khách sỉ</a></li>
                    </ul>
                </div>

                <div className="footer-section">
                    <h3 className="footer-title">TÀI KHOẢN CỦA TÔI</h3>
                    <ul className="footer-links">
                        <li><Link to="/login" className="footer-link">Đăng nhập/Tạo mới tài khoản</Link></li>
                        <li><Link to="/profile" className="footer-link">Thay đổi địa chỉ</Link></li>
                        <li><Link to="/profile" className="footer-link">Chi tiết tài khoản</Link></li>
                        <li><Link to="/orders" className="footer-link">Lịch sử mua hàng</Link></li>
                    </ul>
                </div>
            </div>

            <div className="payment-methods">
                <img src="/img/payment/anh1.jpg" alt="VNPAY" />
                <img src="/img/payment/anh2.jpg" alt="Momo" />
                <img src="/img/payment/anh3.jpg" alt="ShopeePay" />
                <img src="/img/payment/anh4.jpg" alt="ZaloPay" />
                <img src="/img/payment/anh5.jpg" alt="Banking" />
                <img src="/img/payment/anh6.jpg" alt="Visa" />
                <img src="/img/payment/anh7.jpg" alt="Mastercard" />
            </div>

            <div className="footer-bottom">
                <p>
                    Giấy chứng nhận Đăng ký Kinh doanh số 0304132047 do Sở Kế hoạch và Đầu tư Thành phố Hồ Chí Minh cấp ngày 20/12/2005, đăng ký thay đổi lần thứ 10, ngày 20/05/2022.
                </p>
            </div>
        </footer>
    );
};

export default Footer;
