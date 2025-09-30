// Utility function to format price
function formatPrice(price) {
    if (!price) return '0đ';
    return parseInt(price).toLocaleString('vi-VN') + 'đ';
}

// Get error message based on VNPay response code
function getErrorMessage(code) {
    const errorMessages = {
        '01': 'Giao dịch chưa hoàn tất',
        '02': 'Giao dịch bị lỗi',
        '04': 'Giao dịch đảo',
        '05': 'VNPAY đang xử lý',
        '06': 'Đã gửi yêu cầu hoàn tiền',
        '07': 'Giao dịch bị nghi ngờ gian lận',
        '09': 'Hoàn trả bị từ chối',
        '10': 'Đã giao hàng',
        '11': 'Chưa thanh toán phí',
        '12': 'Giao dịch bị hủy',
        '13': 'Vượt hạn mức thẻ',
        '21': 'Không đủ số dư',
        '22': 'Chưa đăng ký InternetBanking',
        '23': 'Sai mật khẩu',
        '24': 'Khách hàng hủy',
        '25': 'Ngân hàng từ chối',
        '65': 'Vượt hạn mức giao dịch',
        '75': 'Ngân hàng bảo trì',
        '79': 'Tài khoản bị khóa',
        '99': 'Lỗi không xác định'
    };
    return errorMessages[code] || 'Lỗi không xác định';
}

// Check if user is logged in
function isLoggedIn() {
    return localStorage.getItem('token') !== null;
}

// Load order details from server
async function loadOrderDetails(orderId) {
    if (!orderId) return null;
    
    try {
        const response = await fetch(`http://localhost:5000/api/orders/hoadon/${orderId}`);
        
        if (response.ok) {
            const result = await response.json();
            console.log('Order details loaded:', result);
            return result;
        }
        
        if (isLoggedIn()) {
            const token = localStorage.getItem('token');
            const authResponse = await fetch(`http://localhost:5000/api/orders/customer-orders/detail/${orderId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (authResponse.ok) {
                const authResult = await authResponse.json();
                return authResult;
            }
        }
    } catch (error) {
        console.error('Lỗi tải thông tin đơn hàng:', error);
    }
    return null;
}

// Format product list HTML
function formatProductList(items) {
    if (!items || items.length === 0) {
        return '<div class="product-item">Không có thông tin sản phẩm</div>';
    }
    
    return items.map(item => `
        <div class="product-item">
            <div class="product-info">
                <img src="img/product/${item.productImage || item.HinhAnh || 'default-book.jpg'}" 
                     alt="${item.productName || item.TenSP}" 
                     class="product-image"
                     onerror="this.src='img/product/default-book.jpg'">
                <div class="product-details">
                    <div class="product-name">${item.productName || item.TenSP}</div>
                    <div class="product-meta">
                        <span class="product-quantity">SL: ${item.quantity || item.Soluong}</span>
                        <span class="product-price">${formatPrice(item.price || item.DonGia)}</span>
                    </div>
                    <div class="product-total">
                        <strong>${formatPrice((item.price || item.DonGia) * (item.quantity || item.Soluong))}</strong>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

document.addEventListener('DOMContentLoaded', async function() {
    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get('orderId');
    const status = urlParams.get('status');
    const amount = urlParams.get('amount');
    const errorCode = urlParams.get('code');
    
    const resultContent = document.getElementById('result-content');
    const viewOrdersBtn = document.getElementById('view-orders-btn');
    
    if (isLoggedIn()) {
        viewOrdersBtn.style.display = 'inline-flex';
        viewOrdersBtn.href = 'orders.html';
    }
    
    let orderDetails = null;
    if (orderId) {
        orderDetails = await loadOrderDetails(orderId);
    }
    
    setTimeout(() => {
        if (status === 'success') {
            const displayAmount = amount ? parseInt(amount) / 100 : null;
            
            resultContent.innerHTML = `
                <div class="success-icon">
                    <i class="fas fa-check-circle"></i>
                </div>
                <h1 style="color: #27ae60;">Thanh toán thành công!</h1>
                <div class="order-details">
                    <div class="detail-section">
                        <div class="section-title">
                            <i class="fas fa-receipt"></i>
                            Đơn hàng
                        </div>
                        <div class="detail-row">
                            <span class="label">Mã:</span>
                            <span class="value">#${orderId}</span>
                        </div>
                        <div class="detail-row">
                            <span class="label">Ngày:</span>
                            <span class="value">${orderDetails?.NgayTao ? new Date(orderDetails.NgayTao).toLocaleDateString('vi-VN') : new Date().toLocaleDateString('vi-VN')}</span>
                        </div>
                        <div class="detail-row">
                            <span class="label">Tổng tiền:</span>
                            <span class="value total-amount">${displayAmount ? formatPrice(displayAmount) : (orderDetails?.TongTien ? formatPrice(orderDetails.TongTien) : 'N/A')}</span>
                        </div>
                    </div>
                    
                    ${orderDetails?.items ? `
                    <div class="detail-section">
                        <div class="section-title">
                            <i class="fas fa-book"></i>
                            Sản phẩm (${orderDetails.items.length})
                        </div>
                        <div class="products-list">
                            ${formatProductList(orderDetails.items)}
                        </div>
                    </div>
                    ` : ''}
                    
                    <div class="detail-section">
                        <div class="section-title">
                            <i class="fas fa-credit-card"></i>
                            Thanh toán
                        </div>
                        <div class="detail-row">
                            <span class="label">Phương thức:</span>
                            <span class="value">VNPay</span>
                        </div>
                        <div class="detail-row">
                            <span class="label">Trạng thái:</span>
                            <span class="value">
                                <span class="status-badge status-success">Thành công</span>
                            </span>
                        </div>
                    </div>
                </div>
                <div class="info-note">
                    <i class="fas fa-info-circle"></i>
                    <strong>Thông báo:</strong> Đơn hàng đã thanh toán thành công và đang chờ xử lý.
                </div>
            `;
        } else if (status === 'failed') {
            const displayAmount = amount ? parseInt(amount) / 100 : null;
            const errorMessage = errorCode ? getErrorMessage(errorCode) : 'Lỗi không xác định';
            
            resultContent.innerHTML = `
                <div class="error-icon">
                    <i class="fas fa-times-circle"></i>
                </div>
                <h1 style="color: #e74c3c;">Thanh toán thất bại!</h1>
                <div class="order-details">
                    <div class="detail-section">
                        <div class="section-title">
                            <i class="fas fa-exclamation-triangle"></i>
                            Thông tin lỗi
                        </div>
                        <div class="detail-row">
                            <span class="label">Mã đơn:</span>
                            <span class="value">#${orderId}</span>
                        </div>
                        <div class="detail-row">
                            <span class="label">Lý do:</span>
                            <span class="value">${errorMessage}</span>
                        </div>
                        <div class="detail-row">
                            <span class="label">Số tiền:</span>
                            <span class="value">${displayAmount ? formatPrice(displayAmount) : 'N/A'}</span>
                        </div>
                    </div>
                </div>
                <div class="error-note">
                    <i class="fas fa-exclamation-circle"></i>
                    <strong>Đơn hàng đã bị hủy</strong> do thanh toán thất bại.
                </div>
            `;
        } else if (status === 'cod') {
            resultContent.innerHTML = `
                <div class="success-icon">
                    <i class="fas fa-check-circle"></i>
                </div>
                <h1 style="color: #27ae60;">Đặt hàng thành công!</h1>
                <div class="order-details">
                    <div class="detail-section">
                        <div class="section-title">
                            <i class="fas fa-receipt"></i>
                            Đơn hàng
                        </div>
                        <div class="detail-row">
                            <span class="label">Mã:</span>
                            <span class="value">#${orderId}</span>
                        </div>
                        <div class="detail-row">
                            <span class="label">Thanh toán:</span>
                            <span class="value">Khi nhận hàng</span>
                        </div>
                        <div class="detail-row">
                            <span class="label">Trạng thái:</span>
                            <span class="value">
                                <span class="status-badge status-pending">Chờ xử lý</span>
                            </span>
                        </div>
                    </div>
                </div>
                <div class="info-note">
                    <i class="fas fa-info-circle"></i>
                    <strong>Thông báo:</strong> Đơn hàng đã được đặt thành công!
                </div>
            `;
        } else {
            resultContent.innerHTML = `
                <div class="error-icon">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <h1 style="color: #e74c3c;">Có lỗi xảy ra!</h1>
                <div class="error-note">
                    <i class="fas fa-question-circle"></i>
                    <strong>Không thể xác định kết quả</strong>
                </div>
            `;
        }
    }, 1500);
});