require('dotenv').config();
const { pool } = require('./config/db');

async function runMigration() {
  try {
    console.log('Running preferences migration...');
    
    await pool.query(`
      ALTER TABLE Users 
      ADD COLUMN IF NOT EXISTS app_data TEXT DEFAULT '{}';
    `);
    
    console.log('app_data column added successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
