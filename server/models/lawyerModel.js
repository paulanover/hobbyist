const mongoose = require('mongoose');

const LawyerSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: [true, 'Please add the lawyer\'s full name'],
    trim: true,
  },
  initials: {
    type: String,
    required: [true, 'Please add the lawyer\'s initials'],
    uppercase: true,
    trim: true,
    maxlength: [5, 'Initials cannot be more than 5 characters'],
  },
  rank: {
    type: String,
    required: [true, 'Please specify the lawyer\'s rank'],
    enum: ['Partner', 'Senior Associate', 'Associate', 'Of Counsel', 'Paralegal'], // Example ranks
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email',
    ],
  },
  status: {
    type: String,
    required: true,
    enum: ['Active', 'Inactive'],
    default: 'Active',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  // Optional: Link to the User model if lawyers are also system users
  // userId: {
  //   type: mongoose.Schema.ObjectId,
  //   ref: 'User',
  //   required: false // Set to true if every lawyer must be a system user
  // }
});

module.exports = mongoose.model('Lawyer', LawyerSchema);
