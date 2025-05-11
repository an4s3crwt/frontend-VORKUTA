import React, { useEffect, useState } from "react";
import api from "../api";
import { Bar } from "react-chartjs-2";
import Chart from "chart.js/auto";

const AnalyticsPanel = () => {
  const [flightData, setFlightData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Función para obtener los datos de vuelo desde la API
  const fetchFlightData = async () => {
    try {
      const response = await api.get("/opensky/states"); // Llamada al endpoint que has creado
      if (response.data) {
        setFlightData(response.data.states);
      }
    } catch (error) {
      console.error("Error al obtener los datos de OpenSky:", error);
    } finally {
      setLoading(false);
    }
  };

  // Llamar a la API cuando el componente se monte
  useEffect(() => {
    fetchFlightData();
  }, []);

  // Preparar los datos para el gráfico
  const prepareChartData = () => {
    const flightCountPerCountry = {};
    
    // Contar vuelos por país (o por otra categoría relevante)
    flightData.forEach(flight => {
      const country = flight[2]; // Aquí asumimos que el índice 2 corresponde al país o cualquier otro dato que tengas
      if (country) {
        flightCountPerCountry[country] = (flightCountPerCountry[country] || 0) + 1;
      }
    });

    // Convertir los datos en arrays que Chart.js pueda usar
    const labels = Object.keys(flightCountPerCountry);
    const data = Object.values(flightCountPerCountry);

    return {
      labels,
      datasets: [
        {
          label: "Vuelos por país",
          data,
          backgroundColor: "rgba(0, 123, 255, 0.5)",
        },
      ],
    };
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="analytics-panel">
      <h2>Estadísticas de vuelos en tiempo real</h2>
      
      {/* Gráfico de vuelos por país */}
      <div className="chart-container">
        <Bar data={prepareChartData()} options={{ responsive: true }} />
      </div>
    </div>
  );
};

export default AnalyticsPanel;
