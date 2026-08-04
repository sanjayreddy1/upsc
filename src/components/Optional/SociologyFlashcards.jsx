import { useState } from 'react';
import { useQuestionGenerator } from '../../hooks/useQuestionGenerator';
import { useEvaluation } from '../../hooks/useEvaluation';
import { useNotification } from '../../hooks/useNotification';
import EvaluationPanel from '../Evaluation/EvaluationPanel';
import { scanFile } from '../../services/ocrService';
import './SociologyFlashcards.css';

export default function SociologyFlashcards() {
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [showEval, setShowEval] = useState(false);
  const [currentEval, setCurrentEval] = useState(null);
  const [ocrLoading, setOcrLoading] = useState({});
  const [ocrProgress, setOcrProgress] = useState({});

  const { loading, error, getSociologyQuiz } = useQuestionGenerator();
  const { evaluating, evaluate } = useEvaluation();
  const { sendNotification } = useNotification();

  const handleLoadQuiz = async () => {
    const questions = await getSociologyQuiz();
    if (questions?.length) {
      setQuizQuestions(questions);
    }
  };

  const handleQuizSubmit = async (idx) => {
    const q = quizQuestions[idx];
    const answer = quizAnswers[idx];
    if (!answer || !q) return;

    const result = await evaluate(q.question, answer, q.keyPoints || [], 'sociology');
    if (result) {
      setCurrentEval(result);
      setShowEval(true);
      sendNotification('Evaluation Complete!', {
        body: `Your sociology answer scored ${result.finalScore}%. Click to view feedback.`,
      });
    }
  };

  const handleOCRUpload = async (idx, e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setOcrLoading((prev) => ({ ...prev, [idx]: true }));
    setOcrProgress((prev) => ({ ...prev, [idx]: 0 }));
    try {
      const result = await scanFile(file, (p) => setOcrProgress((prev) => ({ ...prev, [idx]: p })));
      setQuizAnswers((prev) => ({
        ...prev,
        [idx]: (prev[idx] || '') + '\n' + result.text,
      }));
    } catch (err) {
      alert('OCR Error: ' + err.message);
    } finally {
      setOcrLoading((prev) => ({ ...prev, [idx]: false }));
    }
  };

  return (
    <div className="sociology-module animate-fade-in">
      <div className="soc-header">
        <div>
          <h1>📚 Sociology Optional Quiz</h1>
          <p className="soc-desc">Weekly Quiz (3 questions/week) for Paper 1 & Paper 2</p>
        </div>
      </div>

      <div className="soc-quiz">
        {loading && (
          <div className="loading-container">
            <div className="spinner spinner-lg"></div>
            <p>Generating weekly quiz questions...</p>
          </div>
        )}

        {error && (
          <div className="error-banner glass-card">
            <span>⚠️ {error}</span>
            <button className="btn btn-sm btn-primary" onClick={handleLoadQuiz}>Retry</button>
          </div>
        )}

        {!loading && quizQuestions.length > 0 && (
          <div className="quiz-questions stagger-children">
            <div className="quiz-info glass-card">
              <span>📝</span>
              <p>3 questions per week — Write descriptive answers and get AI evaluation with detailed feedback.</p>
            </div>

            {quizQuestions.map((q, idx) => (
              <div key={idx} className="quiz-question-card glass-card">
                <div className="qq-header">
                  <span className="eq-number">Q{idx + 1}</span>
                  <span className="badge badge-primary">{q.paper}</span>
                  {q.topic && <span className="badge badge-primary">{q.topic}</span>}
                  {q.unit && <span className="badge badge-info">{q.unit}</span>}
                  {q.previousYear && q.previousYear !== "null" && <span className="badge badge-success">PYQ {q.previousYear}</span>}
                  {q.marks && <span className="badge badge-warning">{q.marks} marks</span>}
                </div>
                <p className="qq-question">{q.question}</p>
                <textarea
                  className="textarea"
                  placeholder="Write your answer..."
                  value={quizAnswers[idx] || ''}
                  onChange={(e) => setQuizAnswers((prev) => ({ ...prev, [idx]: e.target.value }))}
                  rows={8}
                />
                <div className="qq-footer">
                  <div className="eq-footer-left">
                    <span className="word-count">
                      {(quizAnswers[idx] || '').split(/\s+/).filter(Boolean).length} words
                      {q.wordLimit && ` / ${q.wordLimit}`}
                    </span>
                    <label className="btn btn-sm btn-secondary ocr-upload-btn">
                      📷 Scan Handwritten
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => handleOCRUpload(idx, e)}
                        style={{ display: 'none' }}
                      />
                    </label>
                    {ocrLoading[idx] && (
                      <span className="ocr-progress">
                        <span className="spinner"></span> {ocrProgress[idx] || 0}%
                      </span>
                    )}
                  </div>
                  <button
                    className="btn btn-primary"
                    onClick={() => handleQuizSubmit(idx)}
                    disabled={evaluating || !(quizAnswers[idx]?.trim())}
                  >
                    {evaluating ? '⏳ Evaluating...' : '📝 Submit'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && quizQuestions.length === 0 && !error && (
          <div className="loading-container">
            <button className="btn btn-primary btn-lg" onClick={handleLoadQuiz}>
              🔄 Generate Weekly Quiz
            </button>
          </div>
        )}
      </div>

      {showEval && (
        <EvaluationPanel evaluation={currentEval} onClose={() => setShowEval(false)} />
      )}
    </div>
  );
}
