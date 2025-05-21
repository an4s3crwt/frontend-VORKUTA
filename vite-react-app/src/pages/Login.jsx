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
    const [showPassword, setShowPassword] = useState(false);
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
        <div className="min-h-screen bg-white flex items-center justify-center p-4">
            <div className="w-full max-w-sm">
                <div className="text-center mb-10">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Osmo</h1>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">EMAIL:</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full px-4 py-3 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">PASSWORD</label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="w-full px-4 py-3 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-500"
                            />
                        </div>
                        <div className="flex items-center mt-2">
                            <input
                                type="checkbox"
                                id="showPassword"
                                checked={showPassword}
                                onChange={() => setShowPassword(!showPassword)}
                                className="h-4 w-4 text-gray-600 focus:ring-gray-500 border-gray-300 rounded"
                            />
                            <label htmlFor="showPassword" className="ml-2 block text-sm text-gray-700">
                                Show password
                            </label>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-black text-white text-sm font-medium rounded-md hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <span className="flex items-center justify-center">
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Login
                            </span>
                        ) : 'Login'}
                    </button>

                    {error && (
                        <p className="text-xs text-red-500 text-center mt-2">{error}</p>
                    )}
                </form>

                <div className="mt-6 text-center">
                    <a href="/forgot-password" className="text-sm text-gray-600 hover:underline">
                        Forgot password?
                    </a>
                </div>

                <div className="mt-16 text-center text-sm text-gray-500">
                    <p className="mb-6">
                        Osmo combines high-quality resources with intuitive guides, making the process of designing standout websites faster and easier, helping creatives to achieve great results in less time.
                    </p>
                    <p className="font-medium">NICOLA ROWE</p>
                    <p className="text-xs">DIGITAL DESIGNER</p>
                </div>

                <div className="mt-8 text-center text-xs text-gray-400">
                    <p>©2025 OSMO. ALL RIGHTS RESERVED.</p>
                </div>
            </div>
        </div>
    );
}