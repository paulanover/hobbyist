// Script to convert all teamAssigned fields in Matter documents from string to ObjectId
// Usage: node scripts/fixTeamAssignedToObjectId.js

require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');
const { Matter } = require('../models/Matter.js');
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/loms';

async function fixTeamAssigned() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  const matters = await Matter.find({});
  let modified = 0;

  for (const matter of matters) {
    if (Array.isArray(matter.teamAssigned)) {
      let needsUpdate = false;
      const newTeam = matter.teamAssigned.map(id => {
        if (typeof id === 'string' && id.match(/^[a-fA-F0-9]{24}$/)) {
          needsUpdate = true;
          return mongoose.Types.ObjectId(id);
        }
        return id;
      });
      if (needsUpdate) {
        matter.teamAssigned = newTeam;
        await matter.save();
        modified++;
        console.log(`Updated matter ${matter.title} (${matter._id})`);
      }
    }
  }

  console.log(`Done. Modified ${modified} matters.`);
  await mongoose.disconnect();
}

fixTeamAssigned().catch(err => {
  console.error('Error running script:', err);
  process.exit(1);
});
