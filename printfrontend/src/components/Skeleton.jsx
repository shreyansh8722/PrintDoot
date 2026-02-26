import { useState, useEffect, useRef } from 'react';

/* ─────────────────────────────────────────────────
   Skeleton  — animated shimmer placeholder
   ───────────────────────────────────────────────── */
export function Skeleton({ className = '', style = {} }) {
    return (
        <div
            className={`skeleton-shimmer bg-gray-200 ${className}`}
            style={style}
        />
    );
}

/* ─────────────────────────────────────────────────
   SkeletonImage  — shows skeleton until img loads,
                    then fades the image in smoothly
   ───────────────────────────────────────────────── */
export function SkeletonImage({
    src,
    alt = '',
    className = '',
    skeletonClassName = '',
    containerClassName = '',
    style = {},
    loading: loadingProp,
    decoding = 'async',
    fetchPriority,
    sizes,
    ...rest
}) {
    const [loaded, setLoaded] = useState(false);
    const [error, setError] = useState(false);
    const prevSrc = useRef(src);

    // Only reset when src actually changes to a different URL
    useEffect(() => {
        if (prevSrc.current !== src) {
            prevSrc.current = src;
            setLoaded(false);
            setError(false);
        }
    }, [src]);

    // Handle the case where the image is already cached by the browser
    const handleRef = (img) => {
        if (img && img.complete && img.naturalWidth > 0) {
            setLoaded(true);
        }
    };

    return (
        <div className={`relative overflow-hidden ${containerClassName}`} style={style}>
            {/* Skeleton underneath */}
            {!loaded && !error && (
                <div className={`absolute inset-0 skeleton-shimmer bg-gray-200 ${skeletonClassName}`} />
            )}

            {/* Error placeholder */}
            {error && (
                <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
                    <span className="text-2xl text-gray-300">📷</span>
                </div>
            )}

            {/* Actual image — hidden until loaded, then fades in */}
            <img
                ref={handleRef}
                src={src}
                alt={alt}
                loading={loadingProp}
                decoding={decoding}
                fetchpriority={fetchPriority}
                sizes={sizes}
                onLoad={() => setLoaded(true)}
                onError={() => setError(true)}
                className={`transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'} ${className}`}
                {...rest}
            />
        </div>
    );
}

/* ─────────────────────────────────────────────────
   SkeletonText  — one line of shimmer text
   ───────────────────────────────────────────────── */
export function SkeletonText({ width = '100%', height = '14px', className = '' }) {
    return (
        <div
            className={`skeleton-shimmer bg-gray-200 rounded ${className}`}
            style={{ width, height }}
        />
    );
}

/* ─────────────────────────────────────────────────
   NavBarSkeleton  — placeholder for category nav
   ───────────────────────────────────────────────── */
export function NavBarSkeleton() {
    return (
        <div className="max-w-[1800px] mx-auto px-6 lg:flex hidden justify-between items-center gap-6 py-3">
            {/* "View All" placeholder */}
            <div className="skeleton-shimmer bg-gray-200 rounded h-4 w-16" />
            {/* 4 category placeholders */}
            {[1, 2, 3, 4].map((i) => (
                <div key={i} className="skeleton-shimmer bg-gray-200 rounded h-4 w-24" />
            ))}
        </div>
    );
}

/* ─────────────────────────────────────────────────
   HeroSkeleton  — placeholder for hero banners
   ───────────────────────────────────────────────── */
export function HeroSkeleton({ count = 2 }) {
    return (
        <section className="w-full py-10 bg-white overflow-hidden">
            <div className="w-full">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-[5px]">
                    {Array.from({ length: count }).map((_, i) => (
                        <div key={i} className="relative h-[420px] skeleton-shimmer bg-gray-200 rounded-none">
                            <div className="absolute bottom-6 left-6 bg-white/80 p-6 rounded-xl max-w-sm">
                                <div className="skeleton-shimmer bg-gray-200 rounded h-7 w-48 mb-3" />
                                <div className="skeleton-shimmer bg-gray-200 rounded h-4 w-32 mb-4" />
                                <div className="flex gap-3">
                                    <div className="skeleton-shimmer bg-gray-300 rounded-lg h-10 w-24" />
                                    <div className="skeleton-shimmer bg-gray-200 rounded-lg h-10 w-24" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

/* ─────────────────────────────────────────────────
   CarouselSkeleton  — placeholder for product / category carousels
   ───────────────────────────────────────────────── */
export function CarouselSkeleton({ type = 'product', count = 5 }) {
    const isCategory = type === 'category';
    return (
        <div className="relative w-full py-12 bg-gray-50/50">
            <div className="max-w-7xl mx-auto px-6 mb-8">
                <div className="skeleton-shimmer bg-gray-200 rounded h-7 w-64 ml-4" />
            </div>
            <div className="flex gap-6 px-6 overflow-hidden">
                {Array.from({ length: count }).map((_, i) => (
                    <div key={i} className={`flex-shrink-0 ${isCategory ? 'w-64' : 'w-56'}`}>
                        <div className={`mx-auto ${isCategory ? 'w-[200px] h-[200px] rounded-full' : 'w-[200px] h-[200px] rounded-xl'} skeleton-shimmer bg-gray-200 mb-4`} />
                        <div className={`${isCategory ? 'text-center' : ''}`}>
                            <div className={`skeleton-shimmer bg-gray-200 rounded h-4 ${isCategory ? 'w-32 mx-auto' : 'w-36'} mb-2`} />
                            {!isCategory && (
                                <div className="skeleton-shimmer bg-gray-200 rounded h-5 w-20" />
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
