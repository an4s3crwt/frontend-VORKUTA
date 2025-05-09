import React, { useEffect, useState } from "react";
import api from "../../api";
import { useAuth } from "../../context/AuthContext";
import './../../styles/AdminMetrics.css';

function RecentUserRegistrations() {
  const { isAuthenticated } = useAuth();
  const [recentUsers, setRecentUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isAuthenticated) {
      fetchRecentUsers();
    }
  }, [isAuthenticated]);

  const fetchRecentUsers = async () => {
    try {
      const res = await api.get("/admin/recent-users");
      setRecentUsers(res.data);
      setLoading(false);
    } catch (err) {
      setError("Failed to load recent users");
      setLoading(false);
      console.error("Error fetching recent users:", err);
    }
  };

  if (!isAuthenticated) {
    return <div className="auth-message">Please log in to view recent user registrations.</div>;
  }

  if (loading) {
    return <div className="loading-message">Loading recent users...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="recent-users-container">
      <h3>Recent User Registrations</h3>
      <table>
        <thead>
          <tr>
            <th>User Name</th>
            <th>Email</th>
            <th>Registration Date</th>
          </tr>
        </thead>
        <tbody>
          {recentUsers.map((user, index) => (
            <tr key={index}>
              <td>{user.name || 'N/A'}</td>
              <td>{user.email}</td>
              <td>{new Date(user.created_at).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default RecentUserRegistrations;
