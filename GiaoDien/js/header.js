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
  const user = JSON.parse(localStorage.getItem('user') || localStorage.getItem('loggedInUser') || '{}');
  console.log("User:", user);

  const loginLink = document.getElementById('loginLink');
  const loggedInAccount = document.querySelector('.logged-in-account');
  const accountLink = document.getElementById('accountLink');

  if (user && (user.tenkh || user.hoten || user.username || user.makh)) {
    if (loginLink) loginLink.style.display = 'none';
    if (loggedInAccount) {
      loggedInAccount.style.display = 'inline-block';
      if (accountLink) {
        accountLink.innerHTML = `<i class="fas fa-user"></i> ${user.tenkh || user.hoten || user.username}`;
      }
    }
    const accountDropdown = document.querySelector('.account-dropdown .dropdown-content');
    if (accountDropdown) accountDropdown.style.display = 'none';
  } else {
    if (loginLink) loginLink.style.display = 'inline-block';
    if (loggedInAccount) loggedInAccount.style.display = 'none';
  }
}

// Thiết lập đăng xuất
function setupLogout() {
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      const token = localStorage.getItem('token');
      if (token) {
        try {
          await fetch('http://localhost:5000/api/client/cart/clear', {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          });
        } catch (error) {
          console.error('Lỗi xóa giỏ hàng khi logout:', error);
        }
      }
      localStorage.removeItem('user');
      localStorage.removeItem('loggedInUser');
      localStorage.removeItem('token');
      localStorage.removeItem('cart');
      window.location.href = 'index.html';
    });
  }
}
// Cập nhật số lượng giỏ hàng
async function updateCartCount() {
  const user = JSON.parse(localStorage.getItem('user') || localStorage.getItem('loggedInUser') || '{}');
  const cartLink = document.querySelector('.top-links li a[href="cart.html"]');
  if (!cartLink) return;

  if (user && (user.makh || user.tenkh)) {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/client/cart', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json; charset=utf-8'
        }
      });
      if (response.ok) {
        const cart = await response.json();
        const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
        cartLink.innerHTML = `<i class="fas fa-shopping-cart"></i> Giỏ hàng (${cartCount})`;
        return;
      }
    } catch (error) {
      console.error('Lỗi cập nhật giỏ hàng:', error);
    }
  }

  const localCart = JSON.parse(localStorage.getItem('cart') || '[]');
  const localCartCount = localCart.reduce((total, item) => total + item.quantity, 0);
  cartLink.innerHTML = `<i class="fas fa-shopping-cart"></i> Giỏ hàng (${localCartCount})`;
}


async function searchProduct(value) {
  try {
    const response = await fetch(
      `http://localhost:5000/api/product/search-product?search=${value}`
    );
    if (response.ok) {
      const result = await response.json();
      return result;
    }
  } catch (error) {
    console.error("Error fetching products:", error);
    showAlert("Lỗi khi tải sản phẩm", "error");
    return null;
  }
}

const renderProductSearch = (productsFond, data) => {
  if (!data || !Array.isArray(data)) return;
  productsFond.innerHTML = "";

  data.slice(0, 6).forEach((itemData) => {
    console.log(itemData.TenSP);
    const item = document.createElement("div");
    const img = document.createElement("img");
    const p = document.createElement("p");

    item.classList.add("item");
    img.src = "img/product/" + itemData.HinhAnh;
    p.textContent = itemData.TenSP;

    item.appendChild(img);
    item.appendChild(p);
    productsFond.appendChild(item);
  });
};


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
  searchHistory.unshift(value);

  if (searchHistory.length > 5) {
    searchHistory.pop();
  }

  localStorage.setItem("historySearch", JSON.stringify(searchHistory));
}

function renderHistory() {
  const historyContainer = document.getElementById("history");
  historyContainer.innerHTML = "";
  searchHistory.forEach((word, index) => {
    let tag = document.createElement("div");
    tag.classList.add("tag");
    tag.innerHTML = `${word} <span onclick="removeHistory(${index})">&times;</span>`;
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


