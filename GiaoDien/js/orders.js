document.addEventListener('DOMContentLoaded', initializeApp);
const addressCache = {
    provinces: new Map(),
    districts: new Map(),
    wards: new Map()
};
// Thêm sau dòng khai báo addressCache (sau dòng 6)

// Lấy tên tỉnh/thành phố từ mã - SỬ DỤNG BACKEND PROXY
async function getProvinceName(provinceCode) {
    if (!provinceCode) return '';
    
    // Kiểm tra cache trước
    if (addressCache.provinces.has(provinceCode)) {
        return addressCache.provinces.get(provinceCode);
    }

    try {
        const _apiBase = (window.API_CONFIG && window.API_CONFIG.BASE_URL) || window.API_CONFIG.BASE_URL;
        const response = await fetch(`${_apiBase}/api/orders/resolve/province/${provinceCode}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const responseData = await response.json();
        const data = responseData.data || responseData;
        const provinceName = data.name || data || provinceCode;
        
        // Lưu vào cache
        addressCache.provinces.set(provinceCode.toString(), provinceName);
        return provinceName;
    } catch (error) {
        console.error('Error fetching province:', error);
        return provinceCode;
    }
}

// Delivery vehicle animation helpers
let deliveryVehicleMarker = null;
let deliveryVehicleAnim = null;

function startDeliveryVehicle(latlngs, speedKmH = 25) {
        stopDeliveryVehicle();
        if (!latlngs || latlngs.length < 2 || !map) return;

        const iconHtml = `
            <div class="car-icon vehicle-marker">
                <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 44 L52 44 L58 36 L54 26 L10 26 L6 36 Z" fill="#007bff" stroke="#004a99" stroke-width="1"/>
                    <circle cx="20" cy="48" r="4" fill="#222"/>
                    <circle cx="44" cy="48" r="4" fill="#222"/>
                </svg>
            </div>`;

        const carIcon = L.divIcon({ html: iconHtml, className: '', iconSize: [36, 36], iconAnchor: [18, 18] });
        deliveryVehicleMarker = L.marker([latlngs[0].lat, latlngs[0].lon], { icon: carIcon, interactive: false }).addTo(map);

        const speedMps = (speedKmH * 1000) / 3600; // meters per second
        let i = 0;
        let t = 0;

        function step() {
                if (!deliveryVehicleMarker) return;
                const a = latlngs[i];
                const b = latlngs[(i + 1) % latlngs.length];
                const dist = haversineDistance(a, b) * 1000; // meters
                const duration = Math.max(dist / speedMps, 0.001);
                t += 0.016 / duration;
                if (t >= 1) { t = 0; i = (i + 1) % latlngs.length; }
                const lat = a.lat + (b.lat - a.lat) * t;
                const lon = a.lon + (b.lon - a.lon) * t;
                deliveryVehicleMarker.setLatLng([lat, lon]);
                deliveryVehicleAnim = requestAnimationFrame(step);
        }

        deliveryVehicleAnim = requestAnimationFrame(step);
}

function stopDeliveryVehicle() {
        try { if (deliveryVehicleAnim) cancelAnimationFrame(deliveryVehicleAnim); } catch (e) {}
        deliveryVehicleAnim = null;
        if (deliveryVehicleMarker) { try { map.removeLayer(deliveryVehicleMarker); } catch (e) {} deliveryVehicleMarker = null; }
}

function haversineDistance(a, b) {
        const R = 6371; // km
        const dLat = (b.lat - a.lat) * Math.PI / 180;
        const dLon = (b.lon - a.lon) * Math.PI / 180;
        const lat1 = a.lat * Math.PI / 180;
        const lat2 = b.lat * Math.PI / 180;
        const sinDLat = Math.sin(dLat / 2);
        const sinDLon = Math.sin(dLon / 2);
        const aa = sinDLat * sinDLat + sinDLon * sinDLon * Math.cos(lat1) * Math.cos(lat2);
        const c = 2 * Math.atan2(Math.sqrt(aa), Math.sqrt(1 - aa));
        return R * c;
}

// Lấy tên quận/huyện từ mã - SỬ DỤNG BACKEND PROXY
async function getDistrictName(districtCode, provinceCode) {
    if (!districtCode) return '';
    
    // Kiểm tra cache trước
    if (addressCache.districts.has(districtCode)) {
        return addressCache.districts.get(districtCode);
    }

    try {
        const _apiBase = (window.API_CONFIG && window.API_CONFIG.BASE_URL) || window.API_CONFIG.BASE_URL;
        const response = await fetch(`${_apiBase}/api/orders/resolve/district/${districtCode}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const responseData = await response.json();
        const data = responseData.data || responseData;
        const districtName = data.name || data || districtCode;
        
        // Lưu vào cache
        addressCache.districts.set(districtCode.toString(), districtName);
        return districtName;
    } catch (error) {
        console.error('Error fetching district:', error);
        return districtCode;
    }
}

// Lấy tên phường/xã từ mã - SỬ DỤNG BACKEND PROXY
async function getWardName(wardCode, districtCode) {
    if (!wardCode) return '';
    
    // Nếu wardCode đã là tên (có chứa "Phường", "Xã", "Thị trấn"), trả về luôn
    if (typeof wardCode === 'string' && (
        wardCode.includes('Phường') || 
        wardCode.includes('Xã') || 
        wardCode.includes('Thị trấn')
    )) {
        return wardCode;
    }
    
    // Kiểm tra cache trước
    if (addressCache.wards.has(wardCode)) {
        return addressCache.wards.get(wardCode);
    }

    try {
        const _apiBase = (window.API_CONFIG && window.API_CONFIG.BASE_URL) || window.API_CONFIG.BASE_URL;
        const response = await fetch(`${_apiBase}/api/orders/resolve/ward/${wardCode}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const responseData = await response.json();
        const data = responseData.data || responseData;
        const wardName = data.name || data || wardCode;
        
        // Lưu vào cache
        addressCache.wards.set(wardCode.toString(), wardName);
        return wardName;
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
    return (document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1] || null);
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
        const _apiBase = (window.API_CONFIG && window.API_CONFIG.BASE_URL) || window.API_CONFIG.BASE_URL;
        const response = await fetch(`${_apiBase}/api/orders/customer-orders/${customerId}`, {
            headers: {
                'Authorization': `Bearer ${getToken()}`
            }
        });

        if (!response.ok) {
            throw new Error('Không thể lấy danh sách đơn hàng');
        }

        const responseData = await response.json();
        let orders = responseData.data || responseData;
        
        console.log('📋 Raw orders from API:', Array.isArray(orders) ? orders.map(o => ({
            id: o.id,
            tinhtrang: o.tinhtrang,
            status: o.status
        })) : orders);

        // ✅ KHÔNG MAP LẠI STATUS NỮA - SỬ DỤNG TRỰC TIẾP tinhtrang
        // Chỉ lọc theo statusFilter nếu cần
        if (statusFilter !== 'all') {
            const statusMapping = {
                // treat both legacy 'Chờ xử lý' and new 'Chờ xác nhận' as pending
                'pending': ['Chờ xử lý', 'Chờ xác nhận'],
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
        const _apiBase = (window.API_CONFIG && window.API_CONFIG.BASE_URL) || window.API_CONFIG.BASE_URL;
        const response = await fetch(`${_apiBase}/api/orders/customer-orders/detail/${orderId}`, {
            headers: {
                'Authorization': `Bearer ${getToken()}`
            }
        });

        if (!response.ok) {
            throw new Error('Không thể lấy chi tiết đơn hàng');
        }

        const responseData = await response.json();
        const data = responseData.data || responseData;
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
        data.status = statusMapping[data.tinhtrang || data.status] || 'pending';

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

        // ✅ SẮP XẾP THEO MÃ ĐƠN HÀNG GIẢM DẦN (mã lớn nhất hiện trên đầu)
        orders.sort((a, b) => {
            const idA = parseInt(a.id) || 0;
            const idB = parseInt(b.id) || 0;
            return idB - idA; // Mã lớn hơn (đơn mới hơn) hiện trước
        });

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

            // Normalize to a lowercase string to perform flexible checks
            const statusLower = (String(statusKey) || '').toLowerCase();
            const isCompleted = statusLower.includes('hoàn thành') || statusLower.includes('hoan thanh') || statusLower.includes('đã giao') || statusLower.includes('giao hàng') || statusLower.includes('delivered') || statusLower.includes('completed');

            console.log('Order status mapping:', {
                orderId: order.id,
                tinhtrang: order.tinhtrang,
                status: order.status,
                finalStatus: status,
                isCompleted
            });

            // Only render one Mua lại button (in the header) when order is completed
            const reorderBtnHtml = isCompleted ? `
                <button class="btn reorder-btn" data-order-id="${order.id}" aria-label="Mua lại đơn hàng ${order.id}" style="background:#17a2b8; color:white; padding:8px 12px; font-size:13px; border-radius:8px;">
                    <i class="fas fa-redo" style="margin-right:6px"></i> Mua lại
                </button>
            ` : '';

            return `
                <div class="bg-white rounded-[32px] border border-border p-8 hover:shadow-xl hover:-translate-y-1 transition-all duration-500 cursor-pointer group order-card" data-order-id="${order.id}">
                    <div class="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 pb-8 border-b border-dashed border-border">
                        <div class="space-y-1">
                            <div class="flex items-center gap-3">
                                <span class="text-xs font-black text-primary uppercase tracking-[0.2em]">Đơn hàng</span>
                                <span class="text-lg font-black text-text">#${order.id}</span>
                            </div>
                            <p class="text-[10px] font-bold text-text-light uppercase tracking-widest">${formatDateTime(order.createdAt)}</p>
                        </div>
                        <div class="flex items-center gap-4">
                            <span class="order-status-badge ${status.class}">
                                ${status.text}
                            </span>
                            ${reorderBtnHtml}
                        </div>
                    </div>
                    <div class="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div class="flex flex-wrap gap-8">
                            <div class="space-y-1">
                                <p class="text-[9px] font-black text-text-light uppercase tracking-widest">Thanh toán</p>
                                <p class="text-sm font-bold text-text">${getPaymentMethodName(order.paymentMethod)}</p>
                            </div>
                            <div class="space-y-1">
                                <p class="text-[9px] font-black text-text-light uppercase tracking-widest">Trạng thái</p>
                                <p class="text-xs font-black uppercase text-primary">${order.paymentStatus || 'Chờ thanh toán'}</p>
                            </div>
                        </div>
                        <div class="flex flex-col items-end gap-4">
                            <div class="text-right">
                                <p class="text-[9px] font-black text-text-light uppercase tracking-widest mb-1">Tổng cộng</p>
                                <p class="text-2xl font-black text-text tracking-tighter">${formatPrice(order.totalAmount)}</p>
                            </div>
                            <div class="order-actions flex gap-3"></div>
                        </div>
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

        // After rendering, add Review buttons for completed orders — replace with 'Đã đánh giá' when a review exists
        document.querySelectorAll('.order-card').forEach(async card => {
            const orderId = card.dataset.orderId;
            // Determine status text from rendered DOM
            const statusEl = card.querySelector('.order-status');
            const statusText = statusEl ? statusEl.textContent.trim().toLowerCase() : '';
            const isCompleted = statusText.includes('hoàn thành') || statusText.includes('đã giao');
            if (!isCompleted) return;

            // Ensure actions container exists
            let actions = card.querySelector('.order-actions');
            if (!actions) {
                actions = document.createElement('div');
                actions.className = 'order-actions';
                card.querySelector('.order-summary').appendChild(actions);
            }

            // Check whether this order already has a review for the current user
            let reviewResp = null;
            try {
                reviewResp = await fetchReview(orderId);
            } catch (e) {
                console.warn('fetchReview error for', orderId, e);
            }

            // Server may return { review: {...} } or the review object directly — normalize both
            let reviewObj = null;
            if (reviewResp) {
                if (typeof reviewResp === 'object' && Object.prototype.hasOwnProperty.call(reviewResp, 'review')) {
                    // API returns { review: null } when not found — keep null in that case
                    reviewObj = reviewResp.review || null;
                } else {
                    // API returned the review object directly
                    reviewObj = reviewResp;
                }
            }

            const btn = document.createElement('button');
            btn.className = 'btn';
            btn.style.padding = '6px 10px';
            btn.style.fontSize = '13px';
            btn.setAttribute('aria-label', reviewObj ? `Đã đánh giá đơn hàng ${orderId}` : `Đánh giá đơn hàng ${orderId}`);

            if (reviewObj) {
                // Already reviewed -> show disabled label
                btn.textContent = 'Đã đánh giá';
                btn.disabled = true;
                btn.style.opacity = '0.65';
            } else {
                btn.innerHTML = '<i class="fas fa-star"></i> Đánh giá';
                btn.onclick = (e) => {
                    e.stopPropagation(); // prevent opening detail
                    openReviewModal(orderId);
                };
            }

            actions.appendChild(btn);
        });

        // ✅ NEW: Delegate click events for Mua lại buttons (works even if buttons are re-rendered)
        if (orderListElement) {
            // remove any previous delegated listener to avoid duplicates
            if (orderListElement._reorderHandler) {
                orderListElement.removeEventListener('click', orderListElement._reorderHandler);
            }
            orderListElement._reorderHandler = function (e) {
                const btn = e.target.closest && e.target.closest('.reorder-btn');
                if (!btn) return;
                e.stopPropagation(); // prevent opening detail
                const orderId = btn.dataset.orderId;
                if (!orderId) return;
                if (confirm(`Bạn có chắc chắn muốn mua lại đơn hàng #${orderId} không? Tất cả sản phẩm sẽ được thêm vào giỏ hàng.`)) {
                    reorderOrder(orderId);
                }
            };
            orderListElement.addEventListener('click', orderListElement._reorderHandler);
        }
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

// ---------------- Review modal helpers ----------------
async function fetchReview(orderId) {
    if (!checkAuth()) return null;
    try {
        const _apiBase = (window.API_CONFIG && window.API_CONFIG.BASE_URL) || window.API_CONFIG.BASE_URL;
        const resp = await fetch(`${_apiBase}/api/orderreview/${orderId}`, {
        });
        if (!resp.ok) {
            console.warn('Fetch review failed', resp.status);
            return null;
        }
        const data = await resp.json();
        return data || null;
    } catch (err) {
        console.error('Error fetching review:', err);
        return null;
    }
}

function openReviewModal(orderId) {
    if (!checkAuth()) return;
    const modal = document.getElementById('review-modal');
    if (!modal) return;
    document.getElementById('review-order-id').textContent = `#${orderId}`;
    document.getElementById('review-rating').value = '5';
    document.getElementById('review-comment').value = '';
    modal.style.display = 'block';

    // Initialize star widget and show default stars immediately
    try {
        initStarRating();
        setStarRatingUI(Number(document.getElementById('review-rating').value || 5));
    } catch (e) { console.warn('Star widget init failed', e); }

    // Load existing review if any
    fetchReview(orderId).then(review => {
        if (review) {
            const rVal = Number(review.rating || review.so_diem || 5);
            document.getElementById('review-rating').value = String(rVal);
            document.getElementById('review-comment').value = review.comment || review.noi_dung || '';
            // reflect existing review in star UI
            try { setStarRatingUI(rVal); } catch (e) { console.warn('setStarRatingUI failed', e); }
        }
    }).catch(err => console.warn(err));

    // Attach submit handler
    const submitBtn = document.getElementById('submit-review-btn');
    if (submitBtn) {
        submitBtn.onclick = async (e) => {
            e.stopPropagation();
            await submitReview(orderId);
        };
    }
}

function closeReviewModal() {
    const modal = document.getElementById('review-modal');
    if (modal) modal.style.display = 'none';
}

async function submitReview(orderId) {
    if (!checkAuth()) return;
    const rating = Number(document.getElementById('review-rating').value || 5);
    const comment = document.getElementById('review-comment').value || '';
    try {
        const _apiBase = (window.API_CONFIG && window.API_CONFIG.BASE_URL) || window.API_CONFIG.BASE_URL;
        console.log('Submitting review', { orderId, rating, hasToken: !!getToken() });
        const resp = await fetch(`${_apiBase}/api/orderreview/${orderId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getToken()}`
            },
            body: JSON.stringify({ rating, comment })
        });

        console.log('Review POST response status:', resp.status, resp.statusText);
        let payload = null;
        try {
            payload = await resp.json();
            console.log('Review POST response json:', payload);
        } catch (parseErr) {
            const text = await resp.text().catch(() => '<no-body>');
            console.warn('Review POST response not JSON:', text);
            payload = { raw: text };
        }

        if (!resp.ok) {
            const msg = (payload && (payload.error || payload.message)) || (payload && payload.raw) || 'Lỗi khi gửi đánh giá';
            throw new Error(msg);
        }

        alert('Gửi đánh giá thành công');
        closeReviewModal();
        markReviewed(orderId);
    } catch (err) {
        console.error('Submit review error:', err);
        alert('Không thể gửi đánh giá: ' + (err.message || err));
    }
}

function markReviewed(orderId) {
    const card = document.querySelector(`.order-card[data-order-id="${orderId}"]`);
    if (!card) return;
    const btn = card.querySelector('.order-actions button');
    if (!btn) return;
    btn.textContent = 'Đã đánh giá';
    btn.disabled = true;
    btn.style.opacity = '0.6';
}

// ✅ NEW: Hàm gọi API mua lại đơn hàng (fetch order detail first to capture shipping info)
async function reorderOrder(orderId) {
    if (!checkAuth()) return;

    const loadingModal = document.getElementById('loading-modal');
    if (loadingModal) loadingModal.style.display = 'block';

    // First: try to fetch order detail so we can persist address reliably
    let orderDataForAddress = null;
    try {
        orderDataForAddress = await fetchOrderDetail(orderId);
        if (!orderDataForAddress) orderDataForAddress = {};
    } catch (e) {
        console.warn('Could not fetch order detail before reorder:', e);
        orderDataForAddress = {};
    }

    // Backup current cart so we can restore if user cancels/leaves without buying
    try {
        const backup = await getCart(); // getCart is available on cart page; assume same global
        localStorage.setItem('cart_backup_before_reorder', JSON.stringify(backup || []));
        localStorage.setItem('reorder_meta', JSON.stringify({ orderId, ts: Date.now() }));
    } catch (e) {
        // If getCart isn't available in this context, try reading local cart
        try {
            const local = localStorage.getItem('cart') || '[]';
            localStorage.setItem('cart_backup_before_reorder', local);
            localStorage.setItem('reorder_meta', JSON.stringify({ orderId, ts: Date.now() }));
        } catch (ee) { console.warn('Could not persist cart backup before reorder', ee); }
    }

    try {
        const _apiBase = (window.API_CONFIG && window.API_CONFIG.BASE_URL) || window.API_CONFIG.BASE_URL;
        const response = await fetch(`${_apiBase}/api/cart/reorder/${orderId}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${getToken()}`,
                'Content-Type': 'application/json'
            }
        });

        const result = await response.json().catch(() => ({}));
        if (!response.ok) {
            throw new Error(result.error || result.message || 'Không thể mua lại đơn hàng');
        }

        alert(`✅ ${result.message}\nĐã thêm ${result.readdedCount || 0} sản phẩm vào giỏ hàng. Bạn sẽ được chuyển tới giỏ hàng để hoàn tất thanh toán.`);

        // Persist shipping info from fetched order detail (if present)
        try {
            const order = orderDataForAddress || {};
            const shipping = {
                tenkh: order.recipientName || order.TenNguoiNhan || order.customerName || '',
                sdt: order.recipientPhone || order.SDT || order.customerPhone || '',
                email: order.recipientEmail || order.Email || order.customerEmail || '',
                tinhthanh: order.province || order.TinhThanh || (order.shippingAddress && order.shippingAddress.province) || '',
                quanhuyen: order.district || order.QuanHuyen || (order.shippingAddress && order.shippingAddress.district) || '',
                phuongxa: order.ward || order.PhuongXa || (order.shippingAddress && order.shippingAddress.ward) || '',
                diachi: order.shippingAddress?.detail || order.DiaChiChiTiet || order.shippingAddress || ''
            };
            localStorage.setItem('reorder_address', JSON.stringify(shipping));
            console.log('Saved reorder address from fetched order:', shipping);
        } catch (e) {
            console.warn('Could not persist reorder address', e);
        }

        // Redirect to cart and request auto-checkout
        window.location.href = 'cart.html?autoCheckout=1';
    } catch (error) {
        console.error('Lỗi khi mua lại đơn hàng:', error);
        alert(`❌ Lỗi khi mua lại đơn hàng: ${error.message || error}`);
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
const requestReturnBtn = document.getElementById('request-return-btn');
    if (requestReturnBtn) {
        // Normalize possible status fields and values (backend may use different names/values)
        const rawStatus = String(order.status || order.tinhtrang || order.TrangThai || order.trangThai || order.trang_thai || '').toLowerCase();
        const completedKeywords = [
            'completed', 'delivered', 'đã giao', 'giao hàng', 'đã giao hàng', 'đã hoàn thành', 'hoàn thành', 'hoan thanh'
        ];
        const isCompleted = completedKeywords.some(k => rawStatus.includes(k));
        requestReturnBtn.style.display = isCompleted ? 'inline-flex' : 'none';
        requestReturnBtn.onclick = () => openReturnModal(order);
    }
    const statusDisplay = {
        'pending': { class: 'status-pending', text: 'Chờ xác nhận' },
        'processing': { class: 'status-processing', text: 'Đã xác nhận' },
        'shipping': { class: 'status-shipping', text: 'Đang giao hàng' },
        'completed': { class: 'status-completed', text: 'Đã hoàn thành' },
        'cancelled': { class: 'status-cancelled', text: 'Đã hủy' }
    };
    // --- NEW: Open return modal and populate items ---
function openReturnModal(order) {
  const modal = document.getElementById('return-request-modal');
  const itemsList = document.getElementById('return-items-list');
  const reason = document.getElementById('return-reason');
  const files = document.getElementById('return-files');

  if (!modal || !itemsList) return;
  // fill items
  itemsList.innerHTML = '';
  (order.items || []).forEach(it => {
    const id = it.productId || it.MaSP || it.productId;
    const qty = it.quantity || it.Soluong || it.quantity || 1;
    const label = document.createElement('label');
    label.style.display = 'flex';
    label.style.justifyContent = 'space-between';
    label.style.alignItems = 'center';
    label.innerHTML = `
      <span style="flex:1;"><input type="checkbox" class="return-item-checkbox" data-product="${id}" data-max="${qty}" checked style="margin-right:8px;"> ${escapeHtml(it.productName || it.productName || id)}</span>
      <span style="width:120px;text-align:right;">Số lượng: <input type="number" class="return-item-qty" value="${qty}" min="1" max="${qty}" style="width:64px; margin-left:8px;"></span>
    `;
    itemsList.appendChild(label);
  });

  // show modal
  modal.style.display = 'block';

  // attach buttons
  document.getElementById('cancel-return-btn').onclick = () => hideReturnModal();
  document.getElementById('close-return-modal').onclick = () => hideReturnModal();
  document.getElementById('submit-return-btn').onclick = () => submitReturnRequest(order);
}

// --- NEW: hide modal ---
function hideReturnModal() {
  const modal = document.getElementById('return-request-modal');
  if (modal) modal.style.display = 'none';
  // clear inputs
  const reason = document.getElementById('return-reason');
  const files = document.getElementById('return-files');
  if (reason) reason.value = '';
  if (files) files.value = '';
}

// --- NEW: submit return request ---
async function submitReturnRequest(order) {
  if (!checkAuth()) return;
  const orderId = order.id || order.MaHD;
  const user = JSON.parse(localStorage.getItem('user')) || {};
  const nguoi_tao = user.makh || user.id || null;

  // collect selected items
  const checkboxes = Array.from(document.querySelectorAll('.return-item-checkbox'));
  const qtyInputs = Array.from(document.querySelectorAll('.return-item-qty'));
  const items = [];
  checkboxes.forEach((cb, idx) => {
    if (!cb.checked) return;
    const productId = cb.dataset.product;
    const max = Number(cb.dataset.max || 1);
    const qtyEl = qtyInputs[idx];
    let qty = qtyEl ? Number(qtyEl.value) : max;
    if (!qty || qty < 1) qty = 1;
    if (qty > max) qty = max;
    items.push({ ma_san_pham: String(productId), so_luong: qty });
  });

  if (!items.length) {
    alert('Vui lòng chọn ít nhất 1 sản phẩm để trả.');
    return;
  }

  const ly_do = document.getElementById('return-reason')?.value?.trim() || 'Khách báo lỗi khi nhận hàng';
  // First create tra_hang record (without files)
  try {
    const resp = await fetch(`${window.API_CONFIG.BASE_URL}/api/tra-hang` , {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
      },
      body: JSON.stringify({
        ma_don_hang: orderId,
        mat_hang: items,
        ly_do,
        tep_dinh_kem: [],
        nguoi_tao,
        loai_nguoi_tao: 'khachhang'
      })
    });
    const data = await resp.json();
    if (!resp.ok) throw new Error(data.error || data.message || 'Lỗi tạo yêu cầu trả hàng');

    const returnId = data.id;
    // If files selected, upload them
    const fileInput = document.getElementById('return-files');
    if (fileInput && fileInput.files.length) {
      const form = new FormData();
      for (const f of fileInput.files) form.append('files', f);
      const upResp = await fetch(`${window.API_CONFIG.BASE_URL}/api/tra-hang/${returnId}/files`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${getToken()}` },
        body: form
      });
      if (!upResp.ok) {
        console.warn('Upload files failed', await upResp.text());
      }
    }

    alert('Gửi yêu cầu trả hàng thành công. Mã yêu cầu: ' + returnId);
    hideReturnModal();
    // optional: refresh orders / details
  } catch (err) {
    console.error('Submit return error:', err);
    alert('Lỗi khi gửi yêu cầu trả hàng: ' + (err.message || err));
  }
}

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
    
    // ✅ HIỂN THỊ GHI CHÚ VỚI HIGHLIGHT NẾU CÓ PHÍ SHIP
    const notesElement = document.getElementById('order-notes');
    if (notesElement) {
        let notes = order.notes || order.GhiChu || '';
        
        // ✅ LỌC BỎ GHI CHÚ SHIPPING SAI CHO ĐƠN HCM
        const province = order.province || order.TinhThanh || '';
        const isHCM = isHCMAddress(province);
        
        if (isHCM && notes) {
            // Nếu là đơn HCM, loại bỏ dòng [SHIPPING] có Tỉnh: 50
            const lines = notes.split('\n');
            notes = lines.filter(line => {
                // Loại bỏ dòng [SHIPPING] có mã tỉnh 50 (HCM) nhưng có phí ship > 0
                if (line.includes('[SHIPPING]') && line.includes('Tỉnh: 50') && !line.includes('0đ')) {
                    console.log('🗑️ Loại bỏ ghi chú shipping sai:', line);
                    return false;
                }
                return true;
            }).join('\n').trim();
        }
        
        if (!notes) {
            notesElement.innerHTML = '<span class="no-notes">Không có ghi chú</span>';
        } else if (notes.includes('Thu thêm') && notes.includes('phí ship')) {
            // Ghi chú quan trọng về phí ship
            notesElement.innerHTML = `
                <div class="alert alert-warning" style="margin: 0;">
                    <i class="fas fa-exclamation-triangle"></i>
                    <div>
                        <strong>⚠️ Lưu ý quan trọng:</strong>
                        <p style="margin: 5px 0 0 0;">${escapeHtml(notes).replace(/\n/g, '<br>')}</p>
                    </div>
                </div>
            `;
        } else {
            // Ghi chú thông thường
            notesElement.innerHTML = `<span class="order-note">${escapeHtml(notes).replace(/\n/g, '<br>')}</span>`;
        }
    }

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

    // --- NEW: Hiển thị nút "Sửa địa chỉ" nếu đơn đang 'Chờ xử lý' — chọn từ địa chỉ đã lưu
    (function renderEditAddressControl() {
        const shippingSection = document.querySelector('.shipping-info-section');
        if (!shippingSection) return;

        // Remove previous control nếu có
        const prev = document.getElementById('edit-address-control');
        if (prev) prev.remove();

        const isPending = (order.tinhtrang || '').toString() === 'Chờ xử lý' || (order.status === 'pending');
        if (!isPending) return;

        const control = document.createElement('div');
        control.id = 'edit-address-control';
        control.className = 'mt-6 pt-6 border-t border-dashed border-border';
        control.innerHTML = `
            <button id="edit-address-btn" class="flex items-center gap-3 bg-bg hover:bg-primary/5 text-primary px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all border border-primary/20 shadow-sm group">
                <i class="fas fa-map-marker-alt group-hover:scale-110 transition-transform"></i> Thay đổi địa chỉ giao hàng
            </button>
            <div id="edit-address-form" style="display:none;" class="space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
                <div class="space-y-3">
                    <p class="text-[10px] font-black text-text-light uppercase tracking-widest">Chọn địa chỉ từ danh sách đã lưu</p>
                    <div class="relative">
                        <select id="saved-address-select" class="w-full pl-6 pr-12 py-4 bg-bg border border-border rounded-2xl outline-none focus:border-primary transition-all text-sm font-bold text-text appearance-none cursor-pointer">
                            <option value="">Đang tải địa chỉ...</option>
                        </select>
                        <i class="fas fa-chevron-down absolute right-6 top-1/2 -translate-y-1/2 text-text-light text-[10px] pointer-events-none"></i>
                    </div>
                </div>
                
                <div id="saved-address-preview" class="p-6 bg-primary/5 rounded-2xl border border-primary/10 text-xs font-bold text-primary leading-relaxed hidden"></div>
                
                <div class="flex items-center gap-4">
                    <button id="save-edit-address" class="flex-1 bg-primary text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all">Lưu thay đổi</button>
                    <button id="cancel-edit-address" class="px-8 py-4 bg-white border border-border text-text-light rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-50 transition-all">Hủy</button>
                </div>
            </div>
        `;
        shippingSection.appendChild(control);

        const selectEl = control.querySelector('#saved-address-select');
        const previewEl = control.querySelector('#saved-address-preview');
        const btn = control.querySelector('#edit-address-btn');

        btn.addEventListener('click', async () => {
            document.getElementById('edit-address-form').style.display = 'block';
            btn.style.display = 'none';

            // Fetch saved addresses for this customer
            try {
                const customerId = getCustomerId();
                const resp = await fetch(`${window.API_CONFIG.BASE_URL}/api/orders/customer-addresses/${customerId}`, {
                    headers: { 'Authorization': `Bearer ${getToken()}` }
                });
                const payload = await resp.json();
                if (!resp.ok) throw new Error((payload && (payload.error || payload.message)) || 'Không thể tải địa chỉ');

                // server returns { success: true, data: [...] }
                const addresses = Array.isArray(payload) ? payload : (payload && payload.data) || [];

                if (!addresses.length) {
                    selectEl.innerHTML = '<option value="">Không có địa chỉ</option>';
                    previewEl.textContent = '';
                    return;
                }

                selectEl.innerHTML = '<option value="">-- Chọn địa chỉ --</option>' + addresses.map(a => {
                    const id = a.id || a.MaDiaChi || '';
                    const province = a.province || a.TinhThanh || '';
                    const label = `${a.name || a.TenNguoiNhan || ''} — ${a.detail || a.DiaChiChiTiet || ''}`;
                    return `<option value="${id}" data-province="${escapeHtml(province)}">${escapeHtml(label)}</option>`;
                }).join('');

                selectEl.onchange = () => {
                    const sel = selectEl.options[selectEl.selectedIndex];
                    if (!sel || !sel.value) {
                        previewEl.textContent = '';
                        previewEl.classList.add('hidden');
                        return;
                    }
                    const addr = addresses.find(d => String(d.id || d.MaDiaChi) === String(sel.value)) || {};
                    previewEl.textContent = `${addr.name || addr.TenNguoiNhan || ''} | ${addr.phone || addr.SDT || ''} — ${addr.detail || addr.DiaChiChiTiet || ''} ${addr.province || addr.TinhThanh || ''}`;
                    previewEl.classList.remove('hidden');
                };
            } catch (err) {
                console.error('Load saved addresses failed', err);
                selectEl.innerHTML = '<option value="">Không có địa chỉ</option>';
            }
        });

        control.querySelector('#cancel-edit-address').addEventListener('click', () => {
            document.getElementById('edit-address-form').style.display = 'none';
            btn.style.display = 'inline-flex';
        });

        control.querySelector('#save-edit-address').addEventListener('click', async () => {
            await submitAddressUpdate(order);
        });
    })();

    // Hiển thị danh sách sản phẩm
    const orderItemsElement = document.getElementById('order-items');
    if (orderItemsElement) {
        orderItemsElement.innerHTML = order.items.map(item => `
            <div class="flex items-center gap-6 p-6 border-b border-border last:border-b-0 group">
                <div class="w-16 h-20 flex-shrink-0 bg-bg rounded-lg overflow-hidden border border-border group-hover:scale-105 transition-transform duration-500">
                    <img src="img/product/${item.productImage}" alt="${item.productName}" class="w-full h-full object-cover" onerror="this.src='img/product/default.jpg'">
                </div>
                <div class="flex-1 min-w-0">
                    <h4 class="text-sm font-black text-text mb-1 truncate">${item.productName}</h4>
                    <div class="flex items-center gap-4 text-[10px] font-bold text-text-light uppercase tracking-widest">
                        <span>Giá: ${formatPrice(item.price)}</span>
                        <span>Số lượng: ${item.quantity}</span>
                    </div>
                </div>
                <div class="text-right">
                    <p class="text-base font-black text-primary tracking-tighter">${formatPrice(item.price * item.quantity)}</p>
                </div>
            </div>
        `).join('');
    }

    // ✅ Hiển thị nút hủy với logic mới
    const cancelBtn = document.getElementById('cancel-order-btn');
    if (cancelBtn) {
        // Determine if the order is cancellable or requires refund information
        const paymentStatus = (order.paymentStatus || '').toString();
        const paidIndicators = ['Đã thanh toán', 'Đã nhận tiền', 'Đã nhận', 'Ä Ã£ thanh toÃ¡n'];
        const isPaid = paidIndicators.some(ind => paymentStatus.includes(ind));

        // Accept both legacy 'pending' flag or Vietnamese tinhtrang values
        const statusValue = (order.status || order.tinhtrang || '').toString();
        const cancellableStatuses = ['pending', 'Chờ xử lý', 'Chờ xác nhận', 'Đã xác nhận', 'Chá»  xá»­ lÃ½', 'Ä Ã£ xÃ¡c nháº­n'];
        const isCancellableStatus = cancellableStatuses.some(s => statusValue.includes(s));

        // Show cancel button if status allows cancellation OR payment was already received (so user can provide refund info)
        cancelBtn.style.display = (isCancellableStatus || isPaid) ? 'inline-flex' : 'none';
        cancelBtn.onclick = () => showCancelModal();
    }

    // Hiển thị bản đồ giao hàng
    displayDeliveryMap(order);

    // Hiển thị thông tin trả hàng (nếu có)
    try { await renderReturnInfo(order); } catch (e) { console.warn('renderReturnInfo failed', e); }

        modal.style.display = 'block';
        // Force Leaflet to recalculate size after modal is visible (fixes gray/cropped tiles)
        try {
            setTimeout(() => { if (typeof map !== 'undefined' && map) map.invalidateSize(); }, 150);
            setTimeout(() => { if (typeof map !== 'undefined' && map) map.invalidateSize(); }, 450);
        } catch (e) { /* ignore */ }
}

// Fetch return request(s) for a given order id
async function fetchReturnForOrder(orderId) {
    if (!orderId) return null;
    try {
        const token = getToken();
            const res = await fetch(`${window.API_CONFIG.BASE_URL}/api/tra-hang?ma_don_hang=${encodeURIComponent(orderId)}`, {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        if (!res.ok) {
            // If API doesn't support query by ma_don_hang, try listing and filter client-side
            const list = await res.json().catch(() => []);
            return Array.isArray(list) ? list.filter(r => r.ma_don_hang == orderId) : [];
        }
        const data = await res.json();
        // If API returns array
        if (Array.isArray(data)) return data.filter(r => r.ma_don_hang == orderId);
        return [];
    } catch (e) {
        console.warn('Không thể lấy thông tin trả hàng:', e.message || e);
        return [];
    }
}

// ✅ BIẾN LƯU THÔNG TIN ĐỂ XÁC NHẬN ĐỔI ĐỊA CHỈ
let pendingAddressChange = null;

// NEW: submitAddressUpdate - gọi API PUT để cập nhật địa chỉ đơn hàng khi còn 'Chờ xử lý'
async function submitAddressUpdate(order) {
    if (!checkAuth()) return;
    const orderId = order.id || order.MaHD;
    if (!orderId) {
        showErrorToast('Không tìm thấy mã đơn hàng');
        return;
    }

    // Nếu người dùng chọn địa chỉ đã lưu, gửi MaDiaChi; nếu không, fallback sang gửi thông tin mới
    const selectedSaved = document.getElementById('saved-address-select')?.value;
    let payload = {};
    let newProvince = '';
    let newAddressDisplay = '';
    
    if (selectedSaved) {
        payload.MaDiaChi = selectedSaved;
        // Lấy tên tỉnh từ select box
        const addressSelect = document.getElementById('saved-address-select');
        if (addressSelect) {
            const selectedOption = addressSelect.selectedOptions[0];
            newProvince = selectedOption?.getAttribute('data-province') || '';
            newAddressDisplay = selectedOption?.text || '';
        }
    } else {
        const provinceSelect = document.getElementById('edit-province');
        newProvince = provinceSelect?.selectedOptions[0]?.text || '';
        
        payload = {
            TenNguoiNhan: document.getElementById('edit-recipient')?.value?.trim(),
            SDT: document.getElementById('edit-phone')?.value?.trim(),
            DiaChiChiTiet: document.getElementById('edit-detail')?.value?.trim(),
            TinhThanh: newProvince,
            QuanHuyen: document.getElementById('edit-district')?.selectedOptions[0]?.text || null,
            PhuongXa: document.getElementById('edit-ward')?.selectedOptions[0]?.text || null
        };

        newAddressDisplay = `${payload.TenNguoiNhan} - ${payload.DiaChiChiTiet}, ${payload.PhuongXa}, ${payload.QuanHuyen}, ${payload.TinhThanh}`;

        if (!payload.TenNguoiNhan || !payload.SDT || !payload.DiaChiChiTiet) {
            showErrorToast('Vui lòng chọn địa chỉ đã lưu hoặc điền Người nhận, SĐT và Địa chỉ chi tiết');
            return;
        }
    }

    // ✅ KIỂM TRA TRƯỚC: Hiển thị modal xác nhận nếu cần
    let oldProvince = order.province || order.TinhThanh || '';
    
    // Nếu oldProvince là mã số, resolve sang tên
    if (oldProvince && /^\d+$/.test(String(oldProvince).trim())) {
        console.log('🔄 Resolving old province code:', oldProvince);
        const resolvedName = await getProvinceName(oldProvince);
        if (resolvedName) {
            oldProvince = resolvedName;
            console.log('✅ Resolved to:', oldProvince);
        }
    }
    
    const isOldHCM = isHCMAddress(oldProvince);
    const isNewHCM = isHCMAddress(newProvince);

    console.log('🔍 Checking address change:', {
        oldProvince,
        newProvince,
        isOldHCM,
        isNewHCM,
        paymentMethod: order.paymentMethod || order.PhuongThucThanhToan,
        paymentStatus: order.paymentStatus || order.TrangThaiThanhToan
    });

    // ✅ LUÔN HIỂN THỊ MODAL XÁC NHẬN (kể cả không có phí)
    await showAddressChangeConfirmation(order, {
        oldProvince,
        newProvince,
        newAddressDisplay,
        payload,
        isOldHCM,
        isNewHCM
    });
}

// ✅ HÀM HIỂN THỊ MODAL XÁC NHẬN ĐỔI ĐỊA CHỈ
async function showAddressChangeConfirmation(order, addressInfo) {
    const modal = document.getElementById('address-change-confirmation-modal');
    if (!modal) {
        console.error('Address change confirmation modal not found');
        return;
    }

    const { oldProvince, newProvince, newAddressDisplay, payload, isOldHCM, isNewHCM } = addressInfo;
    
    // Lưu thông tin để xử lý sau khi confirm
    pendingAddressChange = {
        order,
        payload,
        addressInfo
    };

    // Hiển thị địa chỉ cũ và mới
    const oldAddressEl = document.getElementById('confirm-old-address');
    const newAddressEl = document.getElementById('confirm-new-address');
    
    if (oldAddressEl) {
        const oldFullAddress = await formatFullAddress(order);
        oldAddressEl.innerHTML = `
            <div style="font-weight: 500;">${order.recipientName || 'N/A'} - ${order.recipientPhone || 'N/A'}</div>
            <div style="color: #666; font-size: 14px; margin-top: 4px;">${oldFullAddress}</div>
        `;
    }
    
    if (newAddressEl) {
        newAddressEl.innerHTML = `
            <div style="font-weight: 500; color: #ff5722;">${newAddressDisplay}</div>
        `;
    }

    // ✅ TÍNH PHÍ SHIP CHÍNH XÁC dựa trên trọng lượng đơn hàng
    const paymentMethod = order.paymentMethod || order.PhuongThucThanhToan || '';
    const paymentStatus = order.paymentStatus || order.TrangThaiThanhToan || '';
    const currentTotal = order.totalAmount || order.TongTien || 0;
    
    console.log('📋 Order details:', {
        orderId: order.id || order.MaHD,
        items: order.items,
        itemsLength: order.items ? order.items.length : 0,
        isOldHCM,
        isNewHCM,
        oldProvince,
        newProvince
    });
    
    // Lấy tổng trọng lượng từ chi tiết đơn hàng
    let totalWeight = 0;
    if (order.items && Array.isArray(order.items) && order.items.length > 0) {
        totalWeight = order.items.reduce((sum, item) => {
            const itemWeight = item.weight || item.TrongLuong || 300; // default 300g
            const quantity = item.quantity || item.SoLuong || 1;
            console.log(`  📦 Item: ${item.productName || item.TenSP}, Weight: ${itemWeight}g, Qty: ${quantity}`);
            return sum + (itemWeight * quantity);
        }, 0);
    } else {
        // Nếu không có thông tin trọng lượng, giả định trung bình 500g/sản phẩm
        console.warn('⚠️ Không có thông tin items, dùng trọng lượng mặc định 500g');
        totalWeight = 500;
    }
    
    console.log('📦 Tổng trọng lượng đơn hàng:', totalWeight, 'g');
    
    // Tính phí ship theo công thức: 15,000đ/500g cho ngoại thành
    const calculateShipping = (isHCM, weight) => {
        if (isHCM) return 0; // Free ship HCM
        const units = Math.ceil(weight / 500);
        return units * 15000;
    };
    
    const oldShippingFee = calculateShipping(isOldHCM, totalWeight);
    const newShippingFee = calculateShipping(isNewHCM, totalWeight);
    const shippingDiff = newShippingFee - oldShippingFee;
    
    console.log('💰 Phí ship cũ:', oldShippingFee, '- Phí ship mới:', newShippingFee, '- Chênh lệch:', shippingDiff);
    
    // ✅ LUÔN HIỂN THỊ BOX PHÍ SHIP (kể cả khi = 0) để user biết
    const shippingFeeInfoEl = document.getElementById('shipping-fee-info');
    if (shippingFeeInfoEl) {
        // Hiển thị nếu có thay đổi HOẶC nếu địa chỉ mới không phải HCM
        if (shippingDiff !== 0 || !isNewHCM || !isOldHCM) {
            shippingFeeInfoEl.style.display = 'block';
            document.getElementById('confirm-old-shipping-fee').textContent = formatPrice(oldShippingFee);
            document.getElementById('confirm-new-shipping-fee').textContent = formatPrice(newShippingFee);
            document.getElementById('confirm-shipping-diff').textContent = 
                (shippingDiff > 0 ? '+' : '') + formatPrice(shippingDiff);
            document.getElementById('confirm-shipping-diff').style.color = shippingDiff > 0 ? '#d84315' : '#4caf50';
        } else {
            shippingFeeInfoEl.style.display = 'none';
        }
    }

    // Thông tin thanh toán
    const paymentMethodNames = {
        'COD': 'Thanh toán khi nhận hàng (COD)',
        'VNPAY': 'Thanh toán online (VNPay)',
        'BANK': 'Chuyển khoản ngân hàng',
        'MOMO': 'Ví MoMo',
        'ZALOPAY': 'Ví ZaloPay'
    };
    
    document.getElementById('confirm-payment-method').textContent = 
        paymentMethodNames[paymentMethod] || paymentMethod;
    
    const newTotal = currentTotal + shippingDiff;
    document.getElementById('confirm-new-total').textContent = formatPrice(newTotal);

    // Message động
    const messageEl = document.getElementById('address-change-message');
    let message = '';
    
    if (shippingDiff > 0) {
        if (paymentMethod === 'VNPAY' && paymentStatus === 'Đã thanh toán') {
            message = `⚠️ <strong>Lưu ý:</strong> Bạn đã thanh toán online ${formatPrice(currentTotal)}. ` +
                     `Shipper sẽ <strong style="color: #d84315;">thu thêm ${formatPrice(shippingDiff)}</strong> phí ship khi giao hàng.`;
        } else if (paymentMethod === 'COD') {
            message = `� Tổng tiền sẽ tăng từ <strong>${formatPrice(currentTotal)}</strong> lên ` +
                     `<strong style="color: #d84315;">${formatPrice(newTotal)}</strong>. ` +
                     `Bạn sẽ thanh toán khi nhận hàng.`;
        } else {
            message = `💰 Tổng tiền sẽ thay đổi thành <strong style="color: #d84315;">${formatPrice(newTotal)}</strong>.`;
        }
    } else if (shippingDiff < 0) {
        message = `✅ Phí ship giảm ${formatPrice(Math.abs(shippingDiff))}! Tổng tiền mới: <strong style="color: #4caf50;">${formatPrice(newTotal)}</strong>`;
    } else {
        message = `ℹ️ Địa chỉ mới không ảnh hưởng đến phí vận chuyển.`;
    }
    
    if (messageEl && messageEl.querySelector('p')) {
        messageEl.querySelector('p').innerHTML = message;
    }

    // Hiển thị modal
    modal.style.display = 'block';
}

// ✅ HÀM ĐÓNG MODAL XÁC NHẬN
function closeAddressChangeModal() {
    const modal = document.getElementById('address-change-confirmation-modal');
    if (modal) {
        modal.style.display = 'none';
    }
    pendingAddressChange = null;
}

// ✅ HÀM XỬ LÝ KHI KHÁCH ĐỒNG Ý ĐỔI ĐỊA CHỈ
async function confirmAddressChange() {
    if (!pendingAddressChange) {
        showErrorToast('Không tìm thấy thông tin thay đổi');
        return;
    }

    const { order, payload } = pendingAddressChange;
    const orderId = order.id || order.MaHD;

    // Đóng modal xác nhận
    closeAddressChangeModal();

    // Hiển thị loading
    const loadingModal = document.getElementById('loading-modal');
    if (loadingModal) loadingModal.style.display = 'flex';

    try {
        const resp = await fetch(`${window.API_CONFIG.BASE_URL}/api/orders/hoadon/${orderId}/address`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getToken()}`
            },
            body: JSON.stringify(payload)
        });

        const data = await resp.json();
        if (!resp.ok) {
            throw new Error(data.error || data.message || 'Cập nhật địa chỉ thất bại');
        }

        // ✅ HIỂN THỊ THÔNG BÁO PHÙ HỢP
        let successMessage = data.message || 'Cập nhật địa chỉ thành công';
        
        if (data.warning && data.data) {
            if (data.data.collectOnDelivery) {
                // Trường hợp VNPay đã thanh toán, thu thêm tiền ship
                successMessage = `✅ ${successMessage}\n\n`;
                successMessage += `💵 Shipper sẽ thu thêm: ${formatPrice(data.data.collectOnDelivery)}\n`;
                successMessage += `📝 ${data.data.note || 'Thu khi giao hàng'}`;
            } else if (data.data.newTotal) {
                // Trường hợp COD
                successMessage = `✅ ${successMessage}\n\n`;
                successMessage += `💵 Tổng tiền mới: ${formatPrice(data.data.newTotal)}\n`;
                successMessage += `📝 ${data.data.note || 'Thanh toán khi nhận hàng'}`;
            }
        }

        // ✅ CẬP NHẬT UI NGAY TỪ RESPONSE API
        console.log('🔍 DEBUG: API Response data:', JSON.stringify(data.data, null, 2));
        
        if (data.data) {
            const responseTotal = data.data.TongTien || data.data.newTotal;
            const responseShipping = data.data.PhiShip || data.data.newShippingFee;
            
            console.log('🔍 DEBUG: Extracted values:', {
                responseTotal,
                responseShipping,
                TongTien: data.data.TongTien,
                newTotal: data.data.newTotal,
                PhiShip: data.data.PhiShip,
                newShippingFee: data.data.newShippingFee
            });
            
            if (responseTotal !== undefined) {
                const totalAmountEl = document.getElementById('order-total');
                console.log('💰 [RESPONSE] Updating order-total from API response:', responseTotal);
                console.log('💰 Element exists?', totalAmountEl !== null, 'Current text:', totalAmountEl?.textContent);
                if (totalAmountEl) {
                    totalAmountEl.textContent = formatPrice(responseTotal);
                    console.log('💰 Updated to:', totalAmountEl.textContent);
                } else {
                    console.error('❌ Element #order-total NOT FOUND in DOM!');
                }
            } else {
                console.warn('⚠️ responseTotal is undefined!');
            }
            
            if (responseShipping !== undefined) {
                const shippingFeeEl = document.getElementById('shipping-fee');
                console.log('🚚 [RESPONSE] Updating shipping-fee from API response:', responseShipping);
                if (shippingFeeEl) {
                    shippingFeeEl.textContent = formatPrice(responseShipping);
                } else {
                    console.warn('⚠️ Element #shipping-fee NOT FOUND');
                }
            }
        } else {
            console.error('❌ data.data is empty or undefined!');
        }

        // ✅ CHỜ 500MS ĐỂ DATABASE COMMIT XONG
        await new Promise(resolve => setTimeout(resolve, 500));

        // Cập nhật UI: refresh chi tiết đơn hàng và danh sách
        const fresh = await fetchOrderDetail(orderId);
        
        console.log('🔄 Fresh order data after address change:', {
            orderId,
            totalAmount: fresh?.totalAmount,
            TongTien: fresh?.TongTien,
            shippingFee: fresh?.shippingFee,
            PhiShip: fresh?.PhiShip
        });
        
        if (fresh) {
            currentOrderData = fresh;
            
            // ✅ CẬP NHẬT TỔNG TIỀN TRÊN MODAL
            const totalAmountEl = document.getElementById('order-total');
            const newTotal = fresh.totalAmount || fresh.TongTien || 0;
            console.log('💰 Updating order-total element:', totalAmountEl ? 'Found' : 'NOT FOUND', 'New value:', newTotal);
            if (totalAmountEl) {
                totalAmountEl.textContent = formatPrice(newTotal);
            }
            
            // ✅ CẬP NHẬT PHÍ SHIP NẾU CÓ ELEMENT
            const shippingFeeEl = document.getElementById('shipping-fee');
            const newShippingFee = fresh.shippingFee || fresh.PhiShip || 0;
            console.log('🚚 Updating shipping-fee element:', shippingFeeEl ? 'Found' : 'NOT FOUND', 'New value:', newShippingFee);
            if (shippingFeeEl) {
                shippingFeeEl.textContent = formatPrice(newShippingFee);
            }
            
            // server returns recipient fields from joined diachi
            document.getElementById('receiver-name').textContent = fresh.recipientName || fresh.TenNguoiNhan || payload.TenNguoiNhan || '';
            document.getElementById('receiver-phone').textContent = fresh.recipientPhone || fresh.SDT || payload.SDT || '';

            // Format from fresh if available
            try {
                const shippingParts = {
                    shippingAddress: fresh.shippingAddress || fresh.DiaChiChiTiet || payload.DiaChiChiTiet,
                    ward: fresh.ward || fresh.PhuongXa || payload.PhuongXa,
                    district: fresh.district || fresh.QuanHuyen || payload.QuanHuyen,
                    province: fresh.province || fresh.TinhThanh || payload.TinhThanh
                };
                document.getElementById('shipping-address').textContent = await formatFullAddress(shippingParts);
            } catch (e) {
                document.getElementById('shipping-address').textContent = fresh.shippingAddress || payload.DiaChiChiTiet || '';
            }

            // ✅ Hiển thị ghi chú quan trọng nếu có
            const notesEl = document.getElementById('order-notes');
            if (notesEl && fresh.notes) {
                if (fresh.notes.includes('Thu thêm') && fresh.notes.includes('phí ship')) {
                    notesEl.innerHTML = `
                        <div class="alert alert-warning">
                            <i class="fas fa-exclamation-triangle"></i>
                            <strong>⚠️ Lưu ý quan trọng:</strong>
                            <p>${fresh.notes.replace(/\n/g, '<br>')}</p>
                        </div>
                    `;
                } else {
                    notesEl.innerHTML = `<p class="order-note">${fresh.notes.replace(/\n/g, '<br>')}</p>`;
                }
            }

            // Ẩn form
            const formEl = document.getElementById('edit-address-form');
            if (formEl) formEl.style.display = 'none';
            const btn = document.getElementById('edit-address-btn');
            if (btn) btn.style.display = 'inline-flex';

            // Làm mới danh sách đơn
            await renderOrders(getCustomerId(), document.getElementById('status-filter')?.value || 'all');

            // Refresh delivery map so route/markers are recalculated for new address
            try {
                // allow a small delay so modal and DOM settle
                setTimeout(() => {
                    try {
                        if (typeof displayDeliveryMap === 'function') displayDeliveryMap(fresh);
                        if (typeof map !== 'undefined' && map) map.invalidateSize();
                    } catch (e) { console.warn('Không thể cập nhật bản đồ sau khi đổi địa chỉ', e); }
                }, 300);
            } catch (e) { /* ignore */ }

            alert(successMessage);
        } else {
            alert(successMessage);
            const formEl = document.getElementById('edit-address-form');
            if (formEl) formEl.style.display = 'none';
        }
    } catch (err) {
        console.error('Update address failed:', err);
        showErrorToast(err.message || 'Lỗi khi cập nhật địa chỉ');
    } finally {
        // Ẩn loading modal
        const loadingModal = document.getElementById('loading-modal');
        if (loadingModal) loadingModal.style.display = 'none';
        
        // Reset pending change
        pendingAddressChange = null;
    }
}

// Render return info in order detail modal
async function renderReturnInfo(order) {
    try {
        const section = document.getElementById('return-info-section');
        const statusEl = document.getElementById('return-status');
        const viewBtn = document.getElementById('view-return-btn');
        if (!section || !statusEl || !viewBtn) return;

            const returns = await fetchReturnForOrder(order.id);
        if (!returns || returns.length === 0) {
            section.style.display = 'none';
            return;
        }

        // pick latest
        const latest = returns.sort((a,b)=> new Date(b.created_at || b.createdAt || 0) - new Date(a.created_at || a.createdAt || 0))[0];
        const mapping = {
            'da_bao_cao': {text: 'Đã báo cáo', color: '#ffc107'},
            'dang_van_chuyen': {text: 'Đang vận chuyển', color: '#17a2b8'},
            'da_nhan': {text: 'Đã nhận', color: '#007bff'},
            'chap_thuan': {text: 'Đã chấp thuận', color: '#28a745'},
            'da_hoan_tien': {text: 'Đã hoàn tiền', color: '#218838'},
            'tu_choi': {text: 'Đã từ chối', color: '#dc3545'},
            'huy': {text: 'Đã hủy', color: '#6c757d'}
        };

        const info = mapping[latest.trang_thai] || {text: latest.trang_thai || 'Đang xử lý', color: '#6c757d'};
        statusEl.textContent = info.text;
        statusEl.style.background = info.color;
        statusEl.style.color = '#fff';
        section.style.display = 'block';
        viewBtn.style.display = 'inline-block';

        // attach click to open details modal
        viewBtn.onclick = () => openReturnDetailModal(latest);
    } catch (e) {
        console.warn('renderReturnInfo error', e);
    }
}

// Simple return detail modal (appends to body when needed)
async function openReturnDetailModal(returnReqOrId) {
    // If an id was passed, fetch full detail from server
    let detail = null;
    try {
        // Determine id if passed as number or as object with id
        let id = null;
        if (typeof returnReqOrId === 'number' || String(returnReqOrId).match(/^\d+$/)) {
            id = String(returnReqOrId);
        } else if (returnReqOrId && (returnReqOrId.id || returnReqOrId.tra_hang_id)) {
            id = String(returnReqOrId.id || returnReqOrId.tra_hang_id);
        }

        if (id) {
            const resp = await fetch(`${window.API_CONFIG.BASE_URL}/api/tra-hang/${id}`, {
                headers: getToken() ? { 'Authorization': `Bearer ${getToken()}` } : {}
            });
            if (resp.ok) {
                detail = await resp.json();
            } else {
                console.warn('GET /api/tra-hang/:id returned', resp.status);
            }
        }
    } catch (e) {
        console.warn('Failed to fetch return detail from server', e);
    }

        // fallback to whatever was passed
        const returnReq = detail || returnReqOrId || {};

        // If the server returned a related invoice id and its updated status, update UI immediately
        try {
            if (detail && detail.ma_don_hang && detail.orderStatus) {
                // update order status badge in list/modal
                updateOrderStatusInUI(detail.ma_don_hang, detail.orderStatus);
                // Also fetch the latest order detail to keep modal in sync (best-effort)
                try {
                    const latestOrder = await fetchOrderDetail(detail.ma_don_hang);
                    if (latestOrder) {
                        // update global currentOrderData so other parts of the modal use up-to-date data
                        currentOrderData = latestOrder;
                        // update modal fields if modal is open for this order
                        const modalOrderIdEl = document.getElementById('order-id');
                        if (modalOrderIdEl && modalOrderIdEl.textContent.includes(`#${detail.ma_don_hang}`)) {
                            document.getElementById('order-status').textContent = latestOrder.status || latestOrder.tinhtrang || (detail.orderStatus);
                            // use same class heuristics as updateOrderStatusInUI
                            updateOrderStatusInUI(detail.ma_don_hang, latestOrder.status || latestOrder.tinhtrang || detail.orderStatus);
                        }
                    }
                } catch (e) {
                    console.warn('Không thể lấy chi tiết đơn hàng sau khi cập nhật trả hàng:', e.message);
                }
            }
        } catch (e) { console.warn('Error syncing order status from return detail', e); }

    // create modal if not exists
    let modal = document.getElementById('return-detail-modal');
    if (!modal) {
                modal = document.createElement('div');
                modal.id = 'return-detail-modal';
                modal.className = 'modal';
                // inject a minimal inline stylesheet to guarantee visible changes even if external CSS is cached
                modal.innerHTML = `
                <div class="modal-content" style="max-width:800px;">
                    <style>
                        /* Inline fallback styles for return modal (applied immediately) */
                        #return-detail-modal .modal-content{padding:16px;background:#fff;border-radius:12px}
                        #return-detail-modal h2{font-size:1.5rem;margin:0 0 8px}
                        #return-files-list a{display:inline-block;width:96px;height:96px;border-radius:8px;overflow:hidden;margin:8px;border:1px solid rgba(0,0,0,0.06)}
                        #return-files-list a img{width:100%;height:100%;object-fit:cover}
                        #return-history-list .history-item{padding-left:28px;margin-bottom:12px}
                    </style>
                    <span class="close-modal" id="close-return-detail">&times;</span>
                    <div style="padding:8px 6px;">
                        <h2>Chi tiết yêu cầu trả hàng <span id="return-id-label"></span></h2>
                        <p><strong>Lý do:</strong> <span id="return-reason-text"></span></p>
                        <p><strong>Trạng thái:</strong> <span id="return-state-text"></span></p>
                        <div id="return-items-area"><h3>Sản phẩm:</h3><div id="return-items-list"></div></div>
                        <div id="return-files-area" style="margin-top:12px;"><h3>Hình ảnh đính kèm:</h3><div id="return-files-list"></div></div>
                        <div id="return-history-area" style="margin-top:12px;"><h3>Lịch sử:</h3><div id="return-history-list"></div></div>
                    </div>
                </div>`;
        document.body.appendChild(modal);
        document.getElementById('close-return-detail').onclick = () => { modal.style.display = 'none'; };
    }

    // populate
    document.getElementById('return-id-label').textContent = `#${returnReq.id || returnReq.tra_hang_id || ''}`;
    document.getElementById('return-reason-text').textContent = returnReq.ly_do || returnReq.reason || returnReq.note || 'Không có';
    document.getElementById('return-state-text').textContent = returnReq.trang_thai || returnReq.status || 'N/A';

    const base = window.API_CONFIG.BASE_URL;

    const itemsListEl = document.getElementById('return-items-list');
    itemsListEl.innerHTML = '';
    try {
        const items = Array.isArray(returnReq.mat_hang) ? returnReq.mat_hang : (JSON.parse(returnReq.mat_hang || '[]') || []);
        if (items.length === 0) itemsListEl.innerHTML = '<p>Không có sản phẩm</p>';
        items.forEach(it => {
            const name = it.ten_san_pham || it.ten || it.name || it.TenSP || it.productName || 'Sản phẩm';
            const qty = it.so_luong || it.qty || it.quantity || 1;
            const pid = it.ma_san_pham || it.MaSP || it.productId || '';
            const imgPath = it.hinh_anh || it.HinhAnh || (`/uploads/product/${pid}.jpg`);
            const imgUrl = (imgPath && (imgPath.startsWith('http') || imgPath.startsWith('https'))) ? imgPath : (imgPath.startsWith('/') ? base + imgPath : base + '/' + imgPath);
            const row = document.createElement('div');
            row.style.display = 'flex';
            row.style.gap = '8px';
            row.style.alignItems = 'center';
            row.innerHTML = `<img src="${imgUrl}" alt="" style="width:56px;height:56px;object-fit:cover;border:1px solid #ddd;border-radius:6px;"> <div><div><strong>${name}</strong></div><div>Số lượng: ${qty}</div></div>`;
            itemsListEl.appendChild(row);
        });
    } catch (e) { itemsListEl.innerHTML = '<p>Không có sản phẩm</p>'; }

    const filesListEl = document.getElementById('return-files-list');
    filesListEl.innerHTML = '';
    try {
        const files = Array.isArray(returnReq.tep_dinh_kem) ? returnReq.tep_dinh_kem : (JSON.parse(returnReq.tep_dinh_kem || '[]') || []);
        if (files.length === 0) filesListEl.innerHTML = '<p>Không có ảnh đính kèm</p>';
        files.forEach(f => {
            const path = String(f || '');
            const url = path.startsWith('http') ? path : (path.startsWith('/') ? base + path : base + '/uploads/tra_hang/' + path);
            const a = document.createElement('a');
            a.href = url;
            a.target = '_blank';
            a.style.display = 'inline-block';
            a.style.margin = '6px';
            a.innerHTML = `<img src="${url}" style="width:96px;height:96px;object-fit:cover;border:1px solid #ddd;border-radius:6px;">`;
            filesListEl.appendChild(a);
        });
    } catch (e) { filesListEl.innerHTML = '<p>Không có ảnh đính kèm</p>'; }

    const histEl = document.getElementById('return-history-list');
    histEl.innerHTML = '';
    try {
        const history = Array.isArray(returnReq.history) ? returnReq.history : [];
        if (history.length === 0) histEl.innerHTML = '<p>Không có lịch sử</p>';
        history.forEach(h => {
            const row = document.createElement('div');
            row.style.padding = '6px 0';
            row.style.borderBottom = '1px solid #eee';
            const when = new Date(h.created_at || h.createdAt || h.createdAt || '');
            row.innerHTML = `<div><small>${isNaN(when) ? '' : when.toLocaleString()}</small></div><div>${h.trang_thai_cu || h.trang_thai || ''} → ${h.trang_thai_moi || ''} <div style="color:#666">${h.ghi_chu || h.note || ''}</div></div>`;
            histEl.appendChild(row);
        });
    } catch (e) { histEl.innerHTML = '<p>Không có lịch sử</p>'; }

    modal.style.display = 'block';
}

// ✅ HÀM HỦY ĐƠN HÀNG THÔNG MINH - SỬA LẠI HOÀN TOÀN
async function showCancelModalAsync() {
    console.log('🔥 showCancelModal called');
    console.log('Current order data (before refresh):', currentOrderData);
    
    if (!currentOrderData) {
        showErrorToast('Không tìm thấy thông tin đơn hàng');
        return;
    }

    // Best-effort: refresh order from server so UI sees recent admin changes (e.g. PhuongThucThanhToan updated)
    try {
        // currentOrderData.id may be stored as id or MaHD/ma_don_hang depending on flow
        const orderId = currentOrderData.id || currentOrderData.MaHD || currentOrderData.ma_don_hang;
        if (orderId) {
            const fresh = await fetchOrderDetail(orderId);
            if (fresh) {
                // merge fresh data into currentOrderData so downstream checks use up-to-date paymentMethod/status
                currentOrderData = Object.assign({}, currentOrderData, fresh);
                console.log('Refreshed order data from server:', currentOrderData);

                // Update visible order detail fields so refund modal shows correct payment method/status
                try {
                    const pm = currentOrderData.orderPaymentMethod || currentOrderData.paymentMethod || currentOrderData.PhuongThucThanhToan || null;
                    const ps = currentOrderData.paymentStatus || currentOrderData.TrangThaiThanhToan || '';
                    const pmEl = document.getElementById('payment-method');
                    const psEl = document.getElementById('payment-status');
                    if (pmEl && pm) pmEl.textContent = getPaymentMethodName(pm);
                    if (psEl) psEl.textContent = ps || psEl.textContent;
                } catch (e) {
                    console.warn('Could not update order detail DOM after refresh:', e);
                }
            }
        }
    } catch (e) {
        console.warn('Could not refresh order before showing cancel modal:', e);
    }

    // After refresh (or best-effort), decide whether to show refund form or normal cancel
    try {
        // 🔥 PHÂN BIỆT TRƯỜNG HỢP ĐÃ NHẬN TIỀN (mở rộng): kiểm tra paymentStatus, paymentMethod và tinhtrang/status
        console.log('Payment method (post-refresh):', currentOrderData.paymentMethod);
        console.log('Payment status (post-refresh):', currentOrderData.paymentStatus);
        console.log('Order status/tinhtrang (post-refresh):', currentOrderData.status || currentOrderData.tinhtrang);

    // Consider both payment-status and order status (use original vietnamesse `tinhtrang` when available)
    const paidIndicators = ['Đã thanh toán', 'Đang hoàn tiền', 'Đã nhận tiền', 'Đã nhận', 'Paid', 'PAID'];
    const paymentStatus = String(currentOrderData.TrangThaiThanhToan || currentOrderData.paymentStatus || '').toLowerCase();
    const isPaid = paidIndicators.some(ind => paymentStatus.includes(String(ind).toLowerCase()));

    // also consider order.tinhtrang/status values that imply paid — prefer original `tinhtrang` (VN) before mapped `status` (english tokens)
    const orderStatusValue = String(currentOrderData.tinhtrang || currentOrderData.status || '').toLowerCase();
    const paidStatusHints = ['đã giao hàng', 'đã hoàn thành', 'đã thanh toán', 'đã nhận tiền', 'đang hoàn tiền'];
    const statusIndicatesPaid = paidStatusHints.some(s => orderStatusValue.includes(s));

        const shouldShowRefundForm = isPaid || statusIndicatesPaid || (currentOrderData.orderPaymentMethod && String(currentOrderData.orderPaymentMethod).toUpperCase() === 'VNPAY') || (currentOrderData.paymentMethod && String(currentOrderData.paymentMethod).toUpperCase() === 'VNPAY');

        // Ensure cancel modal closed before showing refund modal
        const cancelModal = document.getElementById('cancel-order-modal');
        if (cancelModal) cancelModal.style.display = 'none';

        if (shouldShowRefundForm) {
            // If refund modal elements might be missing, log and try to initialize
            const refundModal = document.getElementById('vnpay-refund-modal');
            const refundForm = document.getElementById('refund-form');
            console.log('Showing refund modal; elements found:', { refundModal: !!refundModal, refundForm: !!refundForm });

            if (!refundModal || !refundForm) {
                console.warn('Refund modal elements not found in DOM. Make sure orders.html contains #vnpay-refund-modal and #refund-form');
            }

            try {
                showVNPayRefundModal(currentOrderData);
            } catch (e) {
                console.error('Error showing refund modal:', e);
                // fallback: if refund modal exists, at least display it
                if (refundModal) refundModal.style.display = 'block';
            }
        } else {
            // Chưa nhận tiền -> Hiển thị modal hủy bình thường
            console.log('✅ Order not paid — showing normal cancel modal');
            showNormalCancelModal();
        }
    } catch (e) {
        console.warn('Error determining cancel/refund UI after refresh:', e);
        showNormalCancelModal();
    }
}
// ✅ MODAL HỦY ĐƠN BÌNH THƯỜNG (COD/Chưa thanh toán)
function showNormalCancelModal() {
    const modal = document.getElementById('cancel-order-modal');
    if (modal) {
        modal.style.display = 'block';
        document.getElementById('cancel-reason').value = '';

        // Gắn event listeners cho modal COD
        attachCODCancelEvents(currentOrderData.id || currentOrderData.MaHD, currentOrderData.paymentMethod || currentOrderData.PhuongThucThanhToan, currentOrderData.paymentStatus || currentOrderData.TrangThaiThanhToan);
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
                const response = await fetch(`${window.API_CONFIG.BASE_URL}/api/orders/customer-orders/cancel/${orderId}`, {
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

                const result = await response.json().catch(() => ({}));
                console.log('cancelOrder -> API response', response.status, result);
                if (!response.ok) {
                    const errMsg = result.error || 'Không thể hủy đơn hàng.';
                    throw new Error(errMsg);
                }

                // 🔥 PHÂN BIỆT KẾT QUẢ TRẢ VỀ
                const payload = result.data || result;
                try {
                    if (result.data && result.data.updatedOrder) {
                        currentOrderData = result.data.updatedOrder;
                        console.log('Applied updatedOrder from cancel response to currentOrderData');
                    }
                } catch (e) { console.warn('Could not apply updatedOrder from cancel response', e); }
                if (payload.cancelType === 'VNPAY_REFUND') {
                    showVNPayCancelSuccessModal(payload);
                } else {
                    showNormalCancelSuccessModal(payload || { orderId });
                }

                // Update UI immediately using server-provided label when available
                const friendly = payload.orderStatus || payload.status || payload.orderStatusLabel || (payload.statusText) || (payload.status && typeof payload.status === 'string' ? payload.status : null) || 'Đã hủy';
                try {
                    updateOrderStatusInUI(orderId, friendly);
                } catch (e) { console.warn('Failed to update UI badge after cancel', e); }

                localStorage.removeItem('currentOrderId');
                hideCancelModal();
                closeOrderDetailModal();
                // await refresh so UI shows latest data
                await renderOrders(customerId, document.getElementById('status-filter')?.value || 'all');
                
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

    // Review modal close handlers
    const closeReview = document.getElementById('close-review-modal');
    if (closeReview) closeReview.addEventListener('click', closeReviewModal);
    const cancelReviewBtn = document.getElementById('cancel-review-btn');
    if (cancelReviewBtn) cancelReviewBtn.addEventListener('click', closeReviewModal);

    // Close review modal when clicking outside
    window.addEventListener('click', (event) => {
        const reviewModal = document.getElementById('review-modal');
        if (event.target === reviewModal) closeReviewModal();
    });
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
            // showErrorToast('Không thể khởi tạo chat');
            console.log('Chat system unavailable - continuing without chat.');
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
        const response = await fetch(`${window.API_CONFIG.BASE_URL}/api/chat/rooms` , {
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
        const response = await fetch(`${window.API_CONFIG.BASE_URL}/api/chat/rooms` , {
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
        const response = await fetch(`${window.API_CONFIG.BASE_URL}/api/chat/rooms/${currentChatRoom.room_id}/messages`, {
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
        const response = await fetch(`${window.API_CONFIG.BASE_URL}/api/chat/messages` , {
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
        const response = await fetch(`${window.API_CONFIG.BASE_URL}/api/chat/rooms/${currentChatRoom.room_id}/messages`, {
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
        const response = await fetch(`${window.API_CONFIG.BASE_URL}/api/chat/rooms/${currentChatRoom.room_id}/messages`, {
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


// ============ MAP ============
var map_cart;
var marker_start = null;
var marker_end = null;
var route = null;

function delete_input(lat, long) {
    // Reset các select/ input chi tiết
    const diachichitiet = document.getElementById('diachichitiet');
    const phuongxa = document.getElementById('phuongxa');
    const tinhthanh = document.getElementById('tinhthanh');

    diachichitiet.value = '';
    phuongxa.selectedIndex = 0;
    quanhuyen.selectedIndex = 0;
    tinhthanh.selectedIndex = 0;
    // Reset map và khoảng cách
    load_map(lat, long);
    document.getElementById('distance').textContent = `0 km`;
    document.getElementById('duration').textContent = `0 phút`;
}

function load_map(lat, long) {
    if (map_cart) {
        map_cart.remove();
    }

    map_cart = L.map('map', {closePopupOnClick: false}).setView([lat, long], 17);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map_cart);

    add_mark(lat, long, 'Bắt đầu', 'start');
}

function add_mark(lat, long, popup_text, type) {
    if (type === 'start' && marker_start) {
        map_cart.removeLayer(marker_start);
    }
    if (type === 'end' && marker_end) {
        map_cart.removeLayer(marker_end);
    }

    var marker = L.marker([lat, long]).addTo(map_cart);
    marker.bindPopup(popup_text).openPopup();

    if (type === 'start') {
        marker_start = marker;
    } else if (type === 'end') {
        marker_end = marker;
    }
}

function search_address(address, lat, long) {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`;

    fetch(url)
        .then(response => response.json())
        .then(data => {
            if (data.length > 0) {
                const toLat = parseFloat(data[0].lat);
                const toLon = parseFloat(data[0].lon);
                map_cart.setView([toLat, toLon], 13);
                add_mark(toLat, toLon, "<b>Điểm đến</b><br>" + address, 'end');
                draw_route(lat, long, toLat, toLon);
            } else {
                alert("Không tìm thấy địa chỉ.");
            }
        })
        .catch(error => {
            console.error("Lỗi khi tìm địa chỉ:", error);
            alert("Đã xảy ra lỗi khi tìm địa chỉ.");
        });
}

function calculate_distance_duration(fromLat, fromLon, toLat, toLon) {
    try {
        const pointA = L.latLng(fromLat, fromLon);
        const pointB = L.latLng(toLat, toLon);
        const distanceInMeters = map_cart.distance(pointA, pointB);
        const distanceInKm = (distanceInMeters / 1000).toFixed(2);

        const estimated_red_lights = Math.floor(distanceInMeters / 500);
        const minute = Math.ceil((distanceInKm / 30) * 60 + estimated_red_lights);

        document.getElementById('distance').textContent = `${distanceInKm} km`;
        document.getElementById('duration').textContent = `${minute} phút`;
    } catch (error) {
        console.error("Lỗi khi tính khoảng cách và thời gian:", error);
        document.getElementById('distance').textContent = `0 km`;
        document.getElementById('duration').textContent = `0 phút`;
    }
}

function draw_route(fromLat, fromLon, toLat, toLon) {
    if (route) {
        map_cart.removeLayer(route);
        route = null;
    }

    const url = `https://router.project-osrm.org/route/v1/driving/${fromLon},${fromLat};${toLon},${toLat}?overview=full&geometries=geojson`;

    fetch(url)
        .then(response => response.json())
        .then(data => {
            if (data.routes && data.routes.length > 0) {
                const routeData = data.routes[0].geometry;
                route = L.geoJSON(routeData, {
                    style: { color: 'green', weight: 4 }
                }).addTo(map_cart);

                map_cart.fitBounds(route.getBounds(), { padding: [10, 10] });
                calculate_distance_duration(fromLat, fromLon, toLat, toLon);
            } else {
                alert("Không tìm được tuyến đường.");
            }
        })
        .catch(error => {
            console.error("Lỗi khi vẽ tuyến đường:", error);
            alert("Đã xảy ra lỗi khi vẽ tuyến đường.");
        });
}

// Lấy địa chỉ đầy đủ từ các select/ input
function getFullAddress() {
    const diachichitiet = document.getElementById('diachichitiet');
    const phuongxa = document.getElementById('phuongxa');
    const tinhthanh = document.getElementById('tinhthanh');

    function getSelectedText(select) {
        const opt = select.options[select.selectedIndex];
        if (!opt || !opt.value || opt.text.includes('-- Chọn')) return '';
        return opt.text;
    }

    const parts = [
        diachichitiet.value.trim() || '',
        getSelectedText(phuongxa),
        getSelectedText(tinhthanh)
    ].filter(part => part !== '');

    return parts.length > 0 ? parts.join(', ') : '';
}

function main() {
    var lat = 10.7599599;
    var long = 106.6818616;
    load_map(lat, long);

    const input_button = document.getElementById('input_button');
    const delete_button = document.getElementById('delete_button');

    input_button.addEventListener('click', function () {
        const fullAddress = getFullAddress();
        if (fullAddress !== '') {
            search_address(fullAddress, lat, long);
        } else {
            alert("Vui lòng chọn địa chỉ đầy đủ.");
        }
    });

    delete_button.addEventListener('click', function () {
        delete_input(lat, long);
    });
}

window.onload = main;


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
        // Ensure Leaflet redraws tiles if container was hidden or resized
        try {
            setTimeout(() => map.invalidateSize(), 0);
            setTimeout(() => map.invalidateSize(), 200);
        } catch (e) { console.warn('invalidateSize error', e); }
}

// Hiển thị bản đồ giao hàng (sử dụng Nominatim + OSRM)
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

            // Start vehicle animation along routePoints
            try {
                // Convert to objects
                const latlngs = routePoints.map(p => ({ lat: p[0], lon: p[1] }));
                startDeliveryVehicle(latlngs);
            } catch (e) { console.warn('startDeliveryVehicle error', e); }

            // Cập nhật thông tin khoảng cách và thời gian
            const distance = (routeData.routes[0].distance / 1000).toFixed(2);
            const duration = Math.round(routeData.routes[0].duration / 60);
            if (distanceInfoElement) distanceInfoElement.textContent = `${distance} km`;
            if (durationInfoElement) durationInfoElement.textContent = `${duration} phút`;
            // Force redraw of tiles after drawing route (useful if map was in a modal)
            try { setTimeout(() => map.invalidateSize(), 100); } catch (e) {}
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
    // Prefer order.orderPaymentMethod (from return API) but fall back to paymentMethod
    const effectivePaymentMethod = (order && (order.orderPaymentMethod || order.paymentMethod || order.PhuongThucThanhToan)) || null;
    console.log('📋 Showing VNPay refund modal for order:', order, 'effectivePaymentMethod=', effectivePaymentMethod);
    
    currentOrderForRefund = Object.assign({}, order, { paymentMethod: effectivePaymentMethod });
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
    const refundTypeEl = document.getElementById('refund-type');
    const refundType = refundTypeEl ? refundTypeEl.value : 'full';
    // Note: the cancel reason select ID in the modal is 'cancel-reason-select'
    const cancelReasonEl = document.getElementById('cancel-reason-select') || document.getElementById('cancel-reason');
    const cancelReason = cancelReasonEl ? (cancelReasonEl.value || '') : '';
    const confirmBankInfo = document.getElementById('confirm-bank-info') ? document.getElementById('confirm-bank-info').checked : false;
    const agreeTerms = document.getElementById('agree-terms') ? document.getElementById('agree-terms').checked : false;
  
  let isValid = true;
  
  // Check basic required fields
  if (!cancelReason || !confirmBankInfo || !agreeTerms) {
    isValid = false;
  }
  
  // Check partial refund amount
    if (refundType === 'partial') {
        const refundAmountEl = document.getElementById('refund-amount');
        const refundAmount = refundAmountEl ? (parseFloat(refundAmountEl.value) || 0) : 0;
        const orderTotal = currentOrderForRefund ? (currentOrderForRefund.totalAmount || currentOrderForRefund.TongTien || 0) : 0;
        if (refundAmount < 1000 || refundAmount > orderTotal) {
            isValid = false;
        }
    }
  
  // Check other reason detail
    if (cancelReason === 'other') {
        const otherDetailEl = document.getElementById('other-reason-detail');
        const otherDetail = otherDetailEl ? (otherDetailEl.value || '').trim() : '';
        if (!otherDetail || otherDetail.length > 500) {
            isValid = false;
        }
    }
  
  // Enable/disable confirm button
    if (confirmBtn) confirmBtn.disabled = !isValid;
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
        
        // Prepare payload and log it for debugging
        const payload = {
            customerId: customerId,
            reason: reasonText,
            refundAmount: refundAmount,
            refundType: refundType,
            // ensure account number is digits only (server expects 8-20 digits)
            bankAccount: bankAccount.replace(/\s/g, ''),
            bankName: finalBankName,
            accountHolder: accountHolder,
            bankBranch: bankBranch || null
        };
        console.log('🔔 Refund cancel payload:', payload);

        const response = await fetch(`${window.API_CONFIG.BASE_URL}/api/orders/customer-orders/cancel/${orderId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getToken()}`
            },
                body: JSON.stringify(payload)
        });
        
        const result = await response.json();
        console.log('📡 API Response:', result);

        if (result.success) {
            // If server returned the updated order row, apply it locally so UI is in sync
            try {
                if (result.data && result.data.updatedOrder) {
                    currentOrderData = result.data.updatedOrder;
                    console.log('Applied updatedOrder from refund response to currentOrderData');
                }
            } catch (e) { console.warn('Could not apply updatedOrder from refund response', e); }
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
    const response = await fetch(`${window.API_CONFIG.BASE_URL}/api/orders/customer-orders/cancel/${orderId}`, {
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
            try {
                if (result.data && result.data.updatedOrder) {
                    currentOrderData = result.data.updatedOrder;
                    console.log('Applied updatedOrder from COD cancel response to currentOrderData');
                }
            } catch (e) { console.warn('Could not apply updatedOrder from COD cancel response', e); }
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
    // Delegate to async implementation (keeps compatibility with existing callers)
    showCancelModalAsync().catch(e => console.error('Error in showCancelModalAsync:', e));
}

// ✅ Export functions to global scope
window.showCancelOrderModalCOD = showCancelOrderModalCOD;
window.processCODCancellation = processCODCancellation;
window.closeCODCancelModal = closeCODCancelModal;
window.attachCODCancelEvents = attachCODCancelEvents;
window.openReturnModal = openReturnModal;
window.submitReturnRequest = submitReturnRequest;
window.hideReturnModal = hideReturnModal;
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

// Utility: update order status badge in list and modal
// NOTE: Do NOT default to 'Đã hủy' here — require callers to pass the exact status text.
function updateOrderStatusInUI(orderId, statusText) {
    try {
        if (!orderId) return console.warn('updateOrderStatusInUI called without orderId');
        if (!statusText) {
            // Defensive: avoid accidentally showing 'Đã hủy' when callers omit the status.
            console.warn('updateOrderStatusInUI called without statusText for order', orderId);
            return;
        }

        // update list card
        const card = document.querySelector(`.order-card[data-order-id="${orderId}"]`);
        if (card) {
            const badge = card.querySelector('.order-status');
            if (badge) {
                badge.textContent = statusText;
                // update class based on keywords (simple heuristic)
                if (/hủy|cancel/i.test(statusText)) {
                    badge.className = `order-status status-cancelled`;
                } else if (/hoàn tiền|refund|chờ hoàn tiền/i.test(statusText)) {
                    badge.className = `order-status status-refunding`;
                } else if (/hoàn thành|đã giao|completed|done/i.test(statusText)) {
                    badge.className = `order-status status-complete`;
                } else {
                    // fallback
                    badge.className = 'order-status';
                }
            }
        }

        // update modal if open and matches
        const modalOrderIdEl = document.getElementById('order-id');
        if (modalOrderIdEl && modalOrderIdEl.textContent.includes(`#${orderId}`)) {
            const modalBadge = document.getElementById('order-status');
            if (modalBadge) {
                modalBadge.textContent = statusText;
                if (/hủy|cancel/i.test(statusText)) {
                    modalBadge.className = `order-status-badge status-cancelled`;
                } else if (/hoàn tiền|refund|chờ hoàn tiền/i.test(statusText)) {
                    modalBadge.className = `order-status-badge status-refunding`;
                } else if (/hoàn thành|đã giao|completed|done/i.test(statusText)) {
                    modalBadge.className = `order-status-badge status-complete`;
                } else {
                    modalBadge.className = 'order-status-badge';
                }
            }
        }
    } catch (e) { console.warn('updateOrderStatusInUI error', e); }
}

// Call cancel API and update UI (use server response when possible)
async function markOrderCancelled(orderId, reason = 'Hủy bởi khách') {
    if (!orderId) return { success: false, error: 'No orderId' };
    if (!checkAuth()) return { success: false, error: 'Not authenticated' };
    try {
        console.log('markOrderCancelled -> request:', { orderId, reason });
        const resp = await fetch(`${window.API_CONFIG.BASE_URL}/api/orders/customer-orders/cancel/${orderId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getToken()}`
            },
            body: JSON.stringify({ customerId: getCustomerId(), reason })
        });
        const data = await resp.json().catch(() => ({}));
        console.log('markOrderCancelled -> response', resp.status, data);
        if (!resp.ok) {
            console.error('Cancel API error', data);
            showErrorToast(`❌ Lỗi hủy: ${data.error || 'Không xác định'}`);
            return { success: false, error: data.error || 'API error', details: data };
        }

        // Prefer server-provided friendly status label if available
        const friendly = data.orderStatus || data.status || 'Đã hủy';
        updateOrderStatusInUI(orderId, friendly);

        // close modal and refresh list
        closeOrderDetailModal();
        showErrorToast('✅ Hủy đơn hàng thành công');
        const customerId = getCustomerId();
        if (customerId) await renderOrders(customerId, document.getElementById('status-filter')?.value || 'all');

        return { success: true, data };
    } catch (e) {
        console.error('markOrderCancelled error', e);
        showErrorToast(`❌ Lỗi hủy: ${e.message}`);
        return { success: false, error: e.message };
    }
}

// export for manual use
window.markOrderCancelled = markOrderCancelled;

// Generic: change order status via API and update UI
async function changeOrderStatus(orderId, newStatus, note = '') {
    if (!orderId) return { success: false, error: 'No orderId' };
    if (!newStatus) return { success: false, error: 'No status provided' };
    try {
        const url = `${window.API_CONFIG.BASE_URL}/api/orders/hoadon/${orderId}/trangthai`;
        const resp = await fetch(url, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                // This endpoint in server is currently open (no auth) per orderRoutes.js; include token if needed
                'Authorization': getToken() ? `Bearer ${getToken()}` : undefined
            },
            body: JSON.stringify({ trangthai: newStatus, ghichu: note })
        });
        const data = await resp.json().catch(() => ({}));
        if (!resp.ok) {
            console.error('changeOrderStatus API error', data);
            return { success: false, error: data.error || 'API error', details: data };
        }

    // Update UI immediately with explicit status returned by API (or provided)
    // If server returns a friendly label, prefer that; otherwise use newStatus.
    const friendly = (data && data.orderStatus) ? data.orderStatus : newStatus;
    updateOrderStatusInUI(orderId, friendly);

        // Refresh list lightly
        const customerId = getCustomerId();
        if (customerId) renderOrders(customerId, document.getElementById('status-filter')?.value || 'all');

        return { success: true, data };
    } catch (e) {
        console.error('changeOrderStatus error', e);
        return { success: false, error: e.message };
    }
}

window.changeOrderStatus = changeOrderStatus;

// ✅ Export hàm xử lý modal đổi địa chỉ
window.closeAddressChangeModal = closeAddressChangeModal;
window.confirmAddressChange = confirmAddressChange;

// ✅ HÀM KIỂM TRA ĐỊA CHỈ HỒ CHÍ MINH
function isHCMAddress(province) {
    if (!province) return false;
    
    const hcmKeywords = [
        'hồ chí minh', 
        'ho chi minh', 
        'hcm', 
        'tp.hcm',
        'tp hcm',
        'thành phố hồ chí minh',
        'thanh pho ho chi minh',
        'sài gòn',
        'saigon',
        '79', // Mã tỉnh HCM (API cũ)
        '50'  // Mã tỉnh HCM (API mới)
    ];
    
    const provinceLower = String(province).toLowerCase().trim();
    return hcmKeywords.some(keyword => 
        provinceLower.includes(keyword)
    );
}

// ----- Star rating widget helpers -----
function setStarRatingUI(rating) {
    const input = document.getElementById('review-rating');
    const stars = document.querySelectorAll('#review-stars .star');
    if (input) input.value = String(rating || 0);
    stars.forEach(s => {
        const v = Number(s.dataset.value || 0);
        if (v <= rating) s.classList.add('filled'); else s.classList.remove('filled');
    });
}

function initStarRating() {
    const container = document.getElementById('review-stars');
    if (!container) return;
    if (container._initialized) return;
    container._initialized = true;
    const stars = container.querySelectorAll('.star');
    stars.forEach(star => {
        star.addEventListener('click', (e) => {
            const v = Number(star.dataset.value || 0);
            setStarRatingUI(v);
        });
        star.addEventListener('mouseover', (e) => {
            const hv = Number(star.dataset.value || 0);
            stars.forEach(s => {
                if (Number(s.dataset.value) <= hv) s.classList.add('hover'); else s.classList.remove('hover');
            });
        });
        star.addEventListener('mouseout', () => {
            stars.forEach(s => s.classList.remove('hover'));
        });
    });
    // keyboard support
    container.setAttribute('tabindex', '0');
    container.addEventListener('keydown', (e) => {
        const input = document.getElementById('review-rating');
        let val = Number(input?.value || 0);
        if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
            val = Math.max(1, val - 1); setStarRatingUI(val); e.preventDefault();
        } else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
            val = Math.min(5, val + 1); setStarRatingUI(val); e.preventDefault();
        } else if (/^[1-5]$/.test(e.key)) {
            setStarRatingUI(Number(e.key));
            e.preventDefault();
        }
    });
}
