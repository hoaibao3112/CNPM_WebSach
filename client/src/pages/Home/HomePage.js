import React, { useEffect, useState } from 'react';
import productService from '../../services/productService';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import { formatCurrency } from '../../utils/formatters';
import { toast } from 'react-toastify';
import Loading from '../../components/Common/Loading';
import './HomePage.css';

const HomePage = () => {
    const [newProducts, setNewProducts] = useState([]);
    const [promotionProducts, setPromotionProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const { addToCart } = useCart();

    useEffect(() => {
        loadProducts();
    }, []);

    const loadProducts = async () => {
        setLoading(true);
        try {
            const [newProds, promoProds] = await Promise.all([
                productService.getNewProducts(12),
                productService.getPromotionProducts(12),
            ]);
            setNewProducts(newProds);
            setPromotionProducts(promoProds);
        } catch (error) {
            console.error('Error loading products:', error);
            toast.error('Không thể tải sản phẩm');
        } finally {
            setLoading(false);
        }
    };

    const handleProductClick = (productId) => {
        navigate(`/product/${productId}`);
    };

    const handleAddToCart = (e, product) => {
        e.stopPropagation();
        addToCart(product, 1);
    };

    const renderProductCard = (product) => {
        const productId = product.MaSP || product.masp;
        const productName = product.TenSP || product.tensp;
        const productImage = product.HinhAnh || product.hinhanh;
        const productPrice = product.GiaBan || product.giaban;
        const productDiscount = product.GiamGia || product.giamgia;

        return (
            <div
                key={productId}
                className="product-card"
                onClick={() => handleProductClick(productId)}
            >
                <div className="product-image">
                    <img src={`/img/product/${productImage}`} alt={productName} />
                    {productDiscount > 0 && (
                        <span className="discount-badge">-{productDiscount}%</span>
                    )}
                </div>
                <div className="product-info">
                    <h3 className="product-name">{productName}</h3>
                    <div className="product-price">
                        {productDiscount > 0 ? (
                            <>
                                <span className="current-price">
                                    {formatCurrency(productPrice * (1 - productDiscount / 100))}
                                </span>
                                <span className="original-price">
                                    {formatCurrency(productPrice)}
                                </span>
                            </>
                        ) : (
                            <span className="current-price">{formatCurrency(productPrice)}</span>
                        )}
                    </div>
                    <button
                        className="add-to-cart-btn"
                        onClick={(e) => handleAddToCart(e, product)}
                    >
                        <i className="fas fa-cart-plus"></i> Thêm vào giỏ
                    </button>
                </div>
            </div>
        );
    };

    if (loading) {
        return <Loading message="Đang tải trang chủ..." />;
    }

    return (
        <div className="home-page">
            {/* Banner Slideshow */}
            <div className="grid-slideshow">
                <div className="slide-large">
                    <img src="/img/anhnen/17d.jpg" alt="Slide lớn" />
                </div>
                <div className="slide-small">
                    <img src="/img/anhnen/18d.jpg" alt="Slide nhỏ 1" />
                </div>
                <div className="slide-small">
                    <img src="/img/anhnen/14d.jpg" alt="Slide nhỏ 2" />
                </div>
            </div>

            {/* Promotion Cards */}
            <div className="promotion-cards">
                <div className="promo-card" onClick={() => navigate('/promotions/giamgia')}>
                    <img src="/img/giamgia/anh1.jpg" alt="Ưu đãi tháng 5" />
                    <p>Ưu đãi tháng 5</p>
                </div>
                <div className="promo-card" onClick={() => navigate('/promotions/flashsale')}>
                    <img src="/img/giamgia/anh2.jpg" alt="Flash Sale" />
                    <p>Flash Sale</p>
                </div>
                <div className="promo-card" onClick={() => navigate('/promotions/dinhtbooks')}>
                    <img src="/img/giamgia/anh3.jpg" alt="Đinh Tị Books" />
                    <p>Đinh Tị Books</p>
                </div>
                <div className="promo-card" onClick={() => navigate('/promotions/alphabooks')}>
                    <img src="/img/giamgia/anh4.jpg" alt="Alpha Books" />
                    <p>Alpha Books</p>
                </div>
                <div className="promo-card" onClick={() => navigate('/promotions/coupons')}>
                    <img src="/img/giamgia/anh5.jpg" alt="Phiếu giảm giá" />
                    <p>Phiếu giảm giá</p>
                </div>
                <div className="promo-card" onClick={() => navigate('/promotions/newproducts')}>
                    <img src="/img/giamgia/anh6.jpg" alt="Sản phẩm mới" />
                    <p>Sản phẩm mới</p>
                </div>
                <div className="promo-card" onClick={() => navigate('/promotions/comics')}>
                    <img src="/img/giamgia/anh9.jpg" alt="Truyện tranh" />
                    <p>Truyện tranh</p>
                </div>
            </div>

            {/* New Products Section */}
            <div className="product-section">
                <h2>Sách Mới</h2>
                <div className="product-container">
                    {newProducts.length > 0 ? (
                        newProducts.map((product) => renderProductCard(product))
                    ) : (
                        <p>Không có sản phẩm mới</p>
                    )}
                </div>
            </div>

            {/* Promotion Products Section */}
            <div className="product-section promotion-section">
                <h2>Sách Khuyến Mãi</h2>
                <div className="product-container">
                    {promotionProducts.length > 0 ? (
                        promotionProducts.map((product) => renderProductCard(product))
                    ) : (
                        <p>Không có sản phẩm khuyến mãi</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default HomePage;
