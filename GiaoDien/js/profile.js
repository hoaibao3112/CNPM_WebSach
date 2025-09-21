document.addEventListener('DOMContentLoaded', function() {
  loadUserProfile();
  setupUpdateButton();
  setupSidebarNavigation();
  setupChangePasswordButton();
});

function loadUserProfile() {
  const user = JSON.parse(localStorage.getItem('user'));
  if (!user) {
    window.location.href = 'login.html';
    return;
  }
  document.getElementById('hoten').value = user.tenkh || user.hoten || '';
  document.getElementById('sodienthoai').value = user.sodienthoai || '';
  document.getElementById('email').value = user.email || '';
}

function setupUpdateButton() {
  const updateBtn = document.getElementById('updateBtn');
  const errorMessage = document.getElementById('errorMessage');
  const successMessage = document.getElementById('successMessage');

  updateBtn.addEventListener('click', async function() {
    const profileData = {
      tenkh: document.getElementById('hoten').value,
      sodienthoai: document.getElementById('sodienthoai').value,
      email: document.getElementById('email').value
    };

    try {
      updateBtn.disabled = true;
      updateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang lưu...';

      const token = localStorage.getItem('token');
      const customerId = localStorage.getItem('customerId');

      const response = await fetch(`http://localhost:5000/api/client/profile/${customerId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(profileData)
      });

      const data = await response.json();

      if (response.ok) {
        successMessage.textContent = 'Cập nhật hồ sơ thành công';
        successMessage.style.display = 'block';
        errorMessage.style.display = 'none';

        const updatedUser = { ...JSON.parse(localStorage.getItem('user')), ...profileData };
        localStorage.setItem('user', JSON.stringify(updatedUser));

        setTimeout(() => {
          successMessage.style.display = 'none';
        }, 2000);
      } else {
        errorMessage.textContent = data.error || data.message || 'Cập nhật hồ sơ thất bại';
        errorMessage.style.display = 'block';
        successMessage.style.display = 'none';
      }
    } catch (error) {
      console.error('Lỗi cập nhật hồ sơ:', error);
      errorMessage.textContent = 'Không thể kết nối đến server';
      errorMessage.style.display = 'block';
      successMessage.style.display = 'none';
    } finally {
      updateBtn.disabled = false;
      updateBtn.innerHTML = 'Thay đổi';
    }
  });
}

function setupSidebarNavigation() {
  const sidebarItems = document.querySelectorAll('.sidebar ul li[data-section]');
  const sections = document.querySelectorAll('.main-content .section');

  sidebarItems.forEach(item => {
    item.addEventListener('click', function() {
      const sectionId = this.getAttribute('data-section');
      // Ẩn tất cả các section
      sections.forEach(section => {
        section.style.display = 'none';
      });
      // Hiển thị section tương ứng
      const targetSection = document.getElementById(sectionId);
      if (targetSection) {
        targetSection.style.display = 'block';
      }
      // Nếu là section wishlist, tải danh sách yêu thích
      if (sectionId === 'wishlist') {
        displayWishlist();
      }
      // Nếu là section mã khuyến mãi, hiển thị mã
      if (sectionId === 'promo-codes') {
        displayPromoCodes();
      }
    });
  });
}

function displayWishlist() {
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

function removeFromWishlist(productId) {
  let wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];
  wishlist = wishlist.filter(item => item.id !== productId);
  localStorage.setItem('wishlist', JSON.stringify(wishlist));
  displayWishlist();
  showAlert('Đã xóa sản phẩm khỏi danh sách yêu thích!');
}

window.saveProductBeforeRedirect = (product) => {
  localStorage.setItem('currentProduct', JSON.stringify(product));
};

const formatPrice = (price) => new Intl.NumberFormat('vi-VN').format(price) + ' đ';

const showAlert = (message) => alert(message);

function setupChangePasswordButton() {
  const changePasswordBtn = document.getElementById('changePasswordBtn');
  const passwordErrorMessage = document.getElementById('passwordErrorMessage');
  const passwordSuccessMessage = document.getElementById('passwordSuccessMessage');

  changePasswordBtn.addEventListener('click', async function() {
    const oldPassword = document.getElementById('oldPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const customerId = localStorage.getItem('customerId');

    if (!customerId) {
      passwordErrorMessage.textContent = 'Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.';
      passwordErrorMessage.style.display = 'block';
      passwordSuccessMessage.style.display = 'none';
      return;
    }
    if (!oldPassword || !newPassword || !confirmPassword) {
      passwordErrorMessage.textContent = 'Vui lòng nhập đầy đủ các trường';
      passwordErrorMessage.style.display = 'block';
      passwordSuccessMessage.style.display = 'none';
      return;
    }
    if (newPassword !== confirmPassword) {
      passwordErrorMessage.textContent = 'Mật khẩu mới và xác nhận mật khẩu không khớp';
      passwordErrorMessage.style.display = 'block';
      passwordSuccessMessage.style.display = 'none';
      return;
    }
    if (newPassword.length < 8) {
      passwordErrorMessage.textContent = 'Mật khẩu mới phải có ít nhất 8 ký tự';
      passwordErrorMessage.style.display = 'block';
      passwordSuccessMessage.style.display = 'none';
      return;
    }
    try {
      changePasswordBtn.disabled = true;
      changePasswordBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang xử lý...';

      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/client/change-password/${customerId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ oldPassword, newPassword, confirmPassword })
      });

      const data = await response.json();

      if (response.ok) {
        passwordSuccessMessage.textContent = 'Đổi mật khẩu thành công';
        passwordSuccessMessage.style.display = 'block';
        passwordErrorMessage.style.display = 'none';
        document.getElementById('oldPassword').value = '';
        document.getElementById('newPassword').value = '';
        document.getElementById('confirmPassword').value = '';
        setTimeout(() => {
          passwordSuccessMessage.style.display = 'none';
        }, 2000);
      } else {
        passwordErrorMessage.textContent = data.error || 'Đổi mật khẩu thất bại';
        passwordErrorMessage.style.display = 'block';
        passwordSuccessMessage.style.display = 'none';
      }
    } catch (error) {
      console.error('Lỗi đổi mật khẩu:', error);
      passwordErrorMessage.textContent = 'Không thể kết nối đến server';
      passwordErrorMessage.style.display = 'block';
      passwordSuccessMessage.style.display = 'none';
    } finally {
      changePasswordBtn.disabled = false;
      changePasswordBtn.innerHTML = 'Thay đổi mật khẩu';
    }
  });
}

// Hiển thị các mã khuyến mãi đã lưu và gắn sự kiện xem chi tiết
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
  setupPromoDetailEvents();
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