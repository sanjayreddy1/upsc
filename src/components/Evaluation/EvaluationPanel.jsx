import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import html2pdf from 'html2pdf.js';
import ProgressRing from '../Common/ProgressRing';
import CountUp from '../Common/CountUp';
import './EvaluationPanel.css';

export default function EvaluationPanel({ evaluation, onClose, isSharedView }) {
  const [isSharing, setIsSharing] = useState(false);
  const evalRef = useRef(null);
  const overlayRef = useRef(null);

  useEffect(() => {
    // Lock body scroll
    document.body.style.overflow = 'hidden';
    
    // Scroll window to top
    window.scrollTo({ top: 0, behavior: 'smooth' });

    const timer = setTimeout(() => {
      if (overlayRef.current) {
        overlayRef.current.scrollTop = 0;
      }
      if (evalRef.current) {
        evalRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 150);

    return () => {
      document.body.style.overflow = 'auto';
      clearTimeout(timer);
    };
  }, []);

  if (!evaluation) return null;

  const { type = 'essay', finalScore, percentage, algorithmicScores, aiEvaluation } = evaluation;
  const isMCQ = type === 'mcq';
  const displayPercentage = isMCQ ? (percentage ?? evaluation.score ?? 0) : (finalScore ?? evaluation.score ?? 0);
  const totalQ = evaluation.totalQuestions || evaluation.total || 0;
  const maxScore = isMCQ ? totalQ * 2 : (evaluation.maxMarks || evaluation.total || 20);
  const correctCount = evaluation.correct || 0;
  const incorrectCount = evaluation.incorrect || 0;
  const unansweredCount = evaluation.unanswered || 0;
  
  let calculatedScore = 0;
  if (isMCQ) {
    calculatedScore = evaluation.rawScore !== undefined ? evaluation.rawScore : (correctCount * 2 - incorrectCount * 0.66);
    calculatedScore = Math.round(calculatedScore * 100) / 100;
  } else {
    calculatedScore = Math.round((displayPercentage / 100) * maxScore);
  }

  const handleDownloadPDF = () => {
    const element = evalRef.current;
    if (!element) return;

    const opt = {
      margin:       10,
      filename:     'UPSC_Evaluation_Report.pdf',
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().from(element).set(opt).save();
  };

  const handleShare = async () => {
    setIsSharing(true);
    try {
      // 1. Save evaluation to backend to get a unique shareable link
      const res = await fetch('/api/share', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify({ evaluationData: evaluation })
      });
      
      if (!res.ok) throw new Error('Failed to generate share link');
      
      const { id } = await res.json();
      const shareUrl = `${window.location.origin}/share/${id}`;

      const feedbackText = isMCQ 
        ? `I scored ${calculatedScore}/${maxScore} on my UPSC Practice Test!\nCheck out my evaluation:`
        : `Check out my UPSC Essay Evaluation!\nScore: ${calculatedScore}/${maxScore}`;

      const shareData = {
        title: 'My UPSC Answer Evaluation',
        text: feedbackText,
        url: shareUrl,
      };

      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(`${shareData.text}\n${shareUrl}`);
        alert('Share link copied to clipboard!');
      }
    } catch (err) {
      console.warn('Error sharing', err);
      alert('Failed to share. Please try again.');
    } finally {
      setIsSharing(false);
    }
  };

  const content = (
    <div className="evaluation-overlay animate-fade-in" ref={overlayRef}>
      {/* Action Bar floating at the top of the overlay */}
      <div className="eval-action-bar">
        <button className="btn btn-secondary" onClick={handleDownloadPDF}>
          📥 Download PDF
        </button>
        {!isSharedView && (
          <button className="btn btn-secondary" onClick={handleShare} disabled={isSharing}>
            {isSharing ? '⌛ Generating...' : '🔗 Share'}
          </button>
        )}
        <button className="btn btn-icon btn-secondary" onClick={onClose}>✕</button>
      </div>

      <div className="evaluation-panel glass-card animate-scale-in" ref={evalRef}>
        
        {/* Handwritten Teacher's Mark */}
        <div className="teacher-mark">
          <CountUp from={0} to={calculatedScore} duration={2} />/{maxScore}
        </div>

        <div className="eval-header">
          <h2>📝 {isMCQ ? 'MCQ Evaluation Report' : 'Essay Evaluation Report'}</h2>
        </div>

        {/* ── Overall Score ── */}
        <div className="eval-score-section">
          <ProgressRing
            progress={displayPercentage}
            size={120}
            strokeWidth={8}
            label="Final Score"
          />
          <div className="eval-score-breakdown">
            {isMCQ ? (
              <>
                <div className="score-item">
                  <span className="score-label">Correct Answers (+2)</span>
                  <span className="score-value success-text">{correctCount}</span>
                </div>
                <div className="score-item">
                  <span className="score-label">Incorrect Answers</span>
                  <span className="score-value danger-text">{incorrectCount}</span>
                </div>
                <div className="score-item">
                  <span className="score-label">Negative Marks Applied</span>
                  <span className="score-value danger-text">-{(incorrectCount * 0.66).toFixed(2)}</span>
                </div>
                <div className="score-item">
                  <span className="score-label">Unanswered</span>
                  <span className="score-value muted-text">{unansweredCount}</span>
                </div>
                <div className="score-item">
                  <span className="score-label">Total Questions</span>
                  <span className="score-value">{totalQ}</span>
                </div>
                <div className="score-item">
                  <span className="score-label">Accuracy Rate</span>
                  <span className="score-value">{totalQ > 0 ? Math.round((correctCount / totalQ) * 100) : 0}%</span>
                </div>
              </>
            ) : (
              <>
                <div className="score-item">
                  <span className="score-label">AI Evaluation</span>
                  <span className="score-value">{evaluation.aiEvaluation?.percentage || displayPercentage || 0}%</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Detailed MCQ Topic-wise Analysis */}
        {isMCQ && evaluation.results && evaluation.results.length > 0 && (() => {
          // Group by topic
          const topicMap = {};
          evaluation.results.forEach(q => {
            const topic = q.topic || 'General';
            if (!topicMap[topic]) topicMap[topic] = { correct: 0, wrong: 0, skipped: 0, total: 0 };
            topicMap[topic].total++;
            if (q.isCorrect) topicMap[topic].correct++;
            else if (q.status === 'unanswered') topicMap[topic].skipped++;
            else topicMap[topic].wrong++;
          });
          return (
            <div className="eval-section">
              <h3>📊 Topic-wise Performance</h3>
              <div className="algo-grid" style={{ gap: '12px' }}>
                {Object.entries(topicMap).map(([topic, stats]) => (
                  <div key={topic} className="algo-card" style={{ padding: '14px' }}>
                    <span className="algo-name">{topic}</span>
                    <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                      <span className="badge badge-success">{stats.correct} ✓</span>
                      <span className="badge badge-danger">{stats.wrong} ✗</span>
                      {stats.skipped > 0 && <span className="badge badge-info">{stats.skipped} skipped</span>}
                    </div>
                    <div className="algo-bar" style={{ marginTop: '8px' }}>
                      <div className="algo-bar-fill" style={{ width: `${stats.total > 0 ? (stats.correct / stats.total) * 100 : 0}%`, background: 'var(--accent-emerald)' }} />
                    </div>
                    <span className="algo-value">{stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0}%</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        {/* Detailed MCQ Per-Question Review */}
        {isMCQ && evaluation.results && evaluation.results.length > 0 && (
          <div className="eval-section">
            <h3>📝 Question-by-Question Review</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {evaluation.results.map((q, idx) => (
                <div key={idx} style={{ padding: '16px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', borderLeft: `4px solid ${q.isCorrect ? 'var(--accent-emerald)' : q.status === 'unanswered' ? 'var(--accent-blue)' : 'var(--accent-rose)'}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <strong>Q{idx + 1}</strong>
                    <span className={`badge ${q.isCorrect ? 'badge-success' : q.status === 'unanswered' ? 'badge-info' : 'badge-danger'}`}>
                      {q.isCorrect ? '✓ Correct' : q.status === 'unanswered' ? 'Skipped' : '✗ Wrong'}
                    </span>
                  </div>
                  <p style={{ margin: '8px 0', fontWeight: 500 }}>{q.question}</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '8px' }}>
                    {Object.entries(q.options || {}).map(([key, val]) => {
                      let style = { padding: '6px 12px', borderRadius: '6px', fontSize: '0.9rem', display: 'flex', gap: '8px', alignItems: 'center' };
                      if (key === q.correct) style.background = 'rgba(67, 233, 123, 0.12)';
                      else if (key === q.userAnswer && key !== q.correct) style.background = 'rgba(250, 112, 154, 0.12)';
                      return (
                        <div key={key} style={style}>
                          <strong>{key}.</strong> {val}
                          {key === q.correct && <span style={{ marginLeft: 'auto', color: 'var(--accent-emerald)' }}>✓ Correct</span>}
                          {key === q.userAnswer && key !== q.correct && <span style={{ marginLeft: 'auto', color: 'var(--accent-rose)' }}>✗ Your pick</span>}
                        </div>
                      );
                    })}
                  </div>
                  {q.explanation && (
                    <div style={{ marginTop: '10px', padding: '10px', borderRadius: '8px', background: 'rgba(102, 126, 234, 0.08)', fontSize: '0.9rem' }}>
                      💡 {q.explanation}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {!isMCQ && evaluation.userAnswer && (
          <div className="eval-section">
            <h3>📝 Your Original Answer</h3>
            <div className="model-answer" style={{ whiteSpace: 'pre-wrap', marginTop: '12px' }}>
              {evaluation.userAnswer}
            </div>
          </div>
        )}

        {!isMCQ && evaluation.aiEvaluation?.scores && (
          <div className="eval-section">
            <h3>🤖 AI Evaluation Scores</h3>
            <div className="ai-scores-grid">
              {Object.entries(evaluation.aiEvaluation.scores).map(([key, value]) => (
                <div key={key} className="ai-score-item">
                  <span className="ai-score-label">{formatLabel(key)}</span>
                  <div className="ai-score-bar">
                    <div className="ai-score-bar-fill" style={{ width: `${value * 10}%` }} />
                  </div>
                  <span className="ai-score-value">{value}/10</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {!isMCQ && evaluation.aiEvaluation?.strengths?.length > 0 && (
          <div className="eval-section">
            <h3>✅ Strengths</h3>
            <ul className="eval-list success">
              {evaluation.aiEvaluation.strengths.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </div>
        )}

        {!isMCQ && evaluation.aiEvaluation?.weaknesses?.length > 0 && (
          <div className="eval-section">
            <h3>⚠️ Areas to Improve</h3>
            <ul className="eval-list warning">
              {evaluation.aiEvaluation.weaknesses.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          </div>
        )}

        {!isMCQ && evaluation.aiEvaluation?.tipsAndTricks?.length > 0 && (
          <div className="eval-section">
            <h3>💡 Tips & Tricks</h3>
            <ul className="eval-list info">
              {evaluation.aiEvaluation.tipsAndTricks.map((t, i) => (
                <li key={i}>{t}</li>
              ))}
            </ul>
          </div>
        )}

        {!isMCQ && evaluation.aiEvaluation?.howToImprove?.length > 0 && (
          <div className="eval-section">
            <h3>📈 How to Improve</h3>
            <ol className="eval-list steps">
              {evaluation.aiEvaluation.howToImprove.map((h, i) => (
                <li key={i}>{h}</li>
              ))}
            </ol>
          </div>
        )}

        {!isMCQ && evaluation.aiEvaluation?.topicsToStudy?.length > 0 && (
          <div className="eval-section">
            <h3>📖 Topics to Study</h3>
            <div className="topics-tags">
              {evaluation.aiEvaluation.topicsToStudy.map((t, i) => (
                <span key={i} className="badge badge-primary">{t}</span>
              ))}
            </div>
          </div>
        )}

        {!isMCQ && evaluation.aiEvaluation?.modelAnswerOutline && (
          <div className="eval-section">
            <h3>📋 Ideal Answer Framework</h3>
            <p className="model-answer">{evaluation.aiEvaluation.modelAnswerOutline}</p>
          </div>
        )}

        {!isMCQ && evaluation.aiEvaluation?.overallFeedback && (
          <div className="eval-section">
            <h3>💬 Overall Feedback</h3>
            <p className="overall-feedback">{evaluation.aiEvaluation.overallFeedback}</p>
          </div>
        )}

        {!isMCQ && evaluation.aiEvaluation?.additionalSuggestions?.length > 0 && (
          <div className="eval-section">
            <h3>🎯 Additional Suggestions</h3>
            <ul className="eval-list info">
              {evaluation.aiEvaluation.additionalSuggestions.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="eval-footer">
          {isMCQ ? (
            <p className="eval-word-count">
              Negative Penalty Applied: <strong>-{(incorrectCount * 0.66).toFixed(2)} marks</strong>
            </p>
          ) : (
            <p className="eval-word-count">
              Word Count: <strong>{evaluation.wordCount}</strong>
            </p>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}

function formatLabel(key) {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (s) => s.toUpperCase())
    .trim();
}
