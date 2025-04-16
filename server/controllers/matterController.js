const Matter = require('../models/Matter.js');
const Lawyer = require('../models/Lawyer.js');
const Client = require('../models/Client.js');
const User = require('../models/User.js');
const asyncHandler = require('../middleware/asyncHandler.js');
const YearlyStats = require('../models/YearlyStats.js'); // <-- Uncomment this line

// @desc    Create a new matter
// @route   POST /api/matters
// @access  Private (Admin)
const createMatter = asyncHandler(async (req, res) => {
  // Ensure client owners are in teamAssigned
  let { client, teamAssigned = [] } = req.body;
  const clientDoc = await Client.findById(client);
  if (!clientDoc) {
    res.status(400);
    throw new Error('Client not found');
  }
  // Merge owners into teamAssigned
  teamAssigned = Array.from(new Set([
    ...teamAssigned.map(String),
    ...clientDoc.lawyerOwners.map(String)
  ])).map(id => require('mongoose').Types.ObjectId(id));
  req.body.teamAssigned = teamAssigned;

  const {
    title,
    docketNumber, // Expecting CATEGORY.SIX_CHARS format
    category,     // Expecting single digit
    status,
    relevantData  // Expecting description/notes
  } = req.body;
  const createdBy = req.user._id; // Get user ID from protect middleware

  // --- Validation ---
  if (!title || !docketNumber || !category || !client || !status) {
    res.status(400);
    throw new Error('Missing required fields: title, docketNumber, category, client, status');
  }

  // Validate Category format
  if (!/^[0-9]$/.test(category)) {
    res.status(400);
    throw new Error('Category must be a single digit (0-9)');
  }

  // Validate Docket Number format and category match
  const docketRegex = /^[0-9]\.[a-zA-Z0-9]{6}$/;
  if (!docketRegex.test(docketNumber)) {
    res.status(400);
    throw new Error('Invalid Docket Number format. Must be CATEGORY.SIX_CHARS (e.g., 1.AB12CD)');
  }
  if (docketNumber.split('.')[0] !== category) {
    res.status(400);
    throw new Error('Docket Number prefix must match the selected Category.');
  }

  // Check Docket Number uniqueness
  const docketExists = await Matter.findOne({ docketNumber });
  if (docketExists) {
    res.status(400);
    throw new Error('Docket Number already exists');
  }

  // Validate Client exists
  const clientExists = await Client.findById(client);
  if (!clientExists) {
    res.status(400);
    throw new Error('Invalid Client ID provided');
  }

  // Validate Team Assigned lawyers exist (if provided)
  if (req.body.teamAssigned && Array.isArray(req.body.teamAssigned) && req.body.teamAssigned.length > 0) {
    const lawyersExist = await Lawyer.find({ '_id': { $in: req.body.teamAssigned } });
    if (lawyersExist.length !== req.body.teamAssigned.length) {
      res.status(400);
      throw new Error('One or more assigned lawyers are invalid');
    }
  }
  // --- End Validation ---

  let newMatter;
  try {
    // Create the matter
    newMatter = await Matter.create({
      title,
      docketNumber,
      category,
      client, // Store client ID
      status,
      teamAssigned: req.body.teamAssigned || [], // Default to empty array if not provided
      relevantData, // Store description/notes
      createdBy,
      lastUpdatedBy: createdBy, // Set initial lastUpdatedBy
      lastChangeDescription: 'Matter created', // Initial change description
      // createdAt and updatedAt are handled by timestamps: true in schema
    });
  } catch (error) {
    console.error('Error during Matter.create:', error); // Log specific creation error
    res.status(500);
    throw new Error(`Database error during matter creation: ${error.message}`);
  }

  try {
    // Populate necessary fields before sending response
    const populatedMatter = await Matter.findById(newMatter._id)
      .populate('client', 'name')
      .populate('teamAssigned', 'name initials')
      .populate('lastUpdatedBy', 'name');

    if (!populatedMatter) {
      // Should not happen if creation succeeded, but good practice to check
      console.error('Failed to find newly created matter for population, ID:', newMatter._id);
      res.status(404);
      throw new Error('Failed to retrieve created matter');
    }

    res.status(201).json(populatedMatter);
  } catch (error) {
    console.error('Error during matter population/retrieval:', error); // Log specific population error
    res.status(500);
    throw new Error(`Database error after matter creation: ${error.message}`);
  }
});

// @desc    Get all matters (excluding soft-deleted)
// @route   GET /api/matters
// @access  Private
const getMatters = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit, 10) || 0; // Get limit from query, default 0 (no limit)
  const sort = req.query.sort || '-createdAt'; // Get sort from query, default newest first

  const mattersQuery = Matter.find({ isDeleted: { $ne: true } })
    .populate({
      path: 'client',
      select: 'name lawyerOwners',
      populate: {
        path: 'lawyerOwners',
        select: 'name initials'
      }
    })
    .populate('teamAssigned', 'name initials')
    .populate('lastUpdatedBy', 'name')
    .sort(sort); // Apply sorting

  if (limit > 0) {
    mattersQuery.limit(limit); // Apply limit if specified
  }

  const matters = await mattersQuery; // Execute the query
  res.status(200).json(matters);
});

// @desc    Get matter by ID (excluding soft-deleted)
// @route   GET /api/matters/:id
// @access  Private
const getMatterById = asyncHandler(async (req, res) => {
  const matter = await Matter.findById(req.params.id)
    .populate({ // Use object for nested population
      path: 'client',
      select: 'name lawyerOwners', // Select client name and owner IDs
      populate: { // Nested populate for lawyer owners
        path: 'lawyerOwners',
        select: 'name initials' // Select owner name and initials
      }
    })
    .populate('teamAssigned', 'name initials')
    .populate('lastUpdatedBy', 'name'); // Populate user name

  if (matter && !matter.isDeleted) {
    res.status(200).json(matter);
  } else {
    res.status(404);
    throw new Error('Matter not found');
  }
});

// @desc    Update matter (prevent updating soft-deleted)
// @route   PUT /api/matters/:id
// @access  Private
const updateMatter = asyncHandler(async (req, res) => {
  // Ensure client owners are in teamAssigned
  const matter = await Matter.findById(req.params.id);
  if (!matter) {
    res.status(404);
    throw new Error('Matter not found');
  }
  const clientDoc = await Client.findById(matter.client);
  if (!clientDoc) {
    res.status(400);
    throw new Error('Client not found');
  }
  let teamAssigned = req.body.teamAssigned || matter.teamAssigned || [];
  // Merge owners into teamAssigned
  teamAssigned = Array.from(new Set([
    ...teamAssigned.map(String),
    ...clientDoc.lawyerOwners.map(String)
  ])).map(id => require('mongoose').Types.ObjectId(id));
  req.body.teamAssigned = teamAssigned;

  const newCategory = req.body.category ?? matter.category;
  const newDocketNumber = req.body.docketNumber || matter.docketNumber; // The full CATEGORY.SIX_CHARS string

  // Validate new category format if provided
  if (req.body.category && !/^[0-9]$/.test(newCategory)) {
    res.status(400);
    throw new Error('Category must be a single digit (0-9)');
  }

  // Handle docketNumber update
  if (newDocketNumber && newDocketNumber !== matter.docketNumber) {
    // Validate combined format
    const docketRegex = /^[0-9]\.[a-zA-Z0-9]{6}$/;
    if (!docketRegex.test(newDocketNumber)) {
      res.status(400);
      throw new Error('Invalid Docket Number format. Must be CATEGORY.SIX_CHARS (e.g., 1.AB12CD)');
    }
    // Validate category match
    if (newDocketNumber.split('.')[0] !== newCategory) {
      res.status(400);
      throw new Error('Docket Number prefix must match the selected Category.');
    }
    // Check uniqueness
    const docketExists = await Matter.findOne({ docketNumber: newDocketNumber, _id: { $ne: matter._id } });
    if (docketExists) {
      res.status(400);
      throw new Error('Docket Number already exists');
    }
    matter.docketNumber = newDocketNumber; // Update if valid and different
  } else if (req.body.category && newCategory !== matter.category) {
    if (matter.docketNumber.split('.')[0] !== newCategory) {
      res.status(400);
      throw new Error('Category change requires updating the Docket Number prefix accordingly.');
    }
  }

  // Apply other potential updates
  matter.title = req.body.title ?? matter.title;
    matter.category = newCategory; // Update category
    matter.status = req.body.status ?? matter.status;
    matter.relevantData = req.body.relevantData ?? matter.relevantData;

    // Handle client update
    if (req.body.client && (!matter.client || req.body.client !== matter.client.toString())) {
      const clientExists = await Client.findById(req.body.client);
      if (!clientExists) {
        res.status(400);
        throw new Error('Invalid Client ID provided for update');
      }
      matter.client = req.body.client; // Updated to use client instead of clientId
    }

    // Handle teamAssigned update
    let teamChanged = false;
    if (req.body.teamAssigned) {
      const currentTeamIds = Array.isArray(matter.teamAssigned) ? matter.teamAssigned.map(id => id.toString()) : [];
      if (JSON.stringify(currentTeamIds) !== JSON.stringify(req.body.teamAssigned)) {
        if (req.body.teamAssigned.length > 0) {
          const lawyersExist = await Lawyer.find({ '_id': { $in: req.body.teamAssigned } });
          if (lawyersExist.length !== req.body.teamAssigned.length) {
            res.status(400);
            throw new Error('One or more assigned lawyers are invalid');
          }
        }
        matter.teamAssigned = req.body.teamAssigned;
        teamChanged = true; // Mark team as changed
      }
    }

    const changedFields = [];
  if (matter) {
    if (matter.isModified('title')) changedFields.push('title');
    if (matter.isModified('docketNumber')) changedFields.push('docket number'); // Track docket change
    if (matter.isModified('category')) changedFields.push('category');
    if (matter.isModified('client')) changedFields.push('client'); // Track client change
    if (matter.isModified('status')) changedFields.push('status');
    if (matter.isModified('relevantData')) changedFields.push('description'); // Use a user-friendly name
    if (teamChanged || matter.isModified('teamAssigned')) changedFields.push('team'); // Check explicit flag or mongoose detection

    let changeDescription = 'No changes detected';
    if (changedFields.length > 0) {
      changeDescription = `Updated ${changedFields.join(', ')}`;
    }

    matter.lastUpdatedBy = req.user._id;
    matter.lastChangeDescription = changeDescription;

    const updatedMatter = await matter.save();

    const populatedMatter = await Matter.findById(updatedMatter._id)
      .populate('client', 'name') // Populate client name
      .populate('teamAssigned', 'name initials')
      .populate('lastUpdatedBy', 'name');

    res.status(200).json(populatedMatter);
  } else {
    res.status(404);
    throw new Error('Matter not found or has been deleted');
  }
});

// @desc    Soft delete matter
// @route   DELETE /api/matters/:id
// @access  Private
const deleteMatter = asyncHandler(async (req, res) => {
  const matter = await Matter.findOne({ _id: req.params.id, isDeleted: { $ne: true } });

  if (matter) {
    matter.isDeleted = true;
    matter.deletedAt = new Date();
    matter.deletedBy = req.user._id; // Set the user who deleted it
    await matter.save();
    res.status(200).json({ message: 'Matter marked as deleted' });
  } else {
    res.status(404);
    throw new Error('Matter not found or already deleted');
  }
});

// @desc    Search matters (excluding soft-deleted)
// @route   GET /api/matters/search
// @access  Private
const searchMatters = asyncHandler(async (req, res) => {
  const { title, clientName } = req.query;
  const query = { isDeleted: { $ne: true } };

  if (title) {
    query.title = { $regex: title, $options: 'i' };
  }

  if (clientName) {
    const clients = await Client.find({ name: { $regex: clientName, $options: 'i' } }).select('_id');
    const clientIds = clients.map(c => c._id);

    if (clientIds.length > 0) {
      query.client = { $in: clientIds };
    } else {
      return res.status(200).json([]);
    }
  }

  if (!title && !clientName) {
    return res.status(200).json([]);
  }

  const matters = await Matter.find(query)
    .populate({
      path: 'client',
      select: 'name lawyerOwners',
      populate: {
        path: 'lawyerOwners',
        select: 'name initials'
      }
    })
    .populate('teamAssigned', 'name initials')
    .populate('lastUpdatedBy', 'name')
    .sort('-createdAt');

  res.status(200).json(matters);
});

// @desc    Get recently deleted matters (within 5 years)
// @route   GET /api/matters/deleted
// @access  Private
const getDeletedMatters = asyncHandler(async (req, res) => {
  const fiveYearsAgo = new Date();
  fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);

  const deletedMatters = await Matter.find({
    isDeleted: true,
    deletedAt: { $gte: fiveYearsAgo }
  })
  .populate('deletedBy', 'name') // Populate the name of the user who deleted it
  .select('title docketNumber deletedAt deletedBy') // Select the populated deletedBy field
  .sort('-deletedAt');

  res.status(200).json(deletedMatters);
});

// @desc    Get statistics of active matters grouped by category
// @route   GET /api/matters/stats/category
// @access  Private
const getMatterStatsByCategory = asyncHandler(async (req, res) => {
  const stats = await Matter.aggregate([
    { $match: { status: 'Active', isDeleted: { $ne: true } } },
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } },
    {
      $project: {
        _id: 0,
        category: '$_id',
        count: 1
      }
    }
  ]);

  const formattedStats = stats.map(stat => ({
    category: stat.category || 'Uncategorized',
    count: stat.count
  }));

  res.status(200).json(formattedStats);
});

// @desc    Get matters by user (excluding soft-deleted)
// @route   GET /api/matters/user
// @access  Private
const getMattersByUser = asyncHandler(async (req, res) => {
  if (!req.user || !req.user.id) {
    return res.status(401).json({ error: 'Unauthorized access' });
  }
  
  const userId = req.user.id;
  
  const matters = await Matter.find({
    isDeleted: { $ne: true },
    $or: [
      { createdBy: userId },
      { assignedTo: userId },
      { sharedWith: userId }
    ]
  }).sort({ createdAt: -1 });
  
  return res.status(200).json(matters);
});

// @desc    Get dashboard statistics with optimized yearly calculations
// @route   GET /api/matters/dashboard
// @access  Private
const getDashboardStats = asyncHandler(async (req, res) => {
  const currentYear = new Date().getFullYear();

  const openMattersCount = await Matter.countDocuments({
    isDeleted: { $ne: true },
    $or: [
      { status: { $in: ['Open', 'OPEN', 'open', 'Active', 'ACTIVE', 'active', 'Pending', 'PENDING', 'pending'] } },
      { status: { $exists: false } },
      { status: null },
      { status: "" }
    ]
  });

  const closedOrInactiveStatuses = [
    'Closed', 'CLOSED', 'closed',
    'Inactive', 'INACTIVE', 'inactive'
  ];

  let yearlyStats = await YearlyStats.findOne({ year: currentYear - 1 });

  let baseTotal = 0;
  let baseClosed = 0;

  if (yearlyStats) {
    baseTotal = yearlyStats.totalMatters;
    baseClosed = yearlyStats.closedMatters;
  } else {
    const historicalMatters = await Matter.find({ createdAt: { $lt: new Date(currentYear, 0, 1) }, isDeleted: { $ne: true } }).select('status');
    baseTotal = historicalMatters.length;
    baseClosed = historicalMatters.filter(m => closedOrInactiveStatuses.includes(m.status)).length;
  }

  const startOfYear = new Date(currentYear, 0, 1);

  const newMattersThisYear = await Matter.countDocuments({
    createdAt: { $gte: startOfYear }
  });

  const closedMattersThisYear = await Matter.countDocuments({
    status: { $in: closedOrInactiveStatuses },
    updatedAt: { $gte: startOfYear },
    createdAt: { $lt: startOfYear },
    isDeleted: { $ne: true }
  });

  const totalMatters = baseTotal + newMattersThisYear;
  const closedMatters = baseClosed + closedMattersThisYear;

  YearlyStats.findOneAndUpdate(
    { year: currentYear },
    {
      totalMatters,
      closedMatters,
      lastUpdated: new Date()
    },
    { upsert: true, new: true }
  ).then(stats => console.log(`Updated cache for ${currentYear}`))
   .catch(err => console.error('Error updating yearly stats cache:', err));

  res.status(200).json({
    totalMatters,
    openMatters: openMattersCount,
    closedMatters,
    yearToDateNewMatters: newMattersThisYear,
    yearToDateClosedMatters: closedMattersThisYear,
    asOfDate: new Date()
  });
});

// @desc    Get BASIC dashboard statistics (excluding soft-deleted)
// @route   GET /api/matters/dashboard/basic
// @access  Private
const getBasicDashboardStats = asyncHandler(async (req, res) => {
  console.log("Attempting to fetch basic dashboard stats...");
  try {
    const activeStatusValues = ['Active', 'active', 'ACTIVE'];

    const totalMatters = await Matter.countDocuments({});
    const activeMatters = await Matter.countDocuments({ status: { $in: activeStatusValues } });
    console.log(`>>> Calculated activeMatters count: ${activeMatters}`);

    const totalClients = await Client.countDocuments({});
    const activeLawyers = await Lawyer.countDocuments({ status: { $in: activeStatusValues } });
    console.log(`>>> Calculated activeLawyers count: ${activeLawyers}`);

    const stats = {
      totalMatters,
      activeMatters,
      totalClients,
      activeLawyers,
      asOfDate: new Date()
    };
    console.log("Basic Dashboard Stats Calculated (before sending):", stats);
    res.status(200).json(stats);

  } catch (error) {
    console.error("Error in getBasicDashboardStats:", error);
    res.status(500);
    throw new Error('Server error fetching basic dashboard stats');
  }
});

module.exports = {
  createMatter,
  getMatters,
  getMatterById,
  updateMatter,
  deleteMatter,
  getDeletedMatters,
  searchMatters,
  getMatterStatsByCategory,
  getMattersByUser,
  getDashboardStats, // <-- Uncomment this export
  getBasicDashboardStats,
};
