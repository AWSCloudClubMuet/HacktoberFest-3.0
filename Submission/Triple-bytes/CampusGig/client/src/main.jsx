import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './i18n/index.js';
import './index.css';
import App from './App.jsx';
import { LangProvider } from './context/LangContext.jsx';
import { UserProvider } from './context/UserContext.jsx';
import { ToastProvider } from './context/ToastContext.jsx';

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <LangProvider>
      <ToastProvider>
        <UserProvider>
          <App />
        </UserProvider>
      </ToastProvider>
    </LangProvider>
  </BrowserRouter>,
);
