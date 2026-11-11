import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './index.css';

// Nettoyage des données de démonstration conservées par les anciennes versions.
// Les sessions et les données métier du compte ne sont pas concernées.
try {
  localStorage.removeItem('pulse-marque-simulation-v1');
  localStorage.removeItem('pulse-demo');
  sessionStorage.removeItem('pulse-demo');
} catch { /* Le stockage peut être désactivé dans le navigateur. */ }

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
