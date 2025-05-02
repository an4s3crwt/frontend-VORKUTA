import React, { useEffect, useState } from "react";
import { useParams } from "react-router";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import { Icon } from "leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import 'leaflet.awesome-markers/dist/leaflet.awesome-markers.css';
import 'leaflet.awesome-markers';
import "./FlightInfo.css";
import 'font-awesome/css/font-awesome.min.css';



const airportIcon = new L.Icon({
    iconUrl: '/a1.png',
    iconSize: [25, 25],
    markerColor: 'yellow',
    iconColor: 'black'
});

const airplaneIcon = new L.Icon({
    iconUrl: '/flight1.jpg',
    iconSize: [25, 25],
    markerColor: 'blue',
    iconColor: 'white'
});




function StatusAlert({ onGround, callSign }) {
    let statusText = "";
    let statusClass = "";

    if (callSign === "No Callsign") {
        statusText = "Flight is not live";
        statusClass = "status-not-live";
    } else if (onGround === false) {
        statusText = "Flight is in the air";
        statusClass = "status-in-air";
    } else if (onGround === true) {
        statusText = "Flight is on the ground";
        statusClass = "status-on-ground";
    } else {
        statusText = "Flight status is unknown";
        statusClass = "status-unknown";
    }

    return (
        <div className={`status-alert ${statusClass}`}>
            {statusText}
        </div>
    );
}

function FlightInfo() {
    let { icao } = useParams();

    const [aircraftData, setAircraftData] = useState({
        ICAOTypeCode: "",
        Manufacturer: "Unknown",
        ModeS: "",
        OperatorFlagCode: "",
        RegisteredOwners: "Unknown",
        Registration: "",
        Type: "",
    });
    const [planeImgSrc, setPlaneImgSrc] = useState(null);
    const [liveData, setLiveData] = useState(null);
    const [origin, setOrigin] = useState("Unknown");
    const [destination, setDestination] = useState("Unknown");
    const [originData, setOriginData] = useState({
        airport: "Unknown",
        country_code: "N/A",
        iata: "Unknown",
        icao: "Unknown",
        latitude: 150,
        longitude: 10,
        region_name: "Unknown"
    });
    const [destinationData, setDestinationData] = useState({
        airport: "Unknown",
        country_code: "N/A",
        iata: "Unknown",
        icao: "Unknown",
        latitude: 150,
        longitude: 10,
        region_name: "Unknown"
    });

    const fetchurl0 = `https://hexdb.io/hex-image-thumb?hex=${icao}`;
    const fetchurl1 = `https://hexdb.io/api/v1/aircraft/${icao}`;
    const fetchurl2 = `https://opensky-network.org/api/states/all?icao24=${icao}`;

    useEffect(() => {
        if (!icao) return;

        // Fetch plane image
        fetch(fetchurl0)
            .then((r) => r.text())
            .then((d) => setPlaneImgSrc(d.startsWith("https:") ? d : `https:${d}`))
            .catch(() => setPlaneImgSrc(null));

        // Fetch aircraft data
        fetch(fetchurl1)
            .then((response) => response.json())
            .then(setAircraftData)
            .catch(console.error);

        // Fetch live flight data
        const fetchFlightData = () => {
            const username = "an4s3crwt";  // Replace with your OpenSky username
            const password = "Mentaybolita1";  // Replace with your OpenSky password
            const headers = new Headers();
        
            headers.set('Authorization', 'Basic ' + btoa(username + ":" + password));
        
            fetch(fetchurl2, { headers })
                .then((response) => response.json())
                .then((data) => {
                    if (!data.states || !data.states[0] || data.states[0][6] == null) {
                        setDefaultLiveData();
                        return;
                    }
                    setLiveData(data);
                    updateRouteInfo(data.states[0][1]);
                })
                .catch(() => setDefaultLiveData());
        };
        

        const updateRouteInfo = (callsign) => {
            fetch(`https://hexdb.io/callsign-route-iata?callsign=${callsign}`)
                .then((r) => r.text())
                .then((d) => {
                    const [org = "Unknown", dst = "Unknown"] = d.split("-");
                    setOrigin(org);
                    setDestination(dst);

                    // Fetch origin airport data
                    fetch(`https://hexdb.io/api/v1/airport/iata/${org}`)
                        .then((r) => r.json())
                        .then(setOriginData)
                        .catch(() => setDefaultOriginData());

                    // Fetch destination airport data
                    fetch(`https://hexdb.io/api/v1/airport/iata/${dst}`)
                        .then((r) => r.json())
                        .then(setDestinationData)
                        .catch(() => setDefaultDestinationData());
                })
                .catch(() => {
                    setOrigin("Unknown");
                    setDestination("Unknown");
                });
        };

        const setDefaultLiveData = () => {
            setLiveData({
                time: Date.now() / 1000,
                states: [
                    ["", "No Callsign", "Unknown", 1000000000, 1000000000, 0, 0, 0, true, 0, 0, 0, null, 0, null, false, 0]
                ]
            });
        };

        const setDefaultOriginData = () => {
            setOriginData({
                airport: "Unknown",
                country_code: "N/A",
                iata: "Unknown",
                icao: "Unknown",
                latitude: 150,
                longitude: 20,
                region_name: "Unknown"
            });
        };

        const setDefaultDestinationData = () => {
            setDestinationData({
                airport: "Unknown",
                country_code: "N/A",
                iata: "Unknown",
                icao: "Unknown",
                latitude: 150,
                longitude: 20,
                region_name: "Unknown"
            });
        };

        fetchFlightData();
        const interval = setInterval(fetchFlightData, 10000);
        return () => clearInterval(interval);
    }, [icao]);

    const markerSize = liveData?.states[0][1] === "No Callsign" ? 0 : 28;
    const lastUpdate = liveData?.states[0][4] ? new Date(liveData.states[0][4] * 1000) : null;
    const position = liveData?.states[0][6] != null && liveData?.states[0][5] != null
        ? [liveData.states[0][6], liveData.states[0][5]]
        : null;

    // Calculate heading icon (simplified)
    const heading = liveData?.states[0][10] || 0;
    const headingIcon = `data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSI+PHBhdGggZD0iTTE2IDBDMjQuODM2NiAwIDMyIDcuMTYzNDQgMzIgMTZDMzIgMjQuODM2NiAyNC44MzY2IDMyIDE2IDMyQzcuMTYzNDQgMzIgMCAyNC44MzY2IDAgMTZDMCA3LjE2MzQ0IDcuMTYzNDQgMCAxNiAwWiIgZmlsbD0iIzAwMCIvPjxwYXRoIGQ9Ik0xNiA0TDE2IDI4TTE2IDRMMjAgOE0xNiA0TDEyIDgiIHN0cm9rZT0iI2ZmZiIgc3Ryb2tlLXdpZHRoPSIyIi8+PC9zdmc+`;

    return (
        <div className="flight-info-container">
            <div className="flight-header">
                <h2>{liveData?.states[0][1] || "Flight Information"}</h2>
                {lastUpdate && (
                    <p className="last-update">
                        Last update: {lastUpdate.toLocaleDateString()} at {lastUpdate.toLocaleTimeString()}
                    </p>
                )}
            </div>

            <StatusAlert
                onGround={liveData?.states[0][8]}
                callSign={liveData?.states[0][1]}
            />

            <div className="flight-content">
                <div className="map-container">
                    {position && (
                        <MapContainer
                            center={position}
                            zoom={3}
                            scrollWheelZoom={true}
                            className="flight-map"
                        >
                            <TileLayer
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />

                            {/* Origin Marker */}
                            <Marker
                                position={[originData.latitude, originData.longitude]}
                                icon={airportIcon}
                            >
                                <Popup>
                                    <div className="airport-popup">
                                        <strong>{originData.airport}</strong>
                                        <div className="airport-location">
                                            {originData.country_code !== "N/A" && (
                                                <img
                                                    src={`https://flagcdn.com/w40/${originData.country_code.toLowerCase()}.png`}
                                                    alt={originData.country_code}
                                                    onError={(e) => e.target.style.display = 'none'}
                                                    loading="lazy"
                                                    width="20"
                                                />
                                            )}
                                            <span>({origin})</span>
                                        </div>
                                    </div>
                                </Popup>
                            </Marker>

                            {/* Flight Path */}
                            <Polyline
                                pathOptions={{
                                    color: "#666",
                                    weight: 2,
                                    dashArray: "5,5"
                                }}
                                positions={[
                                    [originData.latitude, originData.longitude],
                                    position,
                                    [destinationData.latitude, destinationData.longitude]
                                ]}
                            />

                            {/* Destination Marker */}
                            <Marker
                                position={[destinationData.latitude, destinationData.longitude]}
                                icon={airportIcon}
                            >
                                <Popup>
                                    <div className="airport-popup">
                                        <strong>{destinationData.airport}</strong>
                                        <div className="airport-location">
                                            {destinationData.country_code !== "N/A" && (
                                                <img
                                                    src={`https://flagcdn.com/w40/${destinationData.country_code.toLowerCase()}.png`}
                                                    alt={destinationData.country_code}
                                                    onError={(e) => e.target.style.display = 'none'}
                                                    loading="lazy"
                                                    width="20"
                                                />
                                            )}
                                            <span>({destination})</span>
                                        </div>
                                    </div>
                                </Popup>
                            </Marker>

                            {/* Aircraft Marker */}
                            {position && (
                                <Marker
                                    position={position}
                                    icon={airplaneIcon}
                                />
                            )}
                        </MapContainer>
                    )}
                </div>

                <div className="flight-details">
                    <div className="route-info">
                        <h3>Flight Route</h3>
                        <div className="route-airports">
                            <div className="airport">
                                <div className="airport-label">From</div>
                                <div className="airport-name">{originData.airport}</div>
                                <div className="airport-code">
                                    {originData.country_code !== "N/A" && (
                                        <img
                                            src={`https://flagcdn.com/w40/${originData.country_code.toLowerCase()}.png`}
                                            alt={originData.country_code}
                                            onError={(e) => e.target.style.display = 'none'}
                                            loading="lazy"
                                            width="20"
                                        />
                                    )}
                                    <span>{origin}</span>
                                </div>
                            </div>

                            <div className="route-separator">→</div>

                            <div className="airport">
                                <div className="airport-label">To</div>
                                <div className="airport-name">{destinationData.airport}</div>
                                <div className="airport-code">
                                    {destinationData.country_code !== "N/A" && (
                                        <img
                                            src={`https://flagcdn.com/w40/${destinationData.country_code.toLowerCase()}.png`}
                                            alt={destinationData.country_code}
                                            onError={(e) => e.target.style.display = 'none'}
                                            loading="lazy"
                                            width="20"
                                        />
                                    )}
                                    <span>{destination}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flight-stats">
                        <div className="stat-item">
                            <div className="stat-label">Altitude</div>
                            <div className="stat-value">
                                {Math.round(liveData?.states[0][7] * 3.2808)} ft
                            </div>
                        </div>
                        <div className="stat-item">
                            <div className="stat-label">Ground Speed</div>
                            <div className="stat-value">
                                {Math.round((liveData?.states[0][9] * 18) / 5)} km/h
                            </div>
                        </div>
                    </div>

                    <div className="aircraft-info">
                        <h3>Aircraft Details</h3>
                        <div className="aircraft-content">
                            <div className="aircraft-text">
                                <div className="info-row">
                                    <span className="info-label">Registration:</span>
                                    <span className="info-value">{aircraftData?.Registration}</span>
                                </div>
                                <div className="info-row">
                                    <span className="info-label">Type:</span>
                                    <span className="info-value">{aircraftData?.Manufacturer} {aircraftData?.Type}</span>
                                </div>
                                <div className="info-row">
                                    <span className="info-label">Airline:</span>
                                    <span className="info-value">{aircraftData?.RegisteredOwners}</span>
                                </div>
                                <div className="info-row">
                                    <span className="info-label">Hex Code:</span>
                                    <span className="info-value">{aircraftData?.ModeS}</span>
                                </div>
                                <div className="info-row">
                                    <span className="info-label">Operator Code:</span>
                                    <span className="info-value">{aircraftData?.OperatorFlagCode}</span>
                                </div>
                            </div>
                            <div className="aircraft-image">
                                <img
                                    src={planeImgSrc || "/aircrafttemp.png"}
                                    alt="Aircraft"
                                    onError={(e) => e.target.src = "/aircrafttemp.png"}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default FlightInfo;