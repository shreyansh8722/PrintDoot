import React from 'react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const SalesBarChart = () => {
    const data = [
        { name: 'Pending', value: 1234, color: '#1E88E5' }, // Blue
        { name: 'Processing', value: 200, color: '#BBDEFB' }, // Light Blue
        { name: 'Shipped', value: 3000, color: '#90CAF9' }, // Light Blue
        { name: 'Delivered', value: 450, color: '#BBDEFB' },
        { name: 'Cancelled', value: 800, color: '#BBDEFB' },
    ];
    // Wait, image 1 shows different bars. "Order Status": Pending, Processing, Shipped, Delivered, Cancelled.
    // One big blue "Pending", one big "Shipped". Others small.
    // Let's mock similar data.

    const width = '100%';
    const height = 300;

    return (
        <div style={{ width, height, background: 'white', padding: '20px', borderRadius: '12px', boxShadow: 'var(--shadow-sm)' }}>
            <h3 style={{ marginBottom: '20px', fontSize: '1.1rem', color: '#333' }}>Order Status</h3>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '5px' }}>1,234</div>
            <div style={{ color: '#10b981', fontSize: '0.9rem', marginBottom: '20px' }}>Total +12%</div>

            <ResponsiveContainer width="100%" height={200}>
                <BarChart data={data}>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#666' }} />
                    <Tooltip cursor={{ fill: 'transparent' }} />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default SalesBarChart;
