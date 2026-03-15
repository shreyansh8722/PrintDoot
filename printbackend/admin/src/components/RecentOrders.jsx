import React from 'react';
import './RecentOrders.css';

const RecentOrders = ({ mostSelling, leastSelling }) => {
    return (
        <div className="tables-grid">
            <ProductTable title="Most Selling Products" products={mostSelling} />
            <ProductTable title="Low Selling Products" products={leastSelling} />
        </div>
    );
};

const formatCurrency = (amount) => {
    if (!amount) return '₹0';
    return `₹${parseFloat(amount).toLocaleString('en-IN')}`;
};

const ProductTable = ({ title, products }) => {
    const data = products && products.length > 0 ? products : [];

    return (
        <div className="product-table-card">
            <h3 className="table-title">{title}</h3>
            <table className="simple-table">
                <thead>
                    <tr>
                        <th style={{ textAlign: 'left' }}>Product</th>
                        <th style={{ textAlign: 'center' }}>Orders</th>
                        <th style={{ textAlign: 'right' }}>Revenue</th>
                    </tr>
                </thead>
                <tbody>
                    {data.length === 0 ? (
                        <tr><td colSpan="3" style={{ textAlign: 'center', color: '#9ca3af', padding: '20px' }}>No data available</td></tr>
                    ) : (
                        data.map((p, i) => (
                            <tr key={i}>
                                <td>{p.name}</td>
                                <td style={{ textAlign: 'center' }}>{p.orders}</td>
                                <td style={{ textAlign: 'right' }}>{formatCurrency(p.revenue)}</td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default RecentOrders;
