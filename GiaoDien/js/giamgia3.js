<<<<<<< HEAD
/*
const vouchers = [
  {
    type: "discount",
    icon: '<i class="fa-solid fa-percent"></i>',
    title: "Giảm 10% VPP & DCHS",
    desc: "Giảm tối đa 50K cho ĐH từ 100k",
    expiry: "HSD: 31/05/25"
  },
  {
    type: "discount",
    icon: '<i class="fa-solid fa-percent"></i>',
    title: "Giảm 20K Sách Thiếu Nhi",
    desc: "Đơn hàng từ 210k",
    expiry: "HSD: 31/05/25"
  },
  {
    type: "discount",
    icon: '<i class="fa-solid fa-percent"></i>',
    title: "Giảm 10% Đồ Chơi",
    desc: "Giảm tối đa 30K cho ĐH từ 100k",
    expiry: "HSD: 31/05/25"
  },
  {
    type: "freeship",
    icon: '<i class="fa-solid fa-truck"></i>',
    title: "Giảm 15K",
    desc: "Đơn hàng mua Manga/ Light Novel/ Đam Mỹ từ 350K",
    expiry: "HSD: 31/05/25"
  },
  {
    type: "freeship",
    icon: '<i class="fa-solid fa-truck"></i>',
    title: "Giảm 10K",
    desc: "Đơn hàng mua Manga/ Light Novel/ Đam Mỹ từ 200K",
    expiry: "HSD: 31/05/25"
  },
  {
    type: "freeship",
    icon: '<i class="fa-solid fa-truck"></i>',
    title: "Giảm 20K",
    desc: "Đơn hàng mua Manga/ Light Novel/ Đam Mỹ từ 250K",
    expiry: "HSD: 31/05/25"
  },
  {
    type: "discount",
    icon: '<i class="fa-solid fa-percent"></i>',
    title: "Giảm 10K",
    desc: "Đơn hàng mua Manga/ Light Novel/ Đam Mỹ từ 120k",
    expiry: "HSD: 31/05/25"
  },
  {
    type: "discount",
    icon: '<i class="fa-solid fa-percent"></i>',
    title: "Giảm 20K Ngoại Văn",
    desc: "Đơn hàng từ 250K",
    expiry: "HSD: 31/05/25"
  },
  {
    type: "discount",
    icon: '<i class="fa-solid fa-percent"></i>',
    title: "Giảm 10K Ngoại Văn",
    desc: "Đơn hàng từ 150K",
    expiry: "HSD: 31/05/25"
  },
  {
    type: "discount",
    icon: '<i class="fa-solid fa-percent"></i>',
    title: "Giảm 30K Kinh Tế",
    desc: "Đơn hàng từ 210K",
    expiry: "HSD: 31/05/25"
=======
// Lấy danh sách voucher từ API backend (chỉ lấy các mã đang hoạt động)
async function fetchVouchers() {
  try {
    const res = await fetch('http://localhost:5000/api/khuyenmai?activeOnly=true&limit=20');
    const data = await res.json();
    if (data.data) {
      return data.data;
    }
    return [];
  } catch (err) {
    return [];
>>>>>>> 9294f575efca473d4568fb2c8d64d9fd3d3ae8e3
  }
}

// Kiểm tra đã đăng nhập (có khách hàng trong localStorage)
function isLoggedIn() {
  return !!(localStorage.getItem('token') && localStorage.getItem('customerId'));
}

// Render voucher ra giao diện
function renderVouchers(vouchers) {
  const voucherList = document.getElementById('voucherList');
  if (!voucherList) return;
  if (vouchers.length === 0) {
    voucherList.innerHTML = '<div style="padding:24px;text-align:center;">Không có mã khuyến mãi nào</div>';
    return;
  }
  voucherList.innerHTML = vouchers.map(voucher => `
    <div class="voucher-card${voucher.LoaiKM === 'freeship' ? ' freeship' : ''}">
      <span class="icon">
        ${voucher.LoaiKM === 'freeship'
          ? '<i class="fa-solid fa-truck"></i><span style="font-size:0.8rem">Freeship</span>'
          : '<i class="fa-solid fa-percent"></i><span style="font-size:0.8rem">Mã giảm</span>'}
      </span>
      <div class="voucher-info">
        <div class="voucher-title">${voucher.TenKM}</div>
        <div class="voucher-desc">${voucher.MoTa || ''}</div>
        <div class="voucher-expiry">HSD: ${voucher.NgayKetThuc ? voucher.NgayKetThuc.slice(0,10) : ''}</div>
        <div class="voucher-action">
          <button class="voucher-btn" data-makm="${voucher.MaKM}">Lưu mã</button>
          <i class="fa-solid fa-circle-info" title="Xem chi tiết" data-makm="${voucher.MaKM}"></i>
        </div>
      </div>
    </div>
<<<<<<< HEAD
  </div>
`).join('');
*/

// Hàm lưu mã vào localStorage
function saveVoucher(code, btn) {
  let saved = JSON.parse(localStorage.getItem("savedVouchers")) || [];

  if (!saved.includes(code)) {
    saved.push(code);
    localStorage.setItem("savedVouchers", JSON.stringify(saved));

    // Đổi giao diện nút
    btn.innerText = "Đã lưu";
    btn.disabled = true;
    btn.style.background = "#ccc";
    btn.style.cursor = "not-allowed";
  }
}

async function loadVouchers() {
  try {
    const res = await fetch("http://localhost:5000/api/voucher/");
    const vouchers = await res.json();

    const voucherList = document.getElementById("voucherList");

    if (!vouchers || vouchers.length === 0) {
      voucherList.innerHTML = "<p style='text-align:center;'>Chưa có mã giảm giá</p>";
      return;
    }

    // Lấy danh sách mã đã lưu từ localStorage để check trạng thái
    const saved = JSON.parse(localStorage.getItem("savedVouchers")) || [];

    voucherList.innerHTML = vouchers.map(voucher => {
      let expiryText = "";
      if (voucher.NgayHetHan) {
        const date = new Date(voucher.NgayHetHan);
        expiryText = `HSD: ${date.toLocaleDateString("vi-VN")}`;
      }

      const type = voucher.LoaiKM || "giam_phan_tram";
      const typeMap = {
        giam_phan_tram: { icon: '<i class="fa-solid fa-percent"></i>', color: "#FF6B6B" },
        giam_tien_mat: { icon: '<i class="fa-solid fa-money-bill-wave"></i>', color: "#4ECDC4" },
        mua_x_tang_y: { icon: '<i class="fa-solid fa-cart-plus"></i>', color: "#45B7D1" },
        qua_tang: { icon: '<i class="fa-solid fa-gift"></i>', color: "#9B5DE5" },
        combo: { icon: '<i class="fa-solid fa-boxes-stacked"></i>', color: "#F15BB5" },
        freeship: { icon: '<i class="fa-solid fa-truck"></i>', color: "#00BBF9" }
      };

      const { icon, color } = typeMap[type] || typeMap["giam_phan_tram"];
      const programName = voucher.TenChuongTrinh || voucher.MaCode || "Voucher đặc biệt";
      const desc = voucher.MoTa || `Giới hạn: ${voucher.GioiHanSuDung ?? "∞"} | Đã dùng: ${voucher.DaSuDung ?? 0}`;

      // Check xem mã này đã lưu chưa
      const isSaved = saved.includes(voucher.MaCode);

      return `
        <div class="voucher-card" style="border-left:6px solid ${color};">
          <div class="icon" style="color:${color};">${icon}</div>
          <div class="voucher-info">
            <div class="voucher-title">${programName}</div>
            <div class="voucher-desc">${desc}</div>
            <div class="voucher-expiry">${expiryText}</div>
            <div class="voucher-action">
              <button 
                class="voucher-btn" 
                style="${isSaved ? 'background:#ccc;cursor:not-allowed;' : ''}"
                ${isSaved ? "disabled" : ""}
                onclick="saveVoucher('${voucher.MaCode}', this)"
              >
                ${isSaved ? "Đã lưu" : "Lưu mã"}
              </button>
              <i class="fa-solid fa-circle-info" title="Xem chi tiết"></i>
            </div>
          </div>
        </div>
      `;
    }).join('');
  } catch (err) {
    console.error("Lỗi load voucher:", err);
    document.getElementById("voucherList").innerHTML =
      "<p style='color:red; text-align:center;'>Không thể tải dữ liệu mã giảm giá</p>";
  }
}

document.addEventListener("DOMContentLoaded", loadVouchers);
=======
  `).join('');
}

// Sự kiện lưu mã khuyến mãi
function setupClaimEvents() {
  document.querySelectorAll('.voucher-btn').forEach(btn => {
    btn.addEventListener('click', async function() {
      const maKM = this.getAttribute('data-makm');
      if (!isLoggedIn()) {
        alert('Bạn cần đăng nhập để lưu mã!');
        return;
      }
      const token = localStorage.getItem('token');
      try {
        const res = await fetch(`http://localhost:5000/api/khuyenmai/claim/${maKM}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        const data = await res.json();
        if (res.ok) {
          // Lưu mã vào localStorage
          let myPromos = JSON.parse(localStorage.getItem('myPromos') || '[]');
          // Tránh trùng mã
          if (!myPromos.some(p => p.makm == data.makm)) {
            myPromos.push({
              makm: data.makm,
              code: data.code,
              ngay_lay: data.ngay_lay,
              expiry: data.expiry || '',
              status: 'Còn hiệu lực'
            });
            localStorage.setItem('myPromos', JSON.stringify(myPromos));
          }
          showModal('<b>Lưu mã thành công!</b><br>Mã khuyến mãi của bạn là: <span style="color:red;font-size:1.2em">' + (data.code || '') + '</span>');
        } else {
          showModal('<span style="color:red">' + (data.error || 'Lỗi khi lưu mã') + '</span>');
        }
      } catch (err) {
        showModal('<span style="color:red">Lỗi kết nối server</span>');
      }
    });
  });
}

function setupDetailEvents() {
  document.querySelectorAll('.fa-circle-info').forEach(icon => {
    icon.addEventListener('click', async function() {
      const maKM = this.getAttribute('data-makm');
      try {
        const res = await fetch(`http://localhost:5000/api/khuyenmai/${maKM}`);
        const data = await res.json();
        if (data && !data.error) {
          let html = `<h3>${data.TenKM}</h3>
            <div><b>Mô tả:</b> ${data.MoTa || ''}</div>
            <div><b>Loại:</b> ${data.LoaiKM}</div>
            <div><b>Ngày bắt đầu:</b> ${data.NgayBatDau ? data.NgayBatDau.slice(0,10) : ''}</div>
            <div><b>Ngày kết thúc:</b> ${data.NgayKetThuc ? data.NgayKetThuc.slice(0,10) : ''}</div>
            <div><b>Trạng thái:</b> ${data.TrangThai ? 'Đang hoạt động' : 'Ngừng'}</div>
            <div style="margin-top:8px"><b>Điều kiện áp dụng:</b>
              <ul>
                <li><b>Giá trị đơn tối thiểu:</b> ${data.GiaTriDonToiThieu || 0}</li>
                <li><b>Số lượng tối thiểu:</b> ${data.SoLuongToiThieu || 1}</li>
                <li><b>Giảm tối đa:</b> ${data.GiamToiDa || 'Không giới hạn'}</li>
                <li><b>Giá trị giảm:</b> ${data.GiaTriGiam}</li>
              </ul>
            </div>
            <div style="margin-top:8px"><b>Sản phẩm áp dụng:</b>
              <ul>
                ${(data.SanPhamApDung && data.SanPhamApDung.length)
                  ? data.SanPhamApDung.map(sp => `<li>${sp.TenSP} (ID: ${sp.MaSP})</li>`).join('')
                  : '<li>Áp dụng cho tất cả sản phẩm</li>'}
              </ul>
            </div>
          `;
          showModal(html);
        } else {
          showModal('<div style="color:red">Không thể tải chi tiết mã khuyến mãi</div>');
        }
      } catch (err) {
        showModal('<div style="color:red">Lỗi kết nối server</div>');
      }
    });
  });
}

// Hàm hiển thị modal đơn giản
function showModal(content) {
  let modal = document.getElementById('voucherDetailModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'voucherDetailModal';
    modal.style.position = 'fixed';
    modal.style.inset = '0';
    modal.style.background = 'rgba(0,0,0,0.4)';
    modal.style.display = 'flex';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';
    modal.style.zIndex = '1000';
    modal.innerHTML = `
      <div style="background:#fff;padding:24px;border-radius:8px;max-width:500px;width:100%;position:relative">
        <button id="closeVoucherModal" style="position:absolute;top:8px;right:12px;font-size:1.5rem;background:none;border:none;cursor:pointer">&times;</button>
        <div id="voucherModalContent"></div>
      </div>
    `;
    document.body.appendChild(modal);
  }
  document.getElementById('voucherModalContent').innerHTML = content;
  modal.style.display = 'flex';
  document.getElementById('closeVoucherModal').onclick = () => {
    modal.style.display = 'none';
  };
}

function displayPromoCodes() {
  const promoList = JSON.parse(localStorage.getItem('myPromos') || '[]');
  const container = document.getElementById('promo-codes-list');
  if (!container) return;
  if (!promoList.length) {
    container.innerHTML = '<p class="empty-wishlist">Bạn chưa có mã khuyến mãi nào.</p>';
    return;
  }
  container.innerHTML = promoList.map(promo => `
    <div class="promo-code-card" data-makm="${promo.makm}" style="cursor:pointer">
      <div class="promo-code-title"><i class="fas fa-ticket-alt"></i> Mã ưu đãi</div>
      <div class="promo-code-value">${promo.code}</div>
      <div class="promo-code-expiry">Ngày nhận: ${promo.ngay_lay || ''}</div>
      ${promo.expiry ? `<div class="promo-code-expiry">HSD: ${promo.expiry}</div>` : ''}
      <div class="promo-code-status">${promo.status || ''}</div>
    </div>
  `).join('');

  // Thêm sự kiện click để xem chi tiết điều kiện áp dụng
  container.querySelectorAll('.promo-code-card').forEach(card => {
    card.addEventListener('click', async function() {
      const makm = this.getAttribute('data-makm');
      try {
        const res = await fetch(`http://localhost:5000/api/khuyenmai/${makm}`);
        const data = await res.json();
        if (data && !data.error) {
          let html = `<h3>${data.TenKM}</h3>
            <div><b>Mô tả:</b> ${data.MoTa || ''}</div>
            <div><b>Loại:</b> ${data.LoaiKM}</div>
            <div><b>Ngày bắt đầu:</b> ${data.NgayBatDau ? data.NgayBatDau.slice(0,10) : ''}</div>
            <div><b>Ngày kết thúc:</b> ${data.NgayKetThuc ? data.NgayKetThuc.slice(0,10) : ''}</div>
            <div><b>Trạng thái:</b> ${data.TrangThai ? 'Đang hoạt động' : 'Ngừng'}</div>
            <div style="margin-top:8px"><b>Điều kiện áp dụng:</b>
              <ul>
                <li><b>Giá trị đơn tối thiểu:</b> ${data.GiaTriDonToiThieu || 0}</li>
                <li><b>Số lượng tối thiểu:</b> ${data.SoLuongToiThieu || 1}</li>
                <li><b>Giảm tối đa:</b> ${data.GiamToiDa || 'Không giới hạn'}</li>
                <li><b>Giá trị giảm:</b> ${data.GiaTriGiam}</li>
              </ul>
            </div>
            <div style="margin-top:8px"><b>Sản phẩm áp dụng:</b>
              <ul>
                ${(data.SanPhamApDung && data.SanPhamApDung.length)
                  ? data.SanPhamApDung.map(sp => `<li>${sp.TenSP} (ID: ${sp.MaSP})</li>`).join('')
                  : '<li>Áp dụng cho tất cả sản phẩm</li>'}
              </ul>
            </div>
          `;
          showModal(html);
        } else {
          showModal('<div style="color:red">Không thể tải chi tiết mã khuyến mãi</div>');
        }
      } catch (err) {
        showModal('<div style="color:red">Lỗi kết nối server</div>');
      }
    });
  });
}

// Khởi động trang
(async function () {
  const vouchers = await fetchVouchers();
  renderVouchers(vouchers);
  setupClaimEvents();
  setupDetailEvents();
})();
>>>>>>> 9294f575efca473d4568fb2c8d64d9fd3d3ae8e3
