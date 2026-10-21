import axios from "axios";
import { getIdToken, signOut } from "firebase/auth";
import { auth } from "./firebase";

// ==========================================
// 1. CONFIGURACIÓN BASE
// ==========================================
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "https://backend-vorkuta.onrender.com/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
});

// ==========================================
// 2. INTERCEPTOR DE REQUEST
// ==========================================
api.interceptors.request.use(
  (config) => {
    const isPublicAuthRoute = config.url?.includes('/login') || config.url?.includes('/register');

    if (!isPublicAuthRoute) {
      const token = localStorage.getItem("token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ==========================================
// 3. INTERCEPTOR DE RESPONSE
// ==========================================
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status;
    const isLoginRequest = error.config?.url?.includes('/login');

    if (status === 401 && !isLoginRequest) {
      console.warn("Token expirado o inválido. Cerrando sesión...");
      await logout();
    }

    return Promise.reject(error);
  }
);

// ==========================================
// 4. LOGIN CON FIREBASE
// ==========================================
export const loginWithFirebase = async () => {
  const user = auth.currentUser;
  if (!user) throw new Error("Usuario no logueado en Firebase.");

  const firebaseToken = await getIdToken(user, true);

  const res = await api.post(
    "/login",
    { firebase_token: firebaseToken },
    {
      headers: { Authorization: `Bearer ${firebaseToken}` },
    }
  );

  const accessToken = res.data.access_token || res.data.token;

  if (accessToken) {
    localStorage.setItem("token", accessToken);
    api.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;
  }

  return res.data;
};

// ==========================================
// 5. REGISTRO CON FIREBASE (Sincroniza con MariaDB y guarda Sanctum)
// ==========================================
export const registerWithFirebase = async (name) => {
  const user = auth.currentUser;
  if (!user) throw new Error("Usuario no creado en Firebase.");

  const firebaseToken = await getIdToken(user, true);

  const res = await api.post(
    "/register",
    {
      firebase_uid: user.uid,
      email: user.email,
      name: name || user.displayName || user.email.split("@")[0],
    },
    {
      headers: { Authorization: `Bearer ${firebaseToken}` },
    }
  );

  const accessToken = res.data.access_token || res.data.token;

  if (accessToken) {
    localStorage.setItem("token", accessToken);
    api.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;
  }

  return res.data;
};

// ==========================================
// 6. LOGOUT
// ==========================================
export const logout = async () => {
  try {
    await signOut(auth);
    localStorage.removeItem("token");
    delete api.defaults.headers.common["Authorization"];
    console.log("Usuario desconectado correctamente.");
  } catch (error) {
    console.error("Error cerrando sesión:", error);
  }
};

export default api;