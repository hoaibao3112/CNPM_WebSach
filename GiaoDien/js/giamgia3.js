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
  }
];

const voucherList = document.getElementById('voucherList');
voucherList.innerHTML = vouchers.map(voucher => `
  <div class="voucher-card${voucher.type === 'freeship' ? ' freeship' : ''}">
    <span class="icon">${voucher.icon}<span style="font-size:0.8rem">${voucher.type === 'freeship' ? 'Freeship' : 'Mã giảm'}</span></span>
    <div class="voucher-info">
      <div class="voucher-title">${voucher.title}</div>
      <div class="voucher-desc">${voucher.desc}</div>
      <div class="voucher-expiry">${voucher.expiry}</div>
      <div class="voucher-action">
        <button class="voucher-btn">Lưu mã</button>
        <i class="fa-solid fa-circle-info" title="Xem chi tiết"></i>
      </div>
    </div>
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
