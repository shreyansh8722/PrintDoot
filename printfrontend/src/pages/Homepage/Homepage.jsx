import React, { useState, useEffect } from 'react';
import './Homepage.css';
import SectionHero from '../../components/Shared/SectionHero';
import ProductCarousel from '../../components/Shared/ProductCarousel';
import OffersMarquee from '../../components/Shared/OffersMarquee';
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
            <div className="flex justify-center items-center h-screen bg-surface">
                <LottieAnimation type="loading" width={100} height={100} />
            </div>
        );
    }

    return (
        <div className="bg-surface">
            {/* Full-width hero slider */}
            <ScrollReveal direction="fade" delay={0.1}>
                <SectionHero data={heroData} variant="slider" />
            </ScrollReveal>

            {/* Offers marquee */}
            <OffersMarquee />

            {/* Categories */}
            <ScrollReveal direction="up" delay={0.15}>
                <div className="py-6 sm:py-12">
                    <ProductCarousel
                        title="Explore All Categories"
                        items={categories}
                        type="category"
                    />
                </div>
            </ScrollReveal>

            {/* Recently Viewed — uses static data from homeData.js */}
            <ScrollReveal direction="up" delay={0.15}>
                <div className="py-6 sm:py-12">
                    <ProductCarousel
                        title="Your Recently Viewed Items"
                        items={recentlyViewed}
                        type="product"
                    />
                </div>
            </ScrollReveal>

            {/* Popular Products — uses static data from homeData.js */}
            <ScrollReveal direction="up" delay={0.15}>
                <div className="py-6 sm:py-12">
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
                <div className="py-6 sm:py-12">
                    <Discount />
                </div>
            </ScrollReveal>
        </div>
    );
}

export default Homepage;
