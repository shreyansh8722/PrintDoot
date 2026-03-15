import React, { useState, useEffect } from 'react';
import { adminDashboardAPI, adminOrdersAPI } from '../services/api';
import './Finance.css';

const Finance = () => {
    const [analytics, setAnalytics] = useState(null);
    const [revenueData, setRevenueData] = useState([]);
    const [period, setPeriod] = useState('daily');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        fetchRevenueChart();
    }, [period]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const response = await adminDashboardAPI.getAnalytics();
            setAnalytics(response.data);
        } catch (error) {
            console.error('Error fetching finance data:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchRevenueChart = async () => {
        try {
            const response = await adminOrdersAPI.getRevenueChart({ period, days: 90 });
            setRevenueData(response.data || []);
        } catch (error) {
            console.error('Error fetching revenue chart:', error);
        }
    };

    const formatCurrency = (amount) => {
        if (!amount) return '₹0';
        return `₹${parseFloat(amount).toLocaleString('en-IN')}`;
    };

    if (loading) {
        return <div className="loading">Loading finance data...</div>;
    }

    return (
        <div className="finance-page">
            <div className="page-header">
                <h1>Finance & Payments</h1>
                <button onClick={fetchData} className="btn-refresh">🔄 Refresh</button>
            </div>

            {/* Revenue Stat Cards */}
            {analytics && (
                <div className="finance-stats-grid">
                    <div className="finance-stat-card primary">
                        <div className="stat-icon">💰</div>
                        <div className="stat-info">
                            <div className="stat-label">Total Revenue</div>
                            <div className="stat-number">{formatCurrency(analytics.total_revenue)}</div>
                        </div>
                    </div>
                    <div className="finance-stat-card success">
                        <div className="stat-icon">📈</div>
                        <div className="stat-info">
                            <div className="stat-label">Revenue Growth</div>
                            <div className="stat-number">
                                {analytics.revenue_growth > 0 ? '+' : ''}{analytics.revenue_growth}%
                            </div>
                        </div>
                    </div>
                    <div className="finance-stat-card info">
                        <div className="stat-icon">🛒</div>
                        <div className="stat-info">
                            <div className="stat-label">Avg Order Value</div>
                            <div className="stat-number">{formatCurrency(analytics.avg_order_value)}</div>
                        </div>
                    </div>
                    <div className="finance-stat-card warning">
                        <div className="stat-icon">📊</div>
                        <div className="stat-info">
                            <div className="stat-label">Total Orders</div>
                            <div className="stat-number">{analytics.total_orders}</div>
                        </div>
                    </div>
                    <div className="finance-stat-card">
                        <div className="stat-icon">❌</div>
                        <div className="stat-info">
                            <div className="stat-label">Cancellation Rate</div>
                            <div className="stat-number">{analytics.cancellation_rate}%</div>
                        </div>
                    </div>
                    <div className="finance-stat-card">
                        <div className="stat-icon">👥</div>
                        <div className="stat-info">
                            <div className="stat-label">New Users (30d)</div>
                            <div className="stat-number">{analytics.new_users_this_month}</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Revenue Chart */}
            <div className="finance-section">
                <div className="section-header">
                    <h2>Revenue Trend</h2>
                    <div className="period-tabs">
                        {['daily', 'weekly', 'monthly'].map(p => (
                            <button
                                key={p}
                                className={`period-tab ${period === p ? 'active' : ''}`}
                                onClick={() => setPeriod(p)}
                            >
                                {p.charAt(0).toUpperCase() + p.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="revenue-chart-container">
                    {revenueData.length === 0 ? (
                        <div className="empty-state">No revenue data available for this period</div>
                    ) : (
                        <div className="revenue-bars">
                            {revenueData.map((item, i) => {
                                const maxRevenue = Math.max(...revenueData.map(d => parseFloat(d.revenue) || 0));
                                const height = maxRevenue > 0 ? (parseFloat(item.revenue) / maxRevenue * 200) : 0;
                                return (
                                    <div key={i} className="revenue-bar-wrapper" title={`${item.date}: ${formatCurrency(item.revenue)} (${item.orders} orders)`}>
                                        <div className="revenue-bar" style={{ height: `${Math.max(height, 4)}px` }}></div>
                                        <div className="bar-label">{item.date?.substring(5) || ''}</div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Two Column Layout */}
            <div className="finance-two-col">
                {/* Most Selling Products */}
                {analytics?.most_selling && (
                    <div className="finance-section">
                        <h2>🏆 Top Selling Products</h2>
                        <table className="finance-table">
                            <thead>
                                <tr>
                                    <th>Product</th>
                                    <th>Orders</th>
                                    <th>Revenue</th>
                                </tr>
                            </thead>
                            <tbody>
                                {analytics.most_selling.map((item, i) => (
                                    <tr key={i}>
                                        <td>{item.name}</td>
                                        <td>{item.orders}</td>
                                        <td><strong>{formatCurrency(item.revenue)}</strong></td>
                                    </tr>
                                ))}
                                {analytics.most_selling.length === 0 && (
                                    <tr><td colSpan="3" className="text-center">No data</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Least Selling Products */}
                {analytics?.least_selling && (
                    <div className="finance-section">
                        <h2>📉 Least Selling Products</h2>
                        <table className="finance-table">
                            <thead>
                                <tr>
                                    <th>Product</th>
                                    <th>Orders</th>
                                    <th>Revenue</th>
                                </tr>
                            </thead>
                            <tbody>
                                {analytics.least_selling.map((item, i) => (
                                    <tr key={i}>
                                        <td>{item.name}</td>
                                        <td>{item.orders}</td>
                                        <td>{formatCurrency(item.revenue)}</td>
                                    </tr>
                                ))}
                                {analytics.least_selling.length === 0 && (
                                    <tr><td colSpan="3" className="text-center">No data</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Customer Breakdown */}
            {analytics?.new_vs_repeated && (
                <div className="finance-section">
                    <h2>👥 Customer Breakdown</h2>
                    <div className="customer-breakdown">
                        <div className="breakdown-card">
                            <div className="breakdown-number">{analytics.new_vs_repeated.new}</div>
                            <div className="breakdown-label">New Customers</div>
                        </div>
                        <div className="breakdown-card">
                            <div className="breakdown-number">{analytics.new_vs_repeated.repeated}</div>
                            <div className="breakdown-label">Returning Customers</div>
                        </div>
                        <div className="breakdown-card">
                            <div className="breakdown-number">{analytics.total_users}</div>
                            <div className="breakdown-label">Total Users</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Order Status Distribution */}
            {analytics?.status_distribution && (
                <div className="finance-section">
                    <h2>📊 Order Status Distribution</h2>
                    <div className="status-distribution">
                        {analytics.status_distribution.map((item, i) => (
                            <div key={i} className="status-item">
                                <div className="status-name">{item.status}</div>
                                <div className="status-bar-container">
                                    <div
                                        className="status-bar-fill"
                                        style={{
                                            width: `${(item.value / Math.max(...analytics.status_distribution.map(d => d.value), 1)) * 100}%`
                                        }}
                                    ></div>
                                </div>
                                <div className="status-count">{item.value}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Finance;
