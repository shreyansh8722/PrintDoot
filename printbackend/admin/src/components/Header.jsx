import React from 'react';
import { Search, User, Menu } from 'lucide-react';
import './Header.css';

const Header = ({ onToggleSidebar }) => {
    return (
        <header className="header">
            {/* Hamburger — mobile only */}
            <button className="header-hamburger" onClick={onToggleSidebar} aria-label="Toggle menu">
                <Menu size={22} />
            </button>

            <div className="header-logo">
                <h1 className="logo-text">
                    <span className="logo-highlight">P</span>rintdoot.com
                </h1>
            </div>

            <div className="header-search">
                <div className="search-wrapper">
                    <Search size={20} className="search-icon" />
                    <input type="text" placeholder="" className="search-input" />
                </div>
            </div>

            <div className="header-profile">
                <div className="profile-wrapper">
                    <div className="avatar">
                        <User size={24} />
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
