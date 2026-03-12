import { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { IoSearchOutline, IoClose, IoChevronDown, IoChevronForward, IoChevronBack } from 'react-icons/io5';
import { HiAdjustmentsHorizontal } from 'react-icons/hi2';
import { SkeletonImage } from '../../components/Skeleton';
import catalogService from '../../services/catalogService';

/* ─── Skeleton: grid of product card placeholders ─── */
function ResultsSkeleton({ count = 8 }) {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
                    <div className="aspect-square skeleton-shimmer bg-gray-200" />
                    <div className="p-4 space-y-3">
                        <div className="skeleton-shimmer bg-gray-200 rounded h-4 w-3/4" />
                        <div className="skeleton-shimmer bg-gray-200 rounded h-3 w-1/2" />
                        <div className="skeleton-shimmer bg-gray-200 rounded h-5 w-1/3" />
                    </div>
                </div>
            ))}
        </div>
    );
}

/* ─── Product Card ─── */
function ProductCard({ product, eager = false }) {
    const image = product.image || product.primary_image || product.images?.[0]?.image || 'https://placehold.co/400x400?text=No+Image';
    const name = product.title || product.name;
    const slug = product.slug || product.id;
    const price = Number(product.finalPrice || product.base_price || product.price || 0);
    const originalPrice = product.originalPrice
        ? parseFloat(String(product.originalPrice).replace('₹', ''))
        : product.compare_at_price ? parseFloat(product.compare_at_price) : null;
    const hasDiscount = originalPrice && originalPrice > price;
    const discountPct = hasDiscount ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;
    const rating = product.rating?.value || product.average_rating || 0;
    const reviewCount = product.rating?.count || product.review_count || 0;

    return (
        <Link
            to={`/product/${slug}`}
            className="group bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col"
        >
            {/* Image */}
            <div className="relative aspect-square overflow-hidden bg-gray-50">
                <SkeletonImage
                    src={image}
                    alt={name}
                    loading={eager ? 'eager' : 'lazy'}
                    fetchPriority={eager ? 'high' : undefined}
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    containerClassName="w-full h-full"
                />
                {hasDiscount && (
                    <span className="absolute top-3 left-3 bg-red-500 text-white text-[11px] font-bold px-2.5 py-1 rounded-full">
                        -{discountPct}%
                    </span>
                )}
                {product.in_stock === false && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <span className="bg-white/90 text-gray-800 text-xs font-semibold px-3 py-1.5 rounded-full">Out of Stock</span>
                    </div>
                )}
            </div>

            {/* Info */}
            <div className="p-4 flex flex-col flex-1">
                {product.subcategory_name && (
                    <p className="text-[11px] font-medium text-cyan-600 uppercase tracking-wide mb-1">{product.subcategory_name}</p>
                )}
                <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 group-hover:text-cyan-700 transition-colors mb-2">
                    {name}
                </h3>

                {/* Rating */}
                {rating > 0 && (
                    <div className="flex items-center gap-1.5 mb-2">
                        <div className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map((s) => (
                                <svg key={s} className={`w-3.5 h-3.5 ${s <= Math.round(rating) ? 'text-amber-400' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                            ))}
                        </div>
                        <span className="text-[11px] text-gray-400">({reviewCount})</span>
                    </div>
                )}

                {/* Price */}
                <div className="mt-auto flex items-baseline gap-2">
                    <span className="text-base font-bold text-gray-900">₹{price.toFixed(0)}</span>
                    {hasDiscount && (
                        <span className="text-sm text-gray-400 line-through">₹{originalPrice.toFixed(0)}</span>
                    )}
                </div>
            </div>
        </Link>
    );
}

/* ─── Main Search Page ─── */
const SearchResults = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const query = searchParams.get('q') || '';

    const [searchInput, setSearchInput] = useState(query);
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [pagination, setPagination] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);

    // Filters
    const [filtersOpen, setFiltersOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [priceMin, setPriceMin] = useState('');
    const [priceMax, setPriceMax] = useState('');
    const [sortBy, setSortBy] = useState('relevance');
    const [inStockOnly, setInStockOnly] = useState(false);

    const inputRef = useRef(null);
    const prevQueryRef = useRef(query);

    /* ─ Load categories once ─ */
    useEffect(() => {
        catalogService.getCategories()
            .then(data => setCategories(data))
            .catch(() => { });
    }, []);

    /* ─ Sync searchInput when URL query changes ─ */
    useEffect(() => {
        setSearchInput(query);
        // Only reset page when query actually changed
        if (prevQueryRef.current !== query) {
            prevQueryRef.current = query;
            setCurrentPage(1);
        }
    }, [query]);

    /* ─ Fetch products whenever query / page / filters change ─ */
    useEffect(() => {
        fetchProducts();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [query, currentPage, selectedCategory, priceMin, priceMax, sortBy]);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            setError('');

            const params = { page: currentPage, page_size: 20 };
            if (query) params.search = query;
            if (selectedCategory) params.category = selectedCategory;
            if (priceMin !== '') params.min_price = priceMin;
            if (priceMax !== '') params.max_price = priceMax;

            // Map frontend sort values to backend ordering params
            const orderingMap = {
                price_asc: 'base_price',
                price_desc: '-base_price',
                name_asc: 'name',
                newest: '-created_at',
                relevance: '-created_at',
            };
            if (sortBy && orderingMap[sortBy]) {
                params.ordering = orderingMap[sortBy];
            }

            const result = await catalogService.getProducts(params);
            setProducts(result.products || []);
            setPagination(result.pagination || null);
        } catch (err) {
            console.error('Search error:', err);
            setError('Something went wrong. Please try again.');
            setProducts([]);
        } finally {
            setLoading(false);
        }
    };

    /* ─ Form submit ─ */
    const handleSearch = (e) => {
        e.preventDefault();
        const q = searchInput.trim();
        // Only update URL if query actually changed
        if (q && q !== query) {
            setSearchParams({ q });
        } else if (!q && query) {
            setSearchParams({});
        }
        inputRef.current?.blur();
    };

    const clearSearch = () => {
        setSearchInput('');
        setSearchParams({});
        inputRef.current?.focus();
    };

    /* ─ Clear all filters ─ */
    const clearFilters = () => {
        setSelectedCategory('');
        setPriceMin('');
        setPriceMax('');
        setSortBy('relevance');
        setInStockOnly(false);
    };

    /* ─ Apply in-stock filter client-side (not available as backend param) ─ */
    const displayProducts = useMemo(() => {
        if (!inStockOnly) return products;
        return products.filter(p => p.in_stock !== false);
    }, [products, inStockOnly]);

    const activeFilterCount = [selectedCategory, priceMin, priceMax, inStockOnly].filter(Boolean).length;
    const totalPages = pagination?.totalPages || 1;

    return (
        <div className="min-h-screen bg-white">
            {/* ─── Search Header — scrolls normally with page ─── */}
            <div className="bg-white border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
                    <form onSubmit={handleSearch} className="relative">
                        <div className="flex items-center bg-gray-50 border-2 border-gray-200 rounded-2xl focus-within:border-cyan-500 focus-within:bg-white focus-within:shadow-lg transition-all duration-300">
                            <IoSearchOutline className="ml-5 text-xl text-gray-400 flex-shrink-0" />
                            <input
                                ref={inputRef}
                                type="text"
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                placeholder="Search for business cards, stickers, banners..."
                                className="flex-1 bg-transparent py-3.5 px-4 text-[15px] text-gray-900 placeholder:text-gray-400 focus:outline-none"
                            />
                            {searchInput && (
                                <button type="button" onClick={clearSearch} className="p-2 mr-1 text-gray-400 hover:text-gray-600 transition-colors">
                                    <IoClose className="text-xl" />
                                </button>
                            )}
                            <button
                                type="submit"
                                className="bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-semibold px-6 py-2.5 rounded-xl mr-1.5 transition-colors flex-shrink-0"
                            >
                                Search
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
                {/* ─── Toolbar: results count + filter/sort ─── */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                            {query ? <>Results for "<span className="text-cyan-600">{query}</span>"</> : 'All Products'}
                        </h1>
                        {!loading && (
                            <p className="text-sm text-gray-500 mt-1">
                                {displayProducts.length} {displayProducts.length === 1 ? 'product' : 'products'} found
                                {pagination?.count ? ` (of ${pagination.count} total)` : ''}
                            </p>
                        )}
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Filter toggle */}
                        <button
                            onClick={() => setFiltersOpen(!filtersOpen)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border-2 transition-all ${filtersOpen
                                    ? 'bg-cyan-50 border-cyan-500 text-cyan-700'
                                    : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            <HiAdjustmentsHorizontal className="text-lg" />
                            Filters
                            {activeFilterCount > 0 && (
                                <span className="bg-cyan-600 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                                    {activeFilterCount}
                                </span>
                            )}
                        </button>

                        {/* Sort dropdown */}
                        <div className="relative">
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="appearance-none bg-white border-2 border-gray-200 rounded-xl px-4 py-2.5 pr-10 text-sm font-medium text-gray-700 focus:outline-none focus:border-cyan-500 transition-all cursor-pointer"
                            >
                                <option value="relevance">Relevance</option>
                                <option value="price_asc">Price: Low → High</option>
                                <option value="price_desc">Price: High → Low</option>
                                <option value="name_asc">Name: A → Z</option>
                                <option value="newest">Newest</option>
                            </select>
                            <IoChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        </div>
                    </div>
                </div>

                {/* ─── Filters Panel (collapsible) ─── */}
                {filtersOpen && (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6 animate-slideDown">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-gray-900">Filter Products</h3>
                            {activeFilterCount > 0 && (
                                <button onClick={clearFilters} className="text-sm text-cyan-600 hover:text-cyan-800 font-medium transition-colors">
                                    Clear All
                                </button>
                            )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                            {/* Category */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Category</label>
                                <select
                                    value={selectedCategory}
                                    onChange={(e) => setSelectedCategory(e.target.value)}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-cyan-500 transition-all"
                                >
                                    <option value="">All Categories</option>
                                    {categories.map(cat => (
                                        <option key={cat.id} value={cat.slug || cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Price Range */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Price Range</label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        placeholder="Min"
                                        value={priceMin}
                                        onChange={(e) => setPriceMin(e.target.value)}
                                        min="0"
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-cyan-500 transition-all"
                                    />
                                    <span className="text-gray-400 font-medium">–</span>
                                    <input
                                        type="number"
                                        placeholder="Max"
                                        value={priceMax}
                                        onChange={(e) => setPriceMax(e.target.value)}
                                        min="0"
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-cyan-500 transition-all"
                                    />
                                </div>
                            </div>

                            {/* Stock */}
                            <div className="flex items-end">
                                <label className="flex items-center gap-3 cursor-pointer select-none">
                                    <div className="relative">
                                        <input
                                            type="checkbox"
                                            checked={inStockOnly}
                                            onChange={(e) => setInStockOnly(e.target.checked)}
                                            className="sr-only peer"
                                        />
                                        <div className="w-10 h-6 bg-gray-200 rounded-full peer-checked:bg-cyan-600 transition-colors" />
                                        <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm peer-checked:translate-x-4 transition-transform" />
                                    </div>
                                    <span className="text-sm font-medium text-gray-700">In Stock Only</span>
                                </label>
                            </div>
                        </div>
                    </div>
                )}

                {/* ─── Error ─── */}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl px-5 py-4 mb-6 text-sm flex items-center gap-3">
                        <span className="text-lg">⚠️</span>
                        {error}
                        <button onClick={fetchProducts} className="ml-auto text-red-600 hover:text-red-800 font-semibold underline text-sm">
                            Retry
                        </button>
                    </div>
                )}

                {/* ─── Loading Skeleton ─── */}
                {loading && <ResultsSkeleton count={8} />}

                {/* ─── Products Grid ─── */}
                {!loading && displayProducts.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                        {displayProducts.map((product, idx) => (
                            <ProductCard key={product.id} product={product} eager={idx < 8} />
                        ))}
                    </div>
                )}

                {/* ─── Empty State ─── */}
                {!loading && displayProducts.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                            <IoSearchOutline className="text-4xl text-gray-300" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">No products found</h3>
                        <p className="text-gray-500 max-w-md mb-6">
                            {query
                                ? `We couldn't find anything matching "${query}". Try a different search term or adjust your filters.`
                                : 'No products match your current filters. Try adjusting or clearing them.'}
                        </p>
                        <div className="flex items-center gap-3">
                            {activeFilterCount > 0 && (
                                <button
                                    onClick={clearFilters}
                                    className="px-5 py-2.5 bg-white border-2 border-gray-200 text-gray-700 rounded-xl text-sm font-semibold hover:border-gray-300 transition-all"
                                >
                                    Clear Filters
                                </button>
                            )}
                            {query && (
                                <button
                                    onClick={clearSearch}
                                    className="px-5 py-2.5 bg-cyan-600 text-white rounded-xl text-sm font-semibold hover:bg-cyan-700 transition-colors"
                                >
                                    Clear Search
                                </button>
                            )}
                        </div>

                        {/* Suggestions */}
                        <div className="mt-10">
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Popular searches</p>
                            <div className="flex flex-wrap gap-2 justify-center">
                                {['Business Cards', 'Stickers', 'Banners', 'Envelopes', 'Letterheads', 'Flyers'].map((term) => (
                                    <Link
                                        key={term}
                                        to={`/search?q=${encodeURIComponent(term)}`}
                                        className="px-4 py-2 bg-white border border-gray-200 rounded-full text-sm text-gray-600 hover:border-cyan-500 hover:text-cyan-600 transition-all"
                                    >
                                        {term}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* ─── Pagination ─── */}
                {!loading && totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-10 mb-4">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:border-cyan-500 hover:text-cyan-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                        >
                            <IoChevronBack />
                        </button>

                        {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                            let page;
                            if (totalPages <= 7) {
                                page = i + 1;
                            } else if (currentPage <= 4) {
                                page = i + 1;
                            } else if (currentPage >= totalPages - 3) {
                                page = totalPages - 6 + i;
                            } else {
                                page = currentPage - 3 + i;
                            }
                            return (
                                <button
                                    key={page}
                                    onClick={() => setCurrentPage(page)}
                                    className={`w-10 h-10 rounded-xl text-sm font-semibold transition-all ${currentPage === page
                                            ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/30'
                                            : 'bg-white border border-gray-200 text-gray-600 hover:border-cyan-500 hover:text-cyan-600'
                                        }`}
                                >
                                    {page}
                                </button>
                            );
                        })}

                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:border-cyan-500 hover:text-cyan-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                        >
                            <IoChevronForward />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SearchResults;
