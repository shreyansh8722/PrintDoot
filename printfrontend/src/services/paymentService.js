import apiHook from './apiConfig';

const paymentService = {
    /**
     * Create a Razorpay order for the given internal order.
     * POST /payments/create-order/
     * @param {number} orderId - Internal order ID
     * @returns {{ razorpay_order_id, razorpay_key_id, amount, currency, order_id, user_email, user_name }}
     */
    createRazorpayOrder: async (orderId) => {
        try {
            const response = await apiHook.post('/payments/create-order/', {
                order_id: orderId,
            });
            return response.data;
        } catch (error) {
            console.error('Error creating Razorpay order:', error);
            throw error;
        }
    },

    /**
     * Verify Razorpay payment signature after checkout.
     * POST /payments/verify/
     * @param {{ razorpay_order_id, razorpay_payment_id, razorpay_signature }} paymentData
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
     * Open Razorpay checkout widget.
     * Loads the Razorpay script, then opens the payment modal.
     *
     * @param {Object} options
     * @param {string} options.razorpay_key_id
     * @param {string} options.razorpay_order_id
     * @param {number} options.amount - Amount in paisa
     * @param {string} options.currency
     * @param {string} options.user_name
     * @param {string} options.user_email
     * @param {Function} options.onSuccess - Callback({ razorpay_order_id, razorpay_payment_id, razorpay_signature })
     * @param {Function} options.onFailure - Callback(error)
     * @param {Function} [options.onDismiss] - Callback when modal is closed
     */
    openCheckout: async ({
        razorpay_key_id,
        razorpay_order_id,
        amount,
        currency = 'INR',
        user_name = '',
        user_email = '',
        onSuccess,
        onFailure,
        onDismiss,
    }) => {
        // Ensure Razorpay script is loaded
        await paymentService._loadRazorpayScript();

        const options = {
            key: razorpay_key_id,
            amount: amount,
            currency: currency,
            name: 'PrintShop',
            description: 'Order Payment',
            order_id: razorpay_order_id,
            prefill: {
                name: user_name,
                email: user_email,
            },
            theme: {
                color: '#000000',
            },
            handler: function (response) {
                // Payment successful — verify on server
                onSuccess({
                    razorpay_order_id: response.razorpay_order_id,
                    razorpay_payment_id: response.razorpay_payment_id,
                    razorpay_signature: response.razorpay_signature,
                });
            },
            modal: {
                ondismiss: function () {
                    if (onDismiss) onDismiss();
                },
            },
        };

        try {
            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', function (response) {
                onFailure(response.error);
            });
            rzp.open();
        } catch (error) {
            console.error('Razorpay open error:', error);
            onFailure(error);
        }
    },

    /**
     * Lazily load the Razorpay checkout.js script.
     */
    _loadRazorpayScript: () => {
        return new Promise((resolve, reject) => {
            if (window.Razorpay) {
                resolve();
                return;
            }
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.async = true;
            script.onload = resolve;
            script.onerror = () => reject(new Error('Failed to load Razorpay SDK'));
            document.body.appendChild(script);
        });
    },
};

export default paymentService;
