const mongoose = require('mongoose');

const vatStatuses = ['VAT Registered', 'Non-VAT', 'VAT Exempt']; // Define VAT statuses

const clientSchema = new mongoose.Schema({
  name: { // Renamed conceptually to "Full Client/Entity Name"
    type: String,
    required: [true, 'Full Client/Entity Name is required'],
    trim: true,
  },
  isBusinessEntity: {
    type: Boolean,
    default: false,
  },
  presidentName: { // Only relevant if isBusinessEntity is true
    type: String,
    trim: true,
    required: function() { return this.isBusinessEntity; } // Required if it's a business
  },
  authorizedRepresentative: { // Only relevant if isBusinessEntity is true
    type: String,
    trim: true,
    required: function() { return this.isBusinessEntity; } // Required if it's a business
  },
  email: {
    type: String,
    match: [/.+\@.+\..+/, 'Please fill a valid email address'],
    trim: true,
    lowercase: true,
  },
  phone: {
    type: String,
    trim: true,
  },
  address: {
    type: String,
    trim: true,
  },
  vatStatus: {
    type: String,
    required: [true, 'VAT Status is required'],
    enum: {
        values: vatStatuses,
        message: 'VAT Status must be one of: VAT Registered, Non-VAT, VAT Exempt',
    },
  },
  lawyerOwners: [{ // Add this field
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lawyer',
  }],
  lastUpdatedBy: { // Audit field
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  lastChangeDescription: { // Audit field
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
});

// Middleware to update the updatedAt field on save
clientSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Client = mongoose.model('Client', clientSchema);

module.exports = Client;
module.exports.Client = Client;
module.exports.vatStatuses = vatStatuses; // Export statuses for frontend use
