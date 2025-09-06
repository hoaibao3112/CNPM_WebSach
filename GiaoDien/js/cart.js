// Utility function to format price
function formatPrice(price) {
  return new Intl.NumberFormat('vi-VN').format(price) + 'đ';
}

// Get cart from localStorage
function getCart() {
  const cart = localStorage.getItem('cart');
  return cart ? JSON.parse(cart) : [];
}

// Save cart to localStorage
function saveCart(cart) {
  localStorage.setItem('cart', JSON.stringify(cart));
}

// Render cart items
function renderCart() {
  const cart = getCart();
  const cartItemsBody = document.getElementById('cart-items-body');
  const emptyCartMessage = document.getElementById('empty-cart');
  
  cartItemsBody.innerHTML = '';
  
  if (cart.length === 0) {
    emptyCartMessage.style.display = 'block';
    updateSummary(0);
    return;
  }
  
  emptyCartMessage.style.display = 'none';
  
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
          <img src="img/product/${item.image}" alt="${item.name}" class="product-img">
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
      <td>
        <button class="remove-btn" data-index="${index}">
          <i class="fas fa-trash"></i>
        </button>
      </td>
    `;
    
    cartItemsBody.appendChild(row);
  });
  
  updateSummary(subtotal);
  attachEventListeners();
}

// Update order summary
function updateSummary(subtotal, discount = 0) {
  const total = Math.max(0, subtotal - discount);
  
  document.getElementById('subtotal').textContent = formatPrice(subtotal);
  document.getElementById('discount-row').style.display = discount > 0 ? 'flex' : 'none';
  if (discount > 0) {
    document.getElementById('discount').textContent = `-${formatPrice(discount)}`;
  }
  document.getElementById('total').textContent = formatPrice(total);
}

// Show success alert
function showSuccessAlert(message) {
  const alertDiv = document.createElement('div');
  alertDiv.className = 'order-success-alert';
  alertDiv.innerHTML = `<i class="fas fa-check-circle"></i><span>${message}</span>`;
  document.body.appendChild(alertDiv);
  setTimeout(() => alertDiv.remove(), 3000);
}

// Show VNPay modal
function showVNPayModal(paymentUrl, orderId) {
  const modal = document.getElementById('vnpay-qr-modal');
  const qrImage = document.getElementById('vnpay-qr-image');
  const cancelBtn = document.getElementById('vnpay-cancel-btn');
  const qrContainer = qrImage.parentElement;

  // Xóa link thanh toán trước đó nếu có
  const existingLink = qrContainer.querySelector('a');
  if (existingLink) existingLink.remove();

  // Ẩn hình ảnh QR và hiển thị thông báo
  qrImage.style.display = 'none';
  qrContainer.innerHTML += '<p>Thanh toán qua VNPay bằng cách nhấp vào link bên dưới.</p>';

  modal.style.display = 'block';

  // Thêm link thanh toán
  const paymentLink = document.createElement('a');
  paymentLink.href = paymentUrl;
  paymentLink.textContent = 'Nhấp vào đây để thanh toán trực tiếp';
  paymentLink.style.display = 'block';
  paymentLink.style.marginTop = '10px';
  qrContainer.appendChild(paymentLink);

  // Đóng modal khi nhấn Hủy
  cancelBtn.onclick = () => {
    modal.style.display = 'none';
  };
}

// Checkout process
async function checkout() {
  const cart = getCart();
  const selectedItems = cart.filter(item => item.selected);

  if (selectedItems.length === 0) {
    alert('Vui lòng chọn ít nhất một sản phẩm để thanh toán!');
    return;
  }

  const customerId = localStorage.getItem('customerId');
  if (!customerId) {
    alert('Vui lòng đăng nhập để đặt hàng!');
    window.location.href = 'login.html';
    return;
  }

  const name = document.getElementById('name').value.trim();
  const phone = document.getElementById('phone').value.trim();
  const email = document.getElementById('email').value.trim();
  const addressDetail = document.getElementById('diachichitiet').value.trim();
  const province = document.getElementById('tinhthanh').value;
  const district = document.getElementById('quanhuyen').value;
  const ward = document.getElementById('phuongxa').value;
  const paymentMethod = document.getElementById('payment-method').value;
  const saveInfo = document.getElementById('save-info').checked;

  if (!name || !phone || !email || !addressDetail || !province || !district || !ward || !paymentMethod) {
    alert('Vui lòng điền đầy đủ thông tin khách hàng và địa chỉ!');
    return;
  }

  if (!/^\d{10,11}$/.test(phone)) {
    alert('Số điện thoại không hợp lệ! Vui lòng nhập số điện thoại 10-11 chữ số.');
    return;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    alert('Email không hợp lệ! Vui lòng nhập đúng định dạng email.');
    return;
  }

  const checkoutBtn = document.getElementById('checkout-btn');
  checkoutBtn.disabled = true;
  checkoutBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang xử lý...';

  try {
    const orderData = {
      customer: { makh: customerId, name, phone, email, saveInfo },
      items: selectedItems.map(item => ({
        productId: item.id,
        price: item.price,
        quantity: item.quantity
      })),
      shippingAddress: {
        province: document.getElementById('tinhthanh').selectedOptions[0].text,
        district: document.getElementById('quanhuyen').selectedOptions[0].text,
        ward: document.getElementById('phuongxa').selectedOptions[0].text,
        detail: addressDetail
      },
      paymentMethod,
      notes: document.getElementById('notes').value.trim()
    };

    const response = await fetch('http://localhost:5000/api/orders/place-order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(orderData)
    });

    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Lỗi không xác định từ server');

    if (paymentMethod === 'VNPay' && result.paymentUrl) {
      showVNPayModal(result.paymentUrl, result.orderId);
      return; // Chờ khách hàng thanh toán qua link
    }

    showSuccessAlert('Đặt hàng thành công!');
    showOrderConfirmation({
      orderId: result.orderId,
      paymentMethod: orderData.paymentMethod,
      shippingAddress: orderData.shippingAddress,
      paymentStatus: result.paymentStatus || 'Chưa thanh toán'
    });

    saveCart(cart.filter(item => !item.selected));
    renderCart();
  } catch (error) {
    console.error('Lỗi khi đặt hàng:', error);
    alert(`Đã xảy ra lỗi: ${error.message}`);
  } finally {
    checkoutBtn.disabled = false;
    checkoutBtn.innerHTML = 'TIẾN HÀNH THANH TOÁN';
  }
}

// Attach event listeners
function attachEventListeners() {
  const cartItemsBody = document.getElementById('cart-items-body');
  const newCartItemsBody = cartItemsBody.cloneNode(true);
  cartItemsBody.parentNode.replaceChild(newCartItemsBody, cartItemsBody);

  document.querySelectorAll('.select-item').forEach(checkbox => {
    checkbox.addEventListener('change', function() {
      const index = parseInt(this.dataset.index);
      const cart = getCart();
      cart[index].selected = this.checked;
      saveCart(cart);
      renderCart();
    });
  });

  document.querySelectorAll('.qty-btn.minus').forEach(btn => {
    btn.addEventListener('click', () => updateQuantity(parseInt(btn.dataset.index), -1));
  });

  document.querySelectorAll('.qty-btn.plus').forEach(btn => {
    btn.addEventListener('click', () => updateQuantity(parseInt(btn.dataset.index), 1));
  });

  document.querySelectorAll('.qty-input').forEach(input => {
    input.addEventListener('change', function() {
      const index = parseInt(this.dataset.index);
      const newQuantity = parseInt(this.value);
      if (isNaN(newQuantity) || newQuantity < 1) {
        this.value = 1;
        updateQuantity(index, 0, 1);
      } else {
        updateQuantity(index, 0, newQuantity);
      }
    });
  });

  document.querySelectorAll('.remove-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const index = parseInt(this.dataset.index);
      const cart = getCart();
      cart.splice(index, 1);
      saveCart(cart);
      renderCart();
    });
  });
}

// Update quantity
function updateQuantity(index, change, newQuantity = null) {
  const cart = getCart();
  if (newQuantity !== null) {
    cart[index].quantity = newQuantity;
  } else {
    cart[index].quantity = Math.max(1, cart[index].quantity + change);
  }
  saveCart(cart);
  renderCart();
}

// Show order confirmation
function showOrderConfirmation(data) {
  const modal = document.getElementById('order-confirm-modal');
  const content = `
    <h3>Đặt hàng thành công!</h3>
    <p><strong>Mã đơn hàng:</strong> ${data.orderId}</p>
    <p><strong>Phương thức thanh toán:</strong> ${getPaymentMethodName(data.paymentMethod)}</p>
    <p><strong>Địa chỉ giao hàng:</strong> ${data.shippingAddress.detail}, ${data.shippingAddress.ward}, ${data.shippingAddress.district}, ${data.shippingAddress.province}</p>
    <p><strong>Trạng thái thanh toán:</strong> ${data.paymentStatus}</p>
  `;
  modal.querySelector('.modal-content').innerHTML = content;
  modal.style.display = 'block';
}

// Get payment method name
function getPaymentMethodName(method) {
  const methods = {
    'COD': 'Thanh toán khi nhận hàng',
    'VNPay': 'Chuyển khoản Ví VNPAY',
    'MOMO': 'Ví điện tử MoMo'
  };
  return methods[method] || method;
}

// Load provinces data
async function loadProvinces() {
  try {
    const response = await fetch('https://provinces.open-api.vn/api/');
    const provinces = await response.json();
    
    const provinceSelect = document.getElementById('tinhthanh');
    provinceSelect.innerHTML = '<option value="">-- Chọn Tỉnh/TP --</option>';
    
    provinces.forEach(province => {
      const option = document.createElement('option');
      option.value = province.code;
      option.textContent = province.name;
      provinceSelect.appendChild(option);
    });
  } catch (error) {
    console.error('Lỗi khi lấy tỉnh/thành:', error);
    document.getElementById('tinhthanh').innerHTML = '<option value="">Không tải được dữ liệu</option>';
  }
}

// Load districts when province changes
async function loadDistricts() {
  const provinceSelect = document.getElementById('tinhthanh');
  const districtSelect = document.getElementById('quanhuyen');
  const wardSelect = document.getElementById('phuongxa');
  
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
    console.error('Lỗi khi lấy quận/huyện:', error);
    districtSelect.innerHTML = '<option value="">Không tải được dữ liệu</option>';
  }
}

// Load wards when district changes
async function loadWards() {
  const districtSelect = document.getElementById('quanhuyen');
  const wardSelect = document.getElementById('phuongxa');
  
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
    console.error('Lỗi khi lấy phường/xã:', error);
    wardSelect.innerHTML = '<option value="">Không tải được dữ liệu</option>';
  }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
  const cart = getCart();
  cart.forEach(item => {
    if (!('selected' in item)) item.selected = true;
  });
  saveCart(cart);
  
  renderCart();
  loadProvinces();

  document.getElementById('tinhthanh').addEventListener('change', loadDistricts);
  document.getElementById('quanhuyen').addEventListener('change', loadWards);

  // Gắn sự kiện cho nút thanh toán
  document.getElementById('checkout-btn').addEventListener('click', checkout);
});