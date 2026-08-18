const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { poolPromise } = require('../config/db');

const router = express.Router();

// Helper for basic password strength validation
function validatePassword(password) {
  // At least 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special character
  const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return re.test(password);
}

// @route   POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, confirmPassword } = req.body;

    if (!name || !email || !password || !confirmPassword) {
      return res.status(400).json({ message: 'Not all fields have been entered.' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match.' });
    }

    if (!validatePassword(password)) {
      return res.status(400).json({ 
        message: 'Password must be at least 8 characters long, contain an uppercase letter, a lowercase letter, a number, and a special character.' 
      });
    }

    const pool = await poolPromise;
    
    // Check if user exists
    const userCheck = await pool.request()
      .input('email', email)
      .query('SELECT id FROM Users WHERE email = @email');

    if (userCheck.recordset.length > 0) {
      return res.status(400).json({ message: 'An account with this email already exists.' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Default role 'user'
    const insertResult = await pool.request()
      .input('name', name)
      .input('email', email)
      .input('password_hash', passwordHash)
      .input('role', 'user')
      .query(`
        INSERT INTO Users (name, email, password_hash, role) 
        OUTPUT INSERTED.id, INSERTED.name, INSERTED.email, INSERTED.role
        VALUES (@name, @email, @password_hash, @role)
      `);

    const user = insertResult.recordset[0];

    const token = jwt.sign(
      { id: user.id, role: user.role }, 
      process.env.JWT_SECRET || 'super_secret_jwt_key_123',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// @route   POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Not all fields have been entered.' });
    }

    const pool = await poolPromise;
    const result = await pool.request()
      .input('email', email)
      .query('SELECT * FROM Users WHERE email = @email');

    if (result.recordset.length === 0) {
      return res.status(400).json({ message: 'No account with this email has been registered.' });
    }

    const user = result.recordset[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials.' });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role }, 
      process.env.JWT_SECRET || 'super_secret_jwt_key_123',
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error during login' });
  }
});

module.exports = router;
