import React, { useState, useEffect } from 'react';
import './Settings.css';

export default function Settings() {
  const [globalDifficulty, setGlobalDifficulty] = useState('hard');

  useEffect(() => {
    const saved = localStorage.getItem('global_difficulty');
    if (saved) setGlobalDifficulty(saved);
  }, []);

  const handleDifficultyChange = (val) => {
    setGlobalDifficulty(val);
    localStorage.setItem('global_difficulty', val);
    localStorage.setItem('daily_test_difficulty', val);
  };

  return (
    <div className="settings-container animate-fade-in">
      <div className="glass-card" style={{ padding: '30px', maxWidth: '600px', margin: '0 auto' }}>
        <h2 style={{ marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>
          ⚙️ Application Settings
        </h2>
        
        <div className="settings-group" style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '10px' }}>Global Question Difficulty</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '15px' }}>
            Set the default difficulty level for AI-generated questions across the app.
          </p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <button 
              className={`btn ${globalDifficulty === 'easy' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => handleDifficultyChange('easy')}
              style={{ textAlign: 'left', padding: '15px', height: 'auto', display: 'flex', flexDirection: 'column' }}
            >
              <span style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>Easy</span>
              <span style={{ fontSize: '0.9rem', opacity: 0.8, marginTop: '5px' }}>Generate straightforward concepts as they are.</span>
            </button>
            
            <button 
              className={`btn ${globalDifficulty === 'hard' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => handleDifficultyChange('hard')}
              style={{ textAlign: 'left', padding: '15px', height: 'auto', display: 'flex', flexDirection: 'column' }}
            >
              <span style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>Hard</span>
              <span style={{ fontSize: '0.9rem', opacity: 0.8, marginTop: '5px' }}>Generate questions that are harder with tricky nuances.</span>
            </button>
            
            <button 
              className={`btn ${globalDifficulty === 'hardcore' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => handleDifficultyChange('hardcore')}
              style={{ textAlign: 'left', padding: '15px', height: 'auto', display: 'flex', flexDirection: 'column', border: globalDifficulty === 'hardcore' ? '1px solid var(--accent-rose)' : undefined, background: globalDifficulty === 'hardcore' ? 'var(--accent-rose)' : undefined }}
            >
              <span style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>Hardcore</span>
              <span style={{ fontSize: '0.9rem', opacity: 0.8, marginTop: '5px' }}>Extreme difficulty. Multi-statement and deeply analytical.</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
