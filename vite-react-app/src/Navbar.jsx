import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    Home, Radio, Users, Database, User,
    LogOut, LogIn, UserPlus,
} from 'lucide-react';
import { useAuth } from './context/AuthContext';
import './Navbar.css';

function Navbar({ visible, setVisible }) {
    const { isAuthenticated, logout } = useAuth();
    const navigate = useNavigate();
    const [hoverIndex, setHoverIndex] = useState(null);
    const indicatorRef = useRef(null);

    useEffect(() => {
        if (hoverIndex !== null && indicatorRef.current) {
            const items = document.querySelectorAll('.navbar__item');
            const hoveredItem = items[hoverIndex];
            if (hoveredItem) {
                const offset = hoveredItem.offsetTop;
                indicatorRef.current.style.top = `${offset}px`;
            }
        }
    }, [hoverIndex]);

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/');
        } catch (error) {
            console.error("Error al cerrar sesión:", error);
        }
    };

    const commonLinks = [
        { to: "/", icon: <Home size={24} />, label: "Inicio" },
        { to: "/map", icon: <Radio size={24} />, label: "Live Map" },
        { to: "/scanner", icon: <Users size={24} />, label: "Scanner" },
    ];

    const authLinks = isAuthenticated
        ? [
            { to: "/data", icon: <Database size={24} />, label: "Data" },
            { to: "/profile", icon: <User size={24} />, label: "Perfil" },
            { icon: <LogOut size={24} />, label: "Cerrar sesión", onClick: handleLogout },
        ]
        : [
            { to: "/login", icon: <LogIn size={20} />, label: "Iniciar sesión" },
            { to: "/register", icon: <UserPlus size={20} />, label: "Registrarse" },
        ];

    const allLinks = [...commonLinks, ...authLinks];

    return (
        <>
            <label className="hamburger">
                <input
                    type="checkbox"
                    checked={visible}
                    onChange={() => setVisible(!visible)}
                />
                <svg viewBox="0 0 42 42">
                    <path
                        d="M27 10 13 10C10.8 10 9 8.2 9 6 9 3.5 10.8 2 13 2 15.2 2 17 3.8 17 6L17 26C17 28.2 18.8 30 21 30 23.2 30 25 28.2 25 26 25 23.8 23.2 22 21 22L7 22"
                        className="line line-top-bottom"
                    />
                    <path d="M7 16 27 16" className="line" />
                </svg>
            </label>

            <nav className={`navbar ${visible ? '' : 'navbar--hidden'}`}>
                <ul className="navbar__menu">
                    {allLinks.map((link, index) => (
                        <li
                            className="navbar__item"
                            key={index}
                            onMouseEnter={() => setHoverIndex(index)}
                            onMouseLeave={() => setHoverIndex(null)}
                        >
                            {link.onClick ? (
                                <button onClick={link.onClick} className="navbar__link">
                                    {link.icon}
                                    <span>{link.label}</span>
                                </button>
                            ) : (
                                <Link to={link.to} className="navbar__link">
                                    {link.icon}
                                    <span>{link.label}</span>
                                </Link>
                            )}
                        </li>
                    ))}
                    <li className="navbar__indicator" ref={indicatorRef}></li>
                </ul>
            </nav>
        </>
    );
}

export default Navbar;
