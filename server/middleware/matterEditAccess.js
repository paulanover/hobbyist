const asyncHandler = require('./asyncHandler.js');
const Matter = require('../models/Matter.js');
const Client = require('../models/Client.js');

// Middleware: Allow edit if Admin, Accounting, or Lawyer assigned/owner
const matterEditAccess = asyncHandler(async (req, res, next) => {
  if (!req.user) {
    res.status(403);
    throw new Error('Not authorized: no user');
  }
  const role = req.user.role || 'lawyer';
  if (role === 'admin' || role === 'accounting') {
    return next();
  }
  if (role !== 'lawyer' || !req.user.lawyerProfile) {
    res.status(403);
    throw new Error('Not authorized: not a lawyer');
  }
  const lawyerId = String(req.user.lawyerProfile);
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
  const isAssigned = matter.teamAssigned.map(id => String(id)).includes(lawyerId);
  const isOwner = client.lawyerOwners.map(id => String(id)).includes(lawyerId);
  if (!isAssigned && !isOwner) {
    res.status(403);
    throw new Error('Not authorized: not assigned to matter or owner of client');
  }
  next();
});

module.exports = matterEditAccess;
