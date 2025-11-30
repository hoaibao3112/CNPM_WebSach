// Kiểm tra đã đăng nhập (có khách hàng trong localStorage)
function isLoggedIn() {
  return !!(localStorage.getItem('token') && localStorage.getItem('customerId'));
}

// Trả về nhãn hiển thị cho loại khuyến mãi
function getPromotionTypeLabel(loaiKM) {
  if (!loaiKM) return 'Không xác định';
  const key = String(loaiKM).toLowerCase();
  if (key === 'giam_phan_tram') return 'Giảm theo phần trăm';
  if (key === 'giam_tien_mat') return 'Giảm tiền mặt';
  if (key === 'free_ship' || key === 'freeship') return 'Miễn phí vận chuyển';
  if (key === 'gift' || key === 'qua_tang') return 'Quà tặng';
  return loaiKM;
}

// Lấy danh sách khuyến mãi từ API
async function fetchVouchers() {
  try {
    const response = await fetch('http://localhost:5000/api/khuyenmai');
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Lỗi khi tải danh sách khuyến mãi:', error);
    return [];
  }
}

// Render voucher ra giao diện
function renderVouchers(vouchers) {
  const voucherList = document.querySelector('.voucher-list');
  if (!voucherList) return;

  if (vouchers.length === 0) {
    voucherList.innerHTML = '<div class="empty-state"><p>Không có mã khuyến mãi nào</p></div>';
    return;
  }

  // Lấy danh sách mã đã lưu từ localStorage
  const myPromos = JSON.parse(localStorage.getItem('myPromos') || '[]');
  const savedCodes = myPromos.map(p => p.makm);

  voucherList.innerHTML = vouchers.map(voucher => {
    const isSaved = savedCodes.includes(voucher.MaKM);
    const isActive = Number(voucher.TrangThai) === 1;
    
    // Kiểm tra hết hạn
    const isExpired = voucher.NgayKetThuc && new Date(voucher.NgayKetThuc) < new Date();
    
    // Xác định loại khuyến mãi
    const typeConfig = {
      'giam_phan_tram': { 
        icon: '<i class="fa-solid fa-percent"></i>', 
        label: 'Giảm %', 
        color: '#FF6B6B' 
      },
      'giam_tien_mat': { 
        icon: '<i class="fa-solid fa-money-bill-wave"></i>', 
        label: 'Giảm tiền', 
        color: '#4ECDC4' 
      },
      'freeship': { 
        icon: '<i class="fa-solid fa-truck"></i>', 
        label: 'Miễn ship', 
        color: '#45B7D1' 
      },
      // Hỗ trợ nhãn từ backend 'free_ship' (underscore)
      'free_ship': {
        icon: '<i class="fa-solid fa-truck"></i>',
        label: 'Miễn ship',
        color: '#45B7D1'
      },
      'gift': { 
        icon: '<i class="fa-solid fa-gift"></i>', 
        label: 'Quà tặng', 
        color: '#9B5DE5' 
      }
    };

    const config = typeConfig[voucher.LoaiKM] || typeConfig['giam_phan_tram'];

    // Format giá trị giảm
    let discountText = '';
    if (voucher.GiaTriGiam) {
      if (voucher.LoaiKM === 'giam_phan_tram') {
        discountText = `Giảm ${voucher.GiaTriGiam}%`;
      } else {
        discountText = `Giảm ${voucher.GiaTriGiam.toLocaleString()}đ`;
      }
    }

    return `
      <div class="voucher-card ${isExpired || !isActive ? 'disabled' : ''}" style="border-left: 6px solid ${config.color}; ${!isActive || isExpired ? 'opacity: 0.6;' : ''}">
        <div class="voucher-icon" style="color: ${config.color};">
          ${config.icon}
          <span class="icon-label">${config.label}</span>
        </div>
        <div class="voucher-info">
          <div class="voucher-title">${voucher.TenKM}</div>
          <div class="voucher-desc">${voucher.MoTa || 'Mã khuyến mãi đặc biệt'}</div>
          ${discountText ? `<div class="voucher-discount">${discountText}</div>` : ''}
          <div class="voucher-expiry">HSD: ${voucher.NgayKetThuc ? new Date(voucher.NgayKetThuc).toLocaleDateString('vi-VN') : 'N/A'}</div>
          <div class="voucher-conditions">
            ${voucher.GiaTriDonToiThieu ? `Đơn tối thiểu: ${voucher.GiaTriDonToiThieu.toLocaleString()}đ` : ''}
          </div>
          <div class="voucher-action">
            <button 
              class="voucher-btn ${isSaved ? 'saved' : ''}" 
              data-makm="${voucher.MaKM}"
              data-code="${voucher.Code || voucher.TenKM}"
              ${!isActive || isSaved || isExpired ? 'disabled' : ''}
            >
              ${isExpired ? 'Hết hạn' : (isSaved ? 'Đã lưu' : (isActive ? 'Lưu mã' : 'Ngừng hoạt động'))}
            </button>
            <i class="fa-solid fa-circle-info detail-btn" 
               title="Xem chi tiết" 
               data-makm="${voucher.MaKM}"></i>
          </div>
        </div>
      </div>
    `;
  }).join('');

  // Setup sự kiện sau khi render
  setupClaimEvents();
  setupDetailEvents();
}

// Sự kiện lưu mã khuyến mãi
function setupClaimEvents() {
  document.querySelectorAll('.voucher-btn:not(.saved):not([disabled])').forEach(btn => {
    btn.addEventListener('click', async function() {
      const maKM = this.getAttribute('data-makm');
      const code = this.getAttribute('data-code');
      
      if (!isLoggedIn()) {
        showNotification('Bạn cần đăng nhập để lưu mã khuyến mãi!', 'error');
        return;
      }

      // Disable button để tránh click nhiều lần
      this.disabled = true;
      this.textContent = 'Đang lưu...';

      const token = localStorage.getItem('token');
      try {
        const response = await fetch(`http://localhost:5000/api/khuyenmai/claim/${maKM}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        const data = await response.json();

        if (response.ok) {
          // Lưu mã vào localStorage
          let myPromos = JSON.parse(localStorage.getItem('myPromos') || '[]');
          
          // Kiểm tra xem mã đã tồn tại chưa
          if (!myPromos.some(p => p.makm == data.makm)) {
            myPromos.push({
              makm: data.makm,
              code: data.code,
              ngay_lay: data.ngay_lay,
              status: 'Còn hiệu lực'
            });
            localStorage.setItem('myPromos', JSON.stringify(myPromos));
          }

          // Cập nhật giao diện
          this.textContent = 'Đã lưu';
          this.classList.add('saved');
          
          showNotification(`Đã lưu mã ${data.code || code} thành công!`, 'success');
        } else {
          // Khôi phục button nếu lỗi
          this.disabled = false;
          this.textContent = 'Lưu mã';
          showNotification(data.error || 'Lỗi khi lưu mã khuyến mãi', 'error');
        }
      } catch (error) {
        // Khôi phục button nếu lỗi
        this.disabled = false;
        this.textContent = 'Lưu mã';
        console.error('Lỗi kết nối:', error);
        showNotification('Lỗi kết nối đến server', 'error');
      }
    });
  });
}

// Sự kiện xem chi tiết
function setupDetailEvents() {
  document.querySelectorAll('.detail-btn').forEach(icon => {
    icon.addEventListener('click', async function() {
      const maKM = this.getAttribute('data-makm');
      
      try {
        const response = await fetch(`http://localhost:5000/api/khuyenmai/${maKM}`);
        const data = await response.json();
        
        if (data && !data.error) {
          showVoucherDetail(data);
        } else {
          showNotification('Không thể tải chi tiết mã khuyến mãi', 'error');
        }
      } catch (error) {
        console.error('Lỗi khi tải chi tiết:', error);
        showNotification('Lỗi kết nối đến server', 'error');
      }
    });
  });
}

// Hiển thị chi tiết voucher
function showVoucherDetail(voucher) {
  const html = `
    <div class="voucher-detail">
      <div class="detail-header">
        <h3><i class="fa-solid fa-ticket"></i> Chi tiết voucher</h3>
      </div>
      
      <div class="detail-content">
        <div class="detail-section">
          <h4><i class="fa-solid fa-info-circle"></i> Thông tin cơ bản</h4>
          <div class="detail-item">
            <strong>Tên voucher:</strong> ${voucher.TenKM}
          </div>
          <div class="detail-item">
            <strong>Mã code:</strong> 
            <span class="code-display">${voucher.Code || 'N/A'}</span>
          </div>
          <div class="detail-item">
            <strong>Mô tả:</strong> ${voucher.MoTa || 'Không có mô tả'}
          </div>
          <div class="detail-item">
            <strong>Loại voucher:</strong>
            <span class="voucher-type">${getPromotionTypeLabel(voucher.LoaiKM)}</span>
          </div>
          <div class="detail-item">
            <strong>Trạng thái:</strong> 
            <span class="status ${Number(voucher.TrangThai) === 1 ? 'active' : 'inactive'}">
              ${Number(voucher.TrangThai) === 1 ? 'Đang hoạt động' : 'Ngừng hoạt động'}
            </span>
          </div>
        </div>

        <div class="detail-section">
          <h4><i class="fa-solid fa-calendar-alt"></i> Thời gian hiệu lực</h4>
          <div class="detail-item">
            <strong>Ngày bắt đầu:</strong> ${voucher.NgayBatDau ? new Date(voucher.NgayBatDau).toLocaleDateString('vi-VN') : 'N/A'}
          </div>
          <div class="detail-item">
            <strong>Ngày kết thúc:</strong> ${voucher.NgayKetThuc ? new Date(voucher.NgayKetThuc).toLocaleDateString('vi-VN') : 'N/A'}
          </div>
        </div>

        <div class="detail-section">
          <h4><i class="fa-solid fa-tags"></i> Ưu đãi</h4>
          <div class="detail-item">
            <strong>Giá trị giảm:</strong> 
            ${voucher.GiaTriGiam ? 
              (voucher.LoaiKM === 'giam_phan_tram' ? 
                `${voucher.GiaTriGiam}%` : 
                `${voucher.GiaTriGiam.toLocaleString()}đ`) : 
              'Chưa xác định'}
          </div>
          ${voucher.GiamToiDa ? `
            <div class="detail-item">
              <strong>Giảm tối đa:</strong> ${voucher.GiamToiDa.toLocaleString()}đ
            </div>
          ` : ''}
        </div>

        <div class="detail-section">
          <h4><i class="fa-solid fa-clipboard-list"></i> Điều kiện áp dụng</h4>
          <ul class="condition-list">
            ${voucher.GiaTriDonToiThieu ? `<li>Đơn hàng tối thiểu: ${voucher.GiaTriDonToiThieu.toLocaleString()}đ</li>` : ''}
            ${voucher.SoLuongToiThieu ? `<li>Số lượng sản phẩm tối thiểu: ${voucher.SoLuongToiThieu}</li>` : ''}
            <li>Áp dụng cho: ${voucher.SanPhamApDung ? 'Sản phẩm chỉ định' : 'Tất cả sản phẩm'}</li>
          </ul>
        </div>
      </div>
    </div>
  `;
  
  showModal(html);
}

// Hàm hiển thị modal
function showModal(content) {
  let modal = document.getElementById('voucherModal');
  
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'voucherModal';
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-overlay">
        <div class="modal-content">
          <button class="modal-close">
            <i class="fa-solid fa-times"></i>
          </button>
          <div class="modal-body"></div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    
    // Sự kiện đóng modal
    modal.querySelector('.modal-close').addEventListener('click', () => {
      modal.style.display = 'none';
    });
    
    modal.addEventListener('click', (e) => {
      if (e.target === modal || e.target.classList.contains('modal-overlay')) {
        modal.style.display = 'none';
      }
    });
  }
  
  modal.querySelector('.modal-body').innerHTML = content;
  modal.style.display = 'block';
}

// Hiển thị thông báo
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.innerHTML = `
    <div class="notification-content">
      <i class="fa-solid ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
      <span>${message}</span>
    </div>
  `;
  
  document.body.appendChild(notification);
  
  // Tự động ẩn sau 3 giây
  setTimeout(() => {
    notification.remove();
  }, 3000);
}

// Hiển thị mã khuyến mãi đã lưu của người dùng
function displayPromoCodes() {
  const promoList = JSON.parse(localStorage.getItem('myPromos') || '[]');
  const container = document.getElementById('promo-codes-list');
  
  if (!container) return;

  if (!promoList.length) {
    container.innerHTML = '<p class="empty-wishlist">Bạn chưa có mã khuyến mãi nào.</p>';
    return;
  }

  container.innerHTML = promoList.map(promo => `
    <div class="promo-code-card" data-makm="${promo.makm}" style="cursor: pointer;">
      <div class="promo-code-title">
        <i class="fas fa-ticket-alt"></i> Mã ưu đãi
      </div>
      <div class="promo-code-value">${promo.code}</div>
      <div class="promo-code-expiry">Ngày nhận: ${promo.ngay_lay || ''}</div>
      <div class="promo-code-status">${promo.status || 'Còn hiệu lực'}</div>
    </div>
  `).join('');

  // Thêm sự kiện click để xem chi tiết
  container.querySelectorAll('.promo-code-card').forEach(card => {
    card.addEventListener('click', async function() {
      const makm = this.getAttribute('data-makm');
      
      try {
        const response = await fetch(`http://localhost:5000/api/khuyenmai/${makm}`);
        const data = await response.json();
        
        if (data && !data.error) {
          showVoucherDetail(data);
        } else {
          showNotification('Không thể tải chi tiết mã khuyến mãi', 'error');
        }
      } catch (error) {
        console.error('Lỗi khi tải chi tiết:', error);
        showNotification('Lỗi kết nối đến server', 'error');
      }
    });
  });
}

// Khởi tạo trang khi DOM đã sẵn sàng
async function initPromotionPage() {
  try {
    // Load vouchers
    const vouchers = await fetchVouchers();
    renderVouchers(vouchers);
    
    // Display promo codes nếu có container
    if (document.getElementById('promo-codes-list')) {
      displayPromoCodes();
    }
  } catch (error) {
    console.error('Lỗi khởi tạo trang:', error);
    const voucherList = document.querySelector('.voucher-list');
    if (voucherList) {
      voucherList.innerHTML = '<div class="error-state"><p style="color:red;">Không thể tải dữ liệu khuyến mãi</p></div>';
    }
  }
}

// Gọi hàm khởi tạo khi DOM ready
document.addEventListener('DOMContentLoaded', initPromotionPage);

// Export functions để có thể sử dụng ở file khác
window.voucherFunctions = {
  fetchVouchers,
  renderVouchers,
  displayPromoCodes,
  showModal,
  isLoggedIn
};