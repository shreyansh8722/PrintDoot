import React, { useState, useEffect } from 'react';
import SectionHero from '../../components/Shared/SectionHero';
import ProductCarousel from '../../components/Shared/ProductCarousel';
import OffersMarquee from '../../components/Shared/OffersMarquee';
import Discount from './Discount/Discount';
import GiftFinderBanner from './GiftFinderBanner/GiftFinderBanner';
import PromoBanners from './PromoBanners/PromoBanners';
import WhyChooseUs from './WhyChooseUs/WhyChooseUs';
import OurProcess from './OurProcess/OurProcess';
import CategoryGrid from './CategoryGrid/CategoryGrid';
import HeroCardCarousel from './HeroCardCarousel/HeroCardCarousel';
import ScrollReveal from '../../components/ScrollReveal';
import catalogService from '../../services/catalogService';
import { heroDataSecondary } from '../../data/homeData';

function Homepage() {
    const [newArrivals, setNewArrivals] = useState([]);
    const [recentlyViewed, setRecentlyViewed] = useState([]);
    const [trending, setTrending] = useState([]);

    useEffect(() => {
        // Fetch new arrivals
        catalogService.getNewArrivals(12).then(setNewArrivals).catch(() => {});

        // Fetch trending products
        catalogService.getTrending(12).then(setTrending).catch(() => {});

        // Fetch recently viewed from localStorage IDs
        try {
            const ids = JSON.parse(localStorage.getItem('recentlyViewedIds') || '[]');
            if (ids.length > 0) {
                catalogService.getProductsByIds(ids.slice(0, 12)).then(setRecentlyViewed).catch(() => {});
            }
        } catch { /* localStorage unavailable */ }
    }, []);

    return (
        <div className="bg-white">
            {/* FNP-style hero card carousel */}
            <HeroCardCarousel />

            {/* Offers marquee */}
            <OffersMarquee />

            {/* Categories — circular grid like FNP/IGP */}
            <ScrollReveal direction="up" delay={0.15}>
                <CategoryGrid />
            </ScrollReveal>

            {/* New Arrivals — freshly added products */}
            {newArrivals.length > 0 && (
                <ScrollReveal direction="up" delay={0.15}>
                    <div className="py-6 sm:py-12">
                        <ProductCarousel
                            title="New Arrivals"
                            items={newArrivals}
                            type="product"
                        />
                    </div>
                </ScrollReveal>
            )}

            {/* Recently Viewed — only shown if user has browsed products before */}
            {recentlyViewed.length > 0 && (
                <ScrollReveal direction="up" delay={0.15}>
                    <div className="py-6 sm:py-12">
                        <ProductCarousel
                            title="Your Recently Viewed Items"
                            items={recentlyViewed}
                            type="product"
                        />
                    </div>
                </ScrollReveal>
            )}

            {/* Promotional Banners */}
            <ScrollReveal direction="up" delay={0.15}>
                <PromoBanners />
            </ScrollReveal>

            {/* Trending Products — most viewed / most ordered */}
            {trending.length > 0 && (
                <ScrollReveal direction="up" delay={0.15}>
                    <div className="py-6 sm:py-12">
                        <ProductCarousel
                            title="Trending Products"
                            items={trending}
                            type="product"
                        />
                    </div>
                </ScrollReveal>
            )}

            {/* Smart Gift Finder Banner */}
            <ScrollReveal direction="up" delay={0.15}>
                <GiftFinderBanner />
            </ScrollReveal>

            {/* Secondary hero grid */}
            <ScrollReveal direction="up" delay={0.15}>
                <SectionHero data={heroDataSecondary} variant="grid" className="py-4" />
            </ScrollReveal>

            {/* Why Choose PrintDoot */}
            <ScrollReveal direction="up" delay={0.15}>
                <WhyChooseUs />
            </ScrollReveal>

            {/* Our Process */}
            <ScrollReveal direction="up" delay={0.15}>
                <OurProcess />
            </ScrollReveal>

            {/* Newsletter & About */}
            <ScrollReveal direction="up" delay={0.15}>
                <div className="py-6 sm:py-12">
                    <Discount />
                </div>
            </ScrollReveal>
        </div>
    );
}

export default Homepage;
