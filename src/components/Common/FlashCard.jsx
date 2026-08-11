import { useState, useEffect } from 'react';
import './FlashCard.css';

export default function FlashCard({ front, back, unit, paper, onNext, onPrev, current, total, onFlip }) {
  const [flipped, setFlipped] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('savedFlashcards') || '[]');
      setIsSaved(saved.some(card => card.front === front && card.back === back));
    } catch {
      setIsSaved(false);
    }
  }, [front, back]);

  const handleSave = (e) => {
    e.stopPropagation();
    try {
      let saved = JSON.parse(localStorage.getItem('savedFlashcards') || '[]');
      if (isSaved) {
        saved = saved.filter(card => card.front !== front || card.back !== back);
        setIsSaved(false);
      } else {
        saved.push({ front, back, unit, paper });
        setIsSaved(true);
      }
      localStorage.setItem('savedFlashcards', JSON.stringify(saved));
      window.dispatchEvent(new Event('flashcardsUpdated'));
    } catch (err) {
      console.error('Failed to save flashcard', err);
    }
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
