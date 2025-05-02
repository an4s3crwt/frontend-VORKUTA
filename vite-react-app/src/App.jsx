import React from 'react';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import PrivateRoute from './components/PrivateRoute';

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

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path='/login' element={<Login />} />
                <Route path='/register' element={<Register />} />

                {/* Ruta principal */}
                <Route path="/" element={<Layout />}>
                    <Route index element={<PrivateRoute element={<Home />} />} />
                    <Route path="airport/:icao" element={<PrivateRoute element={<Airport />} />} />
                    <Route path="flights" element={<PrivateRoute element={<FlightList />} />} />
                    <Route path="flight-info/:icao" element={<PrivateRoute element={<FlightInfo />} />} />
                    <Route path="map" element={<PrivateRoute element={<FlightList />} />} />
                    <Route path="scanner" element={<PrivateRoute element={<NearbyFlightsScanner />} />} />
                </Route>


                {/* Ruta para páginas no encontradas */}
                <Route path="*" element={<NotFound />} />
            </Routes>
        </BrowserRouter>
    );
}
