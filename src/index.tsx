import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import SignInPage from './pages/SignInPage';
import AccountSettingsPage from './pages/AccountSettingsPage';
import PrivateRoute from './components/PrivateRoute';

// Simple routing based on URL path
const renderApp = () => {
  const root = document.getElementById('root');
  if (!root) return;

  const path = window.location.pathname;
  
  // For demo purposes, we'll create a simple layout with navigation
  if (path === '/account-settings' || path === '/account') {
    // Check if user is authenticated for protected routes
    ReactDOM.createRoot(root).render(
      <React.StrictMode>
        <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
          <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
            <h1>OSP Platform</h1>
            <nav>
              <a href="/" style={{ marginRight: '15px' }}>Home</a>
              <a href="/account-settings" style={{ marginRight: '15px' }}>Account</a>
              <button 
                onClick={() => {
                  localStorage.removeItem('token');
                  window.location.href = '/';
                }}
                style={{ backgroundColor: '#dc3545', color: 'white', border: 'none', padding: '8px 12px', borderRadius: '4px', cursor: 'pointer' }}
              >
                Sign Out
              </button>
            </nav>
          </header>
          <main>
            <PrivateRoute>
              <AccountSettingsPage />
            </PrivateRoute>
          </main>
        </div>
      </React.StrictMode>
    );
  } else if (path === '/' || path === '/signin') {
    // Show sign-in page for root path
    ReactDOM.createRoot(root).render(
      <React.StrictMode>
        <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
          <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
            <h1>OSP Platform</h1>
            <nav>
              <a href="/" style={{ marginRight: '15px' }}>Home</a>
              <a href="/account-settings">Account</a>
            </nav>
          </header>
          <main>
            <SignInPage />
          </main>
        </div>
      </React.StrictMode>
    );
  } else {
    // Redirect unknown routes to sign-in
    window.location.href = '/';
  }
};

// Initial render
renderApp();

// Listen for popstate events for client-side routing
window.addEventListener('popstate', renderApp);
