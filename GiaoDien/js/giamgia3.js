// Kiểm tra đã đăng nhập (có khách hàng trong localStorage)
function isLoggedIn() {
  return !!(localStorage.getItem('token') && localStorage.getItem('customerId'));
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
  const voucherList = document.getElementById('voucherList');
  if (!voucherList) return;

  if (vouchers.length === 0) {
    voucherList.innerHTML = '<div style="padding:24px;text-align:center;">Không có mã khuyến mãi nào</div>';
    return;
  }

  // Lấy danh sách mã đã lưu từ localStorage
  const myPromos = JSON.parse(localStorage.getItem('myPromos') || '[]');
  const savedCodes = myPromos.map(p => p.makm);

  voucherList.innerHTML = vouchers.map(voucher => {
    const isSaved = savedCodes.includes(voucher.MaKM);
    const isActive = Number(voucher.TrangThai) === 1;
    
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
      }
    };

    const config = typeConfig[voucher.LoaiKM] || typeConfig['giam_phan_tram'];

    return `
      <div class="voucher-card" style="border-left: 6px solid ${config.color}; ${!isActive ? 'opacity: 0.6;' : ''}">
        <div class="icon" style="color: ${config.color};">
          ${config.icon}
          <span style="font-size: 0.8rem;">${config.label}</span>
        </div>
        <div class="voucher-info">
          <div class="voucher-title">${voucher.TenKM}</div>
          <div class="voucher-desc">${voucher.MoTa || 'Mã khuyến mãi đặc biệt'}</div>
          <div class="voucher-code">Mã: <strong>${voucher.Code || 'N/A'}</strong></div>
          <div class="voucher-expiry">HSD: ${voucher.NgayKetThuc ? voucher.NgayKetThuc.slice(0, 10) : 'N/A'}</div>
          <div class="voucher-status ${isActive ? 'active' : 'inactive'}">
            ${isActive ? 'Đang hoạt động' : 'Ngừng hoạt động'}
          </div>
          <div class="voucher-action">
            <button 
              class="voucher-btn ${isSaved ? 'saved' : ''}" 
              data-makm="${voucher.MaKM}"
              ${!isActive || isSaved ? 'disabled' : ''}
            >
              ${isSaved ? 'Đã lưu' : (isActive ? 'Lưu mã' : 'Hết hạn')}
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
      
      if (!isLoggedIn()) {
        showModal('<div style="color: red;">Bạn cần đăng nhập để lưu mã khuyến mãi!</div>');
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
          
          showModal(`
            <div style="text-align: center;">
              <i class="fa-solid fa-check-circle" style="color: green; font-size: 2em; margin-bottom: 10px;"></i>
              <h3>Lưu mã thành công!</h3>
              <p>Mã khuyến mãi của bạn: <strong style="color: #FF6B6B; font-size: 1.2em;">${data.code || 'N/A'}</strong></p>
              <p>Hãy sử dụng mã này khi thanh toán để được giảm giá!</p>
            </div>
          `);
        } else {
          // Khôi phục button nếu lỗi
          this.disabled = false;
          this.textContent = 'Lưu mã';
          showModal(`<div style="color: red; text-align: center;">${data.error || 'Lỗi khi lưu mã khuyến mãi'}</div>`);
        }
      } catch (error) {
        // Khôi phục button nếu lỗi
        this.disabled = false;
        this.textContent = 'Lưu mã';
        console.error('Lỗi kết nối:', error);
        showModal('<div style="color: red; text-align: center;">Lỗi kết nối đến server</div>');
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
          const html = `
            <div class="voucher-detail">
              <h3 style="color: #1890ff; margin-bottom: 15px;">
                <i class="fa-solid fa-gift"></i> ${data.TenKM}
              </h3>
              
              <div class="detail-section">
                <h4><i class="fa-solid fa-info-circle"></i> Thông tin cơ bản</h4>
                <div class="detail-item">
                  <strong>Mã code:</strong> 
                  <span class="code-display">${data.Code || 'N/A'}</span>
                </div>
                <div class="detail-item">
                  <strong>Mô tả:</strong> ${data.MoTa || 'Không có mô tả'}
                </div>
                <div class="detail-item">
                  <strong>Loại khuyến mãi:</strong> 
                  <span class="promo-type">${data.LoaiKM === 'giam_phan_tram' ? 'Giảm theo phần trăm' : 'Giảm tiền mặt'}</span>
                </div>
                <div class="detail-item">
                  <strong>Trạng thái:</strong> 
                  <span class="status ${Number(data.TrangThai) === 1 ? 'active' : 'inactive'}">
                    ${Number(data.TrangThai) === 1 ? 'Đang hoạt động' : 'Ngừng hoạt động'}
                  </span>
                </div>
              </div>

              <div class="detail-section">
                <h4><i class="fa-solid fa-calendar-alt"></i> Thời gian</h4>
                <div class="detail-item">
                  <strong>Ngày bắt đầu:</strong> ${data.NgayBatDau ? data.NgayBatDau.slice(0, 10) : 'N/A'}
                </div>
                <div class="detail-item">
                  <strong>Ngày kết thúc:</strong> ${data.NgayKetThuc ? data.NgayKetThuc.slice(0, 10) : 'N/A'}
                </div>
              </div>

              <div class="detail-section">
                <h4><i class="fa-solid fa-cogs"></i> Điều kiện áp dụng</h4>
                <ul class="condition-list">
                  <li><strong>Giá trị giảm:</strong> ${data.GiaTriGiam || 0}${data.LoaiKM === 'giam_phan_tram' ? '%' : ' VND'}</li>
                  <li><strong>Giá trị đơn tối thiểu:</strong> ${data.GiaTriDonToiThieu ? data.GiaTriDonToiThieu.toLocaleString() + ' VND' : 'Không yêu cầu'}</li>
                  <li><strong>Số lượng tối thiểu:</strong> ${data.SoLuongToiThieu || 1} sản phẩm</li>
                  <li><strong>Giảm tối đa:</strong> ${data.GiamToiDa ? data.GiamToiDa.toLocaleString() + ' VND' : 'Không giới hạn'}</li>
                </ul>
              </div>

              <div class="detail-section">
                <h4><i class="fa-solid fa-box"></i> Sản phẩm áp dụng</h4>
                ${(data.SanPhamApDung && data.SanPhamApDung.length > 0) 
                  ? `<ul class="product-list">
                      ${data.SanPhamApDung.map(sp => `<li>${sp.TenSP} (ID: ${sp.MaSP})</li>`).join('')}
                     </ul>`
                  : '<p class="all-products">Áp dụng cho tất cả sản phẩm</p>'}
              </div>
            </div>
          `;
          showModal(html);
        } else {
          showModal('<div style="color: red; text-align: center;">Không thể tải chi tiết mã khuyến mãi</div>');
        }
      } catch (error) {
        console.error('Lỗi khi tải chi tiết:', error);
        showModal('<div style="color: red; text-align: center;">Lỗi kết nối đến server</div>');
      }
    });
  });
}

// Hàm hiển thị modal
function showModal(content) {
  let modal = document.getElementById('voucherDetailModal');
  
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'voucherDetailModal';
    modal.innerHTML = `
      <div class="modal-overlay">
        <div class="modal-content">
          <button class="modal-close" id="closeVoucherModal">
            <i class="fa-solid fa-times"></i>
          </button>
          <div id="voucherModalContent"></div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    // CSS cho modal
    const style = document.createElement('style');
    style.textContent = `
      #voucherDetailModal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 1000;
        display: none;
      }
      .modal-overlay {
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
      }
      .modal-content {
        background: white;
        border-radius: 12px;
        max-width: 600px;
        width: 100%;
        max-height: 80vh;
        overflow-y: auto;
        position: relative;
        padding: 30px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
      }
      .modal-close {
        position: absolute;
        top: 15px;
        right: 15px;
        background: none;
        border: none;
        font-size: 1.5rem;
        cursor: pointer;
        color: #666;
        width: 30px;
        height: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        transition: all 0.3s;
      }
      .modal-close:hover {
        background: #f5f5f5;
        color: #333;
      }
      .voucher-detail h4 {
        color: #1890ff;
        margin: 20px 0 10px 0;
        border-bottom: 2px solid #e6f7ff;
        padding-bottom: 5px;
      }
      .detail-section {
        margin-bottom: 20px;
      }
      .detail-item {
        margin: 8px 0;
        padding: 5px 0;
      }
      .code-display {
        background: #f0f2f5;
        padding: 2px 8px;
        border-radius: 4px;
        font-family: monospace;
        color: #d32f2f;
        font-weight: bold;
      }
      .promo-type {
        background: #e6f7ff;
        color: #1890ff;
        padding: 2px 8px;
        border-radius: 4px;
        font-size: 0.9em;
      }
      .status.active {
        color: #52c41a;
        font-weight: bold;
      }
      .status.inactive {
        color: #f5222d;
        font-weight: bold;
      }
      .condition-list, .product-list {
        margin: 10px 0;
        padding-left: 20px;
      }
      .condition-list li, .product-list li {
        margin: 5px 0;
      }
      .all-products {
        color: #1890ff;
        font-style: italic;
      }
      .voucher-btn.saved {
        background: #ccc !important;
        cursor: not-allowed;
      }
    `;
    document.head.appendChild(style);
  }

  document.getElementById('voucherModalContent').innerHTML = content;
  modal.style.display = 'block';

  // Sự kiện đóng modal
  document.getElementById('closeVoucherModal').onclick = () => {
    modal.style.display = 'none';
  };

  // Đóng modal khi click outside
  modal.onclick = (e) => {
    if (e.target === modal || e.target.classList.contains('modal-overlay')) {
      modal.style.display = 'none';
    }
  };
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
          const html = `
            <div class="voucher-detail">
              <h3 style="color: #1890ff; margin-bottom: 15px;">
                <i class="fa-solid fa-gift"></i> ${data.TenKM}
              </h3>
              
              <div class="detail-section">
                <h4><i class="fa-solid fa-info-circle"></i> Thông tin cơ bản</h4>
                <div class="detail-item">
                  <strong>Mã code:</strong> 
                  <span class="code-display">${data.Code || 'N/A'}</span>
                </div>
                <div class="detail-item">
                  <strong>Mô tả:</strong> ${data.MoTa || 'Không có mô tả'}
                </div>
                <div class="detail-item">
                  <strong>Loại khuyến mãi:</strong> 
                  <span class="promo-type">${data.LoaiKM === 'giam_phan_tram' ? 'Giảm theo phần trăm' : 'Giảm tiền mặt'}</span>
                </div>
              </div>

              <div class="detail-section">
                <h4><i class="fa-solid fa-cogs"></i> Điều kiện áp dụng</h4>
                <ul class="condition-list">
                  <li><strong>Giá trị giảm:</strong> ${data.GiaTriGiam || 0}${data.LoaiKM === 'giam_phan_tram' ? '%' : ' VND'}</li>
                  <li><strong>Giá trị đơn tối thiểu:</strong> ${data.GiaTriDonToiThieu ? data.GiaTriDonToiThieu.toLocaleString() + ' VND' : 'Không yêu cầu'}</li>
                  <li><strong>Số lượng tối thiểu:</strong> ${data.SoLuongToiThieu || 1} sản phẩm</li>
                  <li><strong>Giảm tối đa:</strong> ${data.GiamToiDa ? data.GiamToiDa.toLocaleString() + ' VND' : 'Không giới hạn'}</li>
                </ul>
              </div>
            </div>
          `;
          showModal(html);
        } else {
          showModal('<div style="color: red; text-align: center;">Không thể tải chi tiết mã khuyến mãi</div>');
        }
      } catch (error) {
        console.error('Lỗi khi tải chi tiết:', error);
        showModal('<div style="color: red; text-align: center;">Lỗi kết nối đến server</div>');
      }
    });
  });
}

// Slide chuyển động
function initTwoBannerSlider() {
  const leftSlides = document.querySelector('.left-slider .slides');
  const rightSlides = document.querySelector('.right-slider .slides');
  if (!leftSlides || !rightSlides) return;

  // original imgs
  const leftOrig = Array.from(leftSlides.children);
  const rightOrig = Array.from(rightSlides.children);
  if (leftOrig.length === 0 || rightOrig.length === 0) return;

  // tránh init nhiều lần
  const container = leftSlides.closest('.two-banner-wrapper') || leftSlides.parentElement;
  if (container.dataset.sliderInited) return;
  container.dataset.sliderInited = '1';

  // clone first + last cho loop smooth
  const leftFirstClone = leftOrig[0].cloneNode(true);
  const leftLastClone  = leftOrig[leftOrig.length - 1].cloneNode(true);
  const rightFirstClone = rightOrig[0].cloneNode(true);
  const rightLastClone  = rightOrig[rightOrig.length - 1].cloneNode(true);

  leftSlides.appendChild(leftFirstClone);
  leftSlides.insertBefore(leftLastClone, leftSlides.firstChild);
  rightSlides.appendChild(rightFirstClone);
  rightSlides.insertBefore(rightLastClone, rightSlides.firstChild);

  // cập nhật danh sách ảnh sau khi clone
  const leftAll = Array.from(leftSlides.querySelectorAll('img, *'));
  const rightAll = Array.from(rightSlides.querySelectorAll('img, *'));
  // dùng leftAll.length làm total (giả sử 2 slider bằng nhau số lượng)
  const total = leftAll.length; // original + 2
  const stepPercent = 100 / total; // mỗi slot chiếm bao nhiêu % của slides container

  // đảm bảo slides container có width = total * 100% và mỗi item đúng width
  leftSlides.style.width = `${total * 100}%`;
  rightSlides.style.width = `${total * 100}%`;
  leftAll.forEach(el => el.style.width = `${100 / total}%`);
  rightAll.forEach(el => el.style.width = `${100 / total}%`);

  // start index = 1 vì index 0 là clone last
  let index = 1;
  let isTransitioning = false;
  let autoplayId = null;

  function goTo(i, animate = true) {
    if (animate) {
      leftSlides.style.transition = 'transform 0.5s ease';
      rightSlides.style.transition = 'transform 0.5s ease';
    } else {
      leftSlides.style.transition = 'none';
      rightSlides.style.transition = 'none';
    }
    const x = -i * stepPercent;
    leftSlides.style.transform = `translateX(${x}%)`;
    rightSlides.style.transform = `translateX(${x}%)`;
    index = i;
  }

  function next() {
    if (isTransitioning) return;
    isTransitioning = true;
    goTo(index + 1, true);
  }
  function prev() {
    if (isTransitioning) return;
    isTransitioning = true;
    goTo(index - 1, true);
  }

  function onTransitionEnd() {
    isTransitioning = false;
    // nếu ở clone cuối -> reset không animation về real đầu (index = 1)
    if (index === total - 1) {
      goTo(1, false);
    }
    // nếu ở clone đầu -> reset không animation về real cuối (total - 2)
    if (index === 0) {
      goTo(total - 2, false);
    }
  }

  leftSlides.addEventListener('transitionend', onTransitionEnd);
  rightSlides.addEventListener('transitionend', onTransitionEnd);

  const prevBtn = container.querySelector('.prev') || document.querySelector('.prev');
  const nextBtn = container.querySelector('.next') || document.querySelector('.next');
  if (prevBtn) prevBtn.addEventListener('click', () => { prev(); restartAuto(); });
  if (nextBtn) nextBtn.addEventListener('click', () => { next(); restartAuto(); });

  function startAuto() {
    stopAuto();
    autoplayId = setInterval(next, 3000);
  }
  function stopAuto() { if (autoplayId) clearInterval(autoplayId); autoplayId = null; }
  function restartAuto() { stopAuto(); startAuto(); }

  container.addEventListener('mouseenter', stopAuto);
  container.addEventListener('mouseleave', restartAuto);

  // chờ ảnh load xong để set initial pos chính xác
  const allImgs = Array.from(leftSlides.querySelectorAll('img')).concat(Array.from(rightSlides.querySelectorAll('img')));
  const promises = allImgs.map(img => img.complete ? Promise.resolve() : new Promise(r => img.addEventListener('load', r)));
  Promise.all(promises).then(() => {
    goTo(index, false);
    startAuto();
  });
}

// Khởi tạo trang khi DOM đã sẵn sàng
document.addEventListener('DOMContentLoaded', async function() {
  // Load vouchers nếu có container
  if (document.getElementById('voucherList')) {
    const vouchers = await fetchVouchers();
    renderVouchers(vouchers);
  }
  
  // Display promo codes nếu có container
  if (document.getElementById('promo-codes-list')) {
    displayPromoCodes();
  }

  // Chạy slider nếu có slides
  initTwoBannerSlider();
});

// Export functions để có thể sử dụng ở file khác
window.voucherFunctions = {
  fetchVouchers,
  renderVouchers,
  displayPromoCodes,
  showModal,
  isLoggedIn,
  initTwoBannerSlider
};
