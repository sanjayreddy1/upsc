import { useState } from 'react';
import MCQCard from '../Common/MCQCard';
import { useQuestionGenerator } from '../../hooks/useQuestionGenerator';
import { useEvaluation } from '../../hooks/useEvaluation';
import EvaluationPanel from '../Evaluation/EvaluationPanel';
import { CURRENT_AFFAIRS_CATEGORIES } from '../../data/syllabus';
import './CurrentAffairs.css';

export default function CurrentAffairs() {
  const [activeCategory, setActiveCategory] = useState('parliamentary');
  const [questions, setQuestions] = useState([]);
  const [userAnswers, setUserAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [mcqResult, setMcqResult] = useState(null);
  const [questionCount, setQuestionCount] = useState(10);

  const { loading, error, getCurrentAffairsMCQs } = useQuestionGenerator();
  const { evaluateMCQ } = useEvaluation();

  const handleGenerate = async () => {
    setSubmitted(false);
    setMcqResult(null);
    setUserAnswers({});
    const finalCount = Math.max(10, questionCount);
    if (finalCount !== questionCount) setQuestionCount(finalCount);
    
    const q = await getCurrentAffairsMCQs(activeCategory, finalCount);
    if (q?.length) setQuestions(q);
  };

  const handleAnswer = (index, option) => {
    setUserAnswers((prev) => ({ ...prev, [index]: option }));
  };

  const handleSubmit = () => {
    const result = evaluateMCQ(userAnswers, questions);
    setMcqResult(result);
    setSubmitted(true);
  };

  return (
    <div className="ca-module animate-fade-in">
      <div className="ca-header">
        <h1>📰 Current Affairs MCQ</h1>
        <p className="ca-desc">Test your knowledge on recent events — Parliamentary Sessions, Bills, Economics, Science & Tech</p>
      </div>

      {/* Category Tabs */}
      <div className="ca-categories">
        {CURRENT_AFFAIRS_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            className={`ca-cat-btn glass-card ${activeCategory === cat.id ? 'active' : ''}`}
            onClick={() => {
              setActiveCategory(cat.id);
              setQuestions([]);
              setSubmitted(false);
              setMcqResult(null);
            }}
          >
            <span className="cat-icon">{cat.icon}</span>
            <span className="cat-name">{cat.name}</span>
          </button>
        ))}
      </div>

      {questions.length === 0 && !loading && (
        <div className="loading-container" style={{ gap: '16px' }}>
          <div className="generate-prompt">
            <span className="generate-icon">
              {CURRENT_AFFAIRS_CATEGORIES.find((c) => c.id === activeCategory)?.icon}
            </span>
            <h3>{CURRENT_AFFAIRS_CATEGORIES.find((c) => c.id === activeCategory)?.name}</h3>
            <p>{CURRENT_AFFAIRS_CATEGORIES.find((c) => c.id === activeCategory)?.description}</p>
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', margin: '20px 0' }}>
              <label htmlFor="ca-count" style={{ fontWeight: 600 }}>Questions:</label>
              <input 
                id="ca-count"
                type="number" 
                className="input" 
                min="10" 
                max="250" 
                value={questionCount} 
                onChange={(e) => setQuestionCount(Number(e.target.value))}
                style={{ width: '80px', textAlign: 'center' }}
              />
            </div>

            <button className="btn btn-primary btn-lg" onClick={handleGenerate}>
              🔄 Generate Questions
            </button>
          </div>
        </div>
      )}

      {loading && (
        <div className="loading-container">
          <div className="spinner spinner-lg"></div>
          <p>Generating current affairs questions...</p>
        </div>
      )}

      {error && (
        <div className="error-banner glass-card">
          <span>⚠️ {error}</span>
          <button className="btn btn-sm btn-primary" onClick={handleGenerate}>Retry</button>
        </div>
      )}

      {/* Questions */}
      {questions.length > 0 && (
        <>
          <div className="ca-questions stagger-children">
            {questions.map((q, idx) => (
              <MCQCard
                key={idx}
                question={q}
                index={idx}
                onAnswer={handleAnswer}
                showResult={submitted}
                userAnswer={userAnswers[idx]}
              />
            ))}
          </div>

          {!submitted && (
            <div className="ca-submit-area" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', marginTop: '24px' }}>
              <span className="answers-count" style={{ fontSize: '1.1rem', fontWeight: '500' }}>
                {Object.keys(userAnswers).length} / {questions.length} answered
              </span>
              <button 
                className="btn btn-success btn-lg" 
                onClick={handleSubmit} 
                disabled={Object.keys(userAnswers).length === 0}
                style={{ width: '100%', maxWidth: '350px', fontSize: '1.2rem', padding: '16px', borderRadius: '12px', boxShadow: '0 8px 16px rgba(67, 233, 123, 0.2)' }}
              >
                ✅ Evaluate
              </button>
              <button 
                className="btn btn-secondary" 
                onClick={() => { setQuestions([]); setUserAnswers({}); }}
                style={{ marginTop: '8px' }}
              >
                🔄 Generate New Set
              </button>
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
        </>
      )}
    </div>
  );
}
