import React, { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import {
    Chart as ChartJS,
    Title,
    Tooltip,
    Legend,
    LineElement,
    PointElement,  // Asegúrate de registrar el "point"
    CategoryScale,
    LinearScale,
} from "chart.js";
import { useAuth } from "../../context/AuthContext";
import api from "../../api";
import './../../styles/AdminMetrics.css'; // Importa el archivo CSS

// Registrar componentes de Chart.js
ChartJS.register(
    Title,
    Tooltip,
    Legend,
    LineElement,
    PointElement,  // Registro explícito de "point"
    CategoryScale,
    LinearScale
);

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
                    const response = await api.get("/admin/metrics");
                    const data = response.data;

                    setMetrics({
                        total_users: data.total_users ?? 0,
                        active_users_last_week: data.active_users_last_week ?? 0,
                        saved_flights: data.saved_flights ?? 0,
                        top_flights: data.top_flights ?? [],
                        top_airports: data.top_airports ?? [],
                    });
                } catch (error) {
                    console.error("Error fetching metrics:", error);
                }
            };

            fetchMetrics();
        }
    }, [isAuthenticated]);

    if (!isAuthenticated) {
        return <p>Please log in to view the admin metrics.</p>;
    }

    // Datos para el gráfico
    const flightData = {
        labels: (metrics.top_flights ?? []).map(flight => flight.flight_icao),
        datasets: [
            {
                label: "Top Flights",
                data: (metrics.top_flights ?? []).map(flight => flight.total),
                borderColor: "rgba(75,192,192,1)",
                fill: false,
                pointRadius: 5,  // Añadido para asegurarse de que los puntos se vean
            },
        ],
    };

    return (
        <div className="container">
            <h2>Admin Metrics</h2>
            <p>Total Users: {metrics.total_users}</p>
            <p>Active Users in the Last Week: {metrics.active_users_last_week}</p>
            <p>Saved Flights: {metrics.saved_flights}</p>

            <h3>Top 5 Flights</h3>
            <ul>
                {(metrics.top_flights ?? []).map((flight, index) => (
                    <li key={index}>
                        {flight.flight_icao} - {flight.total}
                    </li>
                ))}
            </ul>

            <h3>Top 5 Airports</h3>
            <ul>
                {(metrics.top_airports ?? []).map((airport, index) => (
                    <li key={index}>
                        {airport.from_airport_code} - {airport.total}
                    </li>
                ))}
            </ul>

            <h3>Top Flights Chart</h3>
            <div className="chart-container">
                <Line data={flightData} />
            </div>
        </div>
    );
}

export default AdminMetrics;
