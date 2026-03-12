import React from 'react';

const stats = [
    {
        icon: (
            <svg className="w-7 h-7 text-brand" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
            </svg>
        ),
        value: "5+",
        label: "Years of Trust",
    },
    {
        icon: (
            <svg className="w-7 h-7 text-brand" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        ),
        value: "Best",
        label: "Prices Guaranteed",
    },
    {
        icon: (
            <svg className="w-7 h-7 text-brand" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
            </svg>
        ),
        value: "24/7",
        label: "Excellent Support",
    },
    {
        icon: (
            <svg className="w-7 h-7 text-brand" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" />
            </svg>
        ),
        value: "10K+",
        label: "Happy Customers",
    },
];

const WhyChooseUs = () => {
    return (
        <section className="w-full px-4 sm:px-6 py-6 sm:py-10">
            <div className="max-w-6xl mx-auto">
                <div className="relative overflow-hidden rounded-2xl bg-white border border-gray-100 shadow-sm">
                    <div className="flex flex-col lg:flex-row">

                        {/* Left: Brand Panel */}
                        <div className="relative lg:w-72 xl:w-80 bg-gradient-to-br from-brand via-brand-400 to-teal-500 px-8 py-10 lg:py-14 flex items-center overflow-hidden">
                            {/* Decorative circles */}
                            <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full" />
                            <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-white/10 rounded-full" />

                            <div className="relative z-10">
                                <p className="text-white/80 text-sm font-medium mb-1">Why Should You</p>
                                <h2 className="text-3xl sm:text-4xl font-bold text-white leading-tight">
                                    Choose<br />PrintDoot?
                                </h2>
                            </div>
                        </div>

                        {/* Right: Stats Grid */}
                        <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 divide-x divide-gray-100">
                            {stats.map((stat, index) => (
                                <div
                                    key={index}
                                    className="flex flex-col items-center justify-center px-4 py-8 sm:py-10 group hover:bg-brand-50/30 transition-colors duration-300"
                                >
                                    {/* Circle icon */}
                                    <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-full border-2 border-brand/20 flex items-center justify-center mb-4 group-hover:border-brand/40 group-hover:bg-brand-50 transition-all duration-300">
                                        {stat.icon}
                                    </div>

                                    {/* Value */}
                                    <span className="text-2xl sm:text-3xl font-bold text-dark mb-1">
                                        {stat.value}
                                    </span>

                                    {/* Label */}
                                    <span className="text-xs sm:text-sm text-gray-500 font-medium text-center leading-tight">
                                        {stat.label}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default WhyChooseUs;
