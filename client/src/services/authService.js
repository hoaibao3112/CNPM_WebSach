import api from '../config/api';

const authService = {
    // Login with email and password
    login: async (email, password) => {
        try {
            const response = await api.post('/api/client/login', {
                email,
                matkhau: password,
            });
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Login with Google
    loginWithGoogle: async (credential) => {
        try {
            const response = await api.post('/api/client/google-login', {
                credential,
            });
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Register new account
    register: async (userData) => {
        try {
            const response = await api.post('/api/client/register', userData);
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Forgot password - send OTP
    sendOTP: async (email) => {
        try {
            const response = await api.post('/api/client/forgot-password/send-otp', {
                email,
            });
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Verify OTP
    verifyOTP: async (email, otp, token) => {
        try {
            const response = await api.post('/api/client/forgot-password/verify-otp', {
                email,
                otp,
                token,
            });
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Reset password
    resetPassword: async (email, newPassword, resetToken) => {
        try {
            const response = await api.post('/api/client/forgot-password/reset', {
                email,
                matkhau: newPassword,
                resetToken,
            });
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Logout
    logout: async () => {
        try {
            const response = await api.post('/api/client/logout');
            return response.data;
        } catch (error) {
            return { success: true };
        }
    },

    // Get user profile
    getProfile: async () => {
        try {
            const response = await api.get('/api/client/profile');
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Update profile
    updateProfile: async (profileData) => {
        try {
            const response = await api.put('/api/client/profile', profileData);
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Change password
    changePassword: async (passwordData) => {
        try {
            const response = await api.put('/api/client/profile/change-password', passwordData);
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },
};

export default authService;
