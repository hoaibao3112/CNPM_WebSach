import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import './Header.css';

const Header = () => {
    const { user, isAuthenticated, logout } = useAuth();
    const { getCartCount } = useCart();
    const navigate = useNavigate();

    const [searchQuery, setSearchQuery] = useState('');
    const [searchHistory, setSearchHistory] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);

    useEffect(() => {
        const history = JSON.parse(localStorage.getItem('historySearch') || '[]');
        setSearchHistory(history);
    }, []);

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            // Add to search history
            const newHistory = [searchQuery, ...searchHistory.filter(item => item !== searchQuery)].slice(0, 5);
            setSearchHistory(newHistory);
            localStorage.setItem('historySearch', JSON.stringify(newHistory));

            // Navigate to products page with search query
            navigate(`/products?search=${encodeURIComponent(searchQuery)}`);
            setShowSuggestions(false);
        }
    };

    const clearHistory = () => {
        setSearchHistory([]);
        localStorage.setItem('historySearch', JSON.stringify([]));
    };

    const handleLogout = async () => {
        logout();
        navigate('/');
    };

    // Categories hardcoded (should be fetched from API in production)
    const categories = [
        { id: 1, name: 'Truyện Tranh - Comic' },
        { id: 2, name: 'Văn học nước ngoài' },
        { id: 3, name: 'Sale cuối năm 2022' },
        { id: 4, name: 'Sách Văn Học' },
        { id: 5, name: 'Truyện Tranh BL' },
        { id: 6, name: 'Sách Kỹ Năng Sống' },
        { id: 7, name: 'Sách Thiếu Nhi' },
        { id: 8, name: 'Light Novel' },
        { id: 9, name: 'Văn Phòng Phẩm - Quà Tặng' },
    ];

    return (
        <div className="top-bar">
            <div className="top-bar-container">
                <Link to="/">
                    <img src="/img/logo1.png" alt="BaoStore" className="logo" />
                </Link>

                <div className="search-container">
                    <form id="search-form" onSubmit={handleSearch}>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onFocus={() => setShowSuggestions(true)}
                            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                            placeholder="Tìm kiếm sách, tác giả..."
                            autoComplete="off"
                        />
                        <button type="submit">
                            <i className="fas fa-search"></i>
                        </button>
                    </form>

                    {showSuggestions && (
                        <div className="suggestion-box active">
                            <div className="search-history-container">
                                <span className="section-title">Lịch sử tìm kiếm</span>
                                {searchHistory.length > 0 && (
                                    <span className="clear-history" onClick={clearHistory}>
                                        Xóa tất cả
                                    </span>
                                )}
                                <div className="search-history">
                                    {searchHistory.map((item, index) => (
                                        <div key={index} className="tag">
                                            <p onClick={() => {
                                                setSearchQuery(item);
                                                navigate(`/products?search=${encodeURIComponent(item)}`);
                                            }}>
                                                {item}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <ul className="top-links">
                    <li className="category-top-dropdown">
                        <a href="#">
                            <i className="fas fa-book"></i> Danh mục <i className="fas fa-chevron-down"></i>
                        </a>
                        <div className="dropdown-content">
                            {categories.map((category) => (
                                <Link key={category.id} to={`/products?category=${category.id}`}>
                                    {category.name}
                                </Link>
                            ))}
                        </div>
                    </li>

                    <li className="publisher-dropdown">
                        <Link to="/author">
                            <i className="fas fa-pen-nib publisher-icon"></i>
                            Tác giả
                        </Link>
                    </li>

                    <li className="account-dropdown">
                        {isAuthenticated() ? (
                            <div className="logged-in-account">
                                <div className="accountLinkDiv">
                                    <a href="#" style={{ marginRight: '5px' }}>
                                        <i className="fas fa-user"></i> {user?.tenkh || user?.hoten || user?.username}
                                    </a>
                                    <i className="fas fa-chevron-down"></i>
                                </div>
                                <div className="dropdown-content">
                                    <Link to="/profile">
                                        <i className="fas fa-user-circle"></i> Hồ sơ
                                    </Link>
                                    <a href="#" onClick={handleLogout}>
                                        <i className="fas fa-sign-out-alt"></i> Đăng xuất
                                    </a>
                                </div>
                            </div>
                        ) : (
                            <>
                                <Link to="/login">
                                    <i className="fas fa-user"></i>
                                    <span className="textTK" style={{ marginRight: '5px' }}>Tài khoản</span>
                                    <i className="fas fa-chevron-down"></i>
                                </Link>
                                <div className="dropdown-content">
                                    <Link to="/login">
                                        <i className="fas fa-sign-in-alt"></i> Đăng nhập
                                    </Link>
                                    <Link to="/register">
                                        <i className="fas fa-user-plus"></i> Đăng ký
                                    </Link>
                                </div>
                            </>
                        )}
                    </li>

                    <li>
                        <Link to="/cart">
                            <i className="fas fa-shopping-cart"></i> Giỏ hàng ({getCartCount()})
                        </Link>
                    </li>
                </ul>
            </div>
        </div>
    );
};

export default Header;
