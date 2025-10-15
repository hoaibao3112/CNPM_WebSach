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
        // ✅ COD SUCCESS - REDIRECT ĐÚNG (dùng giá trị server trả về)
        console.log('✅ COD Order successful:', result.orderId);
        showToast('Đặt hàng COD thành công!');
        await clearCart();

        // Prefer server-authoritative amountAfterDiscount if provided
        const serverAmount = typeof result.amountAfterDiscount !== 'undefined' ? Number(result.amountAfterDiscount) : (orderData.totalAmountDiscouted || selectedItems.reduce((sum, item) => sum + item.price * item.quantity, 0));
        window.location.href = `order-confirmation.html?orderId=${result.orderId}&status=cod&paymentMethod=COD&amount=${serverAmount}&discount=${result.discountAmount || 0}&appliedTier=${encodeURIComponent(result.appliedTier || '')}&message=${encodeURIComponent(result.message || 'Đặt hàng COD thành công')}`;
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
  // Always load provinces first so selects are ready
  const tinhthanh = document.getElementById('tinhthanh');
  if (tinhthanh) {
    await loadProvinces();
    tinhthanh.addEventListener('change', loadDistricts);
    const quanhuyen = document.getElementById('quanhuyen');
    if (quanhuyen) quanhuyen.addEventListener('change', loadWards);
  }

  if (isLoggedIn()) {
    await syncLocalCartToServer();
    // Load saved addresses from backend for logged-in users (provinces already loaded)
    try { await loadSavedAddresses(); } catch (e) { console.warn('loadSavedAddresses failed', e); }
  }

  await renderCart();
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

// Load saved addresses from backend for logged-in customers
async function loadSavedAddresses() {
  if (!isLoggedIn()) return;
  const customerId = getUserId();
  if (!customerId) return;

  try {
    const res = await fetch(`http://localhost:5000/api/orders/customer-addresses/${customerId}`, {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    const data = await res.json();
    if (!res.ok) {
      console.warn('Failed to load saved addresses', data);
      return;
    }

    // data may be { success: true, data: [...] } or an array directly
    const list = Array.isArray(data) ? data : (data.data || []);
    if (!list || list.length === 0) return;

    const select = document.getElementById('saved-addresses');
    if (!select) return;

    // Clear existing options except placeholder
    select.innerHTML = '<option value="">-- Chọn địa chỉ đã lưu --</option>';

    list.forEach(addr => {
      // Normalize fields: prefer explicit keys if present
      const option = document.createElement('option');
      // store minimal JSON as value so we can repopulate fields easily
      const payload = {
        id: addr.MaDiaChi || addr.id || addr.addressId || null,
        name: addr.TenNguoiNhan || addr.recipientName || addr.name || '',
        phone: addr.SDT || addr.recipientPhone || addr.phone || '',
        detail: addr.DiaChiChiTiet || addr.detail || addr.address || '',
        province: addr.TinhThanh || addr.province || addr.provinceCode || addr.provinceName || '',
        district: addr.QuanHuyen || addr.district || addr.districtCode || addr.districtName || '',
        ward: addr.PhuongXa || addr.ward || addr.wardCode || addr.wardName || ''
      };
      option.value = JSON.stringify(payload);
      option.textContent = `${payload.detail || ''}${payload.ward ? ', ' + payload.ward : ''}${payload.district ? ', ' + payload.district : ''}${payload.province ? ', ' + payload.province : ''}`;
      select.appendChild(option);
    });

    // helper: wait until a select has at least minOptions (used to wait for districts/wards to populate)
    function waitForOptions(selectEl, minOptions = 2, timeout = 3000) {
      return new Promise((resolve) => {
        const start = Date.now();
        (function poll() {
          if (!selectEl) return resolve(false);
          if (selectEl.options.length >= minOptions) return resolve(true);
          if (Date.now() - start > timeout) return resolve(false);
          setTimeout(poll, 100);
        })();
      });
    }

    // Dispatch custom events instead of filling the form here.
    // The map/address handler (inside setupCartMap) will listen and perform the fill + auto-find.
    select.addEventListener('change', () => {
      if (!select.value) {
        document.dispatchEvent(new CustomEvent('savedAddressCleared'));
        return;
      }
      try {
        const addr = JSON.parse(select.value);
        document.dispatchEvent(new CustomEvent('savedAddressSelected', { detail: addr }));
      } catch (e) {
        console.warn('Invalid saved address payload', e);
      }
    });

  } catch (err) {
    console.error('Lỗi tải địa chỉ cũ:', err);
  }
}

/* ================= Map (Leaflet + Nominatim + OSRM) for cart page ================= */
(function setupCartMap() {
  // Default shop coordinates (change if needed)
  const SHOP = { lat: 10.7769, lon: 106.7009 };

  let map = null;
  let markersLayer = null;
  let routeLayer = null;

  function initLeaflet() {
    if (!document.getElementById('map')) return;
    if (map) return;
    if (!window.L) {
      console.warn('Leaflet not loaded yet');
      return;
    }

    map = L.map('map').setView([SHOP.lat, SHOP.lon], 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    markersLayer = L.layerGroup().addTo(map);
    routeLayer = L.layerGroup().addTo(map);

    // show shop marker
    L.marker([SHOP.lat, SHOP.lon]).addTo(markersLayer).bindPopup('Kho hàng');

    // Fix rendering when map container size is determined after scripts run
    // Call invalidateSize a few times to handle async layout changes (header injection, flex layout, etc.)
    try {
      setTimeout(() => map.invalidateSize(), 0);
      setTimeout(() => map.invalidateSize(), 200);
      setTimeout(() => map.invalidateSize(), 600);
    } catch (e) {
      console.warn('Error invalidating Leaflet size', e);
    }

    // Keep map consistent on window resize
    window.addEventListener('resize', () => { if (map) map.invalidateSize(); });
  }

  async function geocode(address) {
    const q = encodeURIComponent(address);
    const url = `https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1`;
    try {
      const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
      if (!res.ok) throw new Error('Geocode fetch failed');
      const arr = await res.json();
      if (!arr || arr.length === 0) return null;
      return { lat: parseFloat(arr[0].lat), lon: parseFloat(arr[0].lon), display_name: arr[0].display_name };
    } catch (err) {
      console.error('Geocode error', err);
      return null;
    }
  }

  async function drawRoute(from, to) {
    if (!map) initLeaflet();
    if (!map) return;

    // clear previous
    routeLayer.clearLayers();
    markersLayer.clearLayers();

    // markers
    L.marker([from.lat, from.lon]).addTo(markersLayer).bindPopup('Kho hàng');
    L.marker([to.lat, to.lon]).addTo(markersLayer).bindPopup('Địa chỉ giao hàng');

    const coords = `${from.lon},${from.lat};${to.lon},${to.lat}`;
    const url = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`;
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error('Routing fetch failed');
      const data = await res.json();
      if (!data.routes || data.routes.length === 0) {
        console.warn('No route found');
        return;
      }
      const routeGeo = data.routes[0].geometry;
      const line = L.geoJSON(routeGeo, { style: { color: '#007bff', weight: 4 } });
  routeLayer.addLayer(line);
  map.fitBounds(line.getBounds(), { padding: [20, 20] });

  // Ensure tiles redraw after fitting bounds
  try { setTimeout(() => map.invalidateSize(), 100); } catch (e) {}

      // update distance/duration
      const distKm = (data.routes[0].distance / 1000).toFixed(2);
      const durMin = Math.round(data.routes[0].duration / 60);
      const distEl = document.getElementById('distance');
      const durEl = document.getElementById('duration');
      if (distEl) distEl.textContent = `${distKm} km`;
      if (durEl) durEl.textContent = `${durMin} phút`;
      // Start vehicle animation along the route (loop)
      try {
        const latlngs = geoToLatLngs(routeGeo);
        startVehicleAnimation(latlngs);
      } catch (e) { console.warn('vehicle animation error', e); }
    } catch (err) {
      console.error('drawRoute error', err);
    }
  }

  function geoToLatLngs(geo) {
    if (!geo) return [];
    if (geo.type === 'LineString') return geo.coordinates.map(c => ({ lat: c[1], lon: c[0] }));
    if (geo.type === 'MultiLineString') return geo.coordinates[0].map(c => ({ lat: c[1], lon: c[0] }));
    return [];
  }

  let vehicleMarker = null;
  let vehicleAnim = null;

  // animate a marker along latlngs (array of {lat, lon}), loops
  function startVehicleAnimation(latlngs, speedKmH = 25) {
    stopVehicleAnimation();
    if (!latlngs || latlngs.length < 2 || !map) return;

    const iconHtml = `
      <div class="car-icon vehicle-marker">
        <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 44 L52 44 L58 36 L54 26 L10 26 L6 36 Z" fill="#007bff" stroke="#004a99" stroke-width="1"/>
          <circle cx="20" cy="48" r="4" fill="#222"/>
          <circle cx="44" cy="48" r="4" fill="#222"/>
        </svg>
      </div>`;
    const carIcon = L.divIcon({ html: iconHtml, className: '', iconSize: [36, 36], iconAnchor: [18, 18] });
    vehicleMarker = L.marker([latlngs[0].lat, latlngs[0].lon], { icon: carIcon, interactive: false }).addTo(map);

    const speedMps = (speedKmH * 1000) / 3600; // meters per second

    let i = 0;
    let t = 0; // progress 0..1 between latlngs[i] and latlngs[i+1]

    function step() {
      if (!vehicleMarker) return;
      const a = latlngs[i];
      const b = latlngs[(i + 1) % latlngs.length];
      const dist = haversineDistance(a, b) * 1000; // in meters
      const duration = Math.max(dist / speedMps, 0.001); // seconds
      // increment t proportional to frame time; approximate using fixed step
      t += 0.016 / duration; // assuming ~60fps
      if (t >= 1) { t = 0; i = (i + 1) % latlngs.length; }
      const lat = a.lat + (b.lat - a.lat) * t;
      const lon = a.lon + (b.lon - a.lon) * t;
      vehicleMarker.setLatLng([lat, lon]);
      vehicleAnim = requestAnimationFrame(step);
    }

    vehicleAnim = requestAnimationFrame(step);
  }

  function stopVehicleAnimation() {
    try { if (vehicleAnim) cancelAnimationFrame(vehicleAnim); } catch (e) {}
    vehicleAnim = null;
    if (vehicleMarker) { try { map.removeLayer(vehicleMarker); } catch (e) {} vehicleMarker = null; }
  }

  // Haversine distance (km)
  function haversineDistance(a, b) {
    const R = 6371; // km
    const dLat = (b.lat - a.lat) * Math.PI / 180;
    const dLon = (b.lon - a.lon) * Math.PI / 180;
    const lat1 = a.lat * Math.PI / 180;
    const lat2 = b.lat * Math.PI / 180;
    const sinDLat = Math.sin(dLat / 2);
    const sinDLon = Math.sin(dLon / 2);
    const aa = sinDLat * sinDLat + sinDLon * sinDLon * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(aa), Math.sqrt(1 - aa));
    return R * c;
  }

  function buildAddressFromForm() {
    const detail = document.getElementById('diachichitiet')?.value?.trim() || '';
    const ward = document.getElementById('phuongxa');
    const district = document.getElementById('quanhuyen');
    const province = document.getElementById('tinhthanh');

    function selText(sel) {
      if (!sel || !sel.options) return '';
      const opt = sel.options[sel.selectedIndex];
      if (!opt || !opt.value) return '';
      return opt.text;
    }

    const parts = [];
    if (detail) parts.push(detail);
    const wardText = selText(ward); if (wardText) parts.push(wardText);
    const districtText = selText(district); if (districtText) parts.push(districtText);
    const provinceText = selText(province); if (provinceText) parts.push(provinceText);
    return parts.join(', ');
  }

  async function onFindClick(e) {
    e && e.preventDefault();
    const address = buildAddressFromForm();
    if (!address) return;
    const geo = await geocode(address);
    if (!geo) {
      console.warn('Không tìm thấy địa chỉ hoặc địa chỉ chưa đầy đủ:', address);
      return;
    }
    await drawRoute(SHOP, { lat: geo.lat, lon: geo.lon });
  }

  function onDeleteClick(e) {
    e && e.preventDefault();
    if (routeLayer) routeLayer.clearLayers();
    if (markersLayer) markersLayer.clearLayers();
    const distEl = document.getElementById('distance'); if (distEl) distEl.textContent = '0 km';
    const durEl = document.getElementById('duration'); if (durEl) durEl.textContent = '0 phút';
    if (map) map.setView([SHOP.lat, SHOP.lon], 12);
  }

  // Wait for DOMContentLoaded then ensure Leaflet is present and init
  document.addEventListener('DOMContentLoaded', () => {
    // if Leaflet already present, init immediately; otherwise wait a short time
    if (window.L) initLeaflet();
    else {
      let waited = 0;
      const intv = setInterval(() => {
        if (window.L) { clearInterval(intv); initLeaflet(); }
        waited += 100;
        if (waited > 3000) { clearInterval(intv); console.warn('Leaflet did not load in time'); }
      }, 100);
    }

    // Remove manual Find/Delete buttons from UI - we'll auto-run find when a saved address is selected
    const findBtn = document.getElementById('input_button');
    const delBtn = document.getElementById('delete_button');
    try { if (findBtn) findBtn.remove(); } catch (e) {}
    try { if (delBtn) delBtn.remove(); } catch (e) {}

    // helper for waiting for options population
    function waitForOptions(selectEl, minOptions = 2, timeout = 3000) {
      return new Promise((resolve) => {
        const start = Date.now();
        (function poll() {
          if (!selectEl) return resolve(false);
          if (selectEl.options.length >= minOptions) return resolve(true);
          if (Date.now() - start > timeout) return resolve(false);
          setTimeout(poll, 100);
        })();
      });
    }

    // When a saved address is selected elsewhere, auto-fill fields and run find
    document.addEventListener('savedAddressSelected', async (ev) => {
      const addr = (ev && ev.detail) ? ev.detail : null;
      if (!addr) return;
      // Fill basic fields
      document.getElementById('name').value = addr.name || '';
      document.getElementById('phone').value = addr.phone || '';
      document.getElementById('diachichitiet').value = addr.detail || '';

      const tinh = document.getElementById('tinhthanh');
      const quan = document.getElementById('quanhuyen');
      const phuong = document.getElementById('phuongxa');

      // Try to select province by value or text
      if (tinh) {
        let found = false;
        for (let i = 0; i < tinh.options.length; i++) {
          const opt = tinh.options[i];
          if (String(opt.value).trim() === String(addr.province).trim() || opt.text.trim() === String(addr.province).trim()) {
            tinh.selectedIndex = i;
            tinh.dispatchEvent(new Event('change'));
            found = true;
            break;
          }
        }

        if (found && quan) {
          await waitForOptions(quan, 2, 3000);
          for (let i = 0; i < quan.options.length; i++) {
            const opt = quan.options[i];
            if (String(opt.value).trim() === String(addr.district).trim() || opt.text.trim() === String(addr.district).trim()) {
              quan.selectedIndex = i;
              quan.dispatchEvent(new Event('change'));
              break;
            }
          }
        } else {
          // fallback: set by text
          setSelectByText('tinhthanh', addr.province);
        }
      }

      if (phuong) {
        await waitForOptions(phuong, 2, 3000);
        for (let i = 0; i < phuong.options.length; i++) {
          const opt = phuong.options[i];
          if (String(opt.value).trim() === String(addr.ward).trim() || opt.text.trim() === String(addr.ward).trim()) {
            phuong.selectedIndex = i;
            phuong.dispatchEvent(new Event('change'));
            break;
          }
        }
      }

      // Auto-run find to show route on map
      try { await onFindClick(); } catch (e) { console.warn('auto find failed', e); }
    });

    // If cleared, clear map/route
    document.addEventListener('savedAddressCleared', () => { onDeleteClick(); });

    // 🔽 AUTO ROUTE…

    // Debounce helper
    function debounce(fn, wait = 700) {
      let t;
      return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), wait); };
    }

    // Lấy các field địa chỉ
    const detailInput = document.getElementById('diachichitiet');
    const tinhSel = document.getElementById('tinhthanh');
    const quanSel = document.getElementById('quanhuyen');
    const phuongSel = document.getElementById('phuongxa');

    // Chỉ auto vẽ khi form có ít nhất địa chỉ chi tiết (để geocode được, dù không đầy đủ)
    async function autoRouteIfComplete() {
      const address = buildAddressFromForm();
      if (!address || !detailInput || !detailInput.value.trim()) return;

      try {
        await onFindClick(); // dùng sẵn hàm đã có: buildAddressFromForm -> geocode -> drawRoute
      } catch (e) {
        console.warn('autoRouteIfComplete error', e);
      }
    }

    const autoRouteDebounced = debounce(autoRouteIfComplete, 800);

    // 🔽 AUTO ROUTE khi người dùng nhập/chọn địa chỉ
    if (detailInput) {
      // Khi người dùng dừng gõ hoặc rời ô
      detailInput.addEventListener('input', autoRouteDebounced);
      detailInput.addEventListener('blur', autoRouteDebounced);
    }
    if (tinhSel) {
      tinhSel.addEventListener('change', autoRouteDebounced);
    }
    if (quanSel) {
      quanSel.addEventListener('change', autoRouteDebounced);
    }
    if (phuongSel) {
      phuongSel.addEventListener('change', autoRouteDebounced);
    }

    // 🔽 AUTO ROUTE khi "pull dữ liệu lên" (load trang xong mà form đã đủ)
    setTimeout(autoRouteIfComplete, 500);

  });
})();