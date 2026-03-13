import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
    FaTruck, FaMapMarkerAlt, FaCreditCard, FaDownload, FaPrint, FaArrowLeft,
    FaFileInvoice, FaUndo, FaCheckCircle, FaClock, FaTimesCircle, FaBoxOpen,
    FaHistory, FaMoneyBillWave, FaExclamationTriangle, FaSyncAlt, FaShippingFast
} from 'react-icons/fa';
import orderService from '../../services/orderService';
import './Account.css';
import './Orders.css';

const STATUS_FLOW = ['Pending', 'Paid', 'Processing', 'Printing', 'Shipped', 'Delivered'];

const STATUS_CONFIG = {
    Pending:    { color: '#f59e0b', bg: '#fffbeb', icon: FaClock,           label: 'Order Placed' },
    Paid:       { color: '#10b981', bg: '#ecfdf5', icon: FaMoneyBillWave,   label: 'Payment Confirmed' },
    Processing: { color: '#00DCE5', bg: '#eff6ff', icon: FaBoxOpen,         label: 'Processing' },
    Printing:   { color: '#8b5cf6', bg: '#f5f3ff', icon: FaPrint,           label: 'Printing' },
    Shipped:    { color: '#00DCE5', bg: '#ecfeff', icon: FaTruck,           label: 'Shipped' },
    Delivered:  { color: '#059669', bg: '#d1fae5', icon: FaCheckCircle,     label: 'Delivered' },
    Cancelled:  { color: '#ef4444', bg: '#fef2f2', icon: FaTimesCircle,     label: 'Cancelled' },
    Refunded:   { color: '#6b7280', bg: '#f3f4f6', icon: FaUndo,           label: 'Refunded' },
};

const OrderDetail = () => {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showReturnModal, setShowReturnModal] = useState(false);
    const [returnForm, setReturnForm] = useState({ reason: '', description: '', items: [] });
    const [returnLoading, setReturnLoading] = useState(false);
    const [returnError, setReturnError] = useState('');
    const [returnSuccess, setReturnSuccess] = useState('');
    const [invoiceLoading, setInvoiceLoading] = useState(false);

    // Tracking state
    const [trackingData, setTrackingData] = useState(null);
    const [trackingLoading, setTrackingLoading] = useState(false);
    const [trackingError, setTrackingError] = useState('');
    const [showTracking, setShowTracking] = useState(false);

    useEffect(() => {
        if (orderId) loadOrder();
    }, [orderId]);

    const loadOrder = async () => {
        try {
            setLoading(true);
            const orderData = await orderService.getOrder(orderId);
            setOrder(orderData);
        } catch (err) {
            console.error('Error loading order:', err);
            setError('Failed to load order details');
        } finally {
            setLoading(false);
        }
    };

    const loadTracking = async (refresh = false) => {
        try {
            setTrackingLoading(true);
            setTrackingError('');
            const data = await orderService.getTracking(orderId, refresh);
            setTrackingData(data);
            setShowTracking(true);
        } catch (err) {
            console.error('Error loading tracking:', err);
            if (err.response?.status === 404) {
                setTrackingError('Shipment tracking not available yet.');
            } else {
                setTrackingError('Failed to load tracking information.');
            }
        } finally {
            setTrackingLoading(false);
        }
    };

    const handleDownloadInvoice = async () => {
        try {
            setInvoiceLoading(true);
            await orderService.downloadInvoice(orderId);
        } catch (err) {
            alert('Invoice not available yet. Order must be paid first.');
        } finally {
            setInvoiceLoading(false);
        }
    };

    const handleSubmitReturn = async (e) => {
        e.preventDefault();
        if (!returnForm.reason) {
            setReturnError('Please select a reason for return.');
            return;
        }
        try {
            setReturnLoading(true);
            setReturnError('');
            await orderService.createReturn({
                order: order.id,
                reason: returnForm.reason,
                description: returnForm.description,
                items: returnForm.items,
            });
            setReturnSuccess('Return request submitted successfully!');
            setShowReturnModal(false);
            setReturnForm({ reason: '', description: '', items: [] });
            loadOrder();
        } catch (err) {
            setReturnError(err.message || 'Failed to submit return request.');
        } finally {
            setReturnLoading(false);
        }
    };

    const handleCancelReturn = async (returnId) => {
        if (!window.confirm('Are you sure you want to cancel this return request?')) return;
        try {
            await orderService.cancelReturn(returnId);
            loadOrder();
        } catch (err) {
            alert(err.message || 'Failed to cancel return request.');
        }
    };

    const toggleReturnItem = (itemId) => {
        setReturnForm(prev => ({
            ...prev,
            items: prev.items.includes(itemId) 
                ? prev.items.filter(id => id !== itemId) 
                : [...prev.items, itemId]
        }));
    };

    const getCurrentStepIndex = (status) => {
        if (['Cancelled', 'Refunded'].includes(status)) return -1;
        return STATUS_FLOW.indexOf(status);
    };

    const renderStatusTimeline = () => {
        const currentIdx = getCurrentStepIndex(order.status);
        const isCancelled = order.status === 'Cancelled';
        const isRefunded = order.status === 'Refunded';

        return (
            <div className="od-timeline">
                {STATUS_FLOW.map((step, idx) => {
                    const config = STATUS_CONFIG[step];
                    const Icon = config.icon;
                    const isCompleted = idx <= currentIdx;
                    const isCurrent = idx === currentIdx;
                    return (
                        <div key={step} className={`od-timeline-step ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''}`}>
                            {idx > 0 && (
                                <div className="od-timeline-connector">
                                    <div className={`od-connector-line ${isCompleted ? 'active' : ''}`}></div>
                                </div>
                            )}
                            <div className="od-timeline-marker" style={{ 
                                backgroundColor: isCompleted ? config.color : '#e5e7eb',
                                color: isCompleted ? 'white' : '#9ca3af'
                            }}>
                                {isCompleted ? <FaCheckCircle size={14} /> : <Icon size={14} />}
                            </div>
                            <div className="od-timeline-label">
                                <span className={isCompleted ? 'font-semibold' : 'text-gray-400'}>{config.label}</span>
                            </div>
                        </div>
                    );
                })}
                {(isCancelled || isRefunded) && (
                    <div className="od-timeline-step current">
                        <div className="od-timeline-connector">
                            <div className="od-connector-line" style={{ backgroundColor: STATUS_CONFIG[order.status].color }}></div>
                        </div>
                        <div className="od-timeline-marker" style={{ backgroundColor: STATUS_CONFIG[order.status].color, color: 'white' }}>
                            {React.createElement(STATUS_CONFIG[order.status].icon, { size: 14 })}
                        </div>
                        <div className="od-timeline-label">
                            <span className="font-semibold">{STATUS_CONFIG[order.status].label}</span>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    if (loading) {
        return (
            <div className="account-page">
                <div className="account-container">
                    <div className="loading-spinner">Loading order details...</div>
                </div>
            </div>
        );
    }

    if (error || !order) {
        return (
            <div className="account-page">
                <div className="account-container">
                    <div className="alert alert-error">{error || 'Order not found'}</div>
                    <Link to="/account/orders" className="btn-primary">Back to Orders</Link>
                </div>
            </div>
        );
    }

    const statusConf = STATUS_CONFIG[order.status] || STATUS_CONFIG.Pending;
    const canReturn = order.status === 'Delivered' && !order.return_requests?.some(r => !['Cancelled', 'Rejected', 'Completed'].includes(r.status));
    const hasInvoice = order.invoice || order.is_paid || ['Paid', 'Processing', 'Printing', 'Shipped', 'Delivered', 'Refunded'].includes(order.status);

    const REASON_LABELS = {
        defective: 'Defective / Damaged',
        wrong_item: 'Wrong Item Received',
        not_as_described: 'Not As Described',
        quality: 'Quality Issue',
        changed_mind: 'Changed My Mind',
        other: 'Other',
    };

    const RETURN_REASONS = [
        { value: 'defective', label: 'Defective / Damaged Product' },
        { value: 'wrong_item', label: 'Wrong Item Received' },
        { value: 'not_as_described', label: 'Not As Described' },
        { value: 'quality', label: 'Quality Not Satisfactory' },
        { value: 'changed_mind', label: 'Changed My Mind' },
        { value: 'other', label: 'Other' },
    ];

    return (
        <div className="account-page">
            <div className="account-container">
                {/* Header */}
                <div className="od-header">
                    <button onClick={() => navigate('/account/orders')} className="od-back-btn">
                        <FaArrowLeft /> Back to Orders
                    </button>
                    <div className="od-header-main">
                        <div>
                            <h1>Order #{order.id}</h1>
                            <p className="od-date">
                                Placed on {new Date(order.created_at).toLocaleDateString('en-IN', {
                                    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                })}
                            </p>
                        </div>
                        <div className="od-status-badge" style={{ backgroundColor: statusConf.bg, color: statusConf.color, borderColor: statusConf.color }}>
                            {React.createElement(statusConf.icon, { size: 16 })}
                            {order.status}
                        </div>
                    </div>
                </div>

                {returnSuccess && (
                    <div className="od-alert od-alert-success"><FaCheckCircle /> {returnSuccess}</div>
                )}

                <div className="od-content">
                    {/* Status Timeline */}
                    <div className="od-section">
                        <h2>Order Progress</h2>
                        {renderStatusTimeline()}
                    </div>

                    {/* Order Items */}
                    <div className="od-section">
                        <h2>Order Items ({order.items?.length || 0})</h2>
                        <div className="od-items">
                            {order.items?.map((item) => (
                                <div key={item.id} className="od-item">
                                    <div className="od-item-image">
                                        <img src={item.product?.primary_image || 'https://placehold.co/100x100?text=Product'} alt={item.product_name_snapshot || 'Product'} />
                                    </div>
                                    <div className="od-item-info">
                                        <h3>{item.product_name_snapshot || item.product_name || 'Product'}</h3>
                                        <p className="od-item-sku">SKU: {item.sku_snapshot || 'N/A'}</p>
                                        <p>Qty: {item.quantity}</p>
                                        {item.frozen_canvas_state && <span className="od-customized-badge">✨ Customized</span>}
                                    </div>
                                    <div className="od-item-price">
                                        <div className="od-unit-price">₹{parseFloat(item.unit_price || 0).toFixed(2)} each</div>
                                        <div className="od-total-price">₹{parseFloat(item.total_price || 0).toFixed(2)}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Shipping Address */}
                    {(order.shipping_address_details || order.shipping_address_detail) && (() => {
                        const addr = order.shipping_address_details || order.shipping_address_detail;
                        return (
                            <div className="od-section">
                                <h2><FaMapMarkerAlt /> Shipping Address</h2>
                                <div className="od-address-card">
                                    <p><strong>{addr.recipient_name}</strong></p>
                                    {addr.company_name && <p>{addr.company_name}</p>}
                                    <p>{addr.street}</p>
                                    {addr.apartment_suite && <p>{addr.apartment_suite}</p>}
                                    <p>{addr.city}, {addr.state} {addr.zip_code}</p>
                                    <p>{addr.country}</p>
                                    <p>📞 {addr.phone_number}</p>
                                </div>
                            </div>
                        );
                    })()}

                    {/* Shipment Tracking */}
                    {order.shipment && (
                        <div className="od-section">
                            <h2><FaTruck /> Shipment Tracking</h2>
                            <div className="od-shipment-card">
                                <div className="od-info-grid">
                                    <div><label>Carrier</label><span>{order.shipment.courier_name || order.shipment.carrier}</span></div>
                                    <div><label>Tracking #</label><span className="od-mono">{order.shipment.tracking_number}</span></div>
                                    <div><label>AWB Code</label><span className="od-mono">{order.shipment.awb_code || 'N/A'}</span></div>
                                    <div><label>Status</label><span>{order.shipment.status}</span></div>
                                    {order.shipment.estimated_delivery && (
                                        <div><label>Est. Delivery</label><span>{new Date(order.shipment.estimated_delivery).toLocaleDateString('en-IN', { dateStyle: 'long' })}</span></div>
                                    )}
                                    {order.shipment.shipped_at && (
                                        <div><label>Shipped On</label><span>{new Date(order.shipment.shipped_at).toLocaleDateString('en-IN', { dateStyle: 'long' })}</span></div>
                                    )}
                                    {order.shipment.delivered_at && (
                                        <div><label>Delivered On</label><span>{new Date(order.shipment.delivered_at).toLocaleDateString('en-IN', { dateStyle: 'long' })}</span></div>
                                    )}
                                </div>

                                {/* Track Order Button */}
                                <div className="od-track-actions">
                                    <button
                                        onClick={() => showTracking ? setShowTracking(false) : loadTracking(false)}
                                        disabled={trackingLoading}
                                        className="od-btn od-btn-primary"
                                    >
                                        <FaShippingFast /> {trackingLoading ? 'Loading...' : showTracking ? 'Hide Tracking' : 'Track Order'}
                                    </button>
                                    {showTracking && (
                                        <button
                                            onClick={() => loadTracking(true)}
                                            disabled={trackingLoading}
                                            className="od-btn od-btn-secondary"
                                        >
                                            <FaSyncAlt className={trackingLoading ? 'od-spin' : ''} /> Refresh
                                        </button>
                                    )}
                                </div>

                                {trackingError && (
                                    <div className="od-alert od-alert-error" style={{ marginTop: '1rem' }}>
                                        <FaExclamationTriangle /> {trackingError}
                                    </div>
                                )}

                                {/* Live Tracking Events */}
                                {showTracking && trackingData && (
                                    <div className="od-tracking-events">
                                        <h3 className="od-tracking-events-title">Tracking Timeline</h3>
                                        {trackingData.tracking_events && trackingData.tracking_events.length > 0 ? (
                                            <div className="od-history-list">
                                                {trackingData.tracking_events
                                                    .sort((a, b) => new Date(b.event_time) - new Date(a.event_time))
                                                    .map((event, idx) => (
                                                    <div key={event.id || idx} className="od-history-item">
                                                        <div className="od-history-dot" style={{ 
                                                            backgroundColor: idx === 0 ? '#00DCE5' : '#d1d5db' 
                                                        }}></div>
                                                        <div className="od-history-content">
                                                            <div className="od-history-transition">
                                                                <span className="od-status-chip">{event.status}</span>
                                                            </div>
                                                            {event.description && <p className="od-history-note">{event.description}</p>}
                                                            {event.location && (
                                                                <p className="od-history-note">
                                                                    <FaMapMarkerAlt style={{ display: 'inline', marginRight: '4px', fontSize: '0.75rem' }} />
                                                                    {event.location}
                                                                </p>
                                                            )}
                                                            <span className="od-history-date">
                                                                {new Date(event.event_time).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="od-empty-tracking">No tracking events available yet. Try refreshing to get the latest updates.</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Payment Info */}
                    <div className="od-section">
                        <h2><FaCreditCard /> Payment</h2>
                        <div className="od-payment-card">
                            <div className="od-info-grid">
                                <div><label>Method</label><span>{order.payment_method || 'N/A'}</span></div>
                                <div><label>Status</label><span className={order.is_paid ? 'od-paid' : 'od-unpaid'}>{order.is_paid ? '✓ Paid' : '○ Unpaid'}</span></div>
                                {order.transaction_id && <div><label>Transaction</label><span className="od-mono">{order.transaction_id}</span></div>}
                            </div>
                        </div>
                    </div>

                    {/* Order Summary */}
                    <div className="od-section">
                        <h2>Order Summary</h2>
                        <div className="od-summary-card">
                            <div className="od-summary-row"><span>Subtotal</span><span>₹{parseFloat(order.subtotal || 0).toFixed(2)}</span></div>
                            {parseFloat(order.tax_total) > 0 && <div className="od-summary-row"><span>GST (18%)</span><span>₹{parseFloat(order.tax_total).toFixed(2)}</span></div>}
                            {parseFloat(order.shipping_total) > 0 && <div className="od-summary-row"><span>Shipping</span><span>₹{parseFloat(order.shipping_total).toFixed(2)}</span></div>}
                            {parseFloat(order.discount_total) > 0 && <div className="od-summary-row od-discount"><span>Discount</span><span>-₹{parseFloat(order.discount_total).toFixed(2)}</span></div>}
                            <div className="od-summary-row od-total"><span>Total</span><span>₹{parseFloat(order.total_amount).toFixed(2)}</span></div>
                        </div>
                    </div>

                    {/* Status History */}
                    {order.status_history?.length > 0 && (
                        <div className="od-section">
                            <h2><FaHistory /> Status History</h2>
                            <div className="od-history-list">
                                {order.status_history.map((entry) => (
                                    <div key={entry.id} className="od-history-item">
                                        <div className="od-history-dot"></div>
                                        <div className="od-history-content">
                                            <div className="od-history-transition">
                                                {entry.old_status ? (
                                                    <><span className="od-status-chip">{entry.old_status}</span> → <span className="od-status-chip">{entry.new_status}</span></>
                                                ) : (
                                                    <span className="od-status-chip">{entry.new_status}</span>
                                                )}
                                            </div>
                                            {entry.note && <p className="od-history-note">{entry.note}</p>}
                                            <span className="od-history-date">
                                                {new Date(entry.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                                                {entry.changed_by_username && ` by ${entry.changed_by_username}`}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Return Requests */}
                    {order.return_requests?.length > 0 && (
                        <div className="od-section">
                            <h2><FaUndo /> Return Requests</h2>
                            {order.return_requests.map((ret) => (
                                <div key={ret.id} className="od-return-card">
                                    <div className="od-return-header">
                                        <span className="od-return-id">Return #{ret.id}</span>
                                        <span className={`od-return-badge od-return-${ret.status.toLowerCase()}`}>{ret.status.replace('_', ' ')}</span>
                                    </div>
                                    <div className="od-return-body">
                                        <p><strong>Reason:</strong> {REASON_LABELS[ret.reason] || ret.reason}</p>
                                        {ret.description && <p>{ret.description}</p>}
                                        {ret.admin_notes && <p className="od-admin-note">Admin: {ret.admin_notes}</p>}
                                        <p className="od-return-date">Requested {new Date(ret.created_at).toLocaleDateString('en-IN', { dateStyle: 'long' })}</p>
                                    </div>
                                    {ret.status === 'Requested' && (
                                        <button onClick={() => handleCancelReturn(ret.id)} className="od-btn od-btn-danger-outline">Cancel Return</button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Refunds */}
                    {order.refunds?.length > 0 && (
                        <div className="od-section">
                            <h2><FaMoneyBillWave /> Refunds</h2>
                            {order.refunds.map((refund) => (
                                <div key={refund.id} className="od-refund-card">
                                    <div className="od-refund-row"><span>Amount</span><span className="od-refund-amount">₹{parseFloat(refund.amount).toFixed(2)}</span></div>
                                    <div className="od-refund-row"><span>Status</span><span className={`od-refund-status od-refund-${refund.status.toLowerCase()}`}>{refund.status}</span></div>
                                    <div className="od-refund-row"><span>Method</span><span>{refund.refund_method === 'original' ? 'Original Payment' : refund.refund_method?.replace('_', ' ')}</span></div>
                                    {refund.transaction_id && <div className="od-refund-row"><span>Txn ID</span><span className="od-mono">{refund.transaction_id}</span></div>}
                                    <div className="od-refund-row"><span>Initiated</span><span>{new Date(refund.initiated_at).toLocaleDateString('en-IN')}</span></div>
                                    {refund.completed_at && <div className="od-refund-row"><span>Completed</span><span>{new Date(refund.completed_at).toLocaleDateString('en-IN')}</span></div>}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Notes */}
                    {order.customer_notes && (
                        <div className="od-section">
                            <h2>Your Notes</h2>
                            <div className="od-notes-card"><p>{order.customer_notes}</p></div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="od-actions">
                        {hasInvoice && (
                            <button onClick={handleDownloadInvoice} disabled={invoiceLoading} className="od-btn od-btn-primary">
                                <FaFileInvoice /> {invoiceLoading ? 'Downloading...' : 'Download Invoice'}
                            </button>
                        )}
                        {canReturn && (
                            <button onClick={() => setShowReturnModal(true)} className="od-btn od-btn-warning">
                                <FaUndo /> Request Return
                            </button>
                        )}
                        <button onClick={() => window.print()} className="od-btn od-btn-secondary">
                            <FaPrint /> Print Order
                        </button>
                    </div>
                </div>
            </div>

            {/* Return Request Modal */}
            {showReturnModal && (
                <div className="od-modal-overlay" onClick={() => setShowReturnModal(false)}>
                    <div className="od-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="od-modal-header">
                            <h2>Request a Return</h2>
                            <button onClick={() => setShowReturnModal(false)} className="od-modal-close">&times;</button>
                        </div>
                        <form onSubmit={handleSubmitReturn}>
                            <div className="od-modal-body">
                                {returnError && <div className="od-alert od-alert-error"><FaExclamationTriangle /> {returnError}</div>}
                                <div className="od-form-group">
                                    <label>Reason for Return *</label>
                                    <select value={returnForm.reason} onChange={(e) => setReturnForm(prev => ({...prev, reason: e.target.value}))} required>
                                        <option value="">Select a reason...</option>
                                        {RETURN_REASONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                                    </select>
                                </div>
                                <div className="od-form-group">
                                    <label>Additional Details</label>
                                    <textarea value={returnForm.description} onChange={(e) => setReturnForm(prev => ({...prev, description: e.target.value}))} placeholder="Please provide more details..." rows={4} />
                                </div>
                                <div className="od-form-group">
                                    <label>Select Items to Return</label>
                                    <div className="od-return-items-list">
                                        {order.items?.map((item) => (
                                            <label key={item.id} className="od-return-item-check">
                                                <input type="checkbox" checked={returnForm.items.includes(item.id)} onChange={() => toggleReturnItem(item.id)} />
                                                <span>{item.product_name_snapshot || 'Product'} (x{item.quantity})</span>
                                                <span className="od-return-item-price">₹{parseFloat(item.total_price).toFixed(2)}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="od-modal-footer">
                                <button type="button" onClick={() => setShowReturnModal(false)} className="od-btn od-btn-secondary">Cancel</button>
                                <button type="submit" disabled={returnLoading} className="od-btn od-btn-primary">
                                    {returnLoading ? 'Submitting...' : 'Submit Return Request'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OrderDetail;
