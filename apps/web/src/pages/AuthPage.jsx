import React, { useState } from 'react';
import { useAuth, DEMO_ACCOUNTS } from '../context/AuthContext.jsx';

export function AuthPage() {
  const { login, loginWithDemo, register } = useAuth();
  const [activeTab, setActiveTab] = useState('login'); // 'login' | 'register'
  const [selectedRole, setSelectedRole] = useState('resident'); // 'resident' | 'operator' | 'admin'
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Form fields
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [locality, setLocality] = useState('Cidco Sector N-5');
  const [vehicleNumber, setVehicleNumber] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      if (activeTab === 'login') {
        if (!emailOrPhone.trim()) {
          throw new Error('Please enter your email or phone number.');
        }
        await login(emailOrPhone, password, selectedRole);
      } else {
        if (!fullName.trim()) {
          throw new Error('Please enter your full name.');
        }
        if (!emailOrPhone.trim()) {
          throw new Error('Please enter a valid email address.');
        }
        await register({
          name: fullName,
          email: emailOrPhone,
          role: selectedRole,
          password,
          locality,
          vehicleNumber,
        });
      }
    } catch (err) {
      setErrorMsg(err.message || 'Authentication failed. Please verify your details.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = (role) => {
    setErrorMsg('');
    loginWithDemo(role);
  };

  return (
    <div className="auth-page-container">
      <div className="auth-card-backdrop">
        {/* Brand Header */}
        <div className="auth-brand-header">
          <div className="auth-logo-badge">
            <span className="auth-logo-icon">💧</span>
          </div>
          <h1 className="auth-title">Water Tracker</h1>
          <p className="auth-subtitle">
            Smart Water Tanker Discovery, Booking &amp; Fleet GPS Tracking
          </p>
          <div className="auth-locality-tag">
            <span>📍 Chhatrapati Sambhajinagar, Maharashtra</span>
          </div>
        </div>

        {/* Quick Demo Access Bar */}
        <div className="quick-demo-section">
          <div className="quick-demo-title">
            <span>⚡ Instant One-Click Demo Access</span>
            <small>Explore any role immediately without passwords</small>
          </div>
          <div className="quick-demo-buttons">
            <button
              type="button"
              className="quick-demo-btn resident"
              onClick={() => handleDemoLogin('resident')}
              id="btn-demo-resident"
            >
              <span className="demo-btn-icon">🏠</span>
              <div className="demo-btn-text">
                <strong>Resident Portal</strong>
                <small>Find nearest tanker, request &amp; pool</small>
              </div>
            </button>

            <button
              type="button"
              className="quick-demo-btn operator"
              onClick={() => handleDemoLogin('operator')}
              id="btn-demo-operator"
            >
              <span className="demo-btn-icon">🚚</span>
              <div className="demo-btn-text">
                <strong>Operator Dispatch</strong>
                <small>Accept bookings &amp; simulate GPS</small>
              </div>
            </button>

            <button
              type="button"
              className="quick-demo-btn admin"
              onClick={() => handleDemoLogin('admin')}
              id="btn-demo-admin"
            >
              <span className="demo-btn-icon">🛡️</span>
              <div className="demo-btn-text">
                <strong>City Admin Console</strong>
                <small>Audit pricing &amp; shortage alerts</small>
              </div>
            </button>
          </div>
        </div>

        {/* Traditional Auth Form Box */}
        <div className="auth-form-card">
          <div className="auth-tabs-row">
            <button
              type="button"
              className={`auth-tab-btn ${activeTab === 'login' ? 'active' : ''}`}
              onClick={() => { setActiveTab('login'); setErrorMsg(''); }}
            >
              Sign In
            </button>
            <button
              type="button"
              className={`auth-tab-btn ${activeTab === 'register' ? 'active' : ''}`}
              onClick={() => { setActiveTab('register'); setErrorMsg(''); }}
            >
              Create Account
            </button>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            {errorMsg && (
              <div className="auth-error-banner" role="alert">
                <span>⚠️</span>
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Role Picker */}
            <div className="form-group">
              <label className="input-label">Select Your Role</label>
              <div className="role-selector-pills">
                <button
                  type="button"
                  className={`role-pill ${selectedRole === 'resident' ? 'active' : ''}`}
                  onClick={() => setSelectedRole('resident')}
                >
                  <span>🏠</span>
                  <span>Resident</span>
                </button>
                <button
                  type="button"
                  className={`role-pill ${selectedRole === 'operator' ? 'active' : ''}`}
                  onClick={() => setSelectedRole('operator')}
                >
                  <span>🚚</span>
                  <span>Tanker Operator</span>
                </button>
                <button
                  type="button"
                  className={`role-pill ${selectedRole === 'admin' ? 'active' : ''}`}
                  onClick={() => setSelectedRole('admin')}
                >
                  <span>🛡️</span>
                  <span>City Admin</span>
                </button>
              </div>
            </div>

            {/* Register specific fields */}
            {activeTab === 'register' && (
              <div className="form-group">
                <label className="input-label" htmlFor="auth-name">
                  Full Name
                </label>
                <input
                  id="auth-name"
                  type="text"
                  className="form-input"
                  placeholder={selectedRole === 'operator' ? 'e.g. Rajesh Patil' : 'e.g. Priya Sharma'}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
            )}

            <div className="form-group">
              <label className="input-label" htmlFor="auth-email">
                Email Address or Mobile Number
              </label>
              <input
                id="auth-email"
                type="text"
                className="form-input"
                placeholder={DEMO_ACCOUNTS[selectedRole]?.email || 'your-email@example.com'}
                value={emailOrPhone}
                onChange={(e) => setEmailOrPhone(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="input-label" htmlFor="auth-pass">
                Password
              </label>
              <input
                id="auth-pass"
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {activeTab === 'register' && selectedRole === 'resident' && (
              <div className="form-group">
                <label className="input-label" htmlFor="auth-locality">
                  Locality in Sambhajinagar
                </label>
                <select
                  id="auth-locality"
                  className="form-select"
                  value={locality}
                  onChange={(e) => setLocality(e.target.value)}
                >
                  <option value="Cidco Sector N-5">Cidco Sector N-5</option>
                  <option value="MGM Sports Complex Area">MGM Sports Complex Area</option>
                  <option value="Kranti Chowk Circle">Kranti Chowk Circle</option>
                  <option value="Garkheda Parisar">Garkheda Parisar</option>
                  <option value="Seven Hills / Jalna Road">Seven Hills / Jalna Road</option>
                  <option value="Waluj MIDC Industrial Area">Waluj MIDC Industrial Area</option>
                </select>
              </div>
            )}

            {activeTab === 'register' && selectedRole === 'operator' && (
              <div className="form-group">
                <label className="input-label" htmlFor="auth-vehicle">
                  Tanker Vehicle Reg. Number
                </label>
                <input
                  id="auth-vehicle"
                  type="text"
                  className="form-input"
                  placeholder="e.g. MH-20-DE-1234"
                  value={vehicleNumber}
                  onChange={(e) => setVehicleNumber(e.target.value)}
                />
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary btn-block auth-submit-btn"
              disabled={loading}
              id="btn-auth-submit"
            >
              {loading ? (
                'Signing In...'
              ) : activeTab === 'login' ? (
                `Sign In as ${selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)}`
              ) : (
                `Register as ${selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)}`
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default AuthPage;
