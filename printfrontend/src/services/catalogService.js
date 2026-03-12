import apiHook from './apiConfig';

const catalogService = {
    // Banners / Hero
    getBanners: async (placement) => {
        try {
            const params = placement ? { placement } : {};
            const response = await apiHook.get('/banners/', { params });
            return response.data;
        } catch (error) {
            console.error('Error fetching banners:', error);
            throw error;
        }
    },

    // Categories
    getCategories: async () => {
        try {
            const response = await apiHook.get('/categories/');
            return response.data.results || response.data;
        } catch (error) {
            console.error('Error fetching categories:', error);
            throw error;
        }
    },

    getCategoryBySlug: async (slug) => {
        try {
            // Direct slug lookup endpoint
            const response = await apiHook.get(`/categories/by-slug/${slug}/`);
            return response.data;
        } catch (directErr) {
            // Fallback: fetch all and find
            if (directErr.response?.status === 404) {
                const response = await apiHook.get('/categories/');
                const categories = response.data.results || response.data;
                return categories.find(c => c.slug === slug) || null;
            }
            console.error('Error fetching category by slug:', directErr);
            throw directErr;
        }
    },

    // Products
    getProducts: async ({ category, subcategory, featured, search, page, page_size, min_price, max_price, min_rating, ordering } = {}) => {
        try {
            const params = {};
            if (category) params.category = category;
            if (subcategory) params.subcategory = subcategory;
            if (featured) params.featured = 'true';
            if (search) params.search = search;
            if (page) params.page = page;
            if (page_size) params.page_size = page_size;
            if (min_price !== undefined && min_price !== '') params.min_price = min_price;
            if (max_price !== undefined && max_price !== '') params.max_price = max_price;
            if (min_rating !== undefined && min_rating !== '') params.min_rating = min_rating;
            if (ordering) params.ordering = ordering;

            const response = await apiHook.get('/products/', { params });
            const rawData = response.data;

            // Handle paginated or non-paginated response
            let products = [];
            let pagination = null;

            if (rawData.results) {
                // DRF PageNumberPagination response
                products = rawData.results;
                pagination = {
                    count: rawData.count || 0,
                    next: rawData.next,
                    previous: rawData.previous,
                    totalPages: Math.ceil((rawData.count || 0) / (page_size || 20)),
                    currentPage: page || 1,
                };
            } else if (Array.isArray(rawData)) {
                products = rawData;
            }

            const transformedProducts = products.map(transformProduct);

            return { products: transformedProducts, pagination };
        } catch (error) {
            console.error('Error fetching products:', error);
            throw error;
        }
    },

    getProductBySlug: async (slug) => {
        try {
            // Direct slug lookup endpoint (fastest)
            const response = await apiHook.get(`/products/by-slug/${slug}/`);
            return transformProduct(response.data);
        } catch (directErr) {
            // Fallback: search then match (if by-slug route not available)
            if (directErr.response?.status === 404 || directErr.response?.status === 500) {
                try {
                    const searchResp = await apiHook.get('/products/', { params: { search: slug } });
                    const products = searchResp.data.results || searchResp.data;
                    const product = Array.isArray(products) ? products.find(p => p.slug === slug) : null;
                    if (product) return transformProduct(product);
                } catch (searchErr) {
                    console.error('Slug search fallback failed:', searchErr);
                }
            }
            console.error('Error fetching product by slug:', directErr);
            return null;
        }
    },

    // Templates
    getTemplates: async (params = {}) => {
        try {
            const response = await apiHook.get('/templates/', { params });
            return response.data.results || response.data;
        } catch (error) {
            console.error('Error fetching templates:', error);
            throw error;
        }
    },

    // ========================================
    // Reviews
    // ========================================

    /**
     * Get reviews for a product.
     * @param {number} productId
     * @param {{ page?: number, ordering?: string }} params - ordering: 'created_at', '-created_at', 'rating', '-rating', 'helpful_count', '-helpful_count'
     */
    getProductReviews: async (productId, { page, ordering } = {}) => {
        try {
            const params = {};
            if (page) params.page = page;
            if (ordering) params.ordering = ordering;
            const response = await apiHook.get(`/products/${productId}/reviews/`, { params });
            const rawData = response.data;
            if (rawData.results) {
                return {
                    reviews: rawData.results,
                    pagination: {
                        count: rawData.count || 0,
                        next: rawData.next,
                        previous: rawData.previous,
                        totalPages: Math.ceil((rawData.count || 0) / 20),
                        currentPage: page || 1,
                    },
                };
            }
            return { reviews: Array.isArray(rawData) ? rawData : [], pagination: null };
        } catch (error) {
            console.error('Error fetching product reviews:', error);
            throw error;
        }
    },

    /**
     * Submit a review for a product (nested route).
     * @param {number} productId
     * @param {{ rating: number, title?: string, comment?: string }} reviewData
     */
    submitReview: async (productId, reviewData) => {
        try {
            const response = await apiHook.post(`/products/${productId}/reviews/`, reviewData);
            return response.data;
        } catch (error) {
            console.error('Error submitting review:', error);
            throw error;
        }
    },

    /**
     * Mark a review as helpful (increment helpful_count).
     * @param {number} reviewId
     */
    markReviewHelpful: async (reviewId) => {
        try {
            const response = await apiHook.post(`/reviews/${reviewId}/helpful/`);
            return response.data;
        } catch (error) {
            console.error('Error marking review helpful:', error);
            throw error;
        }
    },

    /**
     * Get the current user's reviews across all products.
     */
    getMyReviews: async () => {
        try {
            const response = await apiHook.get('/reviews/my/');
            return response.data.results || response.data;
        } catch (error) {
            console.error('Error fetching my reviews:', error);
            throw error;
        }
    },

    // ========================================
    // Favorites
    // ========================================

    async getFavorites() {
        try {
            const response = await apiHook.get('/favorites/');
            return response.data;
        } catch (error) {
            console.error('Error fetching favorites:', error);
            throw error;
        }
    },

    async getFavoriteIds() {
        try {
            const response = await apiHook.get('/favorites/ids/');
            return response.data.product_ids || [];
        } catch (error) {
            console.error('Error fetching favorite IDs:', error);
            return [];
        }
    },

    async toggleFavorite(productId) {
        try {
            const response = await apiHook.post('/favorites/toggle/', { product_id: productId });
            return response.data;
        } catch (error) {
            console.error('Error toggling favorite:', error);
            throw error;
        }
    },

    async removeFavorite(productId) {
        try {
            const response = await apiHook.post('/favorites/remove/', { product_id: productId });
            return response.data;
        } catch (error) {
            console.error('Error removing favorite:', error);
            throw error;
        }
    },

    // ========================================
    // New Arrivals / Trending / Recently Viewed
    // ========================================

    /**
     * Get newly added products (sorted by created_at descending).
     * GET /api/v1/products/new-arrivals/?limit=10
     */
    getNewArrivals: async (limit = 10) => {
        try {
            const response = await apiHook.get('/products/new-arrivals/', { params: { limit } });
            const products = Array.isArray(response.data) ? response.data : (response.data.results || []);
            return products.map(transformProduct);
        } catch (error) {
            console.error('Error fetching new arrivals:', error);
            return [];
        }
    },

    /**
     * Get trending / most popular products.
     * GET /api/v1/products/trending/?limit=10
     */
    getTrending: async (limit = 10) => {
        try {
            const response = await apiHook.get('/products/trending/', { params: { limit } });
            const products = Array.isArray(response.data) ? response.data : (response.data.results || []);
            return products.map(transformProduct);
        } catch (error) {
            console.error('Error fetching trending products:', error);
            return [];
        }
    },

    /**
     * Track a product view (fire-and-forget).
     * POST /api/v1/products/{id}/track-view/
     */
    trackProductView: async (productId) => {
        try {
            await apiHook.post(`/products/${productId}/track-view/`);
        } catch {
            // silent — analytics shouldn't break UX
        }
    },

    /**
     * Get products by a list of IDs (for recently viewed, etc.).
     * GET /api/v1/products/by-ids/?ids=1,2,3
     */
    getProductsByIds: async (ids) => {
        if (!ids || ids.length === 0) return [];
        try {
            const response = await apiHook.get('/products/by-ids/', { params: { ids: ids.join(',') } });
            const products = Array.isArray(response.data) ? response.data : (response.data.results || []);
            return products.map(transformProduct);
        } catch (error) {
            console.error('Error fetching products by IDs:', error);
            return [];
        }
    },
};

// Helper: Transform Backend Product -> Frontend Format
const transformProduct = (product) => {
    const primaryImage = product.primary_image || (product.images && product.images.length > 0 ? product.images[0].image : null);

    // Extract additional images
    const galleryImages = product.images ? product.images.map(img => img.image) : [];
    // Combine primary and gallery, ensuring uniqueness if primary is also in gallery
    // (Backend ProductImageSerializer has `is_primary` flag, often `primary_image` on model is just a cache or manually set)
    // Let's just use the `images` list if available, or fallback.
    const allImages = galleryImages.length > 0 ? galleryImages : (primaryImage ? [primaryImage] : []);

    return {
        id: product.id,
        title: product.name,
        slug: product.slug,
        description: product.description,
        price: `₹${product.final_price}`,
        originalPrice: product.is_on_sale && product.base_price > product.final_price
            ? `₹${product.base_price}`
            : null,
        discount: product.is_on_sale && product.discount_value
            ? (product.discount_type === 'percentage' ? `${Math.round(product.discount_value)}% off` : `₹${product.discount_value} off`)
            : null,
        image: primaryImage || "https://placehold.co/600x400?text=No+Image",
        images: allImages, // New Field for Gallery
        img: primaryImage || "https://placehold.co/600x400?text=No+Image", // Compatibility
        href: `/product/${product.slug}`,
        isFeatured: product.is_featured,
        attributes: product.attributes || [],
        subcategory: product.subcategory, // ID
        subcategory_name: product.subcategory_name, // Name
        print_specs: product.print_specs || null,
        reviews: product.reviews || [],
        rating: {
            value: product.average_rating || 0,
            count: product.review_count || 0
        },
        basePrice: Number(product.base_price || 0),
        finalPrice: Number(product.final_price || 0),
        zakeke_product_id: product.zakeke_product_id
    };
};

export default catalogService;
