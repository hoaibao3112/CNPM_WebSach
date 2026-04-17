/**
 * ZaloPay Payment Integration
 * Xử lý: Redirect tới ZaloPay, Xác minh kết quả thanh toán
 */

// ===== ZALOPAY PAYMENT =====

/**
 * Tạo link thanh toán ZaloPay
 * @param {number} orderId - Mã đơn hàng
 * @param {number} amount - Số tiền (VND)
 * @param {string} orderInfo - Mô tả đơn hàng (optional)
 */
async function createZaloPayPayment(orderId, amount, orderInfo = '') {
  try {
    if (!orderId || !amount || amount <= 0) {
      throw new Error('Thông tin đơn hàng không hợp lệ');
    }

    const token = localStorage.getItem('token');
    if (!token) {
      alert('Vui lòng đăng nhập để thanh toán');
      window.location.href = 'login.html';
      return;
    }

    const _apiBase = (window.API_CONFIG && window.API_CONFIG.BASE_URL) || 'https://your-backend-url.com';

    // Show loading
    showLoadingSpinner('Đang tạo link thanh toán ZaloPay...');

    const response = await fetch(`${_apiBase}/api/payments/zalopay/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        orderId,
        amount: Math.round(amount),
        orderInfo: orderInfo || `Thanh toán đơn hàng #${orderId}`
      })
    });

    const data = await response.json();
    hideLoadingSpinner();

    console.log('[ZaloPay] Create payment response:', data);

    if (response.ok && data.data) {
      console.log('✅ ZaloPay payment URL generated:', data.data.paymentUrl);
      
      // Redirect to ZaloPay payment portal
      setTimeout(() => {
        window.location.href = data.data.paymentUrl;
      }, 500);
      
      return true;
    } else {
      const errorMsg = data.message || 'Không thể tạo link thanh toán ZaloPay';
      console.error('❌ ZaloPay Payment Error:', errorMsg);
      alert('Lỗi: ' + errorMsg);
      return false;
    }
  } catch (error) {
    hideLoadingSpinner();
    console.error('❌ ZaloPay Payment Exception:', error);
    alert('Lỗi: ' + error.message);
    return false;
  }
}

/**
 * Hiển thị Loading Spinner
 */
function showLoadingSpinner(message = 'Đang xử lý...') {
  let spinner = document.getElementById('loading-spinner');
  
  if (!spinner) {
    spinner = document.createElement('div');
    spinner.id = 'loading-spinner';
    spinner.innerHTML = `
      <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 9999;">
        <div style="background: white; padding: 30px; border-radius: 10px; text-align: center;">
          <i class="fas fa-spinner fa-spin" style="font-size: 40px; color: #FFC600; margin-bottom: 15px;"></i>
          <p style="margin: 10px 0; font-size: 16px; color: #333;">${message}</p>
          <p style="font-size: 12px; color: #999;">Vui lòng chờ...</p>
        </div>
      </div>
    `;
    document.body.appendChild(spinner);
  } else {
    spinner.style.display = 'flex';
  }
}

/**
 * Ẩn Loading Spinner
 */
function hideLoadingSpinner() {
  const spinner = document.getElementById('loading-spinner');
  if (spinner) {
    spinner.style.display = 'none';
  }
}

/**
 * Format price to Vietnamese format
 */
function formatPrice(price) {
  if (!price) return '0đ';
  return parseInt(price).toLocaleString('vi-VN') + 'đ';
}

// ===== DOM EVENT HANDLERS =====

document.addEventListener('DOMContentLoaded', function() {
  // ZaloPay Modal Handler
  const zaloPayConfirmBtn = document.getElementById('zalopay-confirm-btn');
  
  if (zaloPayConfirmBtn) {
    zaloPayConfirmBtn.addEventListener('click', async function() {
      const orderId = this.dataset.orderId;
      const amount = this.dataset.amount;
      const orderInfo = this.dataset.orderInfo;
      
      if (!orderId || !amount) {
        alert('Thông tin đơn hàng không đầy đủ');
        return;
      }
      
      // Close modal
      document.getElementById('ZALOPAY').style.display = 'none';
      
      // Create payment
      await createZaloPayPayment(orderId, amount, orderInfo);
    });
  }
});

/**
 * Xử lý ZaloPay return khi user quay lại từ cổng thanh toán
 * Hàm này được gọi từ order-confirmation.js
 */
function handleZaloPayReturn(params) {
  const appTransId = params.get('appTransId');
  const returnCode = params.get('returnCode');
  const zpTransToken = params.get('zpTransToken');
  
  console.log('🟡 ZaloPay Return Handler - Params:', {
    appTransId,
    returnCode,
    zpTransToken
  });
  
  // Return code 1 = Success
  if (returnCode === '1') {
    return {
      success: true,
      message: 'Thanh toán ZaloPay thành công!',
      paymentMethod: 'ZaloPay',
      appTransId,
      zpTransToken
    };
  } else {
    return {
      success: false,
      message: 'Thanh toán ZaloPay thất bại',
      paymentMethod: 'ZaloPay',
      returnCode
    };
  }
}

/**
 * Gọi API để truy vấn trạng thái thanh toán ZaloPay
 * (Optional: nếu backend cung cấp endpoint này)
 */
async function queryZaloPayStatus(appTransId) {
  try {
    const token = localStorage.getItem('token');
    const _apiBase = (window.API_CONFIG && window.API_CONFIG.BASE_URL) || 'https://your-backend-url.com';
    
    const response = await fetch(`${_apiBase}/api/payments/zalopay/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ appTransId })
    });
    
    const data = await response.json();
    console.log('ZaloPay Query Response:', data);
    
    return data;
  } catch (error) {
    console.error('ZaloPay Query Error:', error);
    return null;
  }
}
