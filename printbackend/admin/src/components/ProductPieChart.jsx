import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const COLORS = ['#FFBB28', '#FF8042', '#0088FE', '#00C49F', '#FF6666', '#8884d8', '#82ca9d', '#ffc658'];

const ProductPieChart = ({ data }) => {
    const chartData = data && data.length > 0
        ? data.map((item, i) => ({
            name: item.name || 'Unknown',
            value: item.value || 0,
            color: COLORS[i % COLORS.length],
        }))
        : [
            { name: 'No data', value: 1, color: '#e5e7eb' },
        ];

    return (
        <div style={{ width: '100%', height: 300, background: 'white', padding: '20px', borderRadius: '12px', boxShadow: 'var(--shadow-sm)' }}>
            <h3 style={{ marginBottom: '10px', fontSize: '1.1rem', color: '#333', textAlign: 'center' }}>Products By Category</h3>
            <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                    <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                    >
                        {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
};

export default ProductPieChart;
