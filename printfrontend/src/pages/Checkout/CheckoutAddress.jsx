import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useShop } from '../../context/ShopContext';
import userService from '../../services/userService';
import CheckoutSteps, { OrderSummarySidebar } from './CheckoutSteps';
import { FaPlus, FaMapMarkerAlt, FaPhone, FaCheckCircle, FaArrowLeft, FaArrowRight } from 'react-icons/fa';

const CheckoutAddress = () => {
    const navigate = useNavigate();
    const { cartItems } = useShop();
    const [addresses, setAddresses] = useState([]);
    const [selectedAddress, setSelectedAddress] = useState(null);
    const [showNewAddress, setShowNewAddress] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [loadingAddresses, setLoadingAddresses] = useState(true);

    const [newAddress, setNewAddress] = useState({
        type: 'shipping',
        recipient_name: '',
        phone_number: '',
        street: '',
        apartment_suite: '',
        city: '',
        state: '',
        zip_code: '',
        country: 'India',
        company_name: '',
        is_default: false,
    });

    useEffect(() => {
        loadAddresses();
    }, []);

    const loadAddresses = async () => {
        try {
            setLoadingAddresses(true);
            const data = await userService.getAddresses();
            setAddresses(data);
            const defaultShipping = data.find((addr) => addr.type === 'shipping' && addr.is_default);
            if (defaultShipping) setSelectedAddress(defaultShipping.id);
        } catch (err) {
            console.error('Error loading addresses:', err);
        } finally {
            setLoadingAddresses(false);
        }
    };

    const handleNewAddressChange = (e) => {
        const { name, value, type, checked } = e.target;
        setNewAddress((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleSaveNewAddress = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            const saved = await userService.createAddress(newAddress);
            await loadAddresses();
            setSelectedAddress(saved.id);
            setShowNewAddress(false);
            setNewAddress({
                type: 'shipping',
                recipient_name: '',
                phone_number: '',
                street: '',
                apartment_suite: '',
                city: '',
                state: '',
                zip_code: '',
                country: 'India',
                company_name: '',
                is_default: false,
            });
        } catch (err) {
            const data = err.response?.data;
            let msg = 'Failed to save address';
            if (data) {
                if (typeof data === 'string') msg = data;
                else if (data.message) msg = data.message;
                else if (data.detail) msg = data.detail;
                else {
                    // DRF field errors: { field: ["error"] }
                    const firstField = Object.keys(data)[0];
                    if (firstField && Array.isArray(data[firstField])) {
                        msg = data[firstField][0];
                    }
                }
            }
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    const handleContinue = () => {
        if (!selectedAddress) {
            setError('Please select or create a shipping address');
            return;
        }
        navigate('/checkout/shipping', { state: { shippingAddress: selectedAddress } });
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
                {/* Header */}
                <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Checkout</h1>
                <CheckoutSteps currentStep="address" />

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* ── Main Column ── */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
                            <h2 className="text-xl font-bold text-gray-900 mb-1">Shipping Address</h2>
                            <p className="text-sm text-gray-500 mb-6">Select where you'd like your order delivered</p>

                            {error && (
                                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
                                    {error}
                                </div>
                            )}

                            {loadingAddresses ? (
                                <div className="flex items-center justify-center py-16">
                                    <div className="animate-spin w-8 h-8 border-4 border-gray-200 border-t-black rounded-full" />
                                </div>
                            ) : (
                                <>
                                    {/* Saved addresses */}
                                    {addresses.filter((a) => a.type === 'shipping').length > 0 && (
                                        <div className="grid gap-4 sm:grid-cols-2 mb-6">
                                            {addresses
                                                .filter((addr) => addr.type === 'shipping')
                                                .map((address) => {
                                                    const isSelected = selectedAddress === address.id;
                                                    return (
                                                        <button
                                                            key={address.id}
                                                            type="button"
                                                            onClick={() => {
                                                                setSelectedAddress(address.id);
                                                                setError('');
                                                            }}
                                                            className={`relative text-left w-full p-5 rounded-xl border-2 transition-all duration-200 ${isSelected
                                                                    ? 'border-black bg-gray-50 ring-1 ring-black/5'
                                                                    : 'border-gray-200 hover:border-gray-400'
                                                                }`}
                                                        >
                                                            {/* Selected indicator */}
                                                            {isSelected && (
                                                                <span className="absolute top-3 right-3 text-black">
                                                                    <FaCheckCircle />
                                                                </span>
                                                            )}
                                                            <p className="font-bold text-gray-900 pr-6">{address.recipient_name}</p>
                                                            <p className="text-sm text-gray-600 mt-1">
                                                                <FaMapMarkerAlt className="inline mr-1 text-gray-400" />
                                                                {address.street}
                                                                {address.apartment_suite ? `, ${address.apartment_suite}` : ''}
                                                            </p>
                                                            <p className="text-sm text-gray-600">
                                                                {address.city}, {address.state} {address.zip_code}
                                                            </p>
                                                            <p className="text-sm text-gray-500">{address.country}</p>
                                                            <p className="text-sm text-gray-500 mt-1">
                                                                <FaPhone className="inline mr-1 text-gray-400 text-xs" />
                                                                {address.phone_number}
                                                            </p>
                                                            {address.is_default && (
                                                                <span className="inline-block mt-2 text-[10px] font-bold uppercase tracking-wider bg-black text-white px-2 py-0.5 rounded-full">
                                                                    Default
                                                                </span>
                                                            )}
                                                        </button>
                                                    );
                                                })}
                                        </div>
                                    )}

                                    {/* Add new address */}
                                    {!showNewAddress ? (
                                        <button
                                            type="button"
                                            onClick={() => setShowNewAddress(true)}
                                            className="w-full sm:w-auto flex items-center gap-2 px-5 py-3 border-2 border-dashed border-gray-300 rounded-xl text-sm font-semibold text-gray-600 hover:border-black hover:text-black transition"
                                        >
                                            <FaPlus className="text-xs" /> Add New Address
                                        </button>
                                    ) : (
                                        <form onSubmit={handleSaveNewAddress} className="border border-gray-200 rounded-xl p-6 space-y-4">
                                            <h3 className="text-lg font-bold text-gray-900">New Shipping Address</h3>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Recipient Name <span className="text-red-500">*</span>
                                                    </label>
                                                    <input
                                                        type="text"
                                                        name="recipient_name"
                                                        value={newAddress.recipient_name}
                                                        onChange={handleNewAddressChange}
                                                        required
                                                        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black transition"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Phone Number <span className="text-red-500">*</span>
                                                    </label>
                                                    <input
                                                        type="tel"
                                                        name="phone_number"
                                                        value={newAddress.phone_number}
                                                        onChange={handleNewAddressChange}
                                                        required
                                                        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black transition"
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Street Address <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    name="street"
                                                    value={newAddress.street}
                                                    onChange={handleNewAddressChange}
                                                    required
                                                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black transition"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Apartment, Suite, etc.
                                                </label>
                                                <input
                                                    type="text"
                                                    name="apartment_suite"
                                                    value={newAddress.apartment_suite}
                                                    onChange={handleNewAddressChange}
                                                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black transition"
                                                />
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        City <span className="text-red-500">*</span>
                                                    </label>
                                                    <input
                                                        type="text"
                                                        name="city"
                                                        value={newAddress.city}
                                                        onChange={handleNewAddressChange}
                                                        required
                                                        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black transition"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        State <span className="text-red-500">*</span>
                                                    </label>
                                                    <input
                                                        type="text"
                                                        name="state"
                                                        value={newAddress.state}
                                                        onChange={handleNewAddressChange}
                                                        required
                                                        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black transition"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        ZIP Code <span className="text-red-500">*</span>
                                                    </label>
                                                    <input
                                                        type="text"
                                                        name="zip_code"
                                                        value={newAddress.zip_code}
                                                        onChange={handleNewAddressChange}
                                                        required
                                                        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black transition"
                                                    />
                                                </div>
                                            </div>

                                            <div className="sm:w-1/2">
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Country <span className="text-red-500">*</span>
                                                </label>
                                                <select
                                                    name="country"
                                                    value={newAddress.country}
                                                    onChange={handleNewAddressChange}
                                                    required
                                                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black transition bg-white"
                                                >
                                                    <option value="India">India</option>
                                                    <option value="United States">United States</option>
                                                    <option value="United Kingdom">United Kingdom</option>
                                                </select>
                                            </div>

                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    name="is_default"
                                                    checked={newAddress.is_default}
                                                    onChange={handleNewAddressChange}
                                                    className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black"
                                                />
                                                <span className="text-sm text-gray-700">Set as default address</span>
                                            </label>

                                            <div className="flex gap-3 pt-2">
                                                <button
                                                    type="button"
                                                    onClick={() => setShowNewAddress(false)}
                                                    className="px-5 py-2.5 border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    type="submit"
                                                    disabled={loading}
                                                    className="px-5 py-2.5 bg-black text-white rounded-xl text-sm font-semibold hover:bg-gray-900 transition disabled:opacity-50"
                                                >
                                                    {loading ? 'Saving…' : 'Save Address'}
                                                </button>
                                            </div>
                                        </form>
                                    )}
                                </>
                            )}
                        </div>
                        {/* ── Actions inside main column ── */}
                        <div className="flex items-center justify-between mt-6">
                            <button
                                onClick={() => navigate('/cart')}
                                className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-black transition"
                            >
                                <FaArrowLeft className="text-xs" /> Back to Cart
                            </button>
                            <button
                                onClick={handleContinue}
                                className="flex items-center gap-2 px-8 py-3.5 bg-black text-white rounded-xl font-bold text-sm hover:bg-gray-900 transition shadow-lg shadow-black/10"
                            >
                                Continue to Shipping <FaArrowRight className="text-xs" />
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

export default CheckoutAddress;
