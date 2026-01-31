import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import productService from '../../services/productService';
import { useCart } from '../../contexts/CartContext';
import { toast } from 'react-toastify';
import Loading from '../../components/Common/Loading';
import ProductCard from '../../components/Products/ProductCard';
import './ProductListPage.css';

const ProductListPage = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

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
                                products.map((product) => (
                                    <ProductCard key={product.MaSP || product.masp} product={product} />
                                ))
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
