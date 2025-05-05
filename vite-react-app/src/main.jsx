import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css';
import './App.css';
import { Provider } from 'react-redux';

import { AuthProvider } from './context/AuthContext';
import store from './redux/store'; // Importamos la store
import { BrowserRouter } from 'react-router-dom';  // Importa BrowserRouter

// Create root element
const container = document.getElementById('root');
const root = createRoot(container);

// Render the app
root.render(
  <React.StrictMode>
    {/* Asegúrate de envolver la aplicación con BrowserRouter y AuthProvider */}
    <BrowserRouter>
      <Provider store={store}>
      <AuthProvider>
        <App />
        </AuthProvider>
      </Provider>

    </BrowserRouter>
  </React.StrictMode>
);
