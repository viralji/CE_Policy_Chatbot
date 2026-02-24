import React from 'react';
import ReactDOM from 'react-dom/client';
import { MsalProvider } from '@azure/msal-react';
import { PublicClientApplication } from '@azure/msal-browser';
import { msalConfig } from './authConfig';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

const msalInstance = new PublicClientApplication(msalConfig);

msalInstance.initialize().then(() => {
  // Process redirect when user returns from Microsoft login (required for SPA)
  return msalInstance.handleRedirectPromise();
}).then(() => {
  const root = ReactDOM.createRoot(
    document.getElementById('root') as HTMLElement
  );
  root.render(
    <React.StrictMode>
      <MsalProvider instance={msalInstance}>
        <App />
      </MsalProvider>
    </React.StrictMode>
  );
  reportWebVitals();
});
