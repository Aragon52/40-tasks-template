import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { initPWAUpdatePrompt } from './utils/updatePrompt.ts';

document.title = 'Order Picking Platform';

// Register service worker
initPWAUpdatePrompt();

const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}
