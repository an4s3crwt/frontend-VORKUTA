import React, { useEffect, useState } from "react";
import api from "../../api";
import { useAuth } from "../../context/AuthContext";
import './../../styles/AdminMetrics.css';

function FlightViewsByUser() {
  const { isAuthenticated } = useAuth();
  const [flightViews, setFlightViews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isAuthenticated) {
      fetchFlightViewsByUser();
    }
  }, [isAuthenticated]);

  const fetchFlightViewsByUser = async () => {
    try {
      const res = await api.get("/admin/saved-flights");
      console.log(res.data);  // Log the full response for debugging
      setFlightViews(res.data.saved_flights);  // Use 'saved_flights' directly here
      setLoading(false);
    } catch (err) {
      setError("Failed to load flight views by user");
      setLoading(false);
      console.error("Error fetching flight views by user:", err);
    }
  };
  
  

  if (!isAuthenticated) {
    return <div className="auth-message">Please log in to view flight views by user.</div>;
  }

  if (loading) {
    return <div className="loading-message">Loading flight views by user...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="flight-views-container">
      <h3>Flight Views by User</h3>
      <table>
        <thead>
          <tr>
            <th>User ID</th>
            <th>Flight ICAO</th>
            <th>Flight Data</th>
            <th>Saved At</th>
          </tr>
        </thead>
        <tbody>
          {flightViews.length > 0 ? (
            flightViews.map((flight, index) => {
              // Parse the flight_data JSON string
              const flightData = JSON.parse(flight.flight_data);
              
              return (
                <tr key={index}>
                  <td>{flight.user_id}</td>  {/* Display user_id */}
                  <td>{flight.flight_icao}</td> {/* Display flight ICAO */}
                  <td>{flightData.callsign || 'N/A'}</td> {/* Display callsign */}
                  <td>{new Date(flight.saved_at).toLocaleString()}</td> {/* Display saved_at */}
                </tr>
              );
            })
          ) : (
            <tr><td colSpan="4">No data available</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default FlightViewsByUser;
