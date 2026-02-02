import api from '../config/api';

const authorService = {
    // Get all authors with pagination
    getAuthors: async (params = {}) => {
        try {
            const response = await api.get('/api/author', { params });
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Get author by ID with books
    getAuthorById: async (authorId) => {
        try {
            const response = await api.get(`/api/author/${authorId}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Get authors by nationality
    getAuthorsByNationality: async (nationality, params = {}) => {
        try {
            const response = await api.get('/api/author/by-nationality', {
                params: { nationality, ...params }
            });
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },
};

export default authorService;
