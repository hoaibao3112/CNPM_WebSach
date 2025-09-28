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

// Lấy danh sách đơn hàng từ API
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

        // Ánh xạ trạng thái
        const statusMapping = {
            'Chờ xử lý': 'pending',
            'Đã xác nhận': 'processing',
            'Đang giao hàng': 'shipping',
            'Đã giao hàng': 'completed',
            'Đã hủy': 'cancelled'
        };

        orders = orders.map(order => ({
            ...order,
            status: statusMapping[order.status] || 'pending'
        }));

        // Lọc theo trạng thái
        if (statusFilter !== 'all') {
            orders = orders.filter(order => order.status === statusFilter);
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

// Hiển thị danh sách đơn hàng
async function renderOrders(customerId, statusFilter = 'all') {
    const orderListElement = document.getElementById('order-list');
    const loadingModal = document.getElementById('loading-modal');

    // Hiển thị loading
    if (loadingModal) loadingModal.style.display = 'block';
    if (orderListElement) orderListElement.innerHTML = '';

    try {
        const orders = await fetchOrders(customerId, statusFilter);

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

        const statusDisplay = {
            'pending': { class: 'status-pending', text: 'Chờ xác nhận' },
            'processing': { class: 'status-processing', text: 'Đã xác nhận' },
            'shipping': { class: 'status-shipping', text: 'Đang giao hàng' },
            'completed': { class: 'status-completed', text: 'Đã hoàn thành' },
            'cancelled': { class: 'status-cancelled', text: 'Đã hủy' }
        };

        orderListElement.innerHTML = orders.map(order => `
            <div class="order-card" data-order-id="${order.id}">
                <div class="order-card-header">
                    <div>
                        <span class="order-id">Đơn hàng #${order.id}</span>
                        <span class="order-date">${formatDateTime(order.createdAt)}</span>
                    </div>
                    <span class="order-status ${statusDisplay[order.status].class}">
                        ${statusDisplay[order.status].text}
                    </span>
                </div>
                <div class="order-summary">
                    <span class="order-total">${formatPrice(order.totalAmount)}</span>
                </div>
            </div>
        `).join('');

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

// Thay thế hàm showOrderDetail hiện tại (từ dòng 186) bằng:
async function showOrderDetail(order) {
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

    // Hiển thị nút hủy
    const cancelBtn = document.getElementById('cancel-order-btn');
    if (cancelBtn) {
        cancelBtn.style.display = order.status === 'pending' ? 'inline-flex' : 'none';
        cancelBtn.onclick = () => cancelOrder();
    } else {
        console.warn('Cancel button not found');
    }

    // Hiển thị bản đồ giao hàng
    displayDeliveryMap(order);

    modal.style.display = 'block';
}
// Hàm hiển thị modal hủy đơn hàng (Thêm mới)
function showCancelModal() {
    const modal = document.getElementById('cancel-order-modal');
    if (modal) {
        modal.style.display = 'block';
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

// Hủy đơn hàng (Cập nhật để sử dụng modal tùy chỉnh)
async function cancelOrder() {
    if (!checkAuth()) return;

    showCancelModal();

    const confirmCancelBtn = document.getElementById('confirm-cancel-btn');
    const cancelCancelBtn = document.getElementById('cancel-cancel-btn');
    const closeModalBtn = document.querySelector('.close-modal-cancel');

    if (confirmCancelBtn && cancelCancelBtn && closeModalBtn) {
        confirmCancelBtn.onclick = async () => {
            const orderId = localStorage.getItem('currentOrderId');
            const customerId = getCustomerId();
            const token = getToken();
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
                        'Authorization': `Bearer ${token}`
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

                showErrorToast('Hủy đơn hàng thành công!');
                localStorage.removeItem('currentOrderId');
                hideCancelModal();
                document.getElementById('order-detail-modal').style.display = 'none';
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
                window.removeEventListener('click', handler); // Xóa listener sau khi sử dụng
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