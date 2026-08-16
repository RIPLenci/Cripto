import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { initViewportFixer } from './lib/deviceDetector';

// Initialize responsive viewport fixer for mobile & cross-browser support
if (typeof window !== 'undefined') {
  initViewportFixer();
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
