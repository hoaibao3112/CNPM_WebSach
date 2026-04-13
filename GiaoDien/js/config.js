/**
 * API Configuration for Customer Frontend
 * Automatically detects environment and uses appropriate API URL
 */

const API_CONFIG = {
    // Detect environment based on hostname
    BASE_URL: (() => {
        const hostname = window.location.hostname;
        const searchParams = new URLSearchParams(window.location.search);
        
        // Priority 1: Force production via URL param or localStorage
        const forceProd = searchParams.get('env') === 'prod' || localStorage.getItem('FORCE_PROD') === 'true';
        if (forceProd) {
            console.log('🚀 Forced Production Mode API');
            return 'https://cnpm-websach-2.onrender.com';
        }

        // Priority 2: Vercel or other production hosting
        if (hostname !== 'localhost' && hostname !== '127.0.0.1' && !hostname.startsWith('192.168.')) {
            return 'https://cnpm-websach.onrender.com';
        }

        // Priority 3: Local development (default)
        return window.API_CONFIG.BASE_URL;
    })(),

    // WebSocket URL - Derived from BASE_URL
    WS_URL: (() => {
        const hostname = window.location.hostname;
        if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
            return 'wss://cnpm-websach.onrender.com';
        }
        return 'ws://localhost:5000';
    })(),

    // Chatbot service URL
    CHATBOT_URL: (() => {
        const hostname = window.location.hostname;
        if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
            return 'https://cnpm-websach.onrender.com/api/chatbot';
        }
        return 'http://127.0.0.1:8002';
    })(),

    // Helper method to build full URL
    buildUrl: function (endpoint) {
        const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
        return `${this.BASE_URL}/${cleanEndpoint}`;
    }
};

// Make it globally available immediately
window.API_CONFIG = API_CONFIG;

// Log current configuration with helpful instructions
console.group('🔧 API Configuration');
console.log('BASE_URL:', API_CONFIG.BASE_URL);
console.log('Environment:', API_CONFIG.BASE_URL.includes('onrender.com') ? 'Production' : 'Development');
if (window.location.hostname === 'localhost') {
    console.info('💡 To test with production API locally, add ?env=prod to the URL or run: localStorage.setItem("FORCE_PROD", "true"); location.reload();');
}
console.groupEnd();

