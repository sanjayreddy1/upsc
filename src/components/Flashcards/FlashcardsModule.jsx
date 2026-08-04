import { useState } from 'react';
import { useQuestionGenerator } from '../../hooks/useQuestionGenerator';
import FlashCard from '../Common/FlashCard';
import './FlashcardsModule.css';

const SUBJECTS = [
  { id: 'History', name: 'History' },
  { id: 'Geography', name: 'Geography' },
  { id: 'Polity', name: 'Polity & Governance' },
  { id: 'Economy', name: 'Economy' },
  { id: 'Science', name: 'Science & Tech' },
  { id: 'Environment', name: 'Environment' },
  { id: 'CurrentAffairs', name: 'Current Affairs' },
  { id: 'Sociology', name: 'Sociology Optional' },
];

export default function FlashcardsModule() {
  const [activeSubject, setActiveSubject] = useState('History');
  const [topic, setTopic] = useState('');
  const [cardCount, setCardCount] = useState(10);
  const [flashcards, setFlashcards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const { loading, error, getGlobalFlashcards } = useQuestionGenerator();

  const handleGenerate = async () => {
    setFlashcards([]);
    setCurrentIndex(0);
    const finalTopic = topic.trim() || 'General Concepts';
    const finalCount = Math.max(10, cardCount);
    if (finalCount !== cardCount) setCardCount(finalCount);

    const cards = await getGlobalFlashcards(activeSubject, finalTopic, finalCount);
    if (cards?.length) {
      setFlashcards(cards);
    }
  };

  const currentCard = flashcards[currentIndex];

  return (
    <div className="flashcards-module animate-fade-in">
      <div className="flashcards-header">
        <h1>🃏 Global Flashcards</h1>
        <p className="flashcards-desc">Generate AI flashcards for any UPSC subject or specific topic for quick revision.</p>
      </div>

      {flashcards.length === 0 && !loading && (
        <div className="flashcards-generator glass-card">
          <div className="fg-group">
            <label>Select Subject</label>
            <div className="fg-subjects">
              {SUBJECTS.map((s) => (
                <button
                  key={s.id}
                  className={`btn btn-sm ${activeSubject === s.id ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setActiveSubject(s.id)}
                >
                  {s.name}
                </button>
              ))}
            </div>
          </div>

          <div className="fg-group">
            <label htmlFor="topic-input">Specific Topic (Optional)</label>
            <input
              id="topic-input"
              type="text"
              className="input"
              placeholder="e.g., Fundamental Rights, Monsoons, Inflation..."
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            />
          </div>

          <div className="fg-group" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <label htmlFor="card-count" style={{ fontWeight: 600 }}>Number of Cards:</label>
            <input
              id="card-count"
              type="number"
              className="input"
              min="10"
              max="100"
              value={cardCount}
              onChange={(e) => setCardCount(Number(e.target.value))}
              style={{ width: '80px', textAlign: 'center' }}
            />
          </div>

          <button className="btn btn-primary btn-lg fg-submit" onClick={handleGenerate}>
            🔄 Generate Flashcards
          </button>
        </div>
      )}

      {loading && (
        <div className="loading-container">
          <div className="spinner spinner-lg"></div>
          <p>Generating flashcards for {activeSubject}...</p>
        </div>
      )}

      {error && (
        <div className="error-banner glass-card">
          <span>⚠️ {error}</span>
          <button className="btn btn-sm btn-primary" onClick={handleGenerate}>Retry</button>
        </div>
      )}

      {!loading && flashcards.length > 0 && (
        <div className="flashcards-viewer">
          <div className="viewer-header">
            <button className="btn btn-secondary btn-sm" onClick={() => setFlashcards([])}>
              ⬅️ Back to Generator
            </button>
            <span className="badge badge-primary">{activeSubject}</span>
            <span className="badge badge-info">{topic || 'General'}</span>
          </div>

          {currentCard && (
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
          )}

          <div className="flashcards-grid stagger-children">
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
