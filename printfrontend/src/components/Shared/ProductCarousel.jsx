import React, { useRef, useState } from 'react';
import { Link } from 'react-router-dom';

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

const ProductCarousel = ({ title, items, type = "product", className = "" }) => {
    const scrollRef = useRef(null);
    const scrollAmount = type === "category" ? 280 : 320;

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
