const express = require('express');
const bcrypt = require('bcrypt');
const { pool } = require('../config/db');
const { auth, isAdmin } = require('../middleware/auth');
const { logActivity } = require('../helpers/activityLogger');

const router = express.Router();

// @route   POST /api/admin/whatsnew
// @desc    Update the What's New configuration
// @access  Admin
router.post('/whatsnew', auth, isAdmin, async (req, res) => {
  try {
    const config = req.body;
    await pool.query(`
      INSERT INTO SystemSettings (key, value)
      VALUES ($1, $2)
      ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP
    `, ['whatsnew_config', JSON.stringify(config)]);
    
    logActivity({ userId: req.user.id, action: 'UPDATE_WHATSNEW', detail: `Version: ${config.version}`, ip: req.ip });
    res.json({ message: "What's New updated successfully" });
  } catch (err) {
    console.error('Error updating whatsnew:', err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/admin/users
// @desc    Get all users with their daily quiz status
router.get('/users', auth, isAdmin, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        u.id, 
        u.name, 
        u.email, 
        u.role, 
        u.created_at,
        u.app_data,
        COALESCE(s.completed_today, false) AS completed_today,
        s.current_streak,
        s.highest_streak,
        s.last_test_date
      FROM Users u
      LEFT JOIN Streaks s ON u.id = s.user_id
      ORDER BY u.created_at DESC
    `);

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching users' });
  }
});

// @route   DELETE /api/admin/users/:id
// @desc    Delete a user and all their associated data
// @access  Admin
router.delete('/users/:id', auth, isAdmin, async (req, res) => {
  const client = await pool.connect();
  try {
    const userId = parseInt(req.params.id);

    // Prevent admin from deleting themselves
    if (userId === req.user.id) {
      return res.status(400).json({ message: 'You cannot delete your own account' });
    }

    await client.query('BEGIN');

    // Delete from all dependent tables first
    await client.query('DELETE FROM SavedFlashcards WHERE user_id = $1', [userId]);
    await client.query('DELETE FROM TokenUsage WHERE user_id = $1', [userId]);
    await client.query('DELETE FROM EvaluationMetrics WHERE user_id = $1', [userId]);
    await client.query('DELETE FROM Streaks WHERE user_id = $1', [userId]);
    await client.query('DELETE FROM ActivityLogs WHERE user_id = $1', [userId]);

    // Check for SharedEvaluations table (may not exist)
    try {
      await client.query('DELETE FROM SharedEvaluations WHERE user_id = $1', [userId]);
    } catch (_) { /* table may not exist */ }

    // Finally delete the user
    const result = await client.query('DELETE FROM Users WHERE id = $1 RETURNING id, email', [userId]);

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'User not found' });
    }

    await client.query('COMMIT');

    logActivity({ userId: req.user.id, action: 'ADMIN_DELETE_USER', detail: `Deleted user: ${result.rows[0].email} (ID: ${userId})`, ip: req.ip });

    res.json({ message: `User ${result.rows[0].email} deleted successfully` });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ message: 'Server error deleting user' });
  } finally {
    client.release();
  }
});

// @route   POST /api/admin/reset-daily-limit/:id
// @desc    Reset a user's daily test completion status
// @access  Admin
router.post('/reset-daily-limit/:id', auth, isAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);

    const result = await pool.query(
      'UPDATE Streaks SET completed_today = FALSE WHERE user_id = $1 RETURNING user_id',
      [userId]
    );

    if (result.rows.length === 0) {
      // No streak record exists — create one with completed_today = false
      await pool.query('INSERT INTO Streaks (user_id, completed_today) VALUES ($1, FALSE)', [userId]);
    }

    logActivity({ userId: req.user.id, action: 'ADMIN_RESET_DAILY', detail: `Reset daily limit for user ID: ${userId}`, ip: req.ip });

    res.json({ message: 'Daily test limit reset successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error resetting daily limit' });
  }
});

// @route   POST /api/admin/set-difficulty/:id
// @desc    Set a user's difficulty level preference
// @access  Admin
router.post('/set-difficulty/:id', auth, isAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { difficulty } = req.body;

    if (!['easy', 'medium', 'hard'].includes(difficulty)) {
      return res.status(400).json({ message: 'Invalid difficulty level. Must be easy, medium, or hard.' });
    }

    // Get existing app_data
    const userResult = await pool.query('SELECT app_data FROM Users WHERE id = $1', [userId]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    let appData = {};
    try {
      appData = JSON.parse(userResult.rows[0].app_data || '{}');
    } catch (_) {
      appData = {};
    }

    // Update difficulty settings
    appData.global_difficulty = difficulty;
    appData.daily_test_difficulty = difficulty;

    await pool.query(
      'UPDATE Users SET app_data = $1 WHERE id = $2',
      [JSON.stringify(appData), userId]
    );

    logActivity({ userId: req.user.id, action: 'ADMIN_SET_DIFFICULTY', detail: `Set difficulty to "${difficulty}" for user ID: ${userId}`, ip: req.ip });

    res.json({ message: `Difficulty set to "${difficulty}" successfully` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error setting difficulty' });
  }
});


// @route   GET /api/admin/tokens
// @desc    Get all token usage history
router.get('/tokens', auth, isAdmin, async (req, res) => {
  try {
    const result = await pool.query(`
        SELECT t.id, t.tokens_used, t.action, t.created_at, u.email 
        FROM TokenUsage t
        JOIN Users u ON t.user_id = u.id
        ORDER BY t.created_at DESC
      `);

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching tokens' });
  }
});

// @route   GET /api/admin/logs
// @desc    Get all system logs
router.get('/logs', auth, isAdmin, async (req, res) => {
  try {
    const result = await pool.query(`
        SELECT * FROM SystemLogs 
        ORDER BY created_at DESC
      `);

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching logs' });
  }
});

// @route   PUT /api/admin/change-password
// @desc    Admin changes a user's password
router.put('/change-password', auth, isAdmin, async (req, res) => {
  try {
    const { userId, newPassword } = req.body;

    if (!userId || !newPassword) {
      return res.status(400).json({ message: 'Please provide user ID and new password' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await pool.query(
      'UPDATE Users SET password_hash = $1 WHERE id = $2', 
      [passwordHash, userId]
    );

    logActivity({ userId: req.user.id, action: 'ADMIN_CHANGE_PASSWORD', detail: `Admin changed password for user ID: ${userId}`, ip: req.ip });

    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error updating password' });
  }
});

// @route   GET /api/admin/activity
// @desc    Get all user activity logs
router.get('/activity', auth, isAdmin, async (req, res) => {
  try {
    const result = await pool.query(`
        SELECT a.id, a.action, a.detail, a.ip_address, a.created_at, u.email, u.name
        FROM ActivityLogs a
        LEFT JOIN Users u ON a.user_id = u.id
        ORDER BY a.created_at DESC
        LIMIT 500
      `);

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching activity logs' });
  }
});

// @route   GET /api/admin/evaluations
// @desc    Get all users' evaluation scores and history
router.get('/evaluations', auth, isAdmin, async (req, res) => {
  try {
    const result = await pool.query(`
        SELECT e.id, e.test_type, e.score, e.total, e.details, e.created_at, u.email, u.name
        FROM EvaluationMetrics e
        JOIN Users u ON e.user_id = u.id
        ORDER BY e.created_at DESC
        LIMIT 500
      `);

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching evaluations' });
  }
});

module.exports = router;
