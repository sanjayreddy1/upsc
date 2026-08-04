import './Header.css';

export default function Header({ title, subtitle, onMenuToggle }) {
  const today = new Date();
  const dateStr = today.toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <header className="app-header">
      <div className="header-left">
        <button className="menu-btn" onClick={onMenuToggle} aria-label="Toggle menu">
          <span></span>
          <span></span>
          <span></span>
        </button>
        <div className="header-title-group">
          <h2 className="header-title">{title}</h2>
          {subtitle && <p className="header-subtitle">{subtitle}</p>}
        </div>
      </div>
      <div className="header-right">
        <div className="header-date">
          <span className="date-icon">📅</span>
          <span>{dateStr}</span>
        </div>
      </div>
    </header>
  );
}
