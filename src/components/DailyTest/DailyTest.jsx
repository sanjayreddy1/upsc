import React, { useState, useEffect, useRef } from 'react';
import { useQuestionGenerator } from '../../hooks/useQuestionGenerator';
import { useEvaluation } from '../../hooks/useEvaluation';
import { useStreak } from '../../hooks/useStreak';
import MCQCard from '../Common/MCQCard';
import './DailyTest.css';

export default function DailyTest() {
  const [questions, setQuestions] = useState([]);
  const [userAnswers, setUserAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [mcqResult, setMcqResult] = useState(null);
  const resultRef = useRef(null);

  const { loading, error, getMCQs } = useQuestionGenerator();
  const { evaluateMCQ } = useEvaluation();
  const { markDailyTestComplete, completedToday } = useStreak();

  const generateDailyQuestions = React.useCallback(async () => {
    // Generate 10 mixed questions (e.g. History & Polity & Current Affairs)
    // For speed, just fetch 10 random 'hard' questions from a broad subject like "General Studies"
    const q = await getMCQs('General Studies', 'Mixed Mock Test (History, Polity, Economy, Geo)', 'hard', 10);
    if (q && q.length > 0) {
      setQuestions(q);
      localStorage.setItem('daily_test_questions', JSON.stringify(q));
      localStorage.setItem('daily_test_date', new Date().toLocaleDateString());
    }
  }, [getMCQs]);

  useEffect(() => {
    // Check if we already have today's questions cached
    const cached = localStorage.getItem('daily_test_questions');
    const cacheDate = localStorage.getItem('daily_test_date');
    const todayStr = new Date().toLocaleDateString();

    if (cached && cacheDate === todayStr) {
      setQuestions(JSON.parse(cached));
    } else {
      generateDailyQuestions();
    }
  }, [generateDailyQuestions]);

  useEffect(() => {
    if (submitted && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [submitted]);

  const handleAnswer = (index, option) => {
    setUserAnswers((prev) => ({ ...prev, [index]: option }));
  };

  const handleSubmit = () => {
    const result = evaluateMCQ(userAnswers, questions);
    setMcqResult(result);
    setSubmitted(true);
    markDailyTestComplete();
  };

  if (loading) {
    return (
      <div className="daily-test-container">
        <div className="loading-container">
          <div className="spinner spinner-lg"></div>
          <p>Curating your 10 Daily Questions...</p>
        </div>
      </div>
    );
  }

  if (completedToday && !submitted) {
    return (
      <div className="daily-test-container flex-center">
        <div className="glass-card text-center" style={{ padding: '40px', maxWidth: '500px' }}>
          <h2 style={{ fontSize: '3rem', margin: '0 0 20px' }}>🎉</h2>
          <h3>Daily Test Completed!</h3>
          <p style={{ color: 'var(--text-secondary)' }}>You've successfully completed today's test and maintained your streak. Come back tomorrow for 10 new questions!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="daily-test-container animate-fade-in">
      <div className="daily-header">
        <h1>⏱️ Daily Challenge</h1>
        <p className="daily-desc">Complete exactly 10 questions to maintain your streak.</p>
      </div>

      {error && (
        <div className="error-banner glass-card">
          <span>⚠️ {error}</span>
          <button className="btn btn-sm btn-primary" onClick={generateDailyQuestions}>
            Retry
          </button>
        </div>
      )}

      {questions.length > 0 && !submitted && (
        <div className="daily-questions">
          {questions.map((q, idx) => (
            <MCQCard
              key={idx}
              index={idx}
              question={q}
              userAnswer={userAnswers[idx]}
              onAnswer={handleAnswer}
              showResult={false}
            />
          ))}
          
          <div className="submit-section" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', marginTop: '24px' }}>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '1.1rem', fontWeight: '500' }}>
              Attempted: {Object.keys(userAnswers).length} / 10
            </p>
            <button 
              className="btn btn-primary btn-lg" 
              onClick={handleSubmit}
              disabled={Object.keys(userAnswers).length < 10}
              style={{ width: '100%', maxWidth: '350px', fontSize: '1.2rem', padding: '16px', borderRadius: '12px', boxShadow: '0 8px 16px rgba(var(--primary-rgb), 0.2)' }}
            >
              ✅ Evaluate & Save Streak
            </button>
          </div>
        </div>
      )}

      {submitted && mcqResult && (
        <div className="daily-results animate-slide-up" ref={resultRef}>
          <div className="glass-card result-summary">
            <h2>Test Evaluation</h2>
            <div className="result-stats">
              <div className="stat-box">
                <span className="stat-value text-emerald">{mcqResult.correct}</span>
                <span className="stat-label">Correct</span>
              </div>
              <div className="stat-box">
                <span className="stat-value text-red">{mcqResult.incorrect}</span>
                <span className="stat-label">Incorrect</span>
              </div>
              <div className="stat-box">
                <span className="stat-value text-yellow">{mcqResult.unanswered}</span>
                <span className="stat-label">Skipped</span>
              </div>
              <div className="stat-box">
                <span className="stat-value">{mcqResult.rawScore.toFixed(2)}</span>
                <span className="stat-label">Total Score</span>
              </div>
            </div>
          </div>

          <div className="questions-review">
            <h3>Detailed Review</h3>
            {questions.map((q, idx) => (
              <MCQCard
                key={idx}
                index={idx}
                question={q}
                userAnswer={userAnswers[idx]}
                showResult={true}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
