// google-auth.js
// Initializes Google Identity Services button and sends id_token to server
// NOTE: it's safe to expose CLIENT_ID on the frontend; do NOT expose client secret here.

(function () {
  // Get Google Client ID from API config (fetched from backend)
  // NO hardcoded fallback - config must come from backend only
  const getGoogleClientId = () => window.API_CONFIG?.GOOGLE_CLIENT_ID || '';
  
  // Use API_CONFIG to build auth endpoint
  const getServerGoogleAuthUrl = () => {
    if (window.API_CONFIG?.buildUrl) {
      return window.API_CONFIG.buildUrl('/api/client/auth/google');
    }
    return '/api/client/auth/google';
  };

  function handleCredentialResponse(response) {
    const id_token = response && response.credential;
    if (!id_token) {
      console.error('No id_token received from Google');
      alert('Đăng nhập Google thất bại (không nhận được token)');
      return;
    }

    const SERVER_GOOGLE_AUTH_URL = getServerGoogleAuthUrl();

    // Send the ID token to the server for verification and account creation/login
    fetch(SERVER_GOOGLE_AUTH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id_token })
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          console.error('Server returned error for Google auth:', data);
          alert(data.error || 'Đăng nhập Google thất bại');
          return;
        }

        // Expect the server to return { token, refreshToken, user }
        if (data.token) {
          try {
            localStorage.setItem('token', data.token);
            if (data.refreshToken) localStorage.setItem('refreshToken', data.refreshToken);
            // optional: store user info
            if (data.user) localStorage.setItem('user', JSON.stringify(data.user));
          } catch (err) {
            console.warn('Could not save tokens to localStorage', err);
          }

          // Redirect to homepage or another page after login
          window.location.href = 'index.html';
        } else {
          console.error('Unexpected server response for Google auth:', data);
          alert('Đăng nhập Google thất bại');
        }
      })
      .catch((err) => {
        console.error('Network error sending id_token to server:', err);
        alert('Không thể kết nối tới server để đăng nhập bằng Google');
      });
  }

  // Initialize Google button when both Google API is ready AND config is loaded
  const initializeGoogleButton = () => {
    if (!document.getElementById('googleSignIn')) return;

    const GOOGLE_CLIENT_ID = getGoogleClientId();
    
    // Check if CLIENT_ID is properly loaded
    if (!GOOGLE_CLIENT_ID) {
      console.warn('⚠️ GOOGLE_CLIENT_ID not yet loaded from backend. Retrying in 500ms...');
      setTimeout(initializeGoogleButton, 500);
      return;
    }

    console.log('✅ Initializing Google Sign-In with CLIENT_ID from backend');

    // Initialize the Google Identity Services client
    google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleCredentialResponse
    });

    // Render the button
    google.accounts.id.renderButton(
      document.getElementById('googleSignIn'),
      { theme: 'outline', size: 'large', text: 'continue_with' }
    );

    // Optional: show One Tap prompt
    // google.accounts.id.prompt();
  };

  // Wait for DOM and Google API to be ready
  window.addEventListener('load', initializeGoogleButton);
  
  // Also try to initialize if page is already loaded (cached pages)
  if (document.readyState === 'complete') {
    initializeGoogleButton();
  }
})();

