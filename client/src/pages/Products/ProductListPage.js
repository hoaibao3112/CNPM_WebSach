import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import productService from '../../services/productService';

import { useCart } from '../../contexts/CartContext';
import { formatCurrency } from '../../utils/formatters';
import { toast } from 'react-toastify';
import Loading from '../../components/Common/Loading';
import './ProductListPage.css';

const ProductListPage = () => {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { addToCart } = useCart();

    // Filter states
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedPriceRange, setSelectedPriceRange] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        // Get search/category from URL
        const search = searchParams.get('search') || '';
        const category = searchParams.get('category') || '';

        setSearchQuery(search);
        setSelectedCategory(category);

        loadProducts({ search, category });
    }, [searchParams]);

    const loadProducts = async (filters = {}) => {
        setLoading(true);
        try {
            let data;

            if (filters.search) {
                data = await productService.searchProducts(filters.search);
            } else if (filters.category) {
                data = await productService.getProductsByCategory(filters.category);
            } else {
                data = await productService.getProducts(filters);
            }

            setProducts(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error loading products:', error);
            toast.error('Không thể tải sản phẩm');
            setProducts([]);
        } finally {
            setLoading(false);
        }
    };

    const handleCategoryFilter = (categoryId) => {
        setSelectedCategory(categoryId);
        setSearchQuery('');
        loadProducts({ category: categoryId, priceRange: selectedPriceRange });
    };

    const handlePriceFilter = (priceRange) => {
        setSelectedPriceRange(priceRange);
        loadProducts({
            category: selectedCategory,
            search: searchQuery,
            priceRange
        });
    };

    const handleProductClick = (productId) => {
        navigate(`/product/${productId}`);
    };

    const handleAddToCart = (e, product) => {
        e.stopPropagation();
        addToCart(product, 1);
    };

    const renderProduct = (product) => {
        const productId = product.MaSP || product.masp;
        const productName = product.TenSP || product.tensp;
        const productImage = product.HinhAnh || product.hinhanh;
        const productPrice = product.GiaBan || product.DonGia || product.giaban;
        const productDiscount = product.PhanTramGiam || product.GiamGia || product.giamgia || 0;
        const productStock = product.SoLuong || product.soluong || 0;
        const isOutOfStock = productStock === 0;

        return (
            <div
                key={productId}
                className="product-card"
                onClick={() => handleProductClick(productId)}
            >
                <div className="product-image">
                    <img
                        src={`/img/product/${productImage}`}
                        alt={productName}
                        onError={(e) => { e.target.src = '/img/default-book.jpg'; }}
                    />
                    {productDiscount > 0 && (
                        <span className="discount-badge">-{productDiscount}%</span>
                    )}
                    {isOutOfStock && (
                        <span className="stock-status">HẾT HÀNG</span>
                    )}
                </div>
                <div className="product-info">
                    <h3 className="product-title">{productName}</h3>
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
                    <small className="product-stock">Còn {productStock} cuốn sách</small>
                    <div className="product-actions">
                        <button
                            className="btn-add-cart"
                            disabled={isOutOfStock}
                            onClick={(e) => handleAddToCart(e, product)}
                        >
                            <i className="fas fa-cart-plus"></i> Thêm giỏ hàng
                        </button>
                        <button
                            className="btn-detail"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleProductClick(productId);
                            }}
                        >
                            <i className="fas fa-info-circle"></i> Chi tiết
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    if (loading) {
        return <Loading message="Đang tải sản phẩm..." />;
    }

    return (
        <div className="product-list-page">
            <div className="container">
                {/* Sidebar Filters */}
                <aside className="sidebar">
                    <h3>DANH MỤC SẢN PHẨM</h3>
                    <div className="category-filter">
                        <button
                            className={`filter-btn ${!selectedCategory ? 'active' : ''}`}
                            onClick={() => handleCategoryFilter('')}
                        >
                            Tất cả
                        </button>
                        <button
                            className={`filter-btn ${selectedCategory === '1' ? 'active' : ''}`}
                            onClick={() => handleCategoryFilter('1')}
                        >
                            Truyện Tranh - Comic
                        </button>
                        <button
                            className={`filter-btn ${selectedCategory === '2' ? 'active' : ''}`}
                            onClick={() => handleCategoryFilter('2')}
                        >
                            Văn học nước ngoài
                        </button>
                        <button
                            className={`filter-btn ${selectedCategory === '4' ? 'active' : ''}`}
                            onClick={() => handleCategoryFilter('4')}
                        >
                            Sách Văn Học
                        </button>
                        <button
                            className={`filter-btn ${selectedCategory === '6' ? 'active' : ''}`}
                            onClick={() => handleCategoryFilter('6')}
                        >
                            Sách Kỹ Năng Sống
                        </button>
                        <button
                            className={`filter-btn ${selectedCategory === '8' ? 'active' : ''}`}
                            onClick={() => handleCategoryFilter('8')}
                        >
                            Light Novel
                        </button>
                    </div>

                    <div className="divider"></div>

                    <h3>LỌC THEO GIÁ</h3>
                    <div className="price-filter">
                        <button
                            className={`filter-btn ${!selectedPriceRange ? 'active' : ''}`}
                            onClick={() => handlePriceFilter('')}
                        >
                            Tất cả
                        </button>
                        <button
                            className={`filter-btn ${selectedPriceRange === '0-50000' ? 'active' : ''}`}
                            onClick={() => handlePriceFilter('0-50000')}
                        >
                            Dưới 50.000đ
                        </button>
                        <button
                            className={`filter-btn ${selectedPriceRange === '50000-100000' ? 'active' : ''}`}
                            onClick={() => handlePriceFilter('50000-100000')}
                        >
                            50.000đ - 100.000đ
                        </button>
                        <button
                            className={`filter-btn ${selectedPriceRange === '100000-200000' ? 'active' : ''}`}
                            onClick={() => handlePriceFilter('100000-200000')}
                        >
                            100.000đ - 200.000đ
                        </button>
                        <button
                            className={`filter-btn ${selectedPriceRange === '200000' ? 'active' : ''}`}
                            onClick={() => handlePriceFilter('200000')}
                        >
                            Trên 200.000đ
                        </button>
                    </div>

                    <div className="divider"></div>

                    <div className="hotline">Hotline: 0938 424 289</div>
                </aside>

                {/* Main Content */}
                <main className="main-content">
                    <div className="product-section">
                        <h2>
                            {searchQuery
                                ? `Kết quả tìm kiếm: "${searchQuery}"`
                                : 'Danh sách sản phẩm'}
                        </h2>
                        <div className="product-grid">
                            {products.length > 0 ? (
                                products.map((product) => renderProduct(product))
                            ) : (
                                <div className="no-products">
                                    <i className="fas fa-book"></i>
                                    <p>Hiện không có sản phẩm nào</p>
                                </div>
                            )}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default ProductListPage;
