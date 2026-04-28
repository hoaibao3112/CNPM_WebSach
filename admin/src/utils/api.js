import axios from 'axios';

const api = axios.create({
    baseURL: (process.env.REACT_APP_API_BASE || 'https://cnpm-websach-2.onrender.com') + '/api',
});

// Request interceptor to add token
api.interceptors.request.use(
    (config) => {
        const token = (document.cookie.split('; ').find(row => row.startsWith('authToken='))?.split('=')[1] || null);
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor for error handling (optional but good)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Handle unauthorized (e.g., redirect to login)
            document.cookie = "authToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
            localStorage.removeItem('userInfo');
            // window.location.href = '/admin/login'; 
        }
        return Promise.reject(error);
    }
);

export default api;
