import 'font-awesome/css/font-awesome.min.css';
import React from 'react';
import { Route, Routes } from "react-router-dom";
import './App.css';
import Airport from "./pages/Airport";
import FlightInfo from "./pages/Flight/FlightInfo";
import FlightList from "./pages/Flight/FlightList";
import Home from "./pages/Home";
import Layout from "./pages/Layout";
import NotFound from "./pages/NotFound";
import NearbyFlightsScanner from './pages/NearbyFlightsScanner';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Logout from './pages/Logout';
import CreateAdmin from './pages/Admin/CreateAdmin';
import AdminDashboard from './pages/Admin/AdminDashboard';  // Página para administradores
import { PrivateRoute } from './../src/components/PrivateRoute';

export default function App() {
    return (
        <Routes>
            {/* Rutas públicas */}
            <Route path='/login' element={<Login />} />
            <Route path='/register' element={<Register />} />
            {/* Ruta para crear el primer admin */}
            <Route path='/create-admin' element={<CreateAdmin />} />

            {/* Ruta principal protegida */}
            <Route path="/" element={
                <PrivateRoute> {/* Protege todo el layout para usuarios autenticados */}
                    <Layout />
                </PrivateRoute>
            }>
                <Route index element={<Home />} />

                {/* Rutas de aeropuertos */}
                <Route path="airport/:icao" element={<Airport />} />

                {/* Rutas de vuelos */}
                <Route path="flights" element={<FlightList />} />
                <Route path="flight-info/:icao" element={<FlightInfo />} />

                {/* Ruta del mapa */}
                <Route path="map" element={<FlightList />} />

                {/* Ruta de vuelos cercanos */}
                <Route path='/scanner' element={<NearbyFlightsScanner />} />

                {/* Rutas de usuario (solo usuarios autenticados) */}
                <Route path="/profile" element={<Profile />} />
                <Route path="/logout" element={<Logout />} />

                {/* Rutas para administradores */}
                <Route path="/admin/dashboard" element={
                    <PrivateRoute adminOnly={true}>
                        <AdminDashboard />
                    </PrivateRoute>
                } />


                {/* Ruta para páginas no encontradas */}
                <Route path="*" element={<NotFound />} />
            </Route>
        </Routes>
    );
}
