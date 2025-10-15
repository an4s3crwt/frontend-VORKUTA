import React, { useContext, useState, useEffect, createContext } from 'react';
import { onAuthStateChanged, signOut, getIdTokenResult } from 'firebase/auth';
import { auth } from '../firebase';
import axios from 'axios';

const AuthContext = createContext();

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // 🔹 Detecta los cambios de autenticación en Firebase
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setLoading(true);
            if (currentUser) {
                try {
                    // Obtener token e información de roles
                    const token = await currentUser.getIdToken(true);
                    const tokenResult = await getIdTokenResult(currentUser);

                    // Asignar datos al contexto
                    setUser(currentUser);
                    setIsAdmin(tokenResult.claims.admin === true);

                    // Guardar token para las peticiones con Axios
                    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                } catch (err) {
                    console.error('Error al obtener token:', err);
                }
            } else {
                // Si el usuario cierra sesión o no hay sesión activa
                setUser(null);
                setIsAdmin(false);
                delete axios.defaults.headers.common['Authorization'];
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // 🔒 Función de cerrar sesión
    const logout = async () => {
        try {
            if (!auth.currentUser) return; // Evita error si no hay usuario activo
            await signOut(auth); // Cierra sesión en Firebase
            setUser(null);
            setIsAdmin(false);
            delete axios.defaults.headers.common['Authorization'];
            localStorage.clear();
            sessionStorage.clear();
        } catch (error) {
            console.error('Error al cerrar sesión:', error);
            throw error; // Lo reenvía para que el Navbar pueda capturarlo
        }
    };

    // 🔸 Valor global del contexto
    const value = {
        user,
        isAuthenticated: !!user,
        isAdmin,
        logout, // 👈 ahora sí existe
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}
