// Đếm ngược đến 12:00 hôm nay hoặc ngày mai nếu đã qua 12h
function getNextFlashSaleTime() {
  const now = new Date();
  let target = new Date();
  target.setHours(12, 0, 0, 0);
  if (now > target) {
    target.setDate(target.getDate() + 1);
  }
  return target;
}

function updateCountdown() {
  const countdownEl = document.getElementById('countdown');
  const now = new Date();
  const target = getNextFlashSaleTime();
  let diff = Math.floor((target - now) / 1000);

  if (diff < 0) diff = 0;
  const h = String(Math.floor(diff / 3600)).padStart(2, '0');
  const m = String(Math.floor((diff % 3600) / 60)).padStart(2, '0');
  const s = String(diff % 60).padStart(2, '0');
  countdownEl.textContent = `${h} : ${m} : ${s}`;
}

setInterval(updateCountdown, 1000);
updateCountdown();

function formatPrice(price) {
  return new Intl.NumberFormat('vi-VN').format(price);
}

// Hàm hiển thị danh sách sản phẩm
function displayProducts(products, containerId = 'multi-category-list', limit = null) {
  const productList = document.getElementById(containerId);
  if (!productList) return;

  productList.innerHTML = '';

  if (!products || products.length === 0) {
    productList.innerHTML = `
      <div class="no-products">
        <i class="fas fa-book"></i>
        <p>Hiện không có sản phẩm nào</p>
      </div>
    `;
    return;
  }

  const displayCount = limit && limit < products.length ? limit : products.length;
  const displayProducts = products.slice(0, displayCount);

  displayProducts.forEach(product => {
    const productElement = document.createElement('div');
    productElement.className = 'product-item';

    // Xử lý TinhTrang từ Buffer
    const isOutOfStock = product.TinhTrang.data ? product.TinhTrang.data[0] === 0 : (product.TinhTrang === 0 || product.SoLuong === 0);
    const discountPercent = product.PhanTramGiam || 0;
    const progressPercent = product.DaBan && product.SoLuong ? Math.min((product.DaBan / (product.SoLuong + product.DaBan)) * 100, 100) : 0;

    productElement.innerHTML = `
      <div class="product-image">
        <img loading="lazy" src="img/product/${product.HinhAnh || 'default-book.jpg'}"
             alt="${product.TenSP}"
             onerror="this.src='img/default-book.jpg'">
        ${isOutOfStock ? '<span class="stock-status">HẾT HÀNG</span>' : ''}
        <div class="product-badge">MÃ: ${product.MaSP}</div>
      </div>
      <div class="product-info">
        <h3 class="product-title">${product.TenSP}</h3>
        <p class="product-author">Tác giả: ${product.TacGia || 'Đang cập nhật'}</p>
        <p class="product-year">Năm XB: ${product.NamXB || 'Đang cập nhật'}</p>
        <div class="product-price">
          <span class="original-price">${formatPrice(product.GiaGoc || (product.DonGia * 1.25))}đ</span>
          <span class="price">${formatPrice(product.DonGia)}đ</span>
          ${discountPercent ? `<span class="discount">-${discountPercent}%</span>` : ''}
        </div>
        <div class="progress-bar">
          <div class="progress" style="width: ${progressPercent}%;"></div>
        </div>
        <small>Đã bán ${product.DaBan || 0}</small>
        <button class="add-to-cart" ${isOutOfStock ? 'disabled' : ''}>Thêm giỏ hàng</button>
      </div>
    `;

    productList.appendChild(productElement);
  });
}

// Hàm lấy sản phẩm từ API multi-category
async function fetchAndDisplayMultiCategoryProducts() {
  const productList = document.getElementById('multi-category-list');
  if (!productList) return;

  try {
    productList.innerHTML = '<div class="loading">Đang tải sản phẩm...</div>';
    const response = await fetch('http://localhost:5000/api/product');
    if (!response.ok) throw new Error(`Lỗi HTTP: ${response.status}`);
    const products = await response.json();

    // Giả lập dữ liệu nếu API chưa có GiaGoc, PhanTramGiam, DaBan
    const productsWithDiscount = products.map(product => ({
      ...product,
      GiaGoc: product.GiaGoc || (product.DonGia * 1.25), // Giả lập giá gốc cao hơn 25%
      PhanTramGiam: product.PhanTramGiam || 20, // Giả lập giảm 20%
      DaBan: product.DaBan || Math.floor(Math.random() * 50) // Giả lập số lượng đã bán
    }));

    displayProducts(productsWithDiscount, 'multi-category-list', 20);
  } catch (error) {
    console.error('Fetch error:', error);
    productList.innerHTML = `<div class="error">Lỗi: ${error.message}</div>`;
  }
}

// Gọi khi trang tải xong
document.addEventListener('DOMContentLoaded', fetchAndDisplayMultiCategoryProducts);