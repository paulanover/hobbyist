// scripts/seedLawyers.js
// Usage: node scripts/seedLawyers.js
// This script will create 20 random lawyers in your MongoDB database.

const mongoose = require('mongoose');
const { Lawyer } = require('../server/models/Lawyer');
require('dotenv').config({ path: './server/.env' });

const lawyerRanks = ['Partner', 'Junior Partner', 'Senior Associate', 'Associate'];
const lawyerStatuses = ['Active', 'Inactive'];

const randomName = () => {
  const firstNames = ['Alice', 'Bob', 'Carol', 'David', 'Eve', 'Frank', 'Grace', 'Helen', 'Ivan', 'Judy', 'Karl', 'Liam', 'Mona', 'Nina', 'Oscar', 'Paul', 'Quinn', 'Rita', 'Sam', 'Tina'];
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Miller', 'Davis', 'Garcia', 'Rodriguez', 'Wilson', 'Martinez', 'Anderson', 'Taylor', 'Thomas', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson'];
  const fn = firstNames[Math.floor(Math.random() * firstNames.length)];
  const ln = lastNames[Math.floor(Math.random() * lastNames.length)];
  return `${fn} ${ln}`;
};

const randomInitials = name => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 5);

const randomEmail = (name, i) => name.toLowerCase().replace(/ /g, '.') + i + '@testlaw.com';

const randomRank = () => lawyerRanks[Math.floor(Math.random() * lawyerRanks.length)];
const randomStatus = () => lawyerStatuses[Math.floor(Math.random() * lawyerStatuses.length)];

async function seedLawyers() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/windsurf', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  console.log('Connected to MongoDB');

  const lawyers = [];
  for (let i = 1; i <= 20; i++) {
    const name = randomName();
    const initials = randomInitials(name);
    const email = randomEmail(name, i);
    const rank = randomRank();
    const status = randomStatus();
    const address = `${i} ${name.split(' ')[1]} St, City, Country`;
    lawyers.push({ name, initials, email, rank, status, address });
  }

  await Lawyer.insertMany(lawyers);
  console.log('Inserted 20 lawyers!');
  await mongoose.disconnect();
}

seedLawyers().catch(err => {
  console.error(err);
  process.exit(1);
});
