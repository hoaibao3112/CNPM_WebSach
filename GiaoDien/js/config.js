/**
 * API Configuration for Customer Frontend
 * Automatically detects environment and uses appropriate API URL
 * Fetches sensitive config (GOOGLE_CLIENT_ID) from backend
 */

// Determine BASE_URL based on environment
const determineBaseUrl = () => {
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
        return 'https://cnpm-websach-2.onrender.com';
    }

    // Priority 3: Local development (default)
    return 'http://localhost:5000';
};

const API_CONFIG = {
    BASE_URL: determineBaseUrl(),

    // WebSocket URL - Derived from BASE_URL
    WS_URL: (() => {
        const hostname = window.location.hostname;
        if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
            return 'wss://cnpm-websach-2.onrender.com';
        }
        return 'ws://localhost:5000';
    })(),

    // Chatbot service URL
    CHATBOT_URL: (() => {
        const hostname = window.location.hostname;
        if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
            return 'https://cnpm-websach-2.onrender.com/api/chatbot';
        }
        return 'http://127.0.0.1:8002';
    })(),

    // Google Client ID - will be set after fetching from backend
    GOOGLE_CLIENT_ID: '',

    // Helper method to build full URL
    buildUrl: function (endpoint) {
        const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
        return `${this.BASE_URL}/${cleanEndpoint}`;
    }
};

// Make it globally available immediately
window.API_CONFIG = API_CONFIG;

// Fetch dynamic config from backend (GOOGLE_CLIENT_ID, etc.)
async function fetchBackendConfig() {
    try {
        const response = await fetch(`${API_CONFIG.BASE_URL}/api/client/config`);
        if (!response.ok) {
            console.warn('⚠️ Failed to fetch backend config, using defaults');
            return;
        }
        const config = await response.json();
        
        // Update API_CONFIG with backend values
        if (config.GOOGLE_CLIENT_ID) {
            API_CONFIG.GOOGLE_CLIENT_ID = config.GOOGLE_CLIENT_ID;
            window.API_CONFIG.GOOGLE_CLIENT_ID = config.GOOGLE_CLIENT_ID;
        }
        if (config.BASE_URL) {
            // Optional: override if provided by backend
            // API_CONFIG.BASE_URL = config.BASE_URL;
        }
        
        console.log('✅ Backend config loaded:', {
            GOOGLE_CLIENT_ID: config.GOOGLE_CLIENT_ID ? 'Loaded' : 'Not set'
        });
    } catch (error) {
        console.error('❌ Error fetching backend config:', error);
    }
}

// Call this immediately to load backend config
fetchBackendConfig();

// Log current configuration with helpful instructions
console.group('🔧 API Configuration');
console.log('BASE_URL:', API_CONFIG.BASE_URL);
console.log('Environment:', API_CONFIG.BASE_URL.includes('onrender.com') ? 'Production' : 'Development');
if (window.location.hostname === 'localhost') {
    console.info('💡 To test with production API locally, add ?env=prod to the URL or run: localStorage.setItem("FORCE_PROD", "true"); location.reload();');
}
console.groupEnd();

