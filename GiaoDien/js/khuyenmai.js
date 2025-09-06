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
          localStorage.removeItem('token');
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
      let url = 'http://localhost:5000/api/khuyenmai';
      if (activeOnly) {
        url += '?activeOnly=true';
      }
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.data && data.data.length > 0) {
        renderPromotions(data.data);
      } else {
        promotionList.innerHTML = '<div class="no-promotions">Hiện không có khuyến mãi nào.</div>';
      }
    } catch (error) {
      console.error('Lỗi khi tải khuyến mãi:', error);
      promotionList.innerHTML = '<div class="error">Đã xảy ra lỗi khi tải khuyến mãi. Vui lòng thử lại sau.</div>';
    }
  }
  
  // Hàm hiển thị danh sách khuyến mãi
  function renderPromotions(promotions) {
    const promotionList = document.getElementById('promotionList');
    promotionList.innerHTML = '';
    
    promotions.forEach(promotion => {
      const now = new Date();
      const startDate = new Date(promotion.NgayBatDau);
      const endDate = new Date(promotion.NgayKetThuc);
      const isActive = promotion.TrangThai === 1 && now >= startDate && now <= endDate;
      
      // Tạo HTML cho từng khuyến mãi
      const promotionCard = document.createElement('div');
      promotionCard.className = `promotion-card ${isActive ? 'active-promotion' : ''}`;
      
      // Lấy thông tin chi tiết khuyến mãi
      let discountInfo = '';
      let productList = '';
      
      // Giả sử chúng ta có API để lấy chi tiết khuyến mãi
      fetch(`http://localhost:5000/api/khuyenmai/${promotion.MaKM}`)
        .then(response => response.json())
        .then(details => {
          // Xử lý thông tin giảm giá
          if (promotion.LoaiKM === 'giam_phan_tram' && details.chi_tiet.PhanTramGiam) {
            discountInfo = `Giảm <span class="discount-value">${details.chi_tiet.PhanTramGiam}%</span>`;
            if (details.chi_tiet.GiamToiDa) {
              discountInfo += ` (tối đa <span class="discount-value">${formatCurrency(details.chi_tiet.GiamToiDa)}</span>)`;
            }
          } else if (promotion.LoaiKM === 'giam_tien_mat' && details.chi_tiet.SoTienGiam) {
            discountInfo = `Giảm <span class="discount-value">${formatCurrency(details.chi_tiet.SoTienGiam)}</span>`;
          } else if (promotion.LoaiKM === 'mua_x_tang_y') {
            discountInfo = `Mua ${details.chi_tiet.SoLuongMua} tặng ${details.chi_tiet.SoLuongTang}`;
          }
          
          // Xử lý danh sách sản phẩm
          if (details.san_pham_ap_dung && details.san_pham_ap_dung.length > 0) {
            productList = details.san_pham_ap_dung.map(product => 
              `<span class="product-tag">${product.TenSP}</span>`
            ).join('');
          }
          
          // Cập nhật nội dung thẻ khuyến mãi với thông tin chi tiết
          const productsHtml = productList ? `
            <div class="promotion-products">
              <div class="products-title">Áp dụng cho:</div>
              <div class="product-list">${productList}</div>
            </div>
          ` : '';
          
          const contentDiv = promotionCard.querySelector('.promotion-content');
          if (contentDiv) {
            contentDiv.innerHTML += `
              <div class="discount-info">${discountInfo}</div>
              ${productsHtml}
            `;
          }
        })
        .catch(error => {
          console.error('Lỗi khi lấy chi tiết khuyến mãi:', error);
        });
      
      // Thêm nội dung cơ bản vào thẻ khuyến mãi
      promotionCard.innerHTML = `
        <div class="promotion-image">
          <img src="img/promotions/${promotion.MaKM}.jpg" alt="${promotion.TenKM}" onerror="this.src='img/promotions/default.jpg'">
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