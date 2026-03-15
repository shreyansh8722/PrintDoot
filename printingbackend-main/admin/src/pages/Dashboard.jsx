import React from 'react';
import StatCard from '../components/StatCard';
import SalesBarChart from '../components/SalesBarChart';
import ProductPieChart from '../components/ProductPieChart';
import ComparisionChart from '../components/ComparisionChart';
import RecentOrders from '../components/RecentOrders';
import './Dashboard.css';

const Dashboard = () => {
    return (
        <div className="dashboard-page">
            {/* Row 1: Stat Cards */}
            <section className="stats-grid">
                <StatCard title="Total orders" value="1,234" />
                <StatCard title="Pending Orders" value="345" />
                <StatCard title="Average order value" value="₹10,250" />
                <StatCard title="Cancellation rate" value="2%" />
            </section>

            {/* Row 2: Charts */}
            <section className="charts-section">
                <h2 className="section-title">Insights</h2>
                <div className="charts-grid">
                    <SalesBarChart />
                    <ProductPieChart />
                    <ComparisionChart />
                </div>
            </section>

            {/* Row 3: Tables */}
            <section className="tables-section">
                <h2 className="section-title">Most Selling Products & Low Selling</h2>
                <RecentOrders />
            </section>
        </div>
    );
};

export default Dashboard;
