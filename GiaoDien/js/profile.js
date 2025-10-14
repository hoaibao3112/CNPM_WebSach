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
  // lấy user từ localStorage
  const user = JSON.parse(localStorage.getItem('user')) || {};
  const receiveName = document.getElementById('receive-name');
  const receiveAddress = document.getElementById('receive-address');
  const receivePhone = document.getElementById('receive-phone');

  if (!receiveName || !receiveAddress || !receivePhone) return;

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

// Frontend quản lý địa chỉ: lấy / tạo / sửa / xóa
(
  function setupAddressFrontend() {
  const addLink = document.querySelector('.add-link'); // link 'Thêm địa chỉ'
  const otherAddrContainer = document.getElementById('other-receive-address');
  const defaultReceiveEl = document.getElementById('receive-address');
  const token = () => localStorage.getItem('token');
  const customerId = () => localStorage.getItem('customerId');
  function extractStreet(fullAddress) {
    if (!fullAddress) return '';
    // tách theo dấu phẩy, gạch ngang hoặc nhiều khoảng trắng
    const parts = fullAddress.split(',').map(p => p.trim()).filter(Boolean);
    if (parts.length) return parts[0];
    // fallback: lấy tới ký tự số thứ hai nếu không có dấu phẩy
    return fullAddress.split(/\s{2,}| - |; /)[0].trim();
  }
  
  // Phân tích chuỗi địa chỉ đầy đủ thành các phần: street, ward, district, province
  function extractAddressParts(fullAddress) {
    if (!fullAddress) return { street: '', ward: '', district: '', province: '' };
    // split and trim
    const rawParts = fullAddress.split(',').map(p => p.trim()).filter(Boolean);
    if (!rawParts.length) return { street: '', ward: '', district: '', province: '' };

    // Remove obvious postal-code segments (pure digits, length 3-6)
    const parts = rawParts.filter(p => !/^\d{3,6}$/.test(p));

    let street = '';
    let ward = '';
    let district = '';
    let province = '';

    // helper to find part containing keyword
    const findPart = (kwRegex) => parts.find(p => kwRegex.test(p.toLowerCase())) || '';

    // If there are >=3 meaningful parts, assume last is province, second-last district, third-last ward (if present)
    if (parts.length >= 3) {
      province = parts[parts.length - 1] || '';
      district = parts[parts.length - 2] || '';
      ward = parts[parts.length - 3] || '';
      street = parts.slice(0, parts.length - 3).join(', ') || '';

      // If street ended up empty, maybe original first part is the street
      if (!street && rawParts.length) street = rawParts[0];
    } else if (parts.length === 2) {
      // try keyword detection
      const p1 = parts[0], p2 = parts[1];
      if (/quận|huyện|q\.|quan/.test(p2.toLowerCase()) || /quận|huyện|q\.|quan/.test(p1.toLowerCase())) {
        street = p1;
        district = p2;
      } else if (/thành phố|tỉnh|tp\./.test(p2.toLowerCase())) {
        street = p1;
        province = p2;
      } else {
        street = p1;
        province = p2;
      }
    } else if (parts.length === 1) {
      // single part: try to extract keywords inside
      const single = parts[0];
      const wardMatch = single.match(/(phường\s*[^,\-]+|xã\s*[^,\-]+)/i);
      const districtMatch = single.match(/(quận\s*[^,\-]+|huyện\s*[^,\-]+|q\.\s*[^,\-]+)/i);
      const provinceMatch = single.match(/(thành phố\s*[^,\-]+|tp\.|tỉnh\s*[^,\-]+)/i);
      if (wardMatch) ward = wardMatch[0].trim();
      if (districtMatch) district = districtMatch[0].trim();
      if (provinceMatch) province = provinceMatch[0].trim();
      // street = everything before the first keyword or the whole string if none
      const firstKeywordIndex = single.search(/(phường|xã|quận|huyện|thành phố|tp\.|tỉnh)/i);
      street = firstKeywordIndex > 0 ? single.slice(0, firstKeywordIndex).trim() : single;
    }

    // final cleanup: trim and return
    return { street: (street || '').trim(), ward: (ward || '').trim(), district: (district || '').trim(), province: (province || '').trim() };
  }

  function buildFullAddress(street, ward, district, province) {
    const parts = [];
    if (street) parts.push(street.trim());
    if (ward) parts.push(ward.trim());
    if (district) parts.push(district.trim());
    if (province) parts.push(province.trim());
    return parts.join(', ');
  }
  // location helpers: fetch lists from server proxy
  async function loadProvinces() {
    try {
      const res = await fetch('http://localhost:5000/api/orders/locations/provinces');
      const j = await res.json();
      return (j.data || []);
    } catch (e) {
      console.error('loadProvinces', e);
      return [];
    }
  }
  async function loadDistricts(provinceCodeOrName) {
    if (!provinceCodeOrName) return [];
    try {
      // try numeric code first
      const res = await fetch(`http://localhost:5000/api/orders/locations/districts/${encodeURIComponent(provinceCodeOrName)}`);
      const j = await res.json();
      if (j.data) return j.data;
    } catch (e) {
      // continue to try lookup by name (slow) - the server proxy expects code, so skip
      console.warn('loadDistricts failed for code', provinceCodeOrName, e);
    }
    return [];
  }
  async function loadWards(districtCodeOrName) {
    if (!districtCodeOrName) return [];
    try {
      const res = await fetch(`http://localhost:5000/api/orders/locations/wards/${encodeURIComponent(districtCodeOrName)}`);
      const j = await res.json();
      if (j.data) return j.data;
    } catch (e) {
      console.warn('loadWards failed for code', districtCodeOrName, e);
    }
    return [];
  }
  async function fetchAddresses() {
    const cid = customerId();
    if (!cid || !token()) return;
    try {
      const res = await fetch(`http://localhost:5000/api/orders/customer-addresses/${cid}`, {
        headers: { Authorization: `Bearer ${token()}` }
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Lỗi khi lấy địa chỉ');
      renderAddresses(json.data || json);
    } catch (e) {
      console.error('fetchAddresses error', e);
      if (typeof showNotification_khan === 'function') showNotification_khan('error', 'Không tải được danh sách địa chỉ');
    }
  }

  function renderAddresses(addresses = []) {
    if (!otherAddrContainer) return;
    if (!addresses.length) {
      otherAddrContainer.innerHTML = '<p>Chưa có địa chỉ khác.</p>';
      if (defaultReceiveEl) defaultReceiveEl.textContent = 'Chưa có địa chỉ';
      return;
    }
  // Hiển thị địa chỉ mặc định = item đầu (chỉ tên đường ở phần detail)
    const primary = addresses[0];
    if (defaultReceiveEl) defaultReceiveEl.textContent = `${primary.name || ''} • ${primary.phone || ''} — ${extractStreet(primary.detail) || ''}`;

    otherAddrContainer.innerHTML = addresses.map(addr => `
      <div class="address-item" data-id="${addr.id}" data-detail="${encodeURIComponent(addr.detail || '')}" data-province="${encodeURIComponent(addr.province || '')}" data-district="${encodeURIComponent(addr.district || '')}" data-ward="${encodeURIComponent(addr.ward || '')}">
        <div class="address-info">
          <div class="addr-top">
            <span class="name">${addr.name || ''}</span>
            <span class="phone">${addr.phone || ''}</span>
          </div>
          <div class="addr-detail">${extractStreet(addr.detail) || ''}</div>
        </div>
        <div class="address-actions" style="margin-left:12px">
          <a href="#" class="edit edit-address" data-id="${addr.id}">Sửa</a>
          <button type="button" class="delete delete-address" data-id="${addr.id}">Xóa</button>
        </div>
      </div>
    `).join('');
  }

  async function createAddress(payload) {
    try {
      const res = await fetch('http://localhost:5000/api/orders/customer-addresses', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || j.message || 'Tạo địa chỉ thất bại');
      if (typeof showNotification_khan === 'function') showNotification_khan('success', 'Tạo địa chỉ thành công');
      await fetchAddresses();
    } catch (e) {
      console.error('createAddress error', e);
      if (typeof showNotification_khan === 'function') showNotification_khan('error', e.message || 'Lỗi tạo địa chỉ');
    }
  }

  async function updateAddress(id, payload) {
    try {
      const res = await fetch(`http://localhost:5000/api/orders/customer-addresses/${id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || j.message || 'Cập nhật thất bại');
      if (typeof showNotification_khan === 'function') showNotification_khan('success', 'Cập nhật địa chỉ thành công');
      await fetchAddresses();
    } catch (e) {
      console.error('updateAddress error', e);
      if (typeof showNotification_khan === 'function') showNotification_khan('error', e.message || 'Lỗi cập nhật địa chỉ');
    }
  }

  async function deleteAddress(id) {
    if (!confirm('Bạn có chắc muốn xóa địa chỉ này?')) return;
    try {
      const res = await fetch(`http://localhost:5000/api/orders/customer-addresses/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token()}` }
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || j.message || 'Xóa thất bại');
      if (typeof showNotification_khan === 'function') showNotification_khan('success', 'Xóa địa chỉ thành công');
      await fetchAddresses();
    } catch (e) {
      console.error('deleteAddress error', e);
      if (typeof showNotification_khan === 'function') showNotification_khan('error', e.message || 'Lỗi xóa địa chỉ');
    }
  }

  // Modal-based form for add/edit address. Returns Promise which resolves to payload or null if cancelled
 function openAddressPrompt(existing = {}) {
    return new Promise((resolve) => {
      const modal = document.getElementById('addressModal');
      const titleEl = document.getElementById('addressModalTitle');
      const nameEl = document.getElementById('addr_name');
      const phoneEl = document.getElementById('addr_phone');
      const detailEl = document.getElementById('addr_detail');
      const provinceEl = document.getElementById('addr_province');
      const districtEl = document.getElementById('addr_district');
      const wardEl = document.getElementById('addr_ward');
      const errorEl = document.getElementById('addr_form_error');
      const btnSave = document.getElementById('addr_save');
      const btnCancel = document.getElementById('addr_cancel');
      const btnClose = document.getElementById('addressModalClose');

      if (!modal) {
        // fallback to prompts
        const name = prompt('Họ tên người nhận:', existing.name || '');
        if (name === null) return resolve(null);
        const phone = prompt('Số điện thoại:', existing.phone || '');
        if (phone === null) return resolve(null);
        const detail = prompt('Địa chỉ chi tiết:', existing.detail || '');
        if (detail === null) return resolve(null);
        const province = prompt('Tỉnh/Thành (tên hoặc mã):', existing.province || '');
        if (province === null) return resolve(null);
        const district = prompt('Quận/Huyện (tên hoặc mã):', existing.district || '');
        if (district === null) return resolve(null);
        const ward = prompt('Phường/Xã (tên hoặc mã):', existing.ward || '');
        if (ward === null) return resolve(null);
        return resolve({ name: name.trim(), phone: phone.trim(), detail: detail.trim(), province: province.trim() || null, district: district.trim() || null, ward: ward.trim() || null });
      }

      // fill values: chỉ để phần tên đường vào addr_detail, và cố gắng tách ra tỉnh/quận/phường nếu có
      titleEl.textContent = existing && existing.name ? 'Sửa địa chỉ' : 'Thêm địa chỉ';
      nameEl.value = existing.name || '';
      phoneEl.value = existing.phone || '';
      // nếu server trả các trường riêng thì ưu tiên dùng, ngược lại tách từ existing.detail
      detailEl.value = extractStreet(existing.detail) || existing.detail || '';

      // Populate selects: provinces -> districts -> wards. Prefill using existing.province/district/ward which may be names or codes.
      (async () => {
        // load provinces into select
        const provinces = await loadProvinces();
        provinceEl.innerHTML = '<option value="">Tỉnh/Thành</option>' + provinces.map(p => `<option value="${p.code}">${p.name}</option>`).join('');

        // try to pre-select province by matching name or code
        let selectedProvinceCode = '';
        if (existing.province) {
          // if existing.province looks numeric, use as code
          if (/^\d+$/.test(String(existing.province))) selectedProvinceCode = String(existing.province);
          else {
            const found = provinces.find(p => p.name.toLowerCase() === String(existing.province).toLowerCase());
            if (found) selectedProvinceCode = String(found.code);
          }
        }
        if (!selectedProvinceCode && provinces.length === 1) selectedProvinceCode = String(provinces[0].code);
        if (selectedProvinceCode) provinceEl.value = selectedProvinceCode;

        // load districts for selected province
        const districts = selectedProvinceCode ? await loadDistricts(selectedProvinceCode) : [];
        districtEl.innerHTML = '<option value="">Quận/Huyện</option>' + districts.map(d => `<option value="${d.code}">${d.name}</option>`).join('');

        // try preselect district
        let selectedDistrictCode = '';
        if (existing.district) {
          if (/^\d+$/.test(String(existing.district))) selectedDistrictCode = String(existing.district);
          else {
            const foundD = districts.find(d => d.name.toLowerCase() === String(existing.district).toLowerCase());
            if (foundD) selectedDistrictCode = String(foundD.code);
          }
        }
        if (selectedDistrictCode) districtEl.value = selectedDistrictCode;

        // load wards for selected district
        const wards = selectedDistrictCode ? await loadWards(selectedDistrictCode) : [];
        wardEl.innerHTML = '<option value="">Phường/Xã</option>' + wards.map(w => `<option value="${w.code}">${w.name}</option>`).join('');

        // try preselect ward
        if (existing.ward) {
          if (/^\d+$/.test(String(existing.ward))) wardEl.value = String(existing.ward);
          else {
            const foundW = wards.find(w => w.name.toLowerCase() === String(existing.ward).toLowerCase());
            if (foundW) wardEl.value = String(foundW.code);
          }
        }
      })();
      errorEl.style.display = 'none';

      function cleanup() {
        btnSave.removeEventListener('click', onSave);
        btnCancel.removeEventListener('click', onCancel);
        btnClose.removeEventListener('click', onCancel);
        provinceEl.removeEventListener('change', onProvinceChange);
        districtEl.removeEventListener('change', onDistrictChange);
        modal.style.display = 'none';
      }

      function validate() {
        const name = nameEl.value.trim();
        const phone = phoneEl.value.trim();
        const detail = detailEl.value.trim();
        if (!name) return 'Vui lòng nhập họ tên người nhận';
        if (!phone) return 'Vui lòng nhập số điện thoại';
        if (!detail) return 'Vui lòng nhập địa chỉ chi tiết';
        return null;
      }

      async function onProvinceChange(e) {
        const code = provinceEl.value;
        // clear district & ward
        districtEl.innerHTML = '<option value="">Quận/Huyện</option>';
        wardEl.innerHTML = '<option value="">Phường/Xã</option>';
        if (!code) return;
        const districts = await loadDistricts(code);
        districtEl.innerHTML = '<option value="">Quận/Huyện</option>' + (districts || []).map(d => `<option value="${d.code}">${d.name}</option>`).join('');
      }

      async function onDistrictChange(e) {
        const code = districtEl.value;
        wardEl.innerHTML = '<option value="">Phường/Xã</option>';
        if (!code) return;
        const wards = await loadWards(code);
        wardEl.innerHTML = '<option value="">Phường/Xã</option>' + (wards || []).map(w => `<option value="${w.code}">${w.name}</option>`).join('');
      }

      provinceEl.addEventListener('change', onProvinceChange);
      districtEl.addEventListener('change', onDistrictChange);

      function onSave(e) {
        e.preventDefault();
        const v = validate();
        if (v) {
          errorEl.textContent = v;
          errorEl.style.display = 'block';
          return;
        }
        // build full detail from components so server has consistent full address
        const street = nameEl ? detailEl.value.trim() : detailEl.value.trim();
        // For selects we store the selected code; if user typed names (fallback) take the select text
        const provinceV = provinceEl.value ? provinceEl.options[provinceEl.selectedIndex].text.trim() : (provinceEl.value || null);
        const districtV = districtEl.value ? districtEl.options[districtEl.selectedIndex].text.trim() : (districtEl.value || null);
        const wardV = wardEl.value ? wardEl.options[wardEl.selectedIndex].text.trim() : (wardEl.value || null);
        const fullDetail = buildFullAddress(detailEl.value.trim(), wardV, districtV, provinceV);

        const payload = {
          name: nameEl.value.trim(),
          phone: phoneEl.value.trim(),
          detail: fullDetail,
          province: provinceV,
          district: districtV,
          ward: wardV
        };
        cleanup();
        resolve(payload);
      }

      function onCancel(e) {
        if (e) e.preventDefault();
        cleanup();
        resolve(null);
      }

      btnSave.addEventListener('click', onSave);
      btnCancel.addEventListener('click', onCancel);
      btnClose.addEventListener('click', onCancel);

      // show modal
      modal.style.display = 'flex';
      nameEl.focus();
    });
  }

  // Event bindings
  if (addLink) {
    addLink.addEventListener('click', async (e) => {
      e.preventDefault();
      const payload = await openAddressPrompt(); // <-- await thêm ở đây
      if (!payload) return;
      await createAddress({ name: payload.name, phone: payload.phone, detail: payload.detail, province: payload.province, district: payload.district, ward: payload.ward });
    });
  }

  // Delegate edit/delete clicks
  if (otherAddrContainer) {
    otherAddrContainer.addEventListener('click', async (e) => {
      const editEl = e.target.closest('.edit-address');
      const delEl = e.target.closest('.delete-address');
      if (editEl) {
        e.preventDefault();
        const id = editEl.dataset.id;
        // find current values on DOM
        const root = otherAddrContainer.querySelector(`.address-item[data-id="${id}"]`);
  const name = root?.querySelector('.addr-top strong')?.textContent?.trim() || '';
  const phone = root?.querySelector('.phone')?.textContent?.trim() || '';
  // read encoded full-detail and parts from data attributes (set when rendering)
  const encodedDetail = root?.dataset.detail || '';
  const encodedProvince = root?.dataset.province || '';
  const encodedDistrict = root?.dataset.district || '';
  const encodedWard = root?.dataset.ward || '';
  const detailFull = encodedDetail ? decodeURIComponent(encodedDetail) : (root?.querySelector('.addr-detail')?.textContent?.trim() || '');
  const provinceVal = encodedProvince ? decodeURIComponent(encodedProvince) : '';
  const districtVal = encodedDistrict ? decodeURIComponent(encodedDistrict) : '';
  const wardVal = encodedWard ? decodeURIComponent(encodedWard) : '';
  const payload = await openAddressPrompt({ name, phone, detail: detailFull, province: provinceVal, district: districtVal, ward: wardVal });
        if (!payload) return;
        await updateAddress(id, { name: payload.name, phone: payload.phone, detail: payload.detail, province: payload.province, district: payload.district, ward: payload.ward });
      } else if (delEl) {
        e.preventDefault();
        const id = delEl.dataset.id;
        await deleteAddress(id);
      }
    });
  }


// also bind global "Sửa" link in default address block (has class .edit-link)
  const defaultEdit = document.querySelector('.address-block .edit-link');
  if (defaultEdit) {
    defaultEdit.addEventListener('click', async (e) => {
      e.preventDefault();
      try {
        const cid = customerId();
        const res = await fetch(`http://localhost:5000/api/orders/customer-addresses/${cid}`, {
          headers: { Authorization: `Bearer ${token()}` }
        });
        const j = await res.json();
        if (!res.ok) throw new Error(j.error || 'Lỗi');
        const first = (j.data || j)[0];
        if (!first) {
          if (typeof showNotification_khan === 'function') showNotification_khan('error', 'Chưa có địa chỉ để sửa');
          return;
        }
        const payload = await openAddressPrompt(first); // <-- await thêm ở đây
        if (!payload) return;
        await updateAddress(first.id, { name: payload.name, phone: payload.phone, detail: payload.detail, province: payload.province, district: payload.district, ward: payload.ward });
      } catch (e) {
        console.error('defaultEdit error', e);
        if (typeof showNotification_khan === 'function') showNotification_khan('error', 'Lỗi khi sửa địa chỉ mặc định');
      }
    });
  }

  // initial load (delay nhỏ để đảm bảo customerId đã được set khi loadUserProfile trước đó)
  setTimeout(fetchAddresses, 300);
})();
