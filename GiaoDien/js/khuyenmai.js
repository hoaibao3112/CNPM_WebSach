document.addEventListener('DOMContentLoaded', function() {
    // Kiểm tra trạng thái đăng nhập
    checkLoginStatus();
    
    // Lấy danh sách khuyến mãi
    loadPromotions();
    
    // Thiết lập sự kiện cho nút lọc
    document.getElementById('showAllBtn').addEventListener('click', function() {
      this.classList.add('active');
      document.getElementById('showActiveBtn').classList.remove('active');
      loadPromotions();
    });
    
    document.getElementById('showActiveBtn').addEventListener('click', function() {
      this.classList.add('active');
      document.getElementById('showAllBtn').classList.remove('active');
      loadPromotions(true);
    });
  });
  
  // Hàm kiểm tra trạng thái đăng nhập (giống trang chủ)
  function checkLoginStatus() {
    const user = JSON.parse(localStorage.getItem('user'));
    const loginLink = document.getElementById('loginLink');
    const accountDropdown = document.getElementById('accountDropdownContainer');
    
    if (user && (user.tenkh || user.hoten)) {
      // Tạo dropdown tài khoản nếu chưa có
      if (!document.querySelector('.account-dropdown .logged-in-account')) {
        const loggedInHtml = `
          <div class="logged-in-account">
            <a href="#" id="accountLink"><i class="fas fa-user"></i> ${user.tenkh || user.hoten}</a>
            <div class="dropdown-content">
              <a href="profile.html"><i class="fas fa-user-circle"></i> Hồ sơ</a>
              <a href="#" id="logoutBtn"><i class="fas fa-sign-out-alt"></i> Đăng xuất</a>
            </div>
          </div>
        `;
        accountDropdown.innerHTML += loggedInHtml;
        loginLink.style.display = 'none';
        
        // Thiết lập sự kiện đăng xuất
        document.getElementById('logoutBtn').addEventListener('click', function(e) {
          e.preventDefault();
          localStorage.removeItem('user');
          document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
          window.location.href = 'index.html';
        });
      }
    }
  }
  
  // Hàm tải danh sách khuyến mãi
  async function loadPromotions(activeOnly = false) {
    const promotionList = document.getElementById('promotionList');
    promotionList.innerHTML = '<div class="loading">Đang tải khuyến mãi...</div>';
    
    try {
      // ✅ FIX: Sửa logic check API_CONFIG - nên throw error nếu không config
      const baseUrl = window.API_CONFIG?.BASE_URL;
      if (!baseUrl) {
        throw new Error('API_CONFIG.BASE_URL is not configured');
      }
      
      let url = `${baseUrl}/api/khuyenmai`;
      if (activeOnly) {
        url += '?activeOnly=true';
      }
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      const promotions = data.data || [];
      
      if (Array.isArray(promotions) && promotions.length > 0) {
        renderPromotions(promotions);
      } else {
        promotionList.innerHTML = '<div class="no-promotions">Hiện không có khuyến mãi nào.</div>';
      }
    } catch (error) {
      console.error('❌ Lỗi khi tải khuyến mãi:', error);
      promotionList.innerHTML = '<div class="error">Đã xảy ra lỗi khi tải khuyến mãi. Vui lòng thử lại sau.</div>';
    }
  }
  
  // Hàm hiển thị danh sách khuyến mãi
  async function renderPromotions(promotions) {
    const promotionList = document.getElementById('promotionList');
    promotionList.innerHTML = '';
    const baseUrl = window.API_CONFIG?.BASE_URL;
    
    // ✅ FIX: Fetch tất cả chi tiết TRƯỚC khi render (tránh N+1 queries)
    const promotionsWithDetails = await Promise.all(
      promotions.map(async (promotion) => {
        try {
          const response = await fetch(`${baseUrl}/api/khuyenmai/${promotion.MaKM}`);
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          const details = await response.json();
          return { ...promotion, details: details.data || details };
        } catch (error) {
          console.warn(`⚠️ Không tải chi tiết khuyến mãi ${promotion.MaKM}:`, error);
          return { ...promotion, details: null };
        }
      })
    );
    
    // ✅ Sau đó render tất cả
    promotionsWithDetails.forEach(promotion => {
      const now = new Date();
      const startDate = new Date(promotion.NgayBatDau);
      const endDate = new Date(promotion.NgayKetThuc);
      const isActive = promotion.TrangThai === 1 && now >= startDate && now <= endDate;
      
      const promotionCard = document.createElement('div');
      promotionCard.className = `promotion-card ${isActive ? 'active-promotion' : ''}`;
      
      let discountInfo = '';
      let productList = '';
      
      // ✅ FIX: Validate details tồn tại trước khi access
      if (promotion.details) {
        const details = promotion.details;
        const chiTiet = details.chi_tiet || {};
        
        if (promotion.LoaiKM === 'giam_phan_tram' && chiTiet.PhanTramGiam) {
          discountInfo = `Giảm <span class="discount-value">${chiTiet.PhanTramGiam}%</span>`;
          if (chiTiet.GiamToiDa) {
            discountInfo += ` (tối đa <span class="discount-value">${formatCurrency(chiTiet.GiamToiDa)}</span>)`;
          }
        } else if (promotion.LoaiKM === 'giam_tien_mat' && chiTiet.SoTienGiam) {
          discountInfo = `Giảm <span class="discount-value">${formatCurrency(chiTiet.SoTienGiam)}</span>`;
        } else if (promotion.LoaiKM === 'mua_x_tang_y' && chiTiet.SoLuongMua) {
          discountInfo = `Mua ${chiTiet.SoLuongMua} tặng ${chiTiet.SoLuongTang || 0}`;
        }
        
        // ✅ FIX: Validate san_pham_ap_dung là array
        if (Array.isArray(details.san_pham_ap_dung) && details.san_pham_ap_dung.length > 0) {
          productList = details.san_pham_ap_dung.map(product => 
            `<span class="product-tag">${product.TenSP || ''}</span>`
          ).join('');
        }
      }
      
      // Thêm nội dung cơ bản vào thẻ khuyến mãi
      promotionCard.innerHTML = `
        <div class="promotion-image">
          <img src="img/promotions/${promotion.MaKM}.jpg" alt="${promotion.TenKM}" onerror="this.src='img/product/default-book.jpg'">
          ${isActive ? '<span class="active-badge">ĐANG ÁP DỤNG</span>' : ''}
        </div>
        <div class="promotion-content">
          <h3 class="promotion-title">${promotion.TenKM}</h3>
          <div class="promotion-period">
            <i class="far fa-calendar-alt"></i> 
            ${formatDate(promotion.NgayBatDau)} - ${formatDate(promotion.NgayKetThuc)}
          </div>
          <div class="promotion-type">${getPromotionTypeName(promotion.LoaiKM)}</div>
          <p class="promotion-description">${promotion.MoTa || 'Khuyến mãi hấp dẫn'}</p>
        </div>
      `;
      
      promotionList.appendChild(promotionCard);
    });
  }
  
  // Hàm định dạng ngày tháng
  function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
  }
  
  // Hàm định dạng tiền tệ
  function formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  }
  
  // Hàm chuyển đổi loại khuyến mãi thành tên hiển thị
  function getPromotionTypeName(type) {
    const typeNames = {
      'giam_phan_tram': 'Giảm %',
      'giam_tien_mat': 'Giảm tiền mặt',
      'mua_x_tang_y': 'Mua X tặng Y',
      'qua_tang': 'Quà tặng',
      'combo': 'Combo'
    };
    return typeNames[type] || type;
  }
