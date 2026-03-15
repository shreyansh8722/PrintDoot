import React from 'react';
import { Search, User } from 'lucide-react';
import './Header.css';

const Header = () => {
    return (
        <header className="header">
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
                    {/* Placeholder for user avatar from image */}
                    <div className="avatar">
                        <User size={24} />
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
