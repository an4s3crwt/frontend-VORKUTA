import React, { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import { Chart as ChartJS, Title, Tooltip, Legend, LineElement, CategoryScale, LinearScale } from "chart.js";
import { useAuth } from "../../context/AuthContext";
import api from "../../api";

ChartJS.register(Title, Tooltip, Legend, LineElement, CategoryScale, LinearScale);

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
                    setMetrics(response.data);
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

    // Data for the chart
    const flightData = {
        labels: metrics.top_flights.map(flight => flight.flight_icao),
        datasets: [
            {
                label: "Top Flights",
                data: metrics.top_flights.map(flight => flight.total),
                borderColor: "rgba(75,192,192,1)",
                fill: false,
            },
        ],
    };

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
                    <li key={index}>{airport.from_airport_code} - {airport.total}</li>
                ))}
            </ul>

            <h3>Top Flights Chart</h3>
            <Line data={flightData} />
        </div>
    );
}

export default AdminMetrics;
