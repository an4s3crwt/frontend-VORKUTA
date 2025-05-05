import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { login } from '../redux/authSlice';

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
            
            //llamada al backend , los interceptores de /api.js ya obtieenen el token de firebase para pasarlo x header al backenddd
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
        <div className="login-container">
            <h2>Iniciar sesión</h2>
            <form onSubmit={handleLogin}>
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email"
                    required
                />
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    required
                />
                <button type="submit" disabled={loading}>
                    {loading ? 'Cargando...' : 'Login'}
                </button>
                {error && <p className="error-message">{error}</p>}
            </form>
        </div>
    );
}
