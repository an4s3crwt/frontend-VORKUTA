import React from "react";
import AdminLogsDashboard from "../../components/Admin/AdminLogsDashboard"; 
import RecentUserRegistration from "../../components/Admin/RecentUserRegistration";
import ApiMetrics from "../../components/Admin/ApiMetrics";

function AdminDashboard() {
    return (
        <div>
            <h1>Admin Logs Dashboard</h1>
            <AdminLogsDashboard />
            <RecentUserRegistration />
            <ApiMetrics />
        </div>
    );
}

export default AdminDashboard;
