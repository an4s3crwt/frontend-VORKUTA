import React, { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import useCache from "../../hooks/useCache";
import "./InfoPopup.css";

// =============================================================================
// COMPONENTE: InfoPopup (La ventanita de detalles)
// -----------------------------------------------------------------------------
// Este componente se encarga de convertir un simple punto en el mapa en información útil.
// El radar solo nos da coordenadas y velocidad, pero aquí "cruzamos datos" con varias
// APIs para conseguir la foto del avión, quién es el dueño, de dónde viene y a dónde va.
// =============================================================================

// Claves para guardar las fotos y datos en el navegador (para no descargarlos dos veces)
const CACHE_KEYS = {
  AIRCRAFT_IMAGES: "aircraftImagesCache",
  AIRCRAFT_DATA: "aircraftDataCache",
};

// Plantilla vacía por si no encontramos información del avión (Evita errores de "undefined")
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
  // Herramientas para caché y estado local
  const { getFromCache, setToCache } = useCache();
  
  // Variables de estado (Lo que ve el usuario)
  const [planeImgSrc, setPlaneImgSrc] = useState(null); // La foto del avión
  const [aircraftData, setAircraftData] = useState(DEFAULT_AIRCRAFT_DATA); // Info técnica
  const [route, setRoute] = useState(" - "); // Ruta (Origen -> Destino)
  const [loading, setLoading] = useState(true); // Spinner mientras buscamos datos
  
  // Referencia al elemento del DOM (para poder mover la ventana si se sale de la pantalla)
  const popupRef = useRef(null);

  // ==========================================
  // 1. MOTOR DE BÚSQUEDA DE DATOS (Data Fetching)
  // ==========================================
  useEffect(() => {
    const fetchData = async () => {
      // Si no hay código de avión (ICAO), no podemos buscar nada.
      if (!icao) return;
      
      setLoading(true);
      const icaoUpper = icao.toUpperCase(); // Estandarizamos a mayúsculas

      try {
        // --- A. ESTRATEGIA DE CACHÉ (Primero miramos en Caché) ---
        // Antes de llamar a Internet, miramos si ya tenemos este avión guardado en memoria.
        const imageCacheKey = `${CACHE_KEYS.AIRCRAFT_IMAGES}_${icaoUpper}`;
        const dataCacheKey = `${CACHE_KEYS.AIRCRAFT_DATA}_${icaoUpper}`;

        const cachedImage = getFromCache(imageCacheKey);
        const cachedAircraftData = getFromCache(dataCacheKey);

        if (cachedImage && cachedAircraftData) {
          // si tenemos datos guardados, los usamos y nos ahorramos la petición.
          setPlaneImgSrc(cachedImage);
          setAircraftData(cachedAircraftData);
        } else {
          // --- B. CONSULTA EXTERNA (Si no está en caché, buscamos fuera) ---
          
          // PASO 1: Preguntamos a HexDB (Base de datos colaborativa)
          // Lanzamos dos peticiones a la vez (paralelo) para ir más rápido: Foto y Datos.
          const [imgResponse, aircraftResponse] = await Promise.all([
            fetch(`https://hexdb.io/hex-image-thumb?hex=${icaoUpper}`),
            fetch(`https://hexdb.io/api/v1/aircraft/${icaoUpper}`),
          ]);

          const [imgData, aircraftJson] = await Promise.all([
            imgResponse.text(),
            aircraftResponse.json(),
          ]);

          // Procesamos la imagen (a veces viene sin 'https')
          let imgSrc = imgData.startsWith("https:") ? imgData : `https:${imgData}`;
          
          // Mezclamos los datos recibidos con nuestra plantilla por defecto
          let mergedData = { ...DEFAULT_AIRCRAFT_DATA, ...aircraftJson };

          // PASO 2: ESTRATEGIA DE RESPALDO (Fallback con OpenSky)
          // Si HexDB no sabe quién es el dueño ("Unregistered"), probamos con OpenSky.
         
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
                // Si OpenSky tiene datos mejores, sobrescribimos los anteriores.
                mergedData = {
                  ...mergedData,
                  RegisteredOwners: openskyJson.owner || mergedData.RegisteredOwners,
                  Manufacturer: openskyJson.manufacturername || mergedData.Manufacturer,
                  Model: openskyJson.model || mergedData.Type,
                  Registration: openskyJson.registration || mergedData.Registration,
                };
              }
            } catch (e) {
              console.warn("OpenSky tampoco tenía datos:", e);
            }
          }

          // PASO 3: GUARDAR PARA LA PRÓXIMA (Cachear)
          setToCache(imageCacheKey, imgSrc);
          setToCache(dataCacheKey, mergedData);

          // Actualizamos la pantalla
          setPlaneImgSrc(imgSrc);
          setAircraftData(mergedData);
        }

        // --- C. BÚSQUEDA DE RUTA (Origen -> Destino) ---
        // Usamos el callsign (ej: IBE324) para intentar adivinar la ruta.
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
        console.error("Error general buscando datos:", error);
        // Si todo falla, mostramos datos básicos para no romper la UI.
        setAircraftData(DEFAULT_AIRCRAFT_DATA);
        setPlaneImgSrc(null);
      } finally {
        setLoading(false); // Quitamos el spinner
      }
    };

    fetchData();
  }, [icao, callsign]); // Se re-ejecuta si cambiamos de avión

  // ==========================================
  // 2. POSICIONAMIENTO DE LA VENTANITA
  // ==========================================
  // Este efecto calcula dónde pintar la ventanita para que no se salga de la pantalla.
  // Si el avión está muy a la derecha, la ventana sale a la izquierda, etc.
  useEffect(() => {
    if (!popupRef.current || !position) return;
    const popupEl = popupRef.current;
    const mapContainer = popupEl.parentElement; // El contenedor del mapa
    const rect = mapContainer.getBoundingClientRect(); // Medidas del mapa

    let x = position.x;
    let y = position.y - 120; // Por defecto, encima del avión

    const popupWidth = popupEl.offsetWidth;
    const popupHeight = popupEl.offsetHeight;

    // Lógica de colisiones con los bordes
    if (x + popupWidth / 2 > rect.width) x = rect.width - popupWidth / 2 - 10; // Choca derecha
    if (x - popupWidth / 2 < 0) x = popupWidth / 2 + 10; // Choca izquierda
    if (y - popupHeight < 0) y = popupHeight + 10; // Choca arriba

    // Aplicamos coordenadas
    popupEl.style.left = `${x}px`;
    popupEl.style.top = `${y}px`;
  }, [position, loading]);

  // Si está cargando, mostramos un diseño simplificado
  if (loading) {
    return (
      <div className="popup-card loading">
        <div className="spinner" />
        <span>Loading...</span>
      </div>
    );
  }

  

  // ==========================================
  // 3. RENDERIZADO (DISEÑO VISUAL)
  // ==========================================
  return (
    <div ref={popupRef} className="popup-card floating-popup">
      {/* Botón de cerrar (UX: esencial en móviles) */}
      <button className="popup-close-btn" onClick={onClose}>✕</button>

      {/* Cabecera: Dueño y Código */}
      <div className="popup-header">
        <h2>{aircraftData?.RegisteredOwners || "Unknown"}</h2>
        <p>{callsign || aircraftData?.ModeS || "N/A"}</p>
      </div>

      {/* Foto del avión */}
      <div className="popup-image-container">
        <img
          src={planeImgSrc || "/aircrafttemp.png"} // Si no hay foto, ponemos una genérica
          alt="Aircraft"
          // Si la imagen falla al cargar, cambiamos a la genérica automáticamente
          onError={({ currentTarget }) => {
            currentTarget.onerror = null;
            currentTarget.src = "/aircrafttemp.png";
          }}
        />
      </div>

      {/* Datos Técnicos */}
      <div className="popup-details">
        <div className="route">{route}</div>

        <div className="specs">
          {/* Modelo y Matrícula */}
          <span>{aircraftData?.ICAOTypeCode || aircraftData?.Model || "Unknown"}</span>
          <span>{aircraftData?.Registration || "N/A"}</span>
        </div>

        <div className="alt-speed">
          {/* Conversión de unidades para humanos (Pies y Km/h) */}
          <span>{Math.round(altitude * 3.2808)} ft</span>
          <span>{Math.round((speed * 18) / 5)} km/h</span>
        </div>

        {/* Enlace a página de detalles completa */}
        <Link to={`/flight-info/${icao}`} className="details-link">
          View flight details →
        </Link>
      </div>
    </div>
  );
}

export default InfoPopup;