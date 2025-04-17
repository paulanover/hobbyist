require('dotenv').config();
const mongoose = require('mongoose');
const { TimeEntry } = require('../models/TimeEntry');
const { Matter } = require('../models/Matter');
const { Lawyer } = require('../models/Lawyer');

const MONGODB_URI = process.env.MONGODB_URI;

async function main() {
  await mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log('Connected to MongoDB');

  // Find the client for LAZADA
  const lazadaClient = await require('../models/Client').findOne({ name: /lazada/i });
  if (!lazadaClient) {
    console.log('No client found for LAZADA');
    process.exit(1);
  }
  console.log('LAZADA Client:', lazadaClient._id, lazadaClient.name);

  // Find all matters for this client
  const matters = await Matter.find({ client: lazadaClient._id });
  if (!matters.length) {
    console.log('No matters found for LAZADA client');
    process.exit(1);
  }
  console.log(`Found ${matters.length} matters for LAZADA client.`);

  // Find all time entries for these matters
  const matterIds = matters.map(m => m._id);
  const entries = await TimeEntry.find({ matter: { $in: matterIds } }).populate('lawyer').populate('matter');
  if (!entries.length) {
    console.log('No time entries found for LAZADA matters');
    process.exit(0);
  }
  for (const entry of entries) {
    console.log('---');
    console.log('TimeEntry ID:', entry._id);
    console.log('Matter:', entry.matter?.title, entry.matter?._id);
    console.log('Lawyer field:', entry.lawyer); // Populated lawyer
    console.log('Lawyer ID (raw):', entry.lawyer?._id || entry.lawyer);
    console.log('Lawyer Name:', entry.lawyer?.name);
    console.log('Date:', entry.date);
    console.log('Hours:', entry.hours);
    console.log('Description:', entry.description);
  }
  mongoose.disconnect();
}

main().catch(err => {
  console.error('Error:', err);
  mongoose.disconnect();
});
