import { useEffect } from "react";
import ThreeBackground from "../components/ThreeBackground"; // El fondo 3D animado
import { useAuth } from "../context/AuthContext";
import "./../index.css";
import "./home.css";

// =============================================================================
// PÁGINA: HOME (LANDING PAGE)
// ============================================================================

export default function Home() {
  // Conexión con el sistema de usuarios (por si quisiéramos mostrar "Hola, [Usuario]", amppliable)
  const { isAuthenticated } = useAuth();

  // ==========================================
  // 1. EFECTO VISUAL: CURSOR PERSONALIZADO
  // ==========================================
  // Usamos este efecto
  // que sigue el movimiento del ratón.
  useEffect(() => {
    const cursor = document.querySelector(".custom-cursor");
    
    // Función que actualiza la posición del div "cursor"
    const moveCursor = (e) => {
      if (cursor) {
        // Movemos el elemento a las coordenadas exactas del ratón (X, Y)
        cursor.style.left = `${e.clientX}px`;
        cursor.style.top = `${e.clientY}px`;
      }
    };
    
    // Empezamos a escuchar el movimiento del ratón
    document.addEventListener("mousemove", moveCursor);
    
    // LIMPIEZA: Muy importante. Cuando el usuario cambia de página,
    // dejamos de rastrear el ratón para no consumir recursos innecesarios.
    return () => document.removeEventListener("mousemove", moveCursor);
  }, []);

  // ==========================================
  // 2. ESTRUCTURA VISUAL (LAYOUT)
  // ==========================================
  return (
    <div className="home-container">
      
      {/* CAPA 1: FONDO 3D */}
      {/* Renderizamos el componente de Three.js detrás de todo.
          Esto crea profundidad sin molestar al contenido. */}
      <ThreeBackground />
      
      {/* CAPA 2: MÁSCARA DE FONDO */}
      {/* Una capacon imagen estática para asegurar
          que el texto se lea bien aunque el fondo 3D sea muy colorido. */}
      <div className="home-image home-background" />

      {/* CAPA 3: CONTENIDO PRINCIPAL (TEXTO Y BOTONES) */}
      {/* Usamos 'relative z-10' para asegurar que esto esté ENCIMA del fondo 3D
          y que los botones se puedan pulsar. */}
      <div className="content relative z-10 text-gray-200">
        
        {/* SECCIÓN HERO (Títulos) */}
        <div className="quote-container">
          {/* Logo o Imagen decorativa */}
          <img
            src="/DEFO.png"
            alt="Airplane"
            className="plane-image"
          />

          <div className="quote uppercase font-bold">
            Flight Tracker
          </div>

          <div className="author italic">
            Rastrea vuelos en tiempo real alrededor del mundo.
          </div>

          <div className="book">
            Pulsa 'Live Map' para empezar.
          </div>
        </div>

        {/* LLAMADA A LA ACCIÓN */}
        {/* El botón más importante de la página. Grande y claro para que
            el usuario sepa qué tiene que hacer. */}
        <a href="/map" className="live-map-link">
          <button className="learn-more">
            <span className="button-text">Live Map</span>
          </button>
        </a>
      </div>

      {/* ELEMENTO DECORATIVO: El cursor que programamos arriba */}
      {/* Solo se verá en ordenadores (desktop), en móviles se oculta por CSS */}
      <div className="custom-cursor"></div>
    </div>
  );
}