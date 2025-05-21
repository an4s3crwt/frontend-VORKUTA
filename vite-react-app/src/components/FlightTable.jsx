import React from "react";

const FlightTable = ({ flights }) => {
    if (!flights.length) {
        return <p>No nearby flights found.</p>;
    }

    return (
        <div className="overflow-x-auto mt-2">
            <table className="min-w-full table-auto border-collapse border border-gray-300">
                <thead className="bg-gray-100">
                    <tr>
                        <th className="border px-4 py-2">Callsign</th>
                        <th className="border px-4 py-2">ICAO24</th>
                        <th className="border px-4 py-2">Latitude</th>
                        <th className="border px-4 py-2">Longitude</th>
                        <th className="border px-4 py-2">Velocity (m/s)</th>
                        <th className="border px-4 py-2">Heading (°)</th>
                        <th className="border px-4 py-2">Altitude (m)</th>
                    </tr>
                </thead>
                <tbody>
                    {flights.map((flight, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                            <td className="border px-4 py-2">{flight[1] || "-"}</td>
                            <td className="border px-4 py-2">{flight[0]}</td>
                            <td className="border px-4 py-2">{flight[6]?.toFixed(4)}</td>
                            <td className="border px-4 py-2">{flight[5]?.toFixed(4)}</td>
                            <td className="border px-4 py-2">{flight[9] ? flight[9].toFixed(1) : "-"}</td>
                            <td className="border px-4 py-2">{flight[10] ? flight[10].toFixed(0) : "-"}</td>
                            <td className="border px-4 py-2">{flight[7] ? flight[7].toFixed(0) : "-"}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default FlightTable;
