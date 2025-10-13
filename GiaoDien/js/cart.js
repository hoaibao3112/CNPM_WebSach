// cart.js - Optimized for cart operations with backend API and localStorage fallback

// Utility function to format price
function formatPrice(price) {
  return new Intl.NumberFormat('vi-VN').format(price) + 'đ';
}

// Check if user is logged in
function isLoggedIn() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const token = localStorage.getItem('token');
  return user?.makh && token;
}

// Get token
function getToken() {
  return localStorage.getItem('token');
}

// Get user ID
function getUserId() {
  return JSON.parse(localStorage.getItem('user') || '{}')?.makh;
}

// Get cart from backend or localStorage
async function getCart() {
  if (isLoggedIn()) {
    try {
      const response = await fetch('http://localhost:5000/api/client/cart', {
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const cartItems = await response.json();
        return cartItems.map(item => ({
          id: item.MaSP,
          name: item.name,
          price: item.price,
          image: item.image,
          quantity: item.quantity,
          selected: item.Selected !== false
        }));
      }
      console.error('Error fetching cart from server:', await response.json());
      return getLocalCart(); // Fallback to localStorage
    } catch (error) {
      console.error('Cart API error:', error);
      return getLocalCart();
    }
  }
  return getLocalCart();
}

// Get cart from localStorage
function getLocalCart() {
  return JSON.parse(localStorage.getItem('cart') || '[]');
}

// Save cart to localStorage
function saveLocalCart(cart) {
  localStorage.setItem('cart', JSON.stringify(cart));
}

// Sync local cart to server
async function syncLocalCartToServer() {
  if (!isLoggedIn()) return;
  const localCart = getLocalCart();
  if (localCart.length === 0) return;

  for (const item of localCart) {
    try {
      const response = await fetch('http://localhost:5000/api/client/cart/add', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ productId: item.id, quantity: item.quantity })
      });
      if (!response.ok) console.error('Sync error for product:', item.id, await response.json());
    } catch (error) {
      console.error('Sync cart error:', error);
    }
  }
  localStorage.removeItem('cart'); // Clear local cart after sync
}

// Add item to cart
async function addToCart(productId, quantity = 1, productName, price, image) {
  if (isLoggedIn()) {
    try {
      const response = await fetch('http://localhost:5000/api/client/cart/add', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ productId, quantity })
      });
      if (response.ok) {
        await renderCart();
        showToast('Đã thêm sản phẩm vào giỏ hàng!');
        updateCartCount();
        return true;
      }
      showToast((await response.json()).error || 'Lỗi khi thêm vào giỏ hàng');
      return false;
    } catch (error) {
      console.error('Add to cart error:', error);
      showToast('Lỗi kết nối. Vui lòng thử lại!');
      return false;
    }
  } else {
    let cart = getLocalCart();
    const existingItem = cart.find(item => item.id === productId);
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.push({ id: productId, name: productName, price, image, quantity, selected: true });
    }
    saveLocalCart(cart);
    await renderCart();
    showToast('Đã thêm sản phẩm vào giỏ hàng! (Đăng nhập để lưu vĩnh viễn)');
    updateCartCount();
    return true;
  }
}

// Update item quantity
async function updateQuantity(index, newQuantity) {
  if (newQuantity < 1) return false;
  const cart = await getCart();
  const item = cart[index];

  if (isLoggedIn()) {
    try {
      const response = await fetch('http://localhost:5000/api/client/cart/update', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ productId: item.id, quantity: newQuantity })
      });
      if (response.ok) {
        await renderCart();
        updateCartCount();
        return true;
      }
      showToast('Lỗi cập nhật số lượng');
      return false;
    } catch (error) {
      console.error('Update quantity error:', error);
      showToast('Lỗi kết nối. Vui lòng thử lại!');
      return false;
    }
  } else {
    item.quantity = newQuantity;
    saveLocalCart(cart);
    await renderCart();
    updateCartCount();
    return true;
  }
}

// Remove item from cart
async function removeFromCart(index) {
  const cart = await getCart();
  const item = cart[index];

  if (isLoggedIn()) {
    try {
      const response = await fetch(`http://localhost:5000/api/client/cart/remove/${item.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${getToken()}`
        }
      });
      if (response.ok) {
        await renderCart();
        showToast('Đã xóa sản phẩm khỏi giỏ hàng');
        updateCartCount();
        return true;
      }
      showToast('Lỗi xóa sản phẩm');
      return false;
    } catch (error) {
      console.error('Remove item error:', error);
      showToast('Lỗi kết nối. Vui lòng thử lại!');
      return false;
    }
  } else {
    cart.splice(index, 1);
    saveLocalCart(cart);
    await renderCart();
    showToast('Đã xóa sản phẩm khỏi giỏ hàng');
    updateCartCount();
    return true;
  }
}

// Toggle item selection
async function toggleSelection(index, selected) {
  const cart = await getCart();
  if (isLoggedIn()) {
    try {
      const response = await fetch('http://localhost:5000/api/client/cart/select', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ productId: cart[index].id, selected })
      });
      if (response.ok) {
        await renderCart();
        return true;
      }
      showToast('Lỗi cập nhật lựa chọn');
      return false;
    } catch (error) {
      console.error('Toggle selection error:', error);
      showToast('Lỗi kết nối. Vui lòng thử lại!');
      return false;
    }
  } else {
    cart[index].selected = selected;
    saveLocalCart(cart);
    await renderCart();
    return true;
  }
}

// Clear cart
async function clearCart() {
  if (isLoggedIn()) {
    try {
      const response = await fetch('http://localhost:5000/api/client/cart/clear', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${getToken()}`
        }
      });
      if (response.ok) {
        await renderCart();
        showToast('Đã xóa toàn bộ giỏ hàng');
        updateCartCount();
        return true;
      }
      showToast('Lỗi xóa giỏ hàng');
      return false;
    } catch (error) {
      console.error('Clear cart error:', error);
      showToast('Lỗi kết nối. Vui lòng thử lại!');
      return false;
    }
  } else {
    localStorage.removeItem('cart');
    await renderCart();
    showToast('Đã xóa toàn bộ giỏ hàng');
    updateCartCount();
    return true;
  }
}

// Update cart count display
function updateCartCount() {
  getCart().then(cart => {
    const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
    document.querySelectorAll('.cart-count').forEach(element => {
      element.textContent = totalItems;
      element.style.display = totalItems > 0 ? 'flex' : 'none';
    });
  });
}

// Render cart items
async function renderCart() {
  const cart = await getCart();
  const cartItemsBody = document.getElementById('cart-items-body');
  const emptyCartMessage = document.getElementById('empty-cart');

  if (!cartItemsBody || !emptyCartMessage) {
    console.error('Missing cart-items-body or empty-cart elements');
    return;
  }

  cartItemsBody.innerHTML = '';
  const cartActions = document.querySelector('.cart-actions');
  const checkoutSection = document.querySelector('.checkout-section');
  const customerInfoSection = document.querySelector('.customer-info-section');

  if (cart.length === 0) {
    emptyCartMessage.style.display = 'block';
    updateSummary(0);
    cartActions?.classList.add('hidden');
    checkoutSection?.classList.add('hidden');
    customerInfoSection?.classList.add('hidden');
    return;
  }

  emptyCartMessage.style.display = 'none';
  cartActions?.classList.remove('hidden');
  checkoutSection?.classList.remove('hidden');
  customerInfoSection?.classList.remove('hidden');

  let subtotal = 0;
  cart.forEach((item, index) => {
    const itemTotal = item.price * item.quantity;
    if (item.selected) subtotal += itemTotal;

    const row = document.createElement('tr');
    row.innerHTML = `
      <td class="select-col">
        <input type="checkbox" class="select-item" data-index="${index}" ${item.selected ? 'checked' : ''}>
      </td>
      <td class="product-col">
        <div class="product-item">
          <img src="img/product/${item.image}" alt="${item.name}" class="product-img" onerror="this.src='img/product/default.jpg'">
          <div class="product-info">
            <h3>${item.name}</h3>
            <p>Mã SP: ${item.id}</p>
          </div>
        </div>
      </td>
      <td class="price-col">${formatPrice(item.price)}</td>
      <td class="quantity-col">
        <div class="quantity-control">
          <button class="qty-btn minus" data-index="${index}">-</button>
          <input type="number" class="qty-input" value="${item.quantity}" min="1" data-index="${index}">
          <button class="qty-btn plus" data-index="${index}">+</button>
        </div>
      </td>
      <td class="total-col">${formatPrice(itemTotal)}</td>
      <td class="action-col">
        <button class="remove-btn" data-index="${index}" title="Xóa sản phẩm">
          <i class="fas fa-trash"></i>
        </button>
      </td>
    `;
    cartItemsBody.appendChild(row);
  });

  updateSummary(subtotal);
  attachEventListeners();
  updateCartCount();
}

// Update order summary
function updateSummary(subtotal, discount = 0) {
  const total = Math.max(0, subtotal - discount);
  const subtotalElement = document.getElementById('subtotal');
  const discountRow = document.getElementById('discount-row');
  const discountElement = document.getElementById('discount');
  const totalElement = document.getElementById('total');

  if (!subtotalElement || !discountRow || !discountElement || !totalElement) {
    console.error('Missing summary elements');
    return;
  }

  subtotalElement.textContent = formatPrice(subtotal);
  discountRow.style.display = discount > 0 ? 'flex' : 'none';
  discountElement.textContent = discount > 0 ? `-${formatPrice(discount)}` : '-0đ';
  totalElement.textContent = formatPrice( total);
}

// Attach event listeners
function attachEventListeners() {
  const selectAllCheckbox = document.getElementById('select-all');
  if (selectAllCheckbox) {
    selectAllCheckbox.addEventListener('change', async e => {
      const cart = await getCart();
      for (let i = 0; i < cart.length; i++) {
        await toggleSelection(i, e.target.checked);
      }
    });
  }

  document.querySelectorAll('.select-item').forEach(checkbox => {
    checkbox.addEventListener('change', async e => {
      await toggleSelection(parseInt(e.target.dataset.index), e.target.checked);
    });
  });

  document.querySelectorAll('.qty-btn').forEach(btn => {
    btn.addEventListener('click', async e => {
      const index = parseInt(e.target.dataset.index);
      const input = e.target.parentElement.querySelector('.qty-input');
      let newQty = parseInt(input.value);
      newQty += e.target.classList.contains('plus') ? 1 : -1;
      await updateQuantity(index, newQty);
    });
  });

  document.querySelectorAll('.qty-input').forEach(input => {
    input.addEventListener('change', async e => {
      await updateQuantity(parseInt(e.target.dataset.index), parseInt(e.target.value));
    });
  });

  document.querySelectorAll('.remove-btn').forEach(btn => {
    btn.addEventListener('click', async e => {
      const index = parseInt(e.currentTarget.dataset.index);
      await removeFromCart(index);
    });
  });

  const clearCartBtn = document.getElementById('clear-cart');
  if (clearCartBtn) {
    clearCartBtn.addEventListener('click', async () => {
      if (confirm('Bạn có chắc muốn xóa toàn bộ giỏ hàng?')) {
        await clearCart();
      }
    });
  }

  const applyCouponBtn = document.getElementById('apply-coupon');
  if (applyCouponBtn) {
    applyCouponBtn.addEventListener('click', async () => {
      const discountDetails  = await applyPromo()
      if(discountDetails) {
        updateSummary(discountDetails.total, discountDetails.discountAmount)
        totalAmountDiscouted = discountDetails.totalFinal;
      }
    });
  }

  const checkoutBtn = document.getElementById('checkout-btn');
  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', checkout);
  }
}

function getFormData() {
  if (!window.location.pathname.includes('cart.html')) {
    console.error('getFormData called on wrong page');
    return null;
  }

  const elements = {
    tenkh: document.getElementById('name'),
    sdt: document.getElementById('phone'),
    email: document.getElementById('email'),
    tinhthanh: document.getElementById('tinhthanh'),
    quanhuyen: document.getElementById('quanhuyen'),
    phuongxa: document.getElementById('phuongxa'),
    diachi: document.getElementById('diachichitiet')
  };

  if (Object.values(elements).some(el => !el || !el.value.trim())) {
    console.error('Missing or empty form elements');
    return null;
  }

  return {
    tenkh: elements.tenkh.value,
    sdt: elements.sdt.value,
    email: elements.email.value,
    tinhthanh: elements.tinhthanh.value,
    quanhuyen: elements.quanhuyen.value,
    phuongxa: elements.phuongxa.value,
    diachi: elements.diachi.value
  };
}

// Checkout function - Fixed version
var totalAmountDiscouted;
async function checkout() {
  console.log('🚀 Checkout started');

  if (!isLoggedIn()) {
    console.log('❌ User not logged in');
    showToast('Vui lòng đăng nhập để tiến hành thanh toán!');
    window.location.href = 'login.html';
    return;
  }

  const form = document.getElementById('customer-form');
  if (!form) {
    console.error('❌ Form not found');
    showToast('Không tìm thấy form thông tin!');
    return;
  }

  // Lấy form data
  const formData = {
    tenkh: document.getElementById('name').value.trim(),
    sdt: document.getElementById('phone').value.trim(),
    email: document.getElementById('email').value.trim(),
    tinhthanh: document.getElementById('tinhthanh').value,
    quanhuyen: document.getElementById('quanhuyen').value,
    phuongxa: document.getElementById('phuongxa').value,
    diachi: document.getElementById('diachichitiet').value.trim(),
    paymentMethod: document.getElementById('payment-method').value,
    notes: document.getElementById('notes').value.trim()
  };

  console.log('🔍 Form Data:', formData);

  // Validate form
  if (!validateForm(formData)) {
    console.log('❌ Form validation failed');
    return;
  }

  const cart = await getCart();
  const selectedItems = cart.filter(item => item.selected);

  console.log('🔍 Selected Items:', selectedItems);

  if (selectedItems.length === 0) {
    showToast('Vui lòng chọn ít nhất một sản phẩm!');
    return;
  }

  // Construct order data
  const orderData = {
    totalAmountDiscouted: totalAmountDiscouted || null,
    customer: {
      makh: getUserId(),
      name: formData.tenkh,
      phone: formData.sdt,
      email: formData.email
    },
    items: selectedItems.map(item => ({
      MaSP: item.id,
      SoLuong: item.quantity
    })),
    shippingAddress: {
      detail: formData.diachi,
      province: formData.tinhthanh,
      district: formData.quanhuyen,
      ward: formData.phuongxa
    },
    paymentMethod: formData.paymentMethod,
    notes: formData.notes
  };

  console.log('🔍 Order Data:', JSON.stringify(orderData, null, 2));

  try {
    console.log('🔄 Sending request to API...');
    
    const response = await fetch('http://localhost:5000/api/orders/place-order', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getToken()}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(orderData)
    });

    console.log('🔍 Response Status:', response.status);
    console.log('🔍 Response OK:', response.ok);

    const result = await response.json();
    console.log('🔍 API Response:', JSON.stringify(result, null, 2));

    if (!response.ok) {
      console.error('❌ API Error:', result);
      throw new Error(result.error || `HTTP error! Status: ${response.status}`);
    }

    // ✅ XỬ LÝ RESPONSE ĐÚNG CHO COD VÀ VNPAY
    if (result.success) {
      if (formData.paymentMethod === 'VNPAY' && result.paymentUrl) {
        console.log('🔄 Redirecting to VNPay:', result.paymentUrl);
        window.location.href = result.paymentUrl;
      } else if (formData.paymentMethod === 'COD') {
        // ✅ COD SUCCESS - REDIRECT ĐÚNG
        console.log('✅ COD Order successful:', result.orderId);
        showToast('Đặt hàng COD thành công!');
        await clearCart();
        
        // ✅ REDIRECT VỚI ĐÚNG THAM SỐ
        window.location.href = `order-confirmation.html?orderId=${result.orderId}&status=cod&paymentMethod=COD&amount=${orderData.totalAmountDiscouted || selectedItems.reduce((sum, item) => sum + item.price * item.quantity, 0)}&message=${encodeURIComponent(result.message || 'Đặt hàng COD thành công')}`;
      } else {
        throw new Error('Phương thức thanh toán không được hỗ trợ');
      }
    } else {
      throw new Error(result.error || 'Đặt hàng thất bại');
    }

  } catch (error) {
    console.error('❌ Checkout error:', error);
    showToast(`Lỗi khi đặt hàng: ${error.message}`);
    
    // ✅ REDIRECT SANG TRANG LỖI VỚI THÔNG TIN CHI TIẾT
    window.location.href = `order-confirmation.html?status=error&message=${encodeURIComponent(error.message)}`;
  }
}

// Validate form
function validateForm(formData) {
  if (!formData.tenkh.trim()) {
    showToast('Vui lòng nhập họ tên!');
    return false;
  }
  if (!/^\d{10,11}$/.test(formData.sdt)) {
    showToast('Số điện thoại không hợp lệ!');
    return false;
  }
  if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
    showToast('Email không hợp lệ!');
    return false;
  }
  if (!formData.tinhthanh || !formData.quanhuyen || !formData.phuongxa || !formData.diachi.trim()) {
    showToast('Vui lòng điền đầy đủ địa chỉ!');
    return false;
  }
  if (!formData.paymentMethod) {
    showToast('Vui lòng chọn phương thức thanh toán!');
    return false;
  }
  return true;
}

// Show toast notification
function showToast(message) {
  const toast = document.createElement('div');
  toast.className = 'toast-notification';
  toast.innerHTML = `
    <span>${message}</span>
    <button class="toast-close">&times;</button>
  `;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('hide');
    setTimeout(() => toast.remove(), 300);
  }, 3000);

  toast.querySelector('.toast-close').addEventListener('click', () => {
    toast.classList.add('hide');
    setTimeout(() => toast.remove(), 300);
  });
}

// Load provinces
async function loadProvinces() {
  const provinceSelect = document.getElementById('tinhthanh');
  if (!provinceSelect) return;

  try {
    const response = await fetch('https://provinces.open-api.vn/api/');
    const provinces = await response.json();
    provinceSelect.innerHTML = '<option value="">-- Chọn Tỉnh/TP --</option>';
    provinces.forEach(province => {
      const option = document.createElement('option');
      option.value = province.code;
      option.textContent = province.name;
      provinceSelect.appendChild(option);
    });
  } catch (error) {
    console.error('Error loading provinces:', error);
    provinceSelect.innerHTML = '<option value="">Không tải được dữ liệu</option>';
  }
}

// Load districts
async function loadDistricts() {
  const provinceSelect = document.getElementById('tinhthanh');
  const districtSelect = document.getElementById('quanhuyen');
  const wardSelect = document.getElementById('phuongxa');
  if (!districtSelect || !wardSelect) return;

  districtSelect.innerHTML = '<option value="">-- Chọn Quận/Huyện --</option>';
  wardSelect.innerHTML = '<option value="">-- Chọn Phường/Xã --</option>';
  wardSelect.disabled = true;

  if (!provinceSelect.value) {
    districtSelect.disabled = true;
    return;
  }

  try {
    const response = await fetch(`https://provinces.open-api.vn/api/p/${provinceSelect.value}?depth=2`);
    const provinceData = await response.json();
    provinceData.districts.forEach(district => {
      const option = document.createElement('option');
      option.value = district.code;
      option.textContent = district.name;
      districtSelect.appendChild(option);
    });
    districtSelect.disabled = false;
  } catch (error) {
    console.error('Error loading districts:', error);
    districtSelect.innerHTML = '<option value="">Không tải được dữ liệu</option>';
  }
}

// Load wards
async function loadWards() {
  const districtSelect = document.getElementById('quanhuyen');
  const wardSelect = document.getElementById('phuongxa');
  if (!districtSelect || !wardSelect) return;

  wardSelect.innerHTML = '<option value="">-- Chọn Phường/Xã --</option>';
  if (!districtSelect.value) {
    wardSelect.disabled = true;
    return;
  }

  try {
    const response = await fetch(`https://provinces.open-api.vn/api/d/${districtSelect.value}?depth=2`);
    const districtData = await response.json();
    districtData.wards.forEach(ward => {
      const option = document.createElement('option');
      option.value = ward.code;
      option.textContent = ward.name;
      wardSelect.appendChild(option);
    });
    wardSelect.disabled = false;
  } catch (error) {
    console.error('Error loading wards:', error);
    wardSelect.innerHTML = '<option value="">Không tải được dữ liệu</option>';
  }
}

// Handle VNPay return
function handleVNPayReturn() {
  const urlParams = new URLSearchParams(window.location.search);
  const orderId = urlParams.get('orderId');
  const status = urlParams.get('status');
  if (orderId && status) {
    showToast(status === 'success' ? 'Thanh toán thành công!' : 'Thanh toán thất bại. Vui lòng thử lại.');
    if (status === 'success') {
      window.location.href = `order-confirmation.html?orderId=${orderId}`;
    }
  }
}
//áp dụng khuyến mãi 
async function applyPromo() {
  try {
    const cart = await getCart();
    const selectedItems = cart.filter(item => item.selected);

    const codeKM = document.getElementById('coupon-code').value.trim();
    if (!codeKM) {
      showToast("Vui lòng nhập mã khuyến mãi");
      return;
    }

    const otherData = {
      makh: getUserId(),
      code: codeKM,
      cartItems: selectedItems.map(item => ({
        MaSP: item.id,
        SoLuong: item.quantity,
        DonGia: item.price
      }))
    };

    const res = await fetch("http://localhost:5000/api/khuyenmai/apply-to-cart", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${getToken()}`,
      },
      body: JSON.stringify(otherData)
    });

    const data = await res.json();

    if (res.ok) {
      console.log("Kết quả sau tính toán:", data);
      showToast("Áp dụng mã khuyến mãi thành công!");
      return data.discountDetails;
    } else {
      showToast(data.error || "Áp dụng mã thất bại");
      console.error("Lỗi request:", data.error);
      return null;
    }
  } catch (error) {
    console.error("Lỗi:", error);
    showToast("Có lỗi xảy ra, vui lòng thử lại sau");
    return null;
  }
}

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  if (isLoggedIn()) await syncLocalCartToServer();
  await renderCart();

  const tinhthanh = document.getElementById('tinhthanh');
  if (tinhthanh) {
    loadProvinces();
    tinhthanh.addEventListener('change', loadDistricts);
    const quanhuyen = document.getElementById('quanhuyen');
    if (quanhuyen) quanhuyen.addEventListener('change', loadWards);
  }
});

// Export functions
window.addToCart = addToCart;
window.getCart = getCart;


// Lấy dữ liệu từ localStorage
document.addEventListener('DOMContentLoaded', () => {
  const couponInput = document.getElementById('coupon-code');
  const datalist = document.getElementById('saved-coupons');
  if (couponInput && datalist) {
    couponInput.addEventListener('focus', () => {
      const savedVouchers = JSON.parse(localStorage.getItem('savedVouchers') || '[]');

      // Xoá option cũ
      datalist.innerHTML = '';

      // Thêm option mới
      savedVouchers.forEach(code => {
        const option = document.createElement('option');
        option.value = code;
        datalist.appendChild(option);
      });
    });
  }
});

