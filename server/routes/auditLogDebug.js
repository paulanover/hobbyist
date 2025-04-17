// Temporary debug route to list the latest 10 audit logs
const express = require('express');
const router = express.Router();
const AuditLog = require('../models/auditLogModel');

// GET /api/audit-logs/debug-latest
router.get('/debug-latest', async (req, res) => {
  try {
    const logs = await AuditLog.find({})
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch logs', details: String(err) });
  }
});

module.exports = router;
