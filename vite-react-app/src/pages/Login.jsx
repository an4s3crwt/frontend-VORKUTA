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
            navigate('/dashboard');
        } catch (err) {
            console.error('Login error:', err);
            setError('Incorrect credentials or network error.');
        }

        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-sky-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo personalizado - Avión minimalista */}
                <div className="flex justify-center mb-8">
                    <svg 
                        width="48" 
                        height="48" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        xmlns="http://www.w3.org/2000/svg"
                        className="text-sky-600"
                    >
                        <path 
                            d="M22 12L12 16L6 14L2 15L4 13L10 10L3.5 5.5L6 6L12 8L16 2L14 4L15 6L14 10L16 12L15 18L14 22L18.5 15.5L22 12Z" 
                            fill="currentColor" 
                            stroke="currentColor" 
                            strokeWidth="0.5"
                        />
                    </svg>
                </div>

                <h1 className="text-2xl font-light text-gray-800 mb-2 text-center">
                    Flight<span className="font-semibold">Track</span>
                </h1>
                <p className="text-sm text-gray-500 mb-8 text-center">Real-time aircraft tracking</p>

                <form onSubmit={handleLogin} className="space-y-4 bg-white p-8 rounded-xl shadow-sm border border-gray-100">
                    <div>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Email address"
                            required
                            className="w-full px-4 py-3 text-sm border-b border-gray-200 focus:border-sky-500 focus:outline-none placeholder-gray-400"
                        />
                    </div>

                    <div>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Password"
                            required
                            className="w-full px-4 py-3 text-sm border-b border-gray-200 focus:border-sky-500 focus:outline-none placeholder-gray-400"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-sky-600 text-white text-sm font-medium rounded-lg hover:bg-sky-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <span className="flex items-center justify-center">
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Signing in...
                            </span>
                        ) : 'Sign In'}
                    </button>

                    {error && (
                        <p className="text-xs text-red-500 text-center mt-2">{error}</p>
                    )}
                </form>

                <div className="mt-6 text-center">
                    <p className="text-xs text-gray-500">
                        Don't have an account?{' '}
                        <a href="/signup" className="text-sky-600 hover:underline">
                            Register
                        </a>
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                        By signing in, you agree to our Terms and Privacy Policy
                    </p>
                </div>
            </div>
        </div>
    );
}