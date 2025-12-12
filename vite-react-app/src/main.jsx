import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

// Estilos globales generados por Tailwind
import './output.css';

// --- ARQUITECTURA: PROVEEDORES DE ESTADO ---
import { Provider } from 'react-redux';       // Estado Global (Redux)
import { AuthProvider } from './context/AuthContext'; // Estado de Sesión (Context API)
import store from './redux/store';            // La "Base de Datos" del Frontend
import { BrowserRouter } from 'react-router-dom'; // Sistema de Enrutamiento (LAS urlss))
import api from './../src/api';

// =============================================================================
// FUNCIÓN: SINCRONIZACIÓN TEMPORAL 
// -----------------------------------------------------------------------------
// Antes de cargar la aplicación, verificamos si el reloj del dispositivo del usuario
// está sincronizado con el servidor.
//
// 1. Seguridad (JWT): Los tokens de sesión caducan. Si el reloj del PC está mal,
//    el token parecerá caducado al instante y el login fallará.
// 2. Datos de Vuelos: Mostramos tiempos en tiempo real. Un desajuste haría que
//    los vuelos parezcan retrasados o futuros erróneamente.
// =============================================================================
const syncTimeWithServer = async () => {
  try {
    // Pedimos la hora oficial al backend
    const response = await api.get('/server-time');
    const serverTime = new Date(response.data.server_time);
    
    // Calculamos la diferencia
    const diff = Math.abs(serverTime - new Date());

    // UMBRAL DE TOLERANCIA: 30 Segundos
   
    if (diff > 30000) { 
      console.warn('Clock skew detected:', diff + 'ms');
      // Alerta para el userr: Avisamos al usuario de que su PC tiene la hora mal.
      alert('Warning: Your device clock is out of sync. Some features may not work properly.');
    }
  } catch (error) {

    // Si falla la comprobación (ej: servidor caído), solo lo logueamos.
    // No bloqueamos la app porque queremos que funcione aunque sea con el servidor caído
    console.error('Time sync failed:', error);
  }
};

// =============================================================================
// INICIALIZACIÓN DEL DOM 
// =============================================================================
const container = document.getElementById('root');
const root = createRoot(container); 

// =============================================================================
// ARRANQUE DE LA APLICACIÓN
// =============================================================================
// Ejecutamos la sincronización PRIMERO.
// Usamos .finally() para asegurar que la app se renderiza SIEMPRE, 
// tanto si la sincronización tiene éxito como si falla con errores
syncTimeWithServer().finally(() => {
  
  root.render(
   
    <React.StrictMode>
      
      {/* CAPA 1: ROUTER
          Permite que la URL cambie sin recargar la página. */}
      <BrowserRouter>
        
        {/* CAPA 2: REDUX STORE
            Provee el estado global (datos de vuelos, preferencias) a toda la app. */}
        <Provider store={store}>
          
          {/* CAPA 3: AUTH CONTEXT
              Inyecta la información del usuario logueado. 
              Está dentro de Redux y Router para poder usarlos si los necesita. */}
          <AuthProvider>
            
            {/* EL NÚCLEO: Mi componente principal */}
            <App />
            
          </AuthProvider>
        </Provider>
      </BrowserRouter>
    </React.StrictMode>
  );
});