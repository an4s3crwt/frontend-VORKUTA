import React, { useContext, useState, useEffect, createContext } from 'react';
import { onAuthStateChanged, signOut, getIdTokenResult } from 'firebase/auth';
import { auth } from '../firebase';
import axios from 'axios';

// ==========================================
// 1. EL CONTEXTO (LA "NUBE" DE DATOS)
// ==========================================
// Creamos un contexto global. Esto es como una "caja mágica" que estará disponible
// en toda la app. Así no tengo que estar pasando el usuario de padre a hijo 
const AuthContext = createContext();

// Hago mi propio Hook personalizado.
// Así me ahorro tener que importar 'useContext' y 'AuthContext'
// en cada componente. Solo importo 'useAuth()' y listo. Más limpio.
export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }) {
    // --- ESTADOS GLOBALES ---
    // ¿Quién es el usuario? (null si no hay nadie)
    const [user, setUser] = useState(null);
    // ¿Es el Admin? (rol de administrador)
    const [isAdmin, setIsAdmin] = useState(false);
    // ¿Estamos preguntando a Firebase todavía? (Importante para evitar parpadeos en la UI)
    const [loading, setLoading] = useState(true);

    // ==========================================
    // 2. EL LISTENER DE FIREBASE
    // ==========================================
    useEffect(() => {
        // Esta función de Firebase se queda "escuchando" en segundo plano.
        // Si el usuario recarga la página, cierra la pestaña o se le caduca el token,
        // este evento se dispara automáticamente.
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setLoading(true);
            
            if (currentUser) {
                // --- USUARIO DETECTADO ---
                try {
                    // 1. Obtener el Token JWT fresco.
                    // El 'true' fuerza a refrescarlo si ha caducado.
                    const token = await currentUser.getIdToken(true);
                    
                    // 2. Comprobar permisos especiales
                    // Aquí miro si en la base de datos le pusimos la etiqueta de 'admin'.
                    const tokenResult = await getIdTokenResult(currentUser);

                    // Actualizo mi estado local
                    setUser(currentUser);
                    setIsAdmin(tokenResult.claims.admin === true);

                    // 3. INTEGRACIÓN CON AXIOS 
                    // Esto es súper importante: configuro Axios para que, a partir de ahora,
                    // TODAS las peticiones que haga al backend lleven el token pegado en la cabecera.
                    // Así no tengo que añadir el token manualmente en cada llamada a la API.
                    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                    
                } catch (err) {
                    console.error('Error al obtener token:', err);
                }
            } else {
                // --- USUARIO DESCONECTADO ---
                // Si no hay usuario, limpio todo para no dejar basura en memoria.
                setUser(null);
                setIsAdmin(false);
                // Quito el token de Axios para que no intentemos enviar credenciales viejas.
                delete axios.defaults.headers.common['Authorization'];
            }
            
            // Ya hemos terminado de comprobar, podemos renderizar la UI
            setLoading(false);
        });

        // Cleanup: Si este componente se desmonta, dejamos de escuchar a Firebase
        // para no consumir memoria
        return () => unsubscribe();
    }, []);

    // ==========================================
    // 3. EL BOTÓN DE LOGOUT
    // ==========================================
    const logout = async () => {
        try {
            if (!auth.currentUser) return; // Si ya se fue, no hago nada.
            
            // 1. Cerrar sesión en servidor Firebase
            await signOut(auth); 
            
            // 2. Limpieza profunda en el cliente
            setUser(null);
            setIsAdmin(false);
            delete axios.defaults.headers.common['Authorization']; // Adiós token
            
            // 3. Borrar rastros en el navegador (Local y Session Storage)
            // Esto es por seguridad, para que no quede nada guardado si usa un ordenador público.
            localStorage.clear();
            sessionStorage.clear();
            
        } catch (error) {
            console.error('Error al cerrar sesión:', error);
            // Re-lanzo el error por si quiero mostrar una alerta en el menú de navegación.
            throw error; 
        }
    };

    // Empaqueto todo lo que quiero "exportar" al resto de la app.
    const value = {
        user,
        isAuthenticated: !!user, // convierte el objeto user en true/false
        isAdmin,
        logout,
    };

    return (
        <AuthContext.Provider value={value}>
            {/* RENDERIZADO CONDICIONAL: 
               Si 'loading' es true, no pinto nada 
               
            */}
            {!loading && children}
        </AuthContext.Provider>
    );
}