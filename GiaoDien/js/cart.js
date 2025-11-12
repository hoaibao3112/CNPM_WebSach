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
    // Không phải trang cart, bỏ qua
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

  // Tính phí ship nếu đã chọn địa chỉ
  let shippingFee = 0;
  let shippingInfo = null;
  const provinceSelect = document.getElementById('tinhthanh');
  if (provinceSelect && provinceSelect.value) {
    const selectedOption = provinceSelect.options[provinceSelect.selectedIndex];
    const provinceName = selectedOption.dataset.provinceName || selectedOption.textContent;
    const totalWeight = await getTotalWeight();
    const customerTier = getCustomerTier();
    // ✅ FIX: calculateShippingFee trả về object, lấy .final cho shippingFee
    shippingInfo = calculateShippingFee(provinceName, totalWeight, customerTier);
    shippingFee = shippingInfo.final;
    window.currentShippingFee = shippingFee;
  }

  // ✅ FIX: Sử dụng appliedDiscountAmount thay vì hardcode 0
  // ✅ FIX: Nếu có appliedFreeShipCode, shippingFee = 0 và shippingInfo = null
  if (appliedFreeShipCode) {
    shippingFee = 0;
    shippingInfo = null;
  }
  
  updateSummary(subtotal, appliedDiscountAmount, shippingFee, shippingInfo);
  attachEventListeners();
  updateCartCount();
  // Emit custom event so other scripts can react (e.g., auto checkout after reorder)
  try { window.dispatchEvent(new CustomEvent('cart:rendered', { detail: { subtotal } })); } catch (e) { /* ignore */ }
}

// Prefill checkout form when redirected from reorder
window.addEventListener('cart:rendered', () => {
  try {
    const raw = localStorage.getItem('reorder_address');
    if (!raw) return;
    const addr = JSON.parse(raw || '{}');

    if (addr.tenkh) {
      const el = document.getElementById('name');
      if (el) el.value = addr.tenkh;
    }
    if (addr.sdt) {
      const el = document.getElementById('phone');
      if (el) el.value = addr.sdt;
    }
    if (addr.email) {
      const el = document.getElementById('email');
      if (el) el.value = addr.email;
    }
    if (addr.tinhthanh) {
      const el = document.getElementById('tinhthanh');
      if (el) el.value = addr.tinhthanh;
    }
    // Trigger change to load districts (if function exists)
    const prov = document.getElementById('tinhthanh');
    if (prov && typeof prov.dispatchEvent === 'function') {
      prov.dispatchEvent(new Event('change'));
    }
    // Delay filling district/ward until they are loaded
    setTimeout(() => {
      if (addr.quanhuyen) {
        const el = document.getElementById('quanhuyen');
        if (el) el.value = addr.quanhuyen;
      }
      if (addr.phuongxa) {
        const el = document.getElementById('phuongxa');
        if (el) el.value = addr.phuongxa;
      }
      if (addr.diachi) {
        const el = document.getElementById('diachichitiet');
        if (el) el.value = addr.diachi;
      }
    }, 700);

    // Remove saved reorder address to avoid reusing it later
    localStorage.removeItem('reorder_address');
  } catch (e) { console.warn('Failed to prefill reorder address', e); }
});

// 🚢 Tính phí ship dựa trên địa chỉ và tier khách hàng
function calculateShippingFee(province, totalWeight, customerTier = 'Đồng') {
  // Chuẩn hóa tên tỉnh/thành
  const provinceLower = (province || '').toLowerCase().trim();
  
  // Kiểm tra nội thành TP.HCM - FREE SHIP
  const isHCM = provinceLower.includes('hồ chí minh') || 
                provinceLower.includes('ho chi minh') ||
                provinceLower.includes('hcm') ||
                provinceLower.includes('tp.hcm') ||
                provinceLower.includes('tphcm') ||
                provinceLower === '79'; // Mã tỉnh TP.HCM

  if (isHCM) {
    console.log('📍 Nội thành TP.HCM -> FREE SHIP');
    return { original: 0, final: 0, discount: 0, tierDiscount: 0 };
  }

  // Ngoài TP.HCM: 15,000 VND / 500g
  const weight500gUnits = Math.ceil((totalWeight || 0) / 500);
  const originalFee = weight500gUnits * 15000;

  console.log(`📦 Tổng trọng lượng: ${totalWeight}g`);
  console.log(`📦 Số đơn vị 500g: ${weight500gUnits}`);
  console.log(`💰 Phí ship gốc: ${originalFee.toLocaleString('vi-VN')} VND`);

  // Áp dụng giảm giá theo tier
  let tierDiscount = 0;
  switch (customerTier) {
    case 'Bạc':
      tierDiscount = 0.20; // Giảm 20%
      break;
    case 'Vàng':
      tierDiscount = 0.50; // Giảm 50%
      break;
    default:
      tierDiscount = 0; // Đồng: không giảm
  }

  let finalFee = originalFee;
  let discountAmount = 0;
  
  if (tierDiscount > 0) {
    discountAmount = Math.round(originalFee * tierDiscount);
    finalFee = originalFee - discountAmount;
    console.log(`🎁 Tier ${customerTier} giảm ${tierDiscount * 100}%: -${discountAmount.toLocaleString('vi-VN')} VND`);
  }

  console.log(`✅ Phí ship cuối cùng: ${finalFee.toLocaleString('vi-VN')} VND`);
  
  return {
    original: Math.round(originalFee),
    final: Math.round(finalFee),
    discount: Math.round(discountAmount),
    tierDiscount: tierDiscount
  };
}

// Lấy tổng trọng lượng giỏ hàng
async function getTotalWeight() {
  const cart = await getCart();
  const selectedItems = cart.filter(item => item.selected);
  
  // Mặc định nếu không có trọng lượng, giả định mỗi sản phẩm 300g
  const totalWeight = selectedItems.reduce((sum, item) => {
    const weight = item.weight || 300; // Default 300g nếu không có
    return sum + (weight * item.quantity);
  }, 0);
  
  return totalWeight;
}

// Lấy tier khách hàng
function getCustomerTier() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  return user.loyalty_tier || 'Đồng';
}

// Update order summary với phí ship
function updateSummary(subtotal, discount = 0, shippingFee = 0, shippingInfo = null) {
  console.log('🧮 updateSummary called with:', {
    subtotal: subtotal,
    subtotalType: typeof subtotal,
    discount: discount,
    discountType: typeof discount,
    shippingFee: shippingFee,
    shippingFeeType: typeof shippingFee,
    shippingInfo: shippingInfo
  });
  
  // ✅ DEBUG: In ra stack trace để biết ai gọi hàm này
  console.trace('📍 updateSummary called from:');
  
  // ✅ GUARD: Nếu có appliedDiscountAmount > 0 nhưng discount parameter = 0, 
  // thì dùng appliedDiscountAmount thay vì 0
  if (appliedDiscountAmount > 0 && (!discount || discount === 0)) {
    console.warn('⚠️ updateSummary received discount=0 but appliedDiscountAmount=' + appliedDiscountAmount);
    console.warn('⚠️ Using appliedDiscountAmount instead!');
    discount = appliedDiscountAmount;
  }
  
  // ✅ Convert to numbers to avoid NaN
  const cleanSubtotal = parseFloat(subtotal) || 0;
  const cleanDiscount = parseFloat(discount) || 0;
  const cleanShippingFee = parseFloat(shippingFee) || 0;
  
  const total = Math.max(0, cleanSubtotal - cleanDiscount + cleanShippingFee);
  
  console.log('🧮 Calculated values:', {
    cleanSubtotal,
    cleanDiscount,
    cleanShippingFee,
    total
  });
  
  const subtotalElement = document.getElementById('subtotal');
  const discountRow = document.getElementById('discount-row');
  const discountElement = document.getElementById('discount');
  const shippingElement = document.getElementById('shipping');
  const totalElement = document.getElementById('total');
  
  // Elements cho thông tin thẻ và giảm giá ship
  const memberTierRow = document.getElementById('member-tier-row');
  const memberTierValue = document.getElementById('member-tier-value');
  const shippingOriginalRow = document.getElementById('shipping-original-row');
  const shippingOriginalElement = document.getElementById('shipping-original');
  const shippingDiscountRow = document.getElementById('shipping-discount-row');
  const shippingDiscountLabel = document.getElementById('shipping-discount-label');
  const shippingDiscountElement = document.getElementById('shipping-discount');

  if (!subtotalElement || !discountRow || !discountElement || !shippingElement || !totalElement) {
    console.error('Missing summary elements');
    return;
  }

  subtotalElement.textContent = formatPrice(cleanSubtotal);
  discountRow.style.display = cleanDiscount > 0 ? 'flex' : 'none';
  discountElement.textContent = cleanDiscount > 0 ? `-${formatPrice(cleanDiscount)}` : '-0đ';
  
  // Lấy thông tin tier của khách hàng
  const customerTier = getCustomerTier();
  const tierInfo = {
    'Đồng': { name: 'Thẻ Đồng', discount: 0, color: '#cd7f32' },
    'Bạc': { name: 'Thẻ Bạc', discount: 0.2, color: '#C0C0C0' },
    'Vàng': { name: 'Thẻ Vàng', discount: 0.5, color: '#FFD700' }
  };
  
  const currentTier = tierInfo[customerTier] || tierInfo['Đồng'];
  
  // ✅ CHỈ HIỂN THỊ THÔNG TIN THẺ VÀ GIẢM SHIP KHI KHÔNG CÓ FREE SHIP
  const hasFreeShip = appliedFreeShipCode !== null;
  
  if (!hasFreeShip && shippingInfo && shippingInfo.discount > 0) {
    // Hiển thị thông tin thẻ hội viên
    if (memberTierRow && memberTierValue) {
      memberTierRow.style.display = 'flex';
      memberTierValue.textContent = currentTier.name;
      memberTierValue.style.color = currentTier.color;
      memberTierValue.style.fontWeight = 'bold';
    }
    
    // Hiển thị phí ship gốc
    if (shippingOriginalRow && shippingOriginalElement) {
      shippingOriginalRow.style.display = 'flex';
      shippingOriginalElement.textContent = formatPrice(shippingInfo.original);
    }
    
    // Hiển thị giảm giá ship
    if (shippingDiscountRow && shippingDiscountLabel && shippingDiscountElement) {
      shippingDiscountRow.style.display = 'flex';
      shippingDiscountLabel.textContent = `Giảm giá ship (${Math.round(shippingInfo.tierDiscount * 100)}%)`;
      shippingDiscountElement.textContent = `-${formatPrice(shippingInfo.discount)}`;
    }
  } else {
    // ẨN thông tin thẻ và giảm ship (khi có Free Ship hoặc không có giảm giá)
    if (memberTierRow) memberTierRow.style.display = 'none';
    if (shippingOriginalRow) shippingOriginalRow.style.display = 'none';
    if (shippingDiscountRow) shippingDiscountRow.style.display = 'none';
  }
  
  // Hiển thị phí ship sau giảm giá
  if (cleanShippingFee > 0) {
    shippingElement.textContent = formatPrice(cleanShippingFee);
    shippingElement.style.color = '#e74c3c';
  } else {
    shippingElement.textContent = 'Miễn phí';
    shippingElement.style.color = '#27ae60';
  }
  
  totalElement.textContent = formatPrice(total);
}

// Update order summary

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

  // ✅ Tính tổng tiền ĐÚNG (subtotal - discount + shipping)
  const subtotal = selectedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discount = appliedDiscountAmount || 0;
  
  // Tính phí ship
  let shippingFee = 0;
  if (appliedFreeShipCode) {
    shippingFee = 0; // Free Ship
  } else {
    const provinceSelect = document.getElementById('tinhthanh');
    if (provinceSelect && provinceSelect.value) {
      const selectedOption = provinceSelect.options[provinceSelect.selectedIndex];
      const provinceName = selectedOption.dataset.provinceName || selectedOption.textContent;
      const totalWeight = await getTotalWeight();
      const customerTier = getCustomerTier();
      const shippingInfo = calculateShippingFee(provinceName, totalWeight, customerTier);
      shippingFee = shippingInfo.final;
    }
  }
  
  const totalAmount = subtotal - discount + shippingFee;
  console.log('💰 Tính toán tổng tiền:', { subtotal, discount, shippingFee, totalAmount });

  // ✅ Lấy cả 2 mã (nếu có)
  const freeShipCode = appliedFreeShipCode ? appliedFreeShipCode.code : null;
  const discountCode = appliedDiscountCode ? appliedDiscountCode.code : null;
  
  const orderData = {
    // ✅ GỬI ĐẦY ĐỦ THÔNG TIN: subtotal gốc, discount đã áp dụng, và tổng cuối
    subtotal: subtotal,           // Tổng tiền hàng (chưa giảm)
    discount: discount,           // Số tiền giảm giá (từ mã KM)
    totalAmountDiscouted: totalAmount, // Tổng cuối cùng (subtotal - discount + shipping)
    freeShipCode: freeShipCode, // Mã Free Ship (nếu có)
    discountCode: discountCode, // Mã giảm giá (nếu có)
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
  console.log('🔍 [DEBUG] totalAmountDiscouted =', totalAmount);

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
      // ✅ XÓA CÁC MÃ KHUYẾN MÃI ĐÃ LƯU
      clearSavedCodes();
      
      if (formData.paymentMethod === 'VNPAY' && result.paymentUrl) {
        console.log('🔄 Redirecting to VNPay:', result.paymentUrl);
        window.location.href = result.paymentUrl;
      } else if (formData.paymentMethod === 'COD') {
        // ✅ COD SUCCESS - REDIRECT với đầy đủ thông tin
        console.log('✅ COD Order successful:', result.orderId);
        showToast('Đặt hàng COD thành công!');
        await clearCart();

        // ✅ Truyền đầy đủ thông tin: amount, discount, shipping, và các mã khuyến mãi
        const params = new URLSearchParams({
          orderId: result.orderId,
          status: 'cod',
          paymentMethod: 'COD',
          amount: totalAmount,
          subtotal: subtotal,
          discount: discount,
          shipping: shippingFee,
          discountCode: discountCode || '',
          freeShipCode: freeShipCode || '',
          message: encodeURIComponent('Đặt hàng COD thành công')
        });
        
        window.location.href = `order-confirmation.html?${params.toString()}`;
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

// Clear error styling for a field
function clearFieldError(fieldId) {
  const field = document.getElementById(fieldId);
  if (field) {
    field.classList.remove('error');
    const errorMsg = field.parentElement.querySelector('.error-message');
    if (errorMsg) errorMsg.classList.remove('show');
  }
}

// Add error styling to a field
function showFieldError(fieldId, message) {
  const field = document.getElementById(fieldId);
  if (!field) return;
  
  field.classList.add('error');
  
  // Create or update error message
  let errorMsg = field.parentElement.querySelector('.error-message');
  if (!errorMsg) {
    errorMsg = document.createElement('div');
    errorMsg.className = 'error-message';
    field.parentElement.appendChild(errorMsg);
  }
  errorMsg.textContent = message;
  errorMsg.classList.add('show');
  
  // Scroll to first error field
  if (!document.querySelector('.form-input.error:not(#' + fieldId + ')')) {
    field.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

// Validate form with visual feedback
function validateForm(formData) {
  let isValid = true;
  let firstErrorField = null;
  
  // Clear all previous errors
  ['name', 'phone', 'email', 'tinhthanh', 'quanhuyen', 'phuongxa', 'diachichitiet', 'payment-method'].forEach(clearFieldError);
  
  // Validate name
  if (!formData.tenkh.trim()) {
    showFieldError('name', 'Vui lòng nhập họ tên!');
    if (!firstErrorField) firstErrorField = 'name';
    isValid = false;
  }
  
  // Validate phone
  if (!formData.sdt.trim()) {
    showFieldError('phone', 'Vui lòng nhập số điện thoại!');
    if (!firstErrorField) firstErrorField = 'phone';
    isValid = false;
  } else if (!/^\d{10,11}$/.test(formData.sdt)) {
    showFieldError('phone', 'Số điện thoại không hợp lệ (10-11 chữ số)!');
    if (!firstErrorField) firstErrorField = 'phone';
    isValid = false;
  }
  
  // Validate email
  if (!formData.email.trim()) {
    showFieldError('email', 'Vui lòng nhập email!');
    if (!firstErrorField) firstErrorField = 'email';
    isValid = false;
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
    showFieldError('email', 'Email không hợp lệ!');
    if (!firstErrorField) firstErrorField = 'email';
    isValid = false;
  }
  
  // Validate province
  if (!formData.tinhthanh) {
    showFieldError('tinhthanh', 'Vui lòng chọn Tỉnh/Thành phố!');
    if (!firstErrorField) firstErrorField = 'tinhthanh';
    isValid = false;
  }
  
  // Validate district
  if (!formData.quanhuyen) {
    showFieldError('quanhuyen', 'Vui lòng chọn Quận/Huyện!');
    if (!firstErrorField) firstErrorField = 'quanhuyen';
    isValid = false;
  }
  
  // Validate ward
  if (!formData.phuongxa) {
    showFieldError('phuongxa', 'Vui lòng chọn Phường/Xã!');
    if (!firstErrorField) firstErrorField = 'phuongxa';
    isValid = false;
  }
  
  // Validate detailed address
  if (!formData.diachi.trim()) {
    showFieldError('diachichitiet', 'Vui lòng nhập địa chỉ chi tiết!');
    if (!firstErrorField) firstErrorField = 'diachichitiet';
    isValid = false;
  }
  
  // Validate payment method
  if (!formData.paymentMethod) {
    showFieldError('payment-method', 'Vui lòng chọn phương thức thanh toán!');
    if (!firstErrorField) firstErrorField = 'payment-method';
    isValid = false;
  }
  
  // Show toast for first error and scroll to it
  if (!isValid) {
    showToast('Vui lòng điền đầy đủ thông tin các trường bắt buộc!');
    if (firstErrorField) {
      const field = document.getElementById(firstErrorField);
      if (field) {
        setTimeout(() => {
          field.scrollIntoView({ behavior: 'smooth', block: 'center' });
          field.focus();
        }, 100);
      }
    }
  }
  
  return isValid;
}

// Add real-time validation on input
function setupRealtimeValidation() {
  const fields = [
    { id: 'name', validator: (val) => val.trim() !== '', message: 'Họ tên không được để trống' },
    { id: 'phone', validator: (val) => /^\d{10,11}$/.test(val), message: 'Số điện thoại không hợp lệ' },
    { id: 'email', validator: (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), message: 'Email không hợp lệ' },
    { id: 'tinhthanh', validator: (val) => val !== '', message: 'Vui lòng chọn Tỉnh/Thành phố' },
    { id: 'quanhuyen', validator: (val) => val !== '', message: 'Vui lòng chọn Quận/Huyện' },
    { id: 'phuongxa', validator: (val) => val !== '', message: 'Vui lòng chọn Phường/Xã' },
    { id: 'diachichitiet', validator: (val) => val.trim() !== '', message: 'Địa chỉ chi tiết không được để trống' },
    { id: 'payment-method', validator: (val) => val !== '', message: 'Vui lòng chọn phương thức thanh toán' }
  ];
  
  fields.forEach(({ id, validator, message }) => {
    const field = document.getElementById(id);
    if (field) {
      field.addEventListener('blur', () => {
        const value = field.value;
        if (!validator(value)) {
          showFieldError(id, message);
        } else {
          clearFieldError(id);
        }
      });
      
      field.addEventListener('input', () => {
        // Clear error as user types
        if (field.classList.contains('error')) {
          const value = field.value;
          if (validator(value)) {
            clearFieldError(id);
          }
        }
      });
      
      field.addEventListener('change', () => {
        // Validate on change (for selects)
        const value = field.value;
        if (!validator(value)) {
          showFieldError(id, message);
        } else {
          clearFieldError(id);
        }
      });
    }
  });
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

// ✅ MODAL GỢI Ý SẢN PHẨM KHI KHÔNG ĐỦ ĐIỀU KIỆN
function showProductSuggestionModal(data, promoCode) {
  // Xóa modal cũ nếu có
  const existingModal = document.getElementById('product-suggestion-modal');
  if (existingModal) existingModal.remove();

  // Tạo modal mới
  const modal = document.createElement('div');
  modal.id = 'product-suggestion-modal';
  modal.className = 'modal-overlay';
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
  `;

  let suggestionsHTML = '';
  let requirementsHTML = '';

  // Trường hợp 1: Không có sản phẩm khuyến mãi trong giỏ (status 402)
  if (data.suggestedProducts && data.suggestedProducts.length > 0) {
    suggestionsHTML = `
      <div class="suggested-products-container">
        <p class="suggestion-note" style="color: #555; margin-bottom: 15px; text-align: center;">
          ${data.message || 'Vui lòng thêm sản phẩm vào giỏ hàng để sử dụng mã này'}
        </p>
        <div class="suggested-products-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 15px; max-height: 400px; overflow-y: auto;">
          ${data.suggestedProducts.slice(0, 6).map(product => {
            // ✅ FIX: Xử lý đường dẫn ảnh - thêm onerror handler
            const imgPath = product.HinhAnh || 'img/product/default.jpg';
            return `
            <div class="suggested-product-card" style="border: 1px solid #ddd; border-radius: 8px; padding: 10px; text-align: center; background: #fff;">
              <img src="${imgPath}" 
                   alt="${product.TenSP}" 
                   onerror="this.src='img/product/default.jpg'" 
                   style="width: 100%; height: 150px; object-fit: cover; border-radius: 5px; margin-bottom: 10px;">
              <h4 style="font-size: 14px; margin: 5px 0; height: 40px; overflow: hidden;">${product.TenSP}</h4>
              <p class="product-price" style="color: #e74c3c; font-weight: bold; margin: 5px 0;">${formatPrice(product.DonGia)}</p>
              <button class="add-suggested-product-btn" data-product-id="${product.MaSP}" style="width: 100%; padding: 8px; background: #27ae60; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 13px;">
                <i class="fas fa-cart-plus"></i> Thêm vào giỏ
              </button>
            </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  // Trường hợp 2: Có sản phẩm nhưng không đủ điều kiện (status 403)
  if (data.requirements && data.suggestions) {
    const { currentStatus, requirements, suggestions } = data;
    
    requirementsHTML = `
      <div class="requirements-info" style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
        <h4 style="margin-top: 0;"><i class="fas fa-info-circle"></i> Điều kiện áp dụng:</h4>
        <div class="requirement-comparison" style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 15px 0;">
          <div class="current-status" style="background: #fff; padding: 10px; border-radius: 5px; border-left: 3px solid #ff9800;">
            <h5 style="margin-top: 0; color: #ff9800;">Hiện tại:</h5>
            <ul style="list-style: none; padding: 0;">
              <li>Tổng tiền: <strong>${formatPrice(currentStatus.currentAmount)}</strong></li>
              <li>Số lượng: <strong>${currentStatus.currentQuantity} sản phẩm</strong></li>
            </ul>
          </div>
          <div class="required-status" style="background: #fff; padding: 10px; border-radius: 5px; border-left: 3px solid #27ae60;">
            <h5 style="margin-top: 0; color: #27ae60;">Yêu cầu:</h5>
            <ul style="list-style: none; padding: 0;">
              <li>Tổng tiền: <strong>${formatPrice(requirements.minAmount)}</strong></li>
              <li>Số lượng: <strong>${requirements.minQuantity} sản phẩm</strong></li>
            </ul>
          </div>
        </div>
        <div class="missing-info" style="text-align: center; padding: 10px; background: #fff3cd; border-radius: 5px;">
          <p style="color: #e74c3c; font-weight: bold; margin: 0;">
            <i class="fas fa-arrow-up"></i> ${suggestions.message}
          </p>
        </div>
      </div>
    `;

    if (suggestions.availableProducts && suggestions.availableProducts.length > 0) {
      suggestionsHTML = `
        <div class="suggested-products-container">
          <p class="suggestion-note" style="color: #555; margin-bottom: 15px; text-align: center; font-style: italic;">
            ${suggestions.note}
          </p>
          <div class="suggested-products-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 15px; max-height: 400px; overflow-y: auto;">
            ${suggestions.availableProducts.slice(0, 6).map(product => {
              // ✅ FIX: Xử lý đường dẫn ảnh - thêm onerror handler
              const imgPath = product.HinhAnh || 'img/product/default.jpg';
              return `
              <div class="suggested-product-card" style="border: 1px solid #ddd; border-radius: 8px; padding: 10px; text-align: center; background: #fff;">
                <img src="${imgPath}" 
                     alt="${product.TenSP}" 
                     onerror="this.src='img/product/default.jpg'" 
                     style="width: 100%; height: 150px; object-fit: cover; border-radius: 5px; margin-bottom: 10px;">
                <h4 style="font-size: 14px; margin: 5px 0; height: 40px; overflow: hidden;">${product.TenSP}</h4>
                <p class="product-price" style="color: #e74c3c; font-weight: bold; margin: 5px 0;">${formatPrice(product.DonGia)}</p>
                <button class="add-suggested-product-btn" data-product-id="${product.MaSP}" style="width: 100%; padding: 8px; background: #27ae60; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 13px;">
                  <i class="fas fa-cart-plus"></i> Thêm vào giỏ
                </button>
              </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    }
  }

  modal.innerHTML = `
    <div class="modal-content" style="background: white; border-radius: 10px; padding: 20px; max-width: 800px; max-height: 90vh; overflow-y: auto; position: relative; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
      <div class="modal-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 2px solid #eee; padding-bottom: 10px;">
        <h3 style="margin: 0; color: #e74c3c;"><i class="fas fa-exclamation-triangle"></i> ${data.error || 'Chưa đủ điều kiện'}</h3>
        <button class="close-modal-btn" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #999;">&times;</button>
      </div>
      <div class="modal-body">
        ${requirementsHTML}
        ${suggestionsHTML}
      </div>
      <div class="modal-footer" style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px; padding-top: 15px; border-top: 1px solid #eee;">
        <button class="btn btn-secondary close-modal-btn" style="padding: 10px 20px; background: #6c757d; color: white; border: none; border-radius: 5px; cursor: pointer;">Đóng</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Xử lý nút thêm sản phẩm vào giỏ
  modal.querySelectorAll('.add-suggested-product-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const productId = e.currentTarget.dataset.productId;
      btn.disabled = true;
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang thêm...';
      
      try {
        // Tìm thông tin sản phẩm từ data
        const allProducts = [
          ...(data.suggestedProducts || []),
          ...(data.suggestions?.availableProducts || [])
        ];
        
        console.log('🔍 [DEBUG] productId:', productId, typeof productId);
        console.log('🔍 [DEBUG] allProducts:', allProducts);
        console.log('🔍 [DEBUG] allProducts[0]?.MaSP:', allProducts[0]?.MaSP, typeof allProducts[0]?.MaSP);
        
        const product = allProducts.find(p => String(p.MaSP) === String(productId));
        
        if (product) {
          console.log('🛒 Đang thêm sản phẩm:', product.TenSP);
          
          // ✅ Thêm timeout 10 giây để tránh treo
          const addPromise = addToCart(productId, 1, product.TenSP, product.DonGia, product.HinhAnh);
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout')), 10000)
          );
          
          const success = await Promise.race([addPromise, timeoutPromise]);
          
          if (success !== false) {
            console.log('✅ Đã thêm thành công');
            await renderCart();
            showToast(`✅ Đã thêm "${product.TenSP}" vào giỏ hàng`);
            btn.innerHTML = '<i class="fas fa-check"></i> Đã thêm';
            btn.style.background = '#27ae60';
            
            // Đóng modal
            setTimeout(() => modal.remove(), 500);
            
            // ✅ Tự động áp mã sau 1 giây
            setTimeout(async () => {
              try {
                console.log('🔄 Tự động áp mã khuyến mãi:', promoCode);
                showToast('🔄 Đang kiểm tra điều kiện và áp mã...');
                
                // Tìm nút "ÁP DỤNG NGAY" của mã này
                const promoButtons = document.querySelectorAll('.use-promo-btn');
                let targetButton = null;
                
                promoButtons.forEach(promoBtn => {
                  const btnCode = promoBtn.dataset.promoCode || promoBtn.getAttribute('data-promo-code');
                  if (btnCode === promoCode) {
                    targetButton = promoBtn;
                  }
                });
                
                if (targetButton) {
                  console.log('✅ Tìm thấy nút áp dụng, đang áp mã...');
                  const fakeEvent = { target: targetButton };
                  await window.applyPromoFromSaved(promoCode, fakeEvent);
                } else {
                  console.warn('⚠️ Không tìm thấy nút áp dụng cho mã:', promoCode);
                  showToast('💡 Vui lòng thử áp dụng mã thủ công!');
                }
              } catch (retryError) {
                console.error('❌ Lỗi khi tự động áp mã:', retryError);
                console.log('ℹ️ Có thể cần thêm sản phẩm nữa hoặc thử áp mã thủ công');
              }
            }, 1000);
          } else {
            throw new Error('Không thể thêm sản phẩm');
          }
        } else {
          throw new Error('Không tìm thấy thông tin sản phẩm');
        }
      } catch (error) {
        console.error('❌ Lỗi thêm sản phẩm:', error);
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-cart-plus"></i> Thêm vào giỏ';
        showToast('❌ Lỗi khi thêm sản phẩm: ' + (error.message || 'Unknown'));
      }
    });
  });

  // Xử lý nút đóng modal
  modal.querySelectorAll('.close-modal-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      modal.remove();
    });
  });

  // Đóng khi click overlay
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });
}

// Load provinces
async function loadProvinces() {
  const provinceSelect = document.getElementById('tinhthanh');
  if (!provinceSelect) return;

  try {
    // Load from local JSON file instead of API
    const response = await fetch('http://localhost:5000/api/address/cities');
    const cities = await response.json();
    provinceSelect.innerHTML = '<option value="">-- Chọn Tỉnh/TP --</option>';
    cities.forEach(city => {
      const option = document.createElement('option');
      option.value = city.city_id;
      option.textContent = city.city_name;
      option.dataset.provinceName = city.city_name; // Lưu tên tỉnh để tính phí ship
      provinceSelect.appendChild(option);
    });
    
    // Thêm event listener để tính phí ship khi chọn tỉnh
    provinceSelect.addEventListener('change', async () => {
      await updateShippingFee();
    });
  } catch (error) {
    console.error('Error loading provinces:', error);
    provinceSelect.innerHTML = '<option value="">Không tải được dữ liệu</option>';
  }
}

// Hàm tính và cập nhật phí ship
async function updateShippingFee() {
  const provinceSelect = document.getElementById('tinhthanh');
  if (!provinceSelect || !provinceSelect.value) {
    // Chưa chọn tỉnh -> hiển thị "Miễn phí" mặc định
    const shippingElement = document.getElementById('shipping');
    if (shippingElement) {
      shippingElement.textContent = 'Chưa chọn địa chỉ';
      shippingElement.style.color = '#999';
    }
    return;
  }

  // ✅ KIỂM TRA NẾU ĐÃ ÁP DỤNG MÃ FREE SHIP -> PHÍ SHIP = 0
  if (appliedFreeShipCode) {
    console.log('🚚 Đã có mã Free Ship, phí vận chuyển = 0đ');
    const shippingElement = document.getElementById('shipping');
    if (shippingElement) {
      shippingElement.textContent = '0đ';
      shippingElement.style.color = '#27ae60';
    }
    window.currentShippingFee = 0;
    
    // Cập nhật lại tổng tiền
    const cart = await getCart();
    const selectedItems = cart.filter(item => item.selected);
    const subtotal = selectedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    // ✅ FIX: Lấy discount từ biến global thay vì parse DOM
    const currentDiscount = appliedDiscountAmount || 0;
    // ✅ FIX: Truyền shippingInfo = null để ẨN giảm ship hội viên
    updateSummary(subtotal, currentDiscount, 0, null);
    return;
  }

  // Lấy tên tỉnh từ option đã chọn
  const selectedOption = provinceSelect.options[provinceSelect.selectedIndex];
  const provinceName = selectedOption.dataset.provinceName || selectedOption.textContent;

  // Lấy trọng lượng tổng và tier khách hàng
  const totalWeight = await getTotalWeight();
  const customerTier = getCustomerTier();

  // Tính phí ship (trả về object với original, final, discount)
  const shippingInfo = calculateShippingFee(provinceName, totalWeight, customerTier);

  // Cập nhật summary với phí ship mới
  const cart = await getCart();
  const selectedItems = cart.filter(item => item.selected);
  const subtotal = selectedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  
  // ✅ FIX: Lấy discount từ biến global thay vì parse DOM
  const currentDiscount = appliedDiscountAmount || 0;
  console.log('💰 Using saved discount amount:', currentDiscount);
  
  updateSummary(subtotal, currentDiscount, shippingInfo.final, shippingInfo);
  
  // Lưu phí ship vào biến global để dùng khi checkout
  window.currentShippingFee = shippingInfo.final;
  
  console.log(`🚢 Đã cập nhật phí ship: ${shippingInfo.final.toLocaleString('vi-VN')} VND`);
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
    // Load from local JSON file instead of API
    const response = await fetch(`http://localhost:5000/api/address/districts/${provinceSelect.value}`);
    const districts = await response.json();
    districts.forEach(district => {
      const option = document.createElement('option');
      option.value = district.district_id;
      option.textContent = district.district_name;
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
    // Load from local JSON file instead of API
    const response = await fetch(`http://localhost:5000/api/address/wards/${districtSelect.value}`);
    const wards = await response.json();
    wards.forEach(ward => {
      const option = document.createElement('option');
      option.value = ward.ward_name; // Use ward_name as value
      option.textContent = ward.ward_name;
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
//áp dụng khuyến mãi - TỰ ĐỘNG NHẬN DIỆN LOẠI MÃ
// ✅ THAY ĐỔI: Lưu 2 mã riêng biệt thay vì 1 mã chung
let appliedFreeShipCode = null; // Mã Free Ship
let appliedDiscountCode = null; // Mã giảm giá (% hoặc tiền)
let appliedDiscountAmount = 0;  // ✅ Số tiền giảm giá thực tế

// ✅ HÀM LƯU MÃ VÀO LOCALSTORAGE
function saveAppliedCodes() {
  const data = {
    freeShip: appliedFreeShipCode,
    discount: appliedDiscountCode,
    discountAmount: appliedDiscountAmount
  };
  localStorage.setItem('applied_promo_codes', JSON.stringify(data));
  console.log('💾 Saved promo codes to localStorage:', data);
}

// ✅ HÀM KHÔI PHỤC MÃ TỪ LOCALSTORAGE
function restoreAppliedCodes() {
  try {
    const saved = localStorage.getItem('applied_promo_codes');
    if (saved) {
      const data = JSON.parse(saved);
      appliedFreeShipCode = data.freeShip;
      appliedDiscountCode = data.discount;
      appliedDiscountAmount = data.discountAmount || 0;
      console.log('♻️ Restored promo codes from localStorage:', data);
      return true;
    }
  } catch (e) {
    console.error('❌ Error restoring promo codes:', e);
  }
  return false;
}

// ✅ HÀM XÓA MÃ KHỎI LOCALSTORAGE
function clearSavedCodes() {
  localStorage.removeItem('applied_promo_codes');
  console.log('🗑️ Cleared saved promo codes');
}

async function applyPromo() {
  try {
    const cart = await getCart();
    const selectedItems = cart.filter(item => item.selected);

    const code = document.getElementById('coupon-code').value.trim();
    if (!code) {
      showToast("Vui lòng nhập mã khuyến mãi");
      return;
    }

    // Bước 1: Kiểm tra xem mã này có phải Free Ship không
    try {
      const freeShipRes = await fetch(`http://localhost:5000/api/khuyenmai/my-promotions?loaiKM=free_ship&activeOnly=true`, {
        headers: {
          "Authorization": `Bearer ${getToken()}`,
        }
      });
      
      const freeShipData = await freeShipRes.json();
      
      if (freeShipRes.ok && freeShipData.data) {
        const validFreeShip = freeShipData.data.find(promo => 
          promo.Code === code && 
          promo.trang_thai === 'Chua_su_dung'
        );
        
        if (validFreeShip) {
          // ✅ KIỂM TRA: Đã có mã Free Ship chưa?
          if (appliedFreeShipCode) {
            showToast("Bạn đã áp dụng mã Free Ship rồi. Vui lòng xóa mã cũ trước!");
            return;
          }
          
          // Đây là mã Free Ship
          const subtotal = selectedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
          
          if (subtotal >= (validFreeShip.GiaTriDonToiThieu || 0)) {
            appliedFreeShipCode = {
              code: code,
              details: validFreeShip
            };
            
            // ✅ LƯU VÀO LOCALSTORAGE
            saveAppliedCodes();
            
            await displayAppliedPromo(code, 'free_ship');
            
            // ✅ XÓA Ô INPUT SAU KHI ÁP DỤNG THÀNH CÔNG
            document.getElementById('coupon-code').value = '';
            
            showToast("Áp dụng mã Free Ship thành công!");
            return;
          } else {
            showToast(`Đơn hàng phải đạt tối thiểu ${formatPrice(validFreeShip.GiaTriDonToiThieu)} để sử dụng mã này`);
            return;
          }
        }
      }
    } catch (error) {
      console.log('Không phải mã Free Ship, kiểm tra mã giảm giá...');
    }

    // Bước 2: Nếu không phải Free Ship, kiểm tra mã giảm giá sản phẩm
    // ✅ KIỂM TRA: Đã có mã giảm giá chưa?
    if (appliedDiscountCode) {
      showToast("Bạn đã áp dụng mã giảm giá rồi. Vui lòng xóa mã cũ trước!");
      return;
    }
    
    const otherData = {
      makh: getUserId(),
      code: code,
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
      
      // ✅ Lưu mã giảm giá đã áp dụng
      appliedDiscountCode = {
        code: code,
        details: data.discountDetails
      };
      
      // ✅ LƯU GIÁ TRỊ GIẢM GIÁ TRƯỚC KHI LƯU VÀO LOCALSTORAGE
      appliedDiscountAmount = parseFloat(data.discountDetails?.discountAmount) || 0;
      console.log('💾 Set appliedDiscountAmount BEFORE save:', appliedDiscountAmount);
      
      // ✅ LƯU VÀO LOCALSTORAGE
      saveAppliedCodes();
      
      // Hiển thị thông tin mã đã áp dụng
      await displayAppliedPromo(code, 'discount', data.discountDetails);
      
      // ✅ XÓA Ô INPUT SAU KHI ÁP DỤNG THÀNH CÔNG
      document.getElementById('coupon-code').value = '';
      
      showToast("Áp dụng mã khuyến mãi thành công!");
      return data.discountDetails;
    } else {
      showToast(data.error || "Mã không hợp lệ hoặc không áp dụng được");
      console.error("Lỗi request:", data.error);
      return null;
    }
  } catch (error) {
    console.error("Lỗi:", error);
    showToast("Có lỗi xảy ra, vui lòng thử lại sau");
    return null;
  }
}

// Hiển thị mã khuyến mãi đã áp dụng (tự động nhận diện loại)
async function displayAppliedPromo(code, type, details = null) {
  console.log('🎯 displayAppliedPromo called:', { code, type, details });
  
  if (type === 'free_ship') {
    console.log('🚚 Processing Free Ship display...');
    
    // Hiển thị mã Free Ship
    const freeShipRow = document.getElementById('free-ship-code-row');
    const freeShipValue = document.getElementById('free-ship-code-value');
    
    console.log('📦 Elements found:', { 
      freeShipRow: !!freeShipRow, 
      freeShipValue: !!freeShipValue,
      currentDisplay: freeShipRow ? freeShipRow.style.display : 'N/A'
    });
    
    if (!freeShipRow || !freeShipValue) {
      console.error('❌ Missing Free Ship elements in HTML!');
      console.error('Please check if #free-ship-code-row and #free-ship-code-value exist');
      showToast('❌ Lỗi: Không tìm thấy phần tử hiển thị mã Free Ship. Vui lòng reload trang!');
      return;
    }
    
    // Set mã code
    freeShipValue.textContent = code;
    freeShipRow.style.display = 'flex';
    freeShipRow.style.visibility = 'visible';
    freeShipRow.style.opacity = '1';
    
    console.log('✅ Free Ship box displayed with code:', code);
    console.log('✅ Box display:', freeShipRow.style.display);
    
    // ✅ KHÔNG ẨN box giảm giá nữa - Cho phép hiển thị đồng thời
    
    // Cập nhật phí ship = 0 và hiển thị rõ ràng
    const shippingElement = document.getElementById('shipping');
    if (shippingElement) {
      shippingElement.textContent = '0đ';
      shippingElement.style.color = '#27ae60';
      shippingElement.style.fontWeight = 'bold';
      console.log('✅ Shipping fee set to 0đ');
    } else {
      console.error('❌ #shipping element not found!');
    }
    
    // ✅ Hiển thị phí ship gốc (nếu có) bị gạch ngang
    const shippingOriginalRow = document.getElementById('shipping-original-row');
    const shippingOriginalElement = document.getElementById('shipping-original');
    const provinceSelect = document.getElementById('tinhthanh');
    
    if (provinceSelect && provinceSelect.value && shippingOriginalRow && shippingOriginalElement) {
      // Tính phí ship gốc nếu đã chọn địa chỉ
      const selectedOption = provinceSelect.options[provinceSelect.selectedIndex];
      const provinceName = selectedOption.dataset.provinceName || selectedOption.textContent;
      const totalWeight = await getTotalWeight();
      const customerTier = getCustomerTier();
      const originalShippingFee = calculateShippingFee(provinceName, totalWeight, customerTier);
      
      console.log('📊 Original shipping calculation:', {
        provinceName,
        totalWeight,
        customerTier,
        originalShippingFee
      });
      
      if (originalShippingFee > 0) {
        shippingOriginalRow.style.display = 'flex';
        shippingOriginalElement.textContent = formatPrice(originalShippingFee);
        console.log('💰 Original shipping fee shown:', originalShippingFee);
      } else {
        console.log('ℹ️ No original shipping fee (HCM or tier discount = 100%)');
      }
    } else {
      console.log('ℹ️ Address not selected or elements missing, skipping original fee display');
    }
    
    // ✅ Cập nhật lại tổng tiền với phí ship = 0
    const cart = await getCart();
    const selectedItems = cart.filter(item => item.selected);
    const subtotal = selectedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    
    // ✅ FIX: Sử dụng biến global appliedDiscountAmount thay vì đọc từ DOM
    console.log('🔍 DEBUG appliedDiscountAmount before using:', appliedDiscountAmount);
    console.log('🔍 DEBUG appliedDiscountCode:', appliedDiscountCode);
    const currentDiscount = appliedDiscountAmount || 0;
    
    console.log('💰 Updating summary:', { 
      subtotal, 
      currentDiscount, 
      shippingFee: 0,
      total: subtotal - currentDiscount
    });
    
    // ✅ FIX: Truyền shippingInfo = null để ẨN giảm ship hội viên
    updateSummary(subtotal, currentDiscount, 0, null); // Phí ship = 0, ẨN tier info
    window.currentShippingFee = 0;
    
    console.log('✅✅✅ Free Ship applied successfully! ✅✅✅');
    console.log('Box should be visible now. Check #free-ship-code-row');
  } else if (type === 'discount') {
    console.log('💰 Processing Discount Code display...');
    console.log('💰 Details received:', details);
    
    // Hiển thị mã giảm giá
    const promoRow = document.getElementById('promo-code-row');
    const promoValue = document.getElementById('promo-code-value');
    
    if (promoRow && promoValue) {
      promoValue.textContent = code;
      promoRow.style.display = 'flex';
      
      console.log('✅ Promo code box displayed');
      
      // ✅ KHÔNG ẨN box Free Ship nữa - Cho phép hiển thị đồng thời
      
      // Cập nhật giá trị giảm
      console.log('💵 Checking discount amount:', details?.discountAmount);
      if (details && details.discountAmount > 0) {
        const discountRow = document.getElementById('discount-row');
        const discountElement = document.getElementById('discount');
        if (discountRow && discountElement) {
          discountRow.style.display = 'flex';
          // ✅ FIX: Convert string to number
          const discountValue = parseFloat(details.discountAmount) || 0;
          discountElement.textContent = `-${formatPrice(discountValue)}`;
          console.log('💵 Discount displayed:', discountValue);
        }
      }
      
      // ✅ Cập nhật lại tổng tiền (KHÔNG gọi updateShippingFee để giữ nguyên phí ship)
      const cart = await getCart();
      const selectedItems = cart.filter(item => item.selected);
      const subtotal = selectedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
      
      // ✅ FIX: Tính lại shippingInfo đầy đủ khi áp mã giảm giá
      let currentShippingFee = 0;
      let shippingInfo = null;
      
      if (appliedFreeShipCode) {
        // Đã có Free Ship -> phí = 0, không hiển thị tier
        currentShippingFee = 0;
        shippingInfo = null;
      } else {
        // Chưa có Free Ship -> tính phí ship với tier discount
        const provinceSelect = document.getElementById('tinhthanh');
        if (provinceSelect && provinceSelect.value) {
          const selectedOption = provinceSelect.options[provinceSelect.selectedIndex];
          const provinceName = selectedOption.dataset.provinceName || selectedOption.textContent;
          const totalWeight = await getTotalWeight();
          const customerTier = getCustomerTier();
          shippingInfo = calculateShippingFee(provinceName, totalWeight, customerTier);
          currentShippingFee = shippingInfo.final;
        } else {
          // Chưa chọn địa chỉ
          currentShippingFee = window.currentShippingFee || 0;
        }
      }
      
      // ✅ FIX: Convert discountAmount to number before passing to updateSummary
      const discountAmount = parseFloat(details?.discountAmount) || 0;
      console.log('📊 Final calculation:', { subtotal, discountAmount, currentShippingFee });
      
      // ✅ LƯU GIÁ TRỊ GIẢM GIÁ VÀO BIẾN GLOBAL (nếu chưa được set từ applyPromo)
      if (appliedDiscountAmount === 0 && discountAmount > 0) {
        appliedDiscountAmount = discountAmount;
        console.log('💾 Saved appliedDiscountAmount in displayAppliedPromo:', appliedDiscountAmount);
        // Lưu lại vào localStorage nếu được set từ đây
        saveAppliedCodes();
      }
      
      // ✅ FIX: Truyền đầy đủ shippingInfo
      updateSummary(subtotal, discountAmount, currentShippingFee, shippingInfo);
    }
  }
}

// ✅ Xóa mã giảm giá (chỉ xóa mã giảm giá, giữ lại Free Ship nếu có)
async function removeDiscountCode() {
  appliedDiscountCode = null;
  appliedDiscountAmount = 0; // ✅ Reset biến global
  
  // ✅ CẬP NHẬT LOCALSTORAGE
  saveAppliedCodes();
  
  const promoRow = document.getElementById('promo-code-row');
  const discountRow = document.getElementById('discount-row');
  
  if (promoRow) promoRow.style.display = 'none';
  if (discountRow) discountRow.style.display = 'none';
  
  // ✅ FIX: Không gọi renderCart() để tránh reset toàn bộ - chỉ cập nhật summary
  const cart = await getCart();
  const selectedItems = cart.filter(item => item.selected);
  const subtotal = selectedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  
  // Lấy phí ship hiện tại
  let currentShippingFee = 0;
  let shippingInfo = null;
  
  if (appliedFreeShipCode) {
    // Đã có Free Ship -> phí = 0
    currentShippingFee = 0;
    shippingInfo = null;
  } else {
    // Tính lại phí ship nếu đã chọn địa chỉ
    const provinceSelect = document.getElementById('tinhthanh');
    if (provinceSelect && provinceSelect.value) {
      const selectedOption = provinceSelect.options[provinceSelect.selectedIndex];
      const provinceName = selectedOption.dataset.provinceName || selectedOption.textContent;
      const totalWeight = await getTotalWeight();
      const customerTier = getCustomerTier();
      shippingInfo = calculateShippingFee(provinceName, totalWeight, customerTier);
      currentShippingFee = shippingInfo.final;
    } else {
      currentShippingFee = window.currentShippingFee || 0;
    }
  }
  
  updateSummary(subtotal, 0, currentShippingFee, shippingInfo);
  
  // ✅ RELOAD DANH SÁCH MÃ ĐÃ LƯU để nút quay về "ÁP DỤNG NGAY"
  await loadSavedPromos();
  
  showToast('Đã xóa mã giảm giá');
}

// ✅ Xóa mã Free Ship (chỉ xóa Free Ship, giữ lại mã giảm giá nếu có)
async function removeFreeShipCode() {
  appliedFreeShipCode = null;
  
  // ✅ CẬP NHẬT LOCALSTORAGE
  saveAppliedCodes();
  
  const freeShipRow = document.getElementById('free-ship-code-row');
  if (freeShipRow) freeShipRow.style.display = 'none';
  
  const shippingOriginalRow = document.getElementById('shipping-original-row');
  if (shippingOriginalRow) shippingOriginalRow.style.display = 'none';
  
  // ✅ FIX: Không gọi renderCart() để tránh reset toàn bộ - chỉ cập nhật summary
  const cart = await getCart();
  const selectedItems = cart.filter(item => item.selected);
  const subtotal = selectedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  
  // Tính lại phí ship (về mức bình thường)
  let shippingFee = 0;
  let shippingInfo = null;
  
  const provinceSelect = document.getElementById('tinhthanh');
  if (provinceSelect && provinceSelect.value) {
    const selectedOption = provinceSelect.options[provinceSelect.selectedIndex];
    const provinceName = selectedOption.dataset.provinceName || selectedOption.textContent;
    const totalWeight = await getTotalWeight();
    const customerTier = getCustomerTier();
    shippingInfo = calculateShippingFee(provinceName, totalWeight, customerTier);
    shippingFee = shippingInfo.final;
    window.currentShippingFee = shippingFee;
  }
  
  // ✅ GIỮ LẠI GIÁ TRỊ GIẢM GIÁ
  updateSummary(subtotal, appliedDiscountAmount, shippingFee, shippingInfo);
  
  // ✅ RELOAD DANH SÁCH MÃ ĐÃ LƯU để nút quay về "ÁP DỤNG NGAY"
  await loadSavedPromos();
  
  showToast('Đã xóa mã Free Ship');
}

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  // Chỉ chạy logic cart đầy đủ nếu đang ở trang cart.html
  const isCartPage = window.location.pathname.includes('cart.html');
  
  if (!isCartPage) {
    // Nếu không phải trang cart, chỉ cập nhật cart count
    updateCartCount();
    return;
  }
  
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

  // ✅ KHÔI PHỤC MÃ KHUYẾN MÃI ĐÃ ÁP DỤNG TỪ LOCALSTORAGE
  const hasRestoredCodes = restoreAppliedCodes();
  
  await renderCart();
  
  // ✅ HIỂN THỊ LẠI CÁC BOX MÃ KHUYẾN MÃI SAU KHI RENDER
  if (hasRestoredCodes) {
    if (appliedFreeShipCode) {
      await displayAppliedPromo(appliedFreeShipCode.code, 'free_ship', appliedFreeShipCode.details);
    }
    if (appliedDiscountCode) {
      await displayAppliedPromo(appliedDiscountCode.code, 'discount', appliedDiscountCode.details);
    }
  }
  
  // Setup real-time validation
  setupRealtimeValidation();
  
  // Gắn event listeners
  const removePromoBtn = document.getElementById('remove-promo');
  if (removePromoBtn) {
    removePromoBtn.addEventListener('click', async () => await removeDiscountCode()); // ✅ Xóa mã giảm giá
  }
  
  const removeFreeShipBtn = document.getElementById('remove-free-ship');
  if (removeFreeShipBtn) {
    removeFreeShipBtn.addEventListener('click', async () => await removeFreeShipCode()); // ✅ Xóa mã Free Ship
  }
  
  // Load saved promo codes display
  await loadSavedPromos();
  
  // If user arrived here after a reorder and we have a backup, show restore banner
  try {
    const backupRaw = localStorage.getItem('cart_backup_before_reorder');
    const metaRaw = localStorage.getItem('reorder_meta');
    if (backupRaw && metaRaw) {
      showRestoreBanner();
    }
  } catch (e) { /* ignore */ }
});

// Load saved promo codes from API
async function loadSavedPromos() {
  console.log('🎯 loadSavedPromos called');
  
  const savedPromosSection = document.getElementById('saved-promos-section');
  const savedPromosList = document.getElementById('saved-promos-list');
  const toggleBtn = document.getElementById('toggle-promos-btn');
  
  if (!savedPromosSection || !savedPromosList) {
    // Không phải trang cart, bỏ qua
    return;
  }
  
  // Nếu chưa đăng nhập, ẩn section
  if (!isLoggedIn()) {
    savedPromosSection.style.display = 'none';
    console.log('ℹ️ User not logged in, hiding promo section');
    return;
  }
  
  console.log('✅ User logged in, loading promos...');
  
  try {
    // Load tất cả mã khuyến mãi (bao gồm cả Free Ship và giảm giá)
    // NOTE: Some coupons (issued via preference form) are stored in coupons endpoint
    // (phieugiamgia_phathanh). We fetch both sources and merge so all user's coupons
    // appear in the saved promos panel.
    const res = await fetch(`http://localhost:5000/api/khuyenmai/my-promotions?activeOnly=true`, {
      headers: {
        "Authorization": `Bearer ${getToken()}`,
      }
    });
    const data = await res.json();

    // If promotions API fails, continue — we'll still try to fetch coupons
    let promoList = Array.isArray(data.data) ? data.data.slice() : [];

    // ALSO fetch issued coupons (e.g., freeship issued by preference form)
    try {
      const couponsRes = await fetch(`http://localhost:5000/api/coupons/my-coupons?makh=${getUserId()}`, {
        headers: {
          Authorization: `Bearer ${getToken()}`
        }
      });
      const couponsJson = await couponsRes.json();
      if (couponsRes.ok && Array.isArray(couponsJson.data)) {
        const couponPromos = couponsJson.data.map(c => ({
          // Map couponController response to the shape expected by the UI
          MaKM: c.promotion ? c.promotion.MaKM : null,
          LoaiKM: c.promotion ? c.promotion.LoaiKM : (c.MaKM ? c.MaKM : null),
          Code: c.MaPhieu || c.MaPhieu || c.MaPhieu,
          NgayLay: c.NgayPhatHanh || c.Ngay_lay || null,
          NgayHetHan: null,
          trang_thai: (c.Status === 'used' || c.NgaySuDung) ? 'Da_su_dung' : (c.TrangThai === 0 ? 'Ngung' : 'Chua_su_dung'),
          __source: 'coupon' // debug hint
        }));

        // Prepend coupon-sourced promos so they appear first
        promoList = [...couponPromos, ...promoList];
        console.log('🔁 Merged coupons from /api/coupons/my-coupons into promo list, count:', promoList.length);
      }
    } catch (e) {
      console.warn('Không thể tải coupons từ /api/coupons/my-coupons:', e);
    }
    
    // Hiển thị section
    savedPromosSection.style.display = 'block';
    
    // Mở rộng danh sách mặc định
    savedPromosList.classList.add('show');
    if (toggleBtn) toggleBtn.classList.add('active');
    
    // Toggle expand/collapse
    const headerClickHandler = () => {
      savedPromosList.classList.toggle('show');
      if (toggleBtn) toggleBtn.classList.toggle('active');
    };
    
    if (toggleBtn) {
      toggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        headerClickHandler();
      });
    }
    
    const header = savedPromosSection.querySelector('.saved-promos-header');
    if (header) {
      header.addEventListener('click', headerClickHandler);
    }
    
    // Render promo cards with pagination (show 6 per page) and add prev/next controls
    console.log('📋 Rendering promo cards (paginated), total:', promoList.length);

    const pageSize = 6;
    let currentPage = 0;
    const totalPages = Math.max(1, Math.ceil(promoList.length / pageSize));

    // Create controls container (prev / page indicator / next)
    let controls = savedPromosSection.querySelector('.promo-controls');
    if (!controls) {
      controls = document.createElement('div');
      controls.className = 'promo-controls';
      controls.style.display = 'flex';
      controls.style.justifyContent = 'center';
      controls.style.alignItems = 'center';
      controls.style.gap = '12px';
      controls.style.marginTop = '12px';
      controls.style.width = '100%';
      controls.innerHTML = `
        <button class="promo-prev" aria-label="Previous promos" style="padding:6px 10px;border-radius:6px;border:1px solid #ddd;background:#fff;cursor:pointer;">‹</button>
        <span class="promo-page-indicator" style="font-weight:600;color:#555">1/${totalPages}</span>
        <button class="promo-next" aria-label="Next promos" style="padding:6px 10px;border-radius:6px;border:1px solid #ddd;background:#fff;cursor:pointer;">›</button>
      `;
      savedPromosSection.appendChild(controls);
    }

    const pageIndicator = controls.querySelector('.promo-page-indicator');
    const prevBtn = controls.querySelector('.promo-prev');
    const nextBtn = controls.querySelector('.promo-next');

    function buildCardHtml(promo, index) {
      const isFreeShip = promo.LoaiKM === 'free_ship';
      const isUsed = promo.trang_thai === 'Da_su_dung';
      const isExpired = promo.NgayHetHan && new Date(promo.NgayHetHan) < new Date();

      let statusClass = 'available';
      let statusText = 'Chưa sử dụng';
      if (isUsed) {
        statusClass = 'used';
        statusText = 'Đã sử dụng';
      } else if (isExpired) {
        statusClass = 'expired';
        statusText = 'Hết hạn';
      }

      const ngayNhan = promo.NgayLay ? new Date(promo.NgayLay).toLocaleDateString('vi-VN') : 'N/A';
      const ngayHetHan = promo.NgayHetHan ? new Date(promo.NgayHetHan).toLocaleDateString('vi-VN') : '';
      const buttonDisabled = isUsed || isExpired;

      return `
        <div class="saved-promo-card ${isFreeShip ? 'free-ship' : ''}" data-code="${promo.Code}">
          <div class="promo-type-badge">
            ${isFreeShip ? '🚚 Free Ship' : '💰 Giảm giá'}
          </div>
          <div class="promo-code-display">${promo.Code}</div>
          <div class="promo-details">
            <div class="promo-detail-row">
              <span class="label">Ngày nhận:</span>
              <span class="value">${ngayNhan}</span>
            </div>
            ${ngayHetHan ? `
              <div class="promo-detail-row">
                <span class="label">Hạn sử dụng:</span>
                <span class="value">${ngayHetHan}</span>
              </div>
            ` : ''}
            <div class="promo-detail-row">
              <span class="label">Trạng thái:</span>
              <span class="promo-status ${statusClass}">${statusText}</span>
            </div>
          </div>
          <button class="use-promo-btn" 
                  data-promo-code="${promo.Code}"
                  ${buttonDisabled ? 'disabled' : ''} 
                  style="cursor: pointer; pointer-events: auto;">
            ${buttonDisabled ? 'Không khả dụng' : 'ÁP DỤNG NGAY'}
          </button>
        </div>
      `;
    }

    function renderPage(page) {
      currentPage = Math.max(0, Math.min(page, totalPages - 1));
      const start = currentPage * pageSize;
      const pageItems = promoList.slice(start, start + pageSize);
      savedPromosList.innerHTML = pageItems.map((p, i) => buildCardHtml(p, start + i)).join('');

      // update indicator and disable state
      if (pageIndicator) pageIndicator.textContent = `${currentPage + 1}/${totalPages}`;
      if (prevBtn) prevBtn.disabled = currentPage === 0;
      if (nextBtn) nextBtn.disabled = currentPage >= totalPages - 1;

      // attach handlers to buttons in the current page
      setTimeout(() => {
        const buttons = savedPromosList.querySelectorAll('.use-promo-btn:not([disabled])');
        buttons.forEach((btn) => {
          const code = btn.getAttribute('data-promo-code');
          btn.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation();
            if (typeof window.applyPromoFromSaved === 'function') {
              window.applyPromoFromSaved(code, e);
            } else {
              showToast('Chức năng áp dụng mã chưa sẵn sàng. Vui lòng tải lại trang!');
            }
            return false;
          };
        });
      }, 50);
    }

    // Initial render
    renderPage(0);

    // If only one page, hide controls
    if (totalPages <= 1) {
      controls.style.display = 'none';
    } else {
      controls.style.display = 'flex';
      prevBtn.addEventListener('click', (e) => { e.preventDefault(); renderPage(currentPage - 1); });
      nextBtn.addEventListener('click', (e) => { e.preventDefault(); renderPage(currentPage + 1); });
    }
    
  } catch (error) {
    console.error('Lỗi load danh sách mã khuyến mãi:', error);
    savedPromosSection.style.display = 'none';
  }
}

// Apply promo code from saved list (trực tiếp, không cần input box)
window.applyPromoFromSaved = async function(code, event) {
  console.log('🚀🚀🚀 === applyPromoFromSaved START === 🚀🚀🚀');
  console.log('Code:', code);
  console.log('Event:', event);
  console.log('Event target:', event?.target);
  
  // ✅ Thay alert bằng toast notification
  // showToast(`🎫 Áp dụng mã: ${code}...`);
  
  const clickedBtn = event?.target;
  const originalText = clickedBtn ? clickedBtn.textContent : '';
  
  console.log('Button found:', clickedBtn);
  console.log('Original button text:', originalText);
  
  if (clickedBtn) {
    clickedBtn.disabled = true;
    clickedBtn.textContent = '⏳ Đang áp dụng...';
    console.log('✅ Button set to loading state');
  }
  
  try {
    if (!code) {
      showToast("Mã không hợp lệ");
      throw new Error("Invalid code");
    }

    // Kiểm tra loại mã
    const freeShipRes = await fetch(`http://localhost:5000/api/khuyenmai/my-promotions?loaiKM=free_ship&activeOnly=true`, {
      headers: { "Authorization": `Bearer ${getToken()}` }
    });
    const freeShipData = await freeShipRes.json();
    const isFreeShip = freeShipData.data?.some(p => p.Code === code && p.trang_thai === 'Chua_su_dung');

    // Fallback: if the promo card in DOM was rendered with class 'free-ship', treat it as free ship
    const clickedCard = clickedBtn ? clickedBtn.closest('.saved-promo-card') : null;
    const domIsFreeShip = clickedCard ? clickedCard.classList.contains('free-ship') : false;
    const isFreeShipFinal = Boolean(isFreeShip || domIsFreeShip);
    
    // ✅ KIỂM TRA GIỎ HÀNG SAU KHI XÁC ĐỊNH LOẠI MÃ
    const cart = await getCart();
    const selectedItems = cart.filter(item => item.selected);

    // ✅ CHỈ MÃ FREE SHIP MỚI CẦN SẢN PHẨM TRONG GIỎ
    if (isFreeShipFinal && selectedItems.length === 0) {
      showToast("Vui lòng chọn sản phẩm trước khi áp dụng mã Free Ship!");
      throw new Error("No items selected for free ship");
    }
    
    if (isFreeShip) {
      // ============= MÃ FREE SHIP =============
      if (appliedFreeShipCode) {
        // If same code already applied, just inform user and update UI
        if (appliedFreeShipCode.code === code) {
          showToast(`Mã Free Ship "${code}" đã được áp dụng`);
          if (clickedBtn) {
            clickedBtn.textContent = '✓ Đã áp dụng';
            clickedBtn.style.background = '#27ae60';
            clickedBtn.disabled = true;
          }
          return;
        }

        showToast(`Đã áp dụng mã Free Ship: ${appliedFreeShipCode.code}. Vui lòng xóa mã cũ trước!`);
        if (clickedBtn && typeof originalText === 'string') {
          clickedBtn.disabled = false;
          clickedBtn.textContent = originalText;
        }
        return;
      }
      
      appliedFreeShipCode = { code };
      
      // ✅ ÁP DỤNG FREE SHIP: Set phí ship = 0
      await displayAppliedPromo(code, 'free_ship');
      
      // Cập nhật shipping fee về 0
      window.currentShippingFee = 0;
      const shippingElement = document.getElementById('shipping');
      if (shippingElement) {
        shippingElement.textContent = 'Miễn phí';
        shippingElement.style.color = '#27ae60';
      }
      
      // ẨN thông tin giảm ship theo thẻ hội viên (vì đã free ship rồi)
      const memberTierRow = document.getElementById('member-tier-row');
      const shippingOriginalRow = document.getElementById('shipping-original-row');
      const shippingDiscountRow = document.getElementById('shipping-discount-row');
      if (memberTierRow) memberTierRow.style.display = 'none';
      if (shippingOriginalRow) shippingOriginalRow.style.display = 'none';
      if (shippingDiscountRow) shippingDiscountRow.style.display = 'none';
      
      // Tính lại tổng
      let subtotal = selectedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
      let discount = 0;
      
      if (appliedDiscountCode) {
        // Nếu có mã giảm giá đã áp dụng, tính lại
        const discountRes = await fetch(`http://localhost:5000/api/khuyenmai/apply-to-cart`, {
          method: 'POST',
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${getToken()}`
          },
          body: JSON.stringify({
            code: appliedDiscountCode.code,
            cartItems: selectedItems.map(i => ({ MaSP: i.id, DonGia: i.price, SoLuong: i.quantity })),
            makh: getUserId()
          })
        });
        const discountData = await discountRes.json();
        if (discountData.success) {
          discount = discountData.discountDetails.totalDiscount;
        }
      }
      
      // ✅ FIX: Truyền shippingInfo = null để ẨN giảm ship hội viên
      updateSummary(subtotal, discount, 0, null); // shipping = 0, shippingInfo = null
      
      showToast(`✅ Đã áp dụng mã Free Ship: ${code}`);
      
    } else {
      // ============= MÃ GIẢM GIÁ =============
      if (appliedDiscountCode) {
        // If the same discount code is being reapplied, just update UI and inform
        if (appliedDiscountCode.code === code) {
          showToast(`Mã "${code}" đã được áp dụng`);
          if (clickedBtn) {
            clickedBtn.textContent = '✓ Đã áp dụng';
            clickedBtn.style.background = '#27ae60';
            clickedBtn.disabled = true;
          }
          return;
        }

        showToast(`Đã áp dụng mã giảm giá: ${appliedDiscountCode.code}. Vui lòng xóa mã cũ trước!`);
        if (clickedBtn && typeof originalText === 'string') {
          clickedBtn.disabled = false;
          clickedBtn.textContent = originalText;
        }
        return;
      }
      
      // ✅ CHO PHÉP GỌI API NGAY CẢ KHI GIỎ TRỐNG (backend sẽ trả về gợi ý)
      const res = await fetch(`http://localhost:5000/api/khuyenmai/apply-to-cart`, {
        method: 'POST',
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${getToken()}`
        },
        body: JSON.stringify({
          code: code,
          cartItems: selectedItems.map(item => ({
            MaSP: item.id,
            DonGia: item.price,
            SoLuong: item.quantity
          })),
          makh: getUserId()
        })
      });
      
      // ✅ DEBUG: Log status và response
      console.log('API Response Status:', res.status);
      console.log('API Response OK:', res.ok);
      
      // ✅ FIX: Xử lý trường hợp response không phải JSON
      let data;
      try {
        const responseText = await res.text();
        console.log('API Response Text:', responseText);
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('❌ Lỗi parse JSON:', parseError);
        showToast('Lỗi kết nối server. Vui lòng thử lại!');
        if (clickedBtn && originalText) {
          clickedBtn.disabled = false;
          clickedBtn.textContent = originalText;
        }
        return;
      }
      
      console.log('API Response Data:', data);
      
      // ✅ XỬ LÝ LỖI: Kiểm tra status code để hiển thị modal gợi ý
      if (!res.ok || !data.success) {
        // Status 402: Không có sản phẩm khuyến mãi trong giỏ
        // Status 403: Không đủ điều kiện (tiền/số lượng)
        if (res.status === 402 || res.status === 403) {
          console.log('🔍 Hiển thị modal gợi ý sản phẩm...');
          showProductSuggestionModal(data, code);
          // ✅ FIX: RETURN thay vì throw để không log error
          if (clickedBtn && originalText) {
            clickedBtn.disabled = false;
            clickedBtn.textContent = originalText;
          }
          return; // Dừng lại, không throw error
        }
        
        showToast(data.error || "Không thể áp dụng mã");
        throw new Error(data.error);
      }
      
      const discountDetails = data.discountDetails;
      appliedDiscountCode = { code, details: discountDetails };
      
      // ÁP DỤNG GIẢM GIÁ
      const totalDiscount = discountDetails.totalDiscount || 0;
      totalAmountDiscouted = discountDetails.totalFinal || discountDetails.total;
      
      await displayAppliedPromo(code, 'discount', discountDetails);
      
      // ✅ FIX: Tính lại ĐÚNG shippingInfo khi áp mã giảm giá
      let currentShipping = 0;
      let shippingInfo = null;
      
      const provinceSelect = document.getElementById('tinhthanh');
      if (provinceSelect && provinceSelect.value && !appliedFreeShipCode) {
        // Chỉ tính ship nếu đã chọn địa chỉ VÀ chưa có Free Ship
        const selectedOption = provinceSelect.options[provinceSelect.selectedIndex];
        const provinceName = selectedOption.dataset.provinceName || selectedOption.textContent;
        const totalWeight = await getTotalWeight();
        const customerTier = getCustomerTier();
        
        // Tính phí ship (trả về object với original, final, discount, tierDiscount)
        shippingInfo = calculateShippingFee(provinceName, totalWeight, customerTier);
        currentShipping = shippingInfo.final;
        window.currentShippingFee = currentShipping;
      } else if (appliedFreeShipCode) {
        // Nếu đã có Free Ship, giữ shipping = 0
        currentShipping = 0;
        shippingInfo = null;
        window.currentShippingFee = 0;
      } else {
        // Chưa chọn địa chỉ
        currentShipping = window.currentShippingFee || 0;
      }
      
      // ✅ FIX: Truyền đủ 4 tham số, bao gồm shippingInfo
      updateSummary(discountDetails.subtotal, totalDiscount, currentShipping, shippingInfo);
      
      showToast(`✅ Đã áp dụng mã giảm giá: ${code} (-${formatPrice(totalDiscount)})`);
    }
    
    if (clickedBtn) {
      clickedBtn.textContent = '✓ Đã áp dụng';
      clickedBtn.style.background = '#27ae60';
      clickedBtn.disabled = true;
    }
    
  } catch (error) {
    console.error('Lỗi áp dụng mã:', error);
    if (clickedBtn && originalText) {
      clickedBtn.disabled = false;
      clickedBtn.textContent = originalText;
    }
  }
}

// Show banner offering to restore previous cart
function showRestoreBanner() {
  const existing = document.getElementById('restore-banner');
  if (existing) return;
  const banner = document.createElement('div');
  banner.id = 'restore-banner';
  banner.style.position = 'fixed';
  banner.style.top = '80px';
  banner.style.right = '20px';
  banner.style.zIndex = '1200';
  banner.style.background = '#fff3cd';
  banner.style.border = '1px solid #ffeeba';
  banner.style.padding = '12px 16px';
  banner.style.borderRadius = '8px';
  banner.style.boxShadow = '0 6px 18px rgba(0,0,0,0.08)';
  banner.innerHTML = `
    <div style="display:flex;gap:10px;align-items:center;">
      <div style="flex:1;">Bạn vừa chọn 'Mua lại'. Muốn khôi phục giỏ hàng trước đó hoặc giữ các mặt hàng mới?</div>
      <div style="display:flex;gap:8px;">
        <button id="restore-cart-btn" class="btn" style="background:#28a745;color:white;">Khôi phục</button>
        <button id="keep-reorder-btn" class="btn btn-secondary">Giữ sản phẩm mới</button>
      </div>
    </div>
  `;
  document.body.appendChild(banner);

  document.getElementById('restore-cart-btn').addEventListener('click', async () => {
    await restoreCartFromBackup();
    removeRestoreBanner();
  });
  document.getElementById('keep-reorder-btn').addEventListener('click', () => {
    // Remove backup, keep current cart
    localStorage.removeItem('cart_backup_before_reorder');
    localStorage.removeItem('reorder_meta');
    removeRestoreBanner();
  });
}

function removeRestoreBanner() {
  const el = document.getElementById('restore-banner');
  if (el) el.remove();
}

// Restore cart either by syncing backup to server (if logged in) or replacing localStorage cart
async function restoreCartFromBackup() {
  try {
    const raw = localStorage.getItem('cart_backup_before_reorder');
    if (!raw) return false;
    const backup = JSON.parse(raw);

    if (isLoggedIn()) {
      // send restore to server: delete current cart and insert backup items
      try {
        // Clear server cart first
        await fetch('http://localhost:5000/api/cart/clear', {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${getToken()}` }
        });

        // Add each backup item
        for (const it of backup) {
          await fetch('http://localhost:5000/api/cart/add', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
            body: JSON.stringify({ productId: it.id, quantity: it.quantity })
          });
        }
      } catch (err) {
        console.warn('Server restore failed, falling back to local restore', err);
        localStorage.setItem('cart', JSON.stringify(backup));
      }
    } else {
      // Not logged in — just restore local cart
      localStorage.setItem('cart', JSON.stringify(backup));
    }

    // remove backup after restore and re-render
    localStorage.removeItem('cart_backup_before_reorder');
    localStorage.removeItem('reorder_meta');
    await renderCart();
    showToast('Giỏ hàng đã được khôi phục');
    return true;
  } catch (e) {
    console.error('Restore failed', e);
    showToast('Không thể khôi phục giỏ hàng');
    return false;
  }
}

// If user navigates away without confirming, try to restore using sendBeacon to server (best-effort)
window.addEventListener('pagehide', () => {
  try {
    const meta = localStorage.getItem('reorder_meta');
    const backup = localStorage.getItem('cart_backup_before_reorder');
    if (!meta || !backup) return;
    // attempt sendBeacon to server to persist backup restore request
    if (navigator.sendBeacon) {
      const payload = JSON.stringify({ backup: JSON.parse(backup) });
      const url = 'http://localhost:5000/api/cart/restore-beacon';
      navigator.sendBeacon(url, new Blob([payload], { type: 'application/json' }));
    }
  } catch (e) { /* ignore */ }
});

// Auto-checkout when redirected from 'reorder' flow
document.addEventListener('DOMContentLoaded', () => {
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get('autoCheckout') === '1') {
      // Wait for renderCart to finish (it dispatches 'cart:rendered')
      const doCheckout = () => {
        const checkoutBtn = document.getElementById('checkout-btn');
        if (checkoutBtn) {
          // small delay to ensure UI is interactive
          setTimeout(() => checkoutBtn.click(), 300);
        } else {
          // fallback: scroll to checkout area
          const checkout = document.querySelector('.checkout-section');
          if (checkout) checkout.scrollIntoView({ behavior: 'smooth' });
        }
      };

      window.addEventListener('cart:rendered', function handler() {
        window.removeEventListener('cart:rendered', handler);
        doCheckout();
      });

      // safety timeout if event never fires
      setTimeout(() => {
        doCheckout();
      }, 2500);
    }
  } catch (e) { console.warn('autoCheckout init failed', e); }
});

// Export functions
window.addToCart = addToCart;
window.getCart = getCart;

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

    // Helper function to get address names from IDs
    async function getAddressNames(provinceId, districtId, wardIdentifier) {
      try {
        const response = await fetch(`http://localhost:5000/api/address/full/${provinceId}/${districtId}/${encodeURIComponent(wardIdentifier)}`);
        if (!response.ok) {
          console.warn('API response not ok:', response.status);
          return null;
        }
        const data = await response.json();
        return data; // { city: "...", district: "...", ward: "..." }
      } catch (e) {
        console.warn('Failed to fetch address names', e);
        return null;
      }
    }

    // Process each address
    for (const addr of list) {
      const option = document.createElement('option');
      
      // Get raw values (could be IDs or names)
      const provinceVal = addr.TinhThanh || addr.province || addr.provinceCode || addr.provinceName || '';
      const districtVal = addr.QuanHuyen || addr.district || addr.districtCode || addr.districtName || '';
      const wardVal = addr.PhuongXa || addr.ward || addr.wardCode || addr.wardName || '';
      const detailVal = addr.DiaChiChiTiet || addr.detail || addr.address || '';

      console.log('🔍 Raw address values:', { provinceVal, districtVal, wardVal, detailVal });

      // Check if values are numeric IDs or already names
      let provinceName = provinceVal;
      let districtName = districtVal;
      let wardName = wardVal;

      // Check if province and district are numeric IDs
      const isProvinceNumeric = /^\d+$/.test(String(provinceVal));
      const isDistrictNumeric = /^\d+$/.test(String(districtVal));
      
      // Ward might be numeric or already a name
      const isWardNumeric = /^\d+$/.test(String(wardVal));

      // If province and district are numeric, fetch the names
      if (isProvinceNumeric && isDistrictNumeric) {
        console.log('✅ Province and district are numeric, fetching names...');
        const names = await getAddressNames(provinceVal, districtVal, wardVal);
        console.log('📦 API Response:', names);
        if (names) {
          provinceName = names.city || provinceVal;
          districtName = names.district || districtVal;
          wardName = names.ward || wardVal;
          console.log('✅ Converted to names:', { provinceName, districtName, wardName });
        } else {
          console.warn('❌ API returned null');
        }
      } else {
        console.log('⚠️ Not all numeric, using raw values');
      }

      // store minimal JSON as value so we can repopulate fields easily
      const payload = {
        id: addr.MaDiaChi || addr.id || addr.addressId || null,
        name: addr.TenNguoiNhan || addr.recipientName || addr.name || '',
        phone: addr.SDT || addr.recipientPhone || addr.phone || '',
        detail: detailVal,
        province: provinceVal, // Keep ID for form filling
        district: districtVal,
        ward: wardVal,
        provinceName: provinceName, // Store name for display
        districtName: districtName,
        wardName: wardName
      };
      
      option.value = JSON.stringify(payload);
      // Display with names instead of IDs
      const displayText = `${detailVal || ''}${wardName ? ', ' + wardName : ''}${districtName ? ', ' + districtName : ''}${provinceName ? ', ' + provinceName : ''}`;
      console.log('📝 Display text:', displayText);
      option.textContent = displayText;
      select.appendChild(option);
    }

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
    // Chỉ khởi tạo map nếu ở trang cart
    const isCartPage = window.location.pathname.includes('cart.html');
    if (!isCartPage) return;
    
    // if Leaflet already present, init immediately; otherwise wait a short time
    if (window.L) initLeaflet();
    else {
      let waited = 0;
      const intv = setInterval(() => {
        if (window.L) { clearInterval(intv); initLeaflet(); }
        waited += 100;
        if (waited > 3000) { clearInterval(intv); /* Không log warning nữa */ }
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
