document.addEventListener('DOMContentLoaded', function() {
  loadUserProfile();
  loadWishlist();
  loadPromoCodes();
  setupUpdateButton();
  setupSidebarNavigation();
  setupChangePasswordButton();
});


/*---------------------------------Load section---------------------------------*/
async function loadUserProfile() {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = 'login.html';
    return;
  }

  try {
    const response = await fetch('http://localhost:5000/api/client/profile', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (!response.ok || !data.user) {
      throw new Error(data.error || 'Không thể lấy thông tin người dùng');
    }

    const user = data.user;

    // Chỉ lưu vào localStorage
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('customerId', user.makh);

    renderSidebarUserInfo()

    // Kiểm tra cảnh báo
    const warningBox = document.querySelector('.warning');
    const updateLink = document.querySelector('.update-link');

    const isMissingInfo = !(user.tenkh || user.hoten) || !user.sdt || !user.email;

    if (warningBox) {
      warningBox.style.display = isMissingInfo ? 'block' : 'none';
    }

    if (updateLink && !updateLink.dataset.bound) {
      updateLink.addEventListener('click', (e) => {
        e.preventDefault();
        displayUserProfile();
      });
      updateLink.dataset.bound = 'true';
    }

  } catch (error) {
    console.error('Lỗi khi tải hồ sơ:', error);
    showNotification_khan?.('error', 'Không thể tải thông tin hồ sơ');
  }
}

function renderSidebarUserInfo() {
  const user = JSON.parse(localStorage.getItem('user'));
  const nameEl = document.getElementById('user-name');
  const emailEl = document.getElementById('user-email');

  if (!user || !nameEl || !emailEl) return;

  nameEl.textContent = user.tenkh || user.hoten || 'Chưa có tên';
  emailEl.textContent = user.email || 'Chưa có email';
}


function renderReceiveAddress() {
  // const user = JSON.parse(localStorage.getItem('user'));
  const receiveName = document.getElementById('receive-name');
  const receiveAddress = document.getElementById('receive-address');
  const receivePhone = document.getElementById('receive-phone');

  if (!user || !receiveName || !receiveAddress || !receivePhone) return;

  if (receiveName) receiveName.textContent = user.tenkh || user.hoten || 'Chưa có';
  if (receiveAddress) receiveAddress.textContent = user.diachi || 'Chưa có địa chỉ';
  if (receivePhone) receivePhone.textContent = user.sdt || 'Chưa có số điện thoại';
}



function loadWishlist() {
  const wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];
  const container = document.getElementById('wishlist-products');

  if (!wishlist.length) {
    container.innerHTML = '<p class="empty-wishlist">Danh sách yêu thích của bạn đang trống.</p>';
    return;
  }

  container.innerHTML = wishlist.map(product => `
    <div class="product-card">
      <a href="product_detail.html?id=${product.id}" 
         onclick="saveProductBeforeRedirect(${JSON.stringify(product)})">
        <img src="img/product/${product.image || 'default-book.jpg'}" 
             alt="${product.name}" 
             onerror="this.src='https://via.placeholder.com/300x400?text=Book'">
        <h3>${product.name}</h3>
        <div class="price-wrapper">
          <div class="final-price">${formatPrice(product.price)}</div>
        </div>
      </a>
      <button class="remove-btn" onclick="removeFromWishlist('${product.id}')">
        <i class="fas fa-trash"></i> Xóa
      </button>
    </div>
  `).join('');
}


function loadPromoCodes() {
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

  setupPromoDetailEvents();
}
/*---------------------------------Load section---------------------------------*/



/*---------------------------------Hiện section---------------------------------*/
function setupSidebarNavigation() {
  const sidebarItems = document.querySelectorAll('.sidebar ul li[data-section]');
  let currentActive = null;

  sidebarItems.forEach(item => {
    item.addEventListener('click', function () {
      const sectionId = this.getAttribute('data-section');
      const sectionEl = document.getElementById(sectionId);

      // Ẩn tất cả section
      document.querySelectorAll('.main-content .section').forEach(s => s.style.display = 'none');

      // Bỏ active cũ
      sidebarItems.forEach(i => i.classList.remove('active'));

      // Tô màu mục mới
      this.classList.add('active');
      currentActive = this;

      // Hiển thị section tương ứng
      switch (sectionId) {
        case 'user-profile':
          displayUserProfile();
          break;
        case 'wishlist':
          displayWishlist();
          break;
        case 'promo-codes':
          displayPromoCodes();
          break;
        case 'change-password':
          displayChangePassword?.();
          break;
        case 'gtgt-info':
          displayInvoiceInfo?.();
          break;
        case 'address-book':
          displayAddressBook?.();
          break;
        case 'order-history':
          displayOrderHistory?.();
          break;
        default:
          showSection(sectionId);
          break;
      }
    });
  });
}



function showSection(sectionId) {
  const target = document.getElementById(sectionId);

  if (!target) return;

  const isVisible = target.style.display === 'block';

  // Ẩn tất cả section
  document.querySelectorAll('.main-content .section').forEach(s => s.style.display = 'none');

  // Nếu section đang hiển thị → không hiển thị lại
  if (!isVisible) {
    target.style.display = 'block';
    displayAccountInfo(); // Chỉ gọi khi section thực sự được hiển thị
  }
}

function displayAccountInfo() {
  const accountInfoSection = document.getElementById('account-info');
  if (accountInfoSection) {
    accountInfoSection.style.display = 'block';
  }
}

function displayUserProfile() {

  showSection('profile');

  // Nạp dữ liệu người dùng
  const user = JSON.parse(localStorage.getItem('user'));
  if (!user) {
    window.location.href = 'login.html';
    return;
  }

  const hotenInput = document.getElementById('hoten');
  const sdtInput = document.getElementById('sodienthoai');
  const emailInput = document.getElementById('email');

  if (hotenInput) hotenInput.value = user.tenkh || user.hoten || '';
  if (sdtInput) sdtInput.value = user.sdt || '';
  if (emailInput) {
    emailInput.value = user.email || '';
  }
}

function displayAddressBook() {
  showSection('address-book');

  const addressbookSection = document.getElementById('address-book');
  if (addressbookSection) {
    addressbookSection.style.display = 'block';
    renderReceiveAddress()
  }
}

function displayOrderHistory() {
  showSection('order-history');

  const orderhistorySection = document.getElementById('order-history');
  if (orderhistorySection) {
    orderhistorySection.style.display = 'block';
  }
}


function displayWishlist() {
  showSection('wishlist'); // Hiển thị section sản phẩm yêu thích

  const wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];
  const container = document.getElementById('wishlist-products');

  if (!wishlist.length) {
    container.innerHTML = '<p class="empty-wishlist">Danh sách yêu thích của bạn đang trống.</p>';
    return;
  }

  container.innerHTML = wishlist.map(product => `
    <div class="product-card">
      <a href="product_detail.html?id=${product.id}" 
         onclick="saveProductBeforeRedirect(${JSON.stringify(product)})">
        <img src="img/product/${product.image || 'default-book.jpg'}" 
             alt="${product.name}" 
             onerror="this.src='https://via.placeholder.com/300x400?text=Book'">
        <h3>${product.name}</h3>
        <div class="price-wrapper">
          <div class="final-price">${formatPrice(product.price)}</div>
        </div>
      </a>
      <button class="remove-btn" onclick="removeFromWishlist('${product.id}')">
        <i class="fas fa-trash"></i> Xóa
      </button>
    </div>
  `).join('');
}


function displayPromoCodes() {
  showSection('promo-codes'); // Hiển thị section mã khuyến mãi

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

  setupPromoDetailEvents();
}


function displayChangePassword() {
  showSection('change-password');

  // Gắn sự kiện nếu chưa gắn
  const btn = document.getElementById('changePasswordBtn');
  if (btn && !btn.dataset.bound) {
    setupChangePasswordButton();
    btn.dataset.bound = 'true';
  }
}


function displayInvoiceInfo() {
  showSection('gtgt-info');

  // Nạp dữ liệu hóa đơn nếu có
  const invoiceData = JSON.parse(localStorage.getItem('gtgt'));
  if (!invoiceData) return;

  const buyerNameInput = document.getElementById('buyerName');
  const companyNameInput = document.getElementById('companyName');
  const companyAddressInput = document.getElementById('companyAddress');
  const taxCodeInput = document.getElementById('taxCode');
  const invoiceEmailInput = document.getElementById('invoiceEmail');

  if (buyerNameInput) buyerNameInput.value = invoiceData.buyerName || '';
  if (companyNameInput) companyNameInput.value = invoiceData.companyName || '';
  if (companyAddressInput) companyAddressInput.value = invoiceData.companyAddress || '';
  if (taxCodeInput) taxCodeInput.value = invoiceData.taxCode || '';
  if (invoiceEmailInput) invoiceEmailInput.value = invoiceData.invoiceEmail || '';
}
/*-------------------------------------------------------------------------------*/

function setupUpdateButton() {
  const updateBtn = document.getElementById('updateBtn');

  updateBtn.addEventListener('click', async function () {
    const profileData = {
      tenkh: document.getElementById('hoten').value.trim(),
      sdt: document.getElementById('sodienthoai').value.trim(),
      email: document.getElementById('email').value.trim()
    };

    const originalUser = JSON.parse(localStorage.getItem('user'));

    //Kiểm tra dữ liệu có thay đổi không
    const isChanged =
      profileData.tenkh !== (originalUser.tenkh || originalUser.hoten || '') ||
      profileData.sdt !== (originalUser.sdt || '') ||
      profileData.email !== (originalUser.email || '');

    if (!isChanged) {
      showNotification_khan('error', 'Chưa có gì thay đổi');
      return;
    }

    try {
      updateBtn.disabled = true;
      updateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang lưu...';

      const token = localStorage.getItem('token');

      const response = await fetch(`http://localhost:5000/api/client/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(profileData)
      });

      const data = await response.json();

      if (response.ok) {
        showNotification_khan('success', 'Cập nhật hồ sơ thành công');

        const updatedUser = {
          ...originalUser,
          tenkh: profileData.tenkh,
          sdt: profileData.sdt,
          email: profileData.email
        };
        localStorage.setItem('user', JSON.stringify(updatedUser));
      } else {
        showNotification_khan('error', data.error || 'Cập nhật hồ sơ thất bại');
      }
    } catch (error) {
      console.error('Lỗi cập nhật hồ sơ:', error);
      showNotification_khan('error', 'Không thể kết nối đến server');
    } finally {
      updateBtn.disabled = false;
      updateBtn.innerHTML = 'Thay đổi';
    }
  });
}



function removeFromWishlist(productId) {
  let wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];

  // Ép kiểu về chuỗi để so sánh chính xác
  const newWishlist = wishlist.filter(item => String(item.id) !== String(productId));

  if (newWishlist.length === wishlist.length) {
    showNotification_khan('error', 'Không tìm thấy sản phẩm cần xóa!');
    return;
  }

  localStorage.setItem('wishlist', JSON.stringify(newWishlist));
  displayWishlist();
  showNotification_khan('success', 'Đã xóa sản phẩm khỏi danh sách yêu thích!');
}


window.saveProductBeforeRedirect = (product) => {
  localStorage.setItem('currentProduct', JSON.stringify(product));
};

const formatPrice = (price) => new Intl.NumberFormat('vi-VN').format(price) + ' đ';
const showAlert = (message) => alert(message);


function setupChangePasswordButton() {
  const changePasswordBtn = document.getElementById('changePasswordBtn');

  changePasswordBtn.addEventListener('click', async function () {
    const oldPassword = document.getElementById('oldPassword').value.trim();
    const newPassword = document.getElementById('newPassword').value.trim();
    const confirmPassword = document.getElementById('confirmPassword').value.trim();
    const customerId = localStorage.getItem('customerId');

    if (!customerId) {
      showNotification_khan('error', 'Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.');
      return;
    }

    if (!oldPassword || !newPassword || !confirmPassword) {
      showNotification_khan('error', 'Vui lòng nhập đầy đủ các trường');
      return;
    }

    if (newPassword !== confirmPassword) {
      showNotification_khan('error', 'Mật khẩu mới và xác nhận mật khẩu không khớp');
      return;
    }

    if (newPassword.length < 8) {
      showNotification_khan('error', 'Mật khẩu mới phải có ít nhất 8 ký tự');
      return;
    }

    // Kiểm tra nếu mật khẩu mới trùng với mật khẩu cũ
    if (newPassword === oldPassword) {
      showNotification_khan('error', 'Chưa có gì thay đổi');
      return;
    }

    try {
      changePasswordBtn.disabled = true;
      changePasswordBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang xử lý...';

      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/client/profile/change-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          matkhau_cu: oldPassword,
          matkhau_moi: newPassword
        })
      });

      const data = await response.json();

      if (response.ok) {
        showNotification_khan('success', 'Đổi mật khẩu thành công');
        document.getElementById('oldPassword').value = '';
        document.getElementById('newPassword').value = '';
        document.getElementById('confirmPassword').value = '';
      } else {
        showNotification_khan('error', data.error || 'Đổi mật khẩu thất bại');
      }
    } catch (error) {
      console.error('Lỗi đổi mật khẩu:', error);
      showNotification_khan('error', 'Không thể kết nối đến server');
    } finally {
      changePasswordBtn.disabled = false;
      changePasswordBtn.innerHTML = 'Thay đổi mật khẩu';
    }
  });
}

// Hiển thị modal chi tiết khuyến mãi
function showPromoDetailModal(content) {
  let modal = document.getElementById('promoDetailModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'promoDetailModal';
    modal.style.position = 'fixed';
    modal.style.inset = '0';
    modal.style.background = 'rgba(0,0,0,0.4)';
    modal.style.display = 'flex';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';
    modal.style.zIndex = '1000';
    modal.innerHTML = `
      <div style="background:#fff;padding:24px;border-radius:8px;max-width:500px;width:100%;position:relative">
        <button id="closePromoDetailModal" style="position:absolute;top:8px;right:12px;font-size:1.5rem;background:none;border:none;cursor:pointer">&times;</button>
        <div id="promoDetailModalContent"></div>
      </div>
    `;
    document.body.appendChild(modal);
  }
  document.getElementById('promoDetailModalContent').innerHTML = content;
  modal.style.display = 'flex';
  document.getElementById('closePromoDetailModal').onclick = () => {
    modal.style.display = 'none';
  };
}

// Gắn sự kiện click vào từng mã khuyến mãi để xem chi tiết
function setupPromoDetailEvents() {
  const promoCards = document.querySelectorAll('.promo-code-card');
  promoCards.forEach(card => {
    card.addEventListener('click', async function() {
      const makm = this.getAttribute('data-makm');
      if (!makm) return;
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
          showPromoDetailModal(html);
        } else {
          showPromoDetailModal('<div style="color:red">Không thể tải chi tiết mã khuyến mãi</div>');
        }
      } catch (err) {
        showPromoDetailModal('<div style="color:red">Lỗi kết nối server</div>');
      }
    });
  });
}



// ----------------------------- GIAO DIỆN -------------------------------
function showNotification_khan(type, text) {
  const box = document.getElementById('notification_khan');
  const textSpan = document.getElementById('notificationText_khan');

  // Đổi màu theo loại
  if (type === 'success') {
    box.style.backgroundColor = '#d4edda';
    box.style.color = '#155724';
    box.style.borderColor = '#c3e6cb';
    box.style.setProperty('--triangle-color', '#d4edda');
  } else {
    box.style.backgroundColor = '#f8d7da';
    box.style.color = '#721c24';
    box.style.borderColor = '#f5c6cb';
    box.style.setProperty('--triangle-color', '#f8d7da');
  }

  textSpan.textContent = text;
  box.style.right = '20px'; // trượt vào

  setTimeout(() => {
    box.style.transition = 'right 0.5s ease-in';
    box.style.right = '-50vw'; // trượt ra
  }, 3000);
}

function closeNotification_khan() {
  const box = document.getElementById('notification_khan');
  box.style.right = '-50vw'; // trượt ra
}

// Trang trí thêm cho sidebar
const sidebarItems = document.querySelectorAll('.sidebar ul li[data-section]');
sidebarItems.forEach(item => {
  item.addEventListener('click', function () {
    sidebarItems.forEach(i => i.classList.remove('active'));
    this.classList.add('active');
    // Gọi hàm hiển thị section tương ứng...
  });
});
