import axios from "axios";
import { getIdToken } from "firebase/auth";
import { auth } from "./firebase"; // Asegúrate de tener auth exportado desde tu config de Firebase

const api = axios.create({
  baseURL: "http://127.0.0.1:8000/api/v1", // Aquí colocas la URL base de tu API
});

// Interceptor para incluir el token de Firebase en cada petición
api.interceptors.request.use(
  async (config) => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      try {
        const token = await getIdToken(currentUser, true);
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
          console.log('Token añadido a headers:', token); // Debug
        }
      } catch (error) {
        console.error("Error obteniendo token:", error); // Debug mejorado
      }
    } else {
      console.warn("No hay usuario actual en Firebase"); // Debug
    }
    return config;
  },
  (error) => {
    console.error("Error en interceptor:", error); // Debug
    return Promise.reject(error);
  }
);

export default api;
