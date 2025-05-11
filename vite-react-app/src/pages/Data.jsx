import React from 'react';
import { Outlet, Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Data = () => {
    const { isAuthenticated } = useAuth();

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex items-center mb-6">
                <Link to="/" className="text-blue-600 hover:text-blue-800 mr-2">Home</Link>
                <span className="text-gray-500">/</span>
                <span className="ml-2 text-gray-600">Data</span>
            </div>

            <div className="flex space-x-4 mb-8 border-b border-gray-200">
                <Link 
                    to="/data/airlines" 
                    className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-blue-600 border-b-2 border-transparent hover:border-blue-600"
                >
                    Airlines
                </Link>
                <Link 
                    to="/data/airports" 
                    className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-blue-600 border-b-2 border-transparent hover:border-blue-600"
                >
                    Airports
                </Link>
                <Link 
                    to="/data/flights" 
                    className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-blue-600 border-b-2 border-transparent hover:border-blue-600"
                >
                    Flights
                </Link>
            </div>

            <Outlet />
        </div>
    );
};

export default Data;
