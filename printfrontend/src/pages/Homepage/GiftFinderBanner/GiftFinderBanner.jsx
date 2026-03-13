import React from 'react';
import { Link } from 'react-router-dom';

const GiftFinderBanner = () => {
    return (
        <section className="w-full px-4 sm:px-6 py-6 sm:py-10">
            <div className="max-w-6xl mx-auto">
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-brand via-brand-400 to-brand-300 shadow-lg shadow-brand/10">
                    {/* Decorative shapes */}
                    <div className="absolute -left-6 top-1/2 -translate-y-1/2 w-28 h-28 sm:w-40 sm:h-40 bg-white/10 rounded-full blur-xl" />
                    <div className="absolute right-20 -top-10 w-32 h-32 bg-white/5 rounded-full" />
                    <div className="absolute right-0 bottom-0 w-48 h-48 bg-white/5 rounded-full translate-x-12 translate-y-12" />

                    <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between px-6 sm:px-14 py-6 sm:py-10 gap-5 sm:gap-6">
                        {/* Left: Gift icon */}
                        <div className="flex-shrink-0 hidden sm:block">
                            <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm shadow-xl shadow-black/10 rotate-6 hover:rotate-0 transition-transform duration-500">
                                <span className="text-5xl">🎁</span>
                            </div>
                        </div>

                        {/* Center: Text */}
                        <div className="text-center sm:text-left flex-1">
                            <p className="text-white/80 text-sm sm:text-base font-medium mb-1">
                                Still Confused?
                            </p>
                            <p className="text-white/90 text-base sm:text-lg font-medium mb-1">
                                Try Our
                            </p>
                            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white tracking-tight">
                                Smart Gift Finder
                            </h2>
                        </div>

                        {/* Right: CTA Button */}
                        <Link
                            to="/view-all"
                            className="inline-flex items-center gap-2 bg-white text-dark font-bold px-8 sm:px-10 py-3.5 sm:py-4 rounded-full shadow-lg hover:shadow-xl hover:scale-105 active:scale-[0.98] transition-all duration-300 text-sm sm:text-base whitespace-nowrap"
                        >
                            Start Search
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default GiftFinderBanner;
