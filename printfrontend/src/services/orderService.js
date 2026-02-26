import apiHook from './apiConfig';

const orderService = {
    // Get all orders for the current user
    getOrders: async (params = {}) => {
        try {
            const response = await apiHook.get('/orders/', { params });
            return response.data.results || response.data;
        } catch (error) {
            console.error('Error fetching orders:', error);
            throw error;
        }
    },

    // Get a single order by ID
    getOrder: async (id) => {
        try {
            const response = await apiHook.get(`/orders/${id}/`);
            return response.data;
        } catch (error) {
            console.error('Error fetching order:', error);
            throw error;
        }
    },

    // Create a new order (checkout)
    createOrder: async (orderData) => {
        try {
            const response = await apiHook.post('/orders/', orderData);
            return response.data;
        } catch (error) {
            console.error('Error creating order:', error);
            if (error.response?.data && typeof error.response.data === 'object') {
                const msgs = Object.entries(error.response.data)
                    .map(([key, val]) => `${key}: ${Array.isArray(val) ? val.join(', ') : val}`)
                    .join(' | ');
                const enriched = new Error(msgs);
                enriched.response = error.response;
                throw enriched;
            }
            throw error;
        }
    },

    // Update an order (limited fields)
    updateOrder: async (id, orderData) => {
        try {
            const response = await apiHook.patch(`/orders/${id}/`, orderData);
            return response.data;
        } catch (error) {
            console.error('Error updating order:', error);
            throw error;
        }
    },

    // ── Status Transitions ──
    transitionStatus: async (orderId, newStatus, note = '') => {
        try {
            const response = await apiHook.post(`/orders/${orderId}/transition/`, {
                new_status: newStatus,
                note,
            });
            return response.data;
        } catch (error) {
            console.error('Error transitioning order status:', error);
            if (error.response?.data) {
                const enriched = new Error(error.response.data.error || 'Status transition failed');
                enriched.response = error.response;
                enriched.allowedTransitions = error.response.data.allowed_transitions;
                throw enriched;
            }
            throw error;
        }
    },

    // Get order status history
    getStatusHistory: async (orderId) => {
        try {
            const response = await apiHook.get(`/orders/${orderId}/status-history/`);
            return response.data;
        } catch (error) {
            console.error('Error fetching status history:', error);
            throw error;
        }
    },

    // ── Invoices ──
    getInvoice: async (orderId) => {
        try {
            const response = await apiHook.get(`/orders/${orderId}/invoice/`);
            return response.data;
        } catch (error) {
            console.error('Error fetching invoice:', error);
            throw error;
        }
    },

    downloadInvoice: async (orderId) => {
        try {
            const response = await apiHook.get(`/orders/${orderId}/invoice/download/`, {
                responseType: 'blob',
            });
            // Create download link
            const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Invoice_Order_${orderId}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            return true;
        } catch (error) {
            console.error('Error downloading invoice:', error);
            throw error;
        }
    },

    // ── Returns ──
    getReturns: async (params = {}) => {
        try {
            const response = await apiHook.get('/returns/', { params });
            return response.data.results || response.data;
        } catch (error) {
            console.error('Error fetching returns:', error);
            throw error;
        }
    },

    getReturn: async (id) => {
        try {
            const response = await apiHook.get(`/returns/${id}/`);
            return response.data;
        } catch (error) {
            console.error('Error fetching return:', error);
            throw error;
        }
    },

    createReturn: async (returnData) => {
        try {
            const response = await apiHook.post('/returns/', returnData);
            return response.data;
        } catch (error) {
            console.error('Error creating return:', error);
            if (error.response?.data && typeof error.response.data === 'object') {
                const msgs = Object.entries(error.response.data)
                    .map(([key, val]) => `${key}: ${Array.isArray(val) ? val.join(', ') : val}`)
                    .join(' | ');
                const enriched = new Error(msgs);
                enriched.response = error.response;
                throw enriched;
            }
            throw error;
        }
    },

    cancelReturn: async (id) => {
        try {
            const response = await apiHook.post(`/returns/${id}/cancel/`);
            return response.data;
        } catch (error) {
            console.error('Error cancelling return:', error);
            throw error;
        }
    },

    // ── Refunds ──
    getRefunds: async (params = {}) => {
        try {
            const response = await apiHook.get('/refunds/', { params });
            return response.data.results || response.data;
        } catch (error) {
            console.error('Error fetching refunds:', error);
            throw error;
        }
    },

    getRefund: async (id) => {
        try {
            const response = await apiHook.get(`/refunds/${id}/`);
            return response.data;
        } catch (error) {
            console.error('Error fetching refund:', error);
            throw error;
        }
    },

    // ── Tracking ──

    /**
     * Get tracking details for an order's shipment.
     * @param {number} orderId - The order ID
     * @param {boolean} refresh - Whether to fetch latest from Shiprocket API
     */
    getTracking: async (orderId, refresh = false) => {
        try {
            const params = refresh ? { refresh: 'true' } : {};
            const response = await apiHook.get(`/tracking/${orderId}/`, { params });
            return response.data;
        } catch (error) {
            console.error('Error fetching tracking:', error);
            throw error;
        }
    },

    /**
     * Create a shipment for an order (admin only).
     * @param {object} shipmentData - { order_id, weight_kg, length, breadth, height }
     */
    createShipment: async (shipmentData) => {
        try {
            const response = await apiHook.post('/tracking/create-shipment/', shipmentData);
            return response.data;
        } catch (error) {
            console.error('Error creating shipment:', error);
            throw error;
        }
    },
};

export default orderService;
