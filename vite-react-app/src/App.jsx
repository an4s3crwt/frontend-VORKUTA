import 'font-awesome/css/font-awesome.min.css';
import React from 'react';
import { BrowserRouter, Route, Routes } from "react-router-dom";
import './App.css';
import Airport from "./pages/Airport";
import FlightInfo from "./pages/Flight/FlightInfo";
import FlightList from "./pages/Flight/FlightList";
import Home from "./pages/Home";
import Layout from "./pages/Layout";
import NotFound from "./pages/NotFound";
import NearbyFlightsScanner from './pages/NearbyFlightsScanner';

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                {/* Ruta principal */}
                <Route path="/" element={<Layout />}>
                    <Route index element={<Home />} />

                    {/* Rutas de aeropuertos */}
                    <Route path="airport/:icao" element={<Airport />} />

                    {/* Rutas de vuelos */}
                    <Route path="flights" element={<FlightList />} />
                    <Route path="flight-info/:icao" element={<FlightInfo />} />

                    {/* Ruta del mapa */}
                    <Route path="map" element={<FlightList />} />

                    <Route path='/scanner' element={<NearbyFlightsScanner />} />

                    {/* Ruta para páginas no encontradas */}
                    <Route path="*" element={<NotFound />} />
                </Route>
            </Routes>
        </BrowserRouter>
    );
}
