import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('auth_token'));
  const [loading, setLoading] = useState(true);

  const hydrateCloudData = async (jwtToken) => {
    try {
      const headers = { 'Authorization': `Bearer ${jwtToken}` };
      
      const evalRes = await fetch('/api/user/evaluations', { headers });
      if (evalRes.ok) {
        const evals = await evalRes.json();
        const mcq = evals.filter(e => e.test_type === 'mcq').map(e => ({
          score: e.details?.percentage || e.score,
          correct: e.details?.correct || 0,
          incorrect: e.details?.incorrect || 0,
          total: e.total,
          date: e.created_at,
          results: e.details?.results || []
        }));
        
        const essay = evals.filter(e => e.test_type === 'essay').map(e => ({
          score: e.score,
          date: e.created_at,
          question: e.details?.question?.substring(0, 100),
          paper: e.details?.paper
        }));
        
        localStorage.setItem('mcq_history', JSON.stringify(mcq.slice(0, 50)));
        localStorage.setItem('eval_history_essay', JSON.stringify(essay.slice(0, 50)));
        window.dispatchEvent(new Event('historyUpdated'));
      }

      const prefRes = await fetch('/api/user/preferences', { headers });
      if (prefRes.ok) {
        const { app_data } = await prefRes.json();
        const prefs = JSON.parse(app_data || '{}');
        Object.keys(prefs).forEach(key => {
          if (typeof prefs[key] === 'string') {
            localStorage.setItem(key, prefs[key]);
          } else {
            localStorage.setItem(key, JSON.stringify(prefs[key]));
          }
        });
      }
    } catch (err) {
      console.warn('Failed to hydrate cloud data:', err);
    }
  };

  const syncPreferences = async () => {
    if (!token) return;
    try {
      const keysToSync = ['custom_syllabus', 'global_difficulty', 'daily_test_difficulty'];
      const prefs = {};
      keysToSync.forEach(key => {
        const val = localStorage.getItem(key);
        if (val) prefs[key] = val;
      });

      await fetch('/api/user/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ app_data: prefs })
      });
    } catch (e) {
      console.warn('Failed to sync prefs', e);
    }
  };

  useEffect(() => {
    if (token) {
      localStorage.setItem('auth_token', token);
      const savedUser = localStorage.getItem('auth_user');
      if (savedUser) {
        setUser(JSON.parse(savedUser));
        hydrateCloudData(token);
      }
    } else {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      setUser(null);
    }
    setLoading(false);
  }, [token]);

  const login = async (jwtToken, userData) => {
    setToken(jwtToken);
    setUser(userData);
    localStorage.setItem('auth_user', JSON.stringify(userData));
    await hydrateCloudData(jwtToken);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.clear();
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading, syncPreferences }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
