import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { PermissionProvider } from './components/PermissionContext';

const container = document.getElementById('root');
const root = createRoot(container);

// In development, ensure the admin app starts at the login page so
// the developer always sees the login screen first. This clears any
// existing `authToken` left in localStorage and navigates to `/admin/login`.
if (process.env.NODE_ENV === 'development') {
  try {
    if (window.location.pathname === '/admin' || window.location.pathname === '/admin/') {
      localStorage.removeItem('authToken');
      window.history.replaceState({}, '', '/admin/login');
    }
  } catch (e) {
    // ignore in environments where localStorage is unavailable
  }
}

root.render(
  <PermissionProvider>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </PermissionProvider>
);