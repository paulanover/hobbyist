const AuditLog = require('../models/auditLogModel');

/**
 * Add an entry to the audit log (MongoDB only)
 * @param {Object} logData - Log data
 */
exports.addAuditLog = async (logData) => {
  console.log('[addAuditLog] Called with:', JSON.stringify(logData, null, 2));
  try {
    const log = new AuditLog(logData);
    await log.save();
    console.log('[addAuditLog] Successfully saved audit log:', log._id);
    return true;
  } catch (error) {
    console.error('[addAuditLog] Error adding audit log (MongoDB):', error);
    if (error.errors) {
      Object.keys(error.errors).forEach(key => {
        console.error(`[addAuditLog] Validation error for ${key}:`, error.errors[key].message);
      });
    }
    return false;
  }
};
