// Usage: node scripts/debugMatterAccess.js <userEmail> <matterId>
// Prints the access logic for a user and a specific matter
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const Lawyer = require('../models/Lawyer');
const Matter = require('../models/Matter');
const Client = require('../models/Client');

const email = process.argv[2];
const matterId = process.argv[3];
if (!email || !matterId) {
  console.error('Usage: node scripts/debugMatterAccess.js <userEmail> <matterId>');
  process.exit(1);
}

const MONGO_URI = process.env.MONGO_URI;

async function main() {
  await mongoose.connect(MONGO_URI);
  const user = await User.findOne({ email });
  if (!user) {
    console.log('User not found for email:', email);
    process.exit(1);
  }
  console.log('\n=== USER ===');
  console.log(user);

  if (!user.lawyerProfile) {
    console.log('User has no lawyerProfile.');
    process.exit(0);
  }
  const lawyer = await Lawyer.findById(user.lawyerProfile);
  if (!lawyer) {
    console.log('Lawyer profile not found for user.');
    process.exit(1);
  }
  console.log('\n=== LAWYER PROFILE ===');
  console.log(lawyer);

  const matter = await Matter.findById(matterId);
  if (!matter) {
    console.log('Matter not found:', matterId);
    process.exit(1);
  }
  console.log('\n=== MATTER ===');
  console.log(matter);

  // Check if lawyer is in teamAssigned
  const isAssigned = matter.teamAssigned.map(id => String(id)).includes(String(lawyer._id));
  console.log(`\nLawyer is${isAssigned ? '' : ' NOT'} assigned to this matter (teamAssigned).`);

  // Check if lawyer is owner of the client
  const client = await Client.findById(matter.client);
  if (!client) {
    console.log('Client not found for matter:', matter.client);
    process.exit(1);
  }
  const isOwner = client.lawyerOwners.map(id => String(id)).includes(String(lawyer._id));
  console.log(`Lawyer is${isOwner ? '' : ' NOT'} an owner of the client (lawyerOwners).`);

  // Print lawyer rank
  console.log(`Lawyer rank: ${lawyer.rank}`);

  // Print access logic result
  if (isAssigned || isOwner) {
    console.log('\nACCESS GRANTED: Lawyer is either assigned or an owner.');
  } else {
    console.log('\nACCESS DENIED: Lawyer is NOT assigned and NOT an owner.');
  }

  await mongoose.disconnect();
}

main().catch(err => {
  console.error('Error running debug script:', err);
  process.exit(1);
});
