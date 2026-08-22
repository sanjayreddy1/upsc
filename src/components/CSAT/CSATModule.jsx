import { useState } from 'react';
import MCQCard from '../Common/MCQCard';
import Timer from '../Common/Timer';
import ProgressRing from '../Common/ProgressRing';
import { useQuestionGenerator } from '../../hooks/useQuestionGenerator';
import { useEvaluation } from '../../hooks/useEvaluation';
import EvaluationPanel from '../Evaluation/EvaluationPanel';
import './CSATModule.css';

const SECTIONS = [
  { id: 'ReadingComprehension', name: 'Reading Comprehension', icon: '📖', desc: 'Passages with analytical questions' },
  { id: 'LogicalReasoning', name: 'Logical Reasoning', icon: '🧩', desc: 'Puzzles, data, analytical thinking' },
  { id: 'QuantitativeAptitude', name: 'Quantitative Aptitude', icon: '🔢', desc: 'Number systems, arithmetic, geometry' },
];

export default function CSATModule() {
  const [activeSection, setActiveSection] = useState('ReadingComprehension');
  const [questionData, setQuestionData] = useState(null);
  const [userAnswers, setUserAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [mcqResult, setMcqResult] = useState(null);
  const [questionCount, setQuestionCount] = useState(10);

  const { loading, error, getCSATQuestions } = useQuestionGenerator();
  const { evaluateMCQ } = useEvaluation();

  const handleGenerate = async () => {
    setSubmitted(false);
    setMcqResult(null);
    setUserAnswers({});
    const finalCount = Math.max(10, questionCount);
    if (finalCount !== questionCount) setQuestionCount(finalCount);

    const data = await getCSATQuestions(activeSection, finalCount);
    if (data) setQuestionData(data);
  };

  const handleAnswer = (index, option) => {
    setUserAnswers((prev) => ({ ...prev, [index]: option }));
  };

  const handleSubmit = async () => {
    if (!questionData?.questions) return;
    const result = await evaluateMCQ(userAnswers, questionData.questions);
    setMcqResult(result);
    setSubmitted(true);
  };

  const questions = questionData?.questions || [];

  return (
    <div className="csat-module animate-fade-in">
      <div className="csat-header">
        <div>
          <h1>🧮 CSAT Practice</h1>
          <p className="csat-desc">Includes negative marking (1/3 deduction).</p>
        </div>
        <Timer duration={1200} label="CSAT Timer" />
      </div>

      {/* Section Tabs */}
      <div className="csat-sections">
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            className={`csat-section-btn glass-card ${activeSection === s.id ? 'active' : ''}`}
            onClick={() => {
              setActiveSection(s.id);
              setQuestionData(null);
              setSubmitted(false);
              setMcqResult(null);
            }}
          >
            <span className="section-icon">{s.icon}</span>
            <div>
              <span className="section-name">{s.name}</span>
              <span className="section-desc">{s.desc}</span>
            </div>
          </button>
        ))}
      </div>

      {/* Generate */}
      {!questionData && !loading && (
        <div className="loading-container" style={{ gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <label htmlFor="csat-count" style={{ fontWeight: 600 }}>Questions:</label>
            <input 
              id="csat-count"
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
            🔄 Generate {SECTIONS.find((s) => s.id === activeSection)?.name}
          </button>
        </div>
      )}

      {loading && (
        <div className="loading-container">
          <div className="spinner spinner-lg"></div>
          <p>Generating CSAT questions...</p>
        </div>
      )}

      {error && (
        <div className="error-banner glass-card">
          <span>⚠️ {error}</span>
          <button className="btn btn-sm btn-primary" onClick={handleGenerate}>Retry</button>
        </div>
      )}

      {/* Passage (for RC) */}
      {questionData?.passage && (
        <div className="csat-passage glass-card">
          <h3>📄 Passage</h3>
          <p>{questionData.passage}</p>
        </div>
      )}

      {/* Questions */}
      {questions.length > 0 && (
        <>
          <div className="csat-questions stagger-children">
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
                {Object.keys(userAnswers).length} / {questionData.questions.length} answered
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
                onClick={() => { setQuestionData(null); setUserAnswers({}); }}
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
