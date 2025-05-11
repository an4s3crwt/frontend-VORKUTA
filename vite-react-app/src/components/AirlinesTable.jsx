import React, { useEffect, useState } from "react";
import api from "../api";

const AirlinesTable = () => {
  const [airlines, setAirlines] = useState([]);

  useEffect(() => {
    const fetchAirlines = async () => {
      try {
        const response = await api.get("/airlines");
        setAirlines(response.data.data); // .data from Laravel pagination
      } catch (error) {
        console.error("Error fetching airlines:", error);
      }
    };

    fetchAirlines();
  }, []);

  return (
    <div>
      <h2>Airlines</h2>
      <ul>
        {airlines.map((airline, i) => (
          <li key={i}>
            {airline.callsign || "No Callsign"} - {airline.country}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Airlines;
