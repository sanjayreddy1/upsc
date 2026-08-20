import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

export default function AdminDashboard() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState('users');
  
  const [users, setUsers] = useState([]);
  const [tokens, setTokens] = useState([]);
  const [evaluations, setEvaluations] = useState([]);
  const [activity, setActivity] = useState([]);
  
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
        
        const [usersRes, tokensRes, evalsRes, activityRes] = await Promise.all([
          fetch('/api/admin/users', { headers }),
          fetch('/api/admin/tokens', { headers }),
          fetch('/api/admin/evaluations', { headers }),
          fetch('/api/admin/activity', { headers })
        ]);

        if (!usersRes.ok) {
          const txt = await usersRes.text().catch(() => '');
          throw new Error(`Failed to fetch users: ${usersRes.status} ${txt}`);
        }

        const usersData = await usersRes.json();
        const tokensData = tokensRes.ok ? await tokensRes.json() : [];
        const evalsData = evalsRes.ok ? await evalsRes.json() : [];
        const activityData = activityRes.ok ? await activityRes.json() : [];

        setUsers(usersData);
        setTokens(tokensData);
        setEvaluations(evalsData);
        setActivity(activityData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, token, navigate]);

  if (loading) return <div className="flex-center" style={{ height: '50vh' }}>Loading Admin Panel...</div>;

  // Compute stats
  const totalEssays = evaluations.filter(e => e.test_type === 'essay').length;
  const totalMCQs = evaluations.filter(e => e.test_type === 'mcq').length;
  const totalTokensUsed = tokens.reduce((sum, t) => sum + (t.tokens_used || 0), 0);

  return (
    <div className="admin-container animate-fade-in" style={{ padding: '20px' }}>
      <h2>👑 Admin Dashboard</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
        Complete system overview: Users, Evaluations, Token Usage, and Activity.
      </p>
      
      {error && <div className="error-banner">{error}</div>}

      {/* Quick Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginBottom: '24px' }}>
        <div className="glass-card" style={{ padding: '16px', textAlign: 'center', borderTop: '3px solid var(--accent-blue)' }}>
          <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>{users.length}</div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Total Users</div>
        </div>
        <div className="glass-card" style={{ padding: '16px', textAlign: 'center', borderTop: '3px solid var(--accent-violet)' }}>
          <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>{evaluations.length}</div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Evaluations</div>
        </div>
        <div className="glass-card" style={{ padding: '16px', textAlign: 'center', borderTop: '3px solid var(--accent-emerald)' }}>
          <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>{totalEssays}</div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Essays</div>
        </div>
        <div className="glass-card" style={{ padding: '16px', textAlign: 'center', borderTop: '3px solid var(--accent-amber)' }}>
          <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>{totalMCQs}</div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>MCQ Sessions</div>
        </div>
        <div className="glass-card" style={{ padding: '16px', textAlign: 'center', borderTop: '3px solid var(--accent-cyan)' }}>
          <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>{totalTokensUsed.toLocaleString()}</div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Tokens Used</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '25px', flexWrap: 'wrap' }}>
        <button 
          className={`btn ${activeTab === 'users' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setActiveTab('users')}
        >
          Users
        </button>
        <button 
          className={`btn ${activeTab === 'evaluations' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setActiveTab('evaluations')}
        >
          Evaluations
        </button>
        <button 
          className={`btn ${activeTab === 'tokens' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setActiveTab('tokens')}
        >
          Token Usage
        </button>
        <button 
          className={`btn ${activeTab === 'activity' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setActiveTab('activity')}
        >
          Activity Logs
        </button>
      </div>

      <div className="glass-card" style={{ overflowX: 'auto' }}>
        {/* Users Tab */}
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

        {/* Evaluations Tab — All users' scores */}
        {activeTab === 'evaluations' && (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <th style={{ padding: '15px' }}>ID</th>
                <th style={{ padding: '15px' }}>User</th>
                <th style={{ padding: '15px' }}>Type</th>
                <th style={{ padding: '15px' }}>Score</th>
                <th style={{ padding: '15px' }}>Details</th>
                <th style={{ padding: '15px' }}>Date</th>
              </tr>
            </thead>
            <tbody>
              {evaluations.map(e => {
                let details;
                try { details = typeof e.details === 'string' ? JSON.parse(e.details) : e.details; } catch { details = {}; }
                const percentage = e.test_type === 'mcq' ? (details?.percentage || Math.round((e.score / e.total) * 100)) : e.score;

                return (
                  <tr key={e.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '15px', color: 'var(--text-muted)' }}>{e.id}</td>
                    <td style={{ padding: '15px' }}>
                      <div style={{ fontWeight: 500 }}>{e.name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{e.email}</div>
                    </td>
                    <td style={{ padding: '15px' }}>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        background: e.test_type === 'essay' ? 'rgba(102, 126, 234, 0.15)' : 'rgba(52, 211, 153, 0.15)',
                        color: e.test_type === 'essay' ? 'var(--accent-blue)' : 'var(--accent-emerald)',
                        whiteSpace: 'nowrap'
                      }}>
                        {e.test_type === 'essay' ? '📝 ESSAY' : '🎯 MCQ'}
                      </span>
                    </td>
                    <td style={{ padding: '15px' }}>
                      <span style={{
                        fontWeight: 700,
                        fontSize: '1.1rem',
                        color: percentage >= 70 ? 'var(--accent-emerald)' : percentage >= 40 ? 'var(--accent-amber)' : 'var(--accent-rose)'
                      }}>
                        {percentage}%
                      </span>
                      {e.test_type === 'mcq' && (
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: '8px' }}>
                          ({Math.round(e.score)}/{e.total})
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '15px', color: 'var(--text-secondary)', maxWidth: '250px', fontSize: '0.85rem' }}>
                      {e.test_type === 'essay' ? (
                        details?.question ? details.question.substring(0, 60) + '...' : 'Essay evaluation'
                      ) : (
                        `✅ ${details?.correct || 0} · ❌ ${details?.incorrect || 0}`
                      )}
                    </td>
                    <td style={{ padding: '15px', color: 'var(--text-secondary)', whiteSpace: 'nowrap', fontSize: '0.85rem' }}>
                      {new Date(e.created_at).toLocaleString('en-IN', {
                        day: '2-digit', month: 'short', year: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                      })}
                    </td>
                  </tr>
                );
              })}
              {evaluations.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>No evaluations recorded yet</td>
                </tr>
              )}
            </tbody>
          </table>
        )}

        {/* Token Usage Tab */}
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

        {/* Activity Logs Tab */}
        {activeTab === 'activity' && (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <th style={{ padding: '15px' }}>ID</th>
                <th style={{ padding: '15px' }}>User</th>
                <th style={{ padding: '15px' }}>Action</th>
                <th style={{ padding: '15px' }}>Detail</th>
                <th style={{ padding: '15px' }}>IP</th>
                <th style={{ padding: '15px' }}>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {activity.map(a => {
                const actionColors = {
                  'LOGIN_SUCCESS': { bg: 'rgba(52, 211, 153, 0.15)', color: 'var(--accent-emerald)' },
                  'LOGIN_FAILED': { bg: 'rgba(244, 63, 94, 0.15)', color: 'var(--accent-rose)' },
                  'REGISTER': { bg: 'rgba(139, 92, 246, 0.15)', color: 'var(--accent-violet)' },
                  'SAVE_EVALUATION': { bg: 'rgba(56, 189, 248, 0.15)', color: 'var(--accent-blue)' },
                  'SAVE_FLASHCARD': { bg: 'rgba(251, 191, 36, 0.15)', color: 'var(--accent-amber)' },
                  'DELETE_FLASHCARD': { bg: 'rgba(244, 63, 94, 0.1)', color: 'var(--accent-rose)' },
                  'UPDATE_STREAK': { bg: 'rgba(52, 211, 153, 0.1)', color: 'var(--accent-emerald)' },
                  'UPDATE_PREFERENCES': { bg: 'rgba(148, 163, 184, 0.15)', color: 'var(--text-secondary)' },
                  'ADMIN_CHANGE_PASSWORD': { bg: 'rgba(244, 63, 94, 0.2)', color: 'var(--accent-rose)' },
                };
                const style = actionColors[a.action] || { bg: 'rgba(148, 163, 184, 0.1)', color: 'var(--text-secondary)' };
                return (
                  <tr key={a.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '15px' }}>{a.id}</td>
                    <td style={{ padding: '15px' }}>
                      <div style={{ fontWeight: 500 }}>{a.name || '—'}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{a.email || 'Unknown'}</div>
                    </td>
                    <td style={{ padding: '15px' }}>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        background: style.bg,
                        color: style.color,
                        whiteSpace: 'nowrap'
                      }}>
                        {a.action}
                      </span>
                    </td>
                    <td style={{ padding: '15px', color: 'var(--text-secondary)', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.detail || '—'}</td>
                    <td style={{ padding: '15px', fontSize: '0.85rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{a.ip_address || '—'}</td>
                    <td style={{ padding: '15px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{new Date(a.created_at).toLocaleString()}</td>
                  </tr>
                );
              })}
              {activity.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>No activity logs yet</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
