const mongoose = require('mongoose');

// Define allowed ranks
const lawyerRanks = ['Partner', 'Junior Partner', 'Senior Associate', 'Associate'];
const lawyerStatuses = ['Active', 'Inactive']; // Define statuses

const lawyerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Lawyer name is required'],
    trim: true,
  },
  address: {
    type: String,
    trim: true,
  },
  initials: {
    type: String,
    required: [true, 'Lawyer initials are required'],
    trim: true,
    uppercase: true,
    maxlength: [5, 'Initials cannot be more than 5 characters'], // Added constraint
  },
  email: {
    type: String,
    required: [true, 'Lawyer email is required'],
    unique: true,
    match: [/.+\@.+\..+/, 'Please fill a valid email address'], // Basic email validation
    trim: true,
    lowercase: true,
  },
  rank: { // Add rank field
    type: String,
    required: [true, 'Lawyer rank is required'],
    enum: {
        values: lawyerRanks,
        message: 'Rank must be one of: Partner, Junior Partner, Senior Associate, Associate',
    },
    trim: true,
  },
  status: { // Add status field
    type: String,
    required: true,
    enum: {
        values: lawyerStatuses,
        message: 'Status must be either Active or Inactive',
    },
    default: 'Active', // Default to Active
  },
  // Date the lawyer was hired
  dateHired: {
    type: Date,
    required: [true, 'Date hired is required'],
  },
  mattersAssigned: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Matter', // Reference to the Matter model (we'll create this next)
  }],
  lastUpdatedBy: { // Add this field
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  isDeleted: {
    type: Boolean,
    default: false,
    index: true // Add index for faster querying of non-deleted lawyers
  },
  deletedAt: {
    type: Date
  },
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User' // Reference the User model
  },
  // Add timestamps for creation and updates
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Middleware to update the updatedAt field on save
lawyerSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Lawyer = mongoose.model('Lawyer', lawyerSchema);

module.exports = Lawyer;
module.exports.Lawyer = Lawyer;
module.exports.lawyerRanks = lawyerRanks;
module.exports.lawyerStatuses = lawyerStatuses;
