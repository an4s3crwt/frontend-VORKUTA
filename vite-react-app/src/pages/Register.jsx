import React, { useState } from 'react';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { login } from '../redux/authSlice';
import api from '../api';

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: '', general: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    if (formData.password !== formData.password_confirmation) {
      setErrors({ password: 'Passwords do not match' });
      setLoading(false);
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      await updateProfile(userCredential.user, { displayName: formData.name });
      const user = userCredential.user;

      const response = await api.post('/register', {
        firebase_uid: user.uid,
        email: user.email,
        name: formData.name,
      });

      const backendUser = response.data;
      dispatch(login({ user: backendUser.user, token: null }));
      navigate('/');
    } catch (err) {
      let message = 'Registration error';
      if (err.code === 'auth/email-already-in-use') {
        message = 'This email is already registered.';
      } else if (err.code === 'auth/invalid-email') {
        message = 'Invalid email address.';
      }
      setErrors({ general: message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-neutral-100 flex items-center justify-center px-6 py-10 font-[Inter] overflow-y-auto">
      <div className="w-full max-w-3xl bg-white/60 backdrop-blur-2xl border border-black/10 rounded-3xl shadow-xl p-12 transition-all duration-300 flex flex-col md:flex-row gap-12 items-center">
        
        {/* Lado izquierdo — branding */}
        <div className="flex-1 text-center md:text-left">
          <h1 className="text-6xl font-semibold tracking-tight text-black mb-3">
            Flighty
          </h1>
          <p className="text-sm text-neutral-600 tracking-wide max-w-sm">
            Create your Flighty account and start exploring the skies.
          </p>
        </div>

        {/* Lado derecho — formulario */}
        <div className="flex-1 w-full flex flex-col">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-xs font-medium uppercase tracking-widest text-neutral-700 mb-2">
                Full Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 text-sm bg-transparent border border-black/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/80 shadow-sm transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-medium uppercase tracking-widest text-neutral-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 text-sm bg-transparent border border-black/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/80 shadow-sm transition-all"
              />
            </div>

            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-xs font-medium uppercase tracking-widest text-neutral-700 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength="8"
                  className="w-full px-4 py-3 text-sm bg-transparent border border-black/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/80 shadow-sm transition-all"
                />
              </div>

              <div className="flex-1">
                <label className="block text-xs font-medium uppercase tracking-widest text-neutral-700 mb-2">
                  Confirm
                </label>
                <input
                  type="password"
                  name="password_confirmation"
                  value={formData.password_confirmation}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 text-sm bg-transparent border border-black/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/80 shadow-sm transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="relative w-full py-3 bg-black text-white text-sm font-medium rounded-xl transition-all duration-300 hover:bg-neutral-900 hover:shadow-[0_0_12px_rgba(0,0,0,0.4)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating account...' : 'Register'}
            </button>

            {errors.general && (
              <p className="text-xs text-red-500 text-center mt-2 font-medium">
                {errors.general}
              </p>
            )}
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-neutral-600">
              Already have an account?{' '}
              <a
                href="/login"
                className="text-black font-medium hover:opacity-80 transition-opacity"
              >
                Login
              </a>
            </p>
          </div>

          {/* Footer fijo en la columna derecha (alineado abajo en pantallas grandes) */}
          <div className="mt-8 md:mt-auto text-center md:text-right">
            <p className="text-xs text-neutral-500 tracking-wider">
              © 2025 Flighty. Precision. Design. Flight.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
