const sql = require('mssql');
require('dotenv').config();

const dbConfig = {
  user: process.env.DB_USER || 'sa',
  password: process.env.DB_PASSWORD || 'UpscAppPassword123!',
  server: process.env.DB_SERVER || 'localhost',
  port: parseInt(process.env.DB_PORT || '1433'),
  database: process.env.DB_NAME || 'upsc_db',
  options: {
    encrypt: true,
    trustServerCertificate: true // necessary for local dev
  }
};

const poolPromise = new sql.ConnectionPool(dbConfig)
  .connect()
  .then(pool => {
    console.log('Connected to MS SQL Server');
    return pool;
  })
  .catch(err => {
    console.error('Database Connection Failed! Bad Config: ', err);
    console.error('Please ensure DB_SERVER, DB_USER, DB_PASSWORD, etc. are set in Render environment variables.');
    // We remove process.exit(1) so the frontend can still be served, 
    // even though API calls will fail until the DB is configured.
  });

module.exports = {
  sql,
  poolPromise
};
