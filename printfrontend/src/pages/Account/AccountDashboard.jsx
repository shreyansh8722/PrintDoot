import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaUser, FaMapMarkerAlt, FaShoppingBag, FaHeart, FaCog, FaBox, FaStar } from 'react-icons/fa';
import userService from '../../services/userService';
import orderService from '../../services/orderService';
import './Account.css';

const AccountDashboard = () => {
    const [user, setUser] = useState(null);
    const [orderStats, setOrderStats] = useState({
        total: 0,
        pending: 0,
        delivered: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            setLoading(true);
            const [userData, ordersData] = await Promise.all([
                userService.getProfile(),
                orderService.getOrders()
            ]);

            setUser(userData);

            // Calculate order stats
            const stats = {
                total: ordersData.length || 0,
                pending: ordersData.filter(o => ['Pending', 'Processing', 'Printing'].includes(o.status)).length,
                delivered: ordersData.filter(o => o.status === 'Delivered').length
            };
            setOrderStats(stats);
        } catch (err) {
            console.error('Error loading dashboard:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="account-page">
                <div className="account-container">
                    <div className="loading-spinner">Loading...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="account-page">
            <div className="account-container">
                <div className="account-header">
                    <div className="welcome-section">
                        <h1>Welcome back, {user?.first_name || user?.username || 'User'}!</h1>
                        <p>Manage your account, orders, and preferences</p>
                    </div>
                </div>

                <div className="account-grid">
                    {/* Quick Stats */}
                    <div className="account-section">
                        <h2>Order Overview</h2>
                        <div className="stats-grid">
                            <div className="stat-card">
                                <div className="stat-icon">
                                    <FaShoppingBag />
                                </div>
                                <div className="stat-info">
                                    <div className="stat-value">{orderStats.total}</div>
                                    <div className="stat-label">Total Orders</div>
                                </div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon pending">
                                    <FaBox />
                                </div>
                                <div className="stat-info">
                                    <div className="stat-value">{orderStats.pending}</div>
                                    <div className="stat-label">Pending Orders</div>
                                </div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon delivered">
                                    <FaStar />
                                </div>
                                <div className="stat-info">
                                    <div className="stat-value">{orderStats.delivered}</div>
                                    <div className="stat-label">Delivered</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="account-section">
                        <h2>Quick Actions</h2>
                        <div className="quick-actions-grid">
                            <Link to="/account/orders" className="action-card">
                                <FaShoppingBag className="action-icon" />
                                <div className="action-content">
                                    <h3>My Orders</h3>
                                    <p>View and track your orders</p>
                                </div>
                            </Link>

                            <Link to="/account/profile" className="action-card">
                                <FaUser className="action-icon" />
                                <div className="action-content">
                                    <h3>Profile</h3>
                                    <p>Edit your personal information</p>
                                </div>
                            </Link>

                            <Link to="/account/addresses" className="action-card">
                                <FaMapMarkerAlt className="action-icon" />
                                <div className="action-content">
                                    <h3>Addresses</h3>
                                    <p>Manage shipping addresses</p>
                                </div>
                            </Link>

                            <Link to="/account/designs" className="action-card">
                                <FaHeart className="action-icon" />
                                <div className="action-content">
                                    <h3>My Designs</h3>
                                    <p>View and manage saved designs</p>
                                </div>
                            </Link>

                            <Link to="/account/settings" className="action-card">
                                <FaCog className="action-icon" />
                                <div className="action-content">
                                    <h3>Settings</h3>
                                    <p>Account preferences</p>
                                </div>
                            </Link>
                        </div>
                    </div>

                    {/* Recent Orders */}
                    <div className="account-section full-width">
                        <div className="section-header">
                            <h2>Recent Orders</h2>
                            <Link to="/account/orders" className="view-all-link">
                                View All →
                            </Link>
                        </div>
                        <RecentOrdersPreview />
                    </div>
                </div>
            </div>
        </div>
    );
};

const RecentOrdersPreview = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadRecentOrders();
    }, []);

    const loadRecentOrders = async () => {
        try {
            const data = await orderService.getOrders();
            setOrders(data.slice(0, 5)); // Show only recent 5
        } catch (err) {
            console.error('Error loading orders:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="loading-spinner">Loading orders...</div>;
    }

    if (orders.length === 0) {
        return (
            <div className="empty-state">
                <FaShoppingBag className="empty-icon" />
                <p>You haven't placed any orders yet.</p>
                <Link to="/view-all" className="btn-primary">Start Shopping</Link>
            </div>
        );
    }

    return (
        <div className="orders-list">
            {orders.map(order => (
                <Link key={order.id} to={`/account/orders/${order.id}`} className="order-card">
                    <div className="order-card-header">
                        <div>
                            <div className="order-number">Order #{order.id}</div>
                            <div className="order-date">
                                {new Date(order.created_at).toLocaleDateString('en-IN', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}
                            </div>
                        </div>
                        <span className={`status-badge status-${order.status.toLowerCase().replace(' ', '-')}`}>
                            {order.status}
                        </span>
                    </div>
                    <div className="order-card-body">
                        <div className="order-items-preview">
                            {order.items?.slice(0, 3).map((item, idx) => (
                                <div key={idx} className="order-item-preview">
                                    <img 
                                        src={item.product?.primary_image || 'https://placehold.co/40x40'} 
                                        alt={item.product_name_snapshot || 'Product'} 
                                    />
                                </div>
                            ))}
                            {order.items?.length > 3 && (
                                <div className="order-item-preview more">
                                    +{order.items.length - 3}
                                </div>
                            )}
                        </div>
                        <div className="order-total">
                            ₹{parseFloat(order.total_amount).toFixed(2)}
                        </div>
                    </div>
                </Link>
            ))}
        </div>
    );
};

export default AccountDashboard;
