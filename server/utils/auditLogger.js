const { pool } = require('../config/db');

/**
 * Add an entry to the audit log
 * @param {Object} logData - Log data
 */
exports.addAuditLog = async (logData) => {
  // Check if pool exists (might be removed if fully migrated)
  if (!pool) {
      console.warn('Audit logging skipped: MySQL pool not configured.');
      return false;
  }
  try {
    const { userId, actionType, description, entityType, entityId, ipAddress } = logData;

    // Convert Mongoose ObjectId to string if necessary for MySQL
    const userIdString = userId?.toString();
    const entityIdString = entityId?.toString();

    await pool.query(
      `INSERT INTO AuditLogs
      (user_id, action_type, description, entity_type, entity_id, ip_address)
      VALUES (?, ?, ?, ?, ?, ?)`,
      // Use string representations for IDs if storing ObjectId in MySQL VARCHAR
      [userIdString, actionType, description, entityType || null, entityIdString || null, ipAddress]
    );

    return true;
  } catch (error) {
    console.error('Error adding audit log:', error);
    return false;
  }
};
