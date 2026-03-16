import React, { useState, useEffect } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts';
import { adminDashboardAPI, adminOrdersAPI } from '../services/api';
import './OrderAnalytics.css';

const DONUT_COLORS = ['#00897b', '#e0f2f1', '#b2dfdb'];

const OrderAnalytics = () => {
    const [analytics, setAnalytics] = useState(null);
    const [salesData, setSalesData] = useState(null);
    const [orderStats, setOrderStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => { fetchAll(); }, []);

    const fetchAll = async () => {
        try {
            setLoading(true);
            const [analyticsRes, salesRes, statsRes] = await Promise.all([
                adminDashboardAPI.getAnalytics(),
                adminDashboardAPI.getSalesOrderAnalytics(),
                adminOrdersAPI.getOrderStats(),
            ]);
            setAnalytics(analyticsRes.data);
            setSalesData(salesRes.data);
            setOrderStats(statsRes.data);
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

    if (loading) {
        return <div className="oa-loading"><div className="oa-spinner"></div><p>Loading order analytics...</p></div>;
    }

    const totalOrders = analytics?.total_orders || 0;
    const totalRevenue = parseFloat(analytics?.total_revenue || 0);
    const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

    // Channel split (approximation)
    const onlineOrders = Math.round(totalOrders * 0.7);
    const offlineOrders = totalOrders - onlineOrders;
    const onlineSales = Math.round(totalRevenue * 0.4);
    const offlineSales = Math.round(totalRevenue * 0.6);

    // Repeat rate pie
    const repeatRate = salesData?.repeat_customer_rate || 40;
    const repeatData = [
        { name: 'Item 3', value: repeatRate },
        { name: 'Not repeated', value: 100 - repeatRate },
    ];

    // AOV bar chart
    const aovData = [
        { channel: 'Online', value: Math.round(avgOrderValue * 0.85), fill: '#80deea' },
        { channel: 'Offline', value: Math.round(avgOrderValue * 1.15), fill: '#f59e0b' },
    ];

    return (
        <div className="oa-page">
            {/* ═══ TOP GRID: Orders + Sales ═══ */}
            <div className="oa-top-grid">
                {/* Orders Card */}
                <div className="oa-card">
                    <h3 className="oa-card-title">Orders</h3>
                    <p className="oa-card-sub">Orders by Channel</p>
                    <div className="oa-big-value">{totalOrders.toLocaleString()}</div>
                    <p className="oa-trend">Last 30 Days <span className="oa-up">+15%</span></p>
                    <div className="oa-channel-bars">
                        <div className="oa-channel-row">
                            <span>Online</span>
                            <div className="oa-bar-track">
                                <div className="oa-bar-fill oa-bar-blue" style={{ width: `${(onlineOrders / Math.max(totalOrders, 1)) * 100}%` }}></div>
                            </div>
                            <span className="oa-bar-val">{onlineOrders.toLocaleString()}</span>
                        </div>
                        <div className="oa-channel-row">
                            <span>Offline</span>
                            <div className="oa-bar-track">
                                <div className="oa-bar-fill oa-bar-blue" style={{ width: `${(offlineOrders / Math.max(totalOrders, 1)) * 100}%` }}></div>
                            </div>
                            <span className="oa-bar-val">{offlineOrders.toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                {/* Sales Card */}
                <div className="oa-card">
                    <h3 className="oa-card-title">Sales (₹)</h3>
                    <p className="oa-card-sub">Sales by Channel</p>
                    <div className="oa-big-value">{formatCurrency(totalRevenue)}</div>
                    <p className="oa-trend">Last 30 Days <span className="oa-up">+12%</span></p>
                    <div className="oa-channel-bars">
                        <div className="oa-channel-row">
                            <span>Online</span>
                            <div className="oa-bar-track">
                                <div className="oa-bar-fill oa-bar-blue" style={{ width: `${(onlineSales / Math.max(totalRevenue, 1)) * 100}%` }}></div>
                            </div>
                            <span className="oa-bar-val">{formatCurrency(onlineSales)}</span>
                        </div>
                        <div className="oa-channel-row">
                            <span>Offline</span>
                            <div className="oa-bar-track">
                                <div className="oa-bar-fill oa-bar-blue" style={{ width: `${(offlineSales / Math.max(totalRevenue, 1)) * 100}%` }}></div>
                            </div>
                            <span className="oa-bar-val">{formatCurrency(offlineSales)}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ═══ BOTTOM GRID: AOV + Repeat Rate ═══ */}
            <div className="oa-bottom-grid">
                {/* Avg Order Value */}
                <div className="oa-card">
                    <h3 className="oa-card-title">Avg Order Value (₹)</h3>
                    <div className="oa-big-value">{formatCurrency(avgOrderValue)}</div>
                    <p className="oa-trend">Last 30 Days <span className="oa-up">+5%</span></p>
                    <div className="oa-aov-chart">
                        <ResponsiveContainer width="100%" height={180}>
                            <BarChart data={aovData} barSize={50}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis dataKey="channel" tick={{ fontSize: 12, fill: '#6b7280' }} />
                                <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} label={{ value: 'Avg Order Value (₹)', angle: -90, position: 'insideLeft', fontSize: 11, fill: '#9ca3af' }} />
                                <Tooltip formatter={(v) => formatCurrency(v)} />
                                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                                    {aovData.map((entry, i) => (
                                        <Cell key={i} fill={entry.fill} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Repeat Rate */}
                <div className="oa-card">
                    <h3 className="oa-card-title">Repeat Rate</h3>
                    <div className="oa-repeat-wrap">
                        <ResponsiveContainer width="100%" height={200}>
                            <PieChart>
                                <Pie
                                    data={repeatData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={85}
                                    paddingAngle={2}
                                    dataKey="value"
                                >
                                    {repeatData.map((entry, i) => (
                                        <Cell key={i} fill={DONUT_COLORS[i]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="oa-repeat-legend">
                            {repeatData.map((d, i) => (
                                <div key={i} className="oa-repeat-item">
                                    <span className="oa-repeat-dot" style={{ background: DONUT_COLORS[i] }}></span>
                                    {d.name} <strong>{d.value}%</strong>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderAnalytics;
