require('dotenv').config({ path: '../.env' });
const { pool } = require('./config/db');

async function runMigration() {
  try {
    console.log('Running ActivityLogs migration...');

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
    console.log('ActivityLogs table created.');

    // Create index for faster queries
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON ActivityLogs (created_at DESC);
    `);
    console.log('Index created.');

    console.log('Migration completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
