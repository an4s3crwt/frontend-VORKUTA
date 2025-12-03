import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from "react-leaflet";
import L from 'leaflet';
import "leaflet/dist/leaflet.css";
import api from '../api';
import { useNavigate, useParams } from 'react-router-dom'; // 👈 Importamos useParams

// --- CONFIGURACIÓN DE ICONOS ---
const getPlaneIcon = (heading) => {
    const safeHeading = heading || 0;
    let snap = Math.round(safeHeading / 45) * 45;
    if (snap === 360) snap = 0;
    return new L.Icon({
        iconUrl: `/directions/d${snap}.png`, 
        iconSize: [25, 25], 
        iconAnchor: [12.5, 12.5],
        popupAnchor: [0, -12.5],
    });
};

const userIcon = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/447/447031.png',
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -36]
});

// Controlador de Zoom Automático
function AutoMapController({ lat, lon, radius }) {
    const map = useMap();
    useEffect(() => {
        if (!lat || !lon) return;
        let targetZoom = 9; 
        if (radius >= 200) targetZoom = 8;
        if (radius >= 500) targetZoom = 6;
        if (radius >= 1000) targetZoom = 5;

        map.setView([lat, lon], targetZoom);
    }, [lat, lon, radius, map]);
    return null;
}

export default function NearbyFlightsScanner() {
    const { radius } = useParams(); // 👈 LEEMOS EL RADIO DE LA URL
    const navigate = useNavigate();
    
    // Estado inicial basado en la URL (Si hay radio en URL, lo usamos, si no, null)
    const initialRadius = radius ? parseInt(radius) : 100;
    const [isMapActive, setIsMapActive] = useState(!!radius); // Si hay radio en URL, mostramos mapa directo

    const [location, setLocation] = useState(null);
    const [flights, setFlights] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [scanRadius, setScanRadius] = useState(initialRadius); 

    // === 1. EFECTO DE INICIO (Si entras con URL directa) ===
    useEffect(() => {
        // Si la URL tiene radio (ej: /scanner/300), iniciamos escaneo automático
        if (radius) {
            setIsMapActive(true);
            setScanRadius(parseInt(radius));
            // Iniciamos GPS automáticamente
            startGpsSequence(parseInt(radius));
        }
    }, [radius]); // Se ejecuta al cambiar la URL

    // === 2. SECUENCIA GPS Y FETCH ===
    const startGpsSequence = (radiusToScan) => {
        setLoading(true);
        setError(null);

        if (!navigator.geolocation) {
            setError("Browser not supported.");
            setLoading(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const coords = { lat: pos.coords.latitude, lon: pos.coords.longitude };
                setLocation(coords);
                fetchNearbyFlights(coords.lat, coords.lon, radiusToScan);
            },
            (err) => {
                setLoading(false);
                setError("⚠️ Access denied. Please enable GPS.");
            },
            { enableHighAccuracy: true }
        );
    };

    // === 3. FUNCIÓN DE INICIO MANUAL (Botón "Start Radar") ===
    const handleStartClick = () => {
        // Cambiamos la URL. Esto disparará el useEffect de arriba o cambiará la vista.
        navigate(`/scanner/${scanRadius}`);
        setIsMapActive(true);
        startGpsSequence(scanRadius);
    };

    // === 4. FETCH API ===
    const fetchNearbyFlights = async (lat, lon, r) => {
        setLoading(true);
        try {
            const res = await api.get("/flights/nearby", {
                params: { lat, lon, radius: r } 
            });
            setFlights(res.data.nearby_flights || []);
        } catch (e) {
            console.error(e);
            setError("Connection failed.");
        } finally {
            setLoading(false);
        }
    };

    // === 5. CAMBIO DE RADIO (Combobox) ===
    const handleRadiusChange = (e) => {
        const newRadius = parseInt(e.target.value);
        setScanRadius(newRadius);
        
        // 🚀 AL CAMBIAR RADIO, CAMBIAMOS URL
        navigate(`/scanner/${newRadius}`); 
        
        // Si ya tenemos ubicación, refrescamos datos
        if (location) {
            fetchNearbyFlights(location.lat, location.lon, newRadius);
        }
    };

    // === MEMORIA PARA IR AL DETALLE Y VOLVER ===
    const handleFlightClick = (icao) => {
        // Guardamos estado antes de irnos (opcional si confías en la URL)
        // Pero la URL no guarda la Lat/Lon exacta, así que SessionStorage sigue siendo útil para velocidad
        const stateToSave = { location, flights, radius: scanRadius };
        sessionStorage.setItem('scannerState', JSON.stringify(stateToSave));
        navigate(`/airport/${icao}`);
    };
    
    // Restaurar sesión al volver (si no hay URL params que manden)
    useEffect(() => {
        if (!radius) { // Solo si estamos en /scanner base
            const savedState = sessionStorage.getItem('scannerState');
            if (savedState) {
                try {
                    const parsed = JSON.parse(savedState);
                    if (parsed.radius) {
                        // Si hay memoria, restauramos URL
                        navigate(`/scanner/${parsed.radius}`);
                    }
                } catch(e) {}
            }
        }
    }, []);


    // ============================================================
    // VISTA 1: LANDING PAGE (/scanner)
    // ============================================================
    if (!isMapActive && !radius) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] bg-gray-50 dark:bg-gray-900 p-4">
                <div className="bg-white dark:bg-gray-800 p-10 rounded-3xl shadow-xl max-w-lg w-full border border-gray-100 dark:border-gray-700 text-center transition-all hover:shadow-2xl">
                    <div className="relative w-24 h-24 mx-auto mb-6">
                        <div className="absolute inset-0 bg-blue-100 dark:bg-blue-900/30 rounded-full animate-ping opacity-75"></div>
                        <div className="relative w-24 h-24 bg-blue-50 dark:bg-blue-900/50 rounded-full flex items-center justify-center border border-blue-100 dark:border-blue-800">
                            <i className="fa fa-location-arrow text-4xl text-blue-600 dark:text-blue-400"></i>
                        </div>
                    </div>
                    
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">Local Airspace</h1>
                    <p className="text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">
                        Scan your surroundings for active flights using your current GPS location.
                    </p>

                    <div className="mb-6 text-left">
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">Scanning Range</label>
                        <div className="relative">
                            <select 
                                value={scanRadius} 
                                onChange={(e) => setScanRadius(Number(e.target.value))}
                                className="w-full p-4 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white font-medium appearance-none focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer transition"
                            >
                                <option value="50">50 km (City)</option>
                                <option value="100">100 km (Local)</option>
                                <option value="300">300 km (Regional)</option>
                                <option value="500">500 km (Wide)</option>
                                <option value="1000">1000 km (National)</option>
                            </select>
                            <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-500">
                                <i className="fa fa-chevron-down"></i>
                            </div>
                        </div>
                    </div>

                    {error && <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 rounded-xl text-sm font-medium border border-red-100 dark:border-red-800 flex items-center gap-3 text-left"><i className="fa fa-exclamation-circle text-xl"></i>{error}</div>}

                    <button 
                        onClick={handleStartClick}
                        disabled={loading}
                        className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-lg shadow-lg shadow-blue-200 dark:shadow-none transition-all transform active:scale-95 flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {loading ? <><i className="fa fa-circle-o-notch fa-spin"></i> Processing...</> : <><i className="fa fa-radar"></i> Activate Radar</>}
                    </button>
                    
                    <p className="mt-6 text-xs text-gray-400"><i className="fa fa-lock mr-1"></i> Location data is only used locally.</p>
                </div>
            </div>
        );
    }

    // ============================================================
    // VISTA 2: MAPA ACTIVO (/scanner/:radius)
    // ============================================================
    return (
        <div className="flex flex-col h-[calc(100vh-64px)] bg-gray-50 dark:bg-gray-900">
            <div className="bg-white dark:bg-gray-800 p-3 shadow-sm border-b border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row justify-between items-center gap-3 z-10">
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className={`w-2 h-2 rounded-full ${loading ? 'bg-yellow-400 animate-pulse' : 'bg-green-500'}`}></div>
                    <div>
                        <h1 className="text-lg font-bold text-gray-900 dark:text-white leading-none">Live Radar</h1>
                        <p className="text-[10px] text-gray-500 font-mono mt-0.5">{flights.length} TARGETS • {scanRadius} KM</p>
                    </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <select 
                        value={scanRadius}
                        onChange={handleRadiusChange}
                        className="flex-1 sm:flex-none bg-gray-100 dark:bg-gray-700 border-none rounded-lg px-3 py-2 text-sm font-bold text-gray-700 dark:text-white cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition outline-none"
                    >
                        <option value="50">50 KM</option>
                        <option value="100">100 KM</option>
                        <option value="300">300 KM</option>
                        <option value="500">500 KM</option>
                        <option value="1000">1000 KM</option>
                    </select>

                    <button 
                        onClick={() => location && fetchNearbyFlights(location.lat, location.lon, scanRadius)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition shadow-sm"
                    >
                        <i className={`fa fa-refresh ${loading ? 'fa-spin' : ''}`}></i>
                    </button>
                </div>
            </div>

            <div className="flex-1 flex flex-col md:flex-row relative overflow-hidden">
                <div className="w-full md:w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-y-auto z-20 shadow-xl">
                    {flights.length === 0 ? (
                        <div className="p-10 text-center text-gray-500 flex flex-col items-center justify-center h-full">
                            {loading ? (
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
                            ) : (
                                <>
                                    <i className="fa fa-search text-4xl mb-3 text-gray-300"></i>
                                    <p>No flights in {scanRadius}km.</p>
                                    <p className="text-xs mt-2 text-blue-500">Try increasing the radius ↗</p>
                                </>
                            )}
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100 dark:divide-gray-700">
                            {flights.map((flight, idx) => {
                                const dist = flight[flight.length - 1];
                                return (
                                    <div 
                                        key={idx} 
                                        onClick={() => handleFlightClick(flight[0])} 
                                        className="p-4 hover:bg-blue-50 dark:hover:bg-gray-700 cursor-pointer transition flex justify-between items-center group"
                                    >
                                        <div>
                                            <h3 className="font-bold text-gray-900 dark:text-white text-lg">{flight[1]?.trim() || "UNK"}</h3>
                                            <p className="text-xs text-gray-500 font-mono">{flight[2]}</p>
                                            <div className="flex gap-3 mt-1 text-xs font-mono text-gray-500">
                                                <span><i className="fa fa-arrow-up"></i> {Math.round(flight[7] * 3.28)}ft</span>
                                                <span><i className="fa fa-tachometer"></i> {Math.round(flight[9]*3.6)}km/h</span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                                                {dist.toFixed(0)} km
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="flex-1 relative bg-gray-100">
                    {location && (
                        <MapContainer center={[location.lat, location.lon]} zoom={9} style={{ height: "100%", width: "100%" }}>
                            <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                            <AutoMapController lat={location.lat} lon={location.lon} radius={scanRadius} />
                            <Circle center={[location.lat, location.lon]} radius={scanRadius * 1000} pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.05, dashArray: '10, 10', weight: 1 }} />
                            <Marker position={[location.lat, location.lon]} icon={userIcon}>
                                <Popup><div className="text-center font-bold">YOU</div></Popup>
                            </Marker>
                            {flights.map((flight, idx) => (
                                <Marker 
                                    key={idx} 
                                    position={[flight[6], flight[5]]} 
                                    icon={getPlaneIcon(flight[10])}
                                    eventHandlers={{ click: () => handleFlightClick(flight[0]) }}
                                >
                                    <Popup>
                                        <div className="text-center font-sans">
                                            <strong>{flight[1]?.trim()}</strong><br/>
                                            {Math.round(flight[7]*3.28)} ft
                                        </div>
                                    </Popup>
                                </Marker>
                            ))}
                        </MapContainer>
                    )}
                </div>
            </div>
        </div>
    );
}