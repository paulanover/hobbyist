// Controller for fetching audit logs with lawyer initials and month filtering
const AuditLog = require('../models/auditLogModel');
const User = require('../models/User');
const Lawyer = require('../models/Lawyer');

// Helper: get start and end of month
function getMonthRange(monthString) {
  // monthString: 'YYYY-MM'
  const [year, month] = monthString.split('-').map(Number);
  // Use local time for start and end of month to match rest of app
  const start = new Date(year, month - 1, 1, 0, 0, 0, 0);
  const end = new Date(year, month, 1, 0, 0, 0, 0);
  return { start, end };
}

const Matter = require('../models/Matter');
const Client = require('../models/Client');

exports.getAuditLogs = async (req, res) => {
  const startTime = Date.now();
  let finished = false;
  // Timeout after 10 seconds
  const timeout = setTimeout(() => {
    if (!finished) {
      console.error('[AuditLog] TIMEOUT: getAuditLogs took too long');
      finished = true;
      res.status(504).json({ error: 'Audit log request timed out' });
    }
  }, 10000);
  try {
    console.log('--- getAuditLogs called ---', new Date().toISOString());
    const { month } = req.query;
    let start, end;
    console.log('[AuditLog] Query:', req.query);
    if (month) {
      ({ start, end } = getMonthRange(month));
    } else {
      // Default: current month
      const now = new Date();
      ({ start, end } = getMonthRange(`${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`));
    }

    console.log('[AuditLog] Month:', month, 'Range:', start, end);

    // Fetch logs from MongoDB
    console.log('[AuditLog] About to query AuditLog.find');
    const logs = await AuditLog.find({
      createdAt: { $gte: start, $lt: end },
    })
      .sort({ createdAt: -1 })
      .lean();
    console.log('[AuditLog] Logs found:', logs.length);

    // For each log, fetch lawyer initials, matterTitle, and clientTitle if available
    console.log('[AuditLog] About to map results');
    const results = await Promise.all(logs.map(async (log, i) => {
      let lawyerInitials = '';
      let matterTitle = '';
      let clientTitle = '';
      try {
        if (log.userId) {
          const user = await User.findById(log.userId).lean();
          if (user && user.lawyerProfile) {
            const lawyer = await Lawyer.findById(user.lawyerProfile).lean();
            lawyerInitials = lawyer && lawyer.initials ? lawyer.initials : '';
          }
        }
        // Populate matterTitle and/or clientTitle
        if (log.entityType === 'Matter' && log.entityId) {
          const matter = await Matter.findById(log.entityId).populate('client', 'name').lean();
          if (matter) {
            matterTitle = matter.title || '';
            clientTitle = matter.client && matter.client.name ? matter.client.name : '';
          }
        } else if (log.entityType === 'Client' && log.entityId) {
          const client = await Client.findById(log.entityId).lean();
          if (client) {
            clientTitle = client.name || '';
          }
        }
      } catch (err) {
        console.error(`[AuditLog] Error processing log index ${i}:`, err);
      }
      return {
        ...log,
        lawyerInitials,
        matterTitle,
        clientTitle,
      };
    }));
    console.log('[AuditLog] Results mapped:', results.length);
    if (!finished) {
      res.json(results);
      finished = true;
      clearTimeout(timeout);
    }
    console.log('[AuditLog] Response sent');
  } catch (err) {
    console.error('Error fetching audit logs:', err);
    if (!finished) {
      res.status(500).json({ error: 'Failed to fetch audit logs', details: String(err) });
      finished = true;
      clearTimeout(timeout);
    }
  }
};
