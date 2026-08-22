import { useState } from 'react';
import MCQCard from '../Common/MCQCard';
import { useQuestionGenerator } from '../../hooks/useQuestionGenerator';
import { useEvaluation } from '../../hooks/useEvaluation';
import EvaluationPanel from '../Evaluation/EvaluationPanel';
import { PRELIMS_SYLLABUS } from '../../data/syllabus';
import './PolityModule.css';

export default function PolityModule() {
  const [activeSubcategory, setActiveSubcategory] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [userAnswers, setUserAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [mcqResult, setMcqResult] = useState(null);
  const [questionCount, setQuestionCount] = useState(10);

  const { loading, error, getMCQs } = useQuestionGenerator();
  const { evaluateMCQ } = useEvaluation();

  const getTopicForGeneration = () => {
    const subjectData = PRELIMS_SYLLABUS.Polity;
    if (activeSubcategory && subjectData.subcategories?.[activeSubcategory]) {
      const sub = subjectData.subcategories[activeSubcategory];
      return `Polity - ${sub.name}`;
    }
    return 'Polity';
  };

  const handleGenerate = async (topicType) => {
    setSubmitted(false);
    setMcqResult(null);
    setUserAnswers({});
    const finalCount = Math.max(10, questionCount);
    if (finalCount !== questionCount) setQuestionCount(finalCount);
    
    const topic = topicType || getTopicForGeneration();
    const q = await getMCQs('Polity', topic, 'hard', finalCount);
    if (q?.length) setQuestions(q);
  };

  const handleAnswer = (index, option) => {
    setUserAnswers((prev) => ({ ...prev, [index]: option }));
  };

  const handleSubmit = async () => {
    const result = await evaluateMCQ(userAnswers, questions);
    setMcqResult(result);
    setSubmitted(true);
  };

  const subjectData = PRELIMS_SYLLABUS.Polity;
  const subcategories = subjectData?.subcategories ? Object.keys(subjectData.subcategories) : [];

  return (
    <div className="polity-module animate-fade-in">
      <div className="polity-header">
        <h1>🏛️ Polity MCQs</h1>
        <p className="polity-desc">
          Master Indian Polity with focused MCQs on Constitutional Framework, System of Government, and more.
        </p>
      </div>

      <div className="polity-subcats">
        <button
          className={`btn btn-sm ${!activeSubcategory ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => {
            setActiveSubcategory(null);
            setQuestions([]);
            setSubmitted(false);
            setMcqResult(null);
          }}
        >
          All Polity
        </button>
        {subcategories.map((key) => (
          <button
            key={key}
            className={`btn btn-sm ${activeSubcategory === key ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => {
              setActiveSubcategory(key);
              setQuestions([]);
              setSubmitted(false);
              setMcqResult(null);
            }}
          >
            {subjectData.subcategories[key].name}
          </button>
        ))}
      </div>

      {questions.length === 0 && !loading && (
        <div className="loading-container" style={{ gap: '16px', marginTop: '24px' }}>
          <div className="generate-prompt glass-card" style={{ padding: '32px', textAlign: 'center', width: '100%', maxWidth: '600px' }}>
            <span className="generate-icon" style={{ fontSize: '3rem' }}>🏛️</span>
            <h3 style={{ margin: '16px 0', fontSize: '1.5rem', color: '#1a202c' }}>
              {activeSubcategory ? subjectData.subcategories[activeSubcategory].name : 'Mixed Polity Topics'}
            </h3>
            <p style={{ color: '#4a5568', marginBottom: '24px' }}>
              Select a specific topic above or generate a mixed set of questions.
            </p>
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', margin: '20px 0' }}>
              <label htmlFor="polity-count" style={{ fontWeight: 600, color: '#2d3748' }}>Questions:</label>
              <input 
                id="polity-count"
                type="number" 
                className="input" 
                min="10" 
                max="250" 
                value={questionCount} 
                onChange={(e) => setQuestionCount(Number(e.target.value))}
                style={{ width: '80px', textAlign: 'center' }}
              />
            </div>

            <button className="btn btn-primary btn-lg" onClick={() => handleGenerate(activeSubcategory ? null : 'Mixed Polity Topics')} style={{ width: '100%', maxWidth: '300px' }}>
              🔄 Generate Questions
            </button>
          </div>
        </div>
      )}

      {loading && (
        <div className="loading-container">
          <div className="spinner spinner-lg"></div>
          <p>Generating polity questions...</p>
        </div>
      )}

      {error && (
        <div className="error-banner glass-card" style={{ marginTop: '24px' }}>
          <span>⚠️ {error}</span>
          <button className="btn btn-sm btn-primary" onClick={() => handleGenerate()}>Retry</button>
        </div>
      )}

      {questions.length > 0 && (
        <>
          <div className="polity-questions stagger-children" style={{ marginTop: '32px' }}>
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
            <div className="ca-submit-area" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', marginTop: '32px', marginBottom: '32px' }}>
              <span className="answers-count" style={{ fontSize: '1.1rem', fontWeight: '500', color: '#4a5568' }}>
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
            <div style={{ marginTop: '32px' }}>
              <EvaluationPanel 
                evaluation={{...mcqResult, type: 'mcq'}} 
                onClose={() => {
                  setMcqResult(null);
                  setUserAnswers({});
                  setSubmitted(false);
                }} 
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
