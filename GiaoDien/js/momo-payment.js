/**
 * MoMo Payment Integration
 * Xử lý: Redirect tới MoMo, Xác minh kết quả thanh toán
 */

// ===== MOMO PAYMENT =====

/**
 * Tạo link thanh toán MoMo
 * @param {number} orderId - Mã đơn hàng
 * @param {number} amount - Số tiền (VND)
 * @param {string} orderInfo - Mô tả đơn hàng (optional)
 */
async function createMoMoPayment(orderId, amount, orderInfo = '') {
  try {
    if (!orderId || !amount || amount <= 0) {
      throw new Error('Thông tin đơn hàng không hợp lệ');
    }

    const token = (document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1] || null);
    if (!token) {
      alert('Vui lòng đăng nhập để thanh toán');
      window.location.href = 'login.html';
      return;
    }

    const _apiBase = (window.API_CONFIG && window.API_CONFIG.BASE_URL) || 'https://your-backend-url.com';

    // Show loading
    showLoadingSpinner('Đang tạo link thanh toán MoMo...');

    const response = await fetch(`${_apiBase}/api/payments/create`, {
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

    console.log('[MoMo] Create payment response:', data);

    if (response.ok && data.data) {
      const paymentUrl = (typeof data.data === 'string') ? data.data : (data.data.paymentUrl || data.data.payUrl);
      
      if (paymentUrl && typeof paymentUrl === 'string') {
        console.log('[MoMo] Redirecting to:', paymentUrl);
        window.location.href = paymentUrl;
      } else {
        console.error('[MoMo] paymentUrl is missing or not a string:', data);
        alert('Lỗi: Không nhận được liên kết thanh toán hợp lệ từ MoMo');
      }
    } else {
      alert(data.message || 'Lỗi tạo link thanh toán MoMo');
      console.error('MoMo Payment Error:', data);
    }
  } catch (error) {
    hideLoadingSpinner();
    console.error('MoMo Payment Error Catch:', error);
    alert(`Lỗi hệ thống: ${error.message}`);
  }
}

/**
 * Xác minh kết quả thanh toán MoMo từ URL
 * (Được gọi từ order-confirmation.html)
 */
function verifyMoMoPaymentResult() {
  const urlParams = new URLSearchParams(window.location.search);
  const resultCode = parseInt(urlParams.get('resultCode'));
  const transId = urlParams.get('transId');
  const orderId = urlParams.get('orderId');

  const messageElement = document.getElementById('paymentMessage');
  const statusElement = document.getElementById('paymentStatus');

  if (resultCode === 0 || resultCode === '0') {
    // Thanh toán thành công
    if (messageElement) {
      messageElement.textContent = '✅ Thanh toán MoMo thành công!';
      messageElement.className = 'success-message';
    }
    if (statusElement) {
      statusElement.innerHTML = `
        <div class="payment-success">
          <h2>🎉 Thanh Toán Thành Công</h2>
          <p>Mã giao dịch: <strong>${transId}</strong></p>
          <p>Mã đơn hàng: <strong>#${orderId}</strong></p>
          <p>Cảm ơn bạn đã mua hàng!</p>
          <a href="index.html" class="btn btn-primary">Quay về trang chủ</a>
        </div>
      `;
    }
  } else {
    // Thanh toán thất bại
    if (messageElement) {
      messageElement.textContent = '❌ Thanh toán MoMo thất bại!';
      messageElement.className = 'error-message';
    }
    if (statusElement) {
      statusElement.innerHTML = `
        <div class="payment-failed">
          <h2>❌ Thanh Toán Thất Bại</h2>
          <p>Mã lỗi: <strong>${resultCode}</strong></p>
          <p>Vui lòng thử lại hoặc chọn phương thức thanh toán khác.</p>
          <a href="orders.html" class="btn btn-primary">Quay lại đơn hàng</a>
        </div>
      `;
    }
  }
}

/**
 * Xử lý nút thanh toán MoMo trong giỏ hàng
 */
function handleMoMoCheckout() {
  // Lấy thông tin từ order form
  const orderId = document.getElementById('orderId')?.value;
  const totalAmount = parseFloat(
    document.getElementById('totalAmount')?.value ||
    document.getElementById('amountTotal')?.textContent?.replace(/[^\d]/g, '') ||
    0
  );

  if (!orderId || totalAmount <= 0) {
    alert('Vui lòng hoàn tất thông tin đơn hàng trước');
    return;
  }

  const customerName = document.getElementById('customerName')?.value || '';
  const orderInfo = `${customerName} - Đơn hàng #${orderId}`;

  createMoMoPayment(orderId, totalAmount, orderInfo);
}

/**
 * Show loading spinner
 */
function showLoadingSpinner(message = 'Đang xử lý...') {
  const spinner = document.createElement('div');
  spinner.id = 'momoLoadingSpinner';
  spinner.innerHTML = `
    <div style="
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
    ">
      <div style="
        background: white;
        padding: 30px;
        border-radius: 10px;
        text-align: center;
      ">
        <div style="
          border: 4px solid #f3f3f3;
          border-top: 4px solid #C0392B;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          animation: spin 1s linear infinite;
          margin: 0 auto 15px;
        "></div>
        <p>${message}</p>
      </div>
      <style>
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      </style>
    </div>
  `;
  document.body.appendChild(spinner);
}

/**
 * Hide loading spinner
 */
function hideLoadingSpinner() {
  const spinner = document.getElementById('momoLoadingSpinner');
  if (spinner) {
    spinner.remove();
  }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
  // Verify payment result if on order-confirmation page
  if (window.location.pathname.includes('order-confirmation')) {
    verifyMoMoPaymentResult();
  }

  // Setup MoMo checkout button
  const momoCheckoutBtn = document.getElementById('momoCheckoutBtn');
  if (momoCheckoutBtn) {
    momoCheckoutBtn.addEventListener('click', handleMoMoCheckout);
  }
});

// CSS styles for payment messages
const style = document.createElement('style');
style.textContent = `
  .success-message {
    color: #27ae60;
    background-color: #d5f4e6;
    padding: 15px;
    border-radius: 5px;
    margin-bottom: 20px;
  }

  .error-message {
    color: #c0392b;
    background-color: #fadbd8;
    padding: 15px;
    border-radius: 5px;
    margin-bottom: 20px;
  }

  .payment-success {
    text-align: center;
    padding: 30px;
    background: linear-gradient(135deg, #d5f4e6 0%, #c3e9dd 100%);
    border-radius: 10px;
    border-left: 5px solid #27ae60;
  }

  .payment-failed {
    text-align: center;
    padding: 30px;
    background: linear-gradient(135deg, #fadbd8 0%, #f5b7b1 100%);
    border-radius: 10px;
    border-left: 5px solid #c0392b;
  }

  .btn {
    display: inline-block;
    padding: 12px 30px;
    margin-top: 15px;
    border-radius: 5px;
    text-decoration: none;
    font-weight: 600;
    transition: all 0.3s ease;
  }

  .btn-primary {
    background-color: #C0392B;
    color: white;
  }

  .btn-primary:hover {
    background-color: #962d22;
    transform: translateY(-2px);
  }
`;
document.head.appendChild(style);
