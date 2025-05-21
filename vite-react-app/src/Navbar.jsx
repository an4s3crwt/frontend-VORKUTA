import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Home, Radio, Users, Database, User, LogOut, LogIn, UserPlus } from 'lucide-react';
import { useAuth } from './context/AuthContext';
import './Navbar.css';

function Navbar() {
    const { isAuthenticated, logout } = useAuth();
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
        <nav className="navbar">
            <ul className="navbar__menu">
                <li className="navbar__item">
                    <Link to="/" className="navbar__link">
                        <Home size={20} />
                        <span>Inicio</span>
                    </Link>
                </li>
                <li className="navbar__item">
                    <Link to="/map" className="navbar__link">
                        <Radio size={20} />
                        <span>Live Map</span>
                    </Link>
                </li>
                <li className="navbar__item">
                    <Link to="/scanner" className="navbar__link">
                        <Users size={20} />
                        <span>Scanner</span>
                    </Link>
                </li>
                {isAuthenticated ? (
                    <>
                        <li className="navbar__item">
                            <Link to="/data" className="navbar__link">
                                <Database size={20} />
                                <span>Data</span>
                            </Link>
                        </li>
                        <li className="navbar__item">
                            <Link to="/profile" className="navbar__link">
                                <User size={20} />
                                <span>Perfil</span>
                            </Link>
                        </li>
                        <li className="navbar__item">
                            <button onClick={handleLogout} className="navbar__link">
                                <LogOut size={20} />
                                <span>Cerrar sesión</span>
                            </button>
                        </li>
                    </>
                ) : (
                    <>
                        <li className="navbar__item">
                            <Link to="/login" className="navbar__link">
                                <LogIn size={20} />
                                <span>Iniciar sesión</span>
                            </Link>
                        </li>
                        <li className="navbar__item">
                            <Link to="/register" className="navbar__link">
                                <UserPlus size={20} />
                                <span>Registrarse</span>
                            </Link>
                        </li>
                    </>
                )}
            </ul>
        </nav>
    );
}

export default Navbar;
