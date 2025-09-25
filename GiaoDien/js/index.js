document.addEventListener('DOMContentLoaded', () => {
  showSlides();
  setupChat();
  // setupFAQ();
});




// Hiển thị slideshow
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

// Thiết lập chat box
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

  // Mở modal khi nhấn icon chat
  chatIcon.addEventListener('click', () => {
    chatModal.style.display = 'block';
    scrollToBottom(chatMessages);
  });

  // Đóng modal
  chatClose.addEventListener('click', () => {
    chatModal.style.display = 'none';
    clearChat();
  });

  // Đóng modal khi nhấn bên ngoài
  window.addEventListener('click', (event) => {
    if (event.target === chatModal) {
      chatModal.style.display = 'none';
      clearChat();
    }
  });

  // Xử lý gửi tin nhắn
  chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const message = chatInput.value.trim();
    if (!message) {
      alert('Vui lòng nhập câu hỏi!');
      return;
    }

    // Thêm tin nhắn người dùng
    addMessage('user', message);
    chatInput.value = '';
    chatInput.disabled = true;
    chatForm.querySelector('button').disabled = true;

    try {
      // Kiểm tra FAQ trước
      if (isFAQQuestion(message)) {
        await handleFAQInChat(message, chatMessages);
      } else {
        // Gửi yêu cầu đến API Gemini
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
        const reply = data.reply || 'Không có phản hồi từ AI.';

        // Thêm phản hồi AI
        addMessage('ai', reply);

        // Trích xuất và hiển thị gợi ý sản phẩm
        const productInfo = extractProductFromReply(reply);
        if (productInfo) {
          await searchAndShowProductSuggestion(productInfo);
        } else {
          productSuggestion.innerHTML = `
            <div class="product-suggestion-content">
              <h4>Sản phẩm gợi ý:</h4>
              <p>Không tìm thấy sản phẩm phù hợp từ câu hỏi của bạn. Hãy thử hỏi chi tiết hơn!</p>
            </div>
          `;
          productSuggestion.style.display = 'block';
          scrollToBottom(productSuggestion);
        }
      }
    } catch (error) {
      console.error('Lỗi chat:', error);
      addMessage('ai', 'Xin lỗi, có lỗi xảy ra khi xử lý câu hỏi. Vui lòng thử lại sau.');
    } finally {
      chatInput.disabled = false;
      chatForm.querySelector('button').disabled = false;
      chatInput.focus();
    }
  });
}

// Thêm tin nhắn vào chat
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

// Xóa nội dung chat
function clearChat() {
  const chatMessages = document.getElementById('chat-messages');
  const productSuggestion = document.getElementById('product-suggestion');
  chatMessages.innerHTML = '';
  productSuggestion.style.display = 'none';
  productSuggestion.innerHTML = '';
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
  const nameMatch = reply.match(/"([^"]+)"\s*(?:có|trong kho|khuyến mãi|có sẵn)\s*\d+/i) ||
                   reply.match(/'([^']+)'\s*(?:có|trong kho|khuyến mãi|có sẵn)/i) ||
                   reply.match(/(?:sách|quyển|cuốn)\s+"([^"]+)"/i);

  if (idMatch) {
    return { type: 'id', value: idMatch[1] };
  } else if (nameMatch) {
    return { type: 'name', name: nameMatch[1] };
  }
  return null;
}

// Tìm và hiển thị gợi ý sản phẩm
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
      <div class="product-info">
        <h4>Sản phẩm: ${escapeHtml(productName)}</h4>
        <p>Mã sản phẩm: ${escapeHtml(productId)}</p>
      </div>
      <button class="view-detail-btn" onclick="loadProductDetail('${productId}')">Xem chi tiết</button>
    </div>
  `;
} else {
  // Phần không tìm thấy giữ nguyên
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
    suggestionDiv.innerHTML = `
      <div class="product-suggestion-content">
        <h4>Sản phẩm gợi ý:</h4>
        <p>Không tìm thấy sản phẩm "${escapeHtml(productInfo.name || 'không xác định')}" lúc này. Hãy thử tìm kiếm thêm!</p>
      </div>
    `;
    suggestionDiv.style.display = 'block';
    suggestionDiv.style.maxHeight = '150px';
    suggestionDiv.style.overflowY = 'auto';
    scrollToBottom(suggestionDiv);
  }
}

// Chuyển hướng đến trang chi tiết sản phẩm
window.loadProductDetail = function(productId) {
  localStorage.setItem('selectedProductId', productId);
  window.location.href = 'product_detail.html';
};

// Thiết lập FAQ
// function setupFAQ() {
//   const faqForm = document.getElementById('faq-form');
//   const faqInput = document.getElementById('faq-input');
//   const faqResults = document.getElementById('faq-results');

//   if (!faqForm) {
//     console.error('Không tìm thấy faq-form');
//     return;
//   }

//   faqForm.addEventListener('submit', async (e) => {
//     e.preventDefault();
//     const keyword = faqInput.value.trim();
//     if (!keyword) {
//       alert('Vui lòng nhập câu hỏi hoặc từ khóa!');
//       return;
//     }

//     faqResults.innerHTML = '<div class="loading">Đang tìm kiếm...</div>';
//     faqInput.disabled = true;
//     faqForm.querySelector('button').disabled = true;

//     try {
//       const response = await fetch(`http://localhost:5000/api/support/faq?keyword=${encodeURIComponent(keyword)}`, {
//         headers: {
//           'Content-Type': 'application/json; charset=utf-8'
//         }
//       });
//       if (!response.ok) {
//         throw new Error('Lỗi khi tải FAQ');
//       }
//       const data = await response.json();

//       faqResults.innerHTML = '';

//       if (!data.faqs || data.faqs.length === 0) {
//         faqResults.innerHTML = '<p class="no-results">Không tìm thấy câu trả lời phù hợp. Vui lòng thử từ khóa khác hoặc liên hệ hỗ trợ!</p>';
//         return;
//       }

//       data.faqs.forEach(faq => {
//         const faqItem = document.createElement('div');
//         faqItem.classList.add('faq-item');
//         faqItem.innerHTML = `
//           <h3>${escapeHtml(faq.question)}</h3>
//           <p>${escapeHtml(faq.answer)}</p>
//           <div class="category">Danh mục: ${escapeHtml(faq.category || 'Chưa phân loại')}</div>
//           <div class="keywords">Từ khóa: ${faq.keywords ? faq.keywords.map(k => escapeHtml(k)).join(', ') : 'Không có'}</div>
//         `;
//         faqResults.appendChild(faqItem);

//         const questionHeader = faqItem.querySelector('h3');
//         questionHeader.addEventListener('click', () => {
//           faqItem.classList.toggle('active');
//         });
//       });
//     } catch (error) {
//       console.error('Lỗi FAQ:', error);
//       faqResults.innerHTML = '<p class="no-results">Có lỗi xảy ra. Vui lòng thử lại sau!</p>';
//     } finally {
//       faqInput.disabled = false;
//       faqForm.querySelector('button').disabled = false;
//       faqInput.focus();
//     }
//   });
// }