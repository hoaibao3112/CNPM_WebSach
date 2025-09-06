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