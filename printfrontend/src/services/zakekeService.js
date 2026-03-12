import apiHook from './apiConfig';

const zakekeService = {
    /**
     * Get a Zakeke access token from our backend.
     */
    getToken: async () => {
        try {
            const response = await apiHook.get('/zakeke/token/');
            const token = response.data.access_token;
            if (!token) {
                console.error('Token response:', response.data);
                throw new Error('Token not found in response');
            }
            return token;
        } catch (error) {
            console.error('Error fetching Zakeke token:', error);
            if (error.response) {
                console.error('Response data:', error.response.data);
                console.error('Response status:', error.response.status);
            }
            throw error;
        }
    },

    /**
     * Test authentication with Zakeke through our backend.
     */
    testAuth: async () => {
        try {
            const response = await apiHook.get('/zakeke/test_auth/');
            return response.data;
        } catch (error) {
            console.error('Error testing Zakeke auth:', error);
            throw error;
        }
    },

    /**
     * Get details for a specific Zakeke design.
     */
    getDesignDetails: async (designId) => {
        try {
            const response = await apiHook.get(`/zakeke/designs/${designId}/`);
            return response.data;
        } catch (error) {
            console.error(`Error fetching Zakeke design details for ID ${designId}:`, error);
            throw error;
        }
    },

    async registerOrder(orderData) {
        const response = await apiHook.post('/zakeke/order/', orderData);
        return response.data;
    }
};

export default zakekeService;
