(function() {
  'use strict';

  // Inject Styles
  if (!document.getElementById('preference-widget-styles')) {
    const style = document.createElement('style');
    style.id = 'preference-widget-styles';
    style.textContent = `
      .preference-floating-btn { position: fixed; bottom: 30px; left: 30px; background: linear-gradient(135deg, #B03A2E 0%, #E74C3C 100%); color: white; padding: 12px 20px; border-radius: 16px; box-shadow: 0 10px 30px rgba(176, 58, 46, 0.3); cursor: pointer; z-index: 9998; opacity: 0; transform: translateX(-20px); transition: all 0.4s; display: flex; align-items: center; gap: 12px; }
      .preference-floating-btn.show { opacity: 1; transform: translateX(0); }
      .preference-floating-btn:hover { transform: scale(1.05) translateX(5px); box-shadow: 0 15px 40px rgba(176, 58, 46, 0.4); }
      .prompt-icon { font-size: 20px; }
      .prompt-text strong { display: block; font-size: 13px; line-height: 1.2; }
      .prompt-text p { font-size: 11px; opacity: 0.9; margin: 0; }
      .preference-modal { position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: 9999; opacity: 0; pointer-events: none; transition: opacity 0.3s; }
      .preference-modal.show { opacity: 1; pointer-events: all; }
      .preference-modal-overlay { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.7); backdrop-filter: blur(5px); }
      .preference-modal-content { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) scale(0.9); width: 90%; max-width: 700px; max-height: 90vh; background: white; border-radius: 24px; overflow: hidden; display: flex; flex-direction: column; transition: transform 0.3s; }
      .preference-modal.show .preference-modal-content { transform: translate(-50%, -50%) scale(1); }
      .preference-header { padding: 40px 30px; text-align: center; background: linear-gradient(135deg, #C0392B 0%, #e74c3c 100%); color: white; }
      .preference-form { flex: 1; overflow-y: auto; padding: 30px; }
      .question-block { margin-bottom: 24px; padding-bottom: 24px; border-bottom: 1px solid #eee; }
      .question-title { font-size: 18px; font-weight: 700; margin-bottom: 16px; color: #1a1a1a; }
      .option-item { display: flex; align-items: center; padding: 14px; border: 1px solid #eee; border-radius: 12px; cursor: pointer; margin-bottom: 8px; transition: all 0.2s; }
      .option-item:hover { border-color: #C0392B; background: #fff5f5; }
      .preference-submit-btn { width: 100%; padding: 16px; background: #C0392B; color: white; border: none; border-radius: 30px; font-weight: 700; cursor: pointer; }
      .preference-success-modal { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); z-index: 10000; display: flex; align-items: center; justify-content: center; opacity: 0; pointer-events: none; transition: opacity 0.3s; }
      .preference-success-modal.show { opacity: 1; pointer-events: all; }
      .success-content { background: white; padding: 40px; border-radius: 24px; max-width: 450px; text-align: center; }
      .coupon-box { background: #C0392B; color: white; padding: 24px; border-radius: 16px; margin: 24px 0; }
      .coupon-code { font-size: 28px; font-weight: 800; letter-spacing: 2px; }
    `;
    document.head.appendChild(style);
  }

  const API_BASE = `${window.API_CONFIG.BASE_URL}/api`;
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

      // Lấy form active hiện tại từ server
      const formResp = await fetch(`${API_BASE}/preferences/form`);
      const formResult = await formResp.json();

      if (!formResult.success || !formResult.data) {
        // Nếu không có form active, không hiển thị
        console.log('Không có form sở thích đang hoạt động');
        return;
      }

      // Lưu form hiện tại vào biến global để tái sử dụng
      currentForm = formResult.data;

      const response = await fetch(`${API_BASE}/preferences/check?makh=${customerId}`);
      const result = await response.json();

      // Nếu khách đã điền và phản hồi gần nhất là cho chính form active -> không hiển thị
      if (result.success && result.data.hasPreferences && result.data.latestResponse && Number(result.data.latestResponse.MaForm) === Number(currentForm.MaForm)) {
        console.log('Khách hàng đã điền form sở thích (phiên bản mới nhất)');
        return;
      }

      // Nếu chưa điền form active (hoặc đã điền nhưng cho form cũ) -> hiển thị widget mời điền
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
      // Use currentForm if already loaded by checkUserPreferences, otherwise fetch
      if (!currentForm) {
        const response = await fetch(`${API_BASE}/preferences/form`);
        const result = await response.json();

        if (!result.success || !result.data) {
          throw new Error('Không thể tải form sở thích');
        }

        currentForm = result.data;
      }

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

      // Success - save coupon to customer's profile (localStorage) and show coupon code
      const couponCode = result.data.couponCode;
      try {
        await saveCustomerCouponsToLocal(customerId);
      } catch (err) {
        // Fallback: if we cannot fetch issued coupons, append the returned code to localStorage
        appendCouponToLocalFallback(couponCode);
      }

      showSuccessModal(couponCode);

      // Reload personalized recommendations component
      reloadRecommendations();

      // Re-enable submit button and reset text
      if (submitBtn) {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
      }

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
   * Reload recommendations component
   */
  function reloadRecommendations() {
    // Gọi lại init của PersonalizedRecommendations component nếu tồn tại
    if (window.PersonalizedRecommendations && typeof window.PersonalizedRecommendations.init === 'function') {
      console.log('🔄 Reload personalized recommendations...');
      setTimeout(() => {
        window.PersonalizedRecommendations.init();
      }, 1000); // Delay 1s để đảm bảo data đã được lưu vào DB
    }
  }

  /**
   * Lấy danh sách coupon đã được phát cho khách hàng từ server và lưu vào localStorage
   */
  async function saveCustomerCouponsToLocal(customerId) {
    if (!customerId) throw new Error('Missing customerId');
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    const resp = await fetch(`${API_BASE}/coupons/my-coupons?makh=${customerId}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    const json = await resp.json();
    if (!json.success) throw new Error('Không lấy được danh sách coupon');
    const coupons = json.data || [];

    // Map server response to a simple client-friendly shape used by profile page
    const mapped = coupons.map(item => ({
      maPhatHanh: item.MaPhatHanh || null,
      code: item.MaPhieu || '',
      ngay_lay: item.NgayPhatHanh ? new Date(item.NgayPhatHanh).toLocaleDateString('vi-VN') : '',
      expiry: null, // expiry removed from phieugiamgia schema; promotions may carry expiry
      status: item.Status || (item.NgaySuDung ? 'used' : (item.TrangThai === 0 ? 'inactive' : 'available')),
      MaKM: item.MaKM || null,
      MoTa: item.MoTa || ''
    }));

    // Save to localStorage for profile page to read
    localStorage.setItem('myPromos', JSON.stringify(mapped));
  }

  // Fallback: nếu không thể gọi API, thêm mã coupon tạm thời vào localStorage
  function appendCouponToLocalFallback(code) {
    if (!code) return;
    const existing = JSON.parse(localStorage.getItem('myPromos') || '[]');
    if (existing.some(p => p.code === code)) return;
    existing.unshift({ maPhatHanh: null, code, ngay_lay: new Date().toLocaleDateString('vi-VN'), expiry: null, status: 'available', MaKM: null, MoTa: '' });
    localStorage.setItem('myPromos', JSON.stringify(existing));
  }

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

