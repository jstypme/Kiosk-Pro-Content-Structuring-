import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './components/App';

// Robust polyfill for process.env in browser environments.
const env = (import.meta as any).env || {};

// Helper to resolve keys with various prefixes (VITE_, NEXT_PUBLIC_, or none)
const resolveKey = (suffix: string) => 
  env[`VITE_API_KEY${suffix}`] || 
  env[`NEXT_PUBLIC_API_KEY${suffix}`] || 
  env[`API_KEY${suffix}`] || 
  '';

// Detect up to 3 keys
const key1 = resolveKey('');
const key2 = resolveKey('_2');
const key3 = resolveKey('_3');

if (typeof process === 'undefined') {
  (window as any).process = { env: {} };
}
if (!(window as any).process.env) {
  (window as any).process.env = {};
}

// Polyfill keys into process.env if not already present
const pEnv = (window as any).process.env;
if (!pEnv.API_KEY) pEnv.API_KEY = key1;
if (!pEnv.API_KEY_2) pEnv.API_KEY_2 = key2;
if (!pEnv.API_KEY_3) pEnv.API_KEY_3 = key3;

// Service Worker Registration for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => {
        console.log('SW registered: ', registration);
      })
      .catch(registrationError => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);