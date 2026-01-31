import axios from 'axios';

/**
 * API Configuration for Customer Frontend
 * Automatically detects environment and uses appropriate API URL
 */

// Detect environment based on hostname
const BASE_URL = (() => {
    const hostname = window.location.hostname;

    // Production (Render or other hosting)
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
        return 'https://cnpm-websach.onrender.com';
    }

    // Local development
    return 'http://localhost:5000';
})();

// Create axios instance with default config
const api = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor - Add auth token to requests
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor - Handle errors globally
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response) {
            // Handle 401 Unauthorized - logout user
            if (error.response.status === 401) {
                localStorage.removeItem('user');
                localStorage.removeItem('token');
                localStorage.removeItem('customerId');
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default api;
export { BASE_URL };
