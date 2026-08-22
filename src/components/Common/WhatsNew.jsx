import { useState, useEffect } from 'react';
import './WhatsNew.css';



export default function WhatsNew() {
  const [visible, setVisible] = useState(false);
  const [config, setConfig] = useState(null);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await fetch('/api/user/whatsnew');
        if (res.ok) {
          const data = await res.json();
          if (data && data.version) {
            const lastSeen = localStorage.getItem('whats_new_version');
            if (lastSeen !== data.version) {
              setConfig(data);
              const timer = setTimeout(() => setVisible(true), 1500);
              return () => clearTimeout(timer);
            }
          }
        }
      } catch (err) {
        console.error('Failed to fetch whatsnew config', err);
      }
    };
    fetchConfig();
  }, []);

  const handleClose = () => {
    if (config?.version) {
      localStorage.setItem('whats_new_version', config.version);
    }
    setVisible(false);
  };

  if (!visible || !config) return null;

  const current = config;

  return (
    <div className="whats-new-overlay" onClick={handleClose}>
      <div className="whats-new-panel animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <button className="whats-new-close" onClick={handleClose} aria-label="Close">
          ✕
        </button>

        <div className="whats-new-header">
          <span className="whats-new-badge">v{current.version}</span>
          <h2>{current.title}</h2>
          <span className="whats-new-date">
            {current.date} {current.role && <span style={{ opacity: 0.8 }}>• Updated by {current.role}</span>}
          </span>
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
