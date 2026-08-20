const { pool } = require('../config/db');

/**
 * Log a user activity to the ActivityLogs table.
 * Non-blocking — errors are silently caught so they never break the main request.
 *
 * @param {object} opts
 * @param {number|null} opts.userId   - The user's ID (null for failed/anonymous actions)
 * @param {string} opts.action        - Short action identifier (e.g. 'LOGIN', 'REGISTER', 'SAVE_FLASHCARD')
 * @param {string} [opts.detail]      - Human-readable detail string
 * @param {string} [opts.ip]          - Client IP address
 */
async function logActivity({ userId, action, detail, ip }) {
  try {
    await pool.query(
      `INSERT INTO ActivityLogs (user_id, action, detail, ip_address) VALUES ($1, $2, $3, $4)`,
      [userId || null, action, detail || null, ip || null]
    );
  } catch (err) {
    // Never let logging break the main flow
    console.warn('Activity log write failed:', err.message);
  }
}

module.exports = { logActivity };
