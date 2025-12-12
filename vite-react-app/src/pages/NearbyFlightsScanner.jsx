import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from "react-leaflet";
import L from 'leaflet';
import "leaflet/dist/leaflet.css";
import api from './../api';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// =============================================================================
// COMPONENTE: ESCÁNER DE PROXIMIDAD (NearbyFlightsScanner)
// -----------------------------------------------------------------------------
// Esta funcionalidad utiliza la API de Geolocalización del navegador para encontrar
// aeronaves dentro de un radio específico alrededor del usuario.
// =============================================================================

// --- CONFIGURACIÓN DE ICONOS ---
// Función auxiliar para rotar el icono del avión según su rumbo (heading).
// Si el avión va al Norte (0º), usamos d0.png. Si va al Este (90º), d90.png, etc.
const getPlaneIcon = (heading) => {
    const safeHeading = heading || 0;
    // Redondeamos al múltiplo de 45 más cercano para usar una de las 8 imágenes que tenemos.
    let snap = Math.round(safeHeading / 45) * 45;
    if (snap === 360) snap = 0;
    
    return new L.Icon({
        iconUrl: `/directions/d${snap}.png`, 
       
        iconSize: [25, 25], 
        iconAnchor: [12.5, 12.5], // Centrado perfecto
        popupAnchor: [0, -12.5],
    });
};

// Icono para la posición del usuario 
const userIcon = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/447/447031.png',
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30]
});

// --- COMPONENTE AUXILIAR: ZOOM AUTOMÁTICO ---
// Este componente invisible ajusta el zoom del mapa automáticamente
// dependiendo de si eliges 50km (zoom cerca) o 100km (zoom lejos).
function AutoMapController({ lat, lon, radius }) {
    const map = useMap();
    useEffect(() => {
        if (!lat || !lon) return;
        
        // Algoritmo  de escalado
        let targetZoom = 9; 
        if (radius >= 200) targetZoom = 8;
        if (radius >= 500) targetZoom = 6;
        if (radius >= 1000) targetZoom = 5;

        map.setView([lat, lon], targetZoom);
        
    }, [lat, lon, radius, map]);
    return null;
}

export default function NearbyFlightsScanner() {
    // --- GESTIÓN DE ESTADO Y URL ---
    const { radius } = useParams(); // Leemos el radio directamente de la URL (ej: /scanner/100)
    const navigate = useNavigate();
    
    // Si no hay radio en la URL, empezamos con 100km por defecto.
    const initialRadius = radius ? parseInt(radius) : 100;
    
    // Estados de la aplicación
    const [location, setLocation] = useState(null); // Coordenadas del usuario (GPS)
    const [flights, setFlights] = useState([]);     // Lista de aviones encontrados
    const [loading, setLoading] = useState(false);  // Spinner de carga
    const [error, setError] = useState(null);       // Mensajes de error 
    const [scanRadius, setScanRadius] = useState(initialRadius); 

    // ==========================================
    // 1. SISTEMA DE RESTAURACIÓN DE SESIÓN
    // ==========================================
    // Si el usuario escanea, hace clic en un avión, y luego
    // pulsa "Atrás", no queremos que tenga que volver a activar el GPS y escanear.
    // Recuperamos el estado anterior de la memoria 'sessionStorage'.
    useEffect(() => {
        const savedState = sessionStorage.getItem('scannerState');

        // ESCENARIO A: El usuario entra con una URL específica 
        if (radius) {
            const r = parseInt(radius);
            setScanRadius(r);
            
            // Si ya teníamos su ubicación guardada, la reutilizamos 
            if (savedState) {
                try {
                    const parsed = JSON.parse(savedState);
                    if (parsed.location) {
                        setLocation(parsed.location);
                        fetchNearbyFlights(parsed.location.lat, parsed.location.lon, r);
                        return;
                    }
                } catch(e) {}
            }
            // Si es la primera vez, pedimos permiso al GPS.
            startGpsSequence(r);
        } 
        // ESCENARIO B: Vuelve atrás sin radio en la URL 
        else if (savedState) {
            try {
                const parsed = JSON.parse(savedState);
                if (parsed.location) {
                    setLocation(parsed.location);
                    setFlights(parsed.flights || []);
                    setScanRadius(parsed.radius || 100);
                    // Actualizamos la URL  para que coincida con lo que ve
                    navigate(`/scanner/${parsed.radius || 100}`, { replace: true });
                }
            } catch (e) { 
                sessionStorage.removeItem('scannerState'); 
            }
        }
    }, [radius]); 

    // ==========================================
    // 2. GEOLOCALIZACIÓN
    // ==========================================
    const startGpsSequence = (radiusToScan) => {
        
        //si ya se sabe , no se vuelve a pedir
        if (location) {
            fetchNearbyFlights(location.lat, location.lon, radiusToScan);
            return;
        }

        setLoading(true);
        setError(null);

        if (!navigator.geolocation) {
            setError("Browser geolocation not supported.");
            setLoading(false);
            return;
        }

        // Solicitamos posición 
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const coords = { lat: pos.coords.latitude, lon: pos.coords.longitude };
                setLocation(coords);
                // En cuanto tenemos coordenadas, lanzamos la búsqueda automáticamente
                fetchNearbyFlights(coords.lat, coords.lon, radiusToScan);
            },
            (err) => {
                setLoading(false);
                setError("GPS Access denied. Please enable location.");
            },
            { enableHighAccuracy: true }
        );
    };

    // ==========================================
    // 3. COMUNICACIÓN CON EL BACKEND
    // ==========================================
    const fetchNearbyFlights = async (lat, lon, r) => {
        setLoading(true);
        setError(null);
        
        try {
            // Petición al servidor: "Dame aviones a X km de estas coordenadas"
            const res = await api.get("/flights/nearby", {
                params: { lat, lon, radius: r } 
            });
            
            const foundFlights = res.data.nearby_flights || [];
            setFlights(foundFlights);
            
            // Guardamos el resultado en memoria por si el usuario navega fuera
            const stateToSave = { location: { lat, lon }, flights: foundFlights, radius: r };
            sessionStorage.setItem('scannerState', JSON.stringify(stateToSave));

        } catch (e) {
            console.error(e);
            setError("Connection failed.");
        } finally {
            setLoading(false);
        }
    };

    // --- MANEJADORES DE INTERACCIÓN  ---
    
    // Al cambiar el radio en el selector
    const handleRadiusChange = (e) => {
        const newRadius = parseInt(e.target.value);
        setScanRadius(newRadius);
        // Cambiar la URL dispara el useEffect principal, que a su vez dispara el fetch.
        navigate(`/scanner/${newRadius}`);
    };

    // Al hacer clic en un avión de la lista o mapa
    const handleFlightClick = (icao) => {
        // Guardamos el estado actual antes de irnos para poder volver exactamente aquí
        const stateToSave = { location, flights, radius: scanRadius };
        sessionStorage.setItem('scannerState', JSON.stringify(stateToSave));
        navigate(`/airport/${icao}`);
    };


    // ==========================================
    // 4. RENDERIZADO 
    // ==========================================
    
    // VISTA A: PANTALLA PRINCIPAL (Sin ubicación todavía)
    // Muestra un selector grande y un botón para iniciar.
    if (!location && !loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] bg-gray-50 dark:bg-gray-900 p-4">
                <div className="bg-white dark:bg-gray-800 p-10 rounded-3xl shadow-xl max-w-lg w-full border border-gray-100 dark:border-gray-700 text-center transition-all hover:shadow-2xl">
                    <div className="w-24 h-24 bg-blue-50 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                        <i className="fa fa-radar text-5xl text-blue-500"></i>
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Airspace Scanner</h2>
                    <p className="text-gray-500 mb-8">Select scanning range and activate radar.</p>

                    {/* Selector de Radio */}
                    <div className="mb-6 text-left">
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">Scan Radius</label>
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
                    </div>

                    {/* Mensajes de error  */}
                    {error && <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl font-bold">{error}</div>}

                    <button 
                        onClick={() => navigate(`/scanner/${scanRadius}`)}
                        className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-lg shadow-lg transition-all"
                    >
                        Start Radar
                    </button>
                </div>
            </div>
        );
    }

    // VISTA B: RADAR ACTIVO (Mapa + Lista lateral)
    return (
        <div className="flex flex-col h-[calc(100vh-64px)] bg-gray-50 dark:bg-gray-900">
            
            {/* BARRA SUPERIOR (HEADER) */}
            <div className="bg-white dark:bg-gray-800 p-3 shadow-sm border-b border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row justify-between items-center gap-3 z-10">
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    {/* Indicador de "Vivo" (Punto verde/amarillo) */}
                    <div className={`w-2 h-2 rounded-full ${loading ? 'bg-yellow-400 animate-pulse' : 'bg-green-500'}`}></div>
                    <div>
                        <h1 className="text-lg font-bold text-gray-900 dark:text-white leading-none">Live Radar</h1>
                        <p className="text-[10px] text-gray-500 font-mono mt-0.5">{flights.length} TARGETS • {scanRadius} KM</p>
                    </div>
                </div>

                {/* Controles Rápidos (Cambiar radio / Refrescar) */}
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
                        onClick={() => fetchNearbyFlights(location.lat, location.lon, scanRadius)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition shadow-sm"
                    >
                        <i className={`fa fa-refresh ${loading ? 'fa-spin' : ''}`}></i>
                    </button>
                </div>
            </div>

            {/* CONTENIDO PRINCIPAL ( Lista | Mapa) */}
            <div className="flex-1 flex flex-col md:flex-row relative overflow-hidden">
                
                {/* 1. LISTA LATERAL  */}
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
                                const dist = flight[flight.length - 1]; // La API nos devuelve la distancia en el último campo
                                return (
                                    <div 
                                        key={idx} 
                                        onClick={() => handleFlightClick(flight[0])} 
                                        className="p-4 hover:bg-blue-50 dark:hover:bg-gray-700 cursor-pointer transition flex justify-between items-center group"
                                    >
                                        <div>
                                            <h3 className="font-bold text-gray-900 dark:text-white text-lg">{flight[1]?.trim() || "UNK"}</h3>
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

                {/* 2. MAPA INTERACTIVO */}
                <div className="flex-1 relative bg-gray-100">
                    {location && (
                        <MapContainer center={[location.lat, location.lon]} zoom={9} style={{ height: "100%", width: "100%" }}>
                            <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                            
                            {/* Controlador invisible de Zoom */}
                            <AutoMapController lat={location.lat} lon={location.lon} radius={scanRadius} />
                            
                            {/* Círculo visual del radio de escaneo */}
                            <Circle 
                                center={[location.lat, location.lon]} 
                                radius={scanRadius * 1000} // Leaflet usa metros
                                pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.05, dashArray: '10, 10', weight: 1 }} 
                            />
                            
                            {/* Marcador del Usuario */}
                            <Marker position={[location.lat, location.lon]} icon={userIcon}>
                                <Popup><div className="text-center font-bold">YOU</div></Popup>
                            </Marker>

                            {/* Marcadores de Aviones */}
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