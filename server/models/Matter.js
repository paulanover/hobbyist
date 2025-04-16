const mongoose = require('mongoose');

const matterSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Matter title is required'],
    trim: true,
  },
  docketNumber: { // Updated format: CATEGORY.SIX_CHARS
    type: String,
    required: [true, 'Docket Number is required'],
    unique: true,
    trim: true,
    // Regex: Single digit (0-9), literal '.', exactly 6 alphanumeric chars
    match: [/^[0-9]\.[a-zA-Z0-9]{6}$/, 'Docket Number must be in the format CATEGORY.SIX_CHARS (e.g., 1.AB12CD)'],
  },
  category: {
    type: String,
    trim: true,
    match: [/^[0-9]$/, 'Category must be a single digit (0-9)'],
    required: [true, 'Category is required'], // Make category required as it's part of docket number
  },
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: [true, 'Client is required for the matter'],
  },
  teamAssigned: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lawyer',
  }],
  status: {
    type: String,
    required: true,
    enum: ['Active', 'Inactive', 'Closed', 'Pending', 'Open'], // Adjust enum as needed
    default: 'Active',
  },
  dateCreated: {
    type: Date,
    default: Date.now,
  },
  relevantData: {
    type: String,
    trim: true,
  },
  lastUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  lastChangeDescription: {
    type: String,
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },

  // --- Add Soft Delete Fields ---
  isDeleted: {
    type: Boolean,
    default: false,
    index: true // Add index for faster querying of non-deleted items
  },
  deletedAt: {
    type: Date
  },
  // Add deletedBy field
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User' // Reference the User model
  }
  // --- End Soft Delete Fields ---

}, {
  timestamps: true // This adds createdAt and updatedAt
});

// Add text index for searching title and relevantData
matterSchema.index({ title: 'text', relevantData: 'text' });

// Middleware to ensure category and docketNumber match before saving
matterSchema.pre('validate', function(next) {
  if (this.category && this.docketNumber) {
    const docketPrefix = this.docketNumber.split('.')[0];
    if (this.category !== docketPrefix) {
      this.invalidate('docketNumber', 'Docket Number prefix must match the selected Category.', this.docketNumber);
    }
  }
  next();
});

// Middleware to update the updatedAt field on save
matterSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Matter = mongoose.model('Matter', matterSchema);

module.exports = Matter;
module.exports.Matter = Matter;
