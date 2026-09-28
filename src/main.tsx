import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { MobileProvider } from './context/MobileContext.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MobileProvider>
      <App />
    </MobileProvider>
  </StrictMode>,
);
