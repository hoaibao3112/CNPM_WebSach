/**
 * recently-viewed.js
 * Widget "Đã xem gần đây" — lưu LocalStorage, render vào bất kỳ trang nào
 * Usage: thêm <div id="recently-viewed-widget"></div> + <script src="js/recently-viewed.js"></script>
 */
(function () {
  const KEY = 'baostore_recently_viewed';
  const MAX = 8;
  const API = (window.API_CONFIG && window.API_CONFIG.BASE_URL) || 'https://cnpm-websach-2.onrender.com';

  function resolveImg(filename) {
    if (!filename || filename === 'null' || filename === 'undefined') return 'img/default-book.jpg';
    if (/^https?:\/\//i.test(filename)) return filename;
    const clean = filename.replace(/^\/img\/products\//, '').replace(/^\/+/, '');
    if (/^\d{13,}-/.test(clean)) return `${API}/uploads/products/${clean}`;
    return `${API}/product-images/${clean}`;
  }

  function formatPrice(n) {
    return Number(n).toLocaleString('vi-VN') + ' đ';
  }

  // --- Public API ---

  /** Ghi nhận sản phẩm vừa xem (gọi từ product_detail.js) */
  window.RV_track = function (product) {
    if (!product || !product.MaSP) return;
    let list = getList();
    list = list.filter(p => p.MaSP !== product.MaSP);          // loại trùng
    list.unshift({
      MaSP: product.MaSP,
      TenSP: product.TenSP,
      HinhAnh: product.HinhAnh,
      DonGia: product.DonGia,
      TenTG: product.TenTG || '',
      ts: Date.now()
    });
    list = list.slice(0, MAX);
    try { localStorage.setItem(KEY, JSON.stringify(list)); } catch (e) {}
  };

  function getList() {
    try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch (e) { return []; }
  }

  /** Render widget vào container id="recently-viewed-widget" */
  function render() {
    const container = document.getElementById('recently-viewed-widget');
    if (!container) return;

    const list = getList();
    const currentId = new URLSearchParams(window.location.search).get('id');
    const items = list.filter(p => String(p.MaSP) !== String(currentId));

    if (!items.length) { container.style.display = 'none'; return; }

    container.innerHTML = `
      <div class="rv-widget" style="
        background:#fff;
        border:1px solid #ede8e3;
        border-radius:24px;
        padding:24px;
        margin-bottom:32px;
        box-shadow:0 4px 20px rgba(0,0,0,.04);
      ">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:18px;">
          <h2 style="font-size:16px;font-weight:900;color:#2c2c2c;display:flex;align-items:center;gap:10px;">
            <span style="width:36px;height:36px;background:#fff5f5;border-radius:12px;display:inline-flex;align-items:center;justify-content:center;color:#B03A2E;">
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>
            </span>
            Bạn đã xem gần đây
          </h2>
          <button onclick="RV_clear()" style="font-size:10px;font-weight:800;color:#aaa;text-transform:uppercase;letter-spacing:.1em;background:none;border:none;cursor:pointer;padding:4px 8px;border-radius:8px;transition:all .2s;" onmouseover="this.style.color='#B03A2E'" onmouseout="this.style.color='#aaa'">
            Xoá lịch sử
          </button>
        </div>
        <div style="display:flex;gap:14px;overflow-x:auto;padding-bottom:8px;scrollbar-width:none;">
          ${items.map(p => `
            <a href="product_detail.html?id=${p.MaSP}" style="
              flex-shrink:0;
              width:130px;
              text-decoration:none;
              border:1.5px solid #ede8e3;
              border-radius:18px;
              overflow:hidden;
              background:#f7f3f0;
              transition:all .25s;
              display:block;
            "
            onmouseover="this.style.transform='translateY(-4px)';this.style.boxShadow='0 12px 24px rgba(0,0,0,.10)';this.style.borderColor='#B03A2E'"
            onmouseout="this.style.transform='';this.style.boxShadow='';this.style.borderColor='#ede8e3'">
              <div style="aspect-ratio:3/4;overflow:hidden;display:flex;align-items:center;justify-content:center;padding:10px;">
                <img src="${resolveImg(p.HinhAnh)}" alt="${p.TenSP}"
                  style="max-width:100%;max-height:100%;object-fit:contain;"
                  onerror="this.onerror=null;this.src='img/default-book.jpg'">
              </div>
              <div style="background:#fff;padding:10px;">
                <div style="font-size:10px;font-weight:700;color:#2c2c2c;line-height:1.4;
                  display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;
                  margin-bottom:4px;">${p.TenSP}</div>
                <div style="font-size:11px;font-weight:900;color:#B03A2E;">${formatPrice(p.DonGia)}</div>
              </div>
            </a>
          `).join('')}
        </div>
      </div>
    `;
  }

  window.RV_clear = function () {
    localStorage.removeItem(KEY);
    const container = document.getElementById('recently-viewed-widget');
    if (container) container.style.display = 'none';
  };

  // Auto-render khi DOM sẵn sàng
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', render);
  } else {
    render();
  }
})();
