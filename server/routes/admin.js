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
        u.id, 
        u.name, 
        u.email, 
        u.role, 
        u.created_at,
        COUNT(e.id) as total_tests_taken,
        AVG(e.score / NULLIF(e.total, 0)) * 100 as average_score_percentage
      FROM Users u
      LEFT JOIN EvaluationMetrics e ON u.id = e.user_id
      GROUP BY u.id, u.name, u.email, u.role, u.created_at
    `);

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching users' });
  }
});

// @route   GET /api/admin/evaluations/:userId
// @desc    Get detailed evaluation metrics for a specific user
router.get('/evaluations/:userId', auth, isAdmin, async (req, res) => {
  try {
    const result = await pool.query(`
        SELECT * FROM EvaluationMetrics 
        WHERE user_id = $1 
        ORDER BY created_at DESC
      `, [req.params.userId]);

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching evaluations' });
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
