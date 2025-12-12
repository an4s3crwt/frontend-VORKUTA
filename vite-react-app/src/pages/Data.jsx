import React from "react";
import { Outlet, Link, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// =============================================================================
// COMPONENTE: Data Layout (Contenedor Principal de Datos)
// -----------------------------------------------------------------------------
// Este componente actúa como un "marco" o plantilla para las secciones de datos
// (Aerolíneas y Aeropuertos). Su responsabilidad es doble:
// 1. SEGURIDAD: Verifica si el usuario tiene permiso para estar aquí.
// 2. NAVEGACIÓN: Muestra las pestañas (Tabs) para cambiar entre vistas sin recargar.
// =============================================================================

const Data = () => {
  // --- HOOKS Y CONTEXTO ---
  const { isAuthenticated } = useAuth(); // Consultamos al sistema de seguridad si hay sesión activa
  const location = useLocation();        // Averiguamos en qué URL exacta estamos (para iluminar la pestaña correcta)

  // --- 1. PROTECCIÓN DE RUTA (Route Guard) ---
  // Si el usuario no está logueado, lo expulsamos inmediatamente al Login.
  // El 'replace' es importante: evita que pueda volver atrás con el botón del navegador.
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // --- 2. LÓGICA DE NAVEGACIÓN ---
  // Detectamos qué pestaña está activa analizando la URL.
  // Ejemplo: si la URL es "/data/airports", el split coge "airports".
  // Si no hay nada (ruta raíz "/data"), por defecto vamos a "airlines".
  const activeTab = location.pathname.split("/")[2] || "airlines";

  // Configuración de las pestañas disponibles.
  // Hacerlo con un array (map) hace que el código sea más limpio y fácil de ampliar en el futuro
  const tabs = [
    { name: "Airlines", path: "airlines" },
    { name: "Airports", path: "airports" },
  ];

  // ==========================================
  // 3. RENDERIZADO (INTERFAZ VISUAL)
  // ==========================================
  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 mx-auto transition-all duration-500">

      {/* --- BARRA DE PESTAÑAS (TABS) --- */}
      <div className="flex justify-center mb-8 sm:mb-10">
        <div className="flex bg-white dark:bg-neutral-900/70 backdrop-blur-2xl 
                        border border-gray-200 dark:border-neutral-800 rounded-2xl 
                        shadow-[0_0_40px_-15px_rgba(0,0,0,0.1)] p-1 transition-all duration-300">
          
          {/* Generamos los botones dinámicamente */}
          {tabs.map((tab) => (
            <Link
              key={tab.path}
              to={`/data/${tab.path}`} // Navegación interna
              className={`
                relative px-4 sm:px-6 py-2.5 text-sm font-medium rounded-xl transition-all duration-300
                ${
                  // Lógica de estilos condicionales:
                  // Si es la pestaña activa -> Fondo negro, texto blanco y un poco más grande.
                  // Si no -> Gris, y al pasar el ratón (hover) se oscurece.
                  activeTab === tab.path
                    ? "bg-black text-white shadow-md scale-[1.03]"
                    : "text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white hover:bg-gray-100/80 dark:hover:bg-white/10"
                }
              `}
            >
              {tab.name}
              
              {/* Detalle visual: Una pequeña línea decorativa debajo si está activo */}
              {activeTab === tab.path && (
                <div className="absolute -bottom-[2px] left-0 right-0 mx-auto w-8 h-[2px] bg-gradient-to-r from-gray-700 to-gray-400 rounded-full"></div>
              )}
            </Link>
          ))}
        </div>
      </div>

      {/* --- ÁREA DE CONTENIDO DINÁMICO --- */}
      {/*
         <Outlet /> es un "hueco" donde se renderizará el componente hijo correspondiente
         (AirlinesData o AirportsData) según la ruta, pero manteniendo el diseño de arriba fijo.
      */}
      <div className="w-full bg-white dark:bg-neutral-900/70 
                      backdrop-blur-2xl rounded-3xl shadow-[0_0_40px_-15px_rgba(0,0,0,0.1)] 
                      p-4 sm:p-6 lg:p-8 transition-all duration-500 
                      border border-gray-100 dark:border-neutral-800">
        <Outlet />
      </div>

    </div>
  );
};

export default Data;