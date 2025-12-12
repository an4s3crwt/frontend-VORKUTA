import React from 'react';
import { Route, Routes } from "react-router-dom";

// --- IMPORTACIÓN DE PÁGINAS (LAS VISTAS) ---
import Home from "./pages/Home";
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Logout from './pages/Logout';
import NotFound from "./pages/NotFound";
import AccessDenied from './pages/AccessDenied';
import Data from './pages/Data';
import Layout from "./pages/Layout";

// --- IMPORTACIÓN DE FUNCIONALIDADES (LOS COMPONENTES) ---
import FlightInfo from "./pages/Flight/FlightInfo";
import FlightList from "./pages/Flight/FlightList";
import NearbyFlightsScanner from './pages/NearbyFlightsScanner';
import AirplaneData from './components/AirplaneData';
import AirlinesData from './components/AirlinesData';
import AirportsData from './components/AirportsData';

// --- IMPORTACIÓN DE ADMIN Y SEGURIDAD ---
import CreateAdmin from './pages/Admin/CreateAdmin';
import AdminDashboard from './pages/Admin/AdminDashboard';
import { PrivateRoute } from './../src/components/PrivateRoute';
import ErrorBoundary from './components/ErrorBoundary';

// =============================================================================
// COMPONENTE: APP ROUTER (El GPS de la Aplicación)
// -----------------------------------------------------------------------------
// Aquí es donde definimos la arquitectura de navegación.
// Organizamos la web en dos mundos: 
// 1. ZONA PÚBLICA: Login, Registro, Errores (accesible para todos).
// 2. ZONA PRIVADA: El resto de la app (protegida por el componente PrivateRoute).
// =============================================================================

export default function App() {
  return (
    // 'ErrorBoundary' Si la app explota en cualquier punto,
    // este componente captura el error y muestra una pantalla bonita en vez de poner la web en blanco.
    <ErrorBoundary>
      <Routes>
        
        {/* ====================================================================
            ZONA PÚBLICA (Acceso libre)
           ==================================================================== */}
        <Route path="/access-denied" element={<AccessDenied />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/*  En producción, crear admin esta estar protegido, pero para la demo lo dejoo aquí */}
        <Route path="/create-admin" element={<CreateAdmin />} />
        
        {/* EL 404
            El asterisco (*) significa "cualquier ruta que no haya definido arriba".
            Si el usuario inventa una URL, le mandamos a la página de "No Encontrado". */}
        <Route path="*" element={<NotFound />} />


        {/* ====================================================================
            ZONA PRIVADA (Solo usuarios logueados)
           ==================================================================== */}
        {/* Aquí usamos un patrón de "Layout Wrapper".
            Todas las rutas de abajo están envueltas por <Layout /> (que tiene la Navbar)
            y protegidas por <PrivateRoute /> (que verifica el login).
        */}
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }
        >
          {/* RUTA BASE */}
          <Route index element={<Home />} />

          {/* --- SECCIÓN DE DATOS (/data) ---
              Aquí usamos rutas anidadas. '/data' es el contenedor, y dentro cargamos
              las pestañas de Aerolíneas o Aeropuertos. */}
          <Route path="data" element={<Data />}>
            <Route path="airlines" element={<AirlinesData />} />
            <Route path="airports" element={<AirportsData />} />
          </Route>

          {/* --- DETALLES DE VUELO ---
              Usamos parámetros dinámicos (:icao). Así, '/airport/IBE324' carga
              la información específica de ese vuelo. */}
          <Route 
            path="airport/:icao" 
            element={
              <ErrorBoundary>
                <FlightInfo />
              </ErrorBoundary>
            } 
          />

          {/* Alias para la misma página*/}
          <Route
            path="flight-info/:icao"
            element={
              <ErrorBoundary>
                <FlightInfo />
              </ErrorBoundary>
            }
          />

          {/* --- EL MAPA EN VIVO --- */}
          <Route
            path="map"
            element={
              <ErrorBoundary>
                <FlightList />
              </ErrorBoundary>
            }
          />
          {/* Alias para el mapa */}
          <Route
            path="flights"
            element={
              <ErrorBoundary>
                <FlightList />
              </ErrorBoundary>
            }
          />

          {/* --- ESCÁNER DE PROXIMIDAD --- 
              El signo de interrogación en ':radius?' significa que el parámetro es OPCIONAL.
              Funciona tanto '/scanner' como '/scanner/500' */}
          <Route path="scanner/:radius?" element={
            <ErrorBoundary>
              <NearbyFlightsScanner />
            </ErrorBoundary>
          } />

          {/* --- GESTIÓN DE USUARIO --- */}
          <Route
            path="profile"
            element={
              <ErrorBoundary>
                <Profile />
              </ErrorBoundary>
            }
          />
          <Route path="logout" element={<Logout />} />

          {/* --- ZONA DE ADMINISTRACIÓN (DOBLE SEGURIDAD) ---
              Aquí añadimos una capa extra: 'adminOnly={true}'.
              No basta con estar logueado, tienes que ser EL ADMIN */}
          <Route
            path="admin/dashboard"
            element={
              <PrivateRoute adminOnly={true}>
                <ErrorBoundary>
                  <AdminDashboard />
                </ErrorBoundary>
              </PrivateRoute>
            }
          />

        </Route> {/* Fin del Layout Principal */}
      </Routes>
    </ErrorBoundary>
  );
}