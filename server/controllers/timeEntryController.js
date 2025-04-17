const { TimeEntry } = require('../models/TimeEntry.js');
const { Matter } = require('../models/Matter.js');
const { Lawyer } = require('../models/Lawyer.js');
const asyncHandler = require('../middleware/asyncHandler.js');
const { addAuditLog } = require('../utils/auditLogger');

// @desc    Create a new time entry
// @route   POST /api/time-entries
// @access  Private (lawyer only)
const createTimeEntry = asyncHandler(async (req, res) => {
  const { matter, date, hours, description, billable } = req.body;
  const lawyer = req.user.lawyerProfile || req.user._id; // Support both user and lawyer direct

  // Validate matter
  const matterDoc = await Matter.findById(matter);
  if (!matterDoc) {
    res.status(400);
    throw new Error('Matter not found');
  }

  const timeEntry = new TimeEntry({
    lawyer,
    matter,
    date,
    hours,
    description,
    billable,
  });
  const created = await timeEntry.save();

  // Audit log: Created Time Entry
  await addAuditLog({
    userId: req.user._id,
    actionType: 'CREATE_TIME_ENTRY',
    description: `Created time entry for matter ${matterDoc.title || matterDoc._id}`,
    entityType: 'Matter',
    entityId: matterDoc._id,
    ipAddress: req.ip || '',
  });

  res.status(201).json(created);
});

// @desc    Get all time entries for a lawyer
// @route   GET /api/time-entries
// @access  Private (lawyer only)
const getTimeEntries = asyncHandler(async (req, res) => {
  const lawyer = req.user.lawyerProfile || req.user._id;
  const entries = await TimeEntry.find({ lawyer }).populate('matter', 'title docketNumber').sort('-date');
  res.status(200).json(entries);
});

// @desc    Update a time entry
// @route   PUT /api/time-entries/:id
// @access  Private (lawyer only, must own entry)
const updateTimeEntry = asyncHandler(async (req, res) => {
  const entry = await TimeEntry.findById(req.params.id);
  if (!entry) {
    res.status(404);
    throw new Error('Time entry not found');
  }
  const lawyer = req.user.lawyerProfile || req.user._id;
  if (entry.lawyer.toString() !== lawyer.toString()) {
    res.status(403);
    throw new Error('Not authorized to update this entry');
  }
  const { date, hours, description, billable } = req.body;
  if (date) entry.date = date;
  if (hours) entry.hours = hours;
  if (description) entry.description = description;
  if (typeof billable === 'boolean') entry.billable = billable;
  const updated = await entry.save();

  // Audit log: Updated Time Entry
  await addAuditLog({
    userId: req.user._id,
    actionType: 'UPDATE_TIME_ENTRY',
    description: `Updated time entry ${entry._id}`,
    entityType: 'Matter',
    entityId: entry.matter,
    ipAddress: req.ip || '',
  });

  res.status(200).json(updated);
});

// @desc    Delete a time entry
// @route   DELETE /api/time-entries/:id
// @access  Private (lawyer only, must own entry)
const deleteTimeEntry = asyncHandler(async (req, res) => {
  const entry = await TimeEntry.findById(req.params.id);
  if (!entry) {
    res.status(404);
    throw new Error('Time entry not found');
  }
  const lawyer = req.user.lawyerProfile || req.user._id;
  if (entry.lawyer.toString() !== lawyer.toString()) {
    res.status(403);
    throw new Error('Not authorized to delete this entry');
  }
  await TimeEntry.deleteOne({ _id: entry._id });

  // Audit log: Deleted Time Entry
  await addAuditLog({
    userId: req.user._id,
    actionType: 'DELETE_TIME_ENTRY',
    description: `Deleted time entry ${entry._id}`,
    entityType: 'Matter',
    entityId: entry.matter,
    ipAddress: req.ip || '',
  });

  res.status(200).json({ message: 'Time entry deleted' });
});

// @desc    Get summary of hours per matter for the lawyer
// @route   GET /api/time-entries/summary
// @access  Private (lawyer only)
const getTimeEntrySummary = asyncHandler(async (req, res) => {
  const lawyer = req.user.lawyerProfile || req.user._id;
  const summary = await TimeEntry.aggregate([
    { $match: { lawyer: typeof lawyer === 'string' ? mongoose.Types.ObjectId(lawyer) : lawyer } },
    { $group: {
      _id: '$matter',
      totalHours: { $sum: '$hours' },
      count: { $sum: 1 },
    }},
    { $lookup: {
      from: 'matters',
      localField: '_id',
      foreignField: '_id',
      as: 'matterInfo',
    }},
    { $unwind: '$matterInfo' },
    { $project: {
      matter: '$matterInfo.title',
      docketNumber: '$matterInfo.docketNumber',
      totalHours: 1,
      count: 1,
    }},
    { $sort: { totalHours: -1 } }
  ]);
  res.status(200).json(summary);
});

// Get all time entries for a specific matter, with lawyer initials
const getMatterTimeEntries = asyncHandler(async (req, res) => {
  const { matterId } = req.params;
  const entries = await TimeEntry.find({ matter: matterId })
    .populate({
      path: 'lawyer',
      select: 'firstName lastName',
      model: 'Lawyer',
    })
    .sort({ date: -1 });
  const result = entries.map(entry => ({
    _id: entry._id,
    date: entry.date,
    lawyerInitials: entry.lawyer
      ? (
          (typeof entry.lawyer.firstName === 'string' && entry.lawyer.firstName.length > 0 &&
           typeof entry.lawyer.lastName === 'string' && entry.lawyer.lastName.length > 0)
            ? `${entry.lawyer.firstName[0]}${entry.lawyer.lastName[0]}`.toUpperCase()
            : (entry.lawyer.initials || '')
        )
      : '',
    description: entry.description,
    hours: entry.hours,
  }));
  res.status(200).json(result);
});

// Get all time entries for the current lawyer for a specific month
const getMyTimeEntriesByMonth = asyncHandler(async (req, res) => {
  const lawyer = req.user.lawyerProfile || req.user._id;
  const { month } = req.query; // format YYYY-MM
  let start, end;
  if (month && /^\d{4}-\d{2}$/.test(month)) {
    start = new Date(`${month}-01T00:00:00.000Z`);
    end = new Date(start);
    end.setMonth(start.getMonth() + 1);
  } else {
    // Default: current month
    start = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    end = new Date(start);
    end.setMonth(start.getMonth() + 1);
  }
  const entries = await TimeEntry.find({
    lawyer,
    date: { $gte: start, $lt: end },
  }).populate('matter', 'title docketNumber').sort({ date: -1 });
  res.status(200).json(entries);
});

module.exports = {
  createTimeEntry,
  getTimeEntries,
  updateTimeEntry,
  deleteTimeEntry,
  getTimeEntrySummary,
  getMatterTimeEntries,
  getMyTimeEntriesByMonth,
};
