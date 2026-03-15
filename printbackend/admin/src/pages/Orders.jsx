import React, { useState, useEffect } from 'react';
import { adminOrdersAPI } from '../services/api';
import './Orders.css';

const STATUS_COLORS = {
    Pending: { bg: '#fef3c7', color: '#92400e' },
    Paid: { bg: '#d1fae5', color: '#065f46' },
    Processing: { bg: '#dbeafe', color: '#1e40af' },
    Printing: { bg: '#e0e7ff', color: '#3730a3' },
    Shipped: { bg: '#cffafe', color: '#155e75' },
    Delivered: { bg: '#d1fae5', color: '#065f46' },
    Cancelled: { bg: '#fee2e2', color: '#991b1b' },
    Refunded: { bg: '#fce7f3', color: '#9d174d' },
};

const VALID_TRANSITIONS = {
    Pending: ['Paid', 'Cancelled'],
    Paid: ['Processing', 'Cancelled', 'Refunded'],
    Processing: ['Printing', 'Cancelled', 'Refunded'],
    Printing: ['Shipped', 'Cancelled'],
    Shipped: ['Delivered'],
    Delivered: ['Refunded'],
    Cancelled: [],
    Refunded: [],
};

const Orders = () => {
    const [orders, setOrders] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [showTransitionModal, setShowTransitionModal] = useState(false);
    const [transitionOrder, setTransitionOrder] = useState(null);
    const [transitionNote, setTransitionNote] = useState('');
    const [newStatus, setNewStatus] = useState('');

    useEffect(() => {
        fetchOrders();
        fetchStats();
    }, []);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const params = {};
            if (searchTerm) params.search = searchTerm;
            if (statusFilter) params.status = statusFilter;
            const response = await adminOrdersAPI.getOrders(params);
            setOrders(response.data?.results || response.data || []);
        } catch (error) {
            console.error('Error fetching orders:', error);
            setOrders([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const response = await adminOrdersAPI.getOrderStats();
            setStats(response.data);
        } catch (error) {
            console.error('Error fetching order stats:', error);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        fetchOrders();
    };

    const handleStatusFilter = (status) => {
        setStatusFilter(status);
        setTimeout(() => fetchOrders(), 0);
    };

    useEffect(() => {
        fetchOrders();
    }, [statusFilter]);

    const openOrderDetail = (order) => {
        setSelectedOrder(order);
        setShowModal(true);
    };

    const openTransitionModal = (order) => {
        setTransitionOrder(order);
        setNewStatus('');
        setTransitionNote('');
        setShowTransitionModal(true);
    };

    const handleTransition = async () => {
        if (!newStatus) return alert('Please select a new status');
        try {
            await adminOrdersAPI.transitionStatus(transitionOrder.id, {
                new_status: newStatus,
                note: transitionNote,
            });
            alert(`Order #${transitionOrder.id} status changed to ${newStatus}`);
            setShowTransitionModal(false);
            fetchOrders();
            fetchStats();
        } catch (error) {
            const msg = error.response?.data?.error || error.message;
            alert('Failed to update status: ' + msg);
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '—';
        return new Date(dateStr).toLocaleDateString('en-IN', {
            day: 'numeric', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit',
        });
    };

    const formatCurrency = (amount) => {
        if (!amount) return '₹0';
        return `₹${parseFloat(amount).toLocaleString('en-IN')}`;
    };

    if (loading) {
        return <div className="loading">Loading orders...</div>;
    }

    return (
        <div className="orders-page">
            <div className="page-header">
                <h1>Order Management</h1>
                <div className="header-actions">
                    <form onSubmit={handleSearch} className="search-bar">
                        <input
                            type="text"
                            placeholder="Search by order ID, email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <button type="submit">Search</button>
                    </form>
                    <button onClick={() => { fetchOrders(); fetchStats(); }} className="btn-refresh">
                        🔄 Refresh
                    </button>
                </div>
            </div>

            {/* Stats Row */}
            {stats && (
                <div className="order-stats-grid">
                    <div className="order-stat-card">
                        <div className="stat-label">Total Orders</div>
                        <div className="stat-number">{stats.total_orders}</div>
                    </div>
                    <div className="order-stat-card">
                        <div className="stat-label">Today</div>
                        <div className="stat-number">{stats.orders_today}</div>
                    </div>
                    <div className="order-stat-card">
                        <div className="stat-label">This Week</div>
                        <div className="stat-number">{stats.orders_this_week}</div>
                    </div>
                    <div className="order-stat-card">
                        <div className="stat-label">Total Revenue</div>
                        <div className="stat-number">{formatCurrency(stats.total_revenue)}</div>
                    </div>
                    <div className="order-stat-card">
                        <div className="stat-label">Pending</div>
                        <div className="stat-number text-warning">{stats.pending_orders}</div>
                    </div>
                    <div className="order-stat-card">
                        <div className="stat-label">Avg Order Value</div>
                        <div className="stat-number">{formatCurrency(stats.avg_order_value)}</div>
                    </div>
                </div>
            )}

            {/* Status Filter Tabs */}
            <div className="status-filter-tabs">
                <button
                    className={`filter-tab ${statusFilter === '' ? 'active' : ''}`}
                    onClick={() => handleStatusFilter('')}
                >All</button>
                {['Pending', 'Paid', 'Processing', 'Printing', 'Shipped', 'Delivered', 'Cancelled', 'Refunded'].map(s => (
                    <button
                        key={s}
                        className={`filter-tab ${statusFilter === s ? 'active' : ''}`}
                        onClick={() => handleStatusFilter(s)}
                        style={statusFilter === s ? { background: STATUS_COLORS[s]?.bg, color: STATUS_COLORS[s]?.color } : {}}
                    >
                        {s}
                        {stats?.status_breakdown?.[s] ? ` (${stats.status_breakdown[s]})` : ''}
                    </button>
                ))}
            </div>

            {/* Orders Table */}
            <div className="orders-table-container">
                <table className="orders-table">
                    <thead>
                        <tr>
                            <th>Order ID</th>
                            <th>Customer</th>
                            <th>Date</th>
                            <th>Amount</th>
                            <th>Payment</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders.length === 0 ? (
                            <tr><td colSpan="7" className="text-center">No orders found</td></tr>
                        ) : (
                            orders.map(order => (
                                <tr key={order.id}>
                                    <td><strong>#{order.id}</strong></td>
                                    <td>
                                        <div>{order.user?.username || order.user?.email || '—'}</div>
                                        <small className="text-muted">{order.user?.email || ''}</small>
                                    </td>
                                    <td>{formatDate(order.created_at)}</td>
                                    <td><strong>{formatCurrency(order.total_amount)}</strong></td>
                                    <td>
                                        <span className={`payment-badge ${order.is_paid ? 'paid' : 'unpaid'}`}>
                                            {order.is_paid ? '✅ Paid' : '⏳ Unpaid'}
                                        </span>
                                    </td>
                                    <td>
                                        <span
                                            className="status-badge"
                                            style={{
                                                background: STATUS_COLORS[order.status]?.bg || '#f3f4f6',
                                                color: STATUS_COLORS[order.status]?.color || '#374151',
                                            }}
                                        >
                                            {order.status}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="action-buttons">
                                            <button className="btn-view" onClick={() => openOrderDetail(order)}>View</button>
                                            {VALID_TRANSITIONS[order.status]?.length > 0 && (
                                                <button className="btn-toggle" onClick={() => openTransitionModal(order)}>
                                                    Update
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Order Detail Modal */}
            {showModal && selectedOrder && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content modal-lg" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Order #{selectedOrder.id}</h2>
                            <button className="modal-close" onClick={() => setShowModal(false)}>&times;</button>
                        </div>
                        <div className="modal-body">
                            <div className="order-detail-grid">
                                <div className="detail-section">
                                    <h3>Order Info</h3>
                                    <div className="detail-row"><label>Status:</label>
                                        <span className="status-badge" style={{
                                            background: STATUS_COLORS[selectedOrder.status]?.bg,
                                            color: STATUS_COLORS[selectedOrder.status]?.color,
                                        }}>{selectedOrder.status}</span>
                                    </div>
                                    <div className="detail-row"><label>Created:</label><span>{formatDate(selectedOrder.created_at)}</span></div>
                                    <div className="detail-row"><label>Payment:</label><span>{selectedOrder.is_paid ? '✅ Paid' : '⏳ Unpaid'}</span></div>
                                    {selectedOrder.paid_at && (
                                        <div className="detail-row"><label>Paid at:</label><span>{formatDate(selectedOrder.paid_at)}</span></div>
                                    )}
                                    <div className="detail-row"><label>Payment Method:</label><span>{selectedOrder.payment_method || '—'}</span></div>
                                    <div className="detail-row"><label>Transaction ID:</label><span>{selectedOrder.transaction_id || '—'}</span></div>
                                </div>

                                <div className="detail-section">
                                    <h3>Customer</h3>
                                    <div className="detail-row"><label>Name:</label><span>{selectedOrder.user?.first_name} {selectedOrder.user?.last_name}</span></div>
                                    <div className="detail-row"><label>Email:</label><span>{selectedOrder.user?.email || '—'}</span></div>
                                    <div className="detail-row"><label>Phone:</label><span>{selectedOrder.user?.phone || '—'}</span></div>
                                </div>

                                <div className="detail-section">
                                    <h3>Financials</h3>
                                    <div className="detail-row"><label>Subtotal:</label><span>{formatCurrency(selectedOrder.subtotal)}</span></div>
                                    <div className="detail-row"><label>Tax:</label><span>{formatCurrency(selectedOrder.tax_total)}</span></div>
                                    <div className="detail-row"><label>Shipping:</label><span>{formatCurrency(selectedOrder.shipping_total)}</span></div>
                                    <div className="detail-row"><label>Discount:</label><span>-{formatCurrency(selectedOrder.discount_total)}</span></div>
                                    <div className="detail-row total-row"><label>Total:</label><span><strong>{formatCurrency(selectedOrder.total_amount)}</strong></span></div>
                                </div>

                                {selectedOrder.shipping_address && (
                                    <div className="detail-section">
                                        <h3>Shipping Address</h3>
                                        <p className="address-text">
                                            {selectedOrder.shipping_address.address_line_1}<br />
                                            {selectedOrder.shipping_address.address_line_2 && <>{selectedOrder.shipping_address.address_line_2}<br /></>}
                                            {selectedOrder.shipping_address.city}, {selectedOrder.shipping_address.state} {selectedOrder.shipping_address.postal_code}<br />
                                            {selectedOrder.shipping_address.country}
                                        </p>
                                    </div>
                                )}

                                {selectedOrder.items && selectedOrder.items.length > 0 && (
                                    <div className="detail-section full-width">
                                        <h3>Order Items</h3>
                                        <table className="items-table">
                                            <thead>
                                                <tr>
                                                    <th>Product</th>
                                                    <th>SKU</th>
                                                    <th>Qty</th>
                                                    <th>Price</th>
                                                    <th>Total</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {selectedOrder.items.map((item, i) => (
                                                    <tr key={i}>
                                                        <td>{item.product?.name || item.product_name || '—'}</td>
                                                        <td><code>{item.product?.sku || '—'}</code></td>
                                                        <td>{item.quantity}</td>
                                                        <td>{formatCurrency(item.unit_price)}</td>
                                                        <td><strong>{formatCurrency(item.total_price)}</strong></td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}

                                {selectedOrder.customer_notes && (
                                    <div className="detail-section full-width">
                                        <h3>Customer Notes</h3>
                                        <p className="notes-text">{selectedOrder.customer_notes}</p>
                                    </div>
                                )}

                                {selectedOrder.internal_notes && (
                                    <div className="detail-section full-width">
                                        <h3>Internal Notes</h3>
                                        <p className="notes-text">{selectedOrder.internal_notes}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Status Transition Modal */}
            {showTransitionModal && transitionOrder && (
                <div className="modal-overlay" onClick={() => setShowTransitionModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Update Order #{transitionOrder.id} Status</h2>
                            <button className="modal-close" onClick={() => setShowTransitionModal(false)}>&times;</button>
                        </div>
                        <div className="modal-body">
                            <p>Current Status: <strong>{transitionOrder.status}</strong></p>
                            <div className="form-group">
                                <label>New Status:</label>
                                <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)} className="form-select">
                                    <option value="">Select status...</option>
                                    {VALID_TRANSITIONS[transitionOrder.status]?.map(s => (
                                        <option key={s} value={s}>{s}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Note (optional):</label>
                                <textarea
                                    value={transitionNote}
                                    onChange={(e) => setTransitionNote(e.target.value)}
                                    placeholder="Add a note about this status change..."
                                    className="form-textarea"
                                    rows={3}
                                />
                            </div>
                            <div className="modal-actions">
                                <button className="btn-secondary" onClick={() => setShowTransitionModal(false)}>Cancel</button>
                                <button className="btn-primary" onClick={handleTransition}>Update Status</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Orders;
