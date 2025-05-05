import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';  // Asegúrate de tener este hook configurado

export const PrivateRoute = ({ children }) => {
    const { user } = useAuth();  // Ahora usamos el contexto de Firebase

    if (!user) {
        return <Navigate to="/login" />;
    }

    return children;
};
