import React, { useEffect, useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import api from "../api";
import DataFilter from "../components/DataFilter";
import DataTable from "../components/DataTable";
import FlagIcon from "../components/FlagIcon";
import Pagination from "../components/Pagination";
import { useAuth } from '../context/AuthContext';

const Airlines = () => {
    const { isAuthenticated, user } = useAuth();
    
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    const [airlines, setAirlines] = useState([]);
    const [selectedLetter, setSelectedLetter] = useState("A");
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchAirlines = async () => {
            setIsLoading(true);
            try {
                const response = await api.get(
                    `/airlines?letter=${selectedLetter}&page=${currentPage}&limit=50`
                );
                setAirlines(response.data.data);
                setTotalPages(response.data.totalPages);
            } catch (error) {
                console.error("Error loading airlines:", error);
                navigate("/access-denied");
            } finally {
                setIsLoading(false);
            }
        };

        fetchAirlines();
    }, [selectedLetter, currentPage, navigate]);

    const columns = [
        {
            header: "Airline",
            accessor: "name",
            render: (row) => (
                <div className="flex items-center">
                    {row.logo && (
                        <img 
                            src={row.logo} 
                            alt={`${row.name} logo`} 
                            className="w-8 h-8 mr-3 object-contain"
                            onError={(e) => {
                                e.target.style.display = 'none';
                            }}
                        />
                    )}
                    <span className="font-medium">{row.name}</span>
                </div>
            ),
        },
        {
            header: "Country",
            accessor: "country",
            render: (row) => (
                <div className="flex items-center">
                    <FlagIcon country={row.country} className="mr-2" />
                    <span>{row.country}</span>
                </div>
            ),
        },
        {
            header: "Callsign",
            accessor: "callsign",
            className: "text-gray-600",
        },
        {
            header: "IATA",
            accessor: "iata_code",
            render: (row) => (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {row.iata_code || "-"}
                </span>
            ),
        },
        {
            header: "ICAO",
            accessor: "icao_code",
            render: (row) => (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    {row.icao_code || "-"}
                </span>
            ),
        },
    ];

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold text-gray-800">Airlines Database</h2>
                <DataFilter 
                    selectedLetter={selectedLetter}
                    onSelectLetter={setSelectedLetter}
                />
            </div>

            <DataTable 
                columns={columns}
                data={airlines}
                isLoading={isLoading}
                emptyMessage="No airlines found"
            />

            <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                className="mt-6"
            />
        </div>
    );
};

export default Airlines;
