import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, setPersistence, browserSessionPersistence } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyB3moJ4WygIWcVlHh2AD6i1BsTctUDMEeo",
  authDomain: "flighty-20f72.firebaseapp.com",
  projectId: "flighty-20f72",
  storageBucket: "flighty-20f72.firebasestorage.app",
  messagingSenderId: "589633137264",
  appId: "1:589633137264:web:87e83d6d01e38bfa2962b5",
};

// Solo inicializa si no hay apps
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

// Establece persistencia si aún no se ha establecido (esto se puede mover a tu lógica de login si prefieres)
setPersistence(auth, browserSessionPersistence)
  .then(() => {
    console.log("Firebase auth set to session persistence");
  })
  .catch((error) => {
    console.error("Error setting Firebase session persistence:", error);
  });
