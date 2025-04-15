const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/law_office_management';
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      // Mongoose 6+ doesn't need these options anymore:
      // useCreateIndex: true,
      // useFindAndModify: false
    });
    console.log('MongoDB connection established successfully');
    return true;
  } catch (error) {
    console.error('Error connecting to MongoDB:', error.message);
    // Exit process with failure
    process.exit(1);
  }
};

module.exports = connectDB;
