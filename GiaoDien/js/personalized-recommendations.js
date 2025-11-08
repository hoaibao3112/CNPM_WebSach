/**
 * Component: Có thể bạn thích - Personalized Recommendations
 * Hiển thị sản phẩm gợi ý dựa trên sở thích cá nhân của khách hàng
 */

const PersonalizedRecommendations = {
  // Configuration
  config: {
    apiBaseUrl: 'http://localhost:5000/api',
    defaultLimit: 10,
    storageKeys: {
      customerInfo: 'customerInfo',
      authToken: 'authToken'
    }
  },

  // State
  state: {
    isLoading: false,
    recommendations: [],
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
        console.log('Khách chưa đăng nhập, hiển thị sản phẩm mặc định');
        await this.loadDefaultRecommendations();
        return;
      }

      // Load recommendations và insights song song
      await Promise.all([
        this.loadPersonalizedRecommendations(customerId),
        this.loadCustomerInsights(customerId)
      ]);

      this.render();
    } catch (error) {
      console.error('Lỗi khởi tạo component:', error);
      this.state.error = error.message;
      this.renderError();
    }
  },

  /**
   * Lấy mã khách hàng từ localStorage
   */
  getCustomerId() {
    try {
      const customerInfo = localStorage.getItem(this.config.storageKeys.customerInfo);
      if (!customerInfo) return null;
      
      const parsed = JSON.parse(customerInfo);
      return parsed.makh || parsed.MaKH || null;
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
   * Load sản phẩm gợi ý cá nhân hóa
   */
  async loadPersonalizedRecommendations(customerId) {
    this.state.isLoading = true;
    
    try {
      const response = await fetch(
        `${this.config.apiBaseUrl}/recommendation/personalized?makh=${customerId}&limit=${this.config.defaultLimit}`,
        {
          headers: this.getHeaders()
        }
      );

      if (!response.ok) {
        // Nếu không có recommendations, load sản phẩm mặc định
        console.warn('Không thể tải sản phẩm gợi ý cá nhân, dùng mặc định');
        await this.loadDefaultRecommendations();
        return;
      }

      const data = await response.json();
      
      // Kiểm tra cấu trúc response từ API
      if (data.success && Array.isArray(data.data)) {
        this.state.recommendations = data.data;
      } else if (Array.isArray(data)) {
        this.state.recommendations = data;
      } else {
        // Không có recommendations, dùng mặc định
        await this.loadDefaultRecommendations();
        return;
      }
      
      this.state.isLoading = false;
    } catch (error) {
      console.error('Lỗi load recommendations:', error);
      // Fallback to default
      await this.loadDefaultRecommendations();
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
   * Load sản phẩm mặc định (cho khách chưa đăng nhập)
   */
  async loadDefaultRecommendations() {
    this.state.isLoading = true;
    
    try {
      // Lấy tất cả sản phẩm từ API với headers đúng
      const response = await fetch(`${this.config.apiBaseUrl}/product`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Kiểm tra content-type trước khi parse JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Response không phải JSON. Server có thể đang trả về HTML.');
      }

      const products = await response.json();
      
      // Kiểm tra và xử lý dữ liệu
      if (!Array.isArray(products)) {
        console.warn('Response không phải array:', products);
        this.state.recommendations = [];
        this.state.isLoading = false;
        this.render();
        return;
      }

      // Sắp xếp theo ngày thêm mới nhất và lấy limit đầu tiên
      const sortedProducts = products
        .filter(p => p && p.MaSP) // Lọc sản phẩm hợp lệ
        .sort((a, b) => {
          const dateA = new Date(a.NgayThem || a.ngaythem || 0);
          const dateB = new Date(b.NgayThem || b.ngaythem || 0);
          return dateB - dateA; // Mới nhất trước
        })
        .slice(0, this.config.defaultLimit);

      this.state.recommendations = sortedProducts;
      this.state.isLoading = false;
      this.render();
    } catch (error) {
      console.error('Lỗi load default recommendations:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack
      });
      this.state.isLoading = false;
      this.state.recommendations = []; // Set empty để không hiển thị lỗi liên tục
      this.renderError();
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
    return `
      <div class="recommendations-products">
        ${this.state.recommendations.map(product => this.renderProductCard(product)).join('')}
      </div>
    `;
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
      const customerId = this.getCustomerId();
      
      if (!customerId) {
        alert('Vui lòng đăng nhập để thêm vào giỏ hàng');
        window.location.href = 'login.html';
        return;
      }

      // Find product in recommendations
      const product = this.state.recommendations.find(
        p => (p.MaSP || p.masp) === productId
      );

      if (!product) {
        throw new Error('Không tìm thấy sản phẩm');
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

      // Show success message
      this.showToast('Đã thêm vào giỏ hàng!', 'success');
      
      // Update cart count if exists
      if (window.updateCartCount) {
        window.updateCartCount();
      }
    } catch (error) {
      console.error('Lỗi thêm vào giỏ hàng:', error);
      this.showToast('Không thể thêm vào giỏ hàng', 'error');
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
