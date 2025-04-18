const mongoose = require('mongoose');
const { Client } = require('../models/Client.js'); // Destructured import for Client model
const User = require('../models/User.js'); // Import User model
const Lawyer = require('../models/Lawyer.js'); // Direct import
const { Matter } = require('../models/Matter.js'); // Destructured import for Matter model
const asyncHandler = require('../middleware/asyncHandler.js');

// @desc    Create a new client
// @route   POST /api/clients
// @access  Private
const createClient = asyncHandler(async (req, res) => {
  // RBAC: Only admin, accountant, or lawyers with rank Partner or Junior Partner
  if (
    req.user.role === 'admin' ||
    req.user.role === 'accountant' ||
    (req.user.role === 'lawyer' && req.user.lawyerProfile)
  ) {
    // If lawyer, check rank
    if (req.user.role === 'lawyer') {
      // Fetch the lawyer profile
      const lawyer = await Lawyer.findById(req.user.lawyerProfile);
      if (!lawyer || (lawyer.rank !== 'Partner' && lawyer.rank !== 'Junior Partner')) {
        res.status(403);
        throw new Error('Only Partners or Junior Partners can create clients');
      }
    }
    // Admin/accountant allowed, or passed lawyer check
  } else {
    res.status(403);
    throw new Error('Not authorized to create clients');
  }
  const {
    name, isBusinessEntity, presidentName, authorizedRepresentative,
    email, phone, address, vatStatus, lawyerOwners // Add lawyerOwners
  } = req.body;

  // Basic validation
  if (!name || !vatStatus) {
    res.status(400);
    throw new Error('Client Name and VAT Status are required');
  }
  if (isBusinessEntity && (!presidentName || !authorizedRepresentative)) {
    res.status(400);
    throw new Error('President Name and Authorized Representative are required for business entities');
  }

  // Validate lawyerOwners if provided
  if (lawyerOwners && lawyerOwners.length > 0) {
    const lawyersExist = await Lawyer.find({ '_id': { $in: lawyerOwners } });
    if (lawyersExist.length !== lawyerOwners.length) {
      res.status(400);
      throw new Error('One or more assigned lawyer owners are invalid');
    }
  }

  // Convert lawyerOwners to ObjectId array if provided
  let lawyerOwnersObjectIds = [];
  if (lawyerOwners && lawyerOwners.length > 0) {
    lawyerOwnersObjectIds = lawyerOwners.map(id => new mongoose.Types.ObjectId(id));
  }

  const client = new Client({
    name,
    isBusinessEntity: isBusinessEntity || false, // Ensure boolean
    presidentName: isBusinessEntity ? presidentName : undefined,
    authorizedRepresentative: isBusinessEntity ? authorizedRepresentative : undefined,
    email,
    phone,
    address,
    vatStatus,
    lawyerOwners: lawyerOwnersObjectIds, // Assign as ObjectId array
  });

  const createdClient = await client.save();
  // Populate owners before sending response
  const populatedClient = await Client.findById(createdClient._id)
    .populate('lawyerOwners', 'name initials'); // Populate owner details

  res.status(201).json(populatedClient);
});

// @desc    Get all clients
// @route   GET /api/clients
// @access  Private
const getClients = asyncHandler(async (req, res) => {
  const clients = await Client.find({})
    .populate('lastUpdatedBy', 'name') // Populate audit user name
    .populate('lawyerOwners', 'name initials'); // Populate owner details
  res.status(200).json(clients);
});

// @desc    Get client by ID
// @route   GET /api/clients/:id
// @access  Private
const getClientById = asyncHandler(async (req, res) => {
  const client = await Client.findById(req.params.id)
    .populate('lastUpdatedBy', 'name') // Populate audit user name
    .populate('lawyerOwners', 'name initials'); // Populate owner details

  if (client) {
    res.status(200).json(client);
  } else {
    res.status(404);
    throw new Error('Client not found');
  }
});

// @desc    Update client
// @route   PUT /api/clients/:id
// @access  Private
const updateClient = asyncHandler(async (req, res) => {
  const client = await Client.findById(req.params.id);

  if (client) {
    // Apply potential updates
    client.name = req.body.name ?? client.name;
    client.isBusinessEntity = req.body.isBusinessEntity ?? client.isBusinessEntity;
    client.email = req.body.email ?? client.email;
    client.phone = req.body.phone ?? client.phone;
    client.address = req.body.address ?? client.address;
    client.vatStatus = req.body.vatStatus ?? client.vatStatus;

    // Handle conditional fields based on isBusinessEntity
    const isBusiness = req.body.isBusinessEntity ?? client.isBusinessEntity;
    client.presidentName = isBusiness ? (req.body.presidentName ?? client.presidentName) : undefined;
    client.authorizedRepresentative = isBusiness ? (req.body.authorizedRepresentative ?? client.authorizedRepresentative) : undefined;

    // Handle lawyerOwners update
    let ownersChanged = false;
    if (req.body.lawyerOwners) {
      // Basic check if arrays are different
      if (JSON.stringify(client.lawyerOwners.map(id => id.toString())) !== JSON.stringify(req.body.lawyerOwners)) {
        // Validate new owners
        if (req.body.lawyerOwners.length > 0) {
          const lawyersExist = await Lawyer.find({ '_id': { $in: req.body.lawyerOwners } });
          if (lawyersExist.length !== req.body.lawyerOwners.length) {
            res.status(400);
            throw new Error('One or more assigned lawyer owners are invalid');
          }
        }
        client.lawyerOwners = req.body.lawyerOwners;
        ownersChanged = true; // Mark owners as changed
      }
    }

    // Check which fields were actually modified
    const changedFields = [];
    if (client.isModified('name')) changedFields.push('name');
    if (client.isModified('isBusinessEntity')) changedFields.push('type');
    if (client.isModified('presidentName')) changedFields.push('president');
    if (client.isModified('authorizedRepresentative')) changedFields.push('representative');
    if (client.isModified('email')) changedFields.push('email');
    if (client.isModified('phone')) changedFields.push('phone');
    if (client.isModified('address')) changedFields.push('address');
    if (client.isModified('vatStatus')) changedFields.push('VAT status');
    if (ownersChanged || client.isModified('lawyerOwners')) changedFields.push('owners'); // Check explicit flag or mongoose detection

    // Generate description string
    let changeDescription = 'No changes detected';
    if (changedFields.length > 0) {
        changeDescription = `Updated ${changedFields.join(', ')}`;
    }

    // Set audit fields
    client.lastUpdatedBy = req.user._id; // Assuming req.user is attached by 'protect' middleware
    client.lastChangeDescription = changeDescription;

    const updatedClient = await client.save();

    // Populate user name and owners before sending response
    const populatedClient = await Client.findById(updatedClient._id)
        .populate('lastUpdatedBy', 'name')
        .populate('lawyerOwners', 'name initials'); // Populate owner details

    res.status(200).json(populatedClient);
  } else {
    res.status(404);
    throw new Error('Client not found');
  }
});

// @desc    Delete client
// @route   DELETE /api/clients/:id
// @access  Private/Admin
const deleteClient = asyncHandler(async (req, res) => {
  const client = await Client.findById(req.params.id);

  if (client) {
    await Client.deleteOne({ _id: client._id });
    res.status(200).json({ message: 'Client removed' });
  } else {
    res.status(404);
    throw new Error('Client not found');
  }
});

// @desc    Get client by ID with associated matters
// @route   GET /api/clients/:id/details
// @access  Private
const getClientWithMatters = asyncHandler(async (req, res) => {
  const client = await Client.findById(req.params.id)
    .populate('lawyerOwners', 'name initials') // Populate owner details
    .populate('lastUpdatedBy', 'name'); // Populate audit user name

  if (!client) {
    res.status(404);
    throw new Error('Client not found');
  }

  // Find matters associated with this client
  const associatedMatters = await Matter.find({ client: client._id })
    .populate('teamAssigned', 'name initials') // Populate team details for context
    .select('title docketNumber status dateCreated teamAssigned') // Select relevant matter fields
    .sort('-createdAt'); // Sort matters, e.g., by creation date

  res.status(200).json({
    clientDetails: client,
    associatedMatters: associatedMatters,
  });
});

// @desc    Get clients for matters where the lawyer is on the team
// @route   GET /api/clients/for-lawyer-matters?search=...
// @access  Private
const getClientsForLawyerMatters = asyncHandler(async (req, res) => {
  const lawyerId = req.user.lawyerProfile || req.user._id;
  const search = req.query.search || '';
  // Find all matters where the lawyer is on the team
  const matters = await Matter.find({ teamAssigned: lawyerId }).select('client');
  const clientIds = matters.map(m => m.client.toString());
  const uniqueClientIds = [...new Set(clientIds)];
  if (uniqueClientIds.length === 0) return res.json([]);
  const clientQuery = { _id: { $in: uniqueClientIds } };
  if (search) {
    clientQuery.name = { $regex: search, $options: 'i' };
  }
  const clients = await Client.find(clientQuery)
    .populate('lawyerOwners', 'name initials'); // Populate owner details
  res.json(clients);
});

// @desc    Get clients where the lawyer is an owner or on a matter team
// @route   GET /api/clients/for-lawyer-relevant?search=...
// @access  Private
const getClientsForLawyerRelevant = asyncHandler(async (req, res) => {
  const lawyerId = req.user.lawyerProfile || req.user._id;
  const search = req.query.search || '';
  console.log('[RelevantClients] lawyerId:', lawyerId);

  // 1. Clients where lawyer is an owner
  const ownedClients = await Client.find({ lawyerOwners: lawyerId }).select('_id');
  const ownedClientIds = ownedClients.map(c => c._id.toString());
  console.log('[RelevantClients] ownedClientIds:', ownedClientIds);

  // 2. Clients where lawyer is on a matter's teamAssigned
  const matters = await Matter.find({ teamAssigned: lawyerId }).select('client');
  const matterClientIds = matters.map(m => m.client.toString());
  console.log('[RelevantClients] matterClientIds:', matterClientIds);

  // Union of client IDs
  const allClientIds = Array.from(new Set([...ownedClientIds, ...matterClientIds]));
  console.log('[RelevantClients] allClientIds:', allClientIds);

  if (allClientIds.length === 0) {
    console.log('[RelevantClients] No relevant clients found.');
    return res.json([]);
  }
  const clientQuery = { _id: { $in: allClientIds } };
  if (search) {
    clientQuery.name = { $regex: search, $options: 'i' };
  }
  const clients = await Client.find(clientQuery)
    .populate('lawyerOwners', 'name initials'); // Populate owner details
  console.log('[RelevantClients] clients:', clients.map(c => c.name));
  res.json(clients);
});

// TEMPORARY: Debug endpoint to inspect lawyerOwners field
const debugLawyerOwners = asyncHandler(async (req, res) => {
  const clients = await Client.find({}).select('name lawyerOwners');
  res.json(clients);
});

// @desc    Get matters for a specific client where the logged-in lawyer is on the team
// @route   GET /api/clients/:id/matters/for-lawyer
// @access  Private (lawyer must be on team)
const getClientMattersForLawyer = asyncHandler(async (req, res) => {
  const clientId = req.params.id;
  const lawyerId = req.user.lawyerProfile || req.user._id;
  // Find matters for this client where this lawyer is on the team
  const matters = await Matter.find({ client: clientId, teamAssigned: lawyerId })
    .populate('teamAssigned', 'name initials')
    .select('title docketNumber status dateCreated teamAssigned')
    .sort('-createdAt');
  res.status(200).json(matters);
});

module.exports = {
  createClient,
  getClients,
  getClientById,
  updateClient,
  deleteClient,
  getClientWithMatters, // Export the new function
  getClientsForLawyerMatters,
  getClientsForLawyerRelevant,
  debugLawyerOwners, // Export debug endpoint
  getClientMattersForLawyer,
};
