import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import {BrowserRouter} from 'react-router';
import App from './App.tsx';
import ErrorBoundary from './components/ErrorBoundary';
import './index.css';

// After a redeploy, an open tab asks for chunk hashes that no longer exist.
// Reload once to pick up the new build instead of failing the navigation.
window.addEventListener('vite:preloadError', event => {
  try {
    const last = Number(sessionStorage.getItem('chunk-reload') || 0);
    if (Date.now() - last < 10_000) return;
    sessionStorage.setItem('chunk-reload', String(Date.now()));
  } catch {}
  event.preventDefault();
  window.location.reload();
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
);
