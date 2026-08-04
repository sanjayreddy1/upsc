/**
 * useEvaluation — Hook for answer evaluation using algorithms + AI
 */

import { useState, useCallback } from 'react';
import { compareTextsJaroWinkler } from '../algorithms/jaroWinkler';
import { compareTextsLevenshtein } from '../algorithms/levenshtein';
import { compareTextsSoundex } from '../algorithms/soundex';
import { evaluateAnswer } from '../services/groqService';

export function useEvaluation() {
  const [evaluating, setEvaluating] = useState(false);
  const [evaluation, setEvaluation] = useState(null);
  const [error, setError] = useState(null);

  const evaluate = useCallback(async (question, userAnswer, keyPoints = [], type = 'essay') => {
    if (!userAnswer || userAnswer.trim().length < 10) {
      setError('Please provide a more detailed answer (at least 10 characters).');
      return null;
    }

    setEvaluating(true);
    setError(null);

    try {
      // ── Step 1: Algorithmic Analysis ──
      const keyPointsText = keyPoints.join(' ');

      const jaroWinklerScore = keyPointsText
        ? compareTextsJaroWinkler(userAnswer, keyPointsText)
        : 0;

      const levenshteinScore = keyPointsText
        ? compareTextsLevenshtein(userAnswer, keyPointsText)
        : 0;

      const soundexScore = keyPointsText
        ? compareTextsSoundex(userAnswer, keyPointsText)
        : 0;

      const algorithmicScores = {
        jaroWinkler: Math.round(jaroWinklerScore * 100),
        levenshtein: Math.round(levenshteinScore * 100),
        soundex: Math.round(soundexScore * 100),
        combined: Math.round(
          (jaroWinklerScore * 0.4 + levenshteinScore * 0.35 + soundexScore * 0.25) * 100
        ),
      };

      // ── Step 2: AI Evaluation ──
      const aiEvaluation = await evaluateAnswer(question, userAnswer, keyPoints, type, algorithmicScores);

      // ── Step 3: Combine Scores ──
      const aiScore = aiEvaluation?.percentage || 0;
      const algoScore = algorithmicScores.combined;

      // Weighted: 60% AI, 40% Algorithmic
      const finalScore = Math.round(aiScore * 0.6 + algoScore * 0.4);

      const result = {
        finalScore,
        algorithmicScores,
        aiEvaluation,
        timestamp: new Date().toISOString(),
        question,
        wordCount: userAnswer.split(/\s+/).filter(Boolean).length,
      };

      setEvaluation(result);

      // Save to history
      saveEvaluationHistory(result, type);

      return result;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setEvaluating(false);
    }
  }, []);

  const evaluateMCQ = useCallback((userAnswers, questions) => {
    let correct = 0;
    let incorrect = 0;
    let unanswered = 0;
    const results = [];

    questions.forEach((q, index) => {
      const userAnswer = userAnswers[index];
      if (!userAnswer) {
        unanswered++;
        results.push({ ...q, userAnswer: null, isCorrect: false, status: 'unanswered' });
      } else if (userAnswer === q.correct) {
        correct++;
        results.push({ ...q, userAnswer, isCorrect: true, status: 'correct' });
      } else {
        incorrect++;
        results.push({ ...q, userAnswer, isCorrect: false, status: 'incorrect' });
      }
    });

    // Apply negative marking (1/3 deduction per wrong answer)
    const totalMarks = questions.length;
    const rawScore = correct - incorrect * (1 / 3);
    const percentage = Math.round((Math.max(0, rawScore) / totalMarks) * 100);

    const evaluation = {
      correct,
      incorrect,
      unanswered,
      totalQuestions: questions.length,
      rawScore: Math.round(rawScore * 100) / 100,
      percentage,
      results,
      timestamp: new Date().toISOString(),
    };

    saveMCQHistory(evaluation);
    return evaluation;
  }, []);

  return {
    evaluating,
    evaluation,
    error,
    evaluate,
    evaluateMCQ,
    clearEvaluation: () => setEvaluation(null),
  };
}

// ── History Persistence ──────────────────────────────────────────────

function saveEvaluationHistory(result, type) {
  try {
    const key = `eval_history_${type}`;
    const history = JSON.parse(localStorage.getItem(key) || '[]');
    history.unshift({
      score: result.finalScore,
      date: result.timestamp,
      question: result.question?.substring(0, 100),
    });
    // Keep last 50 entries
    localStorage.setItem(key, JSON.stringify(history.slice(0, 50)));
  } catch (e) {
    console.warn('Failed to save evaluation history:', e);
  }
}

function saveMCQHistory(result) {
  try {
    const history = JSON.parse(localStorage.getItem('mcq_history') || '[]');
    history.unshift({
      score: result.percentage,
      correct: result.correct,
      total: result.totalQuestions,
      date: result.timestamp,
    });
    localStorage.setItem('mcq_history', JSON.stringify(history.slice(0, 50)));
  } catch (e) {
    console.warn('Failed to save MCQ history:', e);
  }
}

export function getEvaluationHistory(type) {
  try {
    return JSON.parse(localStorage.getItem(`eval_history_${type}`) || '[]');
  } catch {
    return [];
  }
}

export function getMCQHistory() {
  try {
    return JSON.parse(localStorage.getItem('mcq_history') || '[]');
  } catch {
    return [];
  }
}
