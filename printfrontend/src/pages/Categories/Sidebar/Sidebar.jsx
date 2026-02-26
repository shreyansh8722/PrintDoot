import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaChevronDown, FaChevronUp, FaTimes, FaStar } from 'react-icons/fa';

/* ── Price range presets ── */
const PRICE_RANGES = [
  { label: 'Under ₹500', min: 0, max: 500 },
  { label: '₹500 – ₹1,000', min: 500, max: 1000 },
  { label: '₹1,000 – ₹2,500', min: 1000, max: 2500 },
  { label: '₹2,500 – ₹5,000', min: 2500, max: 5000 },
  { label: 'Over ₹5,000', min: 5000, max: '' },
];

const Sidebar = ({
  categories = [],
  showProducts = false,
  // Filter props
  onFilterChange,
  activeFilters = {},        // { minPrice, maxPrice, categorySlug, minRating }
  allCategories = [],        // All categories for the filter list
}) => {
  const [priceOpen, setPriceOpen] = useState(true);
  const [categoryOpen, setCategoryOpen] = useState(true);
  const [ratingOpen, setRatingOpen] = useState(true);
  const [customMin, setCustomMin] = useState(activeFilters.minPrice || '');
  const [customMax, setCustomMax] = useState(activeFilters.maxPrice || '');

  const handlePricePreset = (min, max) => {
    setCustomMin(min);
    setCustomMax(max);
    onFilterChange?.({ minPrice: min, maxPrice: max });
  };

  const handleCustomPrice = (e) => {
    e.preventDefault();
    onFilterChange?.({ minPrice: customMin, maxPrice: customMax });
  };

  const handleClearPrice = () => {
    setCustomMin('');
    setCustomMax('');
    onFilterChange?.({ minPrice: '', maxPrice: '' });
  };

  const handleCategoryFilter = (slug) => {
    onFilterChange?.({ categorySlug: slug });
  };

  const hasActivePrice = activeFilters.minPrice || activeFilters.maxPrice;

  return (
    <div className="space-y-6">
      {/* ─────── Price Filter ─────── */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
        <button
          onClick={() => setPriceOpen(!priceOpen)}
          className="w-full flex items-center justify-between p-5 text-left"
        >
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Price</h3>
          {priceOpen ? (
            <FaChevronUp className="text-gray-400 text-xs" />
          ) : (
            <FaChevronDown className="text-gray-400 text-xs" />
          )}
        </button>

        {priceOpen && (
          <div className="px-5 pb-5 space-y-3">
            {/* Preset ranges */}
            {PRICE_RANGES.map((range, idx) => {
              const isActive =
                String(activeFilters.minPrice) === String(range.min) &&
                String(activeFilters.maxPrice) === String(range.max);
              return (
                <button
                  key={idx}
                  onClick={() => handlePricePreset(range.min, range.max)}
                  className={`block w-full text-left px-3 py-2 text-sm rounded-lg transition-all ${
                    isActive
                      ? 'bg-black text-white font-medium'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-black'
                  }`}
                >
                  {range.label}
                </button>
              );
            })}

            {/* Custom range */}
            <form onSubmit={handleCustomPrice} className="pt-3 border-t border-gray-100">
              <p className="text-xs font-medium text-gray-500 mb-2">Custom Range</p>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={customMin}
                  onChange={(e) => setCustomMin(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/10"
                  min="0"
                />
                <span className="text-gray-400 text-xs">–</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={customMax}
                  onChange={(e) => setCustomMax(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/10"
                  min="0"
                />
              </div>
              <div className="flex gap-2 mt-2">
                <button
                  type="submit"
                  className="flex-1 bg-black text-white text-xs font-semibold py-2 rounded-lg hover:bg-gray-800 transition-colors"
                >
                  Apply
                </button>
                {hasActivePrice && (
                  <button
                    type="button"
                    onClick={handleClearPrice}
                    className="flex items-center gap-1 px-3 py-2 text-xs text-gray-500 hover:text-red-500 transition-colors"
                  >
                    <FaTimes /> Clear
                  </button>
                )}
              </div>
            </form>
          </div>
        )}
      </div>

      {/* ─────── Rating Filter ─────── */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
        <button
          onClick={() => setRatingOpen(!ratingOpen)}
          className="w-full flex items-center justify-between p-5 text-left"
        >
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Rating</h3>
          {ratingOpen ? (
            <FaChevronUp className="text-gray-400 text-xs" />
          ) : (
            <FaChevronDown className="text-gray-400 text-xs" />
          )}
        </button>

        {ratingOpen && (
          <div className="px-5 pb-5 space-y-1">
            {[4, 3, 2, 1].map((stars) => {
              const isActive = Number(activeFilters.minRating) === stars;
              return (
                <button
                  key={stars}
                  onClick={() => onFilterChange?.({ minRating: isActive ? '' : stars })}
                  className={`flex items-center gap-2 w-full text-left px-3 py-2 text-sm rounded-lg transition-all ${
                    isActive
                      ? 'bg-black text-white font-medium'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-black'
                  }`}
                >
                  <span className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <FaStar
                        key={s}
                        className={`text-xs ${
                          s <= stars
                            ? isActive ? 'text-yellow-300' : 'text-yellow-400'
                            : isActive ? 'text-gray-500' : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </span>
                  <span>& Up</span>
                </button>
              );
            })}
            {activeFilters.minRating && (
              <button
                onClick={() => onFilterChange?.({ minRating: '' })}
                className="flex items-center gap-1 px-3 py-2 text-xs text-gray-500 hover:text-red-500 transition-colors"
              >
                <FaTimes /> Clear rating filter
              </button>
            )}
          </div>
        )}
      </div>

      {/* ─────── Category Filter ─────── */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
        <button
          onClick={() => setCategoryOpen(!categoryOpen)}
          className="w-full flex items-center justify-between p-5 text-left"
        >
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Category</h3>
          {categoryOpen ? (
            <FaChevronUp className="text-gray-400 text-xs" />
          ) : (
            <FaChevronDown className="text-gray-400 text-xs" />
          )}
        </button>

        {categoryOpen && (
          <div className="px-5 pb-5 space-y-1">
            {/* "All" option */}
            <button
              onClick={() => handleCategoryFilter('')}
              className={`block w-full text-left px-3 py-2 text-sm rounded-lg transition-all ${
                !activeFilters.categorySlug
                  ? 'bg-black text-white font-medium'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-black'
              }`}
            >
              All Categories
            </button>

            {(allCategories.length > 0 ? allCategories : categories).map((category) => (
              <div key={category.id}>
                <button
                  onClick={() => handleCategoryFilter(category.slug)}
                  className={`block w-full text-left px-3 py-2 text-sm rounded-lg transition-all ${
                    activeFilters.categorySlug === category.slug
                      ? 'bg-black text-white font-medium'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-black'
                  }`}
                >
                  {category.name}
                </button>
                {/* Show subcategories when category is active */}
                {activeFilters.categorySlug === category.slug &&
                  category.subcategories &&
                  category.subcategories.length > 0 && (
                    <div className="ml-4 mt-1 space-y-0.5">
                      {category.subcategories.map((sub) => (
                        <Link
                          key={sub.id}
                          to={`/categories/${category.slug}?subcategory=${sub.slug}`}
                          className="block px-3 py-1.5 text-xs text-gray-500 hover:text-black hover:bg-gray-50 rounded-lg transition-all"
                        >
                          {sub.name}
                        </Link>
                      ))}
                    </div>
                  )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ─────── Navigation Sidebar (existing behavior) ─────── */}
      {showProducts && categories.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
          <div className="p-5">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Browse</h3>
            {categories.map((category) => (
              <div key={category.id}>
                {category.subcategories &&
                  category.subcategories.map((sub) => (
                    <div key={sub.id} className="mb-4 last:mb-0">
                      <h4 className="text-sm font-semibold text-gray-800 mb-2 pb-1 border-b border-gray-100">
                        {sub.name}
                      </h4>
                      <ul className="space-y-1">
                        {(sub.products || []).map((product) => (
                          <li key={product.id}>
                            <Link
                              to={`/product/${product.slug}`}
                              className="block px-3 py-1.5 text-sm text-gray-600 hover:text-black hover:bg-gray-50 rounded-lg transition-all"
                            >
                              {product.name}
                            </Link>
                          </li>
                        ))}
                        {(sub.products || []).length === 0 && (
                          <li className="text-xs text-gray-400 italic px-3">No products</li>
                        )}
                      </ul>
                    </div>
                  ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
