import React, { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet"; // Asegúrate de importar Leaflet
import "leaflet/dist/leaflet.css";

// Función para obtener el icono basado en la dirección (heading)
const getPlaneIcon = (heading) => {
    const direction = Math.floor(heading / 45) * 45; // Redondear a la dirección más cercana
    return new L.Icon({
        iconUrl: `/directions/d${direction}.png`, // Asegúrate de que tengas estos archivos en la carpeta "directions"
        iconSize: [24, 24], // Tamaño del icono
        iconAnchor: [12, 12], // El centro del icono
        popupAnchor: [0, -10], // Donde se ancla el popup
    });
};

const MapComponent = ({ center, flights }) => {
    useEffect(() => {
        // Aquí puedes agregar cualquier lógica adicional si es necesario
    }, [flights]);

    return (
        <div className="map-container w-full h-[400px] mb-4 rounded shadow">
            <MapContainer center={center} zoom={10} scrollWheelZoom={true} style={{ height: "100%", width: "100%" }}>
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />

                {flights.map((flight, index) => {
                    const { latitude, longitude, heading, callsign, icao24 } = flight;
                    return (
                        <Marker
                            key={index}
                            position={[latitude, longitude]}
                            icon={getPlaneIcon(heading)} // Asigna el icono basado en el heading
                        >
                            <Popup>
                                <div>
                                    <strong>{callsign}</strong><br />
                                    ICAO24: {icao24}<br />
                                    Altitude: {flight.altitude} m<br />
                                    Speed: {flight.velocity} km/h<br />
                                    Heading: {heading}°<br />
                                </div>
                            </Popup>
                        </Marker>
                    );
                })}
            </MapContainer>
        </div>
    );
};

export default MapComponent;
