
import React from 'react';
import { Route, Routes } from "react-router-dom";



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
import AirplaneData from './components/AirplaneData';
import AirlinesData from './components/AirlinesData';
import AirportsData from './components/AirportsData';
import AccessDenied from './pages/AccessDenied';
import ErrorBoundary from './components/ErrorBoundary';
import AirportFlights from './components/DataWMap/AirportsFlights';
import Data from './pages/Data';



export default function App() {
  return (
    <ErrorBoundary>
      <Routes>
        {/* Public routes */}
        <Route path="/access-denied" element={<AccessDenied />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/create-admin" element={<CreateAdmin />} />
        
          {/* 404 */}
          <Route path="*" element={<NotFound />} />

        {/* Main protected route */}
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }
        >
          <Route index element={<Home />} />

          {/* Data routes */}
          <Route path="data" element={<Data />}>
            <Route path="flights" element={<AirplaneData />} />
            <Route path="airlines" element={<AirlinesData />} />
            <Route path="airports" element={<AirportsData />}
            
            />
          

          </Route>

<Route 
            path="airport/:icao" 
            element={
              <ErrorBoundary>
                <FlightInfo /> {/* <--- Debe ser FlightInfo, no AirportFlights */}
              </ErrorBoundary>
            } 
          />
          {/* Flight routes */}
          <Route
            path="flights"
            element={
              <ErrorBoundary>
                <FlightList />
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
          <Route
            path="map"
            element={
              <ErrorBoundary>
                <FlightList />
              </ErrorBoundary>
            }
          />

          {/* Nearby flights */}
         <Route path="scanner/:radius?" element={
  <ErrorBoundary>
    <NearbyFlightsScanner />
  </ErrorBoundary>
} />
          {/* User */}
          <Route
            path="profile"
            element={
              <ErrorBoundary>
                <Profile />
              </ErrorBoundary>
            }
          />
          <Route path="logout" element={<Logout />} />

          {/* Admin */}
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

        
        </Route>
      </Routes>
    </ErrorBoundary>
  );
}
