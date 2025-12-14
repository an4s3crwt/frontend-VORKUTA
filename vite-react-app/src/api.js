import axios from "axios";
import { getIdToken, signOut } from "firebase/auth";
import { auth } from "./firebase";

// =============================================================================
// MÓDULO: CLIENTE HTTP (AXIOS)
// -----------------------------------------------------------------------------
// Este archivo actúa como una "puerta de enlace" (Gateway) centralizada para todas
// las comunicaciones entre el Frontend (React) y el Backend (API).
// 
// 
// En lugar de usar 'fetch' en cada componente, configuramos una única instancia
// que inyecta automáticamente la seguridad (Tokens JWT) y maneja los errores globales.
// =============================================================================

// 1. CONFIGURACIÓN BASE
// Definimos la URL raíz y las cabeceras estándar para no repetirlas nunca más.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api/v1", // Punto de entrada al Backend
  headers: {
    "Content-Type": "application/json", // Estandarización de formato de datos
  },
});

// ==========================================
// 2. INTERCEPTOR DE SALIDA (REQUEST)
// ==========================================
// Actúa como un "Portero de Seguridad" antes de que la petición salga del navegador.
//
// FUNCIONALIDAD:
// Antes de enviar cualquier dato al servidor, este código se "cuela" en medio,
// obtiene el token de seguridad actual del usuario y lo pega en la cabecera.
api.interceptors.request.use(
  async (config) => {
    const user = auth.currentUser;
    
    if (user) {
      // OBTENCIÓN DE TOKEN INTELIGENTE:
      // Firebase comprueba si el token actual sigue vivo. 
      // Si ha caducado, Firebase genera uno nuevo AUTOMÁTICAMENTE aquí mismo 
      // Esto garantiza que siempre enviamos credenciales válidas.
      const token = await getIdToken(user);
      
      // Inyección del estándar "Bearer Token" en la cabecera HTTP
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config; // Dejamos pasar la petición ya firmada
  },
  (error) => {
    return Promise.reject(error); // Si falla la configuración, cancelamos
  }
);

// ==========================================
// 3. INTERCEPTOR DE ENTRADA (respuesta)
// ==========================================
// Actúa como una "Red de Seguridad" cuando vuelve la respuesta del servidor.
//
// OBJETIVO: RESILIENCIA
// Si el servidor nos rechaza (Error 401 Unauthorized) porque el token caducó
// justo en el milisegundo en que viajaba, este código lo captura, renueva el token
// y REINTENTA la petición original sin que el usuario se entere.
api.interceptors.response.use(
  (response) => response, // Si todo va bien (200 ), pasamos los datos
  async (error) => {
    const originalRequest = error.config;

    // DETECCIÓN DE TOKEN CADUCADO (401)
    // Condición: Es un error 401, no hemos reintentado ya (para evitar bucles infinitos)
    // y el usuario sigue logueado en el frontend.
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      auth.currentUser
    ) {
      originalRequest._retry = true; // Marcar como "ya reintentado"

      try {
        console.log(" Token caducado detectado. Iniciando renovación automática...");
        
        // 1. Forzamos la renovación del token con Firebase (forceRefresh = true)
        const token = await getIdToken(auth.currentUser, true); 
        console.log("Token renovado con éxito.");
        
        // 2. Actualizamos la cabecera de la petición original con el token nuevo
        originalRequest.headers.Authorization = `Bearer ${token}`;
        
        // 3. Re-ejecutamos la petición original (Axios la vuelve a lanzar)
        return api(originalRequest); 
        
      } catch (tokenError) {
        // FALLO CRÍTICO DE SEGURIDAD
        // Si no podemos renovar el token 
        // expulsamos al usuario inmediatamente para proteger la app.
        console.error("Error crítico renovando token. Cerrando sesión.", tokenError);
        await logout(); 
      }
    }

    // Si no es un 401 o falla el reintento, devolvemos el error al componente
    // para que muestre un mensaje tipo "Error de conexión".
    return Promise.reject(error); 
  }
);

// ==========================================
// 4. UTILIDAD DE CIERRE DE SESIÓN
// ==========================================

export const logout = async () => {
  try {
    await signOut(auth); // Desconexión de Firebase
    console.log("Usuario desconectado correctamente.");
    
    // Limpieza de rastros locales
    localStorage.removeItem("token");
    
    // Invalidamos la cabecera por defecto para futuras peticiones
    api.defaults.headers.Authorization = "";
    
  } catch (error) {
    console.error("Error al desconectar:", error);
  }
};

export default api;