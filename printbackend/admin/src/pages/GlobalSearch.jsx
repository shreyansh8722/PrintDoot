import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
    Search, Package, ShoppingCart, Users, Star, Tag, CreditCard,
    ArrowRight, Loader2
} from 'lucide-react';
import {
    adminOrdersAPI, adminCatalogAPI, adminUserAPI,
    adminPromoCodeAPI, adminOfflinePaymentAPI
} from '../services/api';
import './GlobalSearch.css';

const SECTIONS = [
    { key: 'all', label: 'All', icon: Search },
    { key: 'orders', label: 'Orders', icon: ShoppingCart },
    { key: 'products', label: 'Products', icon: Package },
    { key: 'customers', label: 'Customers', icon: Users },
    { key: 'reviews', label: 'Reviews', icon: Star },
    { key: 'payments', label: 'Payments', icon: CreditCard },
];

const GlobalSearch = () => {
    const [searchParams] = useSearchParams();
    const query = searchParams.get('q') || '';
    const [activeTab, setActiveTab] = useState('all');
    const [results, setResults] = useState({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (query.trim()) runSearch(query.trim());
    }, [query]);

    const runSearch = async (term) => {
        setLoading(true);
        const lower = term.toLowerCase();
        const searchResults = {};

        // Run all searches in parallel
        const [ordersRes, productsRes, customersRes, reviewsRes, paymentsRes] = await Promise.allSettled([
            adminOrdersAPI.getOrders({ search: term, page_size: 10 }),
            adminCatalogAPI.getProducts({ search: term, page_size: 10 }),
            adminUserAPI.getUsers({ search: term, page_size: 10 }),
            adminCatalogAPI.getProductReviews({ search: term, page_size: 10 }),
            adminOfflinePaymentAPI.getPayments({ search: term }),
        ]);

        if (ordersRes.status === 'fulfilled') {
            const d = ordersRes.value.data;
            searchResults.orders = Array.isArray(d) ? d : (d.results || []);
        }
        if (productsRes.status === 'fulfilled') {
            const d = productsRes.value.data;
            searchResults.products = Array.isArray(d) ? d : (d.results || []);
        }
        if (customersRes.status === 'fulfilled') {
            const d = customersRes.value.data;
            searchResults.customers = Array.isArray(d) ? d : (d.results || []);
        }
        if (reviewsRes.status === 'fulfilled') {
            const d = reviewsRes.value.data;
            searchResults.reviews = Array.isArray(d) ? d : (d.results || []);
        }
        if (paymentsRes.status === 'fulfilled') {
            const d = paymentsRes.value.data;
            searchResults.payments = Array.isArray(d) ? d : (d.results || []);
        }

        setResults(searchResults);
        setLoading(false);
    };

    const totalResults = Object.values(results).reduce((s, arr) => s + (arr?.length || 0), 0);

    const getFilteredResults = () => {
        if (activeTab === 'all') return results;
        return { [activeTab]: results[activeTab] || [] };
    };

    const filtered = getFilteredResults();

    return (
        <div className="gs-page">
            <div className="gs-header">
                <h1 className="gs-title">Search Results</h1>
                <p className="gs-subtitle">
                    {loading ? 'Searching...' : `Found ${totalResults} result${totalResults !== 1 ? 's' : ''} for "${query}"`}
                </p>
            </div>

            {/* Tabs */}
            <div className="gs-tabs">
                {SECTIONS.map(s => {
                    const count = results[s.key]?.length || (s.key === 'all' ? totalResults : 0);
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

            {loading ? (
                <div className="gs-loading">
                    <Loader2 size={24} className="gs-spinner" />
                    <span>Searching across all sections...</span>
                </div>
            ) : totalResults === 0 ? (
                <div className="gs-empty">
                    <Search size={40} strokeWidth={1} />
                    <h3>No results found</h3>
                    <p>Try a different search term or check the spelling</p>
                </div>
            ) : (
                <div className="gs-results">
                    {/* Orders */}
                    {filtered.orders?.length > 0 && (
                        <div className="gs-section">
                            <div className="gs-section-header">
                                <h2><ShoppingCart size={16} /> Orders ({filtered.orders.length})</h2>
                                <Link to={`/orders?search=${encodeURIComponent(query)}`} className="gs-see-all">
                                    View all <ArrowRight size={14} />
                                </Link>
                            </div>
                            <div className="gs-cards">
                                {filtered.orders.slice(0, 5).map(order => (
                                    <Link to="/orders" key={order.id} className="gs-card">
                                        <div className="gs-card-row">
                                            <span className="gs-card-label">Order #{order.id}</span>
                                            <span className={`gs-badge gs-badge-${(order.status || '').toLowerCase()}`}>{order.status}</span>
                                        </div>
                                        <div className="gs-card-row">
                                            <span>{order.customer_name || order.email || '—'}</span>
                                            <span className="gs-card-amount">₹{parseFloat(order.total_amount || 0).toLocaleString('en-IN')}</span>
                                        </div>
                                        <div className="gs-card-meta">{order.created_at ? new Date(order.created_at).toLocaleDateString() : ''}</div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Products */}
                    {filtered.products?.length > 0 && (
                        <div className="gs-section">
                            <div className="gs-section-header">
                                <h2><Package size={16} /> Products ({filtered.products.length})</h2>
                                <Link to={`/products?search=${encodeURIComponent(query)}`} className="gs-see-all">
                                    View all <ArrowRight size={14} />
                                </Link>
                            </div>
                            <div className="gs-cards">
                                {filtered.products.slice(0, 5).map(product => (
                                    <Link to="/products" key={product.id} className="gs-card">
                                        <div className="gs-card-row">
                                            <div className="gs-product-info">
                                                {product.primary_image && (
                                                    <img src={product.primary_image} alt="" className="gs-product-thumb" />
                                                )}
                                                <span className="gs-card-label">{product.name}</span>
                                            </div>
                                            <span className="gs-card-amount">₹{product.final_price || product.base_price}</span>
                                        </div>
                                        <div className="gs-card-meta">{product.subcategory_name || 'Uncategorized'} • SKU: {product.slug?.toUpperCase()}</div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Customers */}
                    {filtered.customers?.length > 0 && (
                        <div className="gs-section">
                            <div className="gs-section-header">
                                <h2><Users size={16} /> Customers ({filtered.customers.length})</h2>
                                <Link to={`/customers?search=${encodeURIComponent(query)}`} className="gs-see-all">
                                    View all <ArrowRight size={14} />
                                </Link>
                            </div>
                            <div className="gs-cards">
                                {filtered.customers.slice(0, 5).map(user => (
                                    <div key={user.id} className="gs-card">
                                        <div className="gs-card-row">
                                            <div className="gs-customer-info">
                                                <div className="gs-avatar">{(user.first_name || user.username || '?').charAt(0).toUpperCase()}</div>
                                                <div>
                                                    <span className="gs-card-label">{user.first_name} {user.last_name || ''}</span>
                                                    <span className="gs-card-meta">{user.email}</span>
                                                </div>
                                            </div>
                                            <span className={`gs-badge ${user.is_active ? 'gs-badge-active' : 'gs-badge-inactive'}`}>
                                                {user.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Reviews */}
                    {filtered.reviews?.length > 0 && (
                        <div className="gs-section">
                            <div className="gs-section-header">
                                <h2><Star size={16} /> Reviews ({filtered.reviews.length})</h2>
                                <Link to="/reviews" className="gs-see-all">
                                    View all <ArrowRight size={14} />
                                </Link>
                            </div>
                            <div className="gs-cards">
                                {filtered.reviews.slice(0, 5).map(review => (
                                    <div key={review.id} className="gs-card">
                                        <div className="gs-card-row">
                                            <span className="gs-card-label">{review.user_name || 'Anonymous'}</span>
                                            <span className="gs-stars">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span>
                                        </div>
                                        <div className="gs-card-meta">{review.comment?.slice(0, 100) || review.title || 'No comment'}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Payments */}
                    {filtered.payments?.length > 0 && (
                        <div className="gs-section">
                            <div className="gs-section-header">
                                <h2><CreditCard size={16} /> Offline Payments ({filtered.payments.length})</h2>
                                <Link to="/payments" className="gs-see-all">
                                    View all <ArrowRight size={14} />
                                </Link>
                            </div>
                            <div className="gs-cards">
                                {filtered.payments.slice(0, 5).map(payment => (
                                    <div key={payment.id} className="gs-card">
                                        <div className="gs-card-row">
                                            <span className="gs-card-label">{payment.customer_name}</span>
                                            <span className="gs-card-amount">₹{parseFloat(payment.amount).toLocaleString('en-IN')}</span>
                                        </div>
                                        <div className="gs-card-meta">{payment.method_display} • {payment.status_display}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default GlobalSearch;
