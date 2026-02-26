import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useShop } from '../../context/ShopContext';
import userService from '../../services/userService';
import orderService from '../../services/orderService';
import paymentService from '../../services/paymentService';
import CheckoutSteps from './CheckoutSteps';
import {
    FaMapMarkerAlt,
    FaTruck,
    FaCreditCard,
    FaArrowLeft,
    FaLock,
    FaPen,
    FaPaintBrush,
    FaSpinner,
} from 'react-icons/fa';

const GST_RATE = 0.18;

const PAYMENT_LABELS = {
    razorpay: 'Credit / Debit Card',
    upi: 'UPI',
    netbanking: 'Net Banking',
    cod: 'Cash on Delivery',
};

const SHIPPING_LABELS = {
    standard: 'Standard Delivery',
    express: 'Express Delivery',
    priority: 'Priority Delivery',
};

const CheckoutReview = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { cartItems, clearCart } = useShop();
    const [shippingAddress, setShippingAddress] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [loadingAddress, setLoadingAddress] = useState(true);
    const [customerNotes, setCustomerNotes] = useState('');
    const [paymentStage, setPaymentStage] = useState(''); // '', 'creating_order', 'initiating_payment', 'verifying'

    const addressId = location.state?.shippingAddress;
    const paymentMethod = location.state?.paymentMethod;
    const shippingMethod = location.state?.shippingMethod;
    const shippingCost = location.state?.shippingCost ?? 0;
    const shippingEta = location.state?.shippingEta || '';

    useEffect(() => {
        if (!addressId || !paymentMethod || !shippingMethod) {
            navigate('/checkout/address');
            return;
        }
        loadAddress(addressId);
    }, [addressId, paymentMethod, shippingMethod, navigate]);

    const loadAddress = async (id) => {
        try {
            setLoadingAddress(true);
            const addresses = await userService.getAddresses();
            const addr = addresses.find((a) => a.id === id);
            setShippingAddress(addr);
        } catch (err) {
            console.error('Error loading address:', err);
        } finally {
            setLoadingAddress(false);
        }
    };

    /* ── Calculate totals ── */
    const subtotal = cartItems.reduce((acc, item) => {
        const price = Number(item.finalPrice || item.basePrice || item.base_price || 0);
        const qty = item.quantity || 1;
        return acc + price * qty;
    }, 0);
    const taxes = +(subtotal * GST_RATE).toFixed(2);
    const total = +(subtotal + taxes + shippingCost).toFixed(2);

    /* ── Determine if online payment ── */
    const isOnlinePayment = paymentMethod !== 'cod';

    const handlePlaceOrder = async () => {
        setLoading(true);
        setError('');
        setPaymentStage('creating_order');

        try {
            // ─── Step 1: Create the order in backend ───
            const orderData = {
                shipping_address: addressId,
                payment_method: paymentMethod,
                customer_notes: customerNotes,
                shipping_total: shippingCost,
                items: cartItems.map((item) => ({
                    product: item.id,
                    design: item.backendDesignId || null,
                    zakeke_design_id: item.designId || '',
                    quantity: item.quantity,
                })),
            };
            const order = await orderService.createOrder(orderData);

            // ─── Step 2A: COD — done, go to success ───
            if (!isOnlinePayment) {
                clearCart();
                navigate(`/checkout/success/${order.id}`);
                return;
            }

            // ─── Step 2B: Online — Create Razorpay order ───
            setPaymentStage('initiating_payment');
            const razorpayData = await paymentService.createRazorpayOrder(order.id);

            // ─── Step 3: Open Razorpay checkout ───
            await paymentService.openCheckout({
                razorpay_key_id: razorpayData.razorpay_key_id,
                razorpay_order_id: razorpayData.razorpay_order_id,
                amount: razorpayData.amount,
                currency: razorpayData.currency,
                user_name: razorpayData.user_name,
                user_email: razorpayData.user_email,
                onSuccess: async (paymentResponse) => {
                    try {
                        // ─── Step 4: Verify payment on server ───
                        setPaymentStage('verifying');
                        const verification = await paymentService.verifyPayment({
                            razorpay_order_id: paymentResponse.razorpay_order_id,
                            razorpay_payment_id: paymentResponse.razorpay_payment_id,
                            razorpay_signature: paymentResponse.razorpay_signature,
                        });

                        if (verification.success) {
                            clearCart();
                            navigate(`/checkout/success/${order.id}`);
                        } else {
                            navigate('/checkout/failed', {
                                state: {
                                    orderId: order.id,
                                    error: verification.error || 'Payment verification failed.',
                                },
                            });
                        }
                    } catch (verifyErr) {
                        console.error('Verification error:', verifyErr);
                        navigate('/checkout/failed', {
                            state: {
                                orderId: order.id,
                                error: 'Payment was processed but verification failed. Please contact support.',
                            },
                        });
                    }
                },
                onFailure: (rzpError) => {
                    console.error('Razorpay payment failed:', rzpError);
                    navigate('/checkout/failed', {
                        state: {
                            orderId: order.id,
                            error: rzpError?.description || rzpError?.message || 'Payment failed. Please try again.',
                            errorCode: rzpError?.code,
                        },
                    });
                },
                onDismiss: () => {
                    // User closed the modal without completing payment
                    setLoading(false);
                    setPaymentStage('');
                    setError('Payment was cancelled. You can try again when ready.');
                },
            });
        } catch (err) {
            console.error('Order/payment error:', err);
            const errMsg =
                err.response?.data?.error ||
                err.response?.data?.message ||
                err.message ||
                'Failed to place order. Please try again.';
            setError(errMsg);
            setLoading(false);
            setPaymentStage('');
        }
    };

    /* ── Loading stage text ── */
    const getLoadingText = () => {
        switch (paymentStage) {
            case 'creating_order':
                return 'Creating your order…';
            case 'initiating_payment':
                return 'Preparing payment…';
            case 'verifying':
                return 'Verifying payment…';
            default:
                return 'Processing…';
        }
    };

    /* ── Empty cart guard ── */
    if (cartItems.length === 0) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
                <h2 className="text-2xl font-bold text-gray-800">Your cart is empty</h2>
                <button
                    onClick={() => navigate('/view-all')}
                    className="px-6 py-3 bg-black text-white rounded-xl font-semibold hover:bg-gray-900 transition"
                >
                    Continue Shopping
                </button>
            </div>
        );
    }

    return (
        <div className="bg-gray-50 min-h-screen py-8">
            <div className="max-w-6xl mx-auto px-4">
                <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Review Your Order</h1>
                <CheckoutSteps currentStep="review" />

                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
                        {error}
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* ── Main Column ── */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Shipping Address */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <FaMapMarkerAlt className="text-gray-500" />
                                    <h2 className="text-lg font-bold text-gray-900">Shipping Address</h2>
                                </div>
                                <Link
                                    to="/checkout/address"
                                    className="flex items-center gap-1 text-sm font-semibold text-gray-500 hover:text-black transition"
                                >
                                    <FaPen className="text-[10px]" /> Edit
                                </Link>
                            </div>
                            {loadingAddress ? (
                                <div className="flex items-center justify-center py-6">
                                    <div className="animate-spin w-6 h-6 border-4 border-gray-200 border-t-black rounded-full" />
                                </div>
                            ) : shippingAddress ? (
                                <div className="text-sm text-gray-700 leading-relaxed">
                                    <p className="font-bold text-gray-900">{shippingAddress.recipient_name}</p>
                                    <p>{shippingAddress.street}{shippingAddress.apartment_suite ? `, ${shippingAddress.apartment_suite}` : ''}</p>
                                    <p>{shippingAddress.city}, {shippingAddress.state} {shippingAddress.zip_code}</p>
                                    <p>{shippingAddress.country}</p>
                                    <p className="text-gray-500 mt-1">📞 {shippingAddress.phone_number}</p>
                                </div>
                            ) : null}
                        </div>

                        {/* Shipping Method */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <FaTruck className="text-gray-500" />
                                    <h2 className="text-lg font-bold text-gray-900">Shipping Method</h2>
                                </div>
                                <button
                                    onClick={() =>
                                        navigate('/checkout/shipping', { state: { shippingAddress: addressId } })
                                    }
                                    className="flex items-center gap-1 text-sm font-semibold text-gray-500 hover:text-black transition"
                                >
                                    <FaPen className="text-[10px]" /> Edit
                                </button>
                            </div>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-semibold text-gray-900">
                                        {SHIPPING_LABELS[shippingMethod] || shippingMethod}
                                    </p>
                                    {shippingEta && <p className="text-sm text-gray-500">Estimated: {shippingEta}</p>}
                                </div>
                                <span className={`font-bold ${shippingCost === 0 ? 'text-green-600' : 'text-gray-900'}`}>
                                    {shippingCost === 0 ? 'FREE' : `₹${shippingCost}`}
                                </span>
                            </div>
                        </div>

                        {/* Payment Method */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <FaCreditCard className="text-gray-500" />
                                    <h2 className="text-lg font-bold text-gray-900">Payment Method</h2>
                                </div>
                                <button
                                    onClick={() =>
                                        navigate('/checkout/payment', {
                                            state: {
                                                shippingAddress: addressId,
                                                shippingMethod,
                                                shippingCost,
                                                shippingEta,
                                            },
                                        })
                                    }
                                    className="flex items-center gap-1 text-sm font-semibold text-gray-500 hover:text-black transition"
                                >
                                    <FaPen className="text-[10px]" /> Edit
                                </button>
                            </div>
                            <p className="font-semibold text-gray-900">{PAYMENT_LABELS[paymentMethod] || paymentMethod}</p>
                        </div>

                        {/* Order Items */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <h2 className="text-lg font-bold text-gray-900 mb-4">Order Items</h2>
                            <div className="divide-y divide-gray-100">
                                {cartItems.map((item) => {
                                    const price = Number(item.finalPrice || item.basePrice || item.base_price || 0);
                                    const qty = item.quantity || 1;
                                    return (
                                        <div key={item.cartId} className="flex gap-4 py-4 first:pt-0 last:pb-0">
                                            <div className="w-16 h-16 bg-gray-50 rounded-lg overflow-hidden flex-shrink-0 border border-gray-100">
                                                <img
                                                    src={item.image || item.img || 'https://placehold.co/64x64'}
                                                    alt={item.title || 'Product'}
                                                    className="w-full h-full object-contain p-1"
                                                />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold text-gray-900 truncate">{item.title || item.name}</p>
                                                <p className="text-sm text-gray-500">Qty: {qty}</p>
                                                {item.designId && (
                                                    <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-bold uppercase tracking-wider bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full">
                                                        <FaPaintBrush className="text-[8px]" /> Customized
                                                    </span>
                                                )}
                                            </div>
                                            <span className="text-sm font-bold text-gray-900 flex-shrink-0">
                                                ₹{(price * qty).toFixed(2)}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Customer Notes */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <h2 className="text-lg font-bold text-gray-900 mb-3">Additional Notes (Optional)</h2>
                            <textarea
                                value={customerNotes}
                                onChange={(e) => setCustomerNotes(e.target.value)}
                                placeholder="Any special instructions for your order…"
                                rows="3"
                                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black transition resize-none"
                            />
                        </div>
                    </div>

                    {/* ── Sidebar ── */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-24">
                            <h3 className="text-lg font-bold text-gray-900 mb-5">Price Details</h3>

                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">
                                        Subtotal ({cartItems.reduce((a, i) => a + (i.quantity || 1), 0)} items)
                                    </span>
                                    <span className="font-medium">₹{subtotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Taxes (GST 18%)</span>
                                    <span className="font-medium">₹{taxes.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Shipping</span>
                                    {shippingCost === 0 ? (
                                        <span className="font-medium text-green-600">FREE</span>
                                    ) : (
                                        <span className="font-medium">₹{shippingCost.toFixed(2)}</span>
                                    )}
                                </div>
                            </div>

                            <div className="border-t-2 border-gray-100 mt-4 pt-4 mb-6">
                                <div className="flex justify-between items-baseline">
                                    <span className="font-bold text-gray-900 text-base">Total</span>
                                    <span className="text-2xl font-extrabold text-gray-900">₹{total.toFixed(2)}</span>
                                </div>
                            </div>

                            <button
                                onClick={handlePlaceOrder}
                                disabled={loading}
                                className="w-full flex items-center justify-center gap-2 py-4 bg-black text-white rounded-xl font-bold text-sm hover:bg-gray-900 transition shadow-lg shadow-black/10 disabled:opacity-50"
                            >
                                {loading ? (
                                    <>
                                        <FaSpinner className="text-xs animate-spin" />
                                        {getLoadingText()}
                                    </>
                                ) : (
                                    <>
                                        <FaLock className="text-xs" />
                                        {isOnlinePayment
                                            ? `Pay ₹${total.toFixed(2)}`
                                            : `Place Order · ₹${total.toFixed(2)}`}
                                    </>
                                )}
                            </button>

                            <p className="text-center text-[11px] text-gray-400 mt-3">
                                By placing this order, you agree to our{' '}
                                <Link to="/terms" className="underline hover:text-gray-600">
                                    Terms of Service
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>

                {/* ── Bottom Back ── */}
                <div className="mt-8">
                    <button
                        onClick={() =>
                            navigate('/checkout/payment', {
                                state: {
                                    shippingAddress: addressId,
                                    shippingMethod,
                                    shippingCost,
                                    shippingEta,
                                },
                            })
                        }
                        className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-black transition"
                    >
                        <FaArrowLeft className="text-xs" /> Back to Payment
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CheckoutReview;
