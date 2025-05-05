import { Icon } from "leaflet";
import "leaflet/dist/leaflet.css";
import React, { useEffect, useState } from "react";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import { Link, useParams } from "react-router-dom";
import api  from './../../api';
import { debounce } from 'lodash';
import "./FlightsList.css";
import { useAuth } from './../../context/AuthContext';


// Constantes para las claves de caché
const CACHE_KEYS = {
    FLIGHT_DATA: 'flightDataCache',
    LAST_FETCH: 'lastFlightDataFetch',
    AIRCRAFT_IMAGES: 'aircraftImagesCache',
    AIRCRAFT_DATA: 'aircraftDataCache',
    USER_PREFERENCES: 'userPreferencesCache'
};


const MAP_THEMES = {
    light: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
    satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
};

const DEFAULT_FILTERS = {
    countries: [],
    airlines: [],
    minAltitude: 0,
    maxAltitude: 50000,
    aircraftTypes: []
};


// Tiempo de vida del caché en milisegundos (5 minutos)
const CACHE_TTL = 5 * 60 * 1000;

const DEFAULT_AIRCRAFT_DATA = {
    ICAOTypeCode: "",
    Manufacturer: "Unknown",
    ModeS: "",
    OperatorFlagCode: "",
    RegisteredOwners: "Unknown",
    Registration: "",
    Type: "",
};

// Función para manejar el caché
const useCache = () => {
    const getFromCache = (key) => {
        try {
            const cachedData = localStorage.getItem(key);
            if (!cachedData) return null;

            const { data, timestamp } = JSON.parse(cachedData);
            if (Date.now() - timestamp > CACHE_TTL) {
                localStorage.removeItem(key);
                return null;
            }
            return data;
        } catch (error) {
            console.error('Error reading cache:', error);
            return null;
        }
    };

    const setToCache = (key, data) => {
        try {
            const cacheItem = {
                data,
                timestamp: Date.now()
            };
            localStorage.setItem(key, JSON.stringify(cacheItem));
        } catch (error) {
            console.error('Error writing to cache:', error);
        }
    };

    return { getFromCache, setToCache };
};

function InfoPopup({ icao, callsign, altitude, speed, bl, onSaveFlight }) {
     const { isAuthenticated } = useAuth();
    const { getFromCache, setToCache } = useCache();
    const [planeImgSrc, setPlaneImgSrc] = useState(null);
    const [aircraftData, setAircraftData] = useState(DEFAULT_AIRCRAFT_DATA);
    const [route, setRoute] = useState(" - ");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);

            try {
                // Intentar obtener datos de la caché primero
                const cachedImage = getFromCache(`${CACHE_KEYS.AIRCRAFT_IMAGES}_${icao}`);
                const cachedAircraftData = getFromCache(`${CACHE_KEYS.AIRCRAFT_DATA}_${icao}`);

                if (cachedImage && cachedAircraftData) {
                    setPlaneImgSrc(cachedImage);
                    setAircraftData(cachedAircraftData);
                    setLoading(false);
                    return;
                }

                // Fetch de datos si no hay caché
                const [imgResponse, aircraftResponse] = await Promise.all([
                    fetch(`https://hexdb.io/hex-image-thumb?hex=${icao}`),
                    fetch(`https://hexdb.io/api/v1/aircraft/${icao}`)
                ]);

                const [imgData, aircraftData] = await Promise.all([
                    imgResponse.text(),
                    aircraftResponse.json()
                ]);

                const processedImgSrc = imgData.startsWith("https:") ? imgData : `https:${imgData}`;

                // Guardar en caché
                setToCache(`${CACHE_KEYS.AIRCRAFT_IMAGES}_${icao}`, processedImgSrc);
                setToCache(`${CACHE_KEYS.AIRCRAFT_DATA}_${icao}`, aircraftData);

                setPlaneImgSrc(processedImgSrc);
                setAircraftData(aircraftData);

                // Obtener ruta del vuelo
                const routeResponse = await fetch(`https://hexdb.io/callsign-route-iata?callsign=${callsign}`);
                const routeData = await routeResponse.text();
                setRoute(routeData || " - ");

            } catch (error) {
                console.error("Error fetching aircraft data:", error);
                setAircraftData(DEFAULT_AIRCRAFT_DATA);
                setPlaneImgSrc(null);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [icao, callsign]);

    if (loading) return <div className="popup-loading">Loading...</div>;

    return (
        <div className="popup-container">
            <div className="popup-header">
                <span className="popup-title">{aircraftData?.RegisteredOwners}</span>
                <span className="popup-callsign">{callsign}</span>
            </div>

            <img
                className="popup-image"
                src={planeImgSrc || "/aircrafttemp.png"}
                alt="Aircraft"
                onError={({ currentTarget }) => {
                    currentTarget.onerror = null;
                    currentTarget.src = "/aircrafttemp.png";
                }}
            />

            <div className="popup-details">
                <div className="popup-route">{route}</div>

                <div className="popup-meta">
                    <span>{aircraftData?.ICAOTypeCode}</span>
                    <span>(Reg: {aircraftData?.Registration})</span>
                </div>

                <div className="popup-stats">
                    <span>{Math.round(altitude * 3.2808)} ft</span>
                    <span>{Math.round((speed * 18) / 5)} km/h</span>
                </div>

                <Link to={`/flight-info/${icao}`} className="popup-link">
                    View flight details →
                </Link>

            </div>
            <div className="popup-actions">
                    <button
                        className="save-flight-btn"
                        onClick={() => onSaveFlight(icao, callsign)}
                    >
                        💾 Guardar vuelo
                    </button>
                   
                </div>
            </div>
    );
}

  // Modificar el PreferencesPanel para manejar autenticación
  function PreferencesPanel({
    theme,
    filters,
    onThemeChange,
    onFiltersChange,
    onClose
}) {
    const [localFilters, setLocalFilters] = useState(filters);

    const handleFilterChange = (key, value) => {
        setLocalFilters(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const applyFiltersWithDebounce = debounce((newFilters) => {
        onFiltersChange(newFilters);
        onClose();
    }, 500);



    return (
        <div className="preferences-panel">
            <div className="preferences-header">
                <h3>Preferencias</h3>
                <button onClick={onClose}>×</button>
            </div>

            <div className="preferences-section">
                <h4>Tema del mapa</h4>
                <select
                    value={theme}
                    onChange={(e) => onThemeChange(e.target.value)}
                >
                    <option value="light">Claro</option>
                    <option value="dark">Oscuro</option>
                    <option value="satellite">Satélite</option>
                </select>
            </div>

            <div className="preferences-section">
                <h4>Filtros</h4>
                <div className="filter-group">
                    <label>Altitud mínima (ft)</label>
                    <input
                        type="number"
                        value={localFilters.minAltitude}
                        onChange={(e) => handleFilterChange('minAltitude', parseInt(e.target.value))}
                    />
                </div>

                <div className="filter-group">
                    <label>Altitud máxima (ft)</label>
                    <input
                        type="number"
                        value={localFilters.maxAltitude}
                        onChange={(e) => handleFilterChange('maxAltitude', parseInt(e.target.value))}
                    />
                </div>
               

                {/* Aquí puedes añadir más filtros (países, aerolíneas, etc.) */}
            </div>

            <button className="apply-btn" onClick={applyFiltersWithDebounce}>
                Aplicar cambios
            </button>
        </div>
    );
}

function FlightList() {
     const { isAuthenticated } = useAuth();
    const { getFromCache, setToCache } = useCache();
    const { infoSlug } = useParams();
    const [liveData, setLiveData] = useState(null);
    const [filter, setFilter] = useState("");
    const [backLink, setBackLink] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);


    //Estados de preferencias de user
    const [theme, setTheme] = useState('light');
    const [filters, setFilters] = useState(DEFAULT_FILTERS);
    const [showPreferences, setShowPreferences] = useState(false);
    const [savedFlights, setSavedFlights] = useState([]);
   
    // Cargar las preferencias al iniciar el componente
    useEffect(() => {
        const loadPreferences = async () => {
           
            try {
                const [prefsResponse, savedResponse] = await Promise.all([
                    api.get('/preferences'),
                    api.get('/saved-flights')
                ]);

                setTheme(prefsResponse.data?.map_theme || 'light');
                setFilters(prefsResponse.data?.map_filters || DEFAULT_FILTERS);
                setSavedFlights(savedResponse.data || []);
            } catch (error) {
                console.error('Error loading preferences:', error);
            }
        };

        loadPreferences();
    }, []); 

    // Guardar un vuelo
    const handleSaveFlight = async (icao, callsign) => {
       

        try {
            // Verificar si ya está guardado
            if (savedFlights.some(f => f.flight_icao === icao)) {
                alert('Este vuelo ya está guardado');
                return;
            }

            await api.post('/saved-flights', {
                flight_icao: icao,
                flight_data: { callsign }
            });
            setSavedFlights(prev => [...prev, { flight_icao: icao }]);
            setNeedsAuth(false);
        } catch (error) {
            console.error('Error saving flight:', error);
        }
    };

    // Actualizar preferencias
    const updatePreferences = async () => {
       

        try {
            await api.post('/preferences', {
                map_theme: theme,
                map_filters: filters
            });
            setNeedsAuth(false);
        } catch (error) {
            console.error('Error updating preferences:', error);
        }
    };

    // Filtrar vuelos
    const filteredFlights = liveData?.states.filter(stat => {
        if (!stat[6]) return false;

        // Filtro por texto
        if (filter && !stat[1]?.toLowerCase().includes(filter.toLowerCase())) {
            return false;
        }

        // Filtros avanzados
        const altitudeFt = Math.round(stat[7] * 3.2808);
        if (altitudeFt < filters.minAltitude || altitudeFt > filters.maxAltitude) {
            return false;
        }

        // Aquí puedes añadir más condiciones de filtrado

        return true;
    });



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

        //Revisa el caché en localstorage
        //Si no hay datos válidos , hace una petición a tu backend get /opensky/states
        //usas axios api.get




        const fetchLiveData = async () => {
            setIsLoading(true);
            try {
                // Verificar caché primero
                const cachedData = getFromCache(CACHE_KEYS.FLIGHT_DATA);
                const lastFetch = getFromCache(CACHE_KEYS.LAST_FETCH);

                if (cachedData && lastFetch && (Date.now() - lastFetch < 30000)) {
                    setLiveData(cachedData);
                    setIsLoading(false);
                    return;
                }


                // Hacer la solicitud usando axios con el token
                const response = await api.get('/opensky/states'); // Usamos la instancia de axios

                if (!response.data.states || !response.data.states.some(f => f[5] !== null && f[6] !== null)) {
                    throw new Error('No valid flight data received');
                }

                const limitedFlights = {
                    time: response.data.time,
                    states: response.data.states
                        .filter(flight => flight[0] && flight[5] && flight[6] && flight[1]) //has callsign
                        .slice(0, 2500)
                };

                // Guardar en caché
                setToCache(CACHE_KEYS.FLIGHT_DATA, limitedFlights);
                setToCache(CACHE_KEYS.LAST_FETCH, Date.now());

                setLiveData(limitedFlights);
                setError(null);

                // Enviar datos al backend
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

    return (
        <div className="flights-container">
            {isLoading && <div className="loading-overlay">Loading flight data...</div>}
            {error && <div className="error-banner">{error}</div>}

  
            {/* Mostrar mensaje si no está autenticado */}
            {!isAuthenticated && (
                <div className="auth-notice">
                    <Link to="/login">Inicia sesión</Link> para guardar vuelos y preferencias
                </div>
            )}
            {/* Botón de preferencias */}
            <button
                className="preferences-btn"
                onClick={() => setShowPreferences(true)}
            >
                ⚙️ Preferencias
            </button>



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

                {/* Panel de preferencias */}
                {showPreferences && (
                    <PreferencesPanel
                        theme={theme}
                        filters={filters}
                        onThemeChange={(newTheme) => {
                            setTheme(newTheme);
                            updatePreferences();
                        }}
                        onFiltersChange={(newFilters) => {
                            setFilters(newFilters);
                            updatePreferences();
                        }}
                        onClose={() => setShowPreferences(false)}
                    />
                )}

            </div>
        </div>
    );
}

export default FlightList;
