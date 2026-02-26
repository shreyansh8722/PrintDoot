import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check if user is already logged in
        const savedAuth = localStorage.getItem('adminAuth');
        const savedUser = localStorage.getItem('adminUser');

        if (savedAuth && savedUser) {
            setIsAuthenticated(true);
            setUser(savedUser);
        }
        setLoading(false);
    }, []);

    const login = (username, password) => {
        try {
            const credentials = btoa(`${username}:${password}`);
            localStorage.setItem('adminAuth', credentials);
            localStorage.setItem('adminUser', username);
            setIsAuthenticated(true);
            setUser(username);
            return { success: true };
        } catch (error) {
            return { success: false, error: 'Login failed' };
        }
    };

    const logout = () => {
        localStorage.removeItem('adminAuth');
        localStorage.removeItem('adminUser');
        setIsAuthenticated(false);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated, user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};
