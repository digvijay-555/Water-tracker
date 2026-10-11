import React from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { apiClient } from '../../services/apiClient.js';

export function Navbar({ theme, onToggleTheme, onResetDemo }) {
  const { currentUser, role, isAuthenticated, logout } = useAuth();
  const isMock = apiClient.isMockMode();

  const roleLabels = {
    resident: { label: 'Resident Portal', icon: '🏠', color: '#0284c7' },
    operator: { label: 'Operator Dispatch', icon: '🚚', color: '#059669' },
    admin: { label: 'Municipal Admin', icon: '🛡️', color: '#7c3aed' },
  };

  const currentRoleInfo = role ? roleLabels[role] : null;

  return (
    <header className="site-header">
      <div className="header-inner">
        {/* Brand Group */}
        <div className="brand-group">
          <div className="brand-logo">
            <span className="drop-icon">💧</span>
          </div>
          <div>
            <div className="brand-name">
              Water Tracker
            </div>
            <div className="brand-subtitle">Smart Water Tanker &amp; GPS Dispatch</div>
          </div>
        </div>

        {/* Current Active Role Badge (Locked to authenticated user) */}
        {isAuthenticated && currentRoleInfo && (
          <div className="active-role-indicator">
            <span className="role-icon">{currentRoleInfo.icon}</span>
            <span className="role-name">{currentRoleInfo.label}</span>
          </div>
        )}

        {/* Right Actions: Theme Toggle, Store Pill, User Profile, Sign Out */}
        <div className="header-actions">
          {/* Dark Mode Toggle */}
          <button
            type="button"
            className="theme-toggle-btn"
            onClick={onToggleTheme}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle dark mode"
            id="btn-toggle-theme"
          >
            {theme === 'dark' ? '☀️' : '🌙'}
            <span className="theme-toggle-text">{theme === 'dark' ? 'Light' : 'Dark'}</span>
          </button>

          {/* Data Mode Pill */}
          <div
            className="mode-pill"
            title={isMock ? 'Running on browser state store' : 'Connected to live HTTP backend'}
          >
            <span className="dot" style={{ backgroundColor: isMock ? '#10b981' : '#3b82f6' }} />
            <span>{isMock ? 'Mock Store' : 'API Live'}</span>
          </div>

          {/* Reset Demo Button */}
          <button
            type="button"
            className="btn-reset-demo"
            onClick={onResetDemo}
            title="Reset demonstration records to baseline"
            id="btn-reset-demo-header"
          >
            🔄 Reset
          </button>

          {/* User Profile Pill or Sign Out */}
          {isAuthenticated && (
            <div className="user-profile-menu">
              <div className="user-avatar" title={currentUser.email}>
                {currentUser.avatarText || 'U'}
              </div>
              <div className="user-details-mini">
                <span className="user-name-mini">{currentUser.name}</span>
                <span className="user-role-mini">{currentUser.tagline || currentRoleInfo?.label}</span>
              </div>
              <button
                type="button"
                className="btn-logout"
                onClick={logout}
                title="Sign out of current account"
                id="btn-signout"
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Navbar;
