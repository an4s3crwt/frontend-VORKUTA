import React, { useEffect, useState, useRef } from 'react';
import api from '../api';

// --- CONFIGURACIÓN: LAS AEROLÍNEAS DE TU DEMO ---
const TOP_AIRLINES = [
  { iata: 'IBE', name: 'Iberia', logo: 'https://images.kiwi.com/airlines/64/IB.png', color: 'red' },
  { iata: 'VLG', name: 'Vueling', logo: 'https://images.kiwi.com/airlines/64/VY.png', color: 'yellow' },
  { iata: 'RYR', name: 'Ryanair', logo: 'https://images.kiwi.com/airlines/64/FR.png', color: 'blue' },
  { iata: 'AEA', name: 'Air Europa', logo: 'https://images.kiwi.com/airlines/64/UX.png', color: 'blue' },
  { iata: 'LHT', name: 'Lufthansa', logo: 'https://images.kiwi.com/airlines/64/LH.png', color: 'yellow' },
  { iata: 'AFR', name: 'Air France', logo: 'https://images.kiwi.com/airlines/64/AF.png', color: 'blue' },
  { iata: 'BAW', name: 'British Airways', logo: 'https://images.kiwi.com/airlines/64/BA.png', color: 'red' },
  { iata: 'UAE', name: 'Emirates', logo: 'https://images.kiwi.com/airlines/64/EK.png', color: 'red' },
  { iata: 'DAL', name: 'Delta Air Lines', logo: 'https://images.kiwi.com/airlines/64/DL.png', color: 'blue' },
];

export default function AirlinesData() {
  const [airlineStats, setAirlineStats] = useState({});
  const [loading, setLoading] = useState(true);

  // Referencia para no llamar mil veces
  const loaded = useRef(false);

  // === 🧠 LÓGICA DE ANÁLISIS ===
  const analyzeAirlines = async () => {
    if (loaded.current) return;
    loaded.current = true;
    setLoading(true);

    try {
      // 1. Pedimos TODO el tráfico aéreo (Ojo: esto es pesado, pero para la demo de aerolíneas es necesario)
      // Si tarda mucho, podrías hacer un endpoint en Laravel que filtre por ICAO prefix, pero probemos así.
      const response = await api.get('/flights/live'); 
      const allFlights = response.data.states || [];

      const stats = {};

      // 2. Inicializamos contadores
      TOP_AIRLINES.forEach(airline => {
        stats[airline.iata] = { 
          count: 0, 
          totalSpeed: 0, 
          totalAlt: 0,
          groundCount: 0,
          airCount: 0
        };
      });

      // 3. Procesamos los 10.000 vuelos en memoria (JS es rápido para esto)
      allFlights.forEach(flight => {
        const callsign = flight[1]?.trim();
        if (!callsign) return;

        // Detectamos la aerolínea por las 3 primeras letras del Callsign (Ej: IBE123 -> IBE)
        const prefix = callsign.substring(0, 3);

        if (stats[prefix]) {
          stats[prefix].count++;
          stats[prefix].totalSpeed += (flight[9] || 0); // velocity
          stats[prefix].totalAlt += (flight[13] || flight[7] || 0); // geo_altitude
          
          if (flight[8]) { // on_ground
            stats[prefix].groundCount++;
          } else {
            stats[prefix].airCount++;
          }
        }
      });

      setAirlineStats(stats);

    } catch (error) {
      console.error("Error analizando aerolíneas:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    analyzeAirlines();
  }, []);

  // === RENDER ===
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-3">Airline Performance Monitor</h1>
        <p className="text-gray-500 max-w-2xl mx-auto">
          Real-time analysis of fleet activity and operational status for major carriers based on live OpenSky telemetry.
        </p>
      </div>

      {loading ? (
         <div className="flex flex-col items-center justify-center py-20">
             <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
             <p className="text-gray-400 animate-pulse">Aggregating global flight data...</p>
         </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {TOP_AIRLINES.map((airline) => {
            const data = airlineStats[airline.iata] || { count: 0, groundCount: 0, airCount: 0, totalSpeed: 0, totalAlt: 0 };
            const avgSpeed = data.airCount > 0 ? Math.round((data.totalSpeed / data.airCount) * 3.6) : 0;
            const isActive = data.count > 0;
            
            // Calculamos un "Health Score" ficticio basado en la actividad
            // (Más aviones en aire vs tierra = mejor salud operativa)
            const efficiency = data.count > 0 ? Math.round((data.airCount / data.count) * 100) : 0;
            
            let statusColor = 'green';
            let statusText = 'OPTIMAL';
            if (efficiency < 40 && isActive) { statusColor = 'yellow'; statusText = 'HIGH GROUND TRAFFIC'; }
            if (!isActive) { statusColor = 'gray'; statusText = 'NO DATA'; }

            return (
              <div key={airline.iata} className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition border border-gray-100 dark:border-gray-700 relative overflow-hidden">
                {/* Cabecera */}
                <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-gray-50 p-3 flex items-center justify-center">
                            <img src={airline.logo} alt={airline.name} className="w-full h-full object-contain" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">{airline.name}</h3>
                            <span className="text-xs font-mono text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">{airline.iata}</span>
                        </div>
                    </div>
                    {/* Badge de Estado */}
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-wide border ${
                        statusColor === 'green' ? 'bg-green-50 text-green-600 border-green-200' : 
                        statusColor === 'yellow' ? 'bg-yellow-50 text-yellow-600 border-yellow-200' : 
                        'bg-gray-50 text-gray-400 border-gray-200'
                    }`}>
                        {statusText}
                    </span>
                </div>

                {/* Métricas Principales */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">{data.count}</div>
                        <div className="text-[10px] text-gray-400 uppercase tracking-wider">Total Fleet</div>
                    </div>
                    <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{data.airCount}</div>
                        <div className="text-[10px] text-blue-400 uppercase tracking-wider">In Air</div>
                    </div>
                    <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                        <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{avgSpeed}</div>
                        <div className="text-[10px] text-purple-400 uppercase tracking-wider">Avg Km/h</div>
                    </div>
                </div>

                {/* Barra de Progreso (Eficiencia) */}
                <div>
                    <div className="flex justify-between text-xs mb-2">
                        <span className="text-gray-500">Fleet Utilization (Airborne)</span>
                        <span className="font-bold text-gray-700 dark:text-gray-300">{efficiency}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                        <div 
                            className={`h-full rounded-full transition-all duration-1000 ${
                                efficiency > 70 ? 'bg-green-500' : 'bg-yellow-400'
                            }`} 
                            style={{ width: `${efficiency}%` }}
                        ></div>
                    </div>
                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}