import React, { useState, useEffect } from 'react';
import {
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip
} from 'recharts';
import {
    Download, FileSpreadsheet, Printer,
    ChevronLeft, ChevronRight
} from 'lucide-react';
import FilterDropdown from '../components/FilterDropdown';
import { adminDashboardAPI, adminFinanceAPI } from '../services/api';
import './Finance.css';

const PERIOD_OPTIONS = ['Last 30 Days', 'Last 7 Days', 'Last 90 Days', 'This Year'];
const BU_OPTIONS = ['All Business Units', 'Online', 'Offline', 'Wholesale'];

const ACTION_BADGE = {
    'Pricing Change':   { bg: '#dbeafe', color: '#1e40af' },
    'Stock Edit':       { bg: '#fef3c7', color: '#92400e' },
    'Discount Update':  { bg: '#dcfce7', color: '#15803d' },
    'Order Update':     { bg: '#f3e8ff', color: '#7c3aed' },
    'Refund':           { bg: '#fee2e2', color: '#991b1b' },
};

const DONUT_COLORS = ['#00897b', '#e0f2f1'];

const Finance = () => {
    const [analytics, setAnalytics] = useState(null);
    const [financeData, setFinanceData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [periodFilter, setPeriodFilter] = useState('Last 30 Days');
    const [buFilter, setBuFilter] = useState('All Business Units');

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [analyticsRes, financeRes] = await Promise.all([
                adminDashboardAPI.getAnalytics(),
                adminFinanceAPI.getSummary(),
            ]);
            setAnalytics(analyticsRes.data);
            setFinanceData(financeRes.data);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount) => {
        if (!amount) return '₹0';
        return `₹${parseFloat(amount).toLocaleString('en-IN')}`;
    };

    // ── Real data from finance API ──
    const gstOnline = parseFloat(financeData?.gst_collected_online || 0);
    const gstOffline = parseFloat(financeData?.gst_collected_offline || 0);
    const pendingSettlement = parseFloat(financeData?.pending_settlement || 0);
    const pendingSettlementCount = financeData?.pending_settlement_count || 0;
    const refundsCompleted = parseFloat(financeData?.refunds_completed || 0);
    const refundsPending = parseFloat(financeData?.refunds_pending || 0);
    const refundCount = financeData?.refund_count || 0;
    const refundedOrders = financeData?.refunded_orders || 0;
    const totalRevenueOnline = parseFloat(financeData?.total_revenue_online || 0);
    const totalRevenueOffline = parseFloat(financeData?.total_revenue_offline || 0);

    // Coupon usage tracker (from analytics)
    const totalOrders = analytics?.total_orders || 0;
    const couponRedeemed = Math.round(totalOrders * 0.3) || 0;
    const couponUnused = totalOrders - couponRedeemed;
    const couponData = [
        { name: 'Redeemed', value: couponRedeemed || 1 },
        { name: 'Unused', value: couponUnused || 1 },
    ];
    const totalDiscount = parseFloat(analytics?.expense_payment || 0);

    const handleDownloadReport = () => {
        const csvContent = `GST & Finance Summary Report\nPeriod,${periodFilter}\nBusiness Unit,${buFilter}\n\nGST Collected (Online),${formatCurrency(gstOnline)}\nGST Collected (Offline),${formatCurrency(gstOffline)}\nPending Settlements,${formatCurrency(pendingSettlement)}\nRefunds Completed,${formatCurrency(refundsCompleted)}\nRefunds Pending,${formatCurrency(refundsPending)}\nTotal Revenue (Online),${formatCurrency(totalRevenueOnline)}\nTotal Revenue (Offline),${formatCurrency(totalRevenueOffline)}`;
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `finance_report_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    };

    const handleExportExcel = () => {
        handleDownloadReport();
    };

    const handlePrintSnapshot = () => {
        window.print();
    };

    const [showSettleModal, setShowSettleModal] = useState(false);
    const [settleAmount, setSettleAmount] = useState('');
    const [settling, setSettling] = useState(false);

    const handleSettle = () => {
        // Pre-fill with total pending amount
        setSettleAmount(pendingSettlement > 0 ? pendingSettlement.toFixed(2) : '');
        setShowSettleModal(true);
    };

    const confirmSettle = async () => {
        const amount = parseFloat(settleAmount);
        if (!amount || amount <= 0) {
            alert('Please enter a valid amount greater than 0');
            return;
        }
        if (amount > pendingSettlement) {
            alert(`Settlement amount (₹${amount}) cannot exceed pending amount (₹${pendingSettlement.toFixed(2)})`);
            return;
        }
        setSettling(true);
        try {
            const res = await adminFinanceAPI.settlePending(amount);
            alert(res.data.message || `Successfully settled ₹${amount}`);
            setShowSettleModal(false);
            setSettleAmount('');
            // Refresh data to update pending and total sales
            fetchData();
        } catch (error) {
            alert('Settlement failed: ' + (error.response?.data?.error || error.message));
        } finally {
            setSettling(false);
        }
    };

    if (loading) {
        return <div className="fin-loading"><div className="fin-spinner"></div><p>Loading finance data...</p></div>;
    }

    return (
        <div className="fin-page">
            {/* ═══ HEADER ═══ */}
            <div className="fin-header-row">
                <h1 className="fin-page-title">Finance & Compliance Overview</h1>
                <div className="fin-header-pills">
                    <FilterDropdown
                        value={periodFilter}
                        options={PERIOD_OPTIONS}
                        onChange={setPeriodFilter}
                    />
                    <FilterDropdown
                        value={buFilter}
                        options={BU_OPTIONS}
                        onChange={setBuFilter}
                    />
                </div>
            </div>

            {/* ═══ MAIN GRID: GST + Coupon ═══ */}
            <div className="fin-main-grid">
                {/* LEFT column */}
                <div className="fin-left-col">
                    {/* GST Summary */}
                    <section className="fin-section">
                        <h2 className="fin-section-title">GST Summary</h2>
                        <div className="fin-gst-cards">
                            <div className="fin-gst-card">
                                <span className="fin-gst-label">GST Collected (Online)</span>
                                <span className="fin-gst-value">{formatCurrency(gstOnline)}</span>
                                <span className="fin-gst-sub">From {totalOrders} paid orders</span>
                            </div>
                            <div className="fin-gst-card">
                                <span className="fin-gst-label">GST Collected (Offline)</span>
                                <span className="fin-gst-value">{formatCurrency(gstOffline)}</span>
                                <span className="fin-gst-sub">From offline transactions</span>
                            </div>
                        </div>
                        <button className="fin-download-btn" onClick={handleDownloadReport}>
                            <Download size={15} /> Download Monthly Report
                        </button>
                        <p className="fin-note">
                            Online GST is calculated from order tax totals. Offline GST is recorded when adding offline transactions.
                        </p>
                    </section>

                    {/* Pending Settlements & Refunds */}
                    <section className="fin-section">
                        <h2 className="fin-section-title">Settlements & Refunds</h2>
                        <div className="fin-gst-cards">
                            <div className="fin-gst-card">
                                <span className="fin-gst-label">Pending Settlements</span>
                                <span className="fin-gst-value">{formatCurrency(pendingSettlement)}</span>
                                <span className="fin-gst-sub">{pendingSettlementCount} pending offline payment{pendingSettlementCount !== 1 ? 's' : ''}</span>
                            </div>
                            <div className="fin-gst-card">
                                <span className="fin-gst-label">Refunds Completed</span>
                                <span className="fin-gst-value">{formatCurrency(refundsCompleted)}</span>
                                <span className="fin-gst-sub">{refundCount} refund{refundCount !== 1 ? 's' : ''} processed</span>
                            </div>
                        </div>
                        <div className="fin-gst-cards" style={{ marginTop: '12px' }}>
                            <div className="fin-gst-card">
                                <span className="fin-gst-label">Refunds Pending</span>
                                <span className="fin-gst-value" style={{ color: '#ef4444' }}>{formatCurrency(refundsPending)}</span>
                                <span className="fin-gst-sub">{refundedOrders} refunded order{refundedOrders !== 1 ? 's' : ''}</span>
                            </div>
                            <div className="fin-gst-card">
                                <span className="fin-gst-label">Total Revenue</span>
                                <span className="fin-gst-value">{formatCurrency(totalRevenueOnline + totalRevenueOffline)}</span>
                                <span className="fin-gst-sub">Online: {formatCurrency(totalRevenueOnline)} | Offline: {formatCurrency(totalRevenueOffline)}</span>
                            </div>
                        </div>
                        <button className="fin-settle-btn" onClick={handleSettle}>Settle Now</button>
                    </section>
                </div>

                {/* RIGHT column — Coupon Usage Tracker */}
                <div className="fin-right-col">
                    <div className="fin-coupon-card">
                        <h3 className="fin-coupon-title">Coupon Usage Tracker</h3>
                        <div className="fin-coupon-donut-wrap">
                            <ResponsiveContainer width="100%" height={180}>
                                <PieChart>
                                    <Pie
                                        data={couponData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={55}
                                        outerRadius={80}
                                        paddingAngle={2}
                                        dataKey="value"
                                    >
                                        {couponData.map((entry, index) => (
                                            <Cell key={index} fill={DONUT_COLORS[index]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="fin-coupon-center">
                                <span className="fin-coupon-big">{couponRedeemed}</span>
                                <span className="fin-coupon-sub">Redeemed</span>
                            </div>
                        </div>
                        <p className="fin-coupon-note">Last 30 Days <span className="fin-green">+10%</span></p>

                        <div className="fin-coupon-stats">
                            <div className="fin-coupon-stat">
                                <span className="fin-cstat-label">Total Discount Given</span>
                                <span className="fin-cstat-value">{formatCurrency(totalDiscount)}</span>
                            </div>
                            <div className="fin-coupon-stat">
                                <span className="fin-cstat-label">Avg Order Value</span>
                                <span className="fin-cstat-value">{formatCurrency(analytics?.avg_order_value)}</span>
                            </div>
                        </div>
                        <p className="fin-coupon-tiny">Note: This section tracks the usage of coupons, including</p>
                    </div>
                </div>
            </div>

            {/* ═══ BOTTOM ACTIONS ═══ */}
            <div className="fin-bottom-actions">
                <button className="fin-action-btn fin-action-teal" onClick={handleDownloadReport}>
                    <Download size={15} /> Download Reports
                </button>
                <button className="fin-action-btn fin-action-teal" onClick={handleExportExcel}>
                    <FileSpreadsheet size={15} /> Export Excel
                </button>
                <button className="fin-action-btn fin-action-teal" onClick={handlePrintSnapshot}>
                    <Printer size={15} /> Print Snapshot
                </button>
            </div>

            {/* ═══ SETTLEMENT MODAL ═══ */}
            {showSettleModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
                }} onClick={() => setShowSettleModal(false)}>
                    <div style={{
                        background: '#fff', borderRadius: '16px', padding: '32px',
                        width: '420px', maxWidth: '90vw', boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
                    }} onClick={(e) => e.stopPropagation()}>
                        <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '4px', color: '#0f172a' }}>
                            Settle Pending Payments
                        </h2>
                        <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '20px' }}>
                            Total pending: <strong style={{ color: '#ef4444' }}>₹{pendingSettlement.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong> from {pendingSettlementCount} payment{pendingSettlementCount !== 1 ? 's' : ''}
                        </p>

                        <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>
                            Settlement Amount (₹)
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            max={pendingSettlement}
                            value={settleAmount}
                            onChange={(e) => setSettleAmount(e.target.value)}
                            style={{
                                width: '100%', padding: '12px 14px', border: '2px solid #e2e8f0',
                                borderRadius: '10px', fontSize: '16px', fontWeight: 600,
                                outline: 'none', transition: 'border-color 0.2s',
                                boxSizing: 'border-box',
                            }}
                            onFocus={(e) => e.target.style.borderColor = '#00897b'}
                            onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                            placeholder="Enter amount to settle"
                            autoFocus
                        />
                        <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '8px', marginBottom: '24px' }}>
                            This amount will be moved from Pending Settlements to Total Sales (Offline Revenue).
                        </p>

                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                            <button
                                onClick={() => setShowSettleModal(false)}
                                style={{
                                    padding: '10px 20px', border: '1px solid #e2e8f0', borderRadius: '10px',
                                    background: '#fff', color: '#64748b', fontSize: '14px', fontWeight: 600,
                                    cursor: 'pointer',
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmSettle}
                                disabled={settling || !settleAmount || parseFloat(settleAmount) <= 0}
                                style={{
                                    padding: '10px 24px', border: 'none', borderRadius: '10px',
                                    background: settling ? '#94a3b8' : '#00897b', color: '#fff',
                                    fontSize: '14px', fontWeight: 600, cursor: settling ? 'not-allowed' : 'pointer',
                                }}
                            >
                                {settling ? 'Processing...' : 'Confirm Settlement'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Finance;
