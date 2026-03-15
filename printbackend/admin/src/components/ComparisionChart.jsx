import React from 'react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const ComparisionChart = ({ data }) => {
    const chartData = data
        ? [
            { name: 'New', value: data.new || 0, color: '#BBDEFB' },
            { name: 'Repeated', value: data.repeated || 0, color: '#1E88E5' },
        ]
        : [
            { name: 'New', value: 0, color: '#BBDEFB' },
            { name: 'Repeated', value: 0, color: '#1E88E5' },
        ];

    const total = chartData.reduce((sum, item) => sum + item.value, 0);

    return (
        <div style={{ width: '100%', height: 300, background: 'white', padding: '20px', borderRadius: '12px', boxShadow: 'var(--shadow-sm)' }}>
            <h3 style={{ marginBottom: '10px', fontSize: '1.1rem', color: '#333' }}>New vs. Repeated Customers</h3>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '5px' }}>{total.toLocaleString()}</div>
            <div style={{ color: '#6b7280', fontSize: '0.9rem', marginBottom: '20px' }}>Paid customers</div>

            <ResponsiveContainer width="100%" height={180}>
                <BarChart data={chartData}>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#666' }} />
                    <Tooltip cursor={{ fill: 'transparent' }} />
                    <Bar dataKey="value" barSize={60} radius={[4, 4, 0, 0]}>
                        {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default ComparisionChart;
