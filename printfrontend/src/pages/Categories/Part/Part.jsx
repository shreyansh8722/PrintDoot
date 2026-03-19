import React from 'react';

// ── Category-specific banner images ──
import bannerVisitingCards from '../../../assets/banner-visiting-cards.png';
import bannerTshirts from '../../../assets/banner-tshirts.png';
import bannerMugs from '../../../assets/banner-mugs.png';
import bannerStickers from '../../../assets/banner-stickers.png';
import bannerPhotoFrames from '../../../assets/banner-photo-frames.png';
import bannerStationery from '../../../assets/banner-stationery.png';
import bannerCaps from '../../../assets/banner-caps.png';
import bannerCorporate from '../../../assets/banner-corporate.png';

/* ── Category banner config ──
   Maps category slugs to unique banner images, colors, and copy.
   Falls back to the default "View All" banner for unknown slugs. */
const CATEGORY_BANNERS = {
  'visiting-cards': {
    image: bannerVisitingCards,
    gradient: 'from-[#1a1a2e] to-[#16213e]',
    title: 'Visiting Cards',
    tagline: 'Premium business cards with gold foil & embossed finishes that leave a lasting impression.',
  },
  'business-cards': {
    image: bannerVisitingCards,
    gradient: 'from-[#1a1a2e] to-[#16213e]',
    title: 'Business Cards',
    tagline: 'Premium business cards with gold foil & embossed finishes that leave a lasting impression.',
  },
  't-shirts': {
    image: bannerTshirts,
    gradient: 'from-[#0f4c75] to-[#3282b8]',
    title: 'T-Shirts & Apparel',
    tagline: 'Custom printed t-shirts, hoodies & caps — wear your brand with pride.',
  },
  'tshirts': {
    image: bannerTshirts,
    gradient: 'from-[#0f4c75] to-[#3282b8]',
    title: 'T-Shirts & Apparel',
    tagline: 'Custom printed t-shirts, hoodies & caps — wear your brand with pride.',
  },
  'apparel': {
    image: bannerTshirts,
    gradient: 'from-[#0f4c75] to-[#3282b8]',
    title: 'Apparel',
    tagline: 'Custom printed t-shirts, hoodies & caps — wear your brand with pride.',
  },
  'mugs': {
    image: bannerMugs,
    gradient: 'from-[#5b3a29] to-[#8b5e3c]',
    title: 'Mugs & Drinkware',
    tagline: 'Personalised mugs, bottles & drinkware — perfect for gifts & everyday use.',
  },
  'drinkware': {
    image: bannerMugs,
    gradient: 'from-[#5b3a29] to-[#8b5e3c]',
    title: 'Drinkware',
    tagline: 'Custom printed mugs and drinkware for every occasion.',
  },
  'stickers': {
    image: bannerStickers,
    gradient: 'from-[#e65100] to-[#ff8f00]',
    title: 'Stickers & Labels',
    tagline: 'Die-cut stickers, vinyl decals & custom labels — vibrant and long-lasting.',
  },
  'labels': {
    image: bannerStickers,
    gradient: 'from-[#e65100] to-[#ff8f00]',
    title: 'Labels',
    tagline: 'Custom printed labels for your products and packaging.',
  },
  'photo-frames': {
    image: bannerPhotoFrames,
    gradient: 'from-[#4a148c] to-[#7b1fa2]',
    title: 'Photo Frames & Gifts',
    tagline: 'Cherish every moment with custom frames, canvas prints & photo gifts.',
  },
  'photo-gifts': {
    image: bannerPhotoFrames,
    gradient: 'from-[#4a148c] to-[#7b1fa2]',
    title: 'Photo Gifts',
    tagline: 'Personalised photo gifts — perfect for birthdays, anniversaries & more.',
  },
  'gifts': {
    image: bannerPhotoFrames,
    gradient: 'from-[#4a148c] to-[#7b1fa2]',
    title: 'Gifts',
    tagline: 'Personalised gifts for every occasion — crafted just for you.',
  },
  'stationery': {
    image: bannerStationery,
    gradient: 'from-[#2e7d32] to-[#66bb6a]',
    title: 'Stationery',
    tagline: 'Notebooks, letterheads, envelopes & more — crafted for professionals.',
  },
  'notebooks': {
    image: bannerStationery,
    gradient: 'from-[#2e7d32] to-[#66bb6a]',
    title: 'Notebooks',
    tagline: 'Custom notebooks and diaries for everyday use.',
  },
  'caps': {
    image: bannerCaps,
    gradient: 'from-[#b71c1c] to-[#e53935]',
    title: 'Caps & Hats',
    tagline: 'Custom embroidered & printed caps, snapbacks & beanies for your crew.',
  },
  'hats': {
    image: bannerCaps,
    gradient: 'from-[#b71c1c] to-[#e53935]',
    title: 'Hats',
    tagline: 'Custom printed hats and headwear.',
  },
  'corporate': {
    image: bannerCorporate,
    gradient: 'from-[#263238] to-[#455a64]',
    title: 'Corporate Gifting',
    tagline: 'Premium employee kits, branded merch & bulk corporate gifts.',
  },
  'corporate-gifts': {
    image: bannerCorporate,
    gradient: 'from-[#263238] to-[#455a64]',
    title: 'Corporate Gifting',
    tagline: 'Premium employee kits, branded merch & bulk corporate gifts.',
  },
  'corporate-gifting': {
    image: bannerCorporate,
    gradient: 'from-[#263238] to-[#455a64]',
    title: 'Corporate Gifting',
    tagline: 'Premium employee kits, branded merch & bulk corporate gifts.',
  },
};

const DEFAULT_BANNER = {
  image: 'https://cms.cloudinary.vpsvc.com/image/upload/c_scale,dpr_auto,f_auto,q_auto:good,w_1920/India%20LOB/marquee/For%20Marketing/All-categories2_Marquee_Category-Page_for-marketing',
  gradient: 'from-[#4db0ce] to-[#3a8da6]',
  title: 'All Categories',
  tagline: 'Find high-quality customised products you need for your business and beyond.',
};

/**
 * CategoryHero — dynamic banner per category.
 * @param {{ categorySlug?: string, categoryName?: string }} props
 */
const CategoryHero = ({ categorySlug, categoryName }) => {
  // Resolve banner config: slug match → category name match → default
  const slugKey = categorySlug?.toLowerCase();
  let banner = CATEGORY_BANNERS[slugKey] || DEFAULT_BANNER;

  // If slug didn't match, try a fuzzy match on the category name
  if (banner === DEFAULT_BANNER && categoryName) {
    const nameKey = categoryName.toLowerCase().replace(/\s+/g, '-');
    banner = CATEGORY_BANNERS[nameKey] || DEFAULT_BANNER;
  }

  // If we have a category name but no specific banner, override the title
  const displayTitle = (banner === DEFAULT_BANNER && categoryName)
    ? categoryName
    : banner.title;

  const handleExploreClick = () => {
    const productsSection = document.getElementById('products-section');
    if (productsSection) {
      const offset = productsSection.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top: offset, behavior: 'smooth' });
    }
  };

  return (
    <div className={`relative w-full bg-gradient-to-r ${banner.gradient} overflow-hidden`}>
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12 lg:py-20">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-12">
          {/* Left Content */}
          <div className="lg:w-1/2 text-center lg:text-left space-y-4 lg:space-y-6">
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold text-white tracking-tight leading-tight">
              {displayTitle.includes(' ')
                ? <>
                    {displayTitle.split(' ').slice(0, -1).join(' ')}{' '}
                    <span className="text-white/40">{displayTitle.split(' ').slice(-1)}</span>
                  </>
                : <>{displayTitle}</>
              }
            </h1>
            <p className="text-lg lg:text-2xl text-white/90 font-medium max-w-xl">
              {banner.tagline}
            </p>
            <div className="pt-2 lg:pt-4">
              <button
                onClick={handleExploreClick}
                className="bg-white text-black px-8 py-3 rounded-full font-bold shadow-lg hover:bg-gray-100 transition-all active:scale-95 cursor-pointer"
              >
                Explore Now ↓
              </button>
            </div>
          </div>

          {/* Right Image */}
          <div className="lg:w-1/2 relative">
            <div className="relative z-10 rounded-2xl overflow-hidden shadow-2xl transform rotate-2 hover:rotate-0 transition-transform duration-500">
              <img
                src={banner.image}
                alt={displayTitle}
                className="w-full h-auto object-cover"
                loading="eager"
                fetchPriority="high"
              />
            </div>
            {/* Decorative element */}
            <div className="absolute -bottom-6 -right-6 w-full h-full bg-white/10 rounded-2xl -z-0 transform -rotate-3" />
          </div>
        </div>
      </div>

      {/* Decorative background circle */}
      <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />
    </div>
  );
};

export default CategoryHero;