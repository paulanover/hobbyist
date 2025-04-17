// Usage: node server/scripts/showUserProfile.js <userId>
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const Lawyer = require('../models/Lawyer');

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/YOUR_DB_NAME';

async function main() {
  const userId = process.argv[2];
  if (!userId) {
    console.error('Usage: node server/scripts/showUserProfile.js <userId>');
    process.exit(1);
  }
  await mongoose.connect(MONGO_URI);
  const user = await User.findById(userId).populate('lawyerProfile', 'name initials _id');
  if (!user) {
    console.log('User not found:', userId);
    return;
  }
  console.log('User:', {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    lawyerProfile: user.lawyerProfile,
  });
  await mongoose.disconnect();
}

main().catch(err => {
  console.error('Error:', err);
  mongoose.disconnect();
});
