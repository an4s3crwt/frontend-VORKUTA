import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../Navbar';
import './Layout.css';

// =============================================================================
// COMPONENTE: LAYOUT PRINCIPAL (El Marco de la App)
// -----------------------------------------------------------------------------
// Este componente es el "padre" de todas las páginas. 
// Su misión es mantener los elementos fijos (como la Barra de Navegación y el fondo)
// mientras el contenido cambia dinámicamente gracias a <Outlet />.
// =============================================================================

export default function Layout() {
  // --- 1. CONTROL DE LA BARRA DE NAVEGACIÓN ---
  // Estado para saber si el menú está visible o escondido
  const [navbarVisible, setNavbarVisible] = useState(true);

  // --- 2. GESTIÓN DEL TEMA (MODO CLARO / OSCURO) ---
  // Aquí aplicamos "Persistencia de Datos".
  // En lugar de empezar siempre en 'light', preguntamos al navegador:
  // "¿Oye, este usuario ya eligió un color antes?". Si es así, lo respetamos.
  // Esto mejora mucho la experiencia de usuario
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('app-theme') || 'light';
  });

  // Función TIPO Interruptor: Cambia el estado y lo guarda en la memoria del navegador.
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('app-theme', newTheme); // Guardado para la próxima visita
  };

  // --- 3. EFECTO VISUAL: CURSOR INTERACTIVO ---
  // Este bloque de código no es funcional, es puramente estético 
  // Reemplazamos el puntero aburrido por uno personalizado que reacciona
  // cuando pasas por encima de botones o enlaces.
  useEffect(() => {
    const cursor = document.querySelector('.custom-cursor');
    if (!cursor) return; // Seguridad: Si no hay cursor, no hacemos nada.

    // Movemos el círculo a donde esté el ratón
    const moveCursor = (e) => {
      cursor.style.left = `${e.clientX}px`;
      cursor.style.top = `${e.clientY}px`;
    };

    // Efecto "Imán": Hacemos el cursor más grande al pasar por cosas clicables
    const enlarge = () => cursor.classList.add('cursor-hover');
    const shrink = () => cursor.classList.remove('cursor-hover');

    // Escuchamos el movimiento
    document.addEventListener('mousemove', moveCursor);
    
    // Buscamos todo lo que sea clicable para añadirle el efecto
    document.querySelectorAll('a, button, .theme-toggle').forEach((el) => { 
      el.addEventListener('mouseenter', enlarge);
      el.addEventListener('mouseleave', shrink);
    });

    // LIMPIEZA: (Buenas prácticas de React)
    // Cuando cambiamos de página, dejamos de escuchar al ratón para no consumir memoria RAM.
    return () => {
      document.removeEventListener('mousemove', moveCursor);
      document.querySelectorAll('a, button, .theme-toggle').forEach((el) => {
        el.removeEventListener('mouseenter', enlarge);
        el.removeEventListener('mouseleave', shrink);
      });
    };
  }, []); // El array vacío [] significa: "Ejecuta esto solo una vez al cargar la app".

  // ==========================================
  // 4. RENDERIZADO (LA ESTRUCTURA HTML)
  // ==========================================
  return (
    // Inyectamos la clase del tema (light/dark) en el contenedor más externo.
    // Así, todo el CSS de la app cambia de color automáticamente con variables CSS.
    <div className={`app-layout ${theme}`}>
      
      {/* BARRA DE NAVEGACIÓN:
         Le pasamos la función 'toggleTheme' para que el botón de cambiar color
         esté dentro del menú, aunque la lógica esté aquí arriba.
      */}
      <Navbar 
        visible={navbarVisible} 
        setVisible={setNavbarVisible} 
        theme={theme} 
        toggleTheme={toggleTheme} 
      />

      {/* ÁREA DE CONTENIDO ():
       
         <Outlet /> es un "hueco vacío" donde se pintará la página actual
         (Home, Mapa, Login...) sin tener que recargar el Layout completo.
      */}
      <main className={`content-area ${navbarVisible ? '' : 'navbar-hidden'}`}>
        <Outlet />
      </main>

      {/* El elemento decorativo del cursor que controlamos con el useEffect */}
      <div className="custom-cursor"></div>
    </div>
  );
}