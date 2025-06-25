import React, { useEffect, useState } from 'react';

const AirplaneData = () => {
  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const username = 'an4s3crwt';
    const password = 'Mentaybolita1';

    fetch('https://opensky-network.org/api/states/all', {
      headers: {
        'Authorization': 'Basic ' + btoa(`${username}:${password}`)
      }
    })
      .then(r => r.json())
      .then(data => {
        const list = (data.states || [])
          .filter(f => f[1])   // solo con callsign
          .slice(0, 50);       // limitar a 50 vuelos
        setFlights(list);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Cargando vuelos…</p>;

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Vuelos Activos</h2>
      <ul className="space-y-2">
        {flights.map((f, i) => (
          <li key={i} className="border p-2 rounded shadow text-sm bg-white">
            <strong>{f[1].trim()}</strong> &bull; Alt: {f[7]?.toFixed(0)} m &bull; {f[2]}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AirplaneData;
