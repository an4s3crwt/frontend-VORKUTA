import React, { useEffect, useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import api from "../api";
import DataFilter from "../components/DataFilter";
import DataTable from "../components/DataTable";
import FlagIcon from "../components/FlagIcon";
import Pagination from "../components/Pagination";
import { useAuth } from '../context/AuthContext';

const Airports = () => {
     const { isAuthenticated } = useAuth();
    
        if (!isAuthenticated) {
            return <Navigate to="/login" replace />;
        }
    const [airports, setAirports] = useState([]);
    const [selectedLetter, setSelectedLetter] = useState("A");
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchAirports = async () => {
            setIsLoading(true);
            try {
                const response = await api.get(
                    `/airports?letter=${selectedLetter}&page=${currentPage}&limit=50`
                );
                setAirports(response.data.data);
                setTotalPages(response.data.totalPages);
            } catch (error) {
                console.error("Error loading airports:", error);
                navigate("/access-denied");
            } finally {
                setIsLoading(false);
            }
        };

        fetchAirports();
    }, [selectedLetter, currentPage, navigate]);

   const columns = [
    {
        header: "Airport",
        accessor: "country",
        render: (row) => (
            <div className="font-medium">
                {row.country}
                {row.city && (
                    <div className="text-sm text-gray-500">{row.city}</div>
                )}
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
    {
        header: "Location",
        accessor: "coordinates",
        render: (row) => (
            <a
                href={`https://www.google.com/maps?q=${row.latitude},${row.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 text-sm"
            >
                View on Map
            </a>
        ),
    },
];


    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold text-gray-800">Airports Database</h2>
                <DataFilter 
                    selectedLetter={selectedLetter}
                    onSelectLetter={setSelectedLetter}
                />
            </div>

            <DataTable 
                columns={columns}
                data={airports}
                isLoading={isLoading}
                emptyMessage="No airports found"
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

export default Airports;