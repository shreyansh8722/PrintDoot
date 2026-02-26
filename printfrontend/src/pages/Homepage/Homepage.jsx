import React, { useState, useEffect } from 'react';
import './Homepage.css';
import SectionHero from '../../components/Shared/SectionHero';
import ProductCarousel from '../../components/Shared/ProductCarousel';
import Discount from './Discount/Discount';
import ScrollReveal from '../../components/ScrollReveal';
import LottieAnimation from '../../components/LottieAnimation';
import {
    heroData,
    heroDataSecondary
} from '../../data/homeData';
import catalogService from '../../services/catalogService';

function Homepage() {
    const [categories, setCategories] = useState([]);
    const [featuredProducts, setFeaturedProducts] = useState([]);
    const [popularProducts, setPopularProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                // Fetch Categories
                const categoriesData = await catalogService.getCategories();
                // Map to carousel format
                const mappedCategories = categoriesData.map(cat => ({
                    id: cat.id,
                    title: cat.name,
                    img: cat.image || "https://placehold.co/400x400?text=Category",
                    href: `/categories/${cat.slug}` // Assumes routing setup
                }));
                setCategories(mappedCategories);

                // Fetch Featured Products (using as Popular)
                const productsResult = await catalogService.getProducts({ featured: true });
                const productsData = productsResult.products || productsResult;
                setPopularProducts(productsData.slice(0, 12)); // Limit to 12 items

                // For Recently Viewed, check localStorage first, then fallback to latest products
                try {
                    const recentlyViewedIds = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
                    const allResult = await catalogService.getProducts();
                    const allProducts = allResult.products || allResult;
                    let recentProducts = [];
                    
                    if (recentlyViewedIds.length > 0) {
                        // Filter products by recently viewed IDs (preserve order from localStorage)
                        const recentlyViewedMap = new Map();
                        allProducts.forEach(p => {
                            if (recentlyViewedIds.includes(p.id)) {
                                recentlyViewedMap.set(p.id, p);
                            }
                        });
                        // Sort by the order in recentlyViewedIds
                        recentProducts = recentlyViewedIds
                            .map(id => recentlyViewedMap.get(id))
                            .filter(p => p !== undefined)
                            .slice(0, 8);
                    }
                    
                    // If we don't have enough recently viewed, fill with latest products
                    if (recentProducts.length < 8) {
                        const existingIds = new Set(recentProducts.map(p => p.id));
                        const additionalProducts = allProducts
                            .filter(p => !existingIds.has(p.id))
                            .slice(0, 8 - recentProducts.length);
                        recentProducts = [...recentProducts, ...additionalProducts];
                    }
                    
                    setFeaturedProducts(recentProducts.slice(0, 8));
                } catch (recentError) {
                    // Fallback: just show latest products if recently viewed fails
                    const allFallback = await catalogService.getProducts();
                    const allFallbackProducts = allFallback.products || allFallback;
                    setFeaturedProducts(allFallbackProducts.slice(0, 8));
                }

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
            <ScrollReveal direction="down" delay={0.1}>
                <SectionHero data={heroData} />
            </ScrollReveal>

            <ScrollReveal direction="up" delay={0.2}>
                <div className="py-8">
                    <ProductCarousel
                        title="Explore All Categories"
                        items={categories}
                        type="category"
                    />
                </div>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={0.3}>
                <div className="py-8">
                    <ProductCarousel
                        title="Your Recently Viewed Items"
                        items={featuredProducts}
                        type="product"
                    />
                </div>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={0.4}>
                <div className="py-8">
                    <ProductCarousel
                        title="Our Most Popular Products"
                        items={popularProducts}
                        type="product"
                    />
                </div>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={0.5}>
                <SectionHero data={heroDataSecondary} className="py-0" />
            </ScrollReveal>

            <ScrollReveal direction="up" delay={0.6}>
                <div className="py-8">
                    <Discount />
                </div>
            </ScrollReveal>
        </div>
    )
}

export default Homepage;
