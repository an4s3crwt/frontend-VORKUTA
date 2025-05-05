import { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import L from 'leaflet';
import 'leaflet-rotatedmarker';
import "leaflet/dist/leaflet.css";
import  api  from './../api';

// Custom radar station icon (BOLD VERSION)
const radarIcon = new L.Icon({
    iconUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="none" stroke="%2300ff00" stroke-width="3"/><circle cx="12" cy="12" r="6" fill="none" stroke="%2300ff00" stroke-width="3"/><circle cx="12" cy="12" r="2" fill="%2300ff00"/><line x1="12" y1="2" x2="12" y2="6" stroke="%2300ff00" stroke-width="3"/></svg>',
    iconSize: [28, 28],
    iconAnchor: [14, 14]
});

// BOLD plane icons
const createPlaneIcon = (color, heading) => {
    return new L.Icon({
        iconUrl: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}"><path d="M22,16.21V14l-8-5V3.5c0-0.83-0.67-1.5-1.5-1.5S11,2.67,11,3.5V9l-8,5v2.21l8-2.81V19l-2,1.5V22l3.5-1l3.5,1v-1.5L14,19v-5.62L22,16.21z" stroke="black" stroke-width="0.5"/></svg>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
        rotationAngle: heading || 0
    });
};

// Custom Ellipse component
const Ellipse = ({ center, radii, rotation, ...props }) => {
    const ref = useRef();

    useEffect(() => {
        if (ref.current) {
            ref.current.setLatLng(center);
            ref.current.setRadius(Math.max(...radii));
            ref.current.setStyle({
                ...props,
                transform: `rotate(${rotation}deg) scaleX(${radii[0] / radii[1]})`
            });
        }
    }, [center, radii, rotation, props]);

    return <Circle center={center} radius={1} ref={ref} {...props} />;
};

function NearbyFlightsScanner() {
    const [location, setLocation] = useState(null);
    const [flights, setFlights] = useState([]);
    const [error, setError] = useState(null);
    const [scanAngle, setScanAngle] = useState(0);
    const [alert, setAlert] = useState(null);
    const mapRef = useRef(null);
    const radarBeamRef = useRef(null);
    const audioRef = useRef(null);

    // Elliptical radar animation
    useEffect(() => {
        const interval = setInterval(() => {
            setScanAngle(prev => (prev + 1.5) % 360);
        }, 30);
        return () => clearInterval(interval);
    }, []);

    // Elliptical radar beam
    useEffect(() => {
        if (!mapRef.current || !location) return;

        if (radarBeamRef.current) {
            mapRef.current.removeLayer(radarBeamRef.current);
        }

        const a = 0.6; // Semi-major axis
        const b = 0.3; // Semi-minor axis
        const angleRad = scanAngle * Math.PI / 180;

        const beam = L.polygon([
            [location.lat, location.lon],
            [
                location.lat + a * Math.cos(angleRad - 0.15),
                location.lon + b * Math.sin(angleRad - 0.15)
            ],
            [
                location.lat + a * Math.cos(angleRad + 0.15),
                location.lon + b * Math.sin(angleRad + 0.15)
            ]
        ], {
            color: '#00ff00',
            fillColor: 'rgba(0, 255, 0, 0.3)',
            weight: 2,
            opacity: 0.8
        }).addTo(mapRef.current);

        radarBeamRef.current = beam;

        return () => {
            if (radarBeamRef.current) {
                mapRef.current.removeLayer(radarBeamRef.current);
            }
        };
    }, [scanAngle, location]);

    // Get user location and fetch flights
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

        audioRef.current = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-sonar-sweep-1494.mp3');
        audioRef.current.loop = true;
        audioRef.current.volume = 0.3;
        audioRef.current.play();

        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
        };
    }, []);

    const fetchNearbyFlights = async (lat, lon) => {
        try {
            const res = await api.get("/flights/nearby", {
                params: { lat, lon, radius: 100 },
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`
                }
            });

            const processedFlights = res.data.nearby_flights.map(flight => {
                const distance = flight[flight.length - 1];
                return [...flight, distance];
            });

            setFlights(processedFlights);
            checkForProximityAlerts(processedFlights);
        } catch (e) {
            console.error(e);
            setError(e.response?.data?.message || "Failed to fetch flights");
        }
    };

    const checkForProximityAlerts = (flights) => {
        if (flights.length === 0) return;

        const closestFlight = flights.reduce((closest, flight) => {
            const distance = flight[flight.length - 1];
            return distance < closest.distance ? { distance, flight } : closest;
        }, { distance: Infinity, flight: null });

        if (closestFlight.distance < 10) {
            setAlert({
                level: 'danger',
                message: `WARNING! Flight ${closestFlight.flight[1]?.trim()} is ${closestFlight.distance.toFixed(1)} km away!`
            });
            playAlertSound('danger');
        } else if (closestFlight.distance < 30) {
            setAlert({
                level: 'warning',
                message: `Flight ${closestFlight.flight[1]?.trim()} approaching (${closestFlight.distance.toFixed(1)} km)`
            });
            playAlertSound('warning');
        } else {
            setAlert(null);
        }
    };

    const playAlertSound = (type) => {
        const sound = new Audio(
            type === 'danger'
                ? 'https://assets.mixkit.co/sfx/preview/mixkit-alarm-digital-clock-beep-989.mp3'
                : 'https://assets.mixkit.co/sfx/preview/mixkit-sci-fi-positive-interface-beep-158.mp3'
        );
        sound.volume = 0.5;
        sound.play();
    };

    return (
        <div className="p-4 bg-black text-green-400 font-mono" style={{ textShadow: '0 0 5px #00ff00' }}>
            <h2 className="text-3xl font-extrabold mb-4 border-b-2 border-green-400 pb-2 tracking-wider">
                <span className="text-green-300">CHEMISNATION</span> | <span className="text-green-200">RICO PLANET</span>
            </h2>
            <h3 className="text-xl font-bold mb-6 text-green-300">
                LOCATIONS | CLUTTER CHRIST
            </h3>

            {error && (
                <div className="bg-red-900/50 border-l-4 border-red-500 p-3 mb-4">
                    {error}
                </div>
            )}

            {alert && (
                <div className={`p-3 mb-4 border-l-4 ${alert.level === 'danger'
                        ? 'bg-red-900/30 border-red-500 text-red-100'
                        : 'bg-yellow-900/30 border-yellow-500 text-yellow-100'
                    }`}>
                    <div className="flex items-center">
                        <span className="mr-2">🚨</span>
                        <span>{alert.message}</span>
                    </div>
                </div>
            )}

            {location && (
                <div className="relative">
                    <MapContainer
                        center={[location.lat, location.lon]}
                        zoom={9}
                        style={{ height: "600px", width: "100%", marginBottom: "20px" }}
                        whenCreated={map => mapRef.current = map}
                        className="radar-screen"
                    >
                        <TileLayer
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            className="radar-tiles"
                        />

                        {/* Elliptical range indicators */}
                        {[1.2, 0.8, 0.4].map((scale, i) => (
                            <Ellipse
                                key={i}
                                center={[location.lat, location.lon]}
                                radii={[scale * 0.6 * 100000, scale * 0.3 * 100000]}
                                rotation={scanAngle}
                                color="rgba(0, 255, 0, 0.2)"
                                weight={1}
                            />
                        ))}

                        {/* Radar station marker */}
                        <Marker position={[location.lat, location.lon]} icon={radarIcon}>
                            <Popup className="radar-popup">RADAR STATION</Popup>
                        </Marker>

                        {/* Flight markers */}
                        {flights.map((flight, idx) => {
                            const lat = flight[6];
                            const lon = flight[5];
                            if (lat === null || lon === null) return null;

                            const distance = flight[flight.length - 1];
                            const alertLevel = distance < 20 ? 'red' : distance < 50 ? 'orange' : 'green';
                            const heading = flight[10] || 0;

                            return (
                                <Marker
                                    key={idx}
                                    position={[lat, lon]}
                                    icon={createPlaneIcon(
                                        alertLevel === 'red' ? '#ff0000' :
                                            alertLevel === 'orange' ? '#ff8000' : '#00ff00',
                                        heading
                                    )}
                                   
                                >
                                    <Popup className={`radar-popup ${alertLevel}`}>
                                        <div className="text-sm">
                                            <div className="flex justify-between">
                                                <strong>{flight[1]?.trim() || "UNKNOWN"}</strong>
                                                <span>{distance.toFixed(1)} km</span>
                                            </div>
                                            <div>ALT: {Math.round(flight[7])} m</div>
                                            <div>SPD: {Math.round(flight[9])} km/h</div>
                                            <div>HDG: {heading}°</div>
                                            <div>ORG: {flight[2]}</div>
                                        </div>
                                    </Popup>
                                </Marker>
                            );
                        })}
                    </MapContainer>

                    {/* Enhanced elliptical scan effect */}
                    <div
                        className="radar-scan-overlay"
                        style={{
                            background: `radial-gradient(ellipse at center, 
                transparent 0%, 
                rgba(0, 255, 0, 0.05) 30%,
                transparent 70%)`,
                          
                        }}
                    />
                </div>
            )}

            {/* Flight data table */}
            <div className="overflow-x-auto">
                <table className="w-full border border-green-400">
                    <thead>
                        <tr className="bg-green-900/50">
                            <th className="p-2 border border-green-400">Callsign</th>
                            <th className="p-2 border border-green-400">Country</th>
                            <th className="p-2 border border-green-400">Altitude</th>
                            <th className="p-2 border border-green-400">Speed</th>
                            <th className="p-2 border border-green-400">Heading</th>
                            <th className="p-2 border border-green-400">Distance</th>
                        </tr>
                    </thead>
                    <tbody>
                        {flights.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="p-2 text-center">No flights detected</td>
                            </tr>
                        ) : (
                            flights.map((flight, idx) => (
                                <tr key={idx} className="hover:bg-green-900/10">
                                    <td className="p-2 border border-green-400">{flight[1]?.trim()}</td>
                                    <td className="p-2 border border-green-400">{flight[2]}</td>
                                    <td className="p-2 border border-green-400">{Math.round(flight[7])} m</td>
                                    <td className="p-2 border border-green-400">{Math.round(flight[9])} km/h</td>
                                    <td className="p-2 border border-green-400">{flight[10] || 0}°</td>
                                    <td className="p-2 border border-green-400">{flight[flight.length - 1]?.toFixed(2)} km</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* CSS styles */}
            <style jsx>{`
        .radar-screen {
          background-color: #000;
          border: 3px solid #00ff00;
          box-shadow: 0 0 15px rgba(0, 255, 0, 0.5);
        }
        .radar-tiles {
          filter: grayscale(100%) contrast(150%) brightness(0.5) hue-rotate(90deg);
        }
        .radar-popup {
          background: #111;
          color: #0f0;
          border: 2px solid #0f0;
          font-family: 'Courier New', monospace;
          font-weight: bold;
          text-shadow: 0 0 3px #00ff00;
        }
        .radar-popup.red {
          border-color: #f00;
          color: #f00;
        }
        .radar-popup.orange {
          border-color: #ff8000;
          color: #ff8000;
        }
        .radar-scan-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          pointer-events: none;
          z-index: 1000;
          mix-blend-mode: screen;
          transform-origin: center;
        }
      `}</style>
        </div>
    );
}

export default NearbyFlightsScanner;