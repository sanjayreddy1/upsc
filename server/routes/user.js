const express = require('express');
const { poolPromise } = require('../config/db');
const { auth } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/user/evaluations
// @desc    Save an evaluation metric for the logged-in user
router.post('/evaluations', auth, async (req, res) => {
  try {
    const { test_type, score, total, details } = req.body;
    const pool = await poolPromise;

    await pool.request()
      .input('user_id', req.user.id)
      .input('test_type', test_type)
      .input('score', score)
      .input('total', total)
      .input('details', JSON.stringify(details || {}))
      .query(`
        INSERT INTO EvaluationMetrics (user_id, test_type, score, total, details)
        VALUES (@user_id, @test_type, @score, @total, @details)
      `);

    res.json({ message: 'Evaluation saved successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error saving evaluation' });
  }
});

// @route   GET /api/user/evaluations
// @desc    Get all evaluation metrics for the logged-in user
router.get('/evaluations', auth, async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('user_id', req.user.id)
      .query(`
        SELECT * FROM EvaluationMetrics 
        WHERE user_id = @user_id 
        ORDER BY created_at DESC
      `);

    res.json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching evaluations' });
  }
});

// @route   GET /api/user/streak
// @desc    Get user streak data
router.get('/streak', auth, async (req, res) => {
  try {
    const pool = await poolPromise;
    let result = await pool.request()
      .input('user_id', req.user.id)
      .query('SELECT * FROM Streaks WHERE user_id = @user_id');

    if (result.recordset.length === 0) {
      // Initialize streak if none exists
      await pool.request()
        .input('user_id', req.user.id)
        .query('INSERT INTO Streaks (user_id) VALUES (@user_id)');
      
      result = await pool.request()
        .input('user_id', req.user.id)
        .query('SELECT * FROM Streaks WHERE user_id = @user_id');
    }

    res.json(result.recordset[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching streak' });
  }
});

// @route   PUT /api/user/streak
// @desc    Update user streak data
router.put('/streak', auth, async (req, res) => {
  try {
    const { currentStreak, highestStreak, lastTestDate, completedToday } = req.body;
    const pool = await poolPromise;

    await pool.request()
      .input('user_id', req.user.id)
      .input('current_streak', currentStreak)
      .input('highest_streak', highestStreak)
      .input('last_test_date', lastTestDate)
      .input('completed_today', completedToday ? 1 : 0)
      .query(`
        UPDATE Streaks 
        SET current_streak = @current_streak, 
            highest_streak = @highest_streak, 
            last_test_date = @last_test_date, 
            completed_today = @completed_today 
        WHERE user_id = @user_id
      `);

    res.json({ message: 'Streak updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error updating streak' });
  }
});

// @route   GET /api/user/flashcards
// @desc    Get all saved flashcards for user
router.get('/flashcards', auth, async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('user_id', req.user.id)
      .query('SELECT * FROM SavedFlashcards WHERE user_id = @user_id ORDER BY saved_at DESC');

    res.json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching flashcards' });
  }
});

// @route   POST /api/user/flashcards
// @desc    Save a new flashcard
router.post('/flashcards', auth, async (req, res) => {
  try {
    const { question, answer, topic, subject } = req.body;
    const pool = await poolPromise;

    await pool.request()
      .input('user_id', req.user.id)
      .input('question', question)
      .input('answer', answer)
      .input('topic', topic)
      .input('subject', subject)
      .query(`
        INSERT INTO SavedFlashcards (user_id, question, answer, topic, subject)
        VALUES (@user_id, @question, @answer, @topic, @subject)
      `);

    res.json({ message: 'Flashcard saved successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error saving flashcard' });
  }
});

// @route   DELETE /api/user/flashcards
// @desc    Remove a saved flashcard by question text
router.delete('/flashcards', auth, async (req, res) => {
  try {
    const { question } = req.body;
    const pool = await poolPromise;

    await pool.request()
      .input('user_id', req.user.id)
      .input('question', question)
      .query('DELETE FROM SavedFlashcards WHERE user_id = @user_id AND question = @question');

    res.json({ message: 'Flashcard removed successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error removing flashcard' });
  }
});

module.exports = router;
