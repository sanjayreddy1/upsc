import React, { useState, useEffect } from 'react';
import './Settings.css';

export default function Settings() {
  const [globalDifficulty, setGlobalDifficulty] = useState('hard');

  useEffect(() => {
    const saved = localStorage.getItem('global_difficulty');
    if (saved) setGlobalDifficulty(saved);
  }, []);

  const handleDifficultyChange = (e) => {
    const val = e.target.value;
    setGlobalDifficulty(val);
    localStorage.setItem('global_difficulty', val);
    // Optionally also update the daily_test_difficulty if you want them linked
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
          <select 
            value={globalDifficulty} 
            onChange={handleDifficultyChange}
            className="input-field"
            style={{ width: '100%', padding: '12px', borderRadius: '8px', backgroundColor: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            <option value="easy">Easy (Straightforward concepts)</option>
            <option value="hard">Hard (Tricky, nuanced distractors)</option>
            <option value="hardcore">Hardcore (Multi-statement, extreme difficulty)</option>
          </select>
        </div>
      </div>
    </div>
  );
}
