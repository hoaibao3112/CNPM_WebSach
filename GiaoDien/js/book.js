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
    const categoryId = localStorage.getItem('currentCategory_book-list');
    const priceRange = localStorage.getItem('currentPriceRange_book-list');
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

const removeKeyWordSearch = () => {
  const currentPath = window.location.pathname;
  const searchParams = new URLSearchParams(window.location.search);
  if (currentPath.endsWith("/GiaoDien/book.html") && searchParams.has("search")) {
    document.getElementById('name-products-list').textContent = "Danh Sách tìm kiếm";
    if (performance.getEntriesByType("navigation")[0].type === "reload") {
      window.location.href = "/GiaoDien/book.html";
    }
  }
}

let currentCategory = "";
let currentPriceRange = "";

function applyFilters() {
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
  }

});

// Gán các hàm vào window
window.addToCart = addToCart;
window.viewDetail = viewDetail;
// window.showAllProducts = showAllProducts;
window.filterProductsByCategory = filterProductsByCategory;
