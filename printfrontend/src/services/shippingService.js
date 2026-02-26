import apiHook from './apiConfig';

const shippingService = {
    /**
     * Check if a pincode is serviceable.
     * POST /shipping/check-serviceability/
     * @param {string} pincode
     * @returns {{ serviceable, pincode, city, state, zone, available_methods, cod_available }}
     */
    checkServiceability: async (pincode) => {
        try {
            const response = await apiHook.post('/shipping/check-serviceability/', {
                pincode: pincode.trim(),
            });
            return response.data;
        } catch (error) {
            console.error('Error checking serviceability:', error);
            throw error;
        }
    },

    /**
     * Calculate shipping cost for all available methods.
     * POST /shipping/calculate/
     * @param {Object} params
     * @param {string} params.pincode
     * @param {Array} [params.items] - [{product: id, quantity: n}] 
     * @param {number} [params.weight_grams] - Fallback if items not provided
     * @param {number} [params.order_subtotal] - For free-shipping threshold
     * @param {string} [params.method] - 'standard'|'express'|'priority'; omit for all
     * @returns {{ options: [] }} or single option if method specified
     */
    calculateShipping: async ({ pincode, items, weight_grams, order_subtotal, method }) => {
        try {
            const payload = { pincode: pincode.trim() };
            if (items && items.length > 0) payload.items = items;
            if (weight_grams) payload.weight_grams = weight_grams;
            if (order_subtotal !== undefined) payload.order_subtotal = order_subtotal;
            if (method) payload.method = method;

            const response = await apiHook.post('/shipping/calculate/', payload);
            return response.data;
        } catch (error) {
            console.error('Error calculating shipping:', error);
            throw error;
        }
    },

    /**
     * Calculate shipping for all methods given cart items and pincode.
     * Convenience wrapper around calculateShipping.
     * @param {string} pincode
     * @param {Array} cartItems - Cart items from ShopContext (id, quantity)
     * @param {number} subtotal - Cart subtotal in ₹
     * @returns {Array} List of shipping options sorted by cost
     */
    getShippingOptions: async (pincode, cartItems, subtotal) => {
        const items = cartItems.map((item) => ({
            product: item.id,
            quantity: item.quantity || 1,
        }));

        const result = await shippingService.calculateShipping({
            pincode,
            items,
            order_subtotal: subtotal,
        });

        return result.options || [result];
    },
};

export default shippingService;
