import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useShop } from '../../context/ShopContext';
import CheckoutSteps, { OrderSummarySidebar } from './CheckoutSteps';
import {
    FaCreditCard,
    FaMobileAlt,
    FaUniversity,
    FaMoneyBillWave,
    FaCheckCircle,
    FaLock,
    FaArrowLeft,
    FaArrowRight,
    FaBan,
} from 'react-icons/fa';

const PAYMENT_METHODS = [
    {
        id: 'razorpay',
        name: 'Credit / Debit Card',
        description: 'Pay securely with Razorpay',
        icon: FaCreditCard,
        badges: ['Visa', 'Mastercard', 'Rupay'],
    },
    {
        id: 'upi',
        name: 'UPI',
        description: 'PhonePe, Google Pay, Paytm & more',
        icon: FaMobileAlt,
        badges: [],
    },
    {
        id: 'netbanking',
        name: 'Net Banking',
        description: 'Pay using your bank account',
        icon: FaUniversity,
        badges: [],
    },
    {
        id: 'cod',
        name: 'Cash on Delivery',
        description: 'Pay when you receive your order',
        icon: FaMoneyBillWave,
        badges: [],
        note: 'Available for orders above ₹500',
    },
];

const CheckoutPayment = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { cartItems } = useShop();
    const [paymentMethod, setPaymentMethod] = useState('razorpay');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const shippingAddressId = location.state?.shippingAddress;
    const shippingMethod = location.state?.shippingMethod;
    const shippingCost = location.state?.shippingCost;
    const shippingEta = location.state?.shippingEta;
    const codAvailable = location.state?.codAvailable ?? true;
    const zone = location.state?.zone || '';

    useEffect(() => {
        if (!shippingAddressId || !shippingMethod) {
            navigate('/checkout/address');
        }
    }, [shippingAddressId, shippingMethod, navigate]);

    const handleContinue = async () => {
        setLoading(true);
        setError('');
        try {
            navigate('/checkout/review', {
                state: {
                    shippingAddress: shippingAddressId,
                    shippingMethod,
                    shippingCost,
                    shippingEta,
                    paymentMethod,
                    codAvailable,
                    zone,
                },
            });
        } catch (err) {
            setError(err.response?.data?.message || 'Payment initialization failed');
        } finally {
            setLoading(false);
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
                <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Checkout</h1>
                <CheckoutSteps currentStep="payment" />

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* ── Main Column ── */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
                            <h2 className="text-xl font-bold text-gray-900 mb-1">Payment Method</h2>
                            <p className="text-sm text-gray-500 mb-6">All transactions are secure and encrypted</p>

                            {error && (
                                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
                                    {error}
                                </div>
                            )}

                            <div className="space-y-4">
                                {PAYMENT_METHODS.map((method) => {
                                    const Icon = method.icon;
                                    const isSelected = paymentMethod === method.id;
                                    const isCodDisabled = method.id === 'cod' && !codAvailable;

                                    return (
                                        <button
                                            key={method.id}
                                            type="button"
                                            onClick={() => {
                                                if (!isCodDisabled) setPaymentMethod(method.id);
                                            }}
                                            disabled={isCodDisabled}
                                            className={`relative w-full text-left flex items-start gap-4 p-5 rounded-xl border-2 transition-all duration-200 ${
                                                isCodDisabled
                                                    ? 'border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed'
                                                    : isSelected
                                                    ? 'border-black bg-gray-50 ring-1 ring-black/5'
                                                    : 'border-gray-200 hover:border-gray-400'
                                            }`}
                                        >
                                            {/* Icon */}
                                            <div
                                                className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${
                                                    isCodDisabled
                                                        ? 'bg-gray-100 text-gray-300'
                                                        : isSelected
                                                        ? 'bg-black text-white'
                                                        : 'bg-gray-100 text-gray-500'
                                                } transition-colors`}
                                            >
                                                {isCodDisabled ? <FaBan className="text-lg" /> : <Icon className="text-lg" />}
                                            </div>

                                            {/* Info */}
                                            <div className="flex-1 min-w-0">
                                                <span className={`font-bold ${isCodDisabled ? 'text-gray-400' : 'text-gray-900'}`}>
                                                    {method.name}
                                                </span>
                                                <p className={`text-sm mt-0.5 ${isCodDisabled ? 'text-gray-300' : 'text-gray-500'}`}>
                                                    {isCodDisabled
                                                        ? 'Not available for this delivery address'
                                                        : method.description}
                                                </p>
                                                {method.badges.length > 0 && !isCodDisabled && (
                                                    <div className="flex gap-2 mt-2">
                                                        {method.badges.map((badge) => (
                                                            <span
                                                                key={badge}
                                                                className="text-[10px] font-semibold uppercase tracking-wider bg-gray-100 text-gray-600 px-2 py-0.5 rounded"
                                                            >
                                                                {badge}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                                {method.note && !isCodDisabled && (
                                                    <p className="text-xs text-amber-600 mt-1">⚠️ {method.note}</p>
                                                )}
                                            </div>

                                            {/* Selected check */}
                                            {isSelected && !isCodDisabled && (
                                                <span className="absolute top-3 right-3 text-black">
                                                    <FaCheckCircle />
                                                </span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Security note */}
                            <div className="mt-6 flex items-center gap-2 text-xs text-gray-500 bg-gray-50 rounded-xl p-4">
                                <FaLock className="text-gray-400 flex-shrink-0" />
                                <span>
                                    Your payment information is secure and encrypted. We never store your card details.
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* ── Sidebar ── */}
                    <div className="lg:col-span-1">
                        <OrderSummarySidebar cartItems={cartItems} />
                    </div>
                </div>

                {/* ── Bottom Actions ── */}
                <div className="flex items-center justify-between mt-8">
                    <button
                        onClick={() =>
                            navigate('/checkout/shipping', {
                                state: { shippingAddress: shippingAddressId },
                            })
                        }
                        className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-black transition"
                    >
                        <FaArrowLeft className="text-xs" /> Back to Shipping
                    </button>
                    <button
                        onClick={handleContinue}
                        disabled={loading}
                        className="flex items-center gap-2 px-8 py-3.5 bg-black text-white rounded-xl font-bold text-sm hover:bg-gray-900 transition shadow-lg shadow-black/10 disabled:opacity-50"
                    >
                        {loading ? 'Processing…' : 'Review Order'} <FaArrowRight className="text-xs" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CheckoutPayment;
