import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plane } from 'lucide-react'; // ✅ CORRECTO
import { useAuth } from './context/AuthContext';
import './Navbar.css';

function Navbar() {
    const { isAuthenticated, logout } = useAuth();
    const navigate = useNavigate();
    const [menuOpen, setMenuOpen] = useState(false);

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
                <Link to="/" className="nav-brand">
                    <Plane className="nav-logo" />
                    <span className="nav-title">FlightTrack</span>
                </Link>

                <nav className={`nav-links ${menuOpen ? 'active' : ''}`}>
                    <Link className="nav-link" to="/map">Live Map</Link>
                    <Link className="nav-link" to="/scanner">Scanner</Link>

                    {isAuthenticated ? (
                        <>
                            <Link className="nav-link" to="/data">Data</Link>
                            <Link className="nav-link" to="/profile">Perfil</Link>
                            <button className="nav-link" onClick={handleLogout}>Cerrar sesión</button>
                        </>
                    ) : (
                        <>
                            <Link className="nav-link" to="/login">Iniciar sesión</Link>
                            <Link className="nav-link" to="/register">Registrarse</Link>
                        </>
                    )}
                </nav>

                <button
                    className="mobile-menu-button"
                    onClick={() => setMenuOpen(!menuOpen)}
                >
                    <span className="menu-line"></span>
                    <span className="menu-line"></span>
                    <span className="menu-line"></span>
                </button>
            </div>
        </header>
    );
}

export default Navbar;
