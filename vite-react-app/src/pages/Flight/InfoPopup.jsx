import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import useCache from "../../hooks/useCache";
import "./../../styles/InfoPopup.css";

const CACHE_KEYS = {
    AIRCRAFT_IMAGES: 'aircraftImagesCache',
    AIRCRAFT_DATA: 'aircraftDataCache'
};

const DEFAULT_AIRCRAFT_DATA = {
    ICAOTypeCode: "",
    Manufacturer: "Unknown",
    ModeS: "",
    OperatorFlagCode: "",
    RegisteredOwners: "Unknown",
    Registration: "",
    Type: "",
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
                const cachedImage = getFromCache(`${CACHE_KEYS.AIRCRAFT_IMAGES}_${icao}`);
                const cachedAircraftData = getFromCache(`${CACHE_KEYS.AIRCRAFT_DATA}_${icao}`);

                if (cachedImage && cachedAircraftData) {
                    setPlaneImgSrc(cachedImage);
                    setAircraftData(cachedAircraftData);
                    setLoading(false);
                    return;
                }

                const [imgResponse, aircraftResponse] = await Promise.all([
                    fetch(`https://hexdb.io/hex-image-thumb?hex=${icao}`),
                    fetch(`https://hexdb.io/api/v1/aircraft/${icao}`)
                ]);

                const [imgData, aircraftJson] = await Promise.all([
                    imgResponse.text(),
                    aircraftResponse.json()
                ]);

                const processedImgSrc = imgData.startsWith("https:") ? imgData : `https:${imgData}`;

                setToCache(`${CACHE_KEYS.AIRCRAFT_IMAGES}_${icao}`, processedImgSrc);
                setToCache(`${CACHE_KEYS.AIRCRAFT_DATA}_${icao}`, aircraftJson);

                setPlaneImgSrc(processedImgSrc);
                setAircraftData(aircraftJson);

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

export default InfoPopup;
