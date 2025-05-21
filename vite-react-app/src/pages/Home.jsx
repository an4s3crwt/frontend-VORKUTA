import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import './../index.css';

export default function Home() {
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();

    const [aircraftResults, setAircraftResults] = useState({
        visible: false,
        loading: false,
        error: null,
        data: null
    });

    const [airportResults, setAirportResults] = useState({
        visible: false,
        loading: false,
        error: null,
        data: null
    });

    const handleAircraftSearch = async (e) => {
        const registration = e.target.value.trim();

        if (registration.length < 4) {
            setAircraftResults({ visible: false, loading: false, error: null, data: null });
            return;
        }

        setAircraftResults(prev => ({ ...prev, loading: true, visible: false }));

        try {
            const searchRes = await api.get(`/api/aircraft/search?registration=${registration}`);
            const { icao24 } = searchRes.data;
            
            const aircraftRes = await api.get(`/api/aircraft/${icao24}`);
            const aircraftData = aircraftRes.data;

            setAircraftResults({
                visible: true,
                loading: false,
                error: null,
                data: {
                    ...aircraftData,
                    infoUrl: `/flight-info/hex-${icao24}`
                }
            });
        } catch (err) {
            setAircraftResults({
                visible: false,
                loading: false,
                error: err.response?.data?.message || "Aircraft not found",
                data: null
            });
        }
    };

    const handleAirportSearch = async (e) => {
        const code = e.target.value.trim().toUpperCase();
        const codeLength = code.length;

        if (codeLength !== 3 && codeLength !== 4) {
            setAirportResults({ visible: false, loading: false, error: null, data: null });
            return;
        }

        setAirportResults(prev => ({ ...prev, loading: true, visible: false }));

        try {
            const endpoint = codeLength === 3
                ? `/api/airports/iata/${code}`
                : `/api/airports/icao/${code}`;

            const res = await api.get(endpoint);
            const airportData = res.data;

            setAirportResults({
                visible: true,
                loading: false,
                error: null,
                data: {
                    ...airportData,
                    infoUrl: `/airport/${airportData.icao}`
                }
            });
        } catch (err) {
            setAirportResults({
                visible: false,
                loading: false,
                error: err.response?.data?.message || "Airport not found",
                data: null
            });
        }
    };

    const handleViewMap = () => {
        if (!isAuthenticated) {
            if (window.confirm("You need to login to view the live map. Go to login page?")) {
                navigate('/login');
            }
            return;
        }
        navigate('/map');
    };

    return (
        <div className=" bg-white rounded-xl shadow-sm p-6 border ">
            {/* Hero Section */}
            <section className="py-20 px-6 ">
                <div className="max-w-4xl mx-auto text-center">
                    <h1 className="text-4xl md:text-5xl font-light text-gray-900 mb-4 tracking-tight">
                        Real-Time Flight Tracking
                    </h1>
                    <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
                        Track aircraft movements with precision and clarity
                    </p>
                    <button 
                        onClick={handleViewMap}
                        className="px-8 py-3 bg-gray-900 text-white rounded-full font-medium hover:bg-gray-800 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2"
                    >
                        View Live Map
                    </button>
                    {!isAuthenticated && (
                        <p className="mt-4 text-gray-500">
                            <Link to="/login" className="text-gray-700 hover:underline">Sign in</Link> for full access
                        </p>
                    )}
                </div>
            </section>

            {/* Search Section */}
            <section className="py-16 px-6 max-w-6xl mx-auto">
                <h2 className="text-2xl font-light text-gray-900 mb-10 text-center">
                    Search Database
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Aircraft Search */}
                    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                        <div className="flex items-center mb-6">
                            <div className="bg-gray-100 p-3 rounded-full mr-4">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-medium text-gray-900">Aircraft Search</h3>
                        </div>
                        
                        <div className="mb-6">
                            <input
                                type="text"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                                placeholder="Registration (e.g. N12345)"
                                onChange={handleAircraftSearch}
                                maxLength="9"
                            />
                        </div>

                        {aircraftResults.loading && (
                            <div className="flex justify-center py-4">
                                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900"></div>
                            </div>
                        )}

                        {aircraftResults.error && (
                            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
                                <div className="flex">
                                    <div className="flex-shrink-0">
                                        <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-sm text-red-700">{aircraftResults.error}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {aircraftResults.visible && aircraftResults.data && (
                            <Link to={aircraftResults.data.infoUrl} className="block group">
                                <div className="bg-gray-50 rounded-lg p-5 border border-gray-200 hover:border-gray-300 transition-colors duration-200">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-sm text-gray-500">Registration</p>
                                            <p className="font-medium text-gray-900">{aircraftResults.data.registration}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">Type</p>
                                            <p className="font-medium text-gray-900">{aircraftResults.data.manufacturer} {aircraftResults.data.model}</p>
                                        </div>
                                        <div className="col-span-2">
                                            <p className="text-sm text-gray-500">Operator</p>
                                            <p className="font-medium text-gray-900">{aircraftResults.data.airline_icao || 'Unknown'}</p>
                                        </div>
                                    </div>
                                    <div className="mt-4 flex justify-end">
                                        <span className="text-sm font-medium text-gray-500 group-hover:text-gray-700 transition-colors duration-200">
                                            View details →
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        )}
                    </div>

                    {/* Airport Search */}
                    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                        <div className="flex items-center mb-6">
                            <div className="bg-gray-100 p-3 rounded-full mr-4">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-medium text-gray-900">Airport Search</h3>
                        </div>
                        
                        <div className="mb-6">
                            <input
                                type="text"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                                placeholder="IATA/ICAO (e.g. MAD or LEMD)"
                                onChange={handleAirportSearch}
                                maxLength="4"
                            />
                        </div>

                        {airportResults.loading && (
                            <div className="flex justify-center py-4">
                                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900"></div>
                            </div>
                        )}

                        {airportResults.error && (
                            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
                                <div className="flex">
                                    <div className="flex-shrink-0">
                                        <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-sm text-red-700">{airportResults.error}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {airportResults.visible && airportResults.data && (
                            <Link to={airportResults.data.infoUrl} className="block group">
                                <div className="bg-gray-50 rounded-lg p-5 border border-gray-200 hover:border-gray-300 transition-colors duration-200">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="col-span-2">
                                            <p className="text-sm text-gray-500">Airport</p>
                                            <p className="font-medium text-gray-900">{airportResults.data.name}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">ICAO</p>
                                            <p className="font-medium text-gray-900">{airportResults.data.icao}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">IATA</p>
                                            <p className="font-medium text-gray-900">{airportResults.data.iata}</p>
                                        </div>
                                    </div>
                                    <div className="mt-4 flex justify-end">
                                        <span className="text-sm font-medium text-gray-500 group-hover:text-gray-700 transition-colors duration-200">
                                            View details →
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        )}
                    </div>
                </div>
            </section>
        </div>
    );
}