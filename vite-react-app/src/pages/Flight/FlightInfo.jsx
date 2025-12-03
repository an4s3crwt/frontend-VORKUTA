import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom"; //  Importamos useNavigate
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import 'leaflet.awesome-markers/dist/leaflet.awesome-markers.css';
import 'leaflet.awesome-markers';
import "./FlightInfo.css";
import 'font-awesome/css/font-awesome.min.css';
import api from '../../api';
import { useAuth } from '../../context/AuthContext';

// ==========================================
// 1. CONFIGURACIÓN
// ==========================================

const airportIcon = new L.Icon({
    iconUrl: '/icons/a1.png', // Icono de aeropuerto
    iconSize: [25, 25],
    markerColor: 'yellow',
    iconColor: 'black'
});

// Función para obtener el icono rotado CON TAMAÑO DINÁMICO
const getPlaneIcon = (heading, size) => {
    const safeHeading = heading || 0;
    let snap = Math.round(safeHeading / 45) * 45;
    if (snap === 360) snap = 0;

    return new L.Icon({
        iconUrl: `/directions/d${snap}.png`, 
        iconSize: [size, size], 
        iconAnchor: [size / 2, size / 2],
        popupAnchor: [0, -(size / 2)],
        className: 'plane-icon-smooth'
    });
};

// ==========================================
// 2. COMPONENTES UI
// ==========================================

// Marcador responsivo (Zoom)
const ResponsivePlaneMarker = ({ position, heading, flightCode, altitude }) => {
    const map = useMap();
    const [zoom, setZoom] = useState(map.getZoom());

    useMapEvents({
        zoomend: () => setZoom(map.getZoom()),
    });

    let newSize = Math.max(20, Math.min(60, zoom * 4)); 

    return (
        <Marker 
            position={position} 
            icon={getPlaneIcon(heading, newSize)} 
            zIndexOffset={1000}
        >
            <Popup>
                <div className="text-center">
                    <strong>{flightCode}</strong><br />
                    Alt: {altitude} ft<br />
                    Hdg: {Math.round(heading)}°
                </div>
            </Popup>
        </Marker>
    );
};

function StatusAlert({ onGround, callSign }) {
    let statusText = "", statusClass = "";

    if (callSign === "No Callsign") {
        statusText = "Offline"; statusClass = "status-not-live";
    } else if (!onGround) {
        statusText = "In Air"; statusClass = "status-in-air";
    } else {
        statusText = "On Ground"; statusClass = "status-on-ground";
    }

    return <div className={`status-alert ${statusClass}`}>{statusText}</div>;
}

const PredictionCard = ({ prediction, loading, error, onRefresh }) => {
    if (loading) return (
        <div className="prediction-card loading-state">
            <i className="fa fa-circle-o-notch fa-spin"></i><span>Analyzing telemetry...</span>
        </div>
    );

    if (error) return (
        <div className="prediction-card error-state">
            <i className="fa fa-exclamation-triangle"></i><span>{error}</span>
            <button onClick={onRefresh} className="retry-btn-card"><i className="fa fa-refresh"></i></button>
        </div>
    );

    if (!prediction) return null;

    const delay = prediction.delay_minutes;
    
    // Semáforo visual completo
    const severityClass = 
        prediction.status === 'delayed' ? 'severe-delay' : 
        prediction.status === 'potential_delay' ? 'moderate-delay' : 
        prediction.status === 'scheduled' ? 'scheduled-state' : 
        'on-time';

    const iconClass = 
        prediction.status === 'scheduled' ? "fa fa-plane" : 
        prediction.status === 'on-time' ? "fa fa-check-circle" : 
        "fa fa-clock-o";

    const statusText = 
        prediction.status === 'scheduled' ? "Ground Ops" :
        prediction.status === 'on-time' ? "On Time" : 
        `Risk: ${delay} min`;
    
    const reasonText = prediction.explanation || "Analyzing flight profile...";

    return (
        <div className={`prediction-card ${severityClass}`}>
            <div className="prediction-header">
                <span className="prediction-title"><i className="fa fa-microchip"></i> AI Trend Analysis</span>
                <button onClick={onRefresh} className="refresh-card-btn"><i className="fa fa-refresh"></i> Refresh</button>
            </div>
            <div className="prediction-meta">Updated: {new Date(prediction.calculated_at).toLocaleTimeString()}</div>
            <div className="prediction-body">
                <div className="status-icon"><i className={iconClass}></i></div>
                <div className="status-details">
                    <span className="status-main">{statusText}</span>
                    <span className="status-sub">{reasonText}</span>
                    <div className="probability-bar-bg">
                        <div className="probability-bar-fill" style={{ width: `${prediction.predicted_probability * 100}%` }}></div>
                    </div>
                    <span className="prob-text">Risk Probability: {Math.round(prediction.predicted_probability * 100)}%</span>
                </div>
            </div>
        </div>
    );
};

// ==========================================
// 3. MAIN COMPONENT
// ==========================================

function FlightInfo() {
    const { user } = useAuth();
    let { icao } = useParams();
const navigate = useNavigate();


    // Estados
    const [aircraftData, setAircraftData] = useState({ Manufacturer: "Unknown", Model: "", Registration: "", OperatorFlagCode: "UNK" });
    const [planeImgSrc, setPlaneImgSrc] = useState(null);
    const [liveData, setLiveData] = useState(null);
    
    const [origin, setOrigin] = useState("Unknown");
    const [destination, setDestination] = useState("Unknown");
    const [originData, setOriginData] = useState({ airport: "", latitude: 0, longitude: 0, country_code: "N/A" });
    const [destinationData, setDestinationData] = useState({ airport: "", latitude: 0, longitude: 0, country_code: "N/A" });

    const [delayPrediction, setDelayPrediction] = useState(null);
    const [predictionError, setPredictionError] = useState(null);
    const [loadingPrediction, setLoadingPrediction] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // URLs
    const fetchurl0 = `https://hexdb.io/hex-image-thumb?hex=${icao}`;
    const fetchurl1 = `https://hexdb.io/api/v1/aircraft/${icao}`;

    // --- LOGICA ---
    const fetchPrediction = async (stateVector) => {
        if (!stateVector) return;
        const altitude = stateVector[13] || stateVector[7] || 0;
        const telemetry = {
            icao24: icao, latitude: stateVector[6], longitude: stateVector[5], velocity: stateVector[9],
            heading: stateVector[10], baro_altitude: stateVector[7], geo_altitude: altitude, 
            on_ground: stateVector[8], vertical_rate: stateVector[11]
        };

        try {
            setPredictionError(null);
            setLoadingPrediction(true);
            const response = await api.post('/predict-delay', { flight_data: telemetry });
            setDelayPrediction(response.data);
        } catch (error) {
            setPredictionError("AI Unavailable");
        } finally {
            setLoadingPrediction(false);
        }
    };

    const updateRouteInfo = async (callsign) => {
        try {
            const routeRes = await fetch(`https://hexdb.io/callsign-route-iata?callsign=${callsign}`);
            const routeText = await routeRes.text();
            if (!routeText || routeText.includes('Unknown') || !routeText.includes('-')) return;

            const [org, dst] = routeText.split("-");
            setOrigin(org); setDestination(dst);

            if (org !== "Unknown") fetch(`https://hexdb.io/api/v1/airport/iata/${org}`).then(r => r.json()).then(setOriginData).catch(() => {});
            if (dst !== "Unknown") fetch(`https://hexdb.io/api/v1/airport/iata/${dst}`).then(r => r.json()).then(setDestinationData).catch(() => {});
        } catch (e) { console.error(e); }
    };

    const fetchFlightData = async () => {
        setIsRefreshing(true);
        try {
            const response = await api.get(`/flight-live/${icao}`);
            const data = response.data;

            if (!data.states || !data.states[0] || data.states[0][6] == null) {
                if (!liveData) setLiveData(null);
                return;
            }

            setLiveData(data);
            const callsign = data.states[0][1].trim();
            if (callsign !== "No Callsign") {
                if (origin === "Unknown") updateRouteInfo(callsign);
                fetchPrediction(data.states[0]); 
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        if (!icao) return;
        // 🧹 LIMPIEZA DE ESTADO
        setLiveData(null); setDelayPrediction(null); setOrigin("Unknown"); setDestination("Unknown");
        setOriginData({ airport: "", latitude: 0, longitude: 0, country_code: "N/A" }); 
        setDestinationData({ airport: "", latitude: 0, longitude: 0, country_code: "N/A" });
        setPlaneImgSrc(null);

        // Carga de datos nuevos
        fetch(`https://hexdb.io/hex-image-thumb?hex=${icao}`).then(r => r.text()).then(d => setPlaneImgSrc(d.startsWith("https:") ? d : `https:${d}`)).catch(() => {});
        fetch(`https://hexdb.io/api/v1/aircraft/${icao}`).then(r => r.json()).then(setAircraftData).catch(() => {});
        
        fetchFlightData();
    }, [icao]);

    // Render helpers
    const lastUpdate = liveData?.states[0][4] ? new Date(liveData.states[0][4] * 1000) : null;
    const position = liveData?.states[0][6] != null ? [liveData.states[0][6], liveData.states[0][5]] : null;
    const heading = liveData?.states[0][10] || 0;
    
    // Altitud unificada visual
    const displayAltitude = liveData ? Math.round((liveData.states[0][13] || liveData.states[0][7] || 0) * 3.28084) : 0;

    return (
        <div className="flight-info-container">
           

            <div className="flight-header">
                
                <div style={{display: 'flex', alignItems: 'center', gap: '15px'}}>
                    {/* 👇 BOTÓN VOLVER AQUÍ 👇 */}
                    <button 
                        onClick={() => window.history.back()} 
                        className="back-btn-header"
                        title="Go Back"
                    >
                        <i className="fa fa-arrow-left"></i>
                    </button>
                    <h2>{liveData?.states[0][1] || "Loading..."}</h2>
                    <button onClick={fetchFlightData} className="refresh-btn">
                        <i className={`fa fa-refresh ${isRefreshing ? 'fa-spin' : ''}`}></i>
                    </button>
                </div>
                {lastUpdate && <p className="last-update">{lastUpdate.toLocaleTimeString()}</p>}
            </div>

            <StatusAlert onGround={liveData?.states[0][8]} callSign={liveData?.states[0][1]} />

            <div className="flight-content">
                <div className="map-container">
                    {position && (
                        <MapContainer center={position} zoom={6} scrollWheelZoom={true} className="flight-map">
                            <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                            
                            {originData.latitude !== 0 && destinationData.latitude !== 0 && (
                                <>
                                    <Marker position={[originData.latitude, originData.longitude]} icon={airportIcon}><Popup>{originData.airport}</Popup></Marker>
                                    <Marker position={[destinationData.latitude, destinationData.longitude]} icon={airportIcon}><Popup>{destinationData.airport}</Popup></Marker>
                                    
                                    {/* Polyline (Solo si está en el aire) */}
                                    {!liveData?.states[0][8] && (
                                        <Polyline
                                            positions={[
                                                [originData.latitude, originData.longitude],
                                                position, 
                                                [destinationData.latitude, destinationData.longitude]
                                            ]}
                                            pathOptions={{ color: "#9ca3af", weight: 2, dashArray: "6, 8" }} 
                                        />
                                    )}
                                </>
                            )}

                            <ResponsivePlaneMarker position={position} heading={heading} flightCode={liveData?.states[0][1]} altitude={displayAltitude} />
                        </MapContainer>
                    )}
                </div>

                <div className="flight-details">
                    <div className="route-info">
                        <h3>Flight Route</h3>
                        <div className="route-airports">
                            {/* ORIGEN CON BANDERA */}
                            <div className="airport">
                                <div className="airport-label">From</div>
                                <div className="airport-name">{originData.airport || "Unknown"}</div>
                                <div className="airport-code">
                                    {originData.country_code !== "N/A" && (
                                        <img 
                                            src={`https://flagcdn.com/w40/${originData.country_code.toLowerCase()}.png`} 
                                            alt="Flag" 
                                            style={{width: '20px', display: 'inline-block', marginRight: '5px', verticalAlign: 'middle'}}
                                        />
                                    )}
                                    <span>{origin}</span>
                                </div>
                            </div>
                            
                            <div className="route-separator">→</div>
                            
                            {/* DESTINO CON BANDERA */}
                            <div className="airport">
                                <div className="airport-label">To</div>
                                <div className="airport-name">{destinationData.airport || "Unknown"}</div>
                                <div className="airport-code">
                                    {destinationData.country_code !== "N/A" && (
                                        <img 
                                            src={`https://flagcdn.com/w40/${destinationData.country_code.toLowerCase()}.png`} 
                                            alt="Flag" 
                                            style={{width: '20px', display: 'inline-block', marginRight: '5px', verticalAlign: 'middle'}}
                                        />
                                    )}
                                    <span>{destination}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flight-stats">
                        <div className="stat-item">
                            <div className="stat-label">Altitude (GPS)</div>
                            <div className="stat-value">{displayAltitude} ft</div>
                        </div>
                        <div className="stat-item">
                            <div className="stat-label">Ground Speed</div>
                            <div className="stat-value">{liveData ? Math.round((liveData.states[0][9] * 18) / 5) : 0} km/h</div>
                        </div>
                        <PredictionCard 
                            prediction={delayPrediction} 
                            loading={loadingPrediction || isRefreshing}
                            error={predictionError} 
                            onRefresh={fetchFlightData}
                        />
                    </div>
                </div>

                <div className="aircraft-info">
                    <h3>Aircraft Details</h3>
                    <div className="aircraft-content">
                        <div className="aircraft-text">
                            <div className="info-row"><span className="info-label">Reg:</span> <span className="info-value">{aircraftData?.Registration}</span></div>
                            <div className="info-row"><span className="info-label">Type:</span> <span className="info-value">{aircraftData?.Manufacturer} {aircraftData?.Type}</span></div>
                            <div className="info-row"><span className="info-label">Airline:</span> <span className="info-value">{aircraftData?.RegisteredOwners}</span></div>
                        </div>
                        <div className="aircraft-image">
                            <img src={planeImgSrc || "/aircrafttemp.png"} alt="Aircraft" onError={(e) => e.target.src = "/aircrafttemp.png"} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default FlightInfo;