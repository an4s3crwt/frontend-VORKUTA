import axios from "axios";
import { getIdToken, signOut } from "firebase/auth";
import { auth } from "./firebase"; 

const api = axios.create({
  baseURL: "http://127.0.0.1:8000/api/v1", 
});

// Interceptor para añadir el token a cada solicitud
api.interceptors.request.use(
  async (config) => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      try {
        // Obtener el token actual
        const token = await getIdToken(currentUser, true);
        if (token) {
          // Añadir el token a los headers
          config.headers.Authorization = `Bearer ${token}`;
          console.log('Token añadido a headers:', token); // Debug
        }
      } catch (error) {
        console.error("Error obteniendo token:", error); 
      }
    } else {
      console.warn("No hay usuario actual en Firebase");
      // Si no hay usuario autenticado, eliminamos el token
      config.headers.Authorization = ''; // Eliminar token si no hay usuario
    }
    return config;
  },
  (error) => {
    console.error("Error en interceptor:", error); 
    return Promise.reject(error);
  }
);

// Función para cerrar sesión y borrar el token
export const logout = async () => {
  try {
    await signOut(auth);  // Cerrar sesión en Firebase
    console.log("Usuario desconectado exitosamente.");

    // Borrar cualquier dato de sesión almacenado (como token en localStorage, cookies, etc.)
    localStorage.removeItem("token");  // Si almacenas token en localStorage, o usa cualquier otro mecanismo de almacenamiento que estés usando

    // Asegurarse de que no haya token almacenado en Axios
    api.defaults.headers.Authorization = "";  // Eliminar el token de los headers de Axios
    console.log("Token borrado del almacenamiento local y los headers de Axios.");

  } catch (error) {
    console.error("Error al desconectar el usuario:", error);
  }
};

export default api;