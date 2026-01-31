import api from '../config/api';

const orderService = {
    // Create new order
    createOrder: async (orderData) => {
        try {
            const response = await api.post('/api/client/order/create', orderData);
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Get user's orders
    getOrders: async (status = null, page = 1, limit = 10) => {
        try {
            const params = { page, limit };
            if (status) params.status = status;

            const response = await api.get('/api/client/orders', { params });
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Get order by ID
    getOrderById: async (orderId) => {
        try {
            const response = await api.get(`/api/client/order/${orderId}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Cancel order
    cancelOrder: async (orderId, reason = '') => {
        try {
            const response = await api.put(`/api/client/order/${orderId}/cancel`, {
                reason,
            });
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Request refund
    requestRefund: async (orderId, refundData) => {
        try {
            const response = await api.post(`/api/client/order/${orderId}/refund`, refundData);
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Get refund history
    getRefundHistory: async (page = 1, limit = 10) => {
        try {
            const response = await api.get('/api/client/refunds', {
                params: { page, limit },
            });
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },
};

export default orderService;
