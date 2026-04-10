document.addEventListener('DOMContentLoaded', () => {
  // Initialize slideshow safely: some builds use showSlides(), others use updateSlides().
  if (typeof showSlides === 'function') {
    try { showSlides(); } catch (e) { console.warn('showSlides() failed:', e); }
  } else if (typeof updateSlides === 'function') {
    try { updateSlides(); setInterval(updateSlides, 3000); } catch (e) { console.warn('updateSlides() failed:', e); }
  }

  // Defer setupChat until footer (which contains chat HTML) is injected.
  if (document.getElementById('chat-icon')) {
    setupChat();
  } else {
    window.addEventListener('footerLoaded', () => {
      setTimeout(() => {
        if (document.getElementById('chat-icon')) setupChat();
      }, 0);
    }, { once: true });
  }
  // setupFAQ();
});

// Hiển thị slideshow
const largeImg = document.querySelector('.slide-large img');
  const smallImgs = document.querySelectorAll('.slide-small img');

  const images = [
    "img/anhnen/17d.jpg", "img/anhnen/18d.jpg", "img/anhnen/14d.jpg",
    "img/anhnen/15d.jpg", "img/anhnen/13d.jpg", "img/anhnen/9d.jpg",
    "img/anhnen/10d.jpg", "img/anhnen/11d.jpg", "img/anhnen/12d.jpg",
    "img/anhnen/16d.jpg"
  ];

  let index = 0;

  function updateSlides() {
    largeImg.src = images[index % images.length];
    smallImgs[0].src = images[(index + 1) % images.length];
    smallImgs[1].src = images[(index + 2) % images.length];
    index += 3;
  }

  document.addEventListener("DOMContentLoaded", () => {
    updateSlides();
    setInterval(updateSlides, 3000);
  });



// let slideIndex = [0, 0];
// const slideColumns = document.querySelectorAll('.slideshow-column');

// function showSlides() {
//   slideColumns.forEach((column, i) => {
//     const slides = column.getElementsByClassName('mySlides');
//     for (let j = 0; j < slides.length; j++) {
//       slides[j].style.display = 'none';
//     }
//     slideIndex[i]++;
//     if (slideIndex[i] > slides.length) slideIndex[i] = 1;
//     slides[slideIndex[i] - 1].style.display = 'block';
//   });
//   setTimeout(showSlides, 3000);
// }

// Định dạng giá
function formatPrice(price) {
  return new Intl.NumberFormat('vi-VN').format(price);
}

// Định dạng ngày
function formatDate(dateString) {
  const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
  return new Date(dateString).toLocaleDateString('vi-VN', options);
}

// Bảo vệ chống XSS
function escapeHtml(unsafe) {
  if (typeof unsafe !== 'string') return '';
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Tải nội dung trang
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

// Danh sách từ khóa FAQ
const FAQ_KEYWORDS = [
  'đặt hàng', 'mua sách', 'thanh toán',
  'đổi trả', 'hoàn hàng', 'chính sách', 'hoàn tiền',
  'liên hệ', 'hỗ trợ', 'hotline',
  'theo dõi', 'đơn hàng', 'tracking'
];

// Kiểm tra xem câu hỏi có phải FAQ không
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

// Xử lý FAQ trong chat
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

// **PHẦN CHAT AI - ĐÃ VIẾT LẠI HOÀN TOÀN**
function setupChat() {
  const chatIcon = document.getElementById('chat-icon');
  const chatModal = document.getElementById('chat-modal');
  const chatClose = document.querySelector('.chat-close');
  const chatForm = document.getElementById('chat-form');
  const chatInput = document.getElementById('chat-input');
  const chatMessages = document.getElementById('chat-messages');
  const productSuggestion = document.getElementById('product-suggestion');

  if (!chatIcon || !chatModal || !chatForm || !chatInput || !chatMessages) {
    console.error('Không tìm thấy các phần tử chat cần thiết');
    return;
  }

  // Thêm tin nhắn chào mừng khi mở chat
  function addWelcomeMessage() {
    if (chatMessages.children.length === 0) {
      addMessage('ai', '👋 Xin chào! Tôi là trợ lý AI của cửa hàng sách.\n\n💡 Tôi có thể giúp bạn:\n• Tìm kiếm sách theo tên, tác giả\n• Tư vấn sản phẩm phù hợp\n• Thông tin giá cả, khuyến mãi\n• Giải đáp câu hỏi về sách\n\nHãy hỏi tôi bất cứ điều gì bạn muốn biết! 📚');
      
      // Thêm quick action buttons
      addQuickActionButtons();
    }
  }

  // Thêm các nút hành động nhanh
  function addQuickActionButtons() {
    const quickActions = [
      { icon: '🎁', text: 'Khuyến mãi', query: 'Có khuyến mãi gì không?' },
      { icon: '📚', text: 'Sách bán chạy', query: 'Sách nào bán chạy nhất?' },
      { icon: '🆕', text: 'Sách mới', query: 'Sách mới phát hành' },
      { icon: '📞', text: 'Liên hệ', query: 'Tôi muốn liên hệ' }
    ];

    const actionsDiv = document.createElement('div');
    actionsDiv.classList.add('chat-message', 'ai', 'quick-actions');
    actionsDiv.innerHTML = `
      <div class="quick-actions-grid">
        ${quickActions.map(action => `
          <button class="quick-action-btn" data-query="${escapeHtml(action.query)}">
            <span class="action-icon">${action.icon}</span>
            <span class="action-text">${action.text}</span>
          </button>
        `).join('')}
      </div>
    `;
    
    chatMessages.appendChild(actionsDiv);
    
    // Gắn sự kiện click
    actionsDiv.querySelectorAll('.quick-action-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const query = btn.getAttribute('data-query');
        chatInput.value = query;
        handleSendMessage();
      });
    });
    
    scrollToBottom(chatMessages);
  }

  // Mở modal khi nhấn icon chat
  chatIcon.addEventListener('click', () => {
    chatModal.style.display = 'block';
    addWelcomeMessage();
    chatInput.focus();
    scrollToBottom(chatMessages);
  });

  // Đóng modal
  if (chatClose) {
    chatClose.addEventListener('click', () => {
      closeChat();
    });
  }

  // Đóng modal khi nhấn bên ngoài
  window.addEventListener('click', (event) => {
    if (event.target === chatModal) {
      closeChat();
    }
  });

  // Xử lý phím tắt
  chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeChat();
    }
  });

  // Xử lý gửi tin nhắn
  chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    await handleSendMessage();
  });

  // Hàm xử lý gửi tin nhắn
  async function handleSendMessage() {
    const message = chatInput.value.trim();
    if (!message) {
      showInputError('Vui lòng nhập câu hỏi!');
      return;
    }

    // Promo/code quick path: if user asks for promotions show codes directly
    const promoTrigger = /mã khuyến mãi|ma khuyen mai|khuyến mãi|khuyen mai|mã giảm giá|voucher|code/iu;
    if (promoTrigger.test(message)) {
      try {
        await renderPromotionsInChat();
      } catch (err) {
        console.error('Lỗi khi lấy khuyến mãi:', err);
        addMessage('ai', 'Xin lỗi, không thể tải mã khuyến mãi ngay bây giờ. Vui lòng thử lại sau.');
      }
      chatInput.value = '';
      return;
    }

    // Ẩn gợi ý sản phẩm cũ
    hideProductSuggestion();

    // Thêm tin nhắn người dùng
    addMessage('user', message);
    
    // Reset form và disable để tránh spam
    chatInput.value = '';
    setFormState(false);

    // Hiển thị typing indicator
    const typingId = showTypingIndicator();

    try {
      // Gửi yêu cầu đến API
      const response = await fetch('http://localhost:5000/api/openai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8'
        },
        body: JSON.stringify({ message })
      });

      if (!response.ok) {
        throw new Error(`Lỗi API: ${response.status} - ${response.statusText}`);
      }

      const data = await response.json();
      console.log('📥 Phản hồi từ AI:', data);

      // Xóa typing indicator
      removeTypingIndicator(typingId);

      const reply = data.reply || 'Xin lỗi, tôi không thể phản hồi lúc này. Vui lòng thử lại!';
      
      // Thêm phản hồi AI với hiệu ứng typing
      await addMessageWithTyping('ai', reply);

      // Xử lý action từ server (recommendations)
      if (data.action) {
        await handleChatAction(data.action);
      }

      // Nếu server trả về contact object (ví dụ Zalo), hiển thị nút/QR
      if (data.contact) {
        try {
          renderContactInChat(data.contact);
        } catch (err) {
          console.error('Lỗi khi hiển thị contact:', err);
        }
      }

      // Xử lý gợi ý sản phẩm nếu có
      const productInfo = extractProductFromReply(reply);
      if (productInfo) {
        await showProductSuggestionWithDelay(productInfo);
      }

      // Nếu server không trả về contact nhưng câu trả lời có từ khóa liên hệ/Zalo,
      // tự động hiển thị biểu tượng/nút Zalo để người dùng nhấn.
      if (!data.contact) {
        const contactTrigger = /zalo|liên hệ:|lien he:|\b\d{9,11}\b/i;
        if (contactTrigger.test(reply)) {
          const inferredContact = {
            type: 'zalo',
            url: 'https://zalo.me/0374170367',
            label: 'Nhắn tin qua Zalo',
            qr: '/img/zalo.png'
          };
          renderContactInChat(inferredContact);
        }
      }

    } catch (error) {
      console.error('❌ Lỗi chat:', error);
      removeTypingIndicator(typingId);
      
      // Phản hồi lỗi thân thiện
      const errorMessage = getErrorMessage(error);
      addMessage('ai', errorMessage);
    } finally {
      setFormState(true);
      chatInput.focus();
    }
  }

  // Hiển thị typing indicator
  function showTypingIndicator() {
    const chatMessages = document.getElementById('chat-messages');
    const typingId = 'typing-' + Date.now();
    const typingDiv = document.createElement('div');
    typingDiv.classList.add('chat-message', 'ai', 'typing-indicator');
    typingDiv.id = typingId;
    typingDiv.innerHTML = `
      <div class="typing-animation">
        <span></span>
        <span></span>
        <span></span>
      </div>
      <small>AI đang suy nghĩ...</small>
    `;
    chatMessages.appendChild(typingDiv);
    scrollToBottom(chatMessages);
    return typingId;
  }

  // Xóa typing indicator
  function removeTypingIndicator(typingId) {
    const typingElement = document.getElementById(typingId);
    if (typingElement) {
      typingElement.remove();
    }
  }

  // Thêm tin nhắn với hiệu ứng typing
  async function addMessageWithTyping(type, text) {
    const chatMessages = document.getElementById('chat-messages');
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('chat-message', type);
    chatMessages.appendChild(messageDiv);

    // Hiệu ứng typing
    const words = text.split(' ');
    let currentText = '';
    
    for (let i = 0; i < words.length; i++) {
      currentText += (i > 0 ? ' ' : '') + words[i];
      messageDiv.innerHTML = formatMessageText(currentText);
      scrollToBottom(chatMessages);
      
      // Delay giữa các từ (tốc độ typing)
      if (i < words.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }
  }

  // Format text message
  function formatMessageText(text) {
    return text
      .replace(/\n/g, '<br>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
      .replace(/\*(.*?)\*/g, '<em>$1</em>') // Italic
      .replace(/`(.*?)`/g, '<code>$1</code>') // Code
      .replace(/(\d{1,3}(?:\.\d{3})*)\s*VNĐ/g, '<span class="price">$1 VNĐ</span>'); // Price highlight
  }

  // Hiển thị lỗi input
  function showInputError(message) {
    const chatInput = document.getElementById('chat-input');
    if (chatInput) {
      chatInput.style.borderColor = '#e74c3c';
      chatInput.placeholder = message;
      setTimeout(() => {
        chatInput.style.borderColor = '';
        chatInput.placeholder = 'Nhập câu hỏi về sản phẩm...';
      }, 2000);
      chatInput.focus();
    }
  }

  // Set trạng thái form
  function setFormState(enabled) {
    const chatInput = document.getElementById('chat-input');
    const chatForm = document.getElementById('chat-form');
    
    if (chatInput) chatInput.disabled = !enabled;
    
    const submitBtn = chatForm?.querySelector('button[type="submit"]');
    if (submitBtn) {
      submitBtn.disabled = !enabled;
      submitBtn.textContent = enabled ? 'Gửi' : 'Đang gửi...';
    }
  }

  // Lấy thông báo lỗi thân thiện
  function getErrorMessage(error) {
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      return '🔌 Mất kết nối với server. Vui lòng kiểm tra kết nối mạng và thử lại!';
    }
    if (error.message.includes('500')) {
      return '⚠️ Server đang bảo trì. Tôi sẽ hoạt động trở lại sớm nhất có thể!';
    }
    if (error.message.includes('404')) {
      return '🔍 Không tìm thấy dịch vụ chat. Vui lòng liên hệ hỗ trợ: 0938 424 289';
    }
    return `😔 Đã xảy ra lỗi: ${error.message}\n\nVui lòng thử lại hoặc liên hệ hỗ trợ: 0938 424 289`;
  }

  // Đóng chat
  function closeChat() {
    chatModal.style.display = 'none';
    hideProductSuggestion();
    chatInput.value = '';
    setFormState(true);
  }

  // Xử lý các action từ chatbot (recommendations, etc)
  async function handleChatAction(action) {
    const chatMessages = document.getElementById('chat-messages');
    if (!chatMessages) return;

    const customerId = localStorage.getItem('customerId') || '1';
    
    const loading = document.createElement('div');
    loading.className = 'chat-message ai';
    loading.textContent = 'Đang tải...';
    chatMessages.appendChild(loading);
    scrollToBottom(chatMessages);

    try {
      let endpoint = '';
      switch(action) {
        case 'show-recommendations':
          endpoint = `/api/recommendations/smart/${customerId}`;
          break;
        case 'show-trending':
          endpoint = '/api/recommendations/trending';
          break;
        case 'show-new-releases':
          endpoint = '/api/recommendations/new-releases';
          break;
        default:
          loading.remove();
          return;
      }

      const response = await fetch(`http://localhost:5000${endpoint}`, {
        headers: { 'Content-Type': 'application/json; charset=utf-8' }
      });

      if (!response.ok) throw new Error('Failed to load recommendations');
      
      const result = await response.json();
      loading.remove();

      if (!result.data || result.data.length === 0) {
        addMessage('ai', 'Xin lỗi, hiện tại chưa có sản phẩm phù hợp.');
        return;
      }

      // Render product carousel
      renderProductCarousel(result.data, result.message);
      
    } catch (error) {
      console.error('Error handling chat action:', error);
      loading.remove();
      addMessage('ai', 'Xin lỗi, có lỗi xảy ra. Vui lòng thử lại.');
    }
  }

  // Render carousel sản phẩm
  function renderProductCarousel(products, title = 'Gợi ý cho bạn') {
    const chatMessages = document.getElementById('chat-messages');
    if (!chatMessages) return;

    const carouselDiv = document.createElement('div');
    carouselDiv.classList.add('chat-message', 'ai', 'product-carousel-container');
    
    carouselDiv.innerHTML = `
      <h4 style="margin-bottom: 12px;">📚 ${escapeHtml(title)}</h4>
      <div class="product-carousel">
        <button class="carousel-btn prev" onclick="scrollCarousel(this, -1)">‹</button>
        <div class="carousel-track">
          ${products.map(p => {
            const price = formatPrice(p.DonGia || p.price || 0);
            const name = escapeHtml(p.TenSP || p.name || 'Sản phẩm');
            const author = escapeHtml(p.TenTG || p.author || '');
            const id = p.MaSP || p.id;
            const image = p.HinhAnh || p.image || 'default-book.jpg';
            
            return `
              <div class="product-card-mini">
                <div class="product-image-wrapper">
                  <img src="img/product/${image}" alt="${name}" 
                       onerror="this.src='https://via.placeholder.com/150x200?text=Book'">
                </div>
                <div class="product-info-mini">
                  <h5 class="product-name-mini" title="${name}">${name}</h5>
                  ${author ? `<p class="product-author-mini">${author}</p>` : ''}
                  <p class="product-price-mini">${price}</p>
                </div>
                <button class="view-product-btn" onclick="loadProductDetail('${id}')">
                  Xem chi tiết
                </button>
              </div>
            `;
          }).join('')}
        </div>
        <button class="carousel-btn next" onclick="scrollCarousel(this, 1)">›</button>
      </div>
    `;
    
    chatMessages.appendChild(carouselDiv);
    scrollToBottom(chatMessages);
  }


  // Hiển thị gợi ý sản phẩm với delay
async function showProductSuggestionWithDelay(productInfo) {
  const chatMessages = document.getElementById('chat-messages');
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const suggestionMessage = document.createElement('div');
  suggestionMessage.classList.add('chat-message', 'ai', 'suggestion');
  suggestionMessage.innerHTML = `
    <h4>🎯 Gợi ý sản phẩm</h4>
    <p>Tôi đang tìm kiếm sản phẩm phù hợp...</p>
  `;
  chatMessages.appendChild(suggestionMessage);
  scrollToBottom(chatMessages);

  try {
    const product = await searchProduct(productInfo);
    if (product) {
      // SỬA: Đường dẫn ảnh đúng
      const imageUrl = product.HinhAnh ? 
        `img/product/${product.HinhAnh}` : 
        'img/default-book.jpg'; // Ảnh mặc định nếu không có

      // SỬA: Logic tình trạng kho
      let stockStatus;
      let stockClass;
      
      // Kiểm tra tình trạng dựa trên SoLuong và TinhTrang
      if (product.TinhTrang === 0 || product.SoLuong === 0) {
        stockStatus = 'Hết hàng';
        stockClass = 'status-out';
      } else if (product.SoLuong > 0) {
        stockStatus = `Còn hàng (${product.SoLuong} sản phẩm)`;
        stockClass = 'status-available';
      } else {
        // Fallback case
        stockStatus = product.TinhTrang === 1 ? 'Còn hàng' : 'Hết hàng';
        stockClass = product.TinhTrang === 1 ? 'status-available' : 'status-out';
      }

      suggestionMessage.innerHTML = `
        <h4>📚 Sản phẩm gợi ý</h4>
        <div class="product-card">
          <div class="product-image">
            <img src="${imageUrl}" alt="${escapeHtml(product.TenSP || 'Sản phẩm')}" 
                 onerror="this.src='img/default-book.jpg'" />
          </div>
          <div class="product-info">
            <p class="product-name"><strong>${escapeHtml(product.TenSP || 'Không có tên')}</strong></p>
            <p class="product-author">👤 Tác giả: ${escapeHtml(product.TacGia || 'Không rõ')}</p>
            <p class="product-price">💰 Giá: <span class="price">${formatPrice(product.DonGia || 0)} VNĐ</span></p>
            <p class="product-id">🏷️ Mã SP: ${escapeHtml(String(product.MaSP || 'N/A'))}</p>
            <p class="product-quantity">📦 Số lượng: ${product.SoLuong || 0}</p>
            <p class="product-status">📋 Tình trạng: <span class="${stockClass}">${stockStatus}</span></p>
            <button class="view-detail-btn" onclick="loadProductDetail('${product.MaSP || product.id}')">
              👀 Xem chi tiết
            </button>
          </div>
        </div>
      `;
      
      // Log để debug
      console.log('Product info:', {
        TinhTrang: product.TinhTrang,
        SoLuong: product.SoLuong,
        DisplayStatus: stockStatus
      });
      
    } else {
      suggestionMessage.innerHTML = `
        <h4>🔍 Không tìm thấy</h4>
        <p>Rất tiếc, tôi không tìm thấy sản phẩm "${escapeHtml(productInfo.name || 'này')}" trong kho.</p>
        <p>💡 Bạn có thể thử:</p>
        <p>• Tìm với từ khóa khác<br>• Liên hệ: 0938 424 289<br>• Duyệt danh mục sản phẩm</p>
      `;
    }
  } catch (error) {
    console.error('Lỗi tìm sản phẩm:', error);
    // Hide suggestion area instead of showing an error box
    suggestionMessage.style.display = 'none';
    suggestionMessage.innerHTML = '';
  }
  
  scrollToBottom(chatMessages);
}


  // Tìm sản phẩm
  async function searchProduct(productInfo) {
    let response;
    if (productInfo.type === 'id') {
      response = await fetch(`http://localhost:5000/api/product/${productInfo.value}`, {
        headers: { 'Content-Type': 'application/json; charset=utf-8' }
      });
    } else {
      response = await fetch(`http://localhost:5000/api/product/search?name=${encodeURIComponent(productInfo.name)}`, {
        headers: { 'Content-Type': 'application/json; charset=utf-8' }
      });
    }

    if (!response.ok) {
      throw new Error('Lỗi tìm kiếm sản phẩm');
    }

    const data = await response.json();
    return productInfo.type === 'id' ? data : (data.data && data.data.length > 0 ? data.data[0] : null);
  }

  // Ẩn gợi ý sản phẩm
  function hideProductSuggestion() {
    if (productSuggestion) {
      productSuggestion.style.display = 'none';
      productSuggestion.innerHTML = '';
    }
  }
}

// **CÁC HÀM GLOBAL - CHỈ THAY ĐỔI PHẦN CHAT**

// Thêm tin nhắn vào chat
function addMessage(type, text) {
  const chatMessages = document.getElementById('chat-messages');
  if (!chatMessages) return;

  const messageDiv = document.createElement('div');
  messageDiv.classList.add('chat-message', type);
  
  // Format tin nhắn
  const formattedText = text
    .replace(/\n/g, '<br>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code>$1</code>')
    .replace(/(\d{1,3}(?:\.\d{3})*)\s*VNĐ/g, '<span class="price">$1 VNĐ</span>');
  
  messageDiv.innerHTML = formattedText;
  chatMessages.appendChild(messageDiv);
  
  // Auto scroll
  scrollToBottom(chatMessages);
  
  // Animate new message
  messageDiv.style.opacity = '0';
  messageDiv.style.transform = 'translateY(10px)';
  requestAnimationFrame(() => {
    messageDiv.style.transition = 'all 0.3s ease';
    messageDiv.style.opacity = '1';
    messageDiv.style.transform = 'translateY(0)';
  });
}

// Xóa nội dung chat
function clearChat() {
  const chatMessages = document.getElementById('chat-messages');
  const productSuggestion = document.getElementById('product-suggestion');
  if (chatMessages) chatMessages.innerHTML = '';
  if (productSuggestion) {
    productSuggestion.style.display = 'none';
    productSuggestion.innerHTML = '';
  }
}

// Cuộn xuống cuối
function scrollToBottom(element) {
  if (element) {
    element.scrollTop = element.scrollHeight;
  }
}

// Trích xuất thông tin sản phẩm từ phản hồi
function extractProductFromReply(reply) {
  const idMatch = reply.match(/\[PRODUCT_ID:\s*(\d+)\]/i);
  const nameMatch = reply.match(/"([^"]+)"/i) || reply.match(/'([^']+)'/i);

  if (idMatch) {
    return { type: 'id', value: idMatch[1] };
  } else if (nameMatch) {
    return { type: 'name', name: nameMatch[1] };
  }
  return null;
}

// Render contact button and optional QR thumbnail into chat
function renderContactInChat(contact) {
  // contact: { type, url, label, qr }
  const chatMessages = document.getElementById('chat-messages');
  if (!chatMessages) return;

  const wrapper = document.createElement('div');
  wrapper.className = 'chat-contact';

  const btn = document.createElement('button');
  btn.className = 'contact-btn';
  btn.textContent = contact.label || 'Liên hệ';
  btn.onclick = () => window.open(contact.url, '_blank');
  wrapper.appendChild(btn);

  if (contact.qr) {
    // QR thumbnail removed from UI per user request.
    // If you want to re-enable the thumbnail/modal later, restore this block and ensure contact.qr points to a valid image URL.
  }

  chatMessages.appendChild(wrapper);
  scrollToBottom(chatMessages);
}

// Fetch and render active promotions (codes) into the chat
async function renderPromotionsInChat() {
  const chatMessages = document.getElementById('chat-messages');
  if (!chatMessages) return;

  const loading = document.createElement('div');
  loading.className = 'chat-message ai';
  loading.textContent = 'Đang tải mã khuyến mãi...';
  chatMessages.appendChild(loading);
  scrollToBottom(chatMessages);

  try {
  // Use backend absolute URL so frontend served from a different origin can reach the API
  const backendBase = window.__BACKEND_URL__ || 'http://localhost:5000';
  const res = await fetch(`${backendBase}/api/khuyenmai?activeOnly=true&limit=10`, { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
    if (!res.ok) throw new Error('Failed to load promotions');
    const data = await res.json();
    // data.data is expected to be an array of promotions
    const promotions = data.data || data || [];

    // Remove loading
    loading.remove();

    if (!promotions || promotions.length === 0) {
      addMessage('ai', 'Hiện tại không có mã khuyến mãi nào. Vui lòng thử lại sau.');
      return;
    }

    const wrapper = document.createElement('div');
    // start collapsed by default (show first 3 items)
    wrapper.className = 'chat-message ai promotion-list promo-collapsed';

    // Build card-style HTML for each promotion (render all; CSS controls visibility)
    let html = '<h4>🎁 Mã khuyến mãi đang có</h4><div class="promo-cards">';
    promotions.forEach((p, idx) => {
      const code = p.Code || p.code || p.MaKM || ('KM' + (p.MaKM || ''));
      const title = p.TenKM || p.Ten || 'Khuyến mãi';
      const desc = p.MoTa || p.MieuTa || p.Description || '';
      const ma = p.MaKM || '';
      const exp = p.HanSD || p.HSD || p.NgayHetHan || p.Expiry || '';

      html += `
      <div class="promo-card-detailed" data-idx="${idx + 1}">
        <div class="promo-left">
          <div class="promo-percent">%
            <div class="promo-label">Giảm %</div>
          </div>
        </div>
        <div class="promo-body">
          <h4 class="promo-title">${escapeHtml(String(title))}</h4>
          ${desc ? `<p class="promo-sub">${escapeHtml(String(desc))}</p>` : ''}
          <p class="promo-code-line">Mã: <span class="promo-code-value">${escapeHtml(String(code))}</span></p>
          ${exp ? `<p class="promo-expire">HSD: <a class="promo-expire-link" href="#">${escapeHtml(String(exp))}</a></p>` : ''}
          <p class="promo-status">Đang hoạt động</p>
          <div class="promo-actions">
            <button class="promo-save-btn" data-id="${escapeHtml(String(ma))}" data-code="${escapeHtml(String(code))}">Xem chi tiết</button>
            <button class="promo-info-btn" title="Thông tin">i</button>
            ${ma ? `<button class="promo-detail-btn" data-id="${escapeHtml(String(ma))}" style="display:none">Xem</button>` : ''}
          </div>
        </div>
      </div>`;
    });
    html += '</div>';

    // Add controls (toggle) — label will be set below
    html += `<div class="promo-controls"><button class="promo-toggle-btn" aria-expanded="false">Xem thêm</button></div>`;

    wrapper.innerHTML = html;
    chatMessages.appendChild(wrapper);
    scrollToBottom(chatMessages);

    // Update toggle label based on number of promos
    const total = promotions.length;
    const toggleBtn = wrapper.querySelector('.promo-toggle-btn');
    if (toggleBtn) {
      const setLabel = (collapsed) => {
        if (collapsed) {
          const more = Math.max(0, total - 3);
          toggleBtn.textContent = more > 0 ? `Xem thêm (${more})` : 'Xem thêm';
          toggleBtn.setAttribute('aria-expanded', 'false');
        } else {
          toggleBtn.textContent = 'Thu gọn';
          toggleBtn.setAttribute('aria-expanded', 'true');
        }
      };

      setLabel(true);

      toggleBtn.addEventListener('click', () => {
        const collapsed = wrapper.classList.toggle('promo-collapsed');
        setLabel(collapsed);
        // keep chat scrolled to bottom so user sees changes
        scrollToBottom(chatMessages);
      });
    }

    // Attach click handler for promo save buttons (now navigates to detail page; fallback to copy)
    wrapper.querySelectorAll('.promo-save-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        const code = e.currentTarget.getAttribute('data-code');
        if (id) {
          const targetUrl = `giamgia.html?id=${encodeURIComponent(id)}`;
          window.location.href = targetUrl;
          return;
        }

        // Fallback: copy code to clipboard
        if (code && navigator.clipboard) {
          navigator.clipboard.writeText(code).then(() => {
            const old = e.currentTarget.textContent;
            e.currentTarget.textContent = 'Đã sao chép';
            setTimeout(() => { e.currentTarget.textContent = old; }, 1800);
          }).catch(() => {
            window.prompt('Sao chép mã khuyến mãi:', code);
          });
        } else if (code) {
          window.prompt('Sao chép mã khuyến mãi:', code);
        }
      });
    });

    // Attach click handlers for hidden detail buttons if present
    wrapper.querySelectorAll('.promo-detail-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        if (id) {
          const targetUrl = `giamgia.html?id=${encodeURIComponent(id)}`;
          window.location.href = targetUrl;
        }
      });
    });

    // Info buttons can open a small tooltip/modal — simple alert for now
    wrapper.querySelectorAll('.promo-info-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const card = e.currentTarget.closest('.promo-card-detailed');
        const codeEl = card?.querySelector('.promo-code-value');
        const titleEl = card?.querySelector('.promo-title');
        alert(`${titleEl?.textContent || 'Khuyến mãi'}\nMã: ${codeEl?.textContent || ''}`);
      });
    });

  } catch (err) {
    loading.remove();
    console.error(err);
    addMessage('ai', 'Không thể tải danh sách khuyến mãi. Vui lòng thử lại sau.');
  }
}

// Tìm và hiển thị gợi ý sản phẩm (legacy function - giữ để tương thích)
async function searchAndShowProductSuggestion(productInfo) {
  const suggestionDiv = document.getElementById('product-suggestion');
  if (!suggestionDiv) return;

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
          <div class="product-info">
            <h4>Sản phẩm: ${escapeHtml(productName)}</h4>
            <p>Mã sản phẩm: ${escapeHtml(productId)}</p>
          </div>
          <button class="view-detail-btn" onclick="loadProductDetail('${productId}')">Xem chi tiết</button>
        </div>
      `;
    } else {
      suggestionDiv.innerHTML = `
        <div class="product-suggestion-content">
          <h4>Sản phẩm gợi ý:</h4>
          <p>Không tìm thấy sản phẩm "${escapeHtml(productInfo.name || 'không xác định')}" lúc này. Hãy thử tìm kiếm thêm!</p>
        </div>
      `;
    }
    suggestionDiv.style.display = 'block';
    suggestionDiv.style.maxHeight = '150px';
    suggestionDiv.style.overflowY = 'auto';
    scrollToBottom(suggestionDiv);
  } catch (error) {
    console.error('Lỗi tìm kiếm sản phẩm:', error);
    // Don't display the product suggestion error UI; keep it hidden
    suggestionDiv.style.display = 'none';
    suggestionDiv.innerHTML = '';
  }
}

// Chuyển hướng đến trang chi tiết sản phẩm
window.loadProductDetail = function(productId) {
  localStorage.setItem('selectedProductId', productId);
  window.location.href = 'product_detail.html';
};

// Scroll carousel
window.scrollCarousel = function(button, direction) {
  const carousel = button.parentElement;
  const track = carousel.querySelector('.carousel-track');
  const cardWidth = track.querySelector('.product-card-mini').offsetWidth + 12; // 12px gap
  track.scrollBy({ left: cardWidth * direction * 2, behavior: 'smooth' });
};