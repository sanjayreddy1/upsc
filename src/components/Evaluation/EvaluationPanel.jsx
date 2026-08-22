import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import html2pdf from 'html2pdf.js';
import ProgressRing from '../Common/ProgressRing';
import CountUp from '../Common/CountUp';
import './EvaluationPanel.css';

export default function EvaluationPanel({ evaluation, onClose, isSharedView }) {
  const [isSharing, setIsSharing] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
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

  const generateShareLink = async () => {
    if (shareUrl) return shareUrl;
    setIsSharing(true);
    try {
      const res = await fetch('/api/share', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ evaluationData: evaluation })
      });
      
      if (!res.ok) throw new Error('Failed to generate share link');
      
      const { id } = await res.json();
      const url = `${window.location.origin}/share/${id}`;
      setShareUrl(url);
      return url;
    } catch (err) {
      console.warn('Error sharing', err);
      alert('Failed to share. Please try again.');
      return null;
    } finally {
      setIsSharing(false);
    }
  };

  const handleSharePlatform = async (platform) => {
    const url = await generateShareLink();
    if (!url) return;

    const feedbackText = isMCQ 
      ? `I scored ${calculatedScore}/${maxScore} on my UPSC Practice Test!\nCheck out my evaluation:`
      : `Check out my UPSC Essay Evaluation!\nScore: ${calculatedScore}/${maxScore}`;
      
    const text = encodeURIComponent(feedbackText);
    const encodedUrl = encodeURIComponent(url);

    if (platform === 'whatsapp') {
      window.open(`https://api.whatsapp.com/send?text=${text}%20${encodedUrl}`, '_blank');
    } else if (platform === 'twitter') {
      window.open(`https://twitter.com/intent/tweet?text=${text}&url=${encodedUrl}`, '_blank');
    } else if (platform === 'mail') {
      window.open(`mailto:?subject=My UPSC Answer Evaluation&body=${text}%20${encodedUrl}`);
    } else if (platform === 'copy') {
      await navigator.clipboard.writeText(`${feedbackText}\n${url}`);
      alert('Share link copied to clipboard!');
    }
  };

  const content = (
    <div className="evaluation-overlay animate-fade-in" ref={overlayRef}>
      {/* Action Bar floating at the top of the overlay */}
      <div className="eval-action-bar">
        <button className="btn btn-secondary" onClick={handleDownloadPDF} style={{ marginRight: 'auto' }}>
          📥 Download PDF
        </button>
        
        {!isSharedView && (
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center', background: 'var(--bg-dark)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', paddingLeft: '8px', paddingRight: '4px', fontWeight: '600' }}>Share:</span>
            
            <button className="btn btn-icon" onClick={() => handleSharePlatform('whatsapp')} title="Share to WhatsApp" disabled={isSharing} style={{ color: '#25D366', background: 'transparent' }}>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51h-.57c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            </button>
            <button className="btn btn-icon" onClick={() => handleSharePlatform('twitter')} title="Share to X" disabled={isSharing} style={{ color: 'var(--text-primary)', background: 'transparent' }}>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            </button>
            <button className="btn btn-icon" onClick={() => handleSharePlatform('mail')} title="Share via Email" disabled={isSharing} style={{ color: 'var(--text-secondary)', background: 'transparent' }}>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>
            </button>
            <button className="btn btn-icon" onClick={() => handleSharePlatform('copy')} title="Copy Link" disabled={isSharing} style={{ color: 'var(--text-secondary)', background: 'transparent' }}>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>
            </button>
          </div>
        )}
        
        <button className="btn btn-icon btn-secondary" onClick={onClose} style={{ marginLeft: '12px' }}>✕</button>
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
