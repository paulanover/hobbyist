// debugAuditLog.js
// Usage: node scripts/debugAuditLog.js
// Prints the latest 10 audit log entries, sorted by createdAt descending

require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');
const AuditLog = require('../models/auditLogModel');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/YOUR_DB_NAME';

async function main() {
  await mongoose.connect(MONGO_URI);
  const logs = await AuditLog.find({}).sort({ createdAt: -1 }).limit(10);
  console.log('Latest 10 Audit Logs:');
  logs.forEach(log => {
    console.log(JSON.stringify(log, null, 2));
  });
  await mongoose.disconnect();
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
