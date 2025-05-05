import React from "react";
import { Outlet, Navigate } from "react-router-dom";

function Flight() {
    const { user, loading } = useAuth();

    if (loading) {
        return <LoadingSpinner fullPage />;
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    return (
        <div className="flight-layout">
         
            <main className="flight-content">
                <Outlet />
            </main>
        </div>
    );
}

export default Flight;