import React from 'react';
import discountImg from './image.png';

const Discount = () => {
  return (
    <>
      {/* Discount Section */}
      <div className="w-full h-[65vh] flex justify-center items-center px-4">
        <div className="flex flex-col md:flex-row gap-10 bg-gray-100/80 rounded-xl w-full h-full p-10">
          
          {/* LEFT IMAGE */}
          <div className="flex justify-center items-center md:w-1/2 rounded-xl overflow-hidden">
            <img src={discountImg} alt="Discount" className="w-[95%] h-full object-contain" />
          </div>

          {/* RIGHT CONTENT */}
          <div className="flex flex-col justify-between items-center md:w-1/2 h-full px-8">
            <h2 className="text-2xl font-semibold text-center mb-3">It's good to be on the list.</h2>
            <p className="font-bold text-center mb-5">Get 15% off* your first order when you sign up for our emails</p>

            <input 
              type="email" 
              placeholder="Subscription email" 
              className="w-full py-3 px-4 text-lg border border-gray-300 rounded-lg mb-5 outline-none"
            />

            <p className="text-gray-700 text-sm text-center mb-5">
              Yes, I'd like to receive special offer emails from VistaPrint, as well as news about products, services and my designs in progress. Read our <a href="#" className="underline">Privacy and Cookie Policy</a>.
            </p>

            <button className="bg-gray-200 text-gray-600 border border-gray-300 rounded-lg px-8 py-3 w-[245px] text-center" disabled>
              Submit
            </button>
          </div>

        </div>
      </div>

      {/* About + Features Section */}
      <div className="max-w-6xl mx-auto px-4 mt-12 flex flex-col md:flex-row gap-10">

        {/* Left Column */}
        <div className="md:w-1/2 text-left">
          <h2 className="text-3xl font-semibold mb-4">VistaPrint India: Leader in Customisation</h2>
          <p className="text-gray-700 text-base leading-relaxed">
            For over 20 years, VistaPrint has empowered business owners, entrepreneurs, 
            and individuals to build their unique identities with custom designs and 
            professional marketing solutions. Our online printing services provide 
            high-quality, customised products you need — from visiting cards and 
            personalised clothing to gifting items and much more.
          </p>
        </div>

        {/* Right Column */}
        <div className="md:w-1/2 flex flex-col gap-8">
          <div>
            <h3 className="text-xl font-semibold mb-2">Even Low Quantities @ Best Prices</h3>
            <p className="text-gray-700 text-base leading-relaxed">We offer low/single product quantities at affordable prices.</p>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-2">High Quality Products and Easy Design</h3>
            <p className="text-gray-700 text-base leading-relaxed">
              Our wide selection of high-quality products and online design tools make it easy for you to customize and order your favourite products.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-2">Free Replacement or Full Refund</h3>
            <p className="text-gray-700 text-base leading-relaxed">
              We stand by everything we sell. So if you’re not satisfied, we’ll make it right.
            </p>
          </div>
        </div>

      </div>
    </>
  );
};

export default Discount;
