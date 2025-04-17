// server/middleware/rbacMiddleware.js
const asyncHandler = require('./asyncHandler.js');
const Lawyer = require('../models/Lawyer.js');
const Client = require('../models/Client.js');
const Matter = require('../models/Matter.js');

// Middleware: Only Partners/Junior Partners who own the client or matter
const lawyerAssignedOrOwner = asyncHandler(async (req, res, next) => {
  if (!req.user) {
    res.status(403);
    throw new Error('Not authorized: no user');
  }
  if (req.user.role === 'admin') {
    // Admins can view all matters and clients
    return next();
  }
  if (req.user.role !== 'lawyer' || !req.user.lawyerProfile) {
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

module.exports = { lawyerAssignedOrOwner };
