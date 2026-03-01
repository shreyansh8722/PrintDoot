import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import catalogService from '../../services/catalogService';
import userService from '../../services/userService';

/* ── Image with skeleton shimmer ── */
function CarouselImage({ src, alt, className = '' }) {
    const [loaded, setLoaded] = useState(false);
    const [error, setError] = useState(false);

    return (
        <>
            {!loaded && !error && (
                <div className="absolute inset-0 skeleton-shimmer bg-gray-200" />
            )}
            {error && (
                <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
                    <span className="text-3xl text-gray-300">📷</span>
                </div>
            )}
            <img
                src={src}
                alt={alt}
                loading="lazy"
                onLoad={() => setLoaded(true)}
                onError={() => setError(true)}
                className={`transition-all duration-500 ${loaded ? 'opacity-100' : 'opacity-0'} ${className}`}
            />
        </>
    );
}

/* ── Heart SVG icons ── */
const HeartOutline = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
);

const HeartFilled = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="#ef4444" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
);

const ProductCarousel = ({ title, items, type = "product", className = "" }) => {
    const scrollRef = useRef(null);
    const scrollAmount = type === "category" ? 280 : 320;
    const navigate = useNavigate();
    const [favoriteIds, setFavoriteIds] = useState(new Set());
    const [togglingIds, setTogglingIds] = useState(new Set());

    // Load user's favorite IDs on mount
    useEffect(() => {
        const loadFavorites = async () => {
            try {
                const isLoggedIn = userService.isAuthenticated();
                if (isLoggedIn) {
                    const ids = await catalogService.getFavoriteIds();
                    setFavoriteIds(new Set(ids));
                }
            } catch {
                // Not logged in or error — ignore
            }
        };
        if (type === 'product') loadFavorites();
    }, [type]);

    const handleToggleFavorite = useCallback(async (e, productId) => {
        e.preventDefault();
        e.stopPropagation();

        const isLoggedIn = userService.isAuthenticated();
        if (!isLoggedIn) {
            navigate('/login', { state: { from: { pathname: window.location.pathname } } });
            return;
        }

        if (togglingIds.has(productId)) return;

        setTogglingIds(prev => new Set(prev).add(productId));

        // Optimistic UI
        setFavoriteIds(prev => {
            const next = new Set(prev);
            if (next.has(productId)) next.delete(productId);
            else next.add(productId);
            return next;
        });

        try {
            await catalogService.toggleFavorite(productId);
        } catch {
            // Revert on error
            setFavoriteIds(prev => {
                const next = new Set(prev);
                if (next.has(productId)) next.delete(productId);
                else next.add(productId);
                return next;
            });
        } finally {
            setTogglingIds(prev => {
                const next = new Set(prev);
                next.delete(productId);
                return next;
            });
        }
    }, [togglingIds, navigate]);

    const scroll = (direction) => {
        if (scrollRef.current) {
            scrollRef.current.scrollBy({
                left: direction === "left" ? -scrollAmount : scrollAmount,
                behavior: "smooth",
            });
        }
    };

    return (
        <div className={`relative w-full py-4 ${className}`}>
            {/* Section header */}
            <div className="px-10 mb-8 flex items-end justify-between">
                <div>
                    <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
                        {title}
                    </h2>
                    <div className="mt-2.5 h-1 w-14 bg-blue-600 rounded-full" />
                </div>
                <Link
                    to="/view-all"
                    className="text-sm font-semibold text-gray-500 hover:text-gray-900 transition-colors flex items-center gap-1 pb-1"
                >
                    View All
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                </Link>
            </div>

            <div className="relative group/carousel">
                {/* Navigation Buttons */}
                <button
                    onClick={() => scroll("left")}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-white border border-gray-200 text-gray-700 w-10 h-10 rounded-full shadow-lg z-20 opacity-0 group-hover/carousel:opacity-100 hover:bg-gray-900 hover:text-white hover:border-gray-900 transition-all duration-300 flex items-center justify-center"
                    aria-label="Scroll left"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                </button>

                <div
                    ref={scrollRef}
                    className="flex overflow-x-auto scroll-smooth w-full px-10 gap-5 pt-2 pb-2 -mt-2"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', overflow: '-moz-scrollbars-none' }}
                >
                    {items.map((item, index) => {
                        const imgSrc = item.image || item.img;
                        const href = item.href;
                        const isExternal = href && href.startsWith('http');
                        const isInternal = href && href !== '#' && !isExternal;

                        if (type === "category") {
                            return (
                                <div
                                    key={item.id || index}
                                    className="flex-shrink-0 group cursor-pointer transition-all duration-300 hover:-translate-y-1 w-44 sm:w-52"
                                >
                                    {/* Circular image with hover ring */}
                                    <div className="relative overflow-hidden w-36 h-36 sm:w-40 sm:h-40 rounded-full border-[3px] border-gray-100 group-hover:border-blue-500 shadow-sm group-hover:shadow-lg transition-all duration-400">
                                        {isInternal ? (
                                            <Link to={href} className="block h-full">
                                                <CarouselImage
                                                    src={imgSrc}
                                                    alt={item.title}
                                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                />
                                            </Link>
                                        ) : isExternal ? (
                                            <a href={href} target="_blank" rel="noopener noreferrer" className="block h-full">
                                                <CarouselImage
                                                    src={imgSrc}
                                                    alt={item.title}
                                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                />
                                            </a>
                                        ) : (
                                            <CarouselImage
                                                src={imgSrc}
                                                alt={item.title}
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                            />
                                        )}
                                    </div>

                                    {/* Label */}
                                    <div className="mt-3">
                                        {isInternal ? (
                                            <Link to={href} className="block">
                                                <h3 className="font-semibold text-sm text-gray-800 group-hover:text-blue-600 transition-colors line-clamp-2">
                                                    {item.title}
                                                </h3>
                                            </Link>
                                        ) : (
                                            <h3 className="font-semibold text-sm text-gray-800 line-clamp-2">
                                                {item.title}
                                            </h3>
                                        )}
                                    </div>
                                </div>
                            );
                        }

                        const isFav = (item.productId || item.id) ? favoriteIds.has(item.productId || item.id) : false;
                        const isToggling = (item.productId || item.id) ? togglingIds.has(item.productId || item.id) : false;

                        // Product card
                        return (
                            <div
                                key={item.id || index}
                                className="flex-shrink-0 group cursor-pointer transition-all duration-300 hover:-translate-y-1 w-52 sm:w-56"
                            >
                                {/* Card wrapper */}
                                <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 group-hover:border-gray-200 shadow-sm group-hover:shadow-md transition-all duration-300">
                                    {/* Image */}
                                    <div className="relative overflow-hidden aspect-square bg-gray-50">
                                        {isInternal ? (
                                            <Link to={href} className="block h-full">
                                                <CarouselImage
                                                    src={imgSrc}
                                                    alt={item.title}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                />
                                            </Link>
                                        ) : isExternal ? (
                                            <a href={href} target="_blank" rel="noopener noreferrer" className="block h-full">
                                                <CarouselImage
                                                    src={imgSrc}
                                                    alt={item.title}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                />
                                            </a>
                                        ) : (
                                            <CarouselImage
                                                src={imgSrc}
                                                alt={item.title}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                            />
                                        )}

                                        {item.discount && (
                                            <div className="absolute top-3 left-3 bg-red-500 text-white text-[10px] uppercase font-bold px-2.5 py-1 rounded-full z-10">
                                                {item.discount}
                                            </div>
                                        )}

                                        {/* Heart / Favorite button */}
                                        {(item.productId || item.id) && (
                                            <button
                                                onClick={(e) => handleToggleFavorite(e, item.productId || item.id)}
                                                disabled={isToggling}
                                                className={`absolute top-3 right-3 z-10 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${isFav
                                                    ? 'bg-red-50 text-red-500 shadow-sm'
                                                    : 'bg-white/80 backdrop-blur-sm text-gray-400 hover:text-red-500 hover:bg-red-50 shadow-sm'
                                                    } ${isToggling ? 'opacity-50 scale-90' : 'hover:scale-110'}`}
                                                aria-label={isFav ? 'Remove from favorites' : 'Add to favorites'}
                                            >
                                                {isFav ? <HeartFilled /> : <HeartOutline />}
                                            </button>
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className="p-4">
                                        {isInternal ? (
                                            <Link to={href} className="block">
                                                <h3 className="font-medium text-sm text-gray-800 line-clamp-2 h-10 group-hover:text-gray-600 transition-colors">
                                                    {item.title}
                                                </h3>
                                            </Link>
                                        ) : (
                                            <h3 className="font-medium text-sm text-gray-800 line-clamp-2 h-10">
                                                {item.title}
                                            </h3>
                                        )}

                                        <div className="mt-2 flex items-baseline gap-2">
                                            <span className="text-lg font-bold text-gray-900">{item.price}</span>
                                            {item.originalPrice && (
                                                <span className="text-xs text-gray-400 line-through">{item.originalPrice}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <button
                    onClick={() => scroll("right")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-white border border-gray-200 text-gray-700 w-10 h-10 rounded-full shadow-lg z-20 opacity-0 group-hover/carousel:opacity-100 hover:bg-gray-900 hover:text-white hover:border-gray-900 transition-all duration-300 flex items-center justify-center"
                    aria-label="Scroll right"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                </button>

                {/* Edge Fade — right side only */}
                <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-white to-transparent pointer-events-none z-10" />
            </div>
        </div>
    );
};

export default ProductCarousel;
