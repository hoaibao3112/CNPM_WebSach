import api from '../config/api';

const locationService = {
    // Get all cities/provinces
    getCities: async () => {
        try {
            const response = await api.get('/api/address/cities');
            return response.data;
        } catch (error) {
            console.error('Error fetching cities:', error);
            return [];
        }
    },

    // Get districts by city ID
    getDistricts: async (cityId) => {
        try {
            const response = await api.get(`/api/address/districts/${cityId}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching districts:', error);
            return [];
        }
    },

    // Get wards by district ID
    getWards: async (districtId) => {
        try {
            const response = await api.get(`/api/address/wards/${districtId}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching wards:', error);
            return [];
        }
    }
};

export default locationService;
