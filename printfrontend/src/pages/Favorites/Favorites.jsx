import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaChevronRight } from 'react-icons/fa';
import { HiOutlineHeart } from 'react-icons/hi2';
import { IoHeartDislikeOutline } from 'react-icons/io5';
import catalogService from '../../services/catalogService';
import userService from '../../services/userService';

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

    /* ── Loading skeleton ── */
    if (loading) {
        return (
            <div className="bg-white min-h-screen">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
                    <div className="h-8 w-48 bg-gray-100 rounded-lg skeleton-shimmer mb-2" />
                    <div className="h-4 w-32 bg-gray-100 rounded skeleton-shimmer mb-8" />
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="rounded-2xl overflow-hidden">
                                <div className="aspect-square bg-gray-50 skeleton-shimmer" />
                                <div className="p-4 space-y-2">
                                    <div className="h-4 w-3/4 bg-gray-100 rounded skeleton-shimmer" />
                                    <div className="h-4 w-1/2 bg-gray-100 rounded skeleton-shimmer" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white min-h-screen">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">

                {/* ── Header ── */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-1">
                        <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center">
                            <HiOutlineHeart className="text-brand text-lg" />
                        </div>
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">My Favorites</h1>
                            <p className="text-sm text-gray-500">{favorites.length} item{favorites.length !== 1 ? 's' : ''} saved</p>
                        </div>
                    </div>
                </div>

                {/* ── Empty state ── */}
                {favorites.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="w-20 h-20 mx-auto rounded-full bg-gray-50 flex items-center justify-center mb-5">
                            <HiOutlineHeart className="text-3xl text-gray-300" />
                        </div>
                        <h2 className="text-xl font-semibold text-gray-800 mb-2">No favorites yet</h2>
                        <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">
                            Start browsing and tap the heart icon to save products you love.
                        </p>
                        <Link to="/categories" className="inline-flex items-center gap-2 bg-brand text-white px-6 py-3 rounded-xl text-sm font-semibold hover:bg-brand/90 transition-colors">
                            Browse Products <FaChevronRight className="text-xs" />
                        </Link>
                    </div>
                ) : (
                    /* ── Favorites grid ── */
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                        {favorites.map((fav) => (
                            <div
                                key={fav.id}
                                className={`group relative rounded-2xl border border-gray-100 bg-white overflow-hidden hover:border-brand/20 hover:shadow-lg transition-all duration-300 ${
                                    removingId === fav.product_id ? 'opacity-50 scale-95' : ''
                                }`}
                            >
                                {/* Remove button */}
                                <button
                                    onClick={() => handleRemove(fav.product_id)}
                                    disabled={removingId === fav.product_id}
                                    className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm border border-gray-100 flex items-center justify-center text-gray-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition-all shadow-sm cursor-pointer"
                                    aria-label="Remove from favorites"
                                >
                                    <IoHeartDislikeOutline className="text-sm" />
                                </button>

                                <Link to={`/product/${fav.product_slug}`} className="block">
                                    {/* Image */}
                                    <div className="aspect-square bg-gray-50 overflow-hidden">
                                        {fav.product_image ? (
                                            <img
                                                src={fav.product_image}
                                                alt={fav.product_name}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-300 text-3xl">📷</div>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="p-4">
                                        <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 mb-2 group-hover:text-brand transition-colors">
                                            {fav.product_name}
                                        </h3>
                                        <div className="flex items-center gap-2">
                                            <span className="text-base font-bold text-gray-900">
                                                ₹{parseFloat(fav.product_final_price).toLocaleString('en-IN')}
                                            </span>
                                            {parseFloat(fav.product_price) > parseFloat(fav.product_final_price) && (
                                                <span className="text-xs text-gray-400 line-through">
                                                    ₹{parseFloat(fav.product_price).toLocaleString('en-IN')}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </Link>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Favorites;
