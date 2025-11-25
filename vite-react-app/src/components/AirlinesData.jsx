import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { motion } from "framer-motion";

// --- Importaciones para el 3D ---
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Sphere } from '@react-three/drei';
import * as THREE from 'three';

// --- Constantes ---
const AIRLINE_MAP = {
  IBE: { name: "Iberia", color: "#E83323" },
  RYR: { name: "Ryanair", color: "#003882" },
  VLG: { name: "Vueling", color: "#FFCC00" },
  DLH: { name: "Lufthansa", color: "#001A5E" },
  AFR: { name: "Air France", color: "#00205B" },
  BAW: { name: "British Airways", color: "#00306E" },
  KLM: { name: "KLM", color: "#00A1E4" },
  EZY: { name: "easyJet", color: "#FF6600" },
  UAE: { name: "Emirates", color: "#D82C1F" },
  AAL: { name: "American Airlines", color: "#0078D2" },
  DAL: { name: "Delta", color: "#A8001F" },
  UAL: { name: "United", color: "#005DAA" },
  SWR: { name: "Swiss", color: "#E2051E" },
  QTR: { name: "Qatar Airways", color: "#5C0D32" },
  THY: { name: "Turkish Airlines", color: "#C00C0C" },
  DEFAULT: { name: (prefix) => prefix, color: "#9CA3AF" },
};

const MAX_MAP_POINTS = 500;

// --- COMPONENTE GLOBO 3D (VERSIÓN SEGURA / DEPURADA) ---
function Globe3D({ positions = [] }) {
  const globeRef = useRef();

  // usar geometría y material memorizados (objetos THREE, no JSX)
  const sphereGeometry = useMemo(() => new THREE.SphereGeometry(0.005, 8, 8), []);

  // Creamos un material base y clonaremos por color (más seguro que pasar JSX)
  const baseMaterial = useMemo(() => new THREE.MeshBasicMaterial(), []);

  const latLonToCartesian = useCallback((lat, lon, radius = 1) => {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);
    const x = -radius * Math.sin(phi) * Math.cos(theta);
    const y = radius * Math.cos(phi);
    const z = radius * Math.sin(phi) * Math.sin(theta);
    return [x, y, z];
  }, []);

  // Aseguramos que positions sea siempre un array
  const safePositions = Array.isArray(positions) ? positions : [];

  return (
    <>
      <ambientLight intensity={0.75} />
      <directionalLight position={[5, 3, 5]} intensity={1.5} />

      {/* Globo: usamos el componente "Sphere" de drei con un material simple */}
      <Sphere ref={globeRef} args={[1, 32, 32]}>
        <meshStandardMaterial color="#222" roughness={0.5} />
      </Sphere>

      {/* Renderizado seguro de puntos: usamos meshes simples pero con geometría memorizada */}
      {safePositions.slice(0, MAX_MAP_POINTS).map((p, idx) => {
        const [x, y, z] = latLonToCartesian(p.lat ?? 0, p.lon ?? 0, 1.005);
        // clonamos el material base para poder asignar color por instancia
        const mat = baseMaterial.clone();
        mat.color = new THREE.Color(p.color || AIRLINE_MAP.DEFAULT.color);
        mat.transparent = true;
        mat.opacity = 0.95;

        return (
          <mesh key={p.icao24 ?? idx} position={[x, y, z]} geometry={sphereGeometry} material={mat} />
        );
      })}
    </>
  );
}

// --- COMPONENTES DE GRÁFICOS (idénticos, pero asegurando defensivas menores) ---
function ManualBarChart({ data }) {
  if (!Array.isArray(data) || data.length === 0) return null;
  const maxFlights = Math.max(...data.map(a => a.flights));
  const paddingTop = 20;
  const barVariants = { initial: { filter: 'brightness(1)', scaleY: 1 }, hover: { filter: 'brightness(1.15)', scaleY: 1.03, transition: { type: 'spring', stiffness: 400, damping: 10 } } };
  const tooltipVariants = { initial: { opacity: 0, y: 5, scale: 0.95 }, hover: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 500, damping: 30 } } };

  return (
    <div className="w-full h-full flex items-end gap-1 px-6 pb-2">
      {data.map((airline, index) => {
        const barHeight = maxFlights > 0 ? (airline.flights / maxFlights) * (100 - (paddingTop / (300 / 100))) : 0;
        return (
          <motion.div key={airline.name || index} className="flex flex-col items-center flex-1 h-full pt-4 relative" initial="initial" whileHover="hover">
            <motion.div className="absolute bottom-full mb-3 w-max max-w-xs p-3 rounded-xl bg-white/70 backdrop-blur-md shadow-lg border border-white/40 z-10 pointer-events-none" variants={tooltipVariants}>
              <div className="text-black">
                <strong className="font-semibold text-xs block">{airline.name}</strong>
                <span className="text-xs text-neutral-700">Total: {airline.flights} vuelos</span>
              </div>
            </motion.div>
            <div className="relative w-full h-full flex items-end">
              <motion.div className="w-full bg-neutral-800 rounded-t-sm shadow-md origin-bottom" variants={barVariants} initial={{ height: "0%" }} animate={{ height: `${barHeight}%` }} transition={{ type: "spring", stiffness: 300, damping: 50, delay: index * 0.05 }} />
            </div>
            <span className="text-[10px] text-neutral-600 mt-2 text-center max-w-full truncate overflow-hidden">{airline.name}</span>
          </motion.div>
        );
      })}
    </div>
  );
}

function ManualStackedBarChart({ data }) {
  if (!Array.isArray(data) || data.length === 0) return null;
  const maxTotal = Math.max(...data.map(a => a.flights));
  const paddingTop = 20;
  const barVariants = { initial: { filter: 'brightness(1)', scaleY: 1 }, hover: { filter: 'brightness(1.15)', scaleY: 1.03, transition: { type: 'spring', stiffness: 400, damping: 10 } } };
  const tooltipVariants = { initial: { opacity: 0, y: 5, scale: 0.95 }, hover: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 500, damping: 30 } } };

  return (
    <div className="w-full h-full flex flex-col justify-between p-2">
      <div className="flex justify-center items-center gap-4 text-xs text-neutral-600 mb-2">
        <div className="flex items-center gap-1"><span className="w-3 h-3 bg-neutral-800 rounded-full"></span> En Vuelo</div>
        <div className="flex items-center gap-1"><span className="w-3 h-3 bg-neutral-400 rounded-full"></span> En Tierra</div>
      </div>
      <div className="flex-grow flex items-end gap-1 px-6 pb-2">
        {data.map((airline, index) => {
          const onGroundPercent = maxTotal > 0 ? (airline.onGround / maxTotal) * (100 - (paddingTop / (300 / 100))) : 0;
          const inAirPercent = maxTotal > 0 ? (airline.inAir / maxTotal) * (100 - (paddingTop / (300 / 100))) : 0;
          return (
            <motion.div key={airline.name || index} className="flex flex-col items-center flex-1 h-full pt-4 relative" initial="initial" whileHover="hover">
              <motion.div className="absolute bottom-full mb-3 w-max max-w-xs p-3 rounded-xl bg-white/70 backdrop-blur-md shadow-lg border border-white/40 z-10 pointer-events-none" variants={tooltipVariants}>
                <div className="text-black">
                  <strong className="font-semibold text-xs block">{airline.name}</strong>
                  <span className="text-xs text-neutral-700 block">En Vuelo: {airline.inAir}</span>
                  <span className="text-xs text-neutral-700 block">En Tierra: {airline.onGround}</span>
                </div>
              </motion.div>
              <div className="relative w-full h-full flex flex-col justify-end">
                <motion.div className="w-full bg-neutral-800 rounded-t-sm shadow-sm origin-bottom" variants={barVariants} initial={{ height: "0%" }} animate={{ height: `${inAirPercent}%` }} transition={{ type: "spring", stiffness: 300, damping: 50, delay: index * 0.05 }} />
                <motion.div className="w-full bg-neutral-400 shadow-sm origin-bottom" variants={barVariants} initial={{ height: "0%" }} animate={{ height: `${onGroundPercent}%` }} transition={{ type: "spring", stiffness: 300, damping: 50, delay: index * 0.05 }} />
              </div>
              <span className="text-[10px] text-neutral-600 mt-2 text-center max-w-full truncate overflow-hidden">{airline.name}</span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function AltitudeChart({ data }) {
  if (!Array.isArray(data) || data.length === 0) return null;
  const maxAltitude = Math.max(...data.map(a => a.avgAltitude));
  const paddingTop = 20;
  const barVariants = { initial: { filter: 'brightness(1)', scaleY: 1 }, hover: { filter: 'brightness(1.15)', scaleY: 1.03, transition: { type: 'spring', stiffness: 400, damping: 10 } } };
  const tooltipVariants = { initial: { opacity: 0, y: 5, scale: 0.95 }, hover: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 500, damping: 30 } } };

  return (
    <div className="w-full h-full flex items-end gap-1 px-6 pb-2">
      {data.map((airline, index) => {
        const barHeight = maxAltitude > 0 ? (airline.avgAltitude / maxAltitude) * (100 - (paddingTop / (300 / 100))) : 0;
        return (
          <motion.div key={airline.name || index} className="flex flex-col items-center flex-1 h-full pt-4 relative" initial="initial" whileHover="hover">
            <motion.div className="absolute bottom-full mb-3 w-max max-w-xs p-3 rounded-xl bg-white/70 backdrop-blur-md shadow-lg border border-white/40 z-10 pointer-events-none" variants={tooltipVariants}>
              <div className="text-black">
                <strong className="font-semibold text-xs block">{airline.name}</strong>
                <span className="text-xs text-neutral-700">Altitud media: {airline.avgAltitude.toLocaleString('es-ES')} m</span>
              </div>
            </motion.div>
            <div className="relative w-full h-full flex items-end">
              <motion.div className="w-full bg-neutral-800 rounded-t-sm shadow-md origin-bottom" variants={barVariants} initial={{ height: "0%" }} animate={{ height: `${barHeight}%` }} transition={{ type: "spring", stiffness: 300, damping: 50, delay: index * 0.05 }} />
            </div>
            <span className="text-[10px] text-neutral-600 mt-2 text-center max-w-full truncate overflow-hidden">{airline.name}</span>
          </motion.div>
        );
      })}
    </div>
  );
}

function FlightPhaseChart({ data }) {
  if (!Array.isArray(data) || data.length === 0) return null;
  const paddingTop = 20;
  const barVariants = { initial: { filter: 'brightness(1)', scaleY: 1 }, hover: { filter: 'brightness(1.15)', scaleY: 1.03, transition: { type: 'spring', stiffness: 400, damping: 10 } } };
  const tooltipVariants = { initial: { opacity: 0, y: 5, scale: 0.95 }, hover: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 500, damping: 30 } } };

  return (
    <div className="w-full h-full flex flex-col justify-between p-2">
      <div className="flex justify-center items-center gap-3 text-xs text-neutral-600 mb-2">
        <div className="flex items-center gap-1"><span className="w-3 h-3 bg-neutral-800 rounded-full"></span> Crucero</div>
        <div className="flex items-center gap-1"><span className="w-3 h-3 bg-neutral-600 rounded-full"></span> Ascenso</div>
        <div className="flex items-center gap-1"><span className="w-3 h-3 bg-neutral-400 rounded-full"></span> Descenso</div>
      </div>
      <div className="flex-grow flex items-end gap-1 px-6 pb-2">
        {data.map((airline, index) => {
          const totalInAir = airline.cruise + airline.ascending + airline.descending;
          const cruisePercent = totalInAir > 0 ? (airline.cruise / totalInAir) * (100 - (paddingTop / (300 / 100))) : 0;
          const ascendingPercent = totalInAir > 0 ? (airline.ascending / totalInAir) * (100 - (paddingTop / (300 / 100))) : 0;
          const descendingPercent = totalInAir > 0 ? (airline.descending / totalInAir) * (100 - (paddingTop / (300 / 100))) : 0;
          return (
            <motion.div key={airline.name || index} className="flex flex-col items-center flex-1 h-full pt-4 relative" initial="initial" whileHover="hover">
              <motion.div className="absolute bottom-full mb-3 w-max max-w-xs p-3 rounded-xl bg-white/70 backdrop-blur-md shadow-lg border border-white/40 z-10 pointer-events-none" variants={tooltipVariants}>
                <div className="text-black">
                  <strong className="font-semibold text-xs block">{airline.name}</strong>
                  <span className="text-xs text-neutral-700 block">Crucero: {airline.cruise}</span>
                  <span className="text-xs text-neutral-700 block">Ascenso: {airline.ascending}</span>
                  <span className="text-xs text-neutral-700 block">Descenso: {airline.descending}</span>
                </div>
              </motion.div>
              <div className="relative w-full h-full flex flex-col justify-end">
                <motion.div className="w-full bg-neutral-800 rounded-t-sm shadow-sm origin-bottom" variants={barVariants} initial={{ height: "0%" }} animate={{ height: `${cruisePercent}%` }} transition={{ type: "spring", stiffness: 300, damping: 50, delay: index * 0.05 }} />
                <motion.div className="w-full bg-neutral-600 shadow-sm origin-bottom" variants={barVariants} initial={{ height: "0%" }} animate={{ height: `${ascendingPercent}%` }} transition={{ type: "spring", stiffness: 300, damping: 50, delay: index * 0.05 }} />
                <motion.div className="w-full bg-neutral-400 shadow-sm origin-bottom" variants={barVariants} initial={{ height: "0%" }} animate={{ height: `${descendingPercent}%` }} transition={{ type: "spring", stiffness: 300, damping: 50, delay: index * 0.05 }} />
              </div>
              <span className="text-[10px] text-neutral-600 mt-2 text-center max-w-full truncate overflow-hidden">{airline.name}</span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// --- COMPONENTE PRINCIPAL ---
export default function AirlinesDashboardApple() {
  const [airlines, setAirlines] = useState([]);
  const [positions, setPositions] = useState([]);
  const [stats, setStats] = useState({ total: 0, top: "", topCount: 0 });
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [error, setError] = useState(null);

  const OPENSKY_USERNAME = "an4s3crwt";
const OPENSKY_PASSWORD = "Mentaybolita1";

const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const auth = btoa(`${OPENSKY_USERNAME}:${OPENSKY_PASSWORD}`);
      const res = await fetch("https://opensky-network.org/api/states/all", {
        headers: {
          "Authorization": `Basic ${auth}`
        }
      });
      if (!res.ok) throw new Error("La respuesta de la red no fue exitosa");

      const data = await res.json();
      if (!data || !Array.isArray(data.states)) throw new Error("No se recibieron datos de vuelos.");

      const counts = {};
      const positionsData = [];

      for (const f of data.states) {
        if (!f) continue;
        const callsign = f[1];
        const onGround = !!f[8];
        const prefix = (callsign || "").slice(0, 3).toUpperCase();

        if (prefix) {
          if (!counts[prefix]) {
            counts[prefix] = {
              total: 0, onGround: 0, inAir: 0,
              altTotal: 0, altCount: 0,
              ascending: 0, descending: 0, cruise: 0
            };
          }

          counts[prefix].total++;

          if (onGround) {
            counts[prefix].onGround++;
          } else {
            counts[prefix].inAir++;

            const altitude = f[7];
            const vertRate = f[11];

            if (altitude != null) {
              counts[prefix].altTotal += altitude;
              counts[prefix].altCount++;
            }

            if (vertRate != null) {
              if (vertRate > 1) {
                counts[prefix].ascending++;
              } else if (vertRate < -1) {
                counts[prefix].descending++;
              } else {
                counts[prefix].cruise++;
              }
            } else {
              counts[prefix].cruise++;
            }
          }
        }

        if (positionsData.length < MAX_MAP_POINTS && f[5] != null && f[6] != null && !onGround) {
          const airlineInfo = AIRLINE_MAP[prefix] || AIRLINE_MAP.DEFAULT;

          positionsData.push({
            icao24: f[0],
            callsign: callsign || "N/A",
            originCountry: f[2],
            lon: f[5],
            lat: f[6],
            velocity: Math.round((f[9] || 0) * 3.6),
            color: airlineInfo.color || AIRLINE_MAP.DEFAULT.color,
          });
        }
      }

      const sorted = Object.entries(counts || {}).sort((a, b) => b[1].total - a[1].total);

      const mappedAirlines = sorted.slice(0, 10).map(([prefix, data]) => {
        const airlineInfo = AIRLINE_MAP[prefix] || AIRLINE_MAP.DEFAULT;
        return {
          prefix,
          name: typeof airlineInfo.name === 'function' ? airlineInfo.name(prefix) : airlineInfo.name,
          flights: data.total,
          onGround: data.onGround,
          inAir: data.inAir,
          avgAltitude: data.altCount > 0 ? Math.round(data.altTotal / data.altCount) : 0,
          ascending: data.ascending,
          descending: data.descending,
          cruise: data.cruise,
        };
      });

      setAirlines(mappedAirlines);
      setPositions(positionsData);
      setStats({
        total: Array.isArray(data.states) ? data.states.length : 0,
        top: mappedAirlines[0]?.name || "—",
        topCount: mappedAirlines[0]?.flights || 0,
      });
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Error fetching OpenSky data:", err);
      setError(`Error: ${err?.message || String(err)}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 300000);
    return () => clearInterval(interval);
  }, [fetchData]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-100 to-neutral-300 text-black font-[Inter] flex flex-col items-center p-10">
      <div className="max-w-[1300px] w-full flex flex-col gap-8">
        
        <header className="flex items-center justify-between">
          <h1 className="text-4xl font-semibold tracking-tight drop-shadow-sm">Tráfico Aéreo Global</h1>
          <button
            onClick={fetchData}
            disabled={loading}
            className="px-4 py-2 rounded-2xl bg-white/30 backdrop-blur-xl border border-white/40 shadow-lg text-sm font-semibold hover:bg-white/50 transition disabled:opacity-50"
          >
            {loading ? "Actualizando..." : "Actualizar"}
          </button>
        </header>

        <div className="text-sm text-neutral-600">
          Última actualización: {lastUpdated ? lastUpdated.toLocaleTimeString() : "..."}
        </div>
        
        {error && (
          <div className="p-4 rounded-xl bg-red-100 text-red-800 border border-red-300">
            {error}
          </div>
        )}

        {loading && !airlines.length ? (
          <p className="text-center text-neutral-500 py-16">Cargando datos...</p>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              {[
                { label: "Vuelos activos", value: stats.total },
                { label: "Aerolínea más activa", value: stats.top },
                { label: "Vuelos de esa aerolínea", value: stats.topCount },
              ].map((card, i) => (
                <div key={i} className="rounded-3xl p-6 bg-white/40 backdrop-blur-2xl border border-white/50 shadow-xl">
                  <p className="text-sm text-neutral-600">{card.label}</p>
                  <p className="text-3xl font-bold mt-2">{card.value}</p>
                </div>
              ))}
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="rounded-3xl p-6 bg-white/40 backdrop-blur-2xl border border-white/50 shadow-xl h-[380px] flex flex-col">
                <h3 className="text-lg font-semibold mb-4 text-center">Top 10 Aerolíneas (Total)</h3>
                <div className="h-[300px] flex-grow">
                  <ManualBarChart data={airlines} />
                </div>
              </div>
              <div className="rounded-3xl p-6 bg-white/40 backdrop-blur-2xl border border-white/50 shadow-xl h-[380px] flex flex-col">
                <h3 className="text-lg font-semibold mb-2 text-center">Actividad de Flota (Top 10)</h3>
                <div className="h-[300px] flex-grow">
                  <ManualStackedBarChart data={airlines} />
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="rounded-3xl p-6 bg-white/40 backdrop-blur-2xl border border-white/50 shadow-xl h-[380px] flex flex-col">
                <h3 className="text-lg font-semibold mb-4 text-center">Perfil de Vuelo (Altitud Media)</h3>
                <div className="h-[300px] flex-grow">
                  <AltitudeChart data={airlines} />
                </div>
              </div>
              <div className="rounded-3xl p-6 bg-white/40 backdrop-blur-2xl border border-white/50 shadow-xl h-[380px] flex flex-col">
                <h3 className="text-lg font-semibold mb-2 text-center">Fases de Vuelo (Flota en Aire)</h3>
                <div className="h-[300px] flex-grow">
                  <FlightPhaseChart data={airlines} />
                </div>
              </div>
            </div>

            <div className="rounded-3xl p-6 bg-white/40 backdrop-blur-2xl border border-white/50 shadow-xl h-[550px]">
              <h3 className="text-lg font-semibold mb-4">Mapa de Tráfico Aéreo (Vuelos en Aire)</h3>
              <div className="h-[480px] rounded-xl overflow-hidden">
                <Canvas camera={{ position: [0, 0, 2.5], fov: 75 }}>
                  <Globe3D positions={positions} />
                  <OrbitControls enableZoom={true} enablePan={false} />
                </Canvas>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
