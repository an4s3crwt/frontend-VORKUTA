import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { login } from '../redux/authSlice';
import api from './../api';

// =============================================================================
// COMPONENTE: LOGIN (Autenticación)
// -----------------------------------------------------------------------------
// Este formulario gestiona el acceso de los usuarios.
// ARQUITECTURA: Implementa un "Login Híbrido":
// 1. Firebase Auth: Se encarga de verificar que la contraseña sea correcta (Seguridad).
// 2. Backend Propio: Una vez verificado, pedimos los datos del perfil a nuestra API.
// =============================================================================

export default function Login() {
  // --- GESTIÓN DE ESTADO (UI) ---
  // Controlamos lo que escribe el usuario y el estado visual del formulario.
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false); // Para "ver contraseña"
  
  // Feedback al usuario: Errores y Carga
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false); // Bloquea el botón para evitar doble click
  
  // Hooks de navegación y estado global
  const navigate = useNavigate(); // Para redirigir al Home
  const dispatch = useDispatch(); // Para guardar al usuario en Redux

  // --- LÓGICA DE INICIO DE SESIÓN ---
  const handleLogin = async (e) => {
    e.preventDefault(); // Evitamos que la página se recargue al enviar el form
    setError(null);     // Limpiamos errores viejos
    setLoading(true);   // Activamos el spinner

    try {
      // PASO 1: SEGURIDAD (Firebase)
      // Le damos el email y contraseña a Firebase. Si están mal, aquí salta un error (catch).
      // Esto es seguro porque nosotros nunca guardamos la contraseña real en nuestra BD.
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // PASO 2: SINCRONIZACIÓN (Backend)
      // Si Firebase dice "OK", avisamos a nuestro servidor (API) de que el usuario ha entrado.
      // Esto sirve para obtener datos extra (rol, preferencias, etc.) que Firebase no tiene.
      const response = await api.post('/login');
      const backendUser = response.data;

      // PASO 3: ESTADO GLOBAL (Redux)
      // Guardamos al usuario en la memoria global de la App para acceder a él desde cualquier sitio.
      dispatch(login({ user: backendUser.user, token: null }));
      
      // Si todo es correcto redirije a Home 
      navigate('/');
      
    } catch (err) {
      console.error('Login error:', err);
      // Mensaje genérico por seguridad (no decir si falla el mail o la contraseñaa)
      setError('Invalid credentials or connection issue.');
    }

    setLoading(false); // Apagamos el spinner pase lo que pase
  };

  // ==========================================
  // RENDERIZADO 
  // ==========================================
  return (
    // Fondo con degradado suave
    <div className="min-h-screen bg-gradient-to-br from-white to-neutral-100 flex items-center justify-center px-4 font-[Inter]">
      
      {/* Tarjeta Central */}
      <div className="w-full max-w-sm bg-white/60 backdrop-blur-2xl border border-black/10 rounded-3xl shadow-xl p-10 transition-all duration-300">
        
        {/* Cabecera del Formulario */}
        <div className="text-center mb-10 animate-fade-in">
          <h1 className="text-5xl font-semibold tracking-tight text-black mb-3">
            Flighty
          </h1>
          <p className="text-sm text-neutral-600 tracking-wide">
            Sign in to your control panel
          </p>
        </div>

        {/* Campos del Formulario */}
        <form onSubmit={handleLogin} className="space-y-7">
          
          {/* Campo Email */}
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

          {/* Campo Contraseña */}
          <div>
            <label className="block text-xs font-medium uppercase tracking-widest text-neutral-700 mb-2">
              Password
            </label>
            <div className="relative">
              <input
                // Cambiamos el tipo de 'password' a 'text' si showPassword es true
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 text-sm bg-transparent border border-black/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/80 shadow-sm transition-all"
              />
            </div>
            
            {/* Toggle para mostrar/ocultar contraseña */}
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

          {/* Botón de Submit con Estado de Carga */}
          <button
            type="submit"
            disabled={loading} // Desactivamos el botón si está cargando
            className="relative w-full py-3 bg-black text-white text-sm font-medium rounded-xl transition-all duration-300 hover:bg-neutral-900 hover:shadow-[0_0_12px_rgba(0,0,0,0.4)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              // Si está cargando, mostramos un Spinner  animado
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

          {/* Mensaje de Error  */}
          {error && (
            <p className="text-xs text-red-500 text-center mt-2 font-medium">
              {error}
            </p>
          )}
        </form>

        {/* Enlace al Registro */}
        <div className="mt-6 text-center">
          <p className="text-sm text-neutral-600">
            Don’t have an account?{' '}
            <a
              href="/register"
              className="text-black font-medium hover:opacity-80 transition-opacity"
            >
              Create one
            </a>
          </p>
        </div>

        {/* Footer  */}
        <div className="mt-16 text-center text-xs text-neutral-500 tracking-wider">
          <p>© 2025 Flighty. Precision. Design. Flight.</p>
        </div>
      </div>
    </div>
  );
}