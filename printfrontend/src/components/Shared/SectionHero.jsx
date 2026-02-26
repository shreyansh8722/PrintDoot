import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

/* ── Single hero card with skeleton loading ── */
function HeroCard({ item }) {
    const navigate = useNavigate();
    const [imgLoaded, setImgLoaded] = useState(false);

    const handleButtonClick = (link) => {
        if (!link || link === '#') return;
        if (link.startsWith('http')) {
            window.open(link, '_blank', 'noopener,noreferrer');
        } else {
            navigate(link);
        }
    };

    return (
        <div className="relative h-[420px] overflow-hidden group">
            {/* Skeleton placeholder */}
            {!imgLoaded && (
                <div className="absolute inset-0 skeleton-shimmer bg-gray-200" />
            )}

            {/* Actual image — fades in when loaded */}
            <img
                src={item.image}
                alt={item.title}
                onLoad={() => setImgLoaded(true)}
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
                    imgLoaded ? 'opacity-100' : 'opacity-0'
                }`}
            />

            {/* Content overlay */}
            <div className={`absolute bottom-6 left-6 bg-white/95 backdrop-blur-sm p-6 rounded-xl shadow-lg max-w-sm transition-all duration-500 group-hover:shadow-2xl group-hover:bg-white ${
                imgLoaded ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
            }`}>
                <h2 className="text-2xl font-bold text-black mb-1">
                    {item.title}
                </h2>

                {item.subtitle && (
                    <p className="mt-2 text-gray-600 font-medium italic">
                        {item.subtitle}
                    </p>
                )}

                <div className="mt-4 flex gap-3 flex-wrap">
                    {item.buttons?.map((btn, idx) => {
                        if (btn.link && btn.link !== '#' && !btn.link.startsWith('http')) {
                            return (
                                <Link
                                    key={idx}
                                    to={btn.link}
                                    className={`${btn.primary
                                        ? "bg-black text-white hover:bg-gray-800"
                                        : "bg-white text-black border border-black hover:bg-gray-50"
                                        } px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 active:scale-95 inline-block text-center`}
                                >
                                    {btn.label}
                                </Link>
                            );
                        }
                        return (
                            <button
                                key={idx}
                                onClick={() => handleButtonClick(btn.link)}
                                className={`${btn.primary
                                        ? "bg-black text-white hover:bg-gray-800"
                                        : "bg-white text-black border border-black hover:bg-gray-50"
                                    } px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 active:scale-95`}
                            >
                                {btn.label}
                            </button>
                        );
                    })}
                </div>

                {item.footer && (
                    <div className="mt-4 pt-4 border-t border-gray-100 text-xs text-gray-500 flex items-center gap-1">
                        {item.footer.split(">").map((text, i, arr) => (
                            <React.Fragment key={i}>
                                <span>{text.trim()}</span>
                                {i < arr.length - 1 && <span className="opacity-30">❯</span>}
                            </React.Fragment>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

const SectionHero = ({ data, className = "" }) => {
    return (
        <section className={`w-full py-10 bg-white overflow-hidden ${className}`}>
            <div className="w-full">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-[5px]">
                    {data.map((item) => (
                        <HeroCard key={item.id} item={item} />
                    ))}
                </div>
            </div>
        </section>
    );
};

export default SectionHero;
