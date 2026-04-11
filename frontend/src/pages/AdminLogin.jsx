import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, User, ShieldCheck, ArrowLeft } from 'lucide-react';
import logo from '../assets/logo.png';

export default function AdminLogin() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Login failed.');
        setLoading(false);
        return;
      }
      localStorage.setItem('admin_token', data.token);
      localStorage.setItem('admin_username', data.username);
      navigate('/admin');
    } catch (err) {
      setError('Could not connect to server. Make sure the backend is running.');
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#ffffff',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Yellow Top Bar */}
      <div className="brand-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button onClick={() => navigate('/')} style={{ background: 'rgba(0,0,0,0.1)', border: 'none', borderRadius: '6px', padding: '0.4rem 0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600, fontSize: '0.875rem' }}>
            <ArrowLeft size={16} /> Back
          </button>
          <img src={logo} alt="Mightee Mart" style={{ height: '56px', borderRadius: '6px' }} />
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#CC1111', lineHeight: 1 }}>Mightee Mart</div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#1a9c3e', letterSpacing: '0.05em' }}>YOUR 24/7 GROCERY STORE</div>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        background: 'linear-gradient(135deg, #fff9e6 0%, #fff1f1 50%, #f0fdf4 100%)'
      }}>
        <div style={{ width: '100%', maxWidth: '440px' }}>

          {/* Card */}
          <div style={{
            background: 'white',
            borderRadius: '16px',
            boxShadow: '0 8px 40px rgba(0,0,0,0.12)',
            overflow: 'hidden',
            border: '1px solid #e5e7eb'
          }}>
            {/* Card Header */}
            <div style={{
              background: 'linear-gradient(135deg, #CC1111 0%, #990d0d 100%)',
              padding: '2rem',
              textAlign: 'center'
            }}>
              <div style={{
                width: '64px',
                height: '64px',
                background: 'rgba(255,255,255,0.15)',
                borderRadius: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem'
              }}>
                <ShieldCheck size={32} color="white" />
              </div>
              <h2 style={{ color: 'white', fontSize: '1.375rem', fontWeight: 700, marginBottom: '0.25rem' }}>Admin Portal</h2>
              <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.875rem' }}>Secure access to store management</p>
            </div>

            {/* Form */}
            <div style={{ padding: '2rem' }}>
              <form onSubmit={handleLogin}>
                {/* Username */}
                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#374151', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Username</label>
                  <div style={{ position: 'relative' }}>
                    <User size={16} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                    <input
                      type="text"
                      value={username}
                      onChange={e => setUsername(e.target.value)}
                      required
                      placeholder="Enter username"
                      style={{
                        width: '100%',
                        padding: '0.75rem 1rem 0.75rem 2.6rem',
                        border: '1.5px solid #e5e7eb',
                        borderRadius: '8px',
                        fontSize: '0.9rem',
                        fontFamily: 'inherit',
                        outline: 'none',
                        transition: 'border-color 0.2s',
                        boxSizing: 'border-box'
                      }}
                      onFocus={e => e.target.style.borderColor = '#CC1111'}
                      onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                    />
                  </div>
                </div>

                {/* Password */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#374151', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Password</label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={16} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                      placeholder="Enter password"
                      style={{
                        width: '100%',
                        padding: '0.75rem 3rem 0.75rem 2.6rem',
                        border: '1.5px solid #e5e7eb',
                        borderRadius: '8px',
                        fontSize: '0.9rem',
                        fontFamily: 'inherit',
                        outline: 'none',
                        transition: 'border-color 0.2s',
                        boxSizing: 'border-box'
                      }}
                      onFocus={e => e.target.style.borderColor = '#CC1111'}
                      onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{ position: 'absolute', right: '0.875rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 0 }}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div style={{
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    borderRadius: '8px',
                    padding: '0.75rem 1rem',
                    color: '#CC1111',
                    fontSize: '0.875rem',
                    marginBottom: '1.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    ⚠ {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '0.875rem',
                    background: loading ? '#f87171' : '#CC1111',
                    border: 'none',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '1rem',
                    fontWeight: 700,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontFamily: 'inherit',
                    transition: 'background 0.2s',
                    boxShadow: loading ? 'none' : '0 4px 14px rgba(204,17,17,0.35)'
                  }}
                >
                  {loading ? 'Signing In...' : 'Sign In →'}
                </button>
              </form>

              {/* Hint */}
              <div style={{
                marginTop: '1.25rem',
                padding: '0.75rem 1rem',
                background: '#fffde7',
                border: '1px solid #FFD600',
                borderRadius: '8px',
                fontSize: '0.8rem',
                color: '#78350f',
                textAlign: 'center'
              }}>
                🔑 Default: <strong>admin</strong> / <strong>admin123</strong>
              </div>
            </div>
          </div>

          {/* Footer */}
          <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.78rem', color: '#9ca3af' }}>
            © 2026 Mightee Mart · Your 24/7 Grocery Store
          </p>
        </div>
      </div>
    </div>
  );
}
