import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './components/App';

// Simple polyfill for process.env in browser environments where it might be missing.
// This allows the use of process.env.API_KEY as per the guidelines without crashing in standard browser contexts.
if (typeof process === 'undefined') {
  (window as any).process = {
    env: {
      API_KEY: (import.meta as any).env?.VITE_API_KEY || (import.meta as any).env?.API_KEY || ''
    }
  };
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