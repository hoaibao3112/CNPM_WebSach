/**
 * API Configuration for Customer Frontend
 * Automatically detects environment and uses appropriate API URL
 * Fetches sensitive config (GOOGLE_CLIENT_ID) from backend
 */

if (!window.API_CONFIG) {
    // Determine BASE_URL based on environment
    const determineBaseUrl = () => {
        const hostname = window.location.hostname;
        const searchParams = new URLSearchParams(window.location.search);
        
        // Priority 1: Force production via URL param or localStorage
        const forceProd = searchParams.get('env') === 'prod' || localStorage.getItem('FORCE_PROD') === 'true';
        if (forceProd) {
            console.log('🚀 Forced Production Mode API');
            return 'https://cnpm-customer.onrender.com';
        }

        // Priority 2: Vercel or other production hosting
        if (hostname !== 'localhost' && hostname !== '127.0.0.1' && !hostname.startsWith('192.168.')) {
            return 'https://cnpm-customer.onrender.com';
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
                return 'wss://cnpm-customer.onrender.com';
            }
            return 'ws://localhost:5000';
        })(),

        // Chatbot service URL
        CHATBOT_URL: (() => {
            const hostname = window.location.hostname;
            // Always use the Render URL for the chatbot to ensure Llama 3 is used
            return 'https://cnpm-websach-hf0f.onrender.com/chat';
        })(),

        // Google & Facebook Client IDs - will be set after fetching from backend
        GOOGLE_CLIENT_ID: '',
        FACEBOOK_CLIENT_ID: '',

        // Helper method to build full URL
        buildUrl: function (endpoint) {
            const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
            return `${this.BASE_URL}/${cleanEndpoint}`;
        },

        // Helper to resolve product image URLs
        resolveImageUrl: function (filename) {
            if (!filename || filename === 'null' || filename === 'undefined' || filename === 'sp01.jpg') {
                return 'https://via.placeholder.com/300x400?text=S%C3%A1ch';
            }
            if (/^https?:\/\//i.test(filename)) return filename;
            
            // If it starts with /img/products/, clean it
            const cleanName = filename.replace(/^\/img\/products\//, '');
            
            // Use /product-images/ which we just fixed to search both folders
            return `${this.BASE_URL}/product-images/${cleanName}`;
        }
    };

    // Make it globally available immediately
    window.API_CONFIG = API_CONFIG;

    // Track if config has been loaded
    window.CONFIG_LOADED = false;

    // Fetch dynamic config from backend (GOOGLE_CLIENT_ID, etc.)
    async function fetchBackendConfig() {
        try {
            const url = `${API_CONFIG.BASE_URL}/api/client/config`;
            console.log('🔍 Fetching backend config from:', url);
            
            const response = await fetch(url, { timeout: 5000 });
            console.log('📡 Backend config response status:', response.status, response.statusText);
            
            if (!response.ok) {
                console.warn(`⚠️ Failed to fetch backend config (${response.status}):`, response.statusText);
                // Set default Google Client ID for development
                API_CONFIG.GOOGLE_CLIENT_ID = '753933769-uvs4v1t8j2v1k4t7c6p0e5q1h9k3l5m7p9.apps.googleusercontent.com';
                window.API_CONFIG.GOOGLE_CLIENT_ID = API_CONFIG.GOOGLE_CLIENT_ID;
                window.CONFIG_LOADED = true;
                return;
            }
            
            const config = await response.json();
            console.log('📦 Backend config received:', config);
            
            // Update API_CONFIG with backend values
            if (config.GOOGLE_CLIENT_ID) {
                API_CONFIG.GOOGLE_CLIENT_ID = config.GOOGLE_CLIENT_ID;
                window.API_CONFIG.GOOGLE_CLIENT_ID = config.GOOGLE_CLIENT_ID;
            } else {
                // Fallback to default if not provided
                API_CONFIG.GOOGLE_CLIENT_ID = '753933769-uvs4v1t8j2v1k4t7c6p0e5q1h9k3l5m7p9.apps.googleusercontent.com';
                window.API_CONFIG.GOOGLE_CLIENT_ID = API_CONFIG.GOOGLE_CLIENT_ID;
            }
            
            if (config.FACEBOOK_CLIENT_ID) {
                API_CONFIG.FACEBOOK_CLIENT_ID = config.FACEBOOK_CLIENT_ID;
                window.API_CONFIG.FACEBOOK_CLIENT_ID = config.FACEBOOK_CLIENT_ID;
            } else {
                // Fallback for development
                API_CONFIG.FACEBOOK_CLIENT_ID = '904742255223792';
                window.API_CONFIG.FACEBOOK_CLIENT_ID = API_CONFIG.FACEBOOK_CLIENT_ID;
            }
            
            window.CONFIG_LOADED = true;
            console.log('✅ Backend config loaded successfully');
        } catch (error) {
            console.error('❌ Error fetching backend config:', error.message);
            // Set fallback on error
            API_CONFIG.GOOGLE_CLIENT_ID = '753933769-uvs4v1t8j2v1k4t7c6p0e5q1h9k3l5m7p9.apps.googleusercontent.com';
            window.API_CONFIG.GOOGLE_CLIENT_ID = API_CONFIG.GOOGLE_CLIENT_ID;
            API_CONFIG.FACEBOOK_CLIENT_ID = '904742255223792';
            window.API_CONFIG.FACEBOOK_CLIENT_ID = API_CONFIG.FACEBOOK_CLIENT_ID;
            window.CONFIG_LOADED = true;
        }
    }

    // Call this immediately to load backend config
    fetchBackendConfig();

    // Log current configuration
    console.group('🔧 API Configuration');
    console.log('BASE_URL:', API_CONFIG.BASE_URL);
    console.log('Environment:', API_CONFIG.BASE_URL.includes('onrender.com') ? 'Production' : 'Development');
    console.groupEnd();
}

