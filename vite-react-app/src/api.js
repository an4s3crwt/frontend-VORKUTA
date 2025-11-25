import axios from "axios";
import { getIdToken, signOut } from "firebase/auth";
import { auth } from "./firebase";

// 1. Crear la instancia de Axios
const api = axios.create({
  baseURL: "http://127.0.0.1:8000/api/v1", // Asegúrate de que este puerto sea el correcto
  headers: {
    "Content-Type": "application/json",
  },
});

// ⬇️ ESTO ES LO QUE FALTABA ⬇️
// 2. Interceptor de SOLICITUD (Request)
// Antes de enviar CUALQUIER petición, inyecta el token automáticamente.
api.interceptors.request.use(
  async (config) => {
    const user = auth.currentUser;
    
    if (user) {
      // Obtiene el token actual (si ha expirado, Firebase lo refresca solo aquí)
      const token = await getIdToken(user);
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
// ⬆️ FIN DE LO QUE FALTABA ⬆️


// 3. Interceptor de RESPUESTA (Response)
// Si el token falla a mitad de uso (error 401), intenta renovarlo y reintentar.
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
        // Forzamos la obtención de un token nuevo (refresh)
        const token = await getIdToken(auth.currentUser, true); 
        console.log("Token renovado por interceptor 401");
        
        // Actualizamos el header y reintentamos la petición original
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return api(originalRequest); 
      } catch (tokenError) {
        console.error("Error crítico renovando token:", tokenError);
        await logout(); // Si falla la renovación, cerramos sesión por seguridad
      }
    }

    return Promise.reject(error); // Devuelve cualquier otro error (404, 500, etc.)
  }
);

// Función para cerrar sesión y limpiar todo
export const logout = async () => {
  try {
    await signOut(auth);
    console.log("Usuario desconectado.");
    localStorage.removeItem("token");
    api.defaults.headers.Authorization = "";
    // Opcional: Redirigir al login aquí si usas window.location
    // window.location.href = '/login';
  } catch (error) {
    console.error("Error al desconectar:", error);
  }
};

export default api;