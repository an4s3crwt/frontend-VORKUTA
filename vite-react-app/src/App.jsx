import React from 'react';
import { Route, Routes } from "react-router-dom";

// --- IMPORTACIÓN DE PÁGINAS ---
import Home from "./pages/Home";
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Logout from './pages/Logout';
import NotFound from "./pages/NotFound";
import AccessDenied from './pages/AccessDenied';
import Data from './pages/Data';
import Layout from "./pages/Layout";

// --- IMPORTACIÓN DE FUNCIONALIDADES ---
import FlightInfo from "./pages/Flight/FlightInfo";
import FlightList from "./pages/Flight/FlightList";
import NearbyFlightsScanner from './pages/NearbyFlightsScanner';

import AirlinesData from './components/AirlinesData';
import AirportsData from './components/AirportsData';

// --- IMPORTACIÓN DE ADMIN Y SEGURIDAD ---
import CreateAdmin from './pages/Admin/CreateAdmin';
import AdminDashboard from './pages/Admin/AdminDashboard';
import { PrivateRoute } from './../src/components/PrivateRoute';
import ErrorBoundary from './components/ErrorBoundary';

export default function App() {
  return (
    <ErrorBoundary>
      <Routes>
        
        {/* ====================================================================
            ZONA PÚBLICA (Acceso libre)
           ==================================================================== */}
        <Route path="/access-denied" element={<AccessDenied />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/create-admin" element={<CreateAdmin />} />

        {/* ====================================================================
            ZONA PRIVADA (Solo usuarios logueados)
           ==================================================================== */}
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }
        >
          {/* RUTA BASE (/) */}
          <Route index element={<Home />} />

          {/* --- SECCIÓN DE DATOS (/data) --- */}
          <Route path="data" element={<Data />}>
            <Route path="airlines" element={<AirlinesData />} />
            <Route path="airports" element={<AirportsData />} />
          </Route>

          {/* --- DETALLES DE VUELO --- */}
          <Route 
            path="airport/:icao" 
            element={
              <ErrorBoundary>
                <FlightInfo />
              </ErrorBoundary>
            } 
          />
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
          <Route
            path="flights"
            element={
              <ErrorBoundary>
                <FlightList />
              </ErrorBoundary>
            }
          />

          {/* --- ESCÁNER DE PROXIMIDAD --- */}
          <Route 
            path="scanner/:radius?" 
            element={
              <ErrorBoundary>
                <NearbyFlightsScanner />
              </ErrorBoundary>
            } 
          />

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

          {/* --- ZONA DE ADMINISTRACIÓN --- */}
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

        {/* ====================================================================
            FALLBACK 404 (Siempre al final de todo el árbol de rutas)
           ==================================================================== */}
        <Route path="*" element={<NotFound />} />

      </Routes>
    </ErrorBoundary>
  );
}