import { useState, useEffect, useCallback } from 'react';
import { useQuestionGenerator } from '../../hooks/useQuestionGenerator';
import { useEvaluation } from '../../hooks/useEvaluation';
import { useNotification } from '../../hooks/useNotification';
import EvaluationPanel from '../Evaluation/EvaluationPanel';
import Timer from '../Common/Timer';
import { scanFile } from '../../services/ocrService';
import './EssayModule.css';

const PAPERS = [
  { id: 'GS1', name: 'GS Paper I', subtitle: 'Heritage, History, Geography, Society', color: '#667eea' },
  { id: 'GS2', name: 'GS Paper II', subtitle: 'Governance, Polity, IR', color: '#f093fb' },
  { id: 'GS3', name: 'GS Paper III', subtitle: 'Economy, S&T, Environment, Security', color: '#43e97b' },
  { id: 'GS4', name: 'GS Paper IV', subtitle: 'Ethics, Integrity, Aptitude', color: '#fa709a' },
];

export default function EssayModule() {
  const [activePaper, setActivePaper] = useState('GS1');
  const [questions, setQuestions] = useState({});
  const [answers, setAnswers] = useState({});
  const [showEval, setShowEval] = useState(false);
  const [currentEval, setCurrentEval] = useState(null);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('essay_eval_history') || '[]');
      setHistory(saved);
    } catch (e) {}
  }, []);

  const { loading, error, getEssayQuestions } = useQuestionGenerator();
  const { evaluating, evaluate } = useEvaluation();
  const { sendNotification } = useNotification();

  const loadQuestions = useCallback(async (paper) => {
    if (questions[paper]) return;
    const q = await getEssayQuestions(paper);
    if (q?.length) {
      setQuestions((prev) => ({ ...prev, [paper]: q }));
    }
  }, [questions, getEssayQuestions]);

  useEffect(() => {
    loadQuestions(activePaper);
  }, [activePaper, loadQuestions]);

  const handleAnswerChange = (paper, idx, value) => {
    const key = `${paper}_${idx}`;
    setAnswers((prev) => ({ ...prev, [key]: value }));
    // Auto-save
    localStorage.setItem(`essay_answer_${key}`, value);
  };

  const handleSubmit = async (paper, idx) => {
    const key = `${paper}_${idx}`;
    const answer = answers[key];
    const question = questions[paper]?.[idx];
    if (!answer || !question) return;

    const result = await evaluate(question.question, answer, question.keyPoints || [], 'essay');
    if (result) {
      const evalWithMeta = {
        ...result,
        questionText: question.question,
        userAnswer: answer,
        paper,
        dateStr: new Date().toLocaleString()
      };
      setCurrentEval(evalWithMeta);
      setShowEval(true);
      
      const newHistory = [evalWithMeta, ...history];
      setHistory(newHistory);
      localStorage.setItem('essay_eval_history', JSON.stringify(newHistory));

      sendNotification('Evaluation Complete!', {
        body: `Your essay for ${paper} has been evaluated.`,
      });
    }
  };

  const handleOCRUpload = async (paper, idx, e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setOcrLoading(true);
    setOcrProgress(0);
    try {
      const result = await scanFile(file, (p) => setOcrProgress(p));
      const key = `${paper}_${idx}`;
      setAnswers((prev) => ({
        ...prev,
        [key]: (prev[key] || '') + '\n' + result.text,
      }));
    } catch (err) {
      alert('OCR Error: ' + err.message);
    } finally {
      setOcrLoading(false);
    }
  };

  // Restore saved answers
  useEffect(() => {
    const restored = {};
    PAPERS.forEach((p) => {
      const q = questions[p.id];
      if (q) {
        q.forEach((_, idx) => {
          const key = `${p.id}_${idx}`;
          const saved = localStorage.getItem(`essay_answer_${key}`);
          if (saved) restored[key] = saved;
        });
      }
    });
    if (Object.keys(restored).length) {
      setAnswers((prev) => ({ ...prev, ...restored }));
    }
  }, [questions]);

  const currentQuestions = questions[activePaper] || [];

  return (
    <div className="essay-module animate-fade-in">
      <div className="essay-header">
        <div>
          <h1>✍️ Mains Essay Practice</h1>
          <p className="essay-desc">4 questions daily — one per GS paper. Write, submit, and get AI-powered evaluation.</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '12px' }}>
          <Timer duration={900} label="Session Timer" />
          <button className="btn btn-secondary btn-sm" onClick={() => setShowHistory(!showHistory)}>
            {showHistory ? '⬅️ Back to Practice' : '📜 View History'}
          </button>
        </div>
      </div>

      {showHistory ? (
        <div className="essay-history animate-fade-in" style={{ marginTop: '20px' }}>
          <h2 style={{ marginBottom: '16px' }}>📜 Evaluation History</h2>
          {history.length === 0 ? (
            <div className="glass-card" style={{ padding: '32px', textAlign: 'center' }}>
              <p>No evaluations found in history.</p>
            </div>
          ) : (
            <div className="history-grid" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {history.map((h, i) => (
                <div key={i} className="glass-card" style={{ padding: '20px', cursor: 'pointer', transition: 'all 0.2s ease' }} onClick={() => { setCurrentEval(h); setShowEval(true); }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', alignItems: 'center' }}>
                    <span className="badge badge-primary">{h.paper}</span>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{h.dateStr}</span>
                  </div>
                  <p style={{ fontWeight: 600, fontSize: '1.05rem', margin: '8px 0', color: 'var(--text-primary)' }}>{h.questionText}</p>
                  <p style={{ color: 'var(--accent-emerald)', fontWeight: 500 }}>
                    Score: {h.finalScore || Math.round((h.percentage / 100) * 20)} / 20
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Paper Tabs */}
      <div className="paper-tabs">
        {PAPERS.map((p) => (
          <button
            key={p.id}
            className={`paper-tab ${activePaper === p.id ? 'active' : ''}`}
            onClick={() => setActivePaper(p.id)}
            style={{ '--tab-color': p.color }}
          >
            <span className="tab-name">{p.name}</span>
            <span className="tab-subtitle">{p.subtitle}</span>
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="error-banner glass-card">
          <span>⚠️ {error}</span>
          <button className="btn btn-sm btn-primary" onClick={() => loadQuestions(activePaper)}>
            Retry
          </button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="loading-container">
          <div className="spinner spinner-lg"></div>
          <p>Generating questions for {activePaper}...</p>
        </div>
      )}

      {/* Questions */}
      {!loading && currentQuestions.length > 0 && (
        <div className="essay-questions stagger-children">
          {currentQuestions.map((q, idx) => {
            const key = `${activePaper}_${idx}`;
            return (
              <div key={key} className="essay-question-card glass-card">
                <div className="eq-header">
                  <span className="eq-number">Q{idx + 1}</span>
                  <div className="eq-meta">
                    {q.topic && <span className="badge badge-primary">{q.topic}</span>}
                    {q.subtopic && <span className="badge badge-info">{q.subtopic}</span>}
                    {q.marks && <span className="badge badge-warning">{q.marks} marks</span>}
                    {q.wordLimit && <span className="badge badge-info">{q.wordLimit} words</span>}
                  </div>
                </div>

                <p className="eq-question">
                  {q.question}
                  {q.previousYear && q.previousYear !== "null" && (
                    <span className="pyq-inline-tag"> [UPSC {q.previousYear}]</span>
                  )}
                </p>

                <div className="eq-answer-area">
                  <textarea
                    className="textarea"
                    placeholder="Write your answer here..."
                    value={answers[key] || ''}
                    onChange={(e) => handleAnswerChange(activePaper, idx, e.target.value)}
                    rows={10}
                  />
                  <div className="eq-footer">
                    <div className="eq-footer-left">
                      <span className="word-count">
                        {(answers[key] || '').split(/\s+/).filter(Boolean).length} words
                      </span>
                      <label className="btn btn-sm btn-secondary ocr-upload-btn">
                        📷 Scan Handwritten
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          onChange={(e) => handleOCRUpload(activePaper, idx, e)}
                          style={{ display: 'none' }}
                        />
                      </label>
                      {ocrLoading && (
                        <span className="ocr-progress">
                          <span className="spinner"></span> {ocrProgress}%
                        </span>
                      )}
                    </div>
                    <button
                      className="btn btn-primary btn-lg"
                      onClick={() => handleSubmit(activePaper, idx)}
                      disabled={evaluating || !(answers[key]?.trim())}
                    >
                      {evaluating ? (
                        <>
                          <span className="spinner"></span> Evaluating...
                        </>
                      ) : (
                        '📝 Submit & Evaluate'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

          {!loading && currentQuestions.length === 0 && !error && (
            <div className="loading-container">
              <button className="btn btn-primary btn-lg" onClick={() => loadQuestions(activePaper)}>
                🔄 Generate {activePaper} Questions
              </button>
            </div>
          )}
        </>
      )}

      {/* Evaluation Overlay */}
      {showEval && (
        <EvaluationPanel
          evaluation={currentEval}
          onClose={() => setShowEval(false)}
        />
      )}
    </div>
  );
}
