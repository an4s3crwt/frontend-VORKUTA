import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import useCache from "../../hooks/useCache";
import "./InfoPopup.css";

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
                const imageCacheKey = `${CACHE_KEYS.AIRCRAFT_IMAGES}_${icao}`;
                const dataCacheKey = `${CACHE_KEYS.AIRCRAFT_DATA}_${icao}`;

                const cachedImage = getFromCache(imageCacheKey);
                const cachedAircraftData = getFromCache(dataCacheKey);

                if (cachedImage && cachedAircraftData) {
                    setPlaneImgSrc(cachedImage);
                    setAircraftData(cachedAircraftData);
                } else {
                    const [imgResponse, aircraftResponse] = await Promise.all([
                        fetch(`https://hexdb.io/hex-image-thumb?hex=${icao}`),
                        fetch(`https://hexdb.io/api/v1/aircraft/${icao}`)
                    ]);

                    const [imgData, aircraftJson] = await Promise.all([
                        imgResponse.text(),
                        aircraftResponse.json()
                    ]);

                    const imgSrc = imgData.startsWith("https:") ? imgData : `https:${imgData}`;

                    setToCache(imageCacheKey, imgSrc);
                    setToCache(dataCacheKey, aircraftJson);

                    setPlaneImgSrc(imgSrc);
                    setAircraftData(aircraftJson);
                }

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

    if (loading) {
        return <div className="popup-loading">Loading...</div>;
    }

    const handleSaveFlight = () => {
        const [departure_airport, arrival_airport] = route.includes("->")
            ? route.split("->").map(part => part.trim())
            : ["", ""];

        onSaveFlight(icao, callsign, {
            aircraft_type: aircraftData.ICAOTypeCode,
            airline_code: aircraftData.OperatorFlagCode,
            departure_airport,
            arrival_airport,
        });
    };

  return (
   <div className="card">

        {/* Header */}
        <div className="px-4 pt-4 pb-2 border-b border-white/20">
            <h2 className="text-base font-semibold text-black">{aircraftData?.RegisteredOwners}</h2>
            <p className="text-sm text-neutral-500">{callsign}</p>
        </div>

        {/* Image */}
        <img
            src={planeImgSrc || "/aircrafttemp.png"}
            alt="Aircraft"
            className="w-full object-cover border-b border-white/20"
            onError={({ currentTarget }) => {
                currentTarget.onerror = null;
                currentTarget.src = "/aircrafttemp.png";
            }}
        />

        {/* Details */}
        <div className="px-4 py-3 space-y-3">
            <div className="text-base font-medium text-neutral-800">{route}</div>

            <div className="flex flex-wrap gap-x-3 text-neutral-600 text-sm">
                <span>{aircraftData?.ICAOTypeCode}</span>
                <span>(Reg: {aircraftData?.Registration})</span>
            </div>

            <div className="flex justify-between text-neutral-700 text-sm">
                <span>{Math.round(altitude * 3.2808)} ft</span>
                <span>{Math.round((speed * 18) / 5)} km/h</span>
            </div>

            <Link to={`/flight-info/${icao}`} className="text-blue-600 hover:underline font-medium text-sm">
                View flight details →
            </Link>
        </div>
    </div>
);

}

export default InfoPopup;
