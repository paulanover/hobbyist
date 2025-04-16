// Script to convert all lawyerOwners fields in Client documents from string to ObjectId
// Usage: node scripts/fixLawyerOwnersToObjectId.js

require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');
const { Client } = require('../models/Client.js');
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/loms';

async function fixLawyerOwners() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  const clients = await Client.find({});
  let modified = 0;

  for (const client of clients) {
    if (Array.isArray(client.lawyerOwners)) {
      let needsUpdate = false;
      const newOwners = client.lawyerOwners.map(id => {
        if (typeof id === 'string' && id.match(/^[a-fA-F0-9]{24}$/)) {
          needsUpdate = true;
          return mongoose.Types.ObjectId(id);
        }
        return id;
      });
      if (needsUpdate) {
        client.lawyerOwners = newOwners;
        await client.save();
        modified++;
        console.log(`Updated client ${client.name} (${client._id})`);
      }
    }
  }

  console.log(`Done. Modified ${modified} clients.`);
  await mongoose.disconnect();
}

fixLawyerOwners().catch(err => {
  console.error('Error running script:', err);
  process.exit(1);
});
