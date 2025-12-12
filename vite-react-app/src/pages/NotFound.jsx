import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase";

export default function NotFound() {
  const navigate = useNavigate();

  useEffect(() => {
    // -------------------------------------------------------
    // BLOQUEAR RETROCESO DEL NAVEGADOR
    // -------------------------------------------------------
    // Previene que el usuario use el botón "Atrás"
    // para evitar saltarse la protección del 404.
    window.history.pushState(null, "", window.location.href);
    window.onpopstate = () => window.history.go(1);

    // -------------------------------------------------------
    // DESHABILITAR ACCIONES NO DESEADAS (INSPECCIÓN Y CLIC DERECHO)
    // -------------------------------------------------------
    const disableActions = (e) => {
      if (
        e.key === "F12" ||
        (e.ctrlKey && e.key.toLowerCase() === "u") ||
        (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "i")
      ) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    document.addEventListener("contextmenu", (e) => e.preventDefault());
    document.addEventListener("keydown", disableActions);

    // -------------------------------------------------------
    // CERRAR SESIÓN AUTOMÁTICAMENTE SI EXISTE UN USUARIO
    // -------------------------------------------------------
    if (auth?.currentUser) {
      auth.signOut();
      localStorage.clear();
      sessionStorage.clear();
    }

    // -------------------------------------------------------
    // LIMPIEZA AL DESMONTAR COMPONENTE
    // -------------------------------------------------------
    return () => {
      document.removeEventListener("keydown", disableActions);
      document.oncontextmenu = null;
      window.onpopstate = null;
    };
  }, []);

  // -------------------------------------------------------
  // DISEÑO VISUAL
  // -------------------------------------------------------

  return (
    <div
      className="flex flex-col justify-center items-center min-h-screen text-center transition-all"
      style={{
        backgroundColor: "#ffffff",
        color: "#000000",
        fontFamily: "Arial, Helvetica, sans-serif",
        letterSpacing: "0.05em",
      }}
    >
      {/* Título principal */}
      <h1
        className="text-[12vw] font-extrabold leading-none tracking-tighter"
        style={{
          borderBottom: "2px solid #000",
          paddingBottom: "0.3em",
          marginBottom: "0.2em",
        }}
      >
        404
      </h1>

      {/* Subtítulo */}
      <h2
        className="text-[1.5rem] uppercase tracking-widest font-medium"
        style={{ marginBottom: "1.5rem" }}
      >
        Page Not Found
      </h2>

      {/* Descripción */}
      <p
        className="max-w-md text-sm font-light text-gray-700"
        style={{
          color: "#111",
          opacity: 0.7,
          marginBottom: "2.5rem",
        }}
      >
        This page does not exist or has been restricted.
        <br />
        Please return to the home page.
      </p>

      {/* Botón  */}
      <button
        onClick={() => navigate("/")}
        style={{
          backgroundColor: "#000",
          color: "#fff",
          border: "2px solid #000",
          padding: "0.75rem 2rem",
          fontWeight: "600",
          letterSpacing: "0.05em",
          textTransform: "uppercase",
          transition: "all 0.2s ease",
        }}
        onMouseOver={(e) => {
          e.target.style.backgroundColor = "#fff";
          e.target.style.color = "#000";
        }}
        onMouseOut={(e) => {
          e.target.style.backgroundColor = "#000";
          e.target.style.color = "#fff";
        }}
      >
        Return Home
      </button>
    </div>
  );
}
