import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import locationService from '../../services/locationService';
import orderService from '../../services/orderService';
import { formatCurrency } from '../../utils/formatters';
import { toast } from 'react-toastify';
import Loading from '../../components/Common/Loading';
import './CartPage.css';

const CartPage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const {
        cartItems,
        removeFromCart,
        updateQuantity,
        toggleSelection,
        getCartTotal,
        clearCart
    } = useCart();

    const [loading, setLoading] = useState(false);
    const [cities, setCities] = useState([]);
    const [districts, setDistricts] = useState([]);
    const [wards, setWards] = useState([]);

    const [formData, setFormData] = useState({
        name: user?.TenKH || '',
        phone: user?.SDT || '',
        email: user?.Email || '',
        city: '',
        district: '',
        ward: '',
        address: '',
        paymentMethod: 'cod',
        notes: ''
    });

    const [shippingFee, setShippingFee] = useState(0);

    useEffect(() => {
        loadCities();
    }, []);

    useEffect(() => {
        if (formData.city) {
            loadDistricts(formData.city);
            // Calculate shipping fee logic
            calculateShipping();
        } else {
            setDistricts([]);
            setWards([]);
            setShippingFee(0);
        }
    }, [formData.city]);

    useEffect(() => {
        if (formData.district) {
            loadWards(formData.district);
        } else {
            setWards([]);
        }
    }, [formData.district]);

    const loadCities = async () => {
        const data = await locationService.getCities();
        setCities(data);
    };

    const loadDistricts = async (cityId) => {
        const data = await locationService.getDistricts(cityId);
        setDistricts(data);
    };

    const loadWards = async (districtId) => {
        const data = await locationService.getWards(districtId);
        setWards(data);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const calculateShipping = () => {
        // Simple logic from original cart.js: HCM is free, others based on weight
        const selectedCity = cities.find(c => String(c.city_id) === String(formData.city));
        if (!selectedCity) return;

        const cityName = selectedCity.city_name.toLowerCase();
        if (cityName.includes('hồ chí minh') || cityName.includes('hcm')) {
            setShippingFee(0);
        } else {
            // Default flat rate for others for now
            setShippingFee(30000);
        }
    };

    const handleCheckout = async (e) => {
        e.preventDefault();

        const selectedItems = cartItems.filter(item => item.selected);
        if (selectedItems.length === 0) {
            toast.warning('Vui lòng chọn ít nhất một sản phẩm để thanh toán');
            return;
        }

        if (!user) {
            toast.info('Vui lòng đăng nhập để tiếp tục thanh toán');
            navigate('/login', { state: { from: '/cart' } });
            return;
        }

        setLoading(true);
        try {
            const orderData = {
                ...formData,
                items: selectedItems.map(item => ({
                    productId: item.MaSP || item.masp,
                    quantity: item.quantity,
                    price: item.GiaBan || item.DonGia || item.giaban
                })),
                subtotal: getCartTotal(),
                shippingFee,
                total: getCartTotal() + shippingFee
            };

            const result = await orderService.createOrder(orderData);
            toast.success('Đặt hàng thành công!');
            clearCart();
            navigate(`/order-confirmation/${result.id || result.MaDH}`);
        } catch (error) {
            console.error('Checkout error:', error);
            toast.error(error.message || 'Có lỗi xảy ra khi đặt hàng');
        } finally {
            setLoading(false);
        }
    };

    if (cartItems.length === 0) {
        return (
            <div className="cart-page empty-cart">
                <div className="container">
                    <i className="fas fa-shopping-cart fa-5x"></i>
                    <h2>Giỏ hàng của bạn đang trống</h2>
                    <p>Hãy chọn những món quà tuyệt vời cho bản thân và người thân nhé!</p>
                    <button className="btn-continue" onClick={() => navigate('/products')}>TIẾP TỤC MUA SẮM</button>
                </div>
            </div>
        );
    }

    const subtotal = getCartTotal();
    const total = subtotal + shippingFee;

    return (
        <div className="cart-page">
            <div className="container">
                <h1 className="page-title">GIỎ HÀNG CỦA BẠN</h1>

                <div className="cart-grid">
                    <div className="cart-items-section">
                        <table className="cart-table">
                            <thead>
                                <tr>
                                    <th>CHỌN</th>
                                    <th>SẢN PHẨM</th>
                                    <th>GIÁ</th>
                                    <th>SỐ LƯỢNG</th>
                                    <th>TỔNG</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {cartItems.map((item) => {
                                    const id = item.MaSP || item.masp;
                                    const price = item.GiaBan || item.DonGia || item.giaban;
                                    const discount = item.PhanTramGiam || item.GiamGia || 0;
                                    const finalPrice = discount > 0 ? price * (1 - discount / 100) : price;

                                    return (
                                        <tr key={id}>
                                            <td>
                                                <input
                                                    type="checkbox"
                                                    checked={item.selected !== false}
                                                    onChange={() => toggleSelection(id)}
                                                />
                                            </td>
                                            <td>
                                                <div className="product-cell">
                                                    <img
                                                        src={`/img/product/${item.HinhAnh || item.hinhanh}`}
                                                        alt={item.TenSP || item.tensp}
                                                        onError={e => e.target.src = '/img/default-book.jpg'}
                                                    />
                                                    <div className="info">
                                                        <h3>{item.TenSP || item.tensp}</h3>
                                                        <small>Mã SP: {id}</small>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>{formatCurrency(finalPrice)}</td>
                                            <td>
                                                <div className="qty-control">
                                                    <button onClick={() => updateQuantity(id, item.quantity - 1)}>-</button>
                                                    <input type="number" value={item.quantity} readOnly />
                                                    <button onClick={() => updateQuantity(id, item.quantity + 1)}>+</button>
                                                </div>
                                            </td>
                                            <td>{formatCurrency(finalPrice * item.quantity)}</td>
                                            <td>
                                                <button className="btn-remove" onClick={() => removeFromCart(id)}>
                                                    <i className="fas fa-trash"></i>
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>

                        <div className="cart-actions">
                            <button className="btn-back" onClick={() => navigate('/products')}>
                                <i className="fas fa-arrow-left"></i> TIẾP TỤC MUA SẮM
                            </button>
                            <button className="btn-clear" onClick={() => { if (window.confirm('Xóa sạch giỏ hàng?')) clearCart() }}>
                                <i className="fas fa-sync-alt"></i> XÓA GIỎ HÀNG
                            </button>
                        </div>
                    </div>

                    <div className="checkout-section">
                        <div className="customer-info">
                            <h3>THÔNG TIN GIAO HÀNG</h3>
                            <form id="customer-form" onSubmit={handleCheckout}>
                                <div className="form-group">
                                    <input type="text" name="name" placeholder="Họ và tên" value={formData.name} onChange={handleInputChange} required />
                                </div>
                                <div className="form-row">
                                    <input type="text" name="phone" placeholder="Số điện thoại" value={formData.phone} onChange={handleInputChange} required />
                                    <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleInputChange} required />
                                </div>
                                <div className="form-row">
                                    <select name="city" value={formData.city} onChange={handleInputChange} required>
                                        <option value="">Tỉnh/Thành phố</option>
                                        {cities.map(city => (
                                            <option key={city.city_id} value={city.city_id}>{city.city_name}</option>
                                        ))}
                                    </select>
                                    <select name="district" value={formData.district} onChange={handleInputChange} required disabled={!formData.city}>
                                        <option value="">Quận/Huyện</option>
                                        {districts.map(d => (
                                            <option key={d.district_id} value={d.district_id}>{d.district_name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <select name="ward" value={formData.ward} onChange={handleInputChange} required disabled={!formData.district}>
                                        <option value="">Phường/Xã</option>
                                        {wards.map(w => (
                                            <option key={w.ward_id} value={w.ward_id}>{w.ward_name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <input type="text" name="address" placeholder="Địa chỉ chi tiết (số nhà, tên đường...)" value={formData.address} onChange={handleInputChange} required />
                                </div>
                                <div className="form-group">
                                    <textarea name="notes" placeholder="Ghi chú (tùy chọn)" value={formData.notes} onChange={handleInputChange}></textarea>
                                </div>

                                <div className="payment-method">
                                    <h4>Phương thức thanh toán</h4>
                                    <select name="paymentMethod" value={formData.paymentMethod} onChange={handleInputChange}>
                                        <option value="cod">Thanh toán khi nhận hàng (COD)</option>
                                        <option value="vnpay">Thanh toán qua VNPay</option>
                                        <option value="transfer">Chuyển khoản ngân hàng</option>
                                    </select>
                                </div>
                            </form>
                        </div>

                        <div className="order-summary">
                            <h3>TỔNG CỘNG</h3>
                            <div className="summary-row">
                                <span>Tổng tiền hàng</span>
                                <span>{formatCurrency(subtotal)}</span>
                            </div>
                            <div className="summary-row">
                                <span>Phí vận chuyển</span>
                                <span>{shippingFee === 0 ? 'Miễn phí' : formatCurrency(shippingFee)}</span>
                            </div>
                            <div className="divider"></div>
                            <div className="summary-row total">
                                <span>Tổng thanh toán</span>
                                <span>{formatCurrency(total)}</span>
                            </div>
                            <button
                                type="submit"
                                form="customer-form"
                                className="btn-checkout"
                                disabled={loading || subtotal === 0}
                            >
                                {loading ? 'ĐANG XỬ LÝ...' : 'ĐẶT HÀNG NGAY'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CartPage;
