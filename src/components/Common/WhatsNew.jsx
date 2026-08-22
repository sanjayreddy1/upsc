import { useState, useEffect } from 'react';
import './WhatsNew.css';

// ── Update this for each deployment ──────────────────────────────────
const CURRENT_VERSION = '2.4.0';
const CHANGELOG = [
  {
    version: '2.4.0',
    date: '22 Aug 2026',
    title: "What's New 🎉",
    changes: [
      '✅ Fixed MCQ evaluation — scores now display correctly on first try',
      '✅ Accurate marks display (e.g., 12.68/20 instead of percentage)',
      '📊 History page now opens full evaluation with question review',
      '⚡ Faster & more reliable question generation (auto-retry on failure)',
      '🎯 Dynamic token scaling — generates 10-250 questions without truncation',
      '⚙️ Settings difficulty now applies globally to all question generators',
      '🛡️ App no longer crashes on errors — shows recovery UI instead',
      '🔗 Share button creates unique evaluation links',
    ],
  },
];

export default function WhatsNew() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const lastSeen = localStorage.getItem('whats_new_version');
    if (lastSeen !== CURRENT_VERSION) {
      // Show after a small delay so the page loads first
      const timer = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem('whats_new_version', CURRENT_VERSION);
    setVisible(false);
  };

  if (!visible) return null;

  const current = CHANGELOG[0];

  return (
    <div className="whats-new-overlay" onClick={handleClose}>
      <div className="whats-new-panel animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <button className="whats-new-close" onClick={handleClose} aria-label="Close">
          ✕
        </button>

        <div className="whats-new-header">
          <span className="whats-new-badge">v{current.version}</span>
          <h2>{current.title}</h2>
          <span className="whats-new-date">{current.date}</span>
        </div>

        <ul className="whats-new-list">
          {current.changes.map((change, i) => (
            <li key={i} className="whats-new-item" style={{ animationDelay: `${i * 0.06}s` }}>
              {change}
            </li>
          ))}
        </ul>

        <button className="btn btn-primary whats-new-got-it" onClick={handleClose}>
          Got it!
        </button>
      </div>
    </div>
  );
}

// ── Helper to update changelog for future versions ──
// Just update CURRENT_VERSION and add a new entry to the top of CHANGELOG array.
// The popup will automatically show once per version.
