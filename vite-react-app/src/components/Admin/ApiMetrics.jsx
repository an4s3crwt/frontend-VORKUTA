import { useEffect, useRef, useState } from "react";
import Chart from "chart.js/auto";
import api from "../../api"; // asegúrate de que la ruta sea correcta

const AdminMetrics = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const cpuChartRef = useRef(null);
  const memoryChartRef = useRef(null);
  const diskChartRef = useRef(null);

  const fetchSystemMetrics = async () => {
    try {
      const [cpuRes, memRes, diskRes] = await Promise.all([
        api.get("/admin/system/cpu-usage"),
        api.get("/admin/system/memory-usage"),
        api.get("/admin/system/disk-usage"),
      ]);

      const cpuData = cpuRes.data;
      const memData = memRes.data;
      const diskData = diskRes.data;

      if (!cpuData || !memData || !diskData) {
        throw new Error("Faltan datos del servidor");
      }

      const createChart = (ref, label, data, color) => {
        if (!ref.current) return;

        new Chart(ref.current, {
          type: "line",
          data: {
            labels: data.map((_, i) => `T${i + 1}`),
            datasets: [
              {
                label,
                data,
                borderColor: color,
                tension: 0.3,
                fill: false,
              },
            ],
          },
          options: {
            responsive: true,
            scales: {
              y: {
                beginAtZero: true,
                max: 100,
              },
            },
          },
        });
      };

      createChart(cpuChartRef, "CPU Usage (%)", cpuData.usage, "rgba(75,192,192,1)");
      createChart(memoryChartRef, "Memory Usage (%)", memData.usage, "rgba(153,102,255,1)");
      createChart(diskChartRef, "Disk Usage (%)", diskData.usage, "rgba(255,159,64,1)");

      setLoading(false);
    } catch (err) {
      console.error("Error al cargar métricas del sistema:", err);
      setError("No se pudieron cargar las métricas.");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSystemMetrics();
  }, []);

  if (loading) return <p>Cargando métricas del sistema...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div className="admin-metrics">
      <h2>Métricas del sistema</h2>
      <div>
        <canvas ref={cpuChartRef}></canvas>
      </div>
      <div>
        <canvas ref={memoryChartRef}></canvas>
      </div>
      <div>
        <canvas ref={diskChartRef}></canvas>
      </div>
    </div>
  );
};

export default AdminMetrics;
