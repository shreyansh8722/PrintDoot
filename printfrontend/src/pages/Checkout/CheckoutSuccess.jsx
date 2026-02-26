import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
    FaCheckCircle,
    FaShoppingBag,
    FaMapMarkerAlt,
    FaCreditCard,
    FaTruck,
    FaBoxOpen,
    FaEnvelope,
} from 'react-icons/fa';
import orderService from '../../services/orderService';

const STATUS_COLORS = {
    pending: 'bg-yellow-100 text-yellow-800',
    processing: 'bg-blue-100 text-blue-800',
    shipped: 'bg-purple-100 text-purple-800',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
};

const CheckoutSuccess = () => {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (orderId) loadOrder();
    }, [orderId]);

    const loadOrder = async () => {
        try {
            const data = await orderService.getOrder(orderId);
            setOrder(data);
        } catch (err) {
            console.error('Error loading order:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="bg-gray-50 min-h-screen flex items-center justify-center">
                <div className="animate-spin w-10 h-10 border-4 border-gray-200 border-t-black rounded-full" />
            </div>
        );
    }

    return (
        <div className="bg-gray-50 min-h-screen py-8 sm:py-12">
            <div className="max-w-3xl mx-auto px-4">
                {/* ── Hero banner ── */}
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 text-green-600 text-4xl mb-5">
                        <FaCheckCircle />
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-2">
                        Order Placed Successfully!
                    </h1>
                    <p className="text-gray-500 max-w-md mx-auto">
                        Thank you for your order. We've received it and will begin processing right away.
                    </p>
                </div>

                {order && (
                    <div className="space-y-6">
                        {/* ── Order meta ── */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <div className="flex flex-wrap gap-y-4 gap-x-8">
                                <div>
                                    <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">
                                        Order Number
                                    </p>
                                    <p className="text-lg font-bold text-gray-900 mt-0.5">#{order.id}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Date</p>
                                    <p className="text-lg font-bold text-gray-900 mt-0.5">
                                        {new Date(order.created_at).toLocaleDateString('en-IN', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                        })}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Total</p>
                                    <p className="text-lg font-bold text-gray-900 mt-0.5">
                                        ₹{parseFloat(order.total_amount).toFixed(2)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">
                                        Status
                                    </p>
                                    <span
                                        className={`inline-block mt-1 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full ${
                                            STATUS_COLORS[order.status?.toLowerCase()] || 'bg-gray-100 text-gray-700'
                                        }`}
                                    >
                                        {order.status}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* ── Order Items ── */}
                        {order.items && order.items.length > 0 && (
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <FaBoxOpen className="text-gray-500" />
                                    <h2 className="text-lg font-bold text-gray-900">Items Ordered</h2>
                                </div>
                                <div className="divide-y divide-gray-100">
                                    {order.items.map((item, idx) => (
                                        <div key={idx} className="flex gap-4 py-4 first:pt-0 last:pb-0">
                                            <div className="w-14 h-14 bg-gray-50 rounded-lg overflow-hidden flex-shrink-0 border border-gray-100">
                                                <img
                                                    src={item.product_image || 'https://placehold.co/56x56'}
                                                    alt={item.product_name_snapshot || 'Product'}
                                                    className="w-full h-full object-contain p-1"
                                                />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold text-gray-900 truncate">
                                                    {item.product_name_snapshot || `Product #${item.product}`}
                                                </p>
                                                <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                                            </div>
                                            <span className="text-sm font-bold text-gray-900 flex-shrink-0">
                                                ₹{parseFloat(item.total_price || item.unit_price * item.quantity).toFixed(2)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* ── Pricing breakdown ── */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <h2 className="text-lg font-bold text-gray-900 mb-4">Price Summary</h2>
                            <div className="space-y-2 text-sm">
                                {order.subtotal != null && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Subtotal</span>
                                        <span className="font-medium">₹{parseFloat(order.subtotal).toFixed(2)}</span>
                                    </div>
                                )}
                                {order.tax_total != null && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Taxes</span>
                                        <span className="font-medium">₹{parseFloat(order.tax_total).toFixed(2)}</span>
                                    </div>
                                )}
                                {order.shipping_total != null && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Shipping</span>
                                        <span className={`font-medium ${parseFloat(order.shipping_total) === 0 ? 'text-green-600' : ''}`}>
                                            {parseFloat(order.shipping_total) === 0
                                                ? 'FREE'
                                                : `₹${parseFloat(order.shipping_total).toFixed(2)}`}
                                        </span>
                                    </div>
                                )}
                                {order.discount_total != null && parseFloat(order.discount_total) > 0 && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Discount</span>
                                        <span className="font-medium text-green-600">
                                            −₹{parseFloat(order.discount_total).toFixed(2)}
                                        </span>
                                    </div>
                                )}
                            </div>
                            <div className="border-t-2 border-gray-100 mt-3 pt-3">
                                <div className="flex justify-between items-baseline">
                                    <span className="font-bold text-gray-900">Total</span>
                                    <span className="text-xl font-extrabold text-gray-900">
                                        ₹{parseFloat(order.total_amount).toFixed(2)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* ── Shipping Address ── */}
                        {(order.shipping_address_details || order.shipping_address_detail) && (
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                                <div className="flex items-center gap-2 mb-3">
                                    <FaMapMarkerAlt className="text-gray-500" />
                                    <h2 className="text-lg font-bold text-gray-900">Delivery Address</h2>
                                </div>
                                {(() => {
                                    const addr = order.shipping_address_details || order.shipping_address_detail;
                                    return (
                                        <div className="text-sm text-gray-700 leading-relaxed">
                                            <p className="font-bold text-gray-900">
                                                {addr.recipient_name}
                                            </p>
                                            <p>{addr.street}</p>
                                            <p>
                                                {addr.city}, {addr.state}{' '}
                                                {addr.zip_code}
                                            </p>
                                            <p>{addr.country}</p>
                                        </div>
                                    );
                                })()}
                            </div>
                        )}

                        {/* ── Payment ── */}
                        {order.payment_method && (
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                                <div className="flex items-center gap-2 mb-3">
                                    <FaCreditCard className="text-gray-500" />
                                    <h2 className="text-lg font-bold text-gray-900">Payment</h2>
                                </div>
                                <p className="text-sm text-gray-700 capitalize">{order.payment_method.replace(/_/g, ' ')}</p>
                            </div>
                        )}
                    </div>
                )}

                {/* ── Info banner ── */}
                <div className="mt-8 flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-xl p-5">
                    <FaEnvelope className="text-blue-500 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-blue-800 leading-relaxed">
                        <p className="font-semibold">A confirmation email has been sent to your registered email.</p>
                        <p className="mt-1">You can track your order status from your account dashboard at any time.</p>
                    </div>
                </div>

                {/* ── Action buttons ── */}
                <div className="flex flex-wrap items-center justify-center gap-4 mt-8 mb-4">
                    {orderId && (
                        <Link
                            to={`/account/orders/${orderId}`}
                            className="px-6 py-3 bg-black text-white rounded-xl font-bold text-sm hover:bg-gray-900 transition shadow-lg shadow-black/10"
                        >
                            View Order Details
                        </Link>
                    )}
                    <Link
                        to="/account/orders"
                        className="px-6 py-3 border-2 border-gray-900 text-gray-900 rounded-xl font-bold text-sm hover:bg-gray-900 hover:text-white transition"
                    >
                        My Orders
                    </Link>
                    <Link
                        to="/view-all"
                        className="flex items-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold text-sm hover:border-black hover:text-black transition"
                    >
                        <FaShoppingBag className="text-xs" /> Continue Shopping
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default CheckoutSuccess;
