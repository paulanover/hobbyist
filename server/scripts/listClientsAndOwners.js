// Usage: node server/scripts/listClientsAndOwners.js
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const { Client } = require('../models/Client');
const Lawyer = require('../models/Lawyer');

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/YOUR_DB_NAME';

async function main() {
  await mongoose.connect(MONGO_URI);
  const clients = await Client.find({}).populate('lawyerOwners', 'name initials email');
  if (clients.length === 0) {
    console.log('No clients found.');
    return;
  }
  clients.forEach(client => {
    console.log(`Client: ${client.name}`);
    if (client.lawyerOwners && client.lawyerOwners.length > 0) {
      client.lawyerOwners.forEach(owner => {
        console.log(`  Owner: ${owner.name} (${owner.initials || ''}) [${owner._id}]`);
      });
    } else {
      console.log('  No owners.');
    }
  });
  await mongoose.disconnect();
}

main().catch(err => {
  console.error('Error:', err);
  mongoose.disconnect();
});
