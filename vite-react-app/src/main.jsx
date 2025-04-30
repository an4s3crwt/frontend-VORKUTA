import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css';
import './App.css';
// Optional: Import for global state management if needed
// import { Provider } from 'react-redux';
// import store from './app/store';

// Create root element
const container = document.getElementById('root');
const root = createRoot(container);

// Render the app
root.render(
  <React.StrictMode>
    {/* Wrap with providers if needed (e.g., Redux, Theme) */}
    {/* <Provider store={store}> */}
      <App />
    {/* </Provider> */}
  </React.StrictMode>
);

// Optional: Performance monitoring
// if (process.env.NODE_ENV === 'development') {
//   import('./reportWebVitals').then(({ default: reportWebVitals }) => {
//     reportWebVitals(console.log);
//   });
// }