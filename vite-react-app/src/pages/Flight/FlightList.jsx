import { Icon } from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useState } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMapEvents } from "react-leaflet";
import { Link, useParams } from "react-router-dom";
import PreferencesPanel from "../../components/PreferencesPanel";
import { CACHE_KEYS, MAP_THEMES } from "../../constants/map";
import { useAuth } from '../../context/AuthContext';
import useCache from "../../hooks/useCache";
import { useUserPreferences } from "../../hooks/useUserPreferences";
import api from './../../api';
import "./FlightList.css";
import InfoPopup from "./InfoPopup";

const MapBoundsHandler = ({ onBoundsChange }) => {
    useMapEvents({
        moveend: (e) => onBoundsChange(e.target.getBounds()),
        zoomend: (e) => onBoundsChange(e.target.getBounds()),
    });
    return null;
};

function FlightList() {
    const { isAuthenticated } = useAuth();
    const { setToCache } = useCache();
    const { infoSlug } = useParams();
    const { preferences } = useUserPreferences();

    const [liveData, setLiveData] = useState(null);
    const [mapBounds, setMapBounds] = useState(null);
    const [filters, setFilters] = useState(preferences?.filters || { airlineCode: "", country: "" });
    const [theme, setTheme] = useState(preferences?.theme || "light");
    const [showPreferences, setShowPreferences] = useState(false);
    const [savedFlights, setSavedFlights] = useState([]);
    const [backLink, setBackLink] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (infoSlug) setFilters(prev => ({ ...prev, airlineCode: infoSlug }));
        setBackLink(infoSlug ? "../" : "");
    }, [infoSlug]);

    useEffect(() => {
        const fetchLiveData = async () => {
            if (!mapBounds) return;
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
                setToCache(CACHE_KEYS.FLIGHT_DATA, limitedFlights);
                setToCache(CACHE_KEYS.LAST_FETCH, Date.now());
                setLiveData(limitedFlights);
                setError(null);
            } catch (err) {
                console.error(err);
                setError("No se pudieron cargar los vuelos");
            } finally { setIsLoading(false); }
        };
        fetchLiveData();
        const interval = setInterval(fetchLiveData, 30000);
        return () => clearInterval(interval);
    }, [mapBounds]);

    const filteredFlights = liveData?.states?.filter(f => {
        const callsign = (f[1] || "").trim();
        const originCountry = (f[2] || "").trim();
        if (filters.airlineCode && !callsign.startsWith(filters.airlineCode.toUpperCase())) return false;
        if (filters.country && !originCountry.toLowerCase().includes(filters.country.toLowerCase())) return false;
        return true;
    });

    const handleSaveFlight = async (icao, callsign) => {
        try {
            if (savedFlights.some(f => f.flight_icao === icao)) return alert("Vuelo ya guardado");
            await api.post("/saved-flights", { flight_icao: icao, flight_data: { callsign } });
            setSavedFlights(prev => [...prev, { flight_icao: icao }]);
        } catch (err) { console.error(err); }
    };

    return (
        <div className="flights-container rounded-xl">
            {/* Loading futurista */}
            {isLoading && (
                <div className="absolute top-4 right-4 z-50 flex items-center space-x-3 bg-white/90 backdrop-blur-md px-4 py-2 rounded-2xl shadow-lg animate-fadeIn">
                    <div className="w-6 h-6 border-4 border-gray-300 border-t-black rounded-full animate-spin"></div>
                    <span className="text-gray-800 font-semibold">Cargando vuelos...</span>
                </div>
            )}

            {error && <div className="error-banner bg-red-500 text-white p-4 rounded-md">{error}</div>}

            {!isAuthenticated && (
                <div className="auth-notice text-center text-gray-600 mb-2">
                    <Link to="/login" className="text-blue-600 underline">Inicia sesión</Link> para guardar vuelos y preferencias
                </div>
            )}

            {/* Botón de preferencias */}
            <button
                className="preferences-button"
                onClick={() => setShowPreferences(true)}
            >
                Preferencias
            </button>

            {/* Panel de preferencias */}
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

            {/* Mapa */}
            <div className="map-wrapper relative">
                <MapContainer center={[37, 20]} zoom={5} scrollWheelZoom className="flight-map rounded-xl shadow-lg" zoomControl={false}>
                    <TileLayer
                        attribution='&copy; OpenStreetMap'
                        url={MAP_THEMES[theme] || MAP_THEMES.light}
                    />
                    <MapBoundsHandler onBoundsChange={setMapBounds} />

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
                                        icao={f[0]}
                                        callsign={f[1]}
                                        altitude={f[7]}
                                        speed={f[9]}
                                        bl={backLink}
                                        onSaveFlight={handleSaveFlight}
                                    />
                                </Popup>
                            </Marker>
                        );
                    }) : !isLoading && (
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-yellow-100 text-yellow-800 p-3 rounded-xl shadow-lg z-40">
                            No se encontraron vuelos con estos filtros.
                        </div>
                    )}
                </MapContainer>
            </div>
        </div>
    );
}

export default FlightList;
