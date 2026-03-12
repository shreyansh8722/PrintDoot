import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
    FaCheckCircle,
    FaShoppingBag,
    FaMapMarkerAlt,
    FaCreditCard,
    FaTruck,
    FaBoxOpen,
    FaEnvelope,
    FaPrint,
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
    const invoiceRef = useRef(null);

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

    const handlePrintInvoice = () => {
        const printContent = invoiceRef.current;
        if (!printContent) return;

        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
            <head>
                <title>Invoice - Order #${order?.id || ''}</title>
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; color: #1a1a1a; }
                    .inv-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; padding-bottom: 24px; border-bottom: 2px solid #e5e7eb; }
                    .inv-title { font-size: 28px; font-weight: 800; }
                    .inv-sub { font-size: 12px; color: #6b7280; margin-top: 4px; }
                    .inv-meta { text-align: right; }
                    .inv-meta p { font-size: 13px; color: #6b7280; margin-bottom: 4px; }
                    .inv-meta strong { color: #1a1a1a; }
                    .inv-section { margin-bottom: 24px; }
                    .inv-label { font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #6b7280; margin-bottom: 8px; }
                    table { width: 100%; border-collapse: collapse; margin-top: 8px; }
                    th { text-align: left; padding: 10px 12px; background: #f9fafb; border-bottom: 2px solid #e5e7eb; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: #6b7280; font-weight: 700; }
                    td { padding: 12px; border-bottom: 1px solid #f3f4f6; font-size: 14px; }
                    th:last-child, td:last-child { text-align: right; }
                    .inv-totals { margin-top: 16px; margin-left: auto; width: 280px; }
                    .inv-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 14px; }
                    .inv-total { border-top: 2px solid #1a1a1a; padding-top: 12px; margin-top: 8px; font-size: 18px; font-weight: 800; }
                    .inv-footer { margin-top: 48px; padding-top: 24px; border-top: 1px solid #e5e7eb; text-align: center; font-size: 12px; color: #9ca3af; }
                </style>
            </head>
            <body>
                ${printContent.innerHTML}
            </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 250);
    };

    if (loading) {
        return (
            <div className="bg-white min-h-screen flex items-center justify-center">
                <div className="animate-spin w-10 h-10 border-4 border-gray-200 border-t-black rounded-full" />
            </div>
        );
    }

    return (
        <div className="bg-white min-h-screen py-8 sm:py-12">
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
                                        className={`inline-block mt-1 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full ${STATUS_COLORS[order.status?.toLowerCase()] || 'bg-gray-100 text-gray-700'
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
                                            <p className="font-bold text-gray-900">{addr.recipient_name}</p>
                                            <p>{addr.street}</p>
                                            <p>{addr.city}, {addr.state} {addr.zip_code}</p>
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

                {/* ── Hidden printable invoice (offscreen) ── */}
                {order && (
                    <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
                        <div ref={invoiceRef}>
                            <div className="inv-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32, paddingBottom: 24, borderBottom: '2px solid #e5e7eb' }}>
                                <div>
                                    <div style={{ fontSize: 28, fontWeight: 800 }}>INVOICE</div>
                                    <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>PrintDoot</div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 4 }}>
                                        <strong style={{ color: '#1a1a1a' }}>Order #</strong> {order.id}
                                    </p>
                                    <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 4 }}>
                                        <strong style={{ color: '#1a1a1a' }}>Date:</strong>{' '}
                                        {new Date(order.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
                                    </p>
                                    <p style={{ fontSize: 13, color: '#6b7280' }}>
                                        <strong style={{ color: '#1a1a1a' }}>Status:</strong> {order.status}
                                    </p>
                                </div>
                            </div>

                            {(() => {
                                const addr = order.shipping_address_details || order.shipping_address_detail;
                                if (!addr) return null;
                                return (
                                    <div style={{ marginBottom: 24 }}>
                                        <div style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#6b7280', marginBottom: 8 }}>
                                            Ship To
                                        </div>
                                        <p style={{ fontSize: 15, fontWeight: 700 }}>{addr.recipient_name}</p>
                                        <p style={{ fontSize: 14, lineHeight: 1.6 }}>{addr.street}</p>
                                        <p style={{ fontSize: 14, lineHeight: 1.6 }}>{addr.city}, {addr.state} {addr.zip_code}</p>
                                        <p style={{ fontSize: 14, lineHeight: 1.6 }}>{addr.country}</p>
                                    </div>
                                );
                            })()}

                            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 8 }}>
                                <thead>
                                    <tr>
                                        <th style={{ textAlign: 'left', padding: '10px 12px', background: '#f9fafb', borderBottom: '2px solid #e5e7eb', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5, color: '#6b7280', fontWeight: 700 }}>Item</th>
                                        <th style={{ textAlign: 'left', padding: '10px 12px', background: '#f9fafb', borderBottom: '2px solid #e5e7eb', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5, color: '#6b7280', fontWeight: 700 }}>Qty</th>
                                        <th style={{ textAlign: 'right', padding: '10px 12px', background: '#f9fafb', borderBottom: '2px solid #e5e7eb', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5, color: '#6b7280', fontWeight: 700 }}>Price</th>
                                        <th style={{ textAlign: 'right', padding: '10px 12px', background: '#f9fafb', borderBottom: '2px solid #e5e7eb', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5, color: '#6b7280', fontWeight: 700 }}>Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {order.items?.map((item, idx) => (
                                        <tr key={idx}>
                                            <td style={{ padding: 12, borderBottom: '1px solid #f3f4f6', fontSize: 14 }}>
                                                {item.product_name_snapshot || `Product #${item.product}`}
                                            </td>
                                            <td style={{ padding: 12, borderBottom: '1px solid #f3f4f6', fontSize: 14 }}>
                                                {item.quantity}
                                            </td>
                                            <td style={{ padding: 12, borderBottom: '1px solid #f3f4f6', fontSize: 14, textAlign: 'right' }}>
                                                ₹{parseFloat(item.unit_price).toFixed(2)}
                                            </td>
                                            <td style={{ padding: 12, borderBottom: '1px solid #f3f4f6', fontSize: 14, textAlign: 'right' }}>
                                                ₹{parseFloat(item.total_price || item.unit_price * item.quantity).toFixed(2)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            <div style={{ marginTop: 16, marginLeft: 'auto', width: 280 }}>
                                {order.subtotal != null && (
                                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 14 }}>
                                        <span>Subtotal</span><span>₹{parseFloat(order.subtotal).toFixed(2)}</span>
                                    </div>
                                )}
                                {order.tax_total != null && (
                                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 14 }}>
                                        <span>Taxes (GST)</span><span>₹{parseFloat(order.tax_total).toFixed(2)}</span>
                                    </div>
                                )}
                                {order.shipping_total != null && (
                                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 14 }}>
                                        <span>Shipping</span>
                                        <span>{parseFloat(order.shipping_total) === 0 ? 'FREE' : `₹${parseFloat(order.shipping_total).toFixed(2)}`}</span>
                                    </div>
                                )}
                                {order.discount_total != null && parseFloat(order.discount_total) > 0 && (
                                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 14 }}>
                                        <span>Discount</span><span>−₹{parseFloat(order.discount_total).toFixed(2)}</span>
                                    </div>
                                )}
                                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid #1a1a1a', paddingTop: 12, marginTop: 8, fontSize: 18, fontWeight: 800 }}>
                                    <span>Total</span><span>₹{parseFloat(order.total_amount).toFixed(2)}</span>
                                </div>
                            </div>

                            <div style={{ marginTop: 48, paddingTop: 24, borderTop: '1px solid #e5e7eb', textAlign: 'center', fontSize: 12, color: '#9ca3af' }}>
                                <p>Thank you for your order!</p>
                                <p style={{ marginTop: 4 }}>Payment: {order.payment_method?.replace(/_/g, ' ')?.toUpperCase() || 'N/A'}</p>
                            </div>
                        </div>
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
                    {order && (
                        <button
                            onClick={handlePrintInvoice}
                            className="flex items-center gap-2 px-6 py-3 bg-black text-white rounded-xl font-bold text-sm hover:bg-gray-900 transition shadow-lg shadow-black/10"
                        >
                            <FaPrint className="text-xs" /> Print Invoice
                        </button>
                    )}
                    {orderId && (
                        <Link
                            to={`/account/orders/${orderId}`}
                            className="px-6 py-3 border-2 border-gray-900 text-gray-900 rounded-xl font-bold text-sm hover:bg-gray-900 hover:text-white transition"
                        >
                            View Order Details
                        </Link>
                    )}
                    <Link
                        to="/account/orders"
                        className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold text-sm hover:border-black hover:text-black transition"
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
