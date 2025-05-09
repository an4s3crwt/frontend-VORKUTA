import React from "react";
import AdminMetrics from "../../components/Admin/AdminMetrics"; 
import FlightViewByUser from "../../components/Admin/FlightViewByUser";
function AdminDashboard() {
    return (
        <div>
            <h1>Admin Dashboard</h1>
            <AdminMetrics /> 
            <FlightViewByUser />
        </div>
    );
}

export default AdminDashboard;
