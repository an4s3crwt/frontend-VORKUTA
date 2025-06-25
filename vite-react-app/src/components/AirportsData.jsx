import React, { useEffect, useState, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useNavigate } from 'react-router-dom';

const airportIcon = new L.Icon({
  iconUrl: '/a1.png',
  iconSize: [25, 25]
});

const AirportsData = () => {
  const [airports, setAirports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [offset, setOffset] = useState(0);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState(null);
  const observer = useRef();
  const navigate = useNavigate();

  // Same authentication as your FlightInfo component
  const username = "an4s3crwt";
  const password = "Mentaybolita1";
  const headers = new Headers();
  headers.set('Authorization', 'Basic ' + btoa(username + ":" + password));

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // First fetch from OpenSky (same as FlightInfo)
      const statesRes = await fetch('https://opensky-network.org/api/states/all', { headers });
      if (!statesRes.ok) throw new Error(`OpenSky API failed with status ${statesRes.status}`);

      const statesData = await statesRes.json();
      const callsigns = Array.from(new Set(statesData.states.map(f => f[1]).filter(Boolean)))
        .slice(offset, offset + 20);

      // Process each callsign like in FlightInfo
      const airportResults = await Promise.all(
        callsigns.map(async callsign => {
          try {
            // Get route info first
            const routeRes = await fetch(`https://hexdb.io/callsign-route-iata?callsign=${callsign}`);
            if (!routeRes.ok) return null;

            const route = await routeRes.text();
            const [departureIata, arrivalIata] = route.split('-');

            if (!departureIata) return null;

            // Get departure airport details
            const airportRes = await fetch(`https://hexdb.io/api/v1/airport/iata/${departureIata}`);
            if (!airportRes.ok) return null;

            const airportData = await airportRes.json();

            return {
              callsign,
              name: airportData.airport || departureIata || 'Unknown',
              country: airportData.region_name || 'Unknown',
              countryCode: airportData.country_code || 'US',
              departure: departureIata || '–',
              arrival: arrivalIata || '–',
              latitude: airportData.latitude || 0,
              longitude: airportData.longitude || 0
            };
          } catch (e) {
            console.error(`Error processing ${callsign}:`, e);
            return null;
          }
        })
      );

      setAirports(prev => [...prev, ...airportResults.filter(Boolean)]);
    } catch (e) {
      setError(e.message || 'Failed to load airport data');
      console.error('Fetch error:', e);
    } finally {
      setLoading(false);
    }
  }, [offset]);

  // Infinite scroll implementation
  const lastRef = useCallback(node => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();

    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        setOffset(prev => prev + 20);
      }
    });

    if (node) observer.current.observe(node);
  }, [loading]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSelect = (callsign, iata) => {
    navigate(`/airport/${iata}`);
  };

  // Find the selected airport for the map
  const selectedAirport = selected ? airports.find(a => a.callsign === selected) : null;

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Active Airports</h2>

      {error && (
        <div className="p-4 mb-4 bg-red-50 border border-red-200 rounded-lg text-center">
          <p className="text-red-600">{error}</p>
          <button
            onClick={fetchData}
            className="mt-2 px-4 py-2 bg-red-100 hover:bg-red-200 rounded text-red-800"
          >
            Retry
          </button>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-1/2 space-y-4">
          {airports.map((airport, i) => (
            <div
              key={`${airport.callsign}-${i}`}
              className={`...`}
              onClick={() => handleSelect(airport.callsign, airport.departure)} // pasa el iata
            >
              <div className="flex items-center gap-4">
                <img
                  src={`https://flagcdn.com/w40/${airport.countryCode.toLowerCase()}.png`}
                  alt={airport.country}
                  onError={(e) => e.target.style.display = 'none'}
                  loading="lazy"
                  width="32"
                  className="rounded"
                />
                <div>
                  <h3 className="font-semibold text-lg">{airport.callsign}</h3>
                  <p className="text-sm text-gray-600">{airport.name} - {airport.country}</p>
                  {selected === airport.callsign && (
                    <div className="mt-2 pt-2 border-t text-sm">
                      <p><span className="font-medium">Departure:</span> {airport.departure}</p>
                      <p><span className="font-medium">Arrival:</span> {airport.arrival}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {loading && (
            <div className="border p-4 rounded-xl shadow bg-white flex items-center gap-4 animate-pulse">
              <div className="w-8 h-8 bg-gray-200 rounded"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          )}
        </div>


      </div>
    </div>
  );
};

export default AirportsData;