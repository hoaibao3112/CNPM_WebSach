import api from '../config/api';

const orderService = {
    // Create new order
    createOrder: async (orderData) => {
        try {
            const response = await api.post('/api/orders/place-order', orderData);
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Get user's orders
    getOrders: async (customerId) => {
        try {
            const response = await api.get(`/api/orders/customer-orders/${customerId}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Get order by ID
    getOrderById: async (orderId) => {
        try {
            const response = await api.get(`/api/orders/customer-orders/detail/${orderId}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Cancel order
    cancelOrder: async (orderId, reason = '') => {
        try {
            const response = await api.put(`/api/orders/customer-orders/cancel/${orderId}`, {
                reason,
            });
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Reorder
    reorder: async (orderId) => {
        try {
            const response = await api.post(`/api/cart/reorder/${orderId}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Submit review
    submitReview: async (orderId, rating, comment) => {
        try {
            const response = await api.post(`/api/orderreview/${orderId}`, {
                rating,
                comment,
            });
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Get review
    getReview: async (orderId) => {
        try {
            const response = await api.get(`/api/orderreview/${orderId}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },
};

export default orderService;
