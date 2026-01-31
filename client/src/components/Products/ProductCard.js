import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import { formatCurrency } from '../../utils/formatters';
import './ProductCard.css';

const ProductCard = ({ product }) => {
    const navigate = useNavigate();
    const { addToCart } = useCart();

    const productId = product.MaSP || product.masp;
    const productName = product.TenSP || product.tensp;
    const productImage = product.HinhAnh || product.hinhanh;
    const productPrice = product.GiaBan || product.DonGia || product.giaban;
    const productDiscount = product.PhanTramGiam || product.GiamGia || product.giamgia || 0;
    const productStock = product.SoLuong || product.soluong || 0;
    const isOutOfStock = productStock === 0;

    const handleProductClick = () => {
        navigate(`/product/${productId}`);
    };

    const handleAddToCart = (e) => {
        e.stopPropagation();
        addToCart(product, 1);
    };

    return (
        <div className="product-card" onClick={handleProductClick}>
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
                        onClick={handleAddToCart}
                    >
                        <i className="fas fa-cart-plus"></i> Thêm giỏ hàng
                    </button>
                    <button
                        className="btn-detail"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleProductClick();
                        }}
                    >
                        <i className="fas fa-info-circle"></i> Chi tiết
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProductCard;
