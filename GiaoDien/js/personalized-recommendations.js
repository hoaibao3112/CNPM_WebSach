/**
 * Component: Có thể bạn thích - Personalized Recommendations
 * Hiển thị sản phẩm gợi ý dựa trên sở thích cá nhân của khách hàng
 */

const PersonalizedRecommendations = {
  // Configuration
  config: {
    apiBaseUrl: 'http://localhost:5000/api',
  defaultLimit: 8,
    storageKeys: {
      customerInfo: 'customerInfo',
      authToken: 'authToken'
    }
  },

  // State
  state: {
    isLoading: false,
    recommendations: [],
    // number of items currently shown in the UI (for "Xem thêm")
    currentLimit: 8,
    customerInsights: null,
    error: null
  },

  /**
   * Khởi tạo component
   */
  async init() {
    try {
      const customerId = this.getCustomerId();
      
      if (!customerId) {
        console.log('Khách chưa đăng nhập - không hiển thị gợi ý');
        this.hideComponent();
        return;
      }

      // Kiểm tra xem khách hàng đã điền form sở thích chưa
      const hasPreferences = await this.checkCustomerPreferences(customerId);
      
      if (!hasPreferences) {
        console.log('Khách hàng chưa điền form sở thích - không hiển thị gợi ý');
        this.hideComponent();
        return;
      }

      // Load recommendations
      await this.loadPersonalizedRecommendations(customerId);
      // Note: loadCustomerInsights bị comment vì endpoint chưa cần thiết
      // await this.loadCustomerInsights(customerId);

      this.render();
    } catch (error) {
      console.error('Lỗi khởi tạo component:', error);
      this.state.error = error.message;
      this.hideComponent();
    }
  },

  /**
   * Lấy mã khách hàng từ localStorage
   */
  getCustomerId() {
    try {
      // Thử lấy từ customerId trước (dùng bởi preference-widget)
      let customerId = localStorage.getItem('customerId');
      if (customerId) {
        console.log('✅ Found customerId:', customerId);
        return customerId;
      }

      // Thử lấy từ customerInfo
      const customerInfo = localStorage.getItem(this.config.storageKeys.customerInfo);
      if (customerInfo) {
        const parsed = JSON.parse(customerInfo);
        customerId = parsed.makh || parsed.MaKH;
        console.log('✅ Found from customerInfo:', customerId);
        return customerId;
      }

      // Thử lấy từ user object
      const user = localStorage.getItem('user');
      if (user) {
        const parsed = JSON.parse(user);
        customerId = parsed.makh || parsed.MaKH;
        console.log('✅ Found from user:', customerId);
        return customerId;
      }

      // Thử lấy từ loggedInUser
      const loggedInUser = localStorage.getItem('loggedInUser');
      if (loggedInUser) {
        const parsed = JSON.parse(loggedInUser);
        customerId = parsed.makh || parsed.MaKH;
        console.log('✅ Found from loggedInUser:', customerId);
        return customerId;
      }

      console.warn('⚠️ Không tìm thấy customerId trong localStorage');
      return null;
    } catch (error) {
      console.error('Lỗi lấy thông tin khách hàng:', error);
      return null;
    }
  },

  /**
   * Lấy token xác thực
   */
  getAuthToken() {
    return localStorage.getItem(this.config.storageKeys.authToken);
  },

  /**
   * Kiểm tra khách hàng đã có sở thích chưa
   */
  async checkCustomerPreferences(customerId) {
    try {
      console.log('🔍 Kiểm tra sở thích cho khách hàng:', customerId);
      
      // Sử dụng API check preferences giống preference-widget
      const response = await fetch(
        `${this.config.apiBaseUrl}/preferences/check?makh=${customerId}`,
        {
          headers: this.getHeaders()
        }
      );

      if (!response.ok) {
        console.warn('⚠️ API check preferences lỗi:', response.status);
        return false;
      }

      const result = await response.json();
      console.log('📦 Result check preferences:', result);
      
      // Kiểm tra xem có data sở thích không
      if (result.success && result.data) {
        const hasPreferences = result.data.hasPreferences || false;
        console.log('✅ Khách hàng đã có sở thích:', hasPreferences);
        return hasPreferences;
      }
      
      return false;
    } catch (error) {
      console.error('❌ Lỗi kiểm tra sở thích:', error);
      return false;
    }
  },

  /**
   * Ẩn component
   */
  hideComponent() {
    const container = document.getElementById('personalized-recommendations');
    if (container) {
      container.style.display = 'none';
      container.innerHTML = '';
    }
  },

  /**
   * Hiển thị component
   */
  showComponent() {
    const container = document.getElementById('personalized-recommendations');
    if (container) {
      container.style.display = 'block';
    }
  },

  /**
   * Load sản phẩm gợi ý cá nhân hóa
   */
  async loadPersonalizedRecommendations(customerId) {
    this.state.isLoading = true;
    
    try {
      console.log('🔍 Đang load recommendations cho khách hàng:', customerId);
      
      const response = await fetch(
        `${this.config.apiBaseUrl}/recommendation/personalized?makh=${customerId}&limit=${this.config.defaultLimit}`,
        {
          headers: this.getHeaders()
        }
      );

      console.log('📡 Response status:', response.status);

      if (!response.ok) {
        // Lấy error message từ server
        let errorMessage = response.statusText;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
          console.error('⚠️ API error details:', errorData);
        } catch (e) {
          // Không parse được JSON
        }
        console.warn('⚠️ API trả về lỗi:', response.status, errorMessage);
        // Không hiển thị gì nếu API lỗi
        this.hideComponent();
        return;
      }

      const data = await response.json();
      console.log('📦 Data nhận được:', data);
      
      // Kiểm tra cấu trúc response từ API
      if (data.success && Array.isArray(data.data)) {
        if (data.data.length === 0) {
          console.warn('⚠️ Không có sản phẩm gợi ý');
          this.hideComponent();
          return;
        }
        console.log('✅ Có', data.data.length, 'sản phẩm gợi ý cá nhân hóa');
  this.state.recommendations = data.data;
  // reset current limit when new data arrives
  this.state.currentLimit = this.config.defaultLimit;
        this.state.isLoading = false;
      } else if (Array.isArray(data)) {
        if (data.length === 0) {
          console.warn('⚠️ Không có sản phẩm gợi ý');
          this.hideComponent();
          return;
        }
        console.log('✅ Có', data.length, 'sản phẩm (array trực tiếp)');
  this.state.recommendations = data;
  // reset current limit when new data arrives
  this.state.currentLimit = this.config.defaultLimit;
        this.state.isLoading = false;
      } else {
        console.warn('⚠️ Data không đúng format');
        // Không hiển thị gì
        this.hideComponent();
        return;
      }
      
    } catch (error) {
      console.error('❌ Lỗi load recommendations:', error);
      // Ẩn component nếu có lỗi
      this.hideComponent();
    }
  },

  /**
   * Load thông tin insights khách hàng
   */
  async loadCustomerInsights(customerId) {
    try {
      const response = await fetch(
        `${this.config.apiBaseUrl}/recommendation/insights?makh=${customerId}`,
        {
          headers: this.getHeaders()
        }
      );

      if (!response.ok) {
        console.warn('Không thể tải insights');
        return;
      }

      const result = await response.json();
      
      // Kiểm tra cấu trúc response
      if (result.success && result.data) {
        this.state.customerInsights = result.data;
      } else if (result.insights) {
        this.state.customerInsights = result.insights;
      }
    } catch (error) {
      console.error('Lỗi load insights:', error);
    }
  },

  /**
   * Lấy headers cho API request
   */
  getHeaders() {
    const headers = {
      'Content-Type': 'application/json'
    };

    const token = this.getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  },

  /**
   * Render component
   */
  render() {
    const container = document.getElementById('personalized-recommendations');
    if (!container) {
      console.error('Container #personalized-recommendations không tồn tại');
      return;
    }

    // Đảm bảo container được hiển thị
    this.showComponent();

    if (this.state.isLoading) {
      container.innerHTML = this.renderLoading();
      return;
    }

    if (this.state.recommendations.length === 0) {
      container.innerHTML = this.renderEmpty();
      return;
    }

    container.innerHTML = `
      <div class="personalized-recommendations-section">
        ${this.renderHeader()}
        ${this.renderProducts()}
      </div>
    `;

    // Attach event listeners
    this.attachEventListeners();
  },

  /**
   * Render header với insights
   */
  renderHeader() {
    const customerId = this.getCustomerId();
    const insights = this.state.customerInsights;

    let subtitle = 'Dựa trên sở thích của bạn';
    
    if (insights && insights.topCategories && insights.topCategories.length > 0) {
      const topCategory = insights.topCategories[0].name;
      subtitle = `Vì bạn thích ${topCategory}`;
    }

    return `
      <div class="recommendations-header">
        <div class="recommendations-title">
          <h2>
            <i class="fas fa-heart"></i>
            Có thể bạn thích
          </h2>
          ${customerId ? `<p class="recommendations-subtitle">${subtitle}</p>` : ''}
        </div>
        ${this.state.recommendations.length > this.config.defaultLimit ? `
          <button class="view-all-recommendations" data-customer-id="${customerId || ''}">
            Xem tất cả
            <i class="fas fa-chevron-right"></i>
          </button>
        ` : ''}
      </div>
    `;
  },

  /**
   * Render danh sách sản phẩm
   */
  renderProducts() {
    const visible = this.state.recommendations.slice(0, this.state.currentLimit || this.config.defaultLimit);
    const moreAvailable = this.state.recommendations.length > visible.length;
    return `
      <div class="recommendations-products">
        ${visible.map(product => this.renderProductCard(product)).join('')}
      </div>
      ${moreAvailable ? `
        <div class="view-more-container">
          <button class="view-more-recommendations">Xem thêm</button>
        </div>
      ` : ''}
    `;
  },

  /**
   * Xử lý xem thêm (tăng giới hạn hiển thị)
   */
  handleViewMore() {
    const total = this.state.recommendations.length;
    const inc = this.config.defaultLimit || 10;
    const next = (this.state.currentLimit || inc) + inc;
    this.state.currentLimit = next >= total ? total : next;
    // re-render to show more items
    this.render();
  },

  /**
   * Render một card sản phẩm
   */
  renderProductCard(product) {
    const imageUrl = product.HinhAnh || product.AnhSP || product.anhsp || 'default.jpg';
    const imagePath = imageUrl.includes('img/') ? imageUrl : `img/product/${imageUrl}`;
    const productName = product.TenSP || product.tensp || 'Sản phẩm';
    const price = parseFloat(product.DonGia || product.dongia || 0);
    const discount = parseFloat(product.PhanTramGiamGia || product.phantramgiamgia || 0);
    const productId = product.MaSP || product.masp;
    const recommendationScore = product.RecommendationScore || 0;
    
    // Thông tin chi tiết thêm
    const author = product.TenTG || product.TacGia || 'Đang cập nhật';
    const year = product.NamXB || product.namxb || '';
    const pages = product.SoTrang || product.sotrang || '';
    const stock = product.SoLuong || product.soluong || 0;
    const category = product.TenTL || product.TenTheLoai || '';

    const finalPrice = discount > 0 ? price * (1 - discount / 100) : price;
    const hasDiscount = discount > 0;

    return `
      <div class="product-item recommendation-card" data-product-id="${productId}">
        ${recommendationScore > 70 ? '<div class="recommendation-badge">Phù hợp nhất</div>' : ''}
        ${hasDiscount ? `<div class="discount-badge">-${discount}%</div>` : ''}
        
        <div class="product-image">
          <img src="${imagePath}" alt="${productName}" loading="lazy" onerror="this.src='img/product/default.jpg'">
        </div>

        <div class="product-info">
          <h3 class="product-title" title="${productName}">
            ${productName}
          </h3>
          
          ${author ? `<div class="product-author">Tác giả: ${author}</div>` : ''}
          
          <div class="product-meta">
            ${year ? `<span class="product-year">Năm XB: ${year}</span>` : ''}
            ${pages ? `<span class="product-pages">${pages} trang</span>` : ''}
          </div>

          ${recommendationScore > 0 ? `
            <div class="recommendation-match">
              <div class="match-bar">
                <div class="match-fill" style="width: ${recommendationScore}%"></div>
              </div>
              <span class="match-text">${Math.round(recommendationScore)}% phù hợp</span>
            </div>
          ` : ''}
          
          <div class="product-price">
            <span class="price">${this.formatPrice(finalPrice)}</span>
            ${hasDiscount ? `
              <span class="original-price">${this.formatPrice(price)}</span>
            ` : ''}
          </div>
          
          <div class="quantity">
            ${stock > 0 ? `Còn ${stock} cuốn` : '<span class="out-of-stock">Hết hàng</span>'}
          </div>

          <div class="product-actions">
            <button class="btn-add-cart" data-product-id="${productId}" ${stock <= 0 ? 'disabled' : ''}>
              <i class="fas fa-shopping-cart"></i> Thêm vào giỏ
            </button>
            <button class="btn-detail" onclick="window.location.href='product_detail.html?id=${productId}'">
              <i class="fas fa-eye"></i> Chi tiết
            </button>
          </div>
        </div>
      </div>
    `;
  },

  /**
   * Render trạng thái loading
   */
  renderLoading() {
    return `
      <div class="personalized-recommendations-section">
        <div class="recommendations-header">
          <h2><i class="fas fa-heart"></i> Có thể bạn thích</h2>
        </div>
        <div class="recommendations-loading">
          <div class="loading-spinner"></div>
          <p>Đang tìm sản phẩm phù hợp với bạn...</p>
        </div>
      </div>
    `;
  },

  /**
   * Render trạng thái empty
   */
  renderEmpty() {
    return `
      <div class="personalized-recommendations-section">
        <div class="recommendations-header">
          <h2><i class="fas fa-heart"></i> Có thể bạn thích</h2>
        </div>
        <div class="recommendations-empty">
          <i class="fas fa-heart-broken"></i>
          <p>Chưa có sản phẩm phù hợp</p>
          <p class="empty-subtitle">Hãy chia sẻ sở thích của bạn để nhận gợi ý tốt hơn!</p>
        </div>
      </div>
    `;
  },

  /**
   * Render trạng thái error
   */
  renderError() {
    const container = document.getElementById('personalized-recommendations');
    if (!container) return;

    container.innerHTML = `
      <div class="personalized-recommendations-section">
        <div class="recommendations-error">
          <i class="fas fa-exclamation-circle"></i>
          <p>Không thể tải sản phẩm gợi ý</p>
          <button class="retry-btn" onclick="PersonalizedRecommendations.init()">
            <i class="fas fa-redo"></i> Thử lại
          </button>
        </div>
      </div>
    `;
  },

  /**
   * Format giá tiền
   */
  formatPrice(price) {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  },

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    // Add to cart buttons - sử dụng selector mới
    document.querySelectorAll('.btn-add-cart').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const productId = btn.dataset.productId;
        if (!btn.disabled) {
          this.handleAddToCart(productId);
        }
      });
    });

    // Product cards - click vào card để xem chi tiết
    document.querySelectorAll('.recommendation-card').forEach(card => {
      card.addEventListener('click', (e) => {
        // Không trigger nếu click vào button
        if (!e.target.closest('button')) {
          const productId = card.dataset.productId;
          this.handleProductClick(productId);
        }
      });
    });

    // View all button
    const viewAllBtn = document.querySelector('.view-all-recommendations');
    if (viewAllBtn) {
      viewAllBtn.addEventListener('click', () => {
        this.handleViewAll();
      });
    }

    // View more (in-place expand)
    const viewMoreBtn = document.querySelector('.view-more-recommendations');
    if (viewMoreBtn) {
      viewMoreBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.handleViewMore();
      });
    }
  },

  /**
   * Xử lý quick view
   */
  handleQuickView(productId) {
    console.log('Quick view product:', productId);
    // TODO: Implement quick view modal
    window.location.href = `product_detail.html?id=${productId}`;
  },

  /**
   * Xử lý thêm vào giỏ hàng
   */
  async handleAddToCart(productId) {
    try {
      console.log('🛒 handleAddToCart called with productId:', productId, typeof productId);
      console.log('📦 Current recommendations:', this.state.recommendations);
      
      // Find product in recommendations - so sánh cả string và number
      const product = this.state.recommendations.find(
        p => String(p.MaSP || p.masp || '') === String(productId)
      );

      console.log('🔍 Found product:', product);

      if (!product) {
        console.error('❌ Không tìm thấy sản phẩm với ID:', productId);
        console.error('Available IDs:', this.state.recommendations.map(p => p.MaSP || p.masp));
        throw new Error('Không tìm thấy sản phẩm');
      }

      // Lấy thông tin sản phẩm
      const productName = product.TenSP || product.tensp || 'Sản phẩm';
      const price = product.DonGia || product.dongia || 0;
      const image = product.HinhAnh || product.hinhanh || 'img/product/default.jpg';

      console.log('📦 Product info:', { productId, productName, price, image });

      // Sử dụng hàm addToCart từ cart.js hoặc book.js nếu có
      if (typeof window.addToCart === 'function') {
        console.log('✅ Using window.addToCart');
        await window.addToCart(productId, 1, productName, price, image);
        this.showToast('✅ Đã thêm vào giỏ hàng!', 'success');
      } else {
        console.log('⚠️ window.addToCart not found, using API directly');
        // Fallback: Gọi API trực tiếp
        const customerId = this.getCustomerId();
        
        if (!customerId) {
          this.showToast('⚠️ Vui lòng đăng nhập để thêm vào giỏ hàng', 'warning');
          setTimeout(() => window.location.href = 'login.html', 1500);
          return;
        }

        const response = await fetch(`${this.config.apiBaseUrl}/cart/add`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({
            makh: customerId,
            masp: productId,
            soluong: 1
          })
        });

        if (!response.ok) {
          throw new Error('Không thể thêm vào giỏ hàng');
        }

        this.showToast('✅ Đã thêm vào giỏ hàng!', 'success');
      }
      
      // Update cart count if exists
      if (typeof window.updateCartCount === 'function') {
        window.updateCartCount();
      }
    } catch (error) {
      console.error('❌ Lỗi thêm vào giỏ hàng:', error);
      this.showToast('❌ Không thể thêm vào giỏ hàng', 'error');
    }
  },

  /**
   * Xử lý click vào sản phẩm
   */
  handleProductClick(productId) {
    window.location.href = `product_detail.html?id=${productId}`;
  },

  /**
   * Xử lý xem tất cả
   */
  handleViewAll() {
    const customerId = this.getCustomerId();
    if (customerId) {
      window.location.href = `book.html?recommended=true&makh=${customerId}`;
    } else {
      window.location.href = 'book.html';
    }
  },

  /**
   * Hiển thị toast notification
   */
  showToast(message, type = 'info') {
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `recommendation-toast ${type}`;
    toast.innerHTML = `
      <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
      <span>${message}</span>
    `;

    document.body.appendChild(toast);

    // Show toast
    setTimeout(() => toast.classList.add('show'), 100);

    // Hide and remove toast
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }
};

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    PersonalizedRecommendations.init();
  });
} else {
  PersonalizedRecommendations.init();
}

// Export for use in other scripts
window.PersonalizedRecommendations = PersonalizedRecommendations;
