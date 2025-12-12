import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
    Home, Radio, Users, Database, User, LogOut, LogIn, UserPlus, Sun, Moon
} from 'lucide-react'; // Iconos vectoriales  (SVG)
import { useAuth } from './context/AuthContext';
import './Navbar.css';

// =============================================================================
// COMPONENTE: BARRA DE NAVEGACIÓN (Navbar)
// -----------------------------------------------------------------------------
// Este componente gestiona la navegación principal de la aplicación.
// CARACTERÍSTICAS:
// 1. Navegación Condicional: Muestra enlaces distintos según el estado de autenticación (Login/Logout).
// 2. Diseño Flotante
// 3. Control de Tema: toggle para modo Claro/Oscuro.
// =============================================================================

function Navbar({ visible, setVisible, isDark, toggleTheme }) {
    // --- HOOKS DE CONTEXTO Y NAVEGACIÓN ---
    const { isAuthenticated, logout } = useAuth(); // Acceso al estado de sesión global
    const navigate = useNavigate(); // Para redirigir tras acciones
    const location = useLocation(); //  Para saber en qué página estamos

    // --- GESTIÓN DE CIERRE DE SESIÓN ---
    const handleLogout = async () => {
        try {
            await logout(); // Llamada al AuthContext para limpiar tokens y estado
            navigate('/login'); // Redirección inmediata por seguridad
        } catch (error) {
            console.error('Error al cerrar sesión:', error);
        }
    };

    // --- CONFIGURACIÓN DE RUTAS ---
    // Definimos los enlaces como objetos para mantener el código limpio y escalable.
    
    // 1. Enlaces Comunes (Visibles para todos)
    const commonLinks = [
        { to: '/', icon: <Home size={28} />, label: 'Inicio' },
        { to: '/map', icon: <Radio size={28} />, label: 'Live Map' }, 
        { to: '/scanner', icon: <Users size={28} />, label: 'Scanner' }, 
    ];

 
    const authLinks = isAuthenticated //nos se usa por el momento
        ? [ // Si está logueado: Acceso a datos, perfil y salir
            { to: '/data', icon: <Database size={28} />, label: 'Data' },
            { to: '/profile', icon: <User size={28} />, label: 'Perfil' },
            { icon: <LogOut size={28} />, label: 'Logout', onClick: handleLogout },
        ]
        : [ // Si es invitado: Acceso a entrar o registrarse
            { to: '/login', icon: <LogIn size={28} />, label: 'Login' },
            { to: '/register', icon: <UserPlus size={28} />, label: 'Registro' },
        ];

    // Fusión de listas para el renderizado final
    const allLinks = [...commonLinks, ...authLinks];

    // ==========================================
    // RENDERIZADO 
    // ==========================================
    return (
        <>
            {/* --- BOTÓN  ptrincipal --- */}
            {/* Este botón es independiente del navbar y controla su estado (visible/oculto).
                Utiliza un <input type="checkbox"> oculto para manejar el estado visual con CSS puro si fuera necesario,
                aunque aquí lo controlamos con React (setVisible).
              
            */}
            <label className="hamburger">
                <input
                    type="checkbox"
                    checked={visible}
                    onChange={() => setVisible(!visible)}
                />
                {/* Gráfico vectorial (SVG) animado para el icono de menú */}
                <svg viewBox="0 0 32 32">
                    <path className="line line-top-bottom" d="M27 10 13 10C10.8 10 9 8.2 9 6 9 3.5 10.8 2 13 2 15.2 2 17 3.8 17 6L17 26C17 28.2 18.8 30 21 30 23.2 30 25 28.2 25 26 25 23.8 23.2 22 21 22L7 22" />
                    <path className="line" d="M7 16 27 16" />
                </svg>
            </label>

            {/* --- BARRA DE NAVEGACIÓN FLOTANTE --- */}
     
            <nav className={`navbar ${visible ? '' : 'navbar--hidden'}`}>
                
                {/* Lista de Enlaces */}
                <ul className="navbar__menu">
                    {allLinks.map((link, index) => (
                        <li key={index} className="navbar__item">
                            {/* 
                                Si tiene 'onClick', es un <button> (acción).
                                Si tiene 'to', es un <Link> (navegación). 
                            */}
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
                </ul>

                {/* --- CONTROL DE TEMA (Dark Mode) --- */}
                {/* Interruptor aislado visualmente para cambiar la apariencia global */}
                <div className="theme-toggle-container">
                    <button onClick={toggleTheme} className="theme-btn">
                        {/* Iconografía dinámica según el estado del tema */}
                        {isDark ? <Sun size={24} /> : <Moon size={24} />}
                    </button>
                </div>
            </nav>
        </>
    );
}

export default Navbar;