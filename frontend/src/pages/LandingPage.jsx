import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User, ShieldCheck, Clock, Star } from 'lucide-react';
import logo from '../assets/logo.png';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#fff', display: 'flex', flexDirection: 'column' }}>
      {/* Brand Header */}
      <div className="brand-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <img src={logo} alt="Mightee Mart" style={{ height: '60px', borderRadius: '6px' }} />
          <div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#CC1111', lineHeight: 1 }}>Mightee Mart</div>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1a9c3e', letterSpacing: '0.06em' }}>YOUR 24/7 GROCERY STORE</div>
          </div>
        </div>
      </div>

      {/* Hero */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem 2rem', background: 'linear-gradient(160deg, #fffde7 0%, #fff1f1 40%, #f0fdf4 100%)' }}>
        <div style={{ width: '100%', maxWidth: '900px' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h1 style={{ fontSize: '2.5rem', color: '#CC1111', marginBottom: '0.75rem', fontWeight: 800 }}>
              Employee Attendance Portal
            </h1>
            <p style={{ fontSize: '1.1rem', color: '#6b7280', maxWidth: '500px', margin: '0 auto' }}>
              Track attendance, manage schedules, and monitor productivity — all in one place.
            </p>
          </div>

          <div className="grid grid-cols-2" style={{ gap: '1.5rem', maxWidth: '700px', margin: '0 auto' }}>
            {/* Employee Card */}
            <div style={{
              background: 'white', borderRadius: '16px', padding: '2.5rem 2rem',
              boxShadow: '0 4px 24px rgba(204,17,17,0.08)', border: '2px solid #e5e7eb',
              textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem',
              transition: 'border-color 0.2s', cursor: 'default'
            }}
              onMouseEnter={e => e.currentTarget.style.borderColor = '#CC1111'}
              onMouseLeave={e => e.currentTarget.style.borderColor = '#e5e7eb'}
            >
              <div style={{ background: '#fff1f1', padding: '1.25rem', borderRadius: '50%', color: '#CC1111' }}>
                <User size={44} />
              </div>
              <div>
                <h2 style={{ fontSize: '1.25rem', color: '#1a1a1a', marginBottom: '0.5rem' }}>Employee Portal</h2>
                <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>Check-in, check-out, and view your attendance records</p>
              </div>
              <button
                style={{ width: '100%', padding: '0.875rem', background: '#CC1111', color: 'white', border: 'none', borderRadius: '10px', fontSize: '1rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'background 0.2s', boxShadow: '0 4px 12px rgba(204,17,17,0.25)' }}
                onClick={() => navigate('/employee')}
                onMouseEnter={e => e.target.style.background = '#aa0e0e'}
                onMouseLeave={e => e.target.style.background = '#CC1111'}
              >
                Continue as Employee →
              </button>
            </div>

            {/* Admin Card */}
            <div style={{
              background: 'white', borderRadius: '16px', padding: '2.5rem 2rem',
              boxShadow: '0 4px 24px rgba(255,214,0,0.12)', border: '2px solid #e5e7eb',
              textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem',
              transition: 'border-color 0.2s', cursor: 'default'
            }}
              onMouseEnter={e => e.currentTarget.style.borderColor = '#FFD600'}
              onMouseLeave={e => e.currentTarget.style.borderColor = '#e5e7eb'}
            >
              <div style={{ background: '#fffde7', padding: '1.25rem', borderRadius: '50%', color: '#b45309' }}>
                <ShieldCheck size={44} />
              </div>
              <div>
                <h2 style={{ fontSize: '1.25rem', color: '#1a1a1a', marginBottom: '0.5rem' }}>Admin Portal</h2>
                <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>Monitor attendance, manage employees, and generate reports</p>
              </div>
              <button
                style={{ width: '100%', padding: '0.875rem', background: '#FFD600', color: '#1a1a1a', border: 'none', borderRadius: '10px', fontSize: '1rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'background 0.2s', boxShadow: '0 4px 12px rgba(255,214,0,0.35)' }}
                onClick={() => navigate('/admin-login')}
                onMouseEnter={e => e.target.style.background = '#e6c100'}
                onMouseLeave={e => e.target.style.background = '#FFD600'}
              >
                Continue as Admin →
              </button>
            </div>
          </div>

          <p style={{ textAlign: 'center', marginTop: '2.5rem', color: '#9ca3af', fontSize: '0.8rem' }}>
            © 2026 Mightee Mart Store · All rights reserved
          </p>
        </div>
      </div>
    </div>
  );
}


