import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
    apiKey: "AIzaSyB3moJ4WygIWcVlHh2AD6i1BsTctUDMEeo",
    authDomain: "flighty-20f72.firebaseapp.com",
    projectId: "flighty-20f72",
    storageBucket: "flighty-20f72.firebasestorage.app",
    messagingSenderId: "589633137264",
    appId: "1:589633137264:web:87e83d6d01e38bfa2962b5"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
