import { Icon } from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useState } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMapEvents } from "react-leaflet";
import { useParams } from "react-router-dom";
import PreferencesPanel from "../../components/PreferencesPanel";
import { CACHE_KEYS, MAP_THEMES } from "../../constants/map";
import useCache from "../../hooks/useCache";
import { useUserPreferences } from "../../hooks/useUserPreferences";
import api from './../../api';
import "./FlightList.css";
import InfoPopup from "./InfoPopup";

/**
 * COMPONENTE AUXILIAR: MapBoundsHandler
 * -------------------------------------
 * React-Leaflet (la librería del mapa) no nos dice directamente cuándo el usuario mueve el mapa.
 * Este pequeño componente invisible sirve de "puente": escucha los movimientos (zoom o arrastre)
 * y actualiza las coordenadas de las esquinas (Bounding Box) en el componente principal.
 */
const MapBoundsHandler = ({ onBoundsChange }) => {
    useMapEvents({
        moveend: (e) => onBoundsChange(e.target.getBounds()), // Al terminar de arrastrar
        zoomend: (e) => onBoundsChange(e.target.getBounds()), // Al terminar de hacer zoom
    });
    return null; // No pinta nadA.
};

/**
 * COMPONENTE PRINCIPAL: FlightList
 * --------------------------------
 *  Se encarga de gestionar el mapa,
 * pedir los datos de los aviones al servidor y filtrarlos según lo que el usuario quiera ver.
 */
function FlightList() {
    // --- 1. CONFIGURACIÓN E IMPORTACIÓN DE HERRAMIENTAS ---
    const { setToCache } = useCache();            // Para guardar datos en el navegador (caché)
    const { infoSlug } = useParams();             // Para leer parámetros de la URL (ej: si entran a /mapa/IBERIA)
    const { preferences } = useUserPreferences(); // Para cargar los colores favoritos del usuario

    // --- 2. VARIABLES DE ESTADO (MEMORIA DEL COMPONENTE) ---
    // 'liveData': Aquí guardamos la lista de aviones que nos llegan del servidor.
    const [liveData, setLiveData] = useState(null);
    
    // 'mapBounds': Las coordenadas exactas de lo que el usuario está viendo en pantalla.
    const [mapBounds, setMapBounds] = useState(null);
    
    // Filtros y apariencia visual
    const [filters, setFilters] = useState(preferences?.filters || { airlineCode: "", country: "" });
    const [theme, setTheme] = useState(preferences?.theme || "light"); 
    
    // Estados de la interfaz (UI)
    const [showPreferences, setShowPreferences] = useState(false); // Para abrir/cerrar el menú lateral
    const [backLink, setBackLink] = useState(""); 
    const [isLoading, setIsLoading] = useState(true); // Controla si mostramos el spinner de carga
    const [error, setError] = useState(null); // Para mostrar mensajes si falla la conexión

    // --- 3. SINCRONIZACIÓN CON LA URL ---
    // Si el usuario entra con un enlace directo , aplicamos el filtro automáticamente.
    // Ejemplo: Si entra a ".../mapa/VUELING", se filtra solo Vueling al iniciar.
    useEffect(() => {
        if (infoSlug) setFilters(prev => ({ ...prev, airlineCode: infoSlug }));
        setBackLink(infoSlug ? "../" : "");
    }, [infoSlug]);

    // --- 4. MOTOR DE DESCARGA DE DATOS ---
    // Esta función se ejecuta cada vez que el usuario mueve el mapa ('mapBounds' cambia).
    useEffect(() => {
        const fetchLiveData = async () => {
            // Si el mapa aún no ha cargado, no hacemos nada para evitar errores.
            if (!mapBounds) return;
            
            setIsLoading(true);
            try {
                // ESTRATEGIA DE RENDIMIENTO:
                // En lugar de pedir TODOS los aviones del mundo (que bloquearían el navegador),
                // enviamos al servidor las coordenadas de la pantalla (lamin, lamax, etc.)
                // para que solo nos devuelva los aviones que realmente podemos ver.
                const response = await api.get('/opensky/states', {
                    params: {
                        lamin: mapBounds.getSouth(),
                        lamax: mapBounds.getNorth(),
                        lomin: mapBounds.getWest(),
                        lomax: mapBounds.getEast(),
                    }
                });

                // Limpieza de datos: A veces la API de OpenSky envía datos vacíos o corruptos.
                // Aquí nos aseguramos de que el avión tenga latitud y longitud válidas.
                const validStates = response.data.states?.filter(f => f[5] && f[6]) || [];
                
                // Limitamos a 1000 aviones como medida de seguridad para que la web vaya fluida.
                const limitedFlights = { time: response.data.time, states: validStates.slice(0, 1000) };
                
                // Guardamos en la memoria del navegador para que si recarga, sea más rápido.
                setToCache(CACHE_KEYS.FLIGHT_DATA, limitedFlights);
                setToCache(CACHE_KEYS.LAST_FETCH, Date.now());
                
                setLiveData(limitedFlights);
                setError(null);
            } catch (err) {
                console.error("Error de conexión:", err);
                setError("No se pudieron cargar los vuelos. Revisa tu conexión.");
            } finally { 
                setIsLoading(false); // Ocultamos el spinner de carga pase lo que pase
            }
        };

        // Ejecutamos la carga inicial
        fetchLiveData(); 
        
        // --- ACTUALIZACIÓN EN TIEMPO REAL ---
        // Configuramos un temporizador para refrescar los datos cada 30 segundos.
        // Así el usuario ve cómo se mueven los aviones "casi" en tiempo real.
        const interval = setInterval(fetchLiveData, 30000);
        
        // Limpieza: Cuando el usuario sale de la página, borramos el temporizador.
        return () => clearInterval(interval); 
    }, [mapBounds]); // Se repite cada vez que movemos el mapa

    // --- 5. FILTRADO VISUAL ---
    // Una cosa es lo que descargamos (zona geográfica) y otra lo que mostramos.
    // Aquí filtramos por Aerolínea o País sin tener que volver a pedir datos al servidor.
    const filteredFlights = liveData?.states?.filter(f => {
        const callsign = (f[1] || "").trim(); // Identificativo del vuelo
        const originCountry = (f[2] || "").trim();
        
        // Si hay filtro de aerolínea y no coincide, lo descartamos.
        if (filters.airlineCode && !callsign.startsWith(filters.airlineCode.toUpperCase())) return false;
        // Si hay filtro de país y no coincide, lo descartamos.
        if (filters.country && !originCountry.toLowerCase().includes(filters.country.toLowerCase())) return false;
        
        return true; // Si pasa los filtros, se muestra.
    });

    // --- 6. RENDERIZADO (LO QUE VE EL USER) ---
    return (
        <div className="flights-container rounded-xl">
            
            {/* Aviso de carga flotante (mejora la experiencia del user) */}
            {isLoading && (
                <div className="absolute top-4 right-4 z-50 flex items-center space-x-3 bg-white/90 backdrop-blur-md px-4 py-2 rounded-2xl shadow-lg animate-fadeIn">
                    <div className="w-6 h-6 border-4 border-gray-300 border-t-black rounded-full animate-spin"></div>
                    <span className="text-gray-800 font-semibold">Cargando vuelos...</span>
                </div>
            )}

            {/* Banner de error si algo falla */}
            {error && <div className="error-banner bg-red-500 text-white p-4 rounded-md shadow-md">{error}</div>}

            {/* Botón para abrir las opciones */}
            <button
                className="preferences-button hover:scale-105 transition-transform"
                onClick={() => setShowPreferences(true)}
            >
                Preferencias
            </button>

            {/* Panel lateral de filtros (se muestra solo si showPreferences es true) */}
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

            {/* --- EL MAPA --- */}
            <div className="map-wrapper relative z-0">
                <MapContainer center={[37, 20]} zoom={5} scrollWheelZoom className="flight-map rounded-xl shadow-lg" zoomControl={false}>
                    
                    {/* Capa visual del mapa (LIGHT, Oscuro, Satélite) */}
                    <TileLayer
                        attribution='&copy; OpenStreetMap contributors'
                        url={MAP_THEMES[theme] || MAP_THEMES.light}
                    />
                    
                    {/* Nuestro detector de movimiento invisible */}
                    <MapBoundsHandler onBoundsChange={setMapBounds} />

                    {/* Pintamos cada avión en el mapa */}
                    {filteredFlights?.length > 0 ? filteredFlights.map(f => {
                        // CÁLCULO DE ROTACIÓN:
                        // Los datos nos dan el rumbo en grados (0-360).
                        // Usamos una fórmula matemática para elegir la imagen correcta del avión (d0.png, d45.png...)
                        // para que el icono apunte hacia donde se está moviendo realmente.
                        const heading = Math.floor((f[10] + 23) / 45) * 45;
                        
                        return (
                            <Marker
                                key={`${f[0]}-${f[5]}-${f[6]}`} // Clave única para que React no se líe
                                position={[f[6], f[5]]} // Latitud y Longitud
                                zIndexOffset={Math.round(f[7] * 3.2808)} // Los aviones más altos se ven por encima
                                icon={new Icon({ iconUrl: `/directions/d${heading}.png`, iconSize: [24, 24] })}
                            >
                                {/* Ventana de información al hacer clic */}
                                <Popup>
                                    <InfoPopup
                                        icao={f[0]}
                                        callsign={f[1]}
                                        altitude={f[7]}
                                        speed={f[9]}
                                        bl={backLink}
                                    />
                                </Popup>
                            </Marker>
                        );
                    }) : !isLoading && (
                        // Mensaje si no encontramos nada en esa zona
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-yellow-100 text-yellow-800 p-4 rounded-xl shadow-lg z-40 font-medium">
                            No se encontraron aviones con estos filtros.
                        </div>
                    )}
                </MapContainer>
            </div>
        </div>
    );
}

export default FlightList;