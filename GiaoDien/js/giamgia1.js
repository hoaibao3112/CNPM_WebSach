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

// ------------------ Cart helper functions ------------------
function getCart() {
  try {
    const raw = localStorage.getItem('cart_v1');
    return raw ? JSON.parse(raw) : { items: [] };
  } catch (e) {
    console.warn('Error reading cart from localStorage', e);
    return { items: [] };
  }
}

function saveCart(cart) {
  try {
    localStorage.setItem('cart_v1', JSON.stringify(cart));
    updateCartCount();
  } catch (e) {
    console.error('Error saving cart', e);
  }
}

function addToCart(product, qty = 1) {
  if (!product || !product.MaSP) throw new Error('Invalid product');
  const cart = getCart();
  const idx = cart.items.findIndex(i => String(i.MaSP) === String(product.MaSP));
  if (idx === -1) {
    cart.items.push({
      MaSP: product.MaSP,
      TenSP: product.TenSP || '',
      HinhAnh: product.HinhAnh || '',
      DonGia: product.GiaKhuyenMai || product.DonGia || 0,
      qty: qty
    });
  } else {
    cart.items[idx].qty = (cart.items[idx].qty || 0) + qty;
  }
  saveCart(cart);
  showToast('Đã thêm vào giỏ hàng');
}

function updateCartCount() {
  try {
    const cart = getCart();
    const total = cart.items.reduce((s, it) => s + (it.qty || 0), 0);
    // look for elements to update
    const els = document.querySelectorAll('.cart-count, #cart-count');
    els.forEach(el => { el.textContent = total; el.style.display = total ? 'inline-block' : 'none'; });
  } catch (e) {
    console.warn('Error updating cart count', e);
  }
}

function showToast(message, timeout = 1800) {
  try {
    let toast = document.getElementById('site-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'site-toast';
      toast.style.position = 'fixed';
      toast.style.right = '20px';
      toast.style.bottom = '20px';
      toast.style.background = 'rgba(0,0,0,0.8)';
      toast.style.color = '#fff';
      toast.style.padding = '10px 14px';
      toast.style.borderRadius = '8px';
      toast.style.zIndex = 9999;
      toast.style.fontSize = '14px';
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.style.opacity = '1';
    setTimeout(() => { toast.style.opacity = '0'; }, timeout);
  } catch (e) { /* swallow */ }
}

// Initialize cart count on load
document.addEventListener('DOMContentLoaded', updateCartCount);


const IMAGE_BASE = 'http://localhost:5000/product-images';

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

    // Xử lý TinhTrang từ Buffer (an toàn nếu TinhTrang không tồn tại)
    let isOutOfStock = false;
    try {
      if (product && product.TinhTrang !== undefined && product.TinhTrang !== null) {
        // Nếu TinhTrang là object kiểu Buffer (một số trường hợp từ DB)
        if (typeof product.TinhTrang === 'object' && Array.isArray(product.TinhTrang.data)) {
          isOutOfStock = product.TinhTrang.data[0] === 0;
        } else {
          // Nếu TinhTrang là số hoặc giá trị trực tiếp
          isOutOfStock = product.TinhTrang === 0 || product.SoLuong === 0;
        }
      } else {
        // TinhTrang không có -> kiểm tra SoLuong
        isOutOfStock = product.SoLuong === 0;
      }
    } catch (e) {
      console.warn('Error parsing TinhTrang for product', product && product.MaSP, e);
      isOutOfStock = product.SoLuong === 0;
    }
    const discountPercent = product.PhanTramGiam || 0;
    const progressPercent = product.DaBan && product.SoLuong ? Math.min((product.DaBan / (product.SoLuong + product.DaBan)) * 100, 100) : 0;

    const imageSrc = product.HinhAnh ? `${IMAGE_BASE}/${product.HinhAnh}` : 'img/default-book.jpg';
    productElement.innerHTML = `
      <div class="product-image">
        <img loading="lazy" src="${imageSrc}"
             alt="${product.TenSP}"
             onerror="this.src='img/default-book.jpg'">
        ${isOutOfStock ? '<span class="stock-status">HẾT HÀNG</span>' : ''}
        <div class="product-badge">MÃ: ${product.MaSP}</div>
        ${product.DiscountLabel ? `<div class="sale-badge">${product.DiscountLabel}</div>` : ''}
      </div>
      <div class="product-info">
        <h3 class="product-title">${product.TenSP}</h3>
        <p class="product-author">Tác giả: ${product.TacGia || 'Đang cập nhật'}</p>
        <div class="product-price">
          ${product.GiaKhuyenMai ? `<span class="price">${formatPrice(product.GiaKhuyenMai)}đ</span>
          <span class="original-price">${formatPrice(product.DonGia)}đ</span>` : `<span class="price">${formatPrice(product.DonGia)}đ</span>`}
        </div>
        <small>Khuyến mãi: ${product.TenKM || ''}</small>
        <button class="view-promo-detail" ${isOutOfStock ? 'disabled' : ''}>Xem chi tiết khuyến mãi</button>
      </div>
    `;

    productList.appendChild(productElement);
    
    // Attach view promotion detail handler (navigates to product detail page)
    const viewBtn = productElement.querySelector('.view-promo-detail');
    if (viewBtn) {
      viewBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (viewBtn.disabled) return;
        try {
          // Save selected product id for product_detail page to read
          localStorage.setItem('selectedProductId', String(product.MaSP));
          // optional: save current product object for faster load
          localStorage.setItem('currentProduct', JSON.stringify(product));
          // redirect to product detail
          window.location.href = 'product_detail.html';
        } catch (err) {
          console.error('Lỗi khi mở chi tiết:', err);
          showToast('Không thể mở chi tiết sản phẩm. Vui lòng thử lại.');
        }
      });
    }
  });
}

// Lấy sản phẩm khuyến mãi từ API /api/khuyenmai/active-products
async function fetchAndDisplayMultiCategoryProducts() {
  const productList = document.getElementById('multi-category-list');
  if (!productList) return;

  try {
    productList.innerHTML = '<div class="loading">Đang tải sản phẩm khuyến mãi...</div>';
    const response = await fetch('http://localhost:5000/api/khuyenmai/active-products');
    if (!response.ok) throw new Error(`Lỗi HTTP: ${response.status}`);
    const json = await response.json();
    const products = json && json.data ? json.data : [];

    // Map promotions into a display-friendly product object
    const productsPrepared = products.map(p => {
      const original = Number(p.DonGia || 0);
      let discounted = original;
      let discountLabel = '';
      if (p.LoaiKM === 'giam_tien_mat') {
        const discountVal = Number(p.GiaTriGiam) || 0;
        discounted = Math.max(0, original - discountVal);
        discountLabel = `-${formatPrice(discountVal)} đ`;
      } else if (p.LoaiKM === 'giam_phan_tram') {
        const pct = Number(p.GiaTriGiam) || 0;
        discounted = Math.round(original * (1 - pct / 100));
        discountLabel = `-${pct}%`;
      }

      return {
        MaSP: p.MaSP,
        TenSP: p.TenSP,
        HinhAnh: p.HinhAnh,
        DonGia: original,
        GiaKhuyenMai: discounted,
        DiscountLabel: discountLabel,
        TenKM: p.TenKM,
        MaKM: p.MaKM,
        LoaiKM: p.LoaiKM,
        NgayBatDau: p.NgayBatDau,
        NgayKetThuc: p.NgayKetThuc
      };
    });

    displayProducts(productsPrepared, 'multi-category-list', null);
  } catch (error) {
    console.error('Fetch error:', error);
    productList.innerHTML = `<div class="error">Lỗi: ${error.message}</div>`;
  }
}

// Gọi khi trang tải xong
document.addEventListener('DOMContentLoaded', fetchAndDisplayMultiCategoryProducts);