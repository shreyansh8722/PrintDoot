import React from 'react';
import { Link } from 'react-router-dom';

const BusinessEssentials = ({ title = "Business Essentials", products = [] }) => {
  if (!products || products.length === 0) return null;

  return (
    <div className="bg-white font-sans">
      {/* Header */}
      <div className="mb-10 text-center">
        <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
          {title}
        </h2>
        <p className="mt-2 text-gray-500">Professional materials for your brand</p>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {products.map((product) => (
          <Link
            key={product.id}
            to={product.href || `/product/${product.slug}`}
            className="group cursor-pointer block"
          >
            {/* Image with Hover Effect */}
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-gray-50 mb-4 shadow-sm group-hover:shadow-md transition-all duration-300">
              <img
                src={product.image || product.img}
                alt={product.title}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>

            {/* Product Name */}
            <h3 className="text-base font-semibold text-gray-800 text-center group-hover:text-black transition-colors">
              {product.title}
            </h3>

            {product.price && (
              <p className="text-sm font-medium text-gray-500 text-center mt-1">
                {product.price}
              </p>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
};

export default BusinessEssentials;

