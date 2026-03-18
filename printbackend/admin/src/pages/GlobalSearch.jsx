import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import {
    Search, Package, ShoppingCart, Users, Star, CreditCard,
    ArrowRight, Loader2, AlertCircle
} from 'lucide-react';
import {
    adminOrdersAPI, adminCatalogAPI, adminUserAPI,
    adminPromoCodeAPI, adminOfflinePaymentAPI
} from '../services/api';
import './GlobalSearch.css';

/* ── Section config ── */
const SECTIONS = [
    { key: 'all',       label: 'All',       icon: Search },
    { key: 'orders',    label: 'Orders',    icon: ShoppingCart },
    { key: 'products',  label: 'Products',  icon: Package },
    { key: 'customers', label: 'Customers', icon: Users },
    { key: 'reviews',   label: 'Reviews',   icon: Star },
    { key: 'payments',  label: 'Payments',  icon: CreditCard },
];

/* ── helpers ── */
const extract = (res) => {
    if (res.status !== 'fulfilled') return [];
    const d = res.value?.data;
    if (!d) return [];
    if (Array.isArray(d)) return d;
    if (d.results) return d.results;
    return [];
};

const safeFetch = (promise) => promise.catch(() => ({ data: [] }));

const GlobalSearch = () => {
    const [searchParams] = useSearchParams();
    const query = searchParams.get('q') || '';
    const [activeTab, setActiveTab] = useState('all');
    const [results, setResults] = useState({});
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState([]);
    const navigate = useNavigate();

    /* ── live search input so user can refine without going back to header ── */
    const [localQuery, setLocalQuery] = useState(query);
    useEffect(() => { setLocalQuery(query); }, [query]);

    const runSearch = useCallback(async (term) => {
        if (!term.trim()) return;
        setLoading(true);
        setResults({});
        setErrors([]);

        const calls = await Promise.allSettled([
            safeFetch(adminOrdersAPI.getOrders({ search: term, page_size: 10 })),
            safeFetch(adminCatalogAPI.getProducts({ search: term, page_size: 10 })),
            safeFetch(adminUserAPI.getUsers({ search: term, page_size: 10 })),
            safeFetch(adminCatalogAPI.getProductReviews({ search: term, page_size: 10 })),
            safeFetch(adminOfflinePaymentAPI.getPayments({ search: term })),
        ]);

        const keys = ['orders', 'products', 'customers', 'reviews', 'payments'];
        const searchResults = {};
        const errs = [];
        keys.forEach((k, i) => {
            const arr = extract(calls[i]);
            searchResults[k] = arr;
            if (calls[i].status === 'rejected') errs.push(k);
        });

        setResults(searchResults);
        setErrors(errs);
        setLoading(false);
    }, []);

    useEffect(() => { if (query.trim()) runSearch(query.trim()); }, [query, runSearch]);

    const handleLocalSearch = (e) => {
        e.preventDefault();
        const q = localQuery.trim();
        if (q) navigate(`/search?q=${encodeURIComponent(q)}`);
    };

    /* ── counts ── */
    const counts = {};
    let totalResults = 0;
    SECTIONS.forEach(s => {
        if (s.key === 'all') return;
        counts[s.key] = results[s.key]?.length || 0;
        totalResults += counts[s.key];
    });

    const visibleSections = activeTab === 'all'
        ? SECTIONS.filter(s => s.key !== 'all' && counts[s.key] > 0)
        : SECTIONS.filter(s => s.key === activeTab);

    /* ── render ── */
    return (
        <div className="gs-page">
            {/* Header + inline search */}
            <div className="gs-header">
                <h1 className="gs-title">🔍 Search</h1>
                <form onSubmit={handleLocalSearch} className="gs-inline-search">
                    <Search size={16} className="gs-inline-icon" />
                    <input
                        type="text"
                        value={localQuery}
                        onChange={e => setLocalQuery(e.target.value)}
                        placeholder="Search orders, products, customers, reviews..."
                        className="gs-inline-input"
                        autoFocus
                    />
                    <button type="submit" className="gs-inline-btn">Search</button>
                </form>
                {query && !loading && (
                    <p className="gs-subtitle">
                        Found <strong>{totalResults}</strong> result{totalResults !== 1 ? 's' : ''} for "<strong>{query}</strong>"
                    </p>
                )}
            </div>

            {/* Tabs */}
            {query && (
                <div className="gs-tabs">
                    {SECTIONS.map(s => {
                        const count = s.key === 'all' ? totalResults : counts[s.key];
                        return (
                            <button
                                key={s.key}
                                className={`gs-tab ${activeTab === s.key ? 'gs-tab-active' : ''}`}
                                onClick={() => setActiveTab(s.key)}
                            >
                                <s.icon size={14} />
                                {s.label}
                                <span className="gs-tab-count">{count}</span>
                            </button>
                        );
                    })}
                </div>
            )}

            {/* Error banner */}
            {errors.length > 0 && (
                <div className="gs-error-banner">
                    <AlertCircle size={16} />
                    Some sections failed to load ({errors.join(', ')}). Results may be incomplete.
                </div>
            )}

            {/* Content */}
            {!query ? (
                <div className="gs-empty">
                    <Search size={40} strokeWidth={1} />
                    <h3>Search across your admin panel</h3>
                    <p>Search for orders, products, customers, reviews, and payments all at once</p>
                </div>
            ) : loading ? (
                <div className="gs-loading">
                    <Loader2 size={24} className="gs-spinner" />
                    <span>Searching across all sections...</span>
                </div>
            ) : totalResults === 0 ? (
                <div className="gs-empty">
                    <Search size={40} strokeWidth={1} />
                    <h3>No results found for "{query}"</h3>
                    <p>Try a different search term, check the spelling, or search by order ID, customer email, or product name</p>
                </div>
            ) : (
                <div className="gs-results">
                    {visibleSections.map(section => {
                        const items = results[section.key] || [];
                        if (items.length === 0 && activeTab !== section.key) return null;
                        return (
                            <ResultSection
                                key={section.key}
                                section={section}
                                items={items}
                                query={query}
                            />
                        );
                    })}
                </div>
            )}
        </div>
    );
};

/* ── Result section renderer ── */
const ResultSection = ({ section, items, query }) => {
    const navMap = {
        orders: '/orders',
        products: '/products',
        customers: '/customers',
        reviews: '/reviews',
        payments: '/payments',
    };

    return (
        <div className="gs-section">
            <div className="gs-section-header">
                <h2><section.icon size={16} /> {section.label} ({items.length})</h2>
                <Link to={`${navMap[section.key]}?search=${encodeURIComponent(query)}`} className="gs-see-all">
                    View all in {section.label} <ArrowRight size={14} />
                </Link>
            </div>
            <div className="gs-cards">
                {items.length === 0 ? (
                    <div className="gs-card gs-card-empty">No {section.label.toLowerCase()} found</div>
                ) : (
                    items.slice(0, 8).map((item, idx) => (
                        <ResultCard key={item.id || idx} type={section.key} item={item} />
                    ))
                )}
            </div>
        </div>
    );
};

/* ── Individual result card ── */
const ResultCard = ({ type, item }) => {
    const linkMap = { orders: '/orders', products: '/products', customers: '/customers', reviews: '/reviews', payments: '/payments' };

    const renderContent = () => {
        switch (type) {
            case 'orders':
                return (
                    <>
                        <div className="gs-card-row">
                            <span className="gs-card-label">Order #{item.id}</span>
                            <span className={`gs-badge gs-badge-${(item.status || '').toLowerCase()}`}>{item.status}</span>
                        </div>
                        <div className="gs-card-row">
                            <span className="gs-card-sub">{item.user?.email || item.customer_name || '—'}</span>
                            <span className="gs-card-amount">₹{parseFloat(item.total_amount || 0).toLocaleString('en-IN')}</span>
                        </div>
                        {item.created_at && <div className="gs-card-meta">{new Date(item.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>}
                    </>
                );
            case 'products':
                return (
                    <>
                        <div className="gs-card-row">
                            <div className="gs-product-info">
                                {item.primary_image && <img src={item.primary_image} alt="" className="gs-product-thumb" loading="lazy" />}
                                <span className="gs-card-label">{item.name}</span>
                            </div>
                            <span className="gs-card-amount">₹{item.final_price || item.base_price}</span>
                        </div>
                        <div className="gs-card-meta">{item.subcategory_name || 'Uncategorized'} {item.sku ? `• SKU: ${item.sku}` : ''}</div>
                    </>
                );
            case 'customers':
                return (
                    <div className="gs-card-row">
                        <div className="gs-customer-info">
                            <div className="gs-avatar">{(item.first_name || item.username || '?').charAt(0).toUpperCase()}</div>
                            <div>
                                <span className="gs-card-label">{item.first_name || item.username} {item.last_name || ''}</span>
                                <span className="gs-card-meta">{item.email}</span>
                            </div>
                        </div>
                        <span className={`gs-badge ${item.is_active ? 'gs-badge-active' : 'gs-badge-inactive'}`}>
                            {item.is_active ? 'Active' : 'Inactive'}
                        </span>
                    </div>
                );
            case 'reviews':
                return (
                    <>
                        <div className="gs-card-row">
                            <span className="gs-card-label">{item.user_name || item.user?.email || 'Anonymous'}</span>
                            <span className="gs-stars">{'★'.repeat(item.rating || 0)}{'☆'.repeat(5 - (item.rating || 0))}</span>
                        </div>
                        <div className="gs-card-meta">{item.product_name ? `📦 ${item.product_name} — ` : ''}{item.comment?.slice(0, 120) || item.title || 'No comment'}</div>
                    </>
                );
            case 'payments':
                return (
                    <>
                        <div className="gs-card-row">
                            <span className="gs-card-label">{item.customer_name}</span>
                            <span className="gs-card-amount">₹{parseFloat(item.amount || 0).toLocaleString('en-IN')}</span>
                        </div>
                        <div className="gs-card-meta">{item.method_display || item.payment_method} • {item.status_display || item.status}</div>
                    </>
                );
            default: return null;
        }
    };

    return (
        <Link to={linkMap[type]} className="gs-card">
            {renderContent()}
        </Link>
    );
};

export default GlobalSearch;
