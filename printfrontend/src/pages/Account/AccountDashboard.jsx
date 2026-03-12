import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    FaChevronRight, FaTruck, FaCheckCircle, FaClock,
    FaTimesCircle, FaMoneyBillWave,
} from 'react-icons/fa';
import { FiPackage, FiUser, FiMapPin, FiHeart, FiSettings } from 'react-icons/fi';
import { HiOutlineShoppingBag, HiOutlinePaintBrush } from 'react-icons/hi2';
import userService from '../../services/userService';
import orderService from '../../services/orderService';

/* ── Status badge config (same as Orders page) ── */
const STATUS_CONFIG = {
    delivered:  { bg: 'bg-emerald-50',  text: 'text-emerald-700', dot: 'bg-emerald-500' },
    paid:       { bg: 'bg-blue-50',     text: 'text-blue-700',    dot: 'bg-blue-500' },
    pending:    { bg: 'bg-amber-50',    text: 'text-amber-700',   dot: 'bg-amber-500' },
    processing: { bg: 'bg-amber-50',    text: 'text-amber-700',   dot: 'bg-amber-500' },
    printing:   { bg: 'bg-orange-50',   text: 'text-orange-700',  dot: 'bg-orange-500' },
    shipped:    { bg: 'bg-indigo-50',   text: 'text-indigo-700',  dot: 'bg-indigo-500' },
    cancelled:  { bg: 'bg-red-50',      text: 'text-red-600',     dot: 'bg-red-500' },
    refunded:   { bg: 'bg-gray-50',     text: 'text-gray-600',    dot: 'bg-gray-400' },
};
const getStatusCfg = (status) => STATUS_CONFIG[status?.toLowerCase()] || STATUS_CONFIG.pending;

const AccountDashboard = () => {
    const [user, setUser] = useState(null);
    const [orders, setOrders] = useState([]);
    const [orderStats, setOrderStats] = useState({ total: 0, pending: 0, delivered: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => { loadDashboardData(); }, []);

    const loadDashboardData = async () => {
        try {
            setLoading(true);
            const [userData, ordersData] = await Promise.all([
                userService.getProfile(),
                orderService.getOrders()
            ]);
            setUser(userData);
            setOrders(ordersData.slice(0, 5));
            setOrderStats({
                total: ordersData.length || 0,
                pending: ordersData.filter(o => ['Pending', 'Processing', 'Printing'].includes(o.status)).length,
                delivered: ordersData.filter(o => o.status === 'Delivered').length,
            });
        } catch (err) {
            console.error('Error loading dashboard:', err);
        } finally {
            setLoading(false);
        }
    };

    /* ── Loading skeleton ── */
    if (loading) {
        return (
            <div className="bg-white min-h-screen">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
                    <div className="h-10 w-64 bg-gray-100 rounded-lg skeleton-shimmer mb-2" />
                    <div className="h-4 w-48 bg-gray-100 rounded skeleton-shimmer mb-8" />
                    <div className="grid grid-cols-3 gap-4 mb-8">
                        {[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-gray-50 rounded-2xl skeleton-shimmer" />)}
                    </div>
                    <div className="space-y-3">
                        {[...Array(3)].map((_, i) => <div key={i} className="h-20 bg-gray-50 rounded-2xl skeleton-shimmer" />)}
                    </div>
                </div>
            </div>
        );
    }

    const firstName = user?.first_name || user?.username || 'User';
    const initials = (user?.first_name?.[0] || user?.email?.[0] || '?').toUpperCase();

    return (
        <div className="bg-white min-h-screen">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">

                {/* ── Welcome header ── */}
                <div className="flex items-center gap-4 mb-10">
                    {user?.avatar ? (
                        <img src={user.avatar} alt="Avatar" className="w-14 h-14 rounded-full object-cover border-2 border-gray-100" />
                    ) : (
                        <div className="w-14 h-14 rounded-full bg-brand/10 flex items-center justify-center text-brand text-xl font-bold">
                            {initials}
                        </div>
                    )}
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
                            Welcome back, {firstName}!
                        </h1>
                        <p className="text-sm text-gray-500">Manage your account, orders, and preferences</p>
                    </div>
                </div>

                {/* ── Stats cards ── */}
                <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-10">
                    <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 text-center hover:shadow-md transition-shadow">
                        <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center mx-auto mb-3">
                            <HiOutlineShoppingBag className="text-brand text-lg" />
                        </div>
                        <p className="text-2xl sm:text-3xl font-bold text-gray-900">{orderStats.total}</p>
                        <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Total Orders</p>
                    </div>
                    <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 text-center hover:shadow-md transition-shadow">
                        <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center mx-auto mb-3">
                            <FaClock className="text-amber-500 text-lg" />
                        </div>
                        <p className="text-2xl sm:text-3xl font-bold text-gray-900">{orderStats.pending}</p>
                        <p className="text-xs sm:text-sm text-gray-500 mt-0.5">In Progress</p>
                    </div>
                    <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 text-center hover:shadow-md transition-shadow">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center mx-auto mb-3">
                            <FaCheckCircle className="text-emerald-500 text-lg" />
                        </div>
                        <p className="text-2xl sm:text-3xl font-bold text-gray-900">{orderStats.delivered}</p>
                        <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Delivered</p>
                    </div>
                </div>

                {/* ── Quick actions ── */}
                <div className="mb-10">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                        {[
                            { to: '/account/orders',    icon: FiPackage,        label: 'Orders',    desc: 'Track orders' },
                            { to: '/account/profile',   icon: FiUser,           label: 'Profile',   desc: 'Personal info' },
                            { to: '/account/addresses', icon: FiMapPin,         label: 'Addresses', desc: 'Shipping' },
                            { to: '/account/designs',   icon: HiOutlinePaintBrush, label: 'Designs',  desc: 'Saved designs' },
                            { to: '/account/settings',  icon: FiSettings,       label: 'Settings',  desc: 'Preferences' },
                        ].map(({ to, icon: Icon, label, desc }) => (
                            <Link
                                key={to}
                                to={to}
                                className="group flex flex-col items-center gap-2.5 p-4 sm:p-5 rounded-2xl border border-gray-100 bg-white hover:border-brand/20 hover:shadow-md transition-all"
                            >
                                <div className="w-10 h-10 rounded-xl bg-gray-50 group-hover:bg-brand/10 flex items-center justify-center transition-colors">
                                    <Icon className="text-gray-500 group-hover:text-brand text-lg transition-colors" />
                                </div>
                                <div className="text-center">
                                    <p className="text-sm font-semibold text-gray-900">{label}</p>
                                    <p className="text-[11px] text-gray-400">{desc}</p>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* ── Recent orders ── */}
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-gray-900">Recent Orders</h2>
                        <Link to="/account/orders" className="flex items-center gap-1 text-sm font-semibold text-brand hover:text-brand/80 transition-colors">
                            View All <FaChevronRight className="text-[10px]" />
                        </Link>
                    </div>

                    {orders.length === 0 ? (
                        <div className="text-center py-14 rounded-2xl border border-gray-100">
                            <div className="w-16 h-16 mx-auto rounded-full bg-gray-50 flex items-center justify-center mb-4">
                                <HiOutlineShoppingBag className="text-2xl text-gray-300" />
                            </div>
                            <p className="text-sm text-gray-500 mb-4">No orders yet</p>
                            <Link to="/view-all" className="inline-flex items-center gap-2 bg-brand text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-brand/90 transition-colors">
                                Start Shopping <FaChevronRight className="text-xs" />
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {orders.map(order => {
                                const cfg = getStatusCfg(order.status);
                                return (
                                    <Link
                                        key={order.id}
                                        to={`/account/orders/${order.id}`}
                                        className="group flex items-center gap-4 p-4 rounded-2xl border border-gray-100 bg-white hover:border-brand/20 hover:shadow-md transition-all"
                                    >
                                        {/* Thumbnails */}
                                        <div className="flex -space-x-2 flex-shrink-0">
                                            {order.items?.slice(0, 3).map((item, idx) => (
                                                <div key={idx} className="w-10 h-10 rounded-lg bg-gray-50 border-2 border-white overflow-hidden">
                                                    <img
                                                        src={item.product?.primary_image || 'https://placehold.co/40x40?text=📦'}
                                                        alt=""
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                            ))}
                                            {(order.items?.length || 0) > 3 && (
                                                <div className="w-10 h-10 rounded-lg bg-gray-100 border-2 border-white flex items-center justify-center text-[10px] font-semibold text-gray-400">
                                                    +{order.items.length - 3}
                                                </div>
                                            )}
                                        </div>

                                        {/* Order info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="text-sm font-bold text-gray-900">#{order.id}</span>
                                                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${cfg.bg} ${cfg.text}`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                                                    {order.status}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-400 mt-0.5">
                                                {new Date(order.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </p>
                                        </div>

                                        {/* Amount + arrow */}
                                        <div className="text-right flex-shrink-0">
                                            <p className="text-sm font-bold text-gray-900">₹{parseFloat(order.total_amount).toLocaleString('en-IN')}</p>
                                        </div>
                                        <FaChevronRight className="text-[10px] text-gray-300 group-hover:text-brand transition-colors flex-shrink-0" />
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AccountDashboard;
