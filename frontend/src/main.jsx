import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { Toaster } from 'react-hot-toast';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { UiPreferencesProvider } from './context/UiPreferencesContext';
import './index.css';

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

const tree = (
  <React.StrictMode>
    <BrowserRouter>
      {googleClientId ? (
        <GoogleOAuthProvider clientId={googleClientId}>
          <UiPreferencesProvider>
            <AuthProvider>
              <App />
              <Toaster
                position="top-right"
                toastOptions={{ duration: 3000, className: 'dark:bg-slate-800 dark:text-slate-100' }}
              />
            </AuthProvider>
          </UiPreferencesProvider>
        </GoogleOAuthProvider>
      ) : (
        <UiPreferencesProvider>
          <AuthProvider>
            <App />
            <Toaster
              position="top-right"
              toastOptions={{ duration: 3000, className: 'dark:bg-slate-800 dark:text-slate-100' }}
            />
          </AuthProvider>
        </UiPreferencesProvider>
      )}
    </BrowserRouter>
  </React.StrictMode>
);

ReactDOM.createRoot(document.getElementById('root')).render(tree);
