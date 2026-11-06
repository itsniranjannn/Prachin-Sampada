import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import 'maplibre-gl/dist/maplibre-gl.css';
import './styles/app.css';
import './styles/components.css';
import App from './App.jsx';
import { AuthProvider } from './lib/auth.jsx';
import { PrefsProvider } from './lib/prefs.jsx';
import { ToastProvider } from './lib/toast.jsx';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <PrefsProvider>
          <AuthProvider>
            <ToastProvider>
              <App />
            </ToastProvider>
          </AuthProvider>
        </PrefsProvider>
      </GoogleOAuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);

