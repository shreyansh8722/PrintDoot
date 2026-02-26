import React from 'react';
import { Link } from 'react-router-dom';
import './NotFound.css';

const NotFound = () => {
    return (
        <div className="not-found-page">
            <div className="not-found-container">
                <div className="not-found-content">
                    <h1 className="not-found-title">404</h1>
                    <h2 className="not-found-subtitle">Page Not Found</h2>
                    <p className="not-found-message">
                        Sorry, the page you are looking for does not exist or has been moved.
                    </p>
                    <div className="not-found-actions">
                        <Link to="/" className="not-found-button not-found-button-primary">
                            Go to Homepage
                        </Link>
                        <Link to="/categories" className="not-found-button not-found-button-secondary">
                            Browse Categories
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NotFound;
