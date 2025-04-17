const express = require('express');
const router = express.Router();
const auditLogController = require('../controllers/auditLogController');
const { protect } = require('../middleware/authMiddleware');

// GET /api/audit-logs?month=YYYY-MM
router.get('/', protect, auditLogController.getAuditLogs);

// TEMP: Debug endpoint to list latest 10 audit logs (raw)
router.get('/debug-latest', protect, async (req, res) => {
  try {
    const AuditLog = require('../models/auditLogModel');
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
