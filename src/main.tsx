import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import {BrowserRouter} from 'react-router';
import App from './App.tsx';
import ErrorBoundary from './components/ErrorBoundary';
import './index.css';

// Failed chunk loads are handled by whoever imported the chunk: route pages retry and
// then reload once (src/lib/lazyWithRetry.ts), and the 3D badge falls back to its static
// face. A global `vite:preloadError` reload here would override both.

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
);
