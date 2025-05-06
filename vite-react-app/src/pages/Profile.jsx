import React, { useEffect, useState } from 'react';
import api from '../../src/api'; // Asegúrate de que este archivo de api esté configurado correctamente.

export default function Profile() {
    const [user, setUser] = useState(null);
    const [error, setError] = useState(null);
    const [savedFlights, setSavedFlights] = useState([]);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await api.get('/auth/me');
                setUser(response.data);
            } catch (error) {
                console.error(error);
                setError("Error al cargar el perfil.");
            }
        };

        const fetchSavedFlights = async () => {
            try {
                const response = await api.get('/saved-flights'); 
                setSavedFlights(response.data.saved_flights);
            } catch (error) {
                console.error(error);
                setError("Error al cargar los vuelos guardados.");
            }
        };

        fetchProfile();
        fetchSavedFlights();
    }, []); // Solo se ejecuta una vez al cargar el componente

    if (error) return <div>{error}</div>;
    if (!user) return <div>Cargando...</div>;

    return (
        <div>
            <h1>Perfil</h1>
            <p><strong>Nombre:</strong> {user.name}</p>
            <p><strong>Email:</strong> {user.email}</p>

            <h2>Vuelos Guardados</h2>
            {savedFlights.length === 0 ? (
                <p>No tienes vuelos guardados.</p>
            ) : (
                <ul>
                    {savedFlights.map((flight, index) => (
                        <li key={index}>
                            <p><strong>Vuelo ICAO:</strong> {flight.flight_icao}</p>
                            <p><strong>Detalles:</strong> {JSON.stringify(flight.flight_data)}</p>
                            <p><strong>Guardado en:</strong> {flight.saved_at}</p>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
