import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App';
import { captureLaunchKey } from './services/apiKey';
import './styles/index.css';

captureLaunchKey();
// Pasting the launch link into a tab already showing FileShuttle only changes the "#" part, without a reload.
window.addEventListener('hashchange', () => {
  if (captureLaunchKey()) window.location.reload();
});

const container = document.getElementById('root');
if (!container) throw new Error('Missing #root element');

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
