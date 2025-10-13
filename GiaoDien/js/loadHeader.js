async function loadHeader() {
  try {
    const response = await fetch("components/header.html");
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    const data = await response.text();
    const container = document.getElementById("load-header");
    if (!container) {
      console.error("Không tìm thấy #load-header trong trang!");
      return;
    }
    container.innerHTML = data;

    const script = document.createElement("script");
    script.src = "js/header.js";
    script.onload = () => {
      if (typeof checkLoginStatus === "function") checkLoginStatus();
      if (typeof setupDropdownHover === "function") {
        setupDropdownHover('.publisher-dropdown');
        setupDropdownHover('.category-top-dropdown');
      }
      if (typeof updateCartCount === "function") updateCartCount();
      if (typeof setupLogout === "function") setupLogout();
      handleSearch();
      if (typeof renderHistory === 'function') renderHistory();

      if (typeof loadListProductSearch === "function") {
        const currentPath = window.location.pathname;
        if (currentPath.endsWith("/GiaoDien/book.html")) {
          loadListProductSearch();
        }
        if (currentPath.endsWith("/GiaoDien/book.html")) {
          loadListProductSearch().then(() => {
            const searchParams = new URLSearchParams(window.location.search);
            if (searchParams.has("category")) {
              filterProductsByCategoryOnHeader();
            }
          });
        }
      }

    };
    script.onerror = () => console.error("Không load được header.js!");
    document.body.appendChild(script);

  } catch (error) {
    console.error("Không thể load header:", error);
  }
}

function handleSearch() {
  const searchInput = document.getElementById("search-input");
  const suggestionBox = document.querySelector(".suggestion-box");

  if (!searchInput || !suggestionBox) {
    return;
  }

  // xử lý tìm kiếm sản phẩm và ẩn hiện box đề xua
  searchInput.addEventListener("input", () => {
    console.log("cá", searchInput.value)
    if (!searchInput.value) {
      suggestionBox.style.display = "none";
    } else {
      suggestionBox.style.display = "block";
    }
    if (typeof useSearch === "function") {
      useSearch(searchInput.value);
    }
  });
  handleSearchHistory();
}



const handleSearchHistory = () => {
  const form = document.getElementById("search-form");
  const searchInput = document.getElementById("search-input");

  if (!form || !searchInput) {
    return;
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const value = searchInput.value.trim();
    if (value) {
      addSearchHistory(value);
      searchInput.value = "";
      window.location.href = `/GiaoDien/book.html?search=` + encodeURIComponent(value);
    }
  });
};


document.addEventListener('DOMContentLoaded', () => {
  loadHeader();
});