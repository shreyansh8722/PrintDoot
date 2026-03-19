import axios from 'axios';

// Smart API URL: env var > production detection > localhost fallback
const getApiBaseUrl = () => {
    if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
    const host = typeof window !== 'undefined' ? window.location.hostname : '';
    if (host.includes('printdoot.com')) return 'https://api.printdoot.com/api/v1';
    return 'http://localhost:8000/api/v1';
};
const API_BASE_URL = getApiBaseUrl();

// Create axios instance with default config
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add auth interceptor
api.interceptors.request.use((config) => {
    const auth = localStorage.getItem('adminAuth');
    if (auth) {
        config.headers.Authorization = `Basic ${auth}`;
    }
    return config;
});

// Admin User Management APIs
export const adminUserAPI = {
    getUsers: (params) => api.get('/admin/users/', { params }),
    register: (data) => api.post('/users/register/', data),
    getUser: (id) => api.get(`/admin/users/${id}/`),
    updateUser: (id, data) => api.patch(`/admin/users/${id}/`, data),
    deleteUser: (id) => api.delete(`/admin/users/${id}/`),
    deactivateUser: (id) => api.post(`/admin/users/${id}/deactivate/`),
    activateUser: (id) => api.post(`/admin/users/${id}/activate/`),
    getUserStats: () => api.get('/admin/users/stats/'),
};

// Admin Catalog Management APIs
export const adminCatalogAPI = {
    // Categories
    getCategories: (params) => api.get('/admin/categories/', { params }),
    getCategory: (id) => api.get(`/admin/categories/${id}/`),
    createCategory: (data) => api.post('/admin/categories/', data),
    updateCategory: (id, data) => api.patch(`/admin/categories/${id}/`, data),
    deleteCategory: (id) => api.delete(`/admin/categories/${id}/`),
    getCategoryStats: () => api.get('/admin/categories/stats/'),

    // Subcategories
    getSubcategories: (params) => api.get('/admin/subcategories/', { params }),
    getSubcategory: (id) => api.get(`/admin/subcategories/${id}/`),
    createSubcategory: (data) => api.post('/admin/subcategories/', data),
    updateSubcategory: (id, data) => api.patch(`/admin/subcategories/${id}/`, data),
    deleteSubcategory: (id) => api.delete(`/admin/subcategories/${id}/`),

    // Products
    getProducts: (params) => api.get('/admin/products/', { params }),
    getProduct: (id) => api.get(`/admin/products/${id}/`),
    createProduct: (data) => api.post('/admin/products/', data),
    updateProduct: (id, data) => api.put(`/admin/products/${id}/`, data),
    patchProduct: (id, data) => api.patch(`/admin/products/${id}/`, data),
    deleteProduct: (id) => api.delete(`/admin/products/${id}/`),

    // Product Attributes
    getAttributes: (params) => api.get('/admin/attributes/', { params }),
    getAttribute: (id) => api.get(`/admin/attributes/${id}/`),
    createAttribute: (data) => api.post('/admin/attributes/', data),
    updateAttribute: (id, data) => api.put(`/admin/attributes/${id}/`, data),
    deleteAttribute: (id) => api.delete(`/admin/attributes/${id}/`),

    // Attribute Values
    getAttributeValues: (params) => api.get('/admin/attribute-values/', { params }),
    createAttributeValue: (data) => api.post('/admin/attribute-values/', data),
    updateAttributeValue: (id, data) => api.put(`/admin/attribute-values/${id}/`, data),
    deleteAttributeValue: (id) => api.delete(`/admin/attribute-values/${id}/`),



    // Product Images
    getProductImages: (params) => api.get('/admin/product-images/', { params }),
    createProductImage: (data) => api.post('/admin/product-images/', data),
    updateProductImage: (id, data) => api.put(`/admin/product-images/${id}/`, data),
    deleteProductImage: (id) => api.delete(`/admin/product-images/${id}/`),

    // Product Reviews
    getProductReviews: (params) => api.get('/admin/product-reviews/', { params }),
    getProductReview: (id) => api.get(`/admin/product-reviews/${id}/`),
    createProductReview: (data) => api.post('/admin/product-reviews/', data),
    updateProductReview: (id, data) => api.patch(`/admin/product-reviews/${id}/`, data),
    deleteProductReview: (id) => api.delete(`/admin/product-reviews/${id}/`),
    markReviewHelpful: (id) => api.post(`/admin/product-reviews/${id}/mark_helpful/`),

    bulkUpdateStock: (updates) => api.post('/admin/products/bulk_update_stock/', { updates }),
    getProductStats: () => api.get('/admin/products/stats/'),
};

// Admin Offers Management APIs (marquee text offers)
export const adminOffersAPI = {
    getOffers: (params) => api.get('/admin/offers/', { params }),
    getOffer: (id) => api.get(`/admin/offers/${id}/`),
    createOffer: (data) => api.post('/admin/offers/', data),
    updateOffer: (id, data) => api.patch(`/admin/offers/${id}/`, data),
    deleteOffer: (id) => api.delete(`/admin/offers/${id}/`),
};

// Admin Promo Code Management APIs
export const adminPromoCodeAPI = {
    getPromoCodes: (params) => api.get('/admin/promo-codes/', { params }),
    getPromoCode: (id) => api.get(`/admin/promo-codes/${id}/`),
    createPromoCode: (data) => api.post('/admin/promo-codes/', data),
    updatePromoCode: (id, data) => api.patch(`/admin/promo-codes/${id}/`, data),
    deletePromoCode: (id) => api.delete(`/admin/promo-codes/${id}/`),
    getStats: () => api.get('/admin/promo-codes/stats/'),
};

// Admin Orders Management APIs
export const adminOrdersAPI = {
    getOrders: (params) => api.get('/admin/orders/', { params }),
    getOrder: (id) => api.get(`/admin/orders/${id}/`),
    updateOrder: (id, data) => api.patch(`/admin/orders/${id}/`, data),
    deleteOrder: (id) => api.delete(`/admin/orders/${id}/`),
    transitionStatus: (id, data) => api.post(`/admin/orders/${id}/transition/`, data),
    getOrderStats: () => api.get('/admin/orders/stats/'),
    getRevenueChart: (params) => api.get('/admin/orders/revenue-chart/', { params }),
    getStatusChart: () => api.get('/admin/orders/status-chart/'),
};

// Admin Dashboard Analytics APIs
export const adminDashboardAPI = {
    getAnalytics: () => api.get('/admin/dashboard/analytics/'),
    getSalesOrderAnalytics: () => api.get('/admin/analytics/sales-orders/'),
    getUserAnalytics: () => api.get('/admin/analytics/users/'),
    getProductAnalytics: () => api.get('/admin/analytics/products/'),
};

// Admin Stock Management APIs
export const adminStockAPI = {
    getStockAlerts: (params) => api.get('/admin/stock-alerts/', { params }),
    bulkUpdateStock: (updates) => api.post('/admin/stock-alerts/', { updates }),
};

// Admin Marketing APIs
export const adminMarketingAPI = {
    // Campaigns
    getCampaigns: (params) => api.get('/admin/campaigns/', { params }),
    getCampaign: (id) => api.get(`/admin/campaigns/${id}/`),
    createCampaign: (data) => api.post('/admin/campaigns/', data),
    updateCampaign: (id, data) => api.patch(`/admin/campaigns/${id}/`, data),
    deleteCampaign: (id) => api.delete(`/admin/campaigns/${id}/`),
    sendCampaign: (id) => api.post(`/admin/campaigns/${id}/send/`),
    getCampaignAnalytics: (id) => api.get(`/admin/campaigns/${id}/analytics/`),
    getCampaignStats: () => api.get('/admin/campaigns/stats/'),

    // Abandoned Carts
    getAbandonedCarts: (params) => api.get('/admin/abandoned-carts/', { params }),
    sendCartReminder: (id) => api.post(`/admin/abandoned-carts/${id}/send-reminder/`),
    getAbandonedCartStats: () => api.get('/admin/abandoned-carts/stats/'),

    // Settings
    getSettings: () => api.get('/admin/marketing/settings/'),
    updateSettings: (data) => api.put('/admin/marketing/settings/', data),
};

// Admin Banner Management APIs
export const adminBannerAPI = {
    getBanners: (params) => api.get('/admin/banners/', { params }),
    getBanner: (id) => api.get(`/admin/banners/${id}/`),
    createBanner: (data) => api.post('/admin/banners/', data),
    updateBanner: (id, data) => api.patch(`/admin/banners/${id}/`, data),
    deleteBanner: (id) => api.delete(`/admin/banners/${id}/`),
    reorderBanners: (order) => api.post('/admin/banners/reorder/', { order }),
    getBannerStats: () => api.get('/admin/banners/stats/'),
};

// Admin Courier / Shipment APIs
export const adminCourierAPI = {
    getDashboard: () => api.get('/admin/courier/dashboard/'),
    trackShipment: (id) => api.get(`/admin/courier/track/${id}/`),
};

// S3 Image Upload
export const adminUploadAPI = {
    uploadImage: (file, folder = 'uploads') => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', folder);
        return api.post('/admin/upload/', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    },
};

// Auth API
export const authAPI = {
    login: (username, password) => {
        const credentials = btoa(`${username}:${password}`);
        localStorage.setItem('adminAuth', credentials);
        localStorage.setItem('adminUser', username);
        return Promise.resolve({ username });
    },
    logout: () => {
        localStorage.removeItem('adminAuth');
        localStorage.removeItem('adminUser');
    },
    isAuthenticated: () => {
        return !!localStorage.getItem('adminAuth');
    },
    getUser: () => {
        return localStorage.getItem('adminUser');
    },
};
// Offline Payments API
export const adminOfflinePaymentAPI = {
    getPayments: (params = {}) => api.get('/admin/offline-payments/', { params }),
    getPayment: (id) => api.get(`/admin/offline-payments/${id}/`),
    createPayment: (data) => api.post('/admin/offline-payments/', data),
    updatePayment: (id, data) => api.patch(`/admin/offline-payments/${id}/`, data),
    deletePayment: (id) => api.delete(`/admin/offline-payments/${id}/`),
    getStats: () => api.get('/admin/offline-payments/stats/'),
};

export default api;
