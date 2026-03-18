import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useShop } from '../../context/ShopContext';
import userService from '../../services/userService';
import orderService from '../../services/orderService';
import paymentService from '../../services/paymentService';
import apiHook from '../../services/apiConfig';
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
    FaTag,
    FaTimes,
    FaCheck,
} from 'react-icons/fa';

const GST_RATE = 0.18;

const PAYMENT_LABELS = {
    instamojo: 'Credit / Debit Card',
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

    // Promo code state
    const [promoInput, setPromoInput] = useState('');
    const [promoApplied, setPromoApplied] = useState(null); // { code, discount_amount, discount_type, discount_value, description }
    const [promoLoading, setPromoLoading] = useState(false);
    const [promoError, setPromoError] = useState('');
    const [promoSuccess, setPromoSuccess] = useState('');
    const [availableCodes, setAvailableCodes] = useState([]);
    const [showAvailableCodes, setShowAvailableCodes] = useState(false);

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
        fetchAvailablePromoCodes();
    }, [addressId, paymentMethod, shippingMethod, navigate]);

    const fetchAvailablePromoCodes = async () => {
        try {
            const res = await apiHook.get('/pages/promo-codes/');
            setAvailableCodes(res.data || []);
        } catch (e) { /* ignore */ }
    };

    const handleApplyPromo = async () => {
        if (!promoInput.trim()) return;
        setPromoLoading(true);
        setPromoError('');
        setPromoSuccess('');
        try {
            const res = await apiHook.post('/pages/promo-codes/validate/', {
                code: promoInput.trim().toUpperCase(),
                subtotal: subtotal,
            });
            if (res.data.valid) {
                setPromoApplied(res.data);
                setPromoSuccess(`Code ${res.data.code} applied! You save ₹${parseFloat(res.data.discount_amount).toFixed(2)}`);
                setPromoError('');
            }
        } catch (err) {
            const msg = err.response?.data?.message || 'Invalid promo code';
            setPromoError(msg);
            setPromoApplied(null);
            setPromoSuccess('');
        } finally {
            setPromoLoading(false);
        }
    };

    const handleRemovePromo = () => {
        setPromoApplied(null);
        setPromoInput('');
        setPromoError('');
        setPromoSuccess('');
    };

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
    const discount = promoApplied ? parseFloat(promoApplied.discount_amount) : 0;
    const total = +(subtotal + taxes + shippingCost - discount).toFixed(2);

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
                promo_code: promoApplied?.code || '',
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

            // ─── Step 2B: Online — Create Instamojo payment request ───
            setPaymentStage('initiating_payment');
            const paymentData = await paymentService.createPaymentRequest(order.id);

            // Store order info in sessionStorage for when user returns from Instamojo
            sessionStorage.setItem('instamojo_order_id', order.id);
            sessionStorage.setItem('instamojo_payment_request_id', paymentData.payment_request_id);

            // ─── Step 3: Redirect to Instamojo payment page ───
            paymentService.redirectToPayment(paymentData.payment_url);
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
        <div className="bg-white min-h-screen py-8">
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
                        {/* ── Back link inside main column ── */}
                        <div className="mt-6">
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

                    {/* ── Sidebar ── */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <h3 className="text-lg font-bold text-gray-900 mb-5">Price Details</h3>

                            {/* Promo code input */}
                            <div className="mb-5">
                                <div className="flex items-center gap-2 mb-2">
                                    <FaTag className="text-gray-400 text-xs" />
                                    <span className="text-sm font-semibold text-gray-700">Promo Code</span>
                                </div>
                                {promoApplied ? (
                                    <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <FaCheck className="text-green-600 text-xs" />
                                            <span className="text-sm font-bold text-green-700">{promoApplied.code}</span>
                                        </div>
                                        <button onClick={handleRemovePromo} className="text-red-500 hover:text-red-700 transition">
                                            <FaTimes className="text-xs" />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={promoInput}
                                            onChange={(e) => { setPromoInput(e.target.value.toUpperCase()); setPromoError(''); }}
                                            onKeyDown={(e) => e.key === 'Enter' && handleApplyPromo()}
                                            placeholder="Enter code"
                                            className="flex-1 border border-gray-300 rounded-xl px-4 py-2.5 text-sm font-mono tracking-wide uppercase focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black transition"
                                        />
                                        <button
                                            onClick={handleApplyPromo}
                                            disabled={promoLoading || !promoInput.trim()}
                                            className="px-4 py-2.5 bg-black text-white rounded-xl text-sm font-bold hover:bg-gray-900 transition disabled:opacity-50"
                                        >
                                            {promoLoading ? <FaSpinner className="animate-spin text-xs" /> : 'Apply'}
                                        </button>
                                    </div>
                                )}
                                {promoError && <p className="text-xs text-red-500 mt-1.5">{promoError}</p>}
                                {promoSuccess && <p className="text-xs text-green-600 mt-1.5">{promoSuccess}</p>}

                                {/* Available promo codes list */}
                                {availableCodes.length > 0 && !promoApplied && (
                                    <div className="mt-3">
                                        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Available Offers</p>
                                        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                                            {availableCodes.map((c, i) => (
                                                <div
                                                    key={i}
                                                    className="flex items-center justify-between bg-blue-50/50 border border-blue-100 rounded-lg px-3 py-2.5 cursor-pointer hover:bg-blue-50 transition shadow-sm group"
                                                    onClick={() => { setPromoInput(c.code); handleApplyPromo(); }}
                                                >
                                                    <div>
                                                        <span className="text-xs font-bold font-mono text-blue-700 bg-white px-1.5 py-0.5 rounded shadow-sm group-hover:bg-blue-100 border border-blue-200">{c.code}</span>
                                                        {c.description && <p className="text-[10px] text-gray-500 mt-1">{c.description}</p>}
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="block text-xs font-bold text-green-700">
                                                            {c.discount_type === 'percentage' ? `${c.discount_value}% off` : `₹${c.discount_value} off`}
                                                        </span>
                                                        <span className="text-[9px] text-gray-400 uppercase font-semibold">Tap to apply</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

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
                                {discount > 0 && (
                                    <div className="flex justify-between">
                                        <span className="text-green-600 font-medium">Discount ({promoApplied?.code})</span>
                                        <span className="font-bold text-green-600">-₹{discount.toFixed(2)}</span>
                                    </div>
                                )}
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
            </div>
        </div>
    );
};

export default CheckoutReview;
