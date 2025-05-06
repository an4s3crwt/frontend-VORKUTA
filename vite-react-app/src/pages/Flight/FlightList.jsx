import { Icon } from "leaflet";
import "leaflet/dist/leaflet.css";
import React, { useEffect, useState } from "react";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import { Link, useParams } from "react-router-dom";
import api from './../../api';
import { debounce } from 'lodash';
import "./FlightsList.css";
import { useAuth } from '../../context/AuthContext';
import useCache from "../../hooks/useCache";
import { CACHE_KEYS, MAP_THEMES, DEFAULT_FILTERS, DEFAULT_AIRCRAFT_DATA } from "../../constants/map";
import InfoPopup from "./InfoPopup";
import PreferencesPanel from "../../components/PreferencesPanel";
import { useUserPreferences } from "../../hooks/useUserPreferences";


function FlightList() {
    const { isAuthenticated } = useAuth();
    const { getFromCache, setToCache } = useCache();
    const { infoSlug } = useParams();
    const [liveData, setLiveData] = useState(null);
    const [filter, setFilter] = useState("");
    const [backLink, setBackLink] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Estados de preferencias de user
    const [theme, setTheme] = useState('light');
    const [filters, setFilters] = useState(DEFAULT_FILTERS);
    const [savedFlights, setSavedFlights] = useState([]);
    const { preferences } = useUserPreferences();
    const [showPreferences, setShowPreferences] = useState(false);

    // Guardar un vuelo
    const handleSaveFlight = async (icao, callsign) => {
        try {
            if (savedFlights.some(f => f.flight_icao === icao)) {
                alert('Este vuelo ya está guardado');
                return;
            }

            await api.post('/saved-flights', {
                flight_icao: icao,
                flight_data: { callsign }
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
            setIsLoading(true);
            try {
                const cachedData = getFromCache(CACHE_KEYS.FLIGHT_DATA);
                const lastFetch = getFromCache(CACHE_KEYS.LAST_FETCH);

                if (cachedData && lastFetch && (Date.now() - lastFetch < 30000)) {
                    setLiveData(cachedData);
                    setIsLoading(false);
                    return;
                }

                const response = await api.get('/opensky/states');

                if (!response.data.states || !response.data.states.some(f => f[5] !== null && f[6] !== null)) {
                    throw new Error('No valid flight data received');
                }

                const limitedFlights = {
                    time: response.data.time,
                    states: response.data.states,
                };

                setToCache(CACHE_KEYS.FLIGHT_DATA, limitedFlights);
                setToCache(CACHE_KEYS.LAST_FETCH, Date.now());

                setLiveData(limitedFlights);
                setError(null);

                try {
                    await api.post('/flight-data/store', { states: limitedFlights.states });
                } catch (storeError) {
                    console.warn('Backend storage failed:', storeError);
                }

            } catch (error) {
                console.error('Error fetching flight data:', error);
                setError(error.message);
                setLiveData({
                    time: Date.now(),
                    states: [[
                        "", "No Callsign", "Unknown", 1000000000, 1000000000,
                        0, 0, 0, true, 0, 0, 0, null, 0, null, false, 0
                    ]],
                });
            } finally {
                setIsLoading(false);
            }
        };

        fetchLiveData();
        const interval = setInterval(fetchLiveData, 30000);

        return () => clearInterval(interval);
    }, []);

    //  Aquí se filtran los vuelos según el filtro y las preferencias
    const filteredFlights = liveData?.states?.filter((flight) => {
        if (filter && !flight[1]?.toLowerCase().includes(filter.toLowerCase())) {
            return false;
        }
        if (filters.minAltitude && flight[7] < filters.minAltitude) return false;
        if (filters.maxAltitude && flight[7] > filters.maxAltitude) return false;

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
                className="preferences-btn"
                onClick={() => setShowPreferences(true)}
            >
                ⚙️ Preferencias
            </button>
            {showPreferences && (
                <PreferencesPanel
                    onClose={() => setShowPreferences(false)}
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
                        url={MAP_THEMES[theme]}
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

                {showPreferences && (
                    <PreferencesPanel
                        theme={theme}
                        filters={filters}
                        onThemeChange={(newTheme) => {
                            setTheme(newTheme);
                        }}
                        onFiltersChange={(newFilters) => {
                            setFilters(newFilters);
                        }}
                        onClose={() => setShowPreferences(false)}
                    />
                )}
            </div>
        </div>
    );
}

export default FlightList;
