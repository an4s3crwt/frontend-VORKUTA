import React from "react";
import AdminMetrics from "../../components/Admin/AdminMetrics"; 
import FlightViewByUser from "../../components/Admin/FlightViewByUser";
import SystemDataDashboard from "../../components/Admin/SystemDataDashboard";
function AdminDashboard() {
    return (
        <div>
            <h1>Admin Dashboard</h1>
            <AdminMetrics /> 
            <FlightViewByUser />
            <SystemDataDashboard />
        </div>
    );
}

export default AdminDashboard;
