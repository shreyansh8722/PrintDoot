import React, { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiHook from '../../../services/apiConfig';

import heroCard1 from '../../../assets/hero-card-1.webp';
import heroCard2 from '../../../assets/hero-card-2.webp';
import heroCard3 from '../../../assets/hero-card-3.webp';
import heroCard4 from '../../../assets/hero-card-4.webp';

/* ── Default hero cards (always shown unless admin adds hero banners) ── */
const DEFAULT_CARDS = [
    {
        image: heroCard1,
        mobileImage: null,
        title: 'My Name, My Pride',
        subtitle: 'Premium visiting cards with gold foil & embossed finishes',
        cta: 'ORDER NOW',
        link: '/search?q=visiting+cards',
        textColor: 'dark',
    },
    {
        image: heroCard2,
        mobileImage: null,
        title: 'Custom Apparel, Your Way',
        subtitle: 'T-shirts, hoodies & caps printed with your designs',
        cta: 'ORDER NOW',
        link: '/search?q=custom+tshirt',
        textColor: 'dark',
    },
    {
        image: heroCard3,
        mobileImage: null,
        title: 'Gifts, Wrapped in Love',
        subtitle: 'Photo mugs, cushions, frames & curated hampers',
        cta: 'ORDER NOW',
        link: '/search?q=personalized+gifts',
        textColor: 'light',
    },
    {
        image: heroCard4,
        mobileImage: null,
        title: 'Corporate Gifting Made Easy',
        subtitle: 'Employee kits, branded merch & bulk orders',
        cta: 'EXPLORE NOW',
        link: '/search?q=corporate+gifts',
        textColor: 'light',
    },
];

const HeroCardCarousel = () => {
    const scrollRef = useRef(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true);
    const [heroCards, setHeroCards] = useState(DEFAULT_CARDS);
    const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' && window.innerWidth < 768);

    /* Track mobile/desktop for responsive banner images */
    useEffect(() => {
        const handler = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handler);
        return () => window.removeEventListener('resize', handler);
    }, []);

    /* Fetch banners from API — only REPLACE defaults if admin has added hero banners */
    useEffect(() => {
        apiHook.get('/pages/banners/', { params: { position: 'hero' } })
            .then(res => {
                const banners = res.data?.results || res.data || [];
                if (banners.length > 0) {
                    const apiCards = banners.map(b => ({
                        image: b.image_url,
                        mobileImage: b.mobile_image_url || '',
                        title: b.title || '',
                        subtitle: b.subtitle || '',
                        cta: 'ORDER NOW',
                        link: b.link || '/view-all',
                        // Auto-detect text color: if banner has dark image or admin chose dark
                        textColor: (b.text_color === 'dark' || b.text_color === 'light')
                            ? b.text_color
                            : 'dark', // Default to dark text for better readability
                    }));
                    // Show API banners first, then fill remaining with defaults
                    const combined = [...apiCards, ...DEFAULT_CARDS.slice(apiCards.length)];
                    setHeroCards(combined.slice(0, 4)); // Max 4 cards
                }
            })
            .catch(() => { /* keep defaults */ });
    }, []);

    const checkScroll = () => {
        const el = scrollRef.current;
        if (!el) return;
        setCanScrollLeft(el.scrollLeft > 10);
        setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
    };

    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;
        checkScroll();
        el.addEventListener('scroll', checkScroll, { passive: true });
        return () => el.removeEventListener('scroll', checkScroll);
    }, [heroCards]);

    const scroll = (direction) => {
        const el = scrollRef.current;
        if (!el) return;
        const cardWidth = el.querySelector('.hero-card')?.offsetWidth || 400;
        el.scrollBy({ left: direction * (cardWidth + 16), behavior: 'smooth' });
    };

    return (
        <section className="w-full bg-white py-4 sm:py-6 relative">
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 relative">

                {/* Scroll container */}
                <div
                    ref={scrollRef}
                    className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth"
                >
                    {heroCards.map((card, idx) => {
                        const isDark = card.textColor === 'dark';
                        const textClass = isDark ? 'text-gray-800' : 'text-white';
                        const gradientClass = isDark
                            ? 'bg-gradient-to-r from-white/20 to-transparent'
                            : 'bg-gradient-to-r from-black/30 to-transparent';

                        // Use mobile image on small screens if available, otherwise fall back to desktop
                        const displayImage = (isMobile && card.mobileImage) ? card.mobileImage : card.image;

                        return (
                            <div
                                key={idx}
                                className="hero-card flex-shrink-0 w-[85vw] sm:w-[calc(50%-8px)] lg:w-[calc(50%-8px)] relative rounded-2xl overflow-hidden h-[220px] sm:h-[280px] md:h-[320px]"
                            >
                                {/* Background Image */}
                                <img
                                    src={displayImage}
                                    alt={card.title}
                                    className="absolute inset-0 w-full h-full object-cover"
                                    loading={idx === 0 ? 'eager' : 'lazy'}
                                    fetchPriority={idx === 0 ? 'high' : 'auto'}
                                    decoding={idx === 0 ? 'sync' : 'async'}
                                    width={800}
                                    height={320}
                                />

                                {/* Text overlay on left */}
                                <div className="absolute inset-0 flex items-center">
                                    <div className={`absolute inset-y-0 left-0 w-[60%] ${gradientClass}`} />
                                    <div className="relative pl-6 sm:pl-8 md:pl-10 max-w-[50%] sm:max-w-[45%]">
                                        <h2 className={`text-lg sm:text-2xl md:text-[28px] font-bold leading-tight ${textClass}`}>
                                            {card.title}
                                        </h2>
                                        <p className={`mt-1.5 sm:mt-2 text-[11px] sm:text-sm leading-snug ${textClass} opacity-80`}>
                                            {card.subtitle}
                                        </p>
                                        <Link
                                            to={card.link}
                                            className="inline-block mt-3 sm:mt-4 px-5 py-2 bg-brand text-white text-xs sm:text-sm font-semibold rounded-md hover:bg-brand-500 transition-colors shadow-sm"
                                        >
                                            {card.cta}
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Left arrow */}
                {canScrollLeft && (
                    <button
                        onClick={() => scroll(-1)}
                        className="absolute left-1 sm:left-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M15 18l-6-6 6-6" />
                        </svg>
                    </button>
                )}

                {/* Right arrow */}
                {canScrollRight && (
                    <button
                        onClick={() => scroll(1)}
                        className="absolute right-1 sm:right-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M9 18l6-6-6-6" />
                        </svg>
                    </button>
                )}
            </div>

            <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
        </section>
    );
};

export default HeroCardCarousel;

