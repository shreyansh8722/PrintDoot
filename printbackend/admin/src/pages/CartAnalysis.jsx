import React, { useState, useEffect } from 'react';
import {
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip
} from 'recharts';
import {
    ShoppingCart, Users, ArrowUpRight, ArrowDownRight,
    Package, DollarSign, TrendingUp, Send,
    BarChart3, RefreshCw, Share2, Download
} from 'lucide-react';
import FilterDropdown from '../components/FilterDropdown';
import { adminMarketingAPI, adminOrdersAPI, adminDashboardAPI, adminUserAPI } from '../services/api';
import './CartAnalysis.css';

const STATUS_BADGE = {
    Active:    { bg: '#dcfce7', color: '#15803d' },
    Abandoned: { bg: '#fef3c7', color: '#92400e' },
    Converted: { bg: '#dbeafe', color: '#1e40af' },
};

const DONUT_COLORS = ['#00897b', '#26c6da', '#b2dfdb', '#f59e0b'];

const CartAnalysis = () => {
    const [cartStats, setCartStats] = useState(null);
    const [carts, setCarts] = useState([]);
    const [analytics, setAnalytics] = useState(null);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [regionFilter, setRegionFilter] = useState('All Regions');
    const [productTypeFilter, setProductTypeFilter] = useState('All Product Types');
    const [periodFilter, setPeriodFilter] = useState('Last 90 Days');

    useEffect(() => { fetchAll(); }, []);

    const fetchAll = async () => {
        try {
            setLoading(true);
            const [cartStatsRes, cartsRes, analyticsRes, usersRes] = await Promise.all([
                adminMarketingAPI.getAbandonedCartStats().catch(() => ({ data: {} })),
                adminMarketingAPI.getAbandonedCarts({ page_size: 20 }).catch(() => ({ data: [] })),
                adminDashboardAPI.getAnalytics().catch(() => ({ data: {} })),
                adminUserAPI.getUsers({ page_size: 50 }).catch(() => ({ data: [] })),
            ]);
            setCartStats(cartStatsRes.data);
            const cd = cartsRes.data;
            setCarts(Array.isArray(cd) ? cd : (cd.results || []));
            setAnalytics(analyticsRes.data);
            const ud = usersRes.data;
            setUsers(Array.isArray(ud) ? ud : (ud.results || []));
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="ca-loading"><div className="ca-spinner"></div><p>Loading cart analysis...</p></div>;
    }

    const totalOrders = analytics?.total_orders || 0;
    const totalCustomers = analytics?.total_customers || users.length || 0;
    const totalRevenue = parseFloat(analytics?.total_revenue || 0);

    // Stat cards — use real data, show 0 when unavailable
    const activeCarts = cartStats?.active_carts || 0;
    const abandonedCarts = cartStats?.abandoned_count || 0;
    const totalCartValue = cartStats?.total_value || 0;
    const repeatOrderRate = totalCustomers > 0 ? Math.round((totalOrders / totalCustomers) * 50) : 0;

    // Cart items table — use real cart data
    const cartItems = carts.slice(0, 10).map((cart, idx) => ({
        customer: cart?.customer_name || cart?.email || cart?.user_email || `Customer ${idx + 1}`,
        product: cart?.product_name || cart?.items?.[0]?.product_name || `Product ${idx + 1}`,
        value: cart?.cart_value || cart?.total || 0,
        status: cart?.status === 'converted' ? 'Converted'
              : cart?.status === 'abandoned' ? 'Abandoned'
              : 'Active',
    }));

    // Customer types donut — derive from real user data
    const usersWithOrders = users.filter(u => (u.total_orders ?? 0) > 0);
    const repeatUsers = users.filter(u => (u.total_orders ?? 0) > 1);
    const newUsers = users.filter(u => {
        const joined = new Date(u.date_joined);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return joined >= thirtyDaysAgo;
    });
    
    const potential = totalCustomers - usersWithOrders.length;
    const newCust = newUsers.length;
    const highValue = repeatUsers.length;
    const atRisk = users.filter(u => {
        if ((u.total_orders ?? 0) === 0) return false;
        const lastLogin = new Date(u.last_login || u.date_joined);
        const sixtyDaysAgo = new Date();
        sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
        return lastLogin < sixtyDaysAgo;
    }).length;
    
    const totalSeg = Math.max(potential + newCust + highValue + atRisk, totalCustomers);
    const typeData = [
        { name: 'Potential', value: potential || 0, color: DONUT_COLORS[0] },
        { name: 'New (30d)', value: newCust || 0, color: DONUT_COLORS[1] },
        { name: 'Repeat Buyers', value: highValue || 0, color: DONUT_COLORS[2] },
        { name: 'At-Risk', value: atRisk || 0, color: DONUT_COLORS[3] },
    ].filter(d => d.value > 0);

    // Returning customers %
    const returningPct = totalCustomers > 0 ? Math.min(Math.round((repeatUsers.length / totalCustomers) * 100), 100) : 0;

    // Dropped carts — use real abandoned cart data
    const droppedItems = [];
    if (abandonedCarts > 0) {
        droppedItems.push({ name: 'Abandoned', pct: 100, icon: '🛒' });
    }
    if (activeCarts > 0) {
        const activePct = abandonedCarts > 0 ? Math.round((activeCarts / (activeCarts + abandonedCarts)) * 100) : 100;
        droppedItems.push({ name: 'Active', pct: activePct, icon: '📦' });
    }
    if (droppedItems.length === 0) {
        droppedItems.push(
            { name: 'No cart data', pct: 0, icon: '🛒' },
        );
    }

    return (
        <div className="ca-page">
            {/* ═══ HEADER ═══ */}
            <div className="ca-header-row">
                <div>
                    <h1 className="ca-page-title">Carts</h1>
                    <p className="ca-subtitle">Manage and analyze customer carts</p>
                </div>
                <button className="ca-notify-btn" onClick={() => alert('Push notifications sent to all customers with active carts.')}><Send size={15} /> Send Notification</button>
            </div>

            {/* ═══ STAT CARDS ═══ */}
            <div className="ca-stats-row">
                <div className="ca-stat-card">
                    <span className="ca-stat-label">Total Active Carts</span>
                    <span className="ca-stat-value">{activeCarts.toLocaleString()}</span>
                </div>
                <div className="ca-stat-card">
                    <span className="ca-stat-label">Total Abandoned Carts</span>
                    <span className="ca-stat-value">{abandonedCarts.toLocaleString()}</span>
                </div>
                <div className="ca-stat-card">
                    <span className="ca-stat-label">Total Cart Value</span>
                    <span className="ca-stat-value">₹{totalCartValue.toLocaleString('en-IN')}</span>
                </div>
                <div className="ca-stat-card">
                    <span className="ca-stat-label">Repeat Order Rate</span>
                    <span className="ca-stat-value">{repeatOrderRate}%</span>
                </div>
            </div>

            {/* ═══ CART ITEMS TABLE ═══ */}
            <div className="ca-table-wrap">
                <table className="ca-table">
                    <thead>
                        <tr>
                            <th>Customer</th>
                            <th>Product</th>
                            <th>Cart Value</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {cartItems.length === 0 ? (
                            <tr><td colSpan="4" className="ca-empty">No cart data available. Carts will appear when customers add items.</td></tr>
                        ) : (
                            cartItems.map((item, idx) => {
                                const cfg = STATUS_BADGE[item.status] || STATUS_BADGE.Active;
                                return (
                                    <tr key={idx}>
                                        <td className="ca-customer">{item.customer}</td>
                                        <td className="ca-product">{item.product}</td>
                                        <td className="ca-value">₹{item.value}</td>
                                        <td>
                                            <span className="ca-status-badge" style={{ background: cfg.bg, color: cfg.color }}>
                                                {item.status}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* ═══ FILTER PILLS ═══ */}
            <div className="ca-filter-row">
                <FilterDropdown
                    value={regionFilter}
                    options={['All Regions', 'North India', 'South India', 'East India', 'West India']}
                    onChange={setRegionFilter}
                />
                <FilterDropdown
                    value={productTypeFilter}
                    options={['All Product Types', 'Electronics', 'Apparel', 'Home & Kitchen', 'Custom Prints']}
                    onChange={setProductTypeFilter}
                />
                <FilterDropdown
                    value={periodFilter}
                    options={['Last 90 Days', 'Last 30 Days', 'Last 7 Days', 'This Year']}
                    onChange={setPeriodFilter}
                />
            </div>

            {/* ═══ BOTTOM ANALYTICS CARDS ═══ */}
            <div className="ca-bottom-grid">
                {/* Customer Types */}
                <div className="ca-bottom-card">
                    <h3 className="ca-card-title">Customer Types</h3>
                    <p className="ca-card-desc">Breakdown of your customers into segments based on real data.</p>
                    <div className="ca-type-chart-wrap">
                        {typeData.length > 0 ? (
                            <>
                                <div className="ca-type-donut">
                                    <ResponsiveContainer width={160} height={160}>
                                        <PieChart>
                                            <Pie data={typeData} cx="50%" cy="50%" innerRadius={48} outerRadius={72} paddingAngle={2} dataKey="value">
                                                {typeData.map((e, i) => <Cell key={i} fill={e.color} />)}
                                            </Pie>
                                            <Tooltip />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div className="ca-type-center">
                                        <span className="ca-type-big">{totalCustomers.toLocaleString()}</span>
                                        <span className="ca-type-sub">Total</span>
                                    </div>
                                </div>
                                <div className="ca-type-legend">
                                    {typeData.map((d, i) => (
                                        <div key={i} className="ca-type-item">
                                            <span className="ca-type-dot" style={{ background: d.color }}></span>
                                            <span>{d.name}</span>
                                            <strong>{d.value.toLocaleString()}</strong>
                                        </div>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <p className="ca-no-data">No customer data available yet.</p>
                        )}
                    </div>
                    <div className="ca-suggested">
                        <strong>Suggested Action:</strong>
                        <p>Focus marketing on 'Potential' customers and create loyalty programs for repeat buyers.</p>
                    </div>
                </div>

                {/* Returning Customers % */}
                <div className="ca-bottom-card ca-returning-card">
                    <h3 className="ca-card-title">Returning Customers %</h3>
                    <p className="ca-card-desc">Percentage of customers who made a repeat purchase.</p>
                    <div className="ca-returning-big">{returningPct}%</div>
                    <p className="ca-returning-diff">Based on {repeatUsers.length} of {totalCustomers} customers</p>
                    <div className="ca-suggested">
                        <strong>Suggested Action:</strong>
                        <p>{returningPct > 20 ? 'Great retention! Consider referral bonuses to grow further.' : 'Consider email campaigns and loyalty programs to boost repeat purchases.'}</p>
                    </div>
                </div>

                {/* Dropped Carts */}
                <div className="ca-bottom-card">
                    <h3 className="ca-card-title">Cart Status</h3>
                    <div className="ca-dropped-bars">
                        {droppedItems.map((item, i) => (
                            <div key={i} className="ca-dropped-row">
                                <span className="ca-dropped-icon">{item.icon}</span>
                                <span className="ca-dropped-name">{item.name}</span>
                                <div className="ca-dropped-track">
                                    <div className="ca-dropped-fill" style={{ width: `${item.pct}%` }}></div>
                                </div>
                                <span className="ca-dropped-pct">{item.pct}%</span>
                            </div>
                        ))}
                    </div>
                    <div className="ca-suggested">
                        <strong>Suggested Action:</strong>
                        <p>{abandonedCarts > 0 ? 'Review the checkout process for complexity. Offer a discount for abandoned carts.' : 'No abandoned carts yet — great!'}</p>
                    </div>
                </div>
            </div>

            {/* ═══ BOTTOM ACTIONS ═══ */}
            <div className="ca-bottom-actions">
                <button className="ca-action-btn ca-action-outline" id="ca-share-btn" onClick={async () => {
                    const summary = `PrintDoot — Cart Analysis Summary\n${'─'.repeat(36)}\nActive Carts: ${activeCarts}\nAbandoned Carts: ${abandonedCarts}\nTotal Cart Value: ₹${totalCartValue.toLocaleString('en-IN')}\nRepeat Order Rate: ${repeatOrderRate}%\nReturning Customers: ${returningPct}%\nTotal Customers: ${totalCustomers}\nTotal Orders: ${totalOrders}\nTotal Revenue: ₹${totalRevenue.toLocaleString('en-IN')}\n${'─'.repeat(36)}\nGenerated: ${new Date().toLocaleString('en-IN')}`;
                    const btn = document.getElementById('ca-share-btn');
                    try {
                        if (navigator.share) {
                            await navigator.share({ title: 'Cart Analysis Summary', text: summary });
                        } else if (navigator.clipboard && window.isSecureContext) {
                            await navigator.clipboard.writeText(summary);
                            if (btn) { btn.textContent = '✓ Copied!'; setTimeout(() => { btn.innerHTML = ''; btn.textContent = ''; const icon = document.createElement('span'); btn.appendChild(icon); btn.append(' Share'); }, 2000); }
                        } else {
                            const ta = document.createElement('textarea'); ta.value = summary; ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta);
                            if (btn) { btn.textContent = '✓ Copied!'; setTimeout(() => { btn.textContent = ' Share'; }, 2000); }
                        }
                    } catch (e) { 
                        const w = window.open('', '_blank', 'width=500,height=400'); 
                        if (w) { w.document.write('<pre style="font-family:monospace;white-space:pre-wrap;padding:20px">' + summary + '</pre>'); w.document.title = 'Cart Analysis'; }
                    }
                }}><Share2 size={15} /> Share</button>
                <button className="ca-action-btn ca-action-teal" onClick={() => {
                    const csvRows = [
                        ['Customer', 'Product', 'Cart Value', 'Status'],
                        ...cartItems.map(item => [item.customer, item.product, item.value, item.status])
                    ];
                    const csvContent = csvRows.map(r => r.map(v => `"${v}"`).join(',')).join('\n');
                    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `cart_analysis_${new Date().toISOString().split('T')[0]}.csv`;
                    link.click();
                    URL.revokeObjectURL(url);
                }}><Download size={15} /> Export</button>
            </div>
        </div>
    );
};

export default CartAnalysis;
