import axios from "axios";

const BACKEND_URL = "http://localhost:8000/api";

export const api = axios.create({
  baseURL: BACKEND_URL,
});

// Interceptor para agregar el token JWT
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("jwt_token");
    if (token) {
      // Añadir el token en la cabecera Authorization
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
