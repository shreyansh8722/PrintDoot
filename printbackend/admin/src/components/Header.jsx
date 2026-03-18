import React, { useState, useRef, useEffect } from 'react';
import { Search, User, Menu, LogOut, ChevronDown } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authAPI } from '../services/api';
import logo from '../assets/logo.webp';
import './Header.css';

const Header = ({ onToggleSidebar }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const profileRef = useRef(null);
    const navigate = useNavigate();
    const location = useLocation();
    const adminUser = authAPI.getUser();

    // Close profile dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (profileRef.current && !profileRef.current.contains(e.target)) {
                setShowProfileMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSearch = (e) => {
        e.preventDefault();
        if (!searchTerm.trim()) return;

        // Determine the best page to search based on current location
        const path = location.pathname;
        if (path.includes('orders')) {
            navigate(`/orders?search=${encodeURIComponent(searchTerm.trim())}`);
        } else if (path.includes('products')) {
            navigate(`/products?search=${encodeURIComponent(searchTerm.trim())}`);
        } else if (path.includes('customers')) {
            navigate(`/customers?search=${encodeURIComponent(searchTerm.trim())}`);
        } else if (path.includes('reviews')) {
            navigate(`/reviews?search=${encodeURIComponent(searchTerm.trim())}`);
        } else if (path.includes('offers')) {
            navigate(`/offers?search=${encodeURIComponent(searchTerm.trim())}`);
        } else {
            // Default: search orders
            navigate(`/orders?search=${encodeURIComponent(searchTerm.trim())}`);
        }

        // Dispatch a custom event so page components can pick up the search
        window.dispatchEvent(new CustomEvent('adminSearch', { detail: { term: searchTerm.trim() } }));
    };

    const handleLogout = () => {
        authAPI.logout();
        navigate('/login');
    };

    return (
        <header className="header">
            {/* Hamburger — mobile only */}
            <button className="header-hamburger" onClick={onToggleSidebar} aria-label="Toggle menu">
                <Menu size={22} />
            </button>

            <div className="header-logo">
                <img src={logo} alt="Printdoot" className="logo-image" />
            </div>

            <div className="header-search">
                <form onSubmit={handleSearch} className="search-wrapper">
                    <Search size={20} className="search-icon" />
                    <input
                        type="text"
                        placeholder="Search orders, products, customers..."
                        className="search-input"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </form>
            </div>

            <div className="header-profile" ref={profileRef}>
                <div
                    className="profile-wrapper"
                    onClick={() => setShowProfileMenu(prev => !prev)}
                >
                    <div className="avatar">
                        <User size={24} />
                    </div>
                    <ChevronDown size={14} className="profile-chevron" />
                </div>

                {showProfileMenu && (
                    <div className="profile-dropdown">
                        <div className="profile-dropdown-header">
                            <div className="profile-dropdown-avatar">
                                <User size={20} />
                            </div>
                            <div className="profile-dropdown-info">
                                <span className="profile-dropdown-name">{adminUser || 'Admin'}</span>
                                <span className="profile-dropdown-role">Administrator</span>
                            </div>
                        </div>
                        <div className="profile-dropdown-divider" />
                        <button className="profile-dropdown-item logout-item" onClick={handleLogout}>
                            <LogOut size={16} />
                            <span>Logout</span>
                        </button>
                    </div>
                )}
            </div>
        </header>
    );
};

export default Header;
