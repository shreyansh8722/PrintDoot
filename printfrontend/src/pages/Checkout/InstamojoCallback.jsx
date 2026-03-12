import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useShop } from '../../context/ShopContext';
import paymentService from '../../services/paymentService';
import { FaSpinner, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';

/**
 * Instamojo redirects the user back here after payment.
 * URL will contain: ?payment_id=xxx&payment_status=xxx&payment_request_id=xxx
 */
const InstamojoCallback = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { clearCart } = useShop();
    const [status, setStatus] = useState('verifying'); // verifying, success, failed
    const [error, setError] = useState('');

    useEffect(() => {
        const verifyPayment = async () => {
            const paymentId = searchParams.get('payment_id');
            const paymentRequestId = searchParams.get('payment_request_id');
            const paymentStatus = searchParams.get('payment_status');
            const orderId = sessionStorage.getItem('instamojo_order_id');

            // Clean up session storage
            sessionStorage.removeItem('instamojo_order_id');
            sessionStorage.removeItem('instamojo_payment_request_id');

            if (!paymentId || !paymentRequestId) {
                setStatus('failed');
                setError('Missing payment information. Please contact support.');
                setTimeout(() => navigate('/'), 3000);
                return;
            }

            // If Instamojo already tells us it failed
            if (paymentStatus && paymentStatus.toLowerCase() === 'failed') {
                setStatus('failed');
                setError('Payment was not completed. Please try again.');
                setTimeout(() => {
                    if (orderId) {
                        navigate('/checkout/failed', {
                            state: {
                                orderId: parseInt(orderId),
                                error: 'Payment failed. Please try again.',
                            },
                        });
                    } else {
                        navigate('/');
                    }
                }, 2000);
                return;
            }

            try {
                // Verify payment on backend
                const verification = await paymentService.verifyPayment({
                    payment_request_id: paymentRequestId,
                    payment_id: paymentId,
                });

                if (verification.success) {
                    setStatus('success');
                    clearCart();
                    setTimeout(() => {
                        navigate(`/checkout/success/${verification.order_id || orderId}`);
                    }, 1500);
                } else {
                    setStatus('failed');
                    setError(verification.error || 'Payment verification failed.');
                    setTimeout(() => {
                        navigate('/checkout/failed', {
                            state: {
                                orderId: verification.order_id || (orderId ? parseInt(orderId) : null),
                                error: verification.error || 'Payment verification failed.',
                            },
                        });
                    }, 2000);
                }
            } catch (err) {
                console.error('Payment verification error:', err);
                setStatus('failed');
                const errMsg =
                    err.response?.data?.error ||
                    'Payment verification failed. Please contact support.';
                setError(errMsg);
                setTimeout(() => {
                    navigate('/checkout/failed', {
                        state: {
                            orderId: orderId ? parseInt(orderId) : null,
                            error: 'Payment was processed but verification failed. Please contact support.',
                        },
                    });
                }, 2000);
            }
        };

        verifyPayment();
    }, [searchParams, navigate, clearCart]);

    return (
        <div className="min-h-screen bg-white flex items-center justify-center">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 max-w-md w-full mx-4 text-center">
                {status === 'verifying' && (
                    <>
                        <FaSpinner className="text-4xl text-black animate-spin mx-auto mb-4" />
                        <h2 className="text-xl font-bold text-gray-900 mb-2">Verifying Payment</h2>
                        <p className="text-sm text-gray-500">
                            Please wait while we confirm your payment...
                        </p>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <FaCheckCircle className="text-5xl text-green-500 mx-auto mb-4" />
                        <h2 className="text-xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
                        <p className="text-sm text-gray-500">
                            Redirecting to your order confirmation...
                        </p>
                    </>
                )}

                {status === 'failed' && (
                    <>
                        <FaTimesCircle className="text-5xl text-red-500 mx-auto mb-4" />
                        <h2 className="text-xl font-bold text-gray-900 mb-2">Payment Failed</h2>
                        <p className="text-sm text-gray-500 mb-4">{error}</p>
                        <p className="text-xs text-gray-400">Redirecting...</p>
                    </>
                )}
            </div>
        </div>
    );
};

export default InstamojoCallback;
