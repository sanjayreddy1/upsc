/**
 * useQuestionGenerator — Hook for AI question generation with caching and daily limits
 */

import { useState, useCallback, useEffect } from 'react';
import { generateEssayQuestions, generateMCQs, generateCSATQuestions, generateCurrentAffairsMCQs, generateSociologyQuizQuestions, generateGlobalFlashcards } from '../services/groqService';
import { APP_CONFIG } from '../config/api';

function getTodayKey() {
  return new Date().toISOString().split('T')[0];
}

function getWeekKey() {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const weekNum = Math.ceil(((now - startOfYear) / 86400000 + startOfYear.getDay() + 1) / 7);
  return `${now.getFullYear()}-W${weekNum}`;
}

export function useQuestionGenerator() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ── Essay Questions (4/day) ──
  const getEssayQuestions = useCallback(async (paper) => {
    const cacheKey = `essay_${paper}_${getTodayKey()}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) return JSON.parse(cached);

    setLoading(true);
    setError(null);
    try {
      const questions = await generateEssayQuestions(paper, 1);
      // Cache today's questions
      localStorage.setItem(cacheKey, JSON.stringify(questions));
      return questions;
    } catch (err) {
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // ── MCQ Questions ──
  const getMCQs = useCallback(async (subject, topic, difficulty = 'hard', count = 5) => {
    setLoading(true);
    setError(null);
    try {
      const globalDifficulty = localStorage.getItem('global_difficulty');
      const finalDifficulty = globalDifficulty || difficulty;
      const questions = await generateMCQs(subject, topic, finalDifficulty, count);
      return questions;
    } catch (err) {
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // ── CSAT Questions ──
  const getCSATQuestions = useCallback(async (type, count = 5) => {
    setLoading(true);
    setError(null);
    try {
      const result = await generateCSATQuestions(type, count);
      return result;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Current Affairs ──
  const getCurrentAffairsMCQs = useCallback(async (categoryId, count = 5) => {
    setLoading(true);
    setError(null);
    try {
      const questions = await generateCurrentAffairsMCQs(categoryId, count);
      return questions;
    } catch (err) {
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Sociology Quiz (3/week) ──
  const getSociologyQuiz = useCallback(async () => {
    const cacheKey = `sociology_quiz_${getWeekKey()}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) return JSON.parse(cached);

    setLoading(true);
    setError(null);
    try {
      const questions = await generateSociologyQuizQuestions(APP_CONFIG.sociologyQuestionsPerWeek);
      localStorage.setItem(cacheKey, JSON.stringify(questions));
      return questions;
    } catch (err) {
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Global Flashcards ──
  const getGlobalFlashcards = useCallback(async (subject, topic, count = 10) => {
    setLoading(true);
    setError(null);
    try {
      const questions = await generateGlobalFlashcards(subject, topic, count);
      return questions;
    } catch (err) {
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    getEssayQuestions,
    getMCQs,
    getCSATQuestions,
    getCurrentAffairsMCQs,
    getSociologyQuiz,
    getGlobalFlashcards,
  };
}
