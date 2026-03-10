import apiHook from './apiConfig';

const offerService = {
    /**
     * Get all active offers for the homepage marquee
     */
    async getOffers() {
        const response = await apiHook.get('/pages/offers/');
        return response.data;
    },
};

export default offerService;
