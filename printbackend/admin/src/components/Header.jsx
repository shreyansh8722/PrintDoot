import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Search, User, Menu, LogOut, ChevronDown, ShoppingCart, Package, Users, Star, X, Loader2, LayoutDashboard, BarChart3, Tag, CreditCard, Image, Megaphone, MessageSquare, Truck, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { authAPI, adminOrdersAPI, adminCatalogAPI, adminUserAPI } from '../services/api';
import logo from '../assets/logo.webp';
import './Header.css';

/* ── All admin pages for instant navigation search ── */
const ADMIN_NAV = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard, keywords: ['dashboard', 'home', 'overview'] },
    { name: 'Sales Analytics', path: '/sales', icon: BarChart3, keywords: ['sales', 'analytics', 'revenue', 'charts'] },
    { name: 'Orders', path: '/orders', icon: ShoppingCart, keywords: ['orders', 'order', 'transactions'] },
    { name: 'Products', path: '/products', icon: Package, keywords: ['products', 'product', 'catalog', 'items'] },
    { name: 'Customers', path: '/customers', icon: Users, keywords: ['customers', 'customer', 'users', 'accounts'] },
    { name: 'User Analytics', path: '/user-analytics', icon: Users, keywords: ['user analytics', 'user stats'] },
    { name: 'Order Analytics', path: '/order-analytics', icon: BarChart3, keywords: ['order analytics'] },
    { name: 'Cart Analytics', path: '/cart-analytics', icon: ShoppingCart, keywords: ['cart', 'abandoned'] },
    { name: 'Promo Codes', path: '/offers', icon: Tag, keywords: ['promo', 'promo codes', 'discount', 'coupon', 'offers'] },
    { name: 'Payments', path: '/payments', icon: CreditCard, keywords: ['payments', 'offline', 'transactions'] },
    { name: 'Reviews', path: '/reviews', icon: Star, keywords: ['reviews', 'ratings', 'feedback'] },
    { name: 'Site Images / Banners', path: '/banners', icon: Image, keywords: ['banners', 'images', 'hero', 'site images'] },
    { name: 'Marketing', path: '/marketing', icon: Megaphone, keywords: ['marketing', 'campaigns', 'emails'] },
    { name: 'Stocks', path: '/stocks', icon: Package, keywords: ['stock', 'inventory'] },
    { name: 'Courier', path: '/courier', icon: Truck, keywords: ['courier', 'shipping', 'delivery', 'shipment'] },
];

const Header = ({ onToggleSidebar }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const [results, setResults] = useState({});
    const [searching, setSearching] = useState(false);
    const profileRef = useRef(null);
    const searchRef = useRef(null);
    const searchTimer = useRef(null);
    const navigate = useNavigate();
    const adminUser = authAPI.getUser();

    // Close dropdowns on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (profileRef.current && !profileRef.current.contains(e.target)) setShowProfileMenu(false);
            if (searchRef.current && !searchRef.current.contains(e.target)) setShowResults(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Filter nav items by search term
    const matchedNav = searchTerm.trim().length >= 1
        ? ADMIN_NAV.filter(item => {
            const q = searchTerm.toLowerCase();
            return item.name.toLowerCase().includes(q) || item.keywords.some(k => k.includes(q));
        })
        : [];

    // Debounced live search
    const doSearch = useCallback(async (term) => {
        if (!term || term.length < 2) { setResults({}); return; }
        setSearching(true);
        setShowResults(true);
        const safe = (p) => p.catch(() => ({ data: [] }));
        const extract = (r) => { const d = r?.data; return Array.isArray(d) ? d : (d?.results || []); };

        const [o, p, c, r] = await Promise.all([
            safe(adminOrdersAPI.getOrders({ search: term, page_size: 5 })),
            safe(adminCatalogAPI.getProducts({ search: term, page_size: 5 })),
            safe(adminUserAPI.getUsers({ search: term, page_size: 5 })),
            safe(adminCatalogAPI.getProductReviews({ search: term, page_size: 5 })),
        ]);

        setResults({
            orders: extract(o),
            products: extract(p),
            customers: extract(c),
            reviews: extract(r),
        });
        setSearching(false);
    }, []);


    const handleInputChange = (e) => {
        const val = e.target.value;
        setSearchTerm(val);
        clearTimeout(searchTimer.current);
        const trimmed = val.trim();
        if (trimmed.length >= 1) {
            setShowResults(true); // Show nav results immediately
        }
        if (trimmed.length >= 2) {
            searchTimer.current = setTimeout(() => doSearch(trimmed), 350);
        } else {
            setResults({});
        }
        if (trimmed.length < 1) {
            setShowResults(false);
            setResults({});
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchTerm.trim().length >= 2) doSearch(searchTerm.trim());
    };

    const navigateTo = (path) => {
        setShowResults(false);
        setSearchTerm('');
        setResults({});
        navigate(path);
    };

    const totalResults = Object.values(results).reduce((s, a) => s + (a?.length || 0), 0);
    const hasAnything = matchedNav.length > 0 || totalResults > 0 || searching;

    const handleLogout = () => {
        authAPI.logout();
        navigate('/login');
    };

    return (
        <header className="header">
            <button className="header-hamburger" onClick={onToggleSidebar} aria-label="Toggle menu">
                <Menu size={22} />
            </button>

            <div className="header-logo">
                <img src={logo} alt="Printdoot" className="logo-image" />
            </div>

            {/* Search with live dropdown */}
            <div className="header-search" ref={searchRef}>
                <form onSubmit={handleSearch} className="search-wrapper">
                    <Search size={18} className="search-icon" />
                    <input
                        type="text"
                        placeholder="Search orders, products, customers..."
                        className="search-input"
                        value={searchTerm}
                        onChange={handleInputChange}
                        onFocus={() => { if (matchedNav.length > 0 || totalResults > 0) setShowResults(true); }}
                    />
                    {searchTerm && (
                        <button type="button" className="search-clear" onClick={() => { setSearchTerm(''); setResults({}); setShowResults(false); }}>
                            <X size={14} />
                        </button>
                    )}
                </form>

                {/* Live results dropdown */}
                {showResults && hasAnything && (
                    <div className="search-dropdown">
                        {/* Navigation pages — always instant */}
                        {matchedNav.length > 0 && (
                            <div className="search-dd-section">
                                <div className="search-dd-header">
                                    <LayoutDashboard size={13} /> Pages
                                </div>
                                {matchedNav.map(item => (
                                    <div key={item.path} className="search-dd-item search-dd-nav" onClick={() => navigateTo(item.path)}>
                                        <item.icon size={15} className="search-dd-nav-icon" />
                                        <span className="search-dd-primary">{item.name}</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {searching ? (
                            <div className="search-dd-loading"><Loader2 size={16} className="search-dd-spinner" /> Searching...</div>
                        ) : totalResults === 0 && matchedNav.length === 0 ? (
                            <div className="search-dd-empty">No results for "{searchTerm}"</div>
                        ) : (
                            <>
                                {/* Orders */}
                                {results.orders?.length > 0 && (
                                    <div className="search-dd-section">
                                        <div className="search-dd-header" onClick={() => navigateTo('/orders')}>
                                            <ShoppingCart size={13} /> Orders ({results.orders.length})
                                            <span className="search-dd-viewall">View all →</span>
                                        </div>
                                        {results.orders.map(o => (
                                            <div key={o.id} className="search-dd-item" onClick={() => navigateTo('/orders')}>
                                                <span className="search-dd-primary">Order #{o.id}</span>
                                                <span className="search-dd-secondary">{o.user?.email || o.customer_name || ''} · ₹{parseFloat(o.total_amount || 0).toLocaleString('en-IN')}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Products */}
                                {results.products?.length > 0 && (
                                    <div className="search-dd-section">
                                        <div className="search-dd-header" onClick={() => navigateTo('/products')}>
                                            <Package size={13} /> Products ({results.products.length})
                                            <span className="search-dd-viewall">View all →</span>
                                        </div>
                                        {results.products.map(p => (
                                            <div key={p.id} className="search-dd-item" onClick={() => navigateTo('/products')}>
                                                <span className="search-dd-primary">{p.name}</span>
                                                <span className="search-dd-secondary">₹{p.final_price || p.base_price} · {p.subcategory_name || ''}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Customers */}
                                {results.customers?.length > 0 && (
                                    <div className="search-dd-section">
                                        <div className="search-dd-header" onClick={() => navigateTo('/customers')}>
                                            <Users size={13} /> Customers ({results.customers.length})
                                            <span className="search-dd-viewall">View all →</span>
                                        </div>
                                        {results.customers.map(u => (
                                            <div key={u.id} className="search-dd-item" onClick={() => navigateTo('/customers')}>
                                                <span className="search-dd-primary">{u.first_name || u.username} {u.last_name || ''}</span>
                                                <span className="search-dd-secondary">{u.email}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Reviews */}
                                {results.reviews?.length > 0 && (
                                    <div className="search-dd-section">
                                        <div className="search-dd-header" onClick={() => navigateTo('/reviews')}>
                                            <Star size={13} /> Reviews ({results.reviews.length})
                                            <span className="search-dd-viewall">View all →</span>
                                        </div>
                                        {results.reviews.map(r => (
                                            <div key={r.id} className="search-dd-item" onClick={() => navigateTo('/reviews')}>
                                                <span className="search-dd-primary">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)} — {r.product_name || ''}</span>
                                                <span className="search-dd-secondary">{r.comment?.slice(0, 80) || r.title || 'No comment'}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}
            </div>

            <div className="header-profile" ref={profileRef}>
                <div className="profile-wrapper" onClick={() => setShowProfileMenu(prev => !prev)}>
                    <div className="avatar"><User size={24} /></div>
                    <ChevronDown size={14} className="profile-chevron" />
                </div>
                {showProfileMenu && (
                    <div className="profile-dropdown">
                        <div className="profile-dropdown-header">
                            <div className="profile-dropdown-avatar"><User size={20} /></div>
                            <div className="profile-dropdown-info">
                                <span className="profile-dropdown-name">{adminUser || 'Admin'}</span>
                                <span className="profile-dropdown-role">Administrator</span>
                            </div>
                        </div>
                        <div className="profile-dropdown-divider" />
                        <button className="profile-dropdown-item logout-item" onClick={handleLogout}>
                            <LogOut size={16} /><span>Logout</span>
                        </button>
                    </div>
                )}
            </div>
        </header>
    );
};

export default Header;
