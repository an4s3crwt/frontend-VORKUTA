import React, { useEffect, useState } from 'react';
import api from './../api'; 

export default function Profile() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await api.get('/auth/me');
                setUser(response.data);
            } catch (err) {
                console.error(err);
                setError("Failed to load user information.");
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric'
        });
    };

    const getInitials = (name) => name ? name.substring(0, 2).toUpperCase() : 'U';

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

   const handleLogout = async () => {
        try {
            // 1. Intentamos avisar al backend (opcional pero recomendado)
            await api.post('/auth/logout');
        } catch (error) {
            console.error("Error al cerrar sesión en servidor", error);
        } finally {
            // 2. OBLIGATORIO: Borramos el token del navegador
            // (Asegúrate de que la clave sea la misma que usas al hacer Login)
            localStorage.removeItem('token'); 
            localStorage.removeItem('user'); // Si guardas datos del usuario, bórralos también
            
            // 3. Redirigimos al usuario al Login
            window.location.href = '/login';
        }
    };

    if (loading) return <div className="flex justify-center items-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-800"></div></div>;
    if (error) return <div className="text-center mt-20 text-red-500 font-medium">{error}</div>;

    return (
        <div className="max-w-3xl mx-auto px-4 py-12 animate-fade-in-up">
            
            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-700 relative">
                
                {/* 1. FONDO DE CABECERA (Más elegante, menos chillón) */}
                <div className="h-40 bg-gradient-to-r from-gray-700 to-gray-900 relative">
                    <button 
                        onClick={handleLogout}
                        className="absolute top-6 right-6 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-full text-xs font-bold transition-all backdrop-blur-sm border border-white/10"
                    >
                        Sign Out
                    </button>
                </div>

                {/* 2. CONTENIDO CENTRADO */}
                <div className="px-8 pb-10 flex flex-col items-center relative -mt-20">
                    
                    {/* AVATAR CENTRADO */}
                    <div className="relative group">
                        <div className="h-40 w-40 rounded-full border-[6px] border-white dark:border-gray-800 bg-white dark:bg-gray-700 shadow-xl flex items-center justify-center overflow-hidden">
                            {user.avatar_url ? (
                                <img src={user.avatar_url} alt={user.name} className="h-full w-full object-cover" onError={(e)=>{e.target.style.display='none'}}/>
                            ) : (
                                <span className="text-5xl font-bold text-gray-300">{getInitials(user.name)}</span>
                            )}
                        </div>
                        {/* Status Dot */}
                        <div className={`absolute bottom-3 right-3 w-6 h-6 rounded-full border-4 border-white dark:border-gray-800 ${user.status === 'active' ? 'bg-green-500' : 'bg-red-500'}`} title={user.status}></div>
                    </div>

                    {/* IDENTIDAD DEL USUARIO */}
                    <div className="text-center mt-4">
                        <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-1">
                            {user.name}
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 font-medium text-sm flex items-center justify-center gap-2">
                            {user.email}
                            {user.is_verified && (
                                <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
                            )}
                        </p>
                        
                        {/* Role Badge (Centrado y elegante) */}
                        <div className="mt-3 flex justify-center">
                            <span className={`px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest border ${
                                user.is_admin 
                                ? 'bg-gray-900 text-white border-gray-900 dark:bg-white dark:text-gray-900' 
                                : 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-700 dark:text-gray-300'
                            }`}>
                                {user.role}
                            </span>
                        </div>
                    </div>

                    {/* SEPARADOR */}
                    <div className="w-full h-px bg-gray-100 dark:bg-gray-700 my-8"></div>

                    {/* 3. GRID DE DATOS (3 Columnas Simétricas) */}
                    <div className="w-full grid grid-cols-3 gap-4 text-center">
                        
                        {/* ID */}
                        <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 transition-colors group cursor-pointer" onClick={() => copyToClipboard(user.id)}>
                            <div className="text-xs text-gray-400 uppercase font-bold mb-1">User ID</div>
                            <div className="font-mono text-lg font-bold text-gray-700 dark:text-gray-200 group-hover:text-indigo-600">
                                #{user.id}
                            </div>
                        </div>

                        {/* MIEMBRO DESDE */}
                        <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-700/50">
                            <div className="text-xs text-gray-400 uppercase font-bold mb-1">Joined</div>
                            <div className="font-medium text-lg text-gray-700 dark:text-gray-200">
                                {formatDate(user.created_at)}
                            </div>
                        </div>

                        {/* ÚLTIMA VEZ ONLINE */}
                        <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-700/50">
                            <div className="text-xs text-gray-400 uppercase font-bold mb-1">Last Seen</div>
                            <div className="font-medium text-lg text-gray-700 dark:text-gray-200">
                                {formatDate(user.last_login_at)}
                            </div>
                        </div>
                    </div>

                    {/* 4. FOOTER TÉCNICO (Firebase UID) */}
                    <div className="mt-8 w-full max-w-md">
                        <div 
                            onClick={() => copyToClipboard(user.firebase_uid)}
                            className="text-center group cursor-pointer"
                        >
                            <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-1 group-hover:text-indigo-500 transition-colors">
                                {copied ? <span className="text-green-500 font-bold">COPIED TO CLIPBOARD!</span> : 'SECURE FIREBASE UID'}
                            </p>
                            <div className="bg-gray-100 dark:bg-gray-900/50 py-2 px-4 rounded-lg border border-transparent group-hover:border-indigo-200 dark:group-hover:border-indigo-900 transition-all">
                                <p className="font-mono text-xs text-gray-500 dark:text-gray-400 truncate">
                                    {user.firebase_uid}
                                </p>
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            <div className="text-center mt-8 text-xs text-gray-400 opacity-50">
                User Profile • v2.1
            </div>
        </div>
    );
}