/**
 * Simple URL Replacer và Response Patcher để cập nhật tất cả fetch calls
 * Thêm script này VÀO ĐẦU các pages để auto-handle response format mới
 */

(function () {
    // Chỉ chạy nếu API_CONFIG đã được load
    if (!window.API_CONFIG) {
        console.warn('⚠️ API_CONFIG chưa được load! Hãy thêm config.js trước file này.');
        return;
    }

    const API_BASE = window.API_CONFIG.BASE_URL;

    console.log('🚀 API Patcher Active - Base:', API_BASE);

    // Patch window.fetch
    const originalFetch = window.fetch;
    window.fetch = async function (url, options) {
        // 1. Replace localhost URLs nếu cần
        if (typeof url === 'string' && url.includes('localhost:5000') && !API_BASE.includes('localhost')) {
            url = url.replace(window.API_CONFIG.BASE_URL, API_BASE);
            console.log('📡 Fetch Patched URL:', url);
        }

        // 2. Thực hiện request và trả về kết quả nguyên bản
        return originalFetch.call(this, url, options);
    };

    console.log('✅ Global API Response Patcher initialized!');
})();

