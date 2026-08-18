import { useState, useEffect } from 'react';
import { useFlashcards } from '../../hooks/useFlashcards';
import './FlashCard.css';

export default function FlashCard({ front, back, unit, paper, onNext, onPrev, current, total, onFlip }) {
  const [flipped, setFlipped] = useState(false);
  const { isCardSaved, saveFlashcard } = useFlashcards();
  
  const isSaved = isCardSaved(front, back);

  const handleSave = (e) => {
    e.stopPropagation();
    saveFlashcard({ front, back, unit, paper });
  };

  const handleFlip = () => {
    setFlipped(!flipped);
    onFlip?.(!flipped);
  };

  const handleNext = () => {
    setFlipped(false);
    onNext?.();
  };

  const handlePrev = () => {
    setFlipped(false);
    onPrev?.();
  };

  return (
    <div className="flashcard-container">
      <div className="flashcard-meta">
        {paper && <span className="badge badge-primary">{paper}</span>}
        {unit && <span className="badge badge-info">{unit}</span>}
        {total && (
          <span className="flashcard-counter">
            {current + 1} / {total}
          </span>
        )}
      </div>

      <div className={`flashcard ${flipped ? 'flipped' : ''}`} onClick={handleFlip}>
        <div className="flashcard-inner">
          <div className="flashcard-front">
            <div className="flashcard-label">Question</div>
            <p>{front}</p>
            <span className="flip-hint">Click to flip ↻</span>
          </div>
          <div className="flashcard-back">
            <div className="flashcard-label">Answer</div>
            <p>{back}</p>
            <span className="flip-hint">Click to flip ↻</span>
          </div>
        </div>
      </div>

      <div className="flashcard-controls">
        <button className="btn btn-secondary" onClick={handlePrev} disabled={current <= 0}>
          ← Previous
        </button>
        <button className={`btn ${isSaved ? 'btn-primary' : 'btn-secondary'}`} onClick={handleSave} style={{ minWidth: '100px' }}>
          {isSaved ? '★ Saved' : '☆ Save'}
        </button>
        <button className="btn btn-primary" onClick={handleNext} disabled={current >= total - 1}>
          Next →
        </button>
      </div>
    </div>
  );
}
