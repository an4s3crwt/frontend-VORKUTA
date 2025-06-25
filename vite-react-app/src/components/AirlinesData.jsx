import React, { useEffect, useState, useRef, useCallback } from 'react';

// Loading Skeleton Component
const AirlineSkeleton = () => (
  <div className="border p-4 rounded-xl shadow bg-white flex items-center gap-4 animate-pulse">
    <div className="w-8 h-8 bg-gray-200 rounded"></div>
    <div className="flex-1 space-y-2">
      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
    </div>
  </div>
);

// Error Display Component
const ErrorDisplay = ({ error, onRetry }) => (
  <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-center mb-4">
    <p className="text-red-600 mb-2">{error}</p>
    <button 
      onClick={onRetry}
      className="px-4 py-2 bg-red-100 hover:bg-red-200 rounded text-red-800 transition"
    >
      Retry
    </button>
  </div>
);

// Back to Top Component
const BackToTop = () => {
  const [visible, setVisible] = useState(false);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.pageYOffset > 300) setVisible(true);
      else setVisible(false);
    };
    
    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  return (
    <button
      onClick={scrollToTop}
      className={`fixed bottom-6 right-6 p-3 bg-blue-500 text-white rounded-full shadow-lg transition-opacity duration-300 ${
        visible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
      aria-label="Back to top"
    >
      ↑
    </button>
  );
};

const AirlinesData = () => {
  const [airlines, setAirlines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [offset, setOffset] = useState(0);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const observer = useRef();
  const apiCache = useRef(new Map());

  const username = 'an4s3crwt';
  const password = 'Mentaybolita1';

  const fetchData = useCallback(async () => {
    if (!hasMore) return;
    
    setLoading(true);
    setError(null);
    
    const cacheKey = `airlines-${offset}`;
    const cached = apiCache.current.get(cacheKey);
    
    if (cached) {
      setAirlines(prev => [...prev, ...cached]);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('https://opensky-network.org/api/states/all', {
        headers: { Authorization: 'Basic ' + btoa(`${username}:${password}`) },
      });
      
      if (!res.ok) throw new Error(`API request failed with status ${res.status}`);
      
      const data = await res.json();
      const allCalls = Array.from(new Set(data.states.map(f => f[1]).filter(Boolean)));
      
      // Check if we've reached the end
      if (offset >= allCalls.length) {
        setHasMore(false);
        setLoading(false);
        return;
      }

      const calls = allCalls.slice(offset, offset + 20);

      const results = await Promise.all(
        calls.map(async cs => {
          try {
            const airlineRes = await fetch(`https://hexdb.io/api/v1/airline/icao/${cs}`);
            if (!airlineRes.ok) return null;
            
            const json = await airlineRes.json();
            if (!json.name) return null;

            return {
              callsign: cs,
              name: json.name,
              country: json.country || 'Unknown',
              countryCode: json.country_code || 'US',
            };
          } catch (e) {
            console.error(`Failed to fetch details for ${cs}`, e);
            return null;
          }
        })
      );

      const validResults = results.filter(Boolean);
      apiCache.current.set(cacheKey, validResults);
      setAirlines(prev => [...prev, ...validResults]);
    } catch (e) {
      setError(e.message || 'Failed to load airline data');
      console.error('Fetch error:', e);
    } finally {
      setLoading(false);
    }
  }, [offset, hasMore]);

  // Intersection Observer for infinite scroll
  const lastRef = useCallback(node => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setOffset(prev => prev + 20);
      }
    }, { threshold: 0.1 });
    
    if (node) observer.current.observe(node);
  }, [loading, hasMore]);

  // Initial fetch and cleanup
  useEffect(() => {
    fetchData();
    
    return () => {
      if (observer.current) {
        observer.current.disconnect();
      }
    };
  }, [fetchData]);

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-center">Active Airlines</h2>
      
      {error && <ErrorDisplay error={error} onRetry={fetchData} />}
      
      <div className="space-y-4">
        {airlines.length === 0 && !loading && !error && (
          <div className="text-center py-8 text-gray-500">
            No airline data available
          </div>
        )}
        
        {airlines.map((airline, i) => (
          <div
            ref={i === airlines.length - 1 ? lastRef : null}
            key={`${airline.callsign}-${i}`}
            className="border p-4 rounded-xl shadow hover:shadow-md transition bg-white flex items-center gap-4 hover:bg-gray-50"
          >
            <img
              src={`https://flagsapi.com/${airline.countryCode}/flat/32.png`}
              alt={airline.country}
              className="rounded"
              loading="lazy"
            />
            <div>
              <h3 className="font-semibold text-lg">{airline.callsign}</h3>
              <p className="text-sm text-gray-600">
                {airline.name} - {airline.country}
              </p>
            </div>
          </div>
        ))}
        
        {loading && (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <AirlineSkeleton key={`skeleton-${i}`} />
            ))}
          </div>
        )}
        
        {!hasMore && !loading && airlines.length > 0 && (
          <div className="text-center py-4 text-gray-500">
            You've reached the end of the list
          </div>
        )}
      </div>
      
      <BackToTop />
    </div>
  );
};

export default AirlinesData;