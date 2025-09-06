const API_URL = 'http://localhost:5000/api/author';
const ITEMS_PER_PAGE = 10;
const IMAGE_BASE_URL = 'img/author/'; // Cập nhật đường dẫn thư mục ảnh

let currentPage = 1;
let totalPages = 1;
let searchTerm = '';

async function fetchAuthors(page = 1, search = '') {
  try {
    document.getElementById('author-list').innerHTML = '<div class="loading">Đang tải...</div>';
    
    console.log(`Fetching authors: page=${page}, search=${search}`); // Debug
    const response = await fetch(`${API_URL}?page=${page}&limit=${ITEMS_PER_PAGE}&search=${encodeURIComponent(search)}`, {
      headers: {
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('API response:', data); // Debug
    
    if (!data.data || !data.pagination) {
      throw new Error('Invalid API response format');
    }

    const { data: authors, pagination } = data;
    
    totalPages = pagination.totalPages || 1;
    currentPage = pagination.page || 1;
    
    updatePagination();
    renderAuthors(authors);
  } catch (error) {
    console.error('Error fetching authors:', error);
    document.getElementById('author-list').innerHTML = 
      `<div class="error">Lỗi khi tải danh sách tác giả: ${error.message}</div>`;
  }
}

function renderAuthors(authors) {
  const authorList = document.getElementById('author-list');
  authorList.innerHTML = '';

  if (!authors || authors.length === 0) {
    authorList.innerHTML = '<div class="no-results">Không tìm thấy tác giả</div>';
    return;
  }

  authors.forEach(author => {
    const authorCard = document.createElement('div');
    authorCard.className = 'author-card';
    const imageUrl = author.AnhTG ? `${IMAGE_BASE_URL}${author.AnhTG}` : 'img/placeholder.jpg';
    authorCard.innerHTML = `
      <img src="${imageUrl}" alt="${author.TenTG}" onerror="this.src='img/placeholder.jpg'">
      <div class="author-info">
        <h3>${author.TenTG}</h3>
        <p>Quốc tịch: ${author.QuocTich || 'Không rõ'}</p>
      </div>
    `;
    authorCard.addEventListener('click', () => showAuthorModal(author));
    authorList.appendChild(authorCard);
  });
}

function updatePagination() {
  const pageInfo = document.getElementById('page-info');
  const prevButton = document.getElementById('prev-page');
  const nextButton = document.getElementById('next-page');

  pageInfo.textContent = `Trang ${currentPage} / ${totalPages}`;
  prevButton.disabled = currentPage === 1;
  nextButton.disabled = currentPage === totalPages;
}

function showAuthorModal(author) {
  const modal = document.getElementById('author-modal');
  document.getElementById('modal-author-name').textContent = author.TenTG;
  document.getElementById('modal-author-image').src = author.AnhTG ? `${IMAGE_BASE_URL}${author.AnhTG}` : 'img/placeholder.jpg';
  document.getElementById('modal-author-birthday').textContent = 
    author.NgaySinh ? new Date(author.NgaySinh).toLocaleDateString('vi-VN') : 'Không rõ';
  document.getElementById('modal-author-nationality').textContent = author.QuocTich || 'Không rõ';
  document.getElementById('modal-author-bio').textContent = author.TieuSu || 'Không có tiểu sử';
  
  modal.style.display = 'block';
}

function setupEventListeners() {
  document.getElementById('prev-page').addEventListener('click', () => {
    if (currentPage > 1) {
      fetchAuthors(currentPage - 1, searchTerm);
    }
  });

  document.getElementById('next-page').addEventListener('click', () => {
    if (currentPage < totalPages) {
      fetchAuthors(currentPage + 1, searchTerm);
    }
  });

  document.getElementById('search-input').addEventListener('input', (e) => {
    searchTerm = e.target.value.trim();
    fetchAuthors(1, searchTerm);
  });

  document.querySelector('.close').addEventListener('click', () => {
    document.getElementById('author-modal').style.display = 'none';
  });

  window.addEventListener('click', (event) => {
    const modal = document.getElementById('author-modal');
    if (event.target === modal) {
      modal.style.display = 'none';
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
  fetchAuthors();
});