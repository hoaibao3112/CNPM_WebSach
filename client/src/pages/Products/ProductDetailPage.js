import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import productService from '../../services/productService';
import { useCart } from '../../contexts/CartContext';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { toast } from 'react-toastify';
import Loading from '../../components/Common/Loading';
import ProductCard from '../../components/Products/ProductCard';
import './ProductDetailPage.css';

const ProductDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { addToCart } = useCart();

    const [product, setProduct] = useState(null);
    const [relatedProducts, setRelatedProducts] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [quantity, setQuantity] = useState(1);
    const [activeTab, setActiveTab] = useState('description');
    const [mainImage, setMainImage] = useState('');

    useEffect(() => {
        loadProductData();
        window.scrollTo(0, 0);
    }, [id]);

    const loadProductData = async () => {
        setLoading(true);
        try {
            const data = await productService.getProductById(id);
            setProduct(data);
            setMainImage(data.HinhAnh || 'default-book.jpg');

            // Load related products by category
            if (data.MaTL) {
                const related = await productService.getProductsByCategory(data.MaTL);
                setRelatedProducts(related.filter(p => (p.MaSP || p.masp) !== parseInt(id)).slice(0, 5));
            }

            // Load reviews
            const productReviews = await productService.getProductReviews(id);
            setReviews(Array.isArray(productReviews) ? productReviews : []);

        } catch (error) {
            console.error('Error loading product detail:', error);
            toast.error('Không thể tải chi tiết sản phẩm');
        } finally {
            setLoading(false);
        }
    };

    const handleQuantityChange = (val) => {
        const newQty = quantity + val;
        if (newQty >= 1 && newQty <= (product.SoLuong || 99)) {
            setQuantity(newQty);
        }
    };

    const handleAddToCart = () => {
        addToCart(product, quantity);
    };

    const handleBuyNow = () => {
        addToCart(product, quantity);
        navigate('/cart');
    };

    if (loading) return <Loading message="Đang tải chi tiết sản phẩm..." />;
    if (!product) return <div className="container">Sản phẩm không tồn tại.</div>;

    const discount = product.PhanTramGiam || 0;
    const currentPrice = product.DonGia || product.GiaBan || 0;
    const originalPrice = discount > 0 ? currentPrice / (1 - discount / 100) : null;

    return (
        <div className="product-detail-page">
            <div className="container">
                <nav className="breadcrumb">
                    <span onClick={() => navigate('/')}>Trang chủ</span>
                    <i className="fas fa-chevron-right"></i>
                    <span onClick={() => navigate('/products')}>Sách</span>
                    <i className="fas fa-chevron-right"></i>
                    <span className="active">{product.TenSP}</span>
                </nav>

                <div className="product-main-info">
                    <div className="product-gallery">
                        <div className="main-image">
                            <img
                                src={`/img/product/${mainImage}`}
                                alt={product.TenSP}
                                onError={(e) => { e.target.src = '/img/default-book.jpg'; }}
                            />
                        </div>
                        <div className="thumbnails">
                            <img
                                src={`/img/product/${product.HinhAnh || 'default-book.jpg'}`}
                                className={mainImage === product.HinhAnh ? 'active' : ''}
                                onClick={() => setMainImage(product.HinhAnh)}
                                alt="Thumb 1"
                                onError={(e) => { e.target.src = '/img/default-book.jpg'; }}
                            />
                            {/* In a real app, we might have multiple images. Here we use the same one or placeholders if available */}
                        </div>
                    </div>

                    <div className="product-details">
                        <h1 className="product-name">{product.TenSP}</h1>
                        <div className="product-meta">
                            <span>Tác giả: <strong>{product.TacGia || 'Đang cập nhật'}</strong></span>
                            <span> | </span>
                            <span>NXB: <strong>{product.NhaXuatBan || 'Đang cập nhật'}</strong></span>
                        </div>

                        <div className="product-price-section">
                            <div className="price-box">
                                <span className="current-price">{formatCurrency(currentPrice)}</span>
                                {originalPrice && (
                                    <span className="original-price">{formatCurrency(originalPrice)}</span>
                                )}
                                {discount > 0 && <span className="discount-tag">-{discount}%</span>}
                            </div>
                            <div className="stock-info">
                                Tình trạng: <span className={product.SoLuong > 0 ? 'in-stock' : 'out-of-stock'}>
                                    {product.SoLuong > 0 ? 'Còn hàng' : 'Hết hàng'}
                                </span>
                            </div>
                        </div>

                        <div className="product-description-short">
                            <p>{product.MoTa ? product.MoTa.substring(0, 200) + '...' : 'Chưa có mô tả cho sản phẩm này.'}</p>
                        </div>

                        <div className="purchase-section">
                            <div className="quantity-selector">
                                <label>Số lượng:</label>
                                <div className="qty-controls">
                                    <button onClick={() => handleQuantityChange(-1)} disabled={quantity <= 1}>-</button>
                                    <input type="number" value={quantity} readOnly />
                                    <button onClick={() => handleQuantityChange(1)}>+</button>
                                </div>
                            </div>

                            <div className="action-btns">
                                <button className="btn-add-cart" onClick={handleAddToCart} disabled={product.SoLuong <= 0}>
                                    <i className="fas fa-cart-plus"></i> Thêm vào giỏ hàng
                                </button>
                                <button className="btn-buy-now" onClick={handleBuyNow} disabled={product.SoLuong <= 0}>
                                    Mua ngay
                                </button>
                            </div>
                        </div>

                        <div className="policy-info">
                            <div className="policy-item">
                                <i className="fas fa-truck"></i>
                                <span>Giao hàng toàn quốc</span>
                            </div>
                            <div className="policy-item">
                                <i className="fas fa-undo"></i>
                                <span>Hoàn trả dễ dàng trong 7 ngày</span>
                            </div>
                            <div className="policy-item">
                                <i className="fas fa-shield-alt"></i>
                                <span>Sách chính hãng 100%</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="product-tabs">
                    <div className="tab-headers">
                        <button className={activeTab === 'description' ? 'active' : ''} onClick={() => setActiveTab('description')}>
                            Mô tả sản phẩm
                        </button>
                        <button className={activeTab === 'reviews' ? 'active' : ''} onClick={() => setActiveTab('reviews')}>
                            Đánh giá ({reviews.length})
                        </button>
                    </div>
                    <div className="tab-content">
                        {activeTab === 'description' ? (
                            <div className="description-content">
                                <div dangerouslySetInnerHTML={{ __html: product.MoTa || 'Chưa có mô tả.' }} />

                                <div className="specs-table">
                                    <h3>Thông tin chi tiết</h3>
                                    <table>
                                        <tbody>
                                            <tr><td>Tác giả</td><td>{product.TacGia || 'Đang cập nhật'}</td></tr>
                                            <tr><td>Nhà xuất bản</td><td>{product.NhaXuatBan || 'Đang cập nhật'}</td></tr>
                                            <tr><td>Năm xuất bản</td><td>{product.NamXB || 'Đang cập nhật'}</td></tr>
                                            <tr><td>Hình thức</td><td>{product.HinhThuc || 'Bìa mềm'}</td></tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ) : (
                            <div className="reviews-content">
                                {reviews.length > 0 ? (
                                    reviews.map((review, idx) => (
                                        <div key={idx} className="review-item">
                                            <div className="review-header">
                                                <span className="reviewer-name">{review.TenKH || 'Khách hàng'}</span>
                                                <div className="stars">
                                                    {[...Array(5)].map((_, i) => (
                                                        <i key={i} className={i < review.SoSao ? 'fas fa-star' : 'far fa-star'}></i>
                                                    ))}
                                                </div>
                                                <span className="review-date">{formatDate(review.NgayDanhGia)}</span>
                                            </div>
                                            <p className="review-text">{review.NhanXet}</p>
                                        </div>
                                    ))
                                ) : (
                                    <p>Chưa có đánh giá nào cho sản phẩm này.</p>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {relatedProducts.length > 0 && (
                    <div className="related-products">
                        <h2 className="section-title">Sản phẩm liên quan</h2>
                        <div className="product-grid">
                            {relatedProducts.map(p => (
                                <ProductCard key={p.MaSP || p.masp} product={p} />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProductDetailPage;
