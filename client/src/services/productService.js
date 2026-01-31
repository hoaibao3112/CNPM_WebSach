import api from '../config/api';

const productService = {
    // Get all/filtered products
    getProducts: async (params = {}) => {
        try {
            const response = await api.get('/api/product', { params });
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Get product by ID
    getProductById: async (productId) => {
        try {
            const response = await api.get(`/api/product/${productId}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Search products
    searchProducts: async (searchQuery) => {
        try {
            const response = await api.get('/api/product/search-product', {
                params: { search: searchQuery },
            });
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Get products by category
    getProductsByCategory: async (categoryId, params = {}) => {
        try {
            const response = await api.get(`/api/product/category/${categoryId}`, { params });
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Get new products
    getNewProducts: async (limit = 10) => {
        try {
            const response = await api.get('/api/product/new', {
                params: { limit },
            });
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Get promotion products
    getPromotionProducts: async (limit = 10) => {
        try {
            const response = await api.get('/api/product/promotion', {
                params: { limit },
            });
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Get flash sale products
    getFlashSaleProducts: async () => {
        try {
            const response = await api.get('/api/product/flash-sale');
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Get related products
    getRelatedProducts: async (productId, limit = 6) => {
        try {
            const response = await api.get(`/api/product/${productId}/related`, {
                params: { limit },
            });
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Get product reviews
    getProductReviews: async (productId) => {
        try {
            const response = await api.get(`/api/product/${productId}/reviews`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Submit product review
    submitReview: async (productId, rating, comment) => {
        try {
            const response = await api.post(`/api/product/${productId}/review`, {
                rating,
                comment,
            });
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },
};

export default productService;
