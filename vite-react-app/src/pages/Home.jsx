import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';  // Asegúrate de que esto exista
import "./home.css";


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
            if (window.confirm("Debes iniciar sesión para ver el mapa en vivo. ¿Deseas ir a la página de inicio de sesión?")) {
                navigate('/login');
            }
            return;
        }
        navigate('/map');
    };

    return (
        <div className='minimal-container'>
            {/* Hero Section Minimalista */}
            <section className='minimal-hero'>
                <div className='hero-content'>
                    <h1>Real-Time Flight Tracking</h1>
                    <p className='hero-subtitle'>
                        Track aircraft movements in real time
                    </p>
                    <button onClick={handleViewMap} className='hero-button'>
                        View Live Map
                    </button>
                    {!isAuthenticated && (
                        <p className="auth-notice">
                            <Link to="/login">Inicia sesión</Link> para acceso completo
                        </p>
                    )}
                </div>
            </section>

            {/* Search Section */}
            <section className='search-section'>
                <h2 className='section-title'>Search Database</h2>
                <div className='search-grid'>
                    {/* Aircraft Search */}
                    <div className='search-card'>
                        <h3 className='search-title'>
                            <span className='search-icon'>✈</span>
                            Aircraft Search
                        </h3>
                        <div className='search-input-container'>
                            <input
                                type="text"
                                className='search-input'
                                placeholder='Registration (e.g. N12345)'
                                onChange={handleAircraftSearch}
                                maxLength="9"
                            />
                        </div>

                        {aircraftResults.loading && (
                            <div className='loading-indicator'>
                                <div className='loading-spinner'></div>
                            </div>
                        )}

                        {aircraftResults.error && (
                            <div className='error-message'>
                                {aircraftResults.error}
                            </div>
                        )}

                        {aircraftResults.visible && aircraftResults.data && (
                            <div className='result-card'>
                                <Link to={aircraftResults.data.infoUrl} className='result-link'>
                                    <div className='result-row'>
                                        <span className='result-label'>Registration:</span>
                                        <span className='result-value'>{aircraftResults.data.registration}</span>
                                    </div>
                                    <div className='result-row'>
                                        <span className='result-label'>Type:</span>
                                        <span className='result-value'>{aircraftResults.data.manufacturer} {aircraftResults.data.model}</span>
                                    </div>
                                    <div className='result-row'>
                                        <span className='result-label'>Operator:</span>
                                        <span className='result-value'>{aircraftResults.data.airline_icao || 'Unknown'}</span>
                                    </div>
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Airport Search */}
                    <div className='search-card'>
                        <h3 className='search-title'>
                            <span className='search-icon'>🛫</span>
                            Airport Search
                        </h3>
                        <div className='search-input-container'>
                            <input
                                type="text"
                                className='search-input'
                                placeholder='IATA/ICAO (e.g. MAD or LEMD)'
                                onChange={handleAirportSearch}
                                maxLength="4"
                            />
                        </div>

                        {airportResults.loading && (
                            <div className='loading-indicator'>
                                <div className='loading-spinner'></div>
                            </div>
                        )}

                        {airportResults.error && (
                            <div className='error-message'>
                                {airportResults.error}
                            </div>
                        )}

                        {airportResults.visible && airportResults.data && (
                            <div className='result-card'>
                                <Link to={airportResults.data.infoUrl} className="result-link">
                                    <div className='result-row'>
                                        <span className='result-label'>Airport:</span>
                                        <span className='result-value'>{airportResults.data.name}</span>
                                    </div>
                                    <div className='result-row'>
                                        <span className='result-label'>ICAO:</span>
                                        <span className='result-value'>{airportResults.data.icao}</span>
                                    </div>
                                    <div className='result-row'>
                                        <span className='result-label'>IATA:</span>
                                        <span className='result-value'>{airportResults.data.iata}</span>
                                    </div>
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </section>
        </div>
    );
}