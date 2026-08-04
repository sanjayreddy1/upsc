import './ProgressRing.css';

export default function ProgressRing({ progress, size = 80, strokeWidth = 6, color, label, sublabel }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  const getColor = () => {
    if (color) return color;
    if (progress >= 75) return 'var(--accent-emerald)';
    if (progress >= 50) return 'var(--accent-amber)';
    return 'var(--accent-rose)';
  };

  return (
    <div className="progress-ring-container">
      <svg width={size} height={size} className="progress-ring">
        <circle
          className="progress-ring-bg"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
        />
        <circle
          className="progress-ring-fill"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ stroke: getColor() }}
        />
      </svg>
      <div className="progress-ring-text">
        <span className="progress-value" style={{ color: getColor() }}>
          {Math.round(progress)}%
        </span>
      </div>
      {label && <span className="progress-label">{label}</span>}
      {sublabel && <span className="progress-sublabel">{sublabel}</span>}
    </div>
  );
}
