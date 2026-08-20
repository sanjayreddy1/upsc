import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Login failed');
      }

      login(data.token, data.user);
      navigate(data.user.role === 'admin' ? '/admin' : '/');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-container animate-fade-in" style={{
      position: 'fixed',
      inset: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      background: 'radial-gradient(circle at top center, var(--bg-secondary) 0%, var(--bg-primary) 100%)',
      zIndex: 1000,
      overflow: 'hidden'
    }}>
      {/* Background ambient glows */}
      <div style={{
        position: 'absolute',
        top: '20%',
        left: '20%',
        width: '400px',
        height: '400px',
        background: 'var(--accent-blue)',
        filter: 'blur(120px)',
        opacity: 0.12,
        borderRadius: '50%',
        zIndex: 0,
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute',
        bottom: '10%',
        right: '20%',
        width: '300px',
        height: '300px',
        background: 'var(--accent-violet)',
        filter: 'blur(100px)',
        opacity: 0.12,
        borderRadius: '50%',
        zIndex: 0,
        pointerEvents: 'none'
      }} />
      
      <div className="glass-card" style={{ 
        padding: '50px 40px', 
        maxWidth: '420px', 
        width: '100%',
        position: 'relative',
        zIndex: 1,
        borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--shadow-xl), var(--shadow-glow)',
        border: '1px solid var(--border-accent)',
        animation: 'float 6s ease-in-out infinite'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '35px' }}>
          <div style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            width: '56px', 
            height: '56px', 
            borderRadius: '16px', 
            background: 'var(--gradient-card)',
            border: '1px solid var(--border-accent)',
            marginBottom: '20px'
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="url(#paint0_linear)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <defs>
                <linearGradient id="paint0_linear" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
                  <stop stopColor="var(--accent-blue)" />
                  <stop offset="1" stopColor="var(--accent-violet)" />
                </linearGradient>
              </defs>
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
          <h2 className="gradient-text" style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '8px' }}>Welcome Back</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Enter your credentials to continue your UPSC journey</p>
        </div>

        {error && (
          <div className="error-banner animate-slide-up" style={{ 
            background: 'rgba(244, 63, 94, 0.1)', 
            color: 'var(--accent-rose)', 
            padding: '12px 16px', 
            borderRadius: 'var(--radius-sm)',
            marginBottom: '24px',
            fontSize: '0.9rem',
            border: '1px solid rgba(244, 63, 94, 0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <span style={{ fontWeight: 500 }}>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.3px' }}>Email Address</label>
            <div style={{ position: 'relative' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
              <input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)}
                className="input" 
                style={{ paddingLeft: '42px', height: '48px', fontSize: '0.95rem' }}
                placeholder="you@example.com"
                required 
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.3px' }}>Password</label>
            <div style={{ position: 'relative' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              <input 
                type={showPassword ? "text" : "password"}
                value={password} 
                onChange={(e) => setPassword(e.target.value)}
                className="input" 
                style={{ paddingLeft: '42px', paddingRight: '42px', height: '48px', fontSize: '0.95rem', fontFamily: showPassword ? 'inherit' : 'monospace', letterSpacing: showPassword ? 'normal' : '2px' }}
                placeholder="••••••••"
                required 
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0, display: 'flex' }}
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                )}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary btn-lg" 
            style={{ marginTop: '10px', height: '52px', fontWeight: 700, fontSize: '1rem', letterSpacing: '0.5px' }}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <span className="spinner" style={{ width: '22px', height: '22px', borderTopColor: '#fff', borderRightColor: 'rgba(255,255,255,0.3)', borderBottomColor: 'rgba(255,255,255,0.3)', borderLeftColor: 'rgba(255,255,255,0.3)' }} />
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '32px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: 'var(--accent-blue)', fontWeight: 600, textDecoration: 'none' }}>
            Create one now
          </Link>
        </div>
      </div>
    </div>
  );
}
