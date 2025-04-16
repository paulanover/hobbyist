const express = require('express');
const {
  createTimeEntry,
  getTimeEntries,
  updateTimeEntry,
  deleteTimeEntry,
  getTimeEntrySummary,
  getMatterTimeEntries,
  getMyTimeEntriesByMonth,
} = require('../controllers/timeEntryController.js');
const { protect } = require('../middleware/authMiddleware.js');

const router = express.Router();

// Get all time entries for a specific matter
router.get('/matter/:matterId', protect, getMatterTimeEntries);
// Get all time entries for the current lawyer for a selected month
router.get('/my', protect, getMyTimeEntriesByMonth);

// CRUD routes
router.post('/', protect, createTimeEntry);
router.get('/', protect, getTimeEntries);
router.put('/:id', protect, updateTimeEntry);
router.delete('/:id', protect, deleteTimeEntry);
// Summary route
router.get('/summary', protect, getTimeEntrySummary);

module.exports = router;
