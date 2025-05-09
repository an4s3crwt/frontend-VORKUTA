import React from "react";
import AdminLogsDashboard from "../../components/Admin/AdminLogsDashboard"; 
import RecentUserRegistration from "../../components/Admin/RecentUserRegistration";
function AdminDashboard() {
    return (
        <div>
            <h1>Admin Logs Dashboard</h1>
            <AdminLogsDashboard />
            <RecentUserRegistration />
        </div>
    );
}

export default AdminDashboard;
