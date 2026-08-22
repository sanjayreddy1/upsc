require('dotenv').config();
const { pool } = require('./config/db');

async function runMigration() {
  try {
    console.log("Running What's New migration...");
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS SystemSettings (
          key VARCHAR(100) PRIMARY KEY,
          value TEXT NOT NULL,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('SystemSettings table created.');

    const initialConfig = {
      version: '2.5.0',
      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      title: "What's New 🎉",
      changes: [
        '✅ Fixed MCQ evaluation — scores now display correctly on first try',
        '✅ Accurate marks display (e.g., 12.68/20 instead of percentage)',
        '📊 History page now opens full evaluation with question review',
        '⚡ Faster & more reliable question generation (auto-retry on failure)',
      ]
    };

    await pool.query(`
      INSERT INTO SystemSettings (key, value)
      VALUES ($1, $2)
      ON CONFLICT (key) DO NOTHING;
    `, ['whatsnew_config', JSON.stringify(initialConfig)]);
    console.log('Initial whatsnew_config seeded.');

    console.log('Migration completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
