import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import orderService from '../../services/orderService';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { toast } from 'react-toastify';
import Loading from '../../components/Common/Loading';
import './OrdersPage.css';

const OrdersPage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [reviewData, setReviewData] = useState({ rating: 5, comment: '' });

    useEffect(() => {
        if (user?.MaKH || user?.makh) {
            fetchOrders();
        } else {
            setLoading(false);
        }
    }, [user]);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const data = await orderService.getOrders(user.MaKH || user.makh);
            // Backend returns orders sorted by date usually, but let's ensure
            const sortedData = [...data].sort((a, b) => {
                const idA = parseInt(a.id || a.MaHD) || 0;
                const idB = parseInt(b.id || b.MaHD) || 0;
                return idB - idA;
            });
            setOrders(sortedData);
        } catch (error) {
            console.error('Error fetching orders:', error);
            toast.error('Không thể tải danh sách đơn hàng');
        } finally {
            setLoading(false);
        }
    };

    const handleViewDetail = async (orderId) => {
        try {
            const detail = await orderService.getOrderById(orderId);
            setSelectedOrder(detail);
            setShowModal(true);
        } catch (error) {
            toast.error('Không thể tải chi tiết đơn hàng');
        }
    };

    const handleCancelOrder = async (orderId) => {
        if (window.confirm('Bạn có chắc chắn muốn hủy đơn hàng này?')) {
            try {
                await orderService.cancelOrder(orderId, 'Khách hàng yêu cầu hủy');
                toast.success('Đã hủy đơn hàng thành công');
                fetchOrders();
                setShowModal(false);
            } catch (error) {
                toast.error(error.message || 'Không thể hủy đơn hàng');
            }
        }
    };

    const handleReorder = async (orderId) => {
        try {
            await orderService.reorder(orderId);
            toast.success('Đã thêm các sản phẩm vào giỏ hàng');
            navigate('/cart');
        } catch (error) {
            toast.error('Không thể thực hiện mua lại');
        }
    };

    const handleOpenReview = (order) => {
        setSelectedOrder(order);
        setReviewData({ rating: 5, comment: '' });
        setShowReviewModal(true);
    };

    const handleSubmitReview = async () => {
        try {
            await orderService.submitReview(selectedOrder.id || selectedOrder.MaHD, reviewData.rating, reviewData.comment);
            toast.success('Cảm ơn bạn đã đánh giá!');
            setShowReviewModal(false);
            fetchOrders();
        } catch (error) {
            toast.error(error.message || 'Lỗi khi gửi đánh giá');
        }
    };

    const getStatusClass = (status) => {
        const s = (status || '').toLowerCase();
        if (s.includes('hủy')) return 'status-cancelled';
        if (s.includes('giao hàng') || s.includes('delivered')) return 'status-completed';
        if (s.includes('đang giao')) return 'status-shipping';
        if (s.includes('đã xác nhận')) return 'status-processing';
        return 'status-pending';
    };

    const filteredOrders = orders.filter(order => {
        if (filter === 'all') return true;
        const status = (order.tinhtrang || '').toLowerCase();
        if (filter === 'pending') return status.includes('chờ');
        if (filter === 'processing') return status.includes('xác nhận');
        if (filter === 'shipping') return status.includes('đang giao');
        if (filter === 'completed') return status.includes('đã giao') || status.includes('hoàn thành');
        if (filter === 'cancelled') return status.includes('hủy');
        return true;
    });

    if (loading) return <Loading />;

    return (
        <div className="orders-page">
            <div className="container">
                <div className="orders-header">
                    <h1>ĐƠN HÀNG CỦA TÔI</h1>
                    <div className="filter-tabs">
                        <button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>Tất cả</button>
                        <button className={filter === 'pending' ? 'active' : ''} onClick={() => setFilter('pending')}>Chờ xác nhận</button>
                        <button className={filter === 'shipping' ? 'active' : ''} onClick={() => setFilter('shipping')}>Đang giao</button>
                        <button className={filter === 'completed' ? 'active' : ''} onClick={() => setFilter('completed')}>Đã giao</button>
                        <button className={filter === 'cancelled' ? 'active' : ''} onClick={() => setFilter('cancelled')}>Đã hủy</button>
                    </div>
                </div>

                {filteredOrders.length === 0 ? (
                    <div className="no-orders">
                        <i className="fas fa-box-open fa-4x"></i>
                        <p>Bạn chưa có đơn hàng nào trong mục này</p>
                    </div>
                ) : (
                    <div className="orders-list">
                        {filteredOrders.map(order => {
                            const id = order.id || order.MaHD;
                            const isCompleted = (order.tinhtrang || '').toLowerCase().includes('giao');

                            return (
                                <div key={id} className="order-card" onClick={() => handleViewDetail(id)}>
                                    <div className="order-card-header">
                                        <span className="order-id">Đơn hàng #{id}</span>
                                        <span className={`order-status ${getStatusClass(order.tinhtrang)}`}>
                                            {order.tinhtrang}
                                        </span>
                                    </div>
                                    <div className="order-card-body">
                                        <div className="order-date">Ngày đặt: {formatDate(order.createdAt || order.NgayLap)}</div>
                                        <div className="order-total">Tổng cộng: <strong>{formatCurrency(order.totalAmount || order.TongTien)}</strong></div>
                                    </div>
                                    <div className="order-card-actions" onClick={e => e.stopPropagation()}>
                                        <button className="btn-detail" onClick={() => handleViewDetail(id)}>Chi tiết</button>
                                        {isCompleted && (
                                            <>
                                                <button className="btn-reorder" onClick={() => handleReorder(id)}>Mua lại</button>
                                                <button className="btn-review" onClick={() => handleOpenReview(order)}>Đánh giá</button>
                                            </>
                                        )}
                                        {order.tinhtrang.includes('Chờ') && (
                                            <button className="btn-cancel" onClick={() => handleCancelOrder(id)}>Hủy đơn</button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Order Detail Modal */}
            {showModal && selectedOrder && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content order-detail-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Chi tiết đơn hàng #{selectedOrder.id || selectedOrder.MaHD}</h2>
                            <button className="close-btn" onClick={() => setShowModal(false)}>&times;</button>
                        </div>
                        <div className="modal-body">
                            <div className="section">
                                <h3>Thông tin giao hàng</h3>
                                <p><strong>Người nhận:</strong> {selectedOrder.recipientName || selectedOrder.TenNguoiNhan}</p>
                                <p><strong>Số điện thoại:</strong> {selectedOrder.recipientPhone || selectedOrder.SDT}</p>
                                <p><strong>Địa chỉ:</strong> {selectedOrder.shippingAddress}</p>
                            </div>
                            <div className="section">
                                <h3>Sản phẩm</h3>
                                <div className="order-items">
                                    {(selectedOrder.items || []).map((item, idx) => (
                                        <div key={idx} className="order-item">
                                            <img src={`/img/product/${item.HinhAnh}`} alt={item.TenSP} onError={e => e.target.src = '/img/default-book.jpg'} />
                                            <div className="item-info">
                                                <h4>{item.TenSP}</h4>
                                                <p>{item.quantity} x {formatCurrency(item.price)}</p>
                                            </div>
                                            <div className="item-total">{formatCurrency(item.quantity * item.price)}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="order-summary-box">
                                <div className="summary-row"><span>Tạm tính:</span> <span>{formatCurrency(selectedOrder.subtotal || selectedOrder.TongTien)}</span></div>
                                <div className="summary-row"><span>Phí vận chuyển:</span> <span>{formatCurrency(selectedOrder.shippingFee || 0)}</span></div>
                                <div className="summary-row total"><span>Tổng cộng:</span> <span>{formatCurrency(selectedOrder.totalAmount || selectedOrder.TongTien)}</span></div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Review Modal */}
            {showReviewModal && (
                <div className="modal-overlay" onClick={() => setShowReviewModal(false)}>
                    <div className="modal-content review-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Đánh giá đơn hàng #{selectedOrder?.id || selectedOrder?.MaHD}</h2>
                            <button className="close-btn" onClick={() => setShowReviewModal(false)}>&times;</button>
                        </div>
                        <div className="modal-body">
                            <div className="star-rating">
                                {[1, 2, 3, 4, 5].map(star => (
                                    <i
                                        key={star}
                                        className={star <= reviewData.rating ? "fas fa-star" : "far fa-star"}
                                        onClick={() => setReviewData(prev => ({ ...prev, rating: star }))}
                                    ></i>
                                ))}
                            </div>
                            <textarea
                                placeholder="Chia sẻ cảm nhận của bạn về sản phẩm và dịch vụ nhé..."
                                value={reviewData.comment}
                                onChange={e => setReviewData(prev => ({ ...prev, comment: e.target.value }))}
                            ></textarea>
                            <button className="btn-submit-review" onClick={handleSubmitReview}>Gửi đánh giá</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OrdersPage;
