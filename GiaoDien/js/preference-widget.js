/**
 * =====================================================
 * PREFERENCE WIDGET - Form Sở thích Khách hàng
 * =====================================================
 * Hiển thị form khảo sát sở thích để khách hàng nhận mã Freeship
 */

(function() {
  'use strict';

  const API_BASE = 'http://localhost:5000/api';
  let currentForm = null;
  let selectedAnswers = {};

  /**
   * Khởi tạo widget khi trang load
   */
  function initPreferenceWidget() {
    // Kiểm tra xem khách hàng đã điền form chưa
    checkUserPreferences();
  }

  /**
   * Kiểm tra khách hàng đã có sở thích chưa
   */
  async function checkUserPreferences() {
    try {
      const customerId = localStorage.getItem('customerId');
      
      // Nếu chưa đăng nhập hoặc đã điền form -> không hiển thị
      if (!customerId) {
        console.log('Chưa đăng nhập -> không hiển thị form sở thích');
        return;
      }

      const response = await fetch(`${API_BASE}/preferences/check?makh=${customerId}`);
      const result = await response.json();

      if (result.success && result.data.hasPreferences) {
        console.log('Khách hàng đã điền form sở thích');
        return;
      }

      // Chưa điền form -> hiển thị widget mời điền
      showPreferencePrompt();
    } catch (error) {
      console.error('Lỗi khi kiểm tra sở thích:', error);
    }
  }

  /**
   * Hiển thị prompt mời điền form
   */
  function showPreferencePrompt() {
    // Tạo floating button
    const floatingBtn = document.createElement('div');
    floatingBtn.id = 'preference-prompt';
    floatingBtn.className = 'preference-floating-btn';
    floatingBtn.innerHTML = `
      <div class="preference-prompt-content">
        <div class="prompt-icon">🎁</div>
        <div class="prompt-text">
          <strong>Nhận ngay mã Freeship!</strong>
          <p>Trả lời 6 câu hỏi nhanh</p>
        </div>
      </div>
    `;

    floatingBtn.addEventListener('click', () => {
      floatingBtn.remove();
      loadAndShowPreferenceForm();
    });

    document.body.appendChild(floatingBtn);

    // Auto show sau 5 giây
    setTimeout(() => {
      floatingBtn.classList.add('show');
    }, 5000);
  }

  /**
   * Load form sở thích từ API và hiển thị
   */
  async function loadAndShowPreferenceForm() {
    try {
      const response = await fetch(`${API_BASE}/preferences/form`);
      const result = await response.json();

      if (!result.success || !result.data) {
        throw new Error('Không thể tải form sở thích');
      }

      currentForm = result.data;
      renderPreferenceModal(currentForm);
    } catch (error) {
      console.error('Lỗi khi tải form:', error);
      alert('Không thể tải form khảo sát. Vui lòng thử lại sau!');
    }
  }

  /**
   * Render modal form sở thích
   */
  function renderPreferenceModal(form) {
    selectedAnswers = {};

    const modal = document.createElement('div');
    modal.id = 'preference-modal';
    modal.className = 'preference-modal';
    modal.innerHTML = `
      <div class="preference-modal-overlay"></div>
      <div class="preference-modal-content">
        <button class="preference-close" onclick="closePreferenceModal()">×</button>
        
        <div class="preference-header">
          <div class="preference-icon">🎁</div>
          <h2>${escapeHtml(form.TenForm || 'Khảo sát sở thích')}</h2>
          <p class="preference-subtitle">${escapeHtml(form.MoTa || 'Trả lời ngắn gọn để nhận mã Freeship!')}</p>
        </div>

        <div class="preference-form" id="preference-form">
          ${renderQuestions(form.questions || [])}
        </div>

        <div class="preference-footer">
          <div class="preference-consent">
            <label>
              <input type="checkbox" id="consent-checkbox" checked>
              <span>Tôi đồng ý cho phép sử dụng dữ liệu để cá nhân hóa trải nghiệm</span>
            </label>
          </div>
          <button class="preference-submit-btn" onclick="submitPreferenceForm()">
            🎉 Hoàn thành & Nhận mã Freeship
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Show modal với animation
    setTimeout(() => {
      modal.classList.add('show');
    }, 100);

    // Attach event listeners cho các câu hỏi
    attachQuestionHandlers(form.questions);
  }

  /**
   * Render tất cả câu hỏi
   */
  function renderQuestions(questions) {
    if (!questions || questions.length === 0) {
      return '<p class="no-questions">Không có câu hỏi nào.</p>';
    }

    return questions.map((q, index) => {
      return `
        <div class="question-block" data-question-id="${q.MaCauHoi}">
          <h3 class="question-title">
            ${index + 1}. ${escapeHtml(q.NoiDungCauHoi)}
            ${q.BatBuoc ? '<span class="required">*</span>' : ''}
          </h3>
          ${renderQuestionInput(q)}
        </div>
      `;
    }).join('');
  }

  /**
   * Render input cho từng loại câu hỏi
   */
  function renderQuestionInput(question) {
    const qId = question.MaCauHoi;
    const type = question.LoaiCauHoi;

    switch(type) {
      case 'single':
      case 'entity_theloai':
      case 'entity_tacgia':
      case 'entity_hinhthuc':
      case 'entity_khoanggia':
      case 'entity_namxb':
      case 'entity_sotrang':
        return renderSingleChoice(question);

      case 'multi':
        return renderMultiChoice(question);

      case 'rating':
        return renderRating(question);

      case 'text':
        return renderText(question);

      default:
        return '<p>Loại câu hỏi không được hỗ trợ</p>';
    }
  }

  /**
   * Render câu hỏi chọn 1
   */
  function renderSingleChoice(question) {
    if (!question.options || question.options.length === 0) {
      return '<p class="no-options">Không có lựa chọn nào.</p>';
    }

    return `
      <div class="options-grid single-choice">
        ${question.options.map(opt => `
          <label class="option-item">
            <input type="radio" 
                   name="question-${question.MaCauHoi}" 
                   value="${opt.MaLuaChon}"
                   data-question="${question.MaCauHoi}"
                   data-option="${opt.MaLuaChon}">
            <span class="option-label">${escapeHtml(opt.NoiDungLuaChon)}</span>
          </label>
        `).join('')}
      </div>
    `;
  }

  /**
   * Render câu hỏi chọn nhiều
   */
  function renderMultiChoice(question) {
    if (!question.options || question.options.length === 0) {
      return '<p class="no-options">Không có lựa chọn nào.</p>';
    }

    return `
      <div class="options-grid multi-choice">
        ${question.options.map(opt => `
          <label class="option-item">
            <input type="checkbox" 
                   name="question-${question.MaCauHoi}" 
                   value="${opt.MaLuaChon}"
                   data-question="${question.MaCauHoi}"
                   data-option="${opt.MaLuaChon}">
            <span class="option-label">${escapeHtml(opt.NoiDungLuaChon)}</span>
          </label>
        `).join('')}
      </div>
    `;
  }

  /**
   * Render câu hỏi rating
   */
  function renderRating(question) {
    return `
      <div class="rating-stars">
        ${[1, 2, 3, 4, 5].map(star => `
          <span class="star" 
                data-question="${question.MaCauHoi}" 
                data-rating="${star}">★</span>
        `).join('')}
      </div>
    `;
  }

  /**
   * Render câu hỏi text
   */
  function renderText(question) {
    return `
      <textarea class="text-input" 
                data-question="${question.MaCauHoi}"
                placeholder="Nhập câu trả lời của bạn..."
                rows="3"></textarea>
    `;
  }

  /**
   * Gắn event handlers cho các câu hỏi
   */
  function attachQuestionHandlers(questions) {
    // Radio buttons (single choice)
    document.querySelectorAll('.single-choice input[type="radio"]').forEach(radio => {
      radio.addEventListener('change', (e) => {
        const qId = e.target.dataset.question;
        const optId = e.target.dataset.option;
        selectedAnswers[qId] = [{ optionId: parseInt(optId) }];
      });
    });

    // Checkboxes (multi choice)
    document.querySelectorAll('.multi-choice input[type="checkbox"]').forEach(checkbox => {
      checkbox.addEventListener('change', () => {
        const qId = checkbox.dataset.question;
        const checked = document.querySelectorAll(`input[data-question="${qId}"]:checked`);
        selectedAnswers[qId] = Array.from(checked).map(cb => ({
          optionId: parseInt(cb.dataset.option)
        }));
      });
    });

    // Rating stars
    document.querySelectorAll('.rating-stars .star').forEach(star => {
      star.addEventListener('click', (e) => {
        const qId = e.target.dataset.question;
        const rating = parseInt(e.target.dataset.rating);
        
        // Update visual
        const allStars = document.querySelectorAll(`.star[data-question="${qId}"]`);
        allStars.forEach((s, idx) => {
          s.classList.toggle('active', idx < rating);
        });

        selectedAnswers[qId] = [{ rating }];
      });
    });

    // Text inputs
    document.querySelectorAll('.text-input').forEach(textarea => {
      textarea.addEventListener('input', (e) => {
        const qId = e.target.dataset.question;
        const text = e.target.value.trim();
        if (text) {
          selectedAnswers[qId] = [{ freeText: text }];
        } else {
          delete selectedAnswers[qId];
        }
      });
    });
  }

  /**
   * Submit form sở thích
   */
  window.submitPreferenceForm = async function() {
    try {
      const customerId = localStorage.getItem('customerId');
      if (!customerId) {
        alert('Vui lòng đăng nhập để tiếp tục!');
        window.location.href = 'login.html';
        return;
      }

      // Validate required questions
      const requiredQuestions = currentForm.questions.filter(q => q.BatBuoc);
      const missingRequired = requiredQuestions.find(q => !selectedAnswers[q.MaCauHoi]);
      
      if (missingRequired) {
        alert(`Vui lòng trả lời câu hỏi: ${missingRequired.NoiDungCauHoi}`);
        return;
      }

      // Prepare answers array
      const answers = [];
      for (const [qId, answerList] of Object.entries(selectedAnswers)) {
        answerList.forEach(ans => {
          answers.push({
            questionId: parseInt(qId),
            optionId: ans.optionId || null,
            freeText: ans.freeText || null,
            rating: ans.rating || null
          });
        });
      }

      const consent = document.getElementById('consent-checkbox')?.checked ? 1 : 0;

      // Show loading
      const submitBtn = document.querySelector('.preference-submit-btn');
      const originalText = submitBtn.innerHTML;
      submitBtn.innerHTML = '⏳ Đang xử lý...';
      submitBtn.disabled = true;

      // Submit to API
      const response = await fetch(`${API_BASE}/preferences/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          makh: parseInt(customerId),
          formId: currentForm.MaForm,
          answers,
          consent
        })
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Có lỗi xảy ra');
      }

      // Success - show coupon code
      showSuccessModal(result.data.couponCode);

    } catch (error) {
      console.error('Lỗi submit form:', error);
      alert('Có lỗi xảy ra: ' + error.message);
      
      // Reset button
      const submitBtn = document.querySelector('.preference-submit-btn');
      if (submitBtn) {
        submitBtn.innerHTML = '🎉 Hoàn thành & Nhận mã Freeship';
        submitBtn.disabled = false;
      }
    }
  };

  /**
   * Hiển thị modal thành công với mã coupon
   */
  function showSuccessModal(couponCode) {
    closePreferenceModal();

    const successModal = document.createElement('div');
    successModal.className = 'preference-success-modal show';
    successModal.innerHTML = `
      <div class="success-content">
        <div class="success-icon">🎉</div>
        <h2>Chúc mừng bạn!</h2>
        <p>Bạn đã hoàn thành khảo sát sở thích</p>
        
        <div class="coupon-box">
          <div class="coupon-label">Mã Freeship của bạn:</div>
          <div class="coupon-code">${escapeHtml(couponCode || 'FREESHIP2025')}</div>
          <button class="copy-coupon-btn" onclick="copyCouponCode('${couponCode}')">
            📋 Sao chép mã
          </button>
        </div>

        <p class="success-note">
          ✨ Mã đã được lưu vào tài khoản của bạn<br>
          💡 Sử dụng ngay khi đặt hàng để nhận Freeship!
        </p>

        <button class="close-success-btn" onclick="closeSuccessModal()">
          Đóng
        </button>
      </div>
    `;

    document.body.appendChild(successModal);
  }

  /**
   * Copy mã coupon
   */
  window.copyCouponCode = function(code) {
    if (!code) return;
    
    navigator.clipboard.writeText(code).then(() => {
      const btn = document.querySelector('.copy-coupon-btn');
      if (btn) {
        const originalText = btn.innerHTML;
        btn.innerHTML = '✅ Đã sao chép!';
        setTimeout(() => {
          btn.innerHTML = originalText;
        }, 2000);
      }
    }).catch(err => {
      console.error('Lỗi copy:', err);
      alert('Mã của bạn: ' + code);
    });
  };

  /**
   * Đóng modal success
   */
  window.closeSuccessModal = function() {
    const modal = document.querySelector('.preference-success-modal');
    if (modal) {
      modal.classList.remove('show');
      setTimeout(() => modal.remove(), 300);
    }
  };

  /**
   * Đóng modal form
   */
  window.closePreferenceModal = function() {
    const modal = document.getElementById('preference-modal');
    if (modal) {
      modal.classList.remove('show');
      setTimeout(() => modal.remove(), 300);
    }
  };

  /**
   * Escape HTML
   */
  function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Initialize khi DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPreferenceWidget);
  } else {
    initPreferenceWidget();
  }

})();
