import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useShop } from '../../context/ShopContext';
import userService from '../../services/userService';
import shippingService from '../../services/shippingService';
import CheckoutSteps, { OrderSummarySidebar } from './CheckoutSteps';
import {
    FaTruck,
    FaBolt,
    FaRocket,
    FaCheckCircle,
    FaArrowLeft,
    FaArrowRight,
    FaShieldAlt,
    FaMapMarkerAlt,
    FaExclamationTriangle,
} from 'react-icons/fa';

const METHOD_META = {
    standard: { name: 'Standard Delivery', icon: FaTruck },
    express: { name: 'Express Delivery', icon: FaBolt },
    priority: { name: 'Priority Delivery', icon: FaRocket },
};

const CheckoutShipping = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { cartItems } = useShop();

    const shippingAddressId = location.state?.shippingAddress;

    const [selectedShipping, setSelectedShipping] = useState('standard');
    const [shippingOptions, setShippingOptions] = useState([]);
    const [loadingOptions, setLoadingOptions] = useState(true);
    const [addressData, setAddressData] = useState(null);
    const [codAvailable, setCodAvailable] = useState(false);
    const [zone, setZone] = useState('');
    const [apiError, setApiError] = useState('');

    // Redirect if no address
    useEffect(() => {
        if (!shippingAddressId) {
            navigate('/checkout/address');
        }
    }, [shippingAddressId, navigate]);

    /* Calculate subtotal */
    const subtotal = cartItems.reduce((acc, item) => {
        const price = Number(item.finalPrice || item.basePrice || item.base_price || 0);
        const qty = item.quantity || 1;
        return acc + price * qty;
    }, 0);

    /* Load address then fetch shipping options */
    useEffect(() => {
        if (!shippingAddressId) return;

        const fetchShippingOptions = async () => {
            try {
                setLoadingOptions(true);
                setApiError('');

                // 1) Load address to get pincode
                const addresses = await userService.getAddresses();
                const addr = addresses.find((a) => a.id === shippingAddressId);
                setAddressData(addr);

                if (!addr?.zip_code) {
                    setApiError('Address is missing a pincode. Please update your address.');
                    setShippingOptions([]);
                    return;
                }

                // 2) Check serviceability
                const svc = await shippingService.checkServiceability(addr.zip_code);
                setCodAvailable(svc.cod_available);
                setZone(svc.zone || '');

                if (!svc.serviceable) {
                    setApiError(
                        `Sorry, we don't currently deliver to ${addr.zip_code}${svc.city ? ` (${svc.city})` : ''}. Please choose a different address.`
                    );
                    setShippingOptions([]);
                    return;
                }

                // 3) Get shipping options
                const result = await shippingService.calculateShipping({
                    pincode: addr.zip_code,
                    weight_grams: cartItems.reduce((w, item) => w + (item.weight_grams || 200) * (item.quantity || 1), 0),
                    order_subtotal: subtotal,
                });

                const options = result.options || [result];
                setShippingOptions(options);

                // Auto-select first available
                if (options.length > 0 && !options.find((o) => o.method === selectedShipping)) {
                    setSelectedShipping(options[0].method);
                }
            } catch (err) {
                console.error('Error fetching shipping options:', err);
                setApiError('Failed to load shipping options. Please try again.');
            } finally {
                setLoadingOptions(false);
            }
        };

        fetchShippingOptions();
    }, [shippingAddressId]); // eslint-disable-line react-hooks/exhaustive-deps

    const getSelectedOption = () => shippingOptions.find((o) => o.method === selectedShipping);

    const handleContinue = () => {
        const option = getSelectedOption();
        if (!option) return;
        navigate('/checkout/payment', {
            state: {
                shippingAddress: shippingAddressId,
                shippingMethod: option.method,
                shippingCost: option.is_free ? 0 : option.cost,
                shippingEta: `${option.eta_min_days}–${option.eta_max_days} business days`,
                codAvailable,
                zone,
            },
        });
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
                <CheckoutSteps currentStep="shipping" />

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* ── Main Column ── */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Delivering-to pill */}
                        {addressData && (
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex items-center gap-3">
                                <FaMapMarkerAlt className="text-gray-400 flex-shrink-0" />
                                <div className="text-sm">
                                    <span className="text-gray-500">Delivering to </span>
                                    <span className="font-semibold text-gray-900">
                                        {addressData.city}, {addressData.zip_code}
                                    </span>
                                    {zone && (
                                        <span className="ml-2 text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-brand px-2 py-0.5 rounded-full">
                                            {zone}
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
                            <h2 className="text-xl font-bold text-gray-900 mb-1">Shipping Method</h2>
                            <p className="text-sm text-gray-500 mb-6">Choose how you'd like your order delivered</p>

                            {/* Error state */}
                            {apiError && (
                                <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl mb-4">
                                    <FaExclamationTriangle className="text-red-500 flex-shrink-0 mt-0.5" />
                                    <p className="text-sm text-red-700">{apiError}</p>
                                </div>
                            )}

                            {/* Loading state */}
                            {loadingOptions && (
                                <div className="flex flex-col items-center justify-center py-12">
                                    <div className="animate-spin w-8 h-8 border-4 border-gray-200 border-t-black rounded-full mb-3" />
                                    <p className="text-sm text-gray-500">Checking delivery options for your pincode…</p>
                                </div>
                            )}

                            {/* Shipping options */}
                            {!loadingOptions && shippingOptions.length > 0 && (
                                <div className="space-y-4">
                                    {shippingOptions.map((option) => {
                                        const meta = METHOD_META[option.method] || { name: option.method, icon: FaTruck };
                                        const Icon = meta.icon;
                                        const isSelected = selectedShipping === option.method;
                                        const isFree = option.is_free;
                                        const cost = isFree ? 0 : option.cost;

                                        return (
                                            <button
                                                key={option.method}
                                                type="button"
                                                onClick={() => setSelectedShipping(option.method)}
                                                className={`relative w-full text-left flex items-start gap-4 p-5 rounded-xl border-2 transition-all duration-200 ${isSelected
                                                        ? 'border-black bg-gray-50 ring-1 ring-black/5'
                                                        : 'border-gray-200 hover:border-gray-400'
                                                    }`}
                                            >
                                                {/* Icon */}
                                                <div
                                                    className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${isSelected ? 'bg-black text-white' : 'bg-gray-100 text-gray-500'
                                                        } transition-colors`}
                                                >
                                                    <Icon className="text-lg" />
                                                </div>

                                                {/* Info */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-bold text-gray-900">{meta.name}</span>
                                                        {isFree && (
                                                            <span className="text-[10px] font-bold uppercase tracking-wider bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                                                                FREE
                                                            </span>
                                                        )}
                                                        {option.cod_available && (
                                                            <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full">
                                                                COD
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-gray-500 mt-0.5">
                                                        Delivered in {option.eta_min_days}–{option.eta_max_days} business days
                                                    </p>
                                                    {option.free_above && !isFree && (
                                                        <p className="text-xs text-gray-400 mt-1">
                                                            Free on orders above ₹{option.free_above}
                                                        </p>
                                                    )}
                                                </div>

                                                {/* Price */}
                                                <div className="flex flex-col items-end flex-shrink-0">
                                                    {isFree ? (
                                                        <>
                                                            <span className="text-sm text-gray-400 line-through">₹{option.cost}</span>
                                                            <span className="font-bold text-green-600">₹0</span>
                                                        </>
                                                    ) : (
                                                        <span className="font-bold text-gray-900">₹{cost}</span>
                                                    )}
                                                </div>

                                                {/* Selected check */}
                                                {isSelected && (
                                                    <span className="absolute top-3 right-3 text-black">
                                                        <FaCheckCircle />
                                                    </span>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}

                            {/* No options state */}
                            {!loadingOptions && shippingOptions.length === 0 && !apiError && (
                                <p className="text-sm text-gray-500 text-center py-8">
                                    No shipping options available for your location.
                                </p>
                            )}

                            {/* Trust note */}
                            <div className="mt-6 flex items-center gap-2 text-xs text-gray-500 bg-gray-50 rounded-xl p-4">
                                <FaShieldAlt className="text-gray-400 flex-shrink-0" />
                                <span>All shipments are insured and include real-time tracking updates via SMS & email.</span>
                            </div>
                        </div>
                        {/* ── Actions inside main column ── */}
                        <div className="flex items-center justify-between mt-6">
                            <button
                                onClick={() => navigate('/checkout/address', { state: { shippingAddress: shippingAddressId } })}
                                className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-black transition"
                            >
                                <FaArrowLeft className="text-xs" /> Back to Address
                            </button>
                            <button
                                onClick={handleContinue}
                                disabled={loadingOptions || shippingOptions.length === 0}
                                className="flex items-center gap-2 px-8 py-3.5 bg-black text-white rounded-xl font-bold text-sm hover:bg-gray-900 transition shadow-lg shadow-black/10 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Continue to Payment <FaArrowRight className="text-xs" />
                            </button>
                        </div>
                    </div>

                    {/* ── Sidebar ── */}
                    <div className="lg:col-span-1">
                        <OrderSummarySidebar cartItems={cartItems} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CheckoutShipping;
