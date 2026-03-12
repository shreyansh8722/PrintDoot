import apiHook from './apiConfig';

const paymentService = {
    /**
     * Create an Instamojo payment request for the given internal order.
     * POST /payments/create-order/
     * @param {number} orderId - Internal order ID
     * @returns {{ payment_request_id, payment_url, order_id }}
     */
    createPaymentRequest: async (orderId) => {
        try {
            const response = await apiHook.post('/payments/create-order/', {
                order_id: orderId,
            });
            return response.data;
        } catch (error) {
            console.error('Error creating Instamojo payment request:', error);
            throw error;
        }
    },

    /**
     * Verify Instamojo payment after redirect.
     * POST /payments/verify/
     * @param {{ payment_request_id, payment_id }} paymentData
     * @returns {{ success, message, order_id, transaction }}
     */
    verifyPayment: async (paymentData) => {
        try {
            const response = await apiHook.post('/payments/verify/', paymentData);
            return response.data;
        } catch (error) {
            console.error('Error verifying payment:', error);
            throw error;
        }
    },

    /**
     * Get all payment transactions for the current user.
     * GET /payments/transactions/
     * @returns {{ transactions: [] }}
     */
    getTransactions: async () => {
        try {
            const response = await apiHook.get('/payments/transactions/');
            return response.data;
        } catch (error) {
            console.error('Error fetching transactions:', error);
            throw error;
        }
    },

    /**
     * Get transaction + payment logs for a specific order.
     * GET /payments/transactions/{orderId}/
     * @param {number} orderId
     * @returns {{ transaction, logs: [] }}
     */
    getTransactionByOrder: async (orderId) => {
        try {
            const response = await apiHook.get(`/payments/transactions/${orderId}/`);
            return response.data;
        } catch (error) {
            console.error('Error fetching transaction:', error);
            throw error;
        }
    },

    /**
     * Redirect user to Instamojo payment page.
     * Instamojo uses a redirect-based flow (not a widget).
     * The user will be redirected back to the redirect_url after payment.
     *
     * @param {string} paymentUrl - The Instamojo longurl to redirect to
     */
    redirectToPayment: (paymentUrl) => {
        window.location.href = paymentUrl;
    },
};

export default paymentService;
