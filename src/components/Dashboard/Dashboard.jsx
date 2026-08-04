import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ProgressRing from '../Common/ProgressRing';
import FlashCard from '../Common/FlashCard';
import { getEvaluationHistory, getMCQHistory } from '../../hooks/useEvaluation';
import { useStreak } from '../../hooks/useStreak';
import { ALL_SOCIOLOGY_FLASHCARDS } from '../../data/sociologyTopics';
import './Dashboard.css';

const MODULE_CARDS = [
  {
    path: '/essay',
    title: 'Essay (Mains)',
    icon: '✍️',
    description: '4 questions daily — GS1, GS2, GS3, GS4',
    gradient: 'linear-gradient(135deg, #667eea, #764ba2)',
    tag: 'Daily',
  },
  {
    path: '/sociology',
    title: 'Sociology Optional',
    icon: '📚',
    description: 'Flashcards & 3 questions per week',
    gradient: 'linear-gradient(135deg, #f093fb, #f5576c)',
    tag: 'Weekly',
  },
  {
    path: '/current-affairs',
    title: 'Current Affairs',
    icon: '📰',
    description: 'MCQs on Bills, Economy, Science & more',
    gradient: 'linear-gradient(135deg, #4facfe, #00f2fe)',
    tag: 'Daily',
  },
  {
    path: '/csat',
    title: 'CSAT',
    icon: '🧮',
    description: 'Practice RC, LR & QA',
    gradient: 'linear-gradient(135deg, #43e97b, #38f9d7)',
    tag: 'Practice',
  },
  {
    path: '/prelims',
    title: 'Prelims Bits',
    icon: '🎯',
    description: 'Science, History, Geography, Environment, Art & Culture',
    gradient: 'linear-gradient(135deg, #fa709a, #fee140)',
    tag: 'Practice',
  },
  {
    path: '/ocr',
    title: 'OCR Scanner',
    icon: '📷',
    description: 'Scan images/PDFs and get AI analysis',
    gradient: 'linear-gradient(135deg, #a18cd1, #fbc2eb)',
    tag: 'Tool',
  },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const [essayHistory, setEssayHistory] = useState([]);
  const [mcqHistory, setMcqHistory] = useState([]);
  const [randomCard, setRandomCard] = useState(null);
  const [isPaused, setIsPaused] = useState(false);
  const { streak } = useStreak();

  useEffect(() => {
    setEssayHistory(getEvaluationHistory('essay'));
    setMcqHistory(getMCQHistory());
    setRandomCard(ALL_SOCIOLOGY_FLASHCARDS[Math.floor(Math.random() * ALL_SOCIOLOGY_FLASHCARDS.length)]);
  }, []);

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setRandomCard(ALL_SOCIOLOGY_FLASHCARDS[Math.floor(Math.random() * ALL_SOCIOLOGY_FLASHCARDS.length)]);
    }, 2000);
    return () => clearInterval(interval);
  }, [isPaused]);

  const handleNextCard = () => {
    setIsPaused(true);
    setRandomCard(ALL_SOCIOLOGY_FLASHCARDS[Math.floor(Math.random() * ALL_SOCIOLOGY_FLASHCARDS.length)]);
  };

  const avgEssayScore = essayHistory.length
    ? Math.round(essayHistory.reduce((sum, h) => sum + h.score, 0) / essayHistory.length)
    : 0;

  const avgMCQScore = mcqHistory.length
    ? Math.round(mcqHistory.reduce((sum, h) => sum + h.score, 0) / mcqHistory.length)
    : 0;

  const totalAttempts = essayHistory.length + mcqHistory.length;

  return (
    <div className="dashboard animate-fade-in">
      {/* Hero Section */}
      <div className="dash-hero">
        <div className="dash-hero-content">
          <h1 className="dash-hero-title">
            Welcome to <span className="gradient-text">UPSC Prep</span>
          </h1>
          <p className="dash-hero-subtitle">
            Your AI-powered companion for Civil Services preparation. Practice daily, track progress, and ace the exam.
          </p>
        </div>
        <div className="dash-hero-stats">
          <ProgressRing progress={avgEssayScore || 0} size={90} strokeWidth={7} label="Essay Avg" />
          <ProgressRing progress={avgMCQScore || 0} size={90} strokeWidth={7} label="MCQ Avg" color="var(--accent-cyan)" />
          <ProgressRing progress={Math.min(totalAttempts * 5, 100)} size={90} strokeWidth={7} label="Activity" color="var(--accent-violet)" />
        </div>
      </div>

      {/* Quick Review Flashcard */}
      <div className="dash-section dash-flashcard-fullwidth">
        <h2 className="dash-section-title">🃏 Quick Review</h2>
        {randomCard && (
          <div className="dash-flashcard-container">
            <FlashCard
              front={randomCard.front}
              back={randomCard.back}
              unit={randomCard.unit}
              paper={randomCard.paper}
              onNext={handleNextCard}
              onPrev={handleNextCard}
              onFlip={() => setIsPaused(true)}
            />
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="dash-quick-stats">
        <div className="quick-stat glass-card" style={{ borderLeft: '4px solid var(--accent-emerald)' }}>
          <span className="quick-stat-icon">💪</span>
          <div>
            <span className="quick-stat-value">{streak} Days</span>
            <span className="quick-stat-label">Current Streak</span>
          </div>
        </div>
        <div className="quick-stat glass-card">
          <span className="quick-stat-icon">📝</span>
          <div>
            <span className="quick-stat-value">{essayHistory.length}</span>
            <span className="quick-stat-label">Essays Attempted</span>
          </div>
        </div>
        <div className="quick-stat glass-card">
          <span className="quick-stat-icon">🎯</span>
          <div>
            <span className="quick-stat-value">{mcqHistory.length}</span>
            <span className="quick-stat-label">MCQ Sessions</span>
          </div>
        </div>
        <div className="quick-stat glass-card">
          <span className="quick-stat-icon">🏆</span>
          <div>
            <span className="quick-stat-value">{avgEssayScore}%</span>
            <span className="quick-stat-label">Avg Essay Score</span>
          </div>
        </div>
        <div className="quick-stat glass-card">
          <span className="quick-stat-icon">📊</span>
          <div>
            <span className="quick-stat-value">{avgMCQScore}%</span>
            <span className="quick-stat-label">Avg MCQ Score</span>
          </div>
        </div>
      </div>

      {/* Module Cards */}
      <div className="dash-section">
        <h2 className="dash-section-title">📋 Study Modules</h2>
        <div className="module-grid stagger-children">
          {MODULE_CARDS.map((mod) => (
            <div
              key={mod.path}
              className="module-card glass-card"
              onClick={() => navigate(mod.path)}
              role="button"
              tabIndex={0}
            >
              <div className="module-card-icon" style={{ background: mod.gradient }}>
                <span>{mod.icon}</span>
              </div>
              <div className="module-card-content">
                <h3>{mod.title}</h3>
                <p>{mod.description}</p>
              </div>
              <span className="badge badge-primary">{mod.tag}</span>
            </div>
          ))}
        </div>
      </div>


      {/* UPSC Exam Structure */}
      <div className="dash-section">
        <h2 className="dash-section-title">📚 UPSC CSE Structure</h2>
        <div className="exam-structure glass-card">
          <div className="exam-stage">
            <div className="stage-badge" style={{ background: 'var(--gradient-info)' }}>Stage 1</div>
            <h4>Prelims</h4>
            <p>GS Paper I (200 marks) + CSAT Paper II (200 marks, qualifying)</p>
          </div>
          <div className="stage-arrow">→</div>
          <div className="exam-stage">
            <div className="stage-badge" style={{ background: 'var(--gradient-primary)' }}>Stage 2</div>
            <h4>Mains</h4>
            <p>9 Papers — Essay + 4 GS + Optional (2) + Language (2)</p>
          </div>
          <div className="stage-arrow">→</div>
          <div className="exam-stage">
            <div className="stage-badge" style={{ background: 'var(--gradient-success)' }}>Stage 3</div>
            <h4>Interview</h4>
            <p>Personality Test — 275 marks</p>
          </div>
        </div>
      </div>

      {/* History Table (Moved to bottom) */}
      <div className="dash-section dash-history-fullwidth">
        <h2 className="dash-section-title">🕒 Recent History</h2>
        <div className="history-list glass-card">
          {essayHistory.length === 0 && mcqHistory.length === 0 ? (
            <p className="history-empty">No practice history yet. Start learning!</p>
          ) : (
            <>
              {essayHistory.slice(0, 5).map((h, i) => (
                <div key={`essay-${i}`} className="history-item">
                  <span className="history-icon">📝</span>
                  <div className="history-details">
                    <span className="history-title">Essay Evaluation</span>
                    <span className="history-date">{new Date(h.date).toLocaleDateString()}</span>
                  </div>
                  <span className="badge badge-success">{h.score}%</span>
                </div>
              ))}
              {mcqHistory.slice(0, 5).map((h, i) => (
                <div key={`mcq-${i}`} className="history-item">
                  <span className="history-icon">🎯</span>
                  <div className="history-details">
                    <span className="history-title">MCQ Quiz</span>
                    <span className="history-date">{new Date(h.date).toLocaleDateString()}</span>
                  </div>
                  <span className="badge badge-success">{h.score}%</span>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
