import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import EvaluationPanel from './EvaluationPanel';

export default function SharedEvaluation() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [evaluation, setEvaluation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchEvaluation = async () => {
      try {
        const res = await fetch(`/api/share/${id}`);
        if (!res.ok) {
          throw new Error('Evaluation not found or link is invalid.');
        }
        const data = await res.json();
        setEvaluation(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchEvaluation();
  }, [id]);

  if (loading) {
    return (
      <div className="flex-center" style={{ height: '100vh', background: 'var(--bg-color)' }}>
        <div className="spinner"></div>
        <p style={{ marginLeft: '10px' }}>Loading shared evaluation...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-center" style={{ height: '100vh', background: 'var(--bg-color)', flexDirection: 'column', gap: '20px' }}>
        <div style={{ padding: '30px', background: 'rgba(255, 107, 107, 0.1)', color: '#ff6b6b', borderRadius: '12px', border: '1px solid rgba(255,107,107,0.3)', maxWidth: '400px', textAlign: 'center' }}>
          <h2>❌ Oops!</h2>
          <p style={{ marginTop: '10px' }}>{error}</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/')}>Go to Homepage</button>
      </div>
    );
  }

  // We wrap it in a container that forces it to take the full screen and hide everything else.
  // Because it's rendered in App.js within the standard layout (which has Header/Sidebar)? 
  // Wait, if it's in App.js inside <main>, the Header and Sidebar will still be there.
  // The plan requested "only the evaluation panel is visible".
  // To achieve this, we can use absolute positioning over the entire viewport to hide the layout.
  
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'var(--bg-color)',
      zIndex: 9999, // Render on top of everything
      overflowY: 'auto',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <div style={{ flex: 1 }}>
        <EvaluationPanel 
          evaluation={evaluation} 
          onClose={() => navigate('/')} 
          isSharedView={true} 
        />
      </div>
    </div>
  );
}
