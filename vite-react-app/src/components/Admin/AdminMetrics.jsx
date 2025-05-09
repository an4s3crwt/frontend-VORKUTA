import React, { useEffect, useState } from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
} from "chart.js";
import { useAuth } from "../../context/AuthContext";
import api from "../../api";
import './../../styles/AdminMetrics.css';

ChartJS.register(
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale
);

function AdminMetrics() {
  const { isAuthenticated } = useAuth();
  const [metrics, setMetrics] = useState({
    users: {
      total: 0,
      active: 0,
      admins: 0,
      banned: 0
    },
    flights: {
      total_views: 0,
      by_user: [],
      top_routes: []
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isAuthenticated) {
      fetchAdminData();
    }
  }, [isAuthenticated]);
  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const [metricsRes, usersRes] = await Promise.all([
        api.get("/admin/metrics"),
        api.get("/users")
      ]);
  
      console.log("Users Data:", usersRes.data);  // Verifica los datos de usuarios
      console.log("Metrics Data:", metricsRes.data);  // Verifica las métricas de vuelos
  
      setMetrics({
        users: {
          total: usersRes.data.total || 0,
          active: usersRes.data.active || 0,
          admins: usersRes.data.admins || 0,
          banned: usersRes.data.banned || 0
        },
        flights: metricsRes.data.flights || {
          total_views: 0,
          by_user: [],
          top_routes: []
        }
      });
      setLoading(false);
    } catch (err) {
      setError("Failed to load admin data");
      setLoading(false);
      console.error("Admin data error:", err);
    }
  };
  

  if (!isAuthenticated) {
    return <div className="auth-message">Please log in to view admin metrics.</div>;
  }

  if (loading) {
    return <div className="loading-message">Loading metrics...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  // Datos para gráficos
  const userActivityData = {
    labels: ['Total', 'Active', 'Admins', 'Banned'],
    datasets: [{
      label: 'Users',
      data: [
        metrics.users.total,
        metrics.users.active,
        metrics.users.admins,
        metrics.users.banned
      ],
      backgroundColor: [
        'rgba(54, 162, 235, 0.5)',
        'rgba(75, 192, 192, 0.5)',
        'rgba(255, 206, 86, 0.5)',
        'rgba(255, 99, 132, 0.5)'
      ],
      borderColor: [
        'rgba(54, 162, 235, 1)',
        'rgba(75, 192, 192, 1)',
        'rgba(255, 206, 86, 1)',
        'rgba(255, 99, 132, 1)'
      ],
      borderWidth: 1
    }]
  };

  const flightRoutesData = {
    labels: metrics.flights.top_routes.map(route => 
      `${route.from_airport_code} → ${route.to_airport_code}`
    ),
    datasets: [{
      label: 'Flight Views',
      data: metrics.flights.top_routes.map(route => route.views),
      backgroundColor: 'rgba(153, 102, 255, 0.5)',
      borderColor: 'rgba(153, 102, 255, 1)',
      borderWidth: 1
    }]
  };

  return (
    <div className="admin-metrics-container">
      <h1>Admin Dashboard</h1>
      
      <div className="summary-cards">
        <div className="card">
          <h3>Total Users</h3>
          <p>{metrics.users.total}</p>
        </div>
        
        <div className="card">
          <h3>Active Users</h3>
          <p>{metrics.users.active}</p>
        </div>
        
        <div className="card">
          <h3>Admin Users</h3>
          <p>{metrics.users.admins}</p>
        </div>
        
        <div className="card">
          <h3>Banned Users</h3>
          <p>{metrics.users.banned}</p>
        </div>
      </div>

      <div className="chart-row">
        <div className="chart-container">
          <h3>User Statistics</h3>
          <Bar 
            data={userActivityData}
            options={{
              responsive: true,
              plugins: {
                legend: {
                  display: false
                }
              }
            }}
          />
        </div>
        
        <div className="chart-container">
          <h3>Top Flight Routes</h3>
          <Bar 
            data={flightRoutesData}
            options={{
              indexAxis: 'y',
              responsive: true,
              plugins: {
                legend: {
                  display: false
                }
              }
            }}
          />
        </div>
      </div>

      <div className="user-table">
        <h3>User Flight Activity</h3>
        <table>
          <thead>
            <tr>
              <th>User</th>
              <th>Flight Views</th>
            </tr>
          </thead>
          <tbody>
            {metrics.flights.by_user.map((user, index) => (
              <tr key={index}>
                <td>{user.name || 'Anonymous'}</td>
                <td>{user.total_views || 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AdminMetrics;