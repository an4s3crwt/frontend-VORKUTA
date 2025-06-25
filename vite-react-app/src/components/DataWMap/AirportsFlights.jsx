import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const airplaneIcon = new L.Icon({
    iconUrl: '/airplane-icon.png',
    iconSize: [25, 25]
});

function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

const AirportFlights = () => {
    const { iata } = useParams();
    const [airportData, setAirportData] = useState(null);
    const [flights, setFlights] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function fetchAirport() {
            try {
                const res = await fetch(`https://hexdb.io/api/v1/airport/iata/${iata}`);
                if (!res.ok) throw new Error('No se pudo cargar aeropuerto');
                const data = await res.json();
                setAirportData(data);
            } catch (e) {
                setError(e.message);
                setLoading(false);
            }
        }
        fetchAirport();
    }, [iata]);

    useEffect(() => {
        async function fetchFlights() {
            try {
                const res = await fetch('https://opensky-network.org/api/states/all');
                if (!res.ok) throw new Error('No se pudo cargar vuelos');
                const data = await res.json();

                // Extraemos y limpiamos callsigns únicos
                const callsigns = [...new Set(data.states.map(f => f[1]?.trim().toUpperCase()).filter(Boolean))];

                // Cache para rutas y aeropuertos
                const callsignRoutes = {};

                // Procesar cada callsign para obtener ruta y aeropuerto salida
                const airportResults = await Promise.all(
                    callsigns.map(async callsign => {
                        try {
                            const routeRes = await fetch(`https://hexdb.io/callsign-route-iata?callsign=${callsign}`);
                            if (!routeRes.ok) {
                                console.warn(`No route found for callsign ${callsign}`);
                                return null;
                            }

                            const route = await routeRes.text();
                            console.log(`Route for ${callsign}:`, route); // <--- LOG

                            const [departureIata, arrivalIata] = route.split('-');
                            if (!departureIata) {
                                console.warn(`Invalid route format for callsign ${callsign}:`, route);
                                return null;
                            }

                            const airportRes = await fetch(`https://hexdb.io/api/v1/airport/iata/${departureIata}`);
                            if (!airportRes.ok) {
                                console.warn(`No airport data for IATA ${departureIata}`);
                                return null;
                            }

                            const airportData = await airportRes.json();

                            return {
                                callsign,
                                departure: departureIata,
                                arrival: arrivalIata || '',
                                latitude: airportData.latitude || 0,
                                longitude: airportData.longitude || 0
                            };
                        } catch (e) {
                            console.error(`Error processing callsign ${callsign}:`, e);
                            return null;
                        }
                    })
                );


                // Filtramos vuelos que tengan relación con el iata o estén cerca
                const filteredFlights = data.states.filter(flight => {
                    const cs = flight[1]?.trim().toUpperCase();
                    if (!cs) return false;

                    const lat = flight[6];
                    const lon = flight[5];
                    const route = callsignRoutes[cs];

                    const matchesIATA = route && (route.departure === iata || route.arrival === iata);
                    const isNearby = lat && lon && airportData
                        ? getDistanceFromLatLonInKm(lat, lon, airportData.latitude, airportData.longitude) < 200
                        : false;

                    if (matchesIATA || isNearby) {
                        flight.route = route; // adjuntamos info de ruta para mostrar luego
                        return true;
                    }
                    return false;
                });

                setFlights(filteredFlights);
            } catch (e) {
                setError(e.message);
            } finally {
                setLoading(false);
            }
        }

        if (airportData) {
            fetchFlights();
        }
    }, [airportData, iata]);



    if (error) return <p className="text-red-600 text-center mt-6">{error}</p>;
    if (loading || !airportData) return <p className="text-center mt-6">Cargando vuelos...</p>;

    return (
        <div className="p-4 max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold mb-4">
                Vuelos activos cerca de {airportData.airport} ({iata})
            </h2>

            <MapContainer
                center={[airportData.latitude, airportData.longitude]}
                zoom={7}
                scrollWheelZoom={true}
                className="h-[400px] rounded-xl border mb-6"
            >
                <TileLayer
                    attribution='&copy; OpenStreetMap contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker
                    position={[airportData.latitude, airportData.longitude]}
                    icon={L.icon({ iconUrl: '/a1.png', iconSize: [30, 30] })}
                >
                    <Popup>{airportData.airport}</Popup>
                </Marker>

                {flights.map((flight, i) => {
                    const lat = flight[6];
                    const lon = flight[5];
                    const callsign = flight[1];
                    if (!lat || !lon) return null;
                    return (
                        <Marker key={i} position={[lat, lon]} icon={airplaneIcon}>
                            <Popup>
                                <div>
                                    <p><strong>Callsign:</strong> {callsign}</p>
                                    {flight.route && (
                                        <>
                                            <p><strong>Salida:</strong> {flight.route.departure}</p>
                                            <p><strong>Llegada:</strong> {flight.route.arrival}</p>
                                        </>
                                    )}
                                    <p><strong>Velocidad:</strong> {Math.round(flight[9] || 0)} m/s</p>
                                    <p><strong>Altitud:</strong> {Math.round(flight[7] || 0)} m</p>
                                </div>
                            </Popup>
                        </Marker>
                    );
                })}
            </MapContainer>

            <div className="mt-4">
                <h3 className="text-xl font-semibold mb-2">
                    Vuelos detectados: {flights.length}
                </h3>
                <div className="grid md:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto">
                    {flights.map((flight, i) => (
                        <div key={i} className="p-4 bg-white rounded-lg shadow border">
                            <p><strong>Callsign:</strong> {flight[1]}</p>
                            <p><strong>Velocidad:</strong> {Math.round(flight[9] || 0)} m/s</p>
                            <p><strong>Altitud:</strong> {Math.round(flight[7] || 0)} m</p>
                            {flight.route ? (
                                <>
                                    <p><strong>Salida:</strong> {flight.route.departure}</p>
                                    <p><strong>Llegada:</strong> {flight.route.arrival}</p>
                                </>
                            ) : (
                                <p className="text-gray-500 text-sm">Ruta desconocida</p>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AirportFlights;
