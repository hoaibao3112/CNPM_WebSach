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
    const customerId = localStorage.getItem('customerId'); // Lấy makh từ localStorage

    // Kiểm tra xem customerId có tồn tại không
    if (!customerId) {
      passwordErrorMessage.textContent = 'Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.';
      passwordErrorMessage.style.display = 'block';
      passwordSuccessMessage.style.display = 'none';
      return;
    }

    // Kiểm tra các trường bắt buộc
    if (!oldPassword || !newPassword || !confirmPassword) {
      passwordErrorMessage.textContent = 'Vui lòng nhập đầy đủ các trường';
      passwordErrorMessage.style.display = 'block';
      passwordSuccessMessage.style.display = 'none';
      return;
    }

    // Kiểm tra mật khẩu mới và xác nhận mật khẩu
    if (newPassword !== confirmPassword) {
      passwordErrorMessage.textContent = 'Mật khẩu mới và xác nhận mật khẩu không khớp';
      passwordErrorMessage.style.display = 'block';
      passwordSuccessMessage.style.display = 'none';
      return;
    }

    // Kiểm tra độ dài mật khẩu mới
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
        // Xóa các trường nhập sau khi đổi mật khẩu thành công
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