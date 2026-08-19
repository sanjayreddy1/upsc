require('dotenv').config();
const { pool } = require('./config/db');

async function runMigration() {
  try {
    console.log('Running migration...');
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS TokenUsage (
          id SERIAL PRIMARY KEY,
          user_id INT NOT NULL REFERENCES Users(id),
          tokens_used INT NOT NULL,
          action VARCHAR(100) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('TokenUsage table created.');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS SystemLogs (
          id SERIAL PRIMARY KEY,
          level VARCHAR(20) NOT NULL,
          message TEXT NOT NULL,
          meta TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('SystemLogs table created.');

    console.log('Migration completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
