import React, { useEffect, useState, useRef } from 'react';
import api from './../api';

// =============================================================================
// BLOQUE 1: CONSTANTES Y CONFIGURACIÓN ESTÁTICA
// =============================================================================

/**
 * Lista maestra de Aerolíneas VIP ("Target Airlines").
 * *
 * En lugar de procesar las miles de aerolíneas que existen en el tráfico aéreo mundial,
 * definimos un subconjunto. Esto actúa como un filtro
 * 
 * * ESTRUCTURA DE DATOS:
 * Array de objetos JSON. Se incluyen los logos desde una web  externa (Kiwi.com)
 * 
 */
const TOP_AIRLINES = [
  { iata: 'IBE', name: 'Iberia', logo: 'https://images.kiwi.com/airlines/64/IB.png' },
  { iata: 'VLG', name: 'Vueling', logo: 'https://images.kiwi.com/airlines/64/VY.png' },
  { iata: 'RYR', name: 'Ryanair', logo: 'https://images.kiwi.com/airlines/64/FR.png' },
  { iata: 'AEA', name: 'Air Europa', logo: 'https://images.kiwi.com/airlines/64/UX.png' },
  { iata: 'LHT', name: 'Lufthansa', logo: 'https://images.kiwi.com/airlines/64/LH.png' },
  { iata: 'AFR', name: 'Air France', logo: 'https://images.kiwi.com/airlines/64/AF.png' },
  { iata: 'BAW', name: 'British Airways', logo: 'https://images.kiwi.com/airlines/64/BA.png' },
  { iata: 'UAE', name: 'Emirates', logo: 'https://images.kiwi.com/airlines/64/EK.png' },
  { iata: 'DAL', name: 'Delta Air Lines', logo: 'https://images.kiwi.com/airlines/64/DL.png' },
  { iata: 'AAL', name: 'American Airlines', logo: 'https://images.kiwi.com/airlines/64/AA.png' },
  { iata: 'KLM', name: 'KLM Royal Dutch', logo: 'https://images.kiwi.com/airlines/64/KL.png' },
  { iata: 'QTR', name: 'Qatar Airways', logo: 'https://images.kiwi.com/airlines/64/QR.png' },
];

export default function AirlinesData() {
  
  // ===========================================================================
  // BLOQUE 2: GESTIÓN DEL ESTADO
  // ===========================================================================

  // Almacena el resultado final del procesamiento de datos.
  // Es un Objeto (Map) donde la clave es el código IATA  y el valor sus estadísticas.
  const [airlineStats, setAirlineStats] = useState({});

  // Controla el estado visual de la interfaz. True = Muestra Spinner, False = Muestra Datos
  const [loading, setLoading] = useState(true);

  // Métrica para mostrar al usuario el volumen total de datos analizados.
  const [totalFlightsScanned, setTotalFlightsScanned] = useState(0);

  /**
   * Esta variable actúa como una flag que persiste entre renders para evitar que la
   * petición a la API se dispare dos veces innecesariamente.
   */
  const dataLoaded = useRef(false);

  // ===========================================================================
  // BLOQUE 3: LÓGICA DE PROCESAMIENTO DE DATOS
  // ===========================================================================

  /**
   * Función asíncrona principal.
   * Realiza la petición, procesa la matriz de datos crudos y actualiza el estado.
   */
  const analyzeGlobalTraffic = async () => {
    // Si ya hemos cargado datos, cortamos la ejecución
    if (dataLoaded.current) return;
    dataLoaded.current = true;
    
    setLoading(true);

    try {
      // 1. PETICIÓN HTTP
      // Solicitamos los datos completos del tráfico aéreo al backend.
      const response = await api.get('/flights/live');
      
      // La API de OpenSky  devuelvw un array de arrays (matriz) llamado 'states'.
      const allFlights = response.data.states || [];
      
      // Actualizamos el contador global antes de filtrar.
      setTotalFlightsScanned(allFlights.length);

      const stats = {};

      // 2. INICIALIZACIÓN DE ESTRUCTURA (HASH MAP)
      // Preparamos el objeto acumulador solo para las aerolíneas que nos interesan.
      
      TOP_AIRLINES.forEach(airline => {
        stats[airline.iata] = {
          count: 0,          // Total de aviones detectados
          airCount: 0,       // Aviones volando
          groundCount: 0,    // Aviones en pista/taxi
          totalVelocity: 0,  // Suma de velocidades (para la media)
          totalAltitude: 0   // Suma de altitudes (para la media)
        };
      });

      // 3. ITERACIÓN MASIVA 
      // Recorremos miles de vuelos (mas de 10,000+).
      allFlights.forEach(flight => {
        // Posición [1] del array es el callsign (ej: IBE3245)
        const callsign = flight[1]?.trim();
        
        // Validación: si no hay callsign, saltamos esta iteración.
        if (!callsign) return;

        
        // Asumimos que los 3 primeros caracteres del callsign corresponden al código ICAO/IATA
        // de la aerolínea. Ej: IBE... -> Iberia. Para poder saber la aerolinea , ya que la API no devueelve aerolinea como tal
        const prefix = callsign.substring(0, 3);

        // 4. FILTRADO 
        // Verificamos si este prefijo existe en nuestro objeto 'stats'
        
        if (stats[prefix]) {
          // Si coincide, es una aerolínea VIP. Acumulamos datos.
          stats[prefix].count++;

          // Mapeo de columnas según la API (OpenSky):
          // [8] -> on_ground (booleano): true si está en tierra.
          // [9] -> velocity (float): velocidad en m/s.
          // [13] -> geo_altitude / [7] -> baro_altitude.
          const onGround = flight[8];
          const velocity = flight[9] || 0;
          
          // Preferimos altitud geométrica [13], si no hay, barométrica [7].
          const altitude = flight[13] || flight[7] || 0; 

          if (onGround) {
            stats[prefix].groundCount++;
          } else {
            stats[prefix].airCount++;
            // Acumulamos valores físicos para calcular medias aritméticas después
            stats[prefix].totalVelocity += velocity;
            stats[prefix].totalAltitude += altitude;
          }
        }
      });

      // Una vez procesado todo el bucle, actualizamos el estado de React.
      // Esto dispara el re-renderizado de la interfaz.
      setAirlineStats(stats);

    } catch (error) {
      // Manejo básico de errores para evitar pantalla blanca
      console.error("Error analizando tráfico:", error);
    } finally {
      // Independientemente del resultado (éxito o error), quitamos el spinner.
      setLoading(false);
    }
  };

  // useEffect con array  vacío []: 
  // Garantiza que analyzeGlobalTraffic se ejecute solo una vez al montar el componente
  useEffect(() => {
    analyzeGlobalTraffic();
  }, []);

  // ===========================================================================
  // BLOQUE 4: RENDERIZADO DE LA INTERFAZ
  // ===========================================================================
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">

      {/* --- SECCIÓN DE ENCABEZADO --- */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-3">
          Airline Fleet Monitor
        </h1>
        <p className="text-gray-500 max-w-2xl mx-auto">
          Real-time operational analysis of global carriers based on ADS-B telemetry.
        </p>

        {/*  Solo mostramos "Analizando" si ya cargó */}
        {!loading && (
          <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm font-bold border border-blue-100">
            {/* Efecto visual de "ping" (radar) usando Tailwind */}
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            {/* toLocaleString() formatea el número con separadores de miles (ej: 10,000) */}
            Analyzing {totalFlightsScanned.toLocaleString()} active aircraft globally
          </div>
        )}
      </div>

      {/* --- SECCIÓN DE CONTENIDO PRINCIPAL --- */}
      {/* Operador  para manejar estado de carga vs visualización */}
      {loading ? (
        // UI DE CARGA 
        <div className="flex flex-col items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-400 animate-pulse font-mono">Aggregating global data streams...</p>
        </div>
      ) : (
        // GRID DE TARJETAS (RESPONSIVE: 1 col móvil, 2 col tablet, 3 col desktop)
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Iteramos sobre la configuración  del array TOP_AIRLINES */}
          {TOP_AIRLINES.map((airline) => {
            
            // Extracción segura de datos. Si no hay datos (undefined), usamos valores por defecto
            const data = airlineStats[airline.iata] || { count: 0, groundCount: 0, airCount: 0, totalVelocity: 0, totalAltitude: 0 };

            // CÁLCULOS 
            // Calculamos las medias aquí en lugar de almacenarlas para evitar redundancia de estado.
            
            // 1. Velocidad: de m/s a km/h (* 3.6)
            const avgSpeed = data.airCount > 0 ? Math.round((data.totalVelocity / data.airCount) * 3.6) : 0;
            
            // 2. Altitud: de metros a pies (* 3.28084 aproximado a 3.28)
            const avgAlt = data.airCount > 0 ? Math.round((data.totalAltitude / data.airCount) * 3.28) : 0;

            // 3.
            // % de la flota que está  en el aire vs total.
            const efficiency = data.count > 0 ? Math.round((data.airCount / data.count) * 100) : 0;

           
            let statusColor = 'green';
            let statusText = 'OPTIMAL OPERATIONS';

            if (data.count === 0) {
              statusColor = 'gray'; statusText = 'NO SIGNAL';
            } else if (efficiency < 40) {
              statusColor = 'yellow'; statusText = 'HIGH GROUND TIME';
            } else if (efficiency > 85) {
              statusColor = 'blue'; statusText = 'PEAK CAPACITY';
            }

            // Diccionario de estilos Tailwind dinámicos
            const badges = {
              green: 'bg-green-50 text-green-700 border-green-200',
              yellow: 'bg-yellow-50 text-yellow-700 border-yellow-200',
              blue: 'bg-blue-50 text-blue-700 border-blue-200',
              gray: 'bg-gray-50 text-gray-500 border-gray-200'
            };

            return (
              <div key={airline.iata} className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all border border-gray-100 dark:border-gray-700 relative overflow-hidden group">

                {/* --- HEADER DE LA TARJETA --- */}
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-4">
                    {/* DIV del Logo */}
                    <div className="w-14 h-14 rounded-full bg-white p-1 border border-gray-100 shadow-sm flex items-center justify-center">
                      <img src={airline.logo} alt={airline.name} className="w-full h-full object-contain rounded-full" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">{airline.name}</h3>
                      <span className="text-xs font-mono text-gray-400">{airline.iata} CODE</span>
                    </div>
                  </div>
                  {/* Estado (color dinámico según efficiency) */}
                  <span className={`px-2 py-1 rounded text-[10px] font-bold tracking-wider border ${badges[statusColor]}`}>
                    {statusText}
                  </span>
                </div>

                {/* --- GRID DE ESTADÍSTICAS  --- */}
                <div className="grid grid-cols-3 gap-2 mb-6">
                  {/* Total Flota */}
                  <div className="text-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div className="text-xl font-bold text-gray-800 dark:text-gray-100">{data.count}</div>
                    <div className="text-[9px] text-gray-400 uppercase">Total Fleet</div>
                  </div>
                  {/* En Aire */}
                  <div className="text-center p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="text-xl font-bold text-blue-600 dark:text-blue-400">{data.airCount}</div>
                    <div className="text-[9px] text-blue-400 uppercase">Airborne</div>
                  </div>
                  {/* Velocidad Media */}
                  <div className="text-center p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <div className="text-xl font-bold text-purple-600 dark:text-purple-400">{avgSpeed}</div>
                    <div className="text-[9px] text-purple-400 uppercase">Avg km/h</div>
                  </div>
                </div>

                {/* --- BARRA DE PROGRESO DE UTILIZACIÓN --- */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500 font-medium">Fleet Utilization</span>
                    <span className="font-bold text-gray-700 dark:text-gray-300">{efficiency}%</span>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                    {/* Barra con ancho dinámico (style={{ width: % }}) y color condicional */}
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ${
                        efficiency > 70 ? 'bg-green-500' :
                        efficiency > 40 ? 'bg-blue-500' : 'bg-yellow-400'
                      }`}
                      style={{ width: `${efficiency}%` }}
                    ></div>
                  </div>
                  <p className="text-[10px] text-gray-400 text-right mt-1">
                    Avg Altitude: {avgAlt.toLocaleString()} ft
                  </p>
                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}