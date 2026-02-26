import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { IoSearchOutline, IoTimeOutline, IoTrendingUpOutline, IoClose } from "react-icons/io5";
import catalogService from "../../../services/catalogService";

const POPULAR = ["Business Cards", "Stickers", "Envelopes", "Stamp", "ID Card", "Bill Book", "Banners", "Letterheads"];
const MAX_RECENT = 5;
const STORAGE_KEY = "printdoot_recent_searches";

function getRecentSearches() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch {
        return [];
    }
}

export function addRecentSearch(term) {
    if (!term?.trim()) return;
    const recent = getRecentSearches().filter(s => s.toLowerCase() !== term.toLowerCase());
    recent.unshift(term.trim());
    localStorage.setItem(STORAGE_KEY, JSON.stringify(recent.slice(0, MAX_RECENT)));
}

export default function SearchDropdown({ query, onSelect }) {
    const navigate = useNavigate();
    const [suggestions, setSuggestions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [recentSearches, setRecentSearches] = useState(getRecentSearches());
    const [activeIdx, setActiveIdx] = useState(-1);
    const debounceRef = useRef(null);

    const trimmed = query?.trim() || "";

    /* ─ Debounced live search ─ */
    useEffect(() => {
        if (trimmed.length < 2) {
            setSuggestions([]);
            setActiveIdx(-1);
            return;
        }

        setLoading(true);
        if (debounceRef.current) clearTimeout(debounceRef.current);

        debounceRef.current = setTimeout(async () => {
            try {
                const result = await catalogService.getProducts({ search: trimmed, page_size: 6 });
                setSuggestions(result.products || []);
            } catch {
                setSuggestions([]);
            } finally {
                setLoading(false);
            }
        }, 300);

        return () => clearTimeout(debounceRef.current);
    }, [trimmed]);

    const goTo = useCallback((term) => {
        addRecentSearch(term);
        onSelect?.();
        navigate(`/search?q=${encodeURIComponent(term)}`);
    }, [navigate, onSelect]);

    const goToProduct = useCallback((slug) => {
        onSelect?.();
        navigate(`/product/${slug}`);
    }, [navigate, onSelect]);

    const clearRecent = () => {
        localStorage.removeItem(STORAGE_KEY);
        setRecentSearches([]);
    };

    const removeRecent = (term) => {
        const updated = recentSearches.filter(s => s !== term);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        setRecentSearches(updated);
    };

    /* ─ Keyboard navigation ─ */
    const handleKeyDown = (e) => {
        if (!suggestions.length) return;
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setActiveIdx(i => (i + 1) % suggestions.length);
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActiveIdx(i => (i - 1 + suggestions.length) % suggestions.length);
        } else if (e.key === "Enter" && activeIdx >= 0) {
            e.preventDefault();
            const s = suggestions[activeIdx];
            goToProduct(s.slug || s.id);
        }
    };

    /* ─ If typing: show live suggestions ─ */
    if (trimmed.length >= 2) {
        return (
            <div
                className="absolute top-full mt-2 w-full bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50 animate-slideDown"
                onKeyDown={handleKeyDown}
            >
                {loading && (
                    <div className="px-5 py-4 space-y-3">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg skeleton-shimmer bg-gray-200 flex-shrink-0" />
                                <div className="flex-1 space-y-1.5">
                                    <div className="skeleton-shimmer bg-gray-200 rounded h-3.5 w-3/4" />
                                    <div className="skeleton-shimmer bg-gray-200 rounded h-3 w-1/3" />
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {!loading && suggestions.length > 0 && (
                    <>
                        <div className="px-4 pt-3 pb-1.5">
                            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Products</p>
                        </div>
                        <ul>
                            {suggestions.map((p, i) => {
                                const name = p.title || p.name;
                                const image = p.image || p.primary_image || p.images?.[0]?.image;
                                const price = Number(p.finalPrice || p.base_price || 0);
                                return (
                                    <li key={p.id}>
                                        <button
                                            onClick={() => goToProduct(p.slug || p.id)}
                                            className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                                                i === activeIdx ? 'bg-cyan-50' : 'hover:bg-gray-50'
                                            }`}
                                        >
                                            {image ? (
                                                <img src={image} alt="" className="w-10 h-10 rounded-lg object-cover bg-gray-100 flex-shrink-0" />
                                            ) : (
                                                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                                                    <span className="text-gray-300 text-sm">📷</span>
                                                </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-900 truncate">{name}</p>
                                                {p.subcategory_name && (
                                                    <p className="text-[11px] text-gray-400">{p.subcategory_name}</p>
                                                )}
                                            </div>
                                            {price > 0 && (
                                                <span className="text-sm font-semibold text-gray-900 flex-shrink-0">₹{price.toFixed(0)}</span>
                                            )}
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                        <div className="border-t border-gray-100">
                            <button
                                onClick={() => goTo(trimmed)}
                                className="w-full px-4 py-3 text-sm font-medium text-cyan-600 hover:bg-cyan-50 transition-colors flex items-center justify-center gap-2"
                            >
                                <IoSearchOutline />
                                See all results for "{trimmed}"
                            </button>
                        </div>
                    </>
                )}

                {!loading && suggestions.length === 0 && (
                    <div className="px-5 py-6 text-center">
                        <p className="text-sm text-gray-500">No products found for "<span className="font-medium text-gray-700">{trimmed}</span>"</p>
                        <button
                            onClick={() => goTo(trimmed)}
                            className="mt-2 text-sm text-cyan-600 hover:text-cyan-800 font-medium"
                        >
                            Search anyway →
                        </button>
                    </div>
                )}
            </div>
        );
    }

    /* ─ Default: recent + popular ─ */
    return (
        <div className="absolute top-full mt-2 w-full bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50 animate-slideDown">
            {/* Recent Searches */}
            {recentSearches.length > 0 && (
                <div className="px-4 pt-4 pb-2">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Recent</p>
                        <button onClick={clearRecent} className="text-[11px] text-gray-400 hover:text-red-500 transition-colors">
                            Clear all
                        </button>
                    </div>
                    <ul className="space-y-0.5">
                        {recentSearches.map((term) => (
                            <li key={term} className="flex items-center group">
                                <button
                                    onClick={() => goTo(term)}
                                    className="flex-1 flex items-center gap-3 py-2 px-2 rounded-lg text-left hover:bg-gray-50 transition-colors"
                                >
                                    <IoTimeOutline className="text-gray-300 flex-shrink-0" />
                                    <span className="text-sm text-gray-700">{term}</span>
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); removeRecent(term); }}
                                    className="p-1.5 rounded-md text-gray-300 hover:text-red-400 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
                                >
                                    <IoClose className="text-sm" />
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Popular Searches */}
            <div className={`px-4 pb-4 ${recentSearches.length > 0 ? 'pt-2 border-t border-gray-100' : 'pt-4'}`}>
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    <IoTrendingUpOutline className="inline mr-1 text-xs" />
                    Popular
                </p>
                <div className="flex flex-wrap gap-2">
                    {POPULAR.map((term) => (
                        <button
                            key={term}
                            onClick={() => goTo(term)}
                            className="px-3.5 py-1.5 bg-gray-50 border border-gray-100 rounded-full text-sm text-gray-600 hover:bg-cyan-50 hover:border-cyan-200 hover:text-cyan-700 transition-all"
                        >
                            {term}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
