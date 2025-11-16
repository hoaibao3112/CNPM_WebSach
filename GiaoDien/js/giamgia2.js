// giamgia2.js
// Fetch promotions from backend and render 2 random offers.
async function loadThamGiaVouchers() {
  const promoOffers = document.querySelector(".promo-offers");

  // Try multiple endpoints / shapes to be resilient during development
  const endpoints = [
    "http://localhost:5000/api/khuyenmai/public?limit=10",
    "http://localhost:5501/api/khuyenmai/public?limit=10",
    "/api/khuyenmai/public?limit=10",
    "http://localhost:5000/api/voucher/",
    "http://localhost:5501/api/voucher/",
    "/api/voucher/",
  ];

  let vouchers = null;

  for (const url of endpoints) {
    try {
      const res = await fetch(url);
      if (!res.ok) continue;
      const payload = await res.json();

      // Server may return { data: [...] } (as in `khuyenmai` routes)
      if (Array.isArray(payload)) {
        vouchers = payload;
        break;
      }
      if (Array.isArray(payload.data)) {
        vouchers = payload.data;
        break;
      }
      // older shape: list under `promotions` or direct array
      if (Array.isArray(payload.promotions)) {
        vouchers = payload.promotions;
        break;
      }

      // If payload is a single object with Code fields, wrap it
      if (payload && typeof payload === 'object' && (payload.Code || payload.MaKM || payload.MaCode)) {
        vouchers = [payload];
        break;
      }
    } catch (err) {
      // try next endpoint
      console.warn('Fetch failed for', url, err.message || err);
      continue;
    }
  }

  if (!vouchers || vouchers.length === 0) {
    if (promoOffers) promoOffers.innerHTML = "<p style='text-align:center;'>Chưa có mã tham gia</p>";
    return;
  }

  // Shuffle and take 2
  const shuffled = vouchers.sort(() => Math.random() - 0.5);
  const limited = shuffled.slice(0, 2);

  const typeMap = {
    giam_phan_tram: { icon: '<i class="fa-solid fa-percent"></i>', color: "#FF6B6B" },
    giam_tien_mat: { icon: '<i class="fa-solid fa-money-bill-wave"></i>', color: "#4ECDC4" },
    free_ship: { icon: '<i class="fa-solid fa-truck"></i>', color: "#00BBF9" },
    freeship: { icon: '<i class="fa-solid fa-truck"></i>', color: "#00BBF9" },
    mua_x_tang_y: { icon: '<i class="fa-solid fa-cart-plus"></i>', color: "#45B7D1" },
    qua_tang: { icon: '<i class="fa-solid fa-gift"></i>', color: "#9B5DE5" },
    combo: { icon: '<i class="fa-solid fa-boxes-stacked"></i>', color: "#F15BB5" }
  };

  const saved = JSON.parse(localStorage.getItem("savedVouchers") || "[]");

  const html = limited.map(v => {
    // Normalize fields from different server shapes
    const type = (v.LoaiKM || v.Loai || v.type || '').toString();
    const mapping = typeMap[type] || typeMap['giam_phan_tram'];
    const code = v.Code || v.MaCode || v.MaKM || v.code || v.MaKM || v.MaCode || 'Voucher đặc biệt';
    const desc = v.MoTa || v.Description || v.GhiChu || '';
    const expiry = v.NgayKetThuc || v.NgayHetHan || v.expiry || v.NgayHetHan || null;
    let expiryText = '';
    if (expiry) {
      try {
        const dt = new Date(expiry);
        if (!isNaN(dt)) expiryText = `HSD: ${dt.toLocaleDateString('vi-VN')}`;
      } catch (e) {}
    }

    const isSaved = saved.includes(code);

    return `
      <div class="offer-card" style="border-left:6px solid ${mapping.color};">
        <div class="icon" style="color:${mapping.color};">${mapping.icon}</div>
        <div class="offer-details">
          <p class="offer-title"><strong>${code}</strong></p>
          <p class="offer-desc">${desc}</p>
          <p class="offer-expiry">${expiryText}</p>
          <button class="offer-btn" data-code="${code}" ${isSaved ? 'disabled' : ''}>
            ${isSaved ? 'Đã lưu' : 'Lưu mã'}
          </button>
        </div>
      </div>
    `;
  }).join('');

  if (promoOffers) promoOffers.innerHTML = html;

  // Attach handlers
  document.querySelectorAll('.offer-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const code = e.currentTarget.getAttribute('data-code');
      let savedList = JSON.parse(localStorage.getItem('savedVouchers') || '[]');
      if (!savedList.includes(code)) {
        savedList.push(code);
        localStorage.setItem('savedVouchers', JSON.stringify(savedList));
      }
      e.currentTarget.textContent = 'Đã lưu';
      e.currentTarget.disabled = true;
    });
  });
}

// Load top-selling products and render into .product-slides
async function loadTopSellingProducts() {
  const container = document.querySelector('.product-slides');
  if (!container) return;

  const endpoints = [
    'http://localhost:5000/api/product/top-selling?limit=6',
    'http://localhost:5501/api/product/top-selling?limit=6',
    '/api/product/top-selling?limit=6',
    '/api/products/top-selling?limit=6',
    '/top-selling?limit=6'
  ];

  let products = null;
  for (const url of endpoints) {
    try {
      const res = await fetch(url);
      if (!res.ok) continue;
      const payload = await res.json();
      if (Array.isArray(payload)) { products = payload; break; }
      if (Array.isArray(payload.data)) { products = payload.data; break; }
      if (Array.isArray(payload.results)) { products = payload.results; break; }
      if (payload && typeof payload === 'object' && (payload.MaSP || payload.MaSP === 0)) { products = [payload]; break; }
    } catch (err) {
      console.warn('Top-selling fetch failed for', url, err && err.message);
      continue;
    }
  }

  if (!products || products.length === 0) {
    if (!container.querySelector('.slide-image')) {
      container.innerHTML = '<p style="text-align:center;">Chưa có sản phẩm bán chạy</p>';
    }
    return;
  }

  const html = products.map(p => {
    // Prefer local product images inside img/product when available
    let img = 'img/anhnen2/anh3.jpg';
    if (p.HinhAnh) {
      let src = String(p.HinhAnh || '').trim();
      // Normalize backslashes to forward slashes (handles Windows paths)
      src = src.replace(/\\/g, '/');

      // If it's an absolute URL, use it directly
      if (src.startsWith('http')) {
        img = src;
      }
      // If server returned a backend path (e.g. /backend/product/...), convert to absolute backend URL
      else if (src.indexOf('backend/product') !== -1 || src.indexOf('product-images') !== -1) {
        // extract filename
        let filename = src.split('/').pop();
        // backend host/port (matches server default). Change if your backend runs on a different port.
        const backendHost = window.location.hostname || 'localhost';
        const backendPort = 5000; // update if your backend runs on a different port
        img = `${window.location.protocol}//${backendHost}:${backendPort}/product-images/${filename}`;
      }
      // If it's a full filesystem path (contains a drive letter like C:/...), extract filename and use frontend img/product
      else if (/^[a-zA-Z]:\//.test(src) || src.includes('/Users/') || src.includes('/home/')) {
        const parts = src.split('/');
        const filename = parts[parts.length - 1];
        img = `img/product/${filename}`;
      }
      // If already a relative path starting with img/ or /, use it as-is
      else if (src.startsWith('img/') || src.startsWith('/')) {
        img = src;
      }
      // Fallback: treat value as a filename and look in frontend img/product
      else {
        const filename = src.split('/').pop();
        img = `img/product/${filename}`;
      }
    }
    const price = (typeof p.DonGia === 'number') ? new Intl.NumberFormat('vi-VN').format(p.DonGia) + '₫' : (p.DonGia || 'Liên hệ');

    let badge = '';
    if (p.Promotion) {
      const promo = p.Promotion;
      if (promo.LoaiKM === 'giam_phan_tram' && promo.GiaTriGiam) badge = `-${promo.GiaTriGiam}%`;
      else if (promo.LoaiKM === 'giam_tien_mat' && promo.GiaTriGiam) badge = `-${new Intl.NumberFormat('vi-VN').format(promo.GiaTriGiam)}₫`;
      else if (promo.LoaiKM && promo.LoaiKM.includes('free')) badge = 'Freeship';
    }

    const title = (p.TenSP || '').replace(/"/g, '&quot;');
    const author = p.TenTG || '';
    const showHot = (p.SoldQty && p.SoldQty > 0) || badge;

    return `
      <div class="product-card" data-masp="${p.MaSP}">
        ${showHot ? `<div class="badge-hot">HOT</div>` : ''}
        <a href="product_detail.html?id=${p.MaSP}" style="text-decoration:none; color:inherit; display:block;">
          <img src="${img}" alt="${title}" class="product-image" />
          <div class="product-title">${title}</div>
          <div class="product-author">${author}</div>
          <div class="product-price">${price}</div>
        </a>
      </div>
    `;
  }).join('');

  container.innerHTML = html;
  // Ensure clicking the whole card navigates to detail (some sliders/overlays may block anchor clicks)
  try {
    container.querySelectorAll('.product-card').forEach(card => {
      card.addEventListener('click', (e) => {
        // ignore clicks on interactive controls
        if (e.target.closest('button') || e.target.closest('input') || e.target.closest('a')) return;
        // prefer the anchor href if present
        const a = card.querySelector('a[href]');
        if (a) {
          const href = a.getAttribute('href');
          if (href) window.location.href = href;
          return;
        }
        // fallback: use data-masp to set selectedProductId and open product_detail
        const id = card.getAttribute('data-masp');
        if (id) {
          localStorage.setItem('selectedProductId', String(id));
          window.location.href = 'product_detail.html';
        }
      });
    });
  } catch (err) {
    console.warn('Error attaching card click handlers:', err);
  }
}

// call both loaders after DOM ready
document.addEventListener('DOMContentLoaded', () => {
  loadThamGiaVouchers();
  loadTopSellingProducts();
});
