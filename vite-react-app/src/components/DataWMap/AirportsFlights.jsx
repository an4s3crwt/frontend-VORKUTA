import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import DeckGL from '@deck.gl/react';
import { IconLayer } from '@deck.gl/layers';
import { ScatterplotLayer } from '@deck.gl/layers';
import Map from 'react-map-gl';

const MAPBOX_TOKEN = 'pk.eyJ1IjoiYW5hc2VjcmV0IiwiYSI6ImNtY2RsamlsaTBsbjYyd3NhN2NsY2NmeDQifQ.Bl0ovAjYvKjTu-XCcndscQ';
const MAP_STYLE = 'mapbox://styles/mapbox/satellite-v9'; 
const OPENSKY_USERNAME = 'an4s3crwt';
const OPENSKY_PASSWORD = 'Mentaybolita1';

export default function AirportFlights() {
  const { iata } = useParams();
  const [airportData, setAirportData] = useState(null);
  const [flights, setFlights] = useState([]);
  const [hoverInfo, setHoverInfo] = useState(null);

 
  useEffect(() => {
    fetch(`https://hexdb.io/api/v1/airport/iata/${iata}`)
      .then(res => res.json())
      .then(data => setAirportData(data))
      .catch(console.error);
  }, [iata]);

  // Fetch vuelos con alturas
  useEffect(() => {
    if (!airportData) return;
    const interval = setInterval(() => {
      const credentials = btoa(`${OPENSKY_USERNAME}:${OPENSKY_PASSWORD}`);
fetch('https://opensky-network.org/api/states/all', {
  headers: {
    'Authorization': `Basic ${credentials}`
  }
})
  .then(res => res.json())
  .then(data => {
    setFlights(data.states?.filter(f => f[5] && f[6]) || []);
  })
  .catch(console.error);

    }, 3000);
    return () => clearInterval(interval);
  }, [airportData]);

  // Capa de aviones 
  const planesLayer = new IconLayer({
    id: 'planes',
    data: flights,
    getPosition: d => [d[5], d[6], d[7] * 2], // ¡Altura en metros!
    getIcon: d => ({
      url: `/directions/d${Math.round((d[10] || 0) / 45) * 45}.png`,
      width: 200,
      height: 200
    }),
    getSize: 50,
    getColor: [255, 255, 255],
    pickable: true,
    onHover: ({ object }) => setHoverInfo(object),
    sizeScale: 1,
    billboard: false // Importante para modo 3D real
  });

  // Capa de sombras en el suelo (efecto 3D)
  const shadowsLayer = new ScatterplotLayer({
    id: 'shadows',
    data: flights,
    getPosition: d => [d[5], d[6], 0],
    getRadius: 1000,
    getFillColor: [0, 0, 0, 100],
    pickable: false
  });

  if (!airportData) return <div className="text-white p-8">Cargando...</div>;

  return (
    <div className="relative h-screen">
      <DeckGL
        initialViewState={{
          longitude: airportData.longitude,
          latitude: airportData.latitude,
          zoom: 10,
          pitch: 60, // Más inclinado (60 grados)
          bearing: 0,
          minZoom: 5,
          maxZoom: 15,
          maxPitch: 80
        }}
        controller={true}
        layers={[shadowsLayer, planesLayer]}
      >
        <Map 
          mapStyle={MAP_STYLE} 
          mapboxAccessToken={MAPBOX_TOKEN}
          terrain={{ source: 'mapbox-dem', exaggeration: 1.5 }} // ¡Terreno 3D!
        />
      </DeckGL>

      {/* Info Card con estilo aeronáutico */}
      {hoverInfo && (
        <div className="absolute bottom-6 left-6 bg-gray-900/90 text-white p-4 rounded-lg border border-cyan-400">
          <h3 className="font-mono text-cyan-300">🛩 {hoverInfo[1] || 'N/A'}</h3>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <div>
              <p className="text-xs text-gray-400">ALTURA</p>
              <p className="font-bold">{(hoverInfo[7] || 0).toFixed(0)} m</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">VELOCIDAD</p>
              <p className="font-bold">{(hoverInfo[9] * 3.6).toFixed(0)} km/h</p>
            </div>
          </div>
        </div>
      )}

      {/* Título con coordenadas */}
      <div className="absolute top-6 left-6 bg-black/70 text-white p-3 rounded font-mono">
        <h1 className="text-lg">{iata}</h1>
        <p className="text-xs text-gray-300">
          {airportData.latitude.toFixed(4)}, {airportData.longitude.toFixed(4)}
        </p>
      </div>
    </div>
  );
}