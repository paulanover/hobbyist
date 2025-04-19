// server/middleware/rbacMiddleware.js
const asyncHandler = require('./asyncHandler.js');
const Lawyer = require('../models/Lawyer.js');
const Client = require('../models/Client.js');
const Matter = require('../models/Matter.js');

// Middleware: Only Partners/Junior Partners who own the client
const partnerOrOwner = asyncHandler(async (req, res, next) => {
  if (!req.user) {
    res.status(403);
    throw new Error('Not authorized: no user');
  }
  const role = req.user.role || 'lawyer';
  if (role === 'admin') {
    return next();
  }
  if (role !== 'lawyer' || !req.user.lawyerProfile) {
    res.status(403);
    throw new Error('Not authorized: not a lawyer');
  }

  const lawyer = await Lawyer.findById(req.user.lawyerProfile);
  if (!lawyer || (lawyer.rank !== 'Partner' && lawyer.rank !== 'Junior Partner')) {
    res.status(403);
    throw new Error('Not authorized: not a Partner/Junior Partner');
  }

  // For matter creation, check if lawyer owns the client
  if (req.body.client) {
    const client = await Client.findById(req.body.client);
    if (!client.lawyerOwners.map(id => String(id)).includes(String(req.user.lawyerProfile))) {
      res.status(403);
      throw new Error('Not authorized: not an owner of this client');
    }
  }

  next();
});

// Middleware: Only Associates who are assigned to the matter
const associateOrAssigned = asyncHandler(async (req, res, next) => {
  if (!req.user) {
    res.status(403);
    throw new Error('Not authorized: no user');
  }
  const role = req.user.role || 'lawyer';
  if (role === 'admin') {
    return next();
  }
  if (role !== 'lawyer' || !req.user.lawyerProfile) {
    res.status(403);
    throw new Error('Not authorized: not a lawyer');
  }

  const lawyer = await Lawyer.findById(req.user.lawyerProfile);
  if (!lawyer || lawyer.rank !== 'Associate') {
    res.status(403);
    throw new Error('Not authorized: not an Associate');
  }

  // For matter creation, check if lawyer is assigned to the client
  if (req.body.client) {
    const client = await Client.findById(req.body.client);
    const matters = await Matter.find({ client: client._id });
    if (!matters.some(m => m.teamAssigned.map(id => String(id)).includes(String(req.user.lawyerProfile)))) {
      res.status(403);
      throw new Error('Not authorized: not assigned to this client');
    }
  }

  next();
});

// Middleware: Only Partners/Junior Partners who own the client or matter
const lawyerAssignedOrOwner = asyncHandler(async (req, res, next) => {
  if (!req.user) {
    res.status(403);
    throw new Error('Not authorized: no user');
  }
  const role = req.user.role || 'lawyer';
  if (role === 'admin') {
    // Admins can view all matters and clients
    return next();
  }
  if (role !== 'lawyer' || !req.user.lawyerProfile) {
    res.status(403);
    throw new Error('Not authorized: not a lawyer');
  }
  const lawyerId = String(req.user.lawyerProfile);

  // Load matter and client
  const matter = await Matter.findById(req.params.id);
  if (!matter) {
    res.status(404);
    throw new Error('Matter not found');
  }
  const client = await Client.findById(matter.client);
  if (!client) {
    res.status(404);
    throw new Error('Client not found');
  }

  // Check assignment or ownership
  const isAssigned = matter.teamAssigned.map(id => String(id)).includes(lawyerId);
  const isOwner = client.lawyerOwners.map(id => String(id)).includes(lawyerId);

  if (!isAssigned && !isOwner) {
    res.status(403);
    throw new Error('Not authorized: not assigned to matter or owner of client');
  }
  next();
});

// Middleware: Allow Partners/Junior Partners to edit profiles of Associates and Senior Associates
const editLawyerProfile = asyncHandler(async (req, res, next) => {
  if (!req.user) {
    res.status(403);
    throw new Error('Not authorized: no user');
  }
  // Admins can edit any lawyer
  if (req.user.role === 'admin') return next();

  // Only lawyers with a profile
  if (req.user.role !== 'lawyer' || !req.user.lawyerProfile) {
    res.status(403);
    throw new Error('Not authorized: not a lawyer');
  }

  // Check logged-in lawyer's rank
  const loggedInLawyer = await Lawyer.findById(req.user.lawyerProfile);
  if (!loggedInLawyer || !['Partner', 'Junior Partner'].includes(loggedInLawyer.rank)) {
    res.status(403);
    throw new Error('Not authorized: only Partners or Junior Partners can edit lawyer profiles');
  }

  // Check target lawyer exists and rank
  const targetLawyer = await Lawyer.findById(req.params.id);
  if (!targetLawyer) {
    res.status(404);
    throw new Error('Lawyer not found');
  }
  // Only allow editing Associates and Senior Associates
  if (!['Associate', 'Senior Associate'].includes(targetLawyer.rank)) {
    res.status(403);
    throw new Error('Not authorized: cannot edit this lawyer');
  }

  next();
});

module.exports = {
  partnerOrOwner,
  associateOrAssigned,
  lawyerAssignedOrOwner,
  editLawyerProfile
};
