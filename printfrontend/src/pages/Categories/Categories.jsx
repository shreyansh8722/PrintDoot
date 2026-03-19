import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { FaChevronLeft, FaChevronRight, FaStar, FaSortAmountDown, FaSlidersH, FaTimes } from 'react-icons/fa';
import Breadcrumb from './Breadcrumb/Breadcrumb';
import CategoryHero from './Part/Part';
import Sidebar from './Sidebar/Sidebar';
import BusinessEssentials from './Business/Business';
import catalogService from '../../services/catalogService';

const PRODUCTS_PER_PAGE = 12;

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

  // Sorting
  const [ordering, setOrdering] = useState('-created_at');
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

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

  /* ── Handle filter changes from Sidebar ── */
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

          {/* ── Mobile Filter Button ── */}
          <div className="lg:hidden flex items-center gap-3 mb-2">
            <button
              onClick={() => setMobileFilterOpen(true)}
              className="inline-flex items-center gap-2 bg-gray-900 text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-sm hover:bg-gray-800 active:scale-[0.97] transition-all"
            >
              <FaSlidersH className="text-xs" /> Filters
              {(filters.minPrice || filters.maxPrice || filters.minRating) && (
                <span className="w-2 h-2 bg-brand rounded-full" />
              )}
            </button>
            {/* Mobile sort */}
            <div className="flex items-center gap-2">
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
          </div>

          {/* ── Mobile Filter Drawer (slide-up) ── */}
          {mobileFilterOpen && (
            <>
              <div
                className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[80] lg:hidden"
                onClick={() => setMobileFilterOpen(false)}
              />
              <div className="fixed inset-x-0 bottom-0 z-[90] lg:hidden bg-white rounded-t-2xl shadow-2xl max-h-[85vh] flex flex-col animate-slideUp">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                  <h3 className="font-bold text-lg text-gray-900">Filters</h3>
                  <button
                    onClick={() => setMobileFilterOpen(false)}
                    className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
                  >
                    <FaTimes className="text-sm" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto px-5 py-4">
                  <Sidebar
                    categories={displayedCategories}
                    allCategories={allCategories}
                    showProducts={!!activeCatSlug}
                    onFilterChange={(f) => { handleFilterChange(f); }}
                    activeFilters={{
                      minPrice: filters.minPrice,
                      maxPrice: filters.maxPrice,
                      minRating: filters.minRating,
                      categorySlug: activeCatSlug || '',
                    }}
                  />
                </div>
                <div className="px-5 py-4 border-t border-gray-100 flex gap-3">
                  <button
                    onClick={() => { handleFilterChange({ minPrice: '', maxPrice: '', minRating: '' }); setMobileFilterOpen(false); }}
                    className="flex-1 py-3 rounded-xl text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
                  >
                    Clear All
                  </button>
                  <button
                    onClick={() => setMobileFilterOpen(false)}
                    className="flex-1 py-3 rounded-xl text-sm font-semibold text-white bg-gray-900 hover:bg-gray-800 transition-colors"
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
            </>
          )}

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

              {/* Sort dropdown */}
              <div className="flex items-center gap-2">
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

            {/* Active filter pills */}
            {(filters.minPrice || filters.maxPrice || filters.minRating) && (
              <div className="flex flex-wrap gap-2 mb-6">
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
    </div>
  );
}

export default Categories;
