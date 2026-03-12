import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';

/* ── Single hero card with skeleton loading ── */
function HeroCard({ item, isFullWidth = false }) {
    const navigate = useNavigate();
    const [imgLoaded, setImgLoaded] = useState(false);

    const handleButtonClick = (link) => {
        if (!link || link === '#') return;
        if (link.startsWith('http')) {
            window.open(link, '_blank', 'noopener,noreferrer');
        } else {
            navigate(link);
        }
    };

    if (isFullWidth) {
        return (
            <div className="relative h-[280px] sm:h-[400px] md:h-[480px] lg:h-[540px] overflow-hidden group">
                {/* Skeleton */}
                {!imgLoaded && (
                    <div className="absolute inset-0 skeleton-shimmer bg-gray-200" />
                )}

                {/* Background image with subtle zoom on hover */}
                <img
                    src={item.image}
                    alt={item.title}
                    onLoad={() => setImgLoaded(true)}
                    className={`absolute inset-0 w-full h-full object-cover transition-all duration-[1.2s] ease-out group-hover:scale-[1.03] ${imgLoaded ? 'opacity-100' : 'opacity-0'
                        }`}
                />

                {/* Gradient overlay — left side for text readability */}
                <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent sm:from-black/60 sm:via-black/25" />

                {/* Content overlay — left-aligned */}
                <div className={`absolute bottom-0 left-0 top-0 flex items-center transition-all duration-700 ${imgLoaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
                    }`}>
                    <div className="px-5 sm:px-8 md:px-12 lg:px-16 max-w-[85%] sm:max-w-lg">
                        <h2 className="text-xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight tracking-tight">
                            {item.title}
                        </h2>

                        {item.subtitle && (
                            <p className="mt-2 sm:mt-3 text-sm sm:text-lg md:text-xl text-white/80 font-medium line-clamp-2">
                                {item.subtitle}
                            </p>
                        )}

                        <div className="mt-4 sm:mt-6 flex gap-2 sm:gap-3 flex-wrap">
                            {item.buttons?.map((btn, idx) => {
                                const btnClass = btn.primary
                                    ? "bg-brand text-white hover:bg-brand-500 shadow-lg shadow-brand/20"
                                    : "bg-white/15 text-white border border-white/40 hover:bg-white/25 backdrop-blur-sm";

                                if (btn.link && btn.link !== '#' && !btn.link.startsWith('http')) {
                                    return (
                                        <Link
                                            key={idx}
                                            to={btn.link}
                                            className={`${btnClass} px-4 sm:px-6 py-2 sm:py-3 rounded-full text-xs sm:text-sm font-semibold transition-all duration-300 active:scale-95 inline-block text-center`}
                                        >
                                            {btn.label}
                                        </Link>
                                    );
                                }
                                return (
                                    <button
                                        key={idx}
                                        onClick={() => handleButtonClick(btn.link)}
                                        className={`${btnClass} px-4 sm:px-6 py-2 sm:py-3 rounded-full text-xs sm:text-sm font-semibold transition-all duration-300 active:scale-95`}
                                    >
                                        {btn.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Standard card (used in secondary grid)
    return (
        <div className="relative h-[260px] sm:h-[340px] md:h-[420px] overflow-hidden group rounded-xl">
            {/* Skeleton */}
            {!imgLoaded && (
                <div className="absolute inset-0 skeleton-shimmer bg-gray-200 rounded-xl" />
            )}

            {/* Image with hover zoom */}
            <img
                src={item.image}
                alt={item.title}
                onLoad={() => setImgLoaded(true)}
                className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 group-hover:scale-105 ${imgLoaded ? 'opacity-100' : 'opacity-0'
                    }`}
            />

            {/* Bottom gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

            {/* Content overlay — bottom */}
            <div className={`absolute bottom-0 left-0 right-0 p-4 sm:p-6 transition-all duration-500 ${imgLoaded ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
                }`}>
                <h2 className="text-lg sm:text-2xl font-bold text-white mb-1 leading-tight">
                    {item.title}
                </h2>

                {item.subtitle && (
                    <p className="mt-1 text-white/75 font-medium text-xs sm:text-sm line-clamp-2">
                        {item.subtitle}
                    </p>
                )}

                <div className="mt-3 sm:mt-4 flex gap-2 sm:gap-3 flex-wrap">
                    {item.buttons?.map((btn, idx) => {
                        const btnClass = btn.primary
                            ? "bg-brand text-white hover:bg-brand-500 shadow-lg shadow-brand/20"
                            : "bg-white/15 text-white border border-white/40 hover:bg-white/25 backdrop-blur-sm";

                        if (btn.link && btn.link !== '#' && !btn.link.startsWith('http')) {
                            return (
                                <Link
                                    key={idx}
                                    to={btn.link}
                                    className={`${btnClass} px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-[11px] sm:text-xs font-semibold transition-all duration-200 active:scale-95 inline-block text-center`}
                                >
                                    {btn.label}
                                </Link>
                            );
                        }
                        return (
                            <button
                                key={idx}
                                onClick={() => handleButtonClick(btn.link)}
                                className={`${btnClass} px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-[11px] sm:text-xs font-semibold transition-all duration-200 active:scale-95`}
                            >
                                {btn.label}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

/* ── Hero slider with auto-play for full-width mode ── */
const SectionHero = ({ data, variant = "grid", className = "" }) => {
    const [activeSlide, setActiveSlide] = useState(0);

    const nextSlide = useCallback(() => {
        setActiveSlide((prev) => (prev + 1) % data.length);
    }, [data.length]);

    // Auto-play for slider variant
    useEffect(() => {
        if (variant !== 'slider') return;
        const timer = setInterval(nextSlide, 5000);
        return () => clearInterval(timer);
    }, [variant, nextSlide]);

    if (variant === 'slider') {
        return (
            <section className={`w-full bg-white overflow-hidden relative ${className}`}>
                {/* Slides */}
                <div className="relative">
                    {data.map((item, index) => (
                        <div
                            key={item.id}
                            className={`transition-opacity duration-700 ease-in-out ${index === activeSlide ? 'opacity-100 relative' : 'opacity-0 absolute inset-0'
                                }`}
                        >
                            <HeroCard item={item} isFullWidth={true} />
                        </div>
                    ))}
                </div>

                {/* Slide indicators */}
                {data.length > 1 && (
                    <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 flex gap-1.5 sm:gap-2 z-10">
                        {data.map((_, idx) => (
                            <button
                                key={idx}
                                onClick={() => setActiveSlide(idx)}
                                className={`transition-all duration-300 rounded-full ${idx === activeSlide
                                    ? 'w-6 sm:w-8 h-2 sm:h-2.5 bg-brand'
                                    : 'w-2 sm:w-2.5 h-2 sm:h-2.5 bg-white/50 hover:bg-white/70'
                                    }`}
                                aria-label={`Go to slide ${idx + 1}`}
                            />
                        ))}
                    </div>
                )}
            </section>
        );
    }

    // Grid variant (for secondary hero)
    return (
        <section className={`w-full py-4 bg-white overflow-hidden ${className}`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {data.map((item) => (
                        <HeroCard key={item.id} item={item} />
                    ))}
                </div>
            </div>
        </section>
    );
};

export default SectionHero;
