import React, { useEffect, useState } from "react";

const AirplaneData = () => {
  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const username = "an4s3crwt";
    const password = "Mentaybolita1";

    fetch("https://opensky-network.org/api/states/all", {
      headers: { Authorization: "Basic " + btoa(`${username}:${password}`) },
    })
      .then((r) => {
        if (!r.ok) throw new Error("Error al obtener datos de vuelos");
        return r.json();
      })
      .then((data) => {
        const list = (data.states || []).filter((f) => f[1]).slice(0, 50);
        setFlights(list);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  // Loader minimalista estilo macOS VisionOS
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-6 bg-white/60 dark:bg-neutral-900/70 backdrop-blur-2xl rounded-3xl shadow-[0_0_40px_-15px_rgba(0,0,0,0.1)] transition-all duration-300 max-w-3xl mx-auto">
        <div className="relative w-7 h-7">
          <div className="absolute inset-0 border-[1.5px] border-gray-300 dark:border-gray-700 rounded-full"></div>
          <div className="absolute inset-0 border-[1.5px] border-gray-800 dark:border-white border-t-transparent rounded-full animate-spin [animation-duration:1.2s]"></div>
        </div>
        <p className="mt-4 text-sm text-gray-500 dark:text-gray-400 tracking-wide">
          Cargando vuelos activos...
        </p>
      </div>
    );
  }

  // Error visual limpio y elegante
  if (error) {
    return (
      <div className="max-w-3xl mx-auto bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 p-6 rounded-3xl shadow-md text-center transition-all duration-300 backdrop-blur-xl">
        <p className="font-medium">Error cargando vuelos</p>
        <p className="text-sm opacity-80 mt-2">{error}</p>
      </div>
    );
  }

  // Sin resultados
  if (!flights.length) {
    return (
      <div className="max-w-3xl mx-auto text-center bg-white/60 dark:bg-neutral-900/70 backdrop-blur-2xl rounded-3xl shadow-[0_0_40px_-15px_rgba(0,0,0,0.1)] text-gray-500 dark:text-gray-400 py-12 px-6 transition-all duration-300">
        No se encontraron vuelos activos
      </div>
    );
  }

  // Lista de vuelos
  return (
    <div className="bg-white/60 dark:bg-neutral-900/70 backdrop-blur-2xl rounded-3xl shadow-[0_0_40px_-15px_rgba(0,0,0,0.1)] p-10 max-w-4xl mx-auto space-y-6 transition-all duration-300">
      <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 text-center tracking-tight mb-6">
        Vuelos Activos
      </h2>

      <ul className="space-y-3">
        {flights.map((f, i) => (
          <li
            key={i}
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between border border-gray-100 dark:border-neutral-700 bg-white/90 dark:bg-neutral-800/80 p-4 rounded-2xl shadow-sm hover:shadow-md hover:scale-[1.01] transition-all duration-300 cursor-default"
          >
            <div>
              <strong className="text-gray-800 dark:text-gray-100 tracking-tight">
                {f[1].trim()}
              </strong>
              <span className="block sm:inline text-gray-500 dark:text-gray-400 text-sm mt-1 sm:mt-0 sm:ml-2">
                {f[2] || "Origen desconocido"}
              </span>
            </div>
            <div className="text-gray-500 dark:text-gray-400 text-sm mt-2 sm:mt-0">
              Altitud: {f[7] ? `${f[7].toFixed(0)} m` : "—"}
            </div>
          </li>
        ))}
      </ul>

      <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-transparent via-white/20 dark:via-white/5 to-transparent animate-pulse-slow"></div>
    </div>
  );
};

export default AirplaneData;
