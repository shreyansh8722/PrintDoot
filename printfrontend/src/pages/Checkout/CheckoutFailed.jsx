import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaExclamationCircle, FaArrowLeft, FaRedo, FaHeadset, FaShoppingCart } from 'react-icons/fa';

const CheckoutFailed = () => {
    const location = useLocation();
    const errorMessage = location.state?.error || 'Your payment could not be processed.';
    const errorCode = location.state?.errorCode;
    const orderId = location.state?.orderId;

    return (
        <div className="bg-gray-50 min-h-screen py-8 sm:py-12">
            <div className="max-w-xl mx-auto px-4">
                {/* ── Hero banner ── */}
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-100 text-red-500 text-4xl mb-5">
                        <FaExclamationCircle />
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-2">
                        Payment Failed
                    </h1>
                    <p className="text-gray-500 max-w-md mx-auto">
                        We're sorry, but something went wrong with your payment.
                    </p>
                </div>

                {/* ── Error details ── */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
                    <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
                        <FaExclamationCircle className="text-red-500 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm font-semibold text-red-800">{errorMessage}</p>
                            {errorCode && (
                                <p className="text-xs text-red-500 mt-1">Error code: {errorCode}</p>
                            )}
                            {orderId && (
                                <p className="text-xs text-red-500 mt-1">Order ID: #{orderId}</p>
                            )}
                        </div>
                    </div>

                    <div className="mt-6 space-y-3">
                        <Link
                            to="/checkout/payment"
                            className="w-full flex items-center justify-center gap-2 py-3.5 bg-black text-white rounded-xl font-bold text-sm hover:bg-gray-900 transition shadow-lg shadow-black/10"
                        >
                            <FaRedo className="text-xs" /> Try Again
                        </Link>
                        <Link
                            to="/cart"
                            className="w-full flex items-center justify-center gap-2 py-3.5 bg-white text-gray-900 border-2 border-gray-200 rounded-xl font-bold text-sm hover:border-gray-400 transition"
                        >
                            <FaShoppingCart className="text-xs" /> Back to Cart
                        </Link>
                    </div>
                </div>

                {/* ── Help section ── */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center">
                    <FaHeadset className="text-2xl text-gray-400 mx-auto mb-3" />
                    <p className="text-sm text-gray-500 mb-2">
                        If you continue to experience issues, our support team is here to help.
                    </p>
                    <Link
                        to="/contact"
                        className="text-sm font-semibold text-black underline underline-offset-2 hover:text-gray-700 transition"
                    >
                        Contact Support
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default CheckoutFailed;
