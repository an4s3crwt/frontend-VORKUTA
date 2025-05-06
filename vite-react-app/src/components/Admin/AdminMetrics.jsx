import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";  // Para obtener el estado de autenticación
import api from "../../api";  // Para hacer las peticiones API

function AdminMetrics() {
    const { isAuthenticated, user } = useAuth();
    const [metrics, setMetrics] = useState({
        total_users: 0,
        active_users_last_week: 0,
        saved_flights: 0,
        top_flights: [],
        top_airports: [],
    });

    useEffect(() => {
        if (isAuthenticated) {
            const fetchMetrics = async () => {
                try {
                    const response = await api.get("/admin/metrics");  // Llamada a la API
                    setMetrics(response.data);  // Guardamos los datos obtenidos
                } catch (error) {
                    console.error("Error fetching metrics:", error);
                }
            };

            fetchMetrics();
        }
    }, [isAuthenticated]);  // Solo hacer la petición si está autenticado

    if (!isAuthenticated) {
        return <p>Please log in to view the admin metrics.</p>;
    }

    return (
        <div>
            <h2>Admin Metrics</h2>
            <p>Total Users: {metrics.total_users}</p>
            <p>Active Users in the Last Week: {metrics.active_users_last_week}</p>
            <p>Saved Flights: {metrics.saved_flights}</p>

            <h3>Top 5 Flights</h3>
            <ul>
                {metrics.top_flights.map((flight, index) => (
                    <li key={index}>{flight.flight_icao} - {flight.total}</li>
                ))}
            </ul>

            <h3>Top 5 Airports</h3>
            <ul>
                {metrics.top_airports.map((airport, index) => (
                    <li key={index}>{airport.airport} - {airport.total}</li>
                ))}
            </ul>
        </div>
    );
}

export default AdminMetrics;
