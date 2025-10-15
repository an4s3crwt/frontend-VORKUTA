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
      const response = await api.post('/login');
      const backendUser = response.data;

      dispatch(login({ user: backendUser.user, token: null }));
      navigate('/');
    } catch (err) {
      console.error('Login error:', err);
      setError('Invalid credentials or connection issue.');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-neutral-100 flex items-center justify-center px-4 font-[Inter]">
      {/* Contenedor central con efecto vidrio */}
      <div className="w-full max-w-sm bg-white/60 backdrop-blur-2xl border border-black/10 rounded-3xl shadow-xl p-10 transition-all duration-300">
        {/* Header con animación suave */}
        <div className="text-center mb-10 animate-fade-in">
          <h1 className="text-5xl font-semibold tracking-tight text-black mb-3">
            Flighty
          </h1>
          <p className="text-sm text-neutral-600 tracking-wide">
            Sign in to your control panel
          </p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleLogin} className="space-y-7">
          {/* Email */}
          <div>
            <label className="block text-xs font-medium uppercase tracking-widest text-neutral-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 text-sm bg-transparent border border-black/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/80 shadow-sm transition-all"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-medium uppercase tracking-widest text-neutral-700 mb-2">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 text-sm bg-transparent border border-black/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/80 shadow-sm transition-all"
              />
            </div>
            <div className="flex items-center mt-2">
              <input
                type="checkbox"
                id="showPassword"
                checked={showPassword}
                onChange={() => setShowPassword(!showPassword)}
                className="h-4 w-4 text-black border-gray-400 rounded focus:ring-black"
              />
              <label htmlFor="showPassword" className="ml-2 text-sm text-neutral-700">
                Show password
              </label>
            </div>
          </div>

          {/* Botón de login */}
          <button
            type="submit"
            disabled={loading}
            className="relative w-full py-3 bg-black text-white text-sm font-medium rounded-xl transition-all duration-300 hover:bg-neutral-900 hover:shadow-[0_0_12px_rgba(0,0,0,0.4)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 
                    0 0 5.373 0 12h4zm2 5.291A7.962 
                    7.962 0 014 12H0c0 3.042 1.135 
                    5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Logging in...
              </span>
            ) : (
              'Login'
            )}
          </button>

          {error && (
            <p className="text-xs text-red-500 text-center mt-2 font-medium">
              {error}
            </p>
          )}
        </form>

        {/* Forgot password */}
        <div className="mt-6 text-center">
          <a
            href="/forgot-password"
            className="text-sm text-neutral-600 hover:text-black transition-all"
          >
            Forgot your password?
          </a>
        </div>

        {/* Footer */}
        <div className="mt-16 text-center text-xs text-neutral-500 tracking-wider">
          <p>© 2025 Flighty. Precision. Design. Flight.</p>
        </div>
      </div>
    </div>
  );
}
