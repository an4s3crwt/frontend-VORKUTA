import React, { useState, useEffect } from 'react';
import { 
    Users, Database, CloudLightning, Brain, AlertOctagon, 
    Activity, FileText, Terminal, Clock, AlertTriangle, Check,
    Shield, Search, MapPin, Globe, Trash2, Zap, RefreshCw,
    Settings, Play, TerminalSquare, X
} from 'lucide-react';
import api from '../../api';

export default function AdminDashboard() {
    // --- ESTADOS ---
    const [metrics, setMetrics] = useState({ totalUsers: 0, flightPositions: 0, failedJobs: 0, logsCount: 0 });
    const [externalServices, setExternalServices] = useState({ 
        opensky: { status: 'idle', latency: 0, message: 'Click test to ping' }, 
        aiModule: { status: 'ready', modelVersion: 'v2.1' } 
    });
    const [aiLogs, setAiLogs] = useState([]);
    const [recentUsers, setRecentUsers] = useState([]);
    const [activeTab, setActiveTab] = useState('infrastructure'); 
    const [loading, setLoading] = useState(true);
    const [pinging, setPinging] = useState(false);

    // ESTADOS PARA HERRAMIENTAS (System Tools)
    const [consoleOutput, setConsoleOutput] = useState("> System Ready. Waiting for commands...");
    const [executing, setExecuting] = useState(false);

    // ESTADOS PARA MODAL DE ERRORES
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [failedJobsList, setFailedJobsList] = useState([]);
    const [loadingErrors, setLoadingErrors] = useState(false);

    useEffect(() => {
        fetchSystemData();
    }, []);

    const fetchSystemData = async () => {
        setLoading(true);
        try {
            const dbStats = await api.get('/admin/db-stats'); 
            setMetrics(dbStats.data); 

            const usersRes = await api.get('/admin/recent-users');
            setRecentUsers(usersRes.data);

            const aiRes = await api.get('/admin/ai-logs');
            setAiLogs(aiRes.data);
        } catch (error) {
            console.error("Dashboard Error:", error);
        } finally {
            setLoading(false);
        }
    };

    // --- ACCIÓN: PING OPENSKY ---
    const handlePingOpenSky = async () => {
        setPinging(true);
        try {
            const res = await api.get('/admin/opensky-ping');
            setExternalServices(prev => ({
                ...prev,
                opensky: { 
                    status: res.data.status, 
                    latency: res.data.latency,
                    message: res.data.message 
                }
            }));
        } catch (error) {
            setExternalServices(prev => ({
                ...prev,
                opensky: { status: 'offline', latency: 0, message: 'Connection Timeout / Error' }
            }));
        } finally {
            setPinging(false);
        }
    };

    // --- ACCIÓN: ELIMINAR USUARIO ---
    const handleDeleteUser = async (userId) => {
        if (!window.confirm("¿Estás seguro de que quieres eliminar a este usuario? Esta acción es irreversible.")) return;
        try {
            setRecentUsers(recentUsers.filter(u => u.id !== userId));
            await api.delete(`/admin/users/${userId}`);
            setMetrics(prev => ({...prev, totalUsers: prev.totalUsers - 1}));
        } catch (error) {
            alert("Error al eliminar usuario.");
            fetchSystemData();
        }
    };

    // --- ACCIÓN: EJECUTAR COMANDO ARTISAN ---
    const runSystemCommand = async (action, label) => {
        setExecuting(true);
        setConsoleOutput(prev => prev + `\n> Executing: ${label}...\n[Wait] Processing...`);
        try {
            const res = await api.post(`/admin/system/${action}`);
            setConsoleOutput(prev => prev + `\n[Success] ${res.data.output}\n> Done.`);
        } catch (error) {
            setConsoleOutput(prev => prev + `\n[Error] Failed to execute command.\n> ${error.message}`);
        } finally {
            setExecuting(false);
        }
    };

    // --- ACCIÓN: ABRIR MODAL ERRORES ---
    const handleOpenErrors = async () => {
        if (metrics.failedJobs === 0) return;
        setShowErrorModal(true);
        setLoadingErrors(true);
        try {
            const res = await api.get('/admin/failed-jobs');
            setFailedJobsList(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoadingErrors(false);
        }
    };

    if (loading) return <div className="p-20 flex justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 md:p-8 font-sans relative">
            
            {/* --- MODAL DE ERRORES --- */}
            {showErrorModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-white dark:bg-gray-800 w-full max-w-2xl rounded-2xl shadow-2xl border border-red-100 dark:border-red-900/30 overflow-hidden flex flex-col max-h-[80vh]">
                        <div className="p-4 bg-red-50 dark:bg-red-900/20 border-b border-red-100 dark:border-red-900/30 flex justify-between items-center">
                            <h3 className="text-red-700 dark:text-red-300 font-bold flex items-center gap-2"><AlertOctagon size={20} /> Failed Jobs Inspector</h3>
                            <button onClick={() => setShowErrorModal(false)} className="p-1 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-full transition text-red-600"><X size={20} /></button>
                        </div>
                        <div className="p-0 overflow-y-auto flex-1">
                            {loadingErrors ? <div className="p-10 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div></div> : (
                                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {failedJobsList.map((job) => (
                                        <div key={job.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition">
                                            <div className="flex justify-between items-start mb-1">
                                                <span className="font-mono text-xs font-bold text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">{job.job_name}</span>
                                                <span className="text-xs text-gray-400">{job.failed_at}</span>
                                            </div>
                                            <pre className="mt-2 text-xs text-red-600 dark:text-red-400 font-mono bg-red-50 dark:bg-red-900/10 p-3 rounded-lg overflow-x-auto whitespace-pre-wrap">{job.error_preview}</pre>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* HEADER */}
            <div className="mb-8 flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3"><Activity className="text-indigo-600" /> System Control Center</h1>
                    <p className="text-gray-500 mt-1">Real-time infrastructure & security monitoring.</p>
                </div>
                <button onClick={fetchSystemData} className="p-2 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"><RefreshCw size={20} className="text-gray-500" /></button>
            </div>

            {/* KPI CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <StatusCard title="Total Users" value={metrics.totalUsers} icon={<Users className="text-blue-500" />} sub="Table: users" />
                <StatusCard title="Flight Data" value={metrics.flightPositions.toLocaleString()} icon={<Database className="text-purple-500" />} sub="Table: flight_positions" color="bg-purple-50 dark:bg-purple-900/20" />
                
                {/* Failed Jobs Clicable */}
                <div onClick={handleOpenErrors} className={`cursor-pointer transition-transform hover:scale-[1.02] active:scale-95 ${metrics.failedJobs > 0 ? "bg-red-50 dark:bg-red-900/20 border-red-200 ring-2 ring-red-100 dark:ring-red-900/30" : "bg-green-50"} p-5 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700`}>
                    <div className="flex justify-between items-start mb-2">
                        <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg"><AlertOctagon className={metrics.failedJobs > 0 ? "text-red-500" : "text-green-500"} /></div>
                        {metrics.failedJobs > 0 && <span className="text-[10px] font-bold bg-red-100 text-red-600 px-2 py-1 rounded animate-pulse">VIEW LOGS</span>}
                    </div>
                    <div className="text-2xl font-bold dark:text-white">{metrics.failedJobs}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Failed Jobs</div>
                    <div className="text-[10px] font-mono text-gray-400 mt-2 uppercase">Laravel Queue</div>
                </div>

                <StatusCard title="System Logs" value={metrics.logsCount} icon={<FileText className="text-gray-500" />} sub="Telescope Entries" />
            </div>

            {/* TABS */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden min-h-[500px]">
                <div className="flex border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50">
                    <TabButton active={activeTab === 'infrastructure'} onClick={() => setActiveTab('infrastructure')} icon={<CloudLightning size={18}/>} label="Infrastructure" />
                    <TabButton active={activeTab === 'users'} onClick={() => setActiveTab('users')} icon={<Shield size={18}/>} label="Security" />
                    <TabButton active={activeTab === 'system'} onClick={() => setActiveTab('system')} icon={<Settings size={18}/>} label="System Tools" />
                </div>

                <div className="p-6">
                    
                    {/* TAB 1: INFRAESTRUCTURA */}
                    {activeTab === 'infrastructure' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* OpenSky */}
                                <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-5 relative bg-white dark:bg-gray-800 shadow-sm">
                                    <div className="flex justify-between items-start mb-4">
                                        <div><h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2"><Globe size={18} className="text-blue-500"/> OpenSky Network</h3><p className="text-xs text-gray-500">Public Flight API Status</p></div>
                                        <div className={`px-2 py-1 rounded text-xs font-bold ${externalServices.opensky.status === 'online' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{externalServices.opensky.status.toUpperCase()}</div>
                                    </div>
                                    <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-100 dark:border-gray-700 font-mono text-xs text-gray-600 dark:text-gray-300">&gt; {externalServices.opensky.message}</div>
                                    <div className="flex items-center justify-between">
                                        <div className="text-xs text-gray-400">Latency: <span className="font-bold text-gray-700 dark:text-white">{externalServices.opensky.latency}ms</span></div>
                                        <button onClick={handlePingOpenSky} disabled={pinging} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-xs font-bold transition disabled:opacity-50">{pinging ? '...' : <Zap size={14} />}{pinging ? 'Pinging...' : 'Test Latency'}</button>
                                    </div>
                                </div>
                                {/* AI */}
                                <div className="border border-indigo-100 dark:border-indigo-900 rounded-xl p-5 relative bg-indigo-50/50 dark:bg-indigo-900/10">
                                    <div className="absolute top-0 right-0 p-4 opacity-5"><Brain size={80} /></div>
                                    <div className="flex justify-between items-start mb-4">
                                        <div><h3 className="font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-2"><Brain size={18}/> Prediction Engine</h3><p className="text-xs text-indigo-500">Hybrid Model (Rules + ML)</p></div>
                                        <div className="px-2 py-1 rounded text-xs font-bold bg-indigo-100 text-indigo-700">ACTIVE</div>
                                    </div>
                                    <div className="font-mono text-xs text-indigo-800 dark:text-indigo-300 mt-8">AI Status: Ready (Model v2.1 loaded)</div>
                                </div>
                            </div>
                            {/* AI Logs Table */}
                            <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                                <div className="bg-gray-50 dark:bg-gray-700/50 p-3 border-b border-gray-200 flex justify-between"><h4 className="font-bold text-sm text-gray-700 dark:text-gray-200 flex items-center gap-2"><Terminal size={16}/> Inference Logs</h4></div>
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-white dark:bg-gray-800 text-xs text-gray-500 border-b border-gray-100 dark:border-gray-700"><tr><th className="p-3">Time</th><th className="p-3">Flight</th><th className="p-3">Prediction</th><th className="p-3">Output</th></tr></thead>
                                    <tbody className="text-xs font-mono">{aiLogs.map((log) => (<tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 border-b dark:border-gray-700"><td className="p-3 text-gray-400">{log.time}</td><td className="p-3 font-bold">{log.flight}</td><td className="p-3"><StatusBadge status={log.prediction} minutes={log.minutes} /></td><td className="p-3 text-gray-500">{log.reason}</td></tr>))}</tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* TAB 2: USUARIOS */}
                    {activeTab === 'users' && (
                        <div className="animate-in fade-in">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-gray-50 dark:bg-gray-700/50 text-xs font-bold text-gray-500 uppercase border-b border-gray-100 dark:border-gray-700"><tr><th className="p-4 pl-6">User Identity</th><th className="p-4">Role</th><th className="p-4">IP Address</th><th className="p-4 text-right pr-6">Actions</th></tr></thead>
                                <tbody className="text-sm divide-y divide-gray-100 dark:divide-gray-700">
                                    {recentUsers.map((user) => (
                                        <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                                            <td className="p-4 pl-6"><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">{user.name.charAt(0)}</div><div><div className="font-bold text-gray-900 dark:text-white">{user.name}</div><div className="text-xs text-gray-500">{user.email}</div></div></div></td>
                                            <td className="p-4"><span className="text-[10px] font-bold px-2 py-1 rounded bg-gray-100 text-gray-600 uppercase border border-gray-200">{user.role}</span></td>
                                            <td className="p-4">{user.ip ? <div className="flex items-center gap-2 font-mono text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded w-fit border border-gray-200"><MapPin size={12} className="text-indigo-500" /> {user.ip}</div> : <span className="text-[10px] text-gray-400 italic">No Log Data</span>}</td>
                                            <td className="p-4 text-right pr-6"><button onClick={() => handleDeleteUser(user.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"><Trash2 size={16} /></button></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* TAB 3: SYSTEM TOOLS */}
                    {activeTab === 'system' && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in">
                            <div className="md:col-span-1 space-y-4">
                                <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700">
                                    <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2"><Settings size={18} className="text-gray-500"/> Maintenance Actions</h3>
                                    <div className="space-y-3">
                                        <SystemButton onClick={() => runSystemCommand('clear_cache', 'php artisan cache:clear')} label="Clear App Cache" desc="Removes temporary data" color="blue" disabled={executing} />
                                        <SystemButton onClick={() => runSystemCommand('clear_config', 'php artisan config:clear')} label="Flush Config" desc="Reloads .env variables" color="purple" disabled={executing} />
                                        <SystemButton onClick={() => runSystemCommand('optimize', 'php artisan optimize:clear')} label="Optimize All" desc="Re-compiles cache" color="green" disabled={executing} />
                                    </div>
                                </div>
                            </div>
                            <div className="md:col-span-2">
                                <div className="bg-gray-900 rounded-xl border border-gray-700 overflow-hidden h-full flex flex-col shadow-inner">
                                    <div className="bg-gray-800 p-3 border-b border-gray-700 flex justify-between items-center"><div className="flex gap-2"><div className="w-3 h-3 rounded-full bg-red-500"></div><div className="w-3 h-3 rounded-full bg-yellow-500"></div><div className="w-3 h-3 rounded-full bg-green-500"></div></div><span className="text-xs font-mono text-gray-400 flex items-center gap-2"><TerminalSquare size={14}/> server-console output</span></div>
                                    <div className="p-4 font-mono text-xs text-green-400 h-[300px] overflow-y-auto whitespace-pre-wrap">{consoleOutput}{executing && <span className="animate-pulse">_</span>}</div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// COMPONENTES AUXILIARES
function StatusBadge({ status, minutes }) {
    if (status === 'delayed') return <span className="text-red-600 bg-red-50 px-2 py-0.5 rounded text-[10px] font-bold border border-red-100 flex w-fit items-center gap-1"><AlertTriangle size={10}/> DELAYED (+{minutes}m)</span>;
    if (status === 'potential_delay') return <span className="text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded text-[10px] font-bold border border-yellow-100 flex w-fit items-center gap-1"><Clock size={10}/> FROZEN</span>;
    return <span className="text-green-600 bg-green-50 px-2 py-0.5 rounded text-[10px] font-bold border border-green-100 flex w-fit items-center gap-1"><Check size={10}/> ON TIME</span>;
}

function StatusCard({ title, value, icon, sub, color = "bg-white dark:bg-gray-800", alert = false }) {
    return (
        <div className={`${color} p-5 rounded-2xl shadow-sm border ${alert ? 'border-red-400 animate-pulse' : 'border-gray-200 dark:border-gray-700'}`}>
            <div className="flex justify-between items-start mb-2"><div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">{icon}</div>{alert && <span className="text-[10px] font-bold bg-red-100 text-red-600 px-2 py-1 rounded">ATTENTION</span>}</div>
            <div className="text-2xl font-bold dark:text-white">{value}</div><div className="text-sm text-gray-500 dark:text-gray-400">{title}</div><div className="text-[10px] font-mono text-gray-400 mt-2 uppercase">{sub}</div>
        </div>
    );
}

function TabButton({ active, onClick, icon, label }) {
    return (
        <button onClick={onClick} className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors ${active ? 'border-b-2 border-indigo-600 text-indigo-600 bg-indigo-50/50 dark:bg-indigo-900/20' : 'text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-700'}`}>{icon} {label}</button>
    );
}

function SystemButton({ onClick, label, desc, color, disabled }) {
    const colors = { blue: "hover:bg-blue-50 border-blue-200 text-blue-700", purple: "hover:bg-purple-50 border-purple-200 text-purple-700", green: "hover:bg-green-50 border-green-200 text-green-700" };
    return (
        <button onClick={onClick} disabled={disabled} className={`w-full text-left p-3 rounded-lg border transition-all flex items-center justify-between group ${colors[color]} ${disabled ? 'opacity-50 cursor-not-allowed' : 'bg-white dark:bg-transparent dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700'}`}>
            <div><div className="font-bold text-sm">{label}</div><div className="text-[10px] text-gray-400 group-hover:text-gray-500">{desc}</div></div>
            <Play size={16} className={`opacity-0 group-hover:opacity-100 transition-opacity ${disabled ? '' : 'fill-current'}`} />
        </button>
    );
}