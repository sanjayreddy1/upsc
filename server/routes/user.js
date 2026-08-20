const express = require('express');
const { pool } = require('../config/db');
const { auth } = require('../middleware/auth');
const { logActivity } = require('../helpers/activityLogger');

const router = express.Router();

// @route   POST /api/user/evaluations
// @desc    Save an evaluation metric for the logged-in user
router.post('/evaluations', auth, async (req, res) => {
  try {
    const { test_type, score, total, details } = req.body;

    await pool.query(`
      INSERT INTO EvaluationMetrics (user_id, test_type, score, total, details)
      VALUES ($1, $2, $3, $4, $5)
    `, [req.user.id, test_type, score, total, JSON.stringify(details || {})]);

    logActivity({ userId: req.user.id, action: 'SAVE_EVALUATION', detail: `${test_type} — Score: ${score}/${total}`, ip: req.ip });

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
    const result = await pool.query(`
      SELECT * FROM EvaluationMetrics 
      WHERE user_id = $1 
      ORDER BY created_at DESC
    `, [req.user.id]);

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching evaluations' });
  }
});

// @route   GET /api/user/streak
// @desc    Get user streak data
router.get('/streak', auth, async (req, res) => {
  try {
    let result = await pool.query('SELECT * FROM Streaks WHERE user_id = $1', [req.user.id]);

    if (result.rows.length === 0) {
      // Initialize streak if none exists
      await pool.query('INSERT INTO Streaks (user_id) VALUES ($1)', [req.user.id]);
      result = await pool.query('SELECT * FROM Streaks WHERE user_id = $1', [req.user.id]);
    }

    res.json(result.rows[0]);
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

    await pool.query(`
      UPDATE Streaks 
      SET current_streak = $1, 
          highest_streak = $2, 
          last_test_date = $3, 
          completed_today = $4 
      WHERE user_id = $5
    `, [currentStreak, highestStreak, lastTestDate, completedToday ? true : false, req.user.id]);

    logActivity({ userId: req.user.id, action: 'UPDATE_STREAK', detail: `Streak: ${currentStreak} (best: ${highestStreak})`, ip: req.ip });

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
    const result = await pool.query('SELECT * FROM SavedFlashcards WHERE user_id = $1 ORDER BY saved_at DESC', [req.user.id]);
    res.json(result.rows);
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

    await pool.query(`
      INSERT INTO SavedFlashcards (user_id, question, answer, topic, subject)
      VALUES ($1, $2, $3, $4, $5)
    `, [req.user.id, question, answer, topic, subject]);

    logActivity({ userId: req.user.id, action: 'SAVE_FLASHCARD', detail: `Topic: ${topic || 'General'} — ${subject || 'N/A'}`, ip: req.ip });

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

    await pool.query('DELETE FROM SavedFlashcards WHERE user_id = $1 AND question = $2', [req.user.id, question]);

    logActivity({ userId: req.user.id, action: 'DELETE_FLASHCARD', detail: `Removed flashcard`, ip: req.ip });

    res.json({ message: 'Flashcard removed successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error removing flashcard' });
  }
});

// @route   GET /api/user/preferences
// @desc    Get user application data (JSON)
router.get('/preferences', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT app_data FROM Users WHERE id = $1', [req.user.id]);
    res.json({ app_data: result.rows[0]?.app_data || '{}' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching preferences' });
  }
});

// @route   PUT /api/user/preferences
// @desc    Update user application data
router.put('/preferences', auth, async (req, res) => {
  try {
    const { app_data } = req.body;
    
    // Ensure it's stored as a string
    const dataString = typeof app_data === 'string' ? app_data : JSON.stringify(app_data);

    await pool.query('UPDATE Users SET app_data = $1 WHERE id = $2', [dataString, req.user.id]);

    logActivity({ userId: req.user.id, action: 'UPDATE_PREFERENCES', detail: 'User updated app preferences', ip: req.ip });

    res.json({ message: 'Preferences updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error updating preferences' });
  }
});

module.exports = router;
