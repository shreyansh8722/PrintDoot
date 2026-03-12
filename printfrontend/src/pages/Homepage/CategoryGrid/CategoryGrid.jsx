import React from 'react';
import { Link } from 'react-router-dom';

import catVisitingCards from '../../../assets/cat-visiting-cards.png';
import catTshirts from '../../../assets/cat-tshirts.png';
import catMugs from '../../../assets/cat-mugs.png';
import catPhotoFrames from '../../../assets/cat-photo-frames.png';
import catStationery from '../../../assets/cat-stationery.png';
import catStickers from '../../../assets/cat-stickers.png';
import catCorporate from '../../../assets/cat-corporate.png';
import catCaps from '../../../assets/cat-caps.png';

const categories = [
    { title: 'Visiting Cards', image: catVisitingCards, link: '/search?q=visiting+cards' },
    { title: 'Custom T-Shirts', image: catTshirts, link: '/search?q=custom+tshirt' },
    { title: 'Photo Mugs', image: catMugs, link: '/search?q=mugs' },
    { title: 'Photo Frames', image: catPhotoFrames, link: '/search?q=photo+frames' },
    { title: 'Stationery', image: catStationery, link: '/search?q=stationery' },
    { title: 'Stickers & Labels', image: catStickers, link: '/search?q=stickers' },
    { title: 'Corporate Gifts', image: catCorporate, link: '/search?q=corporate+gifts' },
    { title: 'Custom Caps', image: catCaps, link: '/search?q=caps' },
];

const CategoryGrid = () => {
    return (
        <section className="w-full py-8 sm:py-12 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">

                {/* Scrollable on mobile, grid on desktop */}
                <div className="flex gap-5 sm:gap-8 overflow-x-auto pb-2 sm:pb-0 scrollbar-hide sm:grid sm:grid-cols-4 md:grid-cols-8 sm:overflow-visible">
                    {categories.map((cat, idx) => (
                        <Link
                            key={idx}
                            to={cat.link}
                            className="flex flex-col items-center gap-3 group flex-shrink-0 w-[100px] sm:w-auto"
                        >
                            {/* Circular Image */}
                            <div className="w-[104px] h-[104px] sm:w-[128px] sm:h-[128px] rounded-full overflow-hidden shadow-sm group-hover:shadow-md transition-all duration-300 group-hover:scale-105 bg-gray-50">
                                <img
                                    src={cat.image}
                                    alt={cat.title}
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                />
                            </div>

                            {/* Label */}
                            <span className="text-[12px] sm:text-sm text-gray-700 font-medium text-center leading-tight group-hover:text-brand transition-colors">
                                {cat.title}
                            </span>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Hide scrollbar */}
            <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
        </section>
    );
};

export default CategoryGrid;
