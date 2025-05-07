import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import './Navbar.css';

function Navbar() {
    const { user, isAuthenticated, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/');
        } catch (error) {
            console.error("Error al cerrar sesión:", error);
        }
    };

    return (
        <header className="minimal-navbar">
            <div className="nav-container">
                <Link className="nav-brand" to="/">
                    <span className="nav-logo">✈</span>
                    <span className="nav-title">FlightTrack</span>
                </Link>

                <nav className="nav-links">
                    <Link className="nav-link" to="/map">Live Map</Link>
                    <Link className="nav-link" to="/scanner">Scanner</Link>
                    
                    {isAuthenticated ? (
                        <>
                            <Link className="nav-link" to="/profile">Perfil</Link>
                            <button 
                                className="nav-link logout-btn"
                                onClick={handleLogout}
                            >
                                Cerrar sesión
                            </button>
                        </>
                    ) : (
                        <>
                            <Link className="nav-link" to="/login">Iniciar sesión</Link>
                            <Link className="nav-link signup-btn" to="/register">Registrarse</Link>
                        </>
                    )}
                </nav>

                {/* Mobile menu button (hidden by default) */}
                <button className="mobile-menu-button">
                    <span className="menu-line"></span>
                    <span className="menu-line"></span>
                    <span className="menu-line"></span>
                </button>
            </div>
        </header>
    );
}

export default Navbar;
