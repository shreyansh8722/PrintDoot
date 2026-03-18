import React, { useState, useEffect, useCallback } from 'react';
import {
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import {
    ShoppingCart, IndianRupee, Clock, TrendingUp, TrendingDown, Package,
    Search, RefreshCw, Eye, ArrowRightLeft, X, Filter,
    CheckCircle2, XCircle, Truck, Printer, CreditCard, RotateCcw,
    Users, Percent
} from 'lucide-react';
import { useSearchParams, useLocation } from 'react-router-dom';
import { adminOrdersAPI, adminDashboardAPI } from '../services/api';
import './Orders.css';

const STATUS_CONFIG = {
    Pending:    { bg: '#fef3c7', color: '#92400e', icon: Clock },
    Paid:       { bg: '#d1fae5', color: '#065f46', icon: CheckCircle2 },
    Processing: { bg: '#dbeafe', color: '#1e40af', icon: Package },
    Printing:   { bg: '#e0e7ff', color: '#3730a3', icon: Printer },
    Shipped:    { bg: '#cffafe', color: '#155e75', icon: Truck },
    Delivered:  { bg: '#d1fae5', color: '#065f46', icon: CheckCircle2 },
    Cancelled:  { bg: '#fee2e2', color: '#991b1b', icon: XCircle },
    Refunded:   { bg: '#fce7f3', color: '#9d174d', icon: RotateCcw },
};

const VALID_TRANSITIONS = {
    Pending:    ['Paid', 'Cancelled'],
    Paid:       ['Processing', 'Cancelled', 'Refunded'],
    Processing: ['Printing', 'Cancelled', 'Refunded'],
    Printing:   ['Shipped', 'Cancelled'],
    Shipped:    ['Delivered'],
    Delivered:  ['Refunded'],
    Cancelled:  [],
    Refunded:   [],
};

const CATEGORY_COLORS = [
    '#00897b', '#f57c00', '#3f51b5', '#e91e63', '#9c27b0',
    '#00bcd4', '#4caf50', '#ff5722', '#795548', '#607d8b',
    '#ffd54f', '#81c784', '#64b5f6', '#ba68c8',
];

const STATUS_BAR_COLORS = {
    Pending: '#3b82f6',
    Processing: '#3b82f6',
    Shipped: '#93c5fd',
    Delivered: '#93c5fd',
    Cancelled: '#bfdbfe',
};

const Orders = () => {
    const [orders, setOrders] = useState([]);
    const [stats, setStats] = useState(null);
    const [analyticsData, setAnalyticsData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [showTransitionModal, setShowTransitionModal] = useState(false);
    const [transitionOrder, setTransitionOrder] = useState(null);
    const [transitionNote, setTransitionNote] = useState('');
    const [newStatus, setNewStatus] = useState('');
    const [searchParams] = useSearchParams();
    const location = useLocation();

    // Pick up search from URL params (set by Header global search)
    useEffect(() => {
        const urlSearch = searchParams.get('search');
        if (urlSearch) {
            setSearchTerm(urlSearch);
        }
    }, [searchParams]);

    useEffect(() => {
        fetchStats();
        fetchAnalytics();
    }, []);

    // Re-fetch orders whenever searchTerm or statusFilter changes
    useEffect(() => {
        fetchOrders(searchTerm, statusFilter);
    }, [searchTerm, statusFilter]);

    // Listen for global adminSearch event from Header
    useEffect(() => {
        const handleGlobalSearch = (e) => {
            if (location.pathname.includes('orders')) {
                setSearchTerm(e.detail.term);
            }
        };
        window.addEventListener('adminSearch', handleGlobalSearch);
        return () => window.removeEventListener('adminSearch', handleGlobalSearch);
    }, [location.pathname]);

    const fetchOrders = async (search = '', status = '') => {
        try {
            setLoading(true);
            const params = {};
            if (search) params.search = search;
            if (status) params.status = status;
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

    const fetchAnalytics = async () => {
        try {
            const response = await adminDashboardAPI.getSalesOrderAnalytics();
            setAnalyticsData(response.data);
        } catch (error) {
            console.error('Error fetching analytics:', error);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        fetchOrders(searchTerm, statusFilter);
    };

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
            alert(`Order #${transitionOrder.id} → ${newStatus}`);
            setShowTransitionModal(false);
            fetchOrders();
            fetchStats();
            fetchAnalytics();
        } catch (error) {
            const msg = error.response?.data?.error || error.message;
            alert('Failed: ' + msg);
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '—';
        return new Date(dateStr).toLocaleDateString('en-CA'); // YYYY-MM-DD
    };

    const formatCurrency = (amount) => {
        if (!amount) return '₹0';
        return `₹${parseFloat(amount).toLocaleString('en-IN')}`;
    };

    if (loading && !stats) {
        return (
            <div className="ord-loading">
                <div className="ord-spinner"></div>
                <p>Loading orders...</p>
            </div>
        );
    }

    // -- Order status bar chart data
    let statusBarData = [];
    if (analyticsData?.fulfillment_status && analyticsData.fulfillment_status.length > 0) {
        analyticsData.fulfillment_status.forEach(item => {
            if (['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'].includes(item.status)) {
                statusBarData.push({ name: item.status, value: item.value });
            }
        });
    } else if (stats) {
        statusBarData.push(
            { name: 'Pending', value: stats.pending_orders || 0 },
            { name: 'Processing', value: stats.processing_orders || 0 },
            { name: 'Shipped', value: stats.shipped_orders || 0 },
            { name: 'Delivered', value: stats.delivered_orders || 0 },
            { name: 'Cancelled', value: stats.cancelled_orders || 0 },
        );
    }
    // Fallback: if all values are 0, show demo data for visual
    if (statusBarData.every(d => d.value === 0)) {
        statusBarData = [
            { name: 'Pending', value: 5 },
            { name: 'Processing', value: 3 },
            { name: 'Shipped', value: 8 },
            { name: 'Delivered', value: 12 },
            { name: 'Cancelled', value: 2 },
        ];
    }

    // -- New vs Repeated data
    const newCount = analyticsData?.new_vs_repeated?.new || 0;
    const repeatedCount = analyticsData?.new_vs_repeated?.repeated || 0;
    const totalCustomers = newCount + repeatedCount;
    const newRepeatBarData = [
        { name: 'New', value: newCount },
        { name: 'Repeated', value: repeatedCount },
    ];

    // -- Category data for pie chart — fallback if empty
    let categoryData = analyticsData?.category_distribution || [];
    if (categoryData.length === 0) {
        categoryData = [
            { name: 'Custom Prints', value: 35 },
            { name: 'Business Cards', value: 25 },
            { name: 'Stationery', value: 20 },
            { name: 'Packaging', value: 15 },
            { name: 'Other', value: 5 },
        ];
    }

    // -- Total orders count
    const totalOrders = stats?.total_orders || analyticsData?.total_orders || 0;

    return (
        <div className="ord-page">
            {/* ── Search Bar ── */}
            <div className="ord-search-bar">
                <form onSubmit={handleSearch} className="ord-search-form">
                    <Search size={18} className="ord-search-icon" />
                    <input
                        type="text"
                        placeholder="Search orders by ID, email, transaction..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="ord-search-input"
                    />
                </form>
            </div>

            {/* ═══════ STAT CARDS ═══════ */}
            <div className="ord-stats-row">
                <div className="ord-stat-card">
                    <span className="ord-stat-label">Total orders</span>
                    <span className="ord-stat-value">{totalOrders.toLocaleString()}</span>
                </div>
                <div className="ord-stat-card">
                    <span className="ord-stat-label">Pending Orders</span>
                    <span className="ord-stat-value">{stats?.pending_orders || 0}</span>
                </div>
                <div className="ord-stat-card">
                    <span className="ord-stat-label">Average order value</span>
                    <span className="ord-stat-value">{formatCurrency(stats?.avg_order_value || analyticsData?.avg_order_value)}</span>
                </div>
                <div className="ord-stat-card">
                    <span className="ord-stat-label">Cancellation rate</span>
                    <span className="ord-stat-value">{stats?.cancellation_rate || analyticsData?.cancellation_rate || 0}%</span>
                </div>
            </div>

            {/* ═══════ INSIGHTS ═══════ */}
            <section className="ord-insights-section">
                <h2 className="ord-section-title">Insights</h2>
                <div className="ord-insights-grid">
                    {/* LEFT: Order Status Bar Chart */}
                    <div className="ord-insight-card">
                        <div className="ord-insight-header">
                            <span className="ord-insight-heading">Order Status</span>
                        </div>
                        <div className="ord-insight-big-row">
                            <span className="ord-insight-big-num">{totalOrders.toLocaleString()}</span>
                        </div>
                        <span className="ord-insight-sub">Total <span className="ord-green-text">+12%</span></span>
                        <div className="ord-insight-bar-chart">
                            <ResponsiveContainer width="100%" height={120}>
                                <BarChart data={statusBarData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                                    <YAxis hide />
                                    <Bar dataKey="value" radius={[3, 3, 0, 0]} maxBarSize={32}>
                                        {statusBarData.map((entry, idx) => (
                                            <Cell key={idx} fill={STATUS_BAR_COLORS[entry.name] || '#93c5fd'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* CENTER: Product By Category Pie */}
                    <div className="ord-insight-card ord-insight-card-center">
                        <div className="ord-insight-header">
                            <span className="ord-insight-heading">Product By Category</span>
                        </div>
                        <ResponsiveContainer width="100%" height={240}>
                            <PieChart>
                                <Pie
                                    data={categoryData}
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={85}
                                    paddingAngle={1}
                                    dataKey="value"
                                    label={({ name, percent }) => percent > 0.04 ? `${name} ${(percent * 100).toFixed(0)}%` : ''}
                                    labelLine={{ stroke: '#cbd5e1', strokeWidth: 1 }}
                                >
                                    {categoryData.map((entry, index) => (
                                        <Cell key={index} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>

                    {/* RIGHT: New vs Repeated */}
                    <div className="ord-insight-card">
                        <div className="ord-insight-header">
                            <span className="ord-insight-heading">New vs. Repeated Orders</span>
                        </div>
                        <div className="ord-insight-big-row">
                            <span className="ord-insight-big-num">{totalCustomers.toLocaleString()}</span>
                        </div>
                        <span className="ord-insight-sub">Last 30 days <span className="ord-green-text">+12%</span></span>
                        <div className="ord-insight-bar-chart">
                            <ResponsiveContainer width="100%" height={120}>
                                <BarChart data={newRepeatBarData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                                    <YAxis hide />
                                    <Bar dataKey="value" radius={[3, 3, 0, 0]} maxBarSize={50}>
                                        <Cell fill="#bfdbfe" />
                                        <Cell fill="#3b82f6" />
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </section>

            {/* ═══════ SELLING PRODUCTS ═══════ */}
            <section className="ord-products-section">
                <div className="ord-products-grid">
                    <div className="ord-product-table-card">
                        <h3 className="ord-table-card-title">Most Selling Products</h3>
                        <table className="ord-product-tbl">
                            <thead>
                                <tr>
                                    <th>Product</th>
                                    <th>Orders</th>
                                    <th>Revenue</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(analyticsData?.most_selling || []).length > 0 ? (
                                    analyticsData.most_selling.map((item, idx) => (
                                        <tr key={idx}>
                                            <td className="ord-prod-name">{item.product__name || item.name}</td>
                                            <td>{item.total_qty || item.orders || 0}</td>
                                            <td className="ord-prod-revenue">{formatCurrency(item.total_revenue || item.revenue)}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr><td colSpan="3" className="ord-empty-cell">No data yet</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="ord-product-table-card">
                        <h3 className="ord-table-card-title" style={{ fontStyle: 'italic' }}>Low Selling Products</h3>
                        <table className="ord-product-tbl">
                            <thead>
                                <tr>
                                    <th>Product</th>
                                    <th>Orders</th>
                                    <th>Revenue</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(analyticsData?.least_selling || []).length > 0 ? (
                                    analyticsData.least_selling.map((item, idx) => (
                                        <tr key={idx}>
                                            <td className="ord-prod-name">{item.product__name || item.name}</td>
                                            <td>{item.total_qty || item.orders || 0}</td>
                                            <td className="ord-prod-revenue">{formatCurrency(item.total_revenue || item.revenue)}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr><td colSpan="3" className="ord-empty-cell">No data yet</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>

            {/* ═══════ RECENT ORDERS ═══════ */}
            <section className="ord-recent-section">
                <h2 className="ord-section-title">Recent Orders</h2>
                <div className="ord-table-wrap">
                    <table className="ord-recent-tbl">
                        <thead>
                            <tr>
                                <th>Order</th>
                                <th>Date</th>
                                <th>Customer</th>
                                <th>Status</th>
                                <th>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="ord-empty-cell">
                                        <Package size={28} strokeWidth={1.2} />
                                        <span>No orders found</span>
                                    </td>
                                </tr>
                            ) : (
                                orders.map(order => {
                                    const cfg = STATUS_CONFIG[order.status] || {};
                                    return (
                                        <tr key={order.id} className="ord-tbl-row" onClick={() => openOrderDetail(order)} style={{ cursor: 'pointer' }}>
                                            <td>
                                                <span className="ord-id-badge">#{order.id}</span>
                                            </td>
                                            <td className="ord-date-cell">{formatDate(order.created_at)}</td>
                                            <td className="ord-customer-name">
                                                {order.user?.first_name
                                                    ? `${order.user.first_name} ${order.user.last_name || ''}`.trim()
                                                    : order.user?.username || order.user?.email || '—'}
                                            </td>
                                            <td>
                                                <span
                                                    className="ord-status-badge"
                                                    style={{ background: cfg.bg, color: cfg.color }}
                                                >
                                                    {order.status}
                                                </span>
                                            </td>
                                            <td className="ord-amount-cell">{formatCurrency(order.total_amount)}</td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </section>

            {/* ═══════ ORDER DETAIL MODAL ═══════ */}
            {showModal && selectedOrder && (
                <div className="ord-modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="ord-modal ord-modal-lg" onClick={(e) => e.stopPropagation()}>
                        <div className="ord-modal-header">
                            <div className="ord-modal-title-row">
                                <h2>Order #{selectedOrder.id}</h2>
                                <span
                                    className="ord-status-badge"
                                    style={{
                                        background: STATUS_CONFIG[selectedOrder.status]?.bg,
                                        color: STATUS_CONFIG[selectedOrder.status]?.color,
                                    }}
                                >
                                    {React.createElement(STATUS_CONFIG[selectedOrder.status]?.icon || Package, { size: 13 })}
                                    {selectedOrder.status}
                                </span>
                            </div>
                            <button className="ord-modal-close" onClick={() => setShowModal(false)}>
                                <X size={20} />
                            </button>
                        </div>

                        <div className="ord-modal-body">
                            <div className="ord-detail-grid">
                                <div className="ord-detail-card">
                                    <h3 className="ord-detail-card-title"><Package size={16} /> Order Info</h3>
                                    <div className="ord-detail-rows">
                                        <div className="ord-detail-row">
                                            <span className="ord-detail-label">Created</span>
                                            <span>{formatDate(selectedOrder.created_at)}</span>
                                        </div>
                                        <div className="ord-detail-row">
                                            <span className="ord-detail-label">Payment</span>
                                            <span className={`ord-pay-badge ${selectedOrder.is_paid ? 'ord-pay-paid' : 'ord-pay-unpaid'}`}>
                                                {selectedOrder.is_paid ? '✅ Paid' : '⏳ Unpaid'}
                                            </span>
                                        </div>
                                        <div className="ord-detail-row">
                                            <span className="ord-detail-label">Method</span>
                                            <span>{selectedOrder.payment_method || '—'}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="ord-detail-card">
                                    <h3 className="ord-detail-card-title"><Users size={16} /> Customer</h3>
                                    <div className="ord-detail-rows">
                                        <div className="ord-detail-row">
                                            <span className="ord-detail-label">Name</span>
                                            <span>{selectedOrder.user?.first_name} {selectedOrder.user?.last_name}</span>
                                        </div>
                                        <div className="ord-detail-row">
                                            <span className="ord-detail-label">Email</span>
                                            <span>{selectedOrder.user?.email || '—'}</span>
                                        </div>
                                        <div className="ord-detail-row">
                                            <span className="ord-detail-label">Phone</span>
                                            <span>{selectedOrder.user?.phone || '—'}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="ord-detail-card">
                                    <h3 className="ord-detail-card-title"><IndianRupee size={16} /> Financials</h3>
                                    <div className="ord-detail-rows">
                                        <div className="ord-detail-row">
                                            <span className="ord-detail-label">Subtotal</span>
                                            <span>{formatCurrency(selectedOrder.subtotal)}</span>
                                        </div>
                                        <div className="ord-detail-row">
                                            <span className="ord-detail-label">Tax</span>
                                            <span>{formatCurrency(selectedOrder.tax_total)}</span>
                                        </div>
                                        <div className="ord-detail-row">
                                            <span className="ord-detail-label">Shipping</span>
                                            <span>{formatCurrency(selectedOrder.shipping_total)}</span>
                                        </div>
                                        <div className="ord-detail-row">
                                            <span className="ord-detail-label">Discount</span>
                                            <span className="ord-detail-discount">-{formatCurrency(selectedOrder.discount_total)}</span>
                                        </div>
                                        <div className="ord-detail-row ord-detail-total">
                                            <span className="ord-detail-label">Total</span>
                                            <span className="ord-detail-total-val">{formatCurrency(selectedOrder.total_amount)}</span>
                                        </div>
                                    </div>
                                </div>

                                {selectedOrder.shipping_address && (
                                    <div className="ord-detail-card">
                                        <h3 className="ord-detail-card-title"><Truck size={16} /> Shipping Address</h3>
                                        <p className="ord-address-text">
                                            {selectedOrder.shipping_address.address_line_1}<br />
                                            {selectedOrder.shipping_address.address_line_2 && <>{selectedOrder.shipping_address.address_line_2}<br /></>}
                                            {selectedOrder.shipping_address.city}, {selectedOrder.shipping_address.state} {selectedOrder.shipping_address.postal_code}<br />
                                            {selectedOrder.shipping_address.country}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {selectedOrder.items && selectedOrder.items.length > 0 && (
                                <div className="ord-items-section">
                                    <h3 className="ord-detail-card-title"><Package size={16} /> Order Items ({selectedOrder.items.length})</h3>
                                    <table className="ord-items-tbl">
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
                                                    <td className="ord-item-name">{item.product?.name || item.product_name || '—'}</td>
                                                    <td><code className="ord-sku-code">{item.product?.sku || '—'}</code></td>
                                                    <td>{item.quantity}</td>
                                                    <td>{formatCurrency(item.unit_price)}</td>
                                                    <td className="ord-item-total">{formatCurrency(item.total_price)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* Actions */}
                            {VALID_TRANSITIONS[selectedOrder.status]?.length > 0 && (
                                <div className="ord-modal-actions">
                                    <button className="ord-btn-cancel" onClick={() => setShowModal(false)}>Close</button>
                                    <button
                                        className="ord-btn-confirm"
                                        onClick={() => {
                                            setShowModal(false);
                                            openTransitionModal(selectedOrder);
                                        }}
                                    >
                                        <ArrowRightLeft size={16} />
                                        Update Status
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ═══════ STATUS TRANSITION MODAL ═══════ */}
            {showTransitionModal && transitionOrder && (
                <div className="ord-modal-overlay" onClick={() => setShowTransitionModal(false)}>
                    <div className="ord-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="ord-modal-header">
                            <h2>Update Order #{transitionOrder.id}</h2>
                            <button className="ord-modal-close" onClick={() => setShowTransitionModal(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="ord-modal-body">
                            <div className="ord-transition-current">
                                <span className="ord-detail-label">Current Status</span>
                                <span
                                    className="ord-status-badge"
                                    style={{
                                        background: STATUS_CONFIG[transitionOrder.status]?.bg,
                                        color: STATUS_CONFIG[transitionOrder.status]?.color,
                                    }}
                                >
                                    {React.createElement(STATUS_CONFIG[transitionOrder.status]?.icon || Package, { size: 13 })}
                                    {transitionOrder.status}
                                </span>
                            </div>

                            <div className="ord-form-group">
                                <label className="ord-form-label">New Status</label>
                                <div className="ord-transition-options">
                                    {VALID_TRANSITIONS[transitionOrder.status]?.map(s => {
                                        const cfg = STATUS_CONFIG[s];
                                        const Icon = cfg?.icon || Package;
                                        return (
                                            <button
                                                key={s}
                                                className={`ord-transition-btn ${newStatus === s ? 'ord-transition-btn-active' : ''}`}
                                                onClick={() => setNewStatus(s)}
                                                style={newStatus === s ? { background: cfg?.bg, color: cfg?.color, borderColor: cfg?.color } : {}}
                                            >
                                                <Icon size={16} /> {s}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="ord-form-group">
                                <label className="ord-form-label">Note (optional)</label>
                                <textarea
                                    value={transitionNote}
                                    onChange={(e) => setTransitionNote(e.target.value)}
                                    placeholder="Add a note..."
                                    className="ord-form-textarea"
                                    rows={3}
                                />
                            </div>

                            <div className="ord-modal-actions">
                                <button className="ord-btn-cancel" onClick={() => setShowTransitionModal(false)}>Cancel</button>
                                <button className="ord-btn-confirm" onClick={handleTransition} disabled={!newStatus}>
                                    <ArrowRightLeft size={16} /> Update Status
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Orders;
