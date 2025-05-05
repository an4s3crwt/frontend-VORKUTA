import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice'; // Importamos el reducer de autenticación

// Creamos la tienda de Redux usando configureStore
const store = configureStore({
  reducer: {
    auth: authReducer, // Reducer de autenticación
  },
});

export default store;
