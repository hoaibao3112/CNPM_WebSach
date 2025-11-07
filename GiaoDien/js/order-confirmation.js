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
    const subtotal = urlParams.get('subtotal');
    const discount = urlParams.get('discount');
    const shipping = urlParams.get('shipping');
    const discountCode = urlParams.get('discountCode');
    const freeShipCode = urlParams.get('freeShipCode');
    const errorCode = urlParams.get('code');
    const paymentMethod = urlParams.get('paymentMethod');
    const message = urlParams.get('message');
    
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
        // ✅ XỬ LÝ VNPAY SUCCESS
        if (status === 'success' && (!paymentMethod || paymentMethod === 'VNPAY')) {
            const displayAmount = amount ? parseInt(amount) / 100 : null;
            
            resultContent.innerHTML = `
                <div class="success-icon">
                    <i class="fas fa-check-circle"></i>
                </div>
                <h1 style="color: #27ae60;">Thanh toán VNPay thành công!</h1>
                <div class="order-details">
                    <div class="detail-section">
                        <div class="section-title">
                            <i class="fas fa-receipt"></i>
                            Thông tin đơn hàng
                        </div>
                        <div class="detail-row">
                            <span class="label">Mã đơn hàng:</span>
                            <span class="value">#${orderId}</span>
                        </div>
                        <div class="detail-row">
                            <span class="label">Ngày đặt:</span>
                            <span class="value">${orderDetails?.NgayTao ? new Date(orderDetails.NgayTao).toLocaleDateString('vi-VN') : new Date().toLocaleDateString('vi-VN')}</span>
                        </div>
                        <div class="detail-row">
                            <span class="label">Tổng tiền:</span>
                            <span class="value total-amount">${displayAmount ? formatPrice(displayAmount * 100) : (orderDetails?.TongTien ? formatPrice(orderDetails.TongTien * 100) : 'N/A')}</span>
                        </div>
                        <div class="detail-row">
                            <span class="label">Phương thức:</span>
                            <span class="value">VNPay</span>
                        </div>
                        <div class="detail-row">
                            <span class="label">Thanh toán:</span>
                            <span class="value">
                                <span class="status-badge status-success">Đã thanh toán</span>
                            </span>
                        </div>
                        <div class="detail-row">
                            <span class="label">Trạng thái:</span>
                            <span class="value">
                                <span class="status-badge status-pending">Chờ xử lý</span>
                            </span>
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
                </div>
                <div class="info-note">
                    <i class="fas fa-info-circle"></i>
                    <strong>Thông báo:</strong> Đơn hàng đã thanh toán thành công qua VNPay và đang chờ xử lý.
                </div>
            `;
        } 
        // ✅ XỬ LÝ COD SUCCESS
        else if (status === 'cod' || (status === 'success' && paymentMethod === 'COD')) {
            const displayAmount = amount ? parseFloat(amount) : null;
            const displaySubtotal = subtotal ? parseFloat(subtotal) : null;
            const displayDiscount = discount ? parseFloat(discount) : 0;
            const displayShipping = shipping ? parseFloat(shipping) : 0;
            
            // ✅ Build promo codes display
            let promoCodesHTML = '';
            if (discountCode || freeShipCode) {
                promoCodesHTML = '<div class="detail-section"><div class="section-title"><i class="fas fa-tags"></i> Mã khuyến mãi đã áp dụng</div>';
                
                if (discountCode) {
                    promoCodesHTML += `
                        <div class="promo-badge" style="background: #fff3cd; padding: 10px; border-radius: 5px; margin: 5px 0;">
                            <i class="fas fa-tag" style="color: #ff9800;"></i>
                            <strong style="color: #ff9800;">Mã giảm giá:</strong> ${discountCode}
                        </div>
                    `;
                }
                
                if (freeShipCode) {
                    promoCodesHTML += `
                        <div class="promo-badge" style="background: #d4edda; padding: 10px; border-radius: 5px; margin: 5px 0;">
                            <i class="fas fa-shipping-fast" style="color: #28a745;"></i>
                            <strong style="color: #28a745;">Mã Free Ship:</strong> ${freeShipCode}
                        </div>
                    `;
                }
                
                promoCodesHTML += '</div>';
            }
            
            resultContent.innerHTML = `
                <div class="success-icon">
                    <i class="fas fa-check-circle"></i>
                </div>
                <h1 style="color: #27ae60;">Đặt hàng COD thành công!</h1>
                <div class="order-details">
                    <div class="detail-section">
                        <div class="section-title">
                            <i class="fas fa-receipt"></i>
                            Thông tin đơn hàng
                        </div>
                        <div class="detail-row">
                            <span class="label">Mã đơn hàng:</span>
                            <span class="value">#${orderId}</span>
                        </div>
                        <div class="detail-row">
                            <span class="label">Ngày đặt:</span>
                            <span class="value">${orderDetails?.NgayTao ? new Date(orderDetails.NgayTao).toLocaleDateString('vi-VN') : new Date().toLocaleDateString('vi-VN')}</span>
                        </div>
                        ${displaySubtotal ? `
                        <div class="detail-row">
                            <span class="label">Tổng phụ:</span>
                            <span class="value">${formatPrice(displaySubtotal)}</span>
                        </div>
                        ` : ''}
                        ${displayDiscount > 0 ? `
                        <div class="detail-row">
                            <span class="label">Giảm giá:</span>
                            <span class="value" style="color: #27ae60;">-${formatPrice(displayDiscount)}</span>
                        </div>
                        ` : ''}
                        ${displayShipping > 0 ? `
                        <div class="detail-row">
                            <span class="label">Phí vận chuyển:</span>
                            <span class="value">${formatPrice(displayShipping)}</span>
                        </div>
                        ` : displayShipping === 0 && freeShipCode ? `
                        <div class="detail-row">
                            <span class="label">Phí vận chuyển:</span>
                            <span class="value" style="color: #27ae60; font-weight: bold;">Miễn phí</span>
                        </div>
                        ` : ''}
                        <div class="detail-row">
                            <span class="label">Tổng tiền:</span>
                            <span class="value total-amount">${displayAmount ? formatPrice(displayAmount) : (orderDetails?.TongTien ? formatPrice(orderDetails.TongTien) : 'N/A')}</span>
                        </div>
                        <div class="detail-row">
                            <span class="label">Phương thức:</span>
                            <span class="value">COD (Thanh toán khi nhận hàng)</span>
                        </div>
                        <div class="detail-row">
                            <span class="label">Thanh toán:</span>
                            <span class="value">
                                <span class="status-badge status-pending">Chưa thanh toán</span>
                            </span>
                        </div>
                        <div class="detail-row">
                            <span class="label">Trạng thái:</span>
                            <span class="value">
                                <span class="status-badge status-pending">Chờ xử lý</span>
                            </span>
                        </div>
                    </div>
                    
                    ${promoCodesHTML}
                    
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
                </div>
                <div class="info-note">
                    <i class="fas fa-info-circle"></i>
                    <strong>Lưu ý:</strong> ${message ? decodeURIComponent(message) : 'Đơn hàng đã được đặt thành công! Vui lòng chuẩn bị đủ tiền mặt khi shipper giao hàng.'}
                </div>
                <div class="cod-instructions">
                    <div class="instruction-title">
                        <i class="fas fa-truck"></i>
                        Hướng dẫn nhận hàng COD
                    </div>
                    <ul>
                        <li>Chúng tôi sẽ liên hệ xác nhận đơn hàng trong 24h</li>
                        <li>Thời gian giao hàng: 2-3 ngày làm việc</li>
                        <li>Vui lòng chuẩn bị đủ tiền mặt khi nhận hàng</li>
                        <li>Kiểm tra kỹ sản phẩm trước khi thanh toán</li>
                    </ul>
                </div>
            `;
        }
        // ✅ XỬ LÝ VNPAY FAILED
        else if (status === 'failed') {
            const displayAmount = amount ? parseInt(amount) / 100 : null;
            const errorMessage = errorCode ? getErrorMessage(errorCode) : 'Lỗi không xác định';
            
            resultContent.innerHTML = `
                <div class="error-icon">
                    <i class="fas fa-times-circle"></i>
                </div>
                <h1 style="color: #e74c3c;">Thanh toán VNPay thất bại!</h1>
                <div class="order-details">
                    <div class="detail-section">
                        <div class="section-title">
                            <i class="fas fa-exclamation-triangle"></i>
                            Thông tin lỗi
                        </div>
                        <div class="detail-row">
                            <span class="label">Mã đơn hàng:</span>
                            <span class="value">#${orderId}</span>
                        </div>
                        <div class="detail-row">
                            <span class="label">Lý do:</span>
                            <span class="value">${errorMessage}</span>
                        </div>
                        <div class="detail-row">
                            <span class="label">Mã lỗi:</span>
                            <span class="value">${errorCode || 'N/A'}</span>
                        </div>
                        <div class="detail-row">
                            <span class="label">Số tiền:</span>
                            <span class="value">${displayAmount ? formatPrice(displayAmount * 100) : 'N/A'}</span>
                        </div>
                    </div>
                </div>
                <div class="error-note">
                    <i class="fas fa-exclamation-circle"></i>
                    <strong>Đơn hàng đã bị hủy</strong> do thanh toán thất bại. Sản phẩm đã được hoàn lại kho.
                </div>
                <div class="retry-options">
                    <a href="cart.html" class="btn btn-primary">
                        <i class="fas fa-redo"></i> Thử lại
                    </a>
                    <a href="book.html" class="btn btn-secondary">
                        <i class="fas fa-shopping-cart"></i> Tiếp tục mua sắm
                    </a>
                </div>
            `;
        }
        // ✅ XỬ LÝ ERROR
        else if (status === 'error') {
            resultContent.innerHTML = `
                <div class="error-icon">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <h1 style="color: #e74c3c;">Có lỗi xảy ra!</h1>
                <div class="error-note">
                    <i class="fas fa-question-circle"></i>
                    <strong>Lỗi:</strong> ${message ? decodeURIComponent(message) : 'Đã xảy ra lỗi trong quá trình xử lý đơn hàng.'}
                </div>
                <div class="retry-options">
                    <a href="cart.html" class="btn btn-primary">
                        <i class="fas fa-redo"></i> Thử lại
                    </a>
                    <a href="book.html" class="btn btn-secondary">
                        <i class="fas fa-shopping-cart"></i> Tiếp tục mua sắm
                    </a>
                </div>
            `;
        }
        // ✅ XỬ LÝ INVALID SIGNATURE
        else if (status === 'invalid_signature') {
            resultContent.innerHTML = `
                <div class="error-icon">
                    <i class="fas fa-shield-alt"></i>
                </div>
                <h1 style="color: #e74c3c;">Lỗi bảo mật!</h1>
                <div class="error-note">
                    <i class="fas fa-exclamation-triangle"></i>
                    <strong>Cảnh báo:</strong> Chữ ký VNPay không hợp lệ. Giao dịch có thể đã bị can thiệp.
                </div>
            `;
        }
        // ✅ XỬ LÝ DEFAULT
        else {
            resultContent.innerHTML = `
                <div class="error-icon">
                    <i class="fas fa-question-circle"></i>
                </div>
                <h1 style="color: #f39c12;">Trạng thái không xác định</h1>
                <div class="error-note">
                    <i class="fas fa-question-circle"></i>
                    <strong>Không thể xác định kết quả</strong> đơn hàng. Vui lòng liên hệ với chúng tôi để được hỗ trợ.
                </div>
            `;
        }
    }, 1500);
});