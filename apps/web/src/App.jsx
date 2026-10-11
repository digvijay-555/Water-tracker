import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { Navbar } from './components/shared/Navbar.jsx';
import { AuthPage } from './pages/AuthPage.jsx';
import { OperatorPage } from './pages/OperatorPage.jsx';
import { AdminPage } from './pages/AdminPage.jsx';
import { ResidentPage } from './pages/ResidentPage.jsx';
import { apiClient } from './services/apiClient.js';
import './styles/global.css';
import './styles/auth.css';
import './styles/operator.css';
import './styles/admin.css';
import './styles/resident.css';

function AppContent() {
  const { isAuthenticated, role } = useAuth();
  const [resetKey, setResetKey] = useState(0);

  // Theme Management (Light / Dark)
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('watertracker_theme') || 'light';
    } catch (e) {
      return 'light';
    }
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem('watertracker_theme', theme);
    } catch (e) {
      // ignore
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const handleResetDemo = () => {
    apiClient.resetDemo();
    setResetKey((prev) => prev + 1);
  };

  return (
    <div className="app-container" key={resetKey} data-theme={theme}>
      <Navbar
        theme={theme}
        onToggleTheme={toggleTheme}
        onResetDemo={handleResetDemo}
      />

      <main className="main-content">
        {!isAuthenticated ? (
          <AuthPage />
        ) : (
          <>
            {role === 'resident' && <ResidentPage />}
            {role === 'operator' && <OperatorPage />}
            {role === 'admin' && <AdminPage />}
          </>
        )}
      </main>

      <footer className="site-footer">
        <div className="footer-inner">
          <div className="footer-brand-line">
            <strong>Water Tracker</strong> &bull; On-Demand Water-Tanker Discovery, Booking &amp; Fleet GPS Dispatch
          </div>
          <div className="footer-city-line">
            Real-time community water coordination platform for Chhatrapati Sambhajinagar (Aurangabad), Maharashtra.
          </div>
        </div>
      </footer>
    </div>
  );
}

export function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
