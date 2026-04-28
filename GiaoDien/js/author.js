const _apiBase = (window.API_CONFIG && window.API_CONFIG.BASE_URL) || window.API_CONFIG.BASE_URL;
const API_URL = `${_apiBase}/api/author`;
const IMAGE_BASE_URL = 'img/author/';
const PRODUCT_IMAGE_BASE_URL = 'img/product/';
const ITEMS_PER_PAGE = 5;

let currentPage = 1;
let totalPages = 1;
let searchTerm = '';
let currentNationality = '';

/* -------------------- FETCH AUTHORS -------------------- */
async function fetchAuthorsByNationality(page = 1, nationality = '', search = '') {
  const authorList = document.getElementById('author-list');
  authorList.innerHTML = '<div class="loading">Đang tải...</div>';

  try {
    let url;
    if (nationality) {
      url = `${API_URL}/by-nationality?page=${page}&limit=${ITEMS_PER_PAGE}&nationality=${encodeURIComponent(nationality)}`;
    } else {
      url = `${API_URL}?page=${page}&limit=${ITEMS_PER_PAGE}&search=${encodeURIComponent(search)}`;
    }

    const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();
    
    // ✅ FIX: Robustly extract authors array from multiple possible response formats
    let authors = [];
    if (Array.isArray(data)) {
      authors = data;
    } else if (data && Array.isArray(data.data)) {
      authors = data.data;
    } else if (data && Array.isArray(data.authors)) {
      authors = data.authors;
    } else if (data && typeof data === 'object') {
      // If it's an object but doesn't have data/authors, it might be a single author object or an unexpected format
      console.warn('⚠️ API returned an unexpected object format for authors:', data);
    }
    
    const pagination = data?.pagination || { page: 1, totalPages: 1 };
    
    if (authors.length === 0) {
      console.warn('⚠️ No authors found in the response:', data);
    }

    const respPage = pagination.page || 1;
    const respTotalPages = pagination.totalPages || 1;
    
    currentPage = respPage;
    totalPages = respTotalPages;

    renderAuthors(authors);
    updatePagination();
  } catch (err) {
    console.error('Lỗi khi tải tác giả:', err);
    authorList.innerHTML = `<div class="error">Không thể tải danh sách tác giả: ${err.message}</div>`;
  }
}

/* -------------------- RENDER AUTHORS -------------------- */
function renderAuthors(authors = []) {
  const authorList = document.getElementById('author-list');
  authorList.innerHTML = '';

  if (authors.length === 0) {
    authorList.innerHTML = '<div class="no-results">Không tìm thấy tác giả nào</div>';
    return;
  }

  authors.forEach(author => {
    const imageUrl = author.AnhTG
      ? `${IMAGE_BASE_URL}${author.AnhTG}`
      : 'img/author/icon.jpg';

    const card = document.createElement('div');
    card.className = 'author-card';
    card.innerHTML = `
      <img src="${imageUrl}" alt="${author.TenTG}" onerror="this.src='img/author/icon.jpg'">
      <div class="author-info">
        <h3>${author.TenTG}</h3>
        <p>Quốc tịch: ${author.QuocTich || 'Không rõ'}</p>
      </div>
    `;
    card.addEventListener('click', () => showAuthorModal(author));
    authorList.appendChild(card);
  });
}

/* -------------------- PAGINATION -------------------- */
function updatePagination() {
  const pageInfo = document.getElementById('page-info');
  const prevBtn = document.getElementById('prev-page');
  const nextBtn = document.getElementById('next-page');

  pageInfo.textContent = `Trang ${currentPage} / ${totalPages}`;
  prevBtn.disabled = currentPage <= 1;
  nextBtn.disabled = currentPage >= totalPages;

  // Cập nhật sự kiện cho pagination
  prevBtn.onclick = () => {
    if (currentPage > 1) fetchAuthorsByNationality(currentPage - 1, currentNationality, searchTerm);
  };
  nextBtn.onclick = () => {
    if (currentPage < totalPages) fetchAuthorsByNationality(currentPage + 1, currentNationality, searchTerm);
  };
}

/* -------------------- FETCH AUTHOR DETAIL + BOOKS -------------------- */
async function fetchAuthorDetail(maTG) {
  try {
    const res = await fetch(`${API_URL}/${maTG}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('Lỗi tải chi tiết tác giả:', err);
    return null;
  }
}

/* -------------------- SHOW AUTHOR MODAL -------------------- */
async function showAuthorModal(author) {
  const modal = document.getElementById('author-modal');
  const fullAuthor = await fetchAuthorDetail(author.MaTG);
  if (!fullAuthor) {
    alert('Không thể tải thông tin tác giả');
    return;
  }

  document.getElementById('modal-author-name').textContent = fullAuthor.TenTG;
  document.getElementById('modal-author-image').src = fullAuthor.AnhTG
    ? `${IMAGE_BASE_URL}${fullAuthor.AnhTG}`
    : 'img/author/icon.jpg';
  document.getElementById('modal-author-birthday').textContent =
    fullAuthor.NgaySinh ? new Date(fullAuthor.NgaySinh).toLocaleDateString('vi-VN') : 'Không rõ';
  document.getElementById('modal-author-nationality').textContent = fullAuthor.QuocTich || 'Không rõ';
  document.getElementById('modal-author-bio').textContent = fullAuthor.TieuSu || 'Không có tiểu sử';

  modal.style.display = 'block';

  // Target the modal's specific books container by ID to avoid selecting an unintended `.books` elsewhere
  const booksContainer = document.getElementById('modal-author-products');
  booksContainer.innerHTML = '';

  if (!fullAuthor.books || fullAuthor.books.length === 0) {
    booksContainer.innerHTML = '<div class="no-books">Không có tác phẩm nào</div>';
    return;
  }
  // Show only up to 5 books in the modal
  console.log('DEBUG: fullAuthor.books', fullAuthor.books);
  let booksList = Array.isArray(fullAuthor.books) ? fullAuthor.books.slice() : [];

  // If server returned fewer than 5 books, try a fallback call to products endpoint to fetch more
  if (booksList.length < 5) {
    try {
      // Use the correct products endpoint registered on the server ('/api/product')
      const prodRes = await fetch(`${API_URL.replace('/author', '/product')}?MaTG=${author.MaTG}&limit=10`, { headers: { 'Accept': 'application/json' } });
      if (prodRes.ok) {
        const prodData = await prodRes.json();
        // productRoutes returns array of products for listing; ensure array
        const productsArray = Array.isArray(prodData) ? prodData : (prodData.data || []);
        console.log('DEBUG: fallback products length', productsArray.length);

        // Merge products that are not already in booksList (by MaSP)
        const existingIds = new Set(booksList.map(b => String(b.MaSP)));
        for (const p of productsArray) {
          if (booksList.length >= 5) break;
          const pid = String(p.MaSP || p.masAnPham || p.id || '');
          if (!existingIds.has(pid)) {
            // Normalize product shape to match expected fields (MaSP, TenSP, HinhAnh)
            booksList.push({ MaSP: p.MaSP, TenSP: p.TenSP || p.TenSP, HinhAnh: p.HinhAnh });
            existingIds.add(pid);
          }
        }
      } else {
        console.warn('Fallback products endpoint returned non-OK response', prodRes.status);
      }
    } catch (err) {
      console.warn('Fallback products fetch failed', err);
    }
  }

  const booksToShow = booksList.slice(0, 5);
  console.log('DEBUG: booksToShow length', booksToShow.length);

  booksToShow.forEach(book => {
    console.log('DEBUG: rendering book', book.MaSP, book.TenSP);
    const bookImage = book.HinhAnh ? `${PRODUCT_IMAGE_BASE_URL}${book.HinhAnh}` : 'img/author/icon.jpg';
    const bookEl = document.createElement('div');
    bookEl.className = 'book';
    bookEl.innerHTML = `
      <div class="book-image">
        <img src="${bookImage}" alt="${book.TenSP}">
      </div>
      <div class="book-name">${book.TenSP}</div>
    `;
    bookEl.addEventListener('click', () => loadProductDetail(book.MaSP));
    booksContainer.appendChild(bookEl);
  });

  // Hide scroll buttons if there are 5 or fewer books
  const leftBtn = document.querySelector('.scroll-btn.left');
  const rightBtn = document.querySelector('.scroll-btn.right');
  if (leftBtn && rightBtn) {
    if (booksToShow.length <= 5) {
      leftBtn.style.display = 'none';
      rightBtn.style.display = 'none';
    } else {
      leftBtn.style.display = '';
      rightBtn.style.display = '';
    }
  }
}

/* -------------------- EVENT LISTENERS -------------------- */
function setupEventListeners() {
  const searchInput = document.getElementById('search-input-author');
  const closeBtn = document.querySelector('.close');
  const modal = document.getElementById('author-modal');

  searchInput.addEventListener('input', e => {
    searchTerm = e.target.value.trim();
    fetchAuthorsByNationality(1, currentNationality, searchTerm);
  });

  closeBtn.addEventListener('click', () => (modal.style.display = 'none'));
  window.addEventListener('click', e => (e.target === modal) && (modal.style.display = 'none'));
}

/* -------------------- SCROLL FUNCTION -------------------- */
function setupHorizontalScroll(containerSelector, leftBtnSelector, rightBtnSelector, scrollAmount = 200) {
  const wrapper = document.querySelector(containerSelector);
  const btnLeft = document.querySelector(leftBtnSelector);
  const btnRight = document.querySelector(rightBtnSelector);
  if (!wrapper || !btnLeft || !btnRight) return;

  btnLeft.addEventListener('click', () => wrapper.scrollBy({ left: -scrollAmount, behavior: 'smooth' }));
  btnRight.addEventListener('click', () => wrapper.scrollBy({ left: scrollAmount, behavior: 'smooth' }));
}

/* -------------------- INIT -------------------- */
document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
  setupHorizontalScroll('.books', '.scroll-btn.left', '.scroll-btn.right');

  const urlParams = new URLSearchParams(window.location.search);
  currentNationality = urlParams.get('nationality') || '';

  fetchAuthorsByNationality(1, currentNationality);

  // If another page requested opening a specific author, open it now.
  // Product detail page sets `localStorage.selectedAuthorId` before redirecting here.
  try {
    const selectedAuthorId = localStorage.getItem('selectedAuthorId');
    if (selectedAuthorId) {
      localStorage.removeItem('selectedAuthorId');
      // showAuthorModal expects an author object with MaTG property
      showAuthorModal({ MaTG: selectedAuthorId });
    }
  } catch (err) {
    console.warn('Error while opening selected author from localStorage', err);
  }
});

/* -------------------- PRODUCT DETAIL REDIRECT -------------------- */
window.loadProductDetail = function (productId) {
  localStorage.setItem('selectedProductId', productId);
  window.location.href = 'product_detail.html';
};

