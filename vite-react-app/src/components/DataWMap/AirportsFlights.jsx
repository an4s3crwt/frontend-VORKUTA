import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { motion } from "framer-motion";
import api from "./../../api"; // tu cliente axios hacia Laravel

// --- SUBCOMPONENTE GAUGE ---
const SlotGauge = ({ value }) => {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  const getColor = (v) => {
    if (v > 90) return "#ef4444";
    if (v > 75) return "#f59e0b";
    return "#10b981";
  };

  return (
    <div className="relative w-32 h-32 flex items-center justify-center">
      <svg className="w-full h-full transform -rotate-90">
        <circle
          cx="64"
          cy="64"
          r={radius}
          stroke="currentColor"
          strokeWidth="8"
          fill="transparent"
          className="text-gray-200 dark:text-neutral-800"
        />
        <circle
          cx="64"
          cy="64"
          r={radius}
          stroke={getColor(value)}
          strokeWidth="8"
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-2xl font-bold text-gray-900 dark:text-white">
          {value}%
        </span>
        <span className="text-[10px] text-gray-500 uppercase tracking-wide">
          Ocupado
        </span>
      </div>
    </div>
  );
};

// =================== COMPONENTE PRINCIPAL ===================

export default function AirportDashboard() {
  const { iata } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!iata) {
      setError("No se detectó código IATA");
      setLoading(false);
      return;
    }

    const fetchStats = async () => {
      try {
        const response = await api.get(`/airport/${iata}`);
        setData(response.data);
      } catch (e) {
        console.error(e);
        setError("No se pudieron cargar los datos del aeropuerto");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [iata]);

  if (loading)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-black">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-sm text-gray-500">
          Cargando datos de {iata}...
        </p>
      </div>
    );

  if (error)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-black">
        <p className="text-red-500">{error}</p>
      </div>
    );

  if (!data) return null;

  const flights = data.stats.flights || [];

  // Accuracy básico derivado del modelo real
  const modelAccuracy =
    flights.length > 0
      ? (
          (flights.filter((f) => f.prediction?.status === "on_time").length /
            flights.length) *
          100
        ).toFixed(1)
      : 100;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black p-4 md:p-8">
      {/* HEADER */}
      <div className="max-w-6xl mx-auto mb-8 flex flex-col md:flex-row md:items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 hover:scale-105 transition-transform text-gray-600 dark:text-gray-300 shadow-sm"
        >
          ←
        </button>

        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            {data.airport.iata}
            <span className="text-lg font-normal text-gray-500 dark:text-gray-400">
              / {data.airport.name}
            </span>
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
            {data.airport.country} • Dashboard de Operaciones & ML
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* SLOT OCCUPANCY */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-white dark:bg-neutral-900 p-6 rounded-2xl border border-gray-200 dark:border-neutral-800 shadow-sm flex flex-col items-center justify-center relative"
        >
          <div className="absolute top-4 left-6 text-sm font-medium text-gray-500 dark:text-gray-400 w-full">
            OCUPACIÓN DE SLOTS
          </div>
          <SlotGauge value={data.stats.slot_occupancy} />
        </motion.div>

        {/* HOLDING PATTERNS */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-neutral-900 p-6 rounded-2xl border border-gray-200 dark:border-neutral-800 shadow-sm"
        >
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase">
            Holding detectado (6h)
          </h3>

          <div className="flex items-baseline gap-2 mt-4">
            <span className="text-5xl font-bold text-gray-900 dark:text-white">
              {data.stats.holding_detected_6h}%
            </span>
            <span className="text-sm text-red-500 font-medium">detectados</span>
          </div>
        </motion.div>

        {/* ACTIVE FLIGHTS */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-neutral-900 p-6 rounded-2xl border border-gray-200 dark:border-neutral-800 shadow-sm"
        >
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase">
            Tráfico Tiempo Real
          </h3>
          <span className="text-5xl font-bold text-gray-900 dark:text-white mt-4 block">
            {flights.length}
          </span>

          <div className="flex items-center gap-2 mt-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span className="text-sm text-green-600 dark:text-green-400 font-medium">
              Operaciones activas
            </span>
          </div>
        </motion.div>

        {/* LISTADO DE VUELOS */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="col-span-1 md:col-span-3 bg-white dark:bg-neutral-900 p-6 rounded-2xl border border-gray-200 dark:border-neutral-800 shadow-sm"
        >
          <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-4">
            Vuelos detectados y predicción ML
          </h3>

          <div className="space-y-3">
            {flights.map((f, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl border border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-800"
              >
                <div className="flex justify-between">
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {f.origin} → {f.destination}
                  </span>

                  <span
                    className={`text-sm px-2 py-1 rounded-lg ${
                      f.prediction?.status === "delayed"
                        ? "bg-red-500/20 text-red-600"
                        : "bg-green-500/20 text-green-600"
                    }`}
                  >
                    {f.prediction?.status === "delayed"
                      ? `Retraso ${f.prediction.delay_minutes} min`
                      : "A tiempo"}
                  </span>
                </div>

                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  Aerolínea: {f.airline || "Desconocida"}
                </p>
              </div>
            ))}

            {flights.length === 0 && (
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                No hay vuelos detectados ahora mismo.
              </p>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
