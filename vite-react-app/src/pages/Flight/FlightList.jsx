import { Icon } from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useState, useRef, useCallback } from "react";
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
const MapController = ({ onBoundsChange, initialCenter, initialZoom }) => {
    const map = useMapEvents({
        moveend: (e) => onBoundsChange(e.target.getBounds(), e.target.getCenter(), e.target.getZoom()),
        zoomend: (e) => onBoundsChange(e.target.getBounds(), e.target.getCenter(), e.target.getZoom()),
    });

    useEffect(() => {
        if (initialCenter && initialZoom) {
            map.setView(initialCenter, initialZoom);
        }
        // Emitir los bounds iniciales al cargar el mapa
        onBoundsChange(map.getBounds(), map.getCenter(), map.getZoom());
    }, []);

    return null;
};

function FlightList() {
    const { getFromCache, setToCache } = useCache();
    const { infoSlug } = useParams(); 
    const { preferences } = useUserPreferences(); 

    const cachedData = getFromCache(CACHE_KEYS.FLIGHT_DATA);
    const cachedView = getFromCache('MAP_VIEW_STATE');

    const [liveData, setLiveData] = useState(cachedData || null);
    const [mapBounds, setMapBounds] = useState(null);
    const [viewState, setViewState] = useState(cachedView || { center: [40.4168, -3.7038], zoom: 6 });

    const [filters, setFilters] = useState(preferences?.filters || { airlineCode: "", country: "" });
    const [theme, setTheme] = useState(preferences?.theme || "light"); 
    const [showPreferences, setShowPreferences] = useState(false);
    const [backLink, setBackLink] = useState(""); 
    
    const [isLoading, setIsLoading] = useState(false); 
    const [error, setError] = useState(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    // Timestamp de la última petición real para evitar saturar OpenSky
    const lastRequestTime = useRef(0);

    useEffect(() => {
        if (infoSlug) setFilters(prev => ({ ...prev, airlineCode: infoSlug }));
        setBackLink(infoSlug ? "../" : "");
    }, [infoSlug]);

    const handleMapChange = (bounds, center, zoom) => {
        setMapBounds(bounds);
        const newView = { center, zoom };
        setViewState(newView);
        setToCache('MAP_VIEW_STATE', newView);
    };

    // --- MOTOR DE DATOS PROTEGIDO CONTRA 429 ---
    useEffect(() => {
        if (!mapBounds) return;

        const fetchLiveData = async () => {
            const now = Date.now();
            // Si la última petición se hizo hace menos de 6 segundos, esperamos para no saturar OpenSky
            if (now - lastRequestTime.current < 6000) {
                return;
            }

            lastRequestTime.current = now;
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

                const rawStates = response.data?.states || [];

                // Solo actualizamos si nos llegaron aviones; si vino vacío por rate limit, dejamos los que ya había
                if (rawStates.length > 0) {
                    const validStates = rawStates.filter(f => f[5] != null && f[6] != null);
                    const limitedFlights = { 
                        time: response.data.time || Math.floor(Date.now() / 1000), 
                        states: validStates.slice(0, 1000) 
                    };
                    
                    setToCache(CACHE_KEYS.FLIGHT_DATA, limitedFlights);
                    setToCache(CACHE_KEYS.LAST_FETCH, Date.now());
                    setLiveData(limitedFlights);
                    setError(null);
                }
            } catch (err) {
                console.error("Error API:", err);
                if (err.response?.status === 429) {
                    setError("Límite de peticiones de OpenSky alcanzado. Esperando unos segundos...");
                } else if (!liveData) {
                    setError("Error al cargar vuelos en vivo");
                }
            } finally { 
                setIsLoading(false);
            }
        };

        // Debounce de 1200ms tras dejar de mover el mapa
        const timeoutId = setTimeout(() => {
            fetchLiveData();
        }, 1200);

        return () => clearTimeout(timeoutId);
    }, [mapBounds, refreshTrigger]);

    // --- REFRESCO AUTOMÁTICO SEGURO (Cada 15 segundos) ---
    useEffect(() => {
        const interval = setInterval(() => {
            setRefreshTrigger(prev => prev + 1);
        }, 15000);
        return () => clearInterval(interval);
    }, []);

    // --- FILTRADO ---
    const filteredFlights = liveData?.states?.filter(f => {
        const callsign = (f[1] || "").trim();
        const originCountry = (f[2] || "").trim();
        if (filters.airlineCode && !callsign.toUpperCase().startsWith(filters.airlineCode.toUpperCase())) return false;
        if (filters.country && !originCountry.toLowerCase().includes(filters.country.toLowerCase())) return false;
        return true;
    }) || [];

    return (
        <div className="flights-container rounded-xl">
            {isLoading && (
                <div className="absolute top-4 right-4 z-50 flex items-center space-x-3 bg-white/90 backdrop-blur-md px-4 py-2 rounded-2xl shadow-lg">
                    <div className="w-5 h-5 border-3 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
                    <span className="text-gray-800 text-sm font-semibold">Cargando aviones...</span>
                </div>
            )}

            {error && (
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 bg-amber-500 text-white text-xs px-4 py-2 rounded-lg shadow-lg">
                    {error}
                </div>
            )}

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
                    
                    <MapController 
                        onBoundsChange={handleMapChange} 
                        initialCenter={viewState.center} 
                        initialZoom={viewState.zoom}
                    />

                    {filteredFlights.length > 0 ? (
                        filteredFlights.map(f => {
                            // Cálculo de dirección
                            const rawHeading = f[10] || 0;
                            const heading = Math.floor((rawHeading + 23) / 45) * 45 % 360;
                            
                            return (
                                <Marker
                                    key={`${f[0]}-${f[5]}-${f[6]}`}
                                    position={[f[6], f[5]]}
                                    zIndexOffset={Math.round((f[7] || 0) * 3.2808)}
                                    icon={new Icon({ 
                                        iconUrl: `/directions/d${heading}.png`, 
                                        iconSize: [24, 24] 
                                    })}
                                >
                                    <Popup>
                                        <InfoPopup
                                            icao={f[0]} 
                                            callsign={f[1] || 'S/N'} 
                                            altitude={f[7] || 0} 
                                            speed={f[9] || 0} 
                                            bl={backLink}
                                        />
                                    </Popup>
                                </Marker>
                            );
                        })
                    ) : (
                        !isLoading && (
                            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-yellow-100/90 text-yellow-900 px-4 py-2 rounded-xl shadow-lg z-40 text-sm font-medium">
                                Esperando datos de radar...
                            </div>
                        )
                    )}
                </MapContainer>
            </div>
        </div>
    );
}

export default FlightList;