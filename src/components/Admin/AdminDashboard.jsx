import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

export default function AdminDashboard() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState('users');
  
  const [users, setUsers] = useState([]);
  const [tokens, setTokens] = useState([]);
  const [logs, setLogs] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/');
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        const headers = { 'Authorization': `Bearer ${token}` };
        
        const [usersRes, tokensRes, logsRes] = await Promise.all([
          fetch('/api/admin/users', { headers }),
          fetch('/api/admin/tokens', { headers }),
          fetch('/api/admin/logs', { headers })
        ]);

        if (!usersRes.ok || !tokensRes.ok || !logsRes.ok) {
          const uTxt = await usersRes.text().catch(() => '');
          const tTxt = await tokensRes.text().catch(() => '');
          const lTxt = await logsRes.text().catch(() => '');
          throw new Error(`Failed to fetch admin data. Users: ${usersRes.status} ${uTxt} | Tokens: ${tokensRes.status} ${tTxt} | Logs: ${logsRes.status} ${lTxt}`);
        }

        const [usersData, tokensData, logsData] = await Promise.all([
          usersRes.json(),
          tokensRes.json(),
          logsRes.json()
        ]);

        setUsers(usersData);
        setTokens(tokensData);
        setLogs(logsData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, token, navigate]);

  if (loading) return <div className="flex-center" style={{ height: '50vh' }}>Loading Admin Panel...</div>;

  return (
    <div className="admin-container animate-fade-in" style={{ padding: '20px' }}>
      <h2>👑 Admin Dashboard</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
        Complete system overview: Users, Token Usage, and Logs.
      </p>
      
      {error && <div className="error-banner">{error}</div>}

      <div style={{ display: 'flex', gap: '15px', marginBottom: '25px' }}>
        <button 
          className={`btn ${activeTab === 'users' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setActiveTab('users')}
        >
          Users Details
        </button>
        <button 
          className={`btn ${activeTab === 'tokens' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setActiveTab('tokens')}
        >
          Token Usage
        </button>
        <button 
          className={`btn ${activeTab === 'logs' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setActiveTab('logs')}
        >
          System Logs
        </button>
      </div>

      <div className="glass-card" style={{ overflowX: 'auto' }}>
        {activeTab === 'users' && (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <th style={{ padding: '15px' }}>ID</th>
                <th style={{ padding: '15px' }}>Name</th>
                <th style={{ padding: '15px' }}>Email</th>
                <th style={{ padding: '15px' }}>Role</th>
                <th style={{ padding: '15px' }}>Joined At</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '15px' }}>{u.id}</td>
                  <td style={{ padding: '15px', fontWeight: 500 }}>{u.name}</td>
                  <td style={{ padding: '15px', color: 'var(--text-secondary)' }}>{u.email}</td>
                  <td style={{ padding: '15px' }}>
                    <span style={{ 
                      padding: '4px 8px', 
                      borderRadius: '4px', 
                      fontSize: '0.8rem',
                      background: u.role === 'admin' ? 'rgba(139, 92, 246, 0.2)' : 'rgba(56, 189, 248, 0.2)',
                      color: u.role === 'admin' ? 'var(--accent-violet)' : 'var(--accent-blue)'
                    }}>
                      {u.role.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: '15px' }}>{new Date(u.created_at).toLocaleString()}</td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>No users found</td>
                </tr>
              )}
            </tbody>
          </table>
        )}

        {activeTab === 'tokens' && (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <th style={{ padding: '15px' }}>ID</th>
                <th style={{ padding: '15px' }}>User Email</th>
                <th style={{ padding: '15px' }}>Action</th>
                <th style={{ padding: '15px' }}>Tokens Used</th>
                <th style={{ padding: '15px' }}>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {tokens.map(t => (
                <tr key={t.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '15px' }}>{t.id}</td>
                  <td style={{ padding: '15px' }}>{t.email}</td>
                  <td style={{ padding: '15px', color: 'var(--accent-emerald)' }}>{t.action}</td>
                  <td style={{ padding: '15px', fontWeight: 'bold' }}>{t.tokens_used.toLocaleString()}</td>
                  <td style={{ padding: '15px', color: 'var(--text-secondary)' }}>{new Date(t.created_at).toLocaleString()}</td>
                </tr>
              ))}
              {tokens.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>No token usage recorded yet</td>
                </tr>
              )}
            </tbody>
          </table>
        )}

        {activeTab === 'logs' && (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <th style={{ padding: '15px' }}>ID</th>
                <th style={{ padding: '15px' }}>Level</th>
                <th style={{ padding: '15px' }}>Message</th>
                <th style={{ padding: '15px' }}>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(l => (
                <tr key={l.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '15px' }}>{l.id}</td>
                  <td style={{ padding: '15px' }}>
                    <span style={{
                      color: l.level === 'error' ? 'var(--accent-rose)' : 'var(--accent-blue)',
                      fontWeight: 600
                    }}>
                      {l.level.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: '15px' }}>{l.message}</td>
                  <td style={{ padding: '15px', color: 'var(--text-secondary)' }}>{new Date(l.created_at).toLocaleString()}</td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan="4" style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>No system logs found</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
