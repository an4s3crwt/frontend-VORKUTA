import { Icon } from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useState } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMapEvents } from "react-leaflet";
import { Link, useParams } from "react-router-dom";
import PreferencesPanel from "../../components/PreferencesPanel";
import { CACHE_KEYS, DEFAULT_FILTERS, MAP_THEMES } from "../../constants/map";
import { useAuth } from '../../context/AuthContext';
import useCache from "../../hooks/useCache";
import { useUserPreferences } from "../../hooks/useUserPreferences";
import api from './../../api';
import "./FlightList.css";
import InfoPopup from "./InfoPopup";

const MapBoundsHandler = ({ onBoundsChange }) => {
    useMapEvents({
        moveend: (e) => {
            const bounds = e.target.getBounds();
            onBoundsChange(bounds);
        },
        zoomend: (e) => {
            const bounds = e.target.getBounds();
            onBoundsChange(bounds);
        },
    });
    return null;
};

function FlightList() {
    const { isAuthenticated } = useAuth();
    const { getFromCache, setToCache } = useCache();
    const { infoSlug } = useParams();
    const [liveData, setLiveData] = useState(null);
    const [mapBounds, setMapBounds] = useState(null);

    const [backLink, setBackLink] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const { preferences } = useUserPreferences();

    const [theme, setTheme] = useState(() => {
        if (!preferences || !preferences.theme) return 'light';
        return MAP_THEMES[preferences.theme] ? preferences.theme : 'light';
    });

    const [filter, setFilter] = useState("");
    const [filters, setFilters] = useState(() => {
        if (!preferences || !preferences.filters) return DEFAULT_FILTERS;
        return preferences.filters;
    });
    const [savedFlights, setSavedFlights] = useState([]);
    const [showPreferences, setShowPreferences] = useState(false);

    const handleSaveFlight = async (icao, callsign) => {
        const extraData = {};
        try {
            if (savedFlights.some(f => f.flight_icao === icao)) {
                alert('Este vuelo ya está guardado');
                return;
            }

            await api.post('/saved-flights', {
                flight_icao: icao,
                flight_data: {
                    callsign,
                    ...extraData
                }
            });
            setSavedFlights(prev => [...prev, { flight_icao: icao }]);
        } catch (error) {
            console.error('Error saving flight:', error);
        }
    };

    useEffect(() => {
        if (infoSlug) {
            setFilter(infoSlug);
            setBackLink("../");
        } else {
            setFilter("");
            setBackLink("");
        }
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

                const validStates = response.data.states?.filter(f => f[5] !== null && f[6] !== null) || [];
                const limitedFlights = {
                    time: response.data.time,
                    states: validStates.slice(0, 1000),
                };

                setToCache(CACHE_KEYS.FLIGHT_DATA, limitedFlights);
                setToCache(CACHE_KEYS.LAST_FETCH, Date.now());

                setLiveData(limitedFlights);
                setError(null);
            } catch (error) {
                console.error('Error fetching flight data:', error);
                setError(error.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchLiveData();
        const interval = setInterval(fetchLiveData, 30000);
        return () => clearInterval(interval);
    }, [mapBounds]);

    const filteredFlights = liveData?.states?.filter((flight) => {
        const callsign = (flight[1] || "").trim();
        if (filters.airlineCode && !callsign.startsWith(filters.airlineCode)) return false;
        if (filters.airportCode && !callsign.endsWith(filters.airportCode)) return false;
        return true;
    });

    return (
        <div className="flights-container rounded-xl">
            {isLoading && <div className="loading-overlay text-xl text-gray-500">Cargando datos...</div>}
            {error && <div className="error-banner bg-red-500 text-white p-4 rounded-md">{error}</div>}

            {!isAuthenticated && (
                <div className="auth-notice text-center text-gray-600">
                    <Link to="/login" className="text-blue-600 underline">Inicia sesión</Link> para guardar vuelos y preferencias
                </div>
            )}

            <button
                className="absolute top-4 right-4 z-50 bg-black text-white py-2 px-4 rounded-lg shadow-md hover:bg-gray-800"
                onClick={() => setShowPreferences(true)}
            >
                Preferencias
            </button>

            {showPreferences && (
                <PreferencesPanel
                    onClose={() => setShowPreferences(false)}
                    onThemeApplied={(newTheme) => setTheme(newTheme)}
                    onFiltersChange={(newFilters) => setFilters(newFilters)}
                />
            )}

            <div className="map-wrapper">
                <MapContainer
                    center={[37, 20]}
                    zoom={5}
                    scrollWheelZoom={true}
                    className="flight-map rounded-xl shadow-lg"
                >
                    <TileLayer
                        attribution='&copy; OpenStreetMap'
                        url={MAP_THEMES[theme] || MAP_THEMES.light}
                    />
                    <MapBoundsHandler onBoundsChange={setMapBounds} />

                    {filteredFlights?.map((stat) => {
                        if (!stat[6]) return null;
                        const heading = Math.floor((stat[10] + 23) / 45) * 45;
                        return (
                            <Marker
                                key={`${stat[0]}-${stat[5]}-${stat[6]}`}
                                position={[stat[6], stat[5]]}
                                zIndexOffset={Math.round(stat[7] * 3.2808)}
                                icon={new Icon({
                                    iconUrl: `/directions/d${heading}.png`,
                                    iconSize: [24, 24],
                                })}
                            >
                                <Popup>
                                    <InfoPopup
                                        icao={stat[0]}
                                        callsign={stat[1]}
                                        altitude={stat[7]}
                                        speed={stat[9]}
                                        bl={backLink}
                                        onSaveFlight={handleSaveFlight}
                                    />
                                </Popup>
                            </Marker>
                        );
                    })}
                </MapContainer>
            </div>
        </div>
    );
}

export default FlightList;
