import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useStreak } from '../../hooks/useStreak';
import { useAuth } from '../../hooks/useAuth';
import './Sidebar.css';

const NAV_ITEMS = [
  { path: '/', label: 'Dashboard', icon: '📊', description: 'Overview & Stats' },
  { path: '/daily-test', label: 'Daily Test', icon: '⏱️', description: 'Mandatory 10 MCQs' },
  { path: '/essay', label: 'Essay (Mains)', icon: '✍️', description: 'GS1-GS4 Practice' },
  { path: '/sociology', label: 'Sociology', icon: '📚', description: 'Weekly Quiz' },
  { path: '/flashcards', label: 'Flashcards', icon: '🃏', description: 'Global Revision' },
  { path: '/saved-flashcards', label: 'Saved Flashcards', icon: '⭐', description: 'Your Collection' },
  { path: '/current-affairs', label: 'Current Affairs', icon: '📰', description: 'MCQ Practice' },
  { path: '/pib-news', label: 'PIB News', icon: '🇮🇳', description: 'Latest Updates' },
  { path: '/csat', label: 'CSAT', icon: '🧮', description: 'RC, LR, QA' },
  { path: '/prelims', label: 'Prelims Bits', icon: '🎯', description: 'Subject MCQs' },
  { path: '/polity', label: 'Polity MCQs', icon: '🏛️', description: 'Constitutional Framework' },
  { path: '/pyq', label: 'PYQ Archive', icon: '🏛️', description: 'Live Web PYQ Search' },
  { path: '/ocr', label: 'OCR Scanner', icon: '📷', description: 'Scan & Analyze' },
  { path: '/syllabus', label: 'Upload Syllabus', icon: '📑', description: 'Custom AI Prep' },
  { path: '/settings', label: 'Settings', icon: '⚙️', description: 'App Preferences' },
];

export default function Sidebar({ isOpen, onToggle }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { streak, completedToday } = useStreak();
  const { user, logout } = useAuth();

  const filteredNavItems = user && user.role === 'admin' 
    ? [
        { path: '/admin', label: 'Admin Panel', icon: '👑', description: 'System Overview' },
        { path: '/settings', label: 'Settings', icon: '⚙️', description: 'App Preferences' }
      ]
    : NAV_ITEMS;

  return (
    <>
      <div className={`sidebar-overlay ${isOpen ? 'active' : ''}`} onClick={onToggle} />
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <span className="logo-icon">🏛️</span>
            <div className="logo-text">
              <h1>UPSC Prep</h1>
              <span className="logo-subtitle">Civil Services</span>
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <ul>
            {filteredNavItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `nav-link ${isActive ? 'active' : ''}`
                  }
                  onClick={() => window.innerWidth <= 768 && onToggle()}
                >
                  <span className="nav-icon">{item.icon}</span>
                  <div className="nav-content">
                    <span className="nav-label">{item.label}</span>
                    <span className="nav-desc">{item.description}</span>
                  </div>
                  {location.pathname === item.path && (
                    <span className="nav-indicator" />
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="sidebar-footer">
          {user ? (
            <div style={{ padding: '0 15px 15px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                Logged in as <strong>{user.name}</strong>
              </div>
              <button 
                className="btn btn-outline btn-sm" 
                onClick={logout} 
                style={{ width: '100%', borderColor: 'rgba(255,100,100,0.5)', color: '#ff6b6b' }}
              >
                Logout
              </button>
            </div>
          ) : (
            <div style={{ padding: '0 15px 15px' }}>
              <button 
                className="btn btn-primary btn-sm" 
                onClick={() => navigate('/login')} 
                style={{ width: '100%' }}
              >
                Login to Save Progress
              </button>
            </div>
          )}

          <div className="sidebar-stats">
            <div className={`stat-item streak-container ${completedToday ? 'completed' : ''}`}>
              <span className="stat-icon">💪</span>
              <div className="streak-details">
                <span className="stat-label">{streak} Days Streak</span>
                <div className="streak-bar">
                  <div className="streak-fill" style={{ width: `${Math.min((streak / 30) * 100, 100)}%` }}></div>
                </div>
              </div>
            </div>
          </div>
          <p className="sidebar-version">UPSC Prep v1.0</p>
        </div>
      </aside>
    </>
  );
}
