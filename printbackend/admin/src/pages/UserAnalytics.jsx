import React, { useState, useEffect } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts';
import { MapPin, Globe, Heart } from 'lucide-react';
import { adminDashboardAPI, adminUserAPI, adminOrdersAPI } from '../services/api';
import './UserAnalytics.css';

const SEGMENT_COLORS = ['#00897b', '#f59e0b', '#ef4444'];
const MONTH_COLORS = [
    '#b2dfdb', '#80cbc4', '#4db6ac', '#26a69a', '#009688',
    '#00897b', '#00796b', '#00695c', '#e0f2f1', '#b2dfdb',
    '#ffcc80', '#a5d6a7'
];

const UserAnalytics = () => {
    const [userAnalytics, setUserAnalytics] = useState(null);
    const [users, setUsers] = useState([]);
    const [orderStats, setOrderStats] = useState(null);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => { fetchAll(); }, []);

    const fetchAll = async () => {
        try {
            setLoading(true);
            const [userAnalRes, usersRes, orderRes, ordersRes] = await Promise.all([
                adminDashboardAPI.getUserAnalytics(),
                adminUserAPI.getUsers({ page_size: 100 }),
                adminOrdersAPI.getOrderStats(),
                adminOrdersAPI.getOrders({ page_size: 100 }).catch(() => ({ data: [] })),
            ]);
            setUserAnalytics(userAnalRes.data);
            const ud = usersRes.data;
            setUsers(Array.isArray(ud) ? ud : (ud.results || []));
            setOrderStats(orderRes.data);
            const od = ordersRes.data;
            setOrders(Array.isArray(od) ? od : (od.results || []));
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="ua-loading"><div className="ua-spinner"></div><p>Loading user analytics...</p></div>;
    }

    const totalCustomers = userAnalytics?.total_users || users.length || 0;
    const newCustomersMonth = userAnalytics?.registrations_daily?.length || 0;
    const growthRate = userAnalytics?.growth_rate || 0;
    const segments = userAnalytics?.segments || {};
    const repeatPct = totalCustomers > 0
        ? Math.round(((segments.two_to_five || 0) + (segments.six_plus || 0)) / totalCustomers * 100) : 0;
    const churnPct = totalCustomers > 0
        ? Math.round((segments.no_orders || 0) / totalCustomers * 100) : 0;

    // Monthly registration data from real API
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlySales = (userAnalytics?.registrations_monthly || []).map((item, idx) => {
        const d = new Date(item.month);
        return {
            month: monthNames[d.getMonth()] || `M${idx}`,
            value: item.count,
            fill: MONTH_COLORS[idx % MONTH_COLORS.length],
        };
    });

    // Segmentation data for pie — from real segments
    const segData = [
        { name: 'New', value: (segments.no_orders || 0) + (segments.one_order || 0), color: '#00897b' },
        { name: 'Repeat', value: (segments.two_to_five || 0) + (segments.six_plus || 0), color: '#f59e0b' },
        { name: 'Dormant', value: segments.no_orders || 0, color: '#ef4444' },
    ].filter(d => d.value > 0);

    // Abandoned vs Converted carts — derive from real order data
    const ordersByMonth = {};
    orders.forEach(o => {
        const d = new Date(o.created_at);
        const m = monthNames[d.getMonth()];
        if (!ordersByMonth[m]) ordersByMonth[m] = { converted: 0, abandoned: 0 };
        if (o.status === 'cancelled' || o.status === 'failed') {
            ordersByMonth[m].abandoned++;
        } else {
            ordersByMonth[m].converted++;
        }
    });
    const abandonedData = monthNames.map(m => ({
        month: m,
        converted: ordersByMonth[m]?.converted || 0,
        abandoned: ordersByMonth[m]?.abandoned || 0,
    })).filter(d => d.converted > 0 || d.abandoned > 0);
    // If no real data, show a placeholder message
    const hasAbandonedData = abandonedData.length > 0;

    // Top cities from real user data
    const cityCount = {};
    users.forEach(u => {
        const city = u.city || u.address_city || '';
        if (city) cityCount[city] = (cityCount[city] || 0) + 1;
    });
    const topCities = Object.entries(cityCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([city]) => city);
    const topCitiesStr = topCities.length > 0 ? topCities.join(', ') : 'No city data yet';

    // Channel split — real orders don't have a "channel" field yet, 
    // so show based on order count vs user count for now
    const usersWithOrders = users.filter(u => (u.total_orders ?? 0) > 0).length;
    const onlinePct = totalCustomers > 0 ? Math.round((usersWithOrders / totalCustomers) * 100) : 0;

    // Customer details from real users
    const customerDetails = users.slice(0, 10).map((u, idx) => ({
        id: `CUST${String(u.id).padStart(3, '0')}`,
        name: u.full_name || u.username || u.email?.split('@')[0] || '—',
        contact: u.phone || u.email || '—',
        city: u.city || u.address_city || '—',
        firstOrder: u.date_joined ? new Date(u.date_joined).toLocaleDateString('en-CA') : '—',
        lastOrder: u.last_login ? new Date(u.last_login).toLocaleDateString('en-CA') : '—',
        totalOrders: u.total_orders ?? 0,
        isRepeat: (u.total_orders ?? 0) > 1,
    }));

    return (
        <div className="ua-page">
            {/* ═══ STAT CARDS ═══ */}
            <div className="ua-stats-row">
                <div className="ua-stat-card">
                    <span className="ua-stat-label">Total Customers</span>
                    <span className="ua-stat-value">{totalCustomers.toLocaleString()}</span>
                </div>
                <div className="ua-stat-card">
                    <span className="ua-stat-label">New Customers (This Month)</span>
                    <span className="ua-stat-value">
                        {newCustomersMonth}
                        {growthRate !== 0 && (
                            <span className={`ua-growth ${growthRate > 0 ? 'ua-up' : 'ua-down'}`}>
                                ({growthRate > 0 ? '+' : ''}{growthRate}%)
                            </span>
                        )}
                    </span>
                </div>
                <div className="ua-stat-card">
                    <span className="ua-stat-label">Repeat Customer %</span>
                    <span className="ua-stat-value">{repeatPct}%</span>
                </div>
                <div className="ua-stat-card">
                    <span className="ua-stat-label">Churn Rate %</span>
                    <span className="ua-stat-value">{churnPct}%</span>
                    <span className="ua-stat-sub">customers not ordering again</span>
                </div>
            </div>

            {/* ═══ SALES REPORT CHART ═══ */}
            <section className="ua-chart-section">
                <h2 className="ua-chart-title">Registration Report</h2>
                <div className="ua-chart-wrap">
                    {monthlySales.length > 0 ? (
                        <ResponsiveContainer width="100%" height={240}>
                            <BarChart data={monthlySales} barSize={40}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#6b7280' }} />
                                <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} />
                                <Tooltip />
                                <Bar dataKey="value" name="Registrations" radius={[6, 6, 0, 0]}>
                                    {monthlySales.map((entry, index) => (
                                        <Cell key={index} fill={entry.fill} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <p className="ua-no-data">No registration data available yet.</p>
                    )}
                </div>
            </section>

            {/* ═══ SEGMENTATION + ABANDONED CARTS ═══ */}
            <div className="ua-mid-grid">
                <div className="ua-seg-card">
                    <h3 className="ua-seg-title">Customer Segmentation</h3>
                    <div className="ua-seg-chart">
                        {segData.length > 0 ? (
                            <>
                                <ResponsiveContainer width={120} height={120}>
                                    <PieChart>
                                        <Pie data={segData} cx="50%" cy="50%" outerRadius={50} dataKey="value" paddingAngle={2}>
                                            {segData.map((entry, i) => (
                                                <Cell key={i} fill={entry.color} />
                                            ))}
                                        </Pie>
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="ua-seg-legend">
                                    {segData.map((s, i) => (
                                        <div key={i} className="ua-seg-item">
                                            <span className="ua-seg-dot" style={{ background: s.color }}></span>
                                            {s.name} ({s.value})
                                        </div>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <p className="ua-no-data">No segment data available.</p>
                        )}
                    </div>
                </div>

                <div className="ua-abandoned-card">
                    <h3 className="ua-seg-title">Order Outcomes by Month</h3>
                    <div className="ua-abandoned-chart">
                        {hasAbandonedData ? (
                            <ResponsiveContainer width="100%" height={140}>
                                <BarChart data={abandonedData} barSize={12}>
                                    <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#9ca3af' }} />
                                    <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} />
                                    <Tooltip />
                                    <Bar dataKey="converted" fill="#00897b" name="Completed" radius={[3, 3, 0, 0]} />
                                    <Bar dataKey="abandoned" fill="#f59e0b" name="Cancelled/Failed" radius={[3, 3, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <p className="ua-no-data">No order data to show outcomes.</p>
                        )}
                    </div>
                </div>
            </div>

            {/* ═══ INSIGHTS ═══ */}
            <section className="ua-insights-section">
                <h2 className="ua-section-title">Insights</h2>
                <div className="ua-insights-grid">
                    <div className="ua-insight-card">
                        <div className="ua-insight-icon ua-icon-blue"><MapPin size={20} /></div>
                        <h4>Top Cities by Customers</h4>
                        <p>{topCitiesStr}</p>
                    </div>
                    <div className="ua-insight-card">
                        <div className="ua-insight-icon ua-icon-teal"><Globe size={20} /></div>
                        <h4>Active Buyers</h4>
                        <p>{usersWithOrders} of {totalCustomers} customers have placed orders ({onlinePct}%)</p>
                    </div>
                    <div className="ua-insight-card">
                        <h4>Customer Segments</h4>
                        <p>
                            <strong>{segments.one_order || 0} one-time</strong>&nbsp;•&nbsp;
                            <strong>{(segments.two_to_five || 0) + (segments.six_plus || 0)} repeat</strong>&nbsp;•&nbsp;
                            <strong>{segments.no_orders || 0} no orders</strong>
                        </p>
                    </div>
                </div>
            </section>

            {/* ═══ CUSTOMER DETAILS TABLE ═══ */}
            <section className="ua-table-section">
                <h2 className="ua-section-title">Customer Details</h2>
                <div className="ua-table-wrap">
                    <table className="ua-table">
                        <thead>
                            <tr>
                                <th>CUSTOMER ID</th>
                                <th>NAME</th>
                                <th>CONTACT NO.</th>
                                <th>CITY</th>
                                <th>FIRST ORDER</th>
                                <th>LAST ORDER</th>
                                <th>TOTAL ORDERS</th>
                                <th>REPEAT?</th>
                            </tr>
                        </thead>
                        <tbody>
                            {customerDetails.length === 0 ? (
                                <tr><td colSpan="8" className="ua-empty">No customer data</td></tr>
                            ) : (
                                customerDetails.map(c => (
                                    <tr key={c.id}>
                                        <td className="ua-cid">{c.id}</td>
                                        <td className="ua-cname">{c.name}</td>
                                        <td>{c.contact}</td>
                                        <td>{c.city}</td>
                                        <td className="ua-date">{c.firstOrder}</td>
                                        <td className="ua-date">{c.lastOrder}</td>
                                        <td>{c.totalOrders}</td>
                                        <td>
                                            <input type="checkbox" checked={c.isRepeat} readOnly className="ua-checkbox" />
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
};

export default UserAnalytics;
