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
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-dark via-[#243041] to-dark px-5 sm:px-14 py-8 sm:py-16">
            {/* Decorative circles */}
            <div className="absolute -top-20 -right-20 w-48 sm:w-64 h-48 sm:h-64 rounded-full bg-brand/10 blur-3xl" />
            <div className="absolute -bottom-20 -left-20 w-48 sm:w-64 h-48 sm:h-64 rounded-full bg-emerald-500/10 blur-3xl" />

            <div className="relative z-10 flex flex-col lg:flex-row items-center gap-8 lg:gap-16">
              {/* Left: Text */}
              <div className="flex-1 text-center lg:text-left">
                <span className="inline-block mb-3 text-xs font-bold tracking-widest uppercase text-brand">
                  Exclusive Offer
                </span>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white leading-tight">
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
    </>
  );
};

export default Discount;
