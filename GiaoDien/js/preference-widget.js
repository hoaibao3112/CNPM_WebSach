(function() {
  'use strict';

  // Inject Styles
  if (!document.getElementById('preference-widget-styles')) {
    const style = document.createElement('style');
    style.id = 'preference-widget-styles';
    style.textContent = `
      .preference-floating-btn { 
        position: fixed; 
        bottom: 30px; 
        left: 30px; 
        background: linear-gradient(135deg, #ff416c 0%, #ff4b2b 100%);
        backdrop-filter: blur(15px);
        -webkit-backdrop-filter: blur(15px);
        color: white; 
        padding: 16px 28px; 
        border-radius: 50px; 
        box-shadow: 0 15px 35px rgba(255, 65, 108, 0.4); 
        cursor: pointer; 
        z-index: 2147482900; 
        opacity: 0; 
        transform: translateY(100px) scale(0.8); 
        transition: all 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275); 
        display: flex; 
        align-items: center; 
        gap: 16px; 
        border: 2px solid rgba(255, 255, 255, 0.3);
        max-width: calc(100vw - 60px);
        user-select: none;
      }
      .preference-floating-btn.show { opacity: 1; transform: translateY(0) scale(1); }
      .preference-floating-btn:hover { 
        transform: translateY(-8px) scale(1.05); 
        box-shadow: 0 25px 50px rgba(255, 65, 108, 0.6);
        background: linear-gradient(135deg, #ff4b2b 0%, #ff416c 100%);
      }
      .preference-floating-btn::before {
        content: '';
        position: absolute;
        inset: 0;
        border-radius: 50px;
        padding: 2px;
        background: linear-gradient(to right, rgba(255,255,255,0.8), rgba(255,255,255,0.1));
        -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
        mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
        -webkit-mask-composite: xor;
        mask-composite: exclude;
      }
      .prompt-icon-container {
        position: relative;
        width: 46px;
        height: 46px;
        background: rgba(255, 255, 255, 0.25);
        border-radius: 18px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
        flex-shrink: 0;
        box-shadow: inset 0 0 10px rgba(255,255,255,0.2);
        animation: pulse-ring 2s cubic-bezier(0.455, 0.03, 0.515, 0.955) infinite;
      }
      @keyframes pulse-ring {
        0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.4); }
        70% { transform: scale(1.05); box-shadow: 0 0 0 15px rgba(255, 255, 255, 0); }
        100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(255, 255, 255, 0); }
      }
      .prompt-icon-inner {
        animation: bounce-icon 3s ease-in-out infinite;
      }
      @keyframes bounce-icon {
        0%, 100% { transform: translateY(0) rotate(0deg); }
        25% { transform: translateY(-4px) rotate(-5deg); }
        75% { transform: translateY(-2px) rotate(5deg); }
      }
      .prompt-text-content { display: flex; flex-direction: column; gap: 2px; }
      .prompt-text-content strong { 
        font-size: 16px; 
        font-weight: 800; 
        letter-spacing: -0.3px; 
        text-shadow: 0 2px 4px rgba(0,0,0,0.1);
        white-space: nowrap; 
      }
      .prompt-text-content p { 
        font-size: 13px; 
        font-weight: 500; 
        opacity: 0.95; 
        margin: 0; 
        white-space: nowrap; 
      }
      .prompt-close-btn {
        position: absolute;
        top: -10px;
        right: 10px;
        width: 26px;
        height: 26px;
        background: white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        color: #ff416c;
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        opacity: 0;
        transform: scale(0.5);
        transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        z-index: 10;
      }
      .preference-floating-btn:hover .prompt-close-btn { opacity: 1; transform: scale(1); }
      .prompt-close-btn:hover { background: #f0f0f0; transform: scale(1.1) !important; }
      
      .notification-dot {
        position: absolute;
        top: -2px;
        right: -2px;
        width: 12px;
        height: 12px;
        background: #4cd137;
        border: 2px solid #ff416c;
        border-radius: 50%;
        animation: blink 1.5s infinite;
      }
      @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
      .preference-modal { position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: 9999; opacity: 0; pointer-events: none; transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1); }
      .preference-modal.show { opacity: 1; pointer-events: all; }
      .preference-modal-overlay { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.75); backdrop-filter: blur(8px); }
      .preference-modal-content { 
        position: absolute; 
        top: 50%; 
        left: 50%; 
        transform: translate(-50%, -45%) scale(0.95); 
        width: 95%; 
        max-width: 750px; 
        max-height: 85vh; 
        background: #fdfdfd; 
        border-radius: 32px; 
        overflow: hidden; 
        display: flex; 
        flex-direction: column; 
        transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1); 
        box-shadow: 0 30px 100px rgba(0,0,0,0.5);
      }
      .preference-modal.show .preference-modal-content { transform: translate(-50%, -50%) scale(1); }
      
      .preference-header { 
        padding: 50px 40px; 
        text-align: center; 
        background: linear-gradient(135deg, #ff416c 0%, #ff4b2b 100%); 
        color: white; 
        position: relative;
        overflow: hidden;
      }
      .preference-header::after {
        content: '';
        position: absolute;
        top: -50%;
        left: -50%;
        width: 200%;
        height: 200%;
        background: radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 60%);
        animation: rotate-bg 20s linear infinite;
      }
      @keyframes rotate-bg { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      
      .preference-header h2 { font-size: 28px; font-weight: 850; margin: 15px 0 10px; letter-spacing: -0.5px; position: relative; z-index: 1; }
      .preference-header p { font-size: 15px; opacity: 0.9; max-width: 500px; margin: 0 auto; line-height: 1.5; position: relative; z-index: 1; }
      .header-icon { font-size: 44px; margin-bottom: 10px; display: inline-block; animation: bounce-slow 3s infinite; position: relative; z-index: 1; }
      @keyframes bounce-slow { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }

      .preference-close-top {
        position: absolute;
        top: 20px;
        right: 20px;
        width: 36px;
        height: 36px;
        background: rgba(255, 255, 255, 0.2);
        border: none;
        border-radius: 50%;
        color: white;
        font-size: 20px;
        cursor: pointer;
        z-index: 10;
        transition: all 0.3s;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .preference-close-top:hover { background: rgba(255, 255, 255, 0.3); transform: rotate(90deg); }

      .progress-container { height: 6px; background: rgba(255, 255, 255, 0.2); position: relative; z-index: 2; }
      .progress-bar { height: 100%; background: #fff; width: 0%; transition: width 0.4s ease; box-shadow: 0 0 15px rgba(255,255,255,0.5); }

      .preference-form { flex: 1; overflow-y: auto; padding: 40px; scrollbar-width: thin; scrollbar-color: #ff416c #f0f0f0; }
      .question-block { margin-bottom: 40px; animation: slide-in-q 0.5s ease-out both; }
      @keyframes slide-in-q { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
      
      .question-title { font-size: 20px; font-weight: 800; margin-bottom: 20px; color: #1e272e; display: flex; align-items: flex-start; gap: 12px; line-height: 1.4; }
      .q-number { background: #ff416c; color: white; width: 28px; height: 28px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 14px; flex-shrink: 0; margin-top: 2px; }

      .options-grid { display: grid; grid-template-columns: 1fr; gap: 12px; }
      .option-item { 
        position: relative;
        display: flex; 
        align-items: center; 
        padding: 18px 22px; 
        background: white;
        border: 2px solid #f0f0f0; 
        border-radius: 20px; 
        cursor: pointer; 
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); 
        box-shadow: 0 4px 6px rgba(0,0,0,0.02);
      }
      .option-item:hover { border-color: #ff416c; background: #fffafa; transform: scale(1.02); box-shadow: 0 10px 20px rgba(255, 65, 108, 0.1); }
      .option-item.selected { border-color: #ff416c; background: #fff0f3; box-shadow: 0 10px 25px rgba(255, 65, 108, 0.15); }
      
      .option-item input { display: none; }
      .option-check { width: 22px; height: 22px; border: 2px solid #ddd; border-radius: 50%; margin-right: 15px; position: relative; transition: all 0.3s; flex-shrink: 0; }
      .option-item.selected .option-check { border-color: #ff416c; background: #ff416c; }
      .option-item.selected .option-check::after { content: '✓'; color: white; font-size: 12px; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); }

      .preference-footer { padding: 30px 40px; background: white; border-top: 1px solid #f0f0f0; display: flex; flex-direction: column; gap: 20px; }
      .preference-consent { display: flex; align-items: center; gap: 12px; font-size: 14px; color: #636e72; cursor: pointer; }
      .preference-consent input { width: 18px; height: 18px; accent-color: #ff416c; }
      
      .preference-submit-btn { 
        width: 100%; 
        padding: 20px; 
        background: linear-gradient(135deg, #ff416c 0%, #ff4b2b 100%); 
        color: white; 
        border: none; 
        border-radius: 24px; 
        font-size: 18px;
        font-weight: 800; 
        cursor: pointer; 
        transition: all 0.3s;
        box-shadow: 0 10px 30px rgba(255, 65, 108, 0.3);
      }
      .preference-submit-btn:hover { transform: translateY(-3px); box-shadow: 0 15px 40px rgba(255, 65, 108, 0.5); }
      .preference-submit-btn:disabled { background: #ccc; box-shadow: none; cursor: not-allowed; }

      .preference-success-modal { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.85); z-index: 10000; display: flex; align-items: center; justify-content: center; opacity: 0; pointer-events: none; transition: opacity 0.4s; }
      .preference-success-modal.show { opacity: 1; pointer-events: all; }
      .success-content { 
        background: white; 
        padding: 50px 40px; 
        border-radius: 36px; 
        max-width: 500px; 
        width: 90%;
        text-align: center; 
        position: relative;
        animation: pop-up 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
      }
      @keyframes pop-up { from { transform: scale(0.8) translateY(50px); } to { transform: scale(1) translateY(0); } }
      .success-icon { font-size: 64px; margin-bottom: 20px; }
      
      .coupon-card { 
        background: #fdf2f4; 
        border: 3px dashed #ff416c; 
        padding: 30px 20px; 
        border-radius: 24px; 
        margin: 30px 0; 
        position: relative;
      }
      .coupon-card::before, .coupon-card::after { content: ''; position: absolute; width: 20px; height: 20px; background: white; border-radius: 50%; top: 50%; transform: translateY(-50%); }
      .coupon-card::before { left: -12px; } .coupon-card::after { right: -12px; }

      .coupon-code-text { font-size: 32px; font-weight: 900; color: #ff416c; letter-spacing: 2px; font-family: monospace; }
      .copy-btn { margin-top: 15px; background: #ff416c; color: white; border: none; padding: 10px 20px; border-radius: 12px; font-weight: 700; cursor: pointer; transition: all 0.2s; }
      .copy-btn:hover { background: #ef315b; transform: scale(1.05); }
      
      .close-btn { width: 100%; padding: 16px; background: #2f3640; color: white; border: none; border-radius: 20px; font-weight: 700; cursor: pointer; transition: all 0.2s; margin-top: 10px; }
      .close-btn:hover { background: #1e272e; }
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
      <div class="prompt-icon-container">
        <div class="prompt-icon-inner">🎁</div>
        <div class="notification-dot"></div>
      </div>
      <div class="prompt-text-content">
        <strong>Nhận mã Freeship ngay! 🎁</strong>
        <p>Tham gia khảo sát chỉ 30 giây</p>
      </div>
      <div class="prompt-close-btn" id="preference-prompt-close">
        <i class="fas fa-times"></i>
      </div>
    `;

    floatingBtn.addEventListener('click', (e) => {
      const closeBtn = e.target.closest('#preference-prompt-close');
      if (closeBtn) {
        e.stopPropagation();
        floatingBtn.style.transform = 'translateY(20px) scale(0.9)';
        floatingBtn.style.opacity = '0';
        setTimeout(() => floatingBtn.remove(), 400);
        return;
      }

      // Mở modal khảo sát ngay tại chỗ
      floatingBtn.style.transform = 'translateY(20px) scale(0.9)';
      floatingBtn.style.opacity = '0';
      setTimeout(() => {
        floatingBtn.remove();
        loadAndShowPreferenceForm();
      }, 400);
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
        <button class="preference-close-top" onclick="closePreferenceModal()">×</button>
        
        <div class="preference-header">
          <div class="header-icon">🎁</div>
          <h2>${escapeHtml(form.TenForm || 'Khám phá sách dành cho bạn')}</h2>
          <p>${escapeHtml(form.MoTa || 'Hãy chia sẻ sở thích của bạn để chúng tôi có thể gợi ý những cuốn sách phù hợp nhất!')}</p>
        </div>

        <div class="progress-container">
          <div class="progress-bar" id="survey-progress"></div>
        </div>

        <div class="preference-form" id="preference-form">
          ${renderQuestions(form.questions || [])}
        </div>

        <div class="preference-footer">
          <label class="preference-consent">
            <input type="checkbox" id="consent-checkbox" checked>
            <span>Tôi đồng ý sử dụng dữ liệu này để nhận gợi ý sách cá nhân hóa</span>
          </label>
          <button class="preference-submit-btn" onclick="submitPreferenceForm()">
            ✨ Hoàn thành & Nhận mã Freeship
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
            <span class="q-number">${index + 1}</span>
            <span>${escapeHtml(q.NoiDungCauHoi)}</span>
            ${q.BatBuoc ? '<span class="required" style="color: #ff416c; margin-left: 5px;">*</span>' : ''}
          </h3>
          ${renderQuestionInput(q)}
        </div>
      `;
    }).join('');
  }

  /**
   * Cập nhật thanh tiến trình
   */
  function updateProgressBar() {
    const questions = currentForm.questions || [];
    const total = questions.length;
    if (total === 0) return;
    
    const answered = questions.filter(q => selectedAnswers[q.MaCauHoi]).length;
    const progress = (answered / total) * 100;
    
    const bar = document.getElementById('survey-progress');
    if (bar) bar.style.width = `${progress}%`;
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
          <label class="option-item" data-q-id="${question.MaCauHoi}">
            <input type="radio" 
                   name="question-${question.MaCauHoi}" 
                   value="${opt.MaLuaChon}"
                   data-question="${question.MaCauHoi}"
                   data-option="${opt.MaLuaChon}">
            <div class="option-check"></div>
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
        
        // Update visual
        document.querySelectorAll(`.option-item[data-q-id="${qId}"]`).forEach(item => {
          item.classList.toggle('selected', item.querySelector('input').checked);
        });
        
        updateProgressBar();
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
        <div class="success-icon">🎊</div>
        <h2 style="font-weight: 900; color: #1e272e; margin-bottom: 10px;">Tuyệt vời!</h2>
        <p style="color: #636e72; font-size: 16px;">Bạn đã nhận được mã Freeship độc quyền</p>
        
        <div class="coupon-card">
          <div class="coupon-code-text">${escapeHtml(couponCode || 'SURVEY2026')}</div>
          <button class="copy-btn" onclick="copyCouponCode('${couponCode}')">
            📋 Sao chép mã ngay
          </button>
        </div>

        <p style="font-size: 14px; color: #2ecc71; font-weight: 700; margin-bottom: 30px;">
          ✓ Mã đã được lưu vào hồ sơ của bạn
        </p>

        <button class="close-btn" onclick="closeSuccessModal()">
          Bắt đầu mua sắm ngay 🛍️
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
    const token = (document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1] || null) || localStorage.getItem('authToken');
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

