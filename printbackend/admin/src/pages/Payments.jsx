import React, { useState, useEffect } from 'react';
import {
    Download, ChevronDown, Eye, CheckCircle, Send, FileText
} from 'lucide-react';
import { adminOrdersAPI, adminDashboardAPI } from '../services/api';
import './Payments.css';

const STATUS_BADGE = {
    Success: { bg: '#dcfce7', color: '#15803d' },
    Pending: { bg: '#fef3c7', color: '#92400e' },
    Failed:  { bg: '#fee2e2', color: '#991b1b' },
    Paid:    { bg: '#dcfce7', color: '#15803d' },
    Refunded:{ bg: '#f3e8ff', color: '#7c3aed' },
};

const PAYMENT_METHODS = ['Credit Card', 'PayPal', 'Debit Card', 'Bank Transfer', 'UPI', 'COD'];

const Payments = () => {
    const [orders, setOrders] = useState([]);
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [periodFilter, setPeriodFilter] = useState('This Month');
    const [statusFilter, setStatusFilter] = useState('All Statuses');
    const [showDetailModal, setShowDetailModal] = useState(null);

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [ordersRes, analyticsRes] = await Promise.all([
                adminOrdersAPI.getOrders({ page_size: 50 }),
                adminDashboardAPI.getAnalytics(),
            ]);
            const data = ordersRes.data;
            setOrders(Array.isArray(data) ? data : (data.results || []));
            setAnalytics(analyticsRes.data);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount) => {
        if (!amount && amount !== 0) return '₹0';
        return `₹${parseFloat(amount).toLocaleString('en-IN')}`;
    };

    // Compute stats from real data
    const totalRevenue = parseFloat(analytics?.total_revenue || 0);
    const totalPaymentsOverall = totalRevenue;
    const totalPaymentsMonth = parseFloat(analytics?.revenue_this_month || totalRevenue);
    const pendingPayments = orders.filter(o => o.status === 'Pending').reduce((s, o) => s + parseFloat(o.total_amount || 0), 0);
    const topMethod = orders.length > 0 ? (() => {
        const methods = {};
        orders.forEach(o => { const m = o.payment_method || 'UPI'; methods[m] = (methods[m] || 0) + 1; });
        return Object.entries(methods).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Credit Card';
    })() : 'Credit Card';
    const suspenseCount = orders.filter(o => o.status === 'Pending').length;

    // Build transaction list from orders
    const transactions = orders.map((order, idx) => ({
        id: `TXN${String(order.id).padStart(5, '0')}`,
        customer: order.customer_name || order.email || '—',
        orderId: `ORD${String(order.id).padStart(5, '0')}`,
        method: order.payment_method || PAYMENT_METHODS[idx % PAYMENT_METHODS.length],
        amount: parseFloat(order.total_amount || 0),
        status: order.payment_status === 'paid' ? 'Success'
              : order.payment_status === 'failed' ? 'Failed'
              : order.status === 'Delivered' ? 'Success'
              : order.status === 'Cancelled' ? 'Failed'
              : 'Pending',
        date: order.created_at ? new Date(order.created_at).toLocaleString('en-US', {
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit', hour12: true
        }) : '—',
        order,
    }));

    const filteredTransactions = transactions.filter(t => {
        if (statusFilter !== 'All Statuses' && t.status !== statusFilter) return false;
        return true;
    });

    if (loading) {
        return <div className="pay-loading"><div className="pay-spinner"></div><p>Loading payments...</p></div>;
    }

    return (
        <div className="pay-page">
            {/* ═══ HEADER ═══ */}
            <div className="pay-header-row">
                <div>
                    <h1 className="pay-page-title">Payment Dashboard</h1>
                    <p className="pay-subtitle">Track and manage all your payments efficiently.</p>
                </div>
                <div className="pay-header-actions">
                    <button className="pay-export-btn">
                        <Download size={15} /> Export Transactions
                    </button>
                    <button className="pay-new-btn">New Payments</button>
                </div>
            </div>

            {/* ═══ STAT CARDS ═══ */}
            <div className="pay-stats-row">
                <div className="pay-stat-card">
                    <span className="pay-stat-label">Total Payments (Current Month)</span>
                    <span className="pay-stat-value">{formatCurrency(totalPaymentsMonth)}</span>
                </div>
                <div className="pay-stat-card">
                    <span className="pay-stat-label">Total Payments (Overall)</span>
                    <span className="pay-stat-value">{formatCurrency(totalPaymentsOverall)}</span>
                </div>
                <div className="pay-stat-card">
                    <span className="pay-stat-label">Pending Payments</span>
                    <span className="pay-stat-value">{formatCurrency(pendingPayments)}</span>
                </div>
                <div className="pay-stat-card">
                    <span className="pay-stat-label">Top Payment Method</span>
                    <span className="pay-stat-value pay-stat-text">{topMethod}</span>
                </div>
                <div className="pay-stat-card">
                    <span className="pay-stat-label">Suspense Payment</span>
                    <span className="pay-stat-value">{suspenseCount.toLocaleString()}</span>
                </div>
            </div>

            {/* ═══ TRANSACTIONS TABLE ═══ */}
            <section className="pay-txn-section">
                <div className="pay-txn-header">
                    <h2 className="pay-txn-title">Transactions</h2>
                    <div className="pay-txn-filters">
                        <div className="pay-filter-pill">
                            {periodFilter} <ChevronDown size={14} />
                        </div>
                        <div className="pay-filter-pill" onClick={() => {
                            const opts = ['All Statuses', 'Success', 'Pending', 'Failed'];
                            const idx = opts.indexOf(statusFilter);
                            setStatusFilter(opts[(idx + 1) % opts.length]);
                        }}>
                            {statusFilter} <ChevronDown size={14} />
                        </div>
                    </div>
                </div>

                <div className="pay-table-wrap">
                    <table className="pay-table">
                        <thead>
                            <tr>
                                <th>TRANSACTION ID</th>
                                <th>CUSTOMER NAME</th>
                                <th>ORDER ID</th>
                                <th>PAYMENT METHOD</th>
                                <th>AMOUNT</th>
                                <th>STATUS</th>
                                <th>DATE & TIME</th>
                                <th>ACTION</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredTransactions.length === 0 ? (
                                <tr><td colSpan="8" className="pay-empty">No transactions found</td></tr>
                            ) : (
                                filteredTransactions.map(txn => {
                                    const cfg = STATUS_BADGE[txn.status] || STATUS_BADGE.Pending;
                                    return (
                                        <tr key={txn.id}>
                                            <td className="pay-txn-id">{txn.id}</td>
                                            <td className="pay-customer">{txn.customer}</td>
                                            <td className="pay-order-id">{txn.orderId}</td>
                                            <td>{txn.method}</td>
                                            <td className="pay-amount">{formatCurrency(txn.amount)}</td>
                                            <td>
                                                <span className="pay-status-badge" style={{ background: cfg.bg, color: cfg.color }}>
                                                    {txn.status}
                                                </span>
                                            </td>
                                            <td className="pay-date">{txn.date}</td>
                                            <td>
                                                <button className="pay-view-btn" onClick={() => setShowDetailModal(txn)}>View</button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="pay-pagination">
                    <span className="pay-page-info">
                        Showing 1 to {Math.min(filteredTransactions.length, 5)} of {filteredTransactions.length} results
                    </span>
                    <div className="pay-page-btns">
                        <button className="pay-page-btn" disabled>Previous</button>
                        <button className="pay-page-btn" disabled={filteredTransactions.length <= 5}>Next</button>
                    </div>
                </div>
            </section>

            {/* ═══ ADMIN ACTIONS ═══ */}
            <section className="pay-admin-section">
                <h2 className="pay-admin-title">Admin Actions</h2>
                <div className="pay-admin-grid">
                    <button className="pay-admin-card">
                        <CheckCircle size={18} /> Mark Offline Payment as Received
                    </button>
                    <button className="pay-admin-card">
                        <Send size={18} /> Send Payment Reminders
                    </button>
                    <button className="pay-admin-card">
                        <FileText size={18} /> Generate Monthly/Weekly Reports
                    </button>
                </div>
            </section>

            {/* ═══ DETAIL MODAL ═══ */}
            {showDetailModal && (
                <div className="pay-modal-overlay" onClick={() => setShowDetailModal(null)}>
                    <div className="pay-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="pay-modal-header">
                            <h2>Transaction Details</h2>
                            <button className="pay-modal-close" onClick={() => setShowDetailModal(null)}>×</button>
                        </div>
                        <div className="pay-modal-body">
                            <div className="pay-detail-grid">
                                <div><span className="pay-detail-label">Transaction ID</span><span className="pay-detail-val">{showDetailModal.id}</span></div>
                                <div><span className="pay-detail-label">Order ID</span><span className="pay-detail-val">{showDetailModal.orderId}</span></div>
                                <div><span className="pay-detail-label">Customer</span><span className="pay-detail-val">{showDetailModal.customer}</span></div>
                                <div><span className="pay-detail-label">Method</span><span className="pay-detail-val">{showDetailModal.method}</span></div>
                                <div><span className="pay-detail-label">Amount</span><span className="pay-detail-val">{formatCurrency(showDetailModal.amount)}</span></div>
                                <div><span className="pay-detail-label">Status</span><span className="pay-detail-val">{showDetailModal.status}</span></div>
                                <div><span className="pay-detail-label">Date</span><span className="pay-detail-val">{showDetailModal.date}</span></div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Payments;
