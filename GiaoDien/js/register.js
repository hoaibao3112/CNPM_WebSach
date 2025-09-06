document.addEventListener('DOMContentLoaded', function() {
    // Xử lý form gửi OTP
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', handleSendOTP);
    }

    // Xử lý form xác nhận OTP
    const otpForm = document.getElementById('otpForm');
    if (otpForm) {
        otpForm.addEventListener('submit', handleVerifyOTP);
    }

    // Xử lý form đặt mật khẩu
    const passwordForm = document.getElementById('passwordForm');
    if (passwordForm) {
        passwordForm.addEventListener('submit', handleSetPassword);
    }
});

// ========== HÀM XỬ LÝ GỬI OTP ==========
async function handleSendOTP(e) {
    e.preventDefault();

    const username = document.getElementById('username').value.trim();
    const email = document.getElementById('email').value.trim();
    const messageElement = document.getElementById('registerMessage');
    const sendOtpBtn = document.getElementById('sendOtpBtn');

    console.log('Dữ liệu gửi:', { tenkh: username, email });

    if (!username || !email) {
        showMessage(messageElement, 'Vui lòng nhập đầy đủ tên đăng nhập và email', 'error');
        return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showMessage(messageElement, 'Email không hợp lệ', 'error');
        return;
    }

    if (username.length > 100) {
        showMessage(messageElement, 'Tên đăng nhập không được vượt quá 100 ký tự', 'error');
        return;
    }

    try {
        sendOtpBtn.disabled = true;
        sendOtpBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang gửi...';

        const payload = { tenkh: username, email }; // Chỉ gửi tenkh và email
        console.log('Payload gửi:', payload); // Debug

        const response = await fetch('http://localhost:5000/api/client/register/send-otp', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        console.log('Phản hồi từ server:', data);

        if (response.ok) {
            showMessage(messageElement, data.message || 'Mã OTP đã được gửi đến email của bạn', 'success');
            document.getElementById('step1').style.display = 'none';
            document.getElementById('step2').style.display = 'block';
            sessionStorage.setItem('registerEmail', email);
            sessionStorage.setItem('registerUsername', username);
        } else {
            const errorMsg = data.error || (data.errors ? data.errors.join(', ') : 'Lỗi không xác định');
            showMessage(messageElement, errorMsg, 'error');
            console.error('Chi tiết lỗi:', data);
        }
    } catch (error) {
        console.error('Lỗi gửi OTP:', error);
        showMessage(messageElement, 'Không thể kết nối đến server', 'error');
    } finally {
        sendOtpBtn.disabled = false;
        sendOtpBtn.innerHTML = 'Gửi mã OTP';
    }
}

// ========== HÀM XỬ LÝ XÁC NHẬN OTP ==========
async function handleVerifyOTP(e) {
    e.preventDefault();

    const email = sessionStorage.getItem('registerEmail');
    const otp = document.getElementById('otpCode').value;
    const messageElement = document.getElementById('otpMessage');
    const verifyOtpBtn = document.getElementById('verifyOtpBtn');

    if (!otp) {
        showMessage(messageElement, 'Vui lòng nhập mã OTP', 'error');
        return;
    }

    try {
        verifyOtpBtn.disabled = true;
        verifyOtpBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang xác nhận...';

        const response = await fetch('http://localhost:5000/api/client/register/verify-otp', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, otp })
        });

        const data = await response.json();

        if (response.ok) {
            showMessage(messageElement, data.message || 'Xác nhận OTP thành công', 'success');
            document.getElementById('step2').style.display = 'none';
            document.getElementById('step3').style.display = 'block';
            if (data.resetToken) {
                sessionStorage.setItem('registerToken', data.resetToken);
            }
        } else {
            showMessage(messageElement, data.error || 'Mã OTP không đúng hoặc đã hết hạn', 'error');
        }
    } catch (error) {
        console.error('Lỗi xác nhận OTP:', error);
        showMessage(messageElement, 'Không thể kết nối đến server', 'error');
    } finally {
        verifyOtpBtn.disabled = false;
        verifyOtpBtn.innerHTML = 'Xác nhận OTP';
    }
}

// ========== HÀM XỬ LÝ ĐẶT MẬT KHẨU ==========
async function handleSetPassword(e) {
    e.preventDefault();

    const email = sessionStorage.getItem('registerEmail');
    const username = sessionStorage.getItem('registerUsername');
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const resetToken = sessionStorage.getItem('registerToken');
    const messageElement = document.getElementById('passwordMessage');
    const setPasswordBtn = document.getElementById('setPasswordBtn');

    if (!password || !confirmPassword) {
        showMessage(messageElement, 'Vui lòng nhập đầy đủ mật khẩu', 'error');
        return;
    }

    if (password !== confirmPassword) {
        showMessage(messageElement, 'Mật khẩu không khớp', 'error');
        return;
    }

    if (password.length < 8) {
        showMessage(messageElement, 'Mật khẩu phải có ít nhất 8 ký tự', 'error');
        return;
    }

    try {
        setPasswordBtn.disabled = true;
        setPasswordBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang xử lý...';

        const response = await fetch('http://localhost:5000/api/client/register/set-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email,
                tenkh: username,
                matkhau: password,
                token: resetToken
                // sdt: null (nếu không bắt buộc, có thể bỏ qua)
            })
        });

        const data = await response.json();

        if (response.ok) {
            showMessage(messageElement, data.message || 'Đăng ký thành công!', 'success');
            sessionStorage.removeItem('registerEmail');
            sessionStorage.removeItem('registerUsername');
            sessionStorage.removeItem('registerToken');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);
        } else {
            showMessage(messageElement, data.error || 'Đăng ký thất bại', 'error');
        }
    } catch (error) {
        console.error('Lỗi đặt mật khẩu:', error);
        showMessage(messageElement, 'Không thể kết nối đến server', 'error');
    } finally {
        setPasswordBtn.disabled = false;
        setPasswordBtn.innerHTML = 'Đặt mật khẩu';
    }
}
      // ========== HÀM HIỂN THỊ THÔNG BÁO ==========

      function showMessage(element, message, type = 'info') {
          if (!element) return;
          element.textContent = message;
          element.className = '';
          element.classList.add('message', type);
          element.style.display = 'block';
          setTimeout(() => {
        element.style.display = 'none';
          }, 4000);
      }