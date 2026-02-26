import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import userService from '../services/userService';

const ProtectedRoute = ({ children }) => {
    const location = useLocation();
    const isAuthenticated = userService.isAuthenticated();

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return children;
};

export default ProtectedRoute;
