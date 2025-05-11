import React, { useEffect, useState } from "react";
import api from "../api";

const Data = () => {
    const [airports, setAirports] = useState([]);
    const [airlines, setAirlines] = useState([]);
    const [selectedLetter, setSelectedLetter] = useState("A");
    const [airportPage, setAirportPage] = useState(1);
    const [airlinePage, setAirlinePage] = useState(1);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const [airportsRes, airlinesRes] = await Promise.all([
                    api.get(`/airports?letter=${selectedLetter}&page=${airportPage}&limit=50`),
                    api.get(`/airlines?letter=${selectedLetter}&page=${airlinePage}&limit=50`)
                ]);
                setAirports(airportsRes.data.data);
                setAirlines(airlinesRes.data.data);
            } catch (error) {
                console.error("Error loading data:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [selectedLetter, airportPage, airlinePage]);

    // Generate alphabet array
    const alphabet = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i));

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <h1 className="text-3xl font-light text-gray-900 mb-8">Database Overview</h1>

            {/* Letter Filter */}
            <div className="mb-8">
                <label htmlFor="letterFilter" className="text-sm font-medium text-gray-700 mb-1 block">
                    Filter by letter
                </label>
                <div className="inline-block relative">
                    <select
                        id="letterFilter"
                        value={selectedLetter}
                        onChange={(e) => setSelectedLetter(e.target.value)}
                        className="block appearance-none w-20 bg-white border border-gray-300 text-gray-700 py-2 px-4 pr-8 rounded leading-tight focus:outline-none focus:border-gray-500"
                    >
                        {alphabet.map(letter => (
                            <option key={letter} value={letter}>{letter}</option>
                        ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                            <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                        </svg>
                    </div>
                </div>
            </div>

            {/* Airports Section */}
            <section className="mb-12">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-medium text-gray-900">Airports</h2>
                    <div className="flex items-center space-x-2">
                        <button 
                            onClick={() => setAirportPage(Math.max(1, airportPage - 1))} 
                            disabled={airportPage === 1}
                            className={`px-3 py-1 rounded ${airportPage === 1 ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100'}`}
                        >
                            ←
                        </button>
                        <span className="text-sm text-gray-600">Page {airportPage}</span>
                        <button 
                            onClick={() => setAirportPage(airportPage + 1)} 
                            className="px-3 py-1 rounded text-gray-700 hover:bg-gray-100"
                        >
                            →
                        </button>
                    </div>
                </div>
                
                <div className="overflow-hidden rounded-lg border border-gray-200">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">City</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Country</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IATA</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ICAO</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {isLoading ? (
                                <tr>
                                    <td colSpan="4" className="px-6 py-4 text-center text-gray-500">Loading...</td>
                                </tr>
                            ) : airports.length > 0 ? (
                                airports.map((airport, index) => (
                                    <tr key={index} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{airport.city}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{airport.country}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">{airport.iata_code}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">{airport.icao_code}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="4" className="px-6 py-4 text-center text-gray-500">No airports found</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>

            {/* Airlines Section */}
            <section>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-medium text-gray-900">Airlines</h2>
                    <div className="flex items-center space-x-2">
                        <button 
                            onClick={() => setAirlinePage(Math.max(1, airlinePage - 1))} 
                            disabled={airlinePage === 1}
                            className={`px-3 py-1 rounded ${airlinePage === 1 ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100'}`}
                        >
                            ←
                        </button>
                        <span className="text-sm text-gray-600">Page {airlinePage}</span>
                        <button 
                            onClick={() => setAirlinePage(airlinePage + 1)} 
                            className="px-3 py-1 rounded text-gray-700 hover:bg-gray-100"
                        >
                            →
                        </button>
                    </div>
                </div>
                
                <div className="overflow-hidden rounded-lg border border-gray-200">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Country</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Callsign</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IATA</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ICAO</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {isLoading ? (
                                <tr>
                                    <td colSpan="4" className="px-6 py-4 text-center text-gray-500">Loading...</td>
                                </tr>
                            ) : airlines.length > 0 ? (
                                airlines.map((airline, index) => (
                                    <tr key={index} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{airline.country || "-"}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{airline.callsign || "-"}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">{airline.iata_code || "-"}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">{airline.icao_code || "-"}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="4" className="px-6 py-4 text-center text-gray-500">No airlines found</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
};

export default Data;