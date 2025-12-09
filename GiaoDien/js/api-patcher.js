/**
 * Simple URL Replacer để cập nhật tất cả fetch/axios calls
 * Add script này VÀO ĐẦU các pages để auto-replace localhost URLs
 */

(function () {
    // Chỉ chạy nếu API_CONFIG đã được load
    if (!window.API_CONFIG) {
        console.warn('⚠️ API_CONFIG chưa được load! Hãy thêm config.js trước file này.');
        return;
    }

    const API_BASE = window.API_CONFIG.BASE_URL;

    // Nếu đang ở localhost thì không cần replace gì cả
    if (API_BASE.includes('localhost')) {
        console.log('🔧 Development mode - using localhost');
        return;
    }

    console.log('🚀 Production mode - patching API calls with:', API_BASE);

    // Patch window.fetch để tự động replace URLs
    const originalFetch = window.fetch;
    window.fetch = function (url, options) {
        // Nếu URL là string và chứa localhost:5000, thay thế nó
        if (typeof url === 'string' && url.includes('localhost:5000')) {
            url = url.replace('http://localhost:5000', API_BASE);
            console.log('📡 Fetching:', url);
        }
        return originalFetch.call(this, url, options);
    };

    console.log('✅ Fetch patched successfully!');
})();
