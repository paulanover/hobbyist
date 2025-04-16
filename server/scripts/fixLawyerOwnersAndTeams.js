// Script to ensure a specific lawyer (by userId) is present in all lawyerOwners and teamAssigned arrays
// Also converts all IDs in those arrays to ObjectIds for safety
// Usage: node scripts/fixLawyerOwnersAndTeams.js

require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');
const { Client } = require('../models/Client.js');
const { Matter } = require('../models/Matter.js');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/loms';
const USER_ID = '67ff908daeb8acd29e3ae0a1'; // <-- Set your user _id here

async function fixLawyerOwnersAndTeams() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  // --- Fix Clients ---
  const clients = await Client.find({});
  let clientsModified = 0;
  for (const client of clients) {
    let changed = false;
    // Convert all IDs to ObjectId
    let owners = (client.lawyerOwners || []).map(id =>
      typeof id === 'string' && id.match(/^[a-fA-F0-9]{24}$/)
        ? new mongoose.Types.ObjectId(id)
        : id
    );
    // Add user if missing
    if (!owners.some(id => id.toString() === USER_ID)) {
      owners.push(new mongoose.Types.ObjectId(USER_ID));
      changed = true;
    }
    // Only save if changed or if conversion happened
    if (changed || owners.length !== (client.lawyerOwners || []).length) {
      client.lawyerOwners = owners;
      await client.save();
      clientsModified++;
      console.log(`Updated client ${client.name} (${client._id})`);
    }
  }

  // --- Fix Matters ---
  const matters = await Matter.find({});
  let mattersModified = 0;
  for (const matter of matters) {
    let changed = false;
    let team = (matter.teamAssigned || []).map(id =>
      typeof id === 'string' && id.match(/^[a-fA-F0-9]{24}$/)
        ? new mongoose.Types.ObjectId(id)
        : id
    );
    if (!team.some(id => id.toString() === USER_ID)) {
      team.push(new mongoose.Types.ObjectId(USER_ID));
      changed = true;
    }
    if (changed || team.length !== (matter.teamAssigned || []).length) {
      matter.teamAssigned = team;
      await matter.save();
      mattersModified++;
      console.log(`Updated matter ${matter.title} (${matter._id})`);
    }
  }

  console.log(`Done. Modified ${clientsModified} clients and ${mattersModified} matters.`);
  await mongoose.disconnect();
}

fixLawyerOwnersAndTeams().catch(err => {
  console.error('Error running script:', err);
  process.exit(1);
});
