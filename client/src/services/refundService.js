import api from '../config/api';

const refundService = {
    // Get all refunds for current user
    getRefunds: async (filters = {}) => {
        try {
            const params = {};
            if (filters.status) params.status = filters.status;
            if (filters.startDate) params.startDate = filters.startDate;
            if (filters.endDate) params.endDate = filters.endDate;

            const response = await api.get('/api/refunds', { params });
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Get refund by ID
    getRefundById: async (refundId) => {
        try {
            const response = await api.get(`/api/refunds/${refundId}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Request refund for an order
    requestRefund: async (orderId, refundData) => {
        try {
            const response = await api.post(`/api/refunds/request`, {
                orderId,
                ...refundData
            });
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Cancel refund request
    cancelRefund: async (refundId) => {
        try {
            const response = await api.put(`/api/refunds/${refundId}/cancel`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },
};

export default refundService;
