require('dotenv').config();
const { pool } = require('./config/db');

async function runMigration() {
  try {
    console.log("Running SharedEvaluations migration...");
    
    // Enable uuid-ossp extension if not exists
    await pool.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS SharedEvaluations (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          data JSONB NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('SharedEvaluations table created.');

    console.log('Migration completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
