// debugTimeEntry.js
// Usage: node scripts/debugTimeEntry.js
// Prints the latest 10 time entries, sorted by createdAt descending

require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');
const { TimeEntry } = require('../models/TimeEntry');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/YOUR_DB_NAME';

async function main() {
  await mongoose.connect(MONGO_URI);
  const entries = await TimeEntry.find({}).sort({ createdAt: -1 }).limit(10);
  console.log('Latest 10 Time Entries:');
  entries.forEach(entry => {
    console.log(JSON.stringify(entry, null, 2));
  });
  await mongoose.disconnect();
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
