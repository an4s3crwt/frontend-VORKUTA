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
            setErrors({ password: 'Las contraseñas no coinciden' });
            setLoading(false);
            return;
        }
    
        try {
            // Crear el usuario en Firebase
            const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
            await updateProfile(userCredential.user, { displayName: formData.name });
    
            // Obtener el UID del usuario recién creado
            const user = userCredential.user;
    
            // Ahora enviar los datos del usuario al backend para registrar en tu base de datos
            const response = await api.post('/register', {
                firebase_uid: user.uid,
                email: user.email,
                name: formData.name,
            });
    
            const backendUser = response.data; // Esto debería devolver el usuario registrado desde tu backend
    
            // Login automático después del registro
            dispatch(login({ user: backendUser.user, token: null }));
    
            navigate('/');
        } catch (err) {
            let message = 'Error en el registro';
            if (err.code === 'auth/email-already-in-use') {
                message = 'Este correo ya está registrado.';
            } else if (err.code === 'auth/invalid-email') {
                message = 'Correo electrónico no válido.';
            }
    
            setErrors({ general: err.message || message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className='auth-container'>
            <div className='auth-card'>
                <h2>Crear una cuenta</h2>

                {errors.general && <div className='auth-error'>{errors.general}</div>}

                <form onSubmit={handleSubmit} className='auth-form'>
                    <div className='form-group'>
                        <label htmlFor="name">Nombre completo</label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            className={errors.name ? 'input-error' : ''}
                        />
                        {errors.name && <span className='error-text'>{errors.name}</span>}
                    </div>

                    <div className='form-group'>
                        <label htmlFor="email">Correo electrónico</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            className={errors.email ? 'input-error' : ''}
                        />
                        {errors.email && <span className='error-text'>{errors.email}</span>}
                    </div>

                    <div className='form-group'>
                        <label htmlFor="password">Contraseña</label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            minLength="8"
                            className={errors.password ? 'input-error' : ''}
                        />
                        {errors.password && <span className='error-text'>{errors.password}</span>}
                    </div>

                    <div className='form-group'>
                        <label htmlFor="password_confirmation">Confirmar contraseña</label>
                        <input
                            type="password"
                            id="password_confirmation"
                            name="password_confirmation"
                            value={formData.password_confirmation}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <button type="submit" disabled={loading} className='auth-button'>
                        {loading ? 'Registrando...' : 'Registrarse'}
                    </button>
                </form>

                <div className='auth-footer'>
                    ¿Ya tienes una cuenta? <a href="/login">Inicia sesión</a>
                </div>
            </div>
        </div>
    );
}
