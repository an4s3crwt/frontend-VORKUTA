import React from 'react';
import 'font-awesome/css/font-awesome.min.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import PrivateRoute from './components/PrivateRoute';
import PublicRoute from './components/PublicRoute';

// Páginas
import Layout from './pages/Layout';
import Home from './pages/Home';
import Airport from './pages/Airport';
import FlightList from './pages/Flight/FlightList';
import FlightInfo from './pages/Flight/FlightInfo';
import NotFound from './pages/NotFound';
import NearbyFlightsScanner from './pages/NearbyFlightsScanner';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Logout from './pages/Logout';
import './App.css';


export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route
                    path="/login"
                    element={
                        <PublicRoute>
                            <Login />
                        </PublicRoute>
                    }
                />
                <Route
                    path="/register"
                    element={
                        <PublicRoute>
                            <Register />
                        </PublicRoute>
                    }
                />

                {/* Ruta principal */}
                <Route path="/" element={<Layout />}>
                    <Route index element={<PrivateRoute element={<Home />} />} />
                    <Route path="airport/:icao" element={<PrivateRoute element={<Airport />} />} />
                    <Route path="flights" element={<PrivateRoute element={<FlightList />} />} />
                    <Route path="flight-info/:icao" element={<PrivateRoute element={<FlightInfo />} />} />
                    <Route path="map" element={<PrivateRoute element={<FlightList />} />} />
                    <Route path="scanner" element={<PrivateRoute element={<NearbyFlightsScanner />} />} />

                        {/* Rutas para perfil y logout */}
                        <Route path="profile" element={<PrivateRoute element={<Profile />} />} />
                    <Route path="logout" element={<PrivateRoute element={<Logout />} />} />
                </Route>


                {/* Ruta para páginas no encontradas */}
                <Route path="*" element={<NotFound />} />
            </Routes>
        </BrowserRouter>
    );
}
