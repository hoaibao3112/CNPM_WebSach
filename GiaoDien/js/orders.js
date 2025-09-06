document.addEventListener('DOMContentLoaded', initializeApp);

// Hàm khởi tạo ứng dụng
function initializeApp() {
    const user = getUserInfo();
    if (!user) return;

    // Hiển thị tên khách hàng
    updateCustomerName(user.tenkh);

    // Khởi tạo hệ thống chat
    initializeChatSystem();

    // Load danh sách đơn hàng
    renderOrders(user.makh);

    // Gắn các sự kiện
    attachEventListeners();

    // Không cần tải Google Maps API nữa
    initMap(); // Khởi tạo bản đồ ngay lập tức với Leaflet
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

// Hiển thị chi tiết đơn hàng
function showOrderDetail(order) {
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

    // Sửa lỗi: Sử dụng order.status thay vì order.tinhtrang
    const status = statusDisplay[order.status] || statusDisplay['pending'];
    document.getElementById('order-status').textContent = status.text;

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
    document.getElementById('shipping-address').textContent = 
        `${order.shippingAddress || ''}, ${order.ward || ''}, ${order.district || ''}, ${order.province || ''}`;
    document.getElementById('order-notes').textContent = order.notes || 'Không có ghi chú';

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

// ========== Hệ thống Chat ==========
let chatSocket = null;
let currentChatRoom = null;
let unreadMessages = 0;

// Khởi tạo hệ thống chat
function initializeChatSystem() {
    const chatBtn = document.getElementById('chat-floating-btn');
    const chatPopup = document.getElementById('chat-popup');
    const closeBtn = document.getElementById('close-chat-btn');
    const sendBtn = document.getElementById('send-chat-message-btn');
    const chatInput = document.getElementById('chat-message-input');

    if (!chatBtn || !chatPopup || !closeBtn || !sendBtn || !chatInput) {
        console.error('Chat elements not found');
        return;
    }

    // Mở/đóng popup chat
    chatBtn.addEventListener('click', () => {
        chatPopup.classList.toggle('show');
        if (chatPopup.classList.contains('show')) {
            unreadMessages = 0;
            updateUnreadCount();
            if (currentChatRoom) loadChatHistory();
        }
    });

    closeBtn.addEventListener('click', () => {
        chatPopup.classList.remove('show');
    });

    // Gửi tin nhắn
    sendBtn.addEventListener('click', sendMessage);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });
}

// Gửi tin nhắn
async function sendMessage() {
    const chatInput = document.getElementById('chat-message-input');
    const message = chatInput.value.trim();
    if (!message) return;

    if (!currentChatRoom) {
        currentChatRoom = await createChatRoom();
        if (!currentChatRoom) return;
    }

    const msg = {
        message_id: Date.now(),
        message,
        sender_type: 'customer',
        created_at: new Date().toISOString()
    };

    displayMessage(msg);
    sendMessageToServer(msg.message);
    chatInput.value = '';
}

// Gửi tin nhắn qua WebSocket
function sendMessageToServer(message) {
    console.log('Trạng thái WebSocket:', chatSocket ? chatSocket.readyState : 'chatSocket không tồn tại');
    if (chatSocket && chatSocket.readyState === WebSocket.OPEN) {
        chatSocket.send(JSON.stringify({
            action: 'send_message',
            message: {
                room_id: currentChatRoom.room_id,
                sender_id: getCustomerId(),
                sender_type: 'customer',
                message: message,
            }
        }));
    } else {
        console.error('WebSocket not connected');
        showErrorToast('Không thể gửi tin nhắn: WebSocket chưa kết nối');
        if (currentChatRoom) {
            console.log('Thử kết nối lại WebSocket...');
            connectWebSocket(currentChatRoom.room_id);
        }
    }
}

// Hiển thị tin nhắn
function displayMessage(msg) {
    const chatBody = document.getElementById('chat-messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message message-${msg.sender_type === 'customer' ? 'sent' : 'received'}`;
    messageDiv.innerHTML = `
        <div class="message-content">${msg.message}</div>
        <div class="message-time">${formatDateTime(msg.created_at)}</div>
    `;
    chatBody.appendChild(messageDiv);
    chatBody.scrollTop = chatBody.scrollHeight;
}

async function createChatRoom() {
    if (!checkAuth()) return null;
    try {
        const response = await fetch('http://localhost:5000/api/chat/rooms', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getToken()}`
            },
            body: JSON.stringify({ customer_id: getCustomerId() })
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Không thể tạo phòng chat: ${errorText}`);
        }
        const room = await response.json();
        console.log('Created Room:', room); // Kiểm tra room_id
        connectWebSocket(room.room_id);
        return room;
    } catch (error) {
        console.error('Lỗi tạo phòng chat:', error);
        showErrorToast('Không thể tạo phòng chat');
        return null;
    }
}

// Kết nối WebSocket
function connectWebSocket(roomId) {
    if (chatSocket) chatSocket.close();

    const token = getToken();
    if (!token || token === 'null') {
        console.error('Không tìm thấy token hợp lệ, chuyển hướng đến trang đăng nhập');
        redirectToLogin();
        return;
    }

    console.log('Kết nối WebSocket với token:', token); // Debug token
    chatSocket = new WebSocket(`ws://localhost:5001/chat?room_id=${roomId}&token=${token}`);

    chatSocket.onopen = () => console.log('WebSocket đã kết nối');
    chatSocket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.action === 'new_message') {
            handleNewMessage(data.message);
        } else if (data.action === 'chat_history') {
            displayChatHistory(data.messages);
        } else if (data.action === 'error') {
            showErrorToast(data.message);
        }
    };
    chatSocket.onclose = () => console.log('WebSocket đã ngắt kết nối');
    chatSocket.onerror = (error) => {
        console.error('Lỗi WebSocket:', error);
        showErrorToast('Lỗi kết nối chat');
    };
}

// Xử lý tin nhắn mới
function handleNewMessage(message) {
    const chatPopup = document.getElementById('chat-popup');
    if (chatPopup.classList.contains('show')) {
        displayMessage(message);
    } else {
        unreadMessages++;
        updateUnreadCount();
        console.log('New message:', message);
    }
}

// Cập nhật số tin nhắn chưa đọc
function updateUnreadCount() {
    // Ghi chú: HTML không có phần tử unread-count, nên hàm này tạm thời không hoạt động
    // Nếu cần hiển thị số tin nhắn chưa đọc, bạn cần thêm phần tử vào HTML
    console.log('Unread messages:', unreadMessages);
}

// Tải lịch sử chat
async function loadChatHistory() {
    if (!currentChatRoom || !checkAuth()) return;

    try {
        const response = await fetch(`http://localhost:5000/api/chat/rooms/${currentChatRoom.room_id}/messages`, {
            headers: {
                'Authorization': `Bearer ${getToken()}`
            }
        });

        if (!response.ok) throw new Error('Không thể tải lịch sử chat');

        const messages = await response.json();
        displayChatHistory(messages);
    } catch (error) {
        console.error('Lỗi tải lịch sử chat:', error);
        showErrorToast('Không thể tải lịch sử chat');
    }
}

async function sendMessageToServer(message) {
    if (!chatSocket || chatSocket.readyState !== WebSocket.OPEN) {
        console.log('WebSocket chưa kết nối, thử kết nối...');
        if (currentChatRoom) {
            await new Promise((resolve) => {
                connectWebSocket(currentChatRoom.room_id);
                chatSocket.onopen = () => {
                    console.log('WebSocket đã kết nối');
                    resolve();
                };
                chatSocket.onerror = (error) => {
                    console.error('Lỗi kết nối WebSocket:', error);
                    resolve(); // Thoát dù lỗi
                };
            });
        } else {
            console.error('Không có phòng chat');
            showErrorToast('Không thể gửi tin nhắn: Không có phòng chat');
            return;
        }
    }
    if (chatSocket.readyState === WebSocket.OPEN) {
        chatSocket.send(JSON.stringify({
            action: 'send_message',
            message: {
                room_id: currentChatRoom.room_id,
                sender_id: getCustomerId(),
                sender_type: 'customer',
                message: message,
            }
        }));
    } else {
        console.error('WebSocket vẫn chưa kết nối');
        showErrorToast('Không thể gửi tin nhắn: WebSocket chưa kết nối');
    }
}

function connectWebSocket(roomId, retryCount = 3) {
    if (chatSocket) chatSocket.close();
    const token = getToken();
    if (!token || token === 'null') {
        console.error('Không tìm thấy token hợp lệ');
        redirectToLogin();
        return;
    }
    chatSocket = new WebSocket(`ws://localhost:5001/chat?room_id=${roomId}&token=${token}`);
    chatSocket.onopen = () => console.log('WebSocket đã kết nối');
    chatSocket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.action === 'new_message') handleNewMessage(data.message);
        else if (data.action === 'chat_history') displayChatHistory(data.messages);
        else if (data.action === 'error') showErrorToast(data.message);
    };
    chatSocket.onclose = () => {
        console.log('WebSocket đã ngắt kết nối');
        if (retryCount > 0) {
            console.log(`Thử kết nối lại... (${retryCount} lần còn lại)`);
            setTimeout(() => connectWebSocket(roomId, retryCount - 1), 2000);
        }
    };
    chatSocket.onerror = (error) => {
        console.error('Lỗi WebSocket:', error);
        showErrorToast('Lỗi kết nối chat');
    };
}

// Hiển thị lịch sử chat
function displayChatHistory(messages) {
    const chatBody = document.getElementById('chat-messages');
    chatBody.innerHTML = messages.length === 0
        ? '<div class="welcome-message"><p>Bắt đầu trò chuyện với hỗ trợ viên</p></div>'
        : messages.map(msg => `
            <div class="chat-message message-${msg.sender_type === 'customer' ? 'sent' : 'received'}">
                <div class="message-content">${msg.message}</div>
                <div class="message-time">${formatDateTime(msg.created_at)}</div>
            </div>
        `).join('');
    chatBody.scrollTop = chatBody.scrollHeight;
}

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

// Hiển thị bản đồ giao hàng
async function displayDeliveryMap(order) {
    const mapElement = document.getElementById('delivery-map');
    const distanceInfoElement = document.getElementById('distance-info');
    const durationInfoElement = document.getElementById('duration-info');
    if (!mapElement) {
        console.error('Map element not found');
        distanceInfoElement.textContent = 'Không thể hiển thị thông tin';
        durationInfoElement.textContent = 'Không thể hiển thị thông tin';
        return;
    }

    // Đảm bảo bản đồ được khởi tạo
    if (!map) {
        initMap();
    }

    // Địa chỉ giao hàng (destination)
    const destinationAddress = `${order.shippingAddress || ''}, ${order.ward || ''}, ${order.district || ''}, ${order.province || ''}`;
    const warehouseLocation = [10.7769, 106.7009]; // Tọa độ kho (TP.HCM)

    // Geocoding địa chỉ giao hàng với Nominatim
    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(destinationAddress)}&format=json&limit=1`);
        const data = await response.json();
        if (data.length === 0) {
            console.error('Không tìm thấy tọa độ cho địa chỉ:', destinationAddress);
            distanceInfoElement.textContent = 'Không thể tìm địa chỉ';
            durationInfoElement.textContent = 'Không thể tìm địa chỉ';
            return;
        }

        const destinationLocation = [parseFloat(data[0].lat), parseFloat(data[0].lon)];

        // Xóa các layer cũ (polyline, marker) nếu có
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
            const distance = (routeData.routes[0].distance / 1000).toFixed(2); // Chuyển từ mét sang km
            const duration = Math.round(routeData.routes[0].duration / 60); // Chuyển từ giây sang phút
            distanceInfoElement.textContent = `${distance} km`;
            durationInfoElement.textContent = `${duration} phút`;
        } else {
            console.error('Lỗi tính tuyến đường:', routeData.message);
            distanceInfoElement.textContent = 'Không thể tính khoảng cách';
            durationInfoElement.textContent = 'Không thể tính thời gian';
        }

        // Điều chỉnh bản đồ để hiển thị cả kho và địa chỉ giao hàng
        map.fitBounds([warehouseLocation, destinationLocation]);
    } catch (error) {
        console.error('Lỗi khi hiển thị bản đồ:', error);
        distanceInfoElement.textContent = 'Không thể hiển thị thông tin';
        durationInfoElement.textContent = 'Không thể hiển thị thông tin';
    }
}