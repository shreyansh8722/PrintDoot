import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaSearch, FaFilter, FaBox, FaTruck, FaCheckCircle, FaClock, FaTimesCircle, FaMoneyBillWave, FaShippingFast } from 'react-icons/fa';
import orderService from '../../services/orderService';
import './Account.css';
import './Orders.css';

const Orders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [sortBy, setSortBy] = useState('newest');

    useEffect(() => {
        loadOrders();
    }, [statusFilter, sortBy]);

    const loadOrders = async () => {
        try {
            setLoading(true);
            const params = {};
            if (sortBy === 'newest') {
                params.ordering = '-created_at';
            } else if (sortBy === 'oldest') {
                params.ordering = 'created_at';
            } else if (sortBy === 'amount_high') {
                params.ordering = '-total_amount';
            } else if (sortBy === 'amount_low') {
                params.ordering = 'total_amount';
            }
            
            const data = await orderService.getOrders(params);
            
            // Filter by status
            let filtered = data;
            if (statusFilter !== 'all') {
                filtered = data.filter(order => 
                    order.status.toLowerCase() === statusFilter.toLowerCase()
                );
            }
            
            // Filter by search term
            if (searchTerm) {
                filtered = filtered.filter(order => 
                    order.id.toString().includes(searchTerm) ||
                    order.items?.some(item => 
                        item.product_name_snapshot?.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                );
            }
            
            setOrders(filtered);
        } catch (err) {
            console.error('Error loading orders:', err);
            setError('Failed to load orders');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        loadOrders();
    };

    const getStatusIcon = (status) => {
        const statusLower = status.toLowerCase();
        if (statusLower === 'delivered') return <FaCheckCircle className="icon-delivered" />;
        if (statusLower === 'paid') return <FaMoneyBillWave className="icon-paid" />;
        if (['pending', 'processing', 'printing'].includes(statusLower)) return <FaClock className="icon-pending" />;
        if (['shipped'].includes(statusLower)) return <FaTruck className="icon-shipped" />;
        if (['cancelled', 'refunded'].includes(statusLower)) return <FaTimesCircle className="icon-cancelled" />;
        return <FaBox className="icon-default" />;
    };

    const getStatusColor = (status) => {
        const statusLower = status.toLowerCase();
        if (statusLower === 'delivered') return 'delivered';
        if (statusLower === 'paid') return 'paid';
        if (['pending', 'processing', 'printing'].includes(statusLower)) return 'pending';
        if (['shipped'].includes(statusLower)) return 'shipped';
        if (['cancelled', 'refunded'].includes(statusLower)) return 'cancelled';
        return 'default';
    };

    if (loading) {
        return (
            <div className="account-page">
                <div className="account-container">
                    <div className="loading-spinner">Loading orders...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="account-page">
            <div className="account-container">
                <div className="account-header">
                    <div>
                        <h1>My Orders</h1>
                        <p>View and track all your orders</p>
                    </div>
                </div>

                <div className="orders-filters">
                    <form onSubmit={handleSearch} className="search-form">
                        <div className="search-input-group">
                            <FaSearch className="search-icon" />
                            <input
                                type="text"
                                placeholder="Search by order number or product name..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="search-input"
                            />
                            <button type="submit" className="search-btn">Search</button>
                        </div>
                    </form>

                    <div className="filters-row">
                        <div className="filter-group">
                            <label>
                                <FaFilter /> Status:
                            </label>
                            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                                <option value="all">All Orders</option>
                                <option value="pending">Pending</option>
                                <option value="paid">Paid</option>
                                <option value="processing">Processing</option>
                                <option value="printing">Printing</option>
                                <option value="shipped">Shipped</option>
                                <option value="delivered">Delivered</option>
                                <option value="cancelled">Cancelled</option>
                                <option value="refunded">Refunded</option>
                            </select>
                        </div>

                        <div className="filter-group">
                            <label>Sort By:</label>
                            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                                <option value="newest">Newest First</option>
                                <option value="oldest">Oldest First</option>
                                <option value="amount_high">Amount: High to Low</option>
                                <option value="amount_low">Amount: Low to High</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="account-content">
                    {error && (
                        <div className="alert alert-error">{error}</div>
                    )}

                    {orders.length === 0 ? (
                        <div className="empty-state">
                            <FaBox className="empty-icon" />
                            <h2>No orders found</h2>
                            <p>
                                {searchTerm || statusFilter !== 'all' 
                                    ? 'Try adjusting your filters' 
                                    : "You haven't placed any orders yet"}
                            </p>
                            {!searchTerm && statusFilter === 'all' && (
                                <Link to="/view-all" className="btn-primary">
                                    Start Shopping
                                </Link>
                            )}
                        </div>
                    ) : (
                        <div className="orders-list">
                            {orders.map(order => (
                                <OrderCard
                                    key={order.id}
                                    order={order}
                                    getStatusIcon={getStatusIcon}
                                    getStatusColor={getStatusColor}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const OrderCard = ({ order, getStatusIcon, getStatusColor }) => {
    const itemCount = order.items?.length || 0;
    const firstItem = order.items?.[0];
    const previewImage = firstItem?.product?.primary_image || 
                        firstItem?.product?.images?.[0]?.image || 
                        'https://placehold.co/80x80';

    return (
        <Link to={`/account/orders/${order.id}`} className="order-card-link">
            <div className="order-card-large">
                <div className="order-card-header-large">
                    <div className="order-info-left">
                        <div className="order-number-large">Order #{order.id}</div>
                        <div className="order-date-large">
                            {new Date(order.created_at).toLocaleDateString('en-IN', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                            })}
                        </div>
                    </div>
                    <div className={`status-badge-large status-${getStatusColor(order.status)}`}>
                        {getStatusIcon(order.status)}
                        <span>{order.status}</span>
                    </div>
                </div>

                <div className="order-card-body-large">
                    <div className="order-items-preview-large">
                        <div className="order-items-grid">
                            {order.items?.slice(0, 4).map((item, idx) => (
                                <div key={idx} className="order-item-preview-large">
                                    <img 
                                        src={item.product?.primary_image || previewImage} 
                                        alt={item.product_name_snapshot || 'Product'} 
                                    />
                                    <div className="item-quantity-badge">{item.quantity}</div>
                                </div>
                            ))}
                            {itemCount > 4 && (
                                <div className="order-item-preview-large more">
                                    +{itemCount - 4} more
                                </div>
                            )}
                        </div>
                        <div className="order-items-count">
                            {itemCount} {itemCount === 1 ? 'item' : 'items'}
                        </div>
                    </div>

                    <div className="order-summary-large">
                        <div className="summary-row-large">
                            <span>Subtotal:</span>
                            <span>₹{parseFloat(order.subtotal || 0).toFixed(2)}</span>
                        </div>
                        {order.shipping_total > 0 && (
                            <div className="summary-row-large">
                                <span>Shipping:</span>
                                <span>₹{parseFloat(order.shipping_total).toFixed(2)}</span>
                            </div>
                        )}
                        {order.tax_total > 0 && (
                            <div className="summary-row-large">
                                <span>Tax:</span>
                                <span>₹{parseFloat(order.tax_total).toFixed(2)}</span>
                            </div>
                        )}
                        <div className="summary-row-large total-large">
                            <span>Total:</span>
                            <span>₹{parseFloat(order.total_amount).toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                <div className="order-card-footer-large">
                    {order.shipment?.tracking_number && (
                        <div className="tracking-info">
                            <FaTruck />
                            <span>Tracking: {order.shipment.tracking_number}</span>
                        </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginLeft: 'auto' }}>
                        {['Shipped', 'Delivered'].includes(order.status) && order.shipment?.tracking_number && (
                            <Link
                                to={`/track-order/${order.shipment.tracking_number}`}
                                className="order-card-track-btn"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <FaShippingFast /> Track Order
                            </Link>
                        )}
                        <div className="view-details-link">
                            View Details →
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    );
};

export default Orders;
