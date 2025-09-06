document.addEventListener('DOMContentLoaded', () => {
  checkLoginStatus();
  setupLogout();
  showSlides();
  setupCategoryDropdown();
  setupDropdownHover('.publisher-dropdown');
  setupDropdownHover('.category-top-dropdown');
  loadPromotions(); // Tải khuyến mãi và sản phẩm khuyến mãi
  updateCartCount();
});

// Hàm cập nhật số lượng giỏ hàng
function updateCartCount() {
  const cart = JSON.parse(localStorage.getItem('cart') || '[]');
  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
  const cartLink = document.querySelector('.top-links li a[href="cart.html"]');
  if (cartLink) {
    cartLink.innerHTML = `<i class="fas fa-shopping-cart"></i> Giỏ hàng (${cartCount})`;
  }
}

// Kiểm tra trạng thái đăng nhập
function checkLoginStatus() {
  const user = JSON.parse(localStorage.getItem('user') || localStorage.getItem('loggedInUser') || '{}');
  const loginLink = document.getElementById('loginLink');
  const loggedInAccount = document.querySelector('.logged-in-account');
  const accountLink = document.getElementById('accountLink');

  if (user && (user.tenkh || user.hoten || user.username)) {
    if (loginLink) loginLink.style.display = 'none';
    if (loggedInAccount) {
      loggedInAccount.style.display = 'inline-block';
      accountLink.innerHTML = `<i class="fas fa-user"></i> ${user.tenkh || user.hoten || user.username}`;
    }
    document.querySelector('.account-dropdown .dropdown-content').style.display = 'none';
  } else {
    if (loginLink) loginLink.style.display = 'inline-block';
    if (loggedInAccount) loggedInAccount.style.display = 'none';
  }
}

// Thiết lập sự kiện đăng xuất
function setupLogout() {
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      localStorage.removeItem('user');
      localStorage.removeItem('loggedInUser');
      localStorage.removeItem('token');
      window.location.href = 'index.html';
    });
  }
}

// Slideshow functionality
let slideIndex = [0, 0];
const slideColumns = document.querySelectorAll('.slideshow-column');

function showSlides() {
  slideColumns.forEach((column, i) => {
    const slides = column.getElementsByClassName('mySlides');
    for (let j = 0; j < slides.length; j++) {
      slides[j].style.display = 'none';
    }
    slideIndex[i]++;
    if (slideIndex[i] > slides.length) slideIndex[i] = 1;
    slides[slideIndex[i] - 1].style.display = 'block';
  });
  setTimeout(showSlides, 3000);
}

// Thiết lập dropdown danh mục trong sidebar
function setupCategoryDropdown() {
  const categoryDropdown = document.getElementById('categoryDropdown');
  if (!categoryDropdown) return;

  const dropdownHeader = categoryDropdown.querySelector('.dropdown-header');
  if (dropdownHeader) {
    dropdownHeader.addEventListener('click', () => {
      categoryDropdown.classList.toggle('dropdown-active');
    });
  }

  document.addEventListener('click', (event) => {
    if (!categoryDropdown.contains(event.target)) {
      categoryDropdown.classList.remove('dropdown-active');
    }
  });
}

// Thiết lập hover cho dropdown
function setupDropdownHover(selector) {
  const dropdown = document.querySelector(selector);
  if (dropdown) {
    dropdown.addEventListener('mouseenter', () => {
      dropdown.querySelector('.dropdown-content').style.display = 'block';
    });
    dropdown.addEventListener('mouseleave', () => {
      dropdown.querySelector('.dropdown-content').style.display = 'none';
    });
  }
}

// Hàm định dạng giá
function formatPrice(price) {
  return new Intl.NumberFormat('vi-VN').format(price);
}

// Hàm định dạng ngày tháng
function formatDate(dateString) {
  const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
  return new Date(dateString).toLocaleDateString('vi-VN', options);
}

// Hàm thoát ký tự HTML
function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Biến debounce toàn cục
let debounceTimer;

// Tải danh sách khuyến mãi và sản phẩm khuyến mãi mặc định
function loadPromotions() {
  const discountSelect = document.getElementById('discountSelect');
  const promotionsList = document.getElementById('promotions-list');
  const dealHotContainer = document.getElementById('deal-hot-list');

  if (!discountSelect || !promotionsList || !dealHotContainer) {
    console.error('Không tìm thấy discountSelect, promotions-list hoặc deal-hot-list');
    return;
  }

  discountSelect.innerHTML = '<option value="">Chọn chương trình khuyến mãi</option>';
  promotionsList.innerHTML = '<li>Đang tải khuyến mãi...</li>';
  dealHotContainer.innerHTML = '<div class="loading">Đang tải sản phẩm khuyến mãi...</div>';
  dealHotContainer.style.display = 'grid'; // Hiển thị container

  fetch('http://localhost:5000/api/khuyenmai?activeOnly=true')
    .then(response => {
      if (!response.ok) throw new Error('Lỗi khi tải khuyến mãi');
      return response.json();
    })
    .then(data => {
      discountSelect.innerHTML = '<option value="">Chọn chương trình khuyến mãi</option>';
      promotionsList.innerHTML = '';

      if (!data.data || data.data.length === 0) {
        promotionsList.innerHTML = '<li>Không có khuyến mãi nào</li>';
        dealHotContainer.innerHTML = '<div class="no-products"><p>Không có sản phẩm khuyến mãi</p></div>';
        dealHotContainer.style.display = 'grid';
        return;
      }

      data.data.forEach(promotion => {
        let discountText = '';
        switch (promotion.LoaiKM) {
          case 'giam_phan_tram':
            discountText = promotion.MoTa?.match(/(\d+)%/) ? `-${promotion.MoTa.match(/(\d+)%/)[1]}%` : 'Giảm giá';
            break;
          case 'giam_tien_mat':
            discountText = promotion.MoTa?.match(/(\d+)/) ? `-${Number(promotion.MoTa.match(/(\d+)/)[1]).toLocaleString()}đ` : 'Giảm giá';
            break;
          case 'mua_x_tang_y':
            discountText = promotion.MoTa || 'Mua X tặng Y';
            break;
          case 'qua_tang':
            discountText = promotion.MoTa || 'Tặng quà';
            break;
          case 'combo':
            discountText = promotion.MoTa || 'Combo ưu đãi';
            break;
          default:
            discountText = promotion.MoTa || 'Khuyến mãi';
        }

        const option = document.createElement('option');
        option.value = promotion.MaKM;
        option.textContent = `${promotion.TenKM} - ${discountText}`;
        discountSelect.appendChild(option);

        const listItem = document.createElement('li');
        listItem.innerHTML = `
          <a href="/khuyenmai.html?id=${promotion.MaKM}">
            <span class="text-discount-title">${promotion.TenKM}</span>
            <span class="text-discount-description">${promotion.MoTa || ''}</span>
            <span class="text-discount-price">
              ${discountText}
              <span class="text-discount-percent">${formatDate(promotion.NgayBatDau)} - ${formatDate(promotion.NgayKetThuc)}</span>
            </span>
          </a>
        `;
        promotionsList.appendChild(listItem);
      });

      // Tải sản phẩm khuyến mãi mặc định
      fetchDealHotProducts();
    })
    .catch(error => {
      console.error('Lỗi khi tải khuyến mãi:', error);
      discountSelect.innerHTML = '<option value="">Không tải được khuyến mãi</option>';
      promotionsList.innerHTML = '<li>Lỗi khi tải khuyến mãi</li>';
      dealHotContainer.innerHTML = '<div class="error"><p>Lỗi khi tải sản phẩm khuyến mãi</p></div>';
      dealHotContainer.style.display = 'grid';
    });
}

// Tải sản phẩm khuyến mãi
function fetchDealHotProducts(MaKM = '') {
  const dealHotContainer = document.getElementById('deal-hot-list');
  if (!dealHotContainer) {
    console.error('Không tìm thấy deal-hot-list');
    return;
  }

  dealHotContainer.innerHTML = '<div class="loading">Đang tải sản phẩm khuyến mãi...</div>';
  dealHotContainer.style.display = 'grid';

  const url = MaKM
    ? `http://localhost:5000/api/product/deal-hot?MaKM=${MaKM}&limit=20`
    : 'http://localhost:5000/api/product/deal-hot?limit=20';

  fetch(url)
    .then(response => {
      if (!response.ok) throw new Error(`Lỗi khi tải sản phẩm khuyến mãi: ${response.status}`);
      return response.json();
    })
    .then(products => {
      console.log('Sản phẩm khuyến mãi:', products);
      if (!products || products.length === 0) {
        dealHotContainer.innerHTML = `
          <div class="no-products">
            <i class="fas fa-book"></i>
            <p>Hiện không có sản phẩm khuyến mãi nào</p>
          </div>
        `;
        dealHotContainer.style.display = 'grid';
        return;
      }
      displayProducts(products, 'deal-hot-list', 20); // Gọi hàm từ book.js
      dealHotContainer.style.display = 'grid';
    })
    .catch(error => {
      console.error('Lỗi khi tải sản phẩm khuyến mãi:', error);
      dealHotContainer.innerHTML = `
        <div class="error">
          <p>Lỗi khi tải sản phẩm khuyến mãi: ${error.message}</p>
          <button onclick="fetchDealHotProducts('${MaKM}')">Thử lại</button>
        </div>
      `;
      dealHotContainer.style.display = 'grid';
    });
}

// Xử lý chọn chương trình khuyến mãi
window.selectDiscount = function (discountId) {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    const dealHotContainer = document.getElementById('deal-hot-list');
    if (!dealHotContainer) {
      console.error('Không tìm thấy deal-hot-list');
      return;
    }

    dealHotContainer.style.display = 'grid';
    localStorage.setItem('currentPromotion', discountId || '');
    fetchDealHotProducts(discountId);

    // Khôi phục các danh sách khác
    fetchAndDisplayProducts();
    fetchAndDisplayTextbooks();
  }, 300);
};

// Tìm kiếm sản phẩm
window.searchProducts = function () {
  const keyword = document.getElementById('searchInput').value.trim();
  if (!keyword) {
    alert('Vui lòng nhập từ khóa tìm kiếm!');
    return;
  }

  fetch(`http://localhost:5000/api/product/search?keyword=${encodeURIComponent(keyword)}`)
    .then(response => {
      if (!response.ok) throw new Error('Lỗi khi tìm kiếm');
      return response.json();
    })
    .then(data => {
      if (data.message) {
        alert(data.message);
        return;
      }

      if (data.type === 'detail') {
        window.location.href = `/product_detail.html?id=${data.data.MaSP}`;
      } else if (data.type === 'category') {
        localStorage.setItem('currentCategory_book-list', data.MaTL);
        window.location.href = '/book.html';
      } else if (data.type === 'list') {
        localStorage.setItem('searchResults', JSON.stringify(data.data));
        window.location.href = '/search-results.html';
      }
    })
    .catch(error => {
      console.error('Lỗi khi tìm kiếm sản phẩm:', error);
      alert('Đã có lỗi xảy ra khi tìm kiếm. Vui lòng thử lại!');
    });
};

// Lọc sản phẩm theo giá
window.filterProductsByPrice = function (priceRange) {
  console.log('Đã chọn khoảng giá:', priceRange);
  filterProductsByPriceRange(priceRange, 'book-list'); // Chỉ lọc cho book-list
};

// Lọc sản phẩm theo danh mục
window.filterProductsByCategory = function (categoryId) {
  console.log('Đã chọn danh mục:', categoryId);
  localStorage.setItem('currentCategory_book-list', categoryId);
  window.location.href = '/book.html';
};


function loadContent(url) {
  console.log('Đang tải:', url);
  fetch(url)
    .then(response => {
      if (!response.ok) {
        console.error(`Lỗi HTTP: ${response.status}`);
        window.location.href = url; // Chuyển hướng nếu fetch thất bại
        throw new Error(`HTTP error: ${response.status}`);
      }
      return response.text();
    })
    .then(html => {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const newContainer = doc.querySelector('.container');
      if (newContainer) {
        document.querySelector('.container').innerHTML = newContainer.innerHTML;
        history.pushState({}, '', url);
        if (typeof fetchAndDisplayProducts === 'function') fetchAndDisplayProducts();
        if (typeof fetchAndDisplayPromotions === 'function') fetchAndDisplayPromotions();
        if (typeof fetchAndDisplayTextbooks === 'function') fetchAndDisplayTextbooks();
      } else {
        console.error('Không tìm thấy .container, chuyển hướng trực tiếp');
        window.location.href = url; // Chuyển hướng nếu không tìm thấy .container
      }
    })
    .catch(error => {
      console.error('Lỗi khi tải nội dung:', error);
      window.location.href = url; // Chuyển hướng nếu có lỗi
    });
}
