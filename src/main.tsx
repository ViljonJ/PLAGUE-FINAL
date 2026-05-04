import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import './index.css';

// Suppress benign Vite WebSocket connection errors when HMR is disabled
if (import.meta.env.DEV) {
  window.addEventListener('unhandledrejection', (event) => {
    if (typeof event.reason === 'string' && event.reason.includes('WebSocket')) {
      event.preventDefault();
    } else if (event.reason?.message?.includes('WebSocket')) {
      event.preventDefault();
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
