document.addEventListener('DOMContentLoaded', () => {
  checkLoginStatus();
  setupLogout();
  showSlides();
  setupCategoryDropdown();
  setupDropdownHover('.publisher-dropdown');
  setupDropdownHover('.category-top-dropdown');
  loadPromotions();
  updateCartCount();
  setupChat();
  setupFAQ();
});

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

function checkLoginStatus() {
  const user = JSON.parse(localStorage.getItem('user') || localStorage.getItem('loggedInUser') || '{}');
  const loginLink = document.getElementById('loginLink');
  const loggedInAccount = document.querySelector('.logged-in-account');
  const accountLink = document.getElementById('accountLink');

  if (user && (user.tenkh || user.hoten || user.username || user.makh)) {
    if (loginLink) loginLink.style.display = 'none';
    if (loggedInAccount) {
      loggedInAccount.style.display = 'inline-block';
      accountLink.innerHTML = `<i class="fas fa-user"></i> ${user.tenkh || user.hoten || user.username}`;
    }
    document.querySelector('.account-dropdown .dropdown-content').style.display = 'none';
  } else {
    if (loginLink) loginLink.style.display = 'inline-block';
    if (loggedInAccount) loggedInAccount.style.display = 'none';
  }
}

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
            headers: {
              'Authorization': `Bearer ${token}`
            }
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

let slideIndex = [0, 0];
const slideColumns = document.querySelectorAll('.slideshow-column');

function showSlides() {
  slideColumns.forEach((column, i) => {
    const slides = column.getElementsByClassName('mySlides');
    for (let j = 0; j < slides.length; j++) {
      slides[j].style.display = 'none';
    }
    slideIndex[i]++;
    if (slideIndex[i] > slides.length) slideIndex[i] = 1;
    slides[slideIndex[i] - 1].style.display = 'block';
  });
  setTimeout(showSlides, 3000);
}

function setupCategoryDropdown() {
  const categoryDropdown = document.getElementById('categoryDropdown');
  if (!categoryDropdown) return;

  const dropdownHeader = categoryDropdown.querySelector('.dropdown-header');
  if (dropdownHeader) {
    dropdownHeader.addEventListener('click', () => {
      categoryDropdown.classList.toggle('dropdown-active');
    });
  }

  document.addEventListener('click', (event) => {
    if (!categoryDropdown.contains(event.target)) {
      categoryDropdown.classList.remove('dropdown-active');
    }
  });
}

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

function formatPrice(price) {
  return new Intl.NumberFormat('vi-VN').format(price);
}

function formatDate(dateString) {
  const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
  return new Date(dateString).toLocaleDateString('vi-VN', options);
}

function escapeHtml(unsafe) {
  if (typeof unsafe !== 'string') {
    return ''; // Trả về chuỗi rỗng nếu unsafe không phải chuỗi
  }
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

let debounceTimer;

function loadPromotions() {
  const discountSelect = document.getElementById('discountSelect');
  const promotionsList = document.getElementById('promotions-list');
  const dealHotContainer = document.getElementById('deal-hot-list');

  if (!discountSelect || !promotionsList || !dealHotContainer) {
    console.error('Không tìm thấy discountSelect, promotions-list hoặc deal-hot-list');
    return;
  }

  discountSelect.innerHTML = '<option value="">Chọn chương trình khuyến mãi</option>';
  promotionsList.innerHTML = '<li>Đang tải khuyến mãi...</li>';
  dealHotContainer.innerHTML = '<div class="loading">Đang tải sản phẩm khuyến mãi...</div>';
  dealHotContainer.style.display = 'grid';

  fetch('http://localhost:5000/api/khuyenmai?activeOnly=true', {
    headers: {
      'Content-Type': 'application/json; charset=utf-8'
    }
  })
    .then(response => {
      if (!response.ok) throw new Error('Lỗi khi tải khuyến mãi');
      return response.json();
    })
    .then(data => {
      discountSelect.innerHTML = '<option value="">Chọn chương trình khuyến mãi</option>';
      promotionsList.innerHTML = '';

      if (!data.data || data.data.length === 0) {
        promotionsList.innerHTML = '<li>Không có khuyến mãi nào</li>';
        dealHotContainer.innerHTML = '<div class="no-products"><p>Không có sản phẩm khuyến mãi</p></div>';
        dealHotContainer.style.display = 'grid';
        return;
      }

      data.data.forEach(promotion => {
        let discountText = '';
        switch (promotion.LoaiKM) {
          case 'giam_phan_tram':
            discountText = `Giảm ${promotion.GiaTri}%`;
            break;
          case 'giam_tien':
            discountText = `Giảm ${formatPrice(promotion.GiaTri)} VNĐ`;
            break;
          case 'mua_1_tang_1':
            discountText = 'Mua 1 tặng 1';
            break;
        }

        const option = document.createElement('option');
        option.value = promotion.MaKM;
        option.textContent = `${promotion.TenKM} - ${discountText}`;
        discountSelect.appendChild(option);

        const li = document.createElement('li');
        li.innerHTML = `<a href="#" onclick="selectPromotion('${promotion.MaKM}')">${promotion.TenKM} - ${discountText}</a>`;
        promotionsList.appendChild(li);
      });

      if (data.data.length > 0) {
        selectPromotion(data.data[0].MaKM);
      }
    })
    .catch(error => {
      console.error('Lỗi khi tải khuyến mãi:', error);
      promotionsList.innerHTML = '<li>Đã có lỗi xảy ra</li>';
      dealHotContainer.innerHTML = '<div class="no-products"><p>Đã có lỗi xảy ra</p></div>';
    });
}

function selectPromotion(promotionId) {
  const dealHotContainer = document.getElementById('deal-hot-list');
  dealHotContainer.innerHTML = '<div class="loading">Đang tải sản phẩm khuyến mãi...</div>';

  fetch(`http://localhost:5000/api/khuyenmai/${promotionId}/products`, {
    headers: {
      'Content-Type': 'application/json; charset=utf-8'
    }
  })
    .then(response => {
      if (!response.ok) throw new Error('Lỗi khi tải sản phẩm khuyến mãi');
      return response.json();
    })
    .then(data => {
      dealHotContainer.innerHTML = '';
      if (!data.data || data.data.length === 0) {
        dealHotContainer.innerHTML = '<div class="no-products"><p>Không có sản phẩm khuyến mãi</p></div>';
        return;
      }

      data.data.forEach(product => {
        const productDiv = document.createElement('div');
        productDiv.classList.add('product-item');
        productDiv.innerHTML = `
          <img src="${product.HinhAnh || 'placeholder.jpg'}" alt="${escapeHtml(product.TenSP)}">
          <h3>${escapeHtml(product.TenSP)}</h3>
          <p class="price">${formatPrice(product.GiaBan)} VNĐ</p>
          <button onclick="loadProductDetail('${product.MaSP}')">Xem chi tiết</button>
        `;
        dealHotContainer.appendChild(productDiv);
      });
    })
    .catch(error => {
      console.error('Lỗi khi tải sản phẩm khuyến mãi:', error);
      dealHotContainer.innerHTML = '<div class="no-products"><p>Đã có lỗi xảy ra</p></div>';
    });
}

window.filterProductsByPrice = function (priceRange) {
  console.log('Đã chọn khoảng giá:', priceRange);
  filterProductsByPriceRange(priceRange, 'book-list');
};

window.filterProductsByCategory = function (categoryId) {
  console.log('Đã chọn danh mục:', categoryId);
  localStorage.setItem('currentCategory_book-list', categoryId);
  window.location.href = '/book.html';
};

function loadContent(url) {
  console.log('Đang tải:', url);
  fetch(url, {
    headers: {
      'Content-Type': 'application/json; charset=utf-8'
    }
  })
    .then(response => {
      if (!response.ok) {
        console.error(`Lỗi HTTP: ${response.status}`);
        window.location.href = url;
        throw new Error(`HTTP error: ${response.status}`);
      }
      return response.text();
    })
    .then(html => {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const newContainer = doc.querySelector('.container');
      if (newContainer) {
        document.querySelector('.container').innerHTML = newContainer.innerHTML;
        history.pushState({}, '', url);
        if (typeof fetchAndDisplayProducts === 'function') fetchAndDisplayProducts();
        if (typeof fetchAndDisplayPromotions === 'function') fetchAndDisplayPromotions();
        if (typeof fetchAndDisplayTextbooks === 'function') fetchAndDisplayTextbooks();
      } else {
        console.error('Không tìm thấy .container, chuyển hướng trực tiếp');
        window.location.href = url;
      }
    })
    .catch(error => {
      console.error('Lỗi khi tải nội dung:', error);
      window.location.href = url;
    });
}

const FAQ_KEYWORDS = [
  'đặt hàng', 'mua sách', 'thanh toán',
  'đổi trả', 'hoàn hàng', 'chính sách', 'hoàn tiền',
  'liên hệ', 'hỗ trợ', 'hotline',
  'theo dõi', 'đơn hàng', 'tracking'
];

function isFAQQuestion(message) {
  const lowerMessage = message.toLowerCase().replace(/\s+/g, ' ').trim();
  console.log('Kiểm tra từ khóa FAQ cho câu hỏi:', lowerMessage);
  const matched = FAQ_KEYWORDS.some(keyword => {
    const keywordMatch = lowerMessage.includes(keyword.toLowerCase());
    console.log(`Từ khóa "${keyword}": ${keywordMatch}`);
    return keywordMatch;
  });
  console.log('Là câu hỏi FAQ:', matched);
  return matched;
}

async function handleFAQInChat(message, chatMessages) {
  try {
    const words = message.toLowerCase().split(/\s+/);
    const keywordToSend = words.find(word => FAQ_KEYWORDS.includes(word.toLowerCase())) || message;
    console.log('Gửi từ khóa FAQ:', keywordToSend);

    const response = await fetch(`http://localhost:5000/api/support/faq?keyword=${encodeURIComponent(keywordToSend)}`, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8'
      }
    });
    if (!response.ok) {
      throw new Error(`Lỗi khi tải FAQ: ${response.status}`);
    }
    const data = await response.json();
    console.log('Phản hồi FAQ API:', data);

    if (!data.faqs || data.faqs.length === 0) {
      addMessage('ai', 'Không tìm thấy câu trả lời phù hợp cho câu hỏi của bạn. Vui lòng thử từ khóa khác hoặc liên hệ hỗ trợ!');
      return;
    }

    let replyContent = 'Dựa trên câu hỏi của bạn, đây là thông tin hỗ trợ:\n\n';
    data.faqs.forEach(faq => {
      replyContent += `**${escapeHtml(faq.question)}**\n${escapeHtml(faq.answer)}\n\n*Danh mục: ${escapeHtml(faq.category || 'Chưa phân loại')}*\n*Từ khóa: ${faq.keywords ? faq.keywords.map(k => escapeHtml(k)).join(', ') : 'Không có'}*\n\n`;
    });

    addMessage('ai', replyContent);
  } catch (error) {
    console.error('Lỗi FAQ trong chat:', error);
    addMessage('ai', 'Xin lỗi, có lỗi xảy ra khi tìm kiếm thông tin hỗ trợ. Vui lòng thử lại.');
  }
}

function setupChat() {
  const chatIcon = document.getElementById('chat-icon');
  const chatModal = document.getElementById('chat-modal');
  const chatClose = document.querySelector('.chat-close');
  const chatForm = document.getElementById('chat-form');
  const chatInput = document.getElementById('chat-input');
  const chatMessages = document.getElementById('chat-messages');
  const productSuggestion = document.getElementById('product-suggestion');

  if (!chatIcon || !chatModal) return;

  chatIcon.addEventListener('click', () => {
    chatModal.style.display = 'block';
    scrollToBottom(chatMessages);
  });

  chatClose.addEventListener('click', () => {
    chatModal.style.display = 'none';
    clearChat();
  });

  window.addEventListener('click', (event) => {
    if (event.target === chatModal) {
      chatModal.style.display = 'none';
      clearChat();
    }
  });

  chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const message = chatInput.value.trim();
    if (!message) return;

    addMessage('user', message);
    chatInput.value = '';
    chatInput.disabled = true;
    chatForm.querySelector('button').disabled = true;

    if (isFAQQuestion(message)) {
      await handleFAQInChat(message, chatMessages);
    } else {
      try {
        const response = await fetch('http://localhost:5000/api/openai/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json; charset=utf-8'
          },
          body: JSON.stringify({ message })
        });

        if (!response.ok) {
          throw new Error(`Lỗi khi gọi API: ${response.status}`);
        }

        const data = await response.json();
        console.log('Phản hồi OpenAI API:', data);
        const reply = data.reply;

        addMessage('ai', reply);

        const productInfo = extractProductFromReply(reply);
        if (productInfo) {
          await searchAndShowProductSuggestion(productInfo);
        } else {
          const suggestionDiv = document.getElementById('product-suggestion');
          suggestionDiv.innerHTML = `
            <h4>Sản phẩm gợi ý:</h4>
            <p>Chúng tôi không tìm thấy sản phẩm phù hợp từ câu hỏi của bạn. Hãy thử hỏi chi tiết hơn!</p>
          `;
          suggestionDiv.style.display = 'block';
          scrollToBottom(suggestionDiv);
        }

      } catch (error) {
        console.error('Lỗi chat:', error);
        addMessage('ai', 'Xin lỗi, có lỗi xảy ra khi xử lý câu hỏi. Vui lòng thử lại sau.');
      }
    }

    chatInput.disabled = false;
    chatForm.querySelector('button').disabled = false;
    chatInput.focus();
  });
}

function addMessage(type, text) {
  const chatMessages = document.getElementById('chat-messages');
  const messageDiv = document.createElement('div');
  messageDiv.classList.add('chat-message', type);
  messageDiv.innerHTML = text.replace(/\n/g, '<br>');
  chatMessages.appendChild(messageDiv);
  chatMessages.style.maxHeight = '300px';
  chatMessages.style.overflowY = 'auto';
  scrollToBottom(chatMessages);
}

function clearChat() {
  const chatMessages = document.getElementById('chat-messages');
  const productSuggestion = document.getElementById('product-suggestion');
  chatMessages.innerHTML = '';
  productSuggestion.style.display = 'none';
  productSuggestion.innerHTML = '';
}

function scrollToBottom(element) {
  if (element) {
    element.scrollTop = element.scrollHeight;
  }
}

function extractProductFromReply(reply) {
  const nameMatch = reply.match(/"([^"]+)"\s*(?:có|trong kho|khuyến mãi|có sẵn)\s*\d+/i) ||
                   reply.match(/'([^']+)'\s*(?:có|trong kho|khuyến mãi|có sẵn)/i) ||
                   reply.match(/(?:sách|quyển|cuốn)\s+"([^"]+)"/i);
  
  const idMatch = reply.match(/\[PRODUCT_ID:\s*(\d+)\]/i); // Sửa để khớp đúng định dạng [PRODUCT_ID: 1]

  if (idMatch) {
    return { type: 'id', value: idMatch[1] };
  } else if (nameMatch) {
    return { type: 'name', name: nameMatch[1] };
  }

  return null;
}

async function searchAndShowProductSuggestion(productInfo) {
  const suggestionDiv = document.getElementById('product-suggestion');
  try {
    let response;
    if (productInfo.type === 'id') {
      response = await fetch(`http://localhost:5000/api/product/${productInfo.value}`, {
        headers: {
          'Content-Type': 'application/json; charset=utf-8'
        }
      });
    } else {
      response = await fetch(`http://localhost:5000/api/product?search=${encodeURIComponent(productInfo.name)}`, {
        headers: {
          'Content-Type': 'application/json; charset=utf-8'
        }
      });
    }

    if (!response.ok) {
      throw new Error('Lỗi khi tìm kiếm sản phẩm');
    }

    const data = await response.json();
    let product;
    if (productInfo.type === 'id') {
      product = data;
    } else {
      product = data.data && data.data.length > 0 ? data.data[0] : null;
    }

    if (product && product.MaSP && product.TenSP) {
      const productId = String(product.MaSP || product.id || '');
      const productName = String(product.TenSP || product.name || '');
      suggestionDiv.innerHTML = `
        <div class="product-suggestion-content">
          <h4>Sản phẩm: ${escapeHtml(productName)}</h4>
          <p>Mã sản phẩm: ${escapeHtml(productId)}</p>
          <button class="view-detail-btn" onclick="loadProductDetail('${productId}')">Xem chi tiết</button>
        </div>
      `;
    } else {
      suggestionDiv.innerHTML = `
        <h4>Sản phẩm gợi ý:</h4>
        <p>Không tìm thấy sản phẩm "${escapeHtml(productInfo.name || 'không xác định')}" lúc này. Hãy thử tìm kiếm thêm!</p>
      `;
    }
    suggestionDiv.style.display = 'block';
    suggestionDiv.style.maxHeight = '150px';
    suggestionDiv.style.overflowY = 'auto';
    scrollToBottom(suggestionDiv);
  } catch (error) {
    console.error('Lỗi tìm kiếm sản phẩm:', error);
    suggestionDiv.innerHTML = `
      <h4>Sản phẩm gợi ý:</h4>
      <p>Không tìm thấy sản phẩm "${escapeHtml(productInfo.name || 'không xác định')}" lúc này. Hãy thử tìm kiếm thêm!</p>
    `;
    suggestionDiv.style.display = 'block';
    suggestionDiv.style.maxHeight = '150px';
    suggestionDiv.style.overflowY = 'auto';
    scrollToBottom(suggestionDiv);
  }
}

window.loadProductDetail = function(productId) {
  localStorage.setItem('selectedProductId', productId);
  window.location.href = 'product_detail.html';
};

function setupFAQ() {
  const faqForm = document.getElementById('faq-form');
  const faqInput = document.getElementById('faq-input');
  const faqResults = document.getElementById('faq-results');

  if (!faqForm) {
    console.error('Không tìm thấy faq-form');
    return;
  }

  faqForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const keyword = faqInput.value.trim();
    if (!keyword) {
      alert('Vui lòng nhập câu hỏi hoặc từ khóa!');
      return;
    }

    faqResults.innerHTML = '<div class="loading">Đang tìm kiếm...</div>';
    faqInput.disabled = true;
    faqForm.querySelector('button').disabled = true;

    try {
      const response = await fetch(`http://localhost:5000/api/support/faq?keyword=${encodeURIComponent(keyword)}`, {
        headers: {
          'Content-Type': 'application/json; charset=utf-8'
        }
      });
      if (!response.ok) {
        throw new Error('Lỗi khi tải FAQ');
      }
      const data = await response.json();

      faqResults.innerHTML = '';

      if (!data.faqs || data.faqs.length === 0) {
        faqResults.innerHTML = '<p class="no-results">Không tìm thấy câu trả lời phù hợp. Vui lòng thử từ khóa khác hoặc liên hệ hỗ trợ!</p>';
        return;
      }

      data.faqs.forEach(faq => {
        const faqItem = document.createElement('div');
        faqItem.classList.add('faq-item');
        faqItem.innerHTML = `
          <h3>${escapeHtml(faq.question)}</h3>
          <p>${escapeHtml(faq.answer)}</p>
          <div class="category">Danh mục: ${escapeHtml(faq.category || 'Chưa phân loại')}</div>
          <div class="keywords">Từ khóa: ${faq.keywords ? faq.keywords.map(k => escapeHtml(k)).join(', ') : 'Không có'}</div>
        `;
        faqResults.appendChild(faqItem);

        const questionHeader = faqItem.querySelector('h3');
        questionHeader.addEventListener('click', () => {
          faqItem.classList.toggle('active');
        });
      });

    } catch (error) {
      console.error('Lỗi FAQ:', error);
      faqResults.innerHTML = '<p class="no-results">Có lỗi xảy ra. Vui lòng thử lại sau!</p>';
    } finally {
      faqInput.disabled = false;
      faqForm.querySelector('button').disabled = false;
      faqInput.focus();
    }
  });
}