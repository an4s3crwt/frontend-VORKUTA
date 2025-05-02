import React from 'react';
import { api } from '../../src/api';  
import { useNavigate } from 'react-router-dom';

export default function Logout() {
    const navigate = useNavigate();  // Usamos 'useNavigate' para redirigir después del logout

    const handleLogout = async () => {
        try {
            // Hacemos la solicitud para invalidar el token en el backend
            await api.post('/logout');
            localStorage.removeItem('jwt_token'); // Eliminamos el token localmente
            navigate('/login'); // Redirigimos al login
        } catch (error) {
            console.error("Error al cerrar sesión", error);
        }
    }

    return (
        <div>
            <button onClick={handleLogout}>Cerrar sesión</button>
        </div>
    );
}
