/**
 * API Configuration for Customer Frontend
 * Automatically detects environment and uses appropriate API URL
 */

const API_CONFIG = {
    // Detect environment based on hostname
    BASE_URL: (() => {
        const hostname = window.location.hostname;

        // Production (Render or other hosting)
        if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
            return 'https://cnpm-websach.onrender.com';
        }

        // Local development
        return 'http://localhost:5000';
    })(),

    // WebSocket URL
    WS_URL: (() => {
        const hostname = window.location.hostname;

        if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
            return 'wss://cnpm-websach.onrender.com';
        }

        return 'ws://localhost:5000';
    })(),

    // Helper method to build full URL
    buildUrl: function (endpoint) {
        // Remove leading slash if present to avoid double slashes
        const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
        return `${this.BASE_URL}/${cleanEndpoint}`;
    }
};

// Make it globally available
window.API_CONFIG = API_CONFIG;

// Log current configuration (for debugging)
console.log('🔧 API Configuration:', {
    BASE_URL: API_CONFIG.BASE_URL,
    WS_URL: API_CONFIG.WS_URL,
    Environment: API_CONFIG.BASE_URL.includes('localhost') ? 'Development' : 'Production'
});
