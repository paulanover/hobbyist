// scripts/seedMatters.js
// Usage: node scripts/seedMatters.js
// This script will create 30 random matters in your MongoDB database.

const mongoose = require('mongoose');
const { Lawyer } = require('../server/models/Lawyer');
const { Client } = require('../server/models/Client');
const { Matter } = require('../server/models/Matter');
require('dotenv').config({ path: './server/.env' });

const CATEGORY_MAP = {
  '1': 'RETAINER',
  '2': 'ADMINISTRATIVE',
  '3': 'SPECIAL PROJECT',
  '4': 'LABOR',
  '5': 'LITIGATION',
  '6': 'PROBONO',
  '7': 'TEMPORARY',
  '8': 'INTERNAL OFFICE MATTER',
};

const LEGAL_TERMS = {
  '1': ['General Retainer Agreement', 'Corporate Retainer', 'Retainer Renewal', 'Retainer Fee Dispute'],
  '2': ['Compliance Filing', 'License Renewal', 'Policy Review', 'Government Registration'],
  '3': ['Joint Venture Setup', 'Due Diligence', 'Special Task Force', 'Project Advisory'],
  '4': ['Labor Dispute', 'Employee Termination', 'Collective Bargaining', 'Wage Claim'],
  '5': ['Civil Litigation', 'Criminal Defense', 'Appeal Filing', 'Case Management'],
  '6': ['Pro Bono Consultation', 'Community Outreach', 'Legal Aid', 'Charity Representation'],
  '7': ['Temporary Injunction', 'Short-term Assignment', 'Urgent Legal Opinion', 'Ad Hoc Matter'],
  '8': ['Internal Audit', 'Office Policy Drafting', 'Staff Training', 'Internal Investigation'],
};

function randomFromArray(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomAlphanumeric(len) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let str = '';
  for (let i = 0; i < len; i++) str += chars[Math.floor(Math.random() * chars.length)];
  return str;
}

async function seedMatters() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/windsurf', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  console.log('Connected to MongoDB');

  // Get all lawyers and clients
  const lawyers = await Lawyer.find({ isDeleted: false });
  if (lawyers.length < 3) throw new Error('Need at least 3 lawyers to seed matters.');
  const clients = await Client.find();
  if (clients.length < 1) throw new Error('Need at least 1 client to seed matters.');

  const matters = [];
  for (let i = 0; i < 30; i++) {
    // Pick a random category
    const categoryNum = String(((i % 8) + 1));
    const category = CATEGORY_MAP[categoryNum];
    const title = randomFromArray(LEGAL_TERMS[categoryNum]);
    const docketNumber = `${categoryNum}.${randomAlphanumeric(6)}`;
    const client = randomFromArray(clients);
    // Assign 2-4 random lawyers
    const shuffledLawyers = [...lawyers].sort(() => Math.random() - 0.5);
    const numLawyers = Math.floor(Math.random() * 3) + 2; // 2 to 4
    const teamAssigned = shuffledLawyers.slice(0, numLawyers).map(l => l._id);
    matters.push({
      title,
      docketNumber,
      category: categoryNum,
      client: client._id,
      teamAssigned,
      status: 'Active',
      relevantData: `Auto-generated matter for category ${category}: ${title}`,
    });
  }

  await Matter.insertMany(matters);
  console.log('Inserted 30 matters!');
  await mongoose.disconnect();
}

seedMatters().catch(err => {
  console.error(err);
  process.exit(1);
});
