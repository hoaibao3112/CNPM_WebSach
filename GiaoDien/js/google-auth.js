// google-auth.js
// Initializes Google Identity Services button and sends id_token to server
// NOTE: it's safe to expose CLIENT_ID on the frontend; do NOT expose client secret here.

(function () {
  // Wait for config to be fully loaded
  const waitForConfig = (callback, maxRetries = 30) => {
    let retries = 0;
    const checkConfig = () => {
      if (window.API_CONFIG?.GOOGLE_CLIENT_ID) {
        console.log('✅ Google Client ID ready:', window.API_CONFIG.GOOGLE_CLIENT_ID.substring(0, 20) + '...');
        callback();
      } else if (retries < maxRetries) {
        retries++;
        setTimeout(checkConfig, 100);
      } else {
        console.warn('⚠️ Config not ready after timeout, using defaults');
        callback();
      }
    };
    checkConfig();
  };

  // Get Google Client ID from API config
  const getGoogleClientId = () => {
    const clientId = window.API_CONFIG?.GOOGLE_CLIENT_ID;
    if (!clientId) {
      console.warn('⚠️ GOOGLE_CLIENT_ID not found in config');
      return '';
    }
    return clientId;
  };

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
        const payload = data && data.data ? data.data : data;
        if (!res.ok) {
          console.error('Server returned error for Google auth:', data);
          const errorText =
            (typeof data.message === 'string' && data.message) ||
            (typeof data.error === 'string' && data.error) ||
            (typeof payload?.message === 'string' && payload.message) ||
            'Đăng nhập Google thất bại';
          alert(errorText);
          return;
        }

        // Expect the server to return { token, refreshToken, user }
        if (payload && payload.token) {
          try {
            localStorage.setItem('token', payload.token);
            if (payload.refreshToken) localStorage.setItem('refreshToken', payload.refreshToken);
            // optional: store user info
            if (payload.user) localStorage.setItem('user', JSON.stringify(payload.user));
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

  // Initialize Google button - wait for backend config to load
  const initializeGoogleButton = () => {
    if (!document.getElementById('googleSignIn')) {
      console.warn('⚠️ #googleSignIn element not found');
      return;
    }

    const GOOGLE_CLIENT_ID = getGoogleClientId();
    
    if (!GOOGLE_CLIENT_ID) {
      console.error('❌ GOOGLE_CLIENT_ID not available. Google Sign-In will not work.');
      return;
    }

    console.log('✅ Initializing Google Sign-In with CLIENT_ID');

    // Initialize the Google Identity Services client
    try {
      google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleCredentialResponse
      });

      // Render the button
      google.accounts.id.renderButton(
        document.getElementById('googleSignIn'),
        { theme: 'outline', size: 'large', text: 'continue_with' }
      );

      console.log('✅ Google Sign-In button rendered successfully');
    } catch (error) {
      console.error('❌ Error initializing Google Sign-In:', error);
    }
  };

  // Wait for DOM ready and config to be loaded
  const initWhenReady = () => {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        waitForConfig(initializeGoogleButton);
      });
    } else {
      // Page already loaded
      waitForConfig(initializeGoogleButton);
    }
  };

  initWhenReady();
})();

