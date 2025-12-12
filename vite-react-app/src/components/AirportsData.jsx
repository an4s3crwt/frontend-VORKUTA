import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

// ==========================================
// 1. EL MENÚ DE OPCIONES (CONFIGURACIÓN)
// ==========================================
// Esta lista define los aeropuertos principales que el usuario puede elegir.
// Cada uno tiene su foto y sus coordenadas GPS exactas para hacer el escaneo.
const POPULAR_AIRPORTS = [
  // EUROPA
  { iata: 'MAD', name: 'Madrid Barajas', lat: 40.4839, lon: -3.5679, img: 'https://images.unsplash.com/photo-1543783207-ec64e4d95325?auto=format&fit=crop&w=800&q=80' },
  { iata: 'BCN', name: 'Barcelona El Prat', lat: 41.2974, lon: 2.0833, img: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?auto=format&fit=crop&w=800&q=80' },
  { iata: 'LHR', name: 'London Heathrow', lat: 51.4700, lon: -0.4543, img: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=800&q=80' },
  { iata: 'CDG', name: 'Paris Charles de Gaulle', lat: 49.0097, lon: 2.5479, img: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=800&q=80' },
  { iata: 'AMS', name: 'Amsterdam Schiphol', lat: 52.3080, lon: 4.7642, img: 'https://images.unsplash.com/photo-1596798926830-22c67623910b?auto=format&fit=crop&w=800&q=80' },
  { iata: 'FRA', name: 'Frankfurt Intl', lat: 50.0333, lon: 8.5705, img: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=800&q=80' },
];

export default function AirportsData() {
  // --- VARIABLES DE ESTADO (LO QUE VE EL USUARIO) ---
  const [selectedAirport, setSelectedAirport] = useState(null); // ¿Qué aeropuerto estamos mirando?
  const [airports, setAirports] = useState([]);                 // La lista de vuelos encontrados
  const [loading, setLoading] = useState(false);                // LOADING
  const [error, setError] = useState(null);                     // Si algo sale mal, lo guardamos aquí
  
  // Herramientas internas para navegación y control
  const processedCallsigns = useRef(new Set());
  const observer = useRef();
  const navigate = useNavigate();

  // ==========================================
  // 2. SISTEMA DE MEMORIA 
  // ==========================================
  // Este bloque sirve para que la aplicación "no sea olvidadiza".
  // Si el usuario entra en un vuelo y luego pulsa "Atrás", recordamos qué
  // aeropuerto y qué vuelos estaba mirando para no obligarle a cargar todo de nuevo.
  useEffect(() => {
    const savedState = sessionStorage.getItem('radarState');
    if (savedState) {
        const parsed = JSON.parse(savedState);
        // Si hay datos guardados en la memoria del navegador, los restauramos.
        if (parsed.airport && parsed.flights && parsed.flights.length > 0) {
            setSelectedAirport(parsed.airport);
            setAirports(parsed.flights);
            return; 
        }
    }
  }, []);

  // Cuando el usuario hace click en un vuelo para ver detalles:
  // 1. Guardamos la "foto" actual de la pantalla en la memoria (sessionStorage).
  // 2. Navegamos a la pantalla de detalle.
  const handleFlightClick = (flight) => {
      const stateToSave = { airport: selectedAirport, flights: airports };
      sessionStorage.setItem('radarState', JSON.stringify(stateToSave));
      navigate(`/airport/${flight.icao24}`);
  };

  // Botón "Volver al Dashboard": Borramos la memoria y reseteamos la vista.
  const handleBackToDashboard = () => {
      sessionStorage.removeItem('radarState');
      setSelectedAirport(null);
      setAirports([]);
  };

  // Convierte los datos brutos y numéricos del radar en algo que nuestra IA entienda
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

  // Preguntamos a nuestra API de IA si cree que este vuelo se retrasará.
  const getPrediction = async (telemetryData) => {
    try {
      const response = await api.post('/predict-delay', { flight_data: telemetryData });
      return response.data;
    } catch (e) { return null; }
  };

  // ==========================================
  // 3. EL CEREBRO DE LA BÚSQUEDA (FETCHING)
  // ==========================================
  // Esta función es la que hace el trabajo DE FILTRO cuando eliges un aeropuerto.
  const fetchAreaFlights = useCallback(async (airport) => {
    setLoading(true);
    setError(null);
    setAirports([]); // Limpiamos la lista anterior
    processedCallsigns.current.clear();

    try {
      // DEFINIMOS EL ÁREA DE ESCANEO:
      // Creamos una "caja" imaginaria alrededor del aeropuerto seleccionado.
      // R = 0.4 grados es aproximadamente un radio de 45km.
      const R = 0.4; 
      const lamin = airport.lat - R;
      const lamax = airport.lat + R;
      const lomin = airport.lon - R;
      const lomax = airport.lon + R;

      // 1. BUSCAMOS AVIONES en esa caja geográfica
      const statesRes = await api.get('/flights/area', {
          params: { lamin, lomin, lamax, lomax }
      });
      
      const statesData = statesRes.data;

      if (!statesData || !Array.isArray(statesData.states)) {
          setLoading(false);
          return;
      }

      // Limitamos a 25 vuelos para que la app vaya fluida
      const rawStates = statesData.states;
      const currentBatch = rawStates.slice(0, 25); 

      // 2. ENRIQUECEMOS LOS DATOS
      // El radar solo nos da coordenadas. Aquí buscamos:
      // - ¿De dónde viene y a dónde va? (Ruta)
      // - ¿Cómo se llama el aeropuerto de origen?
      // - ¿Qué opina la IA sobre un posible retraso?
      const results = await Promise.all(
        currentBatch.map(async (stateVector) => {
          const callsign = stateVector[1].trim(); // Ej: "IBE1234"
          if (!callsign) return null;

          try {
            // Consulta externa para obtener la ruta (Origen - Destino) según el callsingn
            const routeRes = await fetch(`https://hexdb.io/callsign-route-iata?callsign=${callsign}`);
            let dep = '?', arr = '?';
            
            if (routeRes.ok) {
                const route = await routeRes.text();
                // Filtramos rutas desconocidas o erróneas
                if (route.includes('Unknown') || !route.includes('-')) return null;
                [dep, arr] = route.split('-').map(s => s?.trim());
            } else {
                return null;
            }

            // Obtenemos detalles  del aeropuerto (nombre completo, país...)
            const airportRes = await fetch(`https://hexdb.io/api/v1/airport/iata/${dep}`);
            const airportData = airportRes.ok ? await airportRes.json() : {};

            // Preparamos datos y pedimos predicción de retraso
            const telemetryPayload = formatForBackend(stateVector);
            const prediction = await getPrediction(telemetryPayload);

            // Devolvemos el "Vuelo Completo" listo para mostrar
            return {
              callsign,
              icao24: stateVector[0],
              name: airportData.airport || dep,
              country: airportData.region_name || 'Unknown',
              countryCode: airportData.country_code || 'US',
              departure: dep,
              arrival: arr,
              telemetry: {
                // Convertimos a unidades legibles: Pies y Km/h
                alt: Math.round(stateVector[13] || stateVector[7] || 0),
                spd: Math.round((stateVector[9] || 0) * 3.6)
              },
              prediction // Aquí va la predicción de la IA
            };
          } catch (err) { return null; }
        })
      );

      // Filtramos los resultados válidos y actualizamos la pantalla
      const valid = results.filter(Boolean);
      setAirports(valid);
      
    } catch (e) {
      console.error(e);
      setError("Connection error. Please try again.");
    } finally {
      setLoading(false); // Terminamos de cargar
    }
  }, []);

  // Efecto automático: Si elegimos aeropuerto y la lista está vacía, lanzamos la búsqueda.
  useEffect(() => {
    if (selectedAirport && airports.length === 0) {
        fetchAreaFlights(selectedAirport);
    }
  }, [selectedAirport, airports.length, fetchAreaFlights]);

  // ==========================================
  // 4. LA INTERFAZ 
  // ==========================================
  
  // ESCENA 1: EL DASHBOARD (Selector de Aeropuertos)
 
  if (!selectedAirport) {
      return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="text-center mb-10">
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Global Operations Center</h1>
                <p className="text-gray-500">Select a major hub to perform real-time AI scanning</p>
            </div>

            {/* Rejilla de tarjetas con fotos de aeropuertos */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {POPULAR_AIRPORTS.map((airport) => (
                    <div 
                        key={airport.iata}
                        onClick={() => setSelectedAirport(airport)} // Al hacer click, cambia el estado y carga la siguiente vista
                        className="group relative h-48 rounded-2xl overflow-hidden cursor-pointer shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                    >
                        {/* Imagen de fondo con efecto zoom al pasar el ratón */}
                        <div className="absolute inset-0">
                            <img src={airport.img} alt={airport.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors"></div>
                        </div>
                        {/* Texto sobre la imagen */}
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

  // ESCENA 2: LA LISTA DE VUELOS (Radar)

  return (
    <div className="relative max-w-4xl mx-auto px-4 py-6">
      {/* Cabecera con botón "Atrás" */}
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
          // Extraemos la info de predicción 
          const delayMinutes = flight.prediction?.delay_minutes || 0;
          const status = flight.prediction?.status || 'on_time';
          
          // FLAG VISUAL: Lógica para decidir colores según el estado
          let statusColor = 'green';
          let labelText = 'ON TIME';
          
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
              labelText = 'TAXI/GND'; // Azul si está rodando en pista
          }

          // Diccionarios de estilos CSS según el color elegido arriba
          const colors = {
              green: 'bg-green-50 text-green-700 border-green-200',
              red: 'bg-red-50 text-red-700 border-red-200',
              yellow: 'bg-yellow-50 text-yellow-700 border-yellow-200',
              blue: 'bg-blue-50 text-blue-700 border-blue-200'
          };
          const dots = {
              green: 'bg-green-500', 
              red: 'bg-red-500', 
              yellow: 'bg-yellow-500', 
              blue: 'bg-blue-500'
          };

          return (
            <div
              key={`${flight.callsign}-${i}`}
              onClick={() => handleFlightClick(flight)} 
              className="group relative bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 hover:shadow-lg hover:scale-[1.01] transition-all duration-300 cursor-pointer overflow-hidden"
            >
              {/* Barra lateral de color indicador */}
              <div className={`absolute left-0 top-0 bottom-0 w-1 bg-${statusColor}-500`}></div>
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pl-3">
                
                {/* Info Principal: Bandera, Callsign y Ruta */}
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center shadow-sm text-2xl font-bold text-gray-400">
                    {/* Intentamos cargar la bandera del país. Si falla, se oculta. */}
                    <img src={`https://flagcdn.com/w40/${flight.countryCode?.toLowerCase()}.png`} alt={flight.country} className="w-8 rounded shadow-sm" onError={e => e.target.style.display = 'none'} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white leading-none tracking-tight">{flight.callsign}</h3>
                    <div className="flex items-center gap-2 mt-1.5 text-sm font-medium text-gray-500 dark:text-gray-400">
                       {/* Resaltamos en azul si el origen/destino es el aeropuerto que estamos mirando */}
                       <span className={`px-2 py-0.5 rounded text-xs font-mono ${flight.departure === selectedAirport.iata ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 dark:bg-gray-700'}`}>{flight.departure}</span>
                       <span className="text-gray-300">➜</span>
                       <span className={`px-2 py-0.5 rounded text-xs font-mono ${flight.arrival === selectedAirport.iata ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 dark:bg-gray-700'}`}>{flight.arrival}</span>
                    </div>
                  </div>
                </div>

                {/* Telemetría: Altitud y Velocidad */}
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

                {/* Estado (Derecha): On Time, Delayed, etc. */}
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

        {/* Mensaje de Carga (Spinner) */}
        {loading && <div className="text-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div><p className="mt-2 text-gray-500">Scanning local airspace...</p></div>}
        
        {/* Mensaje de "No se encontró nada" */}
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