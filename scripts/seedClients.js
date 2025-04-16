// scripts/seedClients.js
// Usage: node scripts/seedClients.js
// This script will create 20 random clients in your MongoDB database.

const mongoose = require('mongoose');
const { Lawyer } = require('../server/models/Lawyer');
const { Client } = require('../server/models/Client');
require('dotenv').config({ path: './server/.env' });

const vatStatuses = ['VAT Registered', 'Non-VAT', 'VAT Exempt'];
const businessNames = [
  'Acme Corporation', 'Beta Holdings', 'Gamma Industries', 'Delta LLC', 'Epsilon Group',
  'Zeta Solutions', 'Eta Enterprises', 'Theta Ventures', 'Iota Partners', 'Kappa Consulting',
  'Lambda Logistics', 'Mu Media', 'Nu Networks', 'Xi Exports', 'Omicron Imports',
  'Pi Productions', 'Rho Retailers', 'Sigma Services', 'Tau Technologies', 'Upsilon Unlimited'
];
const personalNames = [
  'John Doe', 'Jane Smith', 'Michael Johnson', 'Emily Brown', 'William Lee',
  'Olivia Garcia', 'James Martinez', 'Linda Anderson', 'Robert Wilson', 'Patricia Moore',
  'David Taylor', 'Barbara Thomas', 'Richard Jackson', 'Susan Martin', 'Joseph White',
  'Sarah Harris', 'Thomas Clark', 'Karen Lewis', 'Charles Young', 'Nancy Hall'
];
const presidents = [
  'Albert King', 'Betty Scott', 'Carl Adams', 'Donna Baker', 'Edward Evans',
  'Fiona Turner', 'George Phillips', 'Hannah Campbell', 'Ian Parker', 'Julia Cooper'
];
const representatives = [
  'Kevin Stewart', 'Laura Morris', 'Matthew Rogers', 'Natalie Reed', 'Oscar Cook',
  'Pamela Morgan', 'Quentin Bell', 'Rachel Murphy', 'Samuel Bailey', 'Teresa Rivera'
];

function randomFromArray(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomEmail(name, i) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '.') + i + '@clientmail.com';
}

function randomPhone() {
  return '+63' + Math.floor(900000000 + Math.random() * 99999999).toString();
}

async function seedClients() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/windsurf', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  console.log('Connected to MongoDB');

  // Get all lawyers
  const lawyers = await Lawyer.find({ isDeleted: false });
  if (lawyers.length < 3) throw new Error('Need at least 3 lawyers to seed clients.');

  const clients = [];
  for (let i = 0; i < 20; i++) {
    const isBusiness = Math.random() < 0.5;
    const name = isBusiness ? randomFromArray(businessNames) : randomFromArray(personalNames);
    const vatStatus = randomFromArray(vatStatuses);
    const email = randomEmail(name, i);
    const phone = randomPhone();
    const address = `${i + 1} ${isBusiness ? 'Corporate Ave' : 'Residential St'}, Metro Manila, PH`;
    // Assign 1-3 random lawyers
    const shuffledLawyers = [...lawyers].sort(() => Math.random() - 0.5);
    const numLawyers = Math.floor(Math.random() * 3) + 1;
    const lawyerOwners = shuffledLawyers.slice(0, numLawyers).map(l => l._id);
    const client = {
      name,
      isBusinessEntity: isBusiness,
      vatStatus,
      email,
      phone,
      address,
      lawyerOwners,
    };
    if (isBusiness) {
      client.presidentName = randomFromArray(presidents);
      client.authorizedRepresentative = randomFromArray(representatives);
    }
    clients.push(client);
  }

  await Client.insertMany(clients);
  console.log('Inserted 20 clients!');
  await mongoose.disconnect();
}

seedClients().catch(err => {
  console.error(err);
  process.exit(1);
});
