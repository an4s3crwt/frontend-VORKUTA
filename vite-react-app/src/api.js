import axios from "axios";
import { getIdToken } from "firebase/auth";
import { auth } from "./firebase"; // Asegúrate de tener auth exportado desde tu config de Firebase

const api = axios.create({
  baseURL: "http://127.0.0.1:8000/api/v1",
});

// Interceptor para incluir el token de Firebase en cada petición
api.interceptors.request.use(
  async (config) => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      try {
        const token = await getIdToken(currentUser);
        config.headers.Authorization = `Bearer ${token}`;
      } catch (error) {
        console.warn("No se pudo obtener el token de Firebase:", error);
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);


export default api;
