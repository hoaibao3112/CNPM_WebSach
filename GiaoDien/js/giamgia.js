async function loadRandomVouchers() {
  try {
    const res = await fetch("http://localhost:5000/api/voucher/");
    const vouchers = await res.json();

    const voucherList = document.querySelector(".voucher-list");

    if (!vouchers || vouchers.length === 0) {
      voucherList.innerHTML = "<p style='text-align:center;'>Chưa có voucher nào</p>";
      return;
    }

    // Trộn ngẫu nhiên
    const shuffled = vouchers.sort(() => 0.5 - Math.random());
    const randomVouchers = shuffled.slice(0, 3);

    const typeMap = {
      giam_phan_tram: { icon: '<i class="fa-solid fa-percent"></i>', borderColor: "#ffc107" },
      giam_tien_mat: { icon: '<i class="fa-solid fa-money-bill-wave"></i>', borderColor: "#4ecb71" },
      mua_x_tang_y: { icon: '<i class="fa-solid fa-cart-plus"></i>', borderColor: "#45B7D1" },
      qua_tang: { icon: '<i class="fa-solid fa-gift"></i>', borderColor: "#9B5DE5" },
      combo: { icon: '<i class="fa-solid fa-boxes-stacked"></i>', borderColor: "#F15BB5" },
      freeship: { icon: '<i class="fa-solid fa-truck"></i>', borderColor: "#00BBF9" }
    };

    voucherList.innerHTML = randomVouchers
      .map((voucher) => {
        const type = voucher.LoaiKM || "giam_phan_tram";
        const { icon, borderColor } = typeMap[type] || typeMap["giam_phan_tram"];

        let expiryText = "";
        if (voucher.NgayHetHan) {
          const date = new Date(voucher.NgayHetHan);
          expiryText = `HSD: ${date.toLocaleDateString("vi-VN")}`;
        }

        const title = voucher.MaCode || "Voucher đặc biệt";
        const desc = voucher.MoTa || "";
        const isExpired = voucher.TrangThai === "expired";

        return `
          <div class="voucher-card" style="border-left: 6px solid ${borderColor};">
            <span class="icon" style="color:${borderColor};">${icon}</span>
            <div class="voucher-info">
              <div class="voucher-title">${title}</div>
              <div class="voucher-desc">${desc}</div>
              <div class="voucher-expiry">${expiryText}</div>
              <div class="voucher-action">
                ${
                  isExpired
                    ? `<span class="voucher-status expired">HẾT MÃ</span>`
                    : `<button class="voucher-btn" data-code="${title}">Lưu mã</button>`
                }
                <i class="fa-solid fa-circle-info" title="${desc}"></i>
              </div>
            </div>
          </div>
        `;
      })
      .join("");

    // Bắt sự kiện click "Lưu mã"
    document.querySelectorAll(".voucher-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const code = btn.dataset.code;

        // Lấy danh sách mã đã lưu
        let saved = JSON.parse(localStorage.getItem("savedVouchers")) || [];

        if (!saved.includes(code)) {
          saved.push(code);
          localStorage.setItem("savedVouchers", JSON.stringify(saved));
        }

        // Disable nút
        btn.disabled = true;
        btn.innerText = "Đã lưu";
      });
    });
  } catch (err) {
    console.error("Lỗi load voucher:", err);
    document.querySelector(".voucher-list").innerHTML =
      "<p style='color:red; text-align:center;'>Không thể tải dữ liệu voucher</p>";
  }
}

document.addEventListener("DOMContentLoaded", loadRandomVouchers);
