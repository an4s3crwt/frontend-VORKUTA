// =============================================================================
// MÓDULO: CLIENTE HTTP (AXIOS) - FIREBASE LOGIN + SANCTUM TOKEN
// =============================================================================

import axios from "axios";
import { getIdToken, signOut } from "firebase/auth";
import { auth } from "./firebase";

// ==========================================
// 1. CONFIGURACIÓN BASE
// ==========================================
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
});

// ==========================================
// 2. INTERCEPTOR DE REQUEST
// ==========================================
// Inserta automáticamente el Sanctum token en todas las peticiones
api.interceptors.request.use(
  async (config) => {
    const token = localStorage.getItem("token"); // Sanctum token guardado después del login
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ==========================================
// 3. INTERCEPTOR DE RESPONSE
// ==========================================
// Maneja errores globales, especialmente 401 Unauthorized
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status;

    if (status === 401) {
      // Token inválido o expirado
      console.warn("Token expirado o inválido. Cerrando sesión...");
      await logout();
    }

    return Promise.reject(error);
  }
);

// ==========================================
// 4. LOGIN CON FIREBASE (Devuelve Sanctum token)
// ==========================================
export const loginWithFirebase = async () => {
  const user = auth.currentUser;

  if (!user) throw new Error("Usuario no logueado en Firebase.");

  // 1. Obtener Firebase ID token
  const firebaseToken = await getIdToken(user);

  // 2. Enviar al backend Laravel para recibir Sanctum token
  const res = await api.post("/login", {}, {
    headers: { Authorization: `Bearer ${firebaseToken}` },
  });

  // 3. Guardar token y configurar cabecera global
  const accessToken = res.data.access_token;
  localStorage.setItem("token", accessToken);
  api.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;

  return res.data;
};

// ==========================================
// 5. LOGOUT
// ==========================================
export const logout = async () => {
  try {
    // Firebase sign out
    await signOut(auth);

    // Limpiar localStorage y cabeceras Axios
    localStorage.removeItem("token");
    delete api.defaults.headers.common["Authorization"];

    console.log("Usuario desconectado correctamente.");
  } catch (error) {
    console.error("Error cerrando sesión:", error);
  }
};

// ==========================================
// 6. EXPORT DEFAULT
// ==========================================
export default api;
