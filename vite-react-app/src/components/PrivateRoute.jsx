import React from 'react';
import { Navigate } from 'react-router-dom';

const PrivateRoute = ({ element }) => {
    const token = localStorage.getItem('jwt_token'); // Verificamos si el token existe

    if (!token) {
        // Si no hay token, redirigimos al login
        return <Navigate to="/login" />;
    }

    return element; // Si hay token, mostramos el componente
};

export default PrivateRoute;
