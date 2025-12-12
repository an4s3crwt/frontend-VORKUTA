import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, setPersistence, browserSessionPersistence } from "firebase/auth";

// =============================================================================
// ARCHIVO: FIREBASE CONFIG (El Puente con la Nube)
// -----------------------------------------------------------------------------
// Este archivo inicializa la conexión con los servicios de Google (Auth).
// Actúa como el núcleo de seguridad y configuración para toda la app.
// =============================================================================

// 1. CREDENCIALES DE CONEXIÓN

// Nota: En un entorno de producción real (empresa), estas claves ESTARÍAN 
// ocultas en variables de entorno (.env) por seguridad. Para este prototipo académico,
// las mantengo aquí para facilitar el despliegue sobretodo
const firebaseConfig = {
  apiKey: "AIzaSyB3moJ4WygIWcVlHh2AD6i1BsTctUDMEeo",
  authDomain: "flighty-20f72.firebaseapp.com",
  projectId: "flighty-20f72",
  storageBucket: "flighty-20f72.firebasestorage.app",
  messagingSenderId: "589633137264",
  appId: "1:589633137264:web:87e83d6d01e38bfa2962b5",
};

// ==========================================
// 2. Inicialización Segura
// ==========================================
// React  a veces recarga el código varias veces 
// Si intentamos inicializar Firebase dos veces, la aplicación se rompe.
//
// SOLUCIÓN:
// Comprobamos si ya existe una instancia  con getApps
// - Si NO existe (length === 0) -> La creamos (initializeApp).
// - Si YA existe -> Reutilizamos la que había (getApp).
// Esto evita el temido error: "Firebase App named '[DEF]' already exists".
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Exportamos el módulo de autenticación para usarlo en el Login y Registro.
export const auth = getAuth(app);

// ==========================================
// 3. SEGURIDAD
// ==========================================
// Aquí definimos cuánto tiempo dura la sesión del usuario.
// Usamos 'browserSessionPersistence':
// - SIGNIFICADO: La sesión solo dura mientras la PESTAÑA esté abierta.
//  Si el usuario cierra el navegador, se cierra la sesión automáticamente.

setPersistence(auth, browserSessionPersistence)
  .then(() => {
    console.log("Firebase security: Session persistence active.");
  })
  .catch((error) => {
    console.error("Error configurando la persistencia:", error);
  });