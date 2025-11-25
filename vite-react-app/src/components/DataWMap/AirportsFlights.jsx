import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import DeckGL from "@deck.gl/react";
import { IconLayer, ScatterplotLayer } from "@deck.gl/layers";
import Map from "react-map-gl";
import InfoPopup from "./../../pages/Flight/InfoPopup"; // el tuyo, ya preparado con datos
import "./AirportsFlights.css";

const MAPBOX_TOKEN =
  "pk.eyJ1IjoiYW5hc2VjcmV0IiwiYSI6ImNtY2RsamlsaTBsbjYyd3NhN2NsY2NmeDQifQ.Bl0ovAjYvKjTu-XCcndscQ";
const MAP_STYLE = "mapbox://styles/mapbox/satellite-v9";
const OPENSKY_USERNAME = "an4s3crwt";
const OPENSKY_PASSWORD = "Mentaybolita1";

export default function AirportFlights() {
  const { iata } = useParams();
  const [airportData, setAirportData] = useState(null);
  const [flights, setFlights] = useState([]);
  const [selectedFlight, setSelectedFlight] = useState(null);
  const containerRef = useRef();

  // === 1️⃣ Cargar datos del aeropuerto ===
  useEffect(() => {
    fetch(`https://hexdb.io/api/v1/airport/iata/${iata}`)
      .then((res) => res.json())
      .then((data) => setAirportData(data))
      .catch(console.error);
  }, [iata]);

  // === 2️⃣ Cargar vuelos (con altura real 3D) ===
  useEffect(() => {
    if (!airportData) return;

    const interval = setInterval(() => {
      const credentials = btoa(`${OPENSKY_USERNAME}:${OPENSKY_PASSWORD}`);
      fetch("https://opensky-network.org/api/states/all", {
        headers: { Authorization: `Basic ${credentials}` },
      })
        .then((res) => res.json())
        .then((data) => {
          setFlights(data.states?.filter((f) => f[5] && f[6]) || []);
        })
        .catch(console.error);
    }, 4000);

    return () => clearInterval(interval);
  }, [airportData]);

  // === 3️⃣ Cerrar popup al hacer click fuera ===
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target)
      ) {
        setSelectedFlight(null);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  if (!airportData) return <div className="text-white p-8">Cargando...</div>;

  // === 4️⃣ Capa de sombras en el suelo ===
  const shadowsLayer = new ScatterplotLayer({
    id: "shadows",
    data: flights,
    getPosition: (d) => [d[5], d[6], 0],
    getRadius: (d) => {
      const alt = d[7] || 0;
      return 800 + Math.min(alt / 5, 2500); // sombra más grande con altitud
    },
    getFillColor: (d) => {
      const alt = d[7] || 0;
      const alpha = 150 - Math.min(alt / 20, 120); // más alto → más difusa
      return [0, 0, 0, Math.max(alpha, 30)];
    },
    stroked: false,
    pickable: false,
  });

  // === 5️⃣ Capa de aviones en 3D real ===
  const planesLayer = new IconLayer({
    id: "planes",
    data: flights,
    getPosition: (d) => [d[5], d[6], d[7] * 2], // altura real (2x para más efecto)
    getIcon: (d) => ({
      url: `/directions/d${Math.round((d[10] || 0) / 45) * 45}.png`,
      width: 200,
      height: 200,
      anchorY: 200,
    }),
    getSize: 50,
    sizeUnits: "pixels",
    getColor: [255, 255, 255],
    pickable: true,
    billboard: false, // modo 3D real (no siempre cara a la cámara)
    onClick: ({ object, x, y }) => setSelectedFlight({ object, x, y }),
  });

  // === 6️⃣ Render ===
  return (
    <div className="relative h-screen" ref={containerRef}>
      <DeckGL
        initialViewState={{
          longitude: airportData.longitude,
          latitude: airportData.latitude,
          zoom: 10,
          pitch: 60, // vista inclinada
          bearing: 0,
          minZoom: 5,
          maxZoom: 15,
          maxPitch: 80,
        }}
        controller={true}
        layers={[shadowsLayer, planesLayer]}
      >
        <Map
          mapStyle={MAP_STYLE}
          mapboxAccessToken={MAPBOX_TOKEN}
          terrain={{ source: "mapbox-dem", exaggeration: 1.5 }}
        />
      </DeckGL>

      {/* 📋 InfoPopup al hacer click */}
      {selectedFlight && (
        <div
          className="absolute z-50"
          style={{
            left: selectedFlight.x + 10,
            top: selectedFlight.y + 10,
          }}
        >
          <InfoPopup
            icao={selectedFlight.object[0]}
            callsign={selectedFlight.object[1]}
            altitude={selectedFlight.object[7] || 0}
            speed={selectedFlight.object[9] || 0}
            onClose={() => setSelectedFlight(null)} // 👈 aquí
          />

        </div>
      )}

      {/* 🏷️ Título con coordenadas */}
      <div className="absolute top-6 left-6 bg-black/70 text-white p-3 rounded font-mono">
        <h1 className="text-lg">{iata}</h1>
        <p className="text-xs text-gray-300">
          {airportData.latitude.toFixed(4)}, {airportData.longitude.toFixed(4)}
        </p>
      </div>
    </div>
  );
}
