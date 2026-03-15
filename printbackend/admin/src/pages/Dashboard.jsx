import React, { useState, useEffect } from 'react';
import StatCard from '../components/StatCard';
import SalesBarChart from '../components/SalesBarChart';
import ProductPieChart from '../components/ProductPieChart';
import ComparisionChart from '../components/ComparisionChart';
import RecentOrders from '../components/RecentOrders';
import { adminDashboardAPI } from '../services/api';
import './Dashboard.css';

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
        return <div className="loading">Loading dashboard...</div>;
    }

    return (
        <div className="dashboard-page">
            {/* Row 1: Stat Cards */}
            <section className="stats-grid">
                <StatCard
                    title="Total Orders"
                    value={analytics?.total_orders?.toLocaleString() || '0'}
                    subtext={`${analytics?.pending_orders || 0} pending`}
                />
                <StatCard
                    title="Total Revenue"
                    value={formatCurrency(analytics?.total_revenue)}
                    trend={analytics?.revenue_growth > 0 ? 'up' : analytics?.revenue_growth < 0 ? 'down' : undefined}
                    trendValue={analytics?.revenue_growth ? `${analytics.revenue_growth}%` : undefined}
                />
                <StatCard
                    title="Avg Order Value"
                    value={formatCurrency(analytics?.avg_order_value)}
                />
                <StatCard
                    title="Cancellation Rate"
                    value={`${analytics?.cancellation_rate || 0}%`}
                />
            </section>

            {/* Row 2: Charts */}
            <section className="charts-section">
                <h2 className="section-title">Insights</h2>
                <div className="charts-grid">
                    <SalesBarChart data={analytics?.status_distribution} />
                    <ProductPieChart data={analytics?.category_distribution} />
                    <ComparisionChart data={analytics?.new_vs_repeated} />
                </div>
            </section>

            {/* Row 3: Tables */}
            <section className="tables-section">
                <h2 className="section-title">Product Performance</h2>
                <RecentOrders
                    mostSelling={analytics?.most_selling}
                    leastSelling={analytics?.least_selling}
                />
            </section>

            {/* Row 4: Low Stock Alert */}
            {analytics?.low_stock_products?.length > 0 && (
                <section className="low-stock-section">
                    <h2 className="section-title">⚠️ Low Stock Alert</h2>
                    <div className="low-stock-grid">
                        {analytics.low_stock_products.map((product) => (
                            <div key={product.id} className="low-stock-item">
                                <div className="low-stock-name">{product.name}</div>
                                <div className="low-stock-sku"><code>{product.sku}</code></div>
                                <div className="low-stock-qty">{product.stock_quantity} left</div>
                            </div>
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
};

export default Dashboard;
