import React from 'react';
import { Link } from 'react-router-dom';

// ── Category banner images ──
import bannerVisitingCards from '../../../assets/banner-visiting-cards.png';
import bannerTshirts from '../../../assets/banner-tshirts.png';
import bannerMugs from '../../../assets/banner-mugs.png';
import bannerStickers from '../../../assets/banner-stickers.png';
import bannerPhotoFrames from '../../../assets/banner-photo-frames.png';
import bannerStationery from '../../../assets/banner-stationery.png';
import bannerCaps from '../../../assets/banner-caps.png';
import bannerCorporate from '../../../assets/banner-corporate.png';

/* ── Banner config per category slug ── */
const CATEGORY_BANNERS = {
  'visiting-cards':    { image: bannerVisitingCards, bg: '#f5f0eb', title: 'Visiting Cards', tagline: 'Premium business cards with gold foil, embossed finishes & modern designs.' },
  'business-cards':    { image: bannerVisitingCards, bg: '#f5f0eb', title: 'Business Cards', tagline: 'Premium business cards with gold foil, embossed finishes & modern designs.' },
  't-shirts':          { image: bannerTshirts,       bg: '#eef4f9', title: 'Custom T-Shirts', tagline: 'Printed T-shirts that combine comfort and quality, in hundreds of designs & colours.' },
  'tshirts':           { image: bannerTshirts,       bg: '#eef4f9', title: 'Custom T-Shirts', tagline: 'Printed T-shirts that combine comfort and quality, in hundreds of designs & colours.' },
  'apparel':           { image: bannerTshirts,       bg: '#eef4f9', title: 'Apparel', tagline: 'Custom printed t-shirts, hoodies & caps — wear your brand with pride.' },
  'mugs':              { image: bannerMugs,          bg: '#faf5ef', title: 'Mugs & Drinkware', tagline: 'Personalised mugs, bottles & drinkware — perfect for gifts & everyday use.' },
  'drinkware':         { image: bannerMugs,          bg: '#faf5ef', title: 'Drinkware', tagline: 'Custom printed mugs and drinkware for every occasion.' },
  'stickers':          { image: bannerStickers,      bg: '#fef8ee', title: 'Stickers & Labels', tagline: 'Die-cut stickers, vinyl decals & custom labels — vibrant and long-lasting.' },
  'labels':            { image: bannerStickers,      bg: '#fef8ee', title: 'Labels', tagline: 'Custom printed labels for your products and packaging.' },
  'photo-frames':      { image: bannerPhotoFrames,   bg: '#f8f2f6', title: 'Photo Frames & Gifts', tagline: 'Cherish every moment with custom frames, canvas prints & photo gifts.' },
  'photo-gifts':       { image: bannerPhotoFrames,   bg: '#f8f2f6', title: 'Photo Gifts', tagline: 'Personalised photo gifts for birthdays, anniversaries & more.' },
  'gifts':             { image: bannerPhotoFrames,   bg: '#f8f2f6', title: 'Gifts', tagline: 'Personalised gifts for every occasion — crafted just for you.' },
  'stationery':        { image: bannerStationery,    bg: '#f2f6f2', title: 'Stationery', tagline: 'Notebooks, letterheads, envelopes & more — crafted for professionals.' },
  'notebooks':         { image: bannerStationery,    bg: '#f2f6f2', title: 'Notebooks', tagline: 'Custom notebooks and diaries for everyday use.' },
  'caps':              { image: bannerCaps,          bg: '#f5f0f0', title: 'Caps & Hats', tagline: 'Custom embroidered & printed caps, snapbacks & beanies for your crew.' },
  'hats':              { image: bannerCaps,          bg: '#f5f0f0', title: 'Hats', tagline: 'Custom printed hats and headwear.' },
  'corporate':         { image: bannerCorporate,     bg: '#f0f2f5', title: 'Corporate Gifting', tagline: 'Premium employee kits, branded merch & bulk corporate gifts.' },
  'corporate-gifts':   { image: bannerCorporate,     bg: '#f0f2f5', title: 'Corporate Gifting', tagline: 'Premium employee kits, branded merch & bulk corporate gifts.' },
  'corporate-gifting': { image: bannerCorporate,     bg: '#f0f2f5', title: 'Corporate Gifting', tagline: 'Premium employee kits, branded merch & bulk corporate gifts.' },
  'packaging':         { image: bannerStickers,      bg: '#fef8ee', title: 'Packaging', tagline: 'Custom boxes, bags & packaging solutions for your brand.' },
  'marketing':         { image: bannerStationery,    bg: '#f2f6f2', title: 'Marketing Materials', tagline: 'Flyers, brochures, banners & posters to promote your business.' },
  'stamps':            { image: bannerStationery,    bg: '#f2f6f2', title: 'Stamps & Ink', tagline: 'Self-inking stamps, rubber stamps & ink pads for your business.' },
  'signs':             { image: bannerStationery,    bg: '#f2f6f2', title: 'Signs & Posters', tagline: 'Custom signs, posters & marketing materials for every need.' },
  'pens':              { image: bannerCorporate,     bg: '#f0f2f5', title: 'Personalised Pens', tagline: 'Branded pens and writing instruments for your team.' },
  'clothing':          { image: bannerTshirts,       bg: '#eef4f9', title: 'Clothing, Caps & Bags', tagline: 'Custom clothing and accessories for every occasion.' },
};

const DEFAULT_BANNER = {
  image: 'https://cms.cloudinary.vpsvc.com/image/upload/c_scale,dpr_auto,f_auto,q_auto:good,w_1920/India%20LOB/marquee/For%20Marketing/All-categories2_Marquee_Category-Page_for-marketing',
  bg: '#e8f4f8',
  title: 'All Categories',
  tagline: 'Find high-quality customised products you need for your business and beyond.',
};

/**
 * Compact category hero banner — inspired by VistaPrint's clean design.
 * Shows category-specific image + text. Scrolls to products on CTA click.
 */
const CategoryHero = ({ categorySlug, categoryName, subcategories, apiBannerImage }) => {
  // Match slug → banner config
  const slug = categorySlug?.toLowerCase().trim();
  let banner = (slug && CATEGORY_BANNERS[slug]) || null;

  // Fuzzy match: try partial slug matching if exact match fails
  if (!banner && slug) {
    const matchKey = Object.keys(CATEGORY_BANNERS).find(k => slug.includes(k) || k.includes(slug));
    banner = matchKey ? CATEGORY_BANNERS[matchKey] : null;
  }

  // Final fallback
  if (!banner) banner = { ...DEFAULT_BANNER };

  // If admin uploaded a banner image via S3, use that instead
  if (apiBannerImage) {
    banner = { ...banner, image: apiBannerImage };
  }

  // If we have a real category name, use it as title
  const displayTitle = categoryName || banner.title;

  const handleExploreClick = () => {
    const el = document.getElementById('products-section');
    if (el) {
      const offset = el.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top: offset, behavior: 'smooth' });
    }
  };

  return (
    <div style={{ backgroundColor: banner.bg }} className="w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-6 lg:gap-10 py-6 sm:py-8 lg:py-10 min-h-[180px] sm:min-h-[220px]">

          {/* ── Text content ── */}
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 leading-tight">
              {displayTitle}
            </h1>
            <p className="mt-2 text-sm sm:text-base text-gray-600 leading-relaxed max-w-lg">
              {banner.tagline}
            </p>

            {/* Subcategory pills */}
            {subcategories && subcategories.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {subcategories.slice(0, 5).map((sub) => (
                  <Link
                    key={sub.id || sub.slug}
                    to={`/categories/${categorySlug}?subcategory=${sub.slug}`}
                    className="px-4 py-1.5 text-xs sm:text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-full hover:border-gray-900 hover:text-gray-900 transition-colors"
                  >
                    {sub.name}
                  </Link>
                ))}
              </div>
            )}

            {/* Explore button — only show if no subcategory pills */}
            {(!subcategories || subcategories.length === 0) && (
              <button
                onClick={handleExploreClick}
                className="mt-4 px-6 py-2 text-sm font-semibold text-white bg-gray-900 rounded-full hover:bg-gray-800 transition-colors cursor-pointer"
              >
                Explore Now
              </button>
            )}
          </div>

          {/* ── Image ── */}
          <div className="hidden sm:block flex-shrink-0 w-[200px] sm:w-[260px] lg:w-[340px]">
            <img
              src={banner.image}
              alt={displayTitle}
              className="w-full h-[160px] sm:h-[190px] lg:h-[220px] object-cover rounded-xl"
              loading="eager"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryHero;