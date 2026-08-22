const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: '../.env' });

const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const userRoutes = require('./routes/user');
const logsRoutes = require('./routes/logs');
const shareRoutes = require('./routes/share');

const app = express();
const PORT = process.env.PORT || 5000;

// Auto-create ActivityLogs table if it doesn't exist
const { pool } = require('./config/db');
(async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ActivityLogs (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES Users(id) ON DELETE SET NULL,
        action VARCHAR(100) NOT NULL,
        detail TEXT,
        ip_address VARCHAR(45),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON ActivityLogs (created_at DESC);`);
    console.log('ActivityLogs table ready.');
  } catch (err) {
    console.warn('ActivityLogs auto-migration skipped:', err.message);
  }
})();

// Middleware
app.set('trust proxy', true); // Get real client IP behind Render's proxy
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/user', userRoutes);
app.use('/api/logs', logsRoutes);
app.use('/api/share', shareRoutes);

// Serve static frontend in production (assuming root 'dist' folder when deployed via Dockerfile)
if (process.env.NODE_ENV === 'production' || process.env.SERVE_STATIC) {
  const distPath = path.join(__dirname, '../dist');
  app.use(express.static(distPath));

  app.get('/{*path}', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.send('API is running...');
  });
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
