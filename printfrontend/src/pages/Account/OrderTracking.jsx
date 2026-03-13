import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FaTruck, FaSearch, FaMapMarkerAlt, FaClock, FaCheckCircle, FaSyncAlt, FaShippingFast } from 'react-icons/fa';
import orderService from '../../services/orderService';
import './Account.css';
import './Orders.css';

const OrderTracking = () => {
    const { trackingNumber } = useParams();
    const [order, setOrder] = useState(null);
    const [trackingData, setTrackingData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState('');
    const [searchTracking, setSearchTracking] = useState(trackingNumber || '');

    useEffect(() => {
        if (trackingNumber) {
            loadOrderByTracking(trackingNumber);
        } else {
            setLoading(false);
        }
    }, [trackingNumber]);

    const loadOrderByTracking = async (trackingNum) => {
        try {
            setLoading(true);
            setError('');
            // Get all orders and find the one with matching tracking number
            const orders = await orderService.getOrders();
            const foundOrder = orders.find(o => 
                o.shipment?.tracking_number === trackingNum
            );
            
            if (foundOrder) {
                // Load full order details
                const orderData = await orderService.getOrder(foundOrder.id);
                setOrder(orderData);
                // Load live tracking data
                try {
                    const tracking = await orderService.getTracking(foundOrder.id, false);
                    setTrackingData(tracking);
                } catch (trackErr) {
                    console.error('Error loading tracking data:', trackErr);
                    // Still show order, just no live events
                }
            } else {
                setError('Order with this tracking number not found');
            }
        } catch (err) {
            console.error('Error loading order:', err);
            setError('Failed to load tracking information');
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = async () => {
        if (!order) return;
        try {
            setRefreshing(true);
            const tracking = await orderService.getTracking(order.id, true);
            setTrackingData(tracking);
            // Reload order to get updated shipment status
            const orderData = await orderService.getOrder(order.id);
            setOrder(orderData);
        } catch (err) {
            console.error('Error refreshing tracking:', err);
        } finally {
            setRefreshing(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchTracking) {
            loadOrderByTracking(searchTracking);
        }
    };

    const getStatusSteps = () => {
        const steps = ['Label Created', 'In Transit', 'Out for Delivery', 'Delivered'];
        const shipmentStatus = trackingData?.status || order?.shipment?.status || '';
        
        return steps.map(step => {
            const statusMap = {
                'Label Created': ['Label Created', 'Pickup Scheduled', 'Pickup Queued'],
                'In Transit': ['In Transit', 'Reached at Destination Hub'],
                'Out for Delivery': ['Out for Delivery'],
                'Delivered': ['Delivered'],
            };
            
            const stepStatuses = statusMap[step] || [step];
            const allSteps = ['Label Created', 'In Transit', 'Out for Delivery', 'Delivered'];
            const currentIdx = allSteps.findIndex(s => {
                const statuses = statusMap[s] || [s];
                return statuses.some(st => st.toLowerCase() === shipmentStatus.toLowerCase());
            });
            const stepIdx = allSteps.indexOf(step);
            
            return {
                label: step,
                completed: stepIdx <= currentIdx,
                isCurrent: stepIdx === currentIdx,
            };
        });
    };

    if (loading) {
        return (
            <div className="account-page">
                <div className="account-container">
                    <div className="loading-spinner">Loading tracking information...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="account-page">
            <div className="account-container">
                <div className="account-header">
                    <div>
                        <h1>Track Your Order</h1>
                        <p>Enter your tracking number to see the status of your shipment</p>
                    </div>
                </div>

                {!trackingNumber && (
                    <div className="tracking-search-section">
                        <form onSubmit={handleSearch} className="tracking-search-form">
                            <div className="search-input-group-large">
                                <FaSearch className="search-icon" />
                                <input
                                    type="text"
                                    placeholder="Enter tracking number..."
                                    value={searchTracking}
                                    onChange={(e) => setSearchTracking(e.target.value)}
                                    className="search-input-large"
                                    required
                                />
                                <button type="submit" className="btn-primary btn-large">
                                    Track Order
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {error && (
                    <div className="account-content">
                        <div className="alert alert-error">{error}</div>
                        {!trackingNumber && (
                            <Link to="/account/orders" className="btn-secondary">
                                View My Orders
                            </Link>
                        )}
                    </div>
                )}

                {order && order.shipment && (
                    <div className="order-detail-content">
                        <div className="order-section">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                                <h2>Tracking Information</h2>
                                <button
                                    onClick={handleRefresh}
                                    disabled={refreshing}
                                    className="od-btn od-btn-secondary"
                                    style={{ fontSize: '0.8125rem', padding: '0.375rem 0.875rem' }}
                                >
                                    <FaSyncAlt className={refreshing ? 'od-spin' : ''} /> {refreshing ? 'Refreshing...' : 'Live Refresh'}
                                </button>
                            </div>
                            <div className="tracking-header-card">
                                <div className="tracking-info-main">
                                    <div className="tracking-number-display">
                                        <FaTruck />
                                        <div>
                                            <label>Tracking Number</label>
                                            <span className="tracking-number-large">{order.shipment.tracking_number}</span>
                                        </div>
                                    </div>
                                    <div className="tracking-carrier">
                                        <label>Carrier</label>
                                        <span>{trackingData?.courier_name || order.shipment.courier_name || order.shipment.carrier}</span>
                                    </div>
                                    {(trackingData?.awb_code || order.shipment.awb_code) && (
                                        <div className="tracking-carrier">
                                            <label>AWB Code</label>
                                            <span style={{ fontFamily: 'monospace' }}>{trackingData?.awb_code || order.shipment.awb_code}</span>
                                        </div>
                                    )}
                                    <div className="tracking-status-main">
                                        <label>Current Status</label>
                                        <span className={`status-badge-large status-${(trackingData?.status || order.shipment.status).toLowerCase().replace(/ /g, '-')}`}>
                                            {trackingData?.status || order.shipment.status}
                                        </span>
                                    </div>
                                    {(trackingData?.estimated_delivery || order.shipment.estimated_delivery) && (
                                        <div className="tracking-carrier">
                                            <label>Estimated Delivery</label>
                                            <span style={{ fontWeight: 600, color: '#059669' }}>
                                                {new Date(trackingData?.estimated_delivery || order.shipment.estimated_delivery).toLocaleDateString('en-IN', { dateStyle: 'long' })}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Status Progress Bar */}
                            <div className="tracking-timeline">
                                <h3>Shipment Progress</h3>
                                {getStatusSteps().map((step, idx) => (
                                    <div key={idx} className={`tracking-step ${step.completed ? 'completed' : 'pending'} ${step.isCurrent ? 'current' : ''}`}>
                                        <div className="tracking-marker">
                                            {step.completed ? <FaCheckCircle /> : <FaClock />}
                                        </div>
                                        <div className="tracking-content">
                                            <div className="tracking-label">{step.label}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Live Tracking Events from API */}
                            {trackingData?.tracking_events && trackingData.tracking_events.length > 0 && (
                                <div className="od-tracking-events" style={{ marginTop: '2rem' }}>
                                    <h3 className="od-tracking-events-title">Detailed Tracking Events</h3>
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
                                </div>
                            )}
                        </div>

                        <div className="order-section">
                            <h2>Order Details</h2>
                            <div className="order-info-card">
                                <div className="info-item">
                                    <label>Order Number:</label>
                                    <Link to={`/account/orders/${order.id}`} className="order-link">
                                        #{order.id}
                                    </Link>
                                </div>
                                <div className="info-item">
                                    <label>Order Date:</label>
                                    <span>
                                        {new Date(order.created_at).toLocaleDateString('en-IN', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}
                                    </span>
                                </div>
                                <div className="info-item">
                                    <label>Total Amount:</label>
                                    <span>₹{parseFloat(order.total_amount).toFixed(2)}</span>
                                </div>
                            </div>
                        </div>

                        {order.shipping_address_details && (
                            <div className="order-section">
                                <h2>
                                    <FaMapMarkerAlt /> Delivery Address
                                </h2>
                                <div className="address-detail-card">
                                    <p><strong>{order.shipping_address_details.recipient_name}</strong></p>
                                    <p>{order.shipping_address_details.street}</p>
                                    {order.shipping_address_details.apartment_suite && (
                                        <p>{order.shipping_address_details.apartment_suite}</p>
                                    )}
                                    <p>
                                        {order.shipping_address_details.city}, {order.shipping_address_details.state} {order.shipping_address_details.zip_code}
                                    </p>
                                    <p>{order.shipping_address_details.country}</p>
                                </div>
                            </div>
                        )}

                        <div className="order-actions">
                            <Link to={`/account/orders/${order.id}`} className="btn-primary">
                                View Full Order Details
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default OrderTracking;
