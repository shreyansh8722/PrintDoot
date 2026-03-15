import React from 'react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const ComparisionChart = () => {
    const data = [
        { name: 'New', value: 400, color: '#BBDEFB' },
        { name: 'Repeated', value: 900, color: '#1E88E5' },
    ];

    return (
        <div style={{ width: '100%', height: 300, background: 'white', padding: '20px', borderRadius: '12px', boxShadow: 'var(--shadow-sm)' }}>
            <h3 style={{ marginBottom: '20px', fontSize: '1.1rem', color: '#333' }}>New vs. Repeated Orders</h3>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '5px' }}>1,234</div>
            <div style={{ color: '#10b981', fontSize: '0.9rem', marginBottom: '20px' }}>Last 30 days +12%</div>

            <ResponsiveContainer width="100%" height={200}>
                <BarChart data={data}>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#666' }} />
                    <Tooltip cursor={{ fill: 'transparent' }} />
                    <Bar dataKey="value" barSize={60} radius={[4, 4, 0, 0]}>
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default ComparisionChart;
