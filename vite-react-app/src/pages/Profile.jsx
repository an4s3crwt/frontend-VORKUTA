
import React, { useEffect, useState } from 'react';
import { api } from '../../src/api';  // Asegúrate de importar axios correctamente

export default function Profile() {
    const [user, setUser] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await api.get('/me'); // Hacemos la solicitud GET a la ruta de perfil
                setUser(response.data); // Guardamos la respuesta
            } catch (error) {
                setError("Error al cargar el perfil.");
            }
        };

        fetchProfile();
    }, []); // Solo ejecutamos esto una vez al montar el componente

    if (error) {
        return <div>{error}</div>;
    }

    if (!user) {
        return <div>Loading...</div>;
    }

    return (
        <div>
            <h1>Perfil</h1>
            <p>Nombre: {user.name}</p>
            <p>Email: {user.email}</p>
        </div>
    );
}
