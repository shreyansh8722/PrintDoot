import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    FaSearch, FaTruck, FaCheckCircle, FaClock,
    FaTimesCircle, FaMoneyBillWave, FaShippingFast,
    FaChevronRight, FaSlidersH,
} from 'react-icons/fa';
import { HiOutlineShoppingBag } from 'react-icons/hi2';
import { FiPackage } from 'react-icons/fi';
import orderService from '../../services/orderService';

/* ── Status config ── */
const STATUS_CONFIG = {
    delivered:  { icon: FaCheckCircle,   bg: 'bg-emerald-50',  text: 'text-emerald-700', ring: 'ring-emerald-200', dot: 'bg-emerald-500' },
    paid:       { icon: FaMoneyBillWave, bg: 'bg-brand-50',     text: 'text-brand-700',    ring: 'ring-brand-200',    dot: 'bg-brand' },
    pending:    { icon: FaClock,         bg: 'bg-amber-50',    text: 'text-amber-700',   ring: 'ring-amber-200',   dot: 'bg-amber-500' },
    processing: { icon: FaClock,         bg: 'bg-amber-50',    text: 'text-amber-700',   ring: 'ring-amber-200',   dot: 'bg-amber-500' },
    printing:   { icon: FaClock,         bg: 'bg-orange-50',   text: 'text-orange-700',  ring: 'ring-orange-200',  dot: 'bg-orange-500' },
    shipped:    { icon: FaTruck,         bg: 'bg-indigo-50',   text: 'text-indigo-700',  ring: 'ring-indigo-200',  dot: 'bg-indigo-500' },
    cancelled:  { icon: FaTimesCircle,   bg: 'bg-red-50',      text: 'text-red-600',     ring: 'ring-red-200',     dot: 'bg-red-500' },
    refunded:   { icon: FaTimesCircle,   bg: 'bg-gray-50',     text: 'text-gray-600',    ring: 'ring-gray-200',    dot: 'bg-gray-400' },
};
const getConfig = (status) => STATUS_CONFIG[status?.toLowerCase()] || STATUS_CONFIG.pending;

const STATUS_TABS = [
    { key: 'all', label: 'All' },
    { key: 'pending', label: 'Pending' },
    { key: 'paid', label: 'Paid' },
    { key: 'processing', label: 'Processing' },
    { key: 'shipped', label: 'Shipped' },
    { key: 'delivered', label: 'Delivered' },
    { key: 'cancelled', label: 'Cancelled' },
];

/* ══════════════════════════════════════════════════
   ORDERS PAGE
   ══════════════════════════════════════════════════ */
const Orders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [sortBy, setSortBy] = useState('newest');
    const [showFilters, setShowFilters] = useState(false);

    useEffect(() => {
        loadOrders();
    }, [statusFilter, sortBy]);

    const loadOrders = async () => {
        try {
            setLoading(true);
            const params = {};
            if (sortBy === 'newest') params.ordering = '-created_at';
            else if (sortBy === 'oldest') params.ordering = 'created_at';
            else if (sortBy === 'amount_high') params.ordering = '-total_amount';
            else if (sortBy === 'amount_low') params.ordering = 'total_amount';

            const data = await orderService.getOrders(params);

            let filtered = data;
            if (statusFilter !== 'all') {
                filtered = data.filter(o => o.status.toLowerCase() === statusFilter.toLowerCase());
            }
            if (searchTerm) {
                filtered = filtered.filter(o =>
                    o.id.toString().includes(searchTerm) ||
                    o.items?.some(i => i.product_name_snapshot?.toLowerCase().includes(searchTerm.toLowerCase()))
                );
            }
            setOrders(filtered);
        } catch {
            setError('Failed to load orders');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => { e.preventDefault(); loadOrders(); };

    /* ── Loading skeleton ── */
    if (loading) {
        return (
            <div className="bg-white min-h-screen">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
                    <div className="h-8 w-48 bg-gray-100 rounded-lg skeleton-shimmer mb-2" />
                    <div className="h-4 w-64 bg-gray-100 rounded skeleton-shimmer mb-8" />
                    <div className="space-y-4">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="h-44 bg-gray-50 rounded-2xl skeleton-shimmer" />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white min-h-screen">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">

                {/* ── Header ── */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-1">
                        <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center">
                            <FiPackage className="text-brand text-lg" />
                        </div>
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">My Orders</h1>
                            <p className="text-sm text-gray-500">Track and manage all your orders</p>
                        </div>
                    </div>
                </div>

                {/* ── Search + Filter Toggle ── */}
                <div className="flex flex-col sm:flex-row gap-3 mb-5">
                    <form onSubmit={handleSearch} className="flex-1 relative">
                        <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                        <input
                            type="text"
                            placeholder="Search by order # or product name…"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand/40 transition-all placeholder:text-gray-400"
                        />
                    </form>
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium border transition-all cursor-pointer ${
                            showFilters ? 'bg-brand text-white border-brand' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                        }`}
                    >
                        <FaSlidersH className="text-xs" /> Filters
                    </button>
                </div>

                {/* ── Filter panel ── */}
                {showFilters && (
                    <div className="mb-6 p-4 bg-gray-50/80 rounded-2xl border border-gray-100 flex flex-col sm:flex-row gap-4 animate-fadeInUp">
                        <div className="flex-1">
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Status</label>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/30"
                            >
                                {STATUS_TABS.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
                                <option value="printing">Printing</option>
                                <option value="refunded">Refunded</option>
                            </select>
                        </div>
                        <div className="flex-1">
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Sort By</label>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/30"
                            >
                                <option value="newest">Newest First</option>
                                <option value="oldest">Oldest First</option>
                                <option value="amount_high">Amount: High → Low</option>
                                <option value="amount_low">Amount: Low → High</option>
                            </select>
                        </div>
                    </div>
                )}

                {/* ── Status pill tabs ── */}
                <div className="flex gap-2 overflow-x-auto pb-1 mb-8 scrollbar-hide">
                    {STATUS_TABS.map(t => (
                        <button
                            key={t.key}
                            onClick={() => setStatusFilter(t.key)}
                            className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-all cursor-pointer ${
                                statusFilter === t.key
                                    ? 'bg-brand text-white shadow-sm'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>

                {/* ── Error ── */}
                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600 font-medium">{error}</div>
                )}

                {/* ── Empty state ── */}
                {orders.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="w-20 h-20 mx-auto rounded-full bg-gray-50 flex items-center justify-center mb-5">
                            <HiOutlineShoppingBag className="text-3xl text-gray-300" />
                        </div>
                        <h2 className="text-xl font-semibold text-gray-800 mb-2">No orders found</h2>
                        <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">
                            {searchTerm || statusFilter !== 'all'
                                ? 'Try adjusting your search or filters.'
                                : "You haven't placed any orders yet. Start exploring!"}
                        </p>
                        {!searchTerm && statusFilter === 'all' && (
                            <Link to="/view-all" className="inline-flex items-center gap-2 bg-brand text-white px-6 py-3 rounded-xl text-sm font-semibold hover:bg-brand/90 transition-colors">
                                Start Shopping <FaChevronRight className="text-xs" />
                            </Link>
                        )}
                    </div>
                ) : (
                    /* ── Orders list ── */
                    <div className="space-y-4">
                        {orders.map(order => <OrderCard key={order.id} order={order} />)}
                    </div>
                )}
            </div>
        </div>
    );
};


/* ══════════════════════════════════════════════════
   ORDER CARD
   ══════════════════════════════════════════════════ */
const OrderCard = ({ order }) => {
    const cfg = getConfig(order.status);
    const itemCount = order.items?.length || 0;

    return (
        <Link
            to={`/account/orders/${order.id}`}
            className="block group rounded-2xl border border-gray-100 bg-white hover:border-brand/20 hover:shadow-lg transition-all duration-300 overflow-hidden"
        >
            {/* Top row — order info + status */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 sm:px-6 pt-5 pb-3">
                <div>
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-base font-bold text-gray-900">Order #{order.id}</span>
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ring-1 ${cfg.bg} ${cfg.text} ${cfg.ring}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                            {order.status}
                        </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                        {new Date(order.created_at).toLocaleDateString('en-IN', {
                            year: 'numeric', month: 'long', day: 'numeric',
                        })}
                    </p>
                </div>
                <div className="text-left sm:text-right">
                    <p className="text-lg font-bold text-gray-900">₹{parseFloat(order.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                    <p className="text-xs text-gray-400">{itemCount} {itemCount === 1 ? 'item' : 'items'}</p>
                </div>
            </div>

            {/* Items preview thumbnails */}
            <div className="px-5 sm:px-6 pb-4">
                <div className="flex items-center gap-3 overflow-x-auto py-2 scrollbar-hide">
                    {order.items?.slice(0, 5).map((item, idx) => (
                        <div key={idx} className="relative flex-shrink-0 w-16 h-16 rounded-xl bg-gray-50 border border-gray-100 overflow-hidden">
                            <img
                                src={item.product?.primary_image || 'https://placehold.co/80x80?text=📦'}
                                alt={item.product_name_snapshot || 'Product'}
                                className="w-full h-full object-cover"
                            />
                            {item.quantity > 1 && (
                                <span className="absolute -top-1 -right-1 w-5 h-5 bg-brand text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-sm">
                                    {item.quantity}
                                </span>
                            )}
                        </div>
                    ))}
                    {itemCount > 5 && (
                        <div className="flex-shrink-0 w-16 h-16 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-xs font-semibold text-gray-400">
                            +{itemCount - 5}
                        </div>
                    )}
                </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 bg-gray-50/60 border-t border-gray-100">
                <div className="flex items-center gap-4 text-xs text-gray-500">
                    {order.shipment?.tracking_number && (
                        <span className="flex items-center gap-1.5">
                            <FaTruck className="text-brand" />
                            {order.shipment.tracking_number}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-3">
                    {['Shipped', 'Delivered'].includes(order.status) && order.shipment?.tracking_number && (
                        <Link
                            to={`/track-order/${order.shipment.tracking_number}`}
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-1.5 text-xs font-semibold text-brand hover:text-brand/80 transition-colors"
                        >
                            <FaShippingFast /> Track
                        </Link>
                    )}
                    <span className="flex items-center gap-1 text-xs font-semibold text-gray-400 group-hover:text-brand transition-colors">
                        Details <FaChevronRight className="text-[10px]" />
                    </span>
                </div>
            </div>
        </Link>
    );
};

export default Orders;
