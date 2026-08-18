import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export default function Register() {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [strength, setStrength] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const validatePasswordStrength = (pass) => {
    const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (pass.length === 0) return '';
    if (re.test(pass)) return 'Strong';
    if (pass.length >= 8) return 'Medium (Needs upper/lower/number/special)';
    return 'Weak';
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (name === 'password') {
      setStrength(validatePasswordStrength(value));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      const res = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      login(data.token, data.user);
      navigate('/');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="daily-test-container flex-center animate-fade-in">
      <div className="glass-card" style={{ padding: '40px', maxWidth: '400px', width: '100%' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Register</h2>
        {error && <div className="error-banner" style={{ marginBottom: '20px' }}>{error}</div>}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px' }}>Name</label>
            <input 
              type="text" name="name" value={formData.name} onChange={handleChange}
              className="input-field" style={{ width: '100%' }} required 
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '5px' }}>Email</label>
            <input 
              type="email" name="email" value={formData.email} onChange={handleChange}
              className="input-field" style={{ width: '100%' }} required 
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '5px' }}>Password</label>
            <input 
              type="password" name="password" value={formData.password} onChange={handleChange}
              className="input-field" style={{ width: '100%' }} required 
            />
            {strength && <small style={{ color: strength === 'Strong' ? 'green' : 'orange' }}>Strength: {strength}</small>}
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '5px' }}>Confirm Password</label>
            <input 
              type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange}
              className="input-field" style={{ width: '100%' }} required 
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ marginTop: '10px' }}>
            Register
          </button>
        </form>
        <p style={{ textAlign: 'center', marginTop: '20px' }}>
          Already have an account? <Link to="/login" style={{ color: 'var(--primary-color)' }}>Login here</Link>
        </p>
      </div>
    </div>
  );
}
