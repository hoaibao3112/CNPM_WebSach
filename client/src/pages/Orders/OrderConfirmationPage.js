import React, { useEffect, useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import './OrderConfirmationPage.css';

const OrderConfirmationPage = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState('processing');
    const orderId = searchParams.get('orderId');
    const vnp_ResponseCode = searchParams.get('vnp_ResponseCode');

    useEffect(() => {
        // Handle VNPay return
        if (vnp_ResponseCode) {
            if (vnp_ResponseCode === '00') {
                setStatus('success');
                toast.success('Thanh toán thành công!');
            } else {
                setStatus('error');
                toast.error('Thanh toán thất bại hoặc đã bị hủy');
            }
        } else if (orderId) {
            // For COD, we just show success
            setStatus('success');
        } else {
            // No order info
            navigate('/');
        }
    }, [vnp_ResponseCode, orderId, navigate]);

    return (
        <div className="order-confirmation-page">
            <div className="container">
                <div className={`confirmation-card ${status}`}>
                    <div className="icon-wrapper">
                        {status === 'processing' && <i className="fas fa-spinner fa-spin"></i>}
                        {status === 'success' && <i className="fas fa-check-circle"></i>}
                        {status === 'error' && <i className="fas fa-times-circle"></i>}
                    </div>

                    {status === 'success' ? (
                        <>
                            <h1>Đặt hàng thành công!</h1>
                            <p>Cảm ơn bạn đã tin tưởng mua sắm tại Fahasa. Đơn hàng <strong>#{orderId}</strong> của bạn đang được xử lý.</p>
                            <p>Chúng tôi sẽ sớm liên hệ với bạn để xác nhận đơn hàng.</p>
                        </>
                    ) : status === 'error' ? (
                        <>
                            <h1>Thanh toán thất bại</h1>
                            <p>Rất tiếc, đã có lỗi xảy ra trong quá trình thanh toán đơn hàng <strong>#{orderId}</strong>.</p>
                            <p>Vui lòng thử lại hoặc liên hệ với bộ phận hỗ trợ nếu bạn cần giúp đỡ.</p>
                        </>
                    ) : (
                        <>
                            <h1>Đang xử lý...</h1>
                            <p>Vui lòng chờ trong giây lát khi chúng tôi xác nhận giao dịch của bạn.</p>
                        </>
                    )}

                    <div className="actions">
                        <Link to="/" className="btn btn-home">Trang chủ</Link>
                        <Link to="/orders" className="btn btn-orders">Lịch sử đơn hàng</Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderConfirmationPage;
