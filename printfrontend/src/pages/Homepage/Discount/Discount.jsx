import React, { useState } from 'react';

const Discount = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email.trim()) {
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 3000);
      setEmail('');
    }
  };

  return (
    <>
      {/* Newsletter Section */}
      <div className="w-full px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-dark via-[#243041] to-dark px-6 sm:px-14 py-10 sm:py-16">
            {/* Decorative circles */}
            <div className="absolute -top-20 -right-20 w-48 sm:w-64 h-48 sm:h-64 rounded-full bg-brand/10 blur-3xl" />
            <div className="absolute -bottom-20 -left-20 w-48 sm:w-64 h-48 sm:h-64 rounded-full bg-emerald-500/10 blur-3xl" />

            <div className="relative z-10 flex flex-col lg:flex-row items-center gap-8 lg:gap-16">
              {/* Left: Text */}
              <div className="flex-1 text-center lg:text-left">
                <span className="inline-block mb-3 text-xs font-bold tracking-widest uppercase text-brand">
                  Exclusive Offer
                </span>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white leading-tight font-serif">
                  Get 15% off your<br className="hidden sm:block" /> first order
                </h2>
                <p className="mt-3 text-gray-400 text-sm sm:text-base max-w-md mx-auto lg:mx-0">
                  Sign up for our newsletter and never miss out on new products, exclusive deals, and design inspiration.
                </p>
              </div>

              {/* Right: Form */}
              <div className="w-full lg:w-auto lg:min-w-[380px]">
                <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      required
                      className="w-full py-3.5 px-5 bg-white/10 border border-white/20 rounded-full text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand/50 text-sm transition-all"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-8 py-3.5 bg-brand text-white font-semibold rounded-full hover:bg-brand-500 active:scale-[0.97] transition-all duration-200 text-sm whitespace-nowrap shadow-lg shadow-brand/20"
                  >
                    {submitted ? '✓ Subscribed!' : 'Subscribe'}
                  </button>
                </form>
                <p className="mt-4 text-[11px] text-gray-500 text-center lg:text-left leading-relaxed">
                  By subscribing, you agree to our{' '}
                  <a href="/privacy" className="underline underline-offset-2 hover:text-brand transition-colors">
                    Privacy Policy
                  </a>. Unsubscribe anytime.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Value Propositions — Icon Strip */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 mt-10 sm:mt-16 mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
          <div className="flex items-start gap-4 group">
            <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-brand-50 rounded-xl flex items-center justify-center group-hover:bg-brand-100 transition-colors">
              <svg className="w-6 h-6 text-brand" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-bold text-dark mb-1">Best Prices, Even for Singles</h3>
              <p className="text-sm text-gray-500 leading-relaxed">Get affordable pricing even on single quantity orders. No minimum required.</p>
            </div>
          </div>

          <div className="flex items-start gap-4 group">
            <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-emerald-50 rounded-xl flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-dark mb-1">Premium Quality Products</h3>
              <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">High-quality prints and easy-to-use design tools for every product.</p>
            </div>
          </div>

          <div className="flex items-start gap-4 group">
            <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-amber-50 rounded-xl flex items-center justify-center group-hover:bg-amber-100 transition-colors">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-dark mb-1">Free Replacement or Refund</h3>
              <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">Not satisfied? We'll make it right with a free replacement or full refund.</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Discount;
