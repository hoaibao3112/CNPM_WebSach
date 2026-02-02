import api from '../config/api';

const wishlistService = {
    // Get user's wishlist
    getWishlist: async () => {
        try {
            const response = await api.get('/api/favorites');
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Add product to wishlist
    addToWishlist: async (productId) => {
        try {
            const response = await api.post('/api/favorites/add', { productId });
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Remove product from wishlist
    removeFromWishlist: async (productId) => {
        try {
            const response = await api.delete(`/api/favorites/remove/${productId}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Check if product is in wishlist
    isInWishlist: async (productId) => {
        try {
            const response = await api.get(`/api/favorites/check/${productId}`);
            return response.data;
        } catch (error) {
            return { inWishlist: false };
        }
    },
};

export default wishlistService;
