import { Icon } from "leaflet";
import "leaflet/dist/leaflet.css";
import React, { useEffect, useState } from "react";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import { Link, useParams } from "react-router-dom";
import PreferencesPanel from "../../components/PreferencesPanel";
import { CACHE_KEYS, DEFAULT_FILTERS, MAP_THEMES } from "../../constants/map";
import { useAuth } from '../../context/AuthContext';
import useCache from "../../hooks/useCache";
import { useUserPreferences } from "../../hooks/useUserPreferences";
import api from './../../api';
import "./FlightsList.css";
import InfoPopup from "./InfoPopup";
import AnalyticsPanel from "../../components/AnalyticsPanel";


function FlightList() {
    const { isAuthenticated } = useAuth();
    const { getFromCache, setToCache } = useCache();
    const { infoSlug } = useParams();
    const [liveData, setLiveData] = useState(null);

    const [backLink, setBackLink] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const { preferences } = useUserPreferences();

    const [theme, setTheme] = useState(() => {
        // Default to 'light' if preferences not loaded
        if (!preferences || !preferences.theme) return 'light';

        // Ensure we have a valid theme key
        return MAP_THEMES[preferences.theme] ? preferences.theme : 'light';
    });

    const [filter, setFilter] = useState("");



    const [filters, setFilters] = useState(() => {
        if (!preferences || !preferences.filters) return DEFAULT_FILTERS;
        return preferences.filters;
    });
    const [savedFlights, setSavedFlights] = useState([]);

    const [showPreferences, setShowPreferences] = useState(false);

    // Guardar un vuelo
    const handleSaveFlight = async (icao, callsign) => {
        // Define extraData as needed
        const extraData = {}; // Update with the correct extra flight information

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
            toast.success("Vuelo guardado correctamente");
            setSavedFlights(prev => [...prev, { flight_icao: icao }]);
        } catch (error) {
            console.error('Error saving flight:', error);
            toast.error("Error al guardar el vuelo");
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
            setIsLoading(true);

            // Recuperamos el caché de la última actualización y los datos
            const cachedData = getFromCache(CACHE_KEYS.FLIGHT_DATA);
            const lastFetch = getFromCache(CACHE_KEYS.LAST_FETCH);

            // Comprobamos si los datos están en caché y si la última actualización fue hace menos de 30 segundos
            if (cachedData && lastFetch && (Date.now() - lastFetch < 30000)) {
                console.log("Usando datos en caché, última actualización: ", new Date(lastFetch).toLocaleString());
                setLiveData(cachedData);
                setIsLoading(false);
                return;
            }

            try {
                const response = await api.get('/opensky/states');
                const validStates = response.data.states?.filter(f => f[5] !== null && f[6] !== null) || [];
                const limitedStates = validStates.slice(0, 1000);

                const limitedFlights = {
                    time: response.data.time,
                    states: limitedStates,
                };

                setToCache(CACHE_KEYS.FLIGHT_DATA, limitedFlights);
                setToCache(CACHE_KEYS.LAST_FETCH, Date.now());

                console.log("Actualizando con nuevos datos, hora: ", new Date().toLocaleString());
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
    }, []);

    const filteredFlights = liveData?.states?.filter((flight) => {
        const callsign = (flight[1] || "").trim(); // Limpia el callsign

        // Filtro por aerolínea (primeras letras)
        if (filters.airlineCode && !callsign.startsWith(filters.airlineCode)) {
            return false;
        }

        // Filtro por aeropuerto (últimas letras)
        if (filters.airportCode && !callsign.endsWith(filters.airportCode)) {
            return false;
        }

        return true;
    });


    return (
        <div className="flights-container">
            {isLoading && <div className="loading-overlay">Loading flight data...</div>}
            {error && <div className="error-banner">{error}</div>}

            {!isAuthenticated && (
                <div className="auth-notice">
                    <Link to="/login">Inicia sesión</Link> para guardar vuelos y preferencias
                </div>
            )}

            <button
                className="btn btn-primary preferences-button"
                onClick={() => setShowPreferences(true)}
            >
                Preferencias
            </button>

            {showPreferences && (
                <PreferencesPanel
                    onClose={() => setShowPreferences(false)}
                    onThemeApplied={(newTheme) => {
                        setTheme(newTheme); // Actualiza el estado del tema
                    }}
                    onFiltersChange={(newFilters) => {
                        console.log("Nuevos filtros recibidos:", newFilters); // Debug
                        setFilters(newFilters);
                    }}
                />
            )}

            <div className="map-wrapper">
                <MapContainer
                    center={[37, 20]}
                    zoom={5}
                    scrollWheelZoom={true}
                    className="flight-map"
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url={MAP_THEMES[theme] || MAP_THEMES.light}
                    />
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
                                <Popup className="custom-popup">
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

                <AnalyticsPanel flights={filteredFlights || []} />

            </div>
        </div>
    );
}

export default FlightList;
