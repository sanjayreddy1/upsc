import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { getEvaluationHistory, getMCQHistory } from '../../hooks/useEvaluation';

export default function EvaluationHistory() {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState('all');
  const [essayHistory, setEssayHistory] = useState([]);
  const [mcqHistory, setMcqHistory] = useState([]);
  const [cloudHistory, setCloudHistory] = useState([]);
  const [selectedReview, setSelectedReview] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);

      // Fetch from localStorage
      setEssayHistory(getEvaluationHistory('essay'));
      setMcqHistory(getMCQHistory());

      // Fetch from cloud if logged in
      if (token) {
        try {
          const res = await fetch('/api/user/evaluations', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            setCloudHistory(data);
          }
        } catch (e) {
          console.warn('Failed to fetch cloud history:', e);
        }
      }

      setLoading(false);
    };

    fetchHistory();
    window.addEventListener('historyUpdated', fetchHistory);
    return () => window.removeEventListener('historyUpdated', fetchHistory);
  }, [token]);

  // Merge cloud and local data, preferring cloud
  const allHistory = (() => {
    const items = [];

    // Cloud evaluations
    cloudHistory.forEach(e => {
      items.push({
        id: `cloud-${e.id}`,
        type: e.test_type,
        score: e.test_type === 'mcq' ? (e.details?.percentage || e.score) : e.score,
        total: e.total,
        correct: e.details?.correct,
        incorrect: e.details?.incorrect,
        date: e.created_at,
        question: e.details?.question,
        paper: e.details?.paper,
        results: e.details?.results || [],
        source: 'cloud',
      });
    });

    // If no cloud data, use local data
    if (cloudHistory.length === 0) {
      essayHistory.forEach((h, i) => {
        items.push({
          id: `local-essay-${i}`,
          type: 'essay',
          score: h.score,
          total: 100,
          date: h.date,
          question: h.question,
          paper: h.paper,
          results: [],
          source: 'local',
        });
      });

      mcqHistory.forEach((h, i) => {
        items.push({
          id: `local-mcq-${i}`,
          type: 'mcq',
          score: h.score,
          total: h.total,
          correct: h.correct,
          incorrect: h.incorrect,
          date: h.date,
          results: h.results || [],
          source: 'local',
        });
      });
    }

    // Sort by date descending
    items.sort((a, b) => new Date(b.date) - new Date(a.date));
    return items;
  })();

  const filteredHistory = activeTab === 'all' ? allHistory
    : activeTab === 'essay' ? allHistory.filter(h => h.type === 'essay')
    : allHistory.filter(h => h.type === 'mcq');

  const totalEssays = allHistory.filter(h => h.type === 'essay').length;
  const totalMCQs = allHistory.filter(h => h.type === 'mcq').length;
  const avgEssayScore = totalEssays > 0
    ? Math.round(allHistory.filter(h => h.type === 'essay').reduce((sum, h) => sum + h.score, 0) / totalEssays)
    : 0;
  const avgMCQScore = totalMCQs > 0
    ? Math.round(allHistory.filter(h => h.type === 'mcq').reduce((sum, h) => sum + h.score, 0) / totalMCQs)
    : 0;

  if (loading) {
    return <div className="flex-center" style={{ height: '50vh' }}>Loading evaluation history...</div>;
  }

  return (
    <div className="animate-fade-in" style={{ padding: '20px' }}>
      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div className="glass-card" style={{ padding: '20px', textAlign: 'center', borderTop: '3px solid var(--accent-blue)' }}>
          <div style={{ fontSize: '2rem', fontWeight: 800 }}>{allHistory.length}</div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Total Evaluations</div>
        </div>
        <div className="glass-card" style={{ padding: '20px', textAlign: 'center', borderTop: '3px solid var(--accent-violet)' }}>
          <div style={{ fontSize: '2rem', fontWeight: 800 }}>{totalEssays}</div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Essay Evaluations</div>
        </div>
        <div className="glass-card" style={{ padding: '20px', textAlign: 'center', borderTop: '3px solid var(--accent-emerald)' }}>
          <div style={{ fontSize: '2rem', fontWeight: 800 }}>{totalMCQs}</div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>MCQ Sessions</div>
        </div>
        <div className="glass-card" style={{ padding: '20px', textAlign: 'center', borderTop: '3px solid var(--accent-amber)' }}>
          <div style={{ fontSize: '2rem', fontWeight: 800 }}>{avgEssayScore}%</div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Avg Essay Score</div>
        </div>
        <div className="glass-card" style={{ padding: '20px', textAlign: 'center', borderTop: '3px solid var(--accent-cyan)' }}>
          <div style={{ fontSize: '2rem', fontWeight: 800 }}>{avgMCQScore}%</div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Avg MCQ Score</div>
        </div>
      </div>

      {/* Tab Filters */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <button
          className={`btn ${activeTab === 'all' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setActiveTab('all')}
        >
          All ({allHistory.length})
        </button>
        <button
          className={`btn ${activeTab === 'essay' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setActiveTab('essay')}
        >
          📝 Essays ({totalEssays})
        </button>
        <button
          className={`btn ${activeTab === 'mcq' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setActiveTab('mcq')}
        >
          🎯 MCQs ({totalMCQs})
        </button>
      </div>

      {/* History List */}
      <div className="glass-card" style={{ overflow: 'hidden' }}>
        {filteredHistory.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📭</div>
            <h3 style={{ marginBottom: '8px' }}>No evaluations yet</h3>
            <p>Start practicing to see your history here!</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <th style={{ padding: '15px' }}>#</th>
                <th style={{ padding: '15px' }}>Type</th>
                <th style={{ padding: '15px' }}>Score</th>
                <th style={{ padding: '15px' }}>Details</th>
                <th style={{ padding: '15px' }}>Date</th>
                <th style={{ padding: '15px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredHistory.map((h, idx) => (
                <tr key={h.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '15px', color: 'var(--text-muted)' }}>{idx + 1}</td>
                  <td style={{ padding: '15px' }}>
                    <span style={{
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      background: h.type === 'essay' ? 'rgba(102, 126, 234, 0.15)' : 'rgba(52, 211, 153, 0.15)',
                      color: h.type === 'essay' ? 'var(--accent-blue)' : 'var(--accent-emerald)',
                      whiteSpace: 'nowrap'
                    }}>
                      {h.type === 'essay' ? '📝 ESSAY' : '🎯 MCQ'}
                    </span>
                  </td>
                  <td style={{ padding: '15px' }}>
                    <span style={{
                      fontWeight: 700,
                      fontSize: '1.1rem',
                      color: h.score >= 70 ? 'var(--accent-emerald)' : h.score >= 40 ? 'var(--accent-amber)' : 'var(--accent-rose)'
                    }}>
                      {h.score}%
                    </span>
                  </td>
                  <td style={{ padding: '15px', color: 'var(--text-secondary)', maxWidth: '300px' }}>
                    {h.type === 'essay' ? (
                      <span style={{ fontSize: '0.9rem' }}>{h.question ? h.question.substring(0, 80) + '...' : h.paper || 'Essay evaluation'}</span>
                    ) : (
                      <span style={{ fontSize: '0.9rem' }}>
                        ✅ {h.correct || 0} correct · ❌ {h.incorrect || 0} wrong · Total: {h.total || 0}
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '15px', color: 'var(--text-secondary)', whiteSpace: 'nowrap', fontSize: '0.9rem' }}>
                    {new Date(h.date).toLocaleDateString('en-IN', {
                      day: '2-digit', month: 'short', year: 'numeric',
                      hour: '2-digit', minute: '2-digit'
                    })}
                  </td>
                  <td style={{ padding: '15px' }}>
                    {h.type === 'mcq' && h.results && h.results.length > 0 && (
                      <button
                        className="btn btn-outline btn-sm"
                        onClick={() => setSelectedReview(h)}
                        style={{ whiteSpace: 'nowrap' }}
                      >
                        📖 Review
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Review Modal — shows corrected MCQ questions */}
      {selectedReview && (
        <div className="evaluation-overlay animate-fade-in" style={{ zIndex: 2000 }}>
          <div className="eval-action-bar">
            <h3 style={{ color: 'white', margin: 0 }}>
              📝 Review: {selectedReview.correct}/{selectedReview.total} Correct ({selectedReview.score}%)
            </h3>
            <button className="btn btn-icon btn-secondary" onClick={() => setSelectedReview(null)}>✕</button>
          </div>
          <div style={{ padding: '80px 20px 40px', maxWidth: '800px', margin: '0 auto', maxHeight: '100vh', overflowY: 'auto' }}>
            {selectedReview.results.map((q, idx) => (
              <div key={idx} className="glass-card" style={{
                padding: '20px', marginBottom: '16px',
                borderLeft: `4px solid ${q.isCorrect ? 'var(--accent-emerald)' : 'var(--accent-rose)'}`
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontWeight: 700 }}>Q{idx + 1}</span>
                  <span className={`badge ${q.isCorrect ? 'badge-success' : q.status === 'unanswered' ? 'badge-info' : 'badge-danger'}`}>
                    {q.isCorrect ? '✓ Correct' : q.status === 'unanswered' ? 'Skipped' : '✗ Wrong'}
                  </span>
                </div>
                <p style={{ fontWeight: 600, marginBottom: '12px' }}>{q.question}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {Object.entries(q.options || {}).map(([key, val]) => {
                    let bg = 'transparent';
                    let border = '1px solid var(--border-color)';
                    if (key === q.correct) { bg = 'rgba(67, 233, 123, 0.15)'; border = '1px solid var(--accent-emerald)'; }
                    else if (key === q.userAnswer && key !== q.correct) { bg = 'rgba(250, 112, 154, 0.15)'; border = '1px solid var(--accent-rose)'; }
                    return (
                      <div key={key} style={{ padding: '8px 14px', borderRadius: '8px', background: bg, border, display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <strong>{key}.</strong> <span>{val}</span>
                        {key === q.correct && <span style={{ marginLeft: 'auto' }}>✓</span>}
                        {key === q.userAnswer && key !== q.correct && <span style={{ marginLeft: 'auto', color: 'var(--accent-rose)' }}>✗ Your answer</span>}
                      </div>
                    );
                  })}
                </div>
                {q.explanation && (
                  <div style={{ marginTop: '12px', padding: '12px', borderRadius: '8px', background: 'rgba(102, 126, 234, 0.1)' }}>
                    <strong>💡 Explanation:</strong> {q.explanation}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
