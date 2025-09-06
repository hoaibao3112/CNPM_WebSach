document.addEventListener('DOMContentLoaded', function() {
    // Kiểm tra trạng thái đăng nhập khi trang tải
    checkLoginStatus();
    
    // Xử lý form đăng nhập
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Xử lý quên mật khẩu
    setupForgotPassword();
    
    // Xử lý đăng xuất
    setupLogout();
});

// ========== HÀM XỬ LÝ ĐĂNG NHẬP ==========
async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errorMessage = document.getElementById('errorMessage');
    const btnSubmit = document.getElementById('btnSubmit');
    
    // Validate input
    if (!email || !password) {
        errorMessage.textContent = 'Vui lòng nhập đầy đủ email và mật khẩu';
        return;
    }

    try {
        btnSubmit.disabled = true;
        btnSubmit.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang xử lý...';
        
        const response = await fetch('http://localhost:5000/api/client/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: email,
                matkhau: password
            })
        });

        const data = await response.json();

        if (response.ok) {
            // Lưu thông tin user và token
            localStorage.setItem('user', JSON.stringify(data.user));
            localStorage.setItem('token', data.token);
            localStorage.setItem('customerId', data.user.makh); // Lưu ID khách hàng
            
            // Cập nhật giao diện
            updateAccountDisplay(data.user.tenkh);
            
            // Chuyển hướng về trang chủ
            window.location.href = 'index.html';
        } else {
            errorMessage.textContent = data.error || data.message || 'Đăng nhập thất bại';
        }
    } catch (error) {
        console.error('Lỗi đăng nhập:', error);
        errorMessage.textContent = 'Không thể kết nối đến server';
    } finally {
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = 'Đăng nhập';
    }
}

// ========== HÀM XỬ LÝ QUÊN MẬT KHẨU ==========
function setupForgotPassword() {
    // Mở modal quên mật khẩu
    const forgotPasswordLink = document.querySelector('a[href="#"]');
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', function(e) {
            e.preventDefault();
            document.getElementById('forgotPasswordModal').style.display = 'block';
        });
    }

    // Đóng modal
    const closeModal = document.querySelector('.close-modal');
    if (closeModal) {
        closeModal.addEventListener('click', function() {
            document.getElementById('forgotPasswordModal').style.display = 'none';
            resetForgotPasswordForm();
        });
    }

    // Gửi OTP
    const sendOtpBtn = document.getElementById('sendOtpBtn');
    if (sendOtpBtn) {
        sendOtpBtn.addEventListener('click', handleSendOTP);
    }

    // Xác nhận OTP
    const verifyOtpBtn = document.getElementById('verifyOtpBtn');
    if (verifyOtpBtn) {
        verifyOtpBtn.addEventListener('click', handleVerifyOTP);
    }

    // Đặt lại mật khẩu
    const resetPasswordBtn = document.getElementById('resetPasswordBtn');
    if (resetPasswordBtn) {
        resetPasswordBtn.addEventListener('click', handleResetPassword);
    }
}

async function handleSendOTP() {
    const email = document.getElementById('forgotEmail').value;
    const messageElement = document.getElementById('forgotPasswordMessage');
    const sendOtpBtn = document.getElementById('sendOtpBtn');

    if (!email) {
        showMessage(messageElement, 'Vui lòng nhập email', 'error');
        return;
    }

    try {
        sendOtpBtn.disabled = true;
        sendOtpBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang gửi...';

        const response = await fetch('http://localhost:5000/api/client/forgot-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email })
        });

        const data = await response.json();

        if (response.ok) {
            showMessage(messageElement, data.message || 'Mã OTP đã được gửi đến email của bạn', 'success');
            document.getElementById('step1').style.display = 'none';
            document.getElementById('step2').style.display = 'block';
            
            // Lưu email tạm thời
            sessionStorage.setItem('resetEmail', email);
        } else {
            showMessage(messageElement, data.error || data.message || 'Có lỗi xảy ra khi gửi OTP', 'error');
        }
    } catch (error) {
        console.error('Lỗi gửi OTP:', error);
        showMessage(messageElement, 'Không thể kết nối đến server', 'error');
    } finally {
        sendOtpBtn.disabled = false;
        sendOtpBtn.innerHTML = 'Gửi mã OTP';
    }
}

async function handleVerifyOTP() {
    const email = sessionStorage.getItem('resetEmail');
    const otp = document.getElementById('otpCode').value;
    const messageElement = document.getElementById('forgotPasswordMessage');
    const verifyOtpBtn = document.getElementById('verifyOtpBtn');

    if (!otp) {
        showMessage(messageElement, 'Vui lòng nhập mã OTP', 'error');
        return;
    }

    try {
        verifyOtpBtn.disabled = true;
        verifyOtpBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang xác nhận...';

        const response = await fetch('http://localhost:5000/api/client/verify-otp', {
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
            
            // Lưu token reset nếu có
            if (data.resetToken) {
                sessionStorage.setItem('resetToken', data.resetToken);
            }
        } else {
            showMessage(messageElement, data.error || data.message || 'Mã OTP không đúng hoặc đã hết hạn', 'error');
        }
    } catch (error) {
        console.error('Lỗi xác nhận OTP:', error);
        showMessage(messageElement, 'Không thể kết nối đến server', 'error');
    } finally {
        verifyOtpBtn.disabled = false;
        verifyOtpBtn.innerHTML = 'Xác nhận OTP';
    }
}

async function handleResetPassword() {
    const email = sessionStorage.getItem('resetEmail');
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const resetToken = sessionStorage.getItem('resetToken');
    const messageElement = document.getElementById('forgotPasswordMessage');
    const resetPasswordBtn = document.getElementById('resetPasswordBtn');

    if (!newPassword || !confirmPassword) {
        showMessage(messageElement, 'Vui lòng nhập đầy đủ mật khẩu', 'error');
        return;
    }

    if (newPassword !== confirmPassword) {
        showMessage(messageElement, 'Mật khẩu không khớp', 'error');
        return;
    }

    try {
        resetPasswordBtn.disabled = true;
        resetPasswordBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang xử lý...';

        const payload = { 
            email, 
            newPassword,
            confirmPassword
        };

        // Thêm token nếu có
        if (resetToken) {
            payload.token = resetToken;
        }

        const response = await fetch('http://localhost:5000/api/client/reset-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (response.ok) {
            showMessage(messageElement, data.message || 'Đặt lại mật khẩu thành công', 'success');
            
            // Xóa dữ liệu tạm
            sessionStorage.removeItem('resetEmail');
            sessionStorage.removeItem('resetToken');
            
            setTimeout(() => {
                document.getElementById('forgotPasswordModal').style.display = 'none';
                resetForgotPasswordForm();
                window.location.href = 'login.html';
            }, 2000);
        } else {
            showMessage(messageElement, data.error || data.message || 'Đặt lại mật khẩu thất bại', 'error');
        }
    } catch (error) {
        console.error('Lỗi đặt lại mật khẩu:', error);
        showMessage(messageElement, 'Không thể kết nối đến server', 'error');
    } finally {
        resetPasswordBtn.disabled = false;
        resetPasswordBtn.innerHTML = 'Đặt lại mật khẩu';
    }
}

// ========== HÀM HỖ TRỢ ==========
function checkLoginStatus() {
    const user = JSON.parse(localStorage.getItem('user'));
    const loginLink = document.getElementById('loginLink');
    const loggedInAccount = document.querySelector('.logged-in-account');
    const accountLink = document.getElementById('accountLink');

    if (user && (user.tenkh || user.hoten)) {
        // Ẩn nút đăng nhập, hiện nút tài khoản
        if (loginLink) loginLink.style.display = 'none';
        if (loggedInAccount) loggedInAccount.style.display = 'inline-block';
        if (accountLink) accountLink.innerHTML = `<i class="fas fa-user"></i> ${user.tenkh || user.hoten}`;
    } else {
        // Hiện nút đăng nhập, ẩn nút tài khoản
        if (loginLink) loginLink.style.display = 'inline-block';
        if (loggedInAccount) loggedInAccount.style.display = 'none';
    }
}

function setupLogout() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            localStorage.removeItem('user');
            localStorage.removeItem('token');
            window.location.href = 'index.html';
        });
    }
}

function updateAccountDisplay(userName) {
    const accountLink = document.querySelector('.top-links li a[href="login.html"]');
    if (accountLink) {
        accountLink.innerHTML = `<i class="fas fa-user"></i> ${userName}`;
    }
}

function showMessage(element, message, type) {
    element.textContent = message;
    element.className = 'message ' + type;
    element.style.display = 'block';
}

function resetForgotPasswordForm() {
    document.getElementById('forgotEmail').value = '';
    document.getElementById('otpCode').value = '';
    document.getElementById('newPassword').value = '';
    document.getElementById('confirmPassword').value = '';
    document.getElementById('forgotPasswordMessage').textContent = '';
    document.getElementById('forgotPasswordMessage').style.display = 'none';
    document.getElementById('step1').style.display = 'block';
    document.getElementById('step2').style.display = 'none';
    document.getElementById('step3').style.display = 'none';
}