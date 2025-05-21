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
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setLoading(true);
            if (currentUser) {
                const token = await currentUser.getIdToken(true);
                const tokenResult = await getIdTokenResult(currentUser);
                setIsAdmin(tokenResult.claims.admin === true);
                setUser(currentUser);

                // Configura el token en axios
                axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            } else {
                setUser(null);
                setIsAdmin(false);
                // Elimina el token en caso de que no haya usuario
                delete axios.defaults.headers.common['Authorization'];
            }
            setLoading(false);
        });

        return () => {
            unsubscribe();
        };
    }, []);



    return (
        <AuthContext.Provider value={{ user, isAuthenticated: !!user, isAdmin }}>
            {!loading && children}
        </AuthContext.Provider>
    );
}

