// google-auth.js
// Initializes Google Identity Services button and sends id_token to server
// NOTE: it's safe to expose CLIENT_ID on the frontend; do NOT expose client secret here.

(function () {
  // Use your Client ID from Google Cloud Console
  const GOOGLE_CLIENT_ID = '384701986163-efvf2jsg54kp6jjgqgj24o609vbr6uop.apps.googleusercontent.com';
  const SERVER_GOOGLE_AUTH_URL = 'http://localhost:5000/api/client/auth/google';

  function handleCredentialResponse(response) {
    const id_token = response && response.credential;
    if (!id_token) {
      console.error('No id_token received from Google');
      alert('Đăng nhập Google thất bại (không nhận được token)');
      return;
    }

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

  window.addEventListener('load', function () {
    if (!document.getElementById('googleSignIn')) return;

    if (!GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID.indexOf('YOUR_CLIENT_ID') !== -1) {
      console.warn('GOOGLE_CLIENT_ID not configured in google-auth.js');
      return;
    }

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
  });
})();
