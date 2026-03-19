import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { FaChevronLeft, FaChevronRight, FaStar, FaSortAmountDown, FaSlidersH, FaTimes } from 'react-icons/fa';
import Breadcrumb from './Breadcrumb/Breadcrumb';
import CategoryHero from './Part/Part';
import Sidebar from './Sidebar/Sidebar';
import BusinessEssentials from './Business/Business';
import catalogService from '../../services/catalogService';

const PRODUCTS_PER_PAGE = 12;

/* ── Price presets (must match Sidebar) ── */
const PRICE_RANGES = [
  { label: 'Under ₹500', min: 0, max: 500 },
  { label: '₹500 – ₹1,000', min: 500, max: 1000 },
  { label: '₹1,000 – ₹2,500', min: 1000, max: 2500 },
  { label: '₹2,500 – ₹5,000', min: 2500, max: 5000 },
  { label: 'Over ₹5,000', min: 5000, max: '' },
];

/* ───────────── Pagination Component ───────────── */
function Pagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible + 2) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);

      if (currentPage <= 3) {
        end = maxVisible;
      } else if (currentPage >= totalPages - 2) {
        start = totalPages - maxVisible + 1;
      }

      if (start > 2) pages.push('...');
      for (let i = start; i <= end; i++) pages.push(i);
      if (end < totalPages - 1) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="flex items-center justify-center gap-1 mt-12">
      {/* Previous */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        className={`flex items-center gap-1 px-4 py-2.5 text-sm font-medium rounded-lg transition-all ${currentPage <= 1
            ? 'text-gray-300 cursor-not-allowed'
            : 'text-gray-700 hover:bg-gray-100 hover:text-black'
          }`}
      >
        <FaChevronLeft className="text-xs" /> Prev
      </button>

      {/* Page numbers */}
      {getPageNumbers().map((page, idx) =>
        page === '...' ? (
          <span key={`ellipsis-${idx}`} className="px-3 py-2 text-sm text-gray-400">
            …
          </span>
        ) : (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`min-w-[40px] h-10 flex items-center justify-center text-sm font-medium rounded-lg transition-all ${currentPage === page
                ? 'bg-black text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-100 hover:text-black'
              }`}
          >
            {page}
          </button>
        )
      )}

      {/* Next */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className={`flex items-center gap-1 px-4 py-2.5 text-sm font-medium rounded-lg transition-all ${currentPage >= totalPages
            ? 'text-gray-300 cursor-not-allowed'
            : 'text-gray-700 hover:bg-gray-100 hover:text-black'
          }`}
      >
        Next <FaChevronRight className="text-xs" />
      </button>
    </div>
  );
}

/* ───────────── Mobile Filter Bottom Sheet ───────────── */
function MobileFilterSheet({ isOpen, onClose, draftFilters, setDraftFilters, onApply, onClear, allCategories, activeCatSlug }) {
  const sheetRef = useRef(null);

  // Get a friendly price label
  const getPriceLabel = (min, max) => {
    const match = PRICE_RANGES.find(r => String(r.min) === String(min) && String(r.max) === String(max));
    if (match) return match.label;
    if (min && max) return `₹${min} – ₹${max}`;
    if (min) return `From ₹${min}`;
    if (max) return `Up to ₹${max}`;
    return '';
  };

  const handlePricePreset = (min, max) => {
    // Toggle off if already selected
    if (String(draftFilters.minPrice) === String(min) && String(draftFilters.maxPrice) === String(max)) {
      setDraftFilters(prev => ({ ...prev, minPrice: '', maxPrice: '' }));
    } else {
      setDraftFilters(prev => ({ ...prev, minPrice: min, maxPrice: max }));
    }
  };

  const handleRating = (stars) => {
    if (Number(draftFilters.minRating) === stars) {
      setDraftFilters(prev => ({ ...prev, minRating: '' }));
    } else {
      setDraftFilters(prev => ({ ...prev, minRating: stars }));
    }
  };

  const activeFilterCount = [
    draftFilters.minPrice || draftFilters.maxPrice ? 1 : 0,
    draftFilters.minRating ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-[80] lg:hidden"
        onClick={onClose}
        style={{ animation: 'mfFadeIn 0.2s ease forwards' }}
      />

      {/* Bottom sheet */}
      <div
        ref={sheetRef}
        className="fixed bottom-0 left-0 right-0 z-[90] lg:hidden"
        style={{ animation: 'mfSlideUp 0.3s cubic-bezier(0.32,0.72,0,1) forwards' }}
      >
        <div className="bg-white rounded-t-[20px] shadow-2xl max-h-[70vh] flex flex-col">
          {/* Drag handle */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 rounded-full bg-gray-300" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3">
            <h3 className="font-bold text-base text-gray-900">Filters</h3>
            <div className="flex items-center gap-3">
              {activeFilterCount > 0 && (
                <button
                  onClick={onClear}
                  className="text-xs text-red-500 font-semibold hover:text-red-700 transition-colors"
                >
                  Clear all
                </button>
              )}
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
              >
                <FaTimes className="text-xs" />
              </button>
            </div>
          </div>

          {/* Filter content — compact scrollable area */}
          <div className="flex-1 overflow-y-auto px-5 pb-3" style={{ maxHeight: 'calc(70vh - 140px)' }}>

            {/* ── Price ── */}
            <div className="mb-5">
              <p className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-3">Price</p>
              <div className="flex flex-wrap gap-2">
                {PRICE_RANGES.map((range, idx) => {
                  const isActive =
                    String(draftFilters.minPrice) === String(range.min) &&
                    String(draftFilters.maxPrice) === String(range.max);
                  return (
                    <button
                      key={idx}
                      onClick={() => handlePricePreset(range.min, range.max)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all ${
                        isActive
                          ? 'bg-gray-900 text-white border-gray-900'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                      }`}
                    >
                      {range.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ── Rating ── */}
            <div className="mb-3">
              <p className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-3">Rating</p>
              <div className="flex flex-wrap gap-2">
                {[4, 3, 2, 1].map((stars) => {
                  const isActive = Number(draftFilters.minRating) === stars;
                  return (
                    <button
                      key={stars}
                      onClick={() => handleRating(stars)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full border transition-all ${
                        isActive
                          ? 'bg-gray-900 text-white border-gray-900'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                      }`}
                    >
                      <span className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <FaStar
                            key={s}
                            className={`text-[10px] ${
                              s <= stars
                                ? isActive ? 'text-yellow-300' : 'text-yellow-400'
                                : isActive ? 'text-gray-500' : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </span>
                      & Up
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Footer — always visible */}
          <div className="px-5 py-3 border-t border-gray-100 bg-white rounded-b-none" style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}>
            <button
              onClick={onApply}
              className="w-full py-3 rounded-xl text-sm font-bold text-white bg-gray-900 hover:bg-gray-800 active:scale-[0.98] transition-all shadow-sm"
            >
              Show Results{activeFilterCount > 0 ? ` (${activeFilterCount} filter${activeFilterCount > 1 ? 's' : ''})` : ''}
            </button>
          </div>
        </div>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes mfFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes mfSlideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
    </>
  );
}


/* ═══════════════════════════════════════════════════
   MAIN CATEGORIES PAGE
   ═══════════════════════════════════════════════════ */
function Categories() {
  const { category: categorySlug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();

  const [allCategories, setAllCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Filters
  const [filters, setFilters] = useState({
    minPrice: '',
    maxPrice: '',
    minRating: '',
    categorySlug: categorySlug || '',
  });

  // Mobile filter draft state — local until user taps "Show Results"
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [draftFilters, setDraftFilters] = useState({
    minPrice: '',
    maxPrice: '',
    minRating: '',
  });

  // Sorting
  const [ordering, setOrdering] = useState('-created_at');

  // Sync draft when opening the mobile filter sheet
  const openMobileFilter = () => {
    setDraftFilters({
      minPrice: filters.minPrice,
      maxPrice: filters.maxPrice,
      minRating: filters.minRating,
    });
    setMobileFilterOpen(true);
  };

  const applyMobileFilters = () => {
    setFilters(prev => ({
      ...prev,
      minPrice: draftFilters.minPrice,
      maxPrice: draftFilters.maxPrice,
      minRating: draftFilters.minRating,
    }));
    setCurrentPage(1);
    setMobileFilterOpen(false);
  };

  const clearMobileFilters = () => {
    setDraftFilters({ minPrice: '', maxPrice: '', minRating: '' });
  };

  // Sync URL category param with filter state
  useEffect(() => {
    setFilters((prev) => ({ ...prev, categorySlug: categorySlug || '' }));
    setCurrentPage(1);
  }, [categorySlug]);

  /* ── Fetch data ── */
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      // Always fetch all categories for the sidebar
      const catsData = await catalogService.getCategories();
      setAllCategories(catsData);

      // Build product query
      const query = {
        page: currentPage,
        page_size: PRODUCTS_PER_PAGE,
        ordering: ordering,
      };

      // Apply category filter
      const activeCatSlug = filters.categorySlug || categorySlug;
      if (activeCatSlug) {
        query.category = activeCatSlug;
      }

      // Apply price filters
      if (filters.minPrice !== '' && filters.minPrice !== undefined) {
        query.min_price = filters.minPrice;
      }
      if (filters.maxPrice !== '' && filters.maxPrice !== undefined) {
        query.max_price = filters.maxPrice;
      }

      // Apply rating filter
      if (filters.minRating !== '' && filters.minRating !== undefined) {
        query.min_rating = filters.minRating;
      }

      const result = await catalogService.getProducts(query);
      const prods = result.products || result;
      const pagination = result.pagination;

      setProducts(Array.isArray(prods) ? prods : []);

      if (pagination) {
        setTotalPages(pagination.totalPages || 1);
        setTotalCount(pagination.count || prods.length);
      } else {
        // Client-side pagination fallback
        setTotalPages(Math.ceil((Array.isArray(prods) ? prods.length : 0) / PRODUCTS_PER_PAGE));
        setTotalCount(Array.isArray(prods) ? prods.length : 0);
      }
    } catch (error) {
      console.error('Error loading categories page:', error);
    } finally {
      setLoading(false);
    }
  }, [categorySlug, currentPage, filters, ordering]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* ── Handle filter changes from Desktop Sidebar ── */
  const handleFilterChange = (newFilters) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    setCurrentPage(1); // Reset to page 1 on filter change
  };

  /* ── Handle page change ── */
  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /* ── Handle sort change ── */
  const handleSortChange = (newOrdering) => {
    setOrdering(newOrdering);
    setCurrentPage(1);
  };

  /* ── Derive displayed categories & sections ── */
  const activeCatSlug = filters.categorySlug || categorySlug;
  const displayedCategories = activeCatSlug
    ? allCategories.filter((c) => c.slug === activeCatSlug)
    : allCategories;

  const activeCategory = activeCatSlug
    ? allCategories.find((c) => c.slug === activeCatSlug)
    : null;

  // Client-side paginated products (if backend doesn't paginate)
  const paginatedProducts = products;

  // Group into sections
  let contentSections = [];
  if (activeCategory) {
    const subcategories = activeCategory.subcategories || [];
    if (subcategories.length > 0) {
      contentSections = subcategories
        .map((sub) => ({
          id: sub.id,
          title: sub.name,
          products: paginatedProducts.filter(
            (p) => p.subcategory === sub.id || p.subcategory_name === sub.name
          ),
        }))
        .filter((s) => s.products.length > 0);

      // If no subcategory matched, show all under active category
      if (contentSections.length === 0 && paginatedProducts.length > 0) {
        contentSections = [{ id: 'all', title: activeCategory.name, products: paginatedProducts }];
      }
    } else {
      contentSections = [{ id: 'all', title: activeCategory.name, products: paginatedProducts }];
    }
  } else {
    // View All — show all products in a flat grid
    contentSections = [{ id: 'all', title: 'All Products', products: paginatedProducts }];
  }

  // Derive friendly active filter labels for chips
  const activeFilterChips = [];
  if (filters.minPrice || filters.maxPrice) {
    const match = PRICE_RANGES.find(r => String(r.min) === String(filters.minPrice) && String(r.max) === String(filters.maxPrice));
    const label = match ? match.label : (filters.minPrice && filters.maxPrice ? `₹${filters.minPrice} – ₹${filters.maxPrice}` : filters.minPrice ? `From ₹${filters.minPrice}` : `Up to ₹${filters.maxPrice}`);
    activeFilterChips.push({ key: 'price', label, onRemove: () => handleFilterChange({ minPrice: '', maxPrice: '' }) });
  }
  if (filters.minRating) {
    activeFilterChips.push({ key: 'rating', label: `${filters.minRating}★ & Up`, onRemove: () => handleFilterChange({ minRating: '' }) });
  }

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-[60vh] bg-white gap-4">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-200 border-t-black" />
        <p className="text-sm text-gray-400 font-medium">Loading products…</p>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen">
      <Breadcrumb />
      <CategoryHero categorySlug={activeCatSlug} categoryName={activeCategory?.name} subcategories={activeCategory?.subcategories} apiBannerImage={activeCategory?.banner_image} />

      <div id="products-section" className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* ── Sidebar with Filters — Desktop only ── */}
          <aside className="hidden lg:block lg:w-1/4 lg:sticky lg:top-24 lg:self-start">
            <Sidebar
              categories={displayedCategories}
              allCategories={allCategories}
              showProducts={!!activeCatSlug}
              onFilterChange={handleFilterChange}
              activeFilters={{
                minPrice: filters.minPrice,
                maxPrice: filters.maxPrice,
                minRating: filters.minRating,
                categorySlug: activeCatSlug || '',
              }}
            />
          </aside>

          {/* ── Mobile Filter Toolbar ── */}
          <div className="lg:hidden mb-2">
            {/* Top row: Filter button + Sort */}
            <div className="flex items-center gap-3 mb-2">
              <button
                onClick={openMobileFilter}
                className="inline-flex items-center gap-2 bg-gray-900 text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-sm hover:bg-gray-800 active:scale-[0.97] transition-all"
              >
                <FaSlidersH className="text-xs" /> Filters
                {activeFilterChips.length > 0 && (
                  <span className="ml-0.5 min-w-[18px] h-[18px] flex items-center justify-center bg-white text-gray-900 text-[10px] font-bold rounded-full">
                    {activeFilterChips.length}
                  </span>
                )}
              </button>

              {/* Mobile sort */}
              <select
                value={ordering}
                onChange={(e) => handleSortChange(e.target.value)}
                className="text-sm border border-gray-200 rounded-lg px-3 py-2.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black cursor-pointer"
              >
                <option value="-created_at">Newest</option>
                <option value="base_price">Price: Low → High</option>
                <option value="-base_price">Price: High → Low</option>
                <option value="-avg_rating">Top Rated</option>
              </select>
            </div>

            {/* Active filter chips — horizontal scroll */}
            {activeFilterChips.length > 0 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                {activeFilterChips.map(chip => (
                  <span
                    key={chip.key}
                    className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-800 pl-3 pr-1.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0"
                  >
                    {chip.label}
                    <button
                      onClick={chip.onRemove}
                      className="w-5 h-5 rounded-full bg-gray-300/60 flex items-center justify-center text-gray-600 hover:bg-red-100 hover:text-red-500 transition-colors"
                    >
                      <FaTimes className="text-[8px]" />
                    </button>
                  </span>
                ))}
                <button
                  onClick={() => handleFilterChange({ minPrice: '', maxPrice: '', minRating: '' })}
                  className="text-xs text-red-500 font-semibold whitespace-nowrap flex-shrink-0"
                >
                  Clear all
                </button>
              </div>
            )}
          </div>

          {/* ── Mobile Filter Bottom Sheet ── */}
          <MobileFilterSheet
            isOpen={mobileFilterOpen}
            onClose={() => setMobileFilterOpen(false)}
            draftFilters={draftFilters}
            setDraftFilters={setDraftFilters}
            onApply={applyMobileFilters}
            onClear={clearMobileFilters}
            allCategories={allCategories}
            activeCatSlug={activeCatSlug}
          />

          {/* ── Main Content ── */}
          <main className="lg:w-3/4">
            {/* Results header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <p className="text-xs sm:text-sm text-gray-500">
                Showing{' '}
                <span className="font-semibold text-gray-900">{paginatedProducts.length}</span> of{' '}
                <span className="font-semibold text-gray-900">{totalCount}</span> products
                {activeCategory && (
                  <span>
                    {' '}
                    in <span className="font-semibold text-gray-900">{activeCategory.name}</span>
                  </span>
                )}
              </p>

              {/* Sort dropdown — desktop only */}
              <div className="hidden sm:flex items-center gap-2">
                <FaSortAmountDown className="text-gray-400 text-xs" />
                <select
                  value={ordering}
                  onChange={(e) => handleSortChange(e.target.value)}
                  className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black cursor-pointer"
                >
                  <option value="-created_at">Newest First</option>
                  <option value="base_price">Price: Low → High</option>
                  <option value="-base_price">Price: High → Low</option>
                  <option value="-avg_rating">Top Rated</option>
                  <option value="name">Name: A → Z</option>
                  <option value="-name">Name: Z → A</option>
                </select>
              </div>
            </div>

            {/* Desktop active filter pills */}
            {(filters.minPrice || filters.maxPrice || filters.minRating) && (
              <div className="hidden lg:flex flex-wrap gap-2 mb-6">
                {filters.minPrice && (
                  <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-medium">
                    Min: ₹{filters.minPrice}
                    <button
                      onClick={() => handleFilterChange({ minPrice: '' })}
                      className="ml-1 text-gray-400 hover:text-red-500"
                    >
                      ×
                    </button>
                  </span>
                )}
                {filters.maxPrice && (
                  <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-medium">
                    Max: ₹{filters.maxPrice}
                    <button
                      onClick={() => handleFilterChange({ maxPrice: '' })}
                      className="ml-1 text-gray-400 hover:text-red-500"
                    >
                      ×
                    </button>
                  </span>
                )}
                {filters.minRating && (
                  <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-medium">
                    <FaStar className="text-yellow-400 text-xs" /> {filters.minRating}+ Stars
                    <button
                      onClick={() => handleFilterChange({ minRating: '' })}
                      className="ml-1 text-gray-400 hover:text-red-500"
                    >
                      ×
                    </button>
                  </span>
                )}
                <button
                  onClick={() => handleFilterChange({ minPrice: '', maxPrice: '', minRating: '' })}
                  className="text-xs text-red-500 hover:text-red-700 font-medium underline"
                >
                  Clear all filters
                </button>
              </div>
            )}

            {/* Product Sections */}
            <div className="space-y-12">
              {contentSections.map((section) =>
                section.products.length > 0 ? (
                  <section key={section.id} className="bg-white rounded-2xl shadow-sm p-6">
                    <BusinessEssentials title={section.title} products={section.products} />
                  </section>
                ) : null
              )}

              {/* No products */}
              {paginatedProducts.length === 0 && (
                <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-300">
                  <div className="text-5xl mb-4">🔍</div>
                  <p className="text-gray-500 text-lg font-medium mb-2">No products found</p>
                  <p className="text-sm text-gray-400">
                    Try adjusting your filters or browse a different category.
                  </p>
                  <button
                    onClick={() => handleFilterChange({ minPrice: '', maxPrice: '', minRating: '', categorySlug: '' })}
                    className="mt-4 text-brand hover:underline text-sm font-medium"
                  >
                    Clear all filters
                  </button>
                </div>
              )}
            </div>

            {/* ── Pagination UI ── */}
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />

            {/* Page info */}
            {totalPages > 1 && (
              <p className="text-center text-xs text-gray-400 mt-4">
                Page {currentPage} of {totalPages}
              </p>
            )}
          </main>
        </div>
      </div>

      {/* Hide horizontal scrollbar on filter chips */}
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}

export default Categories;
