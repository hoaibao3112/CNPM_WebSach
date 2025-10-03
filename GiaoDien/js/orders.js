document.addEventListener('DOMContentLoaded', initializeApp);
const addressCache = {
    provinces: new Map(),
    districts: new Map(),
    wards: new Map()
};
// Thêm sau dòng khai báo addressCache (sau dòng 6)

// Lấy tên tỉnh/thành phố từ mã
async function getProvinceName(provinceCode) {
    if (!provinceCode) return '';
    
    // Kiểm tra cache trước
    if (addressCache.provinces.has(provinceCode)) {
        return addressCache.provinces.get(provinceCode);
    }

    try {
        const response = await fetch('https://provinces.open-api.vn/api/p/');
        const provinces = await response.json();
        
        // Lưu tất cả provinces vào cache
        provinces.forEach(province => {
            addressCache.provinces.set(province.code.toString(), province.name);
        });

        return addressCache.provinces.get(provinceCode.toString()) || provinceCode;
    } catch (error) {
        console.error('Error fetching province:', error);
        return provinceCode;
    }
}

// Lấy tên quận/huyện từ mã
async function getDistrictName(districtCode, provinceCode) {
    if (!districtCode) return '';
    
    // Kiểm tra cache trước
    if (addressCache.districts.has(districtCode)) {
        return addressCache.districts.get(districtCode);
    }

    try {
        const response = await fetch(`https://provinces.open-api.vn/api/p/${provinceCode}?depth=2`);
        const data = await response.json();
        
        if (data.districts) {
            data.districts.forEach(district => {
                addressCache.districts.set(district.code.toString(), district.name);
            });
        }

        return addressCache.districts.get(districtCode.toString()) || districtCode;
    } catch (error) {
        console.error('Error fetching district:', error);
        return districtCode;
    }
}

// Lấy tên phường/xã từ mã
async function getWardName(wardCode, districtCode) {
    if (!wardCode) return '';
    
    // Kiểm tra cache trước
    if (addressCache.wards.has(wardCode)) {
        return addressCache.wards.get(wardCode);
    }

    try {
        const response = await fetch(`https://provinces.open-api.vn/api/d/${districtCode}?depth=2`);
        const data = await response.json();
        
        if (data.wards) {
            data.wards.forEach(ward => {
                addressCache.wards.set(ward.code.toString(), ward.name);
            });
        }

        return addressCache.wards.get(wardCode.toString()) || wardCode;
    } catch (error) {
        console.error('Error fetching ward:', error);
        return wardCode;
    }
}

// Hàm format địa chỉ hoàn chỉnh
async function formatFullAddress(order) {
    try {
        console.log('Original address data:', {
            shippingAddress: order.shippingAddress,
            ward: order.ward,
            district: order.district,
            province: order.province
        });

        // Lấy tên thực tế từ các mã
        const [provinceName, districtName, wardName] = await Promise.all([
            getProvinceName(order.province),
            getDistrictName(order.district, order.province),
            getWardName(order.ward, order.district)
        ]);

        const addressParts = [
            order.shippingAddress,
            wardName,
            districtName,
            provinceName
        ].filter(part => part && part.trim() && part !== 'null' && part !== 'undefined');

        const fullAddress = addressParts.length > 0 ? addressParts.join(', ') : 'Chưa có địa chỉ';
        
        console.log('Formatted address:', fullAddress);
        return fullAddress;
    } catch (error) {
        console.error('Error formatting address:', error);
        return 'Không thể hiển thị địa chỉ';
    }
}
// Hàm khởi tạo ứng dụng - SỬA LẠI
function initializeApp() {
    const user = getUserInfo();
    if (!user) return;

    // Hiển thị tên khách hàng
    updateCustomerName(user.tenkh);

    // Inject CSS trước khi khởi tạo chat
    injectChatStyles();
    
    // Khởi tạo hệ thống chat
    setTimeout(() => {
        initializeChatSystem();
    }, 500);

    // Load danh sách đơn hàng
    renderOrders(user.makh);

    // Gắn các sự kiện
    attachEventListeners();

    // Khởi tạo bản đồ
    initMap();
}

// Lấy thông tin người dùng từ localStorage
function getUserInfo() {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || !user.makh) {
        redirectToLogin();
        return null;
    }
    return user;
}

// Chuyển hướng đến trang đăng nhập
function redirectToLogin() {
    window.location.href = 'login.html';
}

// Cập nhật tên khách hàng trên giao diện
function updateCustomerName(name) {
    const customerNameElement = document.getElementById('customer-name');
    if (customerNameElement) {
        customerNameElement.textContent = name || 'Khách hàng';
    }
}

// Định dạng giá tiền
function formatPrice(price) {
    return new Intl.NumberFormat('vi-VN').format(price) + 'đ';
}

// Định dạng ngày giờ
function formatDateTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Lấy tên phương thức thanh toán
function getPaymentMethodName(method) {
    const methods = {
        'COD': 'Thanh toán khi nhận hàng',
        'BANK': 'Chuyển khoản ngân hàng',
        'MOMO': 'Ví điện tử MoMo',
        'ZALOPAY': 'Ví điện tử ZaloPay'
    };
    return methods[method] || method;
}

// Hiển thị thông báo lỗi
function showErrorToast(message) {
    console.error('Error:', message);
    alert(message); // Có thể thay bằng toast notification
}

// Lấy customerId từ localStorage
function getCustomerId() {
    const user = JSON.parse(localStorage.getItem('user'));
    return user?.makh || null;
}

// Lấy token từ localStorage
function getToken() {
    return localStorage.getItem('token');
}

// Kiểm tra trạng thái đăng nhập
function checkAuth() {
    const token = getToken();
    const customerId = getCustomerId();
    if (!token || token === 'null' || !customerId) {
        showErrorToast('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        redirectToLogin();
        return false;
    }
    return true;
}

// ✅ Sửa lại fetchOrders để giữ nguyên tinhtrang từ database
async function fetchOrders(customerId, statusFilter = 'all') {
    if (!checkAuth()) return [];

    try {
        const response = await fetch(`http://localhost:5000/api/orders/customer-orders/${customerId}`, {
            headers: {
                'Authorization': `Bearer ${getToken()}`
            }
        });

        if (!response.ok) {
            throw new Error('Không thể lấy danh sách đơn hàng');
        }

        let orders = await response.json();
        
        console.log('📋 Raw orders from API:', orders.map(o => ({
            id: o.id,
            tinhtrang: o.tinhtrang,
            status: o.status
        })));

        // ✅ KHÔNG MAP LẠI STATUS NỮA - SỬ DỤNG TRỰC TIẾP tinhtrang
        // Chỉ lọc theo statusFilter nếu cần
        if (statusFilter !== 'all') {
            const statusMapping = {
                'pending': ['Chờ xử lý'],
                'processing': ['Đã xác nhận'],
                'shipping': ['Đang giao hàng'],
                'completed': ['Đã giao hàng'],
                'cancelled': ['Đã hủy', 'Đã hủy - chờ hoàn tiền', 'Đang hủy - chờ hoàn tiền']
            };
            
            const allowedStatuses = statusMapping[statusFilter] || [];
            if (allowedStatuses.length > 0) {
                orders = orders.filter(order => 
                    allowedStatuses.includes(order.tinhtrang)
                );
            }
        }

        return orders;
    } catch (error) {
        console.error('Lỗi khi lấy danh sách đơn hàng:', error);
        showErrorToast('Lỗi khi tải danh sách đơn hàng');
        return [];
    }
}

// Lấy chi tiết đơn hàng từ API
async function fetchOrderDetail(orderId) {
    if (!checkAuth()) return null;

    try {
        const response = await fetch(`http://localhost:5000/api/orders/customer-orders/detail/${orderId}`, {
            headers: {
                'Authorization': `Bearer ${getToken()}`
            }
        });

        if (!response.ok) {
            throw new Error('Không thể lấy chi tiết đơn hàng');
        }

        const data = await response.json();
        console.log('Order Detail:', data);

        // Ánh xạ trạng thái
        const statusMapping = {
            'Chờ xử lý': 'pending',
            'Đã xác nhận': 'processing',
            'Đang giao hàng': 'shipping',
            'Đã giao hàng': 'completed',
            'Đã hủy': 'cancelled'
        };

        // Ánh xạ trạng thái từ API
        data.status = statusMapping[data.status] || 'pending';

        return data;
    } catch (error) {
        console.error('Lỗi khi lấy chi tiết đơn hàng:', error);
        showErrorToast('Lỗi khi tải chi tiết đơn hàng');
        return null;
    }
}

// ✅ Cập nhật hàm renderOrders với mapping trạng thái mới
async function renderOrders(customerId, statusFilter = 'all') {
    const orderListElement = document.getElementById('order-list');
    const loadingModal = document.getElementById('loading-modal');

    // Hiển thị loading
    if (loadingModal) loadingModal.style.display = 'block';
    if (orderListElement) orderListElement.innerHTML = '';

    try {
        let orders = await fetchOrders(customerId, statusFilter);

        if (!orders.length) {
            orderListElement.innerHTML = `
                <div class="no-orders">
                    <i class="fas fa-box-open"></i>
                    <p>Bạn chưa có đơn hàng nào</p>
                    <a href="index.html" class="btn">Tiếp tục mua sắm</a>
                </div>
            `;
            return;
        }

        // ✅ MAPPING TRẠNG THÁI MỚI - BAO GỒM CẢ TRẠNG THÁI HỦY
        const statusDisplay = {
            'Chờ xử lý': { class: 'status-pending', text: 'Chờ xác nhận' },
            'Đã xác nhận': { class: 'status-processing', text: 'Đã xác nhận' },
            'Đang giao hàng': { class: 'status-shipping', text: 'Đang giao hàng' },
            'Đã giao hàng': { class: 'status-completed', text: 'Đã hoàn thành' },
            'Đã hủy': { class: 'status-cancelled', text: 'Đã hủy' },
            'Đã hủy - chờ hoàn tiền': { class: 'status-refunding', text: 'Đã hủy - chờ hoàn tiền' },
            'Đang hủy - chờ hoàn tiền': { class: 'status-refunding', text: 'Đang hủy - chờ hoàn tiền' },
            // Fallback cho status cũ
            'pending': { class: 'status-pending', text: 'Chờ xác nhận' },
            'processing': { class: 'status-processing', text: 'Đã xác nhận' },
            'shipping': { class: 'status-shipping', text: 'Đang giao hàng' },
            'completed': { class: 'status-completed', text: 'Đã hoàn thành' },
            'cancelled': { class: 'status-cancelled', text: 'Đã hủy' }
        };

        orderListElement.innerHTML = orders.map(order => {
            // Sử dụng tinhtrang từ database thay vì status đã map
            const statusKey = order.tinhtrang || order.status || 'pending';
            const status = statusDisplay[statusKey] || statusDisplay['pending'];
            
            console.log('Order status mapping:', {
                orderId: order.id,
                tinhtrang: order.tinhtrang,
                status: order.status,
                finalStatus: status
            });

            return `
                <div class="order-card" data-order-id="${order.id}">
                    <div class="order-card-header">
                        <div>
                            <span class="order-id">Đơn hàng #${order.id}</span>
                            <span class="order-date">${formatDateTime(order.createdAt)}</span>
                        </div>
                        <span class="order-status ${status.class}">
                            ${status.text}
                        </span>
                    </div>
                    <div class="order-summary">
                        <div class="order-info">
                            <span class="payment-method">${getPaymentMethodName(order.paymentMethod)}</span>
                            ${order.paymentStatus ? `<span class="payment-status">${order.paymentStatus}</span>` : ''}
                        </div>
                        <span class="order-total">${formatPrice(order.totalAmount)}</span>
                    </div>
                </div>
            `;
        }).join('');

        // Gắn sự kiện click cho từng đơn hàng
        document.querySelectorAll('.order-card').forEach(card => {
            card.addEventListener('click', async () => {
                const orderId = card.dataset.orderId;
                const orderDetail = await fetchOrderDetail(orderId);
                if (orderDetail) {
                    localStorage.setItem('currentOrderId', orderId);
                    showOrderDetail(orderDetail);
                }
            });
        });
    } catch (error) {
        console.error('Lỗi khi hiển thị đơn hàng:', error);
        orderListElement.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Có lỗi xảy ra khi tải đơn hàng</p>
                <button onclick="window.location.reload()" class="btn">Thử lại</button>
            </div>
        `;
    } finally {
        if (loadingModal) loadingModal.style.display = 'none';
    }
}


let currentOrderData = null;

// ✅ Cập nhật hàm showOrderDetail để lưu thông tin đơn hàng
async function showOrderDetail(order) {
    // 🔥 LƯU THÔNG TIN ĐƠN HÀNG VÀO BIẾN GLOBAL
    currentOrderData = order;
    
    const modal = document.getElementById('order-detail-modal');
    if (!modal) {
        console.error('Order detail modal not found');
        return;
    }

    const statusDisplay = {
        'pending': { class: 'status-pending', text: 'Chờ xác nhận' },
        'processing': { class: 'status-processing', text: 'Đã xác nhận' },
        'shipping': { class: 'status-shipping', text: 'Đang giao hàng' },
        'completed': { class: 'status-completed', text: 'Đã hoàn thành' },
        'cancelled': { class: 'status-cancelled', text: 'Đã hủy' }
    };

    const status = statusDisplay[order.status] || statusDisplay['pending'];

    // Cập nhật thông tin đơn hàng
    document.getElementById('order-id').textContent = `#${order.id}`;
    document.getElementById('order-status').textContent = status.text;
    document.getElementById('order-status').className = `order-status-badge ${status.class}`;
    document.getElementById('order-date').textContent = formatDateTime(order.createdAt);
    document.getElementById('order-total').textContent = formatPrice(order.totalAmount);
    document.getElementById('payment-method').textContent = getPaymentMethodName(order.paymentMethod);
    document.getElementById('payment-status').textContent = order.paymentStatus || 'Chưa thanh toán';

    // Cập nhật thông tin giao hàng
    document.getElementById('receiver-name').textContent = order.recipientName || 'N/A';
    document.getElementById('receiver-phone').textContent = order.recipientPhone || 'N/A';
    document.getElementById('order-notes').textContent = order.notes || 'Không có ghi chú';

    // Hiển thị loading cho địa chỉ
    const shippingAddressElement = document.getElementById('shipping-address');
    shippingAddressElement.textContent = 'Đang tải địa chỉ...';

    // Format địa chỉ bất đồng bộ
    try {
        const fullAddress = await formatFullAddress(order);
        shippingAddressElement.textContent = fullAddress;
    } catch (error) {
        console.error('Error formatting address:', error);
        shippingAddressElement.textContent = 'Không thể hiển thị địa chỉ';
    }

    // Hiển thị danh sách sản phẩm
    const orderItemsElement = document.getElementById('order-items');
    orderItemsElement.innerHTML = order.items.map(item => `
        <div class="order-item">
            <div class="item-image">
                <img src="img/product/${item.productImage}" alt="${item.productName}" class="order-item-img">
            </div>
            <div class="item-info">
                <h4 class="item-name">${item.productName}</h4>
                <div class="item-details">
                    <span class="item-price">${formatPrice(item.price)}</span>
                    <span class="item-quantity">x ${item.quantity}</span>
                </div>
                <div class="item-total">${formatPrice(item.price * item.quantity)}</div>
            </div>
        </div>
    `).join('');

    // ✅ Hiển thị nút hủy với logic mới
    const cancelBtn = document.getElementById('cancel-order-btn');
    if (cancelBtn) {
        cancelBtn.style.display = order.status === 'pending' ? 'inline-flex' : 'none';
        cancelBtn.onclick = () => showCancelModal();
    }

    // Hiển thị bản đồ giao hàng
    displayDeliveryMap(order);

    modal.style.display = 'block';
}
// ✅ HÀM HỦY ĐƠN HÀNG THÔNG MINH - SỬA LẠI HOÀN TOÀN
function showCancelModal() {
    console.log('🔥 showCancelModal called');
    console.log('Current order data:', currentOrderData);
    
    if (!currentOrderData) {
        showErrorToast('Không tìm thấy thông tin đơn hàng');
        return;
    }
    
    // 🔥 PHÂN BIỆT LOẠI THANH TOÁN (sử dụng đúng tên trường)
    console.log('Payment method:', currentOrderData.paymentMethod);
    console.log('Payment status:', currentOrderData.paymentStatus);
    
    if (currentOrderData.paymentMethod === 'VNPAY' && currentOrderData.paymentStatus === 'Đã thanh toán') {
        // ✅ VNPay đã thanh toán -> Hiển thị form hoàn tiền
        console.log('✅ Showing VNPay refund modal');
        showVNPayRefundModal(currentOrderData);
    } else {
        // ✅ COD hoặc chưa thanh toán -> Hiển thị modal hủy bình thường
        console.log('✅ Showing normal cancel modal');
        showNormalCancelModal();
    }
}
// ✅ MODAL HỦY ĐƠN BÌNH THƯỜNG (COD/Chưa thanh toán)
function showNormalCancelModal() {
    const modal = document.getElementById('cancel-order-modal');
    if (modal) {
        modal.style.display = 'block';
        document.getElementById('cancel-reason').value = '';
    }
}


// ✅ MODAL THÀNH CÔNG CHO VNPAY
function showVNPayCancelSuccessModal(data) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'block';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 600px;">
            <div class="success-header" style="background: linear-gradient(135deg, #28a745, #20c997); color: white; padding: 25px; text-align: center; border-radius: 8px 8px 0 0;">
                <i class="fas fa-check-circle fa-3x" style="margin-bottom: 15px;"></i>
                <h2 style="margin: 0;">Hủy đơn hàng thành công!</h2>
                <p style="margin: 10px 0 0 0; opacity: 0.9;">Đã hoàn tiền VNPay</p>
            </div>
            
            <div style="padding: 30px;">
                <div style="background: #d4edda; border: 1px solid #c3e6cb; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
                    <h4 style="color: #155724; margin: 0 0 15px 0;">
                        <i class="fas fa-undo-alt"></i> Thông tin hoàn tiền
                    </h4>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                        <div>
                            <strong>Mã yêu cầu:</strong><br>
                            <code style="background: #f8f9fa; padding: 4px 8px; border-radius: 4px; font-size: 12px;">${data.refundRequestId || 'N/A'}</code>
                        </div>
                        <div>
                            <strong>Số tiền hoàn:</strong><br>
                            <span style="color: #28a745; font-weight: bold; font-size: 18px;">${formatPrice(data.refundAmount || 0)}</span>
                        </div>
                    </div>
                    <div style="margin-top: 15px;">
                        <strong>Trạng thái:</strong> 
                        <span style="background: #28a745; color: white; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: bold;">
                            ${data.refundStatus === 'COMPLETED' ? 'Đã hoàn tiền' : 'Đang xử lý'}
                        </span>
                    </div>
                </div>

                <div style="background: #e3f2fd; border-radius: 8px; padding: 15px; margin-bottom: 25px;">
                    <p style="margin: 0; color: #1976d2;">
                        <i class="fas fa-info-circle"></i>
                        <strong>Lưu ý:</strong> ${data.refundStatus === 'COMPLETED' ? 
                            'Tiền đã được hoàn về tài khoản của bạn.' : 
                            `Tiền sẽ được hoàn về tài khoản trong ${data.estimatedRefundDays || '1-3 ngày làm việc'}.`
                        }
                    </p>
                </div>

                <div style="text-align: center;">
                    <button onclick="this.closest('.modal').remove()" 
                            style="background: #28a745; color: white; border: none; padding: 12px 30px; border-radius: 6px; cursor: pointer; font-size: 16px; margin-right: 15px;">
                        <i class="fas fa-check"></i> Đóng
                    </button>
                    <a href="refund-history.html" onclick="this.closest('.modal').remove()"
                       style="background: #17a2b8; color: white; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-size: 16px; display: inline-block;">
                        <i class="fas fa-history"></i> Xem lịch sử hoàn tiền
                    </a>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Auto remove after 10 seconds
    setTimeout(() => {
        if (modal.parentNode) {
            modal.remove();
        }
    }, 10000);
}
// ✅ MODAL THÀNH CÔNG CHO COD
function showNormalCancelSuccessModal(data) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'block';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 500px; text-align: center;">
            <div class="success-header" style="background: linear-gradient(135deg, #28a745, #20c997); color: white; padding: 25px; border-radius: 8px 8px 0 0;">
                <i class="fas fa-check-circle fa-3x" style="margin-bottom: 15px;"></i>
                <h2 style="margin: 0;">Hủy đơn hàng thành công!</h2>
            </div>
            
            <div style="padding: 30px;">
                <div style="background: #d4edda; border: 1px solid #c3e6cb; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
                    <p style="margin: 0; color: #155724; font-size: 16px;">
                        <i class="fas fa-info-circle"></i>
                        Đơn hàng <strong>#${data.orderId || 'N/A'}</strong> đã được hủy thành công.
                    </p>
                </div>
                
                <div style="background: #f8f9fa; border-radius: 8px; padding: 15px; margin-bottom: 25px;">
                    <p style="margin: 0; color: #6c757d;">
                        <i class="fas fa-box"></i>
                        Các sản phẩm đã được hoàn lại kho. Bạn có thể đặt hàng lại bất cứ lúc nào.
                    </p>
                </div>

                <button onclick="this.closest('.modal').remove()" 
                        style="background: #28a745; color: white; border: none; padding: 12px 30px; border-radius: 6px; cursor: pointer; font-size: 16px;">
                    <i class="fas fa-check"></i> Đóng
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Auto remove after 8 seconds
    setTimeout(() => {
        if (modal.parentNode) {
            modal.remove();
        }
    }, 8000);
}
// ✅ ĐÓNG MODAL CHI TIẾT ĐƠN HÀNG
function closeOrderDetailModal() {
    const modal = document.getElementById('order-detail-modal');
    if (modal) {
        modal.style.display = 'none';
        localStorage.removeItem('currentOrderId');
        currentOrderData = null; // Reset dữ liệu
    }
}

// Hàm đóng modal hủy đơn hàng (Thêm mới)
function hideCancelModal() {
    const modal = document.getElementById('cancel-order-modal');
    if (modal) {
        modal.style.display = 'none';
        document.getElementById('cancel-reason').value = '';
    }
}

// ✅ CẬP NHẬT HÀM cancelOrder (hàm xử lý hủy đơn bình thường)
async function cancelOrder() {
    if (!checkAuth()) return;

    showNormalCancelModal();

    const confirmCancelBtn = document.getElementById('confirm-cancel-btn');
    const cancelCancelBtn = document.getElementById('cancel-cancel-btn');
    const closeModalBtn = document.querySelector('.close-modal-cancel');

    if (confirmCancelBtn && cancelCancelBtn && closeModalBtn) {
        confirmCancelBtn.onclick = async () => {
            const orderId = localStorage.getItem('currentOrderId');
            const customerId = getCustomerId();
            const reason = document.getElementById('cancel-reason').value.trim() || 'Không có lý do';

            if (!orderId || isNaN(orderId)) {
                console.error('Invalid orderId in localStorage:', orderId);
                showErrorToast('Mã đơn hàng không hợp lệ.');
                hideCancelModal();
                return;
            }

            try {
                const response = await fetch(`http://localhost:5000/api/orders/customer-orders/cancel/${orderId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${getToken()}`
                    },
                    body: JSON.stringify({
                        customerId,
                        reason
                    })
                });

                const result = await response.json();
                if (!response.ok) {
                    throw new Error(result.error || 'Không thể hủy đơn hàng.');
                }

                // 🔥 PHÂN BIỆT KẾT QUẢ TRẢ VỀ
                if (result.data && result.data.cancelType === 'VNPAY_REFUND') {
                    showVNPayCancelSuccessModal(result.data);
                } else {
                    showNormalCancelSuccessModal(result.data || { orderId });
                }

                localStorage.removeItem('currentOrderId');
                hideCancelModal();
                closeOrderDetailModal();
                renderOrders(customerId, document.getElementById('status-filter')?.value || 'all');
                
            } catch (error) {
                console.error('Lỗi khi hủy đơn hàng:', { orderId, error: error.message });
                showErrorToast(`Không thể hủy đơn hàng: ${error.message}`);
                hideCancelModal();
            }
        };

        cancelCancelBtn.onclick = hideCancelModal;
        closeModalBtn.onclick = hideCancelModal;

        // Đóng modal khi click bên ngoài
        window.addEventListener('click', function handler(event) {
            const modal = document.getElementById('cancel-order-modal');
            if (event.target === modal) {
                hideCancelModal();
                window.removeEventListener('click', handler);
            }
        });
    }
}

// Gắn các sự kiện
function attachEventListeners() {
    // Đóng modal
    const closeModal = document.querySelector('.close-modal');
    if (closeModal) {
        closeModal.addEventListener('click', () => {
            document.getElementById('order-detail-modal').style.display = 'none';
            localStorage.removeItem('currentOrderId');
        });
    }

    // Đóng modal khi click bên ngoài
    window.addEventListener('click', (event) => {
        const modal = document.getElementById('order-detail-modal');
        if (event.target === modal) {
            modal.style.display = 'none';
            localStorage.removeItem('currentOrderId');
        }
    });

    // Lọc đơn hàng theo trạng thái
    const statusFilter = document.getElementById('status-filter');
    if (statusFilter) {
        statusFilter.addEventListener('change', () => {
            const customerId = getCustomerId();
            if (customerId) renderOrders(customerId, statusFilter.value);
        });
    }

    // Tìm kiếm đơn hàng
    const searchBtn = document.getElementById('search-btn');
    if (searchBtn) {
        searchBtn.addEventListener('click', () => {
            const customerId = getCustomerId();
            if (customerId) renderOrders(customerId, statusFilter?.value || 'all');
        });
    }
}

// ========== HỆ THỐNG CHAT HOÀN CHỈNH ==========
let currentChatRoom = null;
let unreadMessages = 0;
let chatPollingInterval = null;
let lastMessageId = 0;

// 1. Khởi tạo hệ thống chat
function initializeChatSystem() {
    console.log('🚀 Initializing chat system...');
    
    if (!checkAuth()) {
        console.error('❌ User not authenticated');
        return;
    }

    // Inject CSS trước
    injectChatStyles();

    // Tạo chat elements nếu chưa có
    createChatElements();

    // Khởi tạo phòng chat
    initializeChatRoom()
        .then(() => {
            console.log('✅ Chat room initialized successfully');
            attachChatEventListeners();
            startUnreadPolling();
        })
        .catch(error => {
            console.error('❌ Failed to initialize chat room:', error);
            showErrorToast('Không thể khởi tạo chat');
        });
}

// 2. Tạo chat elements
function createChatElements() {
    console.log('🔧 Creating chat elements...');

    // Tạo floating button
    if (!document.getElementById('chat-floating-btn')) {
        const chatBtn = document.createElement('div');
        chatBtn.id = 'chat-floating-btn';
        chatBtn.className = 'chat-floating-btn';
        chatBtn.innerHTML = '<i class="fas fa-comments"></i>';
        document.body.appendChild(chatBtn);
    }

    // Tạo chat popup
    if (!document.getElementById('chat-popup')) {
        const chatPopup = document.createElement('div');
        chatPopup.id = 'chat-popup';
        chatPopup.className = 'chat-popup';
        chatPopup.innerHTML = `
            <div class="chat-popup-header">
                <h3><i class="fas fa-headset"></i> Hỗ trợ khách hàng</h3>
                <span class="close-chat-btn" id="close-chat-btn">&times;</span>
            </div>
            <div class="chat-popup-body">
                <div class="chat-messages" id="chat-messages"></div>
                <div class="chat-input-area">
                    <input type="text" id="chat-message-input" placeholder="Nhập tin nhắn..." />
                    <button id="send-chat-message-btn">
                        <i class="fas fa-paper-plane"></i>
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(chatPopup);
    }
}

// 3. Khởi tạo phòng chat
async function initializeChatRoom() {
    try {
        console.log('🏠 Initializing chat room...');
        
        // Lấy danh sách phòng chat hiện có
        const rooms = await fetchChatRooms();
        
        if (rooms.length > 0) {
            currentChatRoom = rooms[0];
            console.log('✅ Using existing room:', currentChatRoom.room_id);
        } else {
            // Tạo phòng mới
            currentChatRoom = await createChatRoom();
            console.log('✅ Created new room:', currentChatRoom.room_id);
        }

        await updateUnreadCount();
        
    } catch (error) {
        console.error('❌ Error initializing chat room:', error);
        throw error;
    }
}

// 4. Tạo phòng chat mới
async function createChatRoom() {
    console.log('🆕 Creating new chat room...');
    
    if (!checkAuth()) {
        throw new Error('User not authenticated');
    }

    try {
        const response = await fetch('http://localhost:5000/api/chat/rooms', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getToken()}`
            },
            body: JSON.stringify({}) // API tự lấy customer_id từ token
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP ${response.status}`);
        }

        const data = await response.json();
        
        if (!data.success || !data.room) {
            throw new Error('Invalid response format');
        }

        console.log('✅ Room created:', data.room);
        return data.room;
        
    } catch (error) {
        console.error('❌ Create room error:', error);
        throw error;
    }
}

// 5. Lấy danh sách phòng chat
async function fetchChatRooms() {
    console.log('📋 Fetching chat rooms...');
    
    if (!checkAuth()) return [];

    try {
        const response = await fetch('http://localhost:5000/api/chat/rooms', {
            headers: { 
                'Authorization': `Bearer ${getToken()}` 
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        console.log('📋 Rooms response:', data);
        
        return data.rooms || [];
        
    } catch (error) {
        console.error('❌ Fetch rooms error:', error);
        return [];
    }
}

// 6. Gắn event listeners
function attachChatEventListeners() {
    console.log('🔗 Attaching chat event listeners...');

    const chatBtn = document.getElementById('chat-floating-btn');
    const chatPopup = document.getElementById('chat-popup');
    const closeBtn = document.getElementById('close-chat-btn');
    const sendBtn = document.getElementById('send-chat-message-btn');
    const chatInput = document.getElementById('chat-message-input');

    // Mở/đóng chat
    if (chatBtn && chatPopup) {
        chatBtn.addEventListener('click', () => {
            console.log('💬 Chat button clicked');
            const isVisible = chatPopup.classList.contains('show');
            
            if (isVisible) {
                closeChatPopup();
            } else {
                openChatPopup();
            }
        });
    }

    // Đóng chat
    if (closeBtn) {
        closeBtn.addEventListener('click', closeChatPopup);
    }

    // Gửi tin nhắn
    if (sendBtn) {
        sendBtn.addEventListener('click', sendMessage);
    }

    // Enter để gửi
    if (chatInput) {
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
    }

    // Đóng khi click bên ngoài
    document.addEventListener('click', (e) => {
        if (chatPopup && chatPopup.classList.contains('show')) {
            if (!chatPopup.contains(e.target) && !chatBtn.contains(e.target)) {
                closeChatPopup();
            }
        }
    });
}

// 7. Mở chat popup
function openChatPopup() {
    console.log('📖 Opening chat popup...');
    
    const chatPopup = document.getElementById('chat-popup');
    if (!chatPopup) return;

    chatPopup.classList.add('show');
    
    // Reset unread count
    unreadMessages = 0;
    updateUnreadBadge();
    
    // Load lịch sử và bắt đầu polling
    if (currentChatRoom) {
        loadChatHistory();
        startChatPolling();
    }

    // Focus input
    const chatInput = document.getElementById('chat-message-input');
    if (chatInput) {
        setTimeout(() => chatInput.focus(), 300);
    }
}

// 8. Đóng chat popup
function closeChatPopup() {
    console.log('❌ Closing chat popup...');
    
    const chatPopup = document.getElementById('chat-popup');
    if (!chatPopup) return;

    chatPopup.classList.remove('show');
    stopChatPolling();
}

// 9. Tải lịch sử chat
async function loadChatHistory() {
    if (!currentChatRoom || !checkAuth()) {
        console.log('⚠️ Cannot load chat history: missing room or auth');
        return;
    }

    console.log('📚 Loading chat history for room:', currentChatRoom.room_id);

    try {
        const response = await fetch(`http://localhost:5000/api/chat/rooms/${currentChatRoom.room_id}/messages`, {
            headers: { 
                'Authorization': `Bearer ${getToken()}` 
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        console.log('📨 Raw API response:', data);
        
        if (data.success && Array.isArray(data.messages)) {
            console.log(`📨 Loaded ${data.messages.length} messages`);
            
            // Log từng tin nhắn để debug
            data.messages.forEach(msg => {
                console.log('📄 Message:', {
                    id: msg.id,
                    sender_type: msg.sender_type,
                    message: msg.message?.substring(0, 30) + '...'
                });
            });
            
            displayChatHistory(data.messages);
            
            // Cập nhật lastMessageId
            if (data.messages.length > 0) {
                lastMessageId = Math.max(...data.messages.map(m => m.id));
                console.log('🔢 Set lastMessageId to:', lastMessageId);
            }
        } else {
            console.error('❌ Invalid response format:', data);
            showEmptyChat();
        }
        
    } catch (error) {
        console.error('❌ Load history error:', error);
        showErrorChat('Không thể tải lịch sử chat');
    }
}

// 10. Hiển thị lịch sử chat
function displayChatHistory(messages) {
    const chatBody = document.getElementById('chat-messages');
    if (!chatBody) {
        console.error('❌ Chat messages container not found');
        return;
    }

    console.log(`📺 Displaying ${messages.length} messages`);

    // Xóa nội dung cũ
    chatBody.innerHTML = '';

    if (messages.length === 0) {
        showEmptyChat();
        return;
    }

    // Sắp xếp tin nhắn theo thời gian
    const sortedMessages = messages.sort((a, b) => 
        new Date(a.created_at) - new Date(b.created_at)
    );

    // Hiển thị từng tin nhắn
    sortedMessages.forEach(msg => {
        console.log('📝 Processing message:', msg);
        appendMessage(msg);
    });

    // Scroll xuống cuối
    scrollToBottom();
}

// 11. Thêm tin nhắn vào UI
function appendMessage(msg, animate = false) {
    const chatBody = document.getElementById('chat-messages');
    if (!chatBody) return;

    // Kiểm tra tin nhắn đã tồn tại
    if (chatBody.querySelector(`[data-message-id="${msg.id}"]`)) {
        console.log('⚠️ Message already exists:', msg.id);
        return;
    }

    console.log('📝 Appending message:', {
        id: msg.id,
        sender_type: msg.sender_type,
        message: (msg.message || '').substring(0, 50) + '...'
    });

    const messageDiv = document.createElement('div');
    const isCustomer = msg.sender_type === 'customer';
    
    messageDiv.className = `chat-message ${isCustomer ? 'sent' : 'received'}`;
    messageDiv.setAttribute('data-message-id', msg.id);
    
    if (animate) {
        messageDiv.style.opacity = '0';
        messageDiv.style.transform = 'translateY(20px)';
    }
    
    messageDiv.innerHTML = `
        <div class="message-content">${escapeHtml(msg.message || '')}</div>
        <div class="message-time">${formatDateTime(msg.created_at)}</div>
        <div class="message-sender">${isCustomer ? 'Bạn' : 'Hỗ trợ viên'}</div>
    `;

    chatBody.appendChild(messageDiv);

    // Animation
    if (animate) {
        setTimeout(() => {
            messageDiv.style.transition = 'all 0.3s ease';
            messageDiv.style.opacity = '1';
            messageDiv.style.transform = 'translateY(0)';
        }, 50);
    }

    scrollToBottom();
}

// 12. Gửi tin nhắn
async function sendMessage() {
    const chatInput = document.getElementById('chat-message-input');
    const message = chatInput?.value?.trim();
    
    if (!message) {
        console.log('⚠️ Empty message, skipping send');
        return;
    }

    console.log('📤 Sending message:', message.substring(0, 50) + '...');

    // Tạo phòng chat nếu chưa có
    if (!currentChatRoom) {
        console.log('🏠 No chat room, creating one...');
        try {
            currentChatRoom = await createChatRoom();
        } catch (error) {
            console.error('❌ Failed to create room:', error);
            showErrorToast('Không thể tạo phòng chat');
            return;
        }
    }

    // Disable input
    if (chatInput) {
        chatInput.disabled = true;
    }

    try {
        const response = await fetch('http://localhost:5000/api/chat/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getToken()}`
            },
            body: JSON.stringify({
                room_id: currentChatRoom.room_id,
                message: message
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP ${response.status}`);
        }

        const data = await response.json();
        console.log('✅ Message sent successfully:', data);

        // Hiển thị tin nhắn ngay lập tức
        const newMessage = {
            id: data.message?.id || Date.now(),
            message: message,
            sender_type: 'customer',
            created_at: new Date().toISOString(),
            room_id: currentChatRoom.room_id
        };

        appendMessage(newMessage, true);

        // Clear input
        if (chatInput) {
            chatInput.value = '';
        }

        // Cập nhật lastMessageId
        lastMessageId = Math.max(lastMessageId, newMessage.id);

    } catch (error) {
        console.error('❌ Send message error:', error);
        showErrorToast(`Gửi tin nhắn thất bại: ${error.message}`);
    } finally {
        // Re-enable input
        if (chatInput) {
            chatInput.disabled = false;
            chatInput.focus();
        }
    }
}

// 13. Bắt đầu polling tin nhắn mới
function startChatPolling() {
    if (chatPollingInterval) {
        clearInterval(chatPollingInterval);
    }

    console.log('🔄 Starting chat polling...');
    
    chatPollingInterval = setInterval(() => {
        if (currentChatRoom) {
            checkForNewMessages();
        }
    }, 2000); // Poll mỗi 2 giây
}

// 14. Dừng polling
function stopChatPolling() {
    if (chatPollingInterval) {
        console.log('⏹️ Stopping chat polling...');
        clearInterval(chatPollingInterval);
        chatPollingInterval = null;
    }
}

// 15. Kiểm tra tin nhắn mới
async function checkForNewMessages() {
    if (!currentChatRoom || !checkAuth()) return;

    try {
        const response = await fetch(`http://localhost:5000/api/chat/rooms/${currentChatRoom.room_id}/messages`, {
            headers: { 
                'Authorization': `Bearer ${getToken()}` 
            }
        });

        if (!response.ok) return;

        const data = await response.json();
        
        if (data.success && Array.isArray(data.messages)) {
            console.log('🔍 Checking messages, total:', data.messages.length);
            console.log('🔍 Current lastMessageId:', lastMessageId);
            
            // Tìm tin nhắn mới (id > lastMessageId)
            const newMessages = data.messages.filter(msg => 
                msg.id > lastMessageId
            );

            console.log('🆕 New messages found:', newMessages.length);

            if (newMessages.length > 0) {
                // Sắp xếp theo thời gian
                newMessages.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
                
                // Hiển thị TẤT CẢ tin nhắn mới
                newMessages.forEach(msg => {
                    console.log('📤 Displaying new message:', msg);
                    appendMessage(msg, true);
                    lastMessageId = Math.max(lastMessageId, msg.id);
                });

                console.log('🔢 Updated lastMessageId to:', lastMessageId);

                // Đếm tin nhắn từ staff
                const newStaffMessages = newMessages.filter(msg => 
                    msg.sender_type === 'staff'
                );

                if (newStaffMessages.length > 0) {
                    console.log('🔔 New staff messages:', newStaffMessages.length);
                    playNotificationSound();
                }
            }
        }
        
    } catch (error) {
        console.error('❌ Check new messages error:', error);
    }
}

// 16. Polling unread count khi chat đóng
function startUnreadPolling() {
    console.log('🔔 Starting unread polling...');
    
    setInterval(() => {
        const chatPopup = document.getElementById('chat-popup');
        if (!chatPopup?.classList.contains('show') && currentChatRoom) {
            updateUnreadCount();
        }
    }, 5000); // Poll mỗi 5 giây khi chat đóng
}

// 17. Cập nhật số tin nhắn chưa đọc
async function updateUnreadCount() {
    if (!currentChatRoom) return;

    try {
        const response = await fetch(`http://localhost:5000/api/chat/rooms/${currentChatRoom.room_id}/messages`, {
            headers: { 
                'Authorization': `Bearer ${getToken()}` 
            }
        });

        if (response.ok) {
            const data = await response.json();
            
            if (data.success && Array.isArray(data.messages)) {
                // Đếm tin nhắn từ staff sau lastMessageId
                const unreadStaffMessages = data.messages.filter(msg => 
                    msg.sender_type === 'staff' && 
                    msg.id > lastMessageId
                );

                unreadMessages = unreadStaffMessages.length;
                console.log('🔔 Unread messages:', unreadMessages);
                
                updateUnreadBadge();
            }
        }
    } catch (error) {
        console.error('❌ Update unread count error:', error);
    }
}

// 18. Cập nhật badge unread
function updateUnreadBadge() {
    const chatBtn = document.getElementById('chat-floating-btn');
    if (!chatBtn) return;

    // Xóa badge cũ
    const oldBadge = chatBtn.querySelector('.unread-badge');
    if (oldBadge) {
        oldBadge.remove();
    }

    // Thêm badge mới nếu có tin nhắn chưa đọc
    if (unreadMessages > 0) {
        const badge = document.createElement('span');
        badge.className = 'unread-badge';
        badge.textContent = unreadMessages > 99 ? '99+' : unreadMessages;
        chatBtn.appendChild(badge);
    }
}

// 19. Utility functions
function showEmptyChat() {
    const chatBody = document.getElementById('chat-messages');
    if (!chatBody) return;

    chatBody.innerHTML = `
        <div class="welcome-message">
            <div class="welcome-icon">
                <i class="fas fa-comments"></i>
            </div>
            <h3>Chào mừng bạn đến với hỗ trợ khách hàng!</h3>
            <p>Hãy gửi tin nhắn để bắt đầu cuộc trò chuyện.</p>
        </div>
    `;
}

function showErrorChat(message) {
    const chatBody = document.getElementById('chat-messages');
    if (!chatBody) return;

    chatBody.innerHTML = `
        <div class="error-message">
            <div class="error-icon">
                <i class="fas fa-exclamation-triangle"></i>
            </div>
            <p>${escapeHtml(message)}</p>
            <button onclick="loadChatHistory()" class="retry-btn">Thử lại</button>
        </div>
    `;
}

function scrollToBottom() {
    const chatBody = document.getElementById('chat-messages');
    if (!chatBody) return;
    
    setTimeout(() => {
        chatBody.scrollTop = chatBody.scrollHeight;
    }, 100);
}

function playNotificationSound() {
    try {
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmgyAyiA0OzZgysELoDM8+SJOAoUYLrv4pxNEAhPpOLuw2slBzGN3/DGZRUPCC+A0Oreg');
        audio.volume = 0.3;
        audio.play().catch(() => {}); // Ignore errors
    } catch (error) {
        // Ignore notification sound errors
    }
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 20. CSS tự động inject
function injectChatStyles() {
    if (document.getElementById('chat-styles')) return;

    const styles = `
        <style id="chat-styles">
        /* Chat Floating Button */
        .chat-floating-btn {
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 60px;
            height: 60px;
            background: linear-gradient(135deg, #007bff, #0056b3);
            color: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(0, 123, 255, 0.4);
            z-index: 1000;
            transition: all 0.3s ease;
            font-size: 24px;
        }

        .chat-floating-btn:hover {
            transform: scale(1.1);
            box-shadow: 0 6px 20px rgba(0, 123, 255, 0.6);
        }

        .unread-badge {
            position: absolute;
            top: -5px;
            right: -5px;
            background: #dc3545;
            color: white;
            border-radius: 50%;
            width: 24px;
            height: 24px;
            font-size: 12px;
            font-weight: bold;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 2px solid white;
        }

        /* Chat Popup */
        .chat-popup {
            position: fixed;
            bottom: 100px;
            right: 20px;
            width: 380px;
            height: 500px;
            background: white;
            border-radius: 12px;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
            z-index: 1001;
            display: none;
            flex-direction: column;
            overflow: hidden;
            transform: translateY(20px);
            opacity: 0;
            transition: all 0.3s ease;
        }

        .chat-popup.show {
            display: flex;
            transform: translateY(0);
            opacity: 1;
        }

        .chat-popup-header {
            background: linear-gradient(135deg, #007bff, #0056b3);
            color: white;
            padding: 16px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .chat-popup-header h3 {
            margin: 0;
            font-size: 16px;
            font-weight: 600;
        }

        .close-chat-btn {
            background: none;
            border: none;
            color: white;
            font-size: 24px;
            cursor: pointer;
            width: 30px;
            height: 30px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            transition: background 0.2s;
        }

        .close-chat-btn:hover {
            background: rgba(255, 255, 255, 0.2);
        }

        .chat-popup-body {
            flex: 1;
            display: flex;
            flex-direction: column;
        }

        .chat-messages {
            flex: 1;
            padding: 16px;
            overflow-y: auto;
            background: #f8f9fa;
            display: flex;
            flex-direction: column;
            gap: 12px;
        }

        .chat-message {
            max-width: 80%;
            padding: 12px 16px;
            border-radius: 18px;
            font-size: 14px;
            line-height: 1.4;
            position: relative;
            word-wrap: break-word;
        }

        .chat-message.sent {
            align-self: flex-end;
            background: linear-gradient(135deg, #007bff, #0056b3);
            color: white;
            border-bottom-right-radius: 6px;
        }

        .chat-message.received {
            align-self: flex-start;
            background: white;
            color: #333;
            border: 1px solid #e9ecef;
            border-bottom-left-radius: 6px;
        }

        .message-content {
            margin-bottom: 6px;
        }

        .message-time {
            font-size: 11px;
            opacity: 0.7;
            text-align: right;
        }

        .message-sender {
            font-size: 10px;
            font-weight: 600;
            opacity: 0.8;
            margin-top: 2px;
        }

        .chat-input-area {
            padding: 16px;
            background: white;
            border-top: 1px solid #e9ecef;
            display: flex;
            gap: 12px;
            align-items: center;
        }

        .chat-input-area input {
            flex: 1;
            padding: 12px 16px;
            border: 1px solid #e9ecef;
            border-radius: 24px;
            outline: none;
            font-size: 14px;
            transition: border-color 0.2s;
        }

        .chat-input-area input:focus {
            border-color: #007bff;
        }

        .chat-input-area input:disabled {
            background: #f8f9fa;
            opacity: 0.7;
        }

        .chat-input-area button {
            width: 44px;
            height: 44px;
            background: linear-gradient(135deg, #007bff, #0056b3);
            color: white;
            border: none;
            border-radius: 50%;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s;
        }

        .chat-input-area button:hover {
            transform: scale(1.05);
            box-shadow: 0 2px 8px rgba(0, 123, 255, 0.4);
        }

        .chat-input-area button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
            transform: none;
        }

        /* Welcome message */
        .welcome-message {
            text-align: center;
            padding: 40px 20px;
            color: #6c757d;
        }

        .welcome-icon {
            font-size: 48px;
            color: #007bff;
            margin-bottom: 16px;
        }

        .welcome-message h3 {
            margin: 0 0 12px 0;
            font-size: 18px;
            color: #495057;
        }

        .welcome-message p {
            margin: 0;
            font-size: 14px;
        }

        /* Error message */
        .error-message {
            text-align: center;
            padding: 40px 20px;
            color: #dc3545;
        }

        .error-icon {
            font-size: 48px;
            margin-bottom: 16px;
        }

        .retry-btn {
            background: #007bff;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 20px;
            cursor: pointer;
            font-size: 14px;
            margin-top: 12px;
        }

        .retry-btn:hover {
            background: #0056b3;
        }

        /* Responsive */
        @media (max-width: 480px) {
            .chat-popup {
                right: 10px;
                left: 10px;
                width: auto;
                bottom: 90px;
            }
        }

        /* Scrollbar styling */
        .chat-messages::-webkit-scrollbar {
            width: 6px;
        }

        .chat-messages::-webkit-scrollbar-track {
            background: #f1f1f1;
        }

        .chat-messages::-webkit-scrollbar-thumb {
            background: #c1c1c1;
            border-radius: 3px;
        }

        .chat-messages::-webkit-scrollbar-thumb:hover {
            background: #a8a8a8;
        }
        </style>
    `;

    document.head.insertAdjacentHTML('beforeend', styles);
}

// Export functions for manual use
window.chatSystem = {
    init: initializeChatSystem,
    openChat: openChatPopup,
    closeChat: closeChatPopup,
    sendMessage: sendMessage,
    loadHistory: loadChatHistory
};


// Khởi tạo bản đồ với Leaflet
let map;
let polyline;

function initMap() {
    const mapElement = document.getElementById('delivery-map');
    if (!mapElement) {
        console.error('Map element not found');
        return;
    }

    map = L.map('delivery-map').setView([10.7769, 106.7009], 12); // Trung tâm kho (TP.HCM)

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
    }).addTo(map);
}

// Thay thế hàm displayDeliveryMap hiện tại (từ dòng 958) bằng:
async function displayDeliveryMap(order) {
    const mapElement = document.getElementById('delivery-map');
    const distanceInfoElement = document.getElementById('distance-info');
    const durationInfoElement = document.getElementById('duration-info');
    
    if (!mapElement) {
        console.error('Map element not found');
        if (distanceInfoElement) distanceInfoElement.textContent = 'Không thể hiển thị thông tin';
        if (durationInfoElement) durationInfoElement.textContent = 'Không thể hiển thị thông tin';
        return;
    }

    // Đảm bảo bản đồ được khởi tạo
    if (!map) {
        initMap();
    }

    const warehouseLocation = [10.7769, 106.7009]; // Tọa độ kho (TP.HCM)

    try {
        // Sử dụng hàm formatFullAddress để có địa chỉ đầy đủ
        const destinationAddress = await formatFullAddress(order);
        
        console.log('Formatted destination address:', destinationAddress);
        
        if (!destinationAddress || destinationAddress === 'Chưa có địa chỉ') {
            console.error('Không có địa chỉ giao hàng hợp lệ');
            if (distanceInfoElement) distanceInfoElement.textContent = 'Chưa có địa chỉ';
            if (durationInfoElement) durationInfoElement.textContent = 'Chưa có địa chỉ';
            return;
        }

        // Geocoding địa chỉ giao hàng với Nominatim
        const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(destinationAddress)}&format=json&limit=1`);
        const data = await response.json();
        
        if (data.length === 0) {
            console.error('Không tìm thấy tọa độ cho địa chỉ:', destinationAddress);
            if (distanceInfoElement) distanceInfoElement.textContent = 'Không thể tìm địa chỉ';
            if (durationInfoElement) durationInfoElement.textContent = 'Không thể tìm địa chỉ';
            return;
        }

        const destinationLocation = [parseFloat(data[0].lat), parseFloat(data[0].lon)];

        // Xóa các layer cũ
        if (polyline) {
            polyline.remove();
        }
        map.eachLayer(layer => {
            if (layer instanceof L.Marker) {
                layer.remove();
            }
        });

        // Đặt marker cho vị trí kho
        L.marker(warehouseLocation, {
            icon: L.divIcon({
                className: 'warehouse-marker',
                html: '<i class="fas fa-warehouse"></i>',
            }),
        }).addTo(map).bindPopup('Kho hàng');

        // Đặt marker cho địa chỉ giao hàng
        L.marker(destinationLocation, {
            icon: L.divIcon({
                className: 'delivery-marker',
                html: '<i class="fas fa-map-marker-alt"></i>',
            }),
        }).addTo(map).bindPopup('Địa chỉ giao hàng');

        // Tính tuyến đường với OSRM
        const routeResponse = await fetch(`https://router.project-osrm.org/route/v1/driving/${warehouseLocation[1]},${warehouseLocation[0]};${destinationLocation[1]},${destinationLocation[0]}?overview=full&geometries=geojson`);
        const routeData = await routeResponse.json();
        
        if (routeData.code === 'Ok') {
            const route = routeData.routes[0].geometry.coordinates;
            const routePoints = route.map(coord => [coord[1], coord[0]]);

            // Vẽ tuyến đường
            polyline = L.polyline(routePoints, { color: 'blue' }).addTo(map);

            // Cập nhật thông tin khoảng cách và thời gian
            const distance = (routeData.routes[0].distance / 1000).toFixed(2);
            const duration = Math.round(routeData.routes[0].duration / 60);
            if (distanceInfoElement) distanceInfoElement.textContent = `${distance} km`;
            if (durationInfoElement) durationInfoElement.textContent = `${duration} phút`;
        } else {
            console.error('Lỗi tính tuyến đường:', routeData.message);
            if (distanceInfoElement) distanceInfoElement.textContent = 'Không thể tính khoảng cách';
            if (durationInfoElement) durationInfoElement.textContent = 'Không thể tính thời gian';
        }

        // Điều chỉnh bản đồ để hiển thị cả kho và địa chỉ giao hàng
        map.fitBounds([warehouseLocation, destinationLocation]);
        
    } catch (error) {
        console.error('Lỗi khi hiển thị bản đồ:', error);
        if (distanceInfoElement) distanceInfoElement.textContent = 'Không thể hiển thị thông tin';
        if (durationInfoElement) durationInfoElement.textContent = 'Không thể hiển thị thông tin';
    }
}



/////--------xử lý hoàn tiền đơn hàng------------///////////////
// ✅ XỬ LÝ FORM HOÀN TIỀN - VERSION FIX
let currentOrderForRefund = null;

// Hiển thị modal hoàn tiền VNPay
function showVNPayRefundModal(order) {
    console.log('📋 Showing VNPay refund modal for order:', order);
    
    currentOrderForRefund = order;
    const orderId = order.id || order.MaHD;
    const orderTotal = order.totalAmount || order.TongTien || 0;
    
    // Cập nhật thông tin đơn hàng
    document.getElementById('refund-order-id').textContent = `#${orderId}`;
    document.getElementById('refund-order-total').textContent = formatPrice(orderTotal);
    document.getElementById('total-refund-display').textContent = formatPrice(orderTotal);
    
    // Cập nhật select options
    const refundTypeSelect = document.getElementById('refund-type');
    refundTypeSelect.innerHTML = `
        <option value="full">Hoàn tiền toàn bộ (${formatPrice(orderTotal)})</option>
        <option value="partial">Hoàn tiền một phần</option>
    `;
    
    // Cập nhật max value
    const refundAmountInput = document.getElementById('refund-amount');
    if (refundAmountInput) {
        refundAmountInput.max = orderTotal;
    }
    
    // Hiển thị modal
    document.getElementById('vnpay-refund-modal').style.display = 'block';
    
    // Reset form
    const form = document.getElementById('refund-form');
    if (form) form.reset();
    
    // Hide optional groups
    document.getElementById('partial-amount-group').style.display = 'none';
    document.getElementById('other-reason-group').style.display = 'none';
    
    // ✅ GẮN EVENT LISTENER TRỰC TIẾP CHO BUTTON
    const confirmBtn = document.getElementById('confirm-refund-btn');
    if (confirmBtn) {
        confirmBtn.disabled = true;
        
        // Remove old listeners
        confirmBtn.replaceWith(confirmBtn.cloneNode(true));
        const newConfirmBtn = document.getElementById('confirm-refund-btn');
        
        // Add new listener
        newConfirmBtn.addEventListener('click', processRefundCancellation);
    }
    
    // Setup form listeners
    setupRefundFormListeners();
}

// ✅ SETUP FORM LISTENERS - COMPLETE VERSION
function setupRefundFormListeners() {
    console.log('🔧 Setting up refund form listeners...');
    
    // Remove old listeners trước
    removeRefundListeners();
    
    // 1. Refund type change
    const refundTypeSelect = document.getElementById('refund-type');
    if (refundTypeSelect) {
        refundTypeSelect.addEventListener('change', function() {
            handleRefundTypeChange(this.value);
        });
        console.log('✅ Refund type listener added');
    }
    
    // 2. Cancel reason change
    const cancelReasonSelect = document.getElementById('cancel-reason-select');
    if (cancelReasonSelect) {
        cancelReasonSelect.addEventListener('change', function() {
            handleReasonChange(this.value);
        });
        console.log('✅ Cancel reason listener added');
    }
    
    // 3. Refund amount input
    const refundAmountInput = document.getElementById('refund-amount');
    if (refundAmountInput) {
        refundAmountInput.addEventListener('input', function() {
            const amount = parseFloat(this.value) || 0;
            const maxAmount = currentOrderForRefund ? (currentOrderForRefund.totalAmount || currentOrderForRefund.TongTien || 0) : 0;
            
            // Update display
            const totalDisplay = document.getElementById('total-refund-display');
            if (totalDisplay) {
                totalDisplay.textContent = formatPrice(amount);
            }
            
            // Validation
            if (amount > maxAmount) {
                this.setCustomValidity(`Số tiền hoàn không được vượt quá ${formatPrice(maxAmount)}`);
            } else if (amount < 1000 && amount > 0) {
                this.setCustomValidity('Số tiền hoàn tối thiểu là 1.000đ');
            } else {
                this.setCustomValidity('');
            }
            
            validateRefundForm();
        });
        console.log('✅ Refund amount listener added');
    }
    
    // 4. Other reason detail
    const otherReasonDetail = document.getElementById('other-reason-detail');
    if (otherReasonDetail) {
        otherReasonDetail.addEventListener('input', function() {
            const charCount = this.value.length;
            const charCountElement = document.querySelector('.char-count');
            if (charCountElement) {
                charCountElement.textContent = `${charCount}/500 ký tự`;
            }
            
            if (charCount > 500) {
                this.setCustomValidity('Không được vượt quá 500 ký tự');
            } else {
                this.setCustomValidity('');
            }
            
            validateRefundForm();
        });
        console.log('✅ Other reason detail listener added');
    }
    
    // ✅ 5. Bank account input - chỉ cho phép nhập số
    const bankAccountInput = document.getElementById('bank-account');
    if (bankAccountInput) {
        bankAccountInput.addEventListener('input', function() {
            // Chỉ cho phép nhập số
            let value = this.value.replace(/[^0-9]/g, '');
            
            // Giới hạn 20 ký tự
            if (value.length > 20) {
                value = value.substring(0, 20);
            }
            
            this.value = value;
            
            // Validation
            if (value.length > 0 && value.length < 8) {
                this.setCustomValidity('Số tài khoản tối thiểu 8 chữ số');
            } else {
                this.setCustomValidity('');
            }
            
            validateRefundForm();
        });
        
        // Format hiển thị khi blur
        bankAccountInput.addEventListener('blur', function() {
            const value = this.value;
            if (value.length >= 8) {
                // Format: xxxx xxxx xxxx xxxx
                const formatted = value.replace(/(\d{4})(?=\d)/g, '$1 ');
                this.setAttribute('data-formatted', formatted);
            }
        });
        
        console.log('✅ Bank account listener added');
    }
    
    // ✅ 6. Bank name select - xử lý "other" option
    const bankNameSelect = document.getElementById('bank-name');
    if (bankNameSelect) {
        bankNameSelect.addEventListener('change', function() {
            const otherBankGroup = document.getElementById('other-bank-group');
            const otherBankInput = document.getElementById('other-bank-name');
            
            if (this.value === 'other') {
                if (otherBankGroup) otherBankGroup.style.display = 'block';
                if (otherBankInput) otherBankInput.required = true;
            } else {
                if (otherBankGroup) otherBankGroup.style.display = 'none';
                if (otherBankInput) {
                    otherBankInput.required = false;
                    otherBankInput.value = '';
                }
            }
            
            validateRefundForm();
        });
        console.log('✅ Bank name listener added');
    }
    
    // ✅ 7. Other bank name input
    const otherBankInput = document.getElementById('other-bank-name');
    if (otherBankInput) {
        otherBankInput.addEventListener('input', function() {
            // Giới hạn ký tự đặc biệt
            this.value = this.value.replace(/[^a-zA-ZÀ-ỹ0-9\s]/g, '');
            
            if (this.value.length > 100) {
                this.value = this.value.substring(0, 100);
            }
            
            validateRefundForm();
        });
        console.log('✅ Other bank name listener added');
    }
    
    // ✅ 8. Account holder input - chỉ chữ cái và space
    const accountHolderInput = document.getElementById('account-holder');
    if (accountHolderInput) {
        accountHolderInput.addEventListener('input', function() {
            // Chỉ cho phép chữ cái, space, và dấu tiếng Việt
            this.value = this.value.replace(/[^a-zA-ZÀ-ỹ\s]/g, '');
            
            // Giới hạn độ dài
            if (this.value.length > 100) {
                this.value = this.value.substring(0, 100);
            }
            
            // Validation
            if (this.value.trim().length < 2) {
                this.setCustomValidity('Tên chủ tài khoản tối thiểu 2 ký tự');
            } else {
                this.setCustomValidity('');
            }
            
            validateRefundForm();
        });
        
        // Auto capitalize
        accountHolderInput.addEventListener('blur', function() {
            this.value = this.value.replace(/\b\w/g, l => l.toUpperCase());
        });
        
        console.log('✅ Account holder listener added');
    }
    
    // ✅ 9. Bank branch input (optional)
    const bankBranchInput = document.getElementById('bank-branch');
    if (bankBranchInput) {
        bankBranchInput.addEventListener('input', function() {
            if (this.value.length > 200) {
                this.value = this.value.substring(0, 200);
            }
            validateRefundForm();
        });
        console.log('✅ Bank branch listener added');
    }
    
    // ✅ 10. Confirm bank info checkbox
    const confirmBankInfo = document.getElementById('confirm-bank-info');
    if (confirmBankInfo) {
        confirmBankInfo.addEventListener('change', function() {
            console.log('Bank info confirmed:', this.checked);
            validateRefundForm();
        });
        console.log('✅ Confirm bank info listener added');
    }
    
    // ✅ 11. Agree terms checkbox
    const agreeTerms = document.getElementById('agree-terms');
    if (agreeTerms) {
        agreeTerms.addEventListener('change', function() {
            console.log('Terms agreed:', this.checked);
            validateRefundForm();
        });
        console.log('✅ Agree terms listener added');
    }
    
    // ✅ 12. Real-time validation on all inputs
    const allInputs = [
        'refund-type', 'cancel-reason-select', 'refund-amount', 'other-reason-detail',
        'bank-account', 'bank-name', 'other-bank-name', 'account-holder', 'bank-branch',
        'confirm-bank-info', 'agree-terms'
    ];
    
    allInputs.forEach(inputId => {
        const input = document.getElementById(inputId);
        if (input && !input.hasAttribute('data-listener-added')) {
            // Mark để tránh add listener nhiều lần
            input.setAttribute('data-listener-added', 'true');
            
            // Add focus/blur effects
            if (input.type !== 'checkbox') {
                input.addEventListener('focus', function() {
                    this.classList.add('focused');
                });
                
                input.addEventListener('blur', function() {
                    this.classList.remove('focused');
                });
            }
        }
    });
    
    console.log('✅ Refund form listeners setup complete');
    
    // Initial validation
    setTimeout(() => {
        validateRefundForm();
    }, 100);
}

// ✅ Remove listeners cũ để tránh duplicate
function removeRefundListeners() {
    const elements = [
        'refund-type', 'cancel-reason-select', 'refund-amount', 'other-reason-detail',
        'bank-account', 'bank-name', 'other-bank-name', 'account-holder', 'bank-branch',
        'confirm-bank-info', 'agree-terms'
    ];
    
    elements.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            // Clone element để remove tất cả listeners
            const newEl = el.cloneNode(true);
            el.parentNode.replaceChild(newEl, el);
            console.log(`🔄 Removed old listeners for ${id}`);
        }
    });
}

// ✅ Helper function - format số tài khoản khi hiển thị
function formatBankAccount(accountNumber) {
    if (!accountNumber) return '';
    
    // Remove spaces
    const clean = accountNumber.replace(/\s/g, '');
    
    // Format: xxxx xxxx xxxx xxxx
    return clean.replace(/(\d{4})(?=\d)/g, '$1 ');
}

// ✅ Helper function - validate số tài khoản
function isValidBankAccount(accountNumber) {
    if (!accountNumber) return false;
    
    const clean = accountNumber.replace(/\s/g, '');
    
    // Kiểm tra độ dài và chỉ chứa số
    return /^[0-9]{8,20}$/.test(clean);
}

// ✅ Helper function - validate tên chủ tài khoản
function isValidAccountHolder(name) {
    if (!name || name.trim().length < 2) return false;
    
    // Chỉ chứa chữ cái, space và dấu tiếng Việt
    return /^[a-zA-ZÀ-ỹ\s]{2,100}$/.test(name.trim());
}

// Remove listeners cũ
function removeRefundListeners() {
    const elements = [
        'refund-type',
        'cancel-reason-select', 
        'refund-amount',
        'other-reason-detail',
        'confirm-bank-info',
        'agree-terms'
    ];
    
    elements.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.replaceWith(el.cloneNode(true));
        }
    });
}

// ✅ ĐÓNG MODAL HOÀN TIỀN
function closeRefundModal() {
    console.log('❌ Closing refund modal');
    
    const modal = document.getElementById('vnpay-refund-modal');
    if (modal) {
        modal.style.display = 'none';
    }
    
    currentOrderForRefund = null;
}


// ✅ XỬ LÝ THAY ĐỔI LOẠI HOÀN TIỀN
function handleRefundTypeChange(type) {
    console.log('💰 Refund type changed:', type);
    
    const partialGroup = document.getElementById('partial-amount-group');
    const totalDisplay = document.getElementById('total-refund-display');
    const refundAmountInput = document.getElementById('refund-amount');
    
    if (type === 'partial') {
        if (partialGroup) partialGroup.style.display = 'block';
        if (refundAmountInput) refundAmountInput.required = true;
    } else {
        if (partialGroup) partialGroup.style.display = 'none';
        if (refundAmountInput) refundAmountInput.required = false;
        
        // Reset to full amount
        const orderTotal = currentOrderForRefund ? (currentOrderForRefund.totalAmount || currentOrderForRefund.TongTien || 0) : 0;
        if (totalDisplay) totalDisplay.textContent = formatPrice(orderTotal);
    }
    
    validateRefundForm();
}
// Xử lý nhập số tiền hoàn tiền
document.getElementById('refund-amount').addEventListener('input', function() {
  const amount = parseFloat(this.value) || 0;
  const maxAmount = currentOrderForRefund ? currentOrderForRefund.TongTien : 0;
  
  // Update display
  document.getElementById('total-refund-display').textContent = formatPrice(amount);
  
  // Validation
  if (amount > maxAmount) {
    this.setCustomValidity(`Số tiền hoàn không được vượt quá ${formatPrice(maxAmount)}`);
  } else if (amount < 1000 && amount > 0) {
    this.setCustomValidity('Số tiền hoàn tối thiểu là 1.000đ');
  } else {
    this.setCustomValidity('');
  }
  
  validateForm();
});

// ✅ XỬ LÝ THAY ĐỔI LÝ DO HỦY
function handleReasonChange(reason) {
    console.log('📝 Cancel reason changed:', reason);
    
    const otherGroup = document.getElementById('other-reason-group');
    const otherReasonDetail = document.getElementById('other-reason-detail');
    
    if (reason === 'other') {
        if (otherGroup) otherGroup.style.display = 'block';
        if (otherReasonDetail) otherReasonDetail.required = true;
    } else {
        if (otherGroup) otherGroup.style.display = 'none';
        if (otherReasonDetail) otherReasonDetail.required = false;
    }
    
    validateRefundForm();
}
// ✅ Cập nhật validateRefundForm để check thông tin ngân hàng
function validateRefundForm() {
    const confirmBtn = document.getElementById('confirm-refund-btn');
    if (!confirmBtn) {
        console.error('❌ Confirm button not found');
        return false;
    }
    
    // Lấy giá trị từ form
    const formData = {
        refundType: document.getElementById('refund-type')?.value || '',
        cancelReason: document.getElementById('cancel-reason-select')?.value || '',
        bankAccount: document.getElementById('bank-account')?.value?.trim() || '',
        bankName: document.getElementById('bank-name')?.value || '',
        accountHolder: document.getElementById('account-holder')?.value?.trim() || '',
        bankBranch: document.getElementById('bank-branch')?.value?.trim() || '',
        confirmBankInfo: document.getElementById('confirm-bank-info')?.checked || false,
        agreeTerms: document.getElementById('agree-terms')?.checked || false
    };
    
    let isValid = true;
    const errors = [];
    
    // Kiểm tra các trường bắt buộc
    if (!formData.cancelReason) {
        isValid = false;
        errors.push('Chưa chọn lý do hủy');
    }
    
    // ✅ Validate thông tin ngân hàng
    if (!formData.bankAccount) {
        isValid = false;
        errors.push('Chưa nhập số tài khoản');
    } else if (!/^[0-9]{8,20}$/.test(formData.bankAccount)) {
        isValid = false;
        errors.push('Số tài khoản không hợp lệ (8-20 chữ số)');
    }
    
    if (!formData.bankName) {
        isValid = false;
        errors.push('Chưa chọn ngân hàng');
    }
    
    if (!formData.accountHolder) {
        isValid = false;
        errors.push('Chưa nhập tên chủ tài khoản');
    } else if (formData.accountHolder.length < 2) {
        isValid = false;
        errors.push('Tên chủ tài khoản quá ngắn');
    }
    
    if (!formData.confirmBankInfo) {
        isValid = false;
        errors.push('Chưa xác nhận thông tin tài khoản');
    }
    
    if (!formData.agreeTerms) {
        isValid = false;
        errors.push('Chưa đồng ý với điều khoản');
    }
    
    // Kiểm tra số tiền hoàn một phần
    if (formData.refundType === 'partial') {
        const refundAmount = parseFloat(document.getElementById('refund-amount')?.value) || 0;
        const orderTotal = currentOrderForRefund?.TongTien || 0;
        
        if (refundAmount <= 0) {
            isValid = false;
            errors.push('Số tiền hoàn phải lớn hơn 0');
        } else if (refundAmount > orderTotal) {
            isValid = false;
            errors.push('Số tiền hoàn vượt quá tổng đơn hàng');
        } else if (refundAmount < 1000) {
            isValid = false;
            errors.push('Số tiền hoàn tối thiểu là 1.000đ');
        }
    }
    
    // Kiểm tra lý do khác
    if (formData.cancelReason === 'other') {
        const otherReason = document.getElementById('other-reason-detail')?.value?.trim() || '';
        if (!otherReason) {
            isValid = false;
            errors.push('Vui lòng nhập chi tiết lý do khác');
        }
    }
    
    // Cập nhật trạng thái button
    confirmBtn.disabled = !isValid;
    
    console.log(isValid ? '✅ Form valid' : '❌ Form invalid', {
        formData,
        errors
    });
    
    return isValid;
}

// Validate form và enable/disable button
function validateForm() {
  const form = document.getElementById('refund-form');
  const confirmBtn = document.getElementById('confirm-refund-btn');
  const refundType = document.getElementById('refund-type').value;
  const cancelReason = document.getElementById('cancel-reason').value;
  const confirmBankInfo = document.getElementById('confirm-bank-info').checked;
  const agreeTerms = document.getElementById('agree-terms').checked;
  
  let isValid = true;
  
  // Check basic required fields
  if (!cancelReason || !confirmBankInfo || !agreeTerms) {
    isValid = false;
  }
  
  // Check partial refund amount
  if (refundType === 'partial') {
    const refundAmount = parseFloat(document.getElementById('refund-amount').value) || 0;
    if (refundAmount < 1000 || refundAmount > currentOrderForRefund.TongTien) {
      isValid = false;
    }
  }
  
  // Check other reason detail
  if (cancelReason === 'other') {
    const otherDetail = document.getElementById('other-reason-detail').value.trim();
    if (!otherDetail || otherDetail.length > 500) {
      isValid = false;
    }
  }
  
  // Enable/disable confirm button
  confirmBtn.disabled = !isValid;
}

// Add event listeners for form validation
document.addEventListener('DOMContentLoaded', function() {
  const form = document.getElementById('refund-form');
  if (form) {
    // Add listeners to all form elements
    const formElements = form.querySelectorAll('input, select, textarea');
    formElements.forEach(element => {
      element.addEventListener('change', validateForm);
      element.addEventListener('input', validateForm);
    });
  }
});

// ✅ Cập nhật processRefundCancellation để refresh ngay lập tức
async function processRefundCancellation() {
    console.log('🚀 Processing refund cancellation...');
    
    if (!currentOrderForRefund) {
        showErrorToast('Không tìm thấy thông tin đơn hàng');
        return;
    }
    
    // Validate form trước khi xử lý
    if (!validateRefundForm()) {
        showErrorToast('Vui lòng điền đầy đủ thông tin bắt buộc');
        return;
    }
    
    const orderId = currentOrderForRefund.id || currentOrderForRefund.MaHD;
    const customerId = getCustomerId();
    const orderTotal = currentOrderForRefund.totalAmount || currentOrderForRefund.TongTien || 0;
    
    const refundType = document.getElementById('refund-type')?.value || 'full';
    const cancelReasonValue = document.getElementById('cancel-reason-select')?.value || '';
    const otherReasonDetail = document.getElementById('other-reason-detail')?.value?.trim() || '';
    
    const bankAccount = document.getElementById('bank-account')?.value?.trim() || '';
    const bankName = document.getElementById('bank-name')?.value || '';
    const accountHolder = document.getElementById('account-holder')?.value?.trim() || '';
    const bankBranch = document.getElementById('bank-branch')?.value?.trim() || '';
    
    const finalBankName = bankName === 'other' 
        ? document.getElementById('other-bank-name')?.value?.trim() || ''
        : bankName;
    
    const refundAmount = refundType === 'full' 
        ? orderTotal 
        : parseFloat(document.getElementById('refund-amount')?.value) || orderTotal;
    
    let reasonText = getCancelReasonText(cancelReasonValue);
    if (cancelReasonValue === 'other' && otherReasonDetail) {
        reasonText += `: ${otherReasonDetail}`;
    }
    
    try {
        // Show loading state
        const confirmBtn = document.getElementById('confirm-refund-btn');
        if (confirmBtn) {
            confirmBtn.disabled = true;
            confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang xử lý...';
        }
        
        const response = await fetch(`http://localhost:5000/api/orders/customer-orders/cancel/${orderId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getToken()}`
            },
            body: JSON.stringify({
                customerId: customerId,
                reason: reasonText,
                refundAmount: refundAmount,
                refundType: refundType,
                bankAccount: bankAccount,
                bankName: finalBankName,
                accountHolder: accountHolder,
                bankBranch: bankBranch || null
            })
        });
        
        const result = await response.json();
        console.log('📡 API Response:', result);
        
        if (result.success) {
            // ✅ REFRESH NGAY LẬP TỨC TRƯỚC KHI HIỂN THI SUCCESS
            console.log('🔄 Refreshing orders list immediately...');
            
            // Close modals
            closeRefundModal();
            closeOrderDetailModal();
            
            // Refresh orders list TRƯỚC
            await renderOrders(customerId);
            
            // Show success modal SAU (với delay để user thấy được sự thay đổi)
            setTimeout(() => {
                showVNPayCancelSuccessModal(result.data);
            }, 500);
            
        } else {
            throw new Error(result.error || 'Không thể xử lý hoàn tiền');
        }
        
    } catch (error) {
        console.error('💥 Refund error:', error);
        showErrorToast(error.message || 'Có lỗi xảy ra khi xử lý hoàn tiền');
    } finally {
        // Reset button state
        const confirmBtn = document.getElementById('confirm-refund-btn');
        if (confirmBtn) {
            confirmBtn.disabled = false;
            confirmBtn.innerHTML = '<i class="fas fa-check"></i> Xác nhận hủy đơn & hoàn tiền';
        }
    }
}

// Helper function (giữ nguyên)
function getCancelReasonText(reason) {
    const reasons = {
        'changed-mind': 'Thay đổi ý định mua hàng',
        'found-better-price': 'Tìm được giá tốt hơn ở nơi khác',
        'delivery-too-long': 'Thời gian giao hàng quá lâu',
        'wrong-product': 'Đặt nhầm sản phẩm',
        'financial-issue': 'Vấn đề tài chính',
        'other': 'Lý do khác'
    };
    return reasons[reason] || reason;
}

function showRefundSuccessModal(data) {
  // Tương tự như code modal success đã viết trước đó
  showVNPayCancelSuccessModal(data);
}

function showRefundPolicy() {
  // Hiển thị modal chính sách hoàn tiền
  alert('Chính sách hoàn tiền sẽ được hiển thị ở đây');
}

// ...existing code... (giữ nguyên tất cả code từ đầu đến trước phần "THÊM VÀO CUỐI FILE")

// ✅ XỬ LÝ HỦY ĐƠN HÀNG COD - VERSION FIXED
// Override các function cũ để tránh conflict

// ✅ FUNCTION CHÍNH: Hiển thị modal hủy COD
function showCancelOrderModalCOD(orderId, orderStatus, paymentMethod, paymentStatus) {
  console.log('🔍 COD Cancel modal:', { orderId, orderStatus, paymentMethod, paymentStatus });
  
  if (!['Chờ xử lý', 'Đã xác nhận', 'pending', 'processing'].includes(orderStatus)) {
    showErrorToast('Không thể hủy đơn hàng ở trạng thái hiện tại!');
    return;
  }

  const modal = document.getElementById('cancel-order-modal');
  if (!modal) {
    console.error('❌ Cancel modal not found');
    return;
  }

  // Hiển thị modal
  modal.style.display = 'block';
  
  // Reset form
  const reasonInput = document.getElementById('cancel-reason');
  if (reasonInput) reasonInput.value = '';
  
  // ✅ GẮN EVENT LISTENER TRỰC TIẾP - KHÔNG DÙNG ONCLICK
  attachCODCancelEvents(orderId, paymentMethod, paymentStatus);
}

// ✅ GẮN SỰ KIỆN HỦY ĐƠN COD
function attachCODCancelEvents(orderId, paymentMethod, paymentStatus) {
  console.log('🔗 Attaching COD cancel events for order:', orderId);
  
  // Lấy các button
  const confirmBtn = document.getElementById('confirm-cancel-btn');
  const cancelBtn = document.getElementById('cancel-cancel-btn');
  const closeBtn = document.querySelector('.close-modal-cancel');
  
  if (!confirmBtn) {
    console.error('❌ Confirm button not found');
    return;
  }
  
  // ✅ XÓA TẤT CẢ EVENT LISTENER CŨ
  const newConfirmBtn = confirmBtn.cloneNode(true);
  confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
  
  const newCancelBtn = cancelBtn ? cancelBtn.cloneNode(true) : null;
  if (cancelBtn && newCancelBtn) {
    cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
  }
  
  const newCloseBtn = closeBtn ? closeBtn.cloneNode(true) : null;
  if (closeBtn && newCloseBtn) {
    closeBtn.parentNode.replaceChild(newCloseBtn, closeBtn);
  }
  
  // ✅ THÊM EVENT LISTENER MỚI CHO XÁC NHẬN
  document.getElementById('confirm-cancel-btn').addEventListener('click', async function(e) {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('🚀 COD Cancel confirmed for order:', orderId);
    await processCODCancellation(orderId, paymentMethod, paymentStatus);
  });
  
  // ✅ THÊM EVENT LISTENER CHO HỦY BỎ
  if (document.getElementById('cancel-cancel-btn')) {
    document.getElementById('cancel-cancel-btn').addEventListener('click', function(e) {
      e.preventDefault();
      closeCODCancelModal();
    });
  }
  
  if (document.querySelector('.close-modal-cancel')) {
    document.querySelector('.close-modal-cancel').addEventListener('click', function(e) {
      e.preventDefault();
      closeCODCancelModal();
    });
  }
  
  console.log('✅ COD cancel events attached successfully');
}

// ✅ XỬ LÝ HỦY ĐƠN COD
async function processCODCancellation(orderId, paymentMethod, paymentStatus) {
  console.log('🚀 Processing COD cancellation:', { orderId, paymentMethod, paymentStatus });
  
  const reason = document.getElementById('cancel-reason')?.value?.trim() || 'Khách hàng hủy đơn hàng';
  
  const cancelData = {
    customerId: getCustomerId(),
    reason: reason,
    refundType: 'full'
  };

  console.log('🔍 Cancel data:', cancelData);

  // ✅ DISABLE BUTTON
  const confirmBtn = document.getElementById('confirm-cancel-btn');
  if (confirmBtn) {
    confirmBtn.disabled = true;
    confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang xử lý...';
  }

  try {
    const response = await fetch(`http://localhost:5000/api/orders/customer-orders/cancel/${orderId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${getToken()}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(cancelData)
    });

    console.log('🔍 API Response status:', response.status);
    const result = await response.json();
    console.log('🔍 API Response data:', result);

    if (response.ok && result.success) {
      // ✅ SUCCESS
      closeCODCancelModal();
      showErrorToast('✅ Hủy đơn hàng COD thành công!');
      
      // Close order detail modal
      closeOrderDetailModal();
      
      // Reload orders
      const customerId = getCustomerId();
      if (customerId) {
        await renderOrders(customerId, document.getElementById('status-filter')?.value || 'all');
      }
    } else {
      throw new Error(result.error || 'Không thể hủy đơn hàng');
    }

  } catch (error) {
    console.error('❌ COD cancel error:', error);
    showErrorToast(`❌ Lỗi hủy đơn hàng: ${error.message}`);
  } finally {
    // ✅ RE-ENABLE BUTTON
    if (confirmBtn) {
      confirmBtn.disabled = false;
      confirmBtn.innerHTML = 'Xác nhận';
    }
  }
}

// ✅ ĐÓNG MODAL HỦY COD
function closeCODCancelModal() {
  const modal = document.getElementById('cancel-order-modal');
  if (modal) {
    modal.style.display = 'none';
    
    // Reset form
    const reasonInput = document.getElementById('cancel-reason');
    if (reasonInput) reasonInput.value = '';
  }
}

// ✅ CẬP NHẬT HÀM showCancelModal CHÍNH
function showCancelModal() {
    console.log('🔥 showCancelModal called');
    console.log('Current order data:', currentOrderData);
    
    if (!currentOrderData) {
        showErrorToast('Không tìm thấy thông tin đơn hàng');
        return;
    }
    
    console.log('Payment method:', currentOrderData.paymentMethod);
    console.log('Payment status:', currentOrderData.paymentStatus);
    
    if (currentOrderData.paymentMethod === 'VNPAY' && currentOrderData.paymentStatus === 'Đã thanh toán') {
        // ✅ VNPay đã thanh toán -> Hiển thị form hoàn tiền
        console.log('✅ Showing VNPay refund modal');
        showVNPayRefundModal(currentOrderData);
    } else {
        // ✅ COD hoặc chưa thanh toán -> Hiển thị modal hủy COD
        console.log('✅ Showing COD cancel modal');
        const orderId = currentOrderData.id || currentOrderData.MaHD;
        const orderStatus = currentOrderData.status || currentOrderData.tinhtrang || 'pending';
        showCancelOrderModalCOD(orderId, orderStatus, currentOrderData.paymentMethod, currentOrderData.paymentStatus);
    }
}

// ✅ Export functions to global scope
window.showCancelOrderModalCOD = showCancelOrderModalCOD;
window.processCODCancellation = processCODCancellation;
window.closeCODCancelModal = closeCODCancelModal;
window.attachCODCancelEvents = attachCODCancelEvents;

console.log('✅ COD Cancel system loaded successfully');

// ✅ XÓA CÁC FUNCTION TRÙNG LẶP (nếu có)
// Đảm bảo không có conflict
if (window.showCancelOrderModal) {
    delete window.showCancelOrderModal;
}
if (window.confirmCancelOrderCOD) {
    delete window.confirmCancelOrderCOD;
}
if (window.closeCancelModal) {
    delete window.closeCancelModal;
}