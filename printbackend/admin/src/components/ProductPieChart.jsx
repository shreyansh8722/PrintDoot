import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const ProductPieChart = () => {
    const data = [
        { name: 'Standard Visiting Cards', value: 400, color: '#FFEB3B' },
        { name: 'Leaf Visiting Cards (New)', value: 300, color: '#03A9F4' },
        { name: 'Circle Visiting Cards (New)', value: 300, color: '#673AB7' },
        { name: 'Digital Visiting Cards', value: 200, color: '#FF5722' },
        { name: 'QR Code Visiting Cards', value: 278, color: '#CDDC39' },
        { name: 'NFC Visiting Cards', value: 189, color: '#4CAF50' },
        // Adding more details as per image is hard with specific values, generic colorful pie.
    ];

    const COLORS = ['#FFBB28', '#FF8042', '#0088FE', '#00C49F', '#FF6666', '#8884d8'];

    return (
        <div style={{ width: '100%', height: 300, background: 'white', padding: '20px', borderRadius: '12px', boxShadow: 'var(--shadow-sm)' }}>
            <h3 style={{ marginBottom: '20px', fontSize: '1.1rem', color: '#333', textAlign: 'center' }}>Product By Category</h3>
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip />
                    {/* Legend might be too big for this view, maybe simplified */}
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
};

export default ProductPieChart;
