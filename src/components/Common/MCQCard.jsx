import { useState } from 'react';
import './MCQCard.css';

export default function MCQCard({ question, index, onAnswer, showResult, userAnswer }) {
  const [selected, setSelected] = useState(userAnswer || null);

  const handleSelect = (option) => {
    if (showResult) return;
    setSelected(option);
    onAnswer?.(index, option);
  };

  const getOptionClass = (option) => {
    let cls = 'mcq-option';
    if (selected === option) cls += ' selected';
    if (showResult) {
      if (option === question.correct) cls += ' correct';
      else if (selected === option && option !== question.correct) cls += ' incorrect';
    }
    return cls;
  };

  return (
    <div className="mcq-card glass-card animate-fade-in">
      <div className="mcq-header">
        <span className="mcq-number">Q{index + 1}</span>
        {question.topic && <span className="badge badge-primary">{question.topic}</span>}
        {question.subtopic && <span className="badge badge-info">{question.subtopic}</span>}
      </div>

      <p className="mcq-question">
        {question.question}
        {question.previousYear && question.previousYear !== "null" && (
          <span className="pyq-inline-tag"> [UPSC {question.previousYear}]</span>
        )}
      </p>

      <div className="mcq-options">
        {Object.entries(question.options || {}).map(([key, value]) => (
          <button
            key={key}
            className={getOptionClass(key)}
            onClick={() => handleSelect(key)}
            disabled={showResult}
          >
            <span className="option-key">{key}</span>
            <span className="option-text">{value}</span>
            {showResult && key === question.correct && <span className="option-icon">✓</span>}
            {showResult && selected === key && key !== question.correct && (
              <span className="option-icon wrong">✗</span>
            )}
          </button>
        ))}
      </div>

      {showResult && question.explanation && (
        <div className="mcq-explanation animate-slide-up">
          <h4>💡 Explanation</h4>
          <p>{question.explanation}</p>
        </div>
      )}
    </div>
  );
}
