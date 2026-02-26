import { useEffect, useState, useMemo, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  FaStar, FaRegStar, FaStarHalfAlt, FaThumbsUp, FaCheckCircle,
  FaShippingFast, FaShieldAlt, FaUndo, FaPhoneAlt, FaChevronLeft, FaChevronRight,
} from "react-icons/fa";
import { IoChevronDown } from "react-icons/io5";
import { SkeletonImage } from "../../components/Skeleton";
import catalogService from "../../services/catalogService";
import userService from "../../services/userService";
import { useShop } from "../../context/ShopContext";

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
      <span className="w-7 text-right font-medium text-gray-500">{star}★</span>
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full bg-amber-400 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>
      <span className="w-10 text-gray-400 text-xs">{pct}%</span>
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
          onClick={() => onChange(star)} className="text-2xl focus:outline-none">
          {(hovered || value) >= star
            ? <FaStar className="text-amber-400" />
            : <FaRegStar className="text-gray-300 hover:text-amber-300" />}
        </button>
      ))}
      {value > 0 && <span className="ml-2 text-sm text-gray-500 font-medium">{labels[value]}</span>}
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
      <div className="bg-white rounded-2xl p-8 border border-gray-100 text-center">
        <p className="text-gray-500"><Link to="/login" className="text-cyan-600 font-semibold hover:underline">Sign in</Link> to write a review.</p>
      </div>
    );
  }
  if (success) {
    return (
      <div className="bg-emerald-50 rounded-2xl p-8 border border-emerald-200 text-center">
        <FaCheckCircle className="text-emerald-500 text-3xl mx-auto mb-3" />
        <p className="text-emerald-700 font-semibold text-lg">Thank you for your review!</p>
        <button onClick={() => setSuccess(false)} className="mt-4 text-sm text-cyan-600 hover:underline">Write another</button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-100">
      <h3 className="text-lg font-bold text-gray-900 mb-6">Write a Review</h3>
      {error && <div className="bg-red-50 text-red-600 text-sm rounded-xl px-4 py-3 mb-4 border border-red-200">{error}</div>}
      <div className="mb-5">
        <label className="block text-sm font-semibold text-gray-700 mb-2">Your Rating *</label>
        <StarRatingInput value={rating} onChange={setRating} />
      </div>
      <div className="mb-5">
        <label className="block text-sm font-semibold text-gray-700 mb-2">Title</label>
        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
          placeholder="Summarize your experience" maxLength={200}
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all" />
      </div>
      <div className="mb-6">
        <label className="block text-sm font-semibold text-gray-700 mb-2">Your Review</label>
        <textarea value={comment} onChange={(e) => setComment(e.target.value)}
          placeholder="Share details of your experience..." rows={4}
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all resize-none" />
      </div>
      <button type="submit" disabled={submitting || rating === 0}
        className="bg-gray-900 text-white font-semibold py-3 px-8 rounded-xl hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all text-sm">
        {submitting ? "Submitting..." : "Submit Review"}
      </button>
    </form>
  );
}

/* ── Product Page Skeleton ── */
function ProductSkeleton() {
  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Breadcrumb skeleton */}
        <div className="flex gap-2 mb-8">
          {[60, 80, 120].map((w, i) => (
            <div key={i} className="skeleton-shimmer bg-gray-200 rounded h-4" style={{ width: w }} />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-14">
          {/* Image skeleton */}
          <div>
            <div className="aspect-square skeleton-shimmer bg-gray-200 rounded-2xl" />
            <div className="flex gap-3 mt-4">
              {[1, 2, 3, 4].map(i => <div key={i} className="w-20 h-20 skeleton-shimmer bg-gray-200 rounded-xl" />)}
            </div>
          </div>
          {/* Info skeleton */}
          <div className="space-y-4 py-2">
            <div className="skeleton-shimmer bg-gray-200 rounded h-5 w-32" />
            <div className="skeleton-shimmer bg-gray-200 rounded h-10 w-3/4" />
            <div className="skeleton-shimmer bg-gray-200 rounded h-4 w-40" />
            <div className="skeleton-shimmer bg-gray-200 rounded h-8 w-36 mt-4" />
            <div className="skeleton-shimmer bg-gray-200 rounded h-4 w-full mt-6" />
            <div className="skeleton-shimmer bg-gray-200 rounded h-4 w-5/6" />
            <div className="skeleton-shimmer bg-gray-200 rounded h-4 w-2/3" />
            <div className="flex gap-4 mt-8">
              <div className="skeleton-shimmer bg-gray-200 rounded-2xl h-14 flex-1" />
              <div className="skeleton-shimmer bg-gray-200 rounded-2xl h-14 flex-1" />
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
    <div className="flex items-center border-2 border-gray-200 rounded-xl overflow-hidden w-fit">
      <button onClick={() => onChange(Math.max(1, value - 1))}
        className="w-10 h-10 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors text-lg font-medium disabled:opacity-30"
        disabled={value <= 1}>−</button>
      <span className="w-12 text-center text-sm font-bold text-gray-900">{value}</span>
      <button onClick={() => onChange(Math.min(max, value + 1))}
        className="w-10 h-10 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors text-lg font-medium disabled:opacity-30"
        disabled={value >= max}>+</button>
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
  const [activeTab, setActiveTab] = useState("description");
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
        const data = await catalogService.getProductBySlug(activeSlug);
        if (data) {
          setProduct(data);
          const imgs = data.images?.length > 0 ? data.images : [data.image || "https://placehold.co/600x400?text=No+Image"];
          setImageList(imgs);
          setActiveImage(imgs[0]);
          setQuantity(1);
          try {
            const relResult = data.subcategory
              ? await catalogService.getProducts({ subcategory: data.subcategory })
              : await catalogService.getProducts();
            const related = (relResult.products || relResult).filter(p => p.id !== data.id).slice(0, 8);
            setRelatedProducts(related);
          } catch { setRelatedProducts([]); }
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
        <Link to="/view-all" className="text-cyan-600 hover:underline font-medium">← Browse all products</Link>
      </div>
    );
  }

  const reviewCount = product.rating?.count || 0;
  const avgRating = product.rating?.value || 0;

  const handleAddToCart = () => { addToCart(product, quantity); navigate("/cart"); };

  const handleReviewSubmitted = async () => {
    try {
      const data = await catalogService.getProductBySlug(activeSlug);
      if (data) setProduct(data);
    } catch {}
  };

  const handleMarkHelpful = async (reviewId) => {
    try {
      await catalogService.markReviewHelpful(reviewId);
      const data = await catalogService.getProductBySlug(activeSlug);
      if (data) setProduct(data);
    } catch {}
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

  const tabs = [
    { key: "description", label: "Description" },
    { key: "specs", label: "Specifications" },
    { key: "reviews", label: `Reviews (${reviewCount})` },
  ];

  return (
    <div className="bg-white min-h-screen">
      {/* ═══════════ BREADCRUMB ═══════════ */}
      <div className="bg-gray-50 border-b border-gray-100">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-2 text-sm text-gray-500 flex-wrap">
          <Link to="/" className="hover:text-gray-900 transition-colors">Home</Link>
          <span className="text-gray-300">/</span>
          <Link to="/view-all" className="hover:text-gray-900 transition-colors">Products</Link>
          {product.subcategory_name && (
            <><span className="text-gray-300">/</span><span className="text-gray-600">{product.subcategory_name}</span></>
          )}
          <span className="text-gray-300">/</span>
          <span className="text-gray-900 font-medium truncate max-w-[200px]">{product.title}</span>
        </nav>
      </div>

      {/* ═══════════ HERO: IMAGE + INFO ═══════════ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 lg:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-14">

          {/* ── LEFT: IMAGE GALLERY ── */}
          <div className="space-y-4">
            {/* Main image with hover zoom */}
            <div
              className="relative aspect-square bg-gray-50 rounded-2xl overflow-hidden border border-gray-100 cursor-crosshair group"
              onMouseEnter={() => setImgZoom(true)}
              onMouseLeave={() => setImgZoom(false)}
              onMouseMove={handleMouseMove}
            >
              <SkeletonImage
                src={activeImage}
                alt={product.title}
                loading="eager"
                fetchPriority="high"
                className="w-full h-full object-contain mix-blend-multiply p-6 sm:p-10 transition-transform duration-200"
                containerClassName="w-full h-full"
                style={imgZoom ? { transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`, transform: "scale(2)" } : {}}
              />
              {product.discount && (
                <span className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg z-10">
                  {product.discount}
                </span>
              )}
            </div>

            {/* Thumbnails */}
            {imageList.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
                {imageList.map((img, idx) => (
                  <button key={idx} onClick={() => setActiveImage(img)}
                    className={`flex-shrink-0 w-20 h-20 rounded-xl border-2 overflow-hidden transition-all ${
                      activeImage === img ? "border-cyan-600 ring-2 ring-cyan-600/20" : "border-gray-200 hover:border-gray-400"
                    }`}>
                    <SkeletonImage src={img} alt="" className="w-full h-full object-cover" containerClassName="w-full h-full" loading="eager" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── RIGHT: PRODUCT INFO ── */}
          <div className="flex flex-col">
            {/* Category badge */}
            {product.subcategory_name && (
              <span className="text-xs font-semibold text-cyan-600 uppercase tracking-wider mb-2">{product.subcategory_name}</span>
            )}

            {/* Title */}
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 leading-tight mb-4">
              {product.title}
            </h1>

            {/* Rating */}
            <div className="flex items-center gap-3 mb-6">
              <StarRating value={avgRating} size="text-lg" />
              <span className="text-sm font-bold text-gray-700">{avgRating.toFixed(1)}</span>
              <a href="#reviews" className="text-sm text-cyan-600 hover:underline">
                {reviewCount > 0 ? `${reviewCount} review${reviewCount > 1 ? "s" : ""}` : "Be the first to review"}
              </a>
            </div>

            {/* Price block */}
            <div className="bg-gray-50 rounded-2xl p-5 mb-6">
              <div className="flex items-baseline gap-3 mb-1">
                <span className="text-3xl sm:text-4xl font-extrabold text-gray-900">{product.price}</span>
                {product.originalPrice && (
                  <span className="text-lg text-gray-400 line-through">{product.originalPrice}</span>
                )}
                {product.discount && (
                  <span className="bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wide">
                    {product.discount}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500">Inclusive of all taxes. Shipping calculated at checkout.</p>
            </div>

            {/* Description (short) */}
            {product.description && (
              <p className="text-gray-600 leading-relaxed text-[15px] mb-6 line-clamp-4">{product.description}</p>
            )}

            {/* Dynamic Attributes */}
            {product.attributes?.length > 0 && (
              <div className="space-y-4 mb-6">
                {product.attributes.map((attr, idx) => (
                  <div key={idx}>
                    <label className="block text-sm font-bold text-gray-900 mb-2">{attr.display_name || attr.name}</label>
                    <div className="flex flex-wrap gap-2">
                      {(attr.values || []).map((val, vIdx) => (
                        <button key={vIdx}
                          className="px-4 py-2 text-sm border-2 border-gray-200 rounded-xl hover:border-cyan-600 hover:bg-cyan-50 focus:border-cyan-600 focus:bg-cyan-50 transition-all text-gray-700 font-medium">
                          {val.display_value || val.value}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Quantity + CTA */}
            <div className="flex flex-col gap-4 mt-auto">
              <div className="flex items-center gap-4">
                <span className="text-sm font-semibold text-gray-700">Qty:</span>
                <QuantitySelector value={quantity} onChange={setQuantity} />
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                {product.zakeke_product_id ? (
                  <Link to={`/zakeke-editor/${product.slug}`}
                    className="flex-1 bg-gray-900 text-white text-base font-bold py-4 px-8 rounded-2xl hover:bg-gray-800 active:scale-[0.98] transition-all shadow-lg text-center">
                    ✏️ Personalize Design
                  </Link>
                ) : (
                  <Link to={`/product/${product.slug}/templates`}
                    className="flex-1 bg-gray-900 text-white text-base font-bold py-4 px-8 rounded-2xl hover:bg-gray-800 active:scale-[0.98] transition-all shadow-lg text-center">
                    🎨 Browse Designs
                  </Link>
                )}
                <button onClick={handleAddToCart}
                  className="flex-1 bg-white text-gray-900 border-2 border-gray-200 text-base font-bold py-4 px-8 rounded-2xl hover:border-gray-900 active:scale-[0.98] transition-all text-center">
                  🛒 Add to Cart
                </button>
              </div>
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-gray-100">
              {[
                { icon: <FaShippingFast />, label: "Free Shipping", sub: "Over ₹999" },
                { icon: <FaShieldAlt />, label: "Quality Assured", sub: "100% Satisfaction" },
                { icon: <FaUndo />, label: "Easy Returns", sub: "7-Day Policy" },
                { icon: <FaPhoneAlt />, label: "Support", sub: "24/7 Help" },
              ].map((b, i) => (
                <div key={i} className="flex items-center gap-2 text-gray-500">
                  <span className="text-cyan-600 text-sm">{b.icon}</span>
                  <div>
                    <p className="text-[11px] font-semibold text-gray-700 leading-tight">{b.label}</p>
                    <p className="text-[10px] text-gray-400">{b.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════ TABS: DESCRIPTION / SPECS / REVIEWS ═══════════ */}
      <div className="border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {/* Tab headers */}
          <div className="flex gap-0 border-b border-gray-200 overflow-x-auto scrollbar-hide">
            {tabs.map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className={`px-6 py-4 text-sm font-semibold whitespace-nowrap transition-all border-b-2 -mb-px ${
                  activeTab === tab.key
                    ? "border-gray-900 text-gray-900"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="py-8 sm:py-12">
            {/* ── Description ── */}
            {activeTab === "description" && (
              <div className="max-w-3xl">
                <div className="prose prose-gray max-w-none text-gray-600 leading-relaxed">
                  <p className="text-base">{product.description || <span className="italic text-gray-400">No description available.</span>}</p>
                </div>

                {/* Product details grid */}
                <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { label: "SKU", value: product.slug?.toUpperCase() },
                    { label: "Category", value: product.subcategory_name },
                    { label: "Price", value: product.price },
                    product.originalPrice ? { label: "MRP", value: product.originalPrice } : null,
                  ].filter(Boolean).map((item, i) => (
                    <div key={i} className="flex justify-between py-3 px-4 bg-gray-50 rounded-xl">
                      <span className="text-sm text-gray-500">{item.label}</span>
                      <span className="text-sm font-semibold text-gray-900">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Specifications ── */}
            {activeTab === "specs" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {product.print_specs?.length > 0 ? (
                  product.print_specs.map((spec, sIdx) => (
                    <div key={sIdx} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                      <div className="bg-gray-900 text-white px-5 py-3">
                        <h3 className="text-sm font-bold uppercase tracking-wider">{spec.surface || "Standard"} Print Area</h3>
                      </div>
                      <div className="divide-y divide-gray-100">
                        {[
                          { l: "Dimensions", v: `${spec.width_mm}mm × ${spec.height_mm}mm` },
                          { l: "Safe Zone", v: `${spec.safe_zone_mm}mm` },
                          { l: "Bleed Margin", v: `${spec.bleed_margin_mm}mm` },
                          { l: "Min DPI", v: spec.min_resolution_dpi || 300 },
                          { l: "Color Mode", v: spec.color_mode || "CMYK" },
                          { l: "File Format", v: spec.file_format || "PDF, AI, PSD" },
                        ].map((row, i) => row.v ? (
                          <div key={i} className="flex">
                            <dt className="w-1/3 py-3 px-4 text-sm text-gray-500 bg-gray-50">{row.l}</dt>
                            <dd className="w-2/3 py-3 px-4 text-sm font-semibold text-gray-900">{row.v}</dd>
                          </div>
                        ) : null)}
                      </div>
                    </div>
                  ))
                ) : product.attributes?.length > 0 ? (
                  <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                    <div className="bg-gray-900 text-white px-5 py-3">
                      <h3 className="text-sm font-bold uppercase tracking-wider">Product Specifications</h3>
                    </div>
                    <div className="divide-y divide-gray-100">
                      {product.attributes.map((attr, i) => (
                        <div key={i} className="flex">
                          <dt className="w-1/3 py-3 px-4 text-sm text-gray-500 bg-gray-50">{attr.display_name || attr.name}</dt>
                          <dd className="w-2/3 py-3 px-4 text-sm font-semibold text-gray-900">
                            {(attr.values || []).map(v => v.display_value || v.value).join(", ")}
                          </dd>
                        </div>
                      ))}
                      <div className="flex">
                        <dt className="w-1/3 py-3 px-4 text-sm text-gray-500 bg-gray-50">SKU</dt>
                        <dd className="w-2/3 py-3 px-4 text-sm font-semibold text-gray-900">{product.slug?.toUpperCase()}</dd>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="col-span-full bg-gray-50 rounded-2xl p-8 text-center">
                    <p className="text-gray-400">Specifications are being updated for this product.</p>
                  </div>
                )}
              </div>
            )}

            {/* ── Reviews ── */}
            {activeTab === "reviews" && (
              <div id="reviews" className="max-w-4xl">
                {/* Rating overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                  <div className="flex flex-col items-center justify-center bg-gray-50 rounded-2xl p-8">
                    <span className="text-5xl font-extrabold text-gray-900">{avgRating.toFixed(1)}</span>
                    <StarRating value={avgRating} size="text-xl" />
                    <p className="text-sm text-gray-500 mt-2">{reviewCount} review{reviewCount !== 1 ? "s" : ""}</p>
                  </div>
                  <div className="md:col-span-2 bg-gray-50 rounded-2xl p-6 flex flex-col justify-center gap-2">
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
                        {sortedReviews.length} review{sortedReviews.length !== 1 ? "s" : ""}
                      </p>
                      <select value={reviewSort} onChange={e => setReviewSort(e.target.value)}
                        className="text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500">
                        <option value="newest">Newest First</option>
                        <option value="highest">Highest Rated</option>
                        <option value="lowest">Lowest Rated</option>
                      </select>
                    </div>
                    <div className="space-y-4">
                      {sortedReviews.map((rev, idx) => (
                        <div key={rev.id || idx} className="bg-gray-50 p-5 rounded-2xl hover:bg-gray-100 transition-colors">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <StarRating value={rev.rating} size="text-sm" />
                                {rev.is_verified_purchase && (
                                  <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
                                    <FaCheckCircle /> Verified
                                  </span>
                                )}
                              </div>
                              {rev.title && <h4 className="font-bold text-gray-900">{rev.title}</h4>}
                            </div>
                            <span className="text-xs text-gray-400 whitespace-nowrap ml-4">
                              {new Date(rev.created_at).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" })}
                            </span>
                          </div>
                          <p className="text-gray-600 text-sm leading-relaxed mb-3">{rev.comment}</p>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500 font-medium">{rev.user_name || "Customer"}</span>
                            <button onClick={() => handleMarkHelpful(rev.id)}
                              className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-cyan-600 transition-colors">
                              <FaThumbsUp /> {rev.helpful_count > 0 ? `${rev.helpful_count} helpful` : "Helpful?"}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-14 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                    <div className="text-4xl mb-4">📝</div>
                    <p className="text-gray-600 font-medium text-lg">No reviews yet</p>
                    <p className="text-sm text-gray-400 mt-1">Be the first to share your experience.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ═══════════ RELATED PRODUCTS ═══════════ */}
      {relatedProducts.length > 0 && (
        <div className="bg-gray-50 border-t border-gray-100 py-12 sm:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">You May Also Like</h2>
              <div className="flex gap-2">
                <button onClick={() => scrollRelated(-1)}
                  className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-all shadow-sm">
                  <FaChevronLeft className="text-xs" />
                </button>
                <button onClick={() => scrollRelated(1)}
                  className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-all shadow-sm">
                  <FaChevronRight className="text-xs" />
                </button>
              </div>
            </div>
            <div ref={relatedScrollRef} className="flex gap-5 overflow-x-auto scrollbar-hide pb-4 snap-x snap-mandatory">
              {relatedProducts.map(rel => (
                <Link to={rel.href} key={rel.id}
                  className="group flex-shrink-0 w-[200px] sm:w-[220px] snap-start">
                  <div className="aspect-square bg-white rounded-2xl overflow-hidden mb-3 border border-gray-100 group-hover:shadow-lg transition-shadow">
                    <SkeletonImage src={rel.image} alt={rel.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      containerClassName="w-full h-full" loading="lazy" />
                  </div>
                  <h3 className="font-semibold text-gray-900 group-hover:text-cyan-600 transition-colors line-clamp-2 text-sm mb-1">
                    {rel.title}
                  </h3>
                  <span className="text-sm font-bold text-gray-900">{rel.price}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════ FAQ ═══════════ */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <h2 className="text-xl sm:text-2xl font-bold text-center text-gray-900 mb-10">Frequently Asked Questions</h2>
        <div className="space-y-3">
          {[
            { q: "How long does shipping take?", a: "Standard shipping takes 5–7 business days. Express options are available at checkout." },
            { q: "Can I upload my own design?", a: "Yes! Use our design editor to upload your own artwork or choose from hundreds of professional templates." },
            { q: "What file formats are accepted?", a: "We accept PDF, AI, PSD, PNG, and JPG files. For best results, use 300 DPI resolution in CMYK color mode." },
            { q: "What is your return policy?", a: "We offer a 7-day return policy for defective or incorrect products. Custom-designed items are non-refundable." },
            { q: "Do you offer bulk pricing?", a: "Yes! Contact our sales team for bulk orders. The more you order, the lower the per-unit cost." },
          ].map((faq, i) => (
            <details key={i} className="group bg-gray-50 rounded-2xl overflow-hidden hover:bg-gray-100 transition-colors">
              <summary className="flex justify-between items-center p-5 cursor-pointer select-none">
                <span className="font-medium text-gray-700 group-hover:text-gray-900 pr-4">{faq.q}</span>
                <IoChevronDown className="text-gray-400 group-open:rotate-180 transition-transform flex-shrink-0" />
              </summary>
              <div className="px-5 pb-5 text-sm text-gray-500 leading-relaxed">{faq.a}</div>
            </details>
          ))}
        </div>
      </div>
    </div>
  );
}