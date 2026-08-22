const express = require('express');
const { pool } = require('../config/db');
const { auth } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/share
// @desc    Create a new shared evaluation link
// @access  Public
router.post('/', async (req, res) => {
  try {
    const { evaluationData } = req.body;
    
    if (!evaluationData) {
      return res.status(400).json({ message: 'Evaluation data is required' });
    }

    const result = await pool.query(`
      INSERT INTO SharedEvaluations (data)
      VALUES ($1)
      RETURNING id
    `, [JSON.stringify(evaluationData)]);

    res.json({ id: result.rows[0].id });
  } catch (err) {
    console.error('Error creating share link:', err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/share/:id
// @desc    Get a shared evaluation by UUID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Validate UUID format roughly
    const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    if (!uuidRegex.test(id)) {
      return res.status(400).json({ message: 'Invalid share ID' });
    }

    const result = await pool.query(`
      SELECT data, created_at 
      FROM SharedEvaluations 
      WHERE id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Shared evaluation not found' });
    }

    res.json(result.rows[0].data);
  } catch (err) {
    console.error('Error fetching shared evaluation:', err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
