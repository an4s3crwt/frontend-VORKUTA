import React, { useState, useEffect } from 'react';
import { 
    Users, Database, CloudLightning, AlertOctagon, 
    Activity, FileText, TerminalSquare, Shield, MapPin, Globe, 
    Trash2, Zap, RefreshCw, Settings, Play, X,
    HardDrive, Cpu, Lock, Server
} from 'lucide-react';
import api from '../../api';

export default function AdminDashboard() {
    // --- ESTADOS ---
    const [metrics, setMetrics] = useState({ totalUsers: 0, flightPositions: 0, failedJobs: 0, logsCount: 0 });
    const [recentUsers, setRecentUsers] = useState([]);
    const [perfData, setPerfData] = useState({ recent: [], slowest: [] });
    const [externalServices, setExternalServices] = useState({ 
        opensky: { status: 'idle', latency: 0, message: 'Click test to ping' }
    });
    
    // ESTADOS PARA EL GRÁFICO (Live Graph)
    const [serverStats, setServerStats] = useState({ cpu: 0, ram: 0, disk: 0 });
    const [serverHistory, setServerHistory] = useState(Array(20).fill({ cpu: 0, ram: 0 }));

    // Mock de Auditoría (hasta que tengas tabla real)
    const [auditLogs, setAuditLogs] = useState([]);

    // Estados de UI
    const [activeTab, setActiveTab] = useState('infrastructure'); 
    const [loading, setLoading] = useState(true);
    const [pinging, setPinging] = useState(false);
    const [consoleOutput, setConsoleOutput] = useState("> System Ready.");
    const [executing, setExecuting] = useState(false);
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [failedJobsList, setFailedJobsList] = useState([]);

    // --- EFECTO: CARGA Y MONITORIZACIÓN ---
    useEffect(() => {
        fetchSystemData(false); 

        // Actualizamos cada 3 segundos para que el gráfico se mueva fluido
        const intervalId = setInterval(() => {
            fetchSystemData(true); 
        }, 3000); 

        return () => clearInterval(intervalId);
    }, []);

    const fetchSystemData = async (isBackground = false) => {
        if (!isBackground) setLoading(true);
        
        try {
            // Peticiones en paralelo
            const [dbStats, usersRes, perfRes, serverRes] = await Promise.all([
                api.get('/admin/db-stats'),
                api.get('/admin/recent-users'),
                api.get('/admin/performance-stats'),
                api.get('/admin/server-stats') // Tu endpoint real de CPU/RAM
            ]);

            setMetrics(dbStats.data); 
            setRecentUsers(usersRes.data);
            setPerfData(perfRes.data);
            
            // LÓGICA DEL GRÁFICO:
            const newStat = serverRes.data;
            setServerStats(newStat);
            setServerHistory(prev => {
                const newHistory = [...prev, newStat];
                if (newHistory.length > 20) newHistory.shift(); // Mantenemos solo 20 puntos
                return newHistory;
            });

            // Mock logs (puedes borrar esto cuando tengas logs reales)
            setAuditLogs([
                { id: 1, time: 'Now', action: 'Monitor Update', user: 'System', status: 'info' },
                { id: 2, time: '5m ago', action: 'API Check', user: 'System', status: 'success' },
                { id: 3, time: '1h ago', action: 'Backup', user: 'Cron', status: 'success' },
            ]);

        } catch (error) {
            console.error("Dashboard Error:", error);
        } finally {
            if (!isBackground) setLoading(false);
        }
    };

    // --- ACCIONES ---
    const handlePingOpenSky = async () => {
        setPinging(true);
        try {
            const res = await api.get('/admin/opensky-ping');
            setExternalServices(prev => ({ ...prev, opensky: { status: res.data.status, latency: res.data.latency, message: res.data.message } }));
        } catch (error) {
            setExternalServices(prev => ({ ...prev, opensky: { status: 'offline', latency: 0, message: 'Timeout' } }));
        } finally { setPinging(false); }
    };

    const handleDeleteUser = async (userId) => {
        if (!window.confirm("¿Eliminar usuario?")) return;
        try {
            await api.delete(`/admin/users/${userId}`);
            fetchSystemData(true);
        } catch (e) { alert("Error"); }
    };

    const runSystemCommand = async (action, label) => {
        setExecuting(true);
        setConsoleOutput(prev => prev + `\n> ${label}...`);
        try {
            const res = await api.post(`/admin/system/${action}`);
            setConsoleOutput(prev => prev + `\n[OK] ${res.data.output}`);
        } catch (e) { setConsoleOutput(prev => prev + `\n[ERR] Failed.`); } 
        finally { setExecuting(false); }
    };

    const handleOpenErrors = async () => {
        if (metrics.failedJobs === 0) return;
        setShowErrorModal(true);
        try {
            const res = await api.get('/admin/failed-jobs');
            setFailedJobsList(res.data);
        } catch (e) { console.error(e); }
    };

    if (loading) return <div className="h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 md:p-8 font-sans relative text-gray-800 dark:text-gray-100">
            
            {/* HEADER */}
            <div className="mb-8 flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <Activity className="text-indigo-600" /> System Control Center
                        <span className="ml-2 text-xs bg-green-100 text-green-700 border border-green-200 px-2 py-0.5 rounded-full flex items-center gap-1.5 animate-pulse">
                            <span className="w-2 h-2 rounded-full bg-green-500"></span> LIVE
                        </span>
                    </h1>
                    <p className="text-gray-500 mt-1">Real-time infrastructure & security monitoring.</p>
                </div>
                <button onClick={() => fetchSystemData(false)} className="p-2 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg hover:bg-gray-50 transition"><RefreshCw size={20} className="text-gray-500" /></button>
            </div>

            {/* KPI CARDS (Resumen Superior) */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <StatusCard title="Total Users" value={metrics.totalUsers} icon={<Users className="text-blue-500" />} sub="Table: users" />
                <StatusCard title="Flight Data" value={metrics.flightPositions.toLocaleString()} icon={<Database className="text-purple-500" />} sub="Table: flight_positions" color="bg-purple-50 dark:bg-purple-900/20" />
                <div onClick={handleOpenErrors} className={`cursor-pointer transition-transform hover:scale-[1.02] active:scale-95 ${metrics.failedJobs > 0 ? "bg-red-50 dark:bg-red-900/20 border-red-200 ring-2 ring-red-100 dark:ring-red-900/30" : "bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-900"} p-5 rounded-2xl shadow-sm border`}>
                    <div className="flex justify-between items-start mb-2">
                        <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg"><AlertOctagon className={metrics.failedJobs > 0 ? "text-red-500" : "text-green-500"} /></div>
                        {metrics.failedJobs > 0 && <span className="text-[10px] font-bold bg-red-100 text-red-600 px-2 py-1 rounded animate-pulse">ERRORS</span>}
                    </div>
                    <div className="text-2xl font-bold">{metrics.failedJobs}</div>
                    <div className="text-sm text-gray-500">Failed Jobs</div>
                </div>
                <StatusCard title="Disk Usage" value={`${serverStats.disk}%`} icon={<HardDrive className="text-gray-500" />} sub="Server Storage" />
            </div>

            {/* PESTAÑAS (La estructura que te gustaba) */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden min-h-[500px]">
                <div className="flex border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50">
                    <TabButton active={activeTab === 'infrastructure'} onClick={() => setActiveTab('infrastructure')} icon={<CloudLightning size={18}/>} label="Infrastructure" />
                    <TabButton active={activeTab === 'users'} onClick={() => setActiveTab('users')} icon={<Shield size={18}/>} label="Security" />
                    <TabButton active={activeTab === 'database'} onClick={() => setActiveTab('database')} icon={<Database size={18}/>} label="Performance" />
                    <TabButton active={activeTab === 'system'} onClick={() => setActiveTab('system')} icon={<Settings size={18}/>} label="System Tools" />
                </div>

                <div className="p-6">
                    
                    {/* --- TAB 1: INFRAESTRUCTURA (AQUÍ METEMOS EL GRÁFICO) --- */}
                    {activeTab === 'infrastructure' && (
                        <div className="space-y-6 animate-in fade-in">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                
                                {/* CARD IZQUIERDA: ESTADO OPENSKY */}
                                <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-5 relative bg-white dark:bg-gray-800 shadow-sm flex flex-col justify-between">
                                    <div>
                                        <div className="flex justify-between items-start mb-4">
                                            <div><h3 className="font-bold flex items-center gap-2"><Globe size={18} className="text-blue-500"/> OpenSky Network</h3><p className="text-xs text-gray-500">Public Flight API Status</p></div>
                                            <div className={`px-2 py-1 rounded text-xs font-bold ${externalServices.opensky.status === 'online' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{externalServices.opensky.status.toUpperCase()}</div>
                                        </div>
                                        <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-100 dark:border-gray-700 font-mono text-xs text-gray-600 dark:text-gray-300">&gt; {externalServices.opensky.message}</div>
                                    </div>
                                    <div className="flex items-center justify-between mt-4">
                                        <div className="text-xs text-gray-400">Latency: <span className="font-bold text-gray-700 dark:text-white">{externalServices.opensky.latency}ms</span></div>
                                        <button onClick={handlePingOpenSky} disabled={pinging} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-xs font-bold transition disabled:opacity-50">{pinging ? '...' : <Zap size={14} />}{pinging ? 'Pinging...' : 'Test Latency'}</button>
                                    </div>
                                </div>

                                {/* CARD DERECHA: ¡EL GRÁFICO REAL! (Reemplaza a las barras antiguas) */}
                                <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-5 relative bg-white dark:bg-gray-800 shadow-sm overflow-hidden">
                                    <div className="flex justify-between items-center mb-4 relative z-10">
                                        <div>
                                            <h3 className="font-bold flex items-center gap-2"><Server size={18} className="text-indigo-500"/> Live Server Resources</h3>
                                            <p className="text-xs text-gray-500">CPU & RAM Monitoring</p>
                                        </div>
                                        <div className="flex gap-3 text-[10px] font-mono font-bold">
                                            <span className="text-blue-500 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded">CPU: {serverStats.cpu}%</span>
                                            <span className="text-purple-500 bg-purple-50 dark:bg-purple-900/20 px-2 py-1 rounded">RAM: {serverStats.ram}%</span>
                                        </div>
                                    </div>
                                    
                                    {/* Componente Gráfico */}
                                    <div className="h-40 w-full bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-100 dark:border-gray-700 relative">
                                        <div className="absolute inset-0 grid grid-rows-4 w-full h-full"><div className="border-b border-dashed border-gray-200 dark:border-gray-700/30"></div><div className="border-b border-dashed border-gray-200 dark:border-gray-700/30"></div><div className="border-b border-dashed border-gray-200 dark:border-gray-700/30"></div></div>
                                        <LiveGraph data={serverHistory} />
                                    </div>
                                </div>
                            </div>
                            
                            {/* AUDIT LOGS ABAJO */}
                            <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                                <div className="bg-gray-50 dark:bg-gray-700/50 p-3 border-b border-gray-200 flex justify-between"><h4 className="font-bold text-sm flex items-center gap-2"><Lock size={16}/> Security Audit</h4></div>
                                <table className="w-full text-left text-sm">
                                    <tbody className="text-xs font-mono">
                                        {auditLogs.map((log, i) => (
                                            <tr key={i} className="border-b dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                                                <td className="p-3 text-gray-400 w-24">{log.time}</td>
                                                <td className="p-3 font-bold text-blue-600">{log.action}</td>
                                                <td className="p-3 text-gray-500">{log.user}</td>
                                                <td className="p-3 text-right"><span className={`px-2 py-0.5 rounded text-[10px] uppercase ${log.status === 'success' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>{log.status}</span></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* --- TAB 2: SEGURIDAD (USUARIOS) --- */}
                    {activeTab === 'users' && (
                        <div className="animate-in fade-in">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 dark:bg-gray-700/50 text-xs font-bold text-gray-500 uppercase border-b border-gray-100 dark:border-gray-700"><tr><th className="p-4 pl-6">User</th><th className="p-4">Role</th><th className="p-4">IP</th><th className="p-4 text-right">Action</th></tr></thead>
                                <tbody className="text-sm divide-y divide-gray-100 dark:divide-gray-700">
                                    {recentUsers.map((user) => (
                                        <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                                            <td className="p-4 pl-6 flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">{user.name.charAt(0)}</div>{user.name}</td>
                                            <td className="p-4"><span className="text-[10px] font-bold px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600">{user.role}</span></td>
                                            <td className="p-4 font-mono text-xs text-gray-500">{user.ip || 'N/A'}</td>
                                            <td className="p-4 text-right"><button onClick={() => handleDeleteUser(user.id)} className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded"><Trash2 size={16}/></button></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* --- TAB 3: BASE DE DATOS (TRAFICO) --- */}
                    {activeTab === 'database' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in">
                            <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-5 bg-white dark:bg-gray-800">
                                <h3 className="font-bold mb-4 flex items-center gap-2"><Activity size={18} className="text-blue-500"/> Recent Traffic</h3>
                                <div className="space-y-2">
                                    {perfData.recent.map((req, i) => (
                                        <div key={i} className="flex justify-between items-center text-xs p-2 hover:bg-gray-50 dark:hover:bg-gray-700/30 rounded border border-transparent hover:border-gray-100">
                                            <div className="flex gap-2 items-center"><span className="font-bold text-blue-600">{req.method}</span> <span className="font-mono text-gray-600 dark:text-gray-400">{req.endpoint}</span></div>
                                            <div className="font-bold">{Math.round(req.response_time)}ms</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-5 bg-white dark:bg-gray-800">
                                <h3 className="font-bold mb-4 flex items-center gap-2"><AlertOctagon size={18} className="text-orange-500"/> Slowest Queries</h3>
                                <div className="space-y-2">
                                    {perfData.slowest.map((req, i) => (
                                        <div key={i} className="flex justify-between items-center text-xs p-2 bg-red-50 dark:bg-red-900/10 rounded">
                                            <span className="font-mono text-gray-700 dark:text-gray-300">{req.endpoint}</span>
                                            <span className="font-bold text-red-600">{Math.round(req.avg_time)}ms</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* --- TAB 4: SYSTEM TOOLS --- */}
                    {activeTab === 'system' && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in">
                            <div className="md:col-span-1 space-y-3">
                                <SystemButton onClick={() => runSystemCommand('clear_cache', 'php artisan cache:clear')} label="Clear Cache" desc="Free memory" color="blue" disabled={executing} />
                                <SystemButton onClick={() => runSystemCommand('optimize', 'php artisan optimize')} label="Optimize" desc="Re-compile" color="purple" disabled={executing} />
                            </div>
                            <div className="md:col-span-2 bg-gray-900 rounded-xl border border-gray-700 p-4 font-mono text-xs text-green-400 h-48 overflow-y-auto">
                                {consoleOutput}{executing && <span className="animate-pulse">_</span>}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* MODAL DE ERRORES */}
            {showErrorModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-gray-800 w-full max-w-lg rounded-xl shadow-xl p-6 relative">
                        <button onClick={() => setShowErrorModal(false)} className="absolute top-4 right-4"><X size={20}/></button>
                        <h2 className="font-bold text-lg mb-4 text-red-600">Failed Jobs List</h2>
                        <div className="max-h-60 overflow-y-auto space-y-2">
                            {failedJobsList.map(job => (
                                <div key={job.id} className="p-3 bg-red-50 dark:bg-red-900/10 rounded border border-red-100 text-xs">
                                    <div className="font-bold">{job.job_name}</div>
                                    <div className="font-mono text-gray-500 mt-1">{job.failed_at}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// --- SUBCOMPONENTES ---

function StatusCard({ title, value, icon, sub, color = "bg-white dark:bg-gray-800" }) {
    return (
        <div className={`${color} p-5 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700`}>
            <div className="flex justify-between items-start mb-2"><div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">{icon}</div></div>
            <div className="text-2xl font-bold">{value}</div>
            <div className="text-sm text-gray-500">{title}</div>
            <div className="text-[10px] text-gray-400 mt-1">{sub}</div>
        </div>
    );
}

function TabButton({ active, onClick, icon, label }) {
    return (
        <button onClick={onClick} className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors ${active ? 'border-b-2 border-indigo-600 text-indigo-600 bg-indigo-50/50 dark:bg-indigo-900/20' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>{icon} {label}</button>
    );
}

function SystemButton({ onClick, label, desc, color, disabled }) {
    return (
        <button onClick={onClick} disabled={disabled} className="w-full text-left p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition flex justify-between items-center group">
            <div><div className="font-bold text-sm">{label}</div><div className="text-[10px] text-gray-500">{desc}</div></div>
            <Play size={14} className="opacity-0 group-hover:opacity-100 text-gray-400" />
        </button>
    );
}

// COMPONENTE GRÁFICO SVG PURO (Ligero y Rápido)
function LiveGraph({ data }) {
    const getPoints = (key) => data.map((point, i) => {
        const x = (i / (data.length - 1)) * 100;
        const y = 100 - point[key]; 
        return `${x},${y}`;
    }).join(' ');

    return (
        <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible" preserveAspectRatio="none">
            <polyline fill="none" stroke="#3b82f6" strokeWidth="2" points={getPoints('cpu')} vectorEffect="non-scaling-stroke" className="transition-all duration-300"/>
            <polygon fill="url(#blueGradient)" stroke="none" points={`0,100 ${getPoints('cpu')} 100,100`} opacity="0.2" className="transition-all duration-300"/>
            <polyline fill="none" stroke="#8b5cf6" strokeWidth="2" points={getPoints('ram')} vectorEffect="non-scaling-stroke" className="transition-all duration-300"/>
            <defs>
                <linearGradient id="blueGradient" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                </linearGradient>
            </defs>
        </svg>
    );
}