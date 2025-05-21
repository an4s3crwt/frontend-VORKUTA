import axios from "axios";
import { getIdToken, signOut } from "firebase/auth";
import { auth } from "./firebase";

const api = axios.create({
  baseURL: "http://127.0.0.1:8000/api/v1",
});

// Interceptor para añadir el token a cada solicitud
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Si el error es 401 y aún no hemos reintentado
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      auth.currentUser
    ) {
      originalRequest._retry = true;

      try {
        const token = await getIdToken(auth.currentUser, true); // fuerza token nuevo
        console.log(token);
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return api(originalRequest); // reintenta la solicitud original
      } catch (tokenError) {
        console.error("Error renovando token:", tokenError);
        await logout(); // opcional: cerrar sesión automáticamente si falla
      }
    }

    return Promise.reject(error); // otros errores
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