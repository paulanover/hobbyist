const mongoose = require('mongoose');

const timeEntrySchema = new mongoose.Schema({
  lawyer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lawyer',
    required: true,
  },
  matter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Matter',
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  hours: {
    type: Number,
    required: true,
    min: 0.01,
    max: 24,
  },
  description: {
    type: String,
    trim: true,
  },
  billable: {
    type: Boolean,
    default: true,
  },
  approved: {
    type: Boolean,
    default: false,
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

timeEntrySchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const TimeEntry = mongoose.model('TimeEntry', timeEntrySchema);

module.exports = { TimeEntry };
