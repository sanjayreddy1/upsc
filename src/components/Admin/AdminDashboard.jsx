import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate, useLocation } from 'react-router-dom';
import EvaluationPanel from '../Evaluation/EvaluationPanel';

export default function AdminDashboard() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const initialTab = location.hash ? location.hash.replace('#', '') : 'users';
  const [activeTab, setActiveTab] = useState(initialTab);
  
  useEffect(() => {
    if (location.hash) {
      setActiveTab(location.hash.replace('#', ''));
    }
  }, [location.hash]);
  
  const [users, setUsers] = useState([]);
  const [tokens, setTokens] = useState([]);
  const [evaluations, setEvaluations] = useState([]);
  const [activity, setActivity] = useState([]);
  
  const [selectedReview, setSelectedReview] = useState(null);
  
  // What's New form state
  const [whatsNew, setWhatsNew] = useState({ version: '', date: '', title: '', changes: [''] });
  const [whatsNewLoading, setWhatsNewLoading] = useState(false);
  const [whatsNewMessage, setWhatsNewMessage] = useState('');

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
        
        const [usersRes, tokensRes, evalsRes, activityRes, whatsNewRes] = await Promise.all([
          fetch('/api/admin/users', { headers }),
          fetch('/api/admin/tokens', { headers }),
          fetch('/api/admin/evaluations', { headers }),
          fetch('/api/admin/activity', { headers }),
          fetch('/api/user/whatsnew') // public route
        ]);

        if (!usersRes.ok) {
          const txt = await usersRes.text().catch(() => '');
          throw new Error(`Failed to fetch users: ${usersRes.status} ${txt}`);
        }

        const usersData = await usersRes.json();
        const tokensData = tokensRes.ok ? await tokensRes.json() : [];
        const evalsData = evalsRes.ok ? await evalsRes.json() : [];
        const activityData = activityRes.ok ? await activityRes.json() : [];
        const whatsNewData = whatsNewRes.ok ? await whatsNewRes.json() : null;

        if (whatsNewData) {
          setWhatsNew(whatsNewData);
        }

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

  const handleUpdateWhatsNew = async (e) => {
    e.preventDefault();
    setWhatsNewLoading(true);
    setWhatsNewMessage('');
    try {
      const res = await fetch('/api/admin/whatsnew', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(whatsNew)
      });
      if (!res.ok) throw new Error('Failed to update Whats New');
      setWhatsNewMessage('✅ Broadcasted successfully to all users!');
      setTimeout(() => setWhatsNewMessage(''), 3000);
    } catch (err) {
      setWhatsNewMessage(`❌ Error: ${err.message}`);
    } finally {
      setWhatsNewLoading(false);
    }
  };

  const handleWhatsNewChangeChange = (index, value) => {
    const newChanges = [...whatsNew.changes];
    newChanges[index] = value;
    setWhatsNew({ ...whatsNew, changes: newChanges });
  };

  const addWhatsNewChange = () => {
    setWhatsNew({ ...whatsNew, changes: [...whatsNew.changes, ''] });
  };

  const removeWhatsNewChange = (index) => {
    const newChanges = whatsNew.changes.filter((_, i) => i !== index);
    setWhatsNew({ ...whatsNew, changes: newChanges });
  };

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
        <button 
          className={`btn ${activeTab === 'whatsnew' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setActiveTab('whatsnew')}
        >
          📢 What's New
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
                <th style={{ padding: '15px', textAlign: 'left', color: 'var(--text-muted)' }}>Score</th>
                <th style={{ padding: '15px', textAlign: 'left', color: 'var(--text-muted)' }}>Details</th>
                <th style={{ padding: '15px', textAlign: 'left', color: 'var(--text-muted)' }}>Date</th>
                <th style={{ padding: '15px', textAlign: 'left', color: 'var(--text-muted)' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {evaluations.map(e => {
                const details = typeof e.details === 'string' ? JSON.parse(e.details || '{}') : (e.details || {});
                const percentage = e.test_type === 'mcq' ? (details.percentage || 0) : e.score;

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
                    <td style={{ padding: '15px' }}>
                      <button 
                        className="btn btn-outline btn-sm"
                        onClick={() => setSelectedReview({
                          ...e,
                          ...details,
                          type: e.test_type,
                          score: percentage
                        })}
                      >
                        📖 Review
                      </button>
                    </td>
                  </tr>
                );
              })}
              {evaluations.length === 0 && (
                <tr>
                  <td colSpan="7" style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>No evaluations recorded yet</td>
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

        {/* What's New Tab */}
        {activeTab === 'whatsnew' && (
          <div style={{ padding: '24px', maxWidth: '600px' }}>
            <h3 style={{ marginBottom: '16px' }}>Update "What's New" Popup</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '0.9rem' }}>
              Updating this form will broadcast the new changelog to all users immediately. They will see the popup on their next refresh.
            </p>
            
            {whatsNewMessage && (
              <div style={{ padding: '12px', marginBottom: '20px', borderRadius: '8px', background: whatsNewMessage.includes('✅') ? 'rgba(52, 211, 153, 0.2)' : 'rgba(244, 63, 94, 0.2)', color: whatsNewMessage.includes('✅') ? 'var(--accent-emerald)' : 'var(--accent-rose)' }}>
                {whatsNewMessage}
              </div>
            )}

            <form onSubmit={handleUpdateWhatsNew} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Version (e.g., 2.5.0)</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    value={whatsNew.version} 
                    onChange={e => setWhatsNew({...whatsNew, version: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Date</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    value={whatsNew.date} 
                    onChange={e => setWhatsNew({...whatsNew, date: e.target.value})}
                    placeholder="e.g. 25 Aug 2026"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Title</label>
                <input 
                  type="text" 
                  className="input-field" 
                  value={whatsNew.title} 
                  onChange={e => setWhatsNew({...whatsNew, title: e.target.value})}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Changes (Bullet Points)</label>
                {whatsNew.changes.map((change, index) => (
                  <div key={index} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                    <input 
                      type="text" 
                      className="input-field" 
                      value={change} 
                      onChange={e => handleWhatsNewChangeChange(index, e.target.value)}
                      placeholder="e.g. ✅ Fixed a bug in evaluation"
                      required
                    />
                    <button type="button" className="btn btn-outline" style={{ padding: '0 12px' }} onClick={() => removeWhatsNewChange(index)}>✕</button>
                  </div>
                ))}
                <button type="button" className="btn btn-outline btn-sm" onClick={addWhatsNewChange} style={{ marginTop: '8px' }}>
                  + Add Point
                </button>
              </div>

              <div style={{ marginTop: '16px' }}>
                <button type="submit" className="btn btn-primary" disabled={whatsNewLoading}>
                  {whatsNewLoading ? 'Broadcasting...' : '📢 Broadcast Update to All Users'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Review Modal */}
      {selectedReview && (() => {
        if (selectedReview.type === 'mcq') {
          const c = selectedReview.correct || 0;
          const w = selectedReview.incorrect || 0;
          const computedRawScore = Math.round((c * 2 - w * 0.66) * 100) / 100;
          return (
            <EvaluationPanel 
              evaluation={{
                ...selectedReview,
                percentage: selectedReview.score,
                rawScore: computedRawScore,
                totalQuestions: selectedReview.total || 0,
              }} 
              onClose={() => setSelectedReview(null)} 
            />
          );
        } else {
          return (
            <EvaluationPanel 
              evaluation={{...selectedReview, percentage: selectedReview.score}} 
              onClose={() => setSelectedReview(null)} 
            />
          );
        }
      })()}
    </div>
  );
}
