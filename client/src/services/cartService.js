import api from '../config/api';

const cartService = {
    // Get cart items
    getCart: async () => {
        try {
            const response = await api.get('/api/client/cart');
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Add item to cart
    addToCart: async (productId, quantity = 1) => {
        try {
            const response = await api.post('/api/client/cart/add', {
                productId,
                quantity,
            });
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Update cart item quantity
    updateCartItem: async (productId, quantity) => {
        try {
            const response = await api.put('/api/client/cart/update', {
                productId,
                quantity,
            });
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Remove item from cart
    removeFromCart: async (productId) => {
        try {
            const response = await api.delete(`/api/client/cart/remove/${productId}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Clear entire cart
    clearCart: async () => {
        try {
            const response = await api.delete('/api/client/cart/clear');
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Apply promotion code
    applyPromotionCode: async (code) => {
        try {
            const response = await api.post('/api/client/cart/promotion', {
                code,
            });
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },
};

export default cartService;
