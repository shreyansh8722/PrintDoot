import React from 'react';

const CategoryHero = () => {
  return (
    <div className="relative w-full bg-[#4db0ce] bg-gradient-to-r from-[#4db0ce] to-[#3a8da6] overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16 lg:py-24">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
          {/* Left Content */}
          <div className="lg:w-1/2 text-center lg:text-left space-y-6">
            <h1 className="text-5xl lg:text-7xl font-extrabold text-white tracking-tight leading-tight">
              View all <span className="text-black/20">categories</span>
            </h1>
            <p className="text-xl lg:text-2xl text-white/90 font-medium max-w-xl">
              Find high-quality customised products you need for your business and beyond.
            </p>
            <div className="pt-4">
              <button className="bg-white text-black px-8 py-3 rounded-full font-bold shadow-lg hover:bg-gray-100 transition-all active:scale-95">
                Explore Now
              </button>
            </div>
          </div>

          {/* Right Image */}
          <div className="lg:w-1/2 relative">
            <div className="relative z-10 rounded-2xl overflow-hidden shadow-2xl transform rotate-2 hover:rotate-0 transition-transform duration-500">
              <img
                src="https://cms.cloudinary.vpsvc.com/image/upload/c_scale,dpr_auto,f_auto,q_auto:good,w_1920/India%20LOB/marquee/For%20Marketing/All-categories2_Marquee_Category-Page_for-marketing"
                alt="All Categories"
                className="w-full h-auto"
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