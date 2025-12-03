import React from "react";
import { Outlet, Link, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Data = () => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const activeTab = location.pathname.split("/")[2] || "airlines";

  const tabs = [
    { name: "Airlines", path: "airlines" },
    { name: "Airports", path: "airports" },
    { name: "Flights", path: "flights" },
  ];

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 mx-auto transition-all duration-500">

      {/* Tabs */}
      <div className="flex justify-center mb-8 sm:mb-10">
        <div className="flex bg-white/60 dark:bg-neutral-900/70 backdrop-blur-2xl 
                        border border-gray-200 dark:border-neutral-800 rounded-2xl 
                        shadow-[0_0_40px_-15px_rgba(0,0,0,0.1)] p-1 transition-all duration-300">
          {tabs.map((tab) => (
            <Link
              key={tab.path}
              to={`/data/${tab.path}`}
              className={`
                relative px-4 sm:px-6 py-2.5 text-sm font-medium rounded-xl transition-all duration-300
                ${
                  activeTab === tab.path
                    ? "bg-black text-white shadow-md scale-[1.03]"
                    : "text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white hover:bg-gray-100/80 dark:hover:bg-white/10"
                }
              `}
            >
              {tab.name}
              {activeTab === tab.path && (
                <div className="absolute -bottom-[2px] left-0 right-0 mx-auto w-8 h-[2px] bg-gradient-to-r from-gray-700 to-gray-400 rounded-full"></div>
              )}
            </Link>
          ))}
        </div>
      </div>

      {/* Contenido */}
      <div className="w-full bg-white/60 dark:bg-neutral-900/70 
                      backdrop-blur-2xl rounded-3xl shadow-[0_0_40px_-15px_rgba(0,0,0,0.1)] 
                      p-4 sm:p-6 lg:p-8 transition-all duration-500 
                      border border-gray-100 dark:border-neutral-800">
        <Outlet />
      </div>

    </div>
  );
};

export default Data;
