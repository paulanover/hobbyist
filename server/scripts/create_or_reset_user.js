// Usage: node scripts/create_or_reset_user.js <email> <password> <name>
// Example: node scripts/create_or_reset_user.js test1@example.com 123123! "Test User"

const mongoose = require('mongoose');
const dotenv = require('dotenv');
// No need to import bcrypt here; let the User model handle hashing


// Load env vars from absolute path for reliability
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const User = require('../models/User');

async function createOrResetUser(email, password, name) {
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!mongoUri) {
    throw new Error('No MongoDB URI found in environment (MONGODB_URI or MONGO_URI)');
  }
  await mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  let user = await User.findOne({ email });

  if (user) {
    user.password = password; // Assign raw password; let pre-save hook hash it
    user.name = name || user.name;
    await user.save();
    console.log(`Password reset for user: ${email}`);
  } else {
    user = new User({
      name: name || email.split('@')[0],
      email,
      password: password, // Assign raw password; let pre-save hook hash it
      role: 'staff', // default role
    });
    await user.save();
    console.log(`Created new user: ${email}`);
  }

  await mongoose.disconnect();
}

// Parse args
const [,, email, password, ...nameParts] = process.argv;
const name = nameParts.join(' ');

if (!email || !password) {
  console.error('Usage: node scripts/create_or_reset_user.js <email> <password> <name>');
  process.exit(1);
}

createOrResetUser(email, password, name)
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
