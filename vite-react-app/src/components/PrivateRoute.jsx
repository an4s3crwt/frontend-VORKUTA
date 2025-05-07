import React from 'react';
import { Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';  

export const PrivateRoute = ({ children, adminOnly = false }) => {
    const { isAuthenticated, isAdmin } = useAuth();  // Access authentication and admin status

    // If not authenticated, redirect to login
    if (!isAuthenticated) {
        return <Navigate to="/login" />;
    }

    // If it's an admin-only route, but the user is not an admin, redirect to the home page or another suitable page
    if (adminOnly && !isAdmin) {
        return <Navigate to="/" />;  // Redirect to the home page if not admin, or you can specify another route
    }

    // If authenticated and admin status matches, render the children (protected route content)
    return children;
};
