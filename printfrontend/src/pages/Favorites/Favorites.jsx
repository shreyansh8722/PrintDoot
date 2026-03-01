import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import catalogService from '../../services/catalogService';
import userService from '../../services/userService';
import './Favorites.css';

const Favorites = () => {
    const [favorites, setFavorites] = useState([]);
    const [loading, setLoading] = useState(true);
    const [removingId, setRemovingId] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        if (!userService.isAuthenticated()) {
            navigate('/login', { state: { from: { pathname: '/favorites' } } });
            return;
        }
        loadFavorites();
    }, [navigate]);

    const loadFavorites = async () => {
        try {
            const data = await catalogService.getFavorites();
            setFavorites(data);
        } catch (err) {
            console.error('Error loading favorites:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleRemove = async (productId) => {
        setRemovingId(productId);
        try {
            await catalogService.removeFavorite(productId);
            setFavorites(prev => prev.filter(f => f.product_id !== productId));
        } catch (err) {
            console.error('Error removing favorite:', err);
        } finally {
            setRemovingId(null);
        }
    };

    if (loading) {
        return (
            <div className="fav-page">
                <div className="fav-container">
                    <h1 className="fav-title">My Favorites</h1>
                    <div className="fav-grid">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="fav-card-skeleton">
                                <div className="fav-skel-img skeleton-shimmer" />
                                <div className="fav-skel-body">
                                    <div className="fav-skel-line skeleton-shimmer" style={{ width: '80%' }} />
                                    <div className="fav-skel-line skeleton-shimmer" style={{ width: '40%' }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fav-page">
            <div className="fav-container">
                <h1 className="fav-title">My Favorites</h1>
                <p className="fav-subtitle">{favorites.length} item{favorites.length !== 1 ? 's' : ''} saved</p>

                {favorites.length === 0 ? (
                    <div className="fav-empty">
                        <div className="fav-empty-icon">
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                            </svg>
                        </div>
                        <h2>No favorites yet</h2>
                        <p>Start browsing and tap the heart icon to save products you love.</p>
                        <Link to="/categories" className="fav-browse-btn">Browse Products</Link>
                    </div>
                ) : (
                    <div className="fav-grid">
                        {favorites.map((fav) => (
                            <div key={fav.id} className={`fav-card ${removingId === fav.product_id ? 'fav-card-removing' : ''}`}>
                                <Link to={`/product/${fav.product_slug}`} className="fav-card-link">
                                    <div className="fav-card-img">
                                        {fav.product_image ? (
                                            <img src={fav.product_image} alt={fav.product_name} />
                                        ) : (
                                            <div className="fav-card-placeholder">📷</div>
                                        )}
                                    </div>
                                    <div className="fav-card-body">
                                        <h3>{fav.product_name}</h3>
                                        <div className="fav-card-price">
                                            <span className="fav-price">₹{parseFloat(fav.product_final_price).toLocaleString('en-IN')}</span>
                                            {parseFloat(fav.product_price) > parseFloat(fav.product_final_price) && (
                                                <span className="fav-original">₹{parseFloat(fav.product_price).toLocaleString('en-IN')}</span>
                                            )}
                                        </div>
                                    </div>
                                </Link>
                                <button
                                    className="fav-remove-btn"
                                    onClick={() => handleRemove(fav.product_id)}
                                    disabled={removingId === fav.product_id}
                                    aria-label="Remove from favorites"
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="18" y1="6" x2="6" y2="18" />
                                        <line x1="6" y1="6" x2="18" y2="18" />
                                    </svg>
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Favorites;
