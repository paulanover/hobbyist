const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const User = require('../models/User.js'); // Adjust path if necessary

// Load environment variables from .env file located in the parent directory of this script
// This uses the script's location (__dirname) rather than the current working directory
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI;
    if (!mongoURI) {
      console.error('FATAL ERROR: MONGODB_URI environment variable is not set.');
      process.exit(1);
    }
    await mongoose.connect(mongoURI);
    console.log('MongoDB Connected for script...');
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  }
};

const createUser = async () => {
  await connectDB();

  const userData = {
    name: 'helloh',
    email: 'hadmin@anoverlaw.org',
    password: '123123!', // The password will be hashed by the pre-save hook
    role: 'admin', // Set the role to admin
  };

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email: userData.email });
    if (existingUser) {
      console.log(`User with email ${userData.email} already exists.`);
      mongoose.connection.close();
      return;
    }

    // Create the user
    const newUser = await User.create(userData);
    console.log('Admin user created successfully:');
    console.log(`Name: ${newUser.name}`);
    console.log(`Email: ${newUser.email}`);
    console.log(`Role: ${newUser.role}`);
    console.log(`ID: ${newUser._id}`);

  } catch (error) {
    console.error('Error creating user:', error.message);
    if (error.errors) {
      console.error('Validation Errors:', error.errors);
    }
  } finally {
    // Close the database connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed.');
  }
};

// Run the function
createUser();
