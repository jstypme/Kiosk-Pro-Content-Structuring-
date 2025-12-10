import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './components/App';

// Robust polyfill for process.env in browser environments.
// This ensures process.env.API_KEY is available even if the bundler doesn't shim it automatically.
// We prioritize VITE_API_KEY as it is the standard for Vite applications.
const env = (import.meta as any).env || {};
const detectedKey = env.VITE_API_KEY || env.NEXT_PUBLIC_API_KEY || env.API_KEY || '';

if (typeof process === 'undefined') {
  (window as any).process = { env: {} };
}
// If process exists (e.g. from a partial shim) but env is missing
if (!(window as any).process.env) {
  (window as any).process.env = {};
}
// Assign the key if not already present
if (!(window as any).process.env.API_KEY) {
  (window as any).process.env.API_KEY = detectedKey;
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