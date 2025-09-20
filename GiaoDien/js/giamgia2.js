// giamgia2.js
async function loadThamGiaVouchers() {
  try {
    const res = await fetch("http://localhost:5000/api/voucher/");
    const vouchers = await res.json();

    const promoOffers = document.querySelector(".promo-offers");

    if (!vouchers || vouchers.length === 0) {
      promoOffers.innerHTML = "<p style='text-align:center;'>Chưa có mã tham gia</p>";
      return;
    }

    // Random 2 voucher
    const shuffled = vouchers.sort(() => Math.random() - 0.5);
    const limitedVouchers = shuffled.slice(0, 2);

    const typeMap = {
      giam_phan_tram: { icon: '<i class="fa-solid fa-percent"></i>', color: "#FF6B6B" },
      giam_tien_mat: { icon: '<i class="fa-solid fa-money-bill-wave"></i>', color: "#4ECDC4" },
      mua_x_tang_y: { icon: '<i class="fa-solid fa-cart-plus"></i>', color: "#45B7D1" },
      qua_tang: { icon: '<i class="fa-solid fa-gift"></i>', color: "#9B5DE5" },
      combo: { icon: '<i class="fa-solid fa-boxes-stacked"></i>', color: "#F15BB5" },
      freeship: { icon: '<i class="fa-solid fa-truck"></i>', color: "#00BBF9" }
    };

    promoOffers.innerHTML = limitedVouchers.map(voucher => {
      const type = voucher.LoaiKM || "giam_phan_tram";
      const { icon, color } = typeMap[type] || typeMap["giam_phan_tram"];

      let expiryText = "";
      if (voucher.NgayHetHan) {
        const date = new Date(voucher.NgayHetHan);
        expiryText = `HSD: ${date.toLocaleDateString("vi-VN")}`;
      }

      const title = voucher.MaCode || "Voucher đặc biệt";
      const desc = voucher.MoTa || "";

      // Kiểm tra localStorage
      const saved = JSON.parse(localStorage.getItem("savedVouchers") || "[]");
      const isSaved = saved.includes(title);

      return `
        <div class="offer-card" style="border-left:6px solid ${color};">
          <div class="icon" style="color:${color};">${icon}</div>
          <div class="offer-details">
            <p class="offer-title"><strong>${title}</strong></p>
            <p class="offer-desc">${desc}</p>
            <p class="offer-expiry">${expiryText}</p>
            <button class="offer-btn" data-code="${title}" ${isSaved ? "disabled" : ""}>
              ${isSaved ? "Đã lưu" : "Lưu mã"}
            </button>
          </div>
        </div>
      `;
    }).join("");

    // Gắn sự kiện click sau khi render
    document.querySelectorAll(".offer-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const code = e.target.getAttribute("data-code");
        let saved = JSON.parse(localStorage.getItem("savedVouchers") || "[]");

        if (!saved.includes(code)) {
          saved.push(code);
          localStorage.setItem("savedVouchers", JSON.stringify(saved));
        }

        e.target.textContent = "Đã lưu";
        e.target.disabled = true;
      });
    });

  } catch (err) {
    console.error("Lỗi load voucher:", err);
    document.querySelector(".promo-offers").innerHTML =
      "<p style='color:red; text-align:center;'>Không thể tải dữ liệu mã tham gia</p>";
  }
}

document.addEventListener("DOMContentLoaded", loadThamGiaVouchers);
