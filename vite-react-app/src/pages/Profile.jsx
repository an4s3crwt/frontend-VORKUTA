import React, { useEffect, useState } from 'react';
import api from './../api'; 

// =============================================================================
// PÁGINA: PERFIL DE USUARIO (Profile)
// -----------------------------------------------------------------------------
// Esta pantalla muestra la información personal del usuario logueado.
// =============================================================================

export default function Profile() {
    // --- ESTADO DEL COMPONENTE ---
    const [user, setUser] = useState(null);   // Datos del usuario 
    const [loading, setLoading] = useState(true); // Controla el spinner
    const [error, setError] = useState(null);     // Controla mensajes de fallo

    // --- CARGA DE DATOS (Data Fetching) ---
    // Al montar el componente, pedimos al backend QUIEN ES EL USUARIO LOGEADO (/auth/me)
    useEffect(() => {
        const fetchProfile = async () => {
            try {
                // Petición protegida (el token va en la cabecera automáticamente gracias a Axios)
                const response = await api.get('/auth/me');
                setUser(response.data);
            } catch (error) {
                console.error("Error fetching profile:", error);
                setError("No se pudo cargar la información del usuario. Verifica tu conexión.");
            } finally {
                // Ocultamos el spinner tanto si va bien como si falla
                setLoading(false);
            }
        };

        fetchProfile();
    }, []);

    // --- UTILIDAD VISUAL: GENERADOR DE AVATAR ---
    // Si el usuario no tiene foto, creamos un avatar con sus iniciales.
    // Ejemplo: "Carlos Ruiz" -> "CR".
    const getInitials = (name) => {
        return name
            ? name.split(' ').map((n) => n[0]).join('').toUpperCase().substring(0, 2)
            : 'U'; // 'U' de User por defecto
    };

    // --- RENDERIZADO CONDICIONAL: ESTADO DE CARGA ---
    if (loading) {
        return (
            <div className="flex justify-center items-center h-[calc(100vh-64px)]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    // --- RENDERIZADO CONDICIONAL: ESTADO DE ERROR ---
    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-red-500 animate-fadeIn">
                <i className="fa fa-exclamation-triangle text-4xl mb-3 opacity-50"></i>
                <p className="font-medium">{error}</p>
                <button onClick={() => window.location.reload()} className="mt-4 text-sm text-blue-600 underline">
                    Intentar de nuevo
                </button>
            </div>
        );
    }

    // --- RENDERIZADO PRINCIPAL  ---
    return (
        <div className="max-w-2xl mx-auto px-4 py-12 animate-slide-up">
            
            {/* TARJETA DE PERFIL  */}
            {/* Usamos 'overflow-hidden' para que la imagen de fondo no se salga de las esquinas redondeadas */}
            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden transition-all hover:shadow-2xl">
                
                {/* 1. CABECERA VISUAL  */}
             
                <div className="h-32 bg-gradient-to-r from-blue-600 to-indigo-600 relative">
                
                    <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                </div>

                {/* 2. CONTENIDO PRINCIPAL */}
                <div className="px-8 pb-8 relative">
                    
                
                    <div className="relative -mt-16 mb-6 flex justify-between items-end">
                        <div className="h-32 w-32 rounded-full border-4 border-white dark:border-gray-800 bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-4xl font-bold text-gray-500 dark:text-gray-300 shadow-md">
                            {getInitials(user.name)}
                        </div>
                        
              
                        <div className="mb-2 px-4 py-1.5 bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full text-xs font-bold uppercase tracking-wide border border-green-200 dark:border-green-800 flex items-center gap-2">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                            Active Member
                        </div>
                    </div>

                    {/* DATOS DE IDENTIDAD */}
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1 tracking-tight">
                        {user.name}
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mb-8 flex items-center gap-2 font-medium">
                        <i className="fa fa-envelope text-gray-400"></i> 
                        {user.email}
                    </p>

                    {/* SEPARADOR */}
                    <hr className="border-gray-100 dark:border-gray-700 mb-8" />

                    {/* 3. GRID DE DETALLES TÉCNICOS */}
                    {/* Información estructurada en una cuadrícula de 2 columnas */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        
                        {/* Card: ID de Usuario */}
                        <div className="p-5 bg-gray-50 dark:bg-gray-700/30 rounded-2xl border border-gray-100 dark:border-gray-700/50">
                            <div className="text-xs text-gray-400 uppercase font-bold mb-1 tracking-wider">Account ID</div>
                            <div className="font-mono text-sm text-gray-700 dark:text-gray-200 truncate">
                                #{user.id || 'Unknown-ID'}
                            </div>
                        </div>
                        
                        {/* Card: Rol / Permisos */}
                        <div className="p-5 bg-gray-50 dark:bg-gray-700/30 rounded-2xl border border-gray-100 dark:border-gray-700/50">
                            <div className="text-xs text-gray-400 uppercase font-bold mb-1 tracking-wider">Role & Permissions</div>
                            <div className="font-medium text-sm text-gray-700 dark:text-gray-200 flex items-center gap-2">
                                {user.is_admin ? (
                                    <><i className="fa fa-shield text-purple-500"></i> Administrator Access</>
                                ) : (
                                    <><i className="fa fa-user text-blue-500"></i> Standard User</>
                                )}
                            </div>
                        </div>

                        {/* Card: Estado del Sistema */}
                        <div className="p-5 bg-gray-50 dark:bg-gray-700/30 rounded-2xl border border-gray-100 dark:border-gray-700/50">
                            <div className="text-xs text-gray-400 uppercase font-bold mb-1 tracking-wider">System Status</div>
                            <div className="font-medium text-sm text-green-600 dark:text-green-400 flex items-center gap-2">
                                <i className="fa fa-check-circle"></i> Authenticated & Verified
                            </div>
                        </div>

                        {/* Card: Último Acceso (Simulado de momentoop) */}
                        <div className="p-5 bg-gray-50 dark:bg-gray-700/30 rounded-2xl border border-gray-100 dark:border-gray-700/50">
                            <div className="text-xs text-gray-400 uppercase font-bold mb-1 tracking-wider">Session Info</div>
                            <div className="font-medium text-sm text-gray-700 dark:text-gray-200">
                                Current Session Active
                            </div>
                        </div>

                    </div>
                </div>
            </div>

            {/* COPYRIGHT FOOTER */}
            <div className="text-center mt-8 text-xs text-gray-400">
                Flighty User Profile Module v1.0
            </div>
        </div>
    );
}