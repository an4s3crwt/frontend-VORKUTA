import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { api } from './../api'; // Importamos la configuración de axios


function NearbyFlightsScanner() {
    const [location, setLocation] = useState(null);
    const [flights, setFlights] = useState([]);
    const [error, setError] = useState(null);

    useEffect(() => {
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const coords = {
                    lat: pos.coords.latitude,
                    lon: pos.coords.longitude,
                };
                setLocation(coords);
                fetchNearbyFlights(coords.lat, coords.lon);
            },
            (err) => setError("Error getting location: " + err.message)
        );
    }, []);

    const fetchNearbyFlights = async (lat, lon) => {
        try {
            const res = await api.get("/flights/nearby", {
                params: { lat, lon, radius: 100 },
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`
                }
            });
            console.log(res.data);  // Add this to see the response
            // Add index references for the new data structure
            const processedFlights = res.data.nearby_flights.map(flight => {
                // Distance is now the last element in the array
                const distance = flight[flight.length - 1];
                return [...flight, distance]; // Or restructure as needed
            });

            setFlights(processedFlights);
        } catch (e) {
            console.error(e);
            console.error(e.response?.data); // Log the response error from the backend
            setError(e.response?.data?.message || "Failed to fetch flights");

        }
    };

    return (
        <div className="p-4">
            <h2 className="text-xl font-bold mb-2">Nearby Flights</h2>
            {error && <p className="text-red-500">{error}</p>}

            {location && (
                <MapContainer
                    center={[location.lat, location.lon]}
                    zoom={7}
                    style={{ height: "400px", width: "100%", marginBottom: "20px" }}
                >
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <Marker position={[location.lat, location.lon]}>
                        <Popup>You are here</Popup>
                    </Marker>
                    {flights.map((flight, idx) => {
                        const lat = flight[6];
                        const lon = flight[5];
                        if (lat === null || lon === null) return null;
                        return (
                            <Marker key={idx} position={[lat, lon]}>
                                <Popup>
                                    <strong>{flight[1]?.trim() || "No callsign"}</strong><br />
                                    Country: {flight[2]}<br />
                                    Altitude: {Math.round(flight[7])} m<br />
                                    Speed: {Math.round(flight[9])} km/h
                                </Popup>
                            </Marker>
                        );
                    })}
                </MapContainer>
            )}

            {flights.length === 0 ? (
                <p>No flights nearby.</p>
            ) : (
                <table className="table-auto w-full border">
                    <thead>
                        <tr>
                            <th>Callsign</th>
                            <th>Country</th>
                            <th>Altitude (m)</th>
                            <th>Speed (km/h)</th>
                            <th>Lat</th>
                            <th>Lon</th>
                            <th>Distance</th>
                        </tr>
                    </thead>
                    <tbody>
                        {flights.map((flight, idx) => (
                            <tr key={idx}>
                                <td>{flight[1]?.trim()}</td>
                                <td>{flight[2]}</td>
                                <td>{Math.round(flight[7])}</td>
                                <td>{Math.round(flight[9])}</td>
                                <td>{flight[6]?.toFixed(2)}</td>
                                <td>{flight[5]?.toFixed(2)}</td>
                                <td>{flight[flight.length - 1]?.toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}

export default NearbyFlightsScanner;
