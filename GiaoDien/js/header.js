// Hàm setup dropdown hover
function setupDropdownHover(selector) {
  const dropdown = document.querySelector(selector);
  if (dropdown) {
    dropdown.addEventListener('mouseenter', () => {
      dropdown.querySelector('.dropdown-content').style.display = 'block';
    });
    dropdown.addEventListener('mouseleave', () => {
      dropdown.querySelector('.dropdown-content').style.display = 'none';
    });
  }
}

// Kiểm tra trạng thái đăng nhập
function checkLoginStatus() {
  let user = {};
  try {
    const rawUser = localStorage.getItem('user') || localStorage.getItem('loggedInUser');
    if (rawUser && rawUser !== 'undefined' && rawUser !== 'null') {
      user = JSON.parse(rawUser);
    }
  } catch (error) {
    console.error('Lỗi parse thông tin user từ localStorage:', error);
    user = {};
  }

  const loginLink = document.getElementById('loginLink');
  const loginLinkDiv = document.getElementById('loginLinkDiv');
  const loggedInAccount = document.querySelector('.logged-in-account');
  const accountLink = document.getElementById('accountLink');
  const accountDropdown = document.querySelector('.account-dropdown .dropdown-content');

  if (user && (user.tenkh || user.hoten || user.username || user.makh)) {
    if (loggedInAccount) {
      loggedInAccount.classList.remove('hidden');
      loggedInAccount.style.display = 'flex';
      
      const usernameEl = loggedInAccount.querySelector('.username');
      if (usernameEl) {
        usernameEl.textContent = user.tenkh || user.hoten || user.username || 'Người dùng';
      }
    }
    if (loginLinkDiv) loginLinkDiv.style.display = 'none';
    if (loginLink) loginLink.style.display = 'none';
  } else {
    // Guest
    if (loginLinkDiv) loginLinkDiv.style.display = 'flex';
    if (loginLink) loginLink.style.display = 'flex';
    if (loggedInAccount) {
      loggedInAccount.classList.add('hidden');
      loggedInAccount.style.display = 'none';
    }
    if (accountDropdown) accountDropdown.style.display = ''; // Revert to CSS hover logic
  }
}

// Thiết lập đăng xuất
function setupLogout() {
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      localStorage.removeItem('user');
      localStorage.removeItem('loggedInUser');
      document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      localStorage.removeItem('cart');
      localStorage.removeItem('customerId');
      localStorage.removeItem('reorder_address');
      window.location.href = 'index.html';
    });
  }
}
// Cập nhật số lượng giỏ hàng
async function updateCartCount() {
  let user = {};
  try {
    const rawUser = localStorage.getItem('user') || localStorage.getItem('loggedInUser');
    if (rawUser && rawUser !== 'undefined' && rawUser !== 'null') {
      user = JSON.parse(rawUser);
    }
  } catch (error) {
    console.error('Lỗi parse user trong updateCartCount:', error);
    user = {};
  }
  
  const cartCountEl = document.getElementById('cart-count');
  if (!cartCountEl) return;

  let totalQuantity = 0;

  if (user && (user.makh || user.tenkh)) {
    try {
      const _apiBase = (window.API_CONFIG && window.API_CONFIG.BASE_URL) || window.API_CONFIG.BASE_URL;
      const token = (document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1] || null);
      const response = await fetch(`${_apiBase}/api/client/cart`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json; charset=utf-8'
        }
      });
      if (response.ok) {
        const responseData = await response.json();
        const cart = responseData.data || responseData;
        if (Array.isArray(cart)) {
          totalQuantity = cart.reduce((total, item) => total + item.quantity, 0);
        }
      }
    } catch (error) {
      console.error('Lỗi cập nhật giỏ hàng:', error);
    }
  } else {
    const localCart = JSON.parse(localStorage.getItem('cart') || '[]');
    totalQuantity = localCart.reduce((total, item) => total + item.quantity, 0);
  }

  cartCountEl.textContent = totalQuantity;
}


async function searchProduct(value) {
  try {
    const keyword = typeof value === 'string' ? value.trim() : '';
    if (!keyword) return [];

    const _apiBase = (window.API_CONFIG && window.API_CONFIG.BASE_URL) || window.API_CONFIG.BASE_URL;
    const response = await fetch(
      `${_apiBase}/api/product?search=${encodeURIComponent(keyword)}`
    );
    if (response.ok) {
      const result = await response.json();
      return result;
    }
    return [];
  } catch (error) {
    console.error("Error fetching products:", error);
    showAlert("Lỗi khi tải sản phẩm", "error");
    return [];
  }
}

const normalizeSearchProducts = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (payload && Array.isArray(payload.data)) return payload.data;
  if (payload && payload.success === true && Array.isArray(payload.data)) return payload.data;
  return [];
};

function renderProductSearch(productsFond, data) {
  if (!productsFond) return;
  const products = normalizeSearchProducts(data);
  productsFond.innerHTML = "";

  if (products.length === 0) {
    productsFond.innerHTML = `<div class="p-8 text-center text-gray-400 text-xs italic font-medium">Không tìm thấy sản phẩm nào phù hợp</div>`;
    return;
  }

  const _apiBase = (window.API_CONFIG && window.API_CONFIG.BASE_URL) || 'https://cnpm-websach-2.onrender.com';

  // Header Suggestion Grid Header
  const headerHint = document.createElement('div');
  headerHint.className = "px-5 py-3 border-b border-gray-50 flex justify-between items-center";
  headerHint.innerHTML = `<span class="text-[10px] font-black text-gray-400 uppercase tracking-widest">Sản phẩm gợi ý</span>`;
  productsFond.appendChild(headerHint);

  const grid = document.createElement('div');
  grid.className = "p-3 grid grid-cols-1 gap-1";
  productsFond.appendChild(grid);

  products.slice(0, 5).forEach((itemData) => {
    const item = document.createElement("div");
    item.className = "flex items-center gap-4 p-3 hover:bg-primary/5 rounded-2xl cursor-pointer transition-all group border border-transparent hover:border-primary/10";
    
    let imageUrl = 'img/default-book.jpg';
    if (window.API_CONFIG && typeof window.API_CONFIG.resolveImageUrl === 'function') {
        imageUrl = window.API_CONFIG.resolveImageUrl(itemData.HinhAnh || itemData.Anh);
    }

    item.innerHTML = `
      <div class="w-14 h-18 rounded-xl overflow-hidden shadow-sm group-hover:scale-105 transition-transform shrink-0 bg-gray-50">
        <img src="${imageUrl}" class="w-full h-full object-cover" onerror="this.onerror=null; this.src='img/default-book.jpg';">
      </div>
      <div class="flex-1 min-w-0">
        <h4 class="text-xs font-bold text-gray-800 truncate group-hover:text-primary transition-colors">${itemData.TenSP}</h4>
        <p class="text-[10px] text-gray-400 font-medium truncate">${itemData.TenTG || 'Đang cập nhật'}</p>
        <div class="mt-1">
          <span class="text-xs font-black text-primary">${(itemData.DonGia || 0).toLocaleString('vi-VN')}đ</span>
        </div>
      </div>
      <div class="opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0">
        <i class="fas fa-chevron-right text-[10px] text-primary"></i>
      </div>
    `;

    item.addEventListener("click", () => {
      loadProductDetailOnHeader(itemData.MaSP);
    });
    
    grid.appendChild(item);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.getElementById("header-search-input");
  const suggestionsBox = document.getElementById("header-search-suggestions");
  if (!searchInput || !suggestionsBox) return;

  searchInput.addEventListener("input", async (e) => {
    const value = e.target.value.trim();
    if (value.length > 0) {
      suggestionsBox.classList.remove("invisible", "opacity-0", "translate-y-4");
      suggestionsBox.classList.add("visible", "opacity-100", "translate-y-0");
      const result = await searchProduct(value);
      renderProductSearch(suggestionsBox, result);
    } else {
      suggestionsBox.classList.add("invisible", "opacity-0", "translate-y-4");
      suggestionsBox.classList.remove("visible", "opacity-100", "translate-y-0");
    }
  });

  // Close on outside click
  document.addEventListener("click", (e) => {
    if (!searchInput.contains(e.target) && !suggestionsBox.contains(e.target)) {
      suggestionsBox.classList.add("invisible", "opacity-0", "translate-y-4");
    }
  });
});

async function useSearch(value) {
  const productsFond = document.getElementById("products-fond");
  const result = await searchProduct(value);
  renderProductSearch(productsFond, result);
}

// js cho phầm tìm kiếm sản phẩm
let searchHistory = JSON.parse(localStorage.getItem("historySearch")) || [];

const addSearchHistory = (value) => {
  if (searchHistory.lengt === 0) {
    searchHistory.push(value);
  }
  searchHistory = searchHistory.filter(item => item !== value);
  searchHistory.unshift(value);

  if (searchHistory.length > 5) {
    searchHistory.pop();
  }

  localStorage.setItem("historySearch", JSON.stringify(searchHistory));
}

function renderHistory() {
  const productsFond = document.getElementById("products-fond");
  const historyContainer = document.getElementById("history");
  const searchInput = document.getElementById("search-input");
  if (!searchInput || !historyContainer) return;

  historyContainer.innerHTML = "";
  
  if (searchHistory.length === 0) {
    historyContainer.innerHTML = `<span class="text-[10px] text-gray-400 italic font-medium">Trống</span>`;
    return;
  }

  searchHistory.forEach((word, index) => {
    const tag = document.createElement("div");
    tag.className = "flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-full cursor-pointer transition-all group";
    
    tag.innerHTML = `
      <i class="fas fa-history text-[9px] text-gray-400"></i>
      <span class="text-[10px] font-bold">${word}</span>
      <button class="w-4 h-4 flex items-center justify-center rounded-full hover:bg-white text-gray-400 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100 ml-1">
        <i class="fas fa-times text-[8px]"></i>
      </button>
    `;

    // Click on name to search
    tag.querySelector('span').addEventListener("click", async (e) => {
      e.stopPropagation();
      searchInput.value = word;
      const result = await searchProduct(word);
      renderProductSearch(productsFond, result);
    });

    // Click on tag to search (if not on close button)
    tag.addEventListener("click", async (e) => {
      if (e.target.closest('button')) return;
      searchInput.value = word;
      const result = await searchProduct(word);
      renderProductSearch(productsFond, result);
    });

    // Click on close button to remove
    tag.querySelector('button').addEventListener("click", (e) => {
      e.stopPropagation();
      removeHistory(index);
    });

    historyContainer.appendChild(tag);
  });
}

function removeHistory(index) {
  if (index >= 0 && index < searchHistory.length) {
    searchHistory.splice(index, 1);
    localStorage.setItem("historySearch", JSON.stringify(searchHistory));
  } else {
    console.warn("Index không hợp lệ!");
  }
  renderHistory();
}

function clearHistory() {
  searchHistory = [];
  localStorage.setItem("historySearch", JSON.stringify(searchHistory));
  renderHistory();
}

loadProductDetailOnHeader = async function (productId) {
  let customerId = null;
  try {
    const userString = localStorage.getItem('user');
    if (userString) {
      const userObject = JSON.parse(userString);
      if (userObject && userObject.makh) {
        customerId = userObject.makh;
      }
    }
  } catch (error) {
    console.error("Lỗi khi đọc 'user' từ localStorage:", error);
  }
  try {
    await productViewActivity(productId, customerId);
  } catch (apiError) {
    console.error("Lỗi khi ghi log view:", apiError);
  }
  localStorage.setItem('selectedProductId', productId);
  window.location.href = `product_detail.html?MaSP=${productId}`;
}

