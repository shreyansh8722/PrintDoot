import React from 'react';
import './Homepage.css';
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
import {
    heroDataSecondary,
    recentlyViewed,
    popularProducts as staticPopularProducts
} from '../../data/homeData';

function Homepage() {
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

            {/* Recently Viewed */}
            <ScrollReveal direction="up" delay={0.15}>
                <div className="py-6 sm:py-12">
                    <ProductCarousel
                        title="Your Recently Viewed Items"
                        items={recentlyViewed}
                        type="product"
                    />
                </div>
            </ScrollReveal>

            {/* Promotional Banners */}
            <ScrollReveal direction="up" delay={0.15}>
                <PromoBanners />
            </ScrollReveal>

            {/* Trending Products */}
            <ScrollReveal direction="up" delay={0.15}>
                <div className="py-6 sm:py-12">
                    <ProductCarousel
                        title="Trending Products"
                        items={staticPopularProducts}
                        type="product"
                    />
                </div>
            </ScrollReveal>

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
