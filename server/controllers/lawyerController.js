const { Lawyer } = require('../models/Lawyer.js');
const User = require('../models/User.js'); // Import User model
const Matter = require('../models/Matter.js'); // Import Matter model
const asyncHandler = require('../middleware/asyncHandler.js');

// @desc    Create a new lawyer profile
// @route   POST /api/lawyers
// @access  Private/Admin
const createLawyer = asyncHandler(async (req, res) => {
  const { name, address, initials, email, rank, status } = req.body; // Add status

  // Basic validation
  if (!name || !initials || !email || !rank) { // Status has a default, so not strictly required in input
    res.status(400);
    throw new Error('Please provide name, initials, email, and rank for the lawyer');
  }

  // Check if lawyer already exists by email (optional but good practice)
  const lawyerExists = await Lawyer.findOne({ email });
  if (lawyerExists) {
    res.status(400);
    throw new Error('Lawyer already exists with this email');
  }

  const lawyer = new Lawyer({
    name,
    address,
    initials,
    email,
    rank,
    status: status || 'Active', // Use provided status or default to Active
  });

  const createdLawyer = await lawyer.save();
  res.status(201).json(createdLawyer);
});

// @desc    Get all lawyer profiles
// @route   GET /api/lawyers
// @access  Private (e.g., Logged-in users - protection to be added later)
const getLawyers = asyncHandler(async (req, res) => {
  const lawyers = await Lawyer.find({})
    .populate('lastUpdatedBy', 'name'); // Populate user name
  res.status(200).json(lawyers);
});

// @desc    Get lawyer profile by ID
// @route   GET /api/lawyers/:id
// @access  Private (e.g., Logged-in users)
const getLawyerById = asyncHandler(async (req, res) => {
  const lawyer = await Lawyer.findById(req.params.id)
    .populate('lastUpdatedBy', 'name'); // Populate user name

  if (lawyer) {
    res.status(200).json(lawyer);
  } else {
    res.status(404);
    throw new Error('Lawyer not found');
  }
});

// @desc    Update lawyer profile
// @route   PUT /api/lawyers/:id
// @access  Private/Admin
const updateLawyer = asyncHandler(async (req, res) => {
  const lawyer = await Lawyer.findById(req.params.id);

  if (lawyer) {
    lawyer.name = req.body.name ?? lawyer.name;
    lawyer.address = req.body.address ?? lawyer.address;
    lawyer.initials = req.body.initials ?? lawyer.initials;
    lawyer.email = req.body.email ?? lawyer.email;
    lawyer.rank = req.body.rank ?? lawyer.rank;
    lawyer.status = req.body.status ?? lawyer.status; // Update status

    // Prevent changing unique email to one that already exists
    if (req.body.email && req.body.email !== lawyer.email) {
        const emailExists = await Lawyer.findOne({ email: req.body.email });
        if (emailExists) {
            res.status(400);
            throw new Error('Email already associated with another lawyer');
        }
    }

    // Check which fields were actually modified before saving
    const changedFields = [];
    if (lawyer.isModified('name')) changedFields.push('name');
    if (lawyer.isModified('address')) changedFields.push('address');
    if (lawyer.isModified('initials')) changedFields.push('initials');
    if (lawyer.isModified('email')) changedFields.push('email');
    if (lawyer.isModified('rank')) changedFields.push('rank');
    if (lawyer.isModified('status')) changedFields.push('status');

    // Generate description string
    let changeDescription = 'No changes detected';
    if (changedFields.length > 0) {
        changeDescription = `Updated ${changedFields.join(', ')}`;
    }

    // Set audit fields
    lawyer.lastUpdatedBy = req.user._id; // Assuming req.user is attached by 'protect' middleware
    lawyer.lastChangeDescription = changeDescription;
    // 'updatedAt' is handled by pre-save hook

    const updatedLawyer = await lawyer.save();

    // Populate the user name before sending the response
    const populatedLawyer = await Lawyer.findById(updatedLawyer._id)
        .populate('lastUpdatedBy', 'name');

    res.status(200).json(populatedLawyer);
  } else {
    res.status(404);
    throw new Error('Lawyer not found');
  }
});

// @desc    Delete lawyer profile
// @route   DELETE /api/lawyers/:id
// @access  Private/Admin
const deleteLawyer = asyncHandler(async (req, res) => {
  const lawyer = await Lawyer.findById(req.params.id);

  if (lawyer) {
    // Optional: Add logic here - e.g., prevent deletion if assigned to active matters?
    lawyer.isDeleted = true;
    lawyer.deletedAt = new Date();
    lawyer.deletedBy = req.user._id;
    await lawyer.save();
    res.status(200).json({ message: 'Lawyer marked as deleted', deletedBy: req.user._id, deletedAt: lawyer.deletedAt });
  } else {
    res.status(404);
    throw new Error('Lawyer not found');
  }
});

// @desc    Get lawyer by ID with assigned matters
// @route   GET /api/lawyers/:id/details
// @access  Private
const getLawyerWithMatters = asyncHandler(async (req, res) => {
  const lawyer = await Lawyer.findById(req.params.id).select('-password'); // Exclude password if it exists

  if (!lawyer) {
    res.status(404);
    throw new Error('Lawyer not found');
  }

  // Find matters where this lawyer is in the teamAssigned array
  const assignedMatters = await Matter.find({ teamAssigned: lawyer._id })
    .populate('client', 'name') // Populate client name for context
    .select('title docketNumber client status dateCreated') // Select relevant matter fields
    .sort('-createdAt'); // Sort matters, e.g., by creation date

  res.status(200).json({
    lawyerDetails: lawyer,
    assignedMatters: assignedMatters,
  });
});

module.exports = {
  createLawyer,
  getLawyers,
  getLawyerById,
  updateLawyer,
  deleteLawyer,
  getLawyerWithMatters, // Export the new function
};
