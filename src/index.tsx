import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './index.css';
import SignInPage from './pages/SignInPage';
import AccountSettingsPage from './pages/AccountSettingsPage';
import PrivateRoute from './components/PrivateRoute';
import MediaDetailPage from './pages/MediaDetailPage';

const App: React.FC = () => {
  return (
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
        <Routes>
          <Route path="/" element={<SignInPage />} />
          <Route
            path="/account-settings"
            element={
              <PrivateRoute>
                <AccountSettingsPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/media/:id"
            element={<MediaDetailPage />}
          />
          {/* Redirect unknown routes */}
          <Route path="*" element={<SignInPage />} />
        </Routes>
      </main>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
