import axios from 'axios';

const API_BASE_URL = 'https://api.printdoot.com/api/v1'
// const API_BASE_URL = import.meta.env.VITE_API_URL

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
    updateProductReview: (id, data) => api.put(`/admin/product-reviews/${id}/`, data),
    deleteProductReview: (id) => api.delete(`/admin/product-reviews/${id}/`),
    markReviewHelpful: (id) => api.post(`/admin/product-reviews/${id}/mark_helpful/`),

    bulkUpdateStock: (updates) => api.post('/admin/products/bulk_update_stock/', { updates }),
    getProductStats: () => api.get('/admin/products/stats/'),
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

export default api;
