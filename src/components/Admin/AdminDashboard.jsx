import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

export default function AdminDashboard() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modal states
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState('');

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/');
      return;
    }

    const fetchUsers = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/admin/users', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to fetch users');
        const data = await res.json();
        setUsers(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [user, token, navigate]);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:5000/api/admin/change-password', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ userId: selectedUserId, newPassword })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      
      setPasswordMsg('Password changed successfully');
      setNewPassword('');
      setTimeout(() => {
        setSelectedUserId(null);
        setPasswordMsg('');
      }, 2000);
    } catch (err) {
      setPasswordMsg(err.message);
    }
  };

  if (loading) return <div className="flex-center" style={{ height: '50vh' }}>Loading Admin Panel...</div>;

  return (
    <div className="admin-container animate-fade-in" style={{ padding: '20px' }}>
      <h2>👑 Admin Dashboard</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>Manage users and view their preparation metrics.</p>
      
      {error && <div className="error-banner">{error}</div>}

      <div className="glass-card" style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <th style={{ padding: '15px' }}>ID</th>
              <th style={{ padding: '15px' }}>Name</th>
              <th style={{ padding: '15px' }}>Email</th>
              <th style={{ padding: '15px' }}>Tests Taken</th>
              <th style={{ padding: '15px' }}>Avg Score</th>
              <th style={{ padding: '15px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '15px' }}>{u.id}</td>
                <td style={{ padding: '15px' }}>{u.name} {u.role === 'admin' ? '(Admin)' : ''}</td>
                <td style={{ padding: '15px' }}>{u.email}</td>
                <td style={{ padding: '15px' }}>{u.total_tests_taken || 0}</td>
                <td style={{ padding: '15px' }}>
                  {u.average_score_percentage ? parseFloat(u.average_score_percentage).toFixed(2) + '%' : 'N/A'}
                </td>
                <td style={{ padding: '15px' }}>
                  <button 
                    className="btn btn-sm btn-outline"
                    onClick={() => setSelectedUserId(u.id)}
                  >
                    Change Password
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedUserId && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="glass-card" style={{ padding: '30px', width: '400px' }}>
            <h3>Change User Password</h3>
            {passwordMsg && <p style={{ color: passwordMsg.includes('success') ? 'green' : 'red', margin: '10px 0' }}>{passwordMsg}</p>}
            <form onSubmit={handleChangePassword}>
              <input 
                type="password" 
                placeholder="New Password"
                className="input-field" 
                style={{ width: '100%', marginBottom: '15px' }}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Save</button>
                <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setSelectedUserId(null)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
