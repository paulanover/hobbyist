require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
// Usage: node scripts/debugUserLawyerMatter.js <userEmail>
// Prints the user, lawyer, matters, and client relationships for the given user email

const mongoose = require('mongoose');
const User = require('../models/User');
const Lawyer = require('../models/Lawyer');
const Matter = require('../models/Matter');
const Client = require('../models/Client');

const email = process.argv[2];
if (!email) {
  console.error('Usage: node scripts/debugUserLawyerMatter.js <userEmail>');
  process.exit(1);
}

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/windsurf';

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

  // Matters where this lawyer is assigned
  const mattersAssigned = await Matter.find({ teamAssigned: lawyer._id });
  console.log(`\n=== MATTERS WHERE LAWYER IS ASSIGNED (teamAssigned) === (${mattersAssigned.length})`);
  mattersAssigned.forEach(m => console.log(`- ${m.title} (${m._id})`));

  // Matters where this lawyer is the creator
  const mattersCreated = await Matter.find({ createdBy: user._id });
  console.log(`\n=== MATTERS CREATED BY USER === (${mattersCreated.length})`);
  mattersCreated.forEach(m => console.log(`- ${m.title} (${m._id})`));

  // Clients where this lawyer is an owner
  const clientsOwned = await Client.find({ lawyerOwners: lawyer._id });
  console.log(`\n=== CLIENTS WHERE LAWYER IS OWNER (lawyerOwners) === (${clientsOwned.length})`);
  clientsOwned.forEach(c => console.log(`- ${c.name} (${c._id})`));

  // For each client, show matters
  for (const client of clientsOwned) {
    const clientMatters = await Matter.find({ client: client._id });
    console.log(`\n  Matters for client ${client.name}: (${clientMatters.length})`);
    clientMatters.forEach(m => console.log(`    - ${m.title} (${m._id})`));
  }

  await mongoose.disconnect();
}

main().catch(err => {
  console.error('Error running debug script:', err);
  process.exit(1);
});
