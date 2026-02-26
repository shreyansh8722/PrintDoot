import React from 'react';
import './StatCard.css';

const StatCard = ({ title, value, subtext, trend, trendValue }) => {
    return (
        <div className="stat-card">
            <div className="stat-header">
                <h3 className="stat-title">{title}</h3>
            </div>
            <div className="stat-content">
                <div className="stat-value">{value}</div>
                {subtext && <div className="stat-subtext">{subtext}</div>}
            </div>
            {trend && (
                <div className={`stat-trend ${trend === 'up' ? 'trend-up' : 'trend-down'}`}>
                    {trend === 'up' ? '↑' : '↓'} {trendValue}
                </div>
            )}
        </div>
    );
};

export default StatCard;
