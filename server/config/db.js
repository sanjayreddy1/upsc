const { Pool } = require('pg');
require('dotenv').config();

// Create PostgreSQL connection pool
// Render provides a DATABASE_URL environment variable for Postgres natively.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || `postgres://${process.env.DB_USER || 'postgres'}:${process.env.DB_PASSWORD || 'UpscAppPassword123!'}@${process.env.DB_SERVER || 'localhost'}:${process.env.DB_PORT || '5432'}/${process.env.DB_NAME || 'upsc_db'}`,
  // SSL is required for Render databases
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false 
});

pool.connect()
  .then(client => {
    console.log('Connected to PostgreSQL Database');
    client.release();
  })
  .catch(err => {
    console.error('Database Connection Failed! Bad Config: ', err);
    console.error('Please ensure DATABASE_URL is set in Render environment variables.');
    // We remove process.exit(1) so the frontend can still be served, 
    // even though API calls will fail until the DB is configured.
  });

module.exports = { pool };
