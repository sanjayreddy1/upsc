import { useState } from 'react';
import MCQCard from '../Common/MCQCard';
import ProgressRing from '../Common/ProgressRing';
import { useQuestionGenerator } from '../../hooks/useQuestionGenerator';
import { useEvaluation } from '../../hooks/useEvaluation';
import EvaluationPanel from '../Evaluation/EvaluationPanel';
import { PRELIMS_SYLLABUS } from '../../data/syllabus';
import './PrelimsModule.css';

const SUBJECTS = [
  { id: 'Science', name: 'Science', icon: '🔬', color: '#667eea' },
  { id: 'History', name: 'History', icon: '📜', color: '#f093fb', hasSubcategories: true },
  { id: 'Geography', name: 'Geography', icon: '🌍', color: '#43e97b', hasSubcategories: true },
  { id: 'Environment', name: 'Environment', icon: '🌿', color: '#4facfe' },
  { id: 'ArtAndCulture', name: 'Art & Culture', icon: '🎨', color: '#fa709a' },
  { id: 'Polity', name: 'Polity', icon: '🏛️', color: '#ffb347', hasSubcategories: true },
];

export default function PrelimsModule() {
  const [activeSubject, setActiveSubject] = useState('Science');
  const [activeSubcategory, setActiveSubcategory] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [userAnswers, setUserAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [mcqResult, setMcqResult] = useState(null);
  const [questionCount, setQuestionCount] = useState(10);

  const { loading, error, getMCQs } = useQuestionGenerator();
  const { evaluateMCQ } = useEvaluation();

  const getTopicForGeneration = () => {
    const subjectData = PRELIMS_SYLLABUS[activeSubject];
    if (!subjectData) return activeSubject;

    if (activeSubcategory && subjectData.subcategories?.[activeSubcategory]) {
      const sub = subjectData.subcategories[activeSubcategory];
      return `${subjectData.name} - ${sub.name}`;
    }

    return subjectData.name;
  };

  const handleGenerate = async (topicType) => {
    setSubmitted(false);
    setMcqResult(null);
    setUserAnswers({});
    const finalCount = Math.max(10, questionCount);
    if (finalCount !== questionCount) setQuestionCount(finalCount);
    
    const topic = topicType || getTopicForGeneration();
    const q = await getMCQs(activeSubject, topic, 'hard', finalCount);
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

  const subjectData = PRELIMS_SYLLABUS[activeSubject];
  const subcategories = subjectData?.subcategories ? Object.keys(subjectData.subcategories) : [];

  return (
    <div className="prelims-module animate-fade-in">
      <div className="prelims-header">
        <h1>🎯 Prelims Bits MCQ</h1>
        <p className="prelims-desc">
          Practice across 6 subjects — Science, History, Geography, Environment, Art & Culture, and Polity.
        </p>
      </div>

      {/* Subject Tabs */}
      <div className="prelims-subjects">
        {SUBJECTS.map((s) => (
          <button
            key={s.id}
            className={`subject-btn glass-card ${activeSubject === s.id ? 'active' : ''}`}
            style={{ '--subject-color': s.color }}
            onClick={() => {
              setActiveSubject(s.id);
              setActiveSubcategory(null);
              setQuestions([]);
              setSubmitted(false);
              setMcqResult(null);
            }}
          >
            <span className="subject-icon">{s.icon}</span>
            <span className="subject-name">{s.name}</span>
          </button>
        ))}
      </div>

      {/* Subcategory Tabs */}
      {subcategories.length > 0 && (
        <div className="prelims-subcats">
          <button
            className={`btn btn-sm ${!activeSubcategory ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveSubcategory(null)}
          >
            All {subjectData.name}
          </button>
          {subcategories.map((key) => (
            <button
              key={key}
              className={`btn btn-sm ${activeSubcategory === key ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveSubcategory(key)}
            >
              {subjectData.subcategories[key].name}
            </button>
          ))}
        </div>
      )}

      {/* Generate */}
      {questions.length === 0 && !loading && (
        <div className="loading-container" style={{ gap: '16px' }}>
          <div className="generate-prompt">
            <span className="generate-icon">
              {SUBJECTS.find((s) => s.id === activeSubject)?.icon}
            </span>
            <h3>{SUBJECTS.find((s) => s.id === activeSubject)?.name}</h3>
            <p>Select a specific topic or generate a mixed set of questions.</p>
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', margin: '20px 0' }}>
              <label htmlFor="prelims-count" style={{ fontWeight: 600 }}>Questions:</label>
              <input 
                id="prelims-count"
                type="number" 
                className="input" 
                min="10" 
                max="250" 
                value={questionCount} 
                onChange={(e) => setQuestionCount(Number(e.target.value))}
                style={{ width: '80px', textAlign: 'center' }}
              />
            </div>

            <button className="btn btn-primary btn-lg" onClick={() => handleGenerate('Mixed Topics')}>
              🔄 Generate Questions
            </button>
          </div>
        </div>
      )}

      {loading && (
        <div className="loading-container">
          <div className="spinner spinner-lg"></div>
          <p>Generating prelims questions...</p>
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
          <div className="prelims-questions stagger-children">
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
