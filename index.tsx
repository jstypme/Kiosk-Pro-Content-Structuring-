import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './components/App';

// Robust polyfill for process.env in browser environments.
const env = (import.meta as any).env || {};
const detectedKey = env.VITE_API_KEY || env.NEXT_PUBLIC_API_KEY || env.API_KEY || '';

if (typeof process === 'undefined') {
  (window as any).process = { env: {} };
}
if (!(window as any).process.env) {
  (window as any).process.env = {};
}
if (!(window as any).process.env.API_KEY) {
  (window as any).process.env.API_KEY = detectedKey;
}

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