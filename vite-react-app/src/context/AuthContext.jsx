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

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setLoading(true);
            if (currentUser) {
                const token = await currentUser.getIdToken(true);
                const tokenResult = await getIdTokenResult(currentUser);
                setIsAdmin(tokenResult.claims.admin === true);
                setUser(currentUser);
            } else {
                setUser(null);
                setIsAdmin(false);
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

   