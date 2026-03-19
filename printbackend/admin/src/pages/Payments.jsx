import React, { useState, useEffect } from 'react';
import {
    Download, ChevronDown, CheckCircle, Send, FileText, Plus, Trash2
} from 'lucide-react';
import { adminOrdersAPI, adminDashboardAPI, adminOfflinePaymentAPI } from '../services/api';
import './Payments.css';

const STATUS_BADGE = {
    Success: { bg: '#dcfce7', color: '#15803d' },
    Pending: { bg: '#fef3c7', color: '#92400e' },
    Failed:  { bg: '#fee2e2', color: '#991b1b' },
    Paid:    { bg: '#dcfce7', color: '#15803d' },
    Refunded:{ bg: '#f3e8ff', color: '#7c3aed' },
    received:{ bg: '#dcfce7', color: '#15803d' },
    pending: { bg: '#fef3c7', color: '#92400e' },
};

const PAYMENT_METHODS = [
    { value: 'cash', label: 'Cash' },
    { value: 'upi', label: 'UPI' },
    { value: 'bank_transfer', label: 'Bank Transfer' },
    { value: 'credit_card', label: 'Credit Card' },
    { value: 'debit_card', label: 'Debit Card' },
    { value: 'cheque', label: 'Cheque' },
    { value: 'other', label: 'Other' },
];

const Payments = () => {
    const [orders, setOrders] = useState([]);
    const [offlinePayments, setOfflinePayments] = useState([]);
    const [analytics, setAnalytics] = useState(null);
    const [offlineStats, setOfflineStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [periodFilter, setPeriodFilter] = useState('This Month');
    const [statusFilter, setStatusFilter] = useState('All Statuses');
    const [showDetailModal, setShowDetailModal] = useState(null);
    const [showNewPaymentModal, setShowNewPaymentModal] = useState(false);
    const [saving, setSaving] = useState(false);

    const [newPayment, setNewPayment] = useState({
        customer_name: '', amount: '', gst_amount: '', payment_method: 'cash', note: '', status: 'received',
    });

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [ordersRes, analyticsRes, offlineRes, offlineStatsRes] = await Promise.all([
                adminOrdersAPI.getOrders({ page_size: 50 }),
                adminDashboardAPI.getAnalytics(),
                adminOfflinePaymentAPI.getPayments(),
                adminOfflinePaymentAPI.getStats(),
            ]);
            const data = ordersRes.data;
            setOrders(Array.isArray(data) ? data : (data.results || []));
            setAnalytics(analyticsRes.data);
            const offData = offlineRes.data;
            setOfflinePayments(Array.isArray(offData) ? offData : (offData.results || []));
            setOfflineStats(offlineStatsRes.data);
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

    const handleRecordPayment = async () => {
        if (!newPayment.customer_name.trim()) return alert('Please enter customer name');
        if (!newPayment.amount || parseFloat(newPayment.amount) <= 0) return alert('Please enter a valid amount');

        try {
            setSaving(true);
            await adminOfflinePaymentAPI.createPayment({
                customer_name: newPayment.customer_name.trim(),
                amount: parseFloat(newPayment.amount),
                gst_amount: parseFloat(newPayment.gst_amount) || 0,
                payment_method: newPayment.payment_method,
                status: newPayment.status,
                note: newPayment.note.trim(),
            });
            setNewPayment({ customer_name: '', amount: '', gst_amount: '', payment_method: 'cash', note: '', status: 'received' });
            setShowNewPaymentModal(false);
            fetchData();
            alert('Offline payment recorded successfully!');
        } catch (error) {
            console.error('Error recording payment:', error);
            alert('Failed to record payment: ' + (error.response?.data?.detail || error.message));
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteOfflinePayment = async (id) => {
        if (!window.confirm('Delete this offline payment record?')) return;
        try {
            await adminOfflinePaymentAPI.deletePayment(id);
            fetchData();
        } catch (error) {
            console.error('Error deleting payment:', error);
            alert('Failed to delete payment');
        }
    };

    // Stats
    const totalRevenue = parseFloat(analytics?.total_revenue || 0);
    const offlineTotal = parseFloat(offlineStats?.total_amount || 0);
    const totalPaymentsOverall = totalRevenue + offlineTotal;
    const totalPaymentsMonth = parseFloat(analytics?.revenue_this_month || totalRevenue) + offlineTotal;
    const pendingPayments = orders.filter(o => o.status === 'Pending').reduce((s, o) => s + parseFloat(o.total_amount || 0), 0)
        + offlinePayments.filter(p => p.status === 'pending').reduce((s, p) => s + parseFloat(p.amount || 0), 0);
    const topMethod = (() => {
        const methods = {};
        orders.forEach(o => { const m = o.payment_method || 'UPI'; methods[m] = (methods[m] || 0) + 1; });
        offlinePayments.forEach(p => { const m = p.method_display || p.payment_method; methods[m] = (methods[m] || 0) + 1; });
        const sorted = Object.entries(methods).sort((a, b) => b[1] - a[1]);
        return sorted[0]?.[0] || 'Cash';
    })();

    // Build unified transaction list
    const orderTransactions = orders.map(order => ({
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
    }));

    const offlineTransactions = offlinePayments.map(p => ({
        id: p.id,
        customer: p.customer_name,
        orderId: p.note || 'Offline Store',
        method: p.method_display || p.payment_method,
        amount: parseFloat(p.amount),
        status: p.status_display || (p.status === 'received' ? 'Success' : 'Pending'),
        rawStatus: p.status,
        date: new Date(p.created_at).toLocaleString('en-US', {
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

    const handleGenerateReport = () => {
        const csvRows = [
            ['Payment Report'],
            ['Period', periodFilter],
            ['Total Payments', formatCurrency(totalPaymentsOverall)],
            ['Offline Payments', formatCurrency(offlineTotal)],
            ['Pending Payments', formatCurrency(pendingPayments)],
            [],
            ['Transaction ID', 'Customer', 'Order/Note', 'Method', 'Amount', 'Status', 'Type', 'Date'],
            ...filteredTransactions.map(t => [t.id, t.customer, t.orderId, t.method, t.amount, t.status, t.type, t.date])
        ];
        const csvContent = csvRows.map(r => r.join(',')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `payment_report_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    };

    if (loading) {
        return <div className="pay-loading"><div className="pay-spinner"></div><p>Loading payments...</p></div>;
    }

    return (
        <div className="pay-page">
            <div className="pay-header-row">
                <div>
                    <h1 className="pay-page-title">Payment Dashboard</h1>
                    <p className="pay-subtitle">Track and manage all payments — online orders & offline store sales.</p>
                </div>
                <div className="pay-header-actions">
                    <button className="pay-export-btn" onClick={handleExportTransactions}>
                        <Download size={15} /> Export
                    </button>
                    <button className="pay-new-btn" onClick={() => setShowNewPaymentModal(true)}>
                        <Plus size={15} /> Record Offline Payment
                    </button>
                </div>
            </div>

            <div className="pay-stats-row">
                <div className="pay-stat-card">
                    <span className="pay-stat-label">Total Payments (Month)</span>
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
                    <span className="pay-stat-label">Top Method</span>
                    <span className="pay-stat-value pay-stat-text">{topMethod}</span>
                </div>
                <div className="pay-stat-card">
                    <span className="pay-stat-label">Offline Records</span>
                    <span className="pay-stat-value">{offlineStats?.total || offlinePayments.length}</span>
                </div>
            </div>

            <section className="pay-txn-section">
                <div className="pay-txn-header">
                    <h2 className="pay-txn-title">Transactions</h2>
                    <div className="pay-txn-filters">
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
                                <th>ID</th>
                                <th>CUSTOMER</th>
                                <th>ORDER / NOTE</th>
                                <th>METHOD</th>
                                <th>AMOUNT</th>
                                <th>STATUS</th>
                                <th>TYPE</th>
                                <th>DATE</th>
                                <th>ACTION</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredTransactions.length === 0 ? (
                                <tr><td colSpan="9" className="pay-empty">No transactions found</td></tr>
                            ) : (
                                filteredTransactions.map(txn => {
                                    const cfg = STATUS_BADGE[txn.status] || STATUS_BADGE[txn.rawStatus] || STATUS_BADGE.Pending;
                                    return (
                                        <tr key={`${txn.type}-${txn.id}`}>
                                            <td className="pay-txn-id">{txn.type === 'offline' ? `OFL-${txn.id}` : txn.id}</td>
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
            </section>

            <section className="pay-admin-section">
                <h2 className="pay-admin-title">Admin Actions</h2>
                <div className="pay-admin-grid">
                    <button className="pay-admin-card" onClick={handleExportTransactions}>
                        <Send size={18} /> Export All Transactions
                    </button>
                    <button className="pay-admin-card" onClick={handleGenerateReport}>
                        <FileText size={18} /> Generate Report
                    </button>
                </div>
            </section>

            {showDetailModal && (
                <div className="pay-modal-overlay" onClick={() => setShowDetailModal(null)}>
                    <div className="pay-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="pay-modal-header">
                            <h2>Transaction Details</h2>
                            <button className="pay-modal-close" onClick={() => setShowDetailModal(null)}>×</button>
                        </div>
                        <div className="pay-modal-body">
                            <div className="pay-detail-grid">
                                <div><span className="pay-detail-label">ID</span><span className="pay-detail-val">{showDetailModal.type === 'offline' ? `OFL-${showDetailModal.id}` : showDetailModal.id}</span></div>
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
                                    <input type="text" className="pay-form-input" placeholder="Enter customer name"
                                        value={newPayment.customer_name} onChange={e => setNewPayment(f => ({ ...f, customer_name: e.target.value }))} />
                                </div>
                                <div className="pay-form-group">
                                    <label className="pay-form-label">Amount (₹) *</label>
                                    <input type="number" className="pay-form-input" placeholder="0.00" min="0" step="0.01"
                                        value={newPayment.amount} onChange={e => setNewPayment(f => ({ ...f, amount: e.target.value }))} />
                                </div>
                                <div className="pay-form-group">
                                    <label className="pay-form-label">GST Amount (₹)</label>
                                    <input type="number" className="pay-form-input" placeholder="0.00" min="0" step="0.01"
                                        value={newPayment.gst_amount} onChange={e => setNewPayment(f => ({ ...f, gst_amount: e.target.value }))} />
                                    <span style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '4px', display: 'block' }}>GST collected on this transaction (included in amount)</span>
                                </div>
                                <div className="pay-form-group">
                                    <label className="pay-form-label">Payment Method</label>
                                    <select className="pay-form-input" value={newPayment.payment_method}
                                        onChange={e => setNewPayment(f => ({ ...f, payment_method: e.target.value }))}>
                                        {PAYMENT_METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                                    </select>
                                </div>
                                <div className="pay-form-group">
                                    <label className="pay-form-label">Status</label>
                                    <select className="pay-form-input" value={newPayment.status}
                                        onChange={e => setNewPayment(f => ({ ...f, status: e.target.value }))}>
                                        <option value="received">Received</option>
                                        <option value="pending">Pending</option>
                                    </select>
                                </div>
                                <div className="pay-form-group pay-form-full">
                                    <label className="pay-form-label">Note / Description</label>
                                    <input type="text" className="pay-form-input" placeholder="e.g. Walk-in customer, Invoice #123"
                                        value={newPayment.note} onChange={e => setNewPayment(f => ({ ...f, note: e.target.value }))} />
                                </div>
                            </div>
                            <div className="pay-form-actions">
                                <button className="pay-form-cancel" onClick={() => setShowNewPaymentModal(false)}>Cancel</button>
                                <button className="pay-form-submit" onClick={handleRecordPayment} disabled={saving}>
                                    {saving ? 'Saving...' : 'Record Payment'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Payments;
