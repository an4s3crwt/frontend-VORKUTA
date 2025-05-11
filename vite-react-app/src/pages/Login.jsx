import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { login } from '../redux/authSlice';
import api from './../api';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            const response = await api.post('/login');
            const backendUser = response.data;

            dispatch(login({ user: backendUser.user, token: null }));
            navigate('/');
        } catch (err) {
            console.error('Login error:', err);
            setError('Credenciales incorrectas o error de red.');
        }

        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
            <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-md">
                <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">
                    Iniciar sesión
                </h2>
                <form onSubmit={handleLogin} className="space-y-4">
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Email"
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-400 transition"
                    />
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Password"
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-400 transition"
                    />
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-gray-900 text-white font-medium rounded-xl hover:bg-gray-800 transition disabled:opacity-50"
                    >
                        {loading ? 'Cargando...' : 'Login'}
                    </button>
                    {error && (
                        <p className="text-sm text-red-500 text-center mt-2">{error}</p>
                    )}
                </form>
            </div>
        </div>
    );
}
