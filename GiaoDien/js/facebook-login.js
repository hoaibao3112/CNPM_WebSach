/**
 * Facebook Login Integration
 * Xử lý: FB SDK init, Login, Logout
 */

// Check HTTPS environment
const isHttps = window.location.protocol === 'https:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const isFacebookAvailable = isHttps || (window.location.protocol === 'http:' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'));

// Facebook SDK Initialize
window.fbAsyncInit = function() {
  try {
    const facebookAppId = window.API_CONFIG?.FACEBOOK_CLIENT_ID || '4294997817425546';
    FB.init({
      appId: facebookAppId,
      cookie: true,
      xfbml: true,
      version: 'v18.0'
    });

    console.log('✅ Facebook SDK initialized with App ID:', facebookAppId.substring(0, 10) + '...');
    FB.AppEvents.logPageView();
  } catch (error) {
    console.error('❌ Facebook init error:', error);
  }
};

// Load Facebook SDK dynamically
function loadFacebookSDK() {
  if (document.getElementById('facebook-jssdk')) {
    return; // SDK already loaded
  }

  // Wait for config to load
  const waitForConfig = (attempt = 0) => {
    const facebookAppId = window.API_CONFIG?.FACEBOOK_CLIENT_ID || '4294997817425546';
    if (document.body) {
      const script = document.createElement('script');
      script.id = 'facebook-jssdk';
      script.src = `https://connect.facebook.net/vi_VN/sdk.js#xfbml=1&version=v18.0&appId=${facebookAppId}`;
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
      console.log('✅ Facebook SDK loaded with appId:', facebookAppId);
    } else if (attempt < 20) {
      setTimeout(() => waitForConfig(attempt + 1), 100);
    } else {
      console.warn('⚠️ Facebook SDK load timeout');
    }
  };
  
  waitForConfig();
}

// Load SDK on page ready
document.addEventListener('DOMContentLoaded', function() {
  loadFacebookSDK();
  
  // Disable Facebook button if on HTTP (except localhost)
  const facebookBtn = document.getElementById('facebookLoginBtn');
  if (facebookBtn && window.location.protocol === 'http:' && !isFacebookAvailable) {
    facebookBtn.disabled = true;
    facebookBtn.title = '⚠️ Facebook login chỉ hoạt động trên HTTPS';
    facebookBtn.style.opacity = '0.5';
    facebookBtn.style.cursor = 'not-allowed';
  }
});

// Facebook Login Handler
function handleFacebookLogin() {
  // Kiểm tra HTTPS
  if (window.location.protocol === 'http:' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    alert('⚠️ Facebook login yêu cầu HTTPS.\nVui lòng sử dụng phương thức đăng nhập khác.');
    return;
  }

  // Kiểm tra FB SDK đã load
  if (typeof FB === 'undefined') {
    alert('❌ Facebook SDK chưa load xong. Vui lòng thử lại!');
    return;
  }

  // Check login status before attempting login
  FB.getLoginStatus(function(response) {
    if (response.status === 'unknown') {
      // SDK not ready, wait a bit and try again
      setTimeout(function() {
        FB.login(performLogin, {scope: 'public_profile'});
      }, 500);
    } else {
      performLogin(response);
    }
  });

  function performLogin(response) {
    if (response.authResponse) {
      const accessToken = response.authResponse.accessToken;
      loginWithFacebook(accessToken);
    } else {
      console.log('❌ User cancelled login');
    }
  }
}

// Send Facebook Token to Backend
async function loginWithFacebook(accessToken) {
  try {
    const _apiBase = (window.API_CONFIG && window.API_CONFIG.BASE_URL) || 'https://your-backend-url.com';
    
    const response = await fetch(`${_apiBase}/api/client/auth/facebook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ accessToken })
    });

    const data = await response.json();

    if (response.ok && data.data) {
      // Lưu token và user info
      localStorage.setItem('user', JSON.stringify(data.data.user));
      localStorage.setItem('token', data.data.token);
      localStorage.setItem('refreshToken', data.data.refreshToken);
      localStorage.setItem('customerId', data.data.user.makh);

      // Update giao diện
      updateAccountDisplay(data.data.user.tenkh);

      // Redirect về trang chủ
      window.location.href = 'index.html';
    } else {
      alert(data.message || 'Đăng nhập Facebook thất bại');
    }
  } catch (error) {
    console.error('Facebook login error:', error);
    alert('Lỗi kết nối. Vui lòng thử lại!');
  }
}

// Logout Facebook
function logoutWithFacebook() {
  FB.logout(function(response) {
    // Backend logout
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('customerId');
    
    window.location.href = 'index.html';
  });
}

// Setup Facebook Button
document.addEventListener('DOMContentLoaded', function() {
  const fbLoginBtn = document.getElementById('facebookLoginBtn');
  if (fbLoginBtn) {
    fbLoginBtn.addEventListener('click', handleFacebookLogin);
  }

  // Check login status (wait for FB to be ready)
  const checkFbLoginStatus = () => {
    if (typeof FB !== 'undefined' && FB.getLoginStatus) {
      FB.getLoginStatus(function(response) {
        if (response.status === 'connected') {
          const user = localStorage.getItem('user');
          if (user) {
            updateAccountDisplay(JSON.parse(user).tenkh);
          }
        }
      });
    } else if (attempt < 30) {
      // Retry waiting for FB
      setTimeout(checkFbLoginStatus, 100);
    }
  };
  
  let attempt = 0;
  checkFbLoginStatus();
});

// Update account display
function updateAccountDisplay(userName) {
  const accountLink = document.querySelector('.top-links li a[href="login.html"]');
  if (accountLink) {
    accountLink.innerHTML = `<i class="fas fa-user"></i> ${userName}`;
  }
}
