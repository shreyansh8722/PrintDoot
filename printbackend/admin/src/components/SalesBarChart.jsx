import React from 'react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const STATUS_COLORS = {
    Pending: '#f59e0b',
    Paid: '#10b981',
    Processing: '#3b82f6',
    Printing: '#6366f1',
    Shipped: '#06b6d4',
    Delivered: '#22c55e',
    Cancelled: '#ef4444',
    Refunded: '#ec4899',
};

const SalesBarChart = ({ data }) => {
    const chartData = data && data.length > 0
        ? data.map(item => ({
            name: item.status,
            value: item.value,
            color: STATUS_COLORS[item.status] || '#94a3b8',
        }))
        : [
            { name: 'Pending', value: 0, color: '#f59e0b' },
            { name: 'Processing', value: 0, color: '#3b82f6' },
            { name: 'Shipped', value: 0, color: '#06b6d4' },
            { name: 'Delivered', value: 0, color: '#22c55e' },
            { name: 'Cancelled', value: 0, color: '#ef4444' },
        ];

    const total = chartData.reduce((sum, item) => sum + (item.value || 0), 0);

    return (
        <div style={{ width: '100%', height: 300, background: 'white', padding: '20px', borderRadius: '12px', boxShadow: 'var(--shadow-sm)' }}>
            <h3 style={{ marginBottom: '10px', fontSize: '1.1rem', color: '#333' }}>Order Status</h3>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '5px' }}>{total.toLocaleString()}</div>
            <div style={{ color: '#6b7280', fontSize: '0.9rem', marginBottom: '20px' }}>Total orders</div>

            <ResponsiveContainer width="100%" height={180}>
                <BarChart data={chartData}>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#666' }} />
                    <Tooltip cursor={{ fill: 'transparent' }} />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                        {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default SalesBarChart;
