import { createSlice } from '@reduxjs/toolkit';

// =============================================================================
// MÓDULO: AUTH SLICE (Gestión de Estado Global)
// -----------------------------------------------------------------------------
// Este archivo define cómo se comporta la "memoria global" de la aplicación
// respecto a la sesión del usuario. Utilizamos Redux Toolkit para simplificar
// la lógica y evitar el código repetitivo del Redux normal o clásico.
// =============================================================================

// 1. ESTADO INICIAL 
// Define cómo empieza la aplicación antes de que pase nada.
// Por defecto, asumimos que nadie ha iniciado sesión (null).
const initialState = {
  user: null,          // Objeto con info del usuario (id, nombre, rol...)
  firebaseToken: null, // El token JWT para autenticar peticiones 
};

// 2. CREACIÓN DEL SLICE
// Un "Slice" es un trozo  de todo el  estado global. Este trozo se encarga solo de la Autenticación.
const authSlice = createSlice({
  name: 'auth',        // Nombre para identificarlo en las herramientas de desarrollo (DevTools)
  initialState,        // El estado inicial que definimos arriba
  
  // 3. REDUCERS (LAS ACCIONES)
  // Aquí definimos CÓMO cambia el estado. Son funciones puras que reciben
  // el estado actual y una acción, y deciden cuál será el nuevo estado.
  reducers: {
    
    // ACCIÓN: LOGIN
    // Se ejecuta cuando el usuario se autentica correctamente en el componente Login.
    // Recibimos los datos en 'action.payload' y actualizamos la memoria global.
    login: (state, action) => {
      
      state.user = action.payload.user;
      state.firebaseToken = action.payload.token;
    },

    // ACCIÓN: LOGOUT
    // Se ejecuta cuando el usuario pulsa "Cerrar sesión".
    // Limpiamos totalmente el estado para no dejar rastros de seguridad.
    logout: (state) => {
      state.user = null;
      state.firebaseToken = null;
    },
  },
});

// 4. EXPORTACIÓN
// Exportamos las acciones para usarlas en los botones 
// y el reducer para registrarlo en la tienda principal (Store.js).
export const { login, logout } = authSlice.actions;
export default authSlice.reducer;