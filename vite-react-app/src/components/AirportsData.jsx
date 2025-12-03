import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

// --- CONFIGURACIÓN: HUBS GLOBALES ---
const POPULAR_AIRPORTS = [
  // EUROPA
  { iata: 'MAD', name: 'Madrid Barajas', lat: 40.4839, lon: -3.5679, img: 'https://images.unsplash.com/photo-1543783207-ec64e4d95325?auto=format&fit=crop&w=800&q=80' },
  { iata: 'BCN', name: 'Barcelona El Prat', lat: 41.2974, lon: 2.0833, img: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?auto=format&fit=crop&w=800&q=80' },
  { iata: 'LHR', name: 'London Heathrow', lat: 51.4700, lon: -0.4543, img: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=800&q=80' },
  { iata: 'CDG', name: 'Paris Charles de Gaulle', lat: 49.0097, lon: 2.5479, img: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=800&q=80' },
  { iata: 'AMS', name: 'Amsterdam Schiphol', lat: 52.3080, lon: 4.7642, img: 'https://images.unsplash.com/photo-1596798926830-22c67623910b?auto=format&fit=crop&w=800&q=80' },
  { iata: 'FRA', name: 'Frankfurt Intl', lat: 50.0333, lon: 8.5705, img: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=800&q=80' },
  
  // AMÉRICA
  { iata: 'JFK', name: 'New York JFK', lat: 40.6413, lon: -73.7781, img: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=800&q=80' },
  { iata: 'LAX', name: 'Los Angeles Intl', lat: 33.9416, lon: -118.4085, img: 'https://images.unsplash.com/photo-1580655653885-65763b2597d0?auto=format&fit=crop&w=800&q=80' },
  { iata: 'MIA', name: 'Miami Intl', lat: 25.7959, lon: -80.2871, img: 'https://images.unsplash.com/photo-1535498730771-e735b998cd64?auto=format&fit=crop&w=800&q=80' },
  { iata: 'ATL', name: 'Atlanta Hartsfield', lat: 33.6407, lon: -84.4277, img: 'https://images.unsplash.com/photo-1569154941061-e231b4725ef1?auto=format&fit=crop&w=800&q=80' },
  { iata: 'GRU', name: 'São Paulo Guarulhos', lat: -23.4356, lon: -46.4731, img: 'https://images.unsplash.com/photo-1483385573908-6a2ab13c4116?auto=format&fit=crop&w=800&q=80' },

  // ASIA / MEDIO ORIENTE
  { iata: 'DXB', name: 'Dubai International', lat: 25.2532, lon: 55.3657, img: 'https://images.unsplash.com/photo-1512453979798-5ea904ac66de?auto=format&fit=crop&w=800&q=80' },
  { iata: 'HND', name: 'Tokyo Haneda', lat: 35.5494, lon: 139.7798, img: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=800&q=80' },
  { iata: 'SIN', name: 'Singapore Changi', lat: 1.3644, lon: 103.9915, img: 'https://images.unsplash.com/photo-1565967511849-76a60a516170?auto=format&fit=crop&w=800&q=80' },
  { iata: 'SYD', name: 'Sydney Kingsford', lat: -33.9461, lon: 151.1772, img: 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&w=800&q=80' },
];

export default function AirportsData() {
  const [selectedAirport, setSelectedAirport] = useState(null); 
  const [airports, setAirports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const processedCallsigns = useRef(new Set());
  const observer = useRef();
  const navigate = useNavigate();

  // === 💾 MEMORIA DE SESIÓN (Para que al volver no recargue) ===
  useEffect(() => {
    const savedState = sessionStorage.getItem('radarState');
    if (savedState) {
        const parsed = JSON.parse(savedState);
        if (parsed.airport && parsed.flights && parsed.flights.length > 0) {
            setSelectedAirport(parsed.airport);
            setAirports(parsed.flights);
            return; 
        }
    }
  }, []);

  const handleFlightClick = (flight) => {
      const stateToSave = { airport: selectedAirport, flights: airports };
      sessionStorage.setItem('radarState', JSON.stringify(stateToSave));
      navigate(`/airport/${flight.icao24}`);
  };

  const handleBackToDashboard = () => {
      sessionStorage.removeItem('radarState');
      setSelectedAirport(null);
      setAirports([]);
  };

  // Helper Backend
  const formatForBackend = (stateVector) => {
    return {
      icao24: stateVector[0],
      time_position: stateVector[3],
      longitude: stateVector[5],
      latitude: stateVector[6],
      baro_altitude: stateVector[7] || 0,
      on_ground: stateVector[8], 
      velocity: stateVector[9] || 0,
      heading: stateVector[10] || 0,
      vertical_rate: stateVector[11] || 0,
      geo_altitude: stateVector[13] || stateVector[7] || 0,
    };
  };

  const getPrediction = async (telemetryData) => {
    try {
      const response = await api.post('/predict-delay', { flight_data: telemetryData });
      return response.data;
    } catch (e) { return null; }
  };

  // === 📡 CARGA OPTIMIZADA POR ZONA ===
  const fetchAreaFlights = useCallback(async (airport) => {
    setLoading(true);
    setError(null);
    setAirports([]);
    processedCallsigns.current.clear();

    try {
      // Radio pequeño (45km) para carga rápida y relevante
      const R = 0.4; 
      const lamin = airport.lat - R;
      const lamax = airport.lat + R;
      const lomin = airport.lon - R;
      const lomax = airport.lon + R;

      const statesRes = await api.get('/flights/area', {
          params: { lamin, lomin, lamax, lomax }
      });
      
      const statesData = statesRes.data;

      if (!statesData || !Array.isArray(statesData.states)) {
          setLoading(false);
          return;
      }

      // Limitamos a 25 para no saturar y que sea fluido
      const rawStates = statesData.states;
      const currentBatch = rawStates.slice(0, 25); 

      const results = await Promise.all(
        currentBatch.map(async (stateVector) => {
          const callsign = stateVector[1].trim();
          if (!callsign) return null;

          try {
            const routeRes = await fetch(`https://hexdb.io/callsign-route-iata?callsign=${callsign}`);
            let dep = '?', arr = '?';
            
            if (routeRes.ok) {
                const route = await routeRes.text();
                // Filtro básico de calidad
                if (route.includes('Unknown') || !route.includes('-')) return null;
                [dep, arr] = route.split('-').map(s => s?.trim());
            } else {
                return null;
            }

            const airportRes = await fetch(`https://hexdb.io/api/v1/airport/iata/${dep}`);
            const airportData = airportRes.ok ? await airportRes.json() : {};

            const telemetryPayload = formatForBackend(stateVector);
            const prediction = await getPrediction(telemetryPayload);

            return {
              callsign,
              icao24: stateVector[0],
              name: airportData.airport || dep,
              country: airportData.region_name || 'Unknown',
              countryCode: airportData.country_code || 'US',
              departure: dep,
              arrival: arr,
              telemetry: {
                alt: Math.round(stateVector[13] || stateVector[7] || 0),
                spd: Math.round((stateVector[9] || 0) * 3.6)
              },
              prediction
            };
          } catch (err) { return null; }
        })
      );

      const valid = results.filter(Boolean);
      setAirports(valid);
      
    } catch (e) {
      console.error(e);
      setError("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Cargar si seleccionamos aeropuerto y no hay caché
  useEffect(() => {
    if (selectedAirport && airports.length === 0) {
        fetchAreaFlights(selectedAirport);
    }
  }, [selectedAirport, airports.length, fetchAreaFlights]);

  // === RENDER ===
  
  // VISTA DASHBOARD (Selección)
  if (!selectedAirport) {
      return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="text-center mb-10">
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Global Operations Center</h1>
                <p className="text-gray-500">Select a major hub to perform real-time AI scanning</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {POPULAR_AIRPORTS.map((airport) => (
                    <div 
                        key={airport.iata}
                        onClick={() => setSelectedAirport(airport)}
                        className="group relative h-48 rounded-2xl overflow-hidden cursor-pointer shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                    >
                        <div className="absolute inset-0">
                            <img src={airport.img} alt={airport.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors"></div>
                        </div>
                        <div className="absolute inset-0 flex flex-col justify-end p-6 text-white">
                            <div className="flex justify-between items-end">
                                <div>
                                    <h3 className="text-3xl font-bold mb-1">{airport.iata}</h3>
                                    <p className="font-medium text-sm text-white/90">{airport.name}</p>
                                </div>
                                <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/20 p-2 rounded-full backdrop-blur-sm">
                                    ➝
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      );
  }

  // VISTA LISTA DE VUELOS
  return (
    <div className="relative max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-8">
        <button 
            onClick={handleBackToDashboard} 
            className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-blue-600 transition font-medium px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
        >
            ← Back to Dashboard
        </button>
        <div className="text-right">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Radar: {selectedAirport.iata}
            </h2>
            <p className="text-xs text-gray-500 font-mono">SCAN_RADIUS: 40KM • TARGETS: {airports.length}</p>
        </div>
      </div>

      <div className="space-y-4">
        {airports.map((flight, i) => {
          const delayMinutes = flight.prediction?.delay_minutes || 0;
          const status = flight.prediction?.status || 'on_time';
          
          let statusColor = 'green';
          let labelText = 'ON TIME';
          
          // 🔥 LÓGICA DE COLORES COMPLETA 🔥
          if (status === 'delayed') { 
              statusColor = 'red'; 
              labelText = 'DELAYED'; 
          }
          else if (status === 'potential_delay') { 
              statusColor = 'yellow'; 
              labelText = 'RISK'; 
          }
          else if (status === 'scheduled') { 
              statusColor = 'blue'; 
              labelText = 'TAXI/GND'; // Azul para Ground Ops
          }

          const colors = {
              green: 'bg-green-50 text-green-700 border-green-200',
              red: 'bg-red-50 text-red-700 border-red-200',
              yellow: 'bg-yellow-50 text-yellow-700 border-yellow-200',
              blue: 'bg-blue-50 text-blue-700 border-blue-200'
          };
          const dots = {
              green: 'bg-green-500', 
              red: 'bg-red-500 animate-pulse', 
              yellow: 'bg-yellow-500', 
              blue: 'bg-blue-500'
          };

          return (
            <div
              key={`${flight.callsign}-${i}`}
              onClick={() => handleFlightClick(flight)} 
              className="group relative bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 hover:shadow-lg hover:scale-[1.01] transition-all duration-300 cursor-pointer overflow-hidden"
            >
              <div className={`absolute left-0 top-0 bottom-0 w-1 bg-${statusColor}-500`}></div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pl-3">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center shadow-sm text-2xl font-bold text-gray-400">
                    <img src={`https://flagcdn.com/w40/${flight.countryCode?.toLowerCase()}.png`} alt={flight.country} className="w-8 rounded shadow-sm" onError={e => e.target.style.display = 'none'} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white leading-none tracking-tight">{flight.callsign}</h3>
                    <div className="flex items-center gap-2 mt-1.5 text-sm font-medium text-gray-500 dark:text-gray-400">
                       <span className={`px-2 py-0.5 rounded text-xs font-mono ${flight.departure === selectedAirport.iata ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 dark:bg-gray-700'}`}>{flight.departure}</span>
                       <span className="text-gray-300">➜</span>
                       <span className={`px-2 py-0.5 rounded text-xs font-mono ${flight.arrival === selectedAirport.iata ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 dark:bg-gray-700'}`}>{flight.arrival}</span>
                    </div>
                  </div>
                </div>
                <div className="hidden md:flex gap-6 text-xs text-gray-500 font-mono border-l border-r border-gray-100 dark:border-gray-700 px-6 mx-auto">
                  <div className="text-center">
                    <div className="font-bold text-gray-800 dark:text-gray-200 text-sm">{flight.telemetry.alt} ft</div>
                    <div className="text-[10px] tracking-wider uppercase">Altitud</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-gray-800 dark:text-gray-200 text-sm">{flight.telemetry.spd} km/h</div>
                    <div className="text-[10px] tracking-wider uppercase">Velocidad</div>
                  </div>
                </div>
                <div className="flex flex-col items-end min-w-[120px]">
                    <div className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 border ${colors[statusColor]}`}>
                        <span className={`w-2 h-2 rounded-full ${dots[statusColor]}`}></span>
                        {labelText}
                    </div>
                    <span className="text-[11px] text-gray-400 mt-1 font-mono">
                        {status === 'on_time' ? 'On Schedule' : (status === 'scheduled' ? 'Ground Ops' : `+${Math.round(delayMinutes)} min est.`)}
                    </span>
                </div>
              </div>
            </div>
          );
        })}

        {loading && <div className="text-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div><p className="mt-2 text-gray-500">Scanning local airspace...</p></div>}
        
        {!loading && airports.length === 0 && !error && (
            <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                <p className="text-gray-500 font-medium">No active flights found immediately near {selectedAirport.iata}.</p>
                <p className="text-xs text-gray-400 mt-1">Try again in a few moments.</p>
            </div>
        )}
      </div>
    </div>
  );
}