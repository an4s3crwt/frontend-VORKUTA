import React, { useEffect, useState } from "react";
import api from "../api";

const AirportsTable = () => {
    const [airports, setAirports] = useState([]);

    useEffect(() => {
        const fetchAirports = async () => {
            try {
                const response = await api.get("/airports");
                setAirports(response.data.data); // .data because of Laravel's pagination
            } catch (error) {
                console.error("Error fetching airports:", error);
            }
        };

        fetchAirports();
    }, []);

    return (
        <div>
            <h2>Airports</h2>
            <ul>
                {airports.map((airport, i) => (
                    <li key={i}>
                        {airport.city} ({airport.iata_code}) - {airport.country}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default Airports;
