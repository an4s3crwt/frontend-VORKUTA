import React, { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement
} from "chart.js";
import { useAuth } from "../../context/AuthContext";
import api from "../../api";
import './../../styles/AdminMetrics.css';

ChartJS.register(
  Title,
  Tooltip,
  Legend,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement
);

function AdminPerformanceDashboard() {
  const { isAuthenticated } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated) {
      fetchPerformanceStats();
    }
  }, [isAuthenticated]);

  const fetchPerformanceStats = async () => {
    try {
      const res = await api.get("/admin/logs");
      setData(res.data);
    } catch (err) {
      console.error("Error fetching performance stats:", err);
      setError("Failed to load performance data");
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return <div className="auth-message">Please log in to view performance stats.</div>;
  }

  if (loading) {
    return <div className="loading-message">Loading performance stats...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  const chartData = {
    labels: data.logs.map(log => new Date(log.created_at).toLocaleTimeString()),
    datasets: [
      {
        label: "Response Time (s)",
        data: data.logs.map(log => log.response_time),
        borderColor: "rgba(75, 192, 192, 1)",
        backgroundColor: "rgba(75, 192, 192, 0.2)",
        fill: true,
        tension: 0.3,
      },
    ],
  };

  return (
    <div className="admin-metrics-container">
      <h1>Performance Dashboard</h1>
      <div className="summary-cards">
        <div className="card">
          <h3>Average Response Time</h3>
          <p>{data.average_response_time} s</p>
        </div>
      </div>

      <div className="chart-row">
        <div className="chart-container">
          <h3>Recent API Response Times</h3>
          <Line
            data={chartData}
            options={{
              responsive: true,
              plugins: {
                legend: {
                  position: "top",
                },
                title: {
                  display: true,
                  text: "API Endpoint Performance",
                },
              },
            }}
          />
        </div>
      </div>

      <div className="user-table">
        <h3>Raw Log Entries</h3>
        <table>
          <thead>
            <tr>
              <th>Method</th>
              <th>Path</th>
              <th>Status</th>
              <th>Time (s)</th>
              <th>TimeStamp</th>
            </tr>
          </thead>
          <tbody>
            {data.logs.map((log, i) => (
              <tr key={i}>
                <td>{log.method}</td>
                <td>{log.path}</td>
                <td>{log.status_code}</td>
                <td>{log.response_time}</td>
                <td>{new Date(log.created_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AdminPerformanceDashboard;
