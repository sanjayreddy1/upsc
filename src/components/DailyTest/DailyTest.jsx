import React, { useState, useEffect, useRef } from 'react';
import { useQuestionGenerator } from '../../hooks/useQuestionGenerator';
import { useEvaluation } from '../../hooks/useEvaluation';
import { useStreak } from '../../hooks/useStreak';
import MCQCard from '../Common/MCQCard';
import EvaluationPanel from '../Evaluation/EvaluationPanel';
import './DailyTest.css';

export default function DailyTest() {
  const [questions, setQuestions] = useState([]);
  const [userAnswers, setUserAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [mcqResult, setMcqResult] = useState(null);
  const [difficulty, setDifficulty] = useState('easy');
  const resultRef = useRef(null);

  const { loading, error, getMCQs } = useQuestionGenerator();
  const { evaluateMCQ } = useEvaluation();
  const { markDailyTestComplete, completedToday } = useStreak();

  const generateDailyQuestions = React.useCallback(async (selectedDiff) => {
    setUserAnswers({});
    const diffToUse = selectedDiff || difficulty;
    const q = await getMCQs('General Studies', 'Mixed Mock Test (History, Polity, Economy, Geo)', diffToUse, 10);
    if (q && q.length > 0) {
      setQuestions(q);
      localStorage.setItem('daily_test_questions', JSON.stringify(q));
      localStorage.setItem('daily_test_date', new Date().toLocaleDateString());
      localStorage.setItem('daily_test_difficulty', diffToUse);
    }
  }, [getMCQs, difficulty]);

  useEffect(() => {
    // Check if we already have today's questions cached
    const cached = localStorage.getItem('daily_test_questions');
    const cacheDate = localStorage.getItem('daily_test_date');
    const cacheDiff = localStorage.getItem('daily_test_difficulty') || 'easy';
    const todayStr = new Date().toLocaleDateString();

    if (cached && cacheDate === todayStr) {
      const parsed = JSON.parse(cached);
      // Invalidate cache if it contains the old placeholder errors from the previous model
      if (parsed.length > 0 && parsed[0].question === 'text') {
        generateDailyQuestions('easy');
      } else {
        setQuestions(parsed);
        setDifficulty(cacheDiff);
      }
    } else {
      generateDailyQuestions('easy');
    }
  }, []); // Run only once on mount

  const changeDifficulty = (level) => {
    if (loading) return;
    if (!window.confirm(`Are you sure you want to change difficulty to ${level}? This will generate a new set of questions and reset your current progress.`)) return;
    setDifficulty(level);
    generateDailyQuestions(level);
  };

  useEffect(() => {
    if (submitted && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [submitted]);

  const handleAnswer = (index, option) => {
    setUserAnswers((prev) => ({ ...prev, [index]: option }));
  };

  const handleSubmit = async () => {
    const result = await evaluateMCQ(userAnswers, questions);
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
        
        {!submitted && !completedToday && (
          <div className="difficulty-selector" style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '15px' }}>
            <button 
              className={`btn btn-sm ${difficulty === 'easy' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => changeDifficulty('easy')}
            >
              Easy
            </button>
            <button 
              className={`btn btn-sm ${difficulty === 'hard' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => changeDifficulty('hard')}
            >
              Hard
            </button>
            <button 
              className={`btn btn-sm ${difficulty === 'hardcore' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => changeDifficulty('hardcore')}
            >
              Hardcore
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="error-banner glass-card">
          <span>⚠️ {error}</span>
          <button className="btn btn-sm btn-primary" onClick={generateDailyQuestions}>
            Retry
          </button>
        </div>
      )}

      {questions.length > 0 && (
        <div className="daily-questions">
          {questions.map((q, idx) => (
            <MCQCard
              key={idx}
              index={idx}
              question={q}
              userAnswer={userAnswers[idx]}
              onAnswer={handleAnswer}
              showResult={submitted}
            />
          ))}
          
          {!submitted && (
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
          )}
        </div>
      )}

      {submitted && mcqResult && (
        <EvaluationPanel 
          evaluation={{...mcqResult, type: 'mcq'}} 
          onClose={() => {
            setMcqResult(null);
            setUserAnswers({});
            setSubmitted(false);
          }} 
        />
      )}
    </div>
  );
}
