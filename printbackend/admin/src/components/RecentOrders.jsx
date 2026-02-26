import React from 'react';
import './RecentOrders.css';

const RecentOrders = () => {
    // This combines "Most Selling Products" and "Low Selling Products" from the image concepts, 
    // but I'll make generic table components.
    // Actually, looking at image 1 bottom: "Most Selling Products" and "Low Selling Products" tables.

    // I will create a reusable Table component.
    return (
        <div className="tables-grid">
            <ProductTable title="Most Selling Products" />
            <ProductTable title="Low Selling Products" />
        </div>
    );
};

const ProductTable = ({ title }) => {
    const products = title.includes("Most") ? [
        { name: 'Customized Pens', orders: 234, revenue: '₹2,40,500' },
        // ... more
    ] : [
        { name: 'Envelopes', orders: 12, revenue: '₹15,000' }
    ];

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
                    {products.map((p, i) => (
                        <tr key={i}>
                            <td>{p.name}</td>
                            <td style={{ textAlign: 'center' }}>{p.orders}</td>
                            <td style={{ textAlign: 'right' }}>{p.revenue}</td>
                        </tr>
                    ))}
                    {/* Filler rows */}
                    <tr><td>&nbsp;</td><td></td><td></td></tr>
                    <tr><td>&nbsp;</td><td></td><td></td></tr>
                </tbody>
            </table>
        </div>
    )
}

export default RecentOrders;
