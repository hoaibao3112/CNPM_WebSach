// Updated book.js (Frontend - Trang sách)
let allProducts = {};
var productsSearchMain
// Hàm định dạng giá
function formatPrice(price) {
  return new Intl.NumberFormat('vi-VN').format(price);
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

// Hàm hiển thị toast notification
function showToast(message) {
  // Tạo phần tử toast
  const toast = document.createElement('div');
  toast.className = 'toast-notification';
  toast.innerHTML = `
    <span>${escapeHtml(message)}</span>
    <button class="toast-close">&times;</button>
  `;

  // Thêm toast vào body
  document.body.appendChild(toast);

  // Tự động ẩn sau 3 giây
  const autoHide = setTimeout(() => {
    toast.classList.add('hide');
    setTimeout(() => toast.remove(), 300); // Xóa sau khi animation hoàn tất
  }, 3000);

  // Xử lý nút đóng
  toast.querySelector('.toast-close').addEventListener('click', () => {
    clearTimeout(autoHide);
    toast.classList.add('hide');
    setTimeout(() => toast.remove(), 300);
  });
}

// Hàm thêm sản phẩm vào giỏ hàng (cập nhật để sử dụng API nếu đăng nhập)
async function addToCart(productId, productName, price, image) {
  const user = JSON.parse(localStorage.getItem('user') || localStorage.getItem('loggedInUser') || '{}');
  const token = localStorage.getItem('token');

  if (user && (user.makh || user.tenkh) && token) {
    // Nếu đã đăng nhập, sử dụng API
    try {
      const response = await fetch('http://localhost:5000/api/client/cart/add', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ productId, quantity: 1 })
      });

      if (response.ok) {
        const data = await response.json();
        showToast(`Đã thêm ${productName} vào giỏ hàng!`);
        updateCartCount(); // Cập nhật UI từ index.js
        return;
      } else {
        const errorData = await response.json();
        showToast(errorData.error || 'Lỗi khi thêm vào giỏ hàng');
      }
    } catch (error) {
      console.error('Lỗi thêm vào giỏ hàng:', error);
      showToast('Lỗi kết nối. Vui lòng thử lại!');
    }
  } else {
    // Nếu chưa đăng nhập, sử dụng localStorage (fallback)
    let cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const existingItem = cart.find(item => item.id === productId);

    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      cart.push({
        id: productId,
        name: productName,
        price: price,
        image: image,
        quantity: 1,
      });
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    showToast(`Đã thêm ${productName} vào giỏ hàng! (Vui lòng đăng nhập để lưu vĩnh viễn)`);
    updateCartCount(); // Cập nhật UI
  }
}

// Hàm hiển thị danh sách sản phẩm
function displayProducts(products, containerId = 'book-list', limit = null) {
  const productList = document.getElementById(containerId);
  if (!productList) {
    console.error(`Không tìm thấy phần tử #${containerId}`);
    return;
  }

  // reset nội dung danh sách
  productList.innerHTML = '';

  // xoá nút "xem thêm" cũ nếu có
  const oldViewMore = productList.parentElement.querySelector('.view-more-container');
  if (oldViewMore) {
    oldViewMore.remove();
  }

  // nếu không có sản phẩm
  if (!products || products.length === 0) {
    productList.innerHTML = `
      <div class="no-products">
        <i class="fas fa-book"></i>
        <p>Hiện không có sản phẩm nào</p>
      </div>
    `;
    return;
  }

  allProducts[containerId] = products;
  const displayCount = limit && limit < products.length ? limit : products.length;
  const displayProducts = products.slice(0, displayCount);

  displayProducts.forEach(product => {
    const productElement = document.createElement('div');
    productElement.className = 'product-item';

    const isOutOfStock = product.TinhTrang?.data
      ? product.TinhTrang.data[0] === 0
      : (product.TinhTrang === 0 || product.SoLuong === 0);

    const discountPercent = product.PhanTramGiam || 0;
    const progressPercent = product.DaBan && product.SoLuong
      ? Math.min((product.DaBan / (product.SoLuong + product.DaBan)) * 100, 100)
      : 0;

    productElement.innerHTML = `
      <div class="product-image">
        <img src="img/product/${product.HinhAnh || 'default-book.jpg'}"
             alt="${escapeHtml(product.TenSP)}"
             onerror="this.src='img/default-book.jpg'">
        ${isOutOfStock ? '<span class="stock-status">HẾT HÀNG</span>' : ''}
      </div>
      <div class="product-info">
        <h3 class="product-title">${escapeHtml(product.TenSP)}</h3>
        <p class="product-author">Tác giả: ${escapeHtml(product.TacGia || product.TenTG || 'Đang cập nhật')}</p>
        <p class="product-year">Năm XB: ${product.NamXB || 'Đang cập nhật'}</p>
        <div class="product-price">
          <span class="original-price">${formatPrice(product.GiaGoc || (product.DonGia * 1.25))}đ</span>
          <span class="price">${formatPrice(product.DonGia)}đ</span>
          ${discountPercent ? `<span class="discount">-${discountPercent}%</span>` : ''}
        </div>
        <div class="progress-bar">
          <div class="progress" style="width: ${progressPercent}%;"></div>
        </div>
        <small>Còn ${product.SoLuong || 0} cuốn sách</small>
        <div class="product-actions">
          <button class="btn-add-cart" ${isOutOfStock ? 'disabled' : ''}
                  onclick="addToCart(${product.MaSP}, '${escapeHtml(product.TenSP)}', ${product.DonGia}, '${product.HinhAnh || 'default-book.jpg'}')">
            Thêm giỏ hàng
          </button>
          <button class="btn-detail" onclick="viewDetail(${product.MaSP})">
            <i class="fas fa-info-circle"></i> Chi tiết
          </button>
        </div>
      </div>
    `;

    productList.appendChild(productElement);
  });

  // tạo nút xem thêm nếu cần
  if (limit && products.length > displayCount) {
    const viewMoreButton = document.createElement('div');
    viewMoreButton.className = 'view-more-container';
    viewMoreButton.innerHTML = `
      <button class="view-more-btn" onclick="showAllProducts('${containerId}')">
        Xem thêm
      </button>
    `;
    productList.parentElement.appendChild(viewMoreButton);
  }
}

// --- Filter chips UI helpers ---
function ensureFilterBar() {
  // Only show the filter bar on the book page
  const path = window.location.pathname || '';
  const isBookPage = path.endsWith('/GiaoDien/book.html') || path.endsWith('book.html');

  // If there's an existing bar but we're not on the book page, remove it
  const existingBar = document.getElementById('active-filter-bar');
  if (!isBookPage) {
    if (existingBar) existingBar.remove();
    return null;
  }

  let bar = existingBar || null;
  if (!bar) {
    const main = document.querySelector('.main-content') || document.body;
    bar = document.createElement('div');
    bar.id = 'active-filter-bar';
    bar.className = 'active-filter-bar';
    bar.innerHTML = `
      <div class="filter-chips" id="filterChips"></div>
      <button class="clear-filters-btn" id="clearFiltersBtn">Xóa bộ lọc</button>
    `;
    // insert before main product list if possible
    const ref = document.getElementById('search-book-list') || document.getElementById('book-list');
    if (ref && ref.parentElement) ref.parentElement.insertBefore(bar, ref);
    else document.body.insertBefore(bar, document.body.firstChild);
  }
  return bar;
}

// Helper to know if we are on the book page
function isBookPage() {
  const path = window.location.pathname || '';
  return path.endsWith('/GiaoDien/book.html') || path.endsWith('book.html');
}
// Return a consistent container id to use for storage keys for book page filters
function getStorageContainerId() {
  // For persistence we prefer a stable key name for the book page filters
  if (isBookPage()) return 'book-list';
  // fallback to any existing main container id
  return getMainProductContainerId() || 'search-book-list';
}
  // Storage helpers
  function storageKeyForGroup(group, containerId) {
    // Use global storage keys (no container suffix) so filters persist across pages.
    switch (group) {
      case 'supplierButtons': return `currentSupplier`;
      case 'authorButtons': return `currentAuthor`;
      case 'priceButtons': return `currentPriceRange`;
      case 'hinhThucButtons': return `currentHinhThuc`;
      case 'discountButtons': return `currentPromotion`;
      case 'category': return `currentCategory`;
      default: return null;
    }
  }

  function clearStoredFilterForGroup(group) {
    const key = storageKeyForGroup(group);
    if (!key) return;
    // remove global key
    localStorage.removeItem(key);
    // also remove known fallback/container-specific keys
    const fallbacks = [`${key}_book-list`, `${key}_search-book-list`, `${key}_promotion-book-list`];
    fallbacks.forEach(k => localStorage.removeItem(k));
  }

  // Read stored value for a filter group with fallbacks
  function getStoredFilterValue(group) {
    const key = storageKeyForGroup(group);
    if (!key) return null;
    let v = localStorage.getItem(key);
    if (v) return v;
    // fallback to older container-specific keys
    const fallbacks = [`${key}_book-list`, `${key}_search-book-list`, `${key}_promotion-book-list`];
    for (const fb of fallbacks) {
      const vv = localStorage.getItem(fb);
      if (vv) return vv;
    }
    return null;
  }

  function restoreActiveFromStorage() {
    // Use global storage keys. For backward compatibility, fall back to older
    // container-specific keys that may exist (e.g., currentPriceRange_book-list).
    const groups = ['supplierButtons','authorButtons','priceButtons','hinhThucButtons','discountButtons'];
    groups.forEach(gid => {
      const key = storageKeyForGroup(gid);
      if (!key) return;
      // Try global key first
      let stored = localStorage.getItem(key);
      // fallback keys (old names)
      if (!stored) {
        const fallbacks = [
          `${key}_book-list`,
          `${key}_search-book-list`,
          `${key}_promotion-book-list`
        ];
        for (const fb of fallbacks) {
          const v = localStorage.getItem(fb);
          if (v) { stored = v; break; }
        }
      }
      const cont = document.getElementById(gid);
      if (!cont) return;
      // remove existing active
      cont.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      if (!stored) {
        // set 'Tất cả' active
        const all = Array.from(cont.querySelectorAll('.filter-btn')).find(b => (b.dataset.value === '' || b.dataset.id === ''));
        if (all) all.classList.add('active');
        createOrUpdateChip(gid, '', '');
        return;
      }
      // find matching button by data-value or data-id
      const match = Array.from(cont.querySelectorAll('.filter-btn')).find(b => (b.dataset.value === stored || b.dataset.id === stored));
      if (match) {
        match.classList.add('active');
        createOrUpdateChip(gid, match.textContent.trim(), stored);
      }
    });
  }

function createOrUpdateChip(group, label, value) {
  ensureFilterBar();
  const chips = document.getElementById('filterChips');
  if (!chips) return;

  // if value is empty => remove existing chip for group
  const existing = chips.querySelector(`.filter-chip[data-group="${group}"]`);
  if (!value) {
    if (existing) existing.remove();
    return;
  }

  const chip = existing || document.createElement('div');
  chip.className = 'filter-chip';
  chip.dataset.group = group;
  chip.dataset.value = value;
  chip.innerHTML = `<span class="chip-label">${label}</span><button class="chip-remove" aria-label="remove">×</button>`;
  if (!existing) chips.appendChild(chip);

  // wire remove
  chip.querySelector('.chip-remove').addEventListener('click', () => {
    // reset corresponding filter group to 'Tất cả'
    const container = document.getElementById(group);
    if (container) {
      container.querySelectorAll('.filter-btn').forEach(b => {
        if (b.dataset.value === '') b.classList.add('active');
        else b.classList.remove('active');
      });
    }
    // clear stored value for this group
    clearStoredFilterForGroup(group);
    chip.remove();
    // trigger fetch with current active filters
    triggerFilterFetchFromUI();
  });
}

function clearAllChips() {
  const chips = document.getElementById('filterChips');
  if (chips) chips.innerHTML = '';
}

function triggerFilterFetchFromUI() {
  // read active selections from each filter group and call fetchProductsWithFilters
  const groups = ['supplierButtons','authorButtons','priceButtons','hinhThucButtons','discountButtons'];
  const filters = {};
  groups.forEach(gid => {
    const container = document.getElementById(gid);
    if (!container) return;
    const active = container.querySelector('.filter-btn.active');
    if (!active) return;
    const val = active.dataset.value || active.dataset.id || '';
    if (!val) return;
    switch(gid) {
      case 'supplierButtons': filters.MaNCC = val; break;
      case 'authorButtons': filters.MaTG = val; break;
      case 'priceButtons': filters.priceRange = val; break;
      case 'hinhThucButtons': filters.HinhThuc = val; break;
      case 'discountButtons': filters.MaKM = val; break;
    }
  });

  // update chips to reflect current active filters
  groups.forEach(gid => {
    const container = document.getElementById(gid);
    if (!container) return;
    const active = container.querySelector('.filter-btn.active');
    const label = active ? (active.textContent || '').trim() : '';
    const val = active ? (active.dataset.value || active.dataset.id || '') : '';
    createOrUpdateChip(gid, label, val);
  });

  // perform fetch (use stored MaTL/category if present)
  const mainContainer = getMainProductContainerId() || 'search-book-list';
  const MaTL = getStoredFilterValue('category') || '';
  const search = new URLSearchParams(window.location.search).get('search') || '';
  const query = {
    MaTL: MaTL || undefined,
    priceRange: filters.priceRange,
    MaNCC: filters.MaNCC,
    HinhThuc: filters.HinhThuc,
    MaTG: filters.MaTG,
    search: search || undefined
  };
  // remove undefined keys
  Object.keys(query).forEach(k => { if (query[k] === undefined) delete query[k]; });
  fetchProductsWithFilters(query, mainContainer, 20);
}

// Ensure the visible UI matches what's stored in localStorage.
// This is useful when the browser restores a cached DOM (back/forward cache)
// which can show previously-active buttons even after storage was cleared.
function reconcileUIWithStorage() {
  if (!isBookPage()) return;
  const groups = ['supplierButtons','authorButtons','priceButtons','hinhThucButtons','discountButtons'];
  groups.forEach(gid => {
    const cont = document.getElementById(gid);
    if (!cont) return;
    const stored = getStoredFilterValue(gid);
    // remove existing active
    cont.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    if (!stored) {
      // set 'Tất cả'
      const all = Array.from(cont.querySelectorAll('.filter-btn')).find(b => (b.dataset.value === '' || b.dataset.id === ''));
      if (all) all.classList.add('active');
      // remove chip
      const chip = document.getElementById('filterChips')?.querySelector(`.filter-chip[data-group="${gid}"]`);
      if (chip) chip.remove();
    } else {
      const match = Array.from(cont.querySelectorAll('.filter-btn')).find(b => (b.dataset.value === stored || b.dataset.id === stored));
      if (match) {
        match.classList.add('active');
        createOrUpdateChip(gid, match.textContent.trim(), stored);
      }
    }
  });
}

// When navigating via back/forward, some browsers restore the old DOM (bfcache)
// without re-running scripts. Use pageshow to reconcile the UI with storage.
window.addEventListener('pageshow', (evt) => {
  if (!isBookPage()) return;
  // Always reconcile so cleared filters don't reappear when returning to page
  reconcileUIWithStorage();
  // Ensure product list reflects current filters
  triggerFilterFetchFromUI();
});



// Hàm hiển thị tất cả sản phẩm
function showAllProducts(containerId) {
  const products = allProducts[containerId] || [];
  displayProducts(products, containerId);
  const viewMoreContainer = document.querySelector('.view-more-container');
  if (viewMoreContainer) {
    viewMoreContainer.remove();
  }
}

// Xem chi tiết sản phẩm
function viewDetail(productId) {
  localStorage.setItem('selectedProductId', productId);
  window.location.href = 'product_detail.html';
}

// Lọc sản phẩm theo thể loại
// async function filterProductsByCategory(categoryId, containerId = 'book-list') {
//   try {
//     const productList = document.getElementById(containerId);
//     if (!productList) throw new Error(`Không tìm thấy phần tử #${containerId}`);
//     productList.innerHTML = '<div class="loading">Đang tải sản phẩm...</div>';

//     let url = containerId === 'deal-hot-list'
//       ? 'http://localhost:5000/api/product/deal-hot'
//       : 'http://localhost:5000/api/product';
//     const params = new URLSearchParams();
//     if (categoryId) params.append('MaTL', categoryId);
//     if (containerId === 'deal-hot-list') {
//       const MaKM = localStorage.getItem('currentPromotion');
//       if (MaKM) params.append('MaKM', MaKM);
//     }

//     if (params.toString()) url += `?${params.toString()}`;

//     const response = await fetch(url);
//     if (!response.ok) throw new Error(`Lỗi HTTP: ${response.status}`);

//     const products = await response.json();
//     if (!Array.isArray(products)) throw new Error('Dữ liệu trả về không hợp lệ');

//     displayProducts(products, containerId, 20);
//     localStorage.setItem(`currentCategory_${containerId}`, categoryId);
//   } catch (error) {
//     console.error(`Lỗi khi lọc sản phẩm (${containerId}):`, error);
//     productList.innerHTML = `
//       <div class="error">
//         <p>${error.message}</p>
//         <button onclick="filterProductsByCategory('${categoryId}', '${containerId}')">Thử lại</button>
//       </div>
//     `;
//   }
// }

// // Lọc sản phẩm theo khoảng giá
// async function filterProductsByPriceRange(priceRange, containerId = 'book-list') {
//   try {
//     const productList = document.getElementById(containerId);
//     if (!productList) throw new Error(`Không tìm thấy phần tử #${containerId}`);
//     productList.innerHTML = '<div class="loading">Đang tải sản phẩm...</div>';

//     let url = 'http://localhost:5000/api/product';
//     const categoryId = localStorage.getItem(`currentCategory_${containerId}`);
//     const params = new URLSearchParams();
//     if (categoryId) params.append('MaTL', categoryId);
//     if (priceRange) params.append('priceRange', priceRange);

//     if (params.toString()) url += `?${params.toString()}`;

//     const response = await fetch(url);
//     if (!response.ok) throw new Error(`Lỗi HTTP: ${response.status}`);

//     const products = await response.json();
//     if (!Array.isArray(products)) throw new Error('Dữ liệu trả về không hợp lệ');

//     displayProducts(products, containerId, 20);
//     localStorage.setItem(`currentPriceRange_${containerId}`, priceRange);
//   } catch (error) {
//     console.error(`Lỗi khi lọc sản phẩm theo giá (${containerId}):`, error);
//     productList.innerHTML = `
//       <div class="error">
//         <p>${error.message}</p>
//         <button onclick="filterProductsByPriceRange('${priceRange}', '${containerId}')">Thử lại</button>
//       </div>
//     `;
//   }
// }

// Tải sản phẩm chính (danh sách chính)
async function fetchAndDisplayProducts() {
  const productList = document.getElementById('book-list');
  if (!productList) return;

  try {
    productList.innerHTML = '<div class="loading">Đang tải sản phẩm...</div>';

    let url = 'http://localhost:5000/api/product';
  // Only honor saved filters when we are on the book page itself.
  const categoryKey = storageKeyForGroup('category');
  const priceKey = storageKeyForGroup('priceButtons');
  const categoryId = isBookPage() ? (categoryKey ? localStorage.getItem(categoryKey) : null) : null;
  const priceRange = isBookPage() ? (priceKey ? localStorage.getItem(priceKey) : null) : null;
    const params = new URLSearchParams();
    if (categoryId) params.append('MaTL', categoryId);
    if (priceRange) params.append('priceRange', priceRange);

    if (params.toString()) url += `?${params.toString()}`;

    const response = await fetch(url);
    if (!response.ok) throw new Error(`Lỗi HTTP: ${response.status}`);

    const products = await response.json();
    if (!Array.isArray(products)) throw new Error('Dữ liệu trả về không hợp lệ');

    displayProducts(products, 'book-list', 20);
  } catch (error) {
    console.error('Lỗi khi tải sản phẩm:', error);
    productList.innerHTML = `
      <div class="error">
        <p>${error.message}</p>
        <button onclick="fetchAndDisplayProducts()">Thử lại</button>
      </div>
    `;
  }
}

// Tải sách khuyến mãi
async function fetchAndDisplayPromotions() {
  const productList = document.getElementById('promotion-book-list');
  if (!productList) {
    console.error('Không tìm thấy phần tử #promotion-book-list');
    return;
  }

  try {
    productList.innerHTML = '<div class="loading">Đang tải sách khuyến mãi...</div>';

    // Gọi API để lấy sản phẩm khuyến mãi
    const response = await fetch('http://localhost:5000/api/product', {
      headers: { 'Accept': 'application/json' },
    });
    if (!response.ok) throw new Error(`Lỗi HTTP: ${response.status}`);

    const text = await response.text();
    if (!text) throw new Error('Phản hồi từ server rỗng');

    let products;
    try {
      products = JSON.parse(text);
    } catch (e) {
      console.error('Nội dung phản hồi:', text);
      throw new Error(`Lỗi phân tích JSON: ${e.message}`);
    }

    if (!Array.isArray(products)) throw new Error('Dữ liệu trả về không hợp lệ');

    // Giả lập dữ liệu nếu API chưa có GiaGoc, PhanTramGiam, DaBan
    const productsWithDiscount = products.map(product => ({
      ...product,
      GiaGoc: product.GiaGoc || (product.DonGia * 1.25), // Giả lập giá gốc cao hơn 25%
      PhanTramGiam: product.PhanTramGiam || 20, // Giả lập giảm 20%
      DaBan: product.DaBan || Math.floor(Math.random() * 50) // Giả lập số lượng đã bán
    }));

    displayProducts(productsWithDiscount, 'promotion-book-list', 20);
  } catch (error) {
    console.error('Lỗi khi tải sách khuyến mãi:', error);
    productList.innerHTML = `
      <div class="error">
        <p>${error.message}</p>
        <button onclick="fetchAndDisplayPromotions()">Thử lại</button>
      </div>
    `;
  }
}
// Chọn khuyến mãi
function selectPromotion(promotionId) {
  const dealHotContainer = document.getElementById('deal-hot-list');
  dealHotContainer.innerHTML = '<div class="loading">Đang tải sản phẩm khuyến mãi...</div>';

  fetch(`http://localhost:5000/api/khuyenmai/${promotionId}/products`, {
    headers: {
      'Content-Type': 'application/json; charset=utf-8'
    }
  })
    .then(response => {
      if (!response.ok) throw new Error('Lỗi khi tải sản phẩm khuyến mãi');
      return response.json();
    })
    .then(data => {
      dealHotContainer.innerHTML = '';
      if (!data.data || data.data.length === 0) {
        dealHotContainer.innerHTML = '<div class="no-products"><p>Không có sản phẩm khuyến mãi</p></div>';
        return;
      }

      data.data.forEach(product => {
        const productDiv = document.createElement('div');
        productDiv.classList.add('product-item');
        productDiv.innerHTML = `
          <img src="${product.HinhAnh || 'placeholder.jpg'}" alt="${escapeHtml(product.TenSP)}">
          <h3>${escapeHtml(product.TenSP)}</h3>
          <p class="price">${formatPrice(product.GiaBan)} VNĐ</p>
          <button onclick="loadProductDetail('${product.MaSP}')">Xem chi tiết</button>
        `;
        dealHotContainer.appendChild(productDiv);
      });
    })
    .catch(error => {
      console.error('Lỗi khi tải sản phẩm khuyến mãi:', error);
      dealHotContainer.innerHTML = '<div class="no-products"><p>Đã có lỗi xảy ra</p></div>';
    });
}

// Thiết lập dropdown danh mục
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

// Tải sách giáo khoa
async function fetchAndDisplayTextbooks() {
  const productList = document.getElementById('textbook-list');
  if (!productList) return;

  try {
    productList.innerHTML = '<div class="loading">Đang tải sách giáo khoa...</div>';

    const response = await fetch('http://localhost:5000/api/product/category/6');
    if (!response.ok) throw new Error(`Lỗi HTTP: ${response.status}`);

    const products = await response.json();
    if (!Array.isArray(products)) throw new Error('Dữ liệu trả về không hợp lệ');

    displayProducts(products, 'textbook-list', 20);
  } catch (error) {
    console.error('Lỗi khi tải sách giáo khoa:', error);
    productList.innerHTML = `
      <div class="error">
        <p>${error.message}</p>
        <button onclick="fetchAndDisplayTextbooks()">Thử lại</button>
      </div>
    `;
  }
}

// Tải sách chính trị (MaTL = 2)
async function fetchAndDisplayPoliticsBooks() {
  const productList = document.getElementById('politics-book-list');
  if (!productList) {
    console.error('Không tìm thấy phần tử #politics-book-list');
    return;
  }

  try {
    productList.innerHTML = '<div class="loading">Đang tải sách chính trị...</div>';

    const response = await fetch('http://localhost:5000/api/product/category/2', {
      headers: { 'Accept': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`Lỗi HTTP: ${response.status} - ${response.statusText}`);
    }

    const contentType = response.headers.get('Content-Type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error(`Phản hồi không phải JSON, Content-Type: ${contentType}`);
    }

    const text = await response.text();
    if (!text) {
      throw new Error('Phản hồi từ server rỗng');
    }

    let products;
    try {
      products = JSON.parse(text);
    } catch (e) {
      console.error('Nội dung phản hồi:', text);
      throw new Error(`Lỗi phân tích JSON: ${e.message}`);
    }

    if (!Array.isArray(products)) {
      throw new Error('Dữ liệu trả về không phải mảng');
    }

    displayProducts(products, 'politics-book-list', 20);
  } catch (error) {
    console.error('Lỗi khi tải sách chính trị:', error);
    productList.innerHTML = `
      <div class="error">
        <p>${error.message}</p>
        <button onclick="fetchAndDisplayPoliticsBooks()">Thử lại</button>
      </div>
    `;
  }
}

// Tải sách khoa học (MaTL = 4)
async function fetchAndDisplayScienceBooks() {
  const productList = document.getElementById('science-book-list');
  if (!productList) return;

  try {
    productList.innerHTML = '<div class="loading">Đang tải sách khoa học...</div>';

    const response = await fetch('http://localhost:5000/api/product/category/4');
    if (!response.ok) throw new Error(`Lỗi HTTP: ${response.status}`);

    const products = await response.json();
    if (!Array.isArray(products)) throw new Error('Dữ liệu trả về không hợp lệ');

    displayProducts(products, 'science-book-list', 20);
  } catch (error) {
    console.error('Lỗi khi tải sách khoa học:', error);
    productList.innerHTML = `
      <div class="error">
        <p>${error.message}</p>
        <button onclick="fetchAndDisplayScienceBooks()">Thử lại</button>
      </div>
    `;
  }
}

// Tải danh sách khuyến mãi
// function loadPromotions() {
//   const discountSelect = document.getElementById('discountSelect');
//   const promotionsList = document.getElementById('promotions-list');
//   const dealHotContainer = document.getElementById('deal-hot-list');

//   if (!discountSelect || !promotionsList || !dealHotContainer) {
//     console.error('Không tìm thấy discountSelect, promotions-list hoặc deal-hot-list');
//     return;
//   }

//   discountSelect.innerHTML = '<option value="">Chọn chương trình khuyến mãi</option>';
//   promotionsList.innerHTML = '<li>Đang tải khuyến mãi...</li>';
//   dealHotContainer.innerHTML = '<div class="loading">Đang tải sản phẩm khuyến mãi...</div>';
//   dealHotContainer.style.display = 'grid';

//   fetch('http://localhost:5000/api/khuyenmai?activeOnly=true', {
//     headers: {
//       'Content-Type': 'application/json; charset=utf-8'
//     }
//   })
//     .then(response => {
//       if (!response.ok) throw new Error('Lỗi khi tải khuyến mãi');
//       return response.json();
//     })
//     .then(data => {
//       discountSelect.innerHTML = '<option value="">Chọn chương trình khuyến mãi</option>';
//       promotionsList.innerHTML = '';

//       if (!data.data || data.data.length === 0) {
//         promotionsList.innerHTML = '<li>Không có khuyến mãi nào</li>';
//         dealHotContainer.innerHTML = '<div class="no-products"><p>Không có sản phẩm khuyến mãi</p></div>';
//         dealHotContainer.style.display = 'grid';
//         return;
//       }

//       data.data.forEach(promotion => {
//         let discountText = '';
//         switch (promotion.LoaiKM) {
//           case 'giam_phan_tram':
//             discountText = `Giảm ${promotion.GiaTri}%`;
//             break;
//           case 'giam_tien':
//             discountText = `Giảm ${formatPrice(promotion.GiaTri)} VNĐ`;
//             break;
//           case 'mua_1_tang_1':
//             discountText = 'Mua 1 tặng 1';
//             break;
//         }

//         const option = document.createElement('option');
//         option.value = promotion.MaKM;
//         option.textContent = `${promotion.TenKM} - ${discountText}`;
//         discountSelect.appendChild(option);

//         const li = document.createElement('li');
//         li.innerHTML = `<a href="#" onclick="selectPromotion('${promotion.MaKM}')">${promotion.TenKM} - ${discountText}</a>`;
//         promotionsList.appendChild(li);
//       });

//       if (data.data.length > 0) {
//         selectPromotion(data.data[0].MaKM);
//       }
//     })
//     .catch(error => {
//       console.error('Lỗi khi tải khuyến mãi:', error);
//       promotionsList.innerHTML = '<li>Đã có lỗi xảy ra</li>';
//       dealHotContainer.innerHTML = '<div class="no-products"><p>Đã có lỗi xảy ra</p></div>';
//     });
// }


async function loadListProductSearch() {
  const params = new URLSearchParams(window.location.search);
  const keyword = params.get("search") || "";
  productsSearchMain = await searchProduct(keyword);
  // const productsCategory = products.filter(item => item.MaTL === '1');
  displayProducts(productsSearchMain, 'search-book-list', 10);
}

// Populate supplier buttons from API
async function populateSuppliers() {
  const container = document.getElementById('supplierButtons');
  if (!container) return;
  try {
    const res = await fetch('http://localhost:5000/api/product/suppliers');
    if (!res.ok) throw new Error('Không tải được danh sách nhà cung cấp');
    const suppliers = await res.json();
    // Clear except the 'Tất cả' button (first child)
    container.innerHTML = '';
    // Add 'Tất cả'
    const allBtn = document.createElement('button');
    allBtn.className = 'filter-btn active';
    allBtn.dataset.value = '';
    allBtn.textContent = 'Tất cả';
    container.appendChild(allBtn);

    suppliers.forEach(s => {
      const btn = document.createElement('button');
      btn.className = 'filter-btn';
      btn.dataset.value = s.MaNCC;
      btn.textContent = s.TenNCC;
      container.appendChild(btn);
    });

    // wire click handlers
    container.querySelectorAll('.filter-btn').forEach(b => {
      b.addEventListener('click', () => {
        container.querySelectorAll('.filter-btn').forEach(x => x.classList.remove('active'));
        b.classList.add('active');
        // persist supplier selection
        const key = storageKeyForGroup('supplierButtons');
        if (key) localStorage.setItem(key, b.dataset.value || '');
        // central handler will update chips and fetch
        triggerFilterFetchFromUI();
      });
    });
  } catch (err) {
    console.error('Lỗi populateSuppliers:', err);
  }
}

// Populate HinhThuc buttons by querying distinct values from products
async function populateHinhThuc() {
  const container = document.getElementById('hinhThucButtons');
  if (!container) return;
  try {
    let values = [];
    try {
      const res = await fetch('http://localhost:5000/api/product');
      if (!res.ok) throw new Error('Không lấy được sản phẩm để xác định HìnhThức');
      const products = await res.json();
      const set = new Set();
      products.forEach(p => { if (p.HinhThuc) set.add(p.HinhThuc); });
      values = Array.from(set);
    } catch (err) {
      console.warn('Fallback populateHinhThuc failed:', err);
    }

    container.innerHTML = '';
    const allBtn = document.createElement('button');
    allBtn.className = 'filter-btn active';
    allBtn.dataset.value = '';
    allBtn.textContent = 'Tất cả';
    container.appendChild(allBtn);

    values.forEach(v => {
      const btn = document.createElement('button');
      btn.className = 'filter-btn';
      btn.dataset.value = v;
      btn.textContent = v;
      container.appendChild(btn);
    });

    // wire click handlers
    container.querySelectorAll('.filter-btn').forEach(b => {
      b.addEventListener('click', () => {
        container.querySelectorAll('.filter-btn').forEach(x => x.classList.remove('active'));
        b.classList.add('active');
        const key = storageKeyForGroup('hinhThucButtons');
        if (key) localStorage.setItem(key, b.dataset.value || '');
        triggerFilterFetchFromUI();
      });
    });

  } catch (err) {
    console.error('Lỗi populateHinhThuc:', err);
  }
}

// Populate author buttons from API
async function populateAuthors() {
  const container = document.getElementById('authorButtons');
  if (!container) return;
  try {
    const res = await fetch('http://localhost:5000/api/product/authors');
    if (!res.ok) throw new Error('Không tải được danh sách tác giả');
    const authors = await res.json();
    // Clear existing buttons and add 'Tất cả'
    container.innerHTML = '';
    const allBtn = document.createElement('button');
    allBtn.className = 'filter-btn active';
    allBtn.dataset.value = '';
    allBtn.textContent = 'Tất cả';
    container.appendChild(allBtn);

    // create buttons but only append first N (8) initially
    const MAX_VISIBLE = 8;
    const authorButtons = authors.map(a => {
      const btn = document.createElement('button');
      btn.className = 'filter-btn';
      btn.dataset.value = a.MaTG;
      btn.title = a.TenTG;
      btn.textContent = a.TenTG;
      return btn;
    });

    authorButtons.forEach((btn, idx) => {
      if (idx < MAX_VISIBLE) container.appendChild(btn);
    });

    // show toggle if more than MAX_VISIBLE
    const toggle = document.getElementById('authorToggleBtn');
    if (toggle) {
      if (authorButtons.length > MAX_VISIBLE) {
        toggle.style.display = 'inline-block';
        toggle.textContent = 'Xem thêm';
      } else {
        toggle.style.display = 'none';
      }
    }

    // function to wire click behavior (applies to currently appended buttons)
    function wireAuthorClicks() {
      container.querySelectorAll('.filter-btn').forEach(b => {
        b.addEventListener('click', () => {
          container.querySelectorAll('.filter-btn').forEach(x => x.classList.remove('active'));
          b.classList.add('active');
          const key = storageKeyForGroup('authorButtons');
          if (key) localStorage.setItem(key, b.dataset.value || '');
          // central handler will handle building query, chips and fetching
          triggerFilterFetchFromUI();
        });
      });
    }

    // initial wire
    wireAuthorClicks();

    // toggle handler
    if (toggle) {
      let expanded = false;
      toggle.addEventListener('click', () => {
        if (!expanded) {
          // append remaining
          authorButtons.forEach((btn, idx) => {
            if (idx >= MAX_VISIBLE) container.appendChild(btn);
          });
          toggle.textContent = 'Thu gọn';
          expanded = true;
          wireAuthorClicks();
        } else {
          // collapse to first MAX_VISIBLE
          // remove nodes after the first (1 + MAX_VISIBLE) because first child is 'Tất cả'
          const nodes = Array.from(container.querySelectorAll('.filter-btn'));
          // keep index 0 (Tất cả) and next MAX_VISIBLE
          nodes.forEach((n, i) => {
            if (i > MAX_VISIBLE) container.removeChild(n);
          });
          toggle.textContent = 'Xem thêm';
          expanded = false;
        }
      });
    }
    // (restoration is handled once after all populations complete)
  } catch (err) {
    console.error('Lỗi populateAuthors:', err);
  }
}

function buildProductQuery({ MaTL, priceRange, MaNCC, HinhThuc, MaTG, search }) {
  const params = new URLSearchParams();
  if (MaTL) params.append('MaTL', MaTL);
  if (priceRange) params.append('priceRange', priceRange);
  if (MaNCC) params.append('MaNCC', Array.isArray(MaNCC) ? MaNCC.join(',') : MaNCC);
  if (MaTG) params.append('MaTG', Array.isArray(MaTG) ? MaTG.join(',') : MaTG);
  if (HinhThuc) params.append('HinhThuc', Array.isArray(HinhThuc) ? HinhThuc.join(',') : HinhThuc);
  if (search) params.append('search', search);
  return 'http://localhost:5000/api/product?' + params.toString();
}

function getMainProductContainerId() {
  const candidates = ['search-book-list', 'book-list', 'promotion-book-list', 'textbook-list', 'politics-book-list', 'science-book-list'];
  for (const id of candidates) {
    if (document.getElementById(id)) return id;
  }
  return null;
}

async function fetchProductsWithFilters(filters, containerId = null, limit = 20) {
  const url = buildProductQuery(filters);
  const resolvedId = containerId || getMainProductContainerId();
  if (!resolvedId) {
    console.warn('No product container found to render filtered results');
    return;
  }
  const productList = document.getElementById(resolvedId);
  if (!productList) return;
  try {
    productList.innerHTML = '<div class="loading">Đang tải sản phẩm...</div>';
    const res = await fetch(url);
    if (!res.ok) throw new Error('Lỗi HTTP ' + res.status);
    const products = await res.json();
    displayProducts(products, resolvedId, limit);
  } catch (err) {
    console.error('Lỗi fetchProductsWithFilters:', err);
    productList.innerHTML = `<div class="error"><p>${err.message}</p></div>`;
  }
}

// Hook up filter UI
// Only initialize UI behavior on book page
if (typeof window !== 'undefined' && isBookPage()) {
  document.addEventListener('DOMContentLoaded', async () => {
    // wire price button clicks
    const priceContainer = document.getElementById('priceButtons');
    if (priceContainer) {
      priceContainer.querySelectorAll('.filter-btn').forEach(b => {
        b.addEventListener('click', () => {
          priceContainer.querySelectorAll('.filter-btn').forEach(x => x.classList.remove('active'));
          b.classList.add('active');
          const price = b.dataset.value || '';
          // persist price using stable storage key
          const priceKey = storageKeyForGroup('priceButtons');
          if (priceKey) localStorage.setItem(priceKey, price);
          // central handler will update chips and fetch
          triggerFilterFetchFromUI();
        });
      });
    }

    // populate button lists on load and wait for them to complete, so we can restore stored selections
    await Promise.all([populateSuppliers(), populateHinhThuc(), populateAuthors()]);
    // restore UI from storage and fetch results once
    try {
      restoreActiveFromStorage();
    } catch (e) { /* ignore */ }
    // Trigger a fetch so restored selections actually refresh the product list
    triggerFilterFetchFromUI();
    // ensure filter bar exists and wire clear button
    const bar = ensureFilterBar();
    const clearBtn = document.getElementById('clearFiltersBtn');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        // reset all groups to 'Tất cả'
        ['supplierButtons','authorButtons','priceButtons','hinhThucButtons','discountButtons'].forEach(gid => {
          const container = document.getElementById(gid);
          if (!container) return;
          container.querySelectorAll('.filter-btn').forEach(b => {
            if (b.dataset.value === '' || b.dataset.id === '') b.classList.add('active');
            else b.classList.remove('active');
          });
        });
        // clear stored keys (use helper that also removes legacy fallback keys)
        ['supplierButtons','authorButtons','priceButtons','hinhThucButtons','discountButtons','category'].forEach(gid => {
          clearStoredFilterForGroup(gid);
        });
        // clear chips UI
        clearAllChips();
        // fetch all products
        triggerFilterFetchFromUI();
      });
    }
  });
}

// Delegated handler to ensure any .filter-btn clicked in the sidebar becomes active (red)
// and triggers the correct filtering action.
if (typeof window !== 'undefined' && isBookPage()) {
  document.addEventListener('DOMContentLoaded', () => {
    const sidebar = document.querySelector('.sidebar');
    if (!sidebar) return;

    sidebar.addEventListener('click', (e) => {
      const btn = e.target.closest('.filter-btn');
      if (!btn || !sidebar.contains(btn)) return;

      const parent = btn.parentElement;
      if (!parent) return;

      // Promotions (discount) buttons should call promotion loader
      if (parent.id === 'discountButtons' || parent.classList.contains('discount-buttons')) {
        parent.querySelectorAll('.filter-btn').forEach(x => x.classList.remove('active'));
        btn.classList.add('active');
        const promoId = btn.dataset.id || '';
        // create/update chip for promotion selection
        createOrUpdateChip(parent.id, btn.textContent.trim(), promoId);
        if (!promoId) {
          if (typeof loadAllProductsToMain === 'function') loadAllProductsToMain();
        } else {
          if (typeof loadProductsByPromotion === 'function') loadProductsByPromotion(promoId);
        }
        return;
      }

      // General filter groups: supplier, author, price, hinhthuc, format
      if (['supplierButtons','authorButtons','priceButtons','hinhThucButtons','formatButtons'].includes(parent.id) ||
          parent.classList.contains('supplier-buttons') || parent.classList.contains('author-buttons') || parent.classList.contains('price-buttons') || parent.classList.contains('format-buttons') || parent.classList.contains('hinhthuc-buttons')) {
        parent.querySelectorAll('.filter-btn').forEach(x => x.classList.remove('active'));
        btn.classList.add('active');

        // Use centralized handler so chips and fetch stay in sync
        // persist using our storage key mapping
        const gid = parent.id;
        const key = storageKeyForGroup(gid);
        if (key) {
          // value can be in data-value or data-id
          const val = btn.dataset.value || btn.dataset.id || '';
          localStorage.setItem(key, val);
        }
        triggerFilterFetchFromUI();
      }
    });
  });
}

const removeKeyWordSearch = () => {
  const currentPath = window.location.pathname;
  const searchParams = new URLSearchParams(window.location.search);
  if (currentPath.endsWith("/GiaoDien/book.html") && (searchParams.has("search") || searchParams.has("category"))) {
    document.getElementById('name-products-list').textContent = "Danh Sách tìm kiếm";
    if (performance.getEntriesByType("navigation")[0].type === "reload") {
      window.location.href = "/GiaoDien/book.html";
    }
  }
}

let currentCategory = "";
let currentPriceRange = "";

function applyFilters() {
  console.log(productsSearchMain)
  if (!productsSearchMain) return;

  let productsFiltered = [...productsSearchMain];

  // lọc theo danh mục
  if (currentCategory) {
    productsFiltered = productsFiltered.filter(
      item => String(item.MaTL) === String(currentCategory)
    );
  }

  // lọc theo giá
  if (currentPriceRange) {
    if (currentPriceRange.includes("-")) {
      const [min, max] = currentPriceRange.split("-").map(Number);
      productsFiltered = productsFiltered.filter(
        p => p.DonGia >= min && p.DonGia <= max
      );
    } else {
      const min = Number(currentPriceRange);
      productsFiltered = productsFiltered.filter(p => p.DonGia >= min);
    }
  }

  displayProducts(productsFiltered, "search-book-list", 10);
}

// chọn category
window.filterProductsByCategory = function (categoryId) {
  currentCategory = categoryId || "";
  applyFilters();
};

// chọn price
window.filterProductsByPrice = function (priceRange) {
  currentPriceRange = priceRange || "";
  applyFilters();
};

function filterProductsByCategoryOnHeader() {
  const params = new URLSearchParams(window.location.search);
  const categoryId = params.get("category");
  if (categoryId) {
    currentCategory = categoryId;
    applyFilters();
  }
}

// Gọi khi trang tải xong
document.addEventListener('DOMContentLoaded', () => {
  const currentPath = window.location.pathname;
  removeKeyWordSearch();

  // chỉ gọi các hàm này khi ở tràng index
  if (currentPath.endsWith("/GiaoDien/index.html")) {
    fetchAndDisplayProducts();
    fetchAndDisplayPromotions();
    fetchAndDisplayTextbooks();
    fetchAndDisplayPoliticsBooks();
    fetchAndDisplayScienceBooks();
  }

  // chỉ gọi hàm này khi ở trang book.html
  if (currentPath.endsWith("/GiaoDien/book.html")) {
    // loadPromotions();
    setupCategoryDropdown()
    filterProductsByCategoryOnHeader()
  }
});

// Gán các hàm vào window
window.addToCart = addToCart;
window.viewDetail = viewDetail;
// window.showAllProducts = showAllProducts;


// ============================
// Load danh sách khuyến mãi và xử lý chọn "Tất cả" hoặc 1 khuyến mãi
// ============================
async function loadPromotionsFromAPI() {
  const discountContainer = document.getElementById('discountButtons');
  const dealHotContainer = document.getElementById('deal-hot-list');
  const promotionsList = document.getElementById('promotions-list');
  const mainContainer = document.getElementById('search-book-list');

  if (!discountContainer || !dealHotContainer || !promotionsList || !mainContainer) return;

  // Reset UI
  discountContainer.innerHTML = '';
  promotionsList.innerHTML = '';
  dealHotContainer.innerHTML = '';

  try {
    const res = await fetch('http://localhost:5000/api/books/promotions', { headers: { 'Accept': 'application/json' } });
    if (!res.ok) throw new Error('Lỗi khi tải khuyến mãi');
    const data = await res.json();

    if (!Array.isArray(data) || data.length === 0) {
      promotionsList.innerHTML = '<li>Không có khuyến mãi</li>';
      dealHotContainer.innerHTML = '<div class="no-products"><p>Không có sản phẩm khuyến mãi</p></div>';
      // still load all products
      await loadAllProductsToMain();
      return;
    }

    // Add 'Tất cả' button
    const allBtn = document.createElement('button');
    allBtn.className = 'filter-btn active';
    allBtn.dataset.id = '';
    allBtn.textContent = 'Tất cả';
    discountContainer.appendChild(allBtn);

    data.forEach(promotion => {
      // left list
      const li = document.createElement('li');
      li.innerHTML = `<a href="#" onclick="selectPromotion('${promotion.MaKM}')">${promotion.endpoint}</a>`;
      promotionsList.appendChild(li);

      // button
      const btn = document.createElement('button');
      btn.className = 'filter-btn';
      btn.dataset.id = promotion.MaKM;
      btn.textContent = promotion.endpoint;
      discountContainer.appendChild(btn);
    });

    // wire handlers
    discountContainer.querySelectorAll('.filter-btn').forEach(b => {
      b.addEventListener('click', async () => {
        discountContainer.querySelectorAll('.filter-btn').forEach(x => x.classList.remove('active'));
        b.classList.add('active');
        const id = b.dataset.id || '';
        if (!id) {
          await loadAllProductsToMain();
        } else {
          await loadProductsByPromotion(id);
        }
      });
    });

    // load all products by default
    await loadAllProductsToMain();
  } catch (err) {
    console.error('Lỗi khi tải khuyến mãi:', err);
    promotionsList.innerHTML = '<li>Đã có lỗi xảy ra</li>';
    dealHotContainer.innerHTML = '<div class="no-products"><p>Đã có lỗi xảy ra</p></div>';
  }
}

async function loadAllProductsToMain() {
  const mainContainer = document.getElementById('search-book-list');
  if (!mainContainer) return;
  mainContainer.innerHTML = '<p>Đang tải tất cả sản phẩm...</p>';

  try {
    console.log('[products] fetching /api/product');
    const res = await fetch('http://localhost:5000/api/product', {
      headers: { 'Accept': 'application/json' }
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`HTTP ${res.status} ${text}`);
    }

    const allProducts = await res.json();
    console.log('[products] allProducts:', allProducts);
    displayProducts(allProducts, 'search-book-list');
  } catch (err) {
    console.error('Không tải được tất cả sản phẩm:', err);
    mainContainer.innerHTML = `<p>Không tải được tất cả sản phẩm: ${escapeHtml(err.message || String(err))}</p>`;
  }
}

// ============================
// Lấy sản phẩm theo khuyến mãi
// ============================
async function loadProductsByPromotion(promoId) {
  const mainContainer = document.getElementById('search-book-list');
  if (!mainContainer) return;
  mainContainer.innerHTML = '<p>Đang tải sản phẩm khuyến mãi...</p>';

  try {
    console.log(`[promotions] fetching /api/books/promotions/${promoId}/products`);
    const res = await fetch(`http://localhost:5000/api/books/promotions/${promoId}/products`, {
      headers: { 'Accept': 'application/json' }
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`HTTP ${res.status} ${text}`);
    }

    const products = await res.json();
    console.log('[promotions] products:', products);

    if (!Array.isArray(products)) {
      mainContainer.innerHTML = '<p>Dữ liệu sản phẩm khuyến mãi không hợp lệ</p>';
      return;
    }

    displayProducts(products, 'search-book-list');
  } catch (err) {
    console.error('Lỗi khi tải sản phẩm khuyến mãi:', err);
    mainContainer.innerHTML = `<p>Không tải được sản phẩm khuyến mãi: ${escapeHtml(err.message || String(err))}</p>`;
  }
}

// Khi DOM load xong
if (typeof window !== 'undefined' && isBookPage()) {
  document.addEventListener('DOMContentLoaded', () => {
    loadPromotionsFromAPI();
  });
}
