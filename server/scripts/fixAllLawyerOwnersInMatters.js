// Script to ensure ALL lawyerOwners of each client are present in the teamAssigned array of ALL their matters
// Usage: node scripts/fixAllLawyerOwnersInMatters.js

require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');
const Client = require('../models/Client.js');
const Matter = require('../models/Matter.js');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/loms';

async function fixAllLawyerOwnersInMatters() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  const matters = await Matter.find({});
  let mattersModified = 0;

  for (const matter of matters) {
    // Find the client for this matter
    const client = await Client.findById(matter.client);
    if (!client) {
      console.warn(`Matter ${matter._id} references missing client ${matter.client}`);
      continue;
    }
    // Merge all lawyerOwners into teamAssigned
    const owners = (client.lawyerOwners || []).map(id =>
      typeof id === 'string' && id.match(/^[a-fA-F0-9]{24}$/)
        ? new mongoose.Types.ObjectId(id)
        : id
    );
    let team = (matter.teamAssigned || []).map(id =>
      typeof id === 'string' && id.match(/^[a-fA-F0-9]{24}$/)
        ? new mongoose.Types.ObjectId(id)
        : id
    );
    // Add all owners if not already present
    let changed = false;
    for (const ownerId of owners) {
      if (!team.some(id => id.toString() === ownerId.toString())) {
        team.push(ownerId);
        changed = true;
      }
    }
    if (changed) {
      matter.teamAssigned = team;
      await matter.save();
      mattersModified++;
      console.log(`Updated matter ${matter.title} (${matter._id})`);
    }
  }

  console.log(`Done. Modified ${mattersModified} matters.`);
  await mongoose.disconnect();
}

fixAllLawyerOwnersInMatters().catch(err => {
  console.error('Error running script:', err);
  process.exit(1);
});
