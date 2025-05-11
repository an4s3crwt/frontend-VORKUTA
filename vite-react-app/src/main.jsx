import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

import './output.css';

import { Provider } from 'react-redux';
import { AuthProvider } from './context/AuthContext';
import store from './redux/store';
import { BrowserRouter } from 'react-router-dom';
import api from './../src/api';

// Time synchronization function
const syncTimeWithServer = async () => {
  try {
    const response = await api.get('/api/server-time');
    const serverTime = new Date(response.data.server_time);
    const diff = Math.abs(serverTime - new Date());

    if (diff > 30000) { // 30-second threshold
      console.warn('Clock skew detected:', diff + 'ms');
      // Optional: Show warning to user
      alert('Warning: Your device clock is out of sync. Some features may not work properly.');
    }
  } catch (error) {
    console.error('Time sync failed:', error);
    // Continue with app initialization even if sync fails
  }
};

// Create root element
const container = document.getElementById('root');
const root = createRoot(container);

// First sync time, then render app
syncTimeWithServer().finally(() => {
  root.render(
    <React.StrictMode>
      <BrowserRouter>
        <Provider store={store}>
          <AuthProvider>
            <App />
          </AuthProvider>
        </Provider>
      </BrowserRouter>
    </React.StrictMode>
  );
});