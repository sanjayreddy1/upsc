const express = require('express');
const bcrypt = require('bcrypt');
const { pool } = require('../config/db');
const { auth, isAdmin } = require('../middleware/auth');

const router = express.Router();

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

    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error updating password' });
  }
});

module.exports = router;
