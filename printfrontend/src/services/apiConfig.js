import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/v1';

const apiHook = axios.create({
    baseURL: BASE_URL,
    timeout: 15000,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    }
});

// Request interceptor
apiHook.interceptors.request.use(
    (config) => {
        // Use Basic Auth credentials if available
        const credentials = localStorage.getItem('authCredentials');
        if (credentials) {
            config.headers.Authorization = `Basic ${credentials}`;
            config.withCredentials = true;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor
apiHook.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        if (error.response) {
            // Only log non-sensitive error info in development
            if (import.meta.env.DEV) {
                console.error('API Error:', error.response.status, error.response.data?.error || '');
            }
            if (error.response.status === 401) {
                // Handle unauthorized access — clear auth data
                localStorage.removeItem('authCredentials');
                localStorage.removeItem('username');
                if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
                    window.location.href = '/login';
                }
            }
            if (error.response.status === 429) {
                // Rate limited — show user-friendly message
                error.message = 'Too many requests. Please wait a moment and try again.';
            }
        } else if (error.request) {
            // Network error — don't expose details
            if (import.meta.env.DEV) {
                console.error('Network Error:', error.message);
            }
        }
        return Promise.reject(error);
    }
);

export default apiHook;
