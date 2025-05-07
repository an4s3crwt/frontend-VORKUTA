import React, { useContext, useState, useEffect, createContext } from 'react';
import { onAuthStateChanged, signOut, getIdTokenResult } from 'firebase/auth';
import { auth } from '../firebase';

const AuthContext = createContext();

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);
    const [authError, setAuthError] = useState(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            try {
                setLoading(true);
                setUser(currentUser);
                
                if (currentUser) {
                    console.log('Usuario Firebase detectado:', currentUser.uid);
                    
                    // Forzar refresco del token
                    const token = await currentUser.getIdToken(true);
                    console.log('Token actualizado:', token);
                    
                    // Verificar claims
                    const tokenResult = await getIdTokenResult(currentUser);
                    console.log('Token claims:', tokenResult.claims);
                    
                    setIsAdmin(tokenResult.claims.admin === true);
                } else {
                    console.log('No hay usuario autenticado');
                    setIsAdmin(false);
                }
            } catch (error) {
                console.error('Error en auth state:', error);
                setAuthError(error);
            } finally {
                setLoading(false);
            }
        });

        return () => {
            console.log('Limpiando suscripción auth');
            unsubscribe();
        };
    }, []);

    const value = {
        user,
        isAuthenticated: !!user,
        isAdmin,
        authError,
        logout: () => {
            console.log('Ejecutando logout');
            return signOut(auth);
        },
        refreshToken: async () => {
            if (auth.currentUser) {
                return auth.currentUser.getIdToken(true);
            }
            return null;
        }
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}