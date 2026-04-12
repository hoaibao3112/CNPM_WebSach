// ===== Hàm format =====
function formatPrice(price) {
  return new Intl.NumberFormat("vi-VN").format(price || 0);
}
function escapeHtml(unsafe) {
  if (!unsafe) return "";
  return unsafe.replace(/[&<>\"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#039;"
  }[c]));
}
// ====== PHẦN VOUCHER ======
const VOUCHER_API = "${window.API_CONFIG.BASE_URL}/api/khuyenmai";

function isLoggedIn() {
  return !!(localStorage.getItem("token") && localStorage.getItem("customerId"));
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("vi-VN", {
    day: "2-digit", month: "2-digit", year: "numeric"
  });
}

async function fetchVouchers() {
  try {
    const res = await fetch(VOUCHER_API);
    const json = await res.json();
    if (json?.data) return Array.isArray(json.data) ? json.data : [json.data];
    return [];
  } catch {
    console.error("Lỗi tải voucher");
    return [];
  }
}

function renderVouchers(vouchers) {
  const container = document.getElementById("voucherList");
  if (!container) return;

  if (!vouchers.length) {
    container.innerHTML = `<p>Không có voucher khả dụng.</p>`;
    return;
  }

  container.innerHTML = vouchers.map(v => {
    const isActive = Number(v.TrangThai) === 1;
    const isExpired = v.NgayKetThuc && new Date(v.NgayKetThuc) < new Date();
    const status = !isActive ? "Ngừng hoạt động" : isExpired ? "Hết hạn" : "Đang hoạt động";

    return `
      <div class="voucher-card" style="border-left:6px solid ${
        isActive && !isExpired ? "#3a6df0" : "#aaa"
      }; opacity:${isActive && !isExpired ? 1 : 0.6}">
        <div class="voucher-type">${v.TenKM}</div>
        <div class="voucher-desc">${v.MoTa || "Không có mô tả"}</div>
        <div class="voucher-hsd">HSD: ${formatDate(v.NgayKetThuc)}</div>
        <div class="voucher-code">Mã: <strong>${v.Code}</strong></div>
        <button class="btn-save" data-makm="${v.MaKM}" data-code="${v.Code}"
          ${!isActive || isExpired ? "disabled" : ""}>
          ${status === "Đang hoạt động" ? "Lưu mã" : status}
        </button>
      </div>`;
  }).join("");

  setupSaveEvents();
}

function setupSaveEvents() {
  document.querySelectorAll(".btn-save").forEach(btn => {
    btn.addEventListener("click", async function() {
      const maKM = this.dataset.makm;
      const code = this.dataset.code;

      if (!isLoggedIn()) return alert("Bạn cần đăng nhập để lưu mã!");
      this.disabled = true; this.textContent = "Đang lưu...";

      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${window.API_CONFIG.BASE_URL}/api/khuyenmai/claim/${maKM}`, {
          method: "POST",
          headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" }
        });
        const data = await res.json();

        if (res.ok) {
          alert(`Đã lưu mã ${data.code || code} thành công!`);
          this.textContent = "Đã lưu";
        } else {
          this.disabled = false;
          this.textContent = "Lưu mã";
          alert(data.error || "Không thể lưu mã");
        }
      } catch {
        this.disabled = false;
        this.textContent = "Lưu mã";
        alert("Lỗi kết nối server");
      }
    });
  });
}

async function loadVouchers() {
  const data = await fetchVouchers();
  renderVouchers(data);
}

// ====== PHẦN SẢN PHẨM ======
function formatPrice(price) {
  return new Intl.NumberFormat("vi-VN").format(price || 0);
}
function escapeHtml(unsafe) {
  if (!unsafe) return "";
  return unsafe.replace(/[&<>\"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#039;"
  }[c]));
}
function loadProductDetail(MaSP) {
  if (MaSP) {
    localStorage.setItem("selectedProductId", MaSP);
    window.location.href = "product_detail.html";
  }
}
async function fetchAndDisplayHoatHinh(apiUrl = "${window.API_CONFIG.BASE_URL}/api/product/theloai/1", containerId = "multi-category-list") {
  const container = document.getElementById(containerId);
  container.innerHTML = `<p class="loading">⏳ Đang tải sản phẩm...</p>`;
  try {
    const res = await fetch(apiUrl);
    const { data } = await res.json();
    displayProducts(data || [], containerId);
  } catch {
    container.innerHTML = `<p class="error">⚠️ Lỗi tải sản phẩm.</p>`;
  }
}
function displayProducts(products, id) {
  const container = document.getElementById(id);
  const IMAGE_BASE = "${window.API_CONFIG.BASE_URL}/product-images";
  if (!products?.length) {
    container.innerHTML = `<p>Không có sản phẩm nào.</p>`;
    return;
  }
  container.innerHTML = products.map(p => `
    <div class="product-card" onclick="loadProductDetail('${p.MaSP}')">
      <img src="${p.HinhAnh ? `${IMAGE_BASE}/${p.HinhAnh}` : "img/default-book.jpg"}" alt="${escapeHtml(p.TenSP)}">
      <div class="card-body">
        <h3>${escapeHtml(p.TenSP)}</h3>
        <p class="product-author">Tác giả: ${escapeHtml(p.TacGia || "Đang cập nhật")}</p>
        <p class="product-price">${formatPrice(p.DonGia)}₫</p>
      </div>
    </div>
  `).join("");
}


function loadProductDetail(MaSP) {
  if (MaSP) {
    localStorage.setItem('selectedProductId', MaSP);
    window.location.href = 'product_detail.html';
  }
}
// ----------------------------------------------------

// ===== Lấy và hiển thị sản phẩm thể loại "Hoạt hình" =====
/**
 * Lấy và hiển thị danh sách sản phẩm thể loại Hoạt hình (MaTL = 21)
 * @param {string} apiUrl - Đường dẫn API (mặc định: /api/product/hoathinh)
 * @param {string} containerId - ID của container để render
 */
async function fetchAndDisplayHoatHinh(apiUrl = '${window.API_CONFIG.BASE_URL}/api/product/theloai/1', containerId = 'multi-category-list') {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = `<p class="loading">⏳ Đang tải sản phẩm thể loại Hoạt hình...</p>`;

  try {
    const response = await fetch(apiUrl);
    if (!response.ok) throw new Error('Không thể tải dữ liệu từ API.');

    const { data } = await response.json();

    // ✅ lấy trực tiếp data vì API đã filter theo MaTL = 21
    const hoatHinh = data || [];

    if (hoatHinh.length === 0) {
      container.innerHTML = `<p class="no-products">Không có sản phẩm thể loại Hoạt hình.</p>`;
      return;
    }
    // ✅ Hiển thị sản phẩm bằng hàm có sẵn
    displayProducts(hoatHinh, containerId);
  } catch (error) {
    console.error('❌ Lỗi khi tải sản phẩm Hoạt hình:', error);
    container.innerHTML = `<p class="error">⚠️ Lỗi khi tải dữ liệu sản phẩm.</p>`;
  }
}

function displayProducts(products, containerId = 'multi-category-list') {
  const container = document.getElementById(containerId);
  if (!container) return;

  const IMAGE_BASE = '${window.API_CONFIG.BASE_URL}/product-images'; 

  container.innerHTML = '';

  if (!products || products.length === 0) {
    container.innerHTML = `
      <div class="no-products">
        <i class="fas fa-book"></i>
        <p>Không có sản phẩm nào.</p>
      </div>`;
    return;
  }

  products.forEach(product => {
    const item = document.createElement('div');
    item.className = 'product-card';
    
    // 🌟 ĐOẠN CODE ĐÃ ĐƯỢC CẬP NHẬT: Thêm onclick vào product-card 🌟
    // Thêm sự kiện onclick và truyền MaSP vào hàm loadProductDetail
    item.setAttribute('onclick', `loadProductDetail('${product.MaSP}')`);

    const imageSrc = product.HinhAnh 
      ? `${IMAGE_BASE}/${product.HinhAnh}`
      : 'img/default-book.jpg';

    item.innerHTML = `
      <img src="${imageSrc}" alt="${escapeHtml(product.TenSP)}">

      <div class="card-body">
        <h3>${escapeHtml(product.TenSP)}</h3>
        <p class="product-author">
          Tác giả: ${escapeHtml(product.TacGia || 'Đang cập nhật')}
        </p>
        <p class="product-price">${formatPrice(product.DonGia)}₫</p>
      </div>
    `;

    container.appendChild(item);
  });
}
// ===== Khởi chạy =====
document.addEventListener("DOMContentLoaded", () => {
   loadVouchers();
  fetchAndDisplayHoatHinh();
});
