import { NavLink, useLocation } from 'react-router-dom';
import { useStreak } from '../../hooks/useStreak';
import './Sidebar.css';

const NAV_ITEMS = [
  { path: '/', label: 'Dashboard', icon: '📊', description: 'Overview & Stats' },
  { path: '/daily-test', label: 'Daily Test', icon: '⏱️', description: 'Mandatory 10 MCQs' },
  { path: '/essay', label: 'Essay (Mains)', icon: '✍️', description: 'GS1-GS4 Practice' },
  { path: '/sociology', label: 'Sociology', icon: '📚', description: 'Weekly Quiz' },
  { path: '/flashcards', label: 'Flashcards', icon: '🃏', description: 'Global Revision' },
  { path: '/current-affairs', label: 'Current Affairs', icon: '📰', description: 'MCQ Practice' },
  { path: '/pib-news', label: 'PIB News', icon: '🇮🇳', description: 'Latest Updates' },
  { path: '/csat', label: 'CSAT', icon: '🧮', description: 'RC, LR, QA' },
  { path: '/prelims', label: 'Prelims Bits', icon: '🎯', description: 'Subject MCQs' },
  { path: '/pyq', label: 'PYQ Archive', icon: '🏛️', description: 'Live Web PYQ Search' },
  { path: '/ocr', label: 'OCR Scanner', icon: '📷', description: 'Scan & Analyze' },
  { path: '/syllabus', label: 'Upload Syllabus', icon: '📑', description: 'Custom AI Prep' },
];

export default function Sidebar({ isOpen, onToggle }) {
  const location = useLocation();
  const { streak, completedToday } = useStreak();

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
            {NAV_ITEMS.map((item) => (
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
