import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiHook from '../../../services/apiConfig';
import promoCards from '../../../assets/promo-cards.webp';
import promoGifts from '../../../assets/promo-gifts.webp';
import promoPrints from '../../../assets/promo-prints.webp';

/* ── Default promo banners (always shown unless admin adds promo banners) ── */
const DEFAULT_BANNERS = [
    {
        id: 'default-1',
        title: "Custom Business Cards",
        subtitle: "Make a lasting first impression",
        cta: "Order Now",
        link: "/view-all",
        gradient: "from-stone-900/80 via-stone-800/50 to-transparent",
        image: promoCards,
    },
    {
        id: 'default-2',
        title: "Personalized Gift Hampers",
        subtitle: "Celebrate every occasion with love",
        cta: "Explore",
        link: "/view-all",
        gradient: "from-sky-900/80 via-sky-800/50 to-transparent",
        image: promoGifts,
    },
    {
        id: 'default-3',
        title: "Premium Photo Prints",
        subtitle: "Turn memories into masterpieces",
        cta: "Shop Now",
        link: "/view-all",
        gradient: "from-amber-900/70 via-amber-800/40 to-transparent",
        image: promoPrints,
    },
];

const GRADIENTS = [
    "from-stone-900/80 via-stone-800/50 to-transparent",
    "from-sky-900/80 via-sky-800/50 to-transparent",
    "from-amber-900/70 via-amber-800/40 to-transparent",
    "from-emerald-900/80 via-emerald-800/50 to-transparent",
    "from-rose-900/80 via-rose-800/50 to-transparent",
];

const PromoBanners = () => {
    const [banners, setBanners] = useState(DEFAULT_BANNERS);

    useEffect(() => {
        apiHook.get('/pages/banners/', { params: { position: 'promo' } })
            .then(res => {
                const data = res.data?.results || res.data || [];
                if (data.length > 0) {
                    const apiCards = data.map((b, i) => ({
                        id: b.id || `api-${i}`,
                        title: b.title,
                        subtitle: b.subtitle || '',
                        cta: 'Shop Now',
                        link: b.link || '/view-all',
                        gradient: GRADIENTS[i % GRADIENTS.length],
                        image: b.image_url || b.mobile_image_url,
                    }));
                    // Fill remaining spots with defaults
                    const combined = [...apiCards, ...DEFAULT_BANNERS.slice(apiCards.length)];
                    setBanners(combined.slice(0, 3)); // Max 3 promo banners
                }
            })
            .catch(() => { /* keep defaults */ });
    }, []);

    return (
        <section className="w-full px-4 sm:px-6 py-6 sm:py-10">
            <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
                    {banners.map((banner) => (
                        <Link
                            key={banner.id}
                            to={banner.link}
                            className="group relative overflow-hidden rounded-2xl h-56 sm:h-72 block shadow-sm hover:shadow-xl transition-all duration-500"
                        >
                            {/* Background Image */}
                            <img
                                src={banner.image}
                                alt={banner.title}
                                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                loading="lazy"
                                decoding="async"
                                width={400}
                                height={288}
                            />

                            {/* Gradient overlay */}
                            <div className={`absolute inset-0 bg-gradient-to-t ${banner.gradient}`} />

                            {/* Content */}
                            <div className="absolute inset-0 flex flex-col justify-end p-5 sm:p-6">
                                <h3 className="text-lg sm:text-xl font-semibold text-white leading-tight mb-1">
                                    {banner.title}
                                </h3>
                                <p className="text-white/70 text-xs sm:text-sm mb-3 font-light">
                                    {banner.subtitle}
                                </p>
                                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-white bg-white/15 backdrop-blur-sm px-4 py-2 rounded-full w-fit border border-white/20 group-hover:bg-brand group-hover:border-brand transition-all duration-300">
                                    {banner.cta}
                                    <svg className="w-3 h-3 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
                                </span>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default PromoBanners;
