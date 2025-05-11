
import React from 'react';
import { Route, Routes } from "react-router-dom";
import './output.css';


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
import AdminDashboard from './pages/Admin/AdminDashboard';
import { PrivateRoute } from './../src/components/PrivateRoute';
import AdminLogs from './pages/Admin/AdminLogs';
import AccessDenied from './pages/AccessDenied';
import ErrorBoundary from './components/ErrorBoundary';
import Data from './pages/Data';
import Airlines from './pages/Airlines';
import Airports from './pages/Airports';
//import Flights from './pages/Flights';


export default function App() {
    return (
        <ErrorBoundary>
            <Routes>
                {/* Public routes */}
                <Route path='/access-denied' element={<AccessDenied />} />
                <Route path='/login' element={<Login />} />
                <Route path='/register' element={<Register />} />
                <Route path='/create-admin' element={<CreateAdmin />} />

                {/* Main protected route */}
                <Route path="/" element={
                    <PrivateRoute>
                        <Layout />
                    </PrivateRoute>
                }>
                    <Route index element={<Home />} />

                 
                   <Route path="data" element={<Data />}>
               
                        <Route path="airlines" element={<Airlines />} />
                        <Route path="airports" element={<Airports />} />
                        
                    </Route>

                    {/* Flight routes */}
                    <Route path="flights" element={
                        <ErrorBoundary>
                            <FlightList />
                        </ErrorBoundary>
                    } />
                    <Route path="flight-info/:icao" element={
                        <ErrorBoundary>
                            <FlightInfo />
                        </ErrorBoundary>
                    } />

                    {/* Map route */}
                    <Route path="map" element={
                        <ErrorBoundary>
                            <FlightList />
                        </ErrorBoundary>
                    } />

                    {/* Nearby flights scanner */}
                    <Route path='/scanner' element={
                        <ErrorBoundary>
                            <NearbyFlightsScanner />
                        </ErrorBoundary>
                    } />

                    {/* User routes */}
                    <Route path="/profile" element={
                        <ErrorBoundary>
                            <Profile />
                        </ErrorBoundary>
                    } />
                    <Route path="/logout" element={<Logout />} />

                    {/* Admin routes */}
                    <Route path="/admin/dashboard" element={
                        <PrivateRoute adminOnly={true}>
                            <ErrorBoundary>
                                <AdminDashboard />
                            </ErrorBoundary>
                        </PrivateRoute>
                    } />
                    <Route path="/admin/dashboard-logs" element={
                        <PrivateRoute adminOnly={true}>
                            <ErrorBoundary>
                                <AdminLogs />
                            </ErrorBoundary>
                        </PrivateRoute>
                    } />

                    {/* 404 route */}
                    <Route path="*" element={<NotFound />} />
                </Route>
            </Routes>
        </ErrorBoundary>
    );
}