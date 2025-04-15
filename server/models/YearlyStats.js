const mongoose = require('mongoose');

const yearlyStatsSchema = new mongoose.Schema({
  year: {
    type: Number,
    required: true,
    unique: true // Ensure no syntax errors here
  },
  totalMatters: {
    type: Number,
    required: true,
    default: 0 // Ensure no syntax errors here
  },
  closedMatters: {
    type: Number,
    required: true,
    default: 0 // Ensure no syntax errors here
  },
  lastUpdated: {
    type: Date,
    required: true,
    default: Date.now // Ensure no syntax errors here
  }
}); // Ensure closing bracket and semicolon are correct

const YearlyStats = mongoose.model('YearlyStats', yearlyStatsSchema);

module.exports = YearlyStats; // Ensure export is correct
