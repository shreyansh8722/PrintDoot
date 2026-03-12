import React, { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

import heroCard1 from '../../../assets/hero-card-1.png';
import heroCard2 from '../../../assets/hero-card-2.png';
import heroCard3 from '../../../assets/hero-card-3.png';
import heroCard4 from '../../../assets/hero-card-4.png';

const heroCards = [
    {
        image: heroCard1,
        title: 'My Name, My Pride',
        subtitle: 'Premium visiting cards with gold foil & embossed finishes',
        cta: 'ORDER NOW',
        link: '/search?q=visiting+cards',
        textColor: 'text-gray-800',
    },
    {
        image: heroCard2,
        title: 'Custom Apparel, Your Way',
        subtitle: 'T-shirts, hoodies & caps printed with your designs',
        cta: 'ORDER NOW',
        link: '/search?q=custom+tshirt',
        textColor: 'text-gray-800',
    },
    {
        image: heroCard3,
        title: 'Gifts, Wrapped in Love',
        subtitle: 'Photo mugs, cushions, frames & curated hampers',
        cta: 'ORDER NOW',
        link: '/search?q=personalized+gifts',
        textColor: 'text-white',
    },
    {
        image: heroCard4,
        title: 'Corporate Gifting Made Easy',
        subtitle: 'Employee kits, branded merch & bulk orders',
        cta: 'EXPLORE NOW',
        link: '/search?q=corporate+gifts',
        textColor: 'text-white',
    },
];

const HeroCardCarousel = () => {
    const scrollRef = useRef(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true);

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
    }, []);

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
                    {heroCards.map((card, idx) => (
                        <div
                            key={idx}
                            className="hero-card flex-shrink-0 w-[85vw] sm:w-[calc(50%-8px)] lg:w-[calc(50%-8px)] relative rounded-2xl overflow-hidden h-[220px] sm:h-[280px] md:h-[320px]"
                        >
                            {/* Background Image */}
                            <img
                                src={card.image}
                                alt={card.title}
                                className="absolute inset-0 w-full h-full object-cover"
                            />

                            {/* Text overlay on left */}
                            <div className="absolute inset-0 flex items-center">
                                {/* Semi-transparent gradient for text readability */}
                                <div className={`absolute inset-y-0 left-0 w-[60%] ${card.textColor === 'text-white'
                                        ? 'bg-gradient-to-r from-black/30 to-transparent'
                                        : 'bg-gradient-to-r from-white/20 to-transparent'
                                    }`} />
                                <div className="relative pl-6 sm:pl-8 md:pl-10 max-w-[50%] sm:max-w-[45%]">
                                    <h2 className={`text-lg sm:text-2xl md:text-[28px] font-bold leading-tight ${card.textColor}`}>
                                        {card.title}
                                    </h2>
                                    <p className={`mt-1.5 sm:mt-2 text-[11px] sm:text-sm leading-snug ${card.textColor} opacity-80`}>
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
                    ))}
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
