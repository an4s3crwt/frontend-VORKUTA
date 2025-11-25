import React, { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import useCache from "../../hooks/useCache";
import "./InfoPopup.css";

/*
  🔧 Nueva versión:
  - Si HexDB no tiene datos → usa OpenSky /api/metadata/aircraft
  - Combina ambos resultados para tener más cobertura
  - Muestra ModeS y operador aunque falten otros campos
*/

const CACHE_KEYS = {
  AIRCRAFT_IMAGES: "aircraftImagesCache",
  AIRCRAFT_DATA: "aircraftDataCache",
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

function InfoPopup({ icao, callsign, altitude, speed, position, onSaveFlight, onClose }) {
  const { getFromCache, setToCache } = useCache();
  const [planeImgSrc, setPlaneImgSrc] = useState(null);
  const [aircraftData, setAircraftData] = useState(DEFAULT_AIRCRAFT_DATA);
  const [route, setRoute] = useState(" - ");
  const [loading, setLoading] = useState(true);
  const popupRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!icao) return;
      setLoading(true);
      const icaoUpper = icao.toUpperCase();

      try {
        const imageCacheKey = `${CACHE_KEYS.AIRCRAFT_IMAGES}_${icaoUpper}`;
        const dataCacheKey = `${CACHE_KEYS.AIRCRAFT_DATA}_${icaoUpper}`;

        const cachedImage = getFromCache(imageCacheKey);
        const cachedAircraftData = getFromCache(dataCacheKey);

        if (cachedImage && cachedAircraftData) {
          setPlaneImgSrc(cachedImage);
          setAircraftData(cachedAircraftData);
        } else {
          // --- 1️⃣ Peticiones a HexDB ---
          const [imgResponse, aircraftResponse] = await Promise.all([
            fetch(`https://hexdb.io/hex-image-thumb?hex=${icaoUpper}`),
            fetch(`https://hexdb.io/api/v1/aircraft/${icaoUpper}`),
          ]);

          const [imgData, aircraftJson] = await Promise.all([
            imgResponse.text(),
            aircraftResponse.json(),
          ]);

          let imgSrc = imgData.startsWith("https:") ? imgData : `https:${imgData}`;
          let mergedData = { ...DEFAULT_AIRCRAFT_DATA, ...aircraftJson };

          // --- 2️⃣ Si HexDB no devuelve datos útiles, consulta OpenSky ---
          if (
            !aircraftJson?.RegisteredOwners ||
            aircraftJson.RegisteredOwners === "Unregistered"
          ) {
            try {
              const openskyResp = await fetch(
                `https://opensky-network.org/api/metadata/aircraft/${icaoUpper}`
              );
              if (openskyResp.ok) {
                const openskyJson = await openskyResp.json();
                // Fusionamos los datos
                mergedData = {
                  ...mergedData,
                  RegisteredOwners:
                    openskyJson.owner || mergedData.RegisteredOwners,
                  Manufacturer:
                    openskyJson.manufacturername || mergedData.Manufacturer,
                  Model: openskyJson.model || mergedData.Type,
                  Registration:
                    openskyJson.registration || mergedData.Registration,
                };
              }
            } catch (e) {
              console.warn("No OpenSky metadata available:", e);
            }
          }

          // --- 3️⃣ Guardamos en cache ---
          setToCache(imageCacheKey, imgSrc);
          setToCache(dataCacheKey, mergedData);

          setPlaneImgSrc(imgSrc);
          setAircraftData(mergedData);
        }

        // --- 4️⃣ Obtener ruta desde el callsign ---
        if (callsign) {
          try {
            const routeResponse = await fetch(
              `https://hexdb.io/callsign-route-iata?callsign=${callsign}`
            );
            const routeData = await routeResponse.text();
            setRoute(routeData || " - ");
          } catch {
            setRoute(" - ");
          }
        } else {
          setRoute(" - ");
        }
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

  // === 📍 Colocar popup correctamente ===
  useEffect(() => {
    if (!popupRef.current || !position) return;
    const popupEl = popupRef.current;
    const mapContainer = popupEl.parentElement;
    const rect = mapContainer.getBoundingClientRect();

    let x = position.x;
    let y = position.y - 120;

    const popupWidth = popupEl.offsetWidth;
    const popupHeight = popupEl.offsetHeight;
    if (x + popupWidth / 2 > rect.width) x = rect.width - popupWidth / 2 - 10;
    if (x - popupWidth / 2 < 0) x = popupWidth / 2 + 10;
    if (y - popupHeight < 0) y = popupHeight + 10;

    popupEl.style.left = `${x}px`;
    popupEl.style.top = `${y}px`;
  }, [position, loading]);

  if (loading) {
    return (
      <div className="popup-card loading">
        <div className="spinner" />
        <span>Loading...</span>
      </div>
    );
  }

  const handleSaveFlight = () => {
    const [departure_airport, arrival_airport] = route.includes("->")
      ? route.split("->").map((part) => part.trim())
      : ["", ""];
    onSaveFlight?.(icao, callsign, {
      aircraft_type: aircraftData.ICAOTypeCode,
      airline_code: aircraftData.OperatorFlagCode,
      departure_airport,
      arrival_airport,
    });
  };

  return (
    <div ref={popupRef} className="popup-card floating-popup">
      <button className="popup-close-btn" onClick={onClose}>✕</button>

      <div className="popup-header">
        <h2>{aircraftData?.RegisteredOwners || "Unknown"}</h2>
        <p>{callsign || aircraftData?.ModeS || "N/A"}</p>
      </div>

      <div className="popup-image-container">
        <img
          src={planeImgSrc || "/aircrafttemp.png"}
          alt="Aircraft"
          onError={({ currentTarget }) => {
            currentTarget.onerror = null;
            currentTarget.src = "/aircrafttemp.png";
          }}
        />
      </div>

      <div className="popup-details">
        <div className="route">{route}</div>

        <div className="specs">
          <span>{aircraftData?.ICAOTypeCode || aircraftData?.Model || "Unknown"}</span>
          <span>{aircraftData?.Registration || "N/A"}</span>
        </div>

        <div className="alt-speed">
          <span>{Math.round(altitude * 3.2808)} ft</span>
          <span>{Math.round((speed * 18) / 5)} km/h</span>
        </div>

        <Link to={`/flight-info/${icao}`} className="details-link">
          View flight details →
        </Link>
      </div>
    </div>
  );
}

export default InfoPopup;
