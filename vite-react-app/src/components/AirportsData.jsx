import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AirportsData() {
  const [airports, setAirports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const observer = useRef();
  const navigate = useNavigate();

  const username = 'an4s3crwt';
  const password = 'Mentaybolita1';
  const headers = new Headers();
  headers.set('Authorization', 'Basic ' + btoa(username + ':' + password));

  // === 🔍 Obtener datos de vuelos activos ===
  const fetchData = useCallback(async () => {
    if (!hasMore) return;
    setLoading(true);
    setError(null);

    try {
      const statesRes = await fetch('https://opensky-network.org/api/states/all', { headers });
      if (!statesRes.ok) throw new Error(`OpenSky API error ${statesRes.status}`);

      const statesData = await statesRes.json();

      // 🧩 Seguridad: puede venir null
      if (!statesData || !Array.isArray(statesData.states)) {
        throw new Error('Datos no válidos o vacíos de OpenSky');
      }

      const callsigns = Array.from(
        new Set(statesData.states.map(f => f?.[1]).filter(Boolean))
      ).slice(offset, offset + 20);

      if (!callsigns.length) {
        setHasMore(false);
        setLoading(false);
        return;
      }

      // 🔁 Buscar info en HexDB
      const results = await Promise.all(
        callsigns.map(async cs => {
          try {
            const routeRes = await fetch(
              `https://hexdb.io/callsign-route-iata?callsign=${cs}`
            );
            if (!routeRes.ok) return null;
            const route = await routeRes.text();

            const [departureIata, arrivalIata] = route.split('-').map(s => s?.trim());
            if (!departureIata) return null;

            const airportRes = await fetch(
              `https://hexdb.io/api/v1/airport/iata/${departureIata}`
            );
            if (!airportRes.ok) return null;

            const airportData = await airportRes.json();

            return {
              callsign: cs,
              name: airportData.airport || departureIata,
              country: airportData.region_name || 'Unknown',
              countryCode: airportData.country_code || 'US',
              departure: departureIata,
              arrival: arrivalIata || '–',
            };
          } catch {
            return null;
          }
        })
      );

      const valid = results.filter(Boolean);
      setAirports(prev => [...prev, ...valid]);

      if (valid.length < 20) setHasMore(false);
    } catch (e) {
      console.error('❌ Error en fetchData:', e);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [offset, hasMore]);

  // === 👁️ Observador infinito ===
  const lastRef = useCallback(
    node => {
      if (loading) return;
      if (observer.current) observer.current.disconnect();

      observer.current = new IntersectionObserver(entries => {
        if (entries[0].isIntersecting) {
          setOffset(prev => prev + 20);
        }
      });

      if (node) observer.current.observe(node);
    },
    [loading]
  );

  // === 🔁 Cargar datos iniciales ===
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="relative">
      {/* 🧭 Header */}
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-medium text-gray-900 dark:text-gray-100 tracking-tight select-none">
          Aeropuertos Activos
        </h2>
      </div>

      {/* ⚠️ Error */}
      {error && (
        <div className="bg-red-50/70 dark:bg-red-900/30 border border-red-200/40 dark:border-red-800/40 text-red-700 dark:text-red-300 p-4 rounded-2xl mb-6 text-center backdrop-blur-md">
          <p>{error}</p>
          <button
            onClick={() => {
              setError(null);
              fetchData();
            }}
            className="mt-3 px-5 py-2 bg-red-100/60 dark:bg-red-800/40 hover:bg-red-200/80 dark:hover:bg-red-700/60 rounded-xl transition-all text-sm font-medium text-gray-700 dark:text-gray-200"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* 📋 Lista de aeropuertos */}
      <div className="space-y-3">
        {airports.map((airport, i) => (
          <div
            ref={i === airports.length - 1 ? lastRef : null}
            key={`${airport.callsign}-${airport.departure}`}
            onClick={() => navigate(`/airport/${airport.departure}`)}
            className="group flex items-center gap-4 p-4 bg-white/50 dark:bg-white/5 border border-gray-200/40 dark:border-white/10 rounded-2xl hover:bg-white/70 dark:hover:bg-white/10 hover:scale-[1.01] transition-all duration-300 cursor-pointer backdrop-blur-lg"
          >
            <div className="w-10 h-6 flex items-center justify-center">
              <img
                src={`https://flagcdn.com/w40/${airport.countryCode?.toLowerCase()}.png`}
                alt={airport.country}
                className="rounded shadow-sm opacity-80 group-hover:opacity-100 transition-all"
                onError={e => (e.target.style.display = 'none')}
              />
            </div>
            <div>
              <h3 className="text-gray-900 dark:text-white font-medium text-lg leading-tight">
                {airport.callsign}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {airport.name} — {airport.country}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1 tracking-wide">
                {airport.departure} → {airport.arrival}
              </p>
            </div>
          </div>
        ))}

        {/* ⏳ Loader */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-10">
            <div className="w-6 h-6 border border-gray-300 dark:border-gray-700 border-t-gray-900 dark:border-t-white rounded-full animate-spin"></div>
            <p className="mt-4 text-sm text-gray-500 dark:text-gray-400 tracking-wide">
              Cargando aeropuertos...
            </p>
          </div>
        )}

        {/* 🚫 Sin datos */}
        {!loading && !airports.length && !error && (
          <div className="text-gray-500 dark:text-gray-400 text-center py-10 text-sm">
            No se encontraron aeropuertos
          </div>
        )}

        {/* ✅ Fin de lista */}
        {!hasMore && !loading && airports.length > 0 && (
          <p className="text-center text-gray-400 dark:text-gray-500 text-sm pt-6 tracking-tight">
            Fin de la lista
          </p>
        )}
      </div>
    </div>
  );
}
