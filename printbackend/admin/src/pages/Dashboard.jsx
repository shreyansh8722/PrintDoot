import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import {
    ShoppingCart, BarChart2, Users, Star, GitCompare, CalendarDays,
    CreditCard, Wallet, Package, TrendingUp, TrendingDown, AlertTriangle,
    XCircle, Clock, Plus
} from 'lucide-react';
import { adminDashboardAPI } from '../services/api';
import './Dashboard.css';

const STOCK_COLORS = ['#10b981', '#f59e0b', '#ef4444'];
const MONTH_COLORS = [
    '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e', '#14b8a6',
    '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#ec4899'
];

const Dashboard = () => {
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        try {
            setLoading(true);
            const response = await adminDashboardAPI.getAnalytics();
            setAnalytics(response.data);
        } catch (error) {
            console.error('Error fetching dashboard analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount) => {
        if (!amount) return '₹0';
        return `₹${parseFloat(amount).toLocaleString('en-IN')}`;
    };

    if (loading) {
        return (
            <div className="dashboard-loading">
                <div className="loading-spinner"></div>
                <p>Loading dashboard...</p>
            </div>
        );
    }

    return (
        <div className="dashboard-page">
            {/* Add New Product Button */}
            <div className="dashboard-top-bar">
                <button className="add-product-btn">
                    <Plus size={18} />
                    Add New Product
                </button>
            </div>

            {/* Row 1: Top Stat Cards */}
            <section className="top-stats-grid">
                <div className="stat-card-new stat-orders">
                    <div className="stat-card-content">
                        <h4 className="stat-label">Orders</h4>
                        <p className="stat-number">{analytics?.total_orders?.toLocaleString() || '0'}</p>
                    </div>
                    <div className="stat-icon-wrap orders-icon">
                        <ShoppingCart size={28} />
                    </div>
                </div>

                <div className="stat-card-new stat-sales">
                    <div className="stat-card-content">
                        <h4 className="stat-label">Sales & Analytics</h4>
                        <p className="stat-number">{formatCurrency(analytics?.total_revenue)}</p>
                    </div>
                    <div className="stat-icon-wrap sales-icon">
                        <BarChart2 size={28} />
                    </div>
                </div>

                <div className="stat-card-new stat-customers">
                    <div className="stat-card-content">
                        <h4 className="stat-label">Total Customers</h4>
                        <p className="stat-number">{analytics?.total_users?.toLocaleString() || '0'}</p>
                    </div>
                    <div className="stat-icon-wrap customers-icon">
                        <Users size={28} />
                    </div>
                </div>

                <div className="stat-card-new stat-reviews">
                    <div className="stat-card-content">
                        <h4 className="stat-label">Reviews</h4>
                        <p className="stat-number">{analytics?.total_reviews || 0}+ Reviews</p>
                    </div>
                    <div className="stat-icon-wrap reviews-icon">
                        <Star size={28} />
                    </div>
                </div>
            </section>

            {/* Row 2: Secondary Stat Cards */}
            <section className="secondary-stats-grid">
                <div className="stat-card-secondary">
                    <div className="stat-card-content">
                        <h4 className="stat-label">Comparison Reports</h4>
                    </div>
                    <div className="stat-icon-wrap compare-icon">
                        <GitCompare size={24} />
                    </div>
                </div>

                <div className="stat-card-secondary">
                    <div className="stat-card-content">
                        <h4 className="stat-label">September Month Sale</h4>
                        <p className="stat-number">{analytics?.current_month_orders?.toLocaleString() || '0'}</p>
                    </div>
                    <div className="stat-icon-wrap sale-icon">
                        <CalendarDays size={24} />
                    </div>
                </div>

                <div className="stat-card-secondary">
                    <div className="stat-card-content">
                        <h4 className="stat-label">Total Payments</h4>
                        <p className="stat-number">{formatCurrency(analytics?.total_payments)}</p>
                    </div>
                    <div className="stat-icon-wrap payment-icon">
                        <CreditCard size={24} />
                    </div>
                </div>

                <div className="stat-card-secondary">
                    <div className="stat-card-content">
                        <h4 className="stat-label">Expense Payment</h4>
                        <p className="stat-number">{formatCurrency(analytics?.expense_payment)}</p>
                    </div>
                    <div className="stat-icon-wrap expense-icon">
                        <Wallet size={24} />
                    </div>
                </div>
            </section>

            {/* Product Performance Section */}
            <section className="product-performance-section">
                <h2 className="section-title">
                    <Package size={22} />
                    Product Performance
                </h2>
                <div className="performance-stats-grid">
                    <div className="perf-stat-card">
                        <span className="perf-stat-label">Total Active SKUs</span>
                        <span className="perf-stat-value">{analytics?.total_active_skus?.toLocaleString() || '0'}</span>
                    </div>
                    <div className="perf-stat-card">
                        <span className="perf-stat-label">Top Selling SKU</span>
                        <span className="perf-stat-value">{analytics?.top_selling_sku || 'N/A'}</span>
                    </div>
                    <div className="perf-stat-card">
                        <span className="perf-stat-label">Low Performing SKU Count</span>
                        <span className="perf-stat-value">{analytics?.low_performing_sku_count || 0}</span>
                    </div>
                    <div className="perf-stat-card">
                        <span className="perf-stat-label">Stock Alerts</span>
                        <span className="perf-stat-value">{analytics?.stock_alerts_count || 0}</span>
                    </div>
                </div>
            </section>

            {/* Product Details Table */}
            <section className="product-details-section">
                <h2 className="section-title">Product Details</h2>
                <div className="table-container">
                    <table className="product-details-table">
                        <thead>
                            <tr>
                                <th>Product SKU</th>
                                <th>Sales</th>
                                <th>Units Sold</th>
                                <th>Margin %</th>
                                <th>Customization %</th>
                                <th>Inventory</th>
                                <th>Status</th>
                                <th>Notes</th>
                            </tr>
                        </thead>
                        <tbody>
                            {analytics?.product_details?.length > 0 ? (
                                analytics.product_details.map((product, idx) => (
                                    <tr key={idx}>
                                        <td className="sku-cell">{product.sku}</td>
                                        <td>{formatCurrency(product.sales)}</td>
                                        <td>{product.units_sold}</td>
                                        <td>{product.margin_pct}%</td>
                                        <td>{product.customization_pct}%</td>
                                        <td>{product.inventory}</td>
                                        <td>
                                            <span className={`status-badge ${product.status === 'In Stock' ? 'status-in-stock' : product.status === 'Low Stock' ? 'status-low-stock' : 'status-out-of-stock'}`}>
                                                {product.status}
                                            </span>
                                        </td>
                                        <td className="notes-cell">{product.notes}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="8" className="empty-row">No product data available</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>

            {/* Charts Row: Stocks Chart & Monthly New Customer Reports */}
            <section className="charts-row">
                <div className="chart-card chart-stocks">
                    <h3 className="chart-title">Stocks Chart</h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                            <Pie
                                data={analytics?.stocks_chart || []}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={90}
                                paddingAngle={3}
                                dataKey="value"
                            >
                                {(analytics?.stocks_chart || []).map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={STOCK_COLORS[index % STOCK_COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend
                                iconType="circle"
                                iconSize={10}
                                formatter={(value, entry) => {
                                    const item = analytics?.stocks_chart?.find(s => s.name === value);
                                    return `${value} ${item ? item.value : ''}`;
                                }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                <div className="chart-card chart-monthly">
                    <h3 className="chart-title">Monthly New Customer Reports</h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                            <Pie
                                data={analytics?.monthly_new_customers || []}
                                cx="50%"
                                cy="50%"
                                outerRadius={90}
                                paddingAngle={1}
                                dataKey="value"
                                label={({ name, value }) => value > 0 ? `${name} ${value}` : ''}
                                labelLine={false}
                            >
                                {(analytics?.monthly_new_customers || []).map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={MONTH_COLORS[index % MONTH_COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </section>

            {/* Alerts Section */}
            <section className="alerts-section">
                <h2 className="section-title">Alerts</h2>

                {analytics?.alerts?.low_inventory?.length > 0 && (
                    <div className="alert-card alert-warning">
                        <div className="alert-icon-wrap alert-icon-yellow">
                            <AlertTriangle size={20} />
                        </div>
                        <div className="alert-content">
                            <h4 className="alert-title">Low Inventory</h4>
                            <p className="alert-skus">{analytics.alerts.low_inventory.join(', ')}</p>
                        </div>
                    </div>
                )}

                {analytics?.alerts?.out_of_stock?.length > 0 && (
                    <div className="alert-card alert-danger">
                        <div className="alert-icon-wrap alert-icon-red">
                            <XCircle size={20} />
                        </div>
                        <div className="alert-content">
                            <h4 className="alert-title">Out of Stock</h4>
                            <p className="alert-skus">{analytics.alerts.out_of_stock.join(', ')}</p>
                        </div>
                    </div>
                )}

                {analytics?.alerts?.slow_moving?.length > 0 && (
                    <div className="alert-card alert-info">
                        <div className="alert-icon-wrap alert-icon-blue">
                            <Clock size={20} />
                        </div>
                        <div className="alert-content">
                            <h4 className="alert-title">Slow Moving SKUs</h4>
                            <p className="alert-skus">{analytics.alerts.slow_moving.join(', ')}</p>
                        </div>
                    </div>
                )}

                {/* Fallback if no alerts */}
                {(!analytics?.alerts?.low_inventory?.length && !analytics?.alerts?.out_of_stock?.length && !analytics?.alerts?.slow_moving?.length) && (
                    <div className="alert-card alert-success">
                        <div className="alert-icon-wrap alert-icon-green">
                            <TrendingUp size={20} />
                        </div>
                        <div className="alert-content">
                            <h4 className="alert-title">All Clear!</h4>
                            <p className="alert-skus">No stock alerts at this time.</p>
                        </div>
                    </div>
                )}
            </section>
        </div>
    );
};

export default Dashboard;
