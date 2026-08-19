const express = require('express');
const { pool } = require('../config/db');
const { auth } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/logs/token
// @desc    Record AI token usage for a user
router.post('/token', auth, async (req, res) => {
  try {
    const { action, tokens_used } = req.body;
    
    if (!action || tokens_used === undefined) {
      return res.status(400).json({ message: 'Action and tokens_used are required' });
    }

    await pool.query(
      'INSERT INTO TokenUsage (user_id, tokens_used, action) VALUES ($1, $2, $3)',
      [req.user.id, tokens_used, action]
    );

    res.status(201).json({ success: true });
  } catch (err) {
    console.error('Error logging token usage:', err);
    res.status(500).json({ message: 'Server error logging token usage' });
  }
});

// @route   POST /api/logs/system
// @desc    Record a system log (error, info, etc)
router.post('/system', async (req, res) => {
  try {
    const { level, message, meta } = req.body;
    
    if (!level || !message) {
      return res.status(400).json({ message: 'Level and message are required' });
    }

    await pool.query(
      'INSERT INTO SystemLogs (level, message, meta) VALUES ($1, $2, $3)',
      [level, message, meta ? JSON.stringify(meta) : null]
    );

    res.status(201).json({ success: true });
  } catch (err) {
    console.error('Error logging system event:', err);
    res.status(500).json({ message: 'Server error logging system event' });
  }
});

module.exports = router;
