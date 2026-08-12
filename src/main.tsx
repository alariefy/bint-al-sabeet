import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import { App } from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';

/**
 * The service worker updates itself in the background. All game state is
 * written to local storage on every mutation, so an update never discards it.
 */
registerSW({ immediate: true });

const container = document.getElementById('root');
if (container) {
  createRoot(container).render(
    <StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </StrictMode>,
  );
}
