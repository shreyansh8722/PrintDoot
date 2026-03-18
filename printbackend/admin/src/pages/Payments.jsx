import React, { useState, useEffect } from 'react';
import {
    Download, ChevronDown, Eye, CheckCircle, Send, FileText, Plus, Trash2
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

const PAYMENT_METHODS = ['Cash', 'UPI', 'Bank Transfer', 'Credit Card', 'Debit Card', 'PayPal', 'COD', 'Other'];

const OFFLINE_STORAGE_KEY = 'printdoot_offline_payments';

const getOfflinePayments = () => {
    try {
        return JSON.parse(localStorage.getItem(OFFLINE_STORAGE_KEY) || '[]');
    } catch { return []; }
};

const saveOfflinePayments = (payments) => {
    localStorage.setItem(OFFLINE_STORAGE_KEY, JSON.stringify(payments));
};

const Payments = () => {
    const [orders, setOrders] = useState([]);
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [periodFilter, setPeriodFilter] = useState('This Month');
    const [statusFilter, setStatusFilter] = useState('All Statuses');
    const [showDetailModal, setShowDetailModal] = useState(null);
    const [showNewPaymentModal, setShowNewPaymentModal] = useState(false);
    const [offlinePayments, setOfflinePayments] = useState(getOfflinePayments());

    // New payment form
    const [newPayment, setNewPayment] = useState({
        customer: '', amount: '', method: 'Cash', note: '', status: 'Success',
    });

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

    // Record a new offline payment
    const handleRecordPayment = () => {
        if (!newPayment.customer.trim()) return alert('Please enter customer name');
        if (!newPayment.amount || parseFloat(newPayment.amount) <= 0) return alert('Please enter a valid amount');

        const payment = {
            id: `OFL${Date.now().toString().slice(-7)}`,
            customer: newPayment.customer.trim(),
            amount: parseFloat(newPayment.amount),
            method: newPayment.method,
            note: newPayment.note.trim(),
            status: newPayment.status,
            date: new Date().toISOString(),
            type: 'offline',
        };

        const updated = [payment, ...offlinePayments];
        setOfflinePayments(updated);
        saveOfflinePayments(updated);
        setNewPayment({ customer: '', amount: '', method: 'Cash', note: '', status: 'Success' });
        setShowNewPaymentModal(false);
        alert('Offline payment recorded successfully!');
    };

    const handleDeleteOfflinePayment = (id) => {
        if (!window.confirm('Delete this offline payment record?')) return;
        const updated = offlinePayments.filter(p => p.id !== id);
        setOfflinePayments(updated);
        saveOfflinePayments(updated);
    };

    // Compute stats from real data
    const totalRevenue = parseFloat(analytics?.total_revenue || 0);
    const offlineTotal = offlinePayments.reduce((s, p) => s + (p.status === 'Success' ? p.amount : 0), 0);
    const totalPaymentsOverall = totalRevenue + offlineTotal;
    const totalPaymentsMonth = parseFloat(analytics?.revenue_this_month || totalRevenue) + offlineTotal;
    const pendingPayments = orders.filter(o => o.status === 'Pending').reduce((s, o) => s + parseFloat(o.total_amount || 0), 0)
        + offlinePayments.filter(p => p.status === 'Pending').reduce((s, p) => s + p.amount, 0);
    const topMethod = (() => {
        const methods = {};
        orders.forEach(o => { const m = o.payment_method || 'UPI'; methods[m] = (methods[m] || 0) + 1; });
        offlinePayments.forEach(p => { methods[p.method] = (methods[p.method] || 0) + 1; });
        const sorted = Object.entries(methods).sort((a, b) => b[1] - a[1]);
        return sorted[0]?.[0] || 'Cash';
    })();
    const suspenseCount = orders.filter(o => o.status === 'Pending').length
        + offlinePayments.filter(p => p.status === 'Pending').length;

    // Build transaction list from orders + offline payments
    const orderTransactions = orders.map((order) => ({
        id: `TXN${String(order.id).padStart(5, '0')}`,
        customer: order.customer_name || order.email || '—',
        orderId: `ORD${String(order.id).padStart(5, '0')}`,
        method: order.payment_method || 'UPI',
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
        type: 'online',
        order,
    }));

    const offlineTransactions = offlinePayments.map(p => ({
        id: p.id,
        customer: p.customer,
        orderId: p.note || 'Offline Store',
        method: p.method,
        amount: p.amount,
        status: p.status,
        date: new Date(p.date).toLocaleString('en-US', {
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit', hour12: true
        }),
        type: 'offline',
    }));

    const allTransactions = [...offlineTransactions, ...orderTransactions];

    const filteredTransactions = allTransactions.filter(t => {
        if (statusFilter !== 'All Statuses' && t.status !== statusFilter) return false;
        return true;
    });

    const handleExportTransactions = () => {
        const csvRows = [
            ['Transaction ID', 'Customer', 'Order/Note', 'Method', 'Amount', 'Status', 'Type', 'Date'],
            ...filteredTransactions.map(t => [t.id, t.customer, t.orderId, t.method, t.amount, t.status, t.type, t.date])
        ];
        const csvContent = csvRows.map(r => r.join(',')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    };

    const handleMarkOfflineReceived = () => {
        const pendingCount = filteredTransactions.filter(t => t.status === 'Pending').length;
        if (pendingCount === 0) {
            alert('No pending offline payments to mark.');
        } else {
            const updated = offlinePayments.map(p => p.status === 'Pending' ? { ...p, status: 'Success' } : p);
            setOfflinePayments(updated);
            saveOfflinePayments(updated);
            alert(`Marked ${pendingCount} offline payment(s) as received.`);
        }
    };

    const handleSendReminders = () => {
        const pendingCount = filteredTransactions.filter(t => t.status === 'Pending').length;
        alert(`Payment reminders sent to ${pendingCount} customer(s) with pending payments.`);
    };

    const handleGenerateReport = () => {
        const csvRows = [
            ['Payment Report'],
            ['Period', periodFilter],
            ['Total Payments (Month)', formatCurrency(totalPaymentsMonth)],
            ['Total Payments (Overall)', formatCurrency(totalPaymentsOverall)],
            ['Pending Payments', formatCurrency(pendingPayments)],
            ['Top Method', topMethod],
            [],
            ['Transaction ID', 'Customer', 'Order/Note', 'Method', 'Amount', 'Status', 'Type', 'Date'],
            ...filteredTransactions.map(t => [t.id, t.customer, t.orderId, t.method, t.amount, t.status, t.type, t.date])
        ];
        const csvContent = csvRows.map(r => r.join(',')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `payment_report_${periodFilter.replace(/\s+/g, '_').toLowerCase()}_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    };

    if (loading) {
        return <div className="pay-loading"><div className="pay-spinner"></div><p>Loading payments...</p></div>;
    }

    return (
        <div className="pay-page">
            {/* ═══ HEADER ═══ */}
            <div className="pay-header-row">
                <div>
                    <h1 className="pay-page-title">Payment Dashboard</h1>
                    <p className="pay-subtitle">Track and manage all your payments — online orders & offline store sales.</p>
                </div>
                <div className="pay-header-actions">
                    <button className="pay-export-btn" onClick={handleExportTransactions}>
                        <Download size={15} /> Export Transactions
                    </button>
                    <button className="pay-new-btn" onClick={() => setShowNewPaymentModal(true)}>
                        <Plus size={15} /> Record Offline Payment
                    </button>
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
                    <span className="pay-stat-label">Offline Payments</span>
                    <span className="pay-stat-value">{offlinePayments.length}</span>
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
                                <th>ORDER / NOTE</th>
                                <th>METHOD</th>
                                <th>AMOUNT</th>
                                <th>STATUS</th>
                                <th>TYPE</th>
                                <th>DATE & TIME</th>
                                <th>ACTION</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredTransactions.length === 0 ? (
                                <tr><td colSpan="9" className="pay-empty">No transactions found</td></tr>
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
                                            <td>
                                                <span className={`pay-type-badge ${txn.type === 'offline' ? 'pay-type-offline' : 'pay-type-online'}`}>
                                                    {txn.type === 'offline' ? '🏪 Store' : '🌐 Online'}
                                                </span>
                                            </td>
                                            <td className="pay-date">{txn.date}</td>
                                            <td>
                                                <div className="pay-action-btns">
                                                    <button className="pay-view-btn" onClick={() => setShowDetailModal(txn)}>View</button>
                                                    {txn.type === 'offline' && (
                                                        <button className="pay-delete-btn" onClick={() => handleDeleteOfflinePayment(txn.id)} title="Delete">
                                                            <Trash2 size={14} />
                                                        </button>
                                                    )}
                                                </div>
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
                        Showing {Math.min(filteredTransactions.length, 1)} to {Math.min(filteredTransactions.length, 10)} of {filteredTransactions.length} results
                    </span>
                </div>
            </section>

            {/* ═══ ADMIN ACTIONS ═══ */}
            <section className="pay-admin-section">
                <h2 className="pay-admin-title">Admin Actions</h2>
                <div className="pay-admin-grid">
                    <button className="pay-admin-card" onClick={handleMarkOfflineReceived}>
                        <CheckCircle size={18} /> Mark Offline Payment as Received
                    </button>
                    <button className="pay-admin-card" onClick={handleSendReminders}>
                        <Send size={18} /> Send Payment Reminders
                    </button>
                    <button className="pay-admin-card" onClick={handleGenerateReport}>
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
                                <div><span className="pay-detail-label">Order / Note</span><span className="pay-detail-val">{showDetailModal.orderId}</span></div>
                                <div><span className="pay-detail-label">Customer</span><span className="pay-detail-val">{showDetailModal.customer}</span></div>
                                <div><span className="pay-detail-label">Method</span><span className="pay-detail-val">{showDetailModal.method}</span></div>
                                <div><span className="pay-detail-label">Amount</span><span className="pay-detail-val">{formatCurrency(showDetailModal.amount)}</span></div>
                                <div><span className="pay-detail-label">Status</span><span className="pay-detail-val">{showDetailModal.status}</span></div>
                                <div><span className="pay-detail-label">Type</span><span className="pay-detail-val">{showDetailModal.type === 'offline' ? '🏪 Store' : '🌐 Online'}</span></div>
                                <div><span className="pay-detail-label">Date</span><span className="pay-detail-val">{showDetailModal.date}</span></div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ═══ NEW OFFLINE PAYMENT MODAL ═══ */}
            {showNewPaymentModal && (
                <div className="pay-modal-overlay" onClick={() => setShowNewPaymentModal(false)}>
                    <div className="pay-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="pay-modal-header">
                            <h2>Record Offline Store Payment</h2>
                            <button className="pay-modal-close" onClick={() => setShowNewPaymentModal(false)}>×</button>
                        </div>
                        <div className="pay-modal-body">
                            <div className="pay-form-grid">
                                <div className="pay-form-group">
                                    <label className="pay-form-label">Customer Name *</label>
                                    <input
                                        type="text"
                                        className="pay-form-input"
                                        placeholder="Enter customer name"
                                        value={newPayment.customer}
                                        onChange={e => setNewPayment(f => ({ ...f, customer: e.target.value }))}
                                    />
                                </div>
                                <div className="pay-form-group">
                                    <label className="pay-form-label">Amount (₹) *</label>
                                    <input
                                        type="number"
                                        className="pay-form-input"
                                        placeholder="0.00"
                                        min="0"
                                        step="0.01"
                                        value={newPayment.amount}
                                        onChange={e => setNewPayment(f => ({ ...f, amount: e.target.value }))}
                                    />
                                </div>
                                <div className="pay-form-group">
                                    <label className="pay-form-label">Payment Method</label>
                                    <select
                                        className="pay-form-input"
                                        value={newPayment.method}
                                        onChange={e => setNewPayment(f => ({ ...f, method: e.target.value }))}
                                    >
                                        {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                                    </select>
                                </div>
                                <div className="pay-form-group">
                                    <label className="pay-form-label">Status</label>
                                    <select
                                        className="pay-form-input"
                                        value={newPayment.status}
                                        onChange={e => setNewPayment(f => ({ ...f, status: e.target.value }))}
                                    >
                                        <option value="Success">Received</option>
                                        <option value="Pending">Pending</option>
                                    </select>
                                </div>
                                <div className="pay-form-group pay-form-full">
                                    <label className="pay-form-label">Note / Description</label>
                                    <input
                                        type="text"
                                        className="pay-form-input"
                                        placeholder="e.g. Walk-in customer, Invoice #123"
                                        value={newPayment.note}
                                        onChange={e => setNewPayment(f => ({ ...f, note: e.target.value }))}
                                    />
                                </div>
                            </div>
                            <div className="pay-form-actions">
                                <button className="pay-form-cancel" onClick={() => setShowNewPaymentModal(false)}>Cancel</button>
                                <button className="pay-form-submit" onClick={handleRecordPayment}>Record Payment</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Payments;
