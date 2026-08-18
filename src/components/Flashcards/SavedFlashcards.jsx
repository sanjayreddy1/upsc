import { useState, useEffect } from 'react';
import FlashCard from '../Common/FlashCard';
import { useFlashcards } from '../../hooks/useFlashcards';
import './FlashcardsModule.css';

export default function SavedFlashcards() {
  const { flashcards, loading } = useFlashcards();
  const [currentIndex, setCurrentIndex] = useState(0);

  // Ensure current index is valid after unsaving
  useEffect(() => {
    if (flashcards.length > 0 && currentIndex >= flashcards.length) {
      setCurrentIndex(Math.max(0, flashcards.length - 1));
    }
  }, [flashcards, currentIndex]);

  const currentCard = flashcards[currentIndex];

  return (
    <div className="flashcards-module animate-fade-in">
      <div className="flashcards-header">
        <h1>⭐ Saved Flashcards</h1>
        <p className="flashcards-desc">Review your saved flashcards for quick revision.</p>
      </div>

      {flashcards.length === 0 ? (
        <div className="glass-card" style={{ padding: '3rem', textAlign: 'center', marginTop: '2rem' }}>
          <span style={{ fontSize: '3rem' }}>📭</span>
          <h3 style={{ margin: '1rem 0' }}>No flashcards saved yet.</h3>
          <p style={{ color: 'var(--text-secondary)' }}>Go to Global Flashcards or other modules and click "Save" to build your collection.</p>
        </div>
      ) : (
        <div className="flashcards-viewer">
          <div className="viewer-header" style={{ justifyContent: 'space-between', display: 'flex' }}>
            <div>
              <span className="badge badge-primary" style={{ marginRight: '8px' }}>Saved Items</span>
              <span className="badge badge-info">{flashcards.length} Total</span>
            </div>
          </div>

          {currentCard && (
            <div style={{ marginTop: '1rem' }}>
              <FlashCard
                front={currentCard.front}
                back={currentCard.back}
                unit={currentCard.unit}
                paper={currentCard.paper}
                current={currentIndex}
                total={flashcards.length}
                onNext={() => setCurrentIndex((i) => Math.min(i + 1, flashcards.length - 1))}
                onPrev={() => setCurrentIndex((i) => Math.max(i - 1, 0))}
              />
            </div>
          )}

          <div className="flashcards-grid stagger-children" style={{ marginTop: '2rem' }}>
            {flashcards.map((fc, idx) => (
              <div
                key={idx}
                className={`fc-preview glass-card ${idx === currentIndex ? 'active' : ''}`}
                onClick={() => setCurrentIndex(idx)}
              >
                <span className="fc-preview-num">{idx + 1}</span>
                <p>{fc.front.substring(0, 60)}...</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
