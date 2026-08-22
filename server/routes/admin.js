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
// @desc    Get all users and their basic evaluation metrics
router.get('/users', auth, isAdmin, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        id, 
        name, 
        email, 
        role, 
        created_at
      FROM Users
      ORDER BY created_at DESC
    `);

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching users' });
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
