document.addEventListener('DOMContentLoaded', function () {
  loadUserProfile();
  loadWishlist();
  loadPromoCodes();
  setupUpdateButton();
  setupSidebarNavigation();
  setupChangePasswordButton();
  setupLogoutHandler();

  // Hiển thị thông tin tài khoản mặc định khi vào trang
  displayUserProfile();
});


/*---------------------------------Load section---------------------------------*/
async function loadUserProfile() {
  const token = (document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1] || null);
  if (!token) {
    window.location.href = 'login.html';
    return;
  }

  try {
    const response = await fetch(`${window.API_CONFIG.BASE_URL}/api/client/profile`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const responseData = await response.json();
    const data = responseData.data || responseData;

    if (!response.ok) {
      throw new Error(responseData.error || responseData.message || 'Không thể lấy thông tin người dùng');
    }

    if (!data.user) {
      throw new Error('Dữ liệu người dùng không hợp lệ từ server');
    }

    const user = data.user;

    // Chỉ lưu vào localStorage
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('customerId', user.makh);

    renderSidebarUserInfo()

    // Kiểm tra cảnh báo
    const warningBox = document.querySelector('.warning');
    const updateLink = document.querySelector('.update-link');

    const isMissingInfo = !(user.tenkh || user.hoten) || !user.sdt || !user.email;

    if (warningBox) {
      warningBox.style.display = isMissingInfo ? 'block' : 'none';
    }

    if (updateLink && !updateLink.dataset.bound) {
      updateLink.addEventListener('click', (e) => {
        e.preventDefault();
        displayUserProfile();
      });
      updateLink.dataset.bound = 'true';
    }

  } catch (error) {
    console.error('Lỗi khi tải hồ sơ:', error);
    showNotification_khan?.('error', 'Không thể tải thông tin hồ sơ');
  }
}

function renderSidebarUserInfo() {
  const user = JSON.parse(localStorage.getItem('user'));
  const nameEl = document.getElementById('user-name');
  const emailEl = document.getElementById('user-email');

  if (!user || !nameEl || !emailEl) return;

  nameEl.textContent = user.tenkh || user.hoten || 'Chưa có tên';
  emailEl.textContent = user.email || 'Chưa có email';
}


function renderReceiveAddress() {
  // lấy user từ localStorage
  const user = JSON.parse(localStorage.getItem('user')) || {};
  const receiveName = document.getElementById('receive-name');
  const receiveAddress = document.getElementById('receive-address');
  const receivePhone = document.getElementById('receive-phone');

  if (!receiveName || !receiveAddress || !receivePhone) return;

  if (receiveName) receiveName.textContent = user.tenkh || user.hoten || 'Chưa có';
  if (receiveAddress) receiveAddress.textContent = user.diachi || 'Chưa có địa chỉ';
  if (receivePhone) receivePhone.textContent = user.sdt || 'Chưa có số điện thoại';
}



function loadWishlist() {
  const wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];
  const container = document.getElementById('wishlist-products');
  if (!container) return;

  if (!wishlist.length) {
    container.className = 'flex flex-col items-center justify-center py-20 w-full col-span-full';
    container.innerHTML = `
      <div class="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6">
        <i class="fas fa-heart text-4xl text-gray-200"></i>
      </div>
      <p class="text-lg font-black text-gray-800 uppercase tracking-tighter mb-2">Danh sách trống</p>
      <p class="text-sm text-gray-400 font-medium italic mb-8">Hãy chọn cho mình những cuốn sách yêu thích nhé!</p>
      <a href="book.html" class="bg-primary text-white px-8 py-3 rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-105 transition-all">Khám phá ngay</a>
    `;
    return;
  }

  container.className = 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 pt-4';
  container.innerHTML = wishlist.map(product => `
    <div class="product-card group bg-white border border-border rounded-2xl p-4 transition-all hover:shadow-xl hover:shadow-primary/5 hover:border-primary/20 relative">
      <button class="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-white/80 backdrop-blur-sm text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all z-10 shadow-sm opacity-0 group-hover:opacity-100" 
              onclick="removeFromWishlist('${product.id}')" title="Xóa khỏi yêu thích">
        <i class="fas fa-trash-alt text-xs"></i>
      </button>
      
      <a href="product_detail.html?id=${product.id}" 
         onclick="saveProductBeforeRedirect(${JSON.stringify(product).replace(/"/g, '&quot;')})"
         class="block space-y-4">
        <div class="aspect-[3/4] rounded-xl overflow-hidden bg-gray-50 border border-border/50">
          <img src="img/product/${product.image || 'default-book.jpg'}" 
               alt="${product.name}" 
               class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
               onerror="this.src='https://via.placeholder.com/300x400?text=Book'">
        </div>
        <div class="space-y-1">
          <h3 class="text-xs font-black text-gray-800 line-clamp-2 leading-tight min-h-[2.5rem] group-hover:text-primary transition-colors">${product.name}</h3>
          <div class="flex items-center justify-between pt-2">
            <span class="text-sm font-black text-primary tracking-tighter">${formatPrice(product.price)}</span>
            <span class="text-[9px] font-bold text-gray-400 uppercase tracking-widest">ID: ${product.id}</span>
          </div>
        </div>
      </a>
      
      <div class="pt-4 border-t border-gray-50 mt-4">
         <button onclick="addToCart('${product.id}', 1, '${product.name.replace(/'/g, "\\'")}', ${product.price}, '${product.image}')" 
                 class="w-full py-2.5 bg-gray-50 hover:bg-primary hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2">
           <i class="fas fa-shopping-cart text-[9px]"></i> Thêm vào giỏ
         </button>
      </div>
    </div>
  `).join('');
}


async function loadPromoCodes() {
  // If user is logged in, prefer server list to keep data authoritative
  const token = (document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1] || null);
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  let promoList = [];

  if (token && user && user.makh) {
    try {
      // Try server endpoint that returns issued coupons + promotion info
      const res = await fetch(`${window.API_CONFIG.BASE_URL}/api/coupons/my-coupons?makh=${user.makh}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const json = await res.json();
      if (res.ok && Array.isArray(json.data)) {
        promoList = json.data.map(row => ({
          MaPhatHanh: row.MaPhatHanh || null,
          MaPhieu: row.MaPhieu || row.MaPhieu || null,
          code: row.MaPhieu || row.MaPhieu || null,
          MaKM: row.promotion ? row.promotion.MaKM : (row.MaKM || null),
          LoaiKM: row.promotion ? row.promotion.LoaiKM : null,
          MoTa: row.MoTa || null,
          NgayLay: row.NgayPhatHanh || row.Ngay_lay || null,
          NgayHetHan: null,
          trang_thai: row.Status === 'used' || row.NgaySuDung ? 'Da_su_dung' : (row.TrangThai === 0 ? 'Ngung' : 'Chua_su_dung'),
          __source: 'server'
        }));

        // Persist to localStorage so other pages can use cached copy
        try { localStorage.setItem('myPromos', JSON.stringify(promoList)); } catch (e) { /* ignore */ }
      }
    } catch (e) {
      console.warn('Failed to fetch my-coupons from server, falling back to localStorage', e);
    }
  }

  if (!promoList || promoList.length === 0) {
    // Fallback to localStorage if server returned nothing or user not logged in
    const promoListRaw = JSON.parse(localStorage.getItem('myPromos') || '[]');
    promoList = (promoListRaw || []).filter(p => {
      try { return !p.status || String(p.status).toLowerCase().trim() !== 'used'; } catch (e) { return true; }
    });
  }
  const container = document.getElementById('promo-codes-list');
  if (!container) return;

  if (!promoList.length) {
    container.innerHTML = '<p class="empty-wishlist">Bạn không có mã khuyến mãi chưa sử dụng.</p>';
    return;
  }

  container.innerHTML = promoList.map(promo => `
    <div class="promo-code-card" data-makm="${promo.MaKM || promo.makm || ''}" style="cursor:pointer">
      <div class="promo-code-title"><i class="fas fa-ticket-alt"></i> Mã ưu đãi</div>
      <div class="promo-code-value">${promo.code || promo.MaPhieu || ''}</div>
      <div class="promo-code-expiry">Ngày nhận: ${promo.ngay_lay || ''}</div>
      ${promo.expiry ? `<div class="promo-code-expiry">HSD: ${promo.expiry}</div>` : ''}
      <div class="promo-code-status">${promo.status || ''}</div>
    </div>
  `).join('');

  setupPromoDetailEvents();
}
/*---------------------------------Load section---------------------------------*/



/*---------------------------------Hiện section---------------------------------*/
function setupSidebarNavigation() {
  const sidebarItems = document.querySelectorAll('.sidebar ul li[data-section]');
  let currentActive = null;

  // Handle external links (orders.html, refund-history.html)
  const externalLinkItems = document.querySelectorAll('.sidebar ul li:not([data-section])');
  externalLinkItems.forEach(item => {
    item.addEventListener('mouseenter', function () {
      // Remove active from other items when hovering external links
      sidebarItems.forEach(i => i.classList.remove('active'));
    });
  });

  sidebarItems.forEach(item => {
    item.addEventListener('click', function () {
      const sectionId = this.getAttribute('data-section');
      const sectionEl = document.getElementById(sectionId);

      // Ẩn tất cả section
      document.querySelectorAll('.main-content .section').forEach(s => s.style.display = 'none');

      // Bỏ active cũ
      sidebarItems.forEach(i => i.classList.remove('active'));

      // Tô màu mục mới
      this.classList.add('active');
      currentActive = this;

      // Hiển thị section tương ứng
      switch (sectionId) {
        case 'user-profile':
          displayUserProfile();
          break;
        case 'wishlist':
          displayWishlist();
          break;
        case 'promo-codes':
          displayPromoCodes();
          break;
        case 'change-password':
          displayChangePassword?.();
          break;
        case 'gtgt-info':
          displayInvoiceInfo?.();
          break;
        case 'address-book':
          displayAddressBook?.();
          break;
        case 'membership-card':
          // render membership before showing
          renderMembershipCard?.();
          showSection('membership-card');
          break;
        case 'order-history':
          displayOrderHistory?.();
          break;
        case 'reviewed-orders':
          displayReviewedOrders?.();
          break;
        default:
          showSection(sectionId);
          break;
      }
    });
  });
}



function showSection(sectionId) {
  const target = document.getElementById(sectionId);

  if (!target) return;

  const isVisible = target.style.display === 'block';

  // Ẩn tất cả section
  document.querySelectorAll('.main-content .section').forEach(s => s.style.display = 'none');

  // Nếu section đang hiển thị → không hiển thị lại
  if (!isVisible) {
    target.style.display = 'block';
    displayAccountInfo(); // Chỉ gọi khi section thực sự được hiển thị
  }
}

function displayAccountInfo() {
  const accountInfoSection = document.getElementById('account-info');
  if (accountInfoSection) {
    accountInfoSection.style.display = 'block';
  }
}

function displayUserProfile() {

  showSection('profile');

  // Nạp dữ liệu người dùng
  const user = JSON.parse(localStorage.getItem('user'));
  if (!user) {
    window.location.href = 'login.html';
    return;
  }

  const hotenInput = document.getElementById('hoten');
  const sdtInput = document.getElementById('sodienthoai');
  const emailInput = document.getElementById('email');

  if (hotenInput) hotenInput.value = user.tenkh || user.hoten || '';
  if (sdtInput) sdtInput.value = user.sdt || '';
  if (emailInput) {
    emailInput.value = user.email || '';
  }
}

function displayAddressBook() {
  showSection('address-book');

  const addressbookSection = document.getElementById('address-book');
  if (addressbookSection) {
    addressbookSection.style.display = 'block';
    renderReceiveAddress()
  }
}

function displayOrderHistory() {
  showSection('order-history');

  const orderhistorySection = document.getElementById('order-history');
  if (orderhistorySection) {
    orderhistorySection.style.display = 'block';
  }
}

// Hiển thị đơn hàng đã đánh giá
function displayReviewedOrders() {
  showSection('reviewed-orders');
  // tải danh sách
  loadReviewedOrders();
}

// Escape HTML an toàn
function escapeHtml(text) {
  if (text == null) return '';
  return String(text).replace(/[&<>"']/g, function (s) {
    return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[s];
  });
}

// Lấy review cho một đơn hàng
async function fetchOrderReview(orderId) {
  const token = (document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1] || null);
  if (!token) return null;
  try {
    const resp = await fetch(`${window.API_CONFIG.BASE_URL}/api/orderreview/${orderId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!resp.ok) return null;
    const responseData = await resp.json();
    const data = responseData.data || responseData;
    // server returns { review: ... } — return the inner review object (or null)
    return (data && data.review) ? data.review : (data && data.MaDG ? data : null);
  } catch (e) {
    console.warn('fetchOrderReview error', e);
    return null;
  }
}

// Tải và render các đơn hàng đã được đánh giá
async function loadReviewedOrders() {
  const listEl = document.getElementById('reviewed-orders-list');
  if (!listEl) return;
  listEl.innerHTML = '<p>Đang tải...</p>';

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const customerId = user.makh || user.id || localStorage.getItem('customerId');
  const token = (document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1] || null);
  if (!customerId || !token) {
    listEl.innerHTML = '<p>Vui lòng đăng nhập để xem danh sách.</p>';
    return;
  }

  try {
    const resp = await fetch(`${window.API_CONFIG.BASE_URL}/api/orders/customer-orders/${customerId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!resp.ok) throw new Error('Không thể lấy đơn hàng');
    const responseData = await resp.json();
    const orders = responseData.data || responseData;

    // Kiểm tra review cho từng đơn (song song)
    const checks = await Promise.all(orders.map(async o => {
      const review = await fetchOrderReview(o.id);
      return { order: o, review };
    }));

    // Chỉ lấy những đơn đã có review
    const reviewed = checks.filter(c => c.review).map(c => ({ order: c.order, review: c.review }));

    if (!reviewed.length) {
      listEl.innerHTML = `
        <div class="flex flex-col items-center justify-center py-20 text-center">
          <div class="w-20 h-20 bg-yellow-50 rounded-full flex items-center justify-center mb-4">
            <i class="fas fa-star text-4xl text-yellow-300"></i>
          </div>
          <p class="text-base font-black text-gray-700 uppercase tracking-tight">Chưa có đánh giá</p>
          <p class="text-sm text-gray-400 mt-1">Bạn chưa đánh giá đơn hàng nào.</p>
        </div>`;
      return;
    }

    // Render chỉ phần đã đánh giá
    const header = `
      <div class="flex items-center gap-3 mb-6">
        <div class="w-8 h-8 bg-yellow-400 rounded-xl flex items-center justify-center shadow-sm">
          <i class="fas fa-star text-white text-sm"></i>
        </div>
        <h3 class="text-base font-black text-gray-800 uppercase tracking-tight">Đã đánh giá <span class="text-primary">(${reviewed.length})</span></h3>
      </div>`;

    const cards = `<div class="grid grid-cols-1 md:grid-cols-2 gap-4">` + reviewed.map(r => {
      const o = r.order;
      const rv = r.review || {};
      const rating = Number(rv.rating || rv.SoSao || rv.so_diem || rv.SoDiem || 0);
      const comment = rv.NhanXet || rv.comment || rv.noi_dung || '';
      const created = new Date(o.createdAt || o.NgayTao || o.NgayDat || Date.now()).toLocaleDateString('vi-VN');
      const stars = '★'.repeat(Math.min(5, Math.max(0, rating))) + '☆'.repeat(Math.max(0, 5 - Math.min(5, Math.max(0, rating))));
      const total = formatPrice(o.totalAmount || o.TongTien || o.TongTienThanhToan || 0);
      return `
        <div class="bg-white border border-gray-100 rounded-2xl p-5 hover:shadow-lg hover:border-primary/20 transition-all duration-300 group" data-order-id="${o.id}">
          <div class="flex items-start justify-between mb-3">
            <div>
              <div class="flex items-center gap-2">
                <span class="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Đơn hàng</span>
                <span class="text-sm font-black text-gray-800">#${o.id}</span>
              </div>
              <p class="text-[10px] text-gray-400 font-medium mt-0.5">${created}</p>
            </div>
            <div class="text-right">
              <div class="text-lg text-yellow-400 tracking-widest leading-none">${stars}</div>
              <p class="text-[10px] text-gray-400 mt-1">${rating}/5 sao</p>
            </div>
          </div>

          <div class="border-t border-dashed border-gray-100 pt-3 mb-3">
            <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Tổng tiền</p>
            <p class="text-lg font-black text-gray-800 tracking-tighter">${total}</p>
          </div>

          ${comment ? `
          <div class="bg-gray-50 rounded-xl p-3 mb-4">
            <p class="text-xs text-gray-500 leading-relaxed italic">"${escapeHtml(comment).slice(0, 180)}${comment.length > 180 ? '…' : ''}"</p>
          </div>` : `
          <div class="bg-gray-50 rounded-xl p-3 mb-4">
            <p class="text-xs text-gray-400 italic">Không có nhận xét</p>
          </div>`}

          <button
            onclick="openOrderDetailFromProfile('${o.id}')"
            class="w-full py-2.5 bg-primary/5 hover:bg-primary hover:text-white text-primary rounded-xl text-[11px] font-black uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 group-hover:shadow-md">
            <i class="fas fa-eye text-xs"></i> Xem chi tiết
          </button>
        </div>`;
    }).join('') + `</div>`;

    listEl.innerHTML = header + cards;

  } catch (err) {
    console.error('loadReviewedOrders error', err);
    listEl.innerHTML = '<div class="error-message">Không thể tải danh sách. Vui lòng thử lại sau.</div>';
  }
}

// Review modal logic for profile page
// Helper: open order detail from profile page. Tries to call global showOrderDetail(order).
window.openOrderDetailFromProfile = async function (orderId) {
  try {
    // If showOrderDetail is available, try to obtain the full order object then call it
    if (typeof window.showOrderDetail === 'function') {
      let orderObj = null;
      // If there is a global fetchOrderDetail helper, use it
      if (typeof window.fetchOrderDetail === 'function') {
        try {
          orderObj = await window.fetchOrderDetail(orderId);
        } catch (e) {
          console.warn('fetchOrderDetail failed, will try fetch API', e);
        }
      }

      // Fallback: call API directly
      if (!orderObj) {
        try {
          const token = (document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1] || null);
          const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
          const resp = await fetch(`${window.API_CONFIG.BASE_URL}/api/orders/${orderId}`, { headers });
          if (resp.ok) orderObj = await resp.json();
        } catch (e) {
          console.warn('Direct order fetch failed', e);
        }
      }

      if (orderObj) {
        try {
          window.showOrderDetail(orderObj);
          return;
        } catch (e) {
          console.warn('showOrderDetail failed', e);
        }
      }
    }

    // Fallback: store id and navigate to orders page
    localStorage.setItem('currentOrderId', String(orderId));
    window.location.href = 'orders.html';
  } catch (err) {
    console.error('openOrderDetailFromProfile error', err);
    localStorage.setItem('currentOrderId', String(orderId));
    window.location.href = 'orders.html';
  }
};
let _currentProfileReviewOrderId = null;
function openProfileReviewModal(orderId) {
  _currentProfileReviewOrderId = orderId;
  const modal = document.getElementById('review-modal');
  if (!modal) return;
  document.getElementById('review-order-id').textContent = `#${orderId}`;
  document.getElementById('review-rating').value = '5';
  document.getElementById('review-comment').value = '';

  // load existing review if any
  fetchOrderReview(orderId).then(rv => {
    if (!rv) return;
    document.getElementById('review-rating').value = String(rv.rating || rv.so_diem || 5);
    document.getElementById('review-comment').value = rv.comment || rv.noi_dung || '';
  }).catch(() => { });

  modal.style.display = 'block';
}

function closeProfileReviewModal() {
  const modal = document.getElementById('review-modal');
  if (modal) modal.style.display = 'none';
  _currentProfileReviewOrderId = null;
}

async function submitProfileReview() {
  if (!_currentProfileReviewOrderId) return;
  const orderId = _currentProfileReviewOrderId;
  const rating = Number(document.getElementById('review-rating').value || 5);
  const comment = document.getElementById('review-comment').value || '';
  const token = (document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1] || null);
  if (!token) { alert('Vui lòng đăng nhập'); return; }
  try {
    const resp = await fetch(`${window.API_CONFIG.BASE_URL}/api/orderreview/${orderId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ rating, comment })
    });
    const payload = await resp.json().catch(() => ({}));
    if (!resp.ok) throw new Error(payload.error || payload.message || 'Lỗi khi gửi đánh giá');
    // success
    alert('Gửi đánh giá thành công');
    closeProfileReviewModal();
    // reload lists
    loadReviewedOrders();
  } catch (e) {
    console.error('submitProfileReview error', e);
    alert('Không thể gửi đánh giá: ' + (e.message || e));
  }
}

// wire modal buttons once DOM is ready
document.addEventListener('DOMContentLoaded', function () {
  const closeBtn = document.getElementById('close-review-modal');
  const cancelBtn = document.getElementById('cancel-review-btn');
  const submitBtn = document.getElementById('submit-review-btn');
  if (closeBtn) closeBtn.addEventListener('click', closeProfileReviewModal);
  if (cancelBtn) cancelBtn.addEventListener('click', closeProfileReviewModal);
  if (submitBtn) submitBtn.addEventListener('click', function (ev) { ev.stopPropagation(); submitProfileReview(); });

  // close when clicking outside modal content
  window.addEventListener('click', function (e) {
    const modal = document.getElementById('review-modal');
    if (modal && e.target === modal) closeProfileReviewModal();
  });
});


function displayWishlist() {
  showSection('wishlist');
  loadWishlist(); // Use the refined loadWishlist function
}


function displayPromoCodes() {
  showSection('promo-codes'); // Hiển thị section mã khuyến mãi
  const promoListRaw = JSON.parse(localStorage.getItem('myPromos') || '[]');
  // Only display unused promos
  const promoList = (promoListRaw || []).filter(p => {
    try {
      return !p.status || String(p.status).toLowerCase().trim() !== 'used';
    } catch (e) {
      return true;
    }
  });
  const container = document.getElementById('promo-codes-list');
  if (!container) return;

  if (!promoList.length) {
    container.innerHTML = '<p class="empty-wishlist">Bạn không có mã khuyến mãi chưa sử dụng.</p>';
    return;
  }

  container.innerHTML = promoList.map(promo => `
    <div class="promo-code-card" data-makm="${promo.MaKM || promo.makm || ''}" style="cursor:pointer">
      <div class="promo-code-title"><i class="fas fa-ticket-alt"></i> Mã ưu đãi</div>
      <div class="promo-code-value">${promo.code || promo.MaPhieu || ''}</div>
      <div class="promo-code-expiry">Ngày nhận: ${promo.ngay_lay || ''}</div>
      ${promo.expiry ? `<div class="promo-code-expiry">HSD: ${promo.expiry}</div>` : ''}
      <div class="promo-code-status">${promo.status || ''}</div>
    </div>
  `).join('');

  setupPromoDetailEvents();
}


function displayChangePassword() {
  showSection('change-password');

  // Gắn sự kiện nếu chưa gắn
  const btn = document.getElementById('changePasswordBtn');
  if (btn && !btn.dataset.bound) {
    setupChangePasswordButton();
    btn.dataset.bound = 'true';
  }
}


function displayInvoiceInfo() {
  showSection('gtgt-info');

  // Nạp dữ liệu hóa đơn nếu có
  const invoiceData = JSON.parse(localStorage.getItem('gtgt'));
  if (!invoiceData) return;

  const buyerNameInput = document.getElementById('buyerName');
  const companyNameInput = document.getElementById('companyName');
  const companyAddressInput = document.getElementById('companyAddress');
  const taxCodeInput = document.getElementById('taxCode');
  const invoiceEmailInput = document.getElementById('invoiceEmail');

  if (buyerNameInput) buyerNameInput.value = invoiceData.buyerName || '';
  if (companyNameInput) companyNameInput.value = invoiceData.companyName || '';
  if (companyAddressInput) companyAddressInput.value = invoiceData.companyAddress || '';
  if (taxCodeInput) taxCodeInput.value = invoiceData.taxCode || '';
  if (invoiceEmailInput) invoiceEmailInput.value = invoiceData.invoiceEmail || '';
}
/*-------------------------------------------------------------------------------*/

// Membership rendering (fetch latest profile first, fallback to localStorage)
async function renderMembershipCard() {
  const container = document.getElementById('membershipCardContainer');
  if (!container) return;

  // Try to fetch fresh profile (so we get loyalty_points) if token present
  let user = JSON.parse(localStorage.getItem('user') || '{}');
  const token = (document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1] || null);
  if (token) {
    try {
      const res = await fetch(`${window.API_CONFIG.BASE_URL}/api/client/profile`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` }
      });
      const responseData = await res.json();
      const js = responseData.data || responseData;
      if (res.ok && js.user) {
        user = js.user;
        localStorage.setItem('user', JSON.stringify(user));
      }
    } catch (err) {
      // ignore fetch error and fall back to localStorage
      console.warn('Could not refresh profile for membership card', err);
    }
  }

  // Define tier-specific styling
  const tierConfigs = {
    'Đồng': {
      gradient: 'from-[#804A00] to-[#B08D57]',
      textColor: 'text-orange-100',
      icon: 'fa-medal',
      benefits: 'Giảm giá 0%',
      nextLabel: 'Bạc'
    },
    'Bạc': {
      gradient: 'from-[#757F9A] to-[#D7DDE8]',
      textColor: 'text-blue-100',
      icon: 'fa-award',
      benefits: 'Giảm giá 3%',
      nextLabel: 'Vàng'
    },
    'Vàng': {
      gradient: 'from-[#F2994A] to-[#F2C94C]',
      textColor: 'text-yellow-100',
      icon: 'fa-crown',
      benefits: 'Giảm giá 7%',
      nextLabel: 'Tối đa'
    }
  };

  // === Derive membership variables from user data ===
  const points = Number(user.loyalty_points || user.diem_tich_luy || user.DiemTichLuy || 0);
  const customerId = user.makh || user.id || 'N/A';

  // Determine tier based on points
  let tier = 'Đồng';
  if (points >= 5000) tier = 'Vàng';
  else if (points >= 1000) tier = 'Bạc';

  // Progress bar & next threshold
  let nextThreshold = 1000;
  let currentMin = 0;
  if (tier === 'Đồng') { currentMin = 0; nextThreshold = 1000; }
  else if (tier === 'Bạc') { currentMin = 1000; nextThreshold = 5000; }
  else { currentMin = 5000; nextThreshold = 5000; } // Vàng is max

  const progress = tier === 'Vàng'
    ? 100
    : Math.min(100, Math.round(((points - currentMin) / (nextThreshold - currentMin)) * 100));

  const config = tierConfigs[tier] || tierConfigs['Đồng'];

  container.innerHTML = `
    <div class="membership-card-v2 relative w-full overflow-hidden bg-gradient-to-br ${config.gradient} p-8 rounded-[32px] shadow-2xl text-white group">
      <!-- Decorative Elements -->
      <div class="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700"></div>
      <div class="absolute -left-10 -bottom-10 w-40 h-40 bg-black/10 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700"></div>
      
      <div class="relative z-10 flex flex-col h-full justify-between gap-8">
        <div class="flex justify-between items-start">
          <div class="space-y-1">
            <p class="text-[10px] font-black uppercase tracking-[0.3em] opacity-80">THẺ THÀNH VIÊN</p>
            <h3 class="text-3xl font-display font-black tracking-tight">${tier}</h3>
          </div>
          <div class="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-inner border border-white/30">
            <i class="fas ${config.icon} text-2xl"></i>
          </div>
        </div>

        <div class="space-y-4">
          <div class="flex justify-between items-end">
            <div class="space-y-1">
              <p class="text-[10px] font-black uppercase tracking-widest opacity-80">ĐIỂM TÍCH LŨY</p>
              <p class="text-4xl font-black tracking-tighter">${new Intl.NumberFormat('vi-VN').format(points)} <span class="text-sm font-medium opacity-80">điểm</span></p>
            </div>
            <button id="viewBenefitsBtn" class="px-5 py-2.5 bg-white/20 backdrop-blur-md border border-white/30 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-gray-800 transition-all shadow-lg active:scale-95">Quyền lợi</button>
          </div>

          <div class="space-y-2">
            <div class="w-full h-3 bg-black/20 rounded-full overflow-hidden p-0.5 border border-white/10">
              <div class="h-full bg-white rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(255,255,255,0.5)]" style="width: 0%" id="membership-progress-fill"></div>
            </div>
            <div class="flex justify-between text-[9px] font-black uppercase tracking-widest opacity-80">
              <span>Hạng hiện tại</span>
              <span>Tới hạng ${config.nextLabel}: ${new Intl.NumberFormat('vi-VN').format(nextThreshold)} điểm</span>
            </div>
          </div>
        </div>

        <div class="pt-6 border-t border-white/10 flex justify-between items-center">
          <div class="space-y-0.5">
            <p class="text-[8px] font-black uppercase tracking-widest opacity-60">MÃ KHÁCH HÀNG</p>
            <p class="text-sm font-bold tracking-widest">${customerId}</p>
          </div>
          <img src="img/logo-white.png" alt="Logo" class="h-6 opacity-40" onerror="this.style.display='none'">
        </div>
      </div>
    </div>
  `;

  // Animate progress bar
  setTimeout(() => {
    const fill = document.getElementById('membership-progress-fill');
    if (fill) fill.style.width = progress + '%';
  }, 100);

  const btn = document.getElementById('viewBenefitsBtn');
  if (btn) btn.addEventListener('click', () => {
    const modalContent = `
      <div class="space-y-6">
        <div class="flex items-center gap-4 border-b border-border pb-4">
          <div class="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
            <i class="fas ${config.icon} text-xl"></i>
          </div>
          <div>
            <h3 class="text-xl font-display font-black text-gray-800 uppercase">Hạng ${tier}</h3>
            <p class="text-xs font-bold text-primary tracking-widest uppercase">${config.benefits}</p>
          </div>
        </div>
        
        <div class="space-y-4">
          <div class="flex gap-4 p-4 bg-gray-50 rounded-2xl border border-border">
            <div class="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-primary shadow-sm flex-shrink-0">
                <i class="fas fa-percent"></i>
            </div>
            <div>
                <p class="text-xs font-black text-gray-800 uppercase mb-1">Giảm giá trực tiếp</p>
                <p class="text-xs text-gray-500 leading-relaxed font-medium">Mức giảm giá được áp dụng tự động trên tổng tiền đơn hàng khi thanh toán.</p>
            </div>
          </div>
          <div class="flex gap-4 p-4 bg-gray-50 rounded-2xl border border-border">
            <div class="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-primary shadow-sm flex-shrink-0">
                <i class="fas fa-truck-fast"></i>
            </div>
            <div>
                <p class="text-xs font-black text-gray-800 uppercase mb-1">Ưu đãi vận chuyển</p>
                <p class="text-xs text-gray-500 leading-relaxed font-medium">${tier === 'Vàng' ? 'Miễn phí vận chuyển cho mọi đơn hàng.' : (tier === 'Bạc' ? 'Freeship cho đơn hàng từ 200.000₫.' : 'Tích điểm để nhận ưu đãi freeship.')}</p>
            </div>
          </div>
          <div class="flex gap-4 p-4 bg-gray-50 rounded-2xl border border-border">
            <div class="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-primary shadow-sm flex-shrink-0">
                <i class="fas fa-star-half-stroke"></i>
            </div>
            <div>
                <p class="text-xs font-black text-gray-800 uppercase mb-1">Hệ số tích điểm</p>
                <p class="text-xs text-gray-500 leading-relaxed font-medium">Tích điểm dựa trên số tiền thực tế đã thanh toán: ${tier === 'Vàng' ? 'Nhân hệ số x1.5' : (tier === 'Bạc' ? 'Nhân hệ số x1.2' : 'Hệ số mặc định x1.0')}.</p>
            </div>
          </div>
        </div>
        
        <p class="text-[10px] text-gray-400 font-medium italic text-center">Các quyền lợi được áp dụng tự động trên hệ thống khi bạn đăng nhập và đặt hàng.</p>
      </div>
    `;
    showPromoDetailModal(modalContent);
  });

  // Render detailed benefits summary below the card
  const benefitsEl = document.getElementById('membershipBenefits');
  if (benefitsEl) {
    benefitsEl.innerHTML = `
      <div class="mt-12 space-y-8">
        <div class="flex items-center gap-4">
            <h3 class="text-xl font-display font-black text-gray-800 tracking-tight uppercase">Quyền lợi của bạn</h3>
            <div class="h-px flex-1 bg-border"></div>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div class="p-6 bg-white border border-border rounded-3xl hover:border-primary/30 transition-all group">
                <div class="w-12 h-12 bg-primary/5 rounded-2xl flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
                    <i class="fas fa-percent text-lg"></i>
                </div>
                <h4 class="text-xs font-black text-gray-800 uppercase tracking-widest mb-3">Giảm giá đơn hàng</h4>
                <p class="text-xs text-gray-500 leading-relaxed font-medium">Hạng ${tier} được giảm giá trực tiếp <strong>${config.benefits}</strong> khi mua sắm.</p>
            </div>
            <div class="p-6 bg-white border border-border rounded-3xl hover:border-primary/30 transition-all group">
                <div class="w-12 h-12 bg-primary/5 rounded-2xl flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
                    <i class="fas fa-shipping-fast text-lg"></i>
                </div>
                <h4 class="text-xs font-black text-gray-800 uppercase tracking-widest mb-3">Vận chuyển ưu tiên</h4>
                <p class="text-xs text-gray-500 leading-relaxed font-medium">${tier === 'Vàng' ? 'Miễn phí 100% phí vận chuyển cho mọi đơn hàng.' : (tier === 'Bạc' ? 'Miễn phí vận chuyển cho đơn hàng trên 200.000đ.' : 'Giảm phí ship theo từng khu vực.')}</p>
            </div>
            <div class="p-6 bg-white border border-border rounded-3xl hover:border-primary/30 transition-all group">
                <div class="w-12 h-12 bg-primary/5 rounded-2xl flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
                    <i class="fas fa-coins text-lg"></i>
                </div>
                <h4 class="text-xs font-black text-gray-800 uppercase tracking-widest mb-3">Tích lũy điểm thưởng</h4>
                <p class="text-xs text-gray-500 leading-relaxed font-medium">Hệ số tích điểm ${tier === 'Vàng' ? 'x1.5' : (tier === 'Bạc' ? 'x1.2' : 'x1.0')} giúp bạn nhanh chóng thăng hạng.</p>
            </div>
        </div>
      </div>
    `;
  }
}


function computeTier(points) {
  const p = Number(points || 0);
  if (p >= 20000) return 'Vàng';
  if (p >= 5000) return 'Bạc';
  return 'Đồng';
}

function setupUpdateButton() {
  const updateBtn = document.getElementById('updateBtn');

  updateBtn.addEventListener('click', async function () {
    const profileData = {
      tenkh: document.getElementById('hoten').value.trim(),
      sdt: document.getElementById('sodienthoai').value.trim(),
      email: document.getElementById('email').value.trim()
    };

    const originalUser = JSON.parse(localStorage.getItem('user'));

    //Kiểm tra dữ liệu có thay đổi không
    const isChanged =
      profileData.tenkh !== (originalUser.tenkh || originalUser.hoten || '') ||
      profileData.sdt !== (originalUser.sdt || '') ||
      profileData.email !== (originalUser.email || '');

    if (!isChanged) {
      showNotification_khan('error', 'Chưa có gì thay đổi');
      return;
    }

    try {
      updateBtn.disabled = true;
      updateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang lưu...';

      const token = (document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1] || null);

      const response = await fetch(`${window.API_CONFIG.BASE_URL}/api/client/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(profileData)
      });

      const data = await response.json();

      if (response.ok) {
        showNotification_khan('success', 'Cập nhật hồ sơ thành công');

        const updatedUser = {
          ...originalUser,
          tenkh: profileData.tenkh,
          sdt: profileData.sdt,
          email: profileData.email
        };
        localStorage.setItem('user', JSON.stringify(updatedUser));
      } else {
        showNotification_khan('error', data.error || 'Cập nhật hồ sơ thất bại');
      }
    } catch (error) {
      console.error('Lỗi cập nhật hồ sơ:', error);
      showNotification_khan('error', 'Không thể kết nối đến server');
    } finally {
      updateBtn.disabled = false;
      updateBtn.innerHTML = 'Thay đổi';
    }
  });
}



function removeFromWishlist(productId) {
  let wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];

  // Ép kiểu về chuỗi để so sánh chính xác
  const newWishlist = wishlist.filter(item => String(item.id) !== String(productId));

  if (newWishlist.length === wishlist.length) {
    showNotification_khan('error', 'Không tìm thấy sản phẩm cần xóa!');
    return;
  }

  localStorage.setItem('wishlist', JSON.stringify(newWishlist));
  displayWishlist();
  showNotification_khan('success', 'Đã xóa sản phẩm khỏi danh sách yêu thích!');
}


window.saveProductBeforeRedirect = (product) => {
  localStorage.setItem('currentProduct', JSON.stringify(product));
};

const formatPrice = (price) => new Intl.NumberFormat('vi-VN').format(price) + ' đ';
const showAlert = (message) => alert(message);


function setupChangePasswordButton() {
  const changePasswordBtn = document.getElementById('changePasswordBtn');

  changePasswordBtn.addEventListener('click', async function () {
    const oldPassword = document.getElementById('oldPassword').value.trim();
    const newPassword = document.getElementById('newPassword').value.trim();
    const confirmPassword = document.getElementById('confirmPassword').value.trim();
    const customerId = localStorage.getItem('customerId');

    if (!customerId) {
      showNotification_khan('error', 'Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.');
      return;
    }

    if (!oldPassword || !newPassword || !confirmPassword) {
      showNotification_khan('error', 'Vui lòng nhập đầy đủ các trường');
      return;
    }

    if (newPassword !== confirmPassword) {
      showNotification_khan('error', 'Mật khẩu mới và xác nhận mật khẩu không khớp');
      return;
    }

    if (newPassword.length < 8) {
      showNotification_khan('error', 'Mật khẩu mới phải có ít nhất 8 ký tự');
      return;
    }

    // Kiểm tra nếu mật khẩu mới trùng với mật khẩu cũ
    if (newPassword === oldPassword) {
      showNotification_khan('error', 'Chưa có gì thay đổi');
      return;
    }

    try {
      changePasswordBtn.disabled = true;
      changePasswordBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang xử lý...';

      const token = (document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1] || null);
      const response = await fetch(`${window.API_CONFIG.BASE_URL}/api/client/profile/change-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          matkhau_cu: oldPassword,
          matkhau_moi: newPassword
        })
      });

      const data = await response.json();

      if (response.ok) {
        showNotification_khan('success', 'Đổi mật khẩu thành công');
        document.getElementById('oldPassword').value = '';
        document.getElementById('newPassword').value = '';
        document.getElementById('confirmPassword').value = '';
      } else {
        showNotification_khan('error', data.error || 'Đổi mật khẩu thất bại');
      }
    } catch (error) {
      console.error('Lỗi đổi mật khẩu:', error);
      showNotification_khan('error', 'Không thể kết nối đến server');
    } finally {
      changePasswordBtn.disabled = false;
      changePasswordBtn.innerHTML = 'Thay đổi mật khẩu';
    }
  });
}

// Logout handler: clear auth and redirect to homepage
function setupLogoutHandler() {
  const logoutItem = document.getElementById('logout-list-item');
  if (!logoutItem) return;

  logoutItem.addEventListener('click', function (e) {
    e.preventDefault();
    // Clear authentication-related localStorage
    try {
      document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      localStorage.removeItem('user');
      localStorage.removeItem('customerId');
      // optional: clear cart/wishlist session data if desired
      // localStorage.removeItem('cart');
    } catch (err) {
      console.warn('Error clearing localStorage during logout', err);
    }

    // Show a small notification if function exists
    if (typeof showNotification_khan === 'function') {
      showNotification_khan('success', 'Bạn đã đăng xuất');
    }

    // Redirect to homepage
    setTimeout(() => { window.location.href = 'index.html'; }, 250);
  });
}

// Hiển thị modal chi tiết khuyến mãi
function showPromoDetailModal(content) {
  let modal = document.getElementById('promoDetailModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'promoDetailModal';
    modal.style.position = 'fixed';
    modal.style.inset = '0';
    modal.style.background = 'rgba(0,0,0,0.4)';
    modal.style.display = 'flex';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';
    modal.style.zIndex = '1000';
    modal.innerHTML = `
      <div style="background:#fff;padding:24px;border-radius:8px;max-width:500px;width:100%;position:relative">
        <button id="closePromoDetailModal" style="position:absolute;top:8px;right:12px;font-size:1.5rem;background:none;border:none;cursor:pointer">&times;</button>
        <div id="promoDetailModalContent"></div>
      </div>
    `;
    document.body.appendChild(modal);
  }
  document.getElementById('promoDetailModalContent').innerHTML = content;
  modal.style.display = 'flex';
  document.getElementById('closePromoDetailModal').onclick = () => {
    modal.style.display = 'none';
  };
}

// Gắn sự kiện click vào từng mã khuyến mãi để xem chi tiết
function setupPromoDetailEvents() {
  const promoCards = document.querySelectorAll('.promo-code-card');
  promoCards.forEach(card => {
    card.addEventListener('click', async function () {
      let makm = this.getAttribute('data-makm');
      // guard against literal strings 'undefined' or 'null'
      if (!makm || makm === 'undefined' || makm === 'null') return;
      makm = makm.toString().trim();
      if (!makm) return;
      try {
        const res = await fetch(`${window.API_CONFIG.BASE_URL}/api/khuyenmai/${encodeURIComponent(makm)}`);
        const data = await res.json();
        if (data && !data.error) {
          let html = `<h3>${data.TenKM}</h3>
            <div><b>Mô tả:</b> ${data.MoTa || ''}</div>
            <div><b>Loại:</b> ${data.LoaiKM}</div>
            <div><b>Ngày bắt đầu:</b> ${data.NgayBatDau ? data.NgayBatDau.slice(0, 10) : ''}</div>
            <div><b>Ngày kết thúc:</b> ${data.NgayKetThuc ? data.NgayKetThuc.slice(0, 10) : ''}</div>
            <div><b>Trạng thái:</b> ${data.TrangThai ? 'Đang hoạt động' : 'Ngừng'}</div>
            <div style="margin-top:8px"><b>Điều kiện áp dụng:</b>
              <ul>
                <li><b>Giá trị đơn tối thiểu:</b> ${data.GiaTriDonToiThieu || 0}</li>
                <li><b>Số lượng tối thiểu:</b> ${data.SoLuongToiThieu || 1}</li>
                <li><b>Giảm tối đa:</b> ${data.GiamToiDa || 'Không giới hạn'}</li>
                <li><b>Giá trị giảm:</b> ${data.GiaTriGiam}</li>
              </ul>
            </div>
            <div style="margin-top:8px"><b>Sản phẩm áp dụng:</b>
              <ul>
                ${(data.SanPhamApDung && data.SanPhamApDung.length)
              ? data.SanPhamApDung.map(sp => `<li>${sp.TenSP} (ID: ${sp.MaSP})</li>`).join('')
              : '<li>Áp dụng cho tất cả sản phẩm</li>'}
              </ul>
            </div>
          `;
          showPromoDetailModal(html);
        } else {
          showPromoDetailModal('<div style="color:red">Không thể tải chi tiết mã khuyến mãi</div>');
        }
      } catch (err) {
        showPromoDetailModal('<div style="color:red">Lỗi kết nối server</div>');
      }
    });
  });
}



// ----------------------------- GIAO DIỆN -------------------------------
function showNotification_khan(type, text) {
  const box = document.getElementById('notification_khan');
  const textSpan = document.getElementById('notificationText_khan');

  // Đổi màu theo loại
  if (type === 'success') {
    box.style.backgroundColor = '#d4edda';
    box.style.color = '#155724';
    box.style.borderColor = '#c3e6cb';
    box.style.setProperty('--triangle-color', '#d4edda');
  } else {
    box.style.backgroundColor = '#f8d7da';
    box.style.color = '#721c24';
    box.style.borderColor = '#f5c6cb';
    box.style.setProperty('--triangle-color', '#f8d7da');
  }

  textSpan.textContent = text;
  box.style.right = '20px'; // trượt vào

  setTimeout(() => {
    box.style.transition = 'right 0.5s ease-in';
    box.style.right = '-50vw'; // trượt ra
  }, 3000);
}

function closeNotification_khan() {
  const box = document.getElementById('notification_khan');
  box.style.right = '-50vw'; // trượt ra
}

// Trang trí thêm cho sidebar
const sidebarItems = document.querySelectorAll('.sidebar ul li[data-section]');
sidebarItems.forEach(item => {
  item.addEventListener('click', function () {
    sidebarItems.forEach(i => i.classList.remove('active'));
    this.classList.add('active');
    // Gọi hàm hiển thị section tương ứng...
  });
});

// Frontend quản lý địa chỉ: lấy / tạo / sửa / xóa
(
  function setupAddressFrontend() {
    const addLink = document.querySelector('.add-link'); // link 'Thêm địa chỉ'
    const otherAddrContainer = document.getElementById('other-receive-address');
    const defaultReceiveEl = document.getElementById('receive-address');
    const token = () => (document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1] || null);
    const customerId = () => localStorage.getItem('customerId');
    function extractStreet(fullAddress) {
      if (!fullAddress) return '';
      // tách theo dấu phẩy, gạch ngang hoặc nhiều khoảng trắng
      const parts = fullAddress.split(',').map(p => p.trim()).filter(Boolean);
      if (parts.length) return parts[0];
      // fallback: lấy tới ký tự số thứ hai nếu không có dấu phẩy
      return fullAddress.split(/\s{2,}| - |; /)[0].trim();
    }

    // Phân tích chuỗi địa chỉ đầy đủ thành các phần: street, ward, district, province
    function extractAddressParts(fullAddress) {
      if (!fullAddress) return { street: '', ward: '', district: '', province: '' };
      // split and trim
      const rawParts = fullAddress.split(',').map(p => p.trim()).filter(Boolean);
      if (!rawParts.length) return { street: '', ward: '', district: '', province: '' };

      // Remove obvious postal-code segments (pure digits, length 3-6)
      const parts = rawParts.filter(p => !/^\d{3,6}$/.test(p));

      let street = '';
      let ward = '';
      let district = '';
      let province = '';

      // helper to find part containing keyword
      const findPart = (kwRegex) => parts.find(p => kwRegex.test(p.toLowerCase())) || '';

      // If there are >=3 meaningful parts, assume last is province, second-last district, third-last ward (if present)
      if (parts.length >= 3) {
        province = parts[parts.length - 1] || '';
        district = parts[parts.length - 2] || '';
        ward = parts[parts.length - 3] || '';
        street = parts.slice(0, parts.length - 3).join(', ') || '';

        // If street ended up empty, maybe original first part is the street
        if (!street && rawParts.length) street = rawParts[0];
      } else if (parts.length === 2) {
        // try keyword detection
        const p1 = parts[0], p2 = parts[1];
        if (/quận|huyện|q\.|quan/.test(p2.toLowerCase()) || /quận|huyện|q\.|quan/.test(p1.toLowerCase())) {
          street = p1;
          district = p2;
        } else if (/thành phố|tỉnh|tp\./.test(p2.toLowerCase())) {
          street = p1;
          province = p2;
        } else {
          street = p1;
          province = p2;
        }
      } else if (parts.length === 1) {
        // single part: try to extract keywords inside
        const single = parts[0];
        const wardMatch = single.match(/(phường\s*[^,\-]+|xã\s*[^,\-]+)/i);
        const districtMatch = single.match(/(quận\s*[^,\-]+|huyện\s*[^,\-]+|q\.\s*[^,\-]+)/i);
        const provinceMatch = single.match(/(thành phố\s*[^,\-]+|tp\.|tỉnh\s*[^,\-]+)/i);
        if (wardMatch) ward = wardMatch[0].trim();
        if (districtMatch) district = districtMatch[0].trim();
        if (provinceMatch) province = provinceMatch[0].trim();
        // street = everything before the first keyword or the whole string if none
        const firstKeywordIndex = single.search(/(phường|xã|quận|huyện|thành phố|tp\.|tỉnh)/i);
        street = firstKeywordIndex > 0 ? single.slice(0, firstKeywordIndex).trim() : single;
      }

      // final cleanup: trim and return
      return { street: (street || '').trim(), ward: (ward || '').trim(), district: (district || '').trim(), province: (province || '').trim() };
    }

    function buildFullAddress(street, ward, district, province) {
      const parts = [];
      if (street) parts.push(street.trim());
      if (ward) parts.push(ward.trim());
      if (district) parts.push(district.trim());
      if (province) parts.push(province.trim());
      return parts.join(', ');
    }
    // location helpers: fetch lists from local JSON files via backend API
    async function loadProvinces() {
      try {
        const res = await fetch(`${window.API_CONFIG.BASE_URL}/api/address/cities`);
        const cities = await res.json();
        // Transform to match expected format: { code: city_id, name: city_name }
        return cities.map(city => ({
          code: city.city_id,
          name: city.city_name
        }));
      } catch (e) {
        console.error('loadProvinces', e);
        return [];
      }
    }
    async function loadDistricts(provinceCodeOrName) {
      if (!provinceCodeOrName) return [];
      try {
        // Use city_id to fetch districts
        const res = await fetch(`${window.API_CONFIG.BASE_URL}/api/address/districts/${encodeURIComponent(provinceCodeOrName)}`);
        const districts = await res.json();
        // Transform to match expected format: { code: district_id, name: district_name }
        return districts.map(district => ({
          code: district.district_id,
          name: district.district_name
        }));
      } catch (e) {
        console.warn('loadDistricts failed for code', provinceCodeOrName, e);
      }
      return [];
    }
    async function loadWards(districtCodeOrName) {
      if (!districtCodeOrName) return [];
      try {
        const res = await fetch(`${window.API_CONFIG.BASE_URL}/api/address/wards/${encodeURIComponent(districtCodeOrName)}`);
        const wards = await res.json();
        // Transform to match expected format: { code: ward_name (use name as code), name: ward_name }
        return wards.map(ward => ({
          code: ward.ward_name, // Use ward_name as code since ward_id doesn't exist
          name: ward.ward_name
        }));
      } catch (e) {
        console.warn('loadWards failed for code', districtCodeOrName, e);
      }
      return [];
    }
    async function fetchAddresses() {
      const cid = customerId();
      if (!cid || !token()) return;
      try {
        const res = await fetch(`${window.API_CONFIG.BASE_URL}/api/orders/customer-addresses/${cid}`, {
          headers: { Authorization: `Bearer ${token()}` }
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Lỗi khi lấy địa chỉ');
        renderAddresses(json.data || json);
      } catch (e) {
        console.error('fetchAddresses error', e);
        if (typeof showNotification_khan === 'function') showNotification_khan('error', 'Không tải được danh sách địa chỉ');
      }
    }

    async function renderAddresses(addresses = []) {
      if (!otherAddrContainer) return;
      if (!addresses.length) {
        otherAddrContainer.innerHTML = '<p>Chưa có địa chỉ khác.</p>';
        if (defaultReceiveEl) defaultReceiveEl.textContent = 'Chưa có địa chỉ';
        return;
      }

      // Helper function to get address names from IDs
      async function getAddressNames(provinceId, districtId, wardIdentifier) {
        try {
          const response = await fetch(`${window.API_CONFIG.BASE_URL}/api/address/full/${provinceId}/${districtId}/${encodeURIComponent(wardIdentifier)}`);
          if (!response.ok) return null;
          const data = await response.json();
          return data; // { city: "...", district: "...", ward: "..." }
        } catch (e) {
          console.warn('Failed to fetch address names', e);
          return null;
        }
      }

      // Convert IDs to names for each address
      const addressesWithNames = await Promise.all(addresses.map(async (addr) => {
        let provinceVal = addr.province || '';
        let districtVal = addr.district || '';
        let wardVal = addr.ward || '';

        // Check if province and district are numeric
        const isProvinceNumeric = /^\d+$/.test(String(provinceVal));
        const isDistrictNumeric = /^\d+$/.test(String(districtVal));

        // If province and district are numeric, fetch the names (ward can be name or ID)
        if (isProvinceNumeric && isDistrictNumeric) {
          const names = await getAddressNames(provinceVal, districtVal, wardVal);
          if (names) {
            return {
              ...addr,
              provinceName: names.city || provinceVal,
              districtName: names.district || districtVal,
              wardName: names.ward || wardVal
            };
          }
        }

        return {
          ...addr,
          provinceName: provinceVal,
          districtName: districtVal,
          wardName: wardVal
        };
      }));

      // Find the primary address (is_default flag), fallback to first item
      let primary = addressesWithNames.find(a => a.is_default == 1 || a.is_default === true) || addressesWithNames[0];
      if (primary && defaultReceiveEl) {
        const primaryFullAddr = `${extractStreet(primary.detail) || ''}${primary.wardName ? ', ' + primary.wardName : ''}${primary.districtName ? ', ' + primary.districtName : ''}${primary.provinceName ? ', ' + primary.provinceName : ''}`;
        defaultReceiveEl.textContent = `${primary.name || ''} • ${primary.phone || ''} — ${primaryFullAddr}`;
      }

      otherAddrContainer.innerHTML = addressesWithNames.map((addr, idx) => {
        const fullAddr = `${extractStreet(addr.detail) || ''}${addr.wardName ? ', ' + addr.wardName : ''}${addr.districtName ? ', ' + addr.districtName : ''}${addr.provinceName ? ', ' + addr.provinceName : ''}`;
        return `
        <div class="address-item" data-id="${addr.id}" data-detail="${encodeURIComponent(addr.detail || '')}" data-province="${encodeURIComponent(addr.province || '')}" data-district="${encodeURIComponent(addr.district || '')}" data-ward="${encodeURIComponent(addr.ward || '')}">
          <div class="address-info">
            <div class="addr-top">
              <span class="name">${addr.name || ''}</span>
              <span class="phone">${addr.phone || ''}</span>
            </div>
            <div class="addr-detail">${fullAddr}</div>
          </div>
          <div class="address-actions" style="margin-left:12px">
            <a href="#" class="edit edit-address" data-id="${addr.id}">Sửa</a>
            <button type="button" class="delete delete-address" data-id="${addr.id}">Xóa</button>
            ${addr.is_default == 1 || addr.is_default === true ? '<span class="default-badge">Mặc định</span>' : `<button type="button" class="set-default" data-id="${addr.id}">Đặt làm mặc định</button>`}
          </div>
        </div>
      `;
      }).join('');
    }

    async function createAddress(payload) {
      try {
        const res = await fetch(`${window.API_CONFIG.BASE_URL}/api/orders/customer-addresses`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token()}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });
        const j = await res.json();
        if (!res.ok) throw new Error(j.error || j.message || 'Tạo địa chỉ thất bại');
        if (typeof showNotification_khan === 'function') showNotification_khan('success', 'Tạo địa chỉ thành công');
        await fetchAddresses();
      } catch (e) {
        console.error('createAddress error', e);
        if (typeof showNotification_khan === 'function') showNotification_khan('error', e.message || 'Lỗi tạo địa chỉ');
      }
    }

    async function updateAddress(id, payload) {
      try {
        const res = await fetch(`${window.API_CONFIG.BASE_URL}/api/orders/customer-addresses/${id}`, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token()}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });
        const j = await res.json();
        if (!res.ok) throw new Error(j.error || j.message || 'Cập nhật thất bại');
        if (typeof showNotification_khan === 'function') showNotification_khan('success', 'Cập nhật địa chỉ thành công');
        await fetchAddresses();
      } catch (e) {
        console.error('updateAddress error', e);
        if (typeof showNotification_khan === 'function') showNotification_khan('error', e.message || 'Lỗi cập nhật địa chỉ');
      }
    }

    async function deleteAddress(id) {
      if (!confirm('Bạn có chắc muốn xóa địa chỉ này?')) return;
      try {
        const res = await fetch(`${window.API_CONFIG.BASE_URL}/api/orders/customer-addresses/${id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token()}` }
        });
        const j = await res.json();
        if (!res.ok) throw new Error(j.error || j.message || 'Xóa thất bại');
        if (typeof showNotification_khan === 'function') showNotification_khan('success', 'Xóa địa chỉ thành công');
        await fetchAddresses();
      } catch (e) {
        console.error('deleteAddress error', e);
        if (typeof showNotification_khan === 'function') showNotification_khan('error', e.message || 'Lỗi xóa địa chỉ');
      }
    }

    // Modal-based form for add/edit address. Returns Promise which resolves to payload or null if cancelled
    function openAddressPrompt(existing = {}) {
      return new Promise((resolve) => {
        const modal = document.getElementById('addressModal');
        const titleEl = document.getElementById('addressModalTitle');
        const nameEl = document.getElementById('addr_name');
        const phoneEl = document.getElementById('addr_phone');
        const detailEl = document.getElementById('addr_detail');
        const provinceEl = document.getElementById('addr_province');
        const districtEl = document.getElementById('addr_district');
        const wardEl = document.getElementById('addr_ward');
        const errorEl = document.getElementById('addr_form_error');
        const btnSave = document.getElementById('addr_save');
        const btnCancel = document.getElementById('addr_cancel');
        const btnClose = document.getElementById('addressModalClose');

        if (!modal) {
          // fallback to prompts
          const name = prompt('Họ tên người nhận:', existing.name || '');
          if (name === null) return resolve(null);
          const phone = prompt('Số điện thoại:', existing.phone || '');
          if (phone === null) return resolve(null);
          const detail = prompt('Địa chỉ chi tiết:', existing.detail || '');
          if (detail === null) return resolve(null);
          const province = prompt('Tỉnh/Thành (tên hoặc mã):', existing.province || '');
          if (province === null) return resolve(null);
          const district = prompt('Quận/Huyện (tên hoặc mã):', existing.district || '');
          if (district === null) return resolve(null);
          const ward = prompt('Phường/Xã (tên hoặc mã):', existing.ward || '');
          if (ward === null) return resolve(null);
          return resolve({ name: name.trim(), phone: phone.trim(), detail: detail.trim(), province: province.trim() || null, district: district.trim() || null, ward: ward.trim() || null });
        }

        // fill values: chỉ để phần tên đường vào addr_detail, và cố gắng tách ra tỉnh/quận/phường nếu có
        titleEl.textContent = existing && existing.name ? 'Sửa địa chỉ' : 'Thêm địa chỉ';
        nameEl.value = existing.name || '';
        phoneEl.value = existing.phone || '';
        // nếu server trả các trường riêng thì ưu tiên dùng, ngược lại tách từ existing.detail
        detailEl.value = extractStreet(existing.detail) || existing.detail || '';

        // Populate selects: provinces -> districts -> wards. Prefill using existing.province/district/ward which may be names or codes.
        (async () => {
          // load provinces into select
          const provinces = await loadProvinces();
          provinceEl.innerHTML = '<option value="">Tỉnh/Thành</option>' + provinces.map(p => `<option value="${p.code}">${p.name}</option>`).join('');

          // try to pre-select province by matching name or code
          let selectedProvinceCode = '';
          if (existing.province) {
            // if existing.province looks numeric, use as code
            if (/^\d+$/.test(String(existing.province))) selectedProvinceCode = String(existing.province);
            else {
              const found = provinces.find(p => p.name.toLowerCase() === String(existing.province).toLowerCase());
              if (found) selectedProvinceCode = String(found.code);
            }
          }
          if (!selectedProvinceCode && provinces.length === 1) selectedProvinceCode = String(provinces[0].code);
          if (selectedProvinceCode) provinceEl.value = selectedProvinceCode;

          // load districts for selected province
          const districts = selectedProvinceCode ? await loadDistricts(selectedProvinceCode) : [];
          districtEl.innerHTML = '<option value="">Quận/Huyện</option>' + districts.map(d => `<option value="${d.code}">${d.name}</option>`).join('');

          // try preselect district
          let selectedDistrictCode = '';
          if (existing.district) {
            if (/^\d+$/.test(String(existing.district))) selectedDistrictCode = String(existing.district);
            else {
              const foundD = districts.find(d => d.name.toLowerCase() === String(existing.district).toLowerCase());
              if (foundD) selectedDistrictCode = String(foundD.code);
            }
          }
          if (selectedDistrictCode) districtEl.value = selectedDistrictCode;

          // load wards for selected district
          const wards = selectedDistrictCode ? await loadWards(selectedDistrictCode) : [];
          wardEl.innerHTML = '<option value="">Phường/Xã</option>' + wards.map(w => `<option value="${w.code}">${w.name}</option>`).join('');

          // try preselect ward
          if (existing.ward) {
            if (/^\d+$/.test(String(existing.ward))) wardEl.value = String(existing.ward);
            else {
              const foundW = wards.find(w => w.name.toLowerCase() === String(existing.ward).toLowerCase());
              if (foundW) wardEl.value = String(foundW.code);
            }
          }
        })();
        errorEl.style.display = 'none';

        function cleanup() {
          btnSave.removeEventListener('click', onSave);
          btnCancel.removeEventListener('click', onCancel);
          btnClose.removeEventListener('click', onCancel);
          provinceEl.removeEventListener('change', onProvinceChange);
          districtEl.removeEventListener('change', onDistrictChange);
          modal.style.display = 'none';
        }

        function validate() {
          const name = nameEl.value.trim();
          const phone = phoneEl.value.trim();
          const detail = detailEl.value.trim();
          if (!name) return 'Vui lòng nhập họ tên người nhận';
          if (!phone) return 'Vui lòng nhập số điện thoại';
          if (!detail) return 'Vui lòng nhập địa chỉ chi tiết';
          return null;
        }

        async function onProvinceChange(e) {
          const code = provinceEl.value;
          // clear district & ward
          districtEl.innerHTML = '<option value="">Quận/Huyện</option>';
          wardEl.innerHTML = '<option value="">Phường/Xã</option>';
          if (!code) return;
          const districts = await loadDistricts(code);
          districtEl.innerHTML = '<option value="">Quận/Huyện</option>' + (districts || []).map(d => `<option value="${d.code}">${d.name}</option>`).join('');
        }

        async function onDistrictChange(e) {
          const code = districtEl.value;
          wardEl.innerHTML = '<option value="">Phường/Xã</option>';
          if (!code) return;
          const wards = await loadWards(code);
          wardEl.innerHTML = '<option value="">Phường/Xã</option>' + (wards || []).map(w => `<option value="${w.code}">${w.name}</option>`).join('');
        }

        provinceEl.addEventListener('change', onProvinceChange);
        districtEl.addEventListener('change', onDistrictChange);

        function onSave(e) {
          e.preventDefault();
          const v = validate();
          if (v) {
            errorEl.textContent = v;
            errorEl.style.display = 'block';
            return;
          }
          // build full detail from components so server has consistent full address
          const street = nameEl ? detailEl.value.trim() : detailEl.value.trim();
          // For selects we store the selected code; if user typed names (fallback) take the select text
          const provinceV = provinceEl.value ? provinceEl.options[provinceEl.selectedIndex].text.trim() : (provinceEl.value || null);
          const districtV = districtEl.value ? districtEl.options[districtEl.selectedIndex].text.trim() : (districtEl.value || null);
          const wardV = wardEl.value ? wardEl.options[wardEl.selectedIndex].text.trim() : (wardEl.value || null);
          const fullDetail = buildFullAddress(detailEl.value.trim(), wardV, districtV, provinceV);

          const payload = {
            name: nameEl.value.trim(),
            phone: phoneEl.value.trim(),
            detail: fullDetail,
            province: provinceV,
            district: districtV,
            ward: wardV
          };
          cleanup();
          resolve(payload);
        }

        function onCancel(e) {
          if (e) e.preventDefault();
          cleanup();
          resolve(null);
        }

        btnSave.addEventListener('click', onSave);
        btnCancel.addEventListener('click', onCancel);
        btnClose.addEventListener('click', onCancel);

        // show modal
        modal.style.display = 'flex';
        nameEl.focus();
      });
    }

    // Event bindings
    if (addLink) {
      addLink.addEventListener('click', async (e) => {
        e.preventDefault();
        const payload = await openAddressPrompt(); // <-- await thêm ở đây
        if (!payload) return;
        await createAddress({ name: payload.name, phone: payload.phone, detail: payload.detail, province: payload.province, district: payload.district, ward: payload.ward });
      });
    }

    // Delegate edit/delete clicks
    if (otherAddrContainer) {
      otherAddrContainer.addEventListener('click', async (e) => {
        const editEl = e.target.closest('.edit-address');
        const delEl = e.target.closest('.delete-address');
        const setDefaultEl = e.target.closest('.set-default');
        if (setDefaultEl) {
          e.preventDefault();
          const id = setDefaultEl.dataset.id;
          try {
            // Try dedicated endpoint to set default address
            let res = await fetch(`${window.API_CONFIG.BASE_URL}/api/orders/customer-addresses/${id}/set-default`, {
              method: 'POST',
              headers: { Authorization: `Bearer ${token()}` }
            });
            if (!res.ok) {
              // fallback: update addresses by setting is_default flag on server via PUT
              await updateAddress(id, { is_default: true });
            } else {
              const j = await res.json();
              if (!res.ok) throw new Error(j.error || j.message || 'Không thể đặt mặc định');
              if (typeof showNotification_khan === 'function') showNotification_khan('success', 'Đã đặt địa chỉ này làm mặc định');
              await fetchAddresses();
            }
          } catch (err) {
            console.error('set-default error', err);
            if (typeof showNotification_khan === 'function') showNotification_khan('error', err.message || 'Không thể đặt mặc định');
          }
          return;
        }

        if (editEl) {
          e.preventDefault();
          const id = editEl.dataset.id;
          // find current values on DOM
          const root = otherAddrContainer.querySelector(`.address-item[data-id="${id}"]`);
          const name = root?.querySelector('.addr-top strong')?.textContent?.trim() || '';
          const phone = root?.querySelector('.phone')?.textContent?.trim() || '';
          // read encoded full-detail and parts from data attributes (set when rendering)
          const encodedDetail = root?.dataset.detail || '';
          const encodedProvince = root?.dataset.province || '';
          const encodedDistrict = root?.dataset.district || '';
          const encodedWard = root?.dataset.ward || '';
          const detailFull = encodedDetail ? decodeURIComponent(encodedDetail) : (root?.querySelector('.addr-detail')?.textContent?.trim() || '');
          const provinceVal = encodedProvince ? decodeURIComponent(encodedProvince) : '';
          const districtVal = encodedDistrict ? decodeURIComponent(encodedDistrict) : '';
          const wardVal = encodedWard ? decodeURIComponent(encodedWard) : '';
          const payload = await openAddressPrompt({ name, phone, detail: detailFull, province: provinceVal, district: districtVal, ward: wardVal });
          if (!payload) return;
          await updateAddress(id, { name: payload.name, phone: payload.phone, detail: payload.detail, province: payload.province, district: payload.district, ward: payload.ward });
        } else if (delEl) {
          e.preventDefault();
          const id = delEl.dataset.id;
          await deleteAddress(id);
        }
      });
    }


    // also bind global "Sửa" link in default address block (has class .edit-link)
    const defaultEdit = document.querySelector('.address-block .edit-link');
    if (defaultEdit) {
      defaultEdit.addEventListener('click', async (e) => {
        e.preventDefault();
        try {
          const cid = customerId();
          const res = await fetch(`${window.API_CONFIG.BASE_URL}/api/orders/customer-addresses/${cid}`, {
            headers: { Authorization: `Bearer ${token()}` }
          });
          const j = await res.json();
          if (!res.ok) throw new Error(j.error || 'Lỗi');
          const first = (j.data || j)[0];
          if (!first) {
            if (typeof showNotification_khan === 'function') showNotification_khan('error', 'Chưa có địa chỉ để sửa');
            return;
          }
          const payload = await openAddressPrompt(first); // <-- await thêm ở đây
          if (!payload) return;
          await updateAddress(first.id, { name: payload.name, phone: payload.phone, detail: payload.detail, province: payload.province, district: payload.district, ward: payload.ward });
        } catch (e) {
          console.error('defaultEdit error', e);
          if (typeof showNotification_khan === 'function') showNotification_khan('error', 'Lỗi khi sửa địa chỉ mặc định');
        }
      });
    }

    // initial load (delay nhỏ để đảm bảo customerId đã được set khi loadUserProfile trước đó)
    setTimeout(fetchAddresses, 300);
  })();

