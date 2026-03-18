import { useEffect, useState, useMemo, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  FaStar, FaRegStar, FaStarHalfAlt, FaThumbsUp, FaCheckCircle,
  FaShippingFast, FaShieldAlt, FaUndo, FaPhoneAlt, FaChevronLeft, FaChevronRight,
} from "react-icons/fa";
import { IoChevronDown } from "react-icons/io5";
import { HiMinus, HiPlus } from "react-icons/hi2";
import { SkeletonImage } from "../../components/Skeleton";
import catalogService from "../../services/catalogService";
import userService from "../../services/userService";
import { useShop } from "../../context/ShopContext";
import { staticProducts } from "../../data/homeData";

/* ══════════════════════════════════════════════════
   HELPER COMPONENTS
   ══════════════════════════════════════════════════ */

function StarRating({ value = 0, size = "text-sm" }) {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    if (value >= i) stars.push(<FaStar key={i} className={`${size} text-amber-400`} />);
    else if (value >= i - 0.5) stars.push(<FaStarHalfAlt key={i} className={`${size} text-amber-400`} />);
    else stars.push(<FaRegStar key={i} className={`${size} text-gray-300`} />);
  }
  return <div className="flex items-center gap-0.5">{stars}</div>;
}

function RatingBar({ star, count, total }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="w-7 text-right font-semibold text-gray-600">{star}★</span>
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
      </div>
      <span className="w-12 text-gray-400 text-xs font-medium">{count} ({pct}%)</span>
    </div>
  );
}

function StarRatingInput({ value, onChange }) {
  const [hovered, setHovered] = useState(0);
  const labels = ["", "Poor", "Fair", "Good", "Very Good", "Excellent"];
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button key={star} type="button"
          onMouseEnter={() => setHovered(star)} onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(star)} className="text-2xl focus:outline-none transition-transform hover:scale-110">
          {(hovered || value) >= star
            ? <FaStar className="text-amber-400 drop-shadow-sm" />
            : <FaRegStar className="text-gray-300 hover:text-amber-300" />}
        </button>
      ))}
      {value > 0 && (
        <span className="ml-3 text-sm text-amber-600 font-semibold bg-amber-50 px-2.5 py-0.5 rounded-full">{labels[value]}</span>
      )}
    </div>
  );
}

/* ── Review Form ── */
function ReviewForm({ productId, onReviewSubmitted }) {
  const isLoggedIn = userService.isAuthenticated();
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (rating === 0) { setError("Please select a star rating."); return; }
    try {
      setSubmitting(true);
      await catalogService.submitReview(productId, { rating, title, comment });
      setSuccess(true); setRating(0); setTitle(""); setComment("");
      if (onReviewSubmitted) onReviewSubmitted();
    } catch (err) {
      const d = err.response?.data;
      setError(d?.non_field_errors?.[0] || d?.detail || "Failed to submit review.");
    } finally { setSubmitting(false); }
  };

  if (!isLoggedIn) {
    return (
      <div className="bg-gradient-to-br from-gray-50 to-brand-50/30 rounded-2xl p-8 border border-gray-100 text-center">
        <div className="w-14 h-14 bg-brand-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">✍️</span>
        </div>
        <p className="text-gray-600 text-lg font-medium mb-2">Share your experience</p>
        <p className="text-gray-400 text-sm mb-4">Help other customers make informed decisions.</p>
        <Link to="/login" className="inline-flex items-center gap-2 bg-brand text-white font-semibold px-6 py-2.5 rounded-xl hover:bg-brand-500 transition-colors text-sm">
          Sign in to Review
        </Link>
      </div>
    );
  }
  if (success) {
    return (
      <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl p-8 border border-emerald-200 text-center">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <FaCheckCircle className="text-emerald-500 text-2xl" />
        </div>
        <p className="text-emerald-700 font-bold text-lg">Thank you for your review!</p>
        <p className="text-emerald-600/70 text-sm mt-1">Your feedback helps other customers.</p>
        <button onClick={() => setSuccess(false)} className="mt-4 text-sm text-brand hover:underline font-medium">Write another review</button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-200 shadow-sm">
      <h3 className="text-xl font-bold text-gray-900 mb-1">Write a Review</h3>
      <p className="text-sm text-gray-400 mb-6">Share your thoughts about this product</p>
      {error && <div className="bg-red-50 text-red-600 text-sm rounded-xl px-4 py-3 mb-5 border border-red-100 flex items-center gap-2"><span>⚠️</span>{error}</div>}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-gray-700 mb-2">Your Rating <span className="text-red-400">*</span></label>
        <StarRatingInput value={rating} onChange={setRating} />
      </div>
      <div className="mb-5">
        <label className="block text-sm font-semibold text-gray-700 mb-2">Review Title</label>
        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
          placeholder="Summarize your experience in a few words" maxLength={200}
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all bg-gray-50/50 hover:bg-white" />
      </div>
      <div className="mb-6">
        <label className="block text-sm font-semibold text-gray-700 mb-2">Your Review</label>
        <textarea value={comment} onChange={(e) => setComment(e.target.value)}
          placeholder="What did you like or dislike? How was the quality?" rows={4}
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all resize-none bg-gray-50/50 hover:bg-white" />
      </div>
      <button type="submit" disabled={submitting || rating === 0}
        className="bg-brand text-white font-semibold py-3 px-8 rounded-xl hover:bg-brand-500 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed transition-all text-sm shadow-sm">
        {submitting ? "Submitting..." : "Submit Review"}
      </button>
    </form>
  );
}

/* ── Product Page Skeleton ── */
function ProductSkeleton() {
  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-6">
        <div className="flex gap-2 mb-8">
          {[60, 80, 120].map((w, i) => (
            <div key={i} className="skeleton-shimmer bg-gray-200 rounded h-4" style={{ width: w }} />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
          <div>
            <div className="aspect-square skeleton-shimmer bg-gray-100 rounded-2xl" />
            <div className="flex gap-3 mt-4">
              {[1, 2, 3, 4].map(i => <div key={i} className="w-20 h-20 skeleton-shimmer bg-gray-100 rounded-xl" />)}
            </div>
          </div>
          <div className="space-y-4 py-2">
            <div className="skeleton-shimmer bg-gray-100 rounded-full h-5 w-32" />
            <div className="skeleton-shimmer bg-gray-100 rounded h-10 w-3/4" />
            <div className="skeleton-shimmer bg-gray-100 rounded h-4 w-40" />
            <div className="skeleton-shimmer bg-gray-100 rounded h-8 w-36 mt-4" />
            <div className="skeleton-shimmer bg-gray-100 rounded h-4 w-full mt-6" />
            <div className="skeleton-shimmer bg-gray-100 rounded h-4 w-5/6" />
            <div className="flex gap-4 mt-8">
              <div className="skeleton-shimmer bg-gray-100 rounded-2xl h-14 flex-1" />
              <div className="skeleton-shimmer bg-gray-100 rounded-2xl h-14 flex-1" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Quantity Selector ── */
function QuantitySelector({ value, onChange, max = 99 }) {
  return (
    <div className="inline-flex items-center bg-gray-50 border border-gray-200 rounded-xl overflow-hidden">
      <button onClick={() => onChange(Math.max(1, value - 1))}
        className="w-10 h-10 flex items-center justify-center text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
        disabled={value <= 1}>
        <HiMinus className="text-sm" />
      </button>
      <span className="w-10 text-center text-sm font-bold text-gray-900 select-none">{value}</span>
      <button onClick={() => onChange(Math.min(max, value + 1))}
        className="w-10 h-10 flex items-center justify-center text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
        disabled={value >= max}>
        <HiPlus className="text-sm" />
      </button>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   MAIN PRODUCT PAGE
   ══════════════════════════════════════════════════ */
export default function Product() {
  const { slug, productSlug } = useParams();
  const activeSlug = productSlug || slug;
  const { addToCart } = useShop();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState("");
  const [imageList, setImageList] = useState([]);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [reviewSort, setReviewSort] = useState("newest");
  const [quantity, setQuantity] = useState(1);
  const [imgZoom, setImgZoom] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });

  const relatedScrollRef = useRef(null);

  /* ── Fetch product ── */
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        if (!activeSlug) return;

        try {
          const data = await catalogService.getProductBySlug(activeSlug);
          if (data) {
            setProduct(data);
            const imgs = data.images?.length > 0 ? data.images : [data.image || "https://placehold.co/600x400?text=No+Image"];
            setImageList(imgs);
            setActiveImage(imgs[0]);
            setQuantity(1);

            // ── Track view & save to recently-viewed ──
            if (data.id) {
              catalogService.trackProductView(data.id); // fire-and-forget
              try {
                const KEY = 'recentlyViewedIds';
                const stored = JSON.parse(localStorage.getItem(KEY) || '[]');
                const filtered = stored.filter(id => id !== data.id);
                filtered.unshift(data.id);
                localStorage.setItem(KEY, JSON.stringify(filtered.slice(0, 20)));
              } catch { /* localStorage unavailable */ }
            }

            try {
              const relResult = data.subcategory
                ? await catalogService.getProducts({ subcategory: data.subcategory })
                : await catalogService.getProducts();
              const related = (relResult.products || relResult).filter(p => p.id !== data.id).slice(0, 8);
              setRelatedProducts(related);
            } catch { setRelatedProducts([]); }
            setLoading(false);
            return;
          }
        } catch { /* API failed, try static fallback */ }

        const staticProduct = staticProducts[activeSlug];
        if (staticProduct) {
          setProduct(staticProduct);
          const imgs = staticProduct.images?.length > 0
            ? staticProduct.images
            : [staticProduct.image || "https://placehold.co/600x400?text=No+Image"];
          setImageList(imgs);
          setActiveImage(imgs[0]);
          setQuantity(1);
          setLoading(false);
          return;
        }
      } catch (err) { console.error("Failed to load product", err); }
      finally { setLoading(false); }
    };
    load();
  }, [activeSlug]);

  /* ── Derived data ── */
  const ratingBreakdown = useMemo(() => {
    const c = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    (product?.reviews || []).forEach(r => { if (c[r.rating] !== undefined) c[r.rating]++; });
    return c;
  }, [product?.reviews]);

  const sortedReviews = useMemo(() => {
    const r = [...(product?.reviews || [])];
    if (reviewSort === "newest") r.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    else if (reviewSort === "highest") r.sort((a, b) => b.rating - a.rating);
    else if (reviewSort === "lowest") r.sort((a, b) => a.rating - b.rating);
    return r;
  }, [product?.reviews, reviewSort]);

  /* ── Loading / Not Found ── */
  if (loading) return <ProductSkeleton />;
  if (!product) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center text-3xl">🔍</div>
        <p className="text-xl font-semibold text-gray-700">Product not found</p>
        <Link to="/view-all" className="text-brand hover:underline font-medium">← Browse all products</Link>
      </div>
    );
  }

  const reviewCount = product.rating?.count || 0;
  const avgRating = product.rating?.value || 0;

  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  const showToast = (message) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(message);
    toastTimer.current = setTimeout(() => setToast(null), 2500);
  };

  const handleAddToCart = () => {
    addToCart(product, quantity);
    showToast(`Added ${quantity} item${quantity > 1 ? 's' : ''} to cart 🛒`);
  };

  const handleReviewSubmitted = async () => {
    try {
      const data = await catalogService.getProductBySlug(activeSlug);
      if (data) setProduct(data);
    } catch { }
  };

  const handleMarkHelpful = async (reviewId) => {
    try {
      await catalogService.markReviewHelpful(reviewId);
      const data = await catalogService.getProductBySlug(activeSlug);
      if (data) setProduct(data);
    } catch { }
  };

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setZoomPos({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    });
  };

  const scrollRelated = (dir) => {
    relatedScrollRef.current?.scrollBy({ left: dir * 300, behavior: "smooth" });
  };

  const currentImageIndex = imageList.indexOf(activeImage);
  const navigateImage = (dir) => {
    const newIndex = currentImageIndex + dir;
    if (newIndex >= 0 && newIndex < imageList.length) setActiveImage(imageList[newIndex]);
  };

  return (
    <div className="bg-white min-h-screen">

      {/* ═══════════ BREADCRUMB ═══════════ */}
      <div className="border-b border-gray-100">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-3 flex items-center gap-1.5 text-[12px] sm:text-[13px] text-gray-400 flex-wrap overflow-hidden">
          <Link to="/" className="hover:text-brand transition-colors">Home</Link>
          <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
          <Link to="/view-all" className="hover:text-brand transition-colors">Products</Link>
          {product.subcategory_name && (
            <>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
              <Link to="/view-all" className="hover:text-brand transition-colors">{product.subcategory_name}</Link>
            </>
          )}
          <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
          <span className="text-gray-700 font-medium truncate max-w-[250px]">{product.title}</span>
        </nav>
      </div>

      {/* ═══════════ SECTION 1: HERO — IMAGE + INFO ═══════════ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-6 lg:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-14">

          {/* ── LEFT: IMAGE GALLERY ── */}
          <div className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            <div
              className="relative aspect-square bg-white rounded-2xl overflow-hidden border border-gray-100 cursor-crosshair group shadow-sm"
              onMouseEnter={() => setImgZoom(true)}
              onMouseLeave={() => setImgZoom(false)}
              onMouseMove={handleMouseMove}
            >
              <SkeletonImage
                src={activeImage}
                alt={product.title}
                loading="eager"
                fetchPriority="high"
                className="w-full h-full object-contain mix-blend-multiply p-6 sm:p-8 transition-transform duration-200"
                containerClassName="w-full h-full"
                style={imgZoom ? { transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`, transform: "scale(2)" } : {}}
              />
              {product.discount && (
                <span className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg z-10">
                  {product.discount}
                </span>
              )}

              {imageList.length > 1 && (
                <>
                  <button
                    onClick={(e) => { e.stopPropagation(); navigateImage(-1); }}
                    disabled={currentImageIndex === 0}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md z-20 opacity-0 group-hover:opacity-100 transition-all disabled:opacity-0 hover:bg-white hover:scale-110"
                  >
                    <FaChevronLeft className="text-gray-600 text-xs" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); navigateImage(1); }}
                    disabled={currentImageIndex === imageList.length - 1}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md z-20 opacity-0 group-hover:opacity-100 transition-all disabled:opacity-0 hover:bg-white hover:scale-110"
                  >
                    <FaChevronRight className="text-gray-600 text-xs" />
                  </button>
                </>
              )}

              {imageList.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-sm text-white text-[11px] font-medium px-3 py-1 rounded-full z-10">
                  {currentImageIndex + 1} / {imageList.length}
                </div>
              )}
            </div>

            {imageList.length > 1 && (
              <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-hide">
                {imageList.map((img, idx) => (
                  <button key={idx} onClick={() => setActiveImage(img)}
                    className={`flex-shrink-0 w-[72px] h-[72px] rounded-xl border-2 overflow-hidden transition-all duration-200 ${activeImage === img ? "border-brand ring-2 ring-brand/20 scale-[1.02]" : "border-gray-200 hover:border-gray-300"}`}>
                    <SkeletonImage src={img} alt="" className="w-full h-full object-cover" containerClassName="w-full h-full" loading="eager" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── RIGHT: PRODUCT INFO ── */}
          <div className="flex flex-col py-1">
            {/* Category badge */}
            {product.subcategory_name && (
              <span className="inline-block w-fit text-[11px] font-bold text-brand uppercase tracking-widest mb-3 bg-brand-50 px-3 py-1 rounded-full">
                {product.subcategory_name}
              </span>
            )}

            {/* Title */}
            <h1 className="text-xl sm:text-2xl lg:text-4xl font-bold text-gray-900 leading-tight tracking-tight mb-3 sm:mb-4">
              {product.title}
            </h1>

            {/* Rating row */}
            <div className="flex items-center gap-3 mb-5">
              <div className="flex items-center gap-2 bg-amber-50 px-3 py-1.5 rounded-full">
                <StarRating value={avgRating} size="text-base" />
                <span className="text-sm font-bold text-amber-700">{avgRating.toFixed(1)}</span>
              </div>
              <a href="#reviews-section" className="text-sm text-gray-500 hover:text-brand transition-colors underline underline-offset-2 decoration-gray-300 hover:decoration-brand">
                {reviewCount > 0 ? `${reviewCount} review${reviewCount > 1 ? "s" : ""}` : "Be the first to review"}
              </a>
            </div>

            {/* Price block */}
            <div className="rounded-2xl p-5 mb-6 border border-gray-100 bg-gradient-to-r from-gray-50/80 via-white to-brand-50/30">
              <div className="flex items-baseline gap-3 flex-wrap">
                <span className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gray-900 tracking-tight">{product.price}</span>
                {product.originalPrice && (
                  <span className="text-base text-gray-400 line-through font-medium">{product.originalPrice}</span>
                )}
                {product.discount && (
                  <span className="bg-green-500 text-white px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wide">
                    {product.discount}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4 mt-2">
                <p className="text-xs text-gray-500">Inclusive of all taxes</p>
                <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                  <FaShippingFast className="text-[10px]" /> Free shipping over ₹999
                </span>
              </div>
            </div>

            {/* Description */}
            {product.description && (
              <p className="text-gray-600 leading-relaxed text-[15px] mb-6">{product.description}</p>
            )}

            {/* Dynamic Attributes */}
            {product.attributes?.length > 0 && (
              <div className="space-y-5 mb-6 py-5 border-t border-b border-gray-100">
                {product.attributes.map((attr, idx) => (
                  <div key={idx}>
                    <label className="block text-sm font-bold text-gray-800 mb-2.5">{attr.display_name || attr.name}</label>
                    <div className="flex flex-wrap gap-2">
                      {(attr.values || []).map((val, vIdx) => (
                        <button key={vIdx}
                          className="px-4 py-2.5 text-sm border border-gray-200 rounded-xl hover:border-brand hover:bg-brand-50 focus:border-brand focus:bg-brand-50 focus:ring-2 focus:ring-brand/10 transition-all text-gray-700 font-medium">
                          {val.display_value || val.value}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Quantity + CTA */}
            <div className="flex flex-col gap-5 mt-auto">
              <div className="flex items-center gap-4">
                <span className="text-sm font-semibold text-gray-700">Quantity</span>
                <QuantitySelector value={quantity} onChange={setQuantity} />
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                {product.zakeke_product_id ? (
                  <Link to={`/zakeke-editor/${product.slug}`}
                    className="flex-1 bg-brand text-white text-center text-sm sm:text-[15px] font-bold py-3.5 sm:py-4 px-6 sm:px-8 rounded-2xl hover:bg-brand-500 active:scale-[0.98] transition-all shadow-md shadow-brand/20 flex items-center justify-center gap-2">
                    <span>✏️</span> Personalize Design
                  </Link>
                ) : (
                  <Link to={`/product/${product.slug}/templates`}
                    className="flex-1 bg-brand text-white text-center text-sm sm:text-[15px] font-bold py-3.5 sm:py-4 px-6 sm:px-8 rounded-2xl hover:bg-brand-500 active:scale-[0.98] transition-all shadow-md shadow-brand/20 flex items-center justify-center gap-2">
                    <span>🎨</span> Browse Designs
                  </Link>
                )}
                <button onClick={handleAddToCart}
                  className="flex-1 bg-gray-900 text-white text-sm sm:text-[15px] font-bold py-3.5 sm:py-4 px-6 sm:px-8 rounded-2xl hover:bg-gray-800 active:scale-[0.98] transition-all shadow-md flex items-center justify-center gap-2">
                  <span>🛒</span> Add to Cart
                </button>
              </div>
            </div>

            {/* Trust Badges — Horizontal strip */}
            <div className="mt-8 pt-6 border-t border-gray-100">
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                {[
                  { icon: <FaShippingFast />, label: "Free Shipping", sub: "Orders over ₹999", color: "text-brand", bg: "bg-brand-50" },
                  { icon: <FaShieldAlt />, label: "Quality Assured", sub: "100% Genuine", color: "text-emerald-500", bg: "bg-emerald-50" },
                  { icon: <FaUndo />, label: "Easy Returns", sub: "7-Day Policy", color: "text-amber-500", bg: "bg-amber-50" },
                  { icon: <FaPhoneAlt />, label: "24/7 Support", sub: "We're here to help", color: "text-violet-500", bg: "bg-violet-50" },
                ].map((b, i) => (
                  <div key={i} className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all group">
                    <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center text-xs sm:text-sm ${b.color} ${b.bg} group-hover:scale-105 transition-transform`}>
                      {b.icon}
                    </div>
                    <div>
                      <p className="text-[11px] sm:text-xs font-bold text-gray-800 leading-tight">{b.label}</p>
                      <p className="text-[9px] sm:text-[10px] text-gray-400 mt-0.5">{b.sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════ SECTION 2: ABOUT THIS ITEM ═══════════ */}
      {product.aboutItems?.length > 0 && (
        <div className="border-t border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-10 lg:py-14">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">About This Item</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {product.aboutItems.map((item, idx) => (
                <div key={idx} className="flex gap-3 items-start bg-gray-50/60 rounded-xl p-4 border border-gray-100">
                  <div className="mt-0.5 w-5 h-5 rounded-full bg-brand/10 flex items-center justify-center flex-shrink-0">
                    <FaCheckCircle className="text-brand text-[10px]" />
                  </div>
                  <p className="text-gray-600 leading-relaxed text-[15px]">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════ SECTION 3: PRODUCT DETAILS ═══════════ */}
      <div className="border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-10 lg:py-14">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Product Details</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* Description */}
            <div>
              <h3 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span className="w-1 h-5 bg-brand rounded-full"></span>
                Description
              </h3>
              <div className="text-gray-600 leading-relaxed text-[15px]">
                <p>{product.description || <span className="italic text-gray-400">No description available.</span>}</p>
              </div>

              {/* Quick info grid */}
              <div className="mt-6 space-y-2">
                {[
                  { label: "SKU", value: product.slug?.toUpperCase() },
                  { label: "Category", value: product.subcategory_name },
                  { label: "Price", value: product.price },
                  product.originalPrice ? { label: "MRP", value: product.originalPrice } : null,
                ].filter(Boolean).map((item, i) => (
                  <div key={i} className={`flex justify-between py-3 px-4 rounded-lg text-sm ${i % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}>
                    <span className="text-gray-500 font-medium">{item.label}</span>
                    <span className="font-semibold text-gray-900">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Specifications table */}
            <div>
              <h3 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span className="w-1 h-5 bg-brand rounded-full"></span>
                Specifications
              </h3>
              {product.specifications?.length > 0 ? (
                <div className="rounded-xl border border-gray-200 overflow-hidden">
                  {product.specifications.map((spec, i) => (
                    <div key={i} className={`flex ${i % 2 === 0 ? 'bg-gray-50/70' : 'bg-white'}`}>
                      <dt className="w-2/5 py-3.5 px-4 text-sm text-gray-500 font-medium">{spec.label}</dt>
                      <dd className="w-3/5 py-3.5 px-4 text-sm font-semibold text-gray-900">{spec.value}</dd>
                    </div>
                  ))}
                </div>
              ) : product.print_specs?.length > 0 ? (
                product.print_specs.map((spec, sIdx) => (
                  <div key={sIdx} className="rounded-xl border border-gray-200 overflow-hidden mb-4">
                    <div className="bg-gray-900 text-white px-5 py-3">
                      <h4 className="text-sm font-bold uppercase tracking-wider">{spec.surface || "Standard"} Print Area</h4>
                    </div>
                    {[
                      { l: "Dimensions", v: `${spec.width_mm}mm × ${spec.height_mm}mm` },
                      { l: "Safe Zone", v: `${spec.safe_zone_mm}mm` },
                      { l: "Bleed Margin", v: `${spec.bleed_margin_mm}mm` },
                      { l: "Min DPI", v: spec.min_resolution_dpi || 300 },
                      { l: "Color Mode", v: spec.color_mode || "CMYK" },
                      { l: "File Format", v: spec.file_format || "PDF, AI, PSD" },
                    ].map((row, i) => row.v ? (
                      <div key={i} className={`flex ${i % 2 === 0 ? 'bg-gray-50/70' : 'bg-white'}`}>
                        <dt className="w-2/5 py-3.5 px-4 text-sm text-gray-500 font-medium">{row.l}</dt>
                        <dd className="w-3/5 py-3.5 px-4 text-sm font-semibold text-gray-900">{row.v}</dd>
                      </div>
                    ) : null)}
                  </div>
                ))
              ) : product.attributes?.length > 0 ? (
                <div className="rounded-xl border border-gray-200 overflow-hidden">
                  {product.attributes.map((attr, i) => (
                    <div key={i} className={`flex ${i % 2 === 0 ? 'bg-gray-50/70' : 'bg-white'}`}>
                      <dt className="w-2/5 py-3.5 px-4 text-sm text-gray-500 font-medium">{attr.display_name || attr.name}</dt>
                      <dd className="w-3/5 py-3.5 px-4 text-sm font-semibold text-gray-900">
                        {(attr.values || []).map(v => v.display_value || v.value).join(", ")}
                      </dd>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-gray-50 rounded-xl p-8 text-center border border-dashed border-gray-200">
                  <p className="text-gray-400 text-sm">Specifications are being updated for this product.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════ SECTION 4: CUSTOMER REVIEWS ═══════════ */}
      <div className="border-t border-gray-100">
        <div id="reviews-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-10 lg:py-14">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Customer Reviews</h2>

          {/* Rating overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            {/* Big rating number */}
            <div className="flex flex-col items-center justify-center bg-gradient-to-br from-amber-50/60 to-orange-50/40 rounded-2xl p-8 border border-amber-100/60">
              <span className="text-6xl font-extrabold text-gray-900 leading-none">{avgRating.toFixed(1)}</span>
              <div className="mt-2 mb-1"><StarRating value={avgRating} size="text-xl" /></div>
              <p className="text-sm text-gray-500 font-medium">{reviewCount} review{reviewCount !== 1 ? "s" : ""}</p>
            </div>
            {/* Breakdown bars */}
            <div className="md:col-span-2 bg-white rounded-2xl p-6 flex flex-col justify-center gap-2.5 border border-gray-100">
              {[5, 4, 3, 2, 1].map(star => (
                <RatingBar key={star} star={star} count={ratingBreakdown[star]} total={reviewCount} />
              ))}
            </div>
          </div>

          {/* Write review */}
          <div className="mb-10">
            <ReviewForm productId={product.id} onReviewSubmitted={handleReviewSubmitted} />
          </div>

          {/* Review list */}
          {sortedReviews.length > 0 ? (
            <>
              <div className="flex items-center justify-between mb-6">
                <p className="text-sm text-gray-500 font-medium">
                  Showing {sortedReviews.length} review{sortedReviews.length !== 1 ? "s" : ""}
                </p>
                <select value={reviewSort} onChange={e => setReviewSort(e.target.value)}
                  className="text-sm border border-gray-200 rounded-xl px-4 py-2.5 bg-white text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand cursor-pointer">
                  <option value="newest">Newest First</option>
                  <option value="highest">Highest Rated</option>
                  <option value="lowest">Lowest Rated</option>
                </select>
              </div>
              <div className="space-y-4">
                {sortedReviews.map((rev, idx) => (
                  <div key={rev.id || idx} className="bg-white p-5 sm:p-6 rounded-2xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3.5">
                        {/* Avatar */}
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-100 to-brand-200 flex items-center justify-center flex-shrink-0">
                          <span className="text-brand-700 font-bold text-sm">
                            {(rev.user_name || "C").charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="font-semibold text-gray-800 text-sm">{rev.user_name || "Customer"}</span>
                            {rev.is_verified_purchase && (
                              <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full">
                                <FaCheckCircle className="text-[8px]" /> Verified
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <StarRating value={rev.rating} size="text-xs" />
                            <span className="text-[11px] text-gray-400">
                              {new Date(rev.created_at).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" })}
                            </span>
                          </div>
                        </div>
                      </div>
                      <button onClick={() => handleMarkHelpful(rev.id)}
                        className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-brand border border-transparent hover:border-brand/20 hover:bg-brand-50 px-3 py-1.5 rounded-lg transition-all">
                        <FaThumbsUp className="text-[10px]" /> {rev.helpful_count > 0 ? rev.helpful_count : "Helpful?"}
                      </button>
                    </div>
                    {rev.title && <h4 className="font-bold text-gray-900 mt-3 mb-1">{rev.title}</h4>}
                    <p className="text-gray-600 text-sm leading-relaxed mt-2">{rev.comment}</p>

                    {/* Admin Reply */}
                    {rev.admin_reply && (
                      <div className="mt-4 ml-4 sm:ml-8 bg-gradient-to-br from-teal-50/80 to-emerald-50/50 border border-teal-100 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-6 h-6 rounded-full bg-teal-500 flex items-center justify-center">
                            <span className="text-white text-[10px] font-bold">P</span>
                          </div>
                          <span className="text-xs font-bold text-teal-700">Printdoot Team</span>
                          {rev.admin_reply_date && (
                            <span className="text-[10px] text-gray-400 ml-auto">
                              {new Date(rev.admin_reply_date).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" })}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 leading-relaxed">{rev.admin_reply}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-16 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">📝</span>
              </div>
              <p className="text-gray-700 font-semibold text-lg">No reviews yet</p>
              <p className="text-sm text-gray-400 mt-1">Be the first to share your experience with this product.</p>
            </div>
          )}
        </div>
      </div>

      {/* ═══════════ SECTION 5: RELATED PRODUCTS ═══════════ */}
      {relatedProducts.length > 0 && (
        <div className="border-t border-gray-100 py-12 sm:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">You May Also Like</h2>
                <p className="text-sm text-gray-400 mt-1">Customers who viewed this also browsed</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => scrollRelated(-1)}
                  className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:border-brand hover:text-brand transition-all shadow-sm">
                  <FaChevronLeft className="text-xs" />
                </button>
                <button onClick={() => scrollRelated(1)}
                  className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:border-brand hover:text-brand transition-all shadow-sm">
                  <FaChevronRight className="text-xs" />
                </button>
              </div>
            </div>
            <div ref={relatedScrollRef} className="flex gap-5 overflow-x-auto scrollbar-hide pb-4 snap-x snap-mandatory">
              {relatedProducts.map(rel => (
                <Link to={rel.href} key={rel.id}
                  className="group flex-shrink-0 w-[200px] sm:w-[220px] snap-start">
                  <div className="aspect-square bg-white rounded-2xl overflow-hidden mb-3 border border-gray-100 group-hover:border-gray-200 group-hover:shadow-lg transition-all duration-300">
                    <SkeletonImage src={rel.image} alt={rel.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      containerClassName="w-full h-full" loading="lazy" />
                  </div>
                  <h3 className="font-semibold text-gray-900 group-hover:text-brand transition-colors line-clamp-2 text-sm mb-1.5 leading-snug">
                    {rel.title}
                  </h3>
                  <span className="text-sm font-bold text-gray-900">{rel.price}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════ SECTION 6: FAQ — Premium design ═══════════ */}
      <div className="border-t border-gray-100 bg-gradient-to-b from-gray-50/50 to-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
          {/* Header */}
          <div className="text-center mb-10">
            <span className="inline-flex items-center gap-2 bg-brand-50 text-brand text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-4">
              ❓ Got Questions?
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Frequently Asked Questions</h2>
            <p className="text-gray-400 text-sm mt-2 max-w-md mx-auto">
              Everything you need to know about this product. Can't find the answer? Contact our support team.
            </p>
          </div>

          {/* FAQ Items */}
          <div className="space-y-3">
            {[
              { q: "How long does shipping take?", a: "Standard shipping takes 5–7 business days across India. Express delivery options (2–3 days) are available at checkout for select pin codes. You'll receive tracking details via email once shipped.", icon: "🚚" },
              { q: "Can I upload my own design?", a: "Absolutely! Use our built-in design editor to upload your own artwork, or choose from hundreds of professionally-made templates. We support drag-and-drop editing, text customization, and image placement.", icon: "🎨" },
              { q: "What file formats are accepted?", a: "We accept PDF, AI, PSD, PNG, and JPG files. For the best print quality, we recommend using 300 DPI resolution in CMYK color mode. Our system will alert you if the resolution is too low.", icon: "📁" },
              { q: "What is your return policy?", a: "We offer a hassle-free 7-day return policy for defective or incorrectly printed products. If you're not satisfied with the quality, we'll provide a full refund or free replacement. Custom-designed items are non-refundable unless there's a printing defect.", icon: "🔄" },
              { q: "Do you offer bulk pricing?", a: "Yes! We offer attractive discounts for bulk orders. The more you order, the lower the per-unit cost. Contact our sales team at printdootweb@gmail.com or call +91 78273-03575 for a custom quote.", icon: "📦" },
            ].map((faq, i) => (
              <details key={i} className="group rounded-xl border border-gray-200 bg-white hover:border-brand/30 transition-all duration-200 overflow-hidden open:shadow-sm open:border-brand/30">
                <summary className="flex items-center gap-4 p-5 cursor-pointer select-none list-none [&::-webkit-details-marker]:hidden">
                  <span className="w-10 h-10 rounded-xl bg-gray-50 group-open:bg-brand-50 flex items-center justify-center text-lg flex-shrink-0 transition-colors duration-200">
                    {faq.icon}
                  </span>
                  <span className="flex-1 font-semibold text-gray-800 group-hover:text-gray-900 text-[15px] pr-4">{faq.q}</span>
                  <div className="w-7 h-7 rounded-full bg-gray-100 group-open:bg-brand group-open:text-white flex items-center justify-center flex-shrink-0 transition-all duration-200">
                    <IoChevronDown className="text-xs group-open:rotate-180 transition-transform duration-300" />
                  </div>
                </summary>
                <div className="px-5 pb-5 pl-[4.5rem]">
                  <p className="text-sm text-gray-500 leading-relaxed">{faq.a}</p>
                </div>
              </details>
            ))}
          </div>

          {/* Contact CTA */}
          <div className="text-center mt-10">
            <p className="text-sm text-gray-400 mb-3">Still have questions?</p>
            <Link to="/contact" className="inline-flex items-center gap-2 text-brand font-semibold text-sm hover:underline underline-offset-2">
              <FaPhoneAlt className="text-xs" /> Contact our support team
            </Link>
          </div>
        </div>
      </div>

      {/* Toast notification */}
      {toast && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl bg-gray-900 text-white text-sm font-semibold shadow-xl flex items-center gap-2"
          style={{ animation: 'slideUp 0.3s ease-out forwards' }}
        >
          <span>✓</span> {toast}
        </div>
      )}
    </div>
  );
}
