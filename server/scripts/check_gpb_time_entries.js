// Usage: node scripts/check_gpb_time_entries.js
// This script checks if GPB's time entries are using the correct Lawyer ObjectId in the 'lawyer' field of TimeEntry.

require('dotenv').config();
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/YOUR_DB_NAME'; // Set your DB name here
console.log('Using MongoDB URI:', MONGO_URI);

const Lawyer = require('../models/Lawyer');
const { TimeEntry } = require('../models/TimeEntry');

async function main() {
  await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log('Connected to MongoDB');

  // 1. Find GPB's Lawyer ObjectId
  const gpb = await Lawyer.findOne({ initials: 'GPB' });
  if (!gpb) {
    console.error('No lawyer found with initials GPB');
    process.exit(1);
  }
  console.log(`GPB Lawyer _id: ${gpb._id}`);

  // 2. Find all TimeEntry docs for GPB's ObjectId
  const entries = await TimeEntry.find({ lawyer: gpb._id });
  if (entries.length === 0) {
    console.warn('No TimeEntry documents found with GPB as lawyer (by ObjectId).');
  } else {
    console.log(`Found ${entries.length} TimeEntry documents for GPB.`);
    entries.forEach(entry => {
      console.log({
        _id: entry._id,
        date: entry.date,
        hours: entry.hours,
        matter: entry.matter,
        description: entry.description,
      });
    });
  }

  // 3. (Optional) Find TimeEntry docs with lawyer field as string 'GPB' (should NOT exist)
  const badEntries = await TimeEntry.find({ lawyer: 'GPB' });
  if (badEntries.length > 0) {
    console.warn('WARNING: Found TimeEntry documents where lawyer is set to the string "GPB" (should be ObjectId):');
    badEntries.forEach(entry => {
      console.log({
        _id: entry._id,
        date: entry.date,
        hours: entry.hours,
        matter: entry.matter,
        description: entry.description,
        lawyer: entry.lawyer,
      });
    });
  }

  await mongoose.disconnect();
  console.log('Done.');
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
