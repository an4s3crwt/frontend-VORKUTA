import { Icon } from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useState, useRef } from "react"; // Añadimos useRef
import { MapContainer, Marker, Popup, TileLayer, useMapEvents } from "react-leaflet";
import { useParams } from "react-router-dom";
import PreferencesPanel from "../../components/PreferencesPanel";
import { CACHE_KEYS, MAP_THEMES } from "../../constants/map";
import useCache from "../../hooks/useCache";
import { useUserPreferences } from "../../hooks/useUserPreferences";
import api from './../../api';
import "./FlightList.css";
import InfoPopup from "./InfoPopup";

// --- 1. COMPONENTE PARA CONTROLAR LA CÁMARA ---
// Este componente restaura la posición del mapa si volvemos de otra página
const MapController = ({ onBoundsChange, initialCenter, initialZoom }) => {
    const map = useMapEvents({
        moveend: (e) => onBoundsChange(e.target.getBounds(), e.target.getCenter(), e.target.getZoom()),
        zoomend: (e) => onBoundsChange(e.target.getBounds(), e.target.getCenter(), e.target.getZoom()),
    });

    // Restaurar vista al montar, si tenemos datos guardados
    useEffect(() => {
        if (initialCenter && initialZoom) {
            map.setView(initialCenter, initialZoom);
        }
    }, []); // Solo al inicio

    return null;
};

function FlightList() {
    // --- 2. CONFIGURACIÓN ---
    const { getFromCache, setToCache } = useCache(); // Necesitamos GET y SET
    const { infoSlug } = useParams(); 
    const { preferences } = useUserPreferences(); 

    // --- 3. ESTADOS ---
    // Intentamos cargar datos antiguos de la memoria caché al iniciar
    const cachedData = getFromCache(CACHE_KEYS.FLIGHT_DATA);
    const cachedView = getFromCache('MAP_VIEW_STATE'); // Nueva clave para guardar posición

    const [liveData, setLiveData] = useState(cachedData || null);
    const [mapBounds, setMapBounds] = useState(null);
    
    // Estado para guardar la vista actual (centro y zoom)
    const [viewState, setViewState] = useState(cachedView || { center: [37, 20], zoom: 5 });

    const [filters, setFilters] = useState(preferences?.filters || { airlineCode: "", country: "" });
    const [theme, setTheme] = useState(preferences?.theme || "light"); 
    const [showPreferences, setShowPreferences] = useState(false);
    const [backLink, setBackLink] = useState(""); 
    
    // Si tenemos caché, NO estamos cargando al principio
    const [isLoading, setIsLoading] = useState(!cachedData); 
    const [error, setError] = useState(null);

    // Referencia para evitar recargas infinitas al volver
    const isFirstLoad = useRef(true);

    // --- 4. SINCRONIZACIÓN URL ---
    useEffect(() => {
        if (infoSlug) setFilters(prev => ({ ...prev, airlineCode: infoSlug }));
        setBackLink(infoSlug ? "../" : "");
    }, [infoSlug]);

    // --- 5. FUNCIÓN DE GUARDADO DE VISTA ---
    // Cada vez que movemos el mapa, guardamos la posición
    const handleMapChange = (bounds, center, zoom) => {
        setMapBounds(bounds);
        const newView = { center, zoom };
        setViewState(newView);
        setToCache('MAP_VIEW_STATE', newView); // Guardamos posición para la vuelta
    };

    // --- 6. MOTOR DE DATOS ---
    useEffect(() => {
        const fetchLiveData = async () => {
            if (!mapBounds) return;

            // Si acabamos de volver y ya tenemos datos recientes (menos de 60s), NO recargamos
            const lastFetch = getFromCache(CACHE_KEYS.LAST_FETCH);
            const now = Date.now();
            if (isFirstLoad.current && liveData && lastFetch && (now - lastFetch < 60000)) {
                isFirstLoad.current = false;
                setIsLoading(false);
                return; // ¡Salimos! Usamos lo que ya hay.
            }
            
            isFirstLoad.current = false; // Ya hemos pasado la carga inicial
            setIsLoading(true);

            try {
                const response = await api.get('/opensky/states', {
                    params: {
                        lamin: mapBounds.getSouth(),
                        lamax: mapBounds.getNorth(),
                        lomin: mapBounds.getWest(),
                        lomax: mapBounds.getEast(),
                    }
                });

                const validStates = response.data.states?.filter(f => f[5] && f[6]) || [];
                const limitedFlights = { time: response.data.time, states: validStates.slice(0, 1000) };
                
                // Actualizamos caché
                setToCache(CACHE_KEYS.FLIGHT_DATA, limitedFlights);
                setToCache(CACHE_KEYS.LAST_FETCH, Date.now());
                
                setLiveData(limitedFlights);
                setError(null);
            } catch (err) {
                console.error("Error API:", err);
                // Si falla, intentamos usar caché antigua si existe
                if (!liveData) setError("Error de conexión");
            } finally { 
                setIsLoading(false);
            }
        };

        // Debounce: Esperamos 500ms después de mover el mapa antes de pedir datos
        // Esto evita peticiones masivas mientras arrastras
        const timeoutId = setTimeout(() => {
            fetchLiveData();
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [mapBounds]); // Se dispara al mover mapa

    // --- REFRESCO AUTOMÁTICO (Cada 30s) ---
    useEffect(() => {
        const interval = setInterval(() => {
            // Forzamos actualización silenciosa
            setMapBounds(prev => { if(prev) return prev; return null; }); 
        }, 30000);
        return () => clearInterval(interval);
    }, []);


    // --- 7. FILTRADO ---
    const filteredFlights = liveData?.states?.filter(f => {
        const callsign = (f[1] || "").trim();
        const originCountry = (f[2] || "").trim();
        if (filters.airlineCode && !callsign.startsWith(filters.airlineCode.toUpperCase())) return false;
        if (filters.country && !originCountry.toLowerCase().includes(filters.country.toLowerCase())) return false;
        return true;
    });

    return (
        <div className="flights-container rounded-xl">
            {isLoading && (
                <div className="absolute top-4 right-4 z-50 flex items-center space-x-3 bg-white/90 backdrop-blur-md px-4 py-2 rounded-2xl shadow-lg animate-fadeIn">
                    <div className="w-6 h-6 border-4 border-gray-300 border-t-black rounded-full animate-spin"></div>
                    <span className="text-gray-800 font-semibold">Actualizando tráfico...</span>
                </div>
            )}

            {error && <div className="error-banner bg-red-500 text-white p-4 rounded-md shadow-md">{error}</div>}

            <button
                className="preferences-button hover:scale-105 transition-transform"
                onClick={() => setShowPreferences(true)}
            >
                Preferencias
            </button>

            {showPreferences && (
                <PreferencesPanel
                    filters={filters}
                    onFiltersChange={setFilters}
                    onResetFilters={() => setFilters({ airlineCode: "", country: "" })}
                    theme={theme}
                    onThemeChange={setTheme}
                    onClose={() => setShowPreferences(false)}
                />
            )}

            <div className="map-wrapper relative z-0">
                <MapContainer 
                    center={viewState.center} 
                    zoom={viewState.zoom} 
                    scrollWheelZoom 
                    className="flight-map rounded-xl shadow-lg" 
                    zoomControl={false}
                >
                    <TileLayer attribution='&copy; OpenStreetMap' url={MAP_THEMES[theme] || MAP_THEMES.light} />
                    
                    {/* Componente que controla la posición y la restaura */}
                    <MapController 
                        onBoundsChange={handleMapChange} 
                        initialCenter={viewState.center} 
                        initialZoom={viewState.zoom}
                    />

                    {filteredFlights?.length > 0 ? filteredFlights.map(f => {
                        const heading = Math.floor((f[10] + 23) / 45) * 45;
                        return (
                            <Marker
                                key={`${f[0]}-${f[5]}-${f[6]}`}
                                position={[f[6], f[5]]}
                                zIndexOffset={Math.round(f[7] * 3.2808)}
                                icon={new Icon({ iconUrl: `/directions/d${heading}.png`, iconSize: [24, 24] })}
                            >
                                <Popup>
                                    <InfoPopup
                                        icao={f[0]} callsign={f[1]} altitude={f[7]} speed={f[9]} bl={backLink}
                                    />
                                </Popup>
                            </Marker>
                        );
                    }) : !isLoading && (
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-yellow-100 text-yellow-800 p-4 rounded-xl shadow-lg z-40 font-medium">
                            No se encontraron aviones.
                        </div>
                    )}
                </MapContainer>
            </div>
        </div>
    );
}

export default FlightList;