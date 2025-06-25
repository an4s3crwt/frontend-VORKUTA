import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const airplaneIcon = new L.Icon({
  iconUrl: '/airplane-icon.png',
  iconSize: [25, 25]
});

function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

const AirportFlights = () => {
  const { iata } = useParams();
  const [airportData, setAirportData] = useState(null);
  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [clock, setClock] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    async function fetchAirport() {
      try {
        const res = await fetch(`https://hexdb.io/api/v1/airport/iata/${iata}`);
        if (!res.ok) throw new Error('No se pudo cargar aeropuerto');
        const data = await res.json();
        setAirportData(data);
      } catch (e) {
        setError(e.message);
        setLoading(false);
      }
    }
    fetchAirport();
  }, [iata]);

  useEffect(() => {
    async function fetchFlights() {
      try {
        const res = await fetch('https://opensky-network.org/api/states/all');
        if (!res.ok) throw new Error('No se pudo cargar vuelos');
        const data = await res.json();

        const filteredFlights = data.states.filter(flight => {
          const lat = flight[6];
          const lon = flight[5];
          return lat && lon && airportData &&
            getDistanceFromLatLonInKm(lat, lon, airportData.latitude, airportData.longitude) < 200;
        });

        setFlights(filteredFlights);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }

    if (airportData) {
      fetchFlights();
    }
  }, [airportData, iata]);

  if (error) return <p className="text-red-600 text-center mt-6">{error}</p>;
  if (loading || !airportData) return <p className="text-center mt-6">Cargando vuelos...</p>;

  const trafficLevel = flights.length > 20 ? 'ALTO' : flights.length > 10 ? 'MODERADO' : 'BAJO';

  const flightStats = flights.slice(0, 10).map((f, i) => ({
    name: f[1] || `Vuelo ${i + 1}`,
    altitud: Math.round(f[7] || 0),
    velocidad: Math.round(f[9] || 0)
  }));

  return (
    <div className="p-4 max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Vuelos cerca de {airportData.airport} ({iata})</h2>
        <div className="text-sm text-gray-600">{clock.toLocaleTimeString()} (local)</div>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-500">Nivel de tráfico:</span>
        <span className={`px-2 py-1 rounded text-xs font-medium ${trafficLevel === 'ALTO' ? 'bg-red-100 text-red-600' : trafficLevel === 'MODERADO' ? 'bg-yellow-100 text-yellow-600' : 'bg-green-100 text-green-600'}`}>{trafficLevel}</span>
      </div>

      <MapContainer
        center={[airportData.latitude, airportData.longitude]}
        zoom={7}
        scrollWheelZoom={true}
        className="h-[400px] rounded-xl border"
      >
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker
          position={[airportData.latitude, airportData.longitude]}
          icon={L.icon({ iconUrl: '/a1.png', iconSize: [30, 30] })}
        >
          <Popup>{airportData.airport}</Popup>
        </Marker>

        {flights.map((flight, i) => {
          const lat = flight[6];
          const lon = flight[5];
          if (!lat || !lon) return null;
          return (
            <Marker key={i} position={[lat, lon]} icon={airplaneIcon}>
              <Popup>
                <div>
                  <p><strong>Callsign:</strong> {flight[1]}</p>
                  <p><strong>Velocidad:</strong> {Math.round(flight[9] || 0)} m/s</p>
                  <p><strong>Altitud:</strong> {Math.round(flight[7] || 0)} m</p>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="p-4 bg-white rounded-lg shadow border col-span-2">
  <h3 className="text-lg font-semibold mb-2">Altitud y velocidad de vuelos cercanos</h3>
  <p className="text-sm text-gray-500 mb-4">Datos estimados de los 10 vuelos más cercanos al aeropuerto, con doble escala.</p>
  <ResponsiveContainer width="100%" height={300}>
    <LineChart data={flightStats}>
      <XAxis dataKey="name" angle={-35} textAnchor="end" interval={0} height={60} />
      <YAxis yAxisId="alt" unit=" m" stroke="#3b82f6" />
      <YAxis yAxisId="vel" orientation="right" unit=" m/s" stroke="#10b981" />
      <Tooltip />
      <Line yAxisId="alt" type="monotone" dataKey="altitud" stroke="#3b82f6" name="Altitud" />
      <Line yAxisId="vel" type="monotone" dataKey="velocidad" stroke="#10b981" name="Velocidad" />
    </LineChart>
  </ResponsiveContainer>
</div>


      </div>
    </div>
  );
};

export default AirportFlights;
