import React, { useState, useEffect } from 'react';
import {
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import {
    DollarSign, ShoppingCart, TrendingUp,
    ArrowUpRight, ArrowDownRight,
    Clock, MapPin, Share2, ChevronDown, Star
} from 'lucide-react';
import { adminDashboardAPI } from '../services/api';
import './SalesAnalytics.css';

const MONTH_BAR_COLOR = '#80cbc4';

const FULFILLMENT_COLORS = {
    'Pending': '#f59e0b',
    'Paid': '#3b82f6',
    'Processing': '#8b5cf6',
    'Printing': '#6366f1',
    'Shipped': '#06b6d4',
    'Delivered': '#10b981',
    'Cancelled': '#ef4444',
    'Refunded': '#f97316',
};

const STATUS_CONFIG = {
    Pending:    { bg: '#fef3c7', color: '#92400e' },
    Paid:       { bg: '#d1fae5', color: '#065f46' },
    Processing: { bg: '#dbeafe', color: '#1e40af' },
    Printing:   { bg: '#e0e7ff', color: '#3730a3' },
    Shipped:    { bg: '#dcfce7', color: '#15803d' },
    Delivered:  { bg: '#dbeafe', color: '#1e40af' },
    Cancelled:  { bg: '#fee2e2', color: '#991b1b' },
    Refunded:   { bg: '#fce7f3', color: '#9d174d' },
};

const SalesAnalytics = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [categoryFilter, setCategoryFilter] = useState('Product Category');
    const [regionFilter, setRegionFilter] = useState('Region');
    const [channelFilter, setChannelFilter] = useState('Channel');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const response = await adminDashboardAPI.getSalesOrderAnalytics();
            setData(response.data);
        } catch (error) {
            console.error('Error fetching sales analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount) => {
        if (!amount || amount === '0') return '₹0';
        return `₹${parseFloat(amount).toLocaleString('en-IN')}`;
    };

    if (loading) {
        return (
            <div className="sa2-loading">
                <div className="sa2-spinner"></div>
                <p>Loading Sales Analytics...</p>
            </div>
        );
    }

    // Prepare fulfillment pie data
    const fulfillmentData = (data?.fulfillment_status || []).map(item => ({
        name: item.status,
        value: item.value,
    }));

    const totalFulfillment = fulfillmentData.reduce((sum, item) => sum + item.value, 0);
    const deliveredCount = fulfillmentData.find(f => f.name === 'Delivered')?.value || 0;
    const notDeliveredCount = totalFulfillment - deliveredCount;
    const deliveredPct = totalFulfillment > 0 ? Math.round((deliveredCount / totalFulfillment) * 100) : 0;
    const notDeliveredPct = 100 - deliveredPct;

    // Insights data
    const topRegions = (data?.top_categories || []).slice(0, 3).map(c => c.category || 'Unknown');
    const topChannels = (data?.payment_methods || []).slice(0, 3).map(p => p.payment_method || 'Unknown');
    const topProducts = (data?.most_selling || []).slice(0, 3).map(p => p.product__name || p.name || 'Unknown');

    return (
        <div className="sa2-page">
            {/* ═══════ HEADER ═══════ */}
            <h1 className="sa2-page-title">Sales & Order Analytics</h1>

            {/* ═══════ STAT CARDS ═══════ */}
            <div className="sa2-stats-row">
                <div className="sa2-stat-card">
                    <div className="sa2-stat-icon-circle sa2-icon-teal">
                        <DollarSign size={20} />
                    </div>
                    <div className="sa2-stat-info">
                        <span className="sa2-stat-label">Total Sales</span>
                        <span className="sa2-stat-value">{formatCurrency(data?.total_revenue)}</span>
                    </div>
                </div>
                <div className="sa2-stat-card">
                    <div className="sa2-stat-icon-circle sa2-icon-blue">
                        <ShoppingCart size={20} />
                    </div>
                    <div className="sa2-stat-info">
                        <span className="sa2-stat-label">Total Orders</span>
                        <span className="sa2-stat-value">{data?.total_orders?.toLocaleString() || '0'}</span>
                    </div>
                </div>
                <div className="sa2-stat-card">
                    <div className="sa2-stat-icon-circle sa2-icon-green">
                        <TrendingUp size={20} />
                    </div>
                    <div className="sa2-stat-info">
                        <span className="sa2-stat-label">Average Order Value</span>
                        <span className="sa2-stat-value">{formatCurrency(data?.avg_order_value)}</span>
                    </div>
                </div>
                <div className="sa2-stat-card">
                    <div className="sa2-stat-icon-circle sa2-icon-purple">
                        <Clock size={20} />
                    </div>
                    <div className="sa2-stat-info">
                        <span className="sa2-stat-label">Bulk vs Ret.</span>
                        <span className="sa2-stat-value">
                            {data?.new_vs_repeated
                                ? `${data.new_vs_repeated.new || 0}:${data.new_vs_repeated.repeated || 0}`
                                : '0:0'}
                        </span>
                    </div>
                </div>
            </div>

            {/* ═══════ CHARTS SECTION ═══════ */}
            <section className="sa2-charts-section">
                <div className="sa2-charts-header">
                    <h2 className="sa2-section-title">Charts</h2>
                    <div className="sa2-chart-filters">
                        <div className="sa2-filter-pill" onClick={() => {
                            const opts = ['Product Category', 'Electronics', 'Apparel', 'Home & Kitchen', 'Custom Prints', 'Stationery'];
                            setCategoryFilter(opts[(opts.indexOf(categoryFilter) + 1) % opts.length]);
                        }}>
                            {categoryFilter} <ChevronDown size={14} />
                        </div>
                        <div className="sa2-filter-pill" onClick={() => {
                            const opts = ['Region', 'North India', 'South India', 'East India', 'West India', 'Central India'];
                            setRegionFilter(opts[(opts.indexOf(regionFilter) + 1) % opts.length]);
                        }}>
                            {regionFilter} <ChevronDown size={14} />
                        </div>
                        <div className="sa2-filter-pill" onClick={() => {
                            const opts = ['Channel', 'Online', 'Offline', 'Wholesale', 'Marketplace'];
                            setChannelFilter(opts[(opts.indexOf(channelFilter) + 1) % opts.length]);
                        }}>
                            {channelFilter} <ChevronDown size={14} />
                        </div>
                    </div>
                </div>

                <div className="sa2-charts-grid">
                    {/* Monthly Sales Trend */}
                    <div className="sa2-chart-card sa2-chart-large">
                        <div className="sa2-chart-card-header">
                            <div>
                                <h3 className="sa2-chart-title">Monthly Sales Trend</h3>
                                <div className="sa2-chart-big-number">
                                    <span className="sa2-big-amount">{formatCurrency(data?.total_revenue)}</span>
                                    {data?.revenue_growth !== undefined && (
                                        <span className={`sa2-growth-badge ${data.revenue_growth >= 0 ? 'positive' : 'negative'}`}>
                                            {data.revenue_growth >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                                            {data.revenue_growth >= 0 ? '+' : ''}{data.revenue_growth}%
                                        </span>
                                    )}
                                </div>
                                <p className="sa2-chart-subtitle">Monthly Sales Trends</p>
                            </div>
                        </div>
                        <ResponsiveContainer width="100%" height={260}>
                            <BarChart data={data?.monthly_sales_trend || []} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af' }} />
                                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} tickFormatter={(val) => {
                                    if (val >= 1000000) return `${(val / 1000000).toFixed(0)}M`;
                                    if (val >= 1000) return `${(val / 1000).toFixed(0)}K`;
                                    return val;
                                }} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }}
                                    formatter={(value, name) => {
                                        if (name === 'revenue') return [formatCurrency(value), 'Revenue'];
                                        return [value, 'Orders'];
                                    }}
                                />
                                <Bar dataKey="revenue" fill={MONTH_BAR_COLOR} radius={[4, 4, 0, 0]} maxBarSize={35} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Order Fulfillment Status */}
                    <div className="sa2-chart-card">
                        <h3 className="sa2-chart-title">Order Fulfillment Status</h3>
                        <div className="sa2-fulfillment-wrap">
                            <ResponsiveContainer width="100%" height={220}>
                                <PieChart>
                                    <Pie
                                        data={fulfillmentData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={55}
                                        outerRadius={90}
                                        paddingAngle={2}
                                        dataKey="value"
                                    >
                                        {fulfillmentData.map((entry, index) => (
                                            <Cell key={index} fill={FULFILLMENT_COLORS[entry.name] || '#9ca3af'} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value, name) => [value, name]} />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="sa2-donut-labels">
                                <div className="sa2-donut-label-item">
                                    <span className="sa2-donut-pct sa2-pct-red">{notDeliveredPct}%</span>
                                    <span className="sa2-donut-label-text">Not Delivered</span>
                                </div>
                                <div className="sa2-donut-label-item">
                                    <span className="sa2-donut-pct sa2-pct-green">{deliveredPct}%</span>
                                    <span className="sa2-donut-label-text">Delivered</span>
                                </div>
                            </div>
                        </div>
                        <div className="sa2-fulfillment-legend">
                            {fulfillmentData.map((item, idx) => (
                                <div key={idx} className="sa2-legend-item">
                                    <span className="sa2-legend-dot" style={{ background: FULFILLMENT_COLORS[item.name] || '#9ca3af' }}></span>
                                    <span className="sa2-legend-name">{item.name}</span>
                                    <span className="sa2-legend-count">{item.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* ═══════ INSIGHTS ═══════ */}
            <section className="sa2-insights-section">
                <h2 className="sa2-section-title">Insights</h2>
                <div className="sa2-insights-grid">
                    <div className="sa2-insight-card">
                        <div className="sa2-insight-icon-wrap sa2-insight-purple">
                            <MapPin size={20} />
                        </div>
                        <div className="sa2-insight-content">
                            <h4 className="sa2-insight-title">Top Regions by Sales</h4>
                            <p className="sa2-insight-text">{topRegions.join(', ') || 'No data'}</p>
                        </div>
                    </div>
                    <div className="sa2-insight-card">
                        <div className="sa2-insight-icon-wrap sa2-insight-blue">
                            <Share2 size={20} />
                        </div>
                        <div className="sa2-insight-content">
                            <h4 className="sa2-insight-title">Top Channels by Sales</h4>
                            <p className="sa2-insight-text">{topChannels.join(', ') || 'Direct'}</p>
                        </div>
                    </div>
                    <div className="sa2-insight-card">
                        <div className="sa2-insight-icon-wrap sa2-insight-teal">
                            <Star size={20} />
                        </div>
                        <div className="sa2-insight-content">
                            <h4 className="sa2-insight-title">Most Selling Products</h4>
                            <p className="sa2-insight-text">{topProducts.join(', ') || 'No data'}</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ═══════ SALES TABLE ═══════ */}
            <section className="sa2-table-section">
                <h2 className="sa2-section-title">Sales Table</h2>
                <div className="sa2-table-wrap">
                    <table className="sa2-sales-table">
                        <thead>
                            <tr>
                                <th>ORDER ID</th>
                                <th>CUSTOMER</th>
                                <th>PRODUCT</th>
                                <th>QUANTITY</th>
                                <th>AMOUNT</th>
                                <th>STATUS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(data?.recent_orders || []).length > 0 ? (
                                data.recent_orders.map((order, idx) => {
                                    const statusCfg = STATUS_CONFIG[order.status] || {};
                                    return (
                                        <tr key={idx}>
                                            <td className="sa2-order-id">#{order.id}</td>
                                            <td className="sa2-customer-name">{order.user__username || 'Guest'}</td>
                                            <td className="sa2-product-col">—</td>
                                            <td>{order.item_count || 0}</td>
                                            <td className="sa2-amount">{formatCurrency(order.total_amount)}</td>
                                            <td>
                                                <span
                                                    className="sa2-status-badge"
                                                    style={{ background: statusCfg.bg, color: statusCfg.color }}
                                                >
                                                    {order.status}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr><td colSpan="6" className="sa2-empty">No orders found</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
};

export default SalesAnalytics;
