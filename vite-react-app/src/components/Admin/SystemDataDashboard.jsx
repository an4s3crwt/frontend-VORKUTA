import React, { useEffect, useState } from "react";
import api from "../../api";
import { useAuth } from "../../context/AuthContext";
import Chart from 'chart.js/auto';
import { useNavigate } from 'react-router-dom';

function SystemMetricsDashboard() {
    const { isAuthenticated } = useAuth();
    const [labels, setLabels] = useState([]);
    const [cpuData, setCpuData] = useState([]);
    const [memoryData, setMemoryData] = useState([]);
    const [diskData, setDiskData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const cpuChartRef = React.useRef(null);
    const memoryChartRef = React.useRef(null);
    const diskChartRef = React.useRef(null);

    const cpuChartInstance = React.useRef(null);
    const memoryChartInstance = React.useRef(null);
    const diskChartInstance = React.useRef(null);

    useEffect(() => {

        fetchSystemMetrics();

    }, [isAuthenticated]);

    const fetchSystemMetrics = async () => {
        try {
            const [cpuRes, memRes, diskRes] = await Promise.all([
                api.get("/admin/system/cpu-usage"),
                api.get("/admin/system/memory-usage"),
                api.get("/admin/system/disk-usage"),
            ]);

            const [cpuJson, memJson, diskJson] = await Promise.all([
                cpuRes.data,
                memRes.data,
                diskRes.data,
            ]);

            const time = new Date().toLocaleTimeString();

            setLabels((prev) => [...prev.slice(-19), time]);
            setCpuData((prev) => [...prev.slice(-19), cpuJson.cpu_usage]);
            setMemoryData((prev) => [...prev.slice(-19), memJson.memory_usage]);
            setDiskData((prev) => [...prev.slice(-19), parseFloat(diskJson.disk_usage)]);

            setLoading(false);
        } catch (err) {
            setError("Failed to load system metrics");
            setLoading(false);
            console.error("Error fetching system metrics:", err);
        }
    };

    useEffect(() => {
        const createChart = (ctx, label, data, color) => {
            return new Chart(ctx, {
                type: 'line',
                data: {
                    labels,
                    datasets: [{
                        label,
                        data,
                        borderColor: color,
                        tension: 0.2,
                        fill: true,
                        backgroundColor: `${color}33`,
                    }]
                },
                options: {
                    responsive: true,
                    scales: {
                        y: {
                            beginAtZero: true,
                            max: 100,
                        },
                    },
                },
            });
        };

        if (cpuChartRef.current && !cpuChartInstance.current) {
            cpuChartInstance.current = createChart(cpuChartRef.current, 'CPU Usage (%)', cpuData, '#ff6384');
        }
        if (memoryChartRef.current && !memoryChartInstance.current) {
            memoryChartInstance.current = createChart(memoryChartRef.current, 'Memory Usage (%)', memoryData, '#36a2eb');
        }
        if (diskChartRef.current && !diskChartInstance.current) {
            diskChartInstance.current = createChart(diskChartRef.current, 'Disk Usage (%)', diskData, '#4bc0c0');
        }

        if (cpuChartInstance.current) {
            cpuChartInstance.current.data.labels = labels;
            cpuChartInstance.current.data.datasets[0].data = cpuData;
            cpuChartInstance.current.update();
        }

        if (memoryChartInstance.current) {
            memoryChartInstance.current.data.labels = labels;
            memoryChartInstance.current.data.datasets[0].data = memoryData;
            memoryChartInstance.current.update();
        }

        if (diskChartInstance.current) {
            diskChartInstance.current.data.labels = labels;
            diskChartInstance.current.data.datasets[0].data = diskData;
            diskChartInstance.current.update();
        }
    }, [labels, cpuData, memoryData, diskData]);

    if (!isAuthenticated) {
        return <div className="auth-message">Please log in to view system metrics.</div>;
    }

    if (loading) {
        return <div className="loading-message">Loading system metrics...</div>;
    }

    if (error) {
        return <div className="error-message">{error}</div>;
    }

    return (
        <div className="system-metrics-dashboard">
            <h3>System Metrics Dashboard</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white shadow-md rounded-2xl p-4">
                    <h4 className="text-xl font-semibold mb-2">CPU Usage</h4>
                    <canvas ref={cpuChartRef}></canvas>
                </div>
                <div className="bg-white shadow-md rounded-2xl p-4">
                    <h4 className="text-xl font-semibold mb-2">Memory Usage</h4>
                    <canvas ref={memoryChartRef}></canvas>
                </div>
                <div className="bg-white shadow-md rounded-2xl p-4">
                    <h4 className="text-xl font-semibold mb-2">Disk Usage</h4>
                    <canvas ref={diskChartRef}></canvas>
                </div>
            </div>
        </div>
    );
}

export default SystemMetricsDashboard;
