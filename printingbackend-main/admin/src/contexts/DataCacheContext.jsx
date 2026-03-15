import React, { createContext, useState, useContext, useCallback, useRef } from 'react';
import { adminUserAPI, adminCatalogAPI } from '../services/api';

const DataCacheContext = createContext(null);

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const DataCacheProvider = ({ children }) => {
    const cacheRef = useRef({
        users: { data: null, timestamp: null, loading: false },
        products: { data: null, timestamp: null, loading: false },
        categories: { data: null, timestamp: null, loading: false },
        subcategories: { data: null, timestamp: null, loading: false },
    });

    const [, forceUpdate] = useState({});

    const isCacheValid = (timestamp) => {
        if (!timestamp) return false;
        return Date.now() - timestamp < CACHE_DURATION;
    };

    const fetchUsers = useCallback(async (params = {}, forceRefresh = false) => {
        const cacheKey = 'users';
        const currentCache = cacheRef.current[cacheKey];

        // Return cached data if valid and not forcing refresh
        if (!forceRefresh && isCacheValid(currentCache.timestamp) && currentCache.data) {
            console.log('📦 Loading users from cache');
            return { data: currentCache.data, fromCache: true };
        }

        // Set loading state
        cacheRef.current[cacheKey].loading = true;
        forceUpdate({});

        try {
            const response = await adminUserAPI.getUsers(params);
            const data = response.data || [];

            cacheRef.current[cacheKey] = {
                data,
                timestamp: Date.now(),
                loading: false
            };
            forceUpdate({});

            return { data, fromCache: false };
        } catch (error) {
            cacheRef.current[cacheKey].loading = false;
            forceUpdate({});
            throw error;
        }
    }, []);

    const fetchProducts = useCallback(async (params = {}, forceRefresh = false) => {
        const cacheKey = 'products';
        const currentCache = cacheRef.current[cacheKey];

        if (!forceRefresh && isCacheValid(currentCache.timestamp) && currentCache.data) {
            console.log('📦 Loading products from cache');
            return { data: currentCache.data, fromCache: true };
        }

        cacheRef.current[cacheKey].loading = true;
        forceUpdate({});

        try {
            const response = await adminCatalogAPI.getProducts(params);
            const data = response.data || [];

            cacheRef.current[cacheKey] = {
                data,
                timestamp: Date.now(),
                loading: false
            };
            forceUpdate({});

            return { data, fromCache: false };
        } catch (error) {
            cacheRef.current[cacheKey].loading = false;
            forceUpdate({});
            throw error;
        }
    }, []);

    const fetchCategories = useCallback(async (params = {}, forceRefresh = false) => {
        const cacheKey = 'categories';
        const currentCache = cacheRef.current[cacheKey];

        if (!forceRefresh && isCacheValid(currentCache.timestamp) && currentCache.data) {
            console.log('📦 Loading categories from cache');
            return { data: currentCache.data, fromCache: true };
        }

        cacheRef.current[cacheKey].loading = true;
        forceUpdate({});

        try {
            const response = await adminCatalogAPI.getCategories(params);
            const data = response.data || [];

            cacheRef.current[cacheKey] = {
                data,
                timestamp: Date.now(),
                loading: false
            };
            forceUpdate({});

            return { data, fromCache: false };
        } catch (error) {
            cacheRef.current[cacheKey].loading = false;
            forceUpdate({});
            throw error;
        }
    }, []);

    const fetchSubcategories = useCallback(async (params = {}, forceRefresh = false) => {
        const cacheKey = 'subcategories';
        const currentCache = cacheRef.current[cacheKey];

        if (!forceRefresh && isCacheValid(currentCache.timestamp) && currentCache.data) {
            console.log('📦 Loading subcategories from cache');
            return { data: currentCache.data, fromCache: true };
        }

        cacheRef.current[cacheKey].loading = true;
        forceUpdate({});

        try {
            const response = await adminCatalogAPI.getSubcategories(params);
            const data = response.data || [];

            cacheRef.current[cacheKey] = {
                data,
                timestamp: Date.now(),
                loading: false
            };
            forceUpdate({});

            return { data, fromCache: false };
        } catch (error) {
            cacheRef.current[cacheKey].loading = false;
            forceUpdate({});
            throw error;
        }
    }, []);

    const invalidateCache = useCallback((keys = []) => {
        if (keys.length === 0) {
            // Clear all cache
            cacheRef.current = {
                users: { data: null, timestamp: null, loading: false },
                products: { data: null, timestamp: null, loading: false },
                categories: { data: null, timestamp: null, loading: false },
                subcategories: { data: null, timestamp: null, loading: false },
            };
        } else {
            // Clear specific cache keys
            keys.forEach(key => {
                cacheRef.current[key] = { data: null, timestamp: null, loading: false };
            });
        }
        forceUpdate({});
    }, []);

    const value = {
        fetchUsers,
        fetchProducts,
        fetchCategories,
        fetchSubcategories,
        invalidateCache,
        isLoading: (key) => cacheRef.current[key]?.loading || false,
    };

    return (
        <DataCacheContext.Provider value={value}>
            {children}
        </DataCacheContext.Provider>
    );
};

export const useDataCache = () => {
    const context = useContext(DataCacheContext);
    if (!context) {
        throw new Error('useDataCache must be used within DataCacheProvider');
    }
    return context;
};