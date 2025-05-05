// src/pages/Logout.jsx
import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { logout } from '../redux/authSlice'; // Acción para logout
import { useNavigate } from 'react-router-dom';

const Logout = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    useEffect(() => {
        // Despachar la acción logout para limpiar el estado
        dispatch(logout());
        // Redirigir al login después de cerrar sesión
        navigate('/login');
    }, [dispatch, navigate]);

    return <div>Logging out...</div>;
};

export default Logout;
