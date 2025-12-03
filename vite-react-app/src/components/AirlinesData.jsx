import React, { useEffect, useState, useCallback, useMemo, Suspense } from "react";
import { motion } from "framer-motion";
import * as THREE from "three";
import { Canvas, useLoader } from "@react-three/fiber";
import { OrbitControls, Sphere } from "@react-three/drei";
import { TextureLoader } from "three";

// -----------------------------
//  MAPA DE AEROLÍNEAS
// -----------------------------
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
  DEFAULT: { name: (p) => p, color: "#9CA3AF" },
};

const MAX_MAP_POINTS = 500;

// -----------------------------
//  UTILIDADES
// -----------------------------
function useMaxValue(data, key) {
  return data?.length ? Math.max(...data.map((a) => a[key] || 0)) : 0;
}

// Barra totalmente RESPONSIVE horizontal
function ResponsiveBar({ value, max, delay = 0 }) {
  const percent = max > 0 ? (value / max) * 100 : 0;

  return (
    <motion.div
      className="h-4 rounded-md bg-black"
      initial={{ width: "0%" }}
      animate={{ width: `${percent}%` }}
      transition={{ duration: 0.5, delay }}
    />
  );
}

// -----------------------------
//  CHARTS RESPONSIVE REAL
// -----------------------------
function ManualBarChart({ data }) {
  const max = useMaxValue(data, "flights");
  if (!data?.length) return null;

  return (
    <div className="flex flex-col gap-3">
      {data.map((a, i) => (
        <div key={i} className="w-full">
          <div className="flex justify-between text-xs">
            <span>{a.name}</span>
            <span>{a.flights}</span>
          </div>
          <ResponsiveBar value={a.flights} max={max} delay={i * 0.04} />
        </div>
      ))}
    </div>
  );
}

function ManualStackedBarChart({ data }) {
  const max = useMaxValue(data, "inAir");
  if (!data?.length) return null;

  return (
    <div className="flex flex-col gap-3">
      {data.map((a, i) => {
        const inAir = max ? (a.inAir / max) * 100 : 0;
        const onGround = max ? (a.onGround / max) * 100 : 0;

        return (
          <div key={i}>
            <div className="flex justify-between text-xs">
              <span>{a.name}</span>
              <span>{a.inAir} aire / {a.onGround} tierra</span>
            </div>

            <div className="flex w-full h-4 rounded-md overflow-visible">
              <motion.div
                className="bg-black"
                initial={{ width: "0%" }}
                animate={{ width: `${inAir}%` }}
                transition={{ duration: 0.5, delay: i * 0.04 }}
              />

              <motion.div
                className="bg-neutral-400"
                initial={{ width: "0%" }}
                animate={{ width: `${onGround}%` }}
                transition={{ duration: 0.5, delay: i * 0.04 }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function AltitudeChart({ data }) {
  const max = useMaxValue(data, "avgAltitude");
  if (!data?.length) return null;

  return (
    <div className="flex flex-col gap-3">
      {data.map((a, i) => (
        <div key={i}>
          <div className="flex justify-between text-xs">
            <span>{a.name}</span>
            <span>{a.avgAltitude} m</span>
          </div>
          <ResponsiveBar value={a.avgAltitude} max={max} delay={i * 0.04} />
        </div>
      ))}
    </div>
  );
}

function FlightPhaseChart({ data }) {
  if (!data?.length) return null;

  return (
    <div className="flex flex-col gap-3">
      {data.map((a, i) => {
        const total = a.cruise + a.ascending + a.descending || 1;

        const pc = (a.cruise / total) * 100;
        const pa = (a.ascending / total) * 100;
        const pd = (a.descending / total) * 100;

        return (
          <div key={i}>
            <div className="flex justify-between text-xs">
              <span>{a.name}</span>
              <span>
                C:{a.cruise} / A:{a.ascending} / D:{a.descending}
              </span>
            </div>

            <div className="flex w-full h-4 rounded-md overflow-visible">
              <motion.div
                className="bg-black"
                initial={{ width: "0%" }}
                animate={{ width: `${pc}%` }}
                transition={{ duration: 0.5, delay: i * 0.04 }}
              />
              <motion.div
                className="bg-neutral-600"
                initial={{ width: "0%" }}
                animate={{ width: `${pa}%` }}
                transition={{ duration: 0.5, delay: i * 0.04 }}
              />
              <motion.div
                className="bg-neutral-400"
                initial={{ width: "0%" }}
                animate={{ width: `${pd}%` }}
                transition={{ duration: 0.5, delay: i * 0.04 }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// -----------------------------
//  GLOBO 3D CON TEXTURA
// -----------------------------
function Globe3D({ positions = [] }) {
  // Carga de la textura (imagen de la tierra)
  const earthTexture = useLoader(
    TextureLoader,
    "https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_atmos_2048.jpg"
  );

  const sphereGeometry = useMemo(() => new THREE.SphereGeometry(0.005, 8, 8), []);
  const baseMaterial = useMemo(() => new THREE.MeshBasicMaterial(), []);

  const latLonToCartesian = (lat, lon, r = 1) => {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);
    return [
      -r * Math.sin(phi) * Math.cos(theta),
      r * Math.cos(phi),
      r * Math.sin(phi) * Math.sin(theta),
    ];
  };

  return (
    <>
      <ambientLight intensity={1.2} />
      <directionalLight position={[5, 3, 5]} intensity={1.5} />

      {/* Esfera con textura */}
      <Sphere args={[1, 64, 64]}>
        <meshStandardMaterial map={earthTexture} roughness={0.7} metalness={0.1} />
      </Sphere>

      {/* Puntos (aviones) */}
      {positions.map((p, i) => {
        const [x, y, z] = latLonToCartesian(p.lat, p.lon, 1.015);
        const mat = baseMaterial.clone();
        mat.color = new THREE.Color(p.color || "#000");

        return <mesh key={i} geometry={sphereGeometry} position={[x, y, z]} material={mat} />;
      })}
    </>
  );
}

// -----------------------------
//  MAIN COMPONENT
// -----------------------------
export default function AirlinesDashboardMinimal() {
  const [airlines, setAirlines] = useState([]);
  const [positions, setPositions] = useState([]);
  const [stats, setStats] = useState({ total: 0, top: "—", topCount: 0 });
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);

    try {
      const res = await fetch("https://opensky-network.org/api/states/all");
      const data = await res.json();

      const counts = {};
      const pos = [];

      for (const f of data.states || []) {
        const callsign = (f[1] || "").trim();
        const prefix = callsign.slice(0, 3).toUpperCase();
        const onGround = !!f[8];

        if (prefix) {
          if (!counts[prefix])
            counts[prefix] = {
              total: 0,
              onGround: 0,
              inAir: 0,
              altTotal: 0,
              altCount: 0,
              ascending: 0,
              descending: 0,
              cruise: 0,
            };

          counts[prefix].total++;
          if (onGround) counts[prefix].onGround++;
          else {
            counts[prefix].inAir++;
            const alt = f[7];
            const vr = f[11];

            if (alt) {
              counts[prefix].altTotal += alt;
              counts[prefix].altCount++;
            }

            if (vr > 1) counts[prefix].ascending++;
            else if (vr < -1) counts[prefix].descending++;
            else counts[prefix].cruise++;
          }
        }

        if (pos.length < MAX_MAP_POINTS && f[5] && f[6] && !onGround) {
          const map = AIRLINE_MAP[prefix] || AIRLINE_MAP.DEFAULT;
          pos.push({
            lat: f[6],
            lon: f[5],
            color: map.color,
          });
        }
      }

      const sorted = Object.entries(counts).sort((a, b) => b[1].total - a[1].total);
      const mapped = sorted.slice(0, 10).map(([prefix, d]) => {
        const info = AIRLINE_MAP[prefix] || AIRLINE_MAP.DEFAULT;
        return {
          name: typeof info.name === "function" ? info.name(prefix) : info.name,
          flights: d.total,
          onGround: d.onGround,
          inAir: d.inAir,
          avgAltitude: d.altCount ? Math.round(d.altTotal / d.altCount) : 0,
          ascending: d.ascending,
          descending: d.descending,
          cruise: d.cruise,
        };
      });

      setAirlines(mapped);
      setPositions(pos);
      setStats({
        total: data.states.length,
        top: mapped[0]?.name || "—",
        topCount: mapped[0]?.flights || 0,
      });
      setLastUpdated(new Date());
    } catch (e) {
      console.error(e);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
    const i = setInterval(fetchData, 300000);
    return () => clearInterval(i);
  }, [fetchData]);

  return (
    <div className="min-h-screen bg-white text-black p-4 flex flex-col gap-6 max-w-5xl mx-auto overflow-visible">

      <header className="flex flex-col md:flex-row justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Tráfico Aéreo Global</h1>
          <p className="text-sm text-neutral-600">Minimal, texturas 3D, responsive</p>
        </div>

        <div className="flex items-center gap-3 text-sm">
          <span>Última: {lastUpdated ? lastUpdated.toLocaleTimeString() : "—"}</span>
          <button
            onClick={fetchData}
            className="border px-3 py-2 rounded-md hover:bg-black hover:text-white transition"
          >
            {loading ? "Cargando..." : "Actualizar"}
          </button>
        </div>
      </header>

      {/* CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 border rounded-xl">
          <div className="text-sm text-neutral-600">Vuelos activos</div>
          <div className="text-2xl font-bold">{stats.total}</div>
        </div>

        <div className="p-4 border rounded-xl">
          <div className="text-sm text-neutral-600">Aerolínea top</div>
          <div className="text-2xl font-bold">{stats.top}</div>
        </div>

        <div className="p-4 border rounded-xl">
          <div className="text-sm text-neutral-600">Vuelos de esa aerolínea</div>
          <div className="text-2xl font-bold">{stats.topCount}</div>
        </div>
      </div>

      {/* CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-4 border rounded-xl">
          <h3 className="font-medium mb-2">Top 10 Aerolíneas</h3>
          <ManualBarChart data={airlines} />
        </div>

        <div className="p-4 border rounded-xl">
          <h3 className="font-medium mb-2">Aire vs Tierra</h3>
          <ManualStackedBarChart data={airlines} />
        </div>

        <div className="p-4 border rounded-xl">
          <h3 className="font-medium mb-2">Altitud media</h3>
          <AltitudeChart data={airlines} />
        </div>

        <div className="p-4 border rounded-xl">
          <h3 className="font-medium mb-2">Fases de vuelo</h3>
          <FlightPhaseChart data={airlines} />
        </div>
      </div>

      {/* MAPA 3D */}
      <div className="p-4 border rounded-xl overflow-visible">
        <h3 className="font-medium mb-3">Mapa 3D (vuelos en aire)</h3>

        <div className="h-80 w-full rounded-xl overflow-hidden bg-neutral-900 shadow-inner relative">
          <Canvas
            style={{ width: "100%", height: "100%" }}
            camera={{ position: [0, 0, 2.5], fov: 60 }}
          >
            <OrbitControls enableZoom={true} enablePan={false} autoRotate autoRotateSpeed={0.5} />
            <Suspense fallback={null}>
              <Globe3D positions={positions} />
            </Suspense>
          </Canvas>

          {/* Indicador de carga simple si la textura tarda */}
          <div className="absolute bottom-2 right-2 text-white text-xs opacity-50 pointer-events-none">
            Interactúa para rotar
          </div>
        </div>
      </div>

    </div>
  );
}