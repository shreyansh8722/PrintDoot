import React, { useState, useEffect } from 'react';
import './Homepage.css';
import SectionHero from '../../components/Shared/SectionHero';
import ProductCarousel from '../../components/Shared/ProductCarousel';
import Discount from './Discount/Discount';
import ScrollReveal from '../../components/ScrollReveal';
import LottieAnimation from '../../components/LottieAnimation';
import {
    heroData,
    heroDataSecondary,
    recentlyViewed,
    popularProducts as staticPopularProducts
} from '../../data/homeData';
import catalogService from '../../services/catalogService';

/* ── Trust / Value Prop Strip ── */
function TrustStrip() {
    const items = [
        { icon: "🚚", text: "Free Shipping Over ₹999" },
        { icon: "✦", text: "Premium Quality Guaranteed" },
        { icon: "↩️", text: "Easy Returns & Refunds" },
        { icon: "🎨", text: "1000+ Design Templates" },
    ];

    return (
        <div className="w-full bg-gray-900 text-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
                <div className="flex flex-wrap justify-center sm:justify-between items-center gap-4 sm:gap-6 py-3.5">
                    {items.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs sm:text-sm font-medium tracking-wide">
                            <span className="text-base">{item.icon}</span>
                            <span className="text-white/90">{item.text}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function Homepage() {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                // Fetch Categories from API
                const categoriesData = await catalogService.getCategories();
                const mappedCategories = categoriesData.map(cat => ({
                    id: cat.id,
                    title: cat.name,
                    img: cat.image || "https://placehold.co/400x400?text=Category",
                    href: `/categories/${cat.slug}`
                }));
                setCategories(mappedCategories);
                setLoading(false);
            } catch (err) {
                console.error("Failed to fetch homepage data", err);
                setError("Failed to load some content. Please try again later.");
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen bg-white">
                <LottieAnimation type="loading" width={100} height={100} />
            </div>
        );
    }

    return (
        <div className="bg-white">
            {/* Full-width hero slider */}
            <ScrollReveal direction="fade" delay={0.1}>
                <SectionHero data={heroData} variant="slider" />
            </ScrollReveal>

            {/* Trust strip */}
            <TrustStrip />

            {/* Categories */}
            <ScrollReveal direction="up" delay={0.15}>
                <div className="py-12">
                    <ProductCarousel
                        title="Explore All Categories"
                        items={categories}
                        type="category"
                    />
                </div>
            </ScrollReveal>

            {/* Recently Viewed — uses static data from homeData.js */}
            <ScrollReveal direction="up" delay={0.15}>
                <div className="py-12">
                    <ProductCarousel
                        title="Your Recently Viewed Items"
                        items={recentlyViewed}
                        type="product"
                    />
                </div>
            </ScrollReveal>

            {/* Popular Products — uses static data from homeData.js */}
            <ScrollReveal direction="up" delay={0.15}>
                <div className="py-12">
                    <ProductCarousel
                        title="Our Most Popular Products"
                        items={staticPopularProducts}
                        type="product"
                    />
                </div>
            </ScrollReveal>

            {/* Secondary hero grid */}
            <ScrollReveal direction="up" delay={0.15}>
                <SectionHero data={heroDataSecondary} variant="grid" className="py-4" />
            </ScrollReveal>

            {/* Newsletter & About */}
            <ScrollReveal direction="up" delay={0.15}>
                <div className="py-12">
                    <Discount />
                </div>
            </ScrollReveal>
        </div>
    );
}

export default Homepage;
