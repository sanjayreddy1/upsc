import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';

export function useFlashcards() {
  const [flashcards, setFlashcards] = useState([]);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();

  const fetchFlashcards = useCallback(async () => {
    if (token) {
      try {
        const res = await fetch('http://localhost:5000/api/user/flashcards', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          // API returns { question, answer, topic, subject }
          // The UI expects { front, back, unit, paper }
          const mapped = data.map(d => ({
            id: d.id,
            front: d.question,
            back: d.answer,
            unit: d.topic,
            paper: d.subject
          }));
          setFlashcards(mapped);
          setLoading(false);
          return;
        }
      } catch (err) {
        console.warn('Failed to fetch flashcards from DB', err);
      }
    }

    // Fallback to localStorage
    try {
      const saved = JSON.parse(localStorage.getItem('savedFlashcards') || '[]');
      setFlashcards(saved);
    } catch (e) {
      setFlashcards([]);
    }
    setLoading(false);
  }, [token]);

  useEffect(() => {
    fetchFlashcards();
    
    // Listen for custom event from FlashCard component
    window.addEventListener('flashcardsUpdated', fetchFlashcards);
    return () => window.removeEventListener('flashcardsUpdated', fetchFlashcards);
  }, [fetchFlashcards]);

  const saveFlashcard = async (card) => {
    // Check if it exists
    const isSaved = flashcards.some(c => c.front === card.front && c.back === card.back);
    
    if (isSaved) {
      // Unsave
      if (token) {
        try {
          await fetch('http://localhost:5000/api/user/flashcards', {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ question: card.front })
          });
        } catch (err) {
          console.warn('Failed to delete flashcard from DB', err);
        }
      } else {
        const saved = flashcards.filter(c => c.front !== card.front || c.back !== card.back);
        localStorage.setItem('savedFlashcards', JSON.stringify(saved));
      }
    } else {
      // Save
      if (token) {
        try {
          await fetch('http://localhost:5000/api/user/flashcards', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ 
              question: card.front, 
              answer: card.back, 
              topic: card.unit || '', 
              subject: card.paper || '' 
            })
          });
        } catch (err) {
          console.warn('Failed to save flashcard to DB', err);
        }
      } else {
        const saved = [...flashcards, card];
        localStorage.setItem('savedFlashcards', JSON.stringify(saved));
      }
    }
    
    // Refresh
    await fetchFlashcards();
    // Dispatch event for other components
    window.dispatchEvent(new Event('flashcardsUpdated'));
  };

  const isCardSaved = (front, back) => {
    return flashcards.some(c => c.front === front && c.back === back);
  };

  return {
    flashcards,
    loading,
    saveFlashcard,
    isCardSaved
  };
}
